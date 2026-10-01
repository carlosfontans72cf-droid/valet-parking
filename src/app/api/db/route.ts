import { NextRequest, NextResponse } from "next/server";
import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit as fbLimit,
  type QueryConstraint,
} from "firebase/firestore";
import { firebaseConfig } from "@/lib/firebaseConfig";

// -----------------------------------------------------------------------
// Este endpoint reemplaza lo que antes hacía Supabase (PostgREST) directo.
// Recibe rutas con el mismo formato que ya usaba toda la app:
//   GET  /api/db?path=tickets?select=id&estado=eq.activo&id_evento=in.(a,b)
//   POST /api/db  { path: "tickets", method: "POST"|"PATCH"|"DELETE", data }
// y las traduce a consultas de Firestore. Así no hubo que reescribir cada
// pantalla, solo este archivo + de dónde apuntan las llamadas.
// -----------------------------------------------------------------------

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);

// Valores por defecto que antes ponía Postgres solo (DEFAULT now(), etc.)
// Firestore no tiene eso, así que lo completamos acá al crear un documento.
const DEFAULTS: Record<string, () => Record<string, any>> = {
  perfiles: () => ({ activo: true, creado_en: new Date().toISOString() }),
  eventos: () => ({ estado: "abierto", fecha_apertura: new Date().toISOString(), vehiculos_totales: 0 }),
  sectores: () => ({ activo: true }),
  vehiculos: () => ({ tiene_danos: false }),
  tickets: () => ({
    estado: "activo",
    hora_entrada: new Date().toISOString(),
    ticket_cliente_entregado: false,
    ticket_auto_colocado: false,
    sincronizado: true,
  }),
  historial_completo: () => ({ creado_en: new Date().toISOString() }),
  cambios_ubicacion: () => ({ fecha_hora: new Date().toISOString() }),
  solicitudes_retiro: () => ({ estado: "pendiente", solicitado_en: new Date().toISOString() }),
  configuracion_app: () => ({ ultima_modificacion: new Date().toISOString() }),
};

// Campos que siempre son texto (un PIN "1234" o una patente "123456" NO deben
// convertirse en número, porque Firestore distingue "1234" de 1234).
const TEXT_FIELDS = new Set(["pin", "patente", "nombre", "color", "modelo", "ubicacion_exacta"]);

function castValue(key: string, v: string): any {
  if (TEXT_FIELDS.has(key)) return v;
  if (v === "true") return true;
  if (v === "false") return false;
  if (/^-?\d+(\.\d+)?$/.test(v)) return Number(v);
  return v;
}

function parsePath(path: string) {
  const idx = path.indexOf("?");
  const table = idx === -1 ? path : path.slice(0, idx);
  const qs = idx === -1 ? "" : path.slice(idx + 1);
  return { table, params: new URLSearchParams(qs) };
}

function buildConstraints(params: URLSearchParams): QueryConstraint[] {
  const constraints: QueryConstraint[] = [];
  let orderField: string | null = null;
  let orderDir: "asc" | "desc" = "asc";
  let lim: number | null = null;

  for (const [key, rawValue] of params.entries()) {
    if (key === "select" || key === "offset") continue;
    if (key === "order") {
      const [f, d] = rawValue.split(".");
      orderField = f;
      orderDir = d === "desc" ? "desc" : "asc";
      continue;
    }
    if (key === "limit") {
      lim = parseInt(rawValue, 10);
      continue;
    }
    const m = rawValue.match(/^(eq|gte|lte|gt|lt|in)\.(.*)$/s);
    if (!m) continue;
    const [, op, val] = m;
    if (op === "eq") constraints.push(where(key, "==", castValue(key, val)));
    else if (op === "gte") constraints.push(where(key, ">=", castValue(key, val)));
    else if (op === "lte") constraints.push(where(key, "<=", castValue(key, val)));
    else if (op === "gt") constraints.push(where(key, ">", castValue(key, val)));
    else if (op === "lt") constraints.push(where(key, "<", castValue(key, val)));
    else if (op === "in") {
      const list = val
        .replace(/^\(|\)$/g, "")
        .split(",")
        .filter(Boolean)
        .map((x) => castValue(key, x));
      constraints.push(where(key, "in", list.length ? list.slice(0, 30) : ["__ninguno__"]));
    }
  }

  // El orden va después de los where para respetar las reglas de Firestore.
  if (orderField) constraints.push(orderBy(orderField, orderDir));
  if (lim) constraints.push(fbLimit(lim));
  return constraints;
}

// "id=eq.XXX" en esta app siempre significa "buscar por el ID real del
// documento de Firestore" — pero ese ID no es un campo que viva adentro del
// documento, así que un where("id","==",...) nunca encuentra nada. Lo
// resolvemos aparte con una búsqueda directa por referencia (más rápida,
// y sin necesitar ningún índice).
async function fetchDocs(table: string, params: URLSearchParams): Promise<{ id: string; [k: string]: any }[]> {
  const idParam = params.get("id");
  const idMatch = idParam ? idParam.match(/^eq\.(.*)$/s) : null;
  if (idMatch) {
    const snap = await getDoc(doc(db, table, decodeURIComponent(idMatch[1])));
    return snap.exists() ? [{ id: snap.id, ...snap.data() }] : [];
  }
  const constraints = buildConstraints(params);
  const snap = await getDocs(query(collection(db, table), ...constraints));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function GET(req: NextRequest) {
  try {
    const path = req.nextUrl.searchParams.get("path") || "";
    const { table, params } = parsePath(path);
    const rows = await fetchDocs(table, params);
    return NextResponse.json(rows);
  } catch (e: any) {
    // Un error típico acá es que a Firestore le falte un índice compuesto
    // para esta combinación de filtros. Devolvemos SIEMPRE un array vacío
    // (nunca un objeto) para que el resto de la app, que espera listas, no
    // se rompa. El mensaje real de Firestore (con el link para crear el
    // índice en un clic) queda disponible en la cabecera X-Api-Error, visible
    // en la pestaña Red del navegador.
    return NextResponse.json([], { status: 200, headers: { "X-Api-Error": String(e?.message || e).slice(0, 800) } });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { path, method = "POST", data } = body as { path: string; method?: string; data?: any };
    const { table, params } = parsePath(path);

    if (method === "POST") {
      const defaults = DEFAULTS[table] ? DEFAULTS[table]() : {};
      const finalData = { ...defaults, ...(data || {}) };
      const ref = await addDoc(collection(db, table), finalData);
      return NextResponse.json([{ id: ref.id, ...finalData }]);
    }

    // PATCH y DELETE en PostgREST actúan sobre "todo lo que matchee el
    // filtro", así que primero buscamos esos documentos y después actuamos
    // sobre cada uno (Firestore no tiene un "UPDATE WHERE" directo).
    const matched = await fetchDocs(table, params);

    if (method === "PATCH") {
      await Promise.all(matched.map((d) => updateDoc(doc(db, table, d.id), data || {})));
      return NextResponse.json(matched.map((d) => ({ id: d.id })));
    }
    if (method === "DELETE") {
      await Promise.all(matched.map((d) => deleteDoc(doc(db, table, d.id))));
      return NextResponse.json([]);
    }
    return NextResponse.json([]);
  } catch (e: any) {
    return NextResponse.json([], { status: 200, headers: { "X-Api-Error": String(e?.message || e).slice(0, 800) } });
  }
}

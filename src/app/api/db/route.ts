import { NextRequest, NextResponse } from "next/server";
import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getFirestore,
  collection,
  doc,
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

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);

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

  if (orderField) constraints.push(orderBy(orderField, orderDir));
  if (lim) constraints.push(fbLimit(lim));
  return constraints;
}

export async function GET(req: NextRequest) {
  try {
    const path = req.nextUrl.searchParams.get("path") || "";
    const { table, params } = parsePath(path);
    const constraints = buildConstraints(params);
    const snap = await getDocs(query(collection(db, table), ...constraints));
    const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return NextResponse.json(rows);
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 200 });
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

    const constraints = buildConstraints(params);
    const snap = await getDocs(query(collection(db, table), ...constraints));

    if (method === "PATCH") {
      await Promise.all(snap.docs.map((d) => updateDoc(doc(db, table, d.id), data || {})));
      return NextResponse.json(snap.docs.map((d) => ({ id: d.id })));
    }
    if (method === "DELETE") {
      await Promise.all(snap.docs.map((d) => deleteDoc(doc(db, table, d.id))));
      return NextResponse.json([]);
    }
    return NextResponse.json([]);
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 200 });
  }
}

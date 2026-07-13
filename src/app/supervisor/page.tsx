"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAppStore } from "@/lib/store";

type Evento = { id: string; nombre: string; fecha_apertura: string; vehiculos_totales: number; estado: string };
type Solicitud = { id: string; ticket_num: number; patente: string; estado: string; solicitado_en: string };
type Valet = { id: string; numero_valet: number; nombre: string };

export default function SupervisorPage() {
  const router = useRouter();
  const supabase = createClient();
  const perfil = useAppStore((s) => s.perfil);

  const [eventos, setEventos] = useState<Evento[]>([]);
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [valets, setValets] = useState<Valet[]>([]);
  const [totalActivos, setTotalActivos] = useState(0);

  useEffect(() => {
    if (!perfil || perfil.rol === "valet") { router.push("/"); return; }
    cargarDatos();
    const canal = supabase.channel("supervisor")
      .on("postgres_changes", { event: "*", schema: "public", table: "solicitudes_retiro" }, () => cargarDatos())
      .on("postgres_changes", { event: "*", schema: "public", table: "tickets" }, () => cargarDatos())
      .subscribe();
    return () => { supabase.removeChannel(canal); };
  }, []);

  async function cargarDatos() {
    const { data: evs } = await supabase.from("eventos").select("*").eq("estado", "abierto");
    if (evs) setEventos(evs);

    const { data: sols } = await supabase
      .from("solicitudes_retiro")
      .select(`*, tickets!inner(numero_ticket, vehiculos!inner(patente))`)
      .in("estado", ["pendiente", "en_camino", "recogiendo"])
      .order("solicitado_en", { ascending: true });
    if (sols) {
      setSolicitudes(sols.map((s: any) => ({
        id: s.id, ticket_num: s.tickets?.numero_ticket || 0,
        patente: s.tickets?.vehiculos?.patente || "",
        estado: s.estado, solicitado_en: s.solicitado_en,
      })));
    }

    const { data: vals } = await supabase.from("perfiles").select("id, numero_valet, nombre").eq("rol", "valet").eq("activo", true);
    if (vals) setValets(vals);

    const { count } = await supabase.from("tickets").select("*", { count: "exact", head: true }).eq("estado", "activo");
    setTotalActivos(count || 0);
  }

  const asignarValet = async (solId: string, valetId: string) => {
    await supabase.from("solicitudes_retiro").update({
      id_valet_asignado: valetId,
      asignado_en: new Date().toISOString(),
    }).eq("id", solId);
    cargarDatos();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">👁️ Panel Supervisor</h1>
          <p className="text-gray-500">{perfil?.nombre}</p>
        </div>
        <button onClick={() => router.push("/dashboard")} className="bg-gray-200 text-gray-700 px-3 py-2 rounded-xl text-sm font-semibold">
          📊 Dashboard
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="card-valet text-center">
          <p className="text-3xl font-bold text-blue-600">{eventos.length}</p>
          <p className="text-sm text-gray-500">Eventos Activos</p>
        </div>
        <div className="card-valet text-center">
          <p className="text-3xl font-bold text-green-600">{solicitudes.length}</p>
          <p className="text-sm text-gray-500">Solicitudes Pendientes</p>
        </div>
        <div className="card-valet text-center">
          <p className="text-3xl font-bold text-amber-600">{totalActivos}</p>
          <p className="text-sm text-gray-500">Vehículos Estacionados</p>
        </div>
      </div>

      {/* Solicitudes para asignar */}
      <h2 className="text-lg font-bold text-gray-700 mb-3">📋 Solicitudes Pendientes</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
        {solicitudes.filter((s) => s.estado === "pendiente" || s.estado === "en_camino").map((sol) => (
          <div key={sol.id} className="card-valet animate-fade-in">
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="font-bold text-gray-800">🎫 #{String(sol.ticket_num).padStart(3, "0")}</p>
                <p className="text-gray-600">{sol.patente}</p>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full ${
                sol.estado === "pendiente" ? "bg-yellow-100 text-yellow-700" : "bg-blue-100 text-blue-700"
              }`}>
                {sol.estado === "pendiente" ? "Sin asignar" : "En curso"}
              </span>
            </div>
            {sol.estado === "pendiente" && (
              <select onChange={(e) => e.target.value && asignarValet(sol.id, e.target.value)}
                className="input-valet text-sm mt-2" defaultValue="">
                <option value="" disabled>Asignar a...</option>
                {valets.map((v) => (
                  <option key={v.id} value={v.id}>#{v.numero_valet} — {v.nombre}</option>
                ))}
              </select>
            )}
          </div>
        ))}
        {solicitudes.filter((s) => s.estado === "pendiente" || s.estado === "en_camino").length === 0 && (
          <p className="text-gray-400 text-center col-span-2 py-8">No hay solicitudes pendientes ✅</p>
        )}
      </div>

      {/* Eventos Activos */}
      <h2 className="text-lg font-bold text-gray-700 mb-3">🟢 Eventos en curso</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {eventos.map((ev) => (
          <div key={ev.id} className="card-valet">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-gray-800">{ev.nombre}</p>
                <p className="text-sm text-gray-500">🚗 {ev.vehiculos_totales} vehículos</p>
              </div>
              <button onClick={() => router.push(`/evento/${ev.id}`)}
                className="text-blue-600 text-sm font-semibold">Ver →</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

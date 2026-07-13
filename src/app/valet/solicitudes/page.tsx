"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAppStore } from "@/lib/store";

type Solicitud = {
  id: string; estado: string; ticket_num: number; patente: string; modelo: string;
  sector_nombre: string; sector_color: string; ubicacion: string; estado_llave: string;
  hora_entrada: string; solicitado_en: string;
};

export default function SolicitudesPage() {
  const router = useRouter();
  const supabase = createClient();
  const perfil = useAppStore((s) => s.perfil);

  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!perfil) { router.push("/valet"); return; }
    cargarSolicitudes();
    const canal = supabase
      .channel("solicitudes")
      .on("postgres_changes", { event: "*", schema: "public", table: "solicitudes_retiro", filter: `id_valet_asignado=eq.${perfil.id}` }, () => cargarSolicitudes())
      .subscribe();
    return () => { supabase.removeChannel(canal); };
  }, []);

  async function cargarSolicitudes() {
    const { data } = await supabase
      .from("solicitudes_retiro")
      .select(`*, tickets!inner(numero_ticket, ubicacion_exacta, estado_llave, hora_entrada, 
        vehiculos!inner(patente, modelo),
        sectores!inner(nombre, color_hex))`)
      .eq("id_valet_asignado", perfil?.id)
      .in("estado", ["pendiente", "en_camino", "recogiendo"])
      .order("solicitado_en", { ascending: true });

    if (data) {
      const sols: Solicitud[] = data.map((s: any) => ({
        id: s.id, estado: s.estado,
        ticket_num: s.tickets?.numero_ticket || 0,
        patente: s.tickets?.vehiculos?.patente || "",
        modelo: s.tickets?.vehiculos?.modelo || "",
        sector_nombre: s.tickets?.sectores?.nombre || "",
        sector_color: s.tickets?.sectores?.color_hex || "#666",
        ubicacion: s.tickets?.ubicacion_exacta || "",
        estado_llave: s.tickets?.estado_llave || "",
        hora_entrada: s.tickets?.hora_entrada || "",
        solicitado_en: s.solicitado_en,
      }));
      setSolicitudes(sols);
    }
  }

  const accion = async (id: string, nuevoEstado: string, campoFecha: string) => {
    setLoading((prev) => ({ ...prev, [id]: true }));
    await supabase.from("solicitudes_retiro").update({
      estado: nuevoEstado,
      [campoFecha]: new Date().toISOString(),
    }).eq("id", id);

    if (nuevoEstado === "completado") {
      // Actualizar ticket
      const sol = solicitudes.find((s) => s.id === id);
      if (sol) {
        const { data: ticket } = await supabase.from("solicitudes_retiro").select("id_ticket").eq("id", id).single();
        if (ticket) {
          const ahora = new Date().toISOString();
          const { data: tkt } = await supabase.from("tickets").select("hora_entrada").eq("id", ticket.id_ticket).single();
          const tiempoSeg = tkt ? Math.round((Date.now() - new Date(tkt.hora_entrada).getTime()) / 1000) : 0;
          await supabase.from("tickets").update({
            estado: "completado",
            hora_salida: ahora,
            id_valet_salida: perfil!.id,
            tiempo_espera_seg: tiempoSeg,
          }).eq("id", ticket.id_ticket);

          // Historial
          await supabase.from("historial_completo").insert({
            id_ticket: ticket.id_ticket,
            id_evento: (await supabase.from("tickets").select("id_evento").eq("id", ticket.id_ticket).single()).data?.id_evento,
            id_valet: perfil!.id,
            tipo: "retiro_entregado",
            detalles: { tiempo_seg: tiempoSeg },
          });
        }
      }
    }
    setLoading((prev) => ({ ...prev, [id]: false }));
    cargarSolicitudes();
  };

  const iconoLLave = (llave: string) => {
    if (llave === "colgada") return "🔑 Colgada";
    if (llave === "cajon") return "📁 Cajón";
    return "👤 Dueño";
  };

  if (!perfil) return null;

  return (
    <div className="min-h-screen bg-gray-900 p-4 pb-8">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.push("/valet")} className="text-gray-400 text-2xl">←</button>
        <h1 className="text-white text-xl font-bold">📋 Solicitudes</h1>
        <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">{solicitudes.length}</span>
      </div>

      {solicitudes.length === 0 ? (
        <div className="text-center py-20">
          <span className="text-6xl block mb-4">✅</span>
          <p className="text-gray-400">No tenés solicitudes pendientes</p>
        </div>
      ) : (
        <div className="space-y-3 max-w-lg mx-auto">
          {solicitudes.map((sol) => (
            <div key={sol.id} className="bg-gray-800 rounded-2xl p-4 animate-fade-in">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-white font-bold text-lg">🎫 #{String(sol.ticket_num).padStart(3, "0")}</p>
                  <p className="text-gray-300 font-semibold">{sol.patente} {sol.modelo && `· ${sol.modelo}`}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                  sol.estado === "pendiente" ? "bg-yellow-900 text-yellow-300" :
                  sol.estado === "en_camino" ? "bg-blue-900 text-blue-300" :
                  "bg-green-900 text-green-300"
                }`}>
                  {sol.estado === "pendiente" ? "Pendiente" : sol.estado === "en_camino" ? "En camino" : "Recogiendo"}
                </span>
              </div>

              <div className="bg-gray-900 rounded-xl p-3 space-y-1 text-sm mb-3">
                <p className="text-gray-300">
                  🅿️ <span style={{ color: sol.sector_color }}>{sol.sector_nombre}</span>
                </p>
                <p className="text-gray-400">📍 {sol.ubicacion}</p>
                <p className="text-gray-400">{iconoLLave(sol.estado_llave)}</p>
                <p className="text-gray-500 text-xs">⏳ Entrada: {new Date(sol.hora_entrada).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}</p>
              </div>

              {/* Botones según estado */}
              <div className="grid grid-cols-3 gap-2">
                {sol.estado === "pendiente" && (
                  <button onClick={() => accion(sol.id, "en_camino", "en_camino_desde")}
                    disabled={loading[sol.id]}
                    className="btn-valet-sm bg-blue-600 hover:bg-blue-700 col-span-3 py-4 text-lg disabled:opacity-50">
                    🚶 EN CAMINO
                  </button>
                )}
                {sol.estado === "en_camino" && (
                  <button onClick={() => accion(sol.id, "recogiendo", "recogido_en")}
                    disabled={loading[sol.id]}
                    className="btn-valet-sm bg-amber-600 hover:bg-amber-700 col-span-3 py-4 text-lg disabled:opacity-50">
                    🚗 RECOGÍ EL VEHÍCULO
                  </button>
                )}
                {sol.estado === "recogiendo" && (
                  <button onClick={() => accion(sol.id, "completado", "completado_en")}
                    disabled={loading[sol.id]}
                    className="btn-valet-sm bg-green-600 hover:bg-green-700 col-span-3 py-4 text-lg disabled:opacity-50">
                    ✅ VEHÍCULO ENTREGADO
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

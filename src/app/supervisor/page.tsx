"use client";
export const dynamic = 'force-dynamic';
import { useState, useEffect } from "react";
const SB = "https://hzexxoazyhhvljqiummn.supabase.co", AK = "sb_publishable_ALyCDA4qM4T68YiecEQErQ_WoYNUfen", BH = { apikey: AK, Authorization: `Bearer ${AK}` };
const q = async (u: string) => { try { const r = await fetch(u, { headers: BH }); const t = await r.text(); return t && t !== "[]" ? JSON.parse(t) : []; } catch { return []; } };
const act = async (u: string, m: string, d?: any) => fetch(u, { method: m, headers: { ...BH, "Content-Type": "application/json" }, body: d ? JSON.stringify(d) : undefined });

export default function SupervisorPage() {
  const [eventos, setEventos] = useState<any[]>([]);
  const [solicitudes, setSolicitudes] = useState<any[]>([]);
  const [valets, setValets] = useState<any[]>([]);
  const [totalActivos, setTotalActivos] = useState(0);
  const uName = typeof window !== 'undefined' ? localStorage.getItem("userName") || "Supervisor" : "";

  const cargar = async () => {
    const evs = await q(`${SB}/rest/v1/eventos?select=id,nombre,vehiculos_totales&estado=eq.abierto`);
    setEventos(evs);

    const sols = await q(`${SB}/rest/v1/solicitudes_retiro?select=id,estado,solicitado_en,id_ticket&in.estado=(pendiente,en_camino,recogiendo)&order=solicitado_en.asc`);
    if (sols.length) {
      const enr = await Promise.all(sols.map(async (s: any) => {
        const tkts = await q(`${SB}/rest/v1/tickets?select=numero_ticket,id_vehiculo&id=eq.${s.id_ticket}`);
        const num = tkts.length ? tkts[0].numero_ticket : 0;
        let pat = "";
        if (tkts.length && tkts[0].id_vehiculo) {
          const vh = await q(`${SB}/rest/v1/vehiculos?select=patente&id=eq.${tkts[0].id_vehiculo}`);
          if (vh.length) pat = vh[0].patente;
        }
        return { ...s, ticket_num: num, patente: pat };
      }));
      setSolicitudes(enr);
    }

    const vals = await q(`${SB}/rest/v1/perfiles?select=id,numero_valet,nombre&rol=eq.valet&activo=eq.true`);
    setValets(vals);

    const evIds = evs.length ? evs.map((e: any) => e.id).join(",") : "";
    if (evIds) {
      const activos = await q(`${SB}/rest/v1/tickets?select=id&estado=eq.activo&id_evento=in.(${evIds})`);
      setTotalActivos(activos.length);
    }
  };

  useEffect(() => { cargar(); const t = setInterval(cargar, 5000); return () => clearInterval(t); }, []);

  const asignarValet = async (solId: string, valetId: string) => {
    await act(`${SB}/rest/v1/solicitudes_retiro?id=eq.${solId}`, "PATCH", { id_valet_asignado: valetId, asignado_en: new Date().toISOString() });
    cargar();
  };

  const cerrarSesion = () => { localStorage.clear(); window.location.href = "/"; };

  return (
    <div className="min-h-screen bg-gray-900 p-4 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">👁️ Panel Supervisor</h1>
          <p className="text-gray-400">{uName}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => window.location.href = "/dashboard"} className="bg-gray-700 text-white px-3 py-2 rounded-xl text-sm">📊 Dashboard</button>
          <button onClick={() => window.location.href = "/dueno/configuracion"} className="bg-purple-600 text-white px-3 py-2 rounded-xl text-sm">⚙️ Config</button>
          <button onClick={cerrarSesion} className="bg-gray-800 text-white px-3 py-2 rounded-xl text-sm">Salir</button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-gray-800 rounded-2xl p-4 text-center">
          <p className="text-3xl font-bold text-blue-400">{eventos.length}</p>
          <p className="text-sm text-gray-400">Eventos Activos</p>
        </div>
        <div className="bg-gray-800 rounded-2xl p-4 text-center">
          <p className="text-3xl font-bold text-green-400">{solicitudes.filter((s:any) => s.estado === "pendiente").length}</p>
          <p className="text-sm text-gray-400">Pendientes</p>
        </div>
        <div className="bg-gray-800 rounded-2xl p-4 text-center">
          <p className="text-3xl font-bold text-amber-400">{totalActivos}</p>
          <p className="text-sm text-gray-400">Estacionados</p>
        </div>
      </div>

      <h2 className="text-lg font-bold text-white mb-3">📋 Solicitudes Pendientes</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
        {solicitudes.filter((s: any) => s.estado === "pendiente" || s.estado === "en_camino").map((sol: any) => (
          <div key={sol.id} className="bg-gray-800 rounded-2xl p-4">
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="font-bold text-white text-lg">🎫 #{String(sol.ticket_num).padStart(3, "0")}</p>
                <p className="text-gray-400">{sol.patente || "Sin patente"}</p>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full ${sol.estado === "pendiente" ? "bg-yellow-900 text-yellow-300" : "bg-blue-900 text-blue-300"}`}>
                {sol.estado === "pendiente" ? "Sin asignar" : "En curso"}
              </span>
            </div>
            {sol.estado === "pendiente" && (
              <select onChange={(e) => e.target.value && asignarValet(sol.id, e.target.value)}
                className="w-full p-3 rounded-xl bg-gray-900 text-white text-sm border border-gray-700 mt-2" defaultValue="">
                <option value="" disabled>Asignar a...</option>
                {valets.map((v: any) => (
                  <option key={v.id} value={v.id}>#{v.numero_valet} — {v.nombre}</option>
                ))}
              </select>
            )}
          </div>
        ))}
        {solicitudes.filter((s: any) => s.estado === "pendiente" || s.estado === "en_camino").length === 0 && (
          <p className="text-gray-500 text-center col-span-2 py-8">No hay solicitudes pendientes ✅</p>
        )}
      </div>

      <h2 className="text-lg font-bold text-white mb-3">🟢 Eventos en curso</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {eventos.map((ev: any) => (
          <div key={ev.id} className="bg-gray-800 rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-white text-lg">{ev.nombre}</p>
                <p className="text-sm text-gray-400">🚗 {ev.vehiculos_totales} vehículos</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

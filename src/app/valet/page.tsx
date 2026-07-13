"use client";
import { useState, useEffect } from "react";

const SB = "https://hzexxoazyhhvljqiummn.supabase.co";
const AK = "sb_publishable_ALyCDA4qM4T68YiecEQErQ_WoYNUfen";
const H = { apikey: AK, Authorization: `Bearer ${AK}` };

export default function ValetMenu() {
  const [eventos, setEventos] = useState<any[]>([]);
  const [eventoId, setEventoId] = useState("");
  const [sols, setSols] = useState(0);
  const valetId = typeof window !== 'undefined' ? localStorage.getItem("valetId") : null;
  const valetNombre = typeof window !== 'undefined' ? localStorage.getItem("valetNombre") : null;
  const valetNumero = typeof window !== 'undefined' ? localStorage.getItem("valetNumero") : null;

  const q = async (url: string) => { const r = await fetch(url, { headers: H }); try { return await r.json(); } catch { return null; } };

  useEffect(() => {
    q(`${SB}/rest/v1/eventos?select=id,nombre&estado=eq.abierto&order=fecha_apertura`).then(d => {
      if (Array.isArray(d) && d.length > 0) {
        setEventos(d);
        const id = d[0].id;
        setEventoId(id);
        localStorage.setItem("eventoActivoId", id);
      }
    });
    if (valetId) {
      const t = setInterval(() => {
        q(`${SB}/rest/v1/solicitudes_retiro?select=id&id_valet_asignado=eq.${valetId}`).then(d => {
          if (Array.isArray(d)) setSols(d.filter((s: any) => s.estado !== "completado").length);
        });
      }, 3000);
      return () => clearInterval(t);
    }
  }, []);

  const selEvento = (id: string) => { setEventoId(id); localStorage.setItem("eventoActivoId", id); };

  return (
    <div className="min-h-screen bg-gray-900 p-4 flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-blue-400 text-sm">🔑 #{valetNumero}</p>
          <p className="text-white text-xl font-bold">{valetNombre || "Valet"}</p>
        </div>
        <button onClick={() => { localStorage.clear(); window.location.href = "/"; }} className="text-gray-400 text-sm">Salir</button>
      </div>

      {eventos.length > 1 && (
        <div className="flex gap-2 overflow-x-auto mb-4 pb-2">
          {eventos.map((ev: any) => (
            <button key={ev.id} onClick={() => selEvento(ev.id)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap ${eventoId === ev.id ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-300"}`}>
              📋 {ev.nombre}
            </button>
          ))}
        </div>
      )}

      <div className="flex-1 flex flex-col gap-4 justify-center max-w-md mx-auto w-full">
        <button onClick={() => window.location.href = "/valet/entrada"}
          className="w-full py-8 rounded-2xl text-white font-bold text-2xl bg-gradient-to-br from-blue-600 to-blue-800 shadow-lg active:scale-95 flex flex-col items-center gap-2">
          <span className="text-4xl">🚗</span> REGISTRAR ENTRADA</button>

        <button onClick={() => window.location.href = "/valet/cambio"}
          className="w-full py-8 rounded-2xl text-white font-bold text-2xl bg-gradient-to-br from-orange-600 to-orange-800 shadow-lg active:scale-95 flex flex-col items-center gap-2">
          <span className="text-4xl">🔄</span> CAMBIAR UBICACIÓN</button>

        <button onClick={() => window.location.href = "/valet/entregar"}
          className="w-full py-8 rounded-2xl text-white font-bold text-2xl bg-gradient-to-br from-red-600 to-red-800 shadow-lg active:scale-95 flex flex-col items-center gap-2">
          <span className="text-4xl">✅</span> ENTREGAR VEHÍCULO</button>
      </div>
    </div>
  );
}

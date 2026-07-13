"use client";
import { useState, useEffect } from "react";
const SB = "https://hzexxoazyhhvljqiummn.supabase.co/rest/v1/", AK = "sb_publishable_ALyCDA4qM4T68YiecEQErQ_WoYNUfen", H = { apikey: AK, Authorization: `Bearer ${AK}` };
const q = async (u: string) => { try { const r = await fetch(u, { headers: H }); const t = await r.text(); return t && t !== "[]" ? JSON.parse(t) : []; } catch { return []; } };

export default function ValetMenu() {
  const [eventos, setEventos] = useState<any[]>([]);
  const [eventoId, setEventoId] = useState("");
  const [eventoNom, setEventoNom] = useState("");
  const vn = typeof window !== 'undefined' ? localStorage.getItem("valetNombre") || "" : "";
  const vnum = typeof window !== 'undefined' ? localStorage.getItem("valetNumero") || "" : "";

  useEffect(() => {
    q(SB + "eventos?select=id,nombre&estado=eq.abierto&order=fecha_apertura").then(d => {
      if (d.length > 0) {
        setEventos(d);
        const saved = localStorage.getItem("eventoActivoId");
        const found = saved ? d.find((e: any) => e.id === saved) : null;
        if (found) { setEventoId(found.id); setEventoNom(found.nombre); }
        else { setEventoId(d[0].id); setEventoNom(d[0].nombre); localStorage.setItem("eventoActivoId", d[0].id); }
      }
    });
  }, []);

  const selEvento = (id: string, nom: string) => { setEventoId(id); setEventoNom(nom); localStorage.setItem("eventoActivoId", id); };

  if (eventos.length === 0) {
    return (
      <div className="min-h-screen bg-gray-900 p-4 flex flex-col items-center justify-center">
        <p className="text-yellow-400 text-xl mb-4">⚠️ Cargando eventos...</p>
        <p className="text-gray-400">Si esto persiste, contactá al administrador</p>
        <button onClick={() => window.location.href = "/"} className="mt-8 text-gray-400">← Volver</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-4 flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2"><img src="/logo.png" alt="" className="w-7 h-7" /><div><p className="text-blue-400 text-sm">🔑 #{vnum}</p><p className="text-white text-xl font-bold">{vn || "Valet"}</p></div></div>
        <button onClick={() => { localStorage.clear(); window.location.href = "/"; }} className="text-gray-400 text-sm">Salir</button>
      </div>
      <div className="mb-4">
        <p className="text-gray-400 text-xs mb-2">📋 Evento activo:</p>
        {eventos.length > 1 ? (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {eventos.map((ev: any) => (
              <button key={ev.id} onClick={() => selEvento(ev.id, ev.nombre)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap ${eventoId === ev.id ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-300"}`}>
                📋 {ev.nombre}
              </button>
            ))}
          </div>
        ) : (
          <p className="text-white font-semibold text-lg">📋 {eventoNom || eventos[0]?.nombre}</p>
        )}
      </div>
      <div className="flex-1 flex flex-col gap-4 justify-center max-w-md mx-auto w-full">
        <button onClick={() => window.location.href = "/valet/entrada"} className="w-full py-8 rounded-2xl text-white font-bold text-2xl bg-gradient-to-br from-blue-600 to-blue-800 shadow-lg active:scale-95">
          <span className="text-4xl block mb-2">🚗</span> REGISTRAR ENTRADA</button>
        <button onClick={() => window.location.href = "/valet/cambio"} className="w-full py-8 rounded-2xl text-white font-bold text-2xl bg-gradient-to-br from-orange-600 to-orange-800 shadow-lg active:scale-95">
          <span className="text-4xl block mb-2">🔄</span> CAMBIAR UBICACIÓN</button>
        <button onClick={() => window.location.href = "/valet/entregar"} className="w-full py-8 rounded-2xl text-white font-bold text-2xl bg-gradient-to-br from-red-600 to-red-800 shadow-lg active:scale-95">
          <span className="text-4xl block mb-2">✅</span> ENTREGAR VEHÍCULO</button>
      </div>
    </div>
  );
}
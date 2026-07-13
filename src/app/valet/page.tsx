"use client";
export const dynamic = 'force-dynamic';
import { useState, useEffect } from "react";
const SB = "https://hzexxoazyhhvljqiummn.supabase.co", AK = "sb_publishable_ALyCDA4qM4T68YiecEQErQ_WoYNUfen", H = { apikey: AK, Authorization: `Bearer ${AK}` };

export default function ValetMenu() {
  const [eventos, setEventos] = useState<any[]>([]);
  const [eventoId, setEventoId] = useState("");
  const [eventoNom, setEventoNom] = useState("");
  const valetId = typeof window !== 'undefined' ? localStorage.getItem("valetId") : null;
  const valetNombre = typeof window !== 'undefined' ? localStorage.getItem("valetNombre") : null;
  const valetNumero = typeof window !== 'undefined' ? localStorage.getItem("valetNumero") : null;

  useEffect(() => {
    fetch(`${SB}/rest/v1/eventos?select=id,nombre&estado=eq.abierto&order=fecha_apertura`, { headers: H })
      .then(r => r.json()).then(d => {
        if (Array.isArray(d) && d.length > 0) {
          setEventos(d);
          const saved = localStorage.getItem("eventoActivoId");
          const found = saved ? d.find((e: any) => e.id === saved) : null;
          if (found) { setEventoId(found.id); setEventoNom(found.nombre); }
          else { setEventoId(d[0].id); setEventoNom(d[0].nombre); localStorage.setItem("eventoActivoId", d[0].id); }
        }
      }).catch(() => {});
  }, []);

  const selEvento = (id: string, nom: string) => { setEventoId(id); setEventoNom(nom); localStorage.setItem("eventoActivoId", id); };

  return (
    <div className="min-h-screen bg-gray-900 p-4 flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div><p className="text-blue-400 text-sm">🔑 #{valetNumero}</p><p className="text-white text-xl font-bold">{valetNombre || "Valet"}</p></div>
        <button onClick={() => { localStorage.clear(); window.location.href = "/"; }} className="text-gray-400 text-sm">Salir</button>
      </div>
      {eventos.length > 0 && (
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
      )}
      {eventos.length === 0 && <p className="text-yellow-400 text-sm mb-4 text-center">⚠️ No hay eventos activos. Contactá al administrador.</p>}

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
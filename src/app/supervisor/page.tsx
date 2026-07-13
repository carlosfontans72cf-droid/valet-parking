"use client";
export const dynamic = 'force-dynamic';
import { useState, useEffect } from "react";
const SB = "https://hzexxoazyhhvljqiummn.supabase.co", AK = "sb_publishable_ALyCDA4qM4T68YiecEQErQ_WoYNUfen", BH = { apikey: AK, Authorization: `Bearer ${AK}` };
const q = async (u: string) => { try { const r = await fetch(u, { headers: BH }); const t = await r.text(); return t && t !== "[]" ? JSON.parse(t) : []; } catch { return []; } };

export default function SupervisorPage() {
  const [eventos, setEventos] = useState<any[]>([]);
  const [eventoId, setEventoId] = useState("");
  const [eventoNom, setEventoNom] = useState("");
  const [totalActivos, setTotalActivos] = useState(0);
  const [totalHoy, setTotalHoy] = useState(0);
  const [totalEnEvento, setTotalEnEvento] = useState(0);
  const [uName, setUName] = useState("Supervisor");
  const [error, setError] = useState("");

  useEffect(() => {
    const name = localStorage.getItem("userName");
    if (!name) { window.location.href = "/"; return; }
    setUName(name);
    // Cargar evento activo guardado
    const saved = localStorage.getItem("eventoActivoId");
    if (saved) setEventoId(saved);
    cargar();
    const t = setInterval(cargar, 10000);
    return () => clearInterval(t);
  }, []);

  const cargar = async () => {
    try {
      const evs = await q(`${SB}/rest/v1/eventos?select=id,nombre,vehiculos_totales&estado=eq.abierto`);
      setEventos(Array.isArray(evs) ? evs : []);
      const evIds = Array.isArray(evs) && evs.length ? evs.map((e: any) => e.id).join(",") : "";
      if (evIds) {
        setTotalActivos((await q(`${SB}/rest/v1/tickets?select=id&estado=eq.activo&id_evento=in.(${evIds})`)).length);
        const hoy = new Date().toISOString().split("T")[0];
        setTotalHoy((await q(`${SB}/rest/v1/tickets?select=id&hora_entrada=gte.${hoy}&id_evento=in.(${evIds})`)).length);
      }
      setError("");
    } catch (e) { setError("Error al cargar datos"); }
  };

  const seleccionarEvento = (id: string, nom: string) => {
    setEventoId(id);
    setEventoNom(nom);
    localStorage.setItem("eventoActivoId", id);
  };

  const cerrarSesion = () => { localStorage.clear(); window.location.href = "/"; };

  return (
    <div className="min-h-screen bg-gray-900 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">👁️ Admin</h1>
            <p className="text-gray-400 text-sm">{uName}</p>
          </div>
          <div className="flex gap-1 flex-wrap">
            <button onClick={() => window.location.href = "/dashboard"} className="bg-gray-700 text-white px-2.5 py-1.5 rounded-xl text-xs">📊</button>
            <button onClick={() => window.location.href = "/dashboard/tv"} className="bg-gray-800 text-white px-2.5 py-1.5 rounded-xl text-xs">📺</button>
            <button onClick={() => window.location.href = "/dueno/configuracion"} className="bg-purple-600 text-white px-2.5 py-1.5 rounded-xl text-xs">⚙️</button>
            <button onClick={cerrarSesion} className="bg-gray-800 text-white px-2.5 py-1.5 rounded-xl text-xs">Salir</button>
          </div>
        </div>

        {error && <div className="bg-red-900/50 text-red-300 p-3 rounded-xl text-sm mb-4 text-center">{error}</div>}

        {/* Estadísticas */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-gray-800 rounded-2xl p-4 text-center">
            <p className="text-3xl font-bold text-blue-400">{eventos.length}</p>
            <p className="text-xs text-gray-400">Eventos</p>
          </div>
          <div className="bg-gray-800 rounded-2xl p-4 text-center">
            <p className="text-3xl font-bold text-green-400">{totalActivos}</p>
            <p className="text-xs text-gray-400">Activos</p>
          </div>
          <div className="bg-gray-800 rounded-2xl p-4 text-center">
            <p className="text-3xl font-bold text-amber-400">{totalHoy}</p>
            <p className="text-xs text-gray-400">Hoy</p>
          </div>
        </div>

        {/* Acciones rápidas */}
        <p className="text-gray-400 text-xs font-semibold mb-2">🚗 Acciones rápidas:</p>
        <div className="grid grid-cols-3 gap-2 mb-6">
          <button onClick={() => window.location.href = "/valet/entrada"} className="bg-gradient-to-br from-blue-600 to-blue-800 text-white rounded-2xl p-4 text-center shadow-lg active:scale-95">
            <span className="text-3xl block mb-1">🚗</span>
            <span className="text-xs font-semibold">Registrar Entrada</span>
          </button>
          <button onClick={() => window.location.href = "/valet/cambio"} className="bg-gradient-to-br from-orange-600 to-orange-800 text-white rounded-2xl p-4 text-center shadow-lg active:scale-95">
            <span className="text-3xl block mb-1">🔄</span>
            <span className="text-xs font-semibold">Cambiar Ubicación</span>
          </button>
          <button onClick={() => window.location.href = "/valet/entregar"} className="bg-gradient-to-br from-red-600 to-red-800 text-white rounded-2xl p-4 text-center shadow-lg active:scale-95">
            <span className="text-3xl block mb-1">✅</span>
            <span className="text-xs font-semibold">Entregar Vehículo</span>
          </button>
        </div>

        {/* Selector de Evento */}
        <p className="text-gray-400 text-xs font-semibold mb-2">📋 Evento activo:</p>
        {eventos.length > 1 ? (
          <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
            {eventos.map((ev: any) => (
              <button key={ev.id} onClick={() => seleccionarEvento(ev.id, ev.nombre)}
                className={`px-5 py-3 rounded-2xl text-sm font-semibold whitespace-nowrap transition-all active:scale-95 ${eventoId === ev.id ? "bg-blue-600 text-white shadow-lg ring-2 ring-blue-300" : "bg-gray-800 text-gray-300 border border-gray-700 hover:bg-gray-700"}`}>
                📋 {ev.nombre} <span className="text-xs opacity-70">({ev.vehiculos_totales})</span>
              </button>
            ))}
          </div>
        ) : eventos.length === 1 ? (
          <div className="mb-4">
            <div onClick={() => seleccionarEvento(eventos[0].id, eventos[0].nombre)}
              className={`px-5 py-3 rounded-2xl text-sm font-semibold inline-block cursor-pointer transition-all ${eventoId === eventos[0].id ? "bg-blue-600 text-white shadow-lg" : "bg-gray-800 text-gray-300 border border-gray-700"}`}>
              📋 {eventos[0].nombre}
            </div>
          </div>
        ) : null}

        {/* Eventos en curso - lista con selector */}
        <h2 className="text-lg font-bold text-white mb-3">🟢 Todos los eventos</h2>
        <div className="space-y-2 mb-6">
          {eventos.map((ev: any) => (
            <div key={ev.id} onClick={() => seleccionarEvento(ev.id, ev.nombre)}
              className={`bg-gray-800 rounded-2xl p-4 cursor-pointer transition-all active:scale-95 border-2 ${eventoId === ev.id ? "border-blue-500 shadow-lg shadow-blue-500/20" : "border-transparent hover:bg-gray-700"}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-white text-lg">{ev.nombre} {eventoId === ev.id && <span className="text-blue-400 text-sm ml-2">✓ activo</span>}</p>
                  <p className="text-sm text-gray-400">🚗 {ev.vehiculos_totales} vehículos</p>
                </div>
              </div>
            </div>
          ))}
          {eventos.length === 0 && <p className="text-gray-500 text-center py-4">Sin eventos activos</p>}
        </div>
      </div>
    </div>
  );
}

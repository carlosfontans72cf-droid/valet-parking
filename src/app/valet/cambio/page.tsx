"use client";
import { useState, useEffect } from "react";

const SB = "https://hzexxoazyhhvljqiummn.supabase.co";
const AK = "sb_publishable_ALyCDA4qM4T68YiecEQErQ_WoYNUfen";
const H = { apikey: AK, Authorization: `Bearer ${AK}` };

export default function CambioPage() {
  const [n, setN] = useState("");
  const [t, setT] = useState<any>(null);
  const [s, setS] = useState<any[]>([]);
  const [ns, setNs] = useState("");
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  const eventoId = typeof window !== 'undefined' ? localStorage.getItem("eventoActivoId") : null;
  const q = async (url: string) => { const r = await fetch(url, { headers: H }); try { return await r.json(); } catch { return null; } };

  useEffect(() => {
    q(`${SB}/rest/v1/sectores?select=id,nombre,color_hex&activo=eq.true&order=orden`).then(d => { if (Array.isArray(d)) setS(d); });
  }, []);

  const buscar = async () => {
    setErr(""); setT(null); setNs("");
    if (!n || !eventoId) { setErr("No hay evento activo"); return; }
    const d = await q(`${SB}/rest/v1/tickets?select=id,numero_ticket,id_sector,ubicacion_exacta,estado_llave,hora_entrada,id_evento&numero_ticket=eq.${n}&id_evento=eq.${eventoId}&estado=eq.activo`);
    if (!Array.isArray(d) || d.length === 0) { setErr("No encontrado en este evento"); return; }
    setT(d[0]);
  };

  const cambiar = async () => {
    if (!t || !ns) return;
    try {
      await fetch(`${SB}/rest/v1/tickets?id=eq.${(t as any).id}`, { method: "PATCH", headers: { ...H, "Content-Type": "application/json" }, body: JSON.stringify({ id_sector: ns }) });
      setOk("✅ Cambiado!");
      setTimeout(() => { setT(null); setN(""); setNs(""); setOk(""); }, 1500);
    } catch { setErr("Error"); }
  };

  const sectorActual = s.find((x: any) => x.id === t?.id_sector);

  return (
    <div className="min-h-screen bg-gray-900 p-4 pb-8">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => window.location.href = "/valet"} className="text-gray-400 text-3xl">←</button>
        <h1 className="text-white text-xl font-bold">🔄 Cambiar Ubicación</h1>
      </div>
      <div className="max-w-lg mx-auto space-y-4">
        {!t && (
          <div className="flex gap-2">
            <input value={n} onChange={e => setN(e.target.value.replace(/\D/g, ''))}
              className="flex-1 p-4 text-3xl bg-gray-800 border border-gray-600 rounded-2xl text-white text-center font-bold" placeholder="N° ticket" />
            <button onClick={buscar} className="px-8 bg-blue-600 text-white rounded-2xl font-bold text-lg active:scale-95">🔍 Buscar</button>
          </div>
        )}
        {t && (
          <div className="bg-gray-800 rounded-2xl p-5">
            <p className="text-white text-5xl font-bold text-center">🎫 #{String((t as any).numero_ticket).padStart(3, "0")}</p>
            <div className="bg-gray-900 rounded-xl p-4 mt-4 space-y-2">
              <p className="text-gray-300">📍 <span className="font-semibold">Ubicación:</span> {(t as any).ubicacion_exacta}</p>
              <p className="text-gray-300">🅿️ <span className="font-semibold">Sector actual:</span> <span style={{ color: sectorActual?.color_hex }} className="font-bold">{sectorActual?.nombre || "—"}</span></p>
              <p className="text-gray-400">🔑 {(t as any).estado_llave}</p>
            </div>
            <p className="text-gray-300 text-sm font-semibold mt-4 mb-2">🅿️ Mover a:</p>
            <div className="grid grid-cols-2 gap-2">
              {s.filter((x: any) => x.id !== (t as any).id_sector).map((x: any) => (
                <button key={x.id} onClick={() => setNs(x.id)}
                  className={`py-4 rounded-2xl text-sm font-bold transition-all active:scale-95 ${ns === x.id ? "text-white shadow-lg ring-2 ring-white" : "border border-gray-700"}`}
                  style={{ backgroundColor: ns === x.id ? x.color_hex : x.color_hex + "20", color: x.color_hex }}>
                  {x.nombre}
                </button>
              ))}
            </div>
            <button onClick={cambiar} disabled={!ns}
              className="w-full mt-4 py-5 rounded-2xl text-white font-bold text-xl bg-gradient-to-r from-orange-600 to-orange-700 disabled:opacity-50 shadow-lg active:scale-95">
              🔄 CONFIRMAR CAMBIO
            </button>
          </div>
        )}
        {err && <div className="bg-red-900/50 text-red-300 p-4 rounded-2xl text-sm">{err}</div>}
        {ok && <div className="bg-green-900/50 text-green-300 p-4 rounded-2xl text-sm">{ok}</div>}
      </div>
    </div>
  );
}

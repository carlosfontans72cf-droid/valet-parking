"use client";
export const dynamic = 'force-dynamic';
import { useState, useEffect } from "react";
const SB = "https://hzexxoazyhhvljqiummn.supabase.co", AK = "sb_publishable_ALyCDA4qM4T68YiecEQErQ_WoYNUfen";
const q = async (u: string) => { try { const r = await fetch(u, { headers: { apikey: AK, Authorization: `Bearer ${AK}` } }); return await r.json(); } catch { return null; } };

export default function DashboardPage() {
  const [secs, setSecs] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [nomApp, setNomApp] = useState("Valet Parking");
  const [evs, setEvs] = useState<any[]>([]);
  const [evSel, setEvSel] = useState("");

  useEffect(() => { cargar(); const t = setInterval(cargar, 5000); return () => clearInterval(t); }, [evSel]);

  const cargar = async () => {
    const c = await q(`${SB}/rest/v1/configuracion_app?select=nombre_app`);
    if (Array.isArray(c) && c.length) setNomApp(c[0].nombre_app);
    // Get active events
    const e = await q(`${SB}/rest/v1/eventos?select=id,nombre,vehiculos_totales&estado=eq.abierto`);
    if (Array.isArray(e)) { setEvs(e); if (!evSel && e.length) setEvSel(e[0].id); }
    // Only count tickets in active events
    const evIds = Array.isArray(e) && e.length ? e.map((x: any) => x.id).join(",") : "";
    const secsData = await q(`${SB}/rest/v1/sectores?select=id,nombre,capacidad,color_hex&activo=eq.true&order=orden`);
    if (Array.isArray(secsData)) {
      const w = await Promise.all(secsData.map(async (s: any) => {
        const url = evIds ? `${SB}/rest/v1/tickets?select=id&id_sector=eq.${s.id}&estado=eq.activo&id_evento=in.(${evIds})` : "";
        const t = url ? await q(url) : [];
        return { ...s, activos: Array.isArray(t) ? t.length : 0 };
      }));
      setSecs(w);
      setTotal(w.reduce((a: number, b: any) => a + (b.activos || 0), 0));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4" style={{ maxWidth: 640, margin: "0 auto" }}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2"><img src="/logo.png" alt="" className="w-8 h-8" /><h1 className="text-2xl font-bold">{nomApp}</h1></div>
        <button onClick={() => window.location.href = "/"} className="bg-gray-800 text-white px-4 py-2 rounded-xl text-sm">Ingresar</button>
      </div>
      {evs.length > 1 && (
        <div className="flex gap-2 overflow-x-auto mb-4">
          {evs.map((ev: any) => (
            <button key={ev.id} onClick={() => setEvSel(ev.id)} className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap ${evSel === ev.id ? "bg-blue-600 text-white" : "bg-gray-200"}`}>{ev.nombre}</button>
          ))}
        </div>
      )}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-white rounded-2xl shadow p-4 text-center"><p className="text-4xl font-bold text-blue-600">{total}</p><p className="text-sm text-gray-500">Vehículos</p></div>
        <div className="bg-white rounded-2xl shadow p-4 text-center"><p className="text-4xl font-bold text-green-600">{secs.filter(s => s.activos > 0).length}</p><p className="text-sm text-gray-500">Sectores</p></div>
      </div>
      <p className="font-bold mb-3">🅿️ Sectores</p>
      <div className="space-y-2">
        {secs.map((s: any) => (
          <div key={s.id} className="bg-white rounded-2xl shadow p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold text-sm">{s.nombre}</span>
              <span className="text-xs font-bold" style={{ color: s.color_hex }}>{s.activos}/{s.capacidad}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5"><div className="h-full rounded-full" style={{ width: `${Math.min(Math.round((s.activos / s.capacidad) * 100), 100)}%`, backgroundColor: s.color_hex }} /></div>
          </div>
        ))}
      </div>
    </div>
  );
}
"use client";
import { useState, useEffect } from "react";
const SB = "https://hzexxoazyhhvljqiummn.supabase.co", AK = "sb_publishable_ALyCDA4qM4T68YiecEQErQ_WoYNUfen";
const q = async (u: string) => { try { const r = await fetch(u, { headers: { apikey: AK, Authorization: `Bearer ${AK}` } }); return await r.json(); } catch { return null; } };

export default function DashboardPage() {
  const [secs, setSecs] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [nomApp, setNomApp] = useState("Valet Parking");

  useEffect(() => { cargar(); const t = setInterval(cargar, 5000); return () => clearInterval(t); }, []);

  const cargar = async () => {
    const c = await q(`${SB}/rest/v1/configuracion_app?limit=1`);
    if (Array.isArray(c)&&c.length) setNomApp(c[0].nombre_app);
    const d = await q(`${SB}/rest/v1/sectores?select=id,nombre,capacidad,color_hex&activo=eq.true&order=orden`);
    if (Array.isArray(d)) {
      const w = await Promise.all(d.map(async (s:any) => {
        const t = await q(`${SB}/rest/v1/tickets?select=id&id_sector=eq.${s.id}&estado=eq.activo`);
        return { ...s, activos: Array.isArray(t) ? t.length : 0 };
      }));
      setSecs(w);
      setTotal(w.reduce((a:number,b:any) => a + (b.activos || 0), 0));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-gray-800">{nomApp}</h1><p className="text-sm text-gray-500">{new Date().toLocaleDateString("es-ES",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}</p></div>
        <button onClick={()=>window.location.href="/"} className="bg-gray-800 text-white px-4 py-2 rounded-xl text-sm font-semibold">Ingresar</button>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-white rounded-2xl shadow p-4 text-center"><p className="text-4xl font-bold text-blue-600">{total}</p><p className="text-sm text-gray-500">Vehículos Activos</p></div>
        <div className="bg-white rounded-2xl shadow p-4 text-center"><p className="text-4xl font-bold text-green-600">{secs.filter(s=>s.activos>0).length}</p><p className="text-sm text-gray-500">Sectores en Uso</p></div>
      </div>
      <p className="text-lg font-bold text-gray-700 mb-3">🅿️ Ocupación por Sector</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {secs.map((s:any) => (
          <div key={s.id} className="bg-white rounded-2xl shadow p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold text-sm text-gray-700">{s.nombre}</span>
              <span className="text-xs font-bold" style={{color:s.color_hex}}>{s.activos}/{s.capacidad}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5"><div className="h-full rounded-full" style={{width:`${Math.min(Math.round((s.activos/s.capacidad)*100),100)}%`,backgroundColor:s.color_hex}} /></div>
          </div>
        ))}
      </div>
    </div>
  );
}

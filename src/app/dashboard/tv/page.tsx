"use client";
import { useState, useEffect } from "react";
const SB = "https://hzexxoazyhhvljqiummn.supabase.co", AK = "sb_publishable_ALyCDA4qM4T68YiecEQErQ_WoYNUfen";
const q = async (u: string) => { try { const r = await fetch(u, { headers: { apikey: AK, Authorization: `Bearer ${AK}` } }); return await r.json(); } catch { return null; } };

export default function TVPage() {
  const [hora, setHora] = useState<Date>(new Date());
  const [evs, setEvs] = useState<any[]>([]);
  const [evSel, setEvSel] = useState("");
  const [secs, setSecs] = useState<any[]>([]);
  const [tkts, setTkts] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [nomApp, setNomApp] = useState("Valet Parking");

  useEffect(() => { const t = setInterval(() => setHora(new Date()), 1000); return () => clearInterval(t); }, []);
  useEffect(() => { cargar(); const t = setInterval(cargar, 3000); return () => clearInterval(t); }, [evSel]);

  const cargar = async () => {
    const c = await q(`${SB}/rest/v1/configuracion_app?limit=1`);
    if (Array.isArray(c)&&c.length) setNomApp(c[0].nombre_app);
    const e = await q(`${SB}/rest/v1/eventos?select=id,nombre,vehiculos_totales&estado=eq.abierto`);
    if (Array.isArray(e)) {
      setEvs(e);
      if (!evSel && e.length > 0) setEvSel(e[0].id);
    }
    // Sectores
    const s = await q(`${SB}/rest/v1/sectores?select=id,nombre,capacidad,color_hex&activo=eq.true&order=orden`);
    if (Array.isArray(s)) {
      const w = await Promise.all(s.map(async (x:any) => {
        const t = await q(`${SB}/rest/v1/tickets?select=id&id_sector=eq.${x.id}&estado=eq.activo`);
        return {...x, activos: Array.isArray(t) ? t.length : 0};
      }));
      setSecs(w);
      setTotal(w.reduce((a:number,b:any)=>a+(b.activos||0),0));
    }
    // Tickets del evento seleccionado
    if (evSel) {
      const t = await q(`${SB}/rest/v1/tickets?select=numero_ticket,id_sector,ubicacion_exacta,estado_llave&id_evento=eq.${evSel}&estado=eq.activo&order=numero_ticket`);
      if (Array.isArray(t)) {
        const enr = t.map((x:any) => {
          const secs2 = s; const sec = secs2?.find((y:any) => y.id === x.id_sector);
          return {...x, sector_nombre: sec?.nombre||"", sector_color: sec?.color_hex||"#666"};
        });
        setTkts(enr);
      } else setTkts([]);
    }
  };

  const evActual = evs.find((e:any) => e.id === evSel);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8" style={{fontFamily:"'Segoe UI',sans-serif"}}>
      {/* HEADER */}
      <div className="flex items-start justify-between mb-8">
        <div className="flex items-center gap-6">
          <div className="text-6xl">🚗</div>
          <div>
            <h1 className="text-5xl font-bold tracking-tight">{nomApp}</h1>
            <p className="text-2xl text-gray-400 mt-2">{hora.toLocaleDateString("es-ES",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-7xl font-light tabular-nums">{hora.toLocaleTimeString("es-ES",{hour:"2-digit",minute:"2-digit"})}</p>
          <p className="text-xl text-gray-400">En vivo</p>
        </div>
      </div>

      {/* SELECTOR DE EVENTOS */}
      {evs.length > 0 && (
        <div className="flex gap-4 mb-8">
          {evs.map((ev:any) => (
            <button key={ev.id} onClick={()=>setEvSel(ev.id)}
              className={`rounded-3xl px-8 py-4 transition-all cursor-pointer ${evSel===ev.id?"bg-blue-600 shadow-lg ring-2 ring-blue-300":"bg-gray-800 hover:bg-gray-700"}`}>
              <p className="text-2xl font-semibold">{ev.nombre}</p>
              <p className="text-4xl font-bold mt-1">{ev.vehiculos_totales} <span className="text-lg font-normal text-gray-400">vehículos</span></p>
            </button>
          ))}
        </div>
      )}
      {evActual && <p className="text-xl text-blue-400 mb-6 font-semibold">📋 Mostrando: {evActual.nombre}</p>}

      <div className="grid grid-cols-2 gap-6" style={{height:'calc(100vh-320px)'}}>
        {/* SECTORES */}
        <div className="flex flex-col">
          <h2 className="text-3xl font-semibold mb-4 flex items-center gap-4">
            🅿️ Sectores <span className="text-5xl font-bold text-blue-400">{total}</span>
            <span className="text-xl font-normal text-gray-400">/1305</span>
          </h2>
          <div className="flex-1 overflow-y-auto space-y-2 pr-2">
            {secs.map((s:any) => {
              const pct = s.capacidad > 0 ? Math.round((s.activos/s.capacidad)*100) : 0;
              return (
                <div key={s.id} className="bg-gray-900 rounded-2xl p-3">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{backgroundColor:s.color_hex}} />
                      <span className="text-lg font-semibold">{s.nombre}</span>
                    </div>
                    <span className="text-xl font-bold" style={{color:s.color_hex}}>{s.activos}<span className="text-sm font-normal text-gray-500">/{s.capacidad}</span></span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-1000" style={{width:`${Math.min(pct,100)}%`,backgroundColor:s.color_hex}} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* TICKETS */}
        <div className="flex flex-col">
          <h2 className="text-3xl font-semibold mb-4">🎫 Vehículos</h2>
          <div className="flex-1 overflow-y-auto space-y-2 pr-2">
            {tkts.map((t:any,i:number) => (
              <div key={i} className="bg-gray-900 rounded-2xl p-4 flex items-center gap-4">
                <span className="text-4xl font-bold text-yellow-400">#{String(t.numero_ticket).padStart(3,"0")}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <span className="w-3 h-3 rounded-full" style={{backgroundColor:t.sector_color}} />
                    <span className="text-xl font-semibold" style={{color:t.sector_color}}>{t.sector_nombre}</span>
                  </div>
                  <p className="text-sm text-gray-400 mt-1">📍 {t.ubicacion_exacta} · 🔑 {t.estado_llave==="colgada"?"Colgada":t.estado_llave==="cajon"?"Cajón":"Dueño"}</p>
                </div>
              </div>
            ))}
            {tkts.length===0 && <div className="text-center py-20"><span className="text-6xl block mb-4">🅿️</span><p className="text-2xl text-gray-500">Sin vehículos</p></div>}
          </div>
        </div>
      </div>
      <div className="fixed bottom-4 left-0 right-0 text-center"><p className="text-gray-600 text-sm">{nomApp} · En vivo</p></div>
    </div>
  );
}

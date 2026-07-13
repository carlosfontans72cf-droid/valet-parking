"use client";
import { useState, useEffect } from "react";
const SB = "https://hzexxoazyhhvljqiummn.supabase.co", AK = "sb_publishable_ALyCDA4qM4T68YiecEQErQ_WoYNUfen";
const q = async (u: string) => { try { const r = await fetch(u, { headers: { apikey: AK, Authorization: `Bearer ${AK}` } }); return await r.json(); } catch { return null; } };

export default function CambioPage() {
  const [n, setN] = useState("");
  const [t, setT] = useState<any>(null);
  const [s, setS] = useState<any[]>([]);
  const [ns, setNs] = useState("");
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");
  const eventoId = typeof window !== 'undefined' ? localStorage.getItem("eventoActivoId") : null;
  const valetId = typeof window !== 'undefined' ? localStorage.getItem("valetId") : null;

  useEffect(() => {
    q(`${SB}/rest/v1/sectores?select=id,nombre,color_hex&activo=eq.true&order=orden`).then(d => { if (Array.isArray(d)) setS(d); });
  }, []);

  const buscar = async () => {
    setErr(""); setT(null); setNs("");
    if (!n||!eventoId) { setErr("Falta número o evento"); return; }
    const d = await q(`${SB}/rest/v1/tickets?select=id,numero_ticket,id_sector,ubicacion_exacta,estado_llave,hora_entrada,id_evento&numero_ticket=eq.${n}&id_evento=eq.${eventoId}&estado=eq.activo`);
    if (!Array.isArray(d)||!d.length) { setErr("No encontrado en este evento"); return; }
    // Traer historial también
    const hist = await q(`${SB}/rest/v1/historial_completo?select=id,tipo,id_valet,creado_en,detalles&id_ticket=eq.${d[0].id}&order=creado_en.asc`);
    setT({...d[0], hist: Array.isArray(hist)?hist:[]});
  };

  const cambiar = async () => {
    if (!t||!ns||!valetId) return;
    try {
      const sectorNuevo = s.find(x => x.id === ns);
      const sectorActual = s.find(x => x.id === t.id_sector);
      await fetch(`${SB}/rest/v1/tickets?id=eq.${t.id}`, { method:"PATCH", headers:{"Content-Type":"application/json",apikey:AK,Authorization:`Bearer ${AK}`}, body:JSON.stringify({ id_sector:ns }) });
      // Registrar en historial
      await fetch(`${SB}/rest/v1/historial_completo`, { method:"POST", headers:{"Content-Type":"application/json",apikey:AK,Authorization:`Bearer ${AK}`}, body:JSON.stringify({ id_ticket:t.id, id_evento:t.id_evento, id_valet:valetId, tipo:"cambio_sector", detalles:{ sector_anterior:sectorActual?.nombre||"", sector_nuevo:sectorNuevo?.nombre||"" } }) });
      setOk("✅ Cambiado!"); setTimeout(()=>{setT(null);setN("");setNs("");setOk("");},1500);
    } catch { setErr("Error"); }
  };

  const sa = s.find((x:any) => x.id === t?.id_sector);

  return (
    <div className="min-h-screen bg-gray-900 p-4 pb-8">
      <div className="flex items-center gap-3 mb-6"><button onClick={()=>window.history.back()} className="text-gray-400 text-3xl">←</button><h1 className="text-white text-xl font-bold">🔄 Cambiar</h1></div>
      <div className="max-w-lg mx-auto space-y-3">
        {!t ? (
          <div className="space-y-2">
            <p className="text-gray-400 text-sm">🎫 N° de ticket a mover:</p>
            <input value={n} onChange={e=>setN(e.target.value.replace(/\D/g,''))} className="w-full p-4 text-3xl bg-gray-800 border border-gray-600 rounded-2xl text-white text-center font-bold" placeholder="001" inputMode="numeric" />
            <button onClick={buscar} className="w-full py-5 bg-blue-600 text-white rounded-2xl font-bold text-lg active:scale-95 shadow-lg">🔍 Buscar</button>
          </div>
        ) : (
          <div className="bg-gray-800 rounded-2xl p-4">
            <p className="text-white text-4xl font-bold text-center">🎫 #{String(t.numero_ticket).padStart(3,"0")}</p>
            <div className="bg-gray-900 rounded-xl p-3 mt-3 space-y-1 text-sm">
              <p className="text-white">📍 {t.ubicacion_exacta}</p>
              <p style={{color:sa?.color_hex}} className="font-bold">🅿️ {sa?.nombre||"—"}</p>
              <p className={`font-bold ${t.estado_llave==="con_dueno"?"text-red-400 animate-pulse":"text-gray-400"}`}>🔑 {t.estado_llave==="con_dueno"?"⚠️ LLAVE CON DUEÑO":t.estado_llave==="colgada"?"Colgada":"En cajón"}</p>
            </div>
            {t.hist&&t.hist.length>0&&(
              <div className="mt-2"><p className="text-gray-500 text-xs font-semibold mb-1">📋 Historial:</p>
              {t.hist.map((h:any,i:number)=>(
                <div key={i} className="text-xs text-gray-400 flex gap-1">
                  <span>{h.tipo==="entrada"?"🚗":"🔄"}</span>
                  <span>{h.tipo==="entrada"?"Entrada":"Cambio"}</span>
                </div>
              ))}</div>
            )}
            <p className="text-gray-300 text-sm font-semibold mt-3 mb-2">🅿️ Mover a:</p>
            <div className="grid grid-cols-2 gap-1.5">
              {s.filter((x:any) => x.id!==t.id_sector).map((x:any) => (
                <button key={x.id} onClick={()=>setNs(x.id)} className={`py-4 rounded-2xl text-sm font-bold transition-all active:scale-95 ${ns===x.id?"text-white shadow-lg ring-2 ring-white":"border border-gray-700"}`}
                  style={{backgroundColor:ns===x.id?x.color_hex:x.color_hex+"20",color:x.color_hex}}>{x.nombre}</button>
              ))}
            </div>
            <button onClick={cambiar} disabled={!ns} className="w-full mt-3 py-5 rounded-2xl text-white font-bold text-xl bg-gradient-to-r from-orange-600 to-orange-700 disabled:opacity-50 shadow-lg active:scale-95">🔄 CONFIRMAR CAMBIO</button>
          </div>
        )}
        {err&&<div className="bg-red-900/50 text-red-300 p-3 rounded-xl text-sm text-center">{err}</div>}
        {ok&&<div className="bg-green-900/50 text-green-300 p-3 rounded-xl text-sm text-center">{ok}</div>}
      </div>
    </div>
  );
}
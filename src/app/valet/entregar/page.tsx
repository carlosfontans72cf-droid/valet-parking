"use client";
import { useState } from "react";
const SB = "https://hzexxoazyhhvljqiummn.supabase.co", AK = "sb_publishable_ALyCDA4qM4T68YiecEQErQ_WoYNUfen";
const q = async (u: string) => { try { const r = await fetch(u, { headers: { apikey: AK, Authorization: `Bearer ${AK}` } }); return await r.json(); } catch { return null; } };

export default function EntregarPage() {
  const [n, setN] = useState("");
  const [t, setT] = useState<any>(null);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");
  const eid = typeof window !== 'undefined' ? localStorage.getItem("eventoActivoId") : null;
  const vid = typeof window !== 'undefined' ? localStorage.getItem("valetId") : null;

  const buscar = async () => {
    setErr(""); setT(null);
    if (!n||!eid) { setErr("Falta número o evento"); return; }
    const d = await q(`${SB}/rest/v1/tickets?select=id,numero_ticket,id_sector,ubicacion_exacta,estado_llave,hora_entrada,id_valet_entrada,id_evento&numero_ticket=eq.${n}&id_evento=eq.${eid}&estado=eq.activo`);
    if (!Array.isArray(d)||!d.length) { setErr("No encontrado en este evento"); return; }
    const tk = d[0];
    const [sec, val, hist] = await Promise.all([
      q(`${SB}/rest/v1/sectores?select=nombre,color_hex&id=eq.${tk.id_sector}`),
      q(`${SB}/rest/v1/perfiles?select=nombre&id=eq.${tk.id_valet_entrada}`),
      q(`${SB}/rest/v1/historial_completo?select=id,tipo,id_valet,creado_en,detalles&id_ticket=eq.${tk.id}&order=creado_en.asc`),
    ]);
    let he: any[] = [];
    if (Array.isArray(hist)) {
      he = await Promise.all(hist.map(async (h:any) => {
        const p = await q(`${SB}/rest/v1/perfiles?select=nombre&id=eq.${h.id_valet}`);
        let det = "";
        if (h.detalles&&typeof h.detalles==="object"&&(h.detalles as any).sector_anterior) det = `${(h.detalles as any).sector_anterior} → ${(h.detalles as any).sector_nuevo}`;
        return {...h, vn: Array.isArray(p)&&p.length?p[0].nombre:"—", det, icon: h.tipo==="entrada"?"🚗":h.tipo==="cambio_sector"?"🔄":"✅", label: h.tipo==="entrada"?"INGRESÓ":h.tipo==="cambio_sector"?"REUBICÓ":h.tipo==="retiro_entregado"?"ENTREGÓ":h.tipo.toUpperCase()};
      }));
    }
    setT({...tk, sn: Array.isArray(sec)&&sec.length?sec[0].nombre:"—", sc: Array.isArray(sec)&&sec.length?sec[0].color_hex:"#666", vn: Array.isArray(val)&&val.length?val[0].nombre:"—", hist: he });
  };

  const ent = async () => {
    if (!t||!vid) return;
    try {
      await fetch(`${SB}/rest/v1/tickets?id=eq.${t.id}`, { method:"PATCH", headers:{"Content-Type":"application/json",apikey:AK,Authorization:`Bearer ${AK}`}, body:JSON.stringify({ estado:"completado", hora_salida:new Date().toISOString(), id_valet_salida:vid }) });
      setOk("✅ Entregado!"); setTimeout(()=>{setT(null);setN("");setOk("");},2000);
    } catch { setErr("Error"); }
  };

  return (
    <div className="min-h-screen bg-gray-900 p-4 pb-8">
      <div className="flex items-center gap-3 mb-6"><button onClick={()=>window.location.href="/valet"} className="text-gray-400 text-3xl">←</button><h1 className="text-white text-xl font-bold">✅ Entregar</h1></div>
      <div className="max-w-lg mx-auto space-y-3">
        {!t ? (
          <div className="space-y-2">
            <p className="text-gray-400 text-sm">🎫 N° de ticket a retirar:</p>
            <input value={n} onChange={e=>setN(e.target.value.replace(/\D/g,''))} className="w-full p-4 text-3xl bg-gray-800 border border-gray-600 rounded-2xl text-white text-center font-bold" placeholder="001" inputMode="numeric" />
            <button onClick={buscar} className="w-full py-5 bg-blue-600 text-white rounded-2xl font-bold text-lg active:scale-95 shadow-lg">🔍 Buscar</button>
          </div>
        ) : (
          <div className="bg-gray-800 rounded-2xl p-5">
            <p className="text-5xl text-center mb-2">🎫</p>
            <p className="text-white text-5xl font-bold text-center tracking-widest">#{String(t.numero_ticket).padStart(3,"0")}</p>
            <div className="bg-gray-900 rounded-xl p-4 mt-4 space-y-1">
              <p className="text-white text-lg">📍 {t.ubicacion_exacta||"No especificada"}</p>
              <p className="text-lg" style={{color:t.sc}}>🅿️ {t.sn}</p>
              <p className={`text-lg font-bold ${t.estado_llave==="con_dueno"?"text-red-400 animate-pulse":"text-gray-300"}`}>🔑 {t.estado_llave==="con_dueno"?"⚠️ LLAVE CON EL DUEÑO":t.estado_llave==="colgada"?"Colgada":"En cajón"}</p>
              <p className="text-gray-400 text-sm">👤 {t.vn} · 🕐 {new Date(t.hora_entrada).toLocaleTimeString("es-ES",{hour:"2-digit",minute:"2-digit"})}</p>
            </div>
            {t.hist&&t.hist.length>0&&(
              <div className="mt-4">
                <p className="text-gray-300 text-sm font-semibold mb-2">📋 Recorrido:</p>
                <div className="space-y-1">{[...t.hist].map((m:any,i:number)=>(
                  <div key={i} className="bg-gray-900/70 rounded-lg p-2.5 text-xs flex items-center gap-2">
                    <span>{m.icon}</span><span className="text-gray-300 font-semibold">{m.label}</span><span className="text-gray-400">{m.vn}</span>
                    {m.det&&<span className="text-gray-500">— {m.det}</span>}
                    <span className="text-gray-600 ml-auto">{new Date(m.creado_en).toLocaleTimeString("es-ES",{hour:"2-digit",minute:"2-digit"})}</span>
                  </div>
                ))}</div>
              </div>
            )}
            <button onClick={ent} className="w-full mt-4 py-5 rounded-2xl text-white font-bold text-xl bg-gradient-to-r from-green-600 to-green-700 active:scale-95 shadow-lg">✅ CONFIRMAR ENTREGA</button>
          </div>
        )}
        {err&&<div className="bg-red-900/50 text-red-300 p-3 rounded-xl text-sm text-center">{err}</div>}
        {ok&&<div className="bg-green-900/50 text-green-300 p-3 rounded-xl text-sm text-center">{ok}</div>}
      </div>
    </div>
  );
}

"use client";
import { useState, useEffect, useRef } from "react";
const SB = "https://hzexxoazyhhvljqiummn.supabase.co", AK = "sb_publishable_ALyCDA4qM4T68YiecEQErQ_WoYNUfen";
const q = async (u: string) => { try { const r = await fetch(u, { headers: { apikey: AK, Authorization: `Bearer ${AK}` } }); return await r.json(); } catch { return null; } };
const H = {"Content-Type":"application/json"};
const B = "w-full py-5 rounded-2xl font-bold text-base bg-gray-700 text-white hover:bg-gray-600 active:scale-95 transition-all flex items-center justify-center gap-2";

export default function EntradaPage() {
  const [secs, setSecs] = useState<any[]>([]);
  const [sSel, setSSel] = useState("");
  const [ubi, setUbi] = useState("");
  const [llave, setLlave] = useState("");
  const [tCli, setTCli] = useState(false);
  const [tAuto, setTAuto] = useState(false);
  const [numT, setNumT] = useState("");
  const [pat, setPat] = useState("");
  const [mod, setMod] = useState("");
  const [col, setCol] = useState("");
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLInputElement>(null);
  const evId = typeof window !== 'undefined' ? localStorage.getItem("eventoActivoId") : null;
  const vId = typeof window !== 'undefined' ? localStorage.getItem("valetId") : null;

  useEffect(() => {
    q(`${SB}/rest/v1/sectores?select=id,nombre,capacidad,color_hex&activo=eq.true&order=orden`).then(async (d) => {
      if (Array.isArray(d)) {
        const w = await Promise.all(d.map(async (s:any) => {
          const t = await q(`${SB}/rest/v1/tickets?select=id&id_sector=eq.${s.id}&estado=eq.activo`);
          return {...s, activos: Array.isArray(t) ? t.length : 0};
        }));
        setSecs(w);
      }
    });
    if (evId) q(`${SB}/rest/v1/tickets?select=numero_ticket&id_evento=eq.${evId}&order=numero_ticket.desc&limit=1`).then(d => setNumT(String((Array.isArray(d)&&d.length?d[0].numero_ticket:0)+1)));
  }, []);

  const reg = async () => {
    setErr(""); setOk("");
    const n = parseInt(numT);
    if (!n||n<1) { setErr("Número inválido"); return; }
    if (!sSel) { setErr("Seleccioná sector"); return; }
    if (!llave) { setErr("Seleccioná llave"); return; }
    if (!evId||!vId) { setErr("No hay evento o sesión"); return; }
    const ex = await q(`${SB}/rest/v1/tickets?select=id&numero_ticket=eq.${n}&id_evento=eq.${evId}&estado=eq.activo`);
    if (Array.isArray(ex)&&ex.length) { setErr(`Ticket #${n} ya activo`); return; }
    setBusy(true);
    try {
      const p = pat.trim()?pat.toUpperCase().trim():`T-${n}`;
      let idV = "";
      const vd = await q(`${SB}/rest/v1/vehiculos?patente=eq.${encodeURIComponent(p)}`);
      if (Array.isArray(vd)&&vd.length) idV = vd[0].id;
      else {
        const r = await fetch(`${SB}/rest/v1/vehiculos`, {method:"POST",headers:{...H,apikey:AK,Authorization:`Bearer ${AK}`,Prefer:"return=representation"},body:JSON.stringify({patente:p,modelo:mod,color:col})});
        const d = await r.json();
        idV = Array.isArray(d)&&d.length?d[0].id:d?.id;
      }
      if (!idV) { setErr("Error al crear vehículo"); setBusy(false); return; }
      await fetch(`${SB}/rest/v1/tickets`, {method:"POST",headers:{...H,apikey:AK,Authorization:`Bearer ${AK}`,Prefer:"return=representation"},body:JSON.stringify({numero_ticket:n,id_evento:evId,id_vehiculo:idV,id_sector:sSel,ubicacion_exacta:ubi||"—",estado_llave:llave,id_valet_entrada:vId,estado:"activo",ticket_cliente_entregado:tCli,ticket_auto_colocado:tAuto})});
      setOk(`🎫 #${n} registrado!`);
      setTimeout(() => { setSSel("");setUbi("");setLlave("");setTCli(false);setTAuto(false);setPat("");setMod("");setCol("");setOk("");setNumT(String(n+1));ref.current?.focus(); }, 2000);
    } catch { setErr("Error"); }
    setBusy(false);
  };

  return (
    <div className="min-h-screen bg-gray-900 p-4 pb-8">
      <div className="flex items-center gap-3 mb-4"><button onClick={()=>window.location.href="/valet"} className="text-gray-400 text-3xl">←</button><h1 className="text-white text-xl font-bold">🚗 Entrada</h1></div>
      <div className="max-w-lg mx-auto space-y-3">
        <div className="bg-gray-800 rounded-2xl p-4 border-2 border-yellow-500/30">
          <p className="text-yellow-400 text-xs font-semibold mb-1">🎫 N° DE TICKET</p>
          <input ref={ref} type="text" value={numT} onChange={e=>setNumT(e.target.value.replace(/\D/g,''))} className="w-full bg-transparent text-white text-5xl font-bold text-center tracking-[0.3em] border-none focus:outline-none" />
        </div>
        <div>
          <p className="text-gray-300 text-xs mb-1.5 font-semibold">🔑 LLAVE *</p>
          <div className="grid grid-cols-3 gap-1.5">
            {[{k:"colgada",l:"COLGADA",e:"🔑",c:"bg-blue-600"},{k:"cajon",l:"CAJÓN",e:"📁",c:"bg-amber-600"},{k:"con_dueno",l:"DUEÑO",e:"👤",c:"bg-purple-600"}].map(({k,l,e,c})=>(
              <button key={k} onClick={()=>setLlave(k)} className={`py-4 rounded-2xl font-bold text-sm transition-all active:scale-95 ${llave===k?`${c} text-white shadow-lg ring-2 ring-white scale-105`:"bg-gray-800 text-gray-300 border border-gray-700"}`}>
                <span className="text-3xl block mb-1">{e}</span>{l}</button>
            ))}
          </div>
        </div>
        <div>
          <p className="text-gray-300 text-xs mb-1.5 font-semibold">🅿️ SECTOR *</p>
          <div className="grid grid-cols-2 gap-1.5">
            {secs.map((s:any)=>(
              <button key={s.id} onClick={()=>setSSel(s.id)} className={`py-4 px-3 rounded-2xl text-sm font-bold transition-all active:scale-95 ${sSel===s.id?"text-white shadow-lg scale-105 ring-2 ring-white":"border-2 border-gray-700"}`}
                style={{backgroundColor:sSel===s.id?s.color_hex:s.color_hex+"20",color:sSel===s.id?"#fff":s.color_hex}}>
                <span className="block font-bold text-base">{s.nombre}</span>
                <span className="text-xs opacity-80">{s.activos||0}/{s.capacidad}</span>
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="text-gray-400 text-xs">📍 Lugar <span className="text-gray-600">(opcional)</span></p>
          <input value={ubi} onChange={e=>setUbi(e.target.value)} className="w-full p-3 text-sm border-2 rounded-xl bg-white/10 border-gray-600 text-white mt-0.5" placeholder="Fila 3, Esp 12" />
        </div>
        <div className="bg-gray-800 rounded-xl p-3 border border-gray-700 space-y-1.5">
          <label className="flex items-center gap-2 text-white text-sm cursor-pointer"><input type="checkbox" checked={tCli} onChange={e=>setTCli(e.target.checked)} className="w-5 h-5 accent-blue-500" /> ✅ Ticket cliente</label>
          <label className="flex items-center gap-2 text-white text-sm cursor-pointer"><input type="checkbox" checked={tAuto} onChange={e=>setTAuto(e.target.checked)} className="w-5 h-5 accent-blue-500" /> 🏷️ Ticket colgante</label>
        </div>
        <div className="bg-gray-800/80 rounded-2xl p-4 border border-gray-700">
          <p className="text-gray-400 text-xs font-semibold mb-2">📋 Opcionales</p>
          <div className="grid grid-cols-3 gap-1.5 mb-2">
            <input value={pat} onChange={e=>setPat(e.target.value.toUpperCase())} className="w-full py-4 px-3 text-base rounded-xl bg-white/10 border border-gray-600 text-white text-center" placeholder="Patente" />
            <input value={mod} onChange={e=>setMod(e.target.value)} className="w-full py-4 px-3 text-base rounded-xl bg-white/10 border border-gray-600 text-white text-center" placeholder="Modelo" />
            <input value={col} onChange={e=>setCol(e.target.value)} className="w-full py-4 px-3 text-base rounded-xl bg-white/10 border border-gray-600 text-white text-center" placeholder="Color" />
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            <button type="button" className={B}><span className="text-2xl">📸</span> Foto</button>
            <button type="button" className={B+" bg-red-700 hover:bg-red-600"}><span className="text-2xl">🔧</span> Daños</button>
          </div>
        </div>
        {err&&<div className="bg-red-900/50 text-red-300 p-3 rounded-xl text-sm text-center">{err}</div>}
        {ok&&<div className="bg-green-900/50 text-green-300 p-3 rounded-xl text-sm text-center">{ok}</div>}
        <button onClick={reg} disabled={busy} className="w-full py-6 rounded-2xl text-white font-bold text-2xl shadow-lg active:scale-95 bg-gradient-to-r from-blue-600 to-blue-700 disabled:opacity-50">{busy?"⏳":"✅ REGISTRAR"}</button>
      </div>
    </div>
  );
}

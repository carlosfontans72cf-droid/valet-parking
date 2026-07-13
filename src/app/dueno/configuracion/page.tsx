"use client";
import { useState, useEffect } from "react";
const SB = "https://hzexxoazyhhvljqiummn.supabase.co", AK = "sb_publishable_ALyCDA4qM4T68YiecEQErQ_WoYNUfen";
const H = { "Content-Type": "application/json", apikey: AK, Authorization: `Bearer ${AK}` };
const q = async (u: string) => { try { const r = await fetch(u, { headers: H }); return await r.json(); } catch { return null; } };

export default function ConfigPage() {
  const [nomApp, setNomApp] = useState("Valet Parking");
  const [secs, setSecs] = useState<any[]>([]);
  const [vals, setVals] = useState<any[]>([]);
  const [edS, setEdS] = useState("");
  const [eNom, setENom] = useState("");
  const [eCap, setECap] = useState(0);
  const [eCol, setECol] = useState("");
  const [eOrd, setEOrd] = useState(0);
  const [nSec, setNSec] = useState("");
  const [nCap, setNCap] = useState(10);
  const [nCol, setNCol] = useState("#3498DB");
  const [nVNom, setNVNom] = useState("");
  const [nVPin, setNVPin] = useState("");
  const [nVNum, setNVNum] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => { cargar(); }, []);

  const cargar = async () => {
    const c = await q(`${SB}/rest/v1/configuracion_app?limit=1`);
    if (Array.isArray(c)&&c.length) setNomApp(c[0].nombre_app);
    const s = await q(`${SB}/rest/v1/sectores?select=*&order=orden`);
    if (Array.isArray(s)) setSecs(s);
    const v = await q(`${SB}/rest/v1/perfiles?select=*&order=numero_valet`);
    if (Array.isArray(v)) setVals(v);
  };

  const guardarNombre = async () => {
    const c = await q(`${SB}/rest/v1/configuracion_app?limit=1`);
    if (Array.isArray(c)&&c.length) {
      await fetch(`${SB}/rest/v1/configuracion_app?id=eq.${c[0].id}`, { method:"PATCH", headers:H, body:JSON.stringify({ nombre_app:nomApp }) });
      setMsg("✅ Guardado"); setTimeout(()=>setMsg(""),2000);
    }
  };

  const eliminarValetDef = async (id: string, nom: string) => {
    if (!confirm("⚠️ ELIMINAR PERMANENTEMENTE a " + nom + "?")) return;
    if (!confirm("Confirmación final: eliminar a " + nom + " del sistema?")) return;
    await fetch(SB + "/rest/v1/perfiles?id=eq." + id, { method:"DELETE", headers:{"apikey":AK,Authorization:"Bearer "+AK} });
    cargar(); setMsg("🗑️ " + nom + " eliminado"); setTimeout(()=>setMsg(""),3000);
  };

  const desactivarValet = async (id: string, nom: string) => {
    if (!confirm(`Desactivar a "${nom}"?`)) return;
    await fetch(`${SB}/rest/v1/perfiles?id=eq.${id}`, { method:"PATCH", headers:H, body:JSON.stringify({ activo:false }) });
    cargar(); setMsg(`🗑️ ${nom} desactivado`); setTimeout(()=>setMsg(""),3000);
  };

  const guardarSector = async (id: string) => {
    await fetch(`${SB}/rest/v1/sectores?id=eq.${id}`, { method:"PATCH", headers:H, body:JSON.stringify({ nombre:eNom, capacidad:eCap, color_hex:eCol, orden:eOrd }) });
    setEdS(""); cargar(); setMsg("✅ Sector actualizado"); setTimeout(()=>setMsg(""),2000);
  };

  const agregarSector = async () => {
    if (!nSec.trim()) return;
    await fetch(`${SB}/rest/v1/sectores`, { method:"POST", headers:{...H,Prefer:"return=representation"}, body:JSON.stringify({ nombre:nSec.trim(), capacidad:nCap, color_hex:nCol, orden:secs.length+1 }) });
    setNSec(""); cargar(); setMsg("✅ Sector agregado"); setTimeout(()=>setMsg(""),2000);
  };

  const eliminarSector = async (id: string, nom: string) => {
    if (!confirm(`Eliminar "${nom}"?`)) return;
    await fetch(`${SB}/rest/v1/sectores?id=eq.${id}`, { method:"PATCH", headers:H, body:JSON.stringify({ activo:false }) });
    cargar();
  };

  const agregarValet = async () => {
    if (!nVNom.trim()||!nVPin.trim()||!nVNum.trim()) return;
    await fetch(`${SB}/rest/v1/perfiles`, { method:"POST", headers:{...H,Prefer:"return=representation"}, body:JSON.stringify({ nombre:nVNom.trim(), numero_valet:parseInt(nVNum), pin:nVPin, rol:"valet" }) });
    setNVNom(""); setNVPin(""); setNVNum(""); cargar(); setMsg("✅ Valet creado"); setTimeout(()=>setMsg(""),3000);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={()=>window.location.href="/dueno"} className="text-gray-500 text-2xl">←</button>
        <h1 className="text-2xl font-bold text-gray-800">⚙️ Configuración</h1>
      </div>
      {msg&&<div className="bg-blue-100 text-blue-700 p-3 rounded-xl text-sm mb-4">{msg}</div>}

      <div className="bg-white rounded-2xl shadow p-4 mb-4">
        <h2 className="font-bold text-gray-700 mb-3">🏪 Nombre App</h2>
        <div className="flex gap-2">
          <input value={nomApp} onChange={e=>setNomApp(e.target.value)} className="w-full p-3 border-2 border-gray-200 rounded-xl" />
          <button onClick={guardarNombre} className="bg-blue-600 text-white px-4 py-2 rounded-xl font-semibold">💾</button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow p-4 mb-4">
        <h2 className="font-bold text-gray-700 mb-3">👤 Valets ({vals.filter((v:any)=>v.rol==="valet").length})</h2>
        <div className="space-y-2 mb-4">
          {vals.filter((v:any)=>v.rol==="valet").map((v:any) => (
            <div key={v.id} className={`border rounded-xl p-3 flex items-center justify-between ${v.activo===false?"border-red-200 bg-red-50":"border-gray-200"}`}>
              <div><p className="font-semibold text-gray-700">{v.nombre} #{v.numero_valet}</p><p className="text-xs text-gray-400">PIN: {v.pin||"—"} {v.activo===false?"· 🔴 Inactivo":""}</p></div>
              {v.activo!==false&&<><button onClick={()=>desactivarValet(v.id,v.nombre)} className="bg-red-100 text-red-600 px-2.5 py-1.5 rounded-lg text-xs font-semibold hover:bg-red-200">🚫 Desactivar</button><button onClick={()=>eliminarValetDef(v.id,v.nombre)} className="bg-red-100 text-red-600 px-2.5 py-1.5 rounded-lg text-xs font-semibold hover:bg-red-200 ml-1">🗑️</button></>}
            </div>
          ))}
        </div>
        <div className="p-4 bg-gray-100 rounded-xl">
          <p className="font-semibold text-gray-600 text-sm mb-2">➕ Agregar valet</p>
          <div className="grid grid-cols-3 gap-2 mb-2">
            <input value={nVNom} onChange={e=>setNVNom(e.target.value)} className="p-3 border-2 border-gray-200 rounded-xl text-sm" placeholder="Nombre" />
            <input type="number" value={nVNum} onChange={e=>setNVNum(e.target.value)} className="p-3 border-2 border-gray-200 rounded-xl text-sm" placeholder="N°" />
            <input value={nVPin} onChange={e=>setNVPin(e.target.value)} className="p-3 border-2 border-gray-200 rounded-xl text-sm" placeholder="PIN" maxLength={6} />
          </div>
          <button onClick={agregarValet} disabled={!nVNom.trim()||!nVPin.trim()||!nVNum.trim()} className="bg-blue-600 text-white w-full py-3 rounded-xl font-semibold disabled:opacity-50">➕ Agregar</button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow p-4 mb-4">
        <h2 className="font-bold text-gray-700 mb-3">🅿️ Sectores ({secs.length})</h2>
        <div className="space-y-2 mb-4">
          {secs.map((s:any) => (
            <div key={s.id} className="border border-gray-200 rounded-xl p-3">
              {edS===s.id ? (
                <div className="space-y-2">
                  <input value={eNom} onChange={e=>setENom(e.target.value)} className="w-full p-2 border rounded-lg text-sm" />
                  <div className="grid grid-cols-3 gap-2">
                    <input type="number" value={eCap} onChange={e=>setECap(parseInt(e.target.value))} className="p-2 border rounded-lg text-sm" />
                    <input type="color" value={eCol} onChange={e=>setECol(e.target.value)} className="h-10 rounded-lg cursor-pointer" />
                    <input type="number" value={eOrd} onChange={e=>setEOrd(parseInt(e.target.value))} className="p-2 border rounded-lg text-sm" />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={()=>guardarSector(s.id)} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm flex-1">💾</button>
                    <button onClick={()=>setEdS("")} className="bg-gray-400 text-white px-4 py-2 rounded-lg text-sm">Cancelar</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full" style={{backgroundColor:s.color_hex}} />
                  <div className="flex-1"><p className="font-semibold text-gray-700">{s.nombre}</p><p className="text-xs text-gray-400">Cap:{s.capacidad}</p></div>
                  <button onClick={()=>{setEdS(s.id);setENom(s.nombre);setECap(s.capacidad);setECol(s.color_hex);setEOrd(s.orden);}} className="text-blue-600 text-sm font-semibold">Editar</button>
                  <button onClick={()=>eliminarSector(s.id,s.nombre)} className="text-red-500 text-sm">🗑️</button>
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="p-4 bg-gray-100 rounded-xl">
          <p className="font-semibold text-gray-600 text-sm mb-2">➕ Agregar sector</p>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <input value={nSec} onChange={e=>setNSec(e.target.value)} className="p-3 border-2 border-gray-200 rounded-xl text-sm" placeholder="Nombre" />
            <input type="number" value={nCap} onChange={e=>setNCap(parseInt(e.target.value)||0)} className="p-3 border-2 border-gray-200 rounded-xl text-sm" placeholder="Capacidad" />
          </div>
          <div className="flex gap-2">
            <input type="color" value={nCol} onChange={e=>setNCol(e.target.value)} className="h-11 w-20 rounded-xl cursor-pointer" />
            <button onClick={agregarSector} disabled={!nSec.trim()} className="bg-blue-600 text-white flex-1 py-3 rounded-xl font-semibold disabled:opacity-50">➕ Agregar</button>
          </div>
        </div>
      </div>
    </div>
  );
}

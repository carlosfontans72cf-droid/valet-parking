"use client";
export const dynamic = 'force-dynamic';
import { useState, useEffect } from "react";

const SB = "https://hzexxoazyhhvljqiummn.supabase.co";
const AK = "sb_publishable_ALyCDA4qM4T68YiecEQErQ_WoYNUfen";
const H = { apikey: AK, Authorization: `Bearer ${AK}` };

async function get(path: string) {
  try { const r = await fetch(`${SB}/rest/v1/${path}`, { headers: H }); const t = await r.text(); return t && t !== "[]" ? JSON.parse(t) : []; } catch { return []; }
}
async function doFetch(url: string, method: string, data?: any) { await fetch(url, { method, headers: { ...H, "Content-Type": "application/json" }, body: data ? JSON.stringify(data) : undefined }); }

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
  const [aNom, setANom] = useState("");
  const [aPin, setAPin] = useState("");
  const [aNum, setANum] = useState("");
  const [msg, setMsg] = useState("");

  const load = async () => {
    const c = await get("configuracion_app?select=nombre_app");
    if (c.length) setNomApp(c[0].nombre_app);
    const s = await get("sectores?select=*&order=orden");
    if (s.length) setSecs(s);
    const v = await get("perfiles?select=*&order=numero_valet");
    if (v.length) setVals(v);
  };

  useEffect(() => { load(); }, []);

  const saveNombre = async () => {
    const c = await get("configuracion_app?select=id");
    if (c.length) { await doFetch(`${SB}/rest/v1/configuracion_app?id=eq.${c[0].id}`, "PATCH", { nombre_app: nomApp }); setMsg("Guardado"); setTimeout(() => setMsg(""), 2000); }
  };

  const actValet = async (id: string, nom: string, a: string) => {
    if (a === "del" && (!confirm("Eliminar a " + nom + "?") || !confirm("Confirmar?"))) return;
    if (a === "des" && !confirm("Desactivar a " + nom + "?")) return;
    if (a === "del") await doFetch(`${SB}/rest/v1/perfiles?id=eq.${id}`, "DELETE");
    else if (a === "des") await doFetch(`${SB}/rest/v1/perfiles?id=eq.${id}`, "PATCH", { activo: false });
    else await doFetch(`${SB}/rest/v1/perfiles?id=eq.${id}`, "PATCH", { activo: true });
    load();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4" style={{ maxWidth: 640, margin: "0 auto" }}>
      <button onClick={() => window.history.back()} className="text-2xl mb-4">{"<"}</button>
      <h1 className="text-2xl font-bold mb-4">Configuracion</h1>
      {msg && <div className="bg-blue-100 text-blue-700 p-3 rounded-xl text-sm mb-4">{msg}</div>}

      <div className="bg-white rounded-2xl shadow p-4 mb-4">
        <h2 className="font-bold mb-3">Nombre App</h2>
        <div className="flex gap-2"><input value={nomApp} onChange={e => setNomApp(e.target.value)} className="w-full p-3 border rounded-xl" /><button onClick={saveNombre} className="bg-blue-600 text-white px-4 py-2 rounded-xl">Guardar</button></div>
      </div>

      <div className="bg-white rounded-2xl shadow p-4 mb-4">
        <h2 className="font-bold mb-3">Valets ({vals.filter((v: any) => v.rol === "valet").length})</h2>
        {vals.filter((v: any) => v.rol === "valet").map((v: any) => (
          <div key={v.id} className="border rounded-xl p-3 mb-2 flex items-center justify-between">
            <div><p className="font-semibold">{v.nombre} #{v.numero_valet}</p><p className="text-xs text-gray-400">PIN: {v.pin || ""}</p></div>
            <div className="flex gap-1">{v.activo !== false && <button onClick={() => actValet(v.id, v.nombre, "des")} className="bg-red-100 text-red-600 px-2 py-1 rounded-lg text-xs">Desactivar</button>}
              {v.activo === false && <button onClick={() => actValet(v.id, v.nombre, "rea")} className="bg-green-100 text-green-700 px-2 py-1 rounded-lg text-xs">Reactivar</button>}
              <button onClick={() => actValet(v.id, v.nombre, "del")} className="bg-red-100 text-red-600 px-2 py-1 rounded-lg text-xs">Eliminar</button></div>
          </div>
        ))}
        <div className="bg-gray-100 rounded-xl p-4">
          <p className="font-semibold text-sm mb-2">Agregar valet</p>
          <div className="grid grid-cols-3 gap-2 mb-2">
            <input value={nVNom} onChange={e => setNVNom(e.target.value)} className="p-3 border rounded-xl text-sm" placeholder="Nombre" />
            <input type="number" value={nVNum} onChange={e => setNVNum(e.target.value)} className="p-3 border rounded-xl text-sm" placeholder="N" />
            <input value={nVPin} onChange={e => setNVPin(e.target.value)} className="p-3 border rounded-xl text-sm" placeholder="PIN" maxLength={6} />
          </div>
          <button onClick={async () => { if (!nVNom.trim() || !nVPin.trim()) return; await doFetch(`${SB}/rest/v1/perfiles`, "POST", { nombre: nVNom.trim(), numero_valet: parseInt(nVNum) || 0, pin: nVPin, rol: "valet" }); setNVNom(""); setNVPin(""); setNVNum(""); load(); setMsg("Creado"); setTimeout(() => setMsg(""), 2000); }} className="bg-blue-600 text-white w-full py-3 rounded-xl font-semibold">Agregar Valet</button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow p-4 mb-4">
        <h2 className="font-bold mb-3">Admins ({vals.filter((v: any) => v.rol === "supervisor").length})</h2>
        {vals.filter((v: any) => v.rol === "supervisor").map((v: any) => (
          <div key={v.id} className="border rounded-xl p-3 mb-2 flex items-center justify-between">
            <p className="font-semibold">{v.nombre}</p>
            <button onClick={() => actValet(v.id, v.nombre, "del")} className="bg-red-100 text-red-600 px-2 py-1 rounded-lg text-xs">Eliminar</button>
          </div>
        ))}
        <div className="bg-gray-100 rounded-xl p-4">
          <p className="font-semibold text-sm mb-2">Agregar Admin</p>
          <div className="grid grid-cols-3 gap-2 mb-2">
            <input value={aNom} onChange={e => setANom(e.target.value)} className="p-3 border rounded-xl text-sm" placeholder="Nombre" />
            <input type="number" value={aNum} onChange={e => setANum(e.target.value)} className="p-3 border rounded-xl text-sm" placeholder="N" />
            <input value={aPin} onChange={e => setAPin(e.target.value)} className="p-3 border rounded-xl text-sm" placeholder="PIN" maxLength={6} />
          </div>
          <button onClick={async () => { if (!aNom.trim() || !aPin.trim()) return; await doFetch(`${SB}/rest/v1/perfiles`, "POST", { nombre: aNom.trim(), numero_valet: parseInt(aNum) || 0, pin: aPin, rol: "supervisor" }); setANom(""); setAPin(""); setANum(""); load(); setMsg("Admin creado"); setTimeout(() => setMsg(""), 2000); }} className="bg-green-600 text-white w-full py-3 rounded-xl font-semibold">Agregar Admin</button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow p-4 mb-4">
        <h2 className="font-bold mb-3">Sectores ({secs.length})</h2>
        {secs.map((s: any) => (
          <div key={s.id} className="border rounded-xl p-3 mb-2">
            {edS === s.id ? (
              <div className="space-y-2">
                <div className="grid grid-cols-3 gap-2">
                  <input value={eNom} onChange={e => setENom(e.target.value)} className="p-2 border rounded-lg text-sm" />
                  <input type="number" value={eCap} onChange={e => setECap(parseInt(e.target.value))} className="p-2 border rounded-lg text-sm" />
                  <input type="color" value={eCol} onChange={e => setECol(e.target.value)} className="h-10 rounded-lg cursor-pointer" />
                </div>
                <button onClick={async () => { await doFetch(`${SB}/rest/v1/sectores?id=eq.${s.id}`, "PATCH", { nombre: eNom, capacidad: eCap, color_hex: eCol }); setEdS(""); load(); }} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm">Guardar</button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full" style={{ backgroundColor: s.color_hex }} />
                <span className="flex-1 font-semibold">{s.nombre} ({s.capacidad})</span>
                <button onClick={() => { setEdS(s.id); setENom(s.nombre); setECap(s.capacidad); setECol(s.color_hex); }} className="text-blue-600 text-sm">Editar</button>
                <button onClick={() => doFetch(`${SB}/rest/v1/sectores?id=eq.${s.id}`, "PATCH", { activo: !s.activo }).then(load)} className={`text-sm ${s.activo ? "text-red-500" : "text-green-600"}`}>{s.activo ? "Desactivar" : "Activar"}</button>
                <button onClick={() => { if (confirm("Eliminar?")) doFetch(`${SB}/rest/v1/sectores?id=eq.${s.id}`, "DELETE").then(load); }} className="text-red-500 text-sm">Eliminar</button>
              </div>
            )}
          </div>
        ))}
        <div className="bg-gray-100 rounded-xl p-4">
          <p className="font-semibold text-sm mb-2">Agregar sector</p>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <input value={nSec} onChange={e => setNSec(e.target.value)} className="p-3 border rounded-xl text-sm" placeholder="Nombre" />
            <input type="number" value={nCap} onChange={e => setNCap(parseInt(e.target.value) || 0)} className="p-3 border rounded-xl text-sm" placeholder="Capacidad" />
          </div>
          <div className="flex gap-2">
            <input type="color" value={nCol} onChange={e => setNCol(e.target.value)} className="h-11 w-20 rounded-xl cursor-pointer" />
            <button onClick={async () => { if (!nSec.trim()) return; await doFetch(`${SB}/rest/v1/sectores`, "POST", { nombre: nSec.trim(), capacidad: nCap, color_hex: nCol, orden: secs.length + 1 }); setNSec(""); load(); }} className="bg-blue-600 text-white flex-1 py-3 rounded-xl font-semibold">Agregar</button>
          </div>
        </div>
      </div>
    </div>
  );
}
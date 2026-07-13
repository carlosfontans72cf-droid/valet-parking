"use client";
export const dynamic = 'force-dynamic';
import { useState, useEffect } from "react";
const SB = "https://hzexxoazyhhvljqiummn.supabase.co", AK = "sb_publishable_ALyCDA4qM4T68YiecEQErQ_WoYNUfen";
const BH = { apikey: AK, Authorization: `Bearer ${AK}`, "Content-Type": "application/json" };
const GH = { apikey: AK, Authorization: `Bearer ${AK}` };

export default function ConfigPage() {
  const [nomApp, setNomApp] = useState("Valet Parking");
  const [secs, setSecs] = useState<any[]>([]);
  const [vals, setVals] = useState<any[]>([]);
  const [edS, setEdS] = useState("");
  const [eNom, setENom] = useState("");
  const [eCap, setECap] = useState(0);
  const [eCol, setECol] = useState("");
  const [nSec, setNSec] = useState("");
  const [nCap, setNCap] = useState(10);
  const [nCol, setNCol] = useState("#3498DB");
  const [nVNom, setNVNom] = useState("");
  const [nVPin, setNVPin] = useState("");
  const [nVNum, setNVNum] = useState("");
  const [aNom, setANom] = useState("");
  const [aPin, setAPin] = useState("");
  const [msg, setMsg] = useState("");

  const load = async () => {
    try {
      const c = await (await fetch(`${SB}/rest/v1/configuracion_app?select=nombre_app&limit=1`, { headers: GH })).json();
      if (c?.length) setNomApp(c[0].nombre_app || "Valet Parking");
    } catch {}
    try { const s = await (await fetch(`${SB}/rest/v1/sectores?select=*&order=orden`, { headers: GH })).json(); if (s?.length) setSecs(s); } catch {}
    try { const v = await (await fetch(`${SB}/rest/v1/perfiles?select=*&order=numero_valet`, { headers: GH })).json(); if (v?.length) setVals(v); } catch {}
  };

  useEffect(() => { load(); }, []);

  const showMsg = (t: string) => { setMsg(t); setTimeout(() => setMsg(""), 2000); };

  return (
    <div className="min-h-screen bg-gray-50 p-4" style={{ maxWidth: 640, margin: "0 auto" }}>
      <button onClick={() => window.history.back()} className="text-2xl mb-4">{"<"}</button>
      <h1 className="text-2xl font-bold mb-4">Config</h1>
      {msg && <div className="bg-blue-100 text-blue-700 p-3 rounded-xl text-sm mb-4">{msg}</div>}

      <div className="bg-white rounded-2xl shadow p-4 mb-4">
        <h2 className="font-bold mb-3">App</h2>
        <div className="flex gap-2">
          <input value={nomApp} onChange={e => setNomApp(e.target.value)} className="w-full p-3 border rounded-xl" />
          <button onClick={async () => {
            try {
              const c = await (await fetch(`${SB}/rest/v1/configuracion_app?select=id&limit=1`, { headers: GH })).json();
              if (c?.length) await fetch(`${SB}/rest/v1/configuracion_app?id=eq.${c[0].id}`, { method: "PATCH", headers: BH, body: JSON.stringify({ nombre_app: nomApp }) });
              showMsg("Guardado");
            } catch { showMsg("Error"); }
          }} className="bg-blue-600 text-white px-4 py-2 rounded-xl">Guardar</button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow p-4 mb-4">
        <h2 className="font-bold mb-3">Valets ({vals.filter(v => v.rol === "valet").length})</h2>
        {vals.filter(v => v.rol === "valet").map(v => (
          <div key={v.id} className="border rounded-xl p-3 mb-2 flex items-center justify-between">
            <div><p className="font-semibold">{v.nombre} #{v.numero_valet}</p><p className="text-xs text-gray-400">PIN: {v.pin || ""} {v.activo === false ? "(Inactivo)" : ""}</p></div>
            <div className="flex gap-1">
              {v.activo !== false && <button onClick={async () => { await fetch(`${SB}/rest/v1/perfiles?id=eq.${v.id}`, { method: "PATCH", headers: BH, body: JSON.stringify({ activo: false }) }); load(); }} className="bg-red-100 text-red-600 px-2 py-1 rounded-lg text-xs">Desactivar</button>}
              {v.activo === false && <button onClick={async () => { await fetch(`${SB}/rest/v1/perfiles?id=eq.${v.id}`, { method: "PATCH", headers: BH, body: JSON.stringify({ activo: true }) }); load(); }} className="bg-green-100 text-green-700 px-2 py-1 rounded-lg text-xs">Reactivar</button>}
              <button onClick={async () => { if (!confirm("Eliminar?")) return; if (!confirm("Confirmar?")) return; await fetch(`${SB}/rest/v1/perfiles?id=eq.${v.id}`, { method: "DELETE", headers: GH }); load(); showMsg("Eliminado"); }} className="bg-red-100 text-red-600 px-2 py-1 rounded-lg text-xs">Eliminar</button>
            </div>
          </div>
        ))}
        <div className="bg-gray-100 rounded-xl p-4">
          <p className="font-semibold text-sm mb-2">Agregar Valet</p>
          <div className="grid grid-cols-3 gap-2 mb-2">
            <input value={nVNom} onChange={e => setNVNom(e.target.value)} className="p-3 border rounded-xl text-sm" placeholder="Nombre" />
            <input type="number" value={nVNum} onChange={e => setNVNum(e.target.value)} className="p-3 border rounded-xl text-sm" placeholder="N" />
            <input value={nVPin} onChange={e => setNVPin(e.target.value)} className="p-3 border rounded-xl text-sm" placeholder="PIN" maxLength={6} />
          </div>
          <button onClick={async () => {
            if (!nVNom.trim() || !nVPin.trim()) return;
            await fetch(`${SB}/rest/v1/perfiles`, { method: "POST", headers: BH, body: JSON.stringify({ nombre: nVNom.trim(), numero_valet: parseInt(nVNum) || 0, pin: nVPin, rol: "valet" }) });
            setNVNom(""); setNVPin(""); setNVNum(""); load(); showMsg("Valet creado");
          }} className="bg-blue-600 text-white w-full py-3 rounded-xl font-semibold">Agregar Valet</button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow p-4 mb-4">
        <h2 className="font-bold mb-3">Admins ({vals.filter(v => v.rol === "supervisor").length})</h2>
        {vals.filter(v => v.rol === "supervisor").map(v => (
          <div key={v.id} className="border rounded-xl p-3 mb-2 flex items-center justify-between">
            <p className="font-semibold">{v.nombre}</p>
            <button onClick={async () => { if (!confirm("Eliminar?") || !confirm("Confirmar?")) return; await fetch(`${SB}/rest/v1/perfiles?id=eq.${v.id}`, { method: "DELETE", headers: GH }); load(); }} className="bg-red-100 text-red-600 px-2 py-1 rounded-lg text-xs">Eliminar</button>
          </div>
        ))}
        <div className="bg-gray-100 rounded-xl p-4">
          <p className="font-semibold text-sm mb-2">Agregar Admin</p>
          <div className="grid grid-cols-3 gap-2 mb-2">
            <input value={aNom} onChange={e => setANom(e.target.value)} className="p-3 border rounded-xl text-sm" placeholder="Nombre" />
            <input type="hidden" />
            <input value={aPin} onChange={e => setAPin(e.target.value)} className="p-3 border rounded-xl text-sm" placeholder="PIN" maxLength={6} />
          </div>
          <button onClick={async () => {
            if (!aNom.trim() || !aPin.trim()) return;
            try {
              const res = await fetch(`${SB}/rest/v1/perfiles`, { method: "POST", headers: BH, body: JSON.stringify({ nombre: aNom.trim(), numero_valet: 0, pin: aPin, rol: "supervisor" }) });
              const txt = await res.text();
              if (res.ok) { setANom(""); setAPin(""); load(); showMsg("Admin creado"); }
              else showMsg("Error: " + txt.substring(0, 50));
            } catch (e: any) { showMsg("Error: " + e.message); }
          }} className="bg-green-600 text-white w-full py-3 rounded-xl font-semibold">Agregar Admin</button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow p-4 mb-4">
        <h2 className="font-bold mb-3">Sectores ({secs.length})</h2>
        {secs.map(s => (
          <div key={s.id} className="border rounded-xl p-3 mb-2">
            {edS === s.id ? (
              <div className="space-y-2">
                <div className="grid grid-cols-3 gap-2">
                  <input value={eNom} onChange={e => setENom(e.target.value)} className="p-2 border rounded-lg text-sm" />
                  <input type="number" value={eCap} onChange={e => setECap(parseInt(e.target.value))} className="p-2 border rounded-lg text-sm" />
                  <input type="color" value={eCol} onChange={e => setECol(e.target.value)} className="h-10 rounded-lg cursor-pointer" />
                </div>
                <button onClick={async () => { await fetch(`${SB}/rest/v1/sectores?id=eq.${s.id}`, { method: "PATCH", headers: BH, body: JSON.stringify({ nombre: eNom, capacidad: eCap, color_hex: eCol }) }); setEdS(""); load(); }} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm">Guardar</button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full flex-shrink-0" style={{ backgroundColor: s.color_hex }} />
                <span className="flex-1 font-semibold">{s.nombre} ({s.capacidad})</span>
                <button onClick={() => { setEdS(s.id); setENom(s.nombre); setECap(s.capacidad); setECol(s.color_hex); }} className="text-blue-600 text-sm">Editar</button>
                <button onClick={async () => { await fetch(`${SB}/rest/v1/sectores?id=eq.${s.id}`, { method: "PATCH", headers: BH, body: JSON.stringify({ activo: !s.activo }) }); load(); }} className={`text-sm ${s.activo ? "text-red-500" : "text-green-600"}`}>{s.activo ? "Desactivar" : "Activar"}</button>
                <button onClick={async () => { if (!confirm("Eliminar?")) return; await fetch(`${SB}/rest/v1/sectores?id=eq.${s.id}`, { method: "DELETE", headers: GH }); load(); }} className="text-red-500 text-sm">Eliminar</button>
              </div>
            )}
          </div>
        ))}
        <div className="bg-gray-100 rounded-xl p-4">
          <p className="font-semibold text-sm mb-2">Agregar sector</p>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <input value={nSec} onChange={e => setNSec(e.target.value)} className="p-3 border rounded-xl text-sm" placeholder="Nombre" />
            <input type="number" value={nCap} onChange={e => setNCap(parseInt(e.target.value) || 0)} className="p-3 border rounded-xl text-sm" placeholder="Cap" />
          </div>
          <div className="flex gap-2">
            <input type="color" value={nCol} onChange={e => setNCol(e.target.value)} className="h-11 w-20 rounded-xl cursor-pointer" />
            <button onClick={async () => {
              if (!nSec.trim()) return;
              await fetch(`${SB}/rest/v1/sectores`, { method: "POST", headers: BH, body: JSON.stringify({ nombre: nSec.trim(), capacidad: nCap, color_hex: nCol, orden: secs.length + 1 }) });
              setNSec(""); load(); showMsg("Creado");
            }} className="bg-blue-600 text-white flex-1 py-3 rounded-xl font-semibold">Agregar</button>
          </div>
        </div>
      </div>
    </div>
  );
}
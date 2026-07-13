"use client";
export const dynamic = 'force-dynamic';
import { useState, useEffect } from "react";

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

  // Use proxy to avoid CORS
  const get = async (path: string) => {
    try { const r = await fetch("/api/db?path=" + encodeURIComponent(path)); const t = await r.text(); return t && t !== "[]" ? JSON.parse(t) : []; } catch { return []; }
  };
  const save = async (path: string, method: string, data?: any) => {
    await fetch("/api/db", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ path, method, data }) });
  };

  const load = async () => {
    const c = await get("configuracion_app?select=nombre_app&limit=1");
    if (c.length) setNomApp(c[0].nombre_app || "Valet Parking");
    const s = await get("sectores?select=*&order=orden");
    if (s.length) setSecs(s);
    const v = await get("perfiles?select=*&order=numero_valet");
    if (v.length) setVals(v);
  };

  useEffect(() => { load(); }, []);

  const sm = (t: string) => { setMsg(t); setTimeout(() => setMsg(""), 2000); };

  return (
    <div className="min-h-screen bg-gray-50 p-4" style={{ maxWidth: 640, margin: "0 auto" }}>
      <button onClick={() => window.history.back()} className="text-2xl mb-4">{"<"}</button>
      <h1 className="text-2xl font-bold mb-4">Config</h1>
      {msg && <div className="bg-blue-100 text-blue-700 p-3 rounded-xl text-sm mb-4">{msg}</div>}

      <div className="bg-white rounded-2xl shadow p-4 mb-4">
        <h2 className="font-bold mb-3">App</h2>
        <div className="flex gap-2">
          <input value={nomApp} onChange={e => setNomApp(e.target.value)} className="w-full p-3 border rounded-xl" />
          <button onClick={async () => { const c = await get("configuracion_app?select=id&limit=1"); if (c.length) { await save("configuracion_app?id=eq." + c[0].id, "PATCH", { nombre_app: nomApp }); sm("Guardado"); } }} className="bg-blue-600 text-white px-4 py-2 rounded-xl">Guardar</button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow p-4 mb-4">
        <h2 className="font-bold mb-3">Valets ({vals.filter((v: any) => v.rol === "valet").length})</h2>
        {vals.filter((v: any) => v.rol === "valet").map((v: any) => (
          <div key={v.id} className="border rounded-xl p-3 mb-2 flex items-center justify-between">
            <div><p className="font-semibold">{v.nombre} #{v.numero_valet}</p><p className="text-xs">{v.pin || ""} {v.activo === false ? "(Inactivo)" : ""}</p></div>
            <div className="flex gap-1">
              {v.activo !== false && <button onClick={async () => { await save("perfiles?id=eq." + v.id, "PATCH", { activo: false }); load(); }} className="bg-red-100 text-red-600 px-2 py-1 rounded-lg text-xs">Desactivar</button>}
              {v.activo === false && <button onClick={async () => { await save("perfiles?id=eq." + v.id, "PATCH", { activo: true }); load(); }} className="bg-green-100 text-green-700 px-2 py-1 rounded-lg text-xs">Reactivar</button>}
              <button onClick={async () => { if (!confirm("Eliminar?") || !confirm("Confirmar?")) return; await save("perfiles?id=eq." + v.id, "DELETE"); load(); }} className="bg-red-100 text-red-600 px-2 py-1 rounded-lg text-xs">Eliminar</button>
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
          <button onClick={async () => { if (!nVNom.trim() || !nVPin.trim()) return; await save("perfiles", "POST", { nombre: nVNom.trim(), numero_valet: parseInt(nVNum) || 0, pin: nVPin, rol: "valet" }); setNVNom(""); setNVPin(""); setNVNum(""); load(); sm("Creado"); }} className="bg-blue-600 text-white w-full py-3 rounded-xl font-semibold">Agregar Valet</button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow p-4 mb-4">
        <h2 className="font-bold mb-3">Admins ({vals.filter((v: any) => v.rol === "supervisor").length})</h2>
        {vals.filter((v: any) => v.rol === "supervisor").map((v: any) => (
          <div key={v.id} className="border rounded-xl p-3 mb-2 flex items-center justify-between">
            <p className="font-semibold">{v.nombre}</p>
            <button onClick={async () => { if (!confirm("Eliminar?") || !confirm("Confirmar?")) return; await save("perfiles?id=eq." + v.id, "DELETE"); load(); }} className="bg-red-100 text-red-600 px-2 py-1 rounded-lg text-xs">Eliminar</button>
          </div>
        ))}
        <div className="bg-gray-100 rounded-xl p-4">
          <p className="font-semibold text-sm mb-2">Agregar Admin</p>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <input value={aNom} onChange={e => setANom(e.target.value)} className="p-3 border rounded-xl text-sm" placeholder="Nombre" />
            <input value={aPin} onChange={e => setAPin(e.target.value)} className="p-3 border rounded-xl text-sm" placeholder="PIN" maxLength={6} />
          </div>
          <button onClick={async () => {
            if (!aNom.trim() || !aPin.trim()) return;
            await save("perfiles", "POST", { nombre: aNom.trim(), numero_valet: 0, pin: aPin, rol: "supervisor" });
            setANom(""); setAPin(""); load(); sm("Admin creado");
          }} className="bg-green-600 text-white w-full py-3 rounded-xl font-semibold">Agregar Admin</button>
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
                <button onClick={async () => { await save("sectores?id=eq." + s.id, "PATCH", { nombre: eNom, capacidad: eCap, color_hex: eCol }); setEdS(""); load(); }} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm">Guardar</button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full flex-shrink-0" style={{ backgroundColor: s.color_hex }} />
                <span className="flex-1 font-semibold">{s.nombre} ({s.capacidad})</span>
                <button onClick={() => { setEdS(s.id); setENom(s.nombre); setECap(s.capacidad); setECol(s.color_hex); }} className="text-blue-600 text-sm">Editar</button>
                <button onClick={async () => { await save("sectores?id=eq." + s.id, "PATCH", { activo: !s.activo }); load(); }} className={`text-sm ${s.activo ? "text-red-500" : "text-green-600"}`}>{s.activo ? "Desactivar" : "Activar"}</button>
                <button onClick={async () => { if (confirm("Eliminar?")) { await save("sectores?id=eq." + s.id, "DELETE"); load(); } }} className="text-red-500 text-sm">Eliminar</button>
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
            <button onClick={async () => { if (!nSec.trim()) return; await save("sectores", "POST", { nombre: nSec.trim(), capacidad: nCap, color_hex: nCol, orden: secs.length + 1 }); setNSec(""); load(); }} className="bg-blue-600 text-white flex-1 py-3 rounded-xl font-semibold">Agregar</button>
          </div>
        </div>
      </div>
    </div>
  );
}
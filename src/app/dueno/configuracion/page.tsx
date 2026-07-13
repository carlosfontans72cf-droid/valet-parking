"use client";
import { useState, useEffect } from "react";

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

  useEffect(() => { cargar(); }, []);

  // Internal proxy API calls
  const api = async (path: string, opts?: any) => {
    try {
      const res = await fetch("/api/db?path=" + encodeURIComponent(path), opts);
      const txt = await res.text();
      if (!txt || txt === "[]") return [];
      try { return JSON.parse(txt); } catch { return []; }
    } catch { return []; }
  };

  const apiWrite = async (path: string, method: string, data?: any) => {
    await fetch("/api/db", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path, method, data }),
    });
  };

  const cargar = async () => {
    const c = await api("configuracion_app?select=nombre_app");
    if (c && c.length) setNomApp(c[0].nombre_app || "Valet Parking");
    const s = await api("sectores?select=*&order=orden");
    if (Array.isArray(s)) setSecs(s);
    const v = await api("perfiles?select=*&order=numero_valet");
    if (Array.isArray(v)) setVals(v);
  };

  const guardarNombre = async () => {
    const c = await api("configuracion_app?select=id&limit=1");
    if (c && c.length) {
      await apiWrite("configuracion_app?id=eq." + c[0].id, "PATCH", { nombre_app: nomApp });
      setMsg("Guardado"); setTimeout(() => setMsg(""), 2000);
    }
  };

  const toggleValet = async (id: string, nom: string, accion: string) => {
    if (accion === "desactivar" && !confirm("Desactivar a " + nom + "?")) return;
    if (accion === "eliminar") {
      if (!confirm("ELIMINAR a " + nom + "?")) return;
      if (!confirm("Confirmacion final?")) return;
      await apiWrite("perfiles?id=eq." + id, "DELETE");
      setMsg("Eliminado"); setTimeout(() => setMsg(""), 2000);
    } else if (accion === "desactivar") {
      await apiWrite("perfiles?id=eq." + id, "PATCH", { activo: false });
    } else {
      await apiWrite("perfiles?id=eq." + id, "PATCH", { activo: true });
    }
    cargar();
  };

  const guardarSector = async (id: string) => {
    await apiWrite("sectores?id=eq." + id, "PATCH", { nombre: eNom, capacidad: eCap, color_hex: eCol, orden: eOrd });
    setEdS(""); cargar(); setMsg("Guardado"); setTimeout(() => setMsg(""), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 max-w-4xl mx-auto">
      <button onClick={() => window.history.back()} className="text-gray-500 text-2xl mb-4 block">{"<"}</button>
      <h1 className="text-2xl font-bold text-gray-800 mb-4">Configuraci&oacute;n</h1>
      {msg && <div className="bg-blue-100 text-blue-700 p-3 rounded-xl text-sm mb-4">{msg}</div>}

      <div className="bg-white rounded-2xl shadow p-4 mb-4">
        <h2 className="font-bold text-gray-700 mb-3">Nombre App</h2>
        <div className="flex gap-2">
          <input value={nomApp} onChange={e => setNomApp(e.target.value)} className="w-full p-3 border-2 border-gray-200 rounded-xl" />
          <button onClick={guardarNombre} className="bg-blue-600 text-white px-4 py-2 rounded-xl font-semibold">Guardar</button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow p-4 mb-4">
        <h2 className="font-bold text-gray-700 mb-3">Valets ({vals.filter((v: any) => v.rol === "valet").length})</h2>
        {vals.filter((v: any) => v.rol === "valet").map((v: any) => (
          <div key={v.id} className="border rounded-xl p-3 mb-2 flex items-center justify-between">
            <div><p className="font-semibold">{v.nombre} #{v.numero_valet}</p><p className="text-xs text-gray-400">PIN: {v.pin || ""}</p></div>
            <div className="flex gap-1">
              {v.activo !== false && <button onClick={() => toggleValet(v.id, v.nombre, "desactivar")} className="bg-red-100 text-red-600 px-2 py-1 rounded-lg text-xs">Desactivar</button>}
              {v.activo === false && <button onClick={() => toggleValet(v.id, v.nombre, "reactivar")} className="bg-green-100 text-green-700 px-2 py-1 rounded-lg text-xs">Reactivar</button>}
              <button onClick={() => toggleValet(v.id, v.nombre, "eliminar")} className="bg-red-100 text-red-600 px-2 py-1 rounded-lg text-xs">Eliminar</button>
            </div>
          </div>
        ))}
        <div className="p-4 bg-gray-100 rounded-xl mt-3">
          <p className="font-semibold text-gray-600 text-sm mb-2">Agregar valet</p>
          <div className="grid grid-cols-3 gap-2 mb-2">
            <input value={nVNom} onChange={e => setNVNom(e.target.value)} className="p-3 border-2 border-gray-200 rounded-xl text-sm" placeholder="Nombre" />
            <input type="number" value={nVNum} onChange={e => setNVNum(e.target.value)} className="p-3 border-2 border-gray-200 rounded-xl text-sm" placeholder="N" />
            <input value={nVPin} onChange={e => setNVPin(e.target.value)} className="p-3 border-2 border-gray-200 rounded-xl text-sm" placeholder="PIN" maxLength={6} />
          </div>
          <button onClick={async () => {
            if (!nVNom.trim() || !nVPin.trim() || !nVNum.trim()) return;
            await apiWrite("perfiles", "POST", { nombre: nVNom.trim(), numero_valet: parseInt(nVNum), pin: nVPin, rol: "valet" });
            setNVNom(""); setNVPin(""); setNVNum(""); cargar(); setMsg("Creado"); setTimeout(() => setMsg(""), 2000);
          }} className="bg-blue-600 text-white w-full py-3 rounded-xl font-semibold">Agregar Valet</button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow p-4 mb-4">
        <h2 className="font-bold text-gray-700 mb-3">Admins ({vals.filter((v: any) => v.rol === "supervisor").length})</h2>
        {vals.filter((v: any) => v.rol === "supervisor").map((v: any) => (
          <div key={v.id} className="border rounded-xl p-3 mb-2 flex items-center justify-between">
            <div><p className="font-semibold">{v.nombre}</p></div>
            <button onClick={() => toggleValet(v.id, v.nombre, "eliminar")} className="bg-red-100 text-red-600 px-2 py-1 rounded-lg text-xs">Eliminar</button>
          </div>
        ))}
        <div className="p-4 bg-gray-100 rounded-xl mt-3">
          <p className="font-semibold text-gray-600 text-sm mb-2">Agregar Admin</p>
          <div className="grid grid-cols-3 gap-2 mb-2">
            <input value={aNom} onChange={e => setANom(e.target.value)} className="p-3 border-2 border-gray-200 rounded-xl text-sm" placeholder="Nombre" />
            <input type="number" value={aNum} onChange={e => setANum(e.target.value)} className="p-3 border-2 border-gray-200 rounded-xl text-sm" placeholder="N" />
            <input value={aPin} onChange={e => setAPin(e.target.value)} className="p-3 border-2 border-gray-200 rounded-xl text-sm" placeholder="PIN" maxLength={6} />
          </div>
          <button onClick={async () => {
            if (!aNom.trim() || !aPin.trim()) return;
            await apiWrite("perfiles", "POST", { nombre: aNom.trim(), numero_valet: parseInt(aNum) || 0, pin: aPin, rol: "supervisor" });
            setANom(""); setAPin(""); setANum(""); cargar(); setMsg("Admin creado"); setTimeout(() => setMsg(""), 2000);
          }} className="bg-green-600 text-white w-full py-3 rounded-xl font-semibold">Agregar Admin</button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow p-4 mb-4">
        <h2 className="font-bold text-gray-700 mb-3">Sectores ({secs.length})</h2>
        {secs.map((s: any) => (
          <div key={s.id} className="border rounded-xl p-3 mb-2">
            {edS === s.id ? (
              <div className="space-y-2">
                <input value={eNom} onChange={e => setENom(e.target.value)} className="w-full p-2 border rounded-lg text-sm" />
                <div className="grid grid-cols-3 gap-2">
                  <input type="number" value={eCap} onChange={e => setECap(parseInt(e.target.value))} className="p-2 border rounded-lg text-sm" />
                  <input type="color" value={eCol} onChange={e => setECol(e.target.value)} className="h-10 rounded-lg cursor-pointer" />
                  <input type="number" value={eOrd} onChange={e => setEOrd(parseInt(e.target.value))} className="p-2 border rounded-lg text-sm" />
                </div>
                <button onClick={() => guardarSector(s.id)} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm">Guardar</button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full" style={{ backgroundColor: s.color_hex }} />
                <span className="flex-1 font-semibold">{s.nombre} ({s.capacidad})</span>
                <button onClick={() => { setEdS(s.id); setENom(s.nombre); setECap(s.capacidad); setECol(s.color_hex); setEOrd(s.orden); }} className="text-blue-600 text-sm">Editar</button>
                <button onClick={() => apiWrite("sectores?id=eq." + s.id, "PATCH", { activo: !s.activo }).then(cargar)} className={`text-sm ${s.activo ? "text-red-500" : "text-green-600"}`}>{s.activo ? "Desactivar" : "Activar"}</button>
                <button onClick={() => { if (confirm("Eliminar sector?")) { apiWrite("sectores?id=eq." + s.id, "DELETE").then(cargar); } }} className="text-red-500 text-sm">Eliminar</button>
              </div>
            )}
          </div>
        ))}
        <div className="p-4 bg-gray-100 rounded-xl mt-3">
          <p className="font-semibold text-gray-600 text-sm mb-2">Agregar sector</p>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <input value={nSec} onChange={e => setNSec(e.target.value)} className="p-3 border-2 border-gray-200 rounded-xl text-sm" placeholder="Nombre" />
            <input type="number" value={nCap} onChange={e => setNCap(parseInt(e.target.value) || 0)} className="p-3 border-2 border-gray-200 rounded-xl text-sm" placeholder="Capacidad" />
          </div>
          <div className="flex gap-2">
            <input type="color" value={nCol} onChange={e => setNCol(e.target.value)} className="h-11 w-20 rounded-xl cursor-pointer" />
            <button onClick={async () => {
              if (!nSec.trim()) return;
              await apiWrite("sectores", "POST", { nombre: nSec.trim(), capacidad: nCap, color_hex: nCol, orden: secs.length + 1 });
              setNSec(""); cargar(); setMsg("Creado"); setTimeout(() => setMsg(""), 2000);
            }} className="bg-blue-600 text-white flex-1 py-3 rounded-xl font-semibold">Agregar</button>
          </div>
        </div>
      </div>
    </div>
  );
}
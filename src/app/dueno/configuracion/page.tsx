"use client";
import { useState, useEffect } from "react";

function api(path: string) { return fetch("/api/db?path=" + encodeURIComponent(path)).then(r => r.text()).then(t => t && t !== "[]" ? JSON.parse(t) : []).catch(() => []); }
function act(path: string, m: string, d?: any) { return fetch("/api/db", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ path, method: m, data: d }) }); }

export default function ConfigPage() {
  const [nom, setNom] = useState("");
  const [s, setS] = useState<any[]>([]);
  const [v, setV] = useState<any[]>([]);
  const [ed, setEd] = useState("");
  const [eN, setEN] = useState("");
  const [eC, setEC] = useState(0);
  const [eL, setEL] = useState("");
  const [nS, setNS] = useState("");
  const [nC, setNC] = useState(10);
  const [nL, setNL] = useState("#3498DB");
  const [nV, setNV] = useState("");
  const [nP, setNP] = useState("");
  const [nN, setNN] = useState("");
  const [aV, setAV] = useState("");
  const [aP, setAP] = useState("");
  const [msg, setMsg] = useState("");

  const load = async () => {
    const cfg = await api("configuracion_app?select=nombre_app&limit=1");
    if (cfg.length) setNom(cfg[0].nombre_app);
    setS(await api("sectores?select=*&order=orden"));
    setV(await api("perfiles?select=*&order=numero_valet"));
  };
  useEffect(() => { load(); }, []);

  const m = (t: string) => { setMsg(t); setTimeout(() => setMsg(""), 2000); };
  const wp = (t: string) => window.open("https://wa.me/?text=" + encodeURIComponent(t), "_blank");

  return (
    <div className="min-h-screen bg-gray-50 p-4" style={{ maxWidth: 640, margin: "0 auto" }}>
      <button onClick={() => window.history.back()} className="text-2xl mb-4">{"<"}</button>
      <h1 className="text-2xl font-bold mb-4">Config</h1>
      {msg && <div className="bg-blue-100 text-blue-700 p-3 rounded-xl text-sm mb-4">{msg}</div>}

      <div className="bg-white rounded-2xl shadow p-4 mb-4">
        <p className="font-bold mb-3">App</p>
        <div className="flex gap-2">
          <input value={nom} onChange={e => setNom(e.target.value)} className="w-full p-3 border rounded-xl" placeholder="Nombre app" />
          <button onClick={async () => { const c = await api("configuracion_app?select=id&limit=1"); if (c.length) { await act("configuracion_app?id=eq." + c[0].id, "PATCH", { nombre_app: nom }); m("Guardado"); } }} className="bg-blue-600 text-white px-4 py-2 rounded-xl">Guardar</button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <p className="font-bold">Valets ({v.filter((x: any) => x.rol === "valet").length})</p>
          <button onClick={() => { let t = "🔑 VALETS\n"; v.filter((x: any) => x.rol === "valet").forEach((x: any) => { t += `${x.nombre} #${x.numero_valet} - PIN: ${x.pin}${x.activo === false ? " (INACTIVO)" : ""}\n`; }); wp(t); }} className="bg-green-100 text-green-700 px-3 py-1.5 rounded-xl text-sm font-semibold">💬 Compartir</button>
        </div>
        {v.filter((x: any) => x.rol === "valet").map((x: any) => (
          <div key={x.id} className="border rounded-xl p-3 mb-2 flex items-center justify-between">
            <div><p className="font-semibold">{x.nombre} #{x.numero_valet}</p><p className="text-xs">{x.pin || ""} {x.activo === false ? "(Inactivo)" : ""}</p></div>
            <div className="flex gap-1">
              {x.activo !== false && <button onClick={async () => { await act("perfiles?id=eq." + x.id, "PATCH", { activo: false }); load(); }} className="bg-red-100 text-red-600 px-2 py-1 rounded-lg text-xs">Desactivar</button>}
              {x.activo === false && <button onClick={async () => { await act("perfiles?id=eq." + x.id, "PATCH", { activo: true }); load(); }} className="bg-green-100 text-green-700 px-2 py-1 rounded-lg text-xs">Reactivar</button>}
              <button onClick={async () => { if (!confirm("Eliminar?") || !confirm("Confirmar?")) return; await act("perfiles?id=eq." + x.id, "DELETE"); load(); m("Eliminado"); }} className="bg-red-100 text-red-600 px-2 py-1 rounded-lg text-xs">Eliminar</button>
            </div>
          </div>
        ))}
        <div className="bg-gray-100 rounded-xl p-4">
          <p className="font-semibold text-sm mb-2">Agregar Valet</p>
          <div className="grid grid-cols-3 gap-2 mb-2">
            <input value={nV} onChange={e => setNV(e.target.value)} className="p-3 border rounded-xl text-sm" placeholder="Nombre" />
            <input type="number" value={nN} onChange={e => setNN(e.target.value)} className="p-3 border rounded-xl text-sm" placeholder="N" />
            <input value={nP} onChange={e => setNP(e.target.value)} className="p-3 border rounded-xl text-sm" placeholder="PIN" maxLength={6} />
          </div>
          <button onClick={async () => { if (!nV.trim() || !nP.trim()) return; await act("perfiles", "POST", { nombre: nV.trim(), numero_valet: parseInt(nN) || 0, pin: nP, rol: "valet" }); setNV(""); setNP(""); setNN(""); load(); m("Creado"); }} className="bg-blue-600 text-white w-full py-3 rounded-xl font-semibold">Agregar Valet</button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <p className="font-bold">Admins ({v.filter((x: any) => x.rol === "supervisor").length})</p>
          <button onClick={() => { let t = "👑 ADMINS\n"; v.filter((x: any) => x.rol === "supervisor").forEach((x: any) => { t += `${x.nombre} - PIN: ${x.pin || "-"}\n`; }); wp(t); }} className="bg-green-100 text-green-700 px-3 py-1.5 rounded-xl text-sm font-semibold">💬 Compartir</button>
        </div>
        {v.filter((x: any) => x.rol === "supervisor").map((x: any) => (
          <div key={x.id} className="border rounded-xl p-3 mb-2 flex items-center justify-between">
            <p className="font-semibold">{x.nombre}</p>
            <p className="text-xs">PIN: {x.pin || "-"}</p>
            <button onClick={async () => { if (!confirm("Eliminar?") || !confirm("Confirmar?")) return; await act("perfiles?id=eq." + x.id, "DELETE"); load(); }} className="bg-red-100 text-red-600 px-2 py-1 rounded-lg text-xs">Eliminar</button>
          </div>
        ))}
        <div className="bg-gray-100 rounded-xl p-4">
          <p className="font-semibold text-sm mb-2">Agregar Admin</p>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <input value={aV} onChange={e => setAV(e.target.value)} className="p-3 border rounded-xl text-sm" placeholder="Nombre" />
            <input value={aP} onChange={e => setAP(e.target.value)} className="p-3 border rounded-xl text-sm" placeholder="PIN" maxLength={6} />
          </div>
          <button onClick={async () => {
            if (!aV.trim() || !aP.trim()) return;
            await act("perfiles", "POST", { nombre: aV.trim(), numero_valet: 0, pin: aP, rol: "supervisor" });
            setAV(""); setAP(""); load(); m("Admin creado");
          }} className="bg-green-600 text-white w-full py-3 rounded-xl font-semibold">Agregar Admin</button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow p-4 mb-4">
        <p className="font-bold mb-3">Sectores ({s.length})</p>
        {s.map((x: any) => (
          <div key={x.id} className="border rounded-xl p-3 mb-2">
            {ed === x.id ? (
              <div className="space-y-2">
                <div className="grid grid-cols-3 gap-2">
                  <input value={eN} onChange={e => setEN(e.target.value)} className="p-2 border rounded-lg text-sm" />
                  <input type="number" value={eC} onChange={e => setEC(parseInt(e.target.value))} className="p-2 border rounded-lg text-sm" />
                  <input type="color" value={eL} onChange={e => setEL(e.target.value)} className="h-10 rounded-lg cursor-pointer" />
                </div>
                <button onClick={async () => { await act("sectores?id=eq." + x.id, "PATCH", { nombre: eN, capacidad: eC, color_hex: eL }); setEd(""); load(); }} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm">Guardar</button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full flex-shrink-0" style={{ backgroundColor: x.color_hex }} />
                <span className="flex-1 font-semibold">{x.nombre} ({x.capacidad})</span>
                <button onClick={() => { setEd(x.id); setEN(x.nombre); setEC(x.capacidad); setEL(x.color_hex); }} className="text-blue-600 text-sm">Editar</button>
                <button onClick={async () => { await act("sectores?id=eq." + x.id, "PATCH", { activo: !x.activo }); load(); }} className={`text-sm ${x.activo ? "text-red-500" : "text-green-600"}`}>{x.activo ? "Desactivar" : "Activar"}</button>
                <button onClick={async () => { if (confirm("Eliminar?")) { await act("sectores?id=eq." + x.id, "DELETE"); load(); } }} className="text-red-500 text-sm">Eliminar</button>
              </div>
            )}
          </div>
        ))}
        <div className="bg-gray-100 rounded-xl p-4">
          <p className="font-semibold text-sm mb-2">Agregar sector</p>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <input value={nS} onChange={e => setNS(e.target.value)} className="p-3 border rounded-xl text-sm" placeholder="Nombre" />
            <input type="number" value={nC} onChange={e => setNC(parseInt(e.target.value) || 0)} className="p-3 border rounded-xl text-sm" placeholder="Cap" />
          </div>
          <div className="flex gap-2">
            <input type="color" value={nL} onChange={e => setNL(e.target.value)} className="h-11 w-20 rounded-xl cursor-pointer" />
            <button onClick={async () => { if (!nS.trim()) return; await act("sectores", "POST", { nombre: nS.trim(), capacidad: nC, color_hex: nL, orden: s.length + 1 }); setNS(""); load(); m("Creado"); }} className="bg-blue-600 text-white flex-1 py-3 rounded-xl font-semibold">Agregar</button>
          </div>
        </div>
      </div>
    </div>
  );
}
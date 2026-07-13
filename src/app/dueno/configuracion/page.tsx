"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { db } from "@/lib/db";

export default function ConfigPage() {
  const router = useRouter();
  const perfil = useAppStore((s) => s.perfil);

  const [nombreApp, setNombreApp] = useState("");
  const [sectores, setSectores] = useState<any[]>([]);
  const [valets, setValets] = useState<any[]>([]);
  const [editandoSector, setEditandoSector] = useState<string | null>(null);
  const [editSectorNombre, setEditSectorNombre] = useState("");
  const [editSectorCap, setEditSectorCap] = useState(0);
  const [editSectorColor, setEditSectorColor] = useState("");
  const [editSectorOrden, setEditSectorOrden] = useState(0);
  const [nuevoSector, setNuevoSector] = useState("");
  const [nuevaCap, setNuevaCap] = useState(10);
  const [nuevoColor, setNuevoColor] = useState("#3498DB");
  const [nuevoValetNombre, setNuevoValetNombre] = useState("");
  const [nuevoValetPin, setNuevoValetPin] = useState("");
  const [nuevoValetNum, setNuevoValetNum] = useState("");
  const [msg, setMsg] = useState("");
  const [mostrandoValets, setMostrandoValets] = useState(true);

  useEffect(() => {
    if (!perfil || perfil.rol !== "dueno") { router.push("/"); return; }
    cargarDatos();
  }, []);

  async function cargarDatos() {
    try {
      const config = await db.select("configuracion_app", { single: true });
      if (config) setNombreApp(config.nombre_app || "Valet Parking");
      setSectores(await db.select("sectores", { order: "orden" }) || []);
      setValets(await db.select("perfiles", { order: "numero_valet" }) || []);
    } catch (e) { console.error(e); }
  }

  const guardarNombreApp = async () => {
    const config = await db.select("configuracion_app", { single: true });
    if (config) {
      await db.update("configuracion_app", { nombre_app: nombreApp, ultima_modificacion: new Date().toISOString(), modificado_por: perfil!.id }, { id: config.id });
      setMsg("✅ Nombre actualizado"); setTimeout(() => setMsg(""), 2000);
    }
  };

  const compartirWhatsApp = (texto: string) => {
    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, "_blank");
  };

  const enviarCredencialesValet = (v: any) => {
    const texto = `🔑 *${nombreApp}* - Credenciales de Valet

👤 Nombre: ${v.nombre}
🔢 Número: ${v.numero_valet}
🔐 PIN: ${v.pin}

📱 Ingresá a: https://valet-parking-psi.vercel.app
   Seleccioná "🔑 Valet"
   Ingresá N° ${v.numero_valet} y PIN ${v.pin}`;
    compartirWhatsApp(texto);
  };

  const editarSector = (s: any) => {
    setEditandoSector(s.id); setEditSectorNombre(s.nombre); setEditSectorCap(s.capacidad); setEditSectorColor(s.color_hex); setEditSectorOrden(s.orden);
  };

  const guardarSector = async (id: string) => {
    await db.update("sectores", { nombre: editSectorNombre, capacidad: editSectorCap, color_hex: editSectorColor, orden: editSectorOrden }, { id });
    setEditandoSector(null); cargarDatos(); setMsg("✅ Sector actualizado"); setTimeout(() => setMsg(""), 2000);
  };

  const agregarSector = async () => {
    if (!nuevoSector.trim()) return;
    await db.insert("sectores", { nombre: nuevoSector.trim(), capacidad: nuevaCap, color_hex: nuevoColor, orden: sectores.length + 1 });
    setNuevoSector(""); cargarDatos(); setMsg("✅ Sector agregado"); setTimeout(() => setMsg(""), 2000);
  };

  const eliminarSector = async (id: string, nombre: string) => {
    if (!confirm(`¿Eliminar "${nombre}"?`)) return;
    await db.update("sectores", { activo: false }, { id });
    cargarDatos();
  };

  const agregarValet = async () => {
    if (!nuevoValetNombre.trim() || !nuevoValetPin.trim() || !nuevoValetNum.trim()) return;
    try {
      const res = await db.insert("perfiles", { nombre: nuevoValetNombre.trim(), numero_valet: parseInt(nuevoValetNum), pin: nuevoValetPin, rol: "valet" });
      if (res) {
        setNuevoValetNombre(""); setNuevoValetPin(""); setNuevoValetNum("");
        cargarDatos();
        setMsg(`✅ Valet "${nuevoValetNombre.trim()}" creado!`); setTimeout(() => setMsg(""), 3000);
      }
    } catch (e: any) { setMsg("❌ Error: " + (e.message || "")); }
  };

  const eliminarValet = async (id: string, nombre: string) => {
    if (!confirm(`⚠️ ¿Eliminar a "${nombre}"? Ya no podrá acceder al sistema.`)) return;
    try {
      await db.update("perfiles", { activo: false }, { id });
      cargarDatos();
      setMsg(`🗑️ Valet "${nombre}" desactivado`); setTimeout(() => setMsg(""), 3000);
    } catch (e: any) { setMsg("❌ Error: " + (e.message || "")); }
  };

  const borrarHistorico = async () => {
    if (!confirm("⚠️ ¿Estás SEGURO? Esto borrará TODO el histórico.")) return;
    setMsg("🗑️ Esta función está deshabilitada por seguridad. Contactá a soporte.");
    setTimeout(() => setMsg(""), 3000);
  };

  if (!perfil) return null;

  return (
    <div className="min-h-screen bg-gray-50 p-4 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.push("/dueno")} className="text-gray-500 text-2xl">←</button>
        <h1 className="text-2xl font-bold text-gray-800">⚙️ Configuración</h1>
      </div>
      {msg && <div className="bg-blue-100 text-blue-700 p-3 rounded-xl text-sm text-center mb-4 animate-fade-in">{msg}</div>}

      {/* Nombre de App */}
      <div className="card-valet mb-4">
        <h2 className="font-bold text-gray-700 mb-3">🏪 Nombre de la App</h2>
        <div className="flex gap-2">
          <input value={nombreApp} onChange={(e) => setNombreApp(e.target.value)} className="input-valet flex-1" />
          <button onClick={guardarNombreApp} className="btn-valet-sm bg-blue-600 hover:bg-blue-700 px-6">💾 Guardar</button>
        </div>
      </div>

      {/* VALETS */}
      <div className="card-valet mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-gray-700">👤 Valets ({valets.filter((v) => v.rol === "valet").length})</h2>
          <button onClick={() => setMostrandoValets(!mostrandoValets)} className="text-blue-600 text-sm font-semibold">
            {mostrandoValets ? "Ocultar" : "Mostrar"}
          </button>
        </div>

            {mostrandoValets && (
              <>
                <div className="space-y-2 mb-4">
                  {valets.filter((v) => v.rol === "valet").map((v) => (
                    <div key={v.id} className={`border rounded-xl p-3 ${v.activo === false ? "border-red-200 bg-red-50" : "border-gray-200"}`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-gray-700">{v.nombre} <span className="text-gray-400 text-sm">#{v.numero_valet}</span></p>
                          <p className="text-xs text-gray-400">PIN: {v.pin || "—"} · {v.activo !== false ? "🟢 Activo" : "🔴 Inactivo"}</p>
                        </div>
                        <div className="flex gap-1.5">
                          {v.activo !== false && (
                            <button onClick={() => enviarCredencialesValet(v)}
                              className="bg-green-100 text-green-700 px-2.5 py-1.5 rounded-lg text-xs font-semibold hover:bg-green-200">💬</button>
                          )}
                          <button onClick={() => eliminarValet(v.id, v.nombre)}
                            className="bg-red-100 text-red-600 px-2.5 py-1.5 rounded-lg text-xs font-semibold hover:bg-red-200">
                            {v.activo !== false ? "🚫 Desactivar" : "🗑️"}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

            <div className="p-4 bg-gray-100 rounded-xl">
              <p className="font-semibold text-gray-600 text-sm mb-2">➕ Agregar nuevo valet</p>
              <div className="grid grid-cols-3 gap-2 mb-2">
                <input value={nuevoValetNombre} onChange={(e) => setNuevoValetNombre(e.target.value)}
                  className="input-valet text-sm" placeholder="Nombre completo" />
                <input type="number" value={nuevoValetNum} onChange={(e) => setNuevoValetNum(e.target.value)}
                  className="input-valet text-sm" placeholder="N° Valet" />
                <input value={nuevoValetPin} onChange={(e) => setNuevoValetPin(e.target.value)}
                  className="input-valet text-sm" placeholder="PIN (4-6 dígitos)" maxLength={6} />
              </div>
              <button onClick={agregarValet}
                disabled={!nuevoValetNombre.trim() || !nuevoValetPin.trim() || !nuevoValetNum.trim()}
                className="btn-valet-sm bg-blue-600 w-full disabled:opacity-50">
                ➕ Agregar Valet
              </button>
            </div>
          </>
        )}
      </div>

      {/* SECTORES */}
      <div className="card-valet mb-4">
        <h2 className="font-bold text-gray-700 mb-3">🅿️ Sectores ({sectores.length})</h2>
        <div className="space-y-2 mb-4">
          {sectores.map((s) => (
            <div key={s.id} className="border border-gray-200 rounded-xl p-3">
              {editandoSector === s.id ? (
                <div className="space-y-2">
                  <input value={editSectorNombre} onChange={(e) => setEditSectorNombre(e.target.value)} className="input-valet text-sm" />
                  <div className="grid grid-cols-3 gap-2">
                    <input type="number" value={editSectorCap} onChange={(e) => setEditSectorCap(parseInt(e.target.value))} className="input-valet text-sm" />
                    <input type="color" value={editSectorColor} onChange={(e) => setEditSectorColor(e.target.value)} className="h-12 rounded-xl cursor-pointer" />
                    <input type="number" value={editSectorOrden} onChange={(e) => setEditSectorOrden(parseInt(e.target.value))} className="input-valet text-sm" />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => guardarSector(s.id)} className="btn-valet-sm bg-green-600 flex-1">💾 Guardar</button>
                    <button onClick={() => setEditandoSector(null)} className="btn-valet-sm bg-gray-400">Cancelar</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full flex-shrink-0" style={{ backgroundColor: s.color_hex }} />
                  <div className="flex-1"><p className="font-semibold text-gray-700">{s.nombre}</p><p className="text-xs text-gray-400">Cap: {s.capacidad} · Orden: {s.orden}</p></div>
                  <button onClick={() => editarSector(s)} className="text-blue-600 text-sm font-semibold">Editar</button>
                  <button onClick={() => eliminarSector(s.id, s.nombre)} className="text-red-500 text-sm">🗑️</button>
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="p-4 bg-gray-100 rounded-xl">
          <p className="font-semibold text-gray-600 text-sm mb-2">➕ Agregar sector</p>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <input value={nuevoSector} onChange={(e) => setNuevoSector(e.target.value)} className="input-valet text-sm" placeholder="Nombre" />
            <input type="number" value={nuevaCap} onChange={(e) => setNuevaCap(parseInt(e.target.value) || 0)} className="input-valet text-sm" placeholder="Capacidad" />
          </div>
          <div className="flex gap-2 items-center">
            <input type="color" value={nuevoColor} onChange={(e) => setNuevoColor(e.target.value)} className="h-10 w-20 rounded-xl cursor-pointer" />
            <button onClick={agregarSector} disabled={!nuevoSector.trim()} className="btn-valet-sm bg-blue-600 flex-1 disabled:opacity-50">➕ Agregar</button>
          </div>
        </div>
      </div>

      {/* Links rápidos */}
      <div className="card-valet mb-4">
        <h2 className="font-bold text-gray-700 mb-3">🔗 Links Rápidos</h2>
        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => router.push("/dashboard/tv")}
            className="btn-valet-sm bg-gray-800 py-4">📺 Vista TV / Salón</button>
          <button onClick={() => router.push("/dashboard")}
            className="btn-valet-sm bg-blue-700 py-4">📊 Dashboard General</button>
          <button onClick={() => router.push("/valet")}
            className="btn-valet-sm bg-blue-600 py-4">🚗 App Valet</button>
          <button onClick={() => { const r = `${window.location.origin}`; window.open(`https://wa.me/?text=${encodeURIComponent(`📱 ${nombreApp}\nIngresá como Valet: ${r}\n\nTambién podés ver el Dashboard:\n${r}/dashboard\n\nVista TV/Salón principal:\n${r}/dashboard/tv`)}`, "_blank"); }}
            className="btn-valet-sm bg-green-600 py-4">💬 Compartir Links</button>
        </div>
      </div>
    </div>
  );
}

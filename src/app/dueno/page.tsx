"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { db } from "@/lib/db";
import Logo from "@/components/ui/Logo";

type Evento = { id: string; nombre: string; fecha_apertura: string; vehiculos_totales: number; estado: string };
type ValetInfo = { id: string; numero_valet: number; nombre: string; activo: boolean };

export default function DuenoPage() {
  const router = useRouter();
  const perfil = useAppStore((s) => s.perfil);

  const [nombreApp, setNombreApp] = useState("Valet Parking");
  const [eventosActivos, setEventosActivos] = useState<Evento[]>([]);
  const [nuevoEvento, setNuevoEvento] = useState("");
  const [creando, setCreando] = useState(false);
  const [totalHoy, setTotalHoy] = useState(0);
  const [valetsCount, setValetsCount] = useState(0);
  const [msg, setMsg] = useState("");
  const [totalVehiculos, setTotalVehiculos] = useState(0);
  // Modal cerrar evento
  const [eventoACerrar, setEventoACerrar] = useState<Evento | null>(null);
  const [valetsEvento, setValetsEvento] = useState<ValetInfo[]>([]);
  const [valetsADesactivar, setValetsADesactivar] = useState<Set<string>>(new Set());
  // Historial
  const [historial, setHistorial] = useState<any[]>([]);

  useEffect(() => {
    if (!perfil || perfil.rol !== "dueno") { router.push("/"); return; }
    cargarDatos();
  }, []);

  async function cargarDatos() {
    try {
      const config = await db.select("configuracion_app", { single: true });
      if (config) setNombreApp(config.nombre_app || "Valet Parking");
      const activos = await db.select("eventos", { filters: { estado: "abierto" }, order: "fecha_apertura" });
      if (activos) setEventosActivos(activos);
      const vals = await db.select("perfiles", { filters: { rol: "valet" } });
      if (vals) setValetsCount(vals.length);
      const activosCount = await db.select("tickets", { filters: { estado: "activo" } });
      setTotalVehiculos(Array.isArray(activosCount) ? activosCount.length : 0);
      const hoy = new Date().toISOString().split("T")[0];
      const ticketsHoy = await fetch("/api/query", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "count", table: "tickets", filters: { hora_entrada: `gte.${hoy}` } }) }).then(r => r.json());
      setTotalHoy(ticketsHoy.count || 0);

      // Historial reciente
      const hist = await db.select("historial_completo", { order: "creado_en.desc", limit: 20 });
      if (Array.isArray(hist)) {
        const enriched = await Promise.all(hist.map(async (h: any) => {
          const p = await db.select("perfiles", { filters: { id: h.id_valet }, select: "nombre", single: true });
          const t = await db.select("tickets", { filters: { id: h.id_ticket }, select: "numero_ticket", single: true });
          const e = await db.select("eventos", { filters: { id: h.id_evento }, select: "nombre", single: true });
          return { ...h, valet_nombre: (p as any)?.nombre || "—", ticket_num: (t as any)?.numero_ticket || 0, evento_nombre: (e as any)?.nombre || "" };
        }));
        setHistorial(enriched);
      }
    } catch (e) { console.error(e); }
  }

  const crearEvento = async () => {
    if (!nuevoEvento.trim()) return;
    setCreando(true);
    try { await db.insert("eventos", { nombre: nuevoEvento.trim(), abierto_por: perfil!.id }); setNuevoEvento(""); setMsg("✅ Evento creado"); setTimeout(() => setMsg(""), 2000); cargarDatos(); } catch { setMsg("Error al crear"); }
    setCreando(false);
  };

  const abrirModalCerrar = async (id: string) => {
    const ev = eventosActivos.find(e => e.id === id);
    if (!ev) return;
    const vals = await db.select("perfiles", { filters: { rol: "valet", activo: "true" } });
    setEventoACerrar(ev);
    setValetsEvento(Array.isArray(vals) ? vals : []);
    setValetsADesactivar(new Set());
  };

  const toggleValetDesactivar = (id: string) => {
    const newSet = new Set(valetsADesactivar);
    if (newSet.has(id)) newSet.delete(id); else newSet.add(id);
    setValetsADesactivar(newSet);
  };

  const confirmarCierre = async () => {
    if (!eventoACerrar) return;
    try {
      await db.update("eventos", { estado: "cerrado", fecha_cierre: new Date().toISOString(), cerrado_por: perfil!.id }, { id: eventoACerrar.id });
      for (const vid of valetsADesactivar) {
        await db.update("perfiles", { activo: false }, { id: vid });
      }
      setMsg(`✅ "${eventoACerrar.nombre}" cerrado${valetsADesactivar.size > 0 ? ` · ${valetsADesactivar.size} valet(s) desactivado(s)` : ""}`);
      setTimeout(() => setMsg(""), 4000);
      setEventoACerrar(null);
      cargarDatos();
    } catch { setMsg("Error al cerrar"); }
  };

  const compartirWhatsApp = (texto: string) => { window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, "_blank"); };

  const exportarCSV = async () => {
    const tickets = await db.select("tickets", { order: "hora_entrada.desc", limit: "500" });
    if (!Array.isArray(tickets)) return;
    const csv = "Ticket,Patente,Modelo,Sector,Estado,Entrada,Salida\n" + tickets.map((t: any) => `${t.numero_ticket},${t.id_vehiculo || ""},${t.id_sector || ""},${t.estado},${t.hora_entrada},${t.hora_salida || ""}`).join("\n");
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" })); a.download = `valet-reporte-${new Date().toISOString().split("T")[0]}.csv`; a.click();
  };

  if (!perfil) return null;

  return (
    <div className="min-h-screen bg-gray-50 p-4 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3"><Logo size={40} /><div><h1 className="text-2xl font-bold text-gray-800">👑 {nombreApp}</h1><p className="text-gray-500">{perfil.nombre}</p></div></div>
        <div className="flex gap-1.5 flex-wrap justify-end">
          <button onClick={() => router.push("/dashboard")} className="bg-gray-200 text-gray-700 px-2.5 py-1.5 rounded-xl text-xs font-semibold">📊</button>
          <button onClick={() => router.push("/valet")} className="bg-blue-600 text-white px-2.5 py-1.5 rounded-xl text-xs font-semibold">🚗 Valet</button>
          <button onClick={() => router.push("/dashboard/tv")} className="bg-gray-800 text-white px-2.5 py-1.5 rounded-xl text-xs font-semibold">📺 TV</button>
          <button onClick={() => router.push("/dueno/configuracion")} className="bg-purple-600 text-white px-2.5 py-1.5 rounded-xl text-xs font-semibold">⚙️</button>
        </div>
      </div>

      {msg && <div className="bg-blue-100 text-blue-700 p-3 rounded-xl text-sm text-center mb-4 animate-fade-in">{msg}</div>}

      <div className="grid grid-cols-2 gap-2 mb-6">
        <button onClick={() => router.push("/valet/entrada")}
          className="bg-gradient-to-br from-blue-600 to-blue-800 text-white rounded-2xl p-5 text-center shadow-lg active:scale-95 transition-transform">
          <span className="text-3xl block mb-1">🚗</span><span className="font-bold text-lg">Registrar Entrada</span><span className="text-xs block opacity-70">Nuevo vehículo</span></button>
        <button onClick={() => router.push("/dueno/configuracion")}
          className="bg-gradient-to-br from-purple-600 to-purple-800 text-white rounded-2xl p-5 text-center shadow-lg active:scale-95 transition-transform">
          <span className="text-3xl block mb-1">🔑</span><span className="font-bold text-lg">Crear Valet</span><span className="text-xs block opacity-70">Agregar empleado</span></button>
      </div>

      <div className="grid grid-cols-4 gap-2 mb-6">
        <div className="card-valet text-center p-3"><p className="text-2xl font-bold text-blue-600">{totalVehiculos}</p><p className="text-xs text-gray-500">Activos</p></div>
        <div className="card-valet text-center p-3"><p className="text-2xl font-bold text-green-600">{totalHoy}</p><p className="text-xs text-gray-500">Hoy</p></div>
        <div className="card-valet text-center p-3"><p className="text-2xl font-bold text-amber-600">{eventosActivos.length}</p><p className="text-xs text-gray-500">Eventos</p></div>
        <div className="card-valet text-center p-3"><p className="text-2xl font-bold text-purple-600">{valetsCount}</p><p className="text-xs text-gray-500">Valets</p></div>
      </div>

      <div className="card-valet mb-4">
        <h2 className="font-bold text-gray-700 mb-3">📋 Nuevo Evento</h2>
        <div className="flex gap-2">
          <input value={nuevoEvento} onChange={(e) => setNuevoEvento(e.target.value)} className="input-valet flex-1" placeholder="Ej: Boda Carlos & Leli" onKeyDown={(e) => e.key === "Enter" && crearEvento()} />
          <button onClick={crearEvento} disabled={creando || !nuevoEvento.trim()} className="btn-valet-sm bg-blue-600 hover:bg-blue-700 px-6 disabled:opacity-50">➕ Crear</button>
        </div>
      </div>

      <h2 className="font-bold text-gray-700 mb-3">🟢 Eventos Activos</h2>
      {eventosActivos.map((ev) => (
        <div key={ev.id} className="card-valet mb-2 animate-fade-in flex items-center justify-between">
          <div><p className="font-bold text-gray-800">{ev.nombre}</p><p className="text-xs text-gray-500">🚗 {ev.vehiculos_totales} · {new Date(ev.fecha_apertura).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}</p></div>
          <div className="flex gap-2">
            <button onClick={compartirWhatsApp.bind(null, `🎫 ${ev.nombre}: ${ev.vehiculos_totales} vehiculos`)} className="bg-green-100 text-green-700 px-2.5 py-1.5 rounded-lg text-xs font-semibold hover:bg-green-200">💬</button>
            <button onClick={() => abrirModalCerrar(ev.id)} className="bg-red-100 text-red-600 px-2.5 py-1.5 rounded-lg text-xs font-semibold hover:bg-red-200">🔴 Cerrar</button>
            <button onClick={() => router.push(`/evento/${ev.id}`)} className="text-blue-600 text-xs font-semibold">Ver →</button>
          </div>
        </div>
      ))}
      {eventosActivos.length === 0 && <p className="text-gray-400 text-sm text-center py-4">No hay eventos activos. Cree uno arriba ☝️</p>}

      <div className="grid grid-cols-2 gap-2 mt-6">
        <button onClick={exportarCSV} className="btn-valet-sm bg-green-700 hover:bg-green-800 py-4 flex items-center justify-center gap-2"><span>📊</span> Exportar CSV</button>
        <button onClick={compartirWhatsApp.bind(null, `📊 ${nombreApp} - Resumen\n🚗 Activos: ${totalVehiculos}\n📋 Eventos: ${eventosActivos.length}\n🔑 Valets: ${valetsCount}`)} className="btn-valet-sm bg-green-600 hover:bg-green-700 py-4 flex items-center justify-center gap-2"><span>💬</span> WhatsApp</button>
      </div>

      {/* HISTORIAL RECIENTE */}
      <div className="mt-6">
        <h2 className="font-bold text-gray-700 mb-3">📜 Movimientos Recientes</h2>
        <div className="space-y-1.5 max-h-60 overflow-y-auto">
          {historial.map((h) => (
            <div key={h.id} className="card-valet p-2.5 text-xs animate-fade-in flex items-center gap-2">
              <span>{h.tipo === "entrada" ? "🚗" : h.tipo === "retiro_entregado" ? "✅" : h.tipo.includes("cambio") ? "🔄" : "📍"}</span>
              <span className="font-bold text-gray-700">#{String(h.ticket_num).padStart(3, "0")}</span>
              <span className="text-gray-500">
                {h.tipo === "entrada" ? "ENTRADA" : h.tipo === "retiro_entregado" ? "ENTREGADO" : h.tipo.includes("cambio") ? "CAMBIO" : h.tipo}
              </span>
              <span className="text-gray-400">· {h.valet_nombre}</span>
              {h.evento_nombre && <span className="text-gray-400">· {h.evento_nombre}</span>}
              <span className="text-gray-400 ml-auto">{new Date(h.creado_en).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}</span>
            </div>
          ))}
          {historial.length === 0 && <p className="text-gray-400 text-xs text-center py-4">No hay movimientos aún</p>}
        </div>
      </div>

      {/* MODAL CERRAR EVENTO */}
      {eventoACerrar && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setEventoACerrar(null)}>
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-gray-800 mb-2">🔴 Cerrar evento</h2>
            <p className="text-gray-600 mb-4 font-semibold">{eventoACerrar.nombre}</p>

            {valetsEvento.length > 0 && (
              <div className="mb-4">
                <p className="text-sm font-semibold text-gray-700 mb-2">Valets para desactivar (solo los de este evento):</p>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {valetsEvento.map((v) => (
                    <label key={v.id} className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all ${valetsADesactivar.has(v.id) ? "bg-red-50 border border-red-200" : "bg-gray-50 border border-gray-200"}`}>
                      <input type="checkbox" checked={valetsADesactivar.has(v.id)} onChange={() => toggleValetDesactivar(v.id)} className="w-5 h-5 accent-red-500" />
                      <div className="flex-1"><p className="font-medium text-gray-700">{v.nombre}</p><p className="text-xs text-gray-400">#{v.numero_valet}</p></div>
                      {valetsADesactivar.has(v.id) && <span className="text-xs text-red-600 font-semibold">Se desactivará</span>}
                    </label>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-2">💡 Los valets desactivados no podrán ingresar hasta que los reactive desde Configuración</p>
              </div>
            )}

            <div className="flex gap-2">
              <button onClick={() => setEventoACerrar(null)} className="btn-valet-sm bg-gray-400 flex-1">Cancelar</button>
              <button onClick={confirmarCierre} className="btn-valet-sm bg-red-600 hover:bg-red-700 flex-1">🔴 Cerrar evento</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

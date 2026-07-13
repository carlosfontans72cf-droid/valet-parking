"use client";
export const dynamic = 'force-dynamic';
import { useState, useEffect } from "react";
const SB = "https://hzexxoazyhhvljqiummn.supabase.co", AK = "sb_publishable_ALyCDA4qM4T68YiecEQErQ_WoYNUfen", BH = { apikey: AK, Authorization: `Bearer ${AK}` };

export default function DuenoPage() {
  const [evs, setEvs] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [totHoy, setTotHoy] = useState(0);
  const [nomApp, setNomApp] = useState("Valet Parking");
  const [nuevo, setNuevo] = useState("");
  const [hist, setHist] = useState<any[]>([]);
  const [msg, setMsg] = useState("");
  const uName = typeof window !== 'undefined' ? localStorage.getItem("userName") || "Dueño" : "";

  const api = async (url: string) => { try { const r = await fetch(url, { headers: BH }); const t = await r.text(); return t && t !== "[]" ? JSON.parse(t) : []; } catch { return []; } };
  const act = async (url: string, method: string, d?: any) => fetch(url, { method, headers: { ...BH, "Content-Type": "application/json" }, body: d ? JSON.stringify(d) : undefined });

  const cargar = async () => {
    const c = await api(`${SB}/rest/v1/configuracion_app?limit=1`);
    if (c.length) setNomApp(c[0].nombre_app || "Valet Parking");
    const d = await api(`${SB}/rest/v1/eventos?select=id,nombre,vehiculos_totales,fecha_apertura&estado=eq.abierto&order=fecha_apertura`);
    setEvs(d);
    const evIds = d.length ? d.map((e: any) => e.id).join(",") : "";
    if (evIds) {
      setTotal((await api(`${SB}/rest/v1/tickets?select=id&estado=eq.activo&id_evento=in.(${evIds})`)).length);
      const hoy = new Date().toISOString().split("T")[0];
      setTotHoy((await api(`${SB}/rest/v1/tickets?select=id&hora_entrada=gte.${hoy}&id_evento=in.(${evIds})`)).length);
    } else { setTotal(0); setTotHoy(0); }
    // Historial con nombres
    const h = await api(`${SB}/rest/v1/historial_completo?order=creado_en.desc&limit=50`);
    if (h.length) {
      const enr = await Promise.all(h.map(async (x: any) => {
        const [p, tkt, ev] = await Promise.all([
          api(`${SB}/rest/v1/perfiles?select=nombre&id=eq.${x.id_valet}`),
          api(`${SB}/rest/v1/tickets?select=numero_ticket&id=eq.${x.id_ticket}`),
          api(`${SB}/rest/v1/eventos?select=nombre&id=eq.${x.id_evento}`),
        ]);
        return { ...x, vn: p.length ? p[0].nombre : "—", tn: tkt.length ? tkt[0].numero_ticket : "", en: ev.length ? ev[0].nombre : "" };
      }));
      setHist(enr);
    }
  };

  useEffect(() => { cargar(); }, []);

  const crear = async () => {
    if (!nuevo.trim()) return;
    await act(`${SB}/rest/v1/eventos`, "POST", { nombre: nuevo.trim(), abierto_por: localStorage.getItem("userId") || "be8e22f7-5afd-426d-a777-0f69a68e1984" });
    setNuevo(""); setMsg("Creado"); setTimeout(() => setMsg(""), 2000); cargar();
  };

  const cerrarEvento = async (id: string) => { if (!confirm("Cerrar?")) return; await act(`${SB}/rest/v1/eventos?id=eq.${id}`, "PATCH", { estado: "cerrado", fecha_cierre: new Date().toISOString() }); cargar(); };
  const eliminarEvento = async (id: string, nom: string) => {
    if (!confirm("ELIMINAR " + nom + "?") || !confirm("Confirmar?")) return;
    const tkts = await api(`${SB}/rest/v1/tickets?select=id&id_evento=eq.${id}`);
    for (const t of tkts) await act(`${SB}/rest/v1/historial_completo?id_ticket=eq.${t.id}`, "DELETE");
    await act(`${SB}/rest/v1/tickets?id_evento=eq.${id}`, "DELETE");
    await act(`${SB}/rest/v1/eventos?id=eq.${id}`, "DELETE");
    setMsg("Eliminado"); setTimeout(() => setMsg(""), 3000); cargar();
  };

  const cerrarSesion = () => { localStorage.clear(); window.location.href = "/"; };
  const wp = (t: string) => window.open("https://wa.me/?text=" + encodeURIComponent(t), "_blank");
  const exportCSV = () => {
    if (!hist.length) return;
    const csv = "Fecha,Hora,Ticket,Accion,Valet,Evento\n" + hist.map((h: any) => new Date(h.creado_en).toLocaleDateString() + "," + new Date(h.creado_en).toLocaleTimeString() + "," + h.tn + "," + h.tipo + "," + h.vn + "," + h.en).join("\n");
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" })); a.download = "auditoria.csv"; a.click();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4" style={{ maxWidth: 640, margin: "0 auto" }}>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold">{nomApp}</h1><p className="text-gray-500 text-sm">{uName}</p></div>
        <div className="flex gap-1 flex-wrap">
          <button onClick={() => window.location.href = "/dashboard"} className="bg-gray-200 px-2.5 py-1.5 rounded-xl text-xs">📊</button>
          <button onClick={() => window.location.href = "/dashboard/tv"} className="bg-gray-800 text-white px-2.5 py-1.5 rounded-xl text-xs">📺</button>
          <button onClick={() => window.location.href = "/valet"} className="bg-blue-600 text-white px-2.5 py-1.5 rounded-xl text-xs">🚗</button>
          <button onClick={() => window.location.href = "/dueno/configuracion"} className="bg-purple-600 text-white px-2.5 py-1.5 rounded-xl text-xs">⚙️</button>
          <button onClick={cerrarSesion} className="bg-gray-800 text-white px-2.5 py-1.5 rounded-xl text-xs">Salir</button>
        </div>
      </div>
      {msg && <div className="bg-blue-100 text-blue-700 p-3 rounded-xl text-sm mb-4">{msg}</div>}

      <div className="grid grid-cols-2 gap-2 mb-6">
        <button onClick={() => window.location.href = "/valet/entrada"} className="bg-gradient-to-br from-blue-600 to-blue-800 text-white rounded-2xl p-4 text-center shadow-lg active:scale-95"><span className="text-3xl block mb-1">🚗</span><span className="font-semibold">Registrar Entrada</span></button>
        <button onClick={() => window.location.href = "/dueno/configuracion"} className="bg-gradient-to-br from-purple-600 to-purple-800 text-white rounded-2xl p-4 text-center shadow-lg active:scale-95"><span className="text-3xl block mb-1">🔑</span><span className="font-semibold">Crear Valet</span></button>
      </div>

      <div className="grid grid-cols-4 gap-2 mb-4">
        <div className="bg-white rounded-2xl shadow p-3 text-center"><p className="text-2xl font-bold text-blue-600">{total}</p><p className="text-xs text-gray-500">Activos</p></div>
        <div className="bg-white rounded-2xl shadow p-3 text-center"><p className="text-2xl font-bold text-green-600">{totHoy}</p><p className="text-xs text-gray-500">Hoy</p></div>
        <div className="bg-white rounded-2xl shadow p-3 text-center"><p className="text-2xl font-bold text-amber-600">{evs.length}</p><p className="text-xs text-gray-500">Eventos</p></div>
        <div className="bg-white rounded-2xl shadow p-3 text-center"><p className="text-2xl font-bold text-purple-600">{hist.length}</p><p className="text-xs text-gray-500">Movs</p></div>
      </div>

      <div className="bg-white rounded-2xl shadow p-4 mb-4">
        <p className="font-bold mb-3">Nuevo Evento</p>
        <div className="flex gap-2">
          <input value={nuevo} onChange={e => setNuevo(e.target.value)} className="w-full p-3 border-2 border-gray-200 rounded-xl flex-1" placeholder="Nombre" onKeyDown={e => e.key === "Enter" && crear()} />
          <button onClick={crear} className="bg-blue-600 text-white px-6 py-2 rounded-xl font-semibold">Crear</button>
        </div>
      </div>

      {evs.map(ev => (
        <div key={ev.id} className="bg-white rounded-2xl shadow p-3 mb-2 flex items-center justify-between">
          <div><p className="font-semibold">{ev.nombre}</p><p className="text-xs text-gray-500">{ev.vehiculos_totales} vehiculos</p></div>
          <div className="flex gap-1">
            <button onClick={() => wp("🎫 " + ev.nombre + ": " + ev.vehiculos_totales + " vehiculos")} className="bg-green-100 text-green-700 px-2 py-1.5 rounded-lg text-xs">💬</button>
            <button onClick={() => cerrarEvento(ev.id)} className="bg-red-100 text-red-600 px-2 py-1.5 rounded-lg text-xs">Cerrar</button>
            <button onClick={() => eliminarEvento(ev.id, ev.nombre)} className="bg-red-100 text-red-600 px-2 py-1.5 rounded-lg text-xs">Eliminar</button>
          </div>
        </div>
      ))}

      <div className="grid grid-cols-2 gap-2 mt-4 mb-6">
        <button onClick={exportCSV} className="bg-green-700 text-white py-4 rounded-2xl font-bold active:scale-95">📊 Exportar CSV</button>
        <button onClick={() => wp("📊 " + nomApp + " - Resumen\n🚗 Activos: " + total + "\n📋 Eventos: " + evs.length + "\n📅 Hoy: " + totHoy)} className="bg-green-600 text-white py-4 rounded-2xl font-bold active:scale-95">💬 WhatsApp</button>
      </div>

      <div className="bg-white rounded-2xl shadow p-4">
        <p className="font-bold mb-3">Historial ({hist.length} movimientos)</p>
        <div className="max-h-96 overflow-y-auto space-y-1">
          {hist.slice(0, 50).map((h: any) => (
            <div key={h.id} className="flex items-center gap-2 p-2 text-xs border-b border-gray-100">
              <span>{h.tipo === "entrada" ? "🚗" : h.tipo === "retiro_entregado" ? "✅" : h.tipo === "cambio_sector" ? "🔄" : "📍"}</span>
              {h.tn && <span className="font-bold">#{h.tn}</span>}
              <span className="text-gray-500 font-medium uppercase">{h.tipo === "retiro_entregado" ? "ENTREGÓ" : h.tipo === "cambio_sector" ? "CAMBIO" : h.tipo === "entrada" ? "ENTRADA" : h.tipo}</span>
              <span className="text-gray-400">· {h.vn}</span>
              {h.en && <span className="text-gray-400">· {h.en}</span>}
              <span className="text-gray-400 ml-auto">{h.creado_en ? new Date(h.creado_en).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }) : ""}</span>
            </div>
          ))}
          {hist.length === 0 && <p className="text-gray-400 text-xs text-center py-4">Sin movimientos</p>}
        </div>
      </div>
    </div>
  );
}
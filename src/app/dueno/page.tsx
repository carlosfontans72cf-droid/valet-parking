"use client";
import { useState, useEffect } from "react";
const SB = "https://hzexxoazyhhvljqiummn.supabase.co", AK = "sb_publishable_ALyCDA4qM4T68YiecEQErQ_WoYNUfen";
const q = async (u: string) => { try { const r = await fetch(u, { headers: { apikey: AK, Authorization: `Bearer ${AK}` } }); return await r.json(); } catch { return null; } };

export default function DuenoPage() {
  const [evs, setEvs] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [totHoy, setTotHoy] = useState(0);
  const [nomApp, setNomApp] = useState("Valet Parking");
  const [nuevo, setNuevo] = useState("");
  const [hist, setHist] = useState<any[]>([]);
  const [msg, setMsg] = useState("");
  const uName = typeof window !== 'undefined' ? localStorage.getItem("userName") || "Dueño" : "";

  useEffect(() => { cargar(); }, []);

  const cargar = async () => {
    const c = await q(`${SB}/rest/v1/configuracion_app?limit=1`);
    if (Array.isArray(c)&&c.length) setNomApp(c[0].nombre_app);
    const d = await q(`${SB}/rest/v1/eventos?select=id,nombre,vehiculos_totales,fecha_apertura&estado=eq.abierto&order=fecha_apertura`);
    if (Array.isArray(d)) setEvs(d);
    const t = await q(`${SB}/rest/v1/tickets?select=id&estado=eq.activo`);
    setTotal(Array.isArray(t)?t.length:0);
    const hoy = new Date().toISOString().split("T")[0];
    const th = await q(`${SB}/rest/v1/tickets?select=id&hora_entrada=gte.${hoy}`);
    setTotHoy(Array.isArray(th)?th.length:0);
    // Historial auditoría
    const h = await q(`${SB}/rest/v1/historial_completo?select=id,tipo,id_valet,id_ticket,id_evento,creado_en&order=creado_en.desc&limit=30order=creado_en.desc`);
    if (Array.isArray(h)) {
      const enr = await Promise.all(h.map(async (x:any) => {
        const p = await q(`${SB}/rest/v1/perfiles?select=nombre&id=eq.${x.id_valet}`);
        const tkt = await q(`${SB}/rest/v1/tickets?select=numero_ticket&id=eq.${x.id_ticket}`);
        const ev = await q(`${SB}/rest/v1/eventos?select=nombre&id=eq.${x.id_evento}`);
        return {...x, vn: Array.isArray(p)&&p.length?p[0].nombre:"—", tn: Array.isArray(tkt)&&tkt.length?tkt[0].numero_ticket:"", en: Array.isArray(ev)&&ev.length?ev[0].nombre:""};
      }));
      setHist(enr);
    }
  };

  const crear = async () => {
    if (!nuevo.trim()) return;
    const uid = typeof window !== 'undefined' ? localStorage.getItem("userId") || "be8e22f7-5afd-426d-a777-0f69a68e1984" : "";
    await fetch(`${SB}/rest/v1/eventos`, { method:"POST", headers:{"Content-Type":"application/json",apikey:AK,Authorization:`Bearer ${AK}`}, body:JSON.stringify({ nombre:nuevo.trim(), abierto_por:uid }) });
    setNuevo(""); setMsg("✅ Creado"); setTimeout(()=>setMsg(""),2000); cargar();
  };

  const cerrar = async (id: string) => {
    if (!confirm("Cerrar evento?")) return;
    await fetch(`${SB}/rest/v1/eventos?id=eq.${id}`, { method:"PATCH", headers:{"Content-Type":"application/json",apikey:AK,Authorization:`Bearer ${AK}`}, body:JSON.stringify({ estado:"cerrado", fecha_cierre:new Date().toISOString() }) });
    cargar();
  };

  const wp = (t: string) => window.open(`https://wa.me/?text=${encodeURIComponent(t)}`, "_blank");
  
  const exportCSV = () => {
    if (!hist.length) return;
    const csv = "Fecha,Hora,Ticket,Acción,Valet,Evento\n" + hist.map((h:any) =>
      `${new Date(h.creado_en).toLocaleDateString("es-ES")},${new Date(h.creado_en).toLocaleTimeString("es-ES",{hour:"2-digit",minute:"2-digit"})},${h.tn},${h.tipo},${h.vn},${h.en}`
    ).join("\n");
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv], {type:"text/csv"})); a.download = `auditoria-${new Date().toISOString().split("T")[0]}.csv`; a.click();
  };

  const icono = (t: string) => t==="entrada"?"🚗":t==="retiro_entregado"?"✅":t.includes("cambio")?"🔄":"📍";

  return (
    <div className="min-h-screen bg-gray-50 p-4 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-gray-800">👑 {nomApp}</h1><p className="text-gray-500">{uName}</p></div>
        <div className="flex gap-1">
          <button onClick={()=>window.location.href="/dashboard"} className="bg-gray-200 px-3 py-2 rounded-xl text-sm font-semibold">📊</button>
          <button onClick={()=>window.location.href="/dashboard/tv"} className="bg-gray-800 text-white px-3 py-2 rounded-xl text-sm font-semibold">📺</button>
          <button onClick={()=>window.location.href="/valet"} className="bg-blue-600 text-white px-3 py-2 rounded-xl text-sm font-semibold">🚗</button>
          <button onClick={()=>window.location.href="/dueno/configuracion"} className="bg-purple-600 text-white px-3 py-2 rounded-xl text-sm font-semibold">⚙️</button>
        </div>
      </div>
      {msg&&<div className="bg-blue-100 text-blue-700 p-3 rounded-xl text-sm mb-4">{msg}</div>}

      <div className="grid grid-cols-2 gap-2 mb-6">
        <button onClick={()=>window.location.href="/valet/entrada"} className="bg-gradient-to-br from-blue-600 to-blue-800 text-white rounded-2xl p-5 text-center shadow-lg active:scale-95">
          <span className="text-3xl block mb-1">🚗</span><span className="font-bold text-lg">Registrar Entrada</span></button>
        <button onClick={()=>window.location.href="/dueno/configuracion"} className="bg-gradient-to-br from-purple-600 to-purple-800 text-white rounded-2xl p-5 text-center shadow-lg active:scale-95">
          <span className="text-3xl block mb-1">🔑</span><span className="font-bold text-lg">Crear Valet</span></button>
      </div>

      <div className="grid grid-cols-4 gap-2 mb-4">
        <div className="bg-white rounded-2xl shadow p-3 text-center"><p className="text-2xl font-bold text-blue-600">{total}</p><p className="text-xs text-gray-500">Activos</p></div>
        <div className="bg-white rounded-2xl shadow p-3 text-center"><p className="text-2xl font-bold text-green-600">{totHoy}</p><p className="text-xs text-gray-500">Hoy</p></div>
        <div className="bg-white rounded-2xl shadow p-3 text-center"><p className="text-2xl font-bold text-amber-600">{evs.length}</p><p className="text-xs text-gray-500">Eventos</p></div>
        <div className="bg-white rounded-2xl shadow p-3 text-center"><p className="text-2xl font-bold text-purple-600">{hist.length}</p><p className="text-xs text-gray-500">Movs</p></div>
      </div>

      <div className="bg-white rounded-2xl shadow p-4 mb-4">
        <p className="font-bold text-gray-700 mb-3">📋 Nuevo Evento</p>
        <div className="flex gap-2">
          <input value={nuevo} onChange={e=>setNuevo(e.target.value)} className="w-full p-3 border-2 border-gray-200 rounded-xl flex-1" placeholder="Ej: Boda" onKeyDown={e=>e.key==="Enter"&&crear()} />
          <button onClick={crear} className="bg-blue-600 text-white px-6 py-2 rounded-xl font-semibold">➕ Crear</button>
        </div>
      </div>

      {evs.map(ev => (
        <div key={ev.id} className="bg-white rounded-2xl shadow p-4 mb-2 flex items-center justify-between">
          <div><p className="font-bold text-gray-800">{ev.nombre}</p><p className="text-xs text-gray-500">🚗 {ev.vehiculos_totales} · {new Date(ev.fecha_apertura).toLocaleTimeString("es-ES",{hour:"2-digit",minute:"2-digit"})}</p></div>
          <div className="flex gap-2">
            <button onClick={()=>wp(`🎫 ${ev.nombre}: ${ev.vehiculos_totales} vehículos`)} className="bg-green-100 text-green-700 px-2.5 py-1.5 rounded-lg text-xs">💬</button>
            <button onClick={()=>cerrar(ev.id)} className="bg-red-100 text-red-600 px-2.5 py-1.5 rounded-lg text-xs font-semibold">🔴</button>
          </div>
        </div>
      ))}

      {/* Botones WhatsApp y Excel */}
      <div className="grid grid-cols-2 gap-2 mt-4 mb-6">
        <button onClick={exportCSV} className="bg-green-700 text-white py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 shadow active:scale-95">📊 Exportar CSV</button>
        <button onClick={()=>wp(`📊 ${nomApp}\n🚗 Activos: ${total}\n📋 Eventos: ${evs.length}\n📅 Hoy: ${totHoy}`)} className="bg-green-600 text-white py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 shadow active:scale-95">💬 WhatsApp</button>
      </div>

      {/* HISTORIAL AUDITORÍA */}
      <div className="bg-white rounded-2xl shadow p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="font-bold text-gray-700">📜 Historial (últimos 30 movimientos)</p>
        </div>
        <div className="space-y-1.5 max-h-80 overflow-y-auto">
          {hist.map((h:any) => (
            <div key={h.id} className="flex items-center gap-2 p-2 text-xs border-b border-gray-100">
              <span>{icono(h.tipo)}</span>
              {h.tn&&<span className="font-bold text-gray-700">#{h.tn}</span>}
              <span className="text-gray-500 uppercase">{h.tipo==="retiro_entregado"?"ENTREGÓ":h.tipo==="cambio_sector"?"CAMBIO":h.tipo==="entrada"?"ENTRADA":h.tipo}</span>
              <span className="text-gray-400">· {h.vn}</span>
              {h.en&&<span className="text-gray-400">· {h.en}</span>}
              <span className="text-gray-400 ml-auto">{new Date(h.creado_en).toLocaleTimeString("es-ES",{hour:"2-digit",minute:"2-digit"})}</span>
            </div>
          ))}
          {hist.length===0&&<p className="text-gray-400 text-xs text-center py-4">Sin movimientos aún</p>}
        </div>
      </div>
    </div>
  );
}

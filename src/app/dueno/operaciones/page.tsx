"use client";
export const dynamic = "force-dynamic";
import { useState, useEffect } from "react";
import { api as q, act } from "@/lib/api";

type Accion = "cambio" | "entrega";

export default function DuenoOperacionesPage() {
  const [accion, setAccion] = useState<Accion>("cambio");
  const [valets, setValets] = useState<any[]>([]);
  const [valetSel, setValetSel] = useState<any>(null);
  const [sectores, setSectores] = useState<any[]>([]);
  const [numTicket, setNumTicket] = useState("");
  const [ticket, setTicket] = useState<any>(null);
  const [sectorNuevo, setSectorNuevo] = useState("");
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");
  const [busy, setBusy] = useState(false);
  const [evNom, setEvNom] = useState("");

  const eventoId = typeof window !== "undefined" ? localStorage.getItem("eventoActivoId") : null;

  useEffect(() => {
    (async () => {
      // Nombre del evento
      if (eventoId) {
        const ev = await q(`eventos?select=nombre&id=eq.${eventoId}`);
        if (ev.length) setEvNom(ev[0].nombre);
      }
      // Valets activos
      const vs = await q(`perfiles?select=id,nombre,numero_valet&rol=eq.valet&activo=eq.true`);
      setValets(Array.isArray(vs) ? vs.sort((a: any, b: any) => (a.numero_valet || 0) - (b.numero_valet || 0)) : []);
      // Sectores
      const ss = await q(`sectores?select=id,nombre,color_hex,capacidad&activo=eq.true&order=orden`);
      if (ss.length && eventoId) {
        const con = await Promise.all(ss.map(async (s: any) => {
          const t = await q(`tickets?select=id&id_sector=eq.${s.id}&estado=eq.activo&id_evento=eq.${eventoId}`);
          return { ...s, activos: t.length };
        }));
        setSectores(con);
      } else setSectores(ss);
    })();
  }, []);

  const buscar = async () => {
    setErr(""); setTicket(null); setSectorNuevo("");
    if (!numTicket || !eventoId) { setErr("Falta número o evento"); return; }
    const d = await q(`tickets?select=id,numero_ticket,id_sector,ubicacion_exacta,estado_llave,hora_entrada,id_evento,id_vehiculo&numero_ticket=eq.${numTicket}&id_evento=eq.${eventoId}&estado=eq.activo`);
    if (!Array.isArray(d) || !d.length) { setErr("Ticket #" + numTicket + " no encontrado en este evento"); return; }
    const tk = d[0];
    // Buscar patente del vehículo
    if (tk.id_vehiculo) {
      const v = await q(`vehiculos?select=patente,modelo,color&id=eq.${tk.id_vehiculo}`);
      if (v.length) tk.vehiculo = v[0];
    }
    setTicket(tk);
  };

  const confirmarCambio = async () => {
    if (!ticket || !sectorNuevo || !valetSel) return;
    setBusy(true); setErr(""); setOk("");
    try {
      const secAnterior = sectores.find(s => s.id === ticket.id_sector);
      const secNuevo = sectores.find(s => s.id === sectorNuevo);
      await act(`tickets?id=eq.${ticket.id}`, "PATCH", { id_sector: sectorNuevo });
      await act("historial_completo", "POST", {
        id_ticket: ticket.id,
        id_evento: eventoId,
        id_valet: valetSel.id,
        tipo: "cambio_sector",
        detalles: {
          sector_anterior: secAnterior?.nombre || "",
          sector_nuevo: secNuevo?.nombre || "",
          ingresado_por_dueno: true,
        },
      });
      setOk(`✅ #${ticket.numero_ticket} movido a ${secNuevo?.nombre} como ${valetSel.nombre}`);
      setTicket(null); setNumTicket(""); setSectorNuevo("");
      setTimeout(() => setOk(""), 3000);
    } catch { setErr("Error al cambiar sector"); }
    setBusy(false);
  };

  const confirmarEntrega = async () => {
    if (!ticket || !valetSel) return;
    setBusy(true); setErr(""); setOk("");
    try {
      const secActual = sectores.find(s => s.id === ticket.id_sector);
      const ahora = new Date().toISOString();
      const tiempoSeg = ticket.hora_entrada
        ? Math.round((Date.now() - new Date(ticket.hora_entrada).getTime()) / 1000)
        : 0;
      await act(`tickets?id=eq.${ticket.id}`, "PATCH", {
        estado: "completado",
        hora_salida: ahora,
        id_valet_salida: valetSel.id,
        tiempo_espera_seg: tiempoSeg,
      });
      await act("historial_completo", "POST", {
        id_ticket: ticket.id,
        id_evento: eventoId,
        id_valet: valetSel.id,
        tipo: "retiro_entregado",
        detalles: {
          sector: secActual?.nombre || "",
          ingresado_por_dueno: true,
        },
      });
      setOk(`✅ #${ticket.numero_ticket} entregado como ${valetSel.nombre}`);
      setTicket(null); setNumTicket("");
      setTimeout(() => setOk(""), 3000);
    } catch { setErr("Error al registrar entrega"); }
    setBusy(false);
  };

  const sa = sectores.find(s => s.id === ticket?.id_sector);

  return (
    <div className="min-h-screen bg-gray-900 p-4 pb-10">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => window.history.back()} className="text-gray-400 text-3xl">←</button>
        <div>
          <p className="text-amber-400 text-xs">👑 Dueño · Operaciones</p>
          <h1 className="text-white text-xl font-bold">{evNom || "Evento"}</h1>
        </div>
      </div>

      {!eventoId ? (
        <div className="bg-red-900/50 text-red-300 p-4 rounded-2xl text-sm text-center">No hay eventos activos</div>
      ) : (
        <div className="max-w-lg mx-auto space-y-4">

          {/* Selector de acción */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => { setAccion("cambio"); setTicket(null); setNumTicket(""); setSectorNuevo(""); setErr(""); setOk(""); }}
              className={`py-5 rounded-2xl font-bold text-lg transition-all active:scale-95 ${accion === "cambio" ? "bg-orange-600 text-white ring-2 ring-orange-400 shadow-lg" : "bg-gray-800 text-gray-300 border border-gray-700"}`}
            >
              <span className="text-3xl block mb-1">🔄</span>Cambiar sector
            </button>
            <button
              onClick={() => { setAccion("entrega"); setTicket(null); setNumTicket(""); setSectorNuevo(""); setErr(""); setOk(""); }}
              className={`py-5 rounded-2xl font-bold text-lg transition-all active:scale-95 ${accion === "entrega" ? "bg-green-600 text-white ring-2 ring-green-400 shadow-lg" : "bg-gray-800 text-gray-300 border border-gray-700"}`}
            >
              <span className="text-3xl block mb-1">✅</span>Entregar auto
            </button>
          </div>

          {/* Selector de valet */}
          <div className="bg-amber-900/40 rounded-2xl p-4 border-2 border-amber-500/50">
            <p className="text-amber-300 text-xs font-semibold mb-2">👤 ¿QUÉ VALET HIZO LA OPERACIÓN? *</p>
            {valets.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-2">No hay valets activos</p>
            ) : (
              <div className="grid grid-cols-2 gap-1.5">
                {valets.map((v: any) => (
                  <button
                    key={v.id}
                    onClick={() => setValetSel(v)}
                    className={`py-3 px-3 rounded-2xl text-sm font-bold transition-all active:scale-95 text-left ${
                      valetSel?.id === v.id
                        ? "bg-amber-500 text-white shadow-lg ring-2 ring-white scale-105"
                        : "bg-gray-800 text-gray-200 border border-gray-600"
                    }`}
                  >
                    <span className="block text-xl">{valetSel?.id === v.id ? "✅" : "👤"}</span>
                    <span className="block font-bold">{v.nombre}</span>
                    <span className="block text-xs opacity-70">#{v.numero_valet}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Buscar ticket */}
          {!ticket ? (
            <div className="space-y-2">
              <p className="text-gray-400 text-sm font-semibold">🎫 N° de ticket:</p>
              <input
                value={numTicket}
                onChange={e => setNumTicket(e.target.value.replace(/\D/g, ""))}
                onKeyDown={e => e.key === "Enter" && buscar()}
                className="w-full p-4 text-3xl bg-gray-800 border border-gray-600 rounded-2xl text-white text-center font-bold"
                placeholder="001"
                inputMode="numeric"
              />
              <button onClick={buscar} className="w-full py-5 bg-blue-600 text-white rounded-2xl font-bold text-lg active:scale-95 shadow-lg">
                🔍 Buscar ticket
              </button>
            </div>
          ) : (
            <div className="bg-gray-800 rounded-2xl p-4 space-y-3">
              {/* Info del ticket */}
              <div className="flex items-center justify-between">
                <p className="text-white text-3xl font-bold">🎫 #{String(ticket.numero_ticket).padStart(3, "0")}</p>
                <button onClick={() => { setTicket(null); setNumTicket(""); setSectorNuevo(""); }} className="text-gray-400 text-sm underline">Cambiar</button>
              </div>
              <div className="bg-gray-900 rounded-xl p-3 space-y-1 text-sm">
                {ticket.vehiculo && (
                  <p className="text-white font-bold">🚗 {ticket.vehiculo.patente}{ticket.vehiculo.modelo ? " · " + ticket.vehiculo.modelo : ""}{ticket.vehiculo.color ? " · " + ticket.vehiculo.color : ""}</p>
                )}
                <p className="text-gray-300">📍 {ticket.ubicacion_exacta}</p>
                <p style={{ color: sa?.color_hex }} className="font-bold">🅿️ {sa?.nombre || "—"}</p>
                <p className={`font-bold text-xs ${ticket.estado_llave === "con_dueno" ? "text-red-400 animate-pulse" : "text-gray-400"}`}>
                  🔑 {ticket.estado_llave === "con_dueno" ? "⚠️ LLAVE CON DUEÑO" : ticket.estado_llave === "colgada" ? "Colgada" : "En cajón"}
                </p>
              </div>

              {/* CAMBIO DE SECTOR */}
              {accion === "cambio" && (
                <>
                  <p className="text-gray-300 text-sm font-semibold">🅿️ Mover a:</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {sectores.filter(s => s.id !== ticket.id_sector).map((s: any) => (
                      <button
                        key={s.id}
                        onClick={() => setSectorNuevo(s.id)}
                        className={`py-4 rounded-2xl text-sm font-bold transition-all active:scale-95 ${sectorNuevo === s.id ? "text-white shadow-lg ring-2 ring-white" : "border border-gray-700"}`}
                        style={{ backgroundColor: sectorNuevo === s.id ? s.color_hex : s.color_hex + "20", color: sectorNuevo === s.id ? "#fff" : s.color_hex }}
                      >
                        <span className="block font-bold">{s.nombre}</span>
                        <span className="text-xs opacity-80">{s.activos || 0}/{s.capacidad}</span>
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={confirmarCambio}
                    disabled={busy || !sectorNuevo || !valetSel}
                    className="w-full py-5 rounded-2xl text-white font-bold text-xl bg-gradient-to-r from-orange-600 to-orange-700 disabled:opacity-50 shadow-lg active:scale-95"
                  >
                    {busy ? "⏳" : valetSel ? `🔄 MOVER como ${valetSel.nombre}` : "🔄 MOVER (elegí valet)"}
                  </button>
                </>
              )}

              {/* ENTREGA */}
              {accion === "entrega" && (
                <button
                  onClick={confirmarEntrega}
                  disabled={busy || !valetSel}
                  className="w-full py-6 rounded-2xl text-white font-bold text-xl bg-gradient-to-r from-green-600 to-green-700 disabled:opacity-50 shadow-lg active:scale-95"
                >
                  {busy ? "⏳" : valetSel ? `✅ ENTREGAR como ${valetSel.nombre}` : "✅ ENTREGAR (elegí valet)"}
                </button>
              )}
            </div>
          )}

          {err && <div className="bg-red-900/50 text-red-300 p-3 rounded-xl text-sm text-center">{err}</div>}
          {ok && <div className="bg-green-900/50 text-green-300 p-4 rounded-2xl text-base font-semibold text-center">{ok}</div>}

        </div>
      )}
    </div>
  );
}

"use client";
export const dynamic = "force-dynamic";
import { useState, useEffect, useRef } from "react";
import { api as q, act } from "@/lib/api";

export default function DuenoEntradaPage() {
  const [valets, setValets] = useState<any[]>([]);
  const [valetSel, setValetSel] = useState<any>(null);
  const [secs, setSecs] = useState<any[]>([]);
  const [sSel, setSSel] = useState("");
  const [ubi, setUbi] = useState("");
  const [llave, setLlave] = useState("");
  const [numT, setNumT] = useState("");
  const [pat, setPat] = useState("");
  const [mod, setMod] = useState("");
  const [col, setCol] = useState("");
  const [foto, setFoto] = useState("");
  const [danos, setDanos] = useState(false);
  const [danosDesc, setDanosDesc] = useState("");
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [evNom, setEvNom] = useState("");
  const ref = useRef<HTMLInputElement>(null);
  const fotoRef = useRef<HTMLInputElement>(null);

  const getEventId = async () => {
    const stored = typeof window !== "undefined" ? localStorage.getItem("eventoActivoId") : null;
    if (stored) {
      const d = await q(`eventos?select=nombre&id=eq.${stored}`);
      if (d.length) { setEvNom(d[0].nombre); setLoading(false); return stored; }
    }
    const d = await q(`eventos?select=id,nombre&estado=eq.abierto&limit=1`);
    if (d.length) {
      if (typeof window !== "undefined") localStorage.setItem("eventoActivoId", d[0].id);
      setEvNom(d[0].nombre); setLoading(false); return d[0].id;
    }
    setLoading(false);
    return null;
  };

  const getOrCreateVehiculo = async (patente: string) => {
    const exist = await q(`vehiculos?patente=eq.${encodeURIComponent(patente)}`);
    if (exist.length) return exist[0].id;
    const d = await act("vehiculos", "POST", { patente, modelo: mod, color: col });
    if (Array.isArray(d) && d.length) return d[0].id;
    return null;
  };

  useEffect(() => {
    (async () => {
      const evId = await getEventId();
      // Cargar valets activos
      const vs = await q(`perfiles?select=id,nombre,numero_valet&rol=eq.valet&activo=eq.true&order=numero_valet`);
      setValets(vs);
      if (!evId) return;
      const d = await q(`sectores?select=id,nombre,capacidad,color_hex&activo=eq.true&order=orden`);
      if (d.length) {
        const w = await Promise.all(d.map(async (s: any) => {
          const t = await q(`tickets?select=id&id_sector=eq.${s.id}&estado=eq.activo&id_evento=eq.${evId}`);
          return { ...s, activos: t.length };
        }));
        setSecs(w);
      }
      const t = await q(`tickets?select=numero_ticket&id_evento=eq.${evId}&order=numero_ticket.desc&limit=1`);
      setNumT(String((t.length ? t[0].numero_ticket : 0) + 1));
    })();
  }, []);

  const reg = async () => {
    const evId = typeof window !== "undefined" ? localStorage.getItem("eventoActivoId") : null;
    setErr(""); setOk("");
    if (!evId) { setErr("No hay evento activo"); return; }
    if (!valetSel) { setErr("Seleccioná el valet que llevó el auto"); return; }
    const n = parseInt(numT);
    if (!n || n < 1) { setErr("Número inválido"); return; }
    if (!sSel) { setErr("Seleccioná sector"); return; }
    if (!llave) { setErr("Seleccioná estado de llave"); return; }
    const ex = await q(`tickets?select=id&numero_ticket=eq.${n}&id_evento=eq.${evId}&estado=eq.activo`);
    if (ex.length) { setErr("Ticket #" + n + " ya activo"); return; }
    setBusy(true);
    try {
      const patStr = pat.trim() ? pat.toUpperCase().trim() : "T-" + n;
      const idV = await getOrCreateVehiculo(patStr);
      if (!idV) { setErr("Error con vehículo"); setBusy(false); return; }
      if (mod || col) await act(`vehiculos?id=eq.${idV}`, "PATCH", { modelo: mod, color: col });
      const tkt = await act("tickets", "POST", {
        numero_ticket: n,
        id_evento: evId,
        id_vehiculo: idV,
        id_sector: sSel,
        ubicacion_exacta: ubi || "—",
        estado_llave: llave,
        id_valet_entrada: valetSel.id,   // ← se registra el valet seleccionado, no el dueño
        estado: "activo",
      });
      const tktId = Array.isArray(tkt) && tkt.length ? tkt[0].id : null;
      if (tktId) {
        await act("historial_completo", "POST", {
          id_ticket: tktId,
          id_evento: evId,
          id_valet: valetSel.id,
          tipo: "entrada",
          detalles: { sector: secs.find(s => s.id === sSel)?.nombre || "", llave, ingresado_por_dueno: true },
        });
      }
      setOk(`✅ #${n} registrado como ${valetSel.nombre}!`);
      setTimeout(() => {
        setSSel(""); setUbi(""); setLlave(""); setPat(""); setMod(""); setCol("");
        setFoto(""); setDanos(false); setDanosDesc(""); setOk("");
        setNumT(String(n + 1));
        ref.current?.focus();
      }, 2500);
    } catch { setErr("Error al registrar"); }
    setBusy(false);
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-900 p-4 flex items-center justify-center">
      <p className="text-white text-xl">Cargando...</p>
    </div>
  );

  const evId = typeof window !== "undefined" ? localStorage.getItem("eventoActivoId") : null;

  return (
    <div className="min-h-screen bg-gray-900 p-4 pb-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => window.history.back()} className="text-gray-400 text-3xl">←</button>
        <div>
          <p className="text-amber-400 text-xs">👑 Dueño · Registrar entrada</p>
          <h1 className="text-white text-xl font-bold">{evNom || "Evento"}</h1>
        </div>
      </div>

      {!evId ? (
        <div className="bg-red-900/50 text-red-300 p-4 rounded-2xl text-sm text-center">No hay eventos activos</div>
      ) : (
        <div className="max-w-lg mx-auto space-y-3">

          {/* SELECTOR DE VALET — lo más importante */}
          <div className="bg-amber-900/40 rounded-2xl p-4 border-2 border-amber-500/50">
            <p className="text-amber-300 text-xs font-semibold mb-2">👤 ¿QUÉ VALET LLEVÓ EL AUTO? *</p>
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
                    <span className="block text-lg">{valetSel?.id === v.id ? "✅" : "👤"}</span>
                    <span className="block font-bold">{v.nombre}</span>
                    <span className="block text-xs opacity-70">#{v.numero_valet}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Número de ticket */}
          <div className="bg-gray-800 rounded-2xl p-4 border-2 border-yellow-500/30">
            <p className="text-yellow-400 text-xs font-semibold mb-1">🎫 N° DE TICKET</p>
            <input
              ref={ref}
              type="text"
              value={numT}
              onChange={e => setNumT(e.target.value.replace(/\D/g, ""))}
              className="w-full bg-transparent text-white text-5xl font-bold text-center tracking-[0.3em] border-none focus:outline-none"
            />
          </div>

          {/* Llave */}
          <div>
            <p className="text-gray-300 text-xs mb-1.5 font-semibold">🔑 LLAVE *</p>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { k: "colgada", l: "COLGADA", e: "🔑", c: "bg-blue-600" },
                { k: "cajon", l: "CAJÓN", e: "📁", c: "bg-amber-600" },
                { k: "con_dueno", l: "DUEÑO", e: "👤", c: "bg-purple-600" },
              ].map(({ k, l, e, c }) => (
                <button
                  key={k}
                  onClick={() => setLlave(k)}
                  className={`py-4 rounded-2xl font-bold text-sm transition-all active:scale-95 ${
                    llave === k
                      ? `${c} text-white shadow-lg ring-2 ring-white scale-105`
                      : "bg-gray-800 text-gray-300 border border-gray-700"
                  }`}
                >
                  <span className="text-3xl block mb-1">{e}</span>{l}
                </button>
              ))}
            </div>
          </div>

          {/* Sector */}
          <div>
            <p className="text-gray-300 text-xs mb-1.5 font-semibold">🅿️ SECTOR *</p>
            <div className="grid grid-cols-2 gap-1.5">
              {secs.map((s: any) => (
                <button
                  key={s.id}
                  onClick={() => setSSel(s.id)}
                  className={`py-4 px-3 rounded-2xl text-sm font-bold transition-all active:scale-95 ${
                    sSel === s.id
                      ? "text-white shadow-lg scale-105 ring-2 ring-white"
                      : "border-2 border-gray-700"
                  }`}
                  style={{
                    backgroundColor: sSel === s.id ? s.color_hex : s.color_hex + "20",
                    color: sSel === s.id ? "#fff" : s.color_hex,
                  }}
                >
                  <span className="block font-bold text-base">{s.nombre}</span>
                  <span className="text-xs opacity-80">{s.activos || 0}/{s.capacidad}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Ubicación exacta */}
          <input
            value={ubi}
            onChange={e => setUbi(e.target.value)}
            className="w-full p-3 text-sm border-2 rounded-xl bg-white/10 border-gray-600 text-white"
            placeholder="Lugar exacto (opcional)"
          />

          {/* Opcionales */}
          <div className="bg-gray-800/80 rounded-2xl p-4 border border-gray-700">
            <p className="text-gray-400 text-xs font-semibold mb-2">📋 Opcionales</p>
            <div className="grid grid-cols-3 gap-1.5 mb-2">
              <input value={pat} onChange={e => setPat(e.target.value.toUpperCase())} className="w-full py-6 px-2 rounded-2xl text-lg font-bold bg-white/10 border-2 border-gray-600 text-white text-center placeholder-gray-500 uppercase tracking-wider" placeholder="Patente" />
              <input value={mod} onChange={e => setMod(e.target.value)} className="w-full py-6 px-2 rounded-2xl text-lg font-bold bg-white/10 border-2 border-gray-600 text-white text-center placeholder-gray-500" placeholder="Modelo" />
              <input value={col} onChange={e => setCol(e.target.value)} className="w-full py-6 px-2 rounded-2xl text-lg font-bold bg-white/10 border-2 border-gray-600 text-white text-center placeholder-gray-500" placeholder="Color" />
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <button type="button" onClick={() => fotoRef.current?.click()} className="w-full py-4 rounded-2xl text-sm font-bold bg-teal-700 text-white flex items-center justify-center gap-2">
                <span className="text-xl">📸</span> Foto
              </button>
              <input ref={fotoRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) setFoto(URL.createObjectURL(f)); }} />
              <button type="button" onClick={() => setDanos(!danos)} className={`w-full py-4 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 ${danos ? "bg-red-600 text-white ring-2 ring-white" : "bg-gray-800 text-gray-300 border-2 border-gray-700"}`}>
                <span className="text-xl">🔧</span> Daños
              </button>
            </div>
            {foto && <img src={foto} className="w-full h-32 object-cover rounded-xl mt-2" alt="foto" />}
            {danos && <textarea value={danosDesc} onChange={e => setDanosDesc(e.target.value)} className="w-full mt-2 p-3 rounded-xl bg-gray-900 text-white text-sm border border-red-500/30" rows={2} placeholder="Describí el daño..." />}
          </div>

          {err && <div className="bg-red-900/50 text-red-300 p-3 rounded-xl text-sm text-center">{err}</div>}
          {ok && <div className="bg-green-900/50 text-green-300 p-3 rounded-xl text-sm text-center">{ok}</div>}

          {/* Botón — muestra el valet seleccionado */}
          <button
            onClick={reg}
            disabled={busy}
            className="w-full py-6 rounded-2xl text-white font-bold text-xl shadow-lg active:scale-95 bg-gradient-to-r from-amber-600 to-amber-700 disabled:opacity-50"
          >
            {busy ? "⏳" : valetSel ? `✅ REGISTRAR como ${valetSel.nombre}` : "✅ REGISTRAR"}
          </button>
        </div>
      )}
    </div>
  );
}

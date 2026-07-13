"use client";
import { useState, useEffect, useRef } from "react";
const SB = "https://hzexxoazyhhvljqiummn.supabase.co/rest/v1/", AK = "sb_publishable_ALyCDA4qM4T68YiecEQErQ_WoYNUfen", H = { apikey: AK, Authorization: `Bearer ${AK}` };
const q = async (u: string) => { try { const r = await fetch(u, { headers: H }); const t = await r.text(); return t && t !== "[]" ? JSON.parse(t) : []; } catch { return []; } };
const act = async (u: string, m: string, d?: any) => fetch(u, { method: m, headers: { ...H, "Content-Type": "application/json" }, body: d ? JSON.stringify(d) : undefined });

export default function EntradaPage() {
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
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [evNom, setEvNom] = useState("");
  const ref = useRef<HTMLInputElement>(null);
  const fotoRef = useRef<HTMLInputElement>(null);
  const userId = typeof window !== 'undefined' ? (localStorage.getItem("valetId") || localStorage.getItem("userId")) : null;

  const getEventId = async () => {
    const stored = localStorage.getItem("eventoActivoId");
    if (stored) {
      const d = await q(`${SB}eventos?select=nombre&id=eq.${stored}`);
      if (d.length) { setEvNom(d[0].nombre); setLoading(false); return stored; }
    }
    const d = await q(`${SB}eventos?select=id,nombre&estado=eq.abierto&limit=1`);
    if (d.length) { localStorage.setItem("eventoActivoId", d[0].id); setEvNom(d[0].nombre); setLoading(false); return d[0].id; }
    setLoading(false);
    return null;
  };

  const getOrCreateVehiculo = async (patente: string) => {
    const exist = await q(`${SB}vehiculos?patente=eq.${encodeURIComponent(patente)}`);
    if (exist.length) return exist[0].id;
    const r = await fetch(`${SB}vehiculos`, { method: "POST", headers: { ...H, "Content-Type": "application/json", Prefer: "return=representation" }, body: JSON.stringify({ patente, modelo: mod, color: col }) });
    const d = await r.json();
    if (Array.isArray(d) && d.length) return d[0].id;
    if (d && d.id) return d.id;
    return null;
  };

  useEffect(() => {
    (async () => {
      const evId = await getEventId();
      if (!evId) return;
      const d = await q(`${SB}sectores?select=id,nombre,capacidad,color_hex&activo=eq.true&order=orden`);
      if (d.length) {
        const w = await Promise.all(d.map(async (s: any) => {
          const t = await q(`${SB}tickets?select=id&id_sector=eq.${s.id}&estado=eq.activo&id_evento=eq.${evId}`);
          return { ...s, activos: t.length };
        }));
        setSecs(w);
      }
      const t = await q(`${SB}tickets?select=numero_ticket&id_evento=eq.${evId}&order=numero_ticket.desc&limit=1`);
      setNumT(String((t.length ? t[0].numero_ticket : 0) + 1));
    })();
  }, []);

  const reg = async () => {
    const evId = localStorage.getItem("eventoActivoId");
    setErr(""); setOk("");
    if (!evId) { setErr("No hay evento activo"); return; }
    if (!userId) { setErr("No hay sesión"); return; }
    const n = parseInt(numT);
    if (!n || n < 1) { setErr("Número inválido"); return; }
    if (!sSel) { setErr("Seleccioná sector"); return; }
    if (!llave) { setErr("Seleccioná llave"); return; }
    const ex = await q(`${SB}tickets?select=id&numero_ticket=eq.${n}&id_evento=eq.${evId}&estado=eq.activo`);
    if (ex.length) { setErr("Ticket #" + n + " ya activo"); return; }
    setBusy(true);
    try {
      const patStr = pat.trim() ? pat.toUpperCase().trim() : "T-" + n;
      const idV = await getOrCreateVehiculo(patStr);
      if (!idV) { setErr("Error con vehículo"); setBusy(false); return; }
      if (mod || col) await act(`${SB}vehiculos?id=eq.${idV}`, "PATCH", { modelo: mod, color: col });
      const r = await fetch(`${SB}tickets`, { method: "POST", headers: { ...H, "Content-Type": "application/json", Prefer: "return=representation" }, body: JSON.stringify({ numero_ticket: n, id_evento: evId, id_vehiculo: idV, id_sector: sSel, ubicacion_exacta: ubi || "—", estado_llave: llave, id_valet_entrada: userId, estado: "activo" }) });
      const tkt = await r.json();
      const tktId = Array.isArray(tkt) && tkt.length ? tkt[0].id : tkt?.id;
      if (tktId) {
        // Registrar en historial
        await act(`${SB}historial_completo`, "POST", { id_ticket: tktId, id_evento: evId, id_valet: userId, tipo: "entrada", detalles: { sector: secs.find(s => s.id === sSel)?.nombre || "", llave } });
      }
      setOk("🎫 #" + n + " registrado!");
      setTimeout(() => { setSSel(""); setUbi(""); setLlave(""); setPat(""); setMod(""); setCol(""); setFoto(""); setDanos(false); setOk(""); setNumT(String(n + 1)); ref.current?.focus(); }, 2000);
    } catch { setErr("Error al registrar"); }
    setBusy(false);
  };

  if (loading) return <div className="min-h-screen bg-gray-900 p-4 flex items-center justify-center"><p className="text-white text-xl">Cargando...</p></div>;
  const evId = typeof window !== 'undefined' ? localStorage.getItem("eventoActivoId") : null;

  return (
    <div className="min-h-screen bg-gray-900 p-4 pb-8">
      <div className="flex items-center gap-3 mb-4"><button onClick={() => window.history.back()} className="text-gray-400 text-3xl">←</button>
        <div><p className="text-blue-400 text-xs">🚗 Entrada</p><h1 className="text-white text-xl font-bold">{evNom || "Evento"}</h1></div>
      </div>
      {!evId ? <div className="bg-red-900/50 text-red-300 p-4 rounded-2xl text-sm text-center">No hay eventos activos</div> :
      <div className="max-w-lg mx-auto space-y-3">
        <div className="bg-gray-800 rounded-2xl p-4 border-2 border-yellow-500/30">
          <p className="text-yellow-400 text-xs font-semibold mb-1">🎫 N° DE TICKET</p>
          <input ref={ref} type="text" value={numT} onChange={e => setNumT(e.target.value.replace(/\D/g, ''))} className="w-full bg-transparent text-white text-5xl font-bold text-center tracking-[0.3em] border-none focus:outline-none" />
        </div>
        <div>
          <p className="text-gray-300 text-xs mb-1.5 font-semibold">🔑 LLAVE *</p>
          <div className="grid grid-cols-3 gap-1.5">
            {[{ k: "colgada", l: "COLGADA", e: "🔑", c: "bg-blue-600" }, { k: "cajon", l: "CAJÓN", e: "📁", c: "bg-amber-600" }, { k: "con_dueno", l: "DUEÑO", e: "👤", c: "bg-purple-600" }].map(({ k, l, e, c }) => (
              <button key={k} onClick={() => setLlave(k)} className={`py-4 rounded-2xl font-bold text-sm transition-all active:scale-95 ${llave === k ? `${c} text-white shadow-lg ring-2 ring-white scale-105` : "bg-gray-800 text-gray-300 border border-gray-700"}`}>
                <span className="text-3xl block mb-1">{e}</span>{l}</button>
            ))}
          </div>
        </div>
        <div>
          <p className="text-gray-300 text-xs mb-1.5 font-semibold">🅿️ SECTOR *</p>
          <div className="grid grid-cols-2 gap-1.5">
            {secs.map((s: any) => (
              <button key={s.id} onClick={() => setSSel(s.id)} className={`py-4 px-3 rounded-2xl text-sm font-bold transition-all active:scale-95 ${sSel === s.id ? "text-white shadow-lg scale-105 ring-2 ring-white" : "border-2 border-gray-700"}`}
                style={{ backgroundColor: sSel === s.id ? s.color_hex : s.color_hex + "20", color: sSel === s.id ? "#fff" : s.color_hex }}>
                <span className="block font-bold text-base">{s.nombre}</span><span className="text-xs opacity-80">{s.activos || 0}/{s.capacidad}</span>
              </button>
            ))}
          </div>
        </div>
        <input value={ubi} onChange={e => setUbi(e.target.value)} className="w-full p-3 text-sm border-2 rounded-xl bg-white/10 border-gray-600 text-white" placeholder="Lugar (opcional)" />

        {/* OPCIONALES - Patente, Modelo, Color, Foto, Daños */}
        <div className="bg-gray-800/80 rounded-2xl p-4 border border-gray-700">
          <p className="text-gray-400 text-xs font-semibold mb-2">📋 Opcionales</p>
          <div className="grid grid-cols-3 gap-1.5 mb-2">
            <input value={pat} onChange={e => setPat(e.target.value.toUpperCase())} className="w-full py-5 px-3 text-base rounded-xl bg-white/10 border border-gray-600 text-white text-center" placeholder="Patente" />
            <input value={mod} onChange={e => setMod(e.target.value)} className="w-full py-5 px-3 text-base rounded-xl bg-white/10 border border-gray-600 text-white text-center" placeholder="Modelo" />
            <input value={col} onChange={e => setCol(e.target.value)} className="w-full py-5 px-3 text-base rounded-xl bg-white/10 border border-gray-600 text-white text-center" placeholder="Color" />
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            <button type="button" onClick={() => fotoRef.current?.click()} className="w-full py-5 rounded-2xl font-bold text-base bg-gray-700 text-white hover:bg-gray-600 active:scale-95 transition-all flex items-center justify-center gap-2">
              <span className="text-2xl">📸</span> Foto</button>
            <input ref={fotoRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) setFoto(URL.createObjectURL(f)); }} />
            <button type="button" onClick={() => setDanos(!danos)} className={`w-full py-5 rounded-2xl font-bold text-base flex items-center justify-center gap-2 active:scale-95 transition-all ${danos ? "bg-red-600 text-white" : "bg-gray-700 text-white hover:bg-gray-600"}`}>
              <span className="text-2xl">🔧</span> Daños</button>
          </div>
          {foto && <img src={foto} className="w-full h-32 object-cover rounded-xl mt-2" alt="foto" />}
          {danos && <textarea className="w-full mt-2 p-3 rounded-xl bg-gray-900 text-white text-sm border border-red-500/30" rows={2} placeholder="Describí el daño..." />}
        </div>

        {err && <div className="bg-red-900/50 text-red-300 p-3 rounded-xl text-sm text-center">{err}</div>}
        {ok && <div className="bg-green-900/50 text-green-300 p-3 rounded-xl text-sm text-center">{ok}</div>}
        <button onClick={reg} disabled={busy} className="w-full py-6 rounded-2xl text-white font-bold text-2xl shadow-lg active:scale-95 bg-gradient-to-r from-blue-600 to-blue-700 disabled:opacity-50">{busy ? "⏳" : "✅ REGISTRAR"}</button>
      </div>}
    </div>
  );
}

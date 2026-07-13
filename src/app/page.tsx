"use client";
export const dynamic = 'force-dynamic';
import { useState, useEffect } from "react";
const SB = "https://hzexxoazyhhvljqiummn.supabase.co", AK = "sb_publishable_ALyCDA4qM4T68YiecEQErQ_WoYNUfen";
const q = async (u: string) => { try { const r = await fetch(u, { headers: { apikey: AK, Authorization: `Bearer ${AK}` } }); return await r.json(); } catch { return null; } };

export default function LoginPage() {
  const [tab, setTab] = useState("valet");
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [pin, setPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [staff, setStaff] = useState<any[]>([]);
  const [vals, setVals] = useState<any[]>([]);
  const [showLista, setShowLista] = useState(false);

  useEffect(() => {
    localStorage.clear();
    setNombre(""); setApellido(""); setPin("");
    // Cargar listas de usuarios
    q(`${SB}/rest/v1/perfiles?select=id,nombre,rol&activo=eq.true`).then(d => {
      if (!Array.isArray(d)) return;
      setStaff(d.filter((x:any) => x.rol === "dueno" || x.rol === "supervisor"));
      setVals(d.filter((x:any) => x.rol === "valet"));
    });
  }, []);

  const seleccionarUsuario = (nom: string) => {
    const partes = nom.split(" ");
    setNombre(partes[0] || "");
    setApellido(partes.slice(1).join(" ") || "");
    setShowLista(false);
    setErr("");
  };

  const login = async (e: any) => {
    e.preventDefault();
    setErr(""); setBusy(true);
    try {
      const nomCompleto = (nombre.trim() + " " + apellido.trim()).trim();
      if (!nombre.trim() || !apellido.trim() || !pin) { setErr("Completá nombre, apellido y PIN"); setBusy(false); return; }
      
      if (tab === "valet") {
        const d = await q(`${SB}/rest/v1/perfiles?select=id,nombre,numero_valet&nombre=eq.${encodeURIComponent(nomCompleto)}&pin=eq.${pin}&rol=eq.valet&activo=eq.true`);
        if (!Array.isArray(d) || !d.length) { setErr("Nombre, apellido o PIN incorrecto"); setBusy(false); return; }
        localStorage.setItem("valetId", d[0].id);
        localStorage.setItem("valetNombre", d[0].nombre);
        localStorage.setItem("valetNumero", String(d[0].numero_valet));
        window.location.href = "/valet"; return;
      }
      
      const d = await q(`${SB}/rest/v1/perfiles?select=id,nombre,rol&nombre=eq.${encodeURIComponent(nomCompleto)}&pin=eq.${pin}&activo=eq.true`);
      if (!Array.isArray(d) || !d.length) { setErr("Nombre, apellido o PIN incorrecto"); setBusy(false); return; }
      localStorage.setItem("token", "ok");
      localStorage.setItem("userName", d[0].nombre);
      localStorage.setItem("userId", d[0].id);
      window.location.href = d[0].rol === "supervisor" ? "/supervisor" : "/dueno";
    } catch { setErr("Error"); }
    setBusy(false);
  };

  const i = "w-full p-4 text-lg border-2 rounded-xl bg-white/20 border-white/30 text-white placeholder-gray-400 focus:border-yellow-400 focus:outline-none";

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4" style={{WebkitTextSizeAdjust: "100%"}}>
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="text-5xl mb-3">🚗</div>
          <h1 className="text-3xl font-bold text-white">Valet Parking</h1>
        </div>
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 shadow-2xl">
          <div className="flex gap-2 mb-4">
            {[["valet","🔑 Valet","bg-blue-600"],["supervisor","👁️ Admin","bg-green-600"],["dueno","👑 Dueño","bg-purple-600"]].map(([key,label,color]) => (
              <button key={key} onClick={() => { setTab(key); setErr(""); setPin(""); setShowLista(false); }}
                className={`flex-1 py-3 px-2 rounded-xl text-sm font-semibold transition-all ${tab===key?`${color} text-white shadow-lg scale-105`:"bg-white/20 text-gray-300 hover:bg-white/30"}`}>
                {label}
              </button>
            ))}
          </div>

          {showLista && (
            <div className="mb-4 bg-white/5 rounded-xl p-3 max-h-40 overflow-y-auto">
              {(tab==="valet"?vals:staff).map((u:any) => (
                <button key={u.id} onClick={()=>seleccionarUsuario(u.nombre)}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm text-white hover:bg-white/10 mb-1">
                  👤 {u.nombre} {u.rol==="dueno"?"(Dueño)":u.rol==="supervisor"?"(Supervisor)":"(Valet)"}
                </button>
              ))}
            </div>
          )}

          <form onSubmit={login} className="space-y-3" autoComplete="off">
            <div className="flex gap-2">
              <input type="text" value={nombre} onChange={e=>setNombre(e.target.value)} className={i+" flex-1"} placeholder="Nombre" required autoComplete="off" />
              <button type="button" onClick={()=>setShowLista(!showLista)} className="px-3 py-2 bg-white/20 text-white rounded-xl text-lg hover:bg-white/30">👤</button>
            </div>
            <input type="text" value={apellido} onChange={e=>setApellido(e.target.value)} className={i} placeholder="Apellido" required autoComplete="off" />
            <div className="relative">
              <input type={showPin?"text":"password"} value={pin} onChange={e=>setPin(e.target.value)} className={i+" pr-12"} placeholder="PIN" maxLength={6} required autoComplete="new-password" />
              <button type="button" onClick={()=>setShowPin(!showPin)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl">{showPin?"🙈":"👁️"}</button>
            </div>
            {err && <div className="bg-red-500/20 text-red-300 p-3 rounded-xl text-sm text-center border border-red-500/30">{err}</div>}
            <button type="submit" disabled={busy} className="w-full py-5 rounded-2xl text-white font-bold text-xl bg-gradient-to-r from-blue-600 to-blue-700 disabled:opacity-50 shadow-lg active:scale-95 transition-all">
              {busy ? "⏳ Ingresando..." : "🚀 INGRESAR"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

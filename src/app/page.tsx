"use client";
import { useState, useEffect } from "react";
const SB = "https://hzexxoazyhhvljqiummn.supabase.co/rest/v1/", AK = "sb_publishable_ALyCDA4qM4T68YiecEQErQ_WoYNUfen", H = { apikey: AK, Authorization: `Bearer ${AK}` };
const q = async (u: string) => { try { const r = await fetch(u, { headers: H }); return await r.json(); } catch { return null; } };

export default function LoginPage() {
  const [tab, setTab] = useState("valet");
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [pin, setPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [showList, setShowList] = useState(false);

  useEffect(() => {
    localStorage.clear();
    q(`${SB}perfiles?select=id,nombre,rol,numero_valet&activo=eq.true`).then(d => { if (Array.isArray(d)) setUsers(d); });
  }, []);

  const selectUser = (nom: string) => {
    const p = nom.split(" ");
    setNombre(p[0] || "");
    setApellido(p.slice(1).join(" ") || "");
    setShowList(false);
    setErr("");
  };

  const filteredUsers = users.filter((u: any) => tab === "valet" ? u.rol === "valet" : u.rol !== "valet");

  const login = async (e: any) => {
    e.preventDefault();
    setErr(""); setBusy(true);
    const nomCompleto = (nombre.trim() + " " + apellido.trim()).trim();
    if (!nombre.trim() || !apellido.trim() || !pin) { setErr("Completá todo"); setBusy(false); return; }
    try {
      const d = await q(`${SB}perfiles?select=id,nombre,rol,numero_valet&nombre=eq.${encodeURIComponent(nomCompleto)}&pin=eq.${pin}&activo=eq.true`);
      if (!Array.isArray(d) || !d.length) { setErr("Nombre o PIN incorrecto"); setBusy(false); return; }
      const u = d[0];
      localStorage.setItem("userName", u.nombre);
      localStorage.setItem("userId", u.id);
      if (u.rol === "valet") {
        localStorage.setItem("valetId", u.id);
        localStorage.setItem("valetNombre", u.nombre);
        localStorage.setItem("valetNumero", String(u.numero_valet || ""));
        window.location.href = "/valet";
      } else {
        localStorage.setItem("token", "ok");
        window.location.href = u.rol === "supervisor" ? "/supervisor" : "/dueno";
      }
    } catch { setErr("Error"); }
    setBusy(false);
  };

  const iCls = "w-full p-4 text-lg border-2 rounded-xl bg-white/20 border-white/30 text-white placeholder-gray-400 focus:border-yellow-400 focus:outline-none";

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6"><div className="text-5xl mb-3">🚗</div><h1 className="text-3xl font-bold text-white">Valet Parking</h1></div>
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 shadow-2xl">
          <div className="flex gap-2 mb-4">
            {[["valet","🔑 Valet","bg-blue-600"],["supervisor","👁️ Admin","bg-green-600"],["dueno","👑 Dueño","bg-purple-600"]].map(([k,l,c]) => (
              <button key={k} onClick={() => { setTab(k); setErr(""); setPin(""); setShowList(false); }}
                className={`flex-1 py-3 px-2 rounded-xl text-sm font-semibold ${tab===k?`${c} text-white shadow-lg scale-105`:"bg-white/20 text-gray-300"}`}>{l}</button>
            ))}
          </div>

          <div className="flex gap-2 mb-3">
            <input type="text" value={nombre} onChange={e=>setNombre(e.target.value)} className={iCls+" flex-1"} placeholder="Nombre" required />
            <button type="button" onClick={()=>setShowList(!showList)} className="px-4 bg-white/20 text-white rounded-xl text-lg hover:bg-white/30">👤</button>
          </div>
          <input type="text" value={apellido} onChange={e=>setApellido(e.target.value)} className={iCls+" mb-3"} placeholder="Apellido" required />

          {showList && filteredUsers.length > 0 && (
            <div className="mb-3 bg-white/5 rounded-xl p-2 max-h-48 overflow-y-auto">
              {filteredUsers.map((u: any) => (
                <button key={u.id} onClick={() => selectUser(u.nombre)}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm text-white hover:bg-white/10 mb-0.5">
                  👤 {u.nombre} {u.rol === "dueno" ? "(Dueño)" : u.rol === "supervisor" ? "(Admin)" : "(Valet #" + u.numero_valet + ")"}
                </button>
              ))}
            </div>
          )}

          <div className="relative mb-3">
            <input type={showPin?"text":"password"} value={pin} onChange={e=>setPin(e.target.value)} className={iCls+" pr-12"} placeholder="PIN" maxLength={6} required />
            <button type="button" onClick={()=>setShowPin(!showPin)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl">{showPin?"🙈":"👁️"}</button>
          </div>
          {err && <div className="bg-red-500/20 text-red-300 p-3 rounded-xl text-sm text-center mb-3">{err}</div>}
          <form onSubmit={login}>
            <button type="submit" disabled={busy} className="w-full py-5 rounded-2xl text-white font-bold text-xl bg-gradient-to-r from-blue-600 to-blue-700 disabled:opacity-50 shadow-lg active:scale-95">
              {busy ? "⏳" : "🚀 INGRESAR"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}// v8 - Mon Jul 13 18:21:19 UTC 2026

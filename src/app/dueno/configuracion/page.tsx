"use client";
import { useState, useEffect } from "react";

// Simple fetch via proxy
async function proxy(path: string) {
  try {
    const r = await fetch("/api/db?path=" + encodeURIComponent(path));
    const t = await r.text();
    if (!t || t === "[]") return [];
    return JSON.parse(t);
  } catch { return []; }
}

async function action(path: string, method: string, data?: any) {
  await fetch("/api/db", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path, method, data }),
  });
}

export default function ConfigPage() {
  const [items, setItems] = useState<any>({ sectors: [], valets: [] });
  const [editing, setEditing] = useState("");
  const [msg, setMsg] = useState("");

  const load = async () => {
    const s = await proxy("sectores?select=*&order=orden");
    const v = await proxy("perfiles?select=*&order=numero_valet");
    setItems({ sectors: Array.isArray(s) ? s : [], valets: Array.isArray(v) ? v : [] });
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-4" style={{ maxWidth: 640, margin: "0 auto" }}>
      <button onClick={() => window.history.back()} className="text-2xl mb-4">{"<"}</button>
      <h1 className="text-2xl font-bold mb-4">Config</h1>
      {msg && <div className="bg-blue-100 text-blue-700 p-3 rounded-xl text-sm mb-4">{msg}</div>}
      <p className="text-sm text-gray-500 mb-4">Sectores: {items.sectors.length} | Valets: {items.valets.filter((v: any) => v.rol === "valet").length} | Admins: {items.valets.filter((v: any) => v.rol === "supervisor").length}</p>
      {items.sectors.map((s: any) => (
        <div key={s.id} className="border rounded-xl p-3 mb-2 flex items-center gap-2">
          <span className="w-4 h-4 rounded-full" style={{ backgroundColor: s.color_hex }} />
          <span className="flex-1">{s.nombre} ({s.capacidad})</span>
        </div>
      ))}
    </div>
  );
}
"use client";
export const dynamic = 'force-dynamic';
import { useState, useEffect } from "react";
import { api as q } from "@/lib/api";

export default function TVPage() {
  const [hora, setHora] = useState(new Date());
  const [evData, setEvData] = useState<any[]>([]); // uno por evento: { id, nombre, secs: [], tkts: [], total, vehiculosTotales }
  const [nomApp, setNomApp] = useState("Valet Parking");

  useEffect(() => { const t = setInterval(() => setHora(new Date()), 1000); return () => clearInterval(t); }, []);
  useEffect(() => { cargar(); const t = setInterval(cargar, 3000); return () => clearInterval(t); }, []);

  const cargar = async () => {
    const c = await q(`configuracion_app?select=nombre_app`);
    if (Array.isArray(c) && c.length) setNomApp(c[0].nombre_app);

    const e = await q(`eventos?select=id,nombre&estado=eq.abierto`);
    const eventos = Array.isArray(e) ? e : [];
    const sectoresBase = await q(`sectores?select=id,nombre,capacidad,color_hex&activo=eq.true&order=orden`);
    const sb = Array.isArray(sectoresBase) ? sectoresBase : [];

    const porEvento = await Promise.all(eventos.map(async (ev: any) => {
      const todosTickets = await q(`tickets?select=id&id_evento=eq.${ev.id}`);
      const vehiculosTotales = Array.isArray(todosTickets) ? todosTickets.length : 0;

      const secs = await Promise.all(sb.map(async (s: any) => {
        const t = await q(`tickets?select=id&id_sector=eq.${s.id}&estado=eq.activo&id_evento=eq.${ev.id}`);
        return { ...s, activos: Array.isArray(t) ? t.length : 0 };
      }));
      const total = secs.reduce((a: number, b: any) => a + (b.activos || 0), 0);

      const tktsRaw = await q(`tickets?select=numero_ticket,id_sector,ubicacion_exacta,estado_llave&id_evento=eq.${ev.id}&estado=eq.activo&order=numero_ticket`);
      const tkts = (Array.isArray(tktsRaw) ? tktsRaw : []).map((x: any) => {
        const sec = secs.find((y: any) => y.id === x.id_sector);
        return { ...x, sector_nombre: sec?.nombre || "", sector_color: sec?.color_hex || "#666" };
      });

      return { ...ev, secs, tkts, total, vehiculosTotales };
    }));

    setEvData(porEvento);
  };

  const cols = evData.length <= 1 ? "grid-cols-1" : evData.length === 2 ? "grid-cols-2" : "grid-cols-2 lg:grid-cols-3";

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6" style={{ fontFamily: "'Segoe UI',sans-serif" }}>
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4"><div className="text-5xl">🚗</div><div><h1 className="text-4xl font-bold">{nomApp}</h1><p className="text-lg text-gray-400 mt-1">{hora.toLocaleDateString("es-ES", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p></div></div>
        <div className="text-right"><p className="text-5xl font-light tabular-nums">{hora.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}</p><p className="text-lg text-gray-400">En vivo</p></div>
      </div>

      {evData.length === 0 && (
        <div className="text-center py-20"><span className="text-6xl block mb-4">📋</span><p className="text-2xl text-gray-500">Sin eventos abiertos</p></div>
      )}

      <div className={`grid ${cols} gap-6`}>
        {evData.map((ev: any) => (
          <div key={ev.id} className="bg-gray-900 rounded-3xl p-5 flex flex-col" style={{ minHeight: 420 }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">{ev.nombre}</h2>
              <span className="text-xl font-semibold text-blue-400">{ev.vehiculosTotales} <span className="text-sm font-normal text-gray-400">vehículos</span></span>
            </div>

            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg font-semibold">🅿️ Sectores</span>
              <span className="text-2xl font-bold text-blue-400">{ev.total}</span>
            </div>
            <div className="space-y-1.5 mb-4">
              {ev.secs.map((s: any) => {
                const pct = s.capacidad > 0 ? Math.round((s.activos / s.capacidad) * 100) : 0;
                return (
                  <div key={s.id} className="bg-gray-800 rounded-xl p-2">
                    <div className="flex items-center justify-between mb-1 text-sm">
                      <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color_hex }} /><span className="font-medium">{s.nombre}</span></div>
                      <span className="font-bold" style={{ color: s.color_hex }}>{s.activos}<span className="text-xs font-normal text-gray-500">/{s.capacidad}</span></span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden"><div className="h-full rounded-full transition-all duration-1000" style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: s.color_hex }} /></div>
                  </div>
                );
              })}
            </div>

            <div className="flex-1 overflow-y-auto space-y-1.5">
              {ev.tkts.map((t: any, i: number) => (
                <div key={i} className="bg-gray-800 rounded-xl p-2 flex items-center gap-3">
                  <span className="text-xl font-bold text-yellow-400">#{String(t.numero_ticket).padStart(3, "0")}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: t.sector_color }} /><span className="text-sm font-semibold" style={{ color: t.sector_color }}>{t.sector_nombre}</span></div>
                    <p className="text-xs text-gray-400">📍 {t.ubicacion_exacta}</p>
                  </div>
                </div>
              ))}
              {ev.tkts.length === 0 && <div className="text-center py-8"><p className="text-gray-600">Sin vehículos</p></div>}
            </div>
          </div>
        ))}
      </div>

      <div className="fixed bottom-4 left-0 right-0 text-center"><p className="text-gray-600 text-sm">{nomApp} · En vivo</p></div>
    </div>
  );
}

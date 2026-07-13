"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/db";
import Logo from "@/components/ui/Logo";

type Sector = { id: string; nombre: string; capacidad: number; color_hex: string; activos: number };

export default function TVDashboardPage() {
  const [sectores, setSectores] = useState<Sector[]>([]);
  const [eventos, setEventos] = useState<any[]>([]);
  const [ticketsActivos, setTicketsActivos] = useState<any[]>([]);
  const [totalVehiculos, setTotalVehiculos] = useState(0);
  const [nombreApp, setNombreApp] = useState("Valet Parking");
  const [hora, setHora] = useState(new Date());

  useEffect(() => { const t = setInterval(() => setHora(new Date()), 1000); return () => clearInterval(t); }, []);
  useEffect(() => { cargarDatos(); const t = setInterval(cargarDatos, 3000); return () => clearInterval(t); }, []);

  async function cargarDatos() {
    try {
      const config = await db.select("configuracion_app", { single: true });
      if (config) setNombreApp(config.nombre_app || "Valet Parking");

      const evs = await db.select("eventos", { filters: { estado: "abierto" }, select: "id, nombre, vehiculos_totales" });
      if (evs) setEventos(evs);

      const secs = await db.select("sectores", { filters: { activo: "true" }, order: "orden" });
      let sectoresConActivos: Sector[] = [];
      if (Array.isArray(secs)) {
        sectoresConActivos = await Promise.all(secs.map(async (s: any) => {
          const tickets = await db.select("tickets", { filters: { id_sector: s.id, estado: "activo" } });
          return { ...s, activos: Array.isArray(tickets) ? tickets.length : 0 };
        }));
        setSectores(sectoresConActivos);
        setTotalVehiculos(sectoresConActivos.reduce((sum, s) => sum + (s.activos || 0), 0));
      }

      // Tickets activos con sector para TV
      const tkts = await db.select("tickets", {
        filters: { estado: "activo" },
        order: "numero_ticket",
      });
      if (Array.isArray(tkts) && sectoresConActivos.length > 0) {
        const enriched = await Promise.all(tkts.map(async (t: any) => {
          const s = sectoresConActivos.find((sec: any) => sec.id === t.id_sector);
          const p = await db.select("perfiles", { filters: { id: t.id_valet_entrada }, select: "nombre", single: true });
          return {
            ...t,
            sector_nombre: s?.nombre || "",
            sector_color: s?.color_hex || "#666",
            valet_nombre: (p as any)?.nombre || "",
          };
        }));
        setTicketsActivos(enriched);
      }
    } catch (e) { console.error(e); }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8" style={{ fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      <div className="flex items-start justify-between mb-10">
        <div className="flex items-center gap-6">
          <Logo size={80} />
          <div>
            <h1 className="text-5xl font-bold tracking-tight">{nombreApp}</h1>
            <p className="text-2xl text-gray-400 mt-2">{hora.toLocaleDateString("es-ES", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-7xl font-light tabular-nums">{hora.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}</p>
          <p className="text-xl text-gray-400">En vivo</p>
        </div>
      </div>

      {eventos.length > 0 && (
        <div className="flex gap-6 mb-8">
          {eventos.map((ev: any) => (
            <div key={ev.id} className="bg-blue-900/40 border border-blue-500/30 rounded-3xl px-8 py-4">
              <p className="text-2xl font-semibold">{ev.nombre}</p>
              <p className="text-5xl font-bold mt-1">{ev.vehiculos_totales} <span className="text-2xl font-normal text-gray-400">vehículos</span></p>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-6" style={{ height: 'calc(100vh - 300px)' }}>
        {/* IZQUIERDA: SECTORES */}
        <div className="flex flex-col">
          <h2 className="text-3xl font-semibold mb-4 flex items-center gap-4">
            🅿️ Sectores <span className="text-5xl font-bold text-blue-400">{totalVehiculos}</span>
            <span className="text-xl font-normal text-gray-400">/ 1305</span>
          </h2>
          <div className="flex-1 overflow-y-auto space-y-2 pr-2">
            {sectores.map((s) => {
              const pct = s.capacidad > 0 ? Math.round((s.activos / s.capacidad) * 100) : 0;
              return (
                <div key={s.id} className="bg-gray-900 rounded-2xl p-3">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color_hex }} />
                      <span className="text-lg font-semibold">{s.nombre}</span>
                    </div>
                    <span className="text-xl font-bold" style={{ color: s.color_hex }}>{s.activos}<span className="text-sm font-normal text-gray-500">/{s.capacidad}</span></span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: s.color_hex }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* DERECHA: LISTA DE VEHÍCULOS POR TICKET */}
        <div className="flex flex-col">
          <h2 className="text-3xl font-semibold mb-4">🎫 Vehículos Estacionados</h2>
          <div className="flex-1 overflow-y-auto space-y-2 pr-2">
            {ticketsActivos.map((t) => (
              <div key={t.id} className="bg-gray-900 rounded-2xl p-4 flex items-center gap-4">
                <span className="text-4xl font-bold text-yellow-400">#{String(t.numero_ticket).padStart(3, "0")}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: t.sector_color }} />
                    <span className="text-xl font-semibold" style={{ color: t.sector_color }}>{t.sector_nombre}</span>
                  </div>
                  <p className="text-sm text-gray-400 mt-1">
                    📍 {t.ubicacion_exacta} · 🔑 {t.estado_llave === "colgada" ? "Colgada" : t.estado_llave === "cajon" ? "Cajón" : "Dueño"}
                  </p>
                </div>
              </div>
            ))}
            {ticketsActivos.length === 0 && (
              <div className="text-center py-20">
                <span className="text-6xl block mb-4">🅿️</span>
                <p className="text-2xl text-gray-500">No hay vehículos estacionados</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="fixed bottom-4 left-0 right-0 text-center">
        <p className="text-gray-600 text-sm">{nombreApp} · Datos en vivo</p>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { db } from "@/lib/db";
import Logo from "@/components/ui/Logo";

type Sector = { id: string; nombre: string; capacidad: number; color_hex: string; activos: number };

export default function DashboardPage() {
  const router = useRouter();
  const perfil = useAppStore((s) => s.perfil);

  const [sectores, setSectores] = useState<Sector[]>([]);
  const [nombreApp, setNombreApp] = useState("Valet Parking");
  const [totalVehiculos, setTotalVehiculos] = useState(0);

  const cargarDatos = useCallback(async () => {
    try {
      const config = await db.select("configuracion_app", { single: true });
      if (config) setNombreApp(config.nombre_app || "Valet Parking");

      const secs = await db.select("sectores", { filters: { activo: "true" }, order: "orden" });
      if (secs?.length) {
        let total = 0;
        const result = await Promise.all(
          secs.map(async (s: any) => {
            const activeTickets = await fetch(`/api/db?table=tickets&select=id&filters=id_sector=eq.${s.id}&filters=estado=eq.activo`).then(r => r.json());
            const activos = Array.isArray(activeTickets) ? activeTickets.length : 0;
            total += activos;
            return { ...s, activos };
          })
        );
        setSectores(result);
        setTotalVehiculos(total);
      }
    } catch (e) {
      console.error("Error cargando datos:", e);
    }
  }, []);

  useEffect(() => { cargarDatos(); const t = setInterval(cargarDatos, 5000); return () => clearInterval(t); }, [cargarDatos]);

  return (
    <div className="min-h-screen bg-gray-50 p-4 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Logo size={40} />
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{nombreApp}</h1>
            <p className="text-sm text-gray-500">{new Date().toLocaleDateString("es-ES", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
          </div>
        </div>
        <button onClick={() => perfil ? router.push("/dueno") : router.push("/")}
          className="bg-gray-800 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-gray-700">
          {perfil ? "Menú" : "Ingresar"}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="card-valet text-center">
          <p className="text-4xl font-bold text-blue-600">{totalVehiculos}</p>
          <p className="text-sm text-gray-500">Vehículos Activos</p>
        </div>
        <div className="card-valet text-center">
          <p className="text-4xl font-bold text-green-600">{sectores.filter((s) => s.activos > 0).length}</p>
          <p className="text-sm text-gray-500">Sectores en Uso</p>
        </div>
      </div>

      <h2 className="text-lg font-bold text-gray-700 mb-3">🅿️ Ocupación por Sector</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-6">
        {sectores.map((s) => {
          const pct = s.capacidad > 0 ? Math.round((s.activos / s.capacidad) * 100) : 0;
          return (
            <div key={s.id} className="card-valet p-3 animate-fade-in">
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-sm text-gray-700">{s.nombre}</span>
                <span className="text-xs font-bold" style={{ color: s.color_hex }}>{s.activos}/{s.capacidad}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                <div className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: s.color_hex }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

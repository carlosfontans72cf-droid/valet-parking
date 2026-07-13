"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "@/lib/db";

type EventoData = { id: string; nombre: string; fecha_apertura: string; fecha_cierre: string | null; vehiculos_totales: number; estado: string };
type Movimiento = { id: string; tipo: string; valet: string; creado_en: string; detalles: any };

export default function EventoDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [evento, setEvento] = useState<EventoData | null>(null);
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);

  useEffect(() => {
    if (!id) return;
    cargarEvento();
    const t = setInterval(cargarEvento, 5000);
    return () => clearInterval(t);
  }, [id]);

  async function cargarEvento() {
    try {
      const ev = await db.select("eventos", { filters: { id }, single: true });
      if (ev) setEvento(ev as any);

      const hist = await db.select("historial_completo", {
        filters: { id_evento: id },
        order: "creado_en.desc",
        limit: 100,
      });
      if (Array.isArray(hist)) {
        const movs = await Promise.all(hist.map(async (h: any) => {
          const p = await db.select("perfiles", { filters: { id: h.id_valet }, select: "nombre", single: true });
          return { ...h, valet: (p as any)?.nombre || "—" };
        }));
        setMovimientos(movs);
      }
    } catch (e) { console.error(e); }
  }

  const compartirWhatsApp = () => {
    if (!evento) return;
    const texto = `📋 *${evento.nombre}*
🚗 Vehículos: ${evento.vehiculos_totales}
🕐 ${new Date(evento.fecha_apertura).toLocaleString("es-ES")}
📌 Estado: ${evento.estado === "abierto" ? "🟢 Activo" : "🔴 Cerrado"}

📊 Vista completa: https://valet-parking-psi.vercel.app/evento/${id}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, "_blank");
  };

  const exportarCSV = () => {
    const csv = "Fecha,Hora,Acción,Valet,Detalles\n" + movimientos.map((m) =>
      `${new Date(m.creado_en).toLocaleDateString("es-ES")},${new Date(m.creado_en).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })},${m.tipo},${m.valet},${JSON.stringify(m.detalles || "")}`
    ).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `${evento?.nombre || "evento"}-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  if (!evento) return <div className="p-8 text-center text-gray-500">Cargando...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-4 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="text-gray-500 text-2xl">←</button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{evento.nombre}</h1>
            <p className="text-sm text-gray-500">{evento.estado === "abierto" ? "🟢 Activo" : "🔴 Cerrado"} · 🚗 {evento.vehiculos_totales} vehículos</p>
          </div>
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        <button onClick={compartirWhatsApp} className="btn-valet-sm bg-green-600 flex items-center gap-1">💬 WhatsApp</button>
        <button onClick={exportarCSV} className="btn-valet-sm bg-blue-700 flex items-center gap-1">📊 Exportar CSV</button>
      </div>

      <h2 className="text-lg font-bold text-gray-700 mb-3">📜 Movimientos ({movimientos.length})</h2>
      <div className="space-y-2">
        {movimientos.map((m) => (
          <div key={m.id} className="card-valet p-3 animate-fade-in text-sm">
            <div className="flex items-center gap-2">
              <span className={`text-lg ${m.tipo === "entrada" ? "🚗" : m.tipo === "retiro_entregado" ? "✅" : m.tipo === "cambio_sector" ? "🔄" : "📍"}`} />
              <div className="flex-1">
                <p className="font-semibold text-gray-700">
                  {m.tipo === "entrada" ? "ENTRADA" : m.tipo === "retiro_entregado" ? "ENTREGADO" : m.tipo === "cambio_sector" ? "CAMBIO" : m.tipo}
                  {' — '}<span className="font-normal text-gray-600">{m.valet}</span>
                </p>
                {m.detalles && typeof m.detalles === "object" && (
                  <p className="text-xs text-gray-400">
                    {m.detalles.sector_anterior && `${m.detalles.sector_anterior} → ${m.detalles.sector_nuevo}`}
                    {m.detalles.tiempo_seg && `⏱️ ${Math.round(m.detalles.tiempo_seg / 60)} min`}
                  </p>
                )}
              </div>
              <span className="text-xs text-gray-400">{new Date(m.creado_en).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}</span>
            </div>
          </div>
        ))}
        {movimientos.length === 0 && <p className="text-center text-gray-400 py-8">No hay movimientos registrados</p>}
      </div>
    </div>
  );
}

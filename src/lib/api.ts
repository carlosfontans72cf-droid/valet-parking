"use client";
// Cliente de datos compartido por toda la app.
// Antes cada página hacía fetch directo a Supabase con una URL y una API key
// hardcodeadas. Ahora todas pasan por /api/db, que habla con Firebase.
// La forma de llamar (tabla + query tipo "col=eq.valor", PATCH, DELETE, etc.)
// se mantiene igual para no tener que tocar la lógica de cada pantalla.

export async function api(path: string): Promise<any[]> {
  try {
    const r = await fetch("/api/db?path=" + encodeURIComponent(path));
    const t = await r.text();
    return t && t !== "[]" ? JSON.parse(t) : [];
  } catch {
    return [];
  }
}

export async function act(path: string, method: string, data?: any): Promise<any[]> {
  try {
    const r = await fetch("/api/db", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path, method, data }),
    });
    const t = await r.text();
    return t && t !== "[]" ? JSON.parse(t) : [];
  } catch {
    return [];
  }
}

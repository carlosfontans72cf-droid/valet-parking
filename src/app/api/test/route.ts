import { NextResponse } from "next/server";
const SB = "https://hzexxoazyhhvljqiummn.supabase.co";
const AC = "sb_publishable_ALyCDA4qM4T68YiecEQErQ_WoYNUfen";

export async function GET() {
  try {
    const res = await fetch(`${SB}/rest/v1/sectores?select=id,nombre&order=orden`, {
      headers: { apikey: AC, Authorization: `Bearer ${AC}` },
    });
    const data = await res.json();
    return NextResponse.json({ ok: true, count: data.length, sectors: data.map((s: any) => s.nombre) });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message });
  }
}

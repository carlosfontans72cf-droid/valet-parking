import { NextRequest, NextResponse } from "next/server";
const SB = "https://hzexxoazyhhvljqiummn.supabase.co";
const AC = "sb_publishable_ALyCDA4qM4T68YiecEQErQ_WoYNUfen";

export async function GET(req: NextRequest) {
  const path = req.nextUrl.searchParams.get("path") || "";
  const url = `${SB}/rest/v1/${path}`;
  const res = await fetch(url, { headers: { apikey: AC, Authorization: `Bearer ${AC}` } });
  const txt = await res.text();
  return new NextResponse(txt, { status: res.status, headers: { "Content-Type": "application/json" } });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { path, method = "POST", data } = body;
  const url = `${SB}/rest/v1/${path}`;
  const res = await fetch(url, {
    method: method === "PATCH" ? "PATCH" : method === "DELETE" ? "DELETE" : "POST",
    headers: { apikey: AC, Authorization: `Bearer ${AC}`, "Content-Type": "application/json" },
    body: data ? JSON.stringify(data) : undefined,
  });
  const txt = await res.text();
  return new NextResponse(txt, { status: res.status, headers: { "Content-Type": "application/json" } });
}

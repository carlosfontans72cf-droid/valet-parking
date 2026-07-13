"use client";
import { useState, useEffect } from "react";
export default function TestPage() {
  const [data, setData] = useState("cargando...");
  useEffect(() => {
    fetch("https://hzexxoazyhhvljqiummn.supabase.co/rest/v1/eventos?select=id,nombre&estado=eq.abierto", {
      headers: { apikey: "sb_publishable_ALyCDA4qM4T68YiecEQErQ_WoYNUfen", Authorization: "Bearer sb_publishable_ALyCDA4qM4T68YiecEQErQ_WoYNUfen" }
    }).then(r => r.text()).then(t => setData(t)).catch(e => setData("Error: " + e.message));
  }, []);
  return <div style={{padding:20,color:'white',background:'#111',minHeight:'100vh'}}><h1>Test API</h1><pre>{data}</pre></div>;
}

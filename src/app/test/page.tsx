"use client";
import { useState, useEffect } from "react";
import { api } from "@/lib/api";
export default function TestPage() {
  const [data, setData] = useState("cargando...");
  useEffect(() => {
    api("eventos?select=id,nombre&estado=eq.abierto")
      .then(d => setData(JSON.stringify(d, null, 2)))
      .catch(e => setData("Error: " + e.message));
  }, []);
  return <div style={{padding:20,color:'white',background:'#111',minHeight:'100vh'}}><h1>Test API (Firebase)</h1><pre>{data}</pre></div>;
}

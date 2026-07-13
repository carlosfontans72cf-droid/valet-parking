"use client";
import { create } from "zustand";

export const useAppStore = create((set) => ({
  perfil: null,
  eventoActivoId: typeof window !== 'undefined' ? localStorage.getItem("eventoActivoId") : null,
  eventoActivoNombre: "",
  setEventoActivo: (id: string, nombre: string) => {
    localStorage.setItem("eventoActivoId", id);
    set({ eventoActivoId: id, eventoActivoNombre: nombre });
  },
  setPerfil: (p: any) => set({ perfil: p }),
}));

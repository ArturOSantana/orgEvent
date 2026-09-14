import { create } from 'zustand'

interface EventoAtivo {
  id: string
  nome: string
}

interface EventoStore {
  eventoAtivo: EventoAtivo | null
  setEventoAtivo: (evento: EventoAtivo | null) => void
}

export const useEventoStore = create<EventoStore>((set) => ({
  eventoAtivo: null,
  setEventoAtivo: (evento) => set({ eventoAtivo: evento }),
}))

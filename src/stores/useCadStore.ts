import { create } from 'zustand';

interface CadState {
    scale: number;      // Nivel de Zoom
    position: { x: number, y: number }; // Pan (Desplazamiento)
    activeTool: 'SELECT' | 'PAN' | 'MEASURE' | 'DRAW_LINE';
    selectedPointId: number | null;

    setScale: (scale: number) => void;
    setPosition: (pos: { x: number, y: number }) => void;
    setTool: (tool: CadState['activeTool']) => void;
    selectPoint: (id: number | null) => void;
}

export const useCadStore = create<CadState>((set) => ({
    scale: 1,
    position: { x: 0, y: 0 },
    activeTool: 'SELECT',
    selectedPointId: null,

    setScale: (scale) => set({ scale }),
    setPosition: (position) => set({ position }),
    setTool: (activeTool) => set({ activeTool }),
    selectPoint: (selectedPointId) => set({ selectedPointId }),
}));
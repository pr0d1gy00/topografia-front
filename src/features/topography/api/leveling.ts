import { api } from "../../../libs/axios";

// --- LIBRETAS (Runs) ---

// Obtener todas las libretas de un proyecto
export const fetchLevelingRuns = async (projectId: number) => {
  // Nota: Asegúrate de que tu backend tenga este endpoint.
  // Si da 404, revisaremos el controller de NestJS después.
  const { data } = await api.get(`/leveling/project/${projectId}`);
  return data;
};

// Crear una nueva libreta
export const createLevelingRun = async (data: any) => {
  return api.post("/leveling/run", data);
};

// --- LECTURAS (Readings) ---

// Obtener el detalle completo de una libreta (con sus lecturas calculadas)
export const fetchLevelingRunDetails = async (runId: number) => {
  const { data } = await api.get(`/leveling/run/${runId}`);
  return data;
};

// Agregar una fila a la libreta
export const addLevelingReading = async (data: any) => {
  return api.post("/leveling/reading", data);
};
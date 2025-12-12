import { api } from "../../../libs/axios";

export const fetchPoints = async (projectId: number) => {
  const { data } = await api.get(`/points/project/${projectId}`);
  return data;
};

export const createPoint = async (data: any) => {
  return api.post("/points", data);
};

// --- NUEVA: Para guardar cuando muevas un punto ---
export const updatePoint = async ({ id, ...data }: { id: number; x?: number; y?: number; z?: number; name?: string }) => {
  return api.patch(`/points/${id}`, data);
};
// --------------------------------------------------

export const deletePoint = async (id: number) => {
  return api.delete(`/points/${id}`);
};

export const fetchProjectById = async (id: number) => {
  const { data } = await api.get(`/projects/${id}`);
  return data;
};
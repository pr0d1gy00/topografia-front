import { api } from "../../../libs/axios";

export const fetchSurfaces = async (projectId: number) => {
  const { data } = await api.get(`/surfaces/project/${projectId}`);
  return data;
};

export const createSurface = async (data: any) => {
  return api.post("/surfaces", data);
};

export const addPointsToSurface = async (surfaceId: number, pointIds: number[]) => {
  return api.post(`/surfaces/${surfaceId}/points`, { pointIds });
};

// --- NUEVA FUNCIÓN ---
export const calculateVolume = async (initialId: number, finalId: number) => {
  const { data } = await api.post("/surfaces/calculate-volume", { initialId, finalId });
  return data;
};
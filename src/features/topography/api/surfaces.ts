import { api } from "../../../libs/axios";

// --- SUPERFICIES ---
export const fetchSurfaces = async (projectId: number) => {
  const { data } = await api.get(`/surfaces/project/${projectId}`);
  return data;
};

export const createSurface = async (data: any) => {
  // data: { projectId, name, type: 'INITIAL' | 'FINAL' }
  return api.post("/surfaces", data);
};

export const addPointsToSurface = async (surfaceId: number, pointIds: number[]) => {
  return api.post(`/surfaces/${surfaceId}/points`, { pointIds });
};
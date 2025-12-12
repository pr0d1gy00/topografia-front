import { api } from "../../../libs/axios";

export const fetchLayers = async (projectId: number) => {
  const { data } = await api.get(`/layers/project/${projectId}`);
  return data;
};

export const createLayer = async (data: any) => {
  return api.post("/layers", data);
};

// --- NUEVA: Para guardar las líneas dibujadas ---
export const updateLayer = async ({ id, ...data }: { id: number; drawingData?: any; visible?: boolean; name?: string; color?: string }) => {
  return api.patch(`/layers/${id}`, data);
};
// --------------------------------------------------

export const toggleLayerVisibility = async (id: number, visible: boolean) => {
  return api.patch(`/layers/${id}`, { visible });
};

export const deleteLayer = async (id: number) => {
  return api.delete(`/layers/${id}`);
};
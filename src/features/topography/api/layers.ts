import { api } from "../../../libs/axios";

// --- CAPAS ---
export const fetchLayers = async (projectId: number) => {
  const { data } = await api.get(`/layers/project/${projectId}`);
  return data;
};

export const createLayer = async (data: any) => {
  // data: { projectId, name, color, visible }
  return api.post("/layers", data);
};

export const toggleLayerVisibility = async (id: number, visible: boolean) => {
  return api.patch(`/layers/${id}`, { visible });
};

export const deleteLayer = async (id: number) => {
  return api.delete(`/layers/${id}`);
};
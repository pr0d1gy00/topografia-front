import { api } from "../../../libs/axios";

// Obtener puntos de un proyecto
export const fetchPoints = async (projectId: number) => {
  const { data } = await api.get(`/points/project/${projectId}`);
  return data;
};

// Crear punto manual
export const createPoint = async (data: any) => {
  return api.post("/points", data);
};

// Borrar punto
export const deletePoint = async (id: number) => {
  return api.delete(`/points/${id}`);
};

// Obtener info del proyecto (Header)
export const fetchProjectById = async (id: number) => {
  // Nota: Asumo que tienes este endpoint en el backend, si no, usa el de listar todos y filtra
  // O crea un endpoint simple GET /projects/:id en NestJS
  const { data } = await api.get(`/projects/${id}`); 
  return data;
};
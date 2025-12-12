import { api } from "../../../libs/axios";

export const fetchProjects = async () => {
  // Hardcodeamos el usuario 1 por ahora
  const { data } = await api.get("/projects/user/1");
  return data;
};

export const createProject = async (projectData: any) => {
  // Enviamos userId: 1 implícitamente
  return api.post("/projects", { ...projectData, userId: 1 });
};

export const deleteProject = async (id: number) => {
  return api.delete(`/projects/${id}`);
};
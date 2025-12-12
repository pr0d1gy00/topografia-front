import { api } from "../../../libs/axios";

// Fetch projects for user 1 (hardcoded for now)
export const fetchProjects = async () => {
  const { data } = await api.get("/projects/user/1");
  return data;
};

// Create a new project
export const createProject = async (data: any) => {
  // We attach userId: 1 manually for now
  return api.post("/projects", { ...data, userId: 1 });
};

// Delete a project
export const deleteProject = async (id: number) => {
  return api.delete(`/projects/${id}`);
};
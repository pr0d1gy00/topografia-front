import { api } from "../../../libs/axios";

// Fetch stations for a project
export const fetchStations = async (projectId: number) => {
  const { data } = await api.get(`/stations/project/${projectId}`);
  return data;
};

// Create a station
export const createStation = async (data: any) => {
  return api.post("/stations", data);
};

// Create an observation
export const createObservation = async (data: any) => {
  return api.post("/observations", data);
};
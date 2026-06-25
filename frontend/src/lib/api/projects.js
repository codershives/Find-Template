import { apiClient } from './client';

export const getProjects = async () => {
  const { data } = await apiClient.get('/projects');
  return data;
};

export const createProject = async (payload) => {
  const { data } = await apiClient.post('/projects', payload);
  return data;
};

export const getProject = async (id) => {
  const { data } = await apiClient.get(`/projects/${id}`);
  return data;
};

export const deleteProject = async (id) => {
  const { data } = await apiClient.delete(`/projects/${id}`);
  return data;
};

export const updateProject = async (id, payload) => {
  const { data } = await apiClient.put(`/projects/${id}`, payload);
  return data;
};

export const updateProjectStatus = async (id, payload) => {
  const { data } = await apiClient.patch(`/projects/${id}/status`, payload);
  return data;
};

export const updateProjectTemplate = async (id, payload) => {
  const { data } = await apiClient.patch(`/projects/${id}/template`, payload);
  return data;
};

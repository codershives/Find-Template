import { apiClient } from './client';

export const purchasePackage = async (payload) => {
  const { data } = await apiClient.post('/payments/package', payload);
  return data;
};

export const purchaseTemplate = async (payload) => {
  const { data } = await apiClient.post('/payments/template', payload);
  return data;
};

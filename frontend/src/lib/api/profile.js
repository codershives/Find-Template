import { apiClient } from './client';

export const getProfile = async () => {
  const { data } = await apiClient.get('/users/profile');
  return data;
};

export const updateProfile = async (payload) => {
  const { data } = await apiClient.patch('/users/profile', payload);
  return data;
};

export const updatePassword = async (payload) => {
  const { data } = await apiClient.patch('/users/password', payload);
  return data;
};

export const deleteAccount = async (payload) => {
  const { data } = await apiClient.delete('/users/account', { data: payload });
  return data;
};

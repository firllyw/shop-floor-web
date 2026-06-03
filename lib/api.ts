import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const fetchAreas = async () => {
  const response = await api.get('/areas');
  return response.data;
};

export const fetchAssetTree = async () => {
  const response = await api.get('/assets/tree');
  return response.data;
};

export const fetchUsers = async () => {
  const response = await api.get('/users');
  return response.data;
};

export default api;

import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const classService = {
  // Class operations
  getClasses: async () => {
    const { data } = await api.get('/classes');
    return data;
  },

  getClassById: async (id) => {
    const { data } = await api.get(`/classes/${id}`);
    return data;
  },

  createClass: async (classData) => {
    const { data } = await api.post('/classes', classData);
    return data;
  },

  updateClass: async (id, classData) => {
    const { data } = await api.put(`/classes/${id}`, classData);
    return data;
  },

  deleteClass: async (id) => {
    const { data } = await api.delete(`/classes/${id}`);
    return data;
  },

  // Section operations
  createSection: async (classId, sectionData) => {
    const { data } = await api.post(`/classes/${classId}/sections`, sectionData);
    return data;
  },

  updateSection: async (id, sectionData) => {
    const { data } = await api.put(`/classes/sections/${id}`, sectionData);
    return data;
  },

  deleteSection: async (id) => {
    const { data } = await api.delete(`/classes/sections/${id}`);
    return data;
  },
}; 
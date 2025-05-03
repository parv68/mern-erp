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

export const subjectService = {
  // Subject operations
  getSubjects: async () => {
    const { data } = await api.get('/subjects');
    return data;
  },

  getSubjectById: async (id) => {
    const { data } = await api.get(`/subjects/${id}`);
    return data;
  },

  createSubject: async (subjectData) => {
    const { data } = await api.post('/subjects', subjectData);
    return data;
  },

  updateSubject: async (id, subjectData) => {
    const { data } = await api.put(`/subjects/${id}`, subjectData);
    return data;
  },

  deleteSubject: async (id) => {
    const { data } = await api.delete(`/subjects/${id}`);
    return data;
  },

  // Subject Teacher Allocation operations
  allocateTeacher: async (allocationData) => {
    const { data } = await api.post('/subjects/allocate', allocationData);
    return data;
  },

  deallocateTeacher: async (id) => {
    const { data } = await api.delete(`/subjects/allocate/${id}`);
    return data;
  },
}; 
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

export const timetableService = {
  // Timetable operations
  createTimetableSlot: async (slotData) => {
    const { data } = await api.post('/timetable', slotData);
    return data;
  },

  getTimetable: async (params) => {
    const { data } = await api.get('/timetable', { params });
    return data;
  },

  getTeacherTimetable: async (params) => {
    const { data } = await api.get('/timetable/teacher', { params });
    return data;
  },

  updateTimetableSlot: async (id, slotData) => {
    const { data } = await api.put(`/timetable/${id}`, slotData);
    return data;
  },

  deleteTimetableSlot: async (id) => {
    const { data } = await api.delete(`/timetable/${id}`);
    return data;
  },

  // Substitution operations
  requestSubstitution: async (substitutionData) => {
    const { data } = await api.post('/timetable/substitutions', substitutionData);
    return data;
  },

  updateSubstitutionStatus: async (id, status) => {
    const { data } = await api.put(`/timetable/substitutions/${id}/status`, { status });
    return data;
  },

  getSubstitutions: async (params) => {
    const { data } = await api.get('/timetable/substitutions', { params });
    return data;
  },
}; 
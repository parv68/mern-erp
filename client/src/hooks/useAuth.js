import { useQuery, useMutation, useQueryClient } from 'react-query';
import axios from 'axios';
import { toast } from 'react-hot-toast';

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

export const useAuth = () => {
  const queryClient = useQueryClient();

  // Get current user
  const { data: user, isLoading } = useQuery(
    'user',
    async () => {
      const token = localStorage.getItem('token');
      if (!token) return null;

      try {
        const { data } = await api.get('/auth/profile');
        return data;
      } catch (error) {
        localStorage.removeItem('token');
        return null;
      }
    },
    {
      staleTime: Infinity,
    }
  );

  // Login mutation
  const login = useMutation(
    async (credentials) => {
      const { data } = await api.post('/auth/login', credentials);
      return data;
    },
    {
      onSuccess: (data) => {
        localStorage.setItem('token', data.token);
        queryClient.setQueryData('user', data.user);
        toast.success('Login successful');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Login failed');
      },
    }
  );

  // Register mutation
  const register = useMutation(
    async (userData) => {
      const { data } = await api.post('/auth/register', userData);
      return data;
    },
    {
      onSuccess: (data) => {
        localStorage.setItem('token', data.token);
        queryClient.setQueryData('user', data.user);
        toast.success('Registration successful');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Registration failed');
      },
    }
  );

  // Logout function
  const logout = () => {
    localStorage.removeItem('token');
    queryClient.setQueryData('user', null);
    queryClient.clear();
    toast.success('Logged out successfully');
  };

  // Update profile mutation
  const updateProfile = useMutation(
    async (profileData) => {
      const { data } = await api.put('/auth/profile', profileData);
      return data;
    },
    {
      onSuccess: (data) => {
        queryClient.setQueryData('user', data);
        toast.success('Profile updated successfully');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update profile');
      },
    }
  );

  // Change password mutation
  const changePassword = useMutation(
    async (passwordData) => {
      const { data } = await api.put('/auth/change-password', passwordData);
      return data;
    },
    {
      onSuccess: () => {
        toast.success('Password changed successfully');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to change password');
      },
    }
  );

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login: login.mutate,
    register: register.mutate,
    logout,
    updateProfile: updateProfile.mutate,
    changePassword: changePassword.mutate,
  };
}; 
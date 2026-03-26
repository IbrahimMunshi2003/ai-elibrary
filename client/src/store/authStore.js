import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiService } from '../services/api';

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (credentials) => {
        set({ isLoading: true, error: null });
        try {
          const response = await apiService.login(credentials);
          const { user, token } = response.data;
          set({ user, token, isAuthenticated: true, isLoading: false });
          // Save token for axios interceptor
          localStorage.setItem('auth_token', token);
        } catch (error) {
          set({ error: error.message || 'Login failed', isLoading: false });
          throw error;
        }
      },

      signup: async (data) => {
        set({ isLoading: true, error: null });
        try {
          const response = await apiService.signup(data);
          const { user, token } = response.data;
          set({ user, token, isAuthenticated: true, isLoading: false });
          localStorage.setItem('auth_token', token);
        } catch (error) {
          set({ error: error.message || 'Signup failed', isLoading: false });
          throw error;
        }
      },

      logout: () => {
        set({ user: null, token: null, isAuthenticated: false, error: null });
        localStorage.removeItem('auth_token');
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);

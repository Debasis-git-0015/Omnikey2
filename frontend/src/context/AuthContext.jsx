import React, { createContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Helper to inject/remove the Authorization header in Axios requests
  const setAuthHeader = (token) => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setAuthHeader(null);
    setUser(null);
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');

    if (storedUser && storedToken) {
      try {
        setUser(JSON.parse(storedUser));
        setAuthHeader(storedToken);
      } catch (e) {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }
    setLoading(false);

    // Axios interceptor for expired or invalidated sessions (e.g., cleared database)
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (
          error.response?.status === 401 &&
          !error.config?.url?.includes('/auth/login') &&
          !error.config?.url?.includes('/auth/register')
        ) {
          logout();
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, []);

  const login = async (email, password) => {
    try {
      const normalizedEmail = (email || '').trim().toLowerCase();
      const response = await axios.post(`${API_URL}/auth/login`, { email: normalizedEmail, password });
      const { token, ...userData } = response.data;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));

      setAuthHeader(token);
      setUser(userData);
      return { success: true };
    } catch (error) {
      const errMsg =
        error.response?.data?.details?.[0]?.message ||
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Invalid credentials or server connection error.';
      return {
        success: false,
        error: errMsg,
      };
    }
  };

  const register = async (name, email, password) => {
    try {
      const normalizedEmail = (email || '').trim().toLowerCase();
      const trimmedName = (name || '').trim();
      const response = await axios.post(`${API_URL}/auth/register`, { name: trimmedName, email: normalizedEmail, password });
      const { token, ...userData } = response.data;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));

      setAuthHeader(token);
      setUser(userData);
      return { success: true };
    } catch (error) {
      const errMsg =
        error.response?.data?.details?.[0]?.message ||
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Registration failed. Please try again.';
      return {
        success: false,
        error: errMsg,
      };
    }
  };

  const loginWithOAuthData = useCallback((authData) => {
    const { token, id, _id, name, email, avatar, provider } = authData;
    const userData = {
      id: id || _id,
      _id: id || _id,
      name,
      email,
      avatar: avatar || null,
      provider: provider || 'oauth'
    };

    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));

    setAuthHeader(token);
    setUser(userData);
    return { success: true };
  }, []);

  const getOAuthConfig = async () => {
    try {
      const response = await axios.get(`${API_URL}/auth/oauth/config`);
      return response.data;
    } catch (error) {
      console.warn('Failed to fetch OAuth configuration:', error);
      return {
        google: { configured: false },
        github: { configured: false }
      };
    }
  };

  const loginWithDevMock = async (provider, customData = {}) => {
    try {
      const response = await axios.post(`${API_URL}/auth/oauth/dev-mock`, {
        provider,
        ...customData
      });
      const { token, ...userData } = response.data;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));

      setAuthHeader(token);
      setUser(userData);
      return { success: true };
    } catch (error) {
      const errMsg = error.response?.data?.error || 'Simulated sign-in failed.';
      return {
        success: false,
        error: errMsg
      };
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      register,
      logout,
      loginWithOAuthData,
      getOAuthConfig,
      loginWithDevMock,
      apiUrl: API_URL
    }}>
      {children}
    </AuthContext.Provider>
  );
};

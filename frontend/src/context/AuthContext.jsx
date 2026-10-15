import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
axios.defaults.baseURL = API_URL;

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load persisted auth from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('access_token');
    const storedUser = localStorage.getItem('user');
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      
      // Setup axios default auth header
      axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
    }
    setLoading(false);
  }, []);

  const getRedirectPath = (role) => {
    switch (role) {
      case 'SUPER_ADMIN': return '/dashboard/admin';
      case 'HOD': return '/dashboard/hod';
      case 'MANAGER': return '/dashboard/manager';
      case 'EMPLOYEE': return '/dashboard/employee';
      default: return '/';
    }
  };

  const login = async (username, password, rememberMe = false) => {
    try {
      const response = await axios.post(`${API_URL}/api/v1/auth/login`,
        new URLSearchParams({ username, password }),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
      );
      
      const data = response.data;
      const { access_token, refresh_token, user_id, email, role, department_name } = data;

      // Persist data
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('refresh_token', refresh_token);
      const userData = { id: user_id, username, email, role, department_name };
      localStorage.setItem('user', JSON.stringify(userData));

      setToken(access_token);
      setUser(userData);
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;

      // Role-based redirect
      navigate(getRedirectPath(role));
    } catch (err) {
      console.error('Login error', err);
      throw err;
    }
  };

  const signupRequest = async (formData) => {
    try {
      await axios.post(`${API_URL}/api/v1/auth/signup-request`, formData);
    } catch (err) {
      console.error('Signup request error', err);
      throw err;
    }
  };

  const forgotPassword = async (email) => {
    try {
      await axios.post(`${API_URL}/api/v1/auth/forgot-password`, { email });
    } catch (err) {
      console.error('Forgot password error', err);
      throw err;
    }
  };

  const resetPassword = async (token, newPassword) => {
    try {
      await axios.post(`${API_URL}/api/v1/auth/reset-password`, { token, new_password: newPassword });
    } catch (err) {
      console.error('Reset password error', err);
      throw err;
    }
  };

  const logout = async () => {
    try {
      await axios.post(`${API_URL}/api/v1/auth/logout`);
    } catch (err) {
      console.error('Logout error', err);
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      setToken(null);
      setUser(null);
      delete axios.defaults.headers.common['Authorization'];
      navigate('/login');
    }
  };

  // Axios interceptor for token refresh
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          const refreshToken = localStorage.getItem('refresh_token');
          if (refreshToken) {
            try {
              const response = await axios.post(`${API_URL}/api/v1/auth/refresh?refresh_token=${refreshToken}`);
              const { access_token, refresh_token: new_refresh_token, user_id, username, email, role, department_name } = response.data;
              
              localStorage.setItem('access_token', access_token);
              localStorage.setItem('refresh_token', new_refresh_token);
              const userData = { id: user_id, username, email, role, department_name };
              localStorage.setItem('user', JSON.stringify(userData));
              setToken(access_token);
              setUser(userData);
              axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
              originalRequest.headers['Authorization'] = `Bearer ${access_token}`;
              
              return axios(originalRequest);
            } catch (refreshError) {
              logout();
              return Promise.reject(refreshError);
            }
          }
        }
        return Promise.reject(error);
      }
    );

    return () => axios.interceptors.response.eject(interceptor);
  }, []);

  const value = { 
    user, 
    token, 
    loading, 
    login, 
    logout, 
    signupRequest, 
    forgotPassword, 
    resetPassword 
  };
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);

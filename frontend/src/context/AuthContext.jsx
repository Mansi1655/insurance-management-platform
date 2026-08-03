import React, { createContext, useState, useEffect } from 'react';
import API from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if token and user exist in local storage on page load
    const storedToken = localStorage.getItem('ins_token');
    const storedUser = localStorage.getItem('ins_user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await API.post('/auth/login', { email, password });
      const { token: receivedToken, user: receivedUser } = response.data;

      localStorage.setItem('ins_token', receivedToken);
      localStorage.setItem('ins_user', JSON.stringify(receivedUser));

      setToken(receivedToken);
      setUser(receivedUser);
      return receivedUser;
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Login failed. Please check credentials.';
      throw new Error(errorMsg);
    }
  };

  const logout = () => {
    localStorage.removeItem('ins_token');
    localStorage.removeItem('ins_user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

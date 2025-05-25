import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

// API-URL basierend auf der Umgebung
const API_URL = import.meta.env.VITE_API_URL || 
  (window.location.hostname === 'localhost' 
    ? 'http://localhost:3000' 
    : window.location.origin);

console.log('API URL:', API_URL); // Debug-Log

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth muss innerhalb eines AuthProviders verwendet werden');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [users, setUsers] = useState([]);

  const fetchUsers = async () => {
    try {
      console.log('Fetching users from:', `${API_URL}/api/users`); // Debug-Log
      const response = await axios.get(`${API_URL}/api/users`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      console.log('Users fetched:', response.data); // Debug-Log
      setUsers(response.data);
    } catch (error) {
      console.error('Fehler beim Laden der Benutzer:', error.response?.data || error.message);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const user = JSON.parse(localStorage.getItem('user'));
        if (user && user.email && user.role) {
          setCurrentUser(user);
          if (user.role === 'chef') {
            fetchUsers();
          }
        } else {
          // Ungültige Benutzerdaten, ausloggen
          logout();
        }
      } catch (error) {
        console.error('Fehler beim Laden der Benutzerdaten:', error);
        logout();
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      console.log('Login-Versuch an:', `${API_URL}/api/login`); // Debug-Log
      console.log('Login-Daten:', { email }); // Debug-Log (ohne Passwort)

      const response = await axios.post(`${API_URL}/api/login`, {
        email,
        password
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log('Login-Antwort:', response.data); // Debug-Log

      const { token, user } = response.data;
      
      if (!token || !user || !user.email || !user.role) {
        console.error('Ungültige Serverantwort:', response.data); // Debug-Log
        throw new Error('Ungültige Serverantwort');
      }

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setCurrentUser(user);
      
      if (user.role === 'chef') {
        await fetchUsers();
      }
      
      return true;
    } catch (error) {
      console.error('Login fehlgeschlagen:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setCurrentUser(null);
    setUsers([]);
  };

  const value = {
    currentUser,
    isLoading,
    login,
    logout,
    users
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
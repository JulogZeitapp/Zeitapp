import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

const ArbeitszeitContext = createContext(null);

// API-URL basierend auf der Umgebung
const API_URL = import.meta.env.VITE_API_URL || 
  (window.location.hostname === 'localhost' 
    ? 'http://localhost:3000' 
    : window.location.origin);

export const useArbeitszeit = () => {
  const context = useContext(ArbeitszeitContext);
  if (!context) {
    throw new Error('useArbeitszeit muss innerhalb eines ArbeitszeitProviders verwendet werden');
  }
  return context;
};

export const ArbeitszeitProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const [arbeitszeiten, setArbeitszeiten] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Arbeitszeiten laden
  const loadArbeitszeiten = async () => {
    try {
      setIsLoading(true);
      setError(null);

      let response;
      if (currentUser.role === 'chef') {
        // Chef sieht alle Arbeitszeiten
        response = await axios.get(`${API_URL}/api/arbeitszeiten`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
      } else {
        // Fahrer sieht nur eigene Arbeitszeiten
        response = await axios.get(`${API_URL}/api/arbeitszeiten/fahrer/${currentUser.id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
      }

      setArbeitszeiten(response.data);
    } catch (error) {
      console.error('Fehler beim Laden der Arbeitszeiten:', error);
      setError('Fehler beim Laden der Arbeitszeiten');
    } finally {
      setIsLoading(false);
    }
  };

  // Neue Arbeitszeit speichern
  const saveArbeitszeit = async (arbeitszeit) => {
    try {
      setError(null);
      const response = await axios.post(
        `${API_URL}/api/arbeitszeiten`,
        arbeitszeit,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }
      );
      
      // Aktualisiere die Liste
      await loadArbeitszeiten();
      
      return response.data;
    } catch (error) {
      console.error('Fehler beim Speichern der Arbeitszeit:', error);
      setError('Fehler beim Speichern der Arbeitszeit');
      throw error;
    }
  };

  // Arbeitszeit aktualisieren
  const updateArbeitszeit = async (id, updates) => {
    try {
      setError(null);
      const response = await axios.put(
        `${API_URL}/api/arbeitszeiten/${id}`,
        updates,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }
      );
      
      // Aktualisiere die Liste
      await loadArbeitszeiten();
      
      return response.data;
    } catch (error) {
      console.error('Fehler beim Aktualisieren der Arbeitszeit:', error);
      setError('Fehler beim Aktualisieren der Arbeitszeit');
      throw error;
    }
  };

  // Lade Arbeitszeiten beim Start und wenn sich der Benutzer ändert
  useEffect(() => {
    if (currentUser) {
      loadArbeitszeiten();
    }
  }, [currentUser]);

  const value = {
    arbeitszeiten,
    isLoading,
    error,
    saveArbeitszeit,
    updateArbeitszeit,
    loadArbeitszeiten
  };

  return (
    <ArbeitszeitContext.Provider value={value}>
      {children}
    </ArbeitszeitContext.Provider>
  );
};

export default ArbeitszeitContext; 
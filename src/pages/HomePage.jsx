import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const HomePage = () => {
  const { currentUser, isLoading } = useAuth();

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen"><p className="text-xl">Laden...</p></div>;
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (currentUser.role === 'driver') {
    return <Navigate to="/fahrer-dashboard" replace />;
  } else if (currentUser.role === 'chef') {
    return <Navigate to="/chef-dashboard" replace />;
  }

  return <Navigate to="/login" replace />; 
};

export default HomePage;
  
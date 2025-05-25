import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { ToastProvider } from '@/components/ui/toast';
import MainLayout from '@/layouts/MainLayout';
import LoginPage from '@/pages/LoginPage';
import DriverDashboardPage from '@/pages/DriverDashboardPage';
import ChefDashboardPage from '@/pages/ChefDashboardPage';
import HomePage from '@/pages/HomePage'; 
import ProtectedRoute from '@/components/shared/ProtectedRoute';

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<MainLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route 
          path="/fahrer-dashboard" 
          element={
            <ProtectedRoute allowedRoles={['driver']}>
              <DriverDashboardPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/chef-dashboard" 
          element={
            <ProtectedRoute allowedRoles={['chef']}>
              <ChefDashboardPage />
            </ProtectedRoute>
          } 
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <ToastProvider>
        <AppRoutes />
        </ToastProvider>
      </Router>
    </AuthProvider>
  );
}

export default App;
  
import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import Header from '@/components/shared/Header';
import { useAuth } from '@/contexts/AuthContext';
import { Toaster } from "@/components/ui/toaster";

const MainLayout = () => {
  const { currentUser, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 to-slate-700">
        <p className="text-2xl text-white">Laden...</p>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-100 to-slate-300 dark:from-slate-900 dark:to-slate-800">
      <Header />
      <main className="flex-grow container mx-auto px-2 sm:px-4 py-6 sm:py-8">
        <Outlet />
      </main>
      <Toaster />
      <footer className="py-4 sm:py-6 text-center text-xs sm:text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} Julog Arbeitszeiten. Alle Rechte vorbehalten.</p>
      </footer>
    </div>
  );
};

export default MainLayout;
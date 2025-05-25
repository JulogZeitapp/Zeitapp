import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut, UserCircle, Menu } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const Header = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const logoUrl = "https://storage.googleapis.com/hostinger-horizons-assets-prod/525ec8ac-5133-4e66-875c-7567faf7c906/34087fda15bf8c02ef59f046c147f352.jpg";

  const handleLogout = () => {
    logout();
    navigate('/login');
    toast({
      title: "Abgemeldet",
      description: "Sie wurden erfolgreich abgemeldet.",
    });
  };

  return (
    <header className="bg-gradient-to-r from-sky-600 via-cyan-500 to-teal-500 dark:from-sky-700 dark:via-cyan-600 dark:to-teal-600 text-primary-foreground shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link to="/" className="flex items-center">
          <img src={logoUrl} alt="Firmenlogo" className="h-12 md:h-14 w-auto mr-2 md:mr-3 rounded" />
          <span className="text-xl sm:text-2xl font-bold hidden sm:inline">Julog Arbeitszeiten</span>
        </Link>
        
        <div className="hidden sm:flex items-center space-x-4">
          {currentUser && (
            <div className="flex items-center space-x-2">
              <UserCircle className="h-6 w-6" />
              <span className="text-sm font-medium">{currentUser.name} ({currentUser.role === 'driver' ? 'Fahrer' : 'Chef'})</span>
            </div>
          )}
          <Button variant="ghost" onClick={handleLogout} className="hover:bg-white/20 text-white">
            <LogOut className="mr-2 h-5 w-5" />
            Abmelden
          </Button>
        </div>

        <div className="sm:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="hover:bg-white/20 text-white">
                <Menu className="h-6 w-6" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-slate-700 text-white border-slate-600">
              {currentUser && (
                <DropdownMenuItem className="flex items-center space-x-2 py-2 focus:bg-slate-600">
                  <UserCircle className="h-5 w-5" />
                  <span>{currentUser.name}</span>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={handleLogout} className="flex items-center space-x-2 py-2 focus:bg-slate-600 text-red-400 focus:text-red-300">
                <LogOut className="mr-2 h-5 w-5" />
                <span>Abmelden</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default Header;
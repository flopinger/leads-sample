import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  LogOut, 
  Home,
  Building,
  TrendingUp,
  Calendar
} from 'lucide-react';
import zfLogo from '../assets/zf-logo.svg';

const HeaderIntegrated = ({ onLogout, allData = [] }) => {
  const location = useLocation();

  // Calculate statistics from integrated data
  const totalWorkshops = allData.length;
  const totalFoundings = allData.reduce((count, workshop) => {
    return count + (workshop.events?.filter(event => event.event_type === 'founding').length || 0);
  }, 0);
  const totalManagementChanges = allData.reduce((count, workshop) => {
    return count + (workshop.events?.filter(event => event.event_type === 'management_change').length || 0);
  }, 0);

  const isActive = (path) => location.pathname === path;

  return (
    <header className="bg-[#005787] text-white shadow-lg sticky top-0 z-[60]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo and Title */}
          <div className="flex items-center space-x-4">
            <img src={zfLogo} alt="ZF" className="h-8 w-auto brightness-0 invert" />
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            <Link to="/">
              <Button 
                variant={isActive('/') ? 'secondary' : 'ghost'}
                size="sm"
                className={`text-white hover:bg-white/10 ${
                  isActive('/') ? 'bg-white/20' : ''
                }`}
              >
                <Home className="mr-2 h-4 w-4" />
                Start
                <Badge className="ml-2 bg-white/20 text-white border-white/30">
                  {totalWorkshops}
                </Badge>
              </Button>
            </Link>

            <Link to="/company-foundings">
              <Button 
                variant={isActive('/company-foundings') ? 'secondary' : 'ghost'}
                size="sm"
                className={`text-white hover:bg-white/10 ${
                  isActive('/company-foundings') ? 'bg-white/20' : ''
                }`}
              >
                <Building className="mr-2 h-4 w-4" />
                Gründungen
                <Badge className="ml-2 bg-white/20 text-white border-white/30">
                  {totalFoundings}
                </Badge>
              </Button>
            </Link>

            <Link to="/management-changes">
              <Button 
                variant={isActive('/management-changes') ? 'secondary' : 'ghost'}
                size="sm"
                className={`text-white hover:bg-white/10 ${
                  isActive('/management-changes') ? 'bg-white/20' : ''
                }`}
              >
                <TrendingUp className="mr-2 h-4 w-4" />
                Management-Änderungen
                <Badge className="ml-2 bg-white/20 text-white border-white/30">
                  {totalManagementChanges}
                </Badge>
              </Button>
            </Link>
          </nav>

          {/* Mobile Navigation */}
          <nav className="md:hidden flex items-center space-x-1">
            <Link to="/">
              <Button 
                variant={isActive('/') ? 'secondary' : 'ghost'}
                size="sm"
                className={`text-white hover:bg-white/10 ${
                  isActive('/') ? 'bg-white/20' : ''
                }`}
              >
                <Home className="h-4 w-4" />
              </Button>
            </Link>

            <Link to="/company-foundings">
              <Button 
                variant={isActive('/company-foundings') ? 'secondary' : 'ghost'}
                size="sm"
                className={`text-white hover:bg-white/10 ${
                  isActive('/company-foundings') ? 'bg-white/20' : ''
                }`}
              >
                <Building className="h-4 w-4" />
              </Button>
            </Link>

            <Link to="/management-changes">
              <Button 
                variant={isActive('/management-changes') ? 'secondary' : 'ghost'}
                size="sm"
                className={`text-white hover:bg-white/10 ${
                  isActive('/management-changes') ? 'bg-white/20' : ''
                }`}
              >
                <TrendingUp className="h-4 w-4" />
              </Button>
            </Link>
          </nav>

          {/* Logout */}
          <Button 
            onClick={onLogout}
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/10"
          >
            <LogOut className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Abmelden</span>
          </Button>
        </div>
      </div>
    </header>
  );
};

export default HeaderIntegrated;

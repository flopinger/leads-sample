import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  LogOut, 
  Home,
  Building,
  TrendingUp,
  Calendar,
  Code,
  User
} from 'lucide-react';
import LanguageSwitcher from './LanguageSwitcher';
import { useLanguage } from '../contexts/LanguageContext';
// Dynamic, tenant-specific logo is served by backend

const HeaderIntegrated = ({ onLogout, allData = [], tenantName = '' }) => {
  const location = useLocation();
  const { t } = useLanguage();

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
    <header className="brand-bg text-white shadow-lg sticky top-0 z-[60]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo and Title */}
          <div className="flex items-center space-x-3 font-semibold">
            <Link to="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
              <img src="/api/logo" alt="Logo" className="h-8 w-auto brightness-0 invert" />
              <span className="text-sm opacity-90">{t('header.dataSample')} {tenantName || ' '}</span>
            </Link>
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
                {t('header.workshops')}
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
                {t('header.foundings')}
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
                {t('header.managementChanges')}
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

          <div className="flex items-center gap-2">
            {/* Language Switcher */}
            <LanguageSwitcher variant="ghost" size="sm" showLabel={false} />
            
            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/10"
                >
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 z-[70]">
              <Link to="/api-docs">
                <DropdownMenuItem className="cursor-pointer">
                  <Code className="mr-2 h-4 w-4" />
                  {t('header.apiDocs')}
                </DropdownMenuItem>
              </Link>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onLogout} className="cursor-pointer text-red-600 focus:text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                {t('header.logout')}
              </DropdownMenuItem>
            </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
};

export default HeaderIntegrated;

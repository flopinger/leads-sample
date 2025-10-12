import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Search, 
  Filter, 
  LogOut, 
  ChevronDown, 
  ChevronUp,
  X,
  Home,
  Building,
  TrendingUp
} from 'lucide-react';
import zfLogo from '../assets/zf-logo.svg';
import { PREMIUM_CONCEPTS } from '../utils/dataUtils';

const Header = ({ 
  onLogout, 
  searchTerm, 
  onSearchChange, 
  filters, 
  onFiltersChange,
  allData = []
}) => {
  const [showFilters, setShowFilters] = useState(false);

  const handleFilterChange = (key, value) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const clearFilters = () => {
    onFiltersChange({
      city: '',
      zipCode: '',
      concept: '',
      hasWebsite: false,
      hasPhone: false,
      hasEmail: false
    });
    onSearchChange('');
  };

  const hasActiveFilters = Object.values(filters).some(value => 
    typeof value === 'boolean' ? value : value.trim() !== ''
  ) || searchTerm.trim() !== '';

  // Extract unique concepts from data (cleaned and filtered)
  const getUniqueConceptsFromData = () => {
    const concepts = new Set();
    allData.forEach(item => {
      if (item.concepts_networks && Array.isArray(item.concepts_networks)) {
        item.concepts_networks.forEach(concept => {
          if (concept && concept.trim()) {
            concepts.add(concept.trim());
          }
        });
      }
    });
    
    const allConcepts = Array.from(concepts).sort();
    
    // Separate premium and regular concepts
    const premiumConcepts = allConcepts.filter(concept => 
      PREMIUM_CONCEPTS.includes(concept)
    );
    const regularConcepts = allConcepts.filter(concept => 
      !PREMIUM_CONCEPTS.includes(concept)
    );
    
    return { premiumConcepts, regularConcepts };
  };

  const { premiumConcepts, regularConcepts } = getUniqueConceptsFromData();

  return (
    <header className="zf-header text-white shadow-lg">
      <div className="container mx-auto px-4 py-4">
        {/* Top row with logo and navigation */}
        <div className="flex items-center justify-between mb-4">
          <Link to="/" className="flex items-center space-x-4 hover:opacity-80 transition-opacity">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 flex items-center justify-center">
                <img 
                  src={zfLogo} 
                  alt="ZF Logo" 
                  className="w-full h-full brightness-0 invert"
                  style={{ filter: 'brightness(0) invert(1)' }}
                />
              </div>
              <div>
                <h1 className="text-xl font-bold">Werkstattadressen-Sample ZF</h1>
                <p className="text-sm opacity-90">(Stand: 10.10.2025)</p>
              </div>
            </div>
          </Link>
          
          <div className="flex items-center space-x-2">
            <Link to="/">
              <Button 
                variant="outline" 
                size="sm"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                <Home size={16} className="mr-2" />
                Start
              </Button>
            </Link>
            
            <Link to="/company-foundings">
              <Button 
                variant="outline" 
                size="sm"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                <Building size={16} className="mr-2" />
                Gründungen
              </Button>
            </Link>
            
            <Link to="/management-changes">
              <Button 
                variant="outline" 
                size="sm"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                <TrendingUp size={16} className="mr-2" />
                Management-Änderungen
              </Button>
            </Link>
            
            <Button 
              variant="outline" 
              onClick={onLogout}
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              <LogOut size={16} className="mr-2" />
              Abmelden
            </Button>
          </div>
        </div>

        {/* Search and filter section */}
        <div className="space-y-4">
          {/* Search bar */}
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                type="text"
                placeholder="Suchen nach Name, Stadt, PLZ oder Klassifikation..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10 bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-primary focus:ring-primary"
              />
            </div>
            
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              <Filter size={16} className="mr-2" />
              Filter
              {showFilters ? <ChevronUp size={16} className="ml-2" /> : <ChevronDown size={16} className="ml-2" />}
            </Button>

            {hasActiveFilters && (
              <Button
                variant="outline"
                onClick={clearFilters}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                <X size={16} className="mr-2" />
                Zurücksetzen
              </Button>
            )}
          </div>

          {/* Filter panel */}
          {showFilters && (
            <Card className="bg-white/95 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                  {/* City filter */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Stadt</label>
                    <Input
                      type="text"
                      placeholder="Stadt eingeben"
                      value={filters.city || ''}
                      onChange={(e) => handleFilterChange('city', e.target.value)}
                    />
                  </div>

                  {/* ZIP code filter */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Postleitzahl</label>
                    <Input
                      type="text"
                      placeholder="PLZ eingeben"
                      value={filters.zipCode || ''}
                      onChange={(e) => handleFilterChange('zipCode', e.target.value)}
                    />
                  </div>

                  {/* Concept filter */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Konzept</label>
                    <select
                      value={filters.concept || ''}
                      onChange={(e) => handleFilterChange('concept', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="">Alle Konzepte</option>
                      
                      {/* Premium concepts first */}
                      {premiumConcepts.length > 0 && (
                        <>
                          <optgroup label="Premium-Konzepte">
                            {premiumConcepts.map(concept => (
                              <option key={concept} value={concept}>
                                {concept}
                              </option>
                            ))}
                          </optgroup>
                        </>
                      )}
                      
                      {/* Regular concepts */}
                      {regularConcepts.length > 0 && (
                        <>
                          <optgroup label="Weitere Konzepte">
                            {regularConcepts.map(concept => (
                              <option key={concept} value={concept}>
                                {concept}
                              </option>
                            ))}
                          </optgroup>
                        </>
                      )}
                    </select>
                  </div>

                  {/* Checkbox filters */}
                  <div className="space-y-3">
                    <label className="text-sm font-medium">Verfügbare Daten</label>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="hasWebsite"
                          checked={filters.hasWebsite || false}
                          onCheckedChange={(checked) => handleFilterChange('hasWebsite', checked)}
                        />
                        <label htmlFor="hasWebsite" className="text-sm">Mit Website</label>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-medium invisible">Weitere Filter</label>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="hasPhone"
                          checked={filters.hasPhone || false}
                          onCheckedChange={(checked) => handleFilterChange('hasPhone', checked)}
                        />
                        <label htmlFor="hasPhone" className="text-sm">Mit Telefon</label>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-medium invisible">Weitere Filter</label>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="hasEmail"
                          checked={filters.hasEmail || false}
                          onCheckedChange={(checked) => handleFilterChange('hasEmail', checked)}
                        />
                        <label htmlFor="hasEmail" className="text-sm">Mit E-Mail</label>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Search, Filter, X, Users, Phone, Mail, Globe, Download, MapPin, Building, Calendar, TrendingUp, ChevronDown, Code } from 'lucide-react';
import auteonLogo from '../assets/auteon-logo.jpg';
import GoogleMapComponent from './GoogleMapComponent';
import { filterEmails, filterEmailsFromArray } from '../utils/emailFilter';
import { convertToCSV } from '../utils/dataUtils';
import { DATA_LAST_UPDATED } from '../utils/constants';
import { useLanguage } from '../contexts/LanguageContext';

const DashboardIntegrated = ({ data, searchTerm, setSearchTerm, filters, setFilters, tenantName = '' }) => {
  const { t } = useLanguage();
  const [showAllEntries, setShowAllEntries] = useState(false);

  // Translation function for classifications
  // Consistent styling system
  const badgeStyles = {
    // Status badges
    status: {
      active: "bg-blue-50 [a&]:hover:bg-[color:var(--action-500)/0.16] brand-tint-10 text-[color:var(--brand-500)] border-[color:var(--brand-500)]/20",
      inactive: "bg-red-50 text-red-700 border-red-200",
      operational: "bg-blue-50 [a&]:hover:bg-[color:var(--action-500)/0.16] brand-tint-10 text-[color:var(--brand-500)] border-[color:var(--brand-500)]/20"
    },
    // Classification badges
    classification: "bg-slate-50 text-slate-700 border-slate-200",
    // Concept badges
    concept: "bg-blue-50 text-blue-700 border-blue-200",
    // Network badges
    network: "bg-purple-50 text-purple-700 border-purple-200",
    // Service badges
    service: "bg-green-50 text-green-700 border-green-200",
    // Date badges
    date: "bg-orange-50 text-orange-700 border-orange-200",
    // Legal form badges
    legalForm: {
      gmbh: "bg-blue-50 text-blue-700 border-blue-200",
      ug: "bg-green-50 text-green-700 border-green-200",
      default: "bg-gray-50 text-gray-700 border-gray-200"
    },
    // Callout badges
    callout: "bg-green-100 text-green-800 border-green-300"
  };

  const translateClassification = (classification) => {
    if (!classification) return 'Nicht verfügbar';
    
    const translations = {
      'Autowerkstatt': 'Autowerkstatt',
      'Kfz-Ersatzteilgeschäft': 'Kfz-Ersatzteilgeschäft',
      'Motorradwerkstatt': 'Motorradwerkstatt',
      'Reifenwerkstatt': 'Reifenwerkstatt',
      'Lkw-Werkstatt': 'Lkw-Werkstatt',
      'Fleetpartner Reifen Helm': 'Fleetpartner Reifen Helm',
      'car_repair_service': 'Autoreparatur-Service',
      'automotive_repair_shop': 'Autowerkstatt',
      'tire_shop': 'Reifenservice',
      'auto_parts_store': 'Autoteile-Handel',
      'motorcycle_repair': 'Motorradreparatur',
      'truck_repair': 'Lkw-Reparatur'
    };
    
    return translations[classification] || classification;
  };

  // Filter data based on search and filters
  const filteredData = data.filter(item => {
    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        item.name?.toLowerCase().includes(searchLower) ||
        item.city?.toLowerCase().includes(searchLower) ||
        item.zip_code?.toLowerCase().includes(searchLower) ||
        item.primary_classification?.toLowerCase().includes(searchLower);
      
      if (!matchesSearch) return false;
    }

    // City filter
    if (filters.city && item.city !== filters.city) return false;

    // ZIP filter
    if (filters.zipCode && item.zip_code !== filters.zipCode) return false;

    // Concept filter
    if (filters.concept) {
      const hasConcept = item.concepts_networks?.some(concept => 
        concept === filters.concept
      );
      if (!hasConcept) return false;
    }

    return true;
  });

  // Statistics
  // Calculate statistics based on filtered data
  const totalWorkshops = data.length;
  const uniqueCities = new Set(filteredData.map(item => item.city)).size;
  const totalWithPhone = filteredData.filter(item => item.telephone).length;
  const totalWithEmail = filteredData.filter(item => item.email && filterEmails(item.email).length > 0).length;
  const totalWithWebsite = filteredData.filter(item => item.website_url).length;
  const totalWithEvents = filteredData.filter(item => item.events && item.events.length > 0).length;

  // Get unique cities and zip codes for filters
  const allUniqueCities = [...new Set(data.map(item => item.city))].sort();
  const uniqueZipCodes = [...new Set(data.map(item => item.zip_code))].sort();

  // Get all concepts for filtering
  const allConcepts = [...new Set(data.flatMap(item => item.concepts_networks || []))].sort();

  // Premium concepts (most common ones)
  const conceptCounts = {};
  data.forEach(item => {
    if (item.concepts_networks) {
      item.concepts_networks.forEach(concept => {
        conceptCounts[concept] = (conceptCounts[concept] || 0) + 1;
      });
    }
  });

  const premiumConcepts = Object.entries(conceptCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 8)
    .map(([concept]) => concept);

  // Handle concept click
  const handleConceptClick = (concept) => {
    if (filters.concept === concept) {
      setFilters(prev => ({ ...prev, concept: '' }));
    } else {
      setFilters(prev => ({ ...prev, concept }));
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setFilters({ city: '', zipCode: '', concept: '' });
  };

  // Clean data for export - rename NORTHDATA to HANDELSREGISTER, filter *northdata* fields, and filter emails
  const cleanDataForExport = (data) => {
    if (!data) return data;
    
    // Deep clone to avoid mutating original data
    const cleanedData = JSON.parse(JSON.stringify(data));
    
    // Filter emails from main email array
    if (cleanedData.email && Array.isArray(cleanedData.email)) {
      cleanedData.email = filterEmails(cleanedData.email);
    }
    
    // Process relationships array
    if (cleanedData.relationships && Array.isArray(cleanedData.relationships)) {
      cleanedData.relationships = cleanedData.relationships.map(rel => {
        // Rename NORTHDATA handle to HANDELSREGISTER
        if (rel.handle === 'NORTHDATA') {
          rel.handle = 'HANDELSREGISTER';
        }
        
        // Filter out fields containing *northdata* values and filter emails
        if (rel.source_data) {
          try {
            const sourceData = typeof rel.source_data === 'string' 
              ? JSON.parse(rel.source_data) 
              : rel.source_data;
            
            const cleanedSourceData = {};
            Object.keys(sourceData).forEach(key => {
              const value = sourceData[key];
              // Skip fields with *northdata* values
              if (typeof value === 'string' && value.toLowerCase().includes('*northdata*')) {
                return; // Skip this field
              }
              cleanedSourceData[key] = value;
            });
            
            // Filter emails from source_data
            const emailFields = ['email', 'email_1', 'email_2', 'email_3'];
            emailFields.forEach(field => {
              if (cleanedSourceData[field]) {
                delete cleanedSourceData[field];
              }
            });
            
            rel.source_data = JSON.stringify(cleanedSourceData);
          } catch (e) {
            // If parsing fails, keep original data
            console.warn('Failed to parse source_data for cleaning:', e);
          }
        }
        
        return rel;
      });
    }
    
    return cleanedData;
  };

  // Export data as JSON
  const exportJSONData = () => {
    // Create export metadata
    const exportMetadata = {
      exportDate: new Date().toISOString(),
      totalRecords: filteredData.length,
      filters: {
        searchTerm: searchTerm || null,
        city: filters.city || null,
        zipCode: filters.zipCode || null,
        concept: filters.concept || null
      },
      description: "Gefilterte Werkstattadressen-Daten"
    };

    // Create the export object with cleaned data
    const exportData = {
      metadata: exportMetadata,
      workshops: filteredData.map(workshop => cleanDataForExport(workshop))
    };

    // Create and download JSON file
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
      type: 'application/json' 
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `werkstaetten_gefiltert_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Export data as CSV
  const exportCSVData = () => {
    // Create CSV data with cleaned workshops
    const cleanedWorkshops = filteredData.map(workshop => cleanDataForExport(workshop));
    
    // Convert to CSV format
    const csvData = convertToCSV(cleanedWorkshops);
    
    // Create and download CSV file
    const blob = new Blob([csvData], { 
      type: 'text/csv;charset=utf-8;' 
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `werkstaetten_gefiltert_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Sort data alphabetically by name
  const sortedData = [...filteredData].sort((a, b) => a.name.localeCompare(b.name));
  const displayedData = showAllEntries ? sortedData : sortedData.slice(0, 10);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-16 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold heading-contrast">
                {t('dashboard.title')} {tenantName ? <span>{tenantName}</span> : null}
              </h1>
            </div>
            {/* Stand Callout and Export */}
            <div className="flex items-center space-x-3">
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <Badge variant="outline" className={`${badgeStyles.callout} text-sm px-3 py-1`}>
                  <Calendar className="w-3 h-3 mr-1" />
                  <span id="stand-date">{t('common.dataAsOf')}: {DATA_LAST_UPDATED}</span>
                </Badge>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      className="action-bg action-bg-hover text-white"
                      size="sm"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      {t('common.export')} ({filteredData.length})
                      <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={exportJSONData}>
                      <Download className="h-4 w-4 mr-2" />
                      {t('dashboard.json')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={exportCSVData}>
                      <Download className="h-4 w-4 mr-2" />
                      {t('dashboard.csv')}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <Link to="/api-docs">
                      <DropdownMenuItem>
                        <Code className="h-4 w-4 mr-2" />
                        {t('dashboard.api')}
                      </DropdownMenuItem>
                    </Link>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Left Column - Search and Filters */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Search */}
            <Card className="border border-gray-200 shadow-md bg-white">
              <CardHeader>
                <CardTitle className="flex items-center text-gray-900">
                  <Search className="mr-2 h-5 w-5 brand-text" />
                  {t('common.search')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <Input
                    placeholder={t('dashboard.searchPlaceholder')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pr-10"
                  />
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
              </CardContent>
            </Card>

            {/* Statistics */}
            <div className="grid grid-cols-1 gap-4">
              
              {/* Total Workshops */}
              <Card className="border border-gray-200 shadow-md bg-white hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-3xl font-bold heading-contrast">{filteredData.length}</p>
                      <p className="text-sm text-gray-600 mt-1">{t('dashboard.totalWorkshops')}</p>
                    </div>
                    <div className="brand-tint-10 p-3 rounded-lg">
                      <Building className="h-6 w-6 brand-text" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Cities */}
              <Card className="border border-gray-200 shadow-md bg-white hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-3xl font-bold heading-contrast">{uniqueCities}</p>
                      <p className="text-sm text-gray-600 mt-1">{t('dashboard.city')}</p>
                    </div>
                    <div className="brand-tint-10 p-3 rounded-lg">
                      <MapPin className="h-6 w-6 brand-text" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Phone Numbers */}
              <Card className="border border-gray-200 shadow-md bg-white hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-2xl font-bold heading-contrast">{totalWithPhone}</p>
                      <p className="text-xs text-gray-600 mt-1">{t('dashboard.phone')}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {Math.round((totalWithPhone / filteredData.length) * 100)}% {t('dashboard.results')}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-12 h-12">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={[
                                { name: 'Mit Telefon', value: totalWithPhone, fill: getComputedStyle(document.documentElement).getPropertyValue('--brand-500') || '#FF6A00' },
                                { name: 'Ohne Telefon', value: filteredData.length - totalWithPhone, fill: '#e5e7eb' }
                              ]}
                              cx="50%"
                              cy="50%"
                              innerRadius={12}
                              outerRadius={20}
                              dataKey="value"
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="brand-tint-10 p-2 rounded-lg">
                        <Phone className="h-4 w-4 brand-text" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Email Addresses */}
              <Card className="border border-gray-200 shadow-md bg-white hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-2xl font-bold heading-contrast">{totalWithEmail}</p>
                      <p className="text-xs text-gray-600 mt-1">{t('dashboard.email')}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {Math.round((totalWithEmail / filteredData.length) * 100)}% {t('dashboard.results')}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-12 h-12">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={[
                                { name: 'Mit E-Mail', value: totalWithEmail, fill: getComputedStyle(document.documentElement).getPropertyValue('--brand-500') || '#FF6A00' },
                                { name: 'Ohne E-Mail', value: filteredData.length - totalWithEmail, fill: '#e5e7eb' }
                              ]}
                              cx="50%"
                              cy="50%"
                              innerRadius={12}
                              outerRadius={20}
                              dataKey="value"
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="brand-tint-10 p-2 rounded-lg">
                        <Mail className="h-4 w-4 brand-text" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Websites */}
              <Card className="border border-gray-200 shadow-md bg-white hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-2xl font-bold heading-contrast">{totalWithWebsite}</p>
                      <p className="text-xs text-gray-600 mt-1">{t('dashboard.website')}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {Math.round((totalWithWebsite / filteredData.length) * 100)}% {t('dashboard.results')}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-12 h-12">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={[
                                { name: 'Mit Website', value: totalWithWebsite, fill: getComputedStyle(document.documentElement).getPropertyValue('--brand-500') || '#FF6A00' },
                                { name: 'Ohne Website', value: filteredData.length - totalWithWebsite, fill: '#e5e7eb' }
                              ]}
                              cx="50%"
                              cy="50%"
                              innerRadius={12}
                              outerRadius={20}
                              dataKey="value"
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="brand-tint-10 p-2 rounded-lg">
                        <Globe className="h-4 w-4 brand-text" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Events */}
              <Card className="border border-gray-200 shadow-md bg-white hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-3xl font-bold heading-contrast">{totalWithEvents}</p>
                      <p className="text-sm text-gray-600 mt-1">Mit Events</p>
                    </div>
                    <div className="brand-tint-10 p-3 rounded-lg">
                      <TrendingUp className="h-6 w-6 brand-text" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Premium Concepts */}
            <Card className="border border-gray-200 shadow-md bg-white">
              <CardHeader>
                <CardTitle className="flex items-center text-gray-900">
                  <Building className="mr-2 h-5 w-5 brand-text" />
                  Premium-Konzepte
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {premiumConcepts.map((concept) => {
                    const count = conceptCounts[concept];
                    const isActive = filters.concept === concept;
                    return (
                      <div
                        key={concept}
                        onClick={() => handleConceptClick(concept)}
                        className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all hover:shadow-md ${
                          isActive 
                            ? 'brand-bg text-white shadow-md' 
                            : 'bg-gray-50 hover:bg-gray-100'
                        }`}
                      >
                        <span className={`font-medium text-sm ${isActive ? 'text-white' : 'text-gray-900'}`}>
                          {concept}
                        </span>
                        <Badge 
                          className={`${
                            isActive 
                              ? 'bg-white/20 text-white border-white/30' 
                              : 'brand-tint-10 text-[color:var(--brand-500)] border-[color:var(--brand-500)]/20'
                          }`}
                        >
                          {count}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

          </div>

          {/* Right Column - Map and Results */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* Active Filters */}
            {(searchTerm || filters.city || filters.zipCode || filters.concept) && (
              <Card className="border border-gray-200 shadow-md bg-white">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Filter className="h-4 w-4 brand-text" />
                      <span className="font-medium text-gray-900">{t('common.activeFilters')}</span>
                      <div className="flex flex-wrap gap-2">
                        {searchTerm && (
                          <Badge className={`${badgeStyles.classification} flex items-center gap-2 px-3 py-2 text-sm font-medium`}>
                            Suche: {searchTerm}
                            <button
                              onClick={() => setSearchTerm('')}
                              className="ml-1 hover:brand-tint-20 rounded-full p-1"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </Badge>
                        )}
                        {filters.city && (
                          <Badge className={`${badgeStyles.classification} flex items-center gap-2 px-3 py-2 text-sm font-medium`}>
                            Stadt: {filters.city}
                            <button
                              onClick={() => setFilters(prev => ({ ...prev, city: '' }))}
                              className="ml-1 hover:brand-tint-20 rounded-full p-1"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </Badge>
                        )}
                        {filters.zipCode && (
                          <Badge className={`${badgeStyles.classification} flex items-center gap-2 px-3 py-2 text-sm font-medium`}>
                            PLZ: {filters.zipCode}
                            <button
                              onClick={() => setFilters(prev => ({ ...prev, zipCode: '' }))}
                              className="ml-1 hover:brand-tint-20 rounded-full p-1"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </Badge>
                        )}
                        {filters.concept && (
                          <Badge className={`${badgeStyles.classification} flex items-center gap-2 px-3 py-2 text-sm font-medium`}>
                            Konzept: {filters.concept}
                            <button
                              onClick={() => setFilters(prev => ({ ...prev, concept: '' }))}
                              className="ml-1 hover:brand-tint-20 rounded-full p-1"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={clearFilters}
                      className="text-[color:var(--action-500)] border-[color:var(--action-500)] hover:bg-[color:var(--action-500)] hover:text-white"
                    >
                      <X className="mr-1 h-3 w-3" />
                      {t('common.clearFilters')}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Map */}
            <Card className="border border-gray-200 shadow-md bg-white" style={{ padding: '0px' }}>
              <div className="h-[600px]">
                <GoogleMapComponent workshops={filteredData} />
              </div>
            </Card>

            {/* Results */}
            <Card className="border border-gray-200 shadow-md bg-white">
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-gray-900">
                  <span>Werkstätten ({filteredData.length})</span>
                  {filteredData.length > 10 && !showAllEntries && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setShowAllEntries(true)}
                      className="text-[color:var(--action-500)] border-[color:var(--action-500)] hover:bg-[color:var(--action-500)] hover:text-white"
                    >
                      Alle {filteredData.length} anzeigen
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {displayedData.map((item) => (
                    <Link 
                      key={item.id} 
                      to={`/detail/${item.id}`}
                      className="block"
                    >
                      <div className="p-6 border rounded-lg hover:shadow-md transition-all" style={{ borderColor: 'lightgrey' }}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg heading-contrast mb-2">
                              {item.name}
                            </h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                              <div className="space-y-2">
                                <div className="flex items-center text-gray-600">
                                  <MapPin className="mr-2 h-4 w-4 brand-text" />
                                  <span className="text-sm">
                                    {item.street} {item.house_number}, {item.zip_code} {item.city}
                                  </span>
                                </div>
                                
                                {item.telephone && (
                                  <div className="flex items-center text-gray-600">
                                    <Phone className="mr-2 h-4 w-4 brand-text" />
                                    <span className="text-sm">{item.telephone}</span>
                                  </div>
                                )}
                                
                                {item.email && item.email.length > 0 && (() => {
                                  const filteredEmails = filterEmails(item.email);
                                  return filteredEmails.length > 0 && (
                                    <div className="flex items-center text-gray-600">
                                      <Mail className="mr-2 h-4 w-4 brand-text" />
                                      <span className="text-sm">{filteredEmails[0]}</span>
                                    </div>
                                  );
                                })()}
                                
                                {item.website_url && (
                                  <div className="flex items-center text-gray-600">
                                  <Globe className="mr-2 h-4 w-4 brand-text" />
                                    <span className="text-sm">{item.website_url.replace(/^https?:\/\//, '').replace(/\/$/, '')}</span>
                                  </div>
                                )}
                              </div>
                              
                              <div className="space-y-2">
                                <div>
                                  <span className="text-sm font-medium text-gray-700">Klassifikation:</span>
                                  <p className="text-sm text-gray-600">{translateClassification(item.primary_classification)}</p>
                                </div>
                                
                                {item.concepts_networks && item.concepts_networks.length > 0 && (
                                  <div>
                                    <span className="text-sm font-medium text-gray-700">Konzepte:</span>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                      {item.concepts_networks.slice(0, 3).map((concept, index) => (
                                        <Badge 
                                          key={index} 
                                          className="bg-blue-50 text-[#005787] border-blue-200 text-xs"
                                        >
                                          {concept}
                                        </Badge>
                                      ))}
                                      {item.concepts_networks.length > 3 && (
                                        <Badge className={`${badgeStyles.concept} text-sm`}>
                                          +{item.concepts_networks.length - 3}
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                )}
                                
                                {item.events && item.events.length > 0 && (
                                  <div className="flex items-center">
                                    <Calendar className="mr-2 h-4 w-4 brand-text" />
                                    <span className="text-sm heading-contrast font-medium">
                                      {item.events.length} Event{item.events.length !== 1 ? 's' : ''}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <Badge className={`${badgeStyles.status.operational}`}>
                                {item.operational_status === 'OPERATIONAL' ? 'AKTIV' : (item.operational_status || 'AKTIV')}
                              </Badge>
                              <span className="text-xs text-gray-500">
                                ID: {item.id.slice(-8)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
                
                {!showAllEntries && filteredData.length > 50 && (
                  <div className="text-center mt-6">
                    <Button 
                      variant="outline" 
                      onClick={() => setShowAllEntries(true)}
                      className="text-[color:var(--action-500)] border-[color:var(--action-500)] hover:bg-[color:var(--action-500)] hover:text-white"
                    >
                      Weitere {filteredData.length - 50} Werkstätten anzeigen
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center space-x-4">
            <img src={auteonLogo} alt="auteon" className="h-6 rounded-full" />
            <span className="text-sm text-gray-500">
              © 2025 auteon.
            </span>
          </div>
          
          {/* Disclaimer Callout */}
          <div className="mt-6 max-w-4xl mx-auto">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-800 mb-2">
                Wichtiger Hinweis zu den Daten
              </h3>
              <div className="text-xs text-gray-600 space-y-1">
                <p>Die bereitgestellten Daten dienen ausschließlich als Beispiel („Sample") und dürfen nur in Stichproben zur Qualitätsüberprüfung verwendet werden. Eine vollständige Nutzung, Weitergabe oder sonstige Verwertung ist nicht gestattet.</p>
                <p>Jede Verwendung der Daten muss vom Verwender eigenverantwortlich auf ihre DSGVO-Konformität geprüft werden. auteon erteilt mit der Bereitstellung ausdrücklich keine Rechte zur Nutzung der Daten außerhalb der geltenden datenschutzrechtlichen Bestimmungen.</p>
                <p>{t('common.disclaimer')}</p>
                <p><strong>Alle Daten ohne Gewähr.</strong></p>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default DashboardIntegrated;

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
import { Search, Filter, X, Users, Phone, Mail, Globe, Download, MapPin, Building, ChevronDown, Code } from 'lucide-react';
import MapComponent from './MapComponent';
import auteonLogo from '../assets/auteon-logo.jpg';
import { processConceptsNetworks, createExportData, createCSVExportData, PREMIUM_CONCEPTS } from '../utils/dataUtils';
import { DATA_LAST_UPDATED } from '../utils/constants';
import { useLanguage } from '../contexts/LanguageContext';

const Dashboard = ({ data, searchTerm, setSearchTerm, filters, setFilters }) => {
  const { t } = useLanguage();
  const [showAllEntries, setShowAllEntries] = useState(false);
  const [processedData, setProcessedData] = useState([]);

  useEffect(() => {
    const processed = processConceptsNetworks(data);
    setProcessedData(processed);
  }, [data]);

  // Filter data based on search and filters
  const filteredData = processedData.filter(item => {
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

    // Available data filters
    if (filters.hasWebsite && !item.website_url) return false;
    if (filters.hasEmail && !item.email_1) return false;
    if (filters.hasPhone && !item.contact_telephone) return false;

    return true;
  });

  // Get unique values for filters
  const uniqueCities = [...new Set(processedData.map(item => item.city).filter(Boolean))].sort();
  const uniqueZipCodes = [...new Set(processedData.map(item => item.zip_code).filter(Boolean))].sort();
  
  // Get all concepts for filter
  const allConcepts = [...new Set(
    processedData.flatMap(item => item.concepts_networks || [])
  )].sort();

  // Separate premium and other concepts
  const premiumConcepts = allConcepts.filter(concept => 
    PREMIUM_CONCEPTS.some(premium => concept.includes(premium))
  );
  const otherConcepts = allConcepts.filter(concept => 
    !PREMIUM_CONCEPTS.some(premium => concept.includes(premium))
  );

  // Count concepts in filtered data
  const getConceptCount = (concept) => {
    return processedData.filter(item => 
      item.concepts_networks?.some(c => c === concept)
    ).length;
  };

  // Statistics
  const stats = {
    total: filteredData.length,
    withPhone: filteredData.filter(item => item.contact_telephone).length,
    withEmail: filteredData.filter(item => item.email_1).length,
    withWebsite: filteredData.filter(item => item.website_url).length
  };

  // Pie chart data
  const pieData = [
    { name: 'Verfügbar', value: stats.withPhone, color: '#22c55e' },
    { name: 'Nicht verfügbar', value: stats.total - stats.withPhone, color: '#e5e7eb' }
  ];

  const emailPieData = [
    { name: 'Verfügbar', value: stats.withEmail, color: '#22c55e' },
    { name: 'Nicht verfügbar', value: stats.total - stats.withEmail, color: '#e5e7eb' }
  ];

  const websitePieData = [
    { name: 'Verfügbar', value: stats.withWebsite, color: '#22c55e' },
    { name: 'Nicht verfügbar', value: stats.total - stats.withWebsite, color: '#e5e7eb' }
  ];

  // Handle concept click
  const handleConceptClick = (concept) => {
    console.log('Concept clicked:', concept);
    setFilters(prev => ({ 
      ...prev, 
      concept: prev.concept === concept ? '' : concept // Toggle filter
    }));
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setFilters({
      city: '',
      zipCode: '',
      concept: '',
      hasWebsite: false,
      hasEmail: false,
      hasPhone: false
    });
  };

  // Check if any filters are active
  const hasActiveFilters = searchTerm || 
    filters.city || 
    filters.zipCode || 
    filters.concept || 
    filters.hasWebsite || 
    filters.hasEmail || 
    filters.hasPhone;

  // Export functions
  const handleJSONExport = () => {
    const exportData = createExportData(filteredData);
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
      type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `werkstatt-adressen-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCSVExport = () => {
    const csvData = createCSVExportData(filteredData);
    const blob = new Blob([csvData], { 
      type: 'text/csv;charset=utf-8;' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `werkstatt-adressen-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Display data (limited to 10 initially)
  const displayData = showAllEntries ? filteredData : filteredData.slice(0, 10);

  return (
    <div className="space-y-6">
      {/* Active Filters */}
      {hasActiveFilters && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-blue-800">{t('common.activeFilters')}</span>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={clearFilters}
                className="text-blue-600 border-blue-300 hover:bg-blue-100"
              >
                <X className="h-3 w-3 mr-1" />
                {t('common.clearFilters')}
              </Button>
            </div>
            
            <div className="mt-2 space-y-1 text-sm text-blue-700">
              {searchTerm && <div>Suche: "{searchTerm}"</div>}
              {filters.city && <div>Stadt: {filters.city}</div>}
              {filters.zipCode && <div>PLZ: {filters.zipCode}</div>}
              {filters.concept && <div>Konzept: {filters.concept}</div>}
              {(filters.hasWebsite || filters.hasEmail || filters.hasPhone) && (
                <div>
                  Verfügbare Daten: {[
                    filters.hasWebsite && 'Website',
                    filters.hasEmail && 'E-Mail',
                    filters.hasPhone && 'Telefon'
                  ].filter(Boolean).join(', ')}
                </div>
              )}
              <div className="font-medium">
                {filteredData.length} {t('common.of')} {processedData.length} {t('common.entries')} {t('common.found')}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Statistics */}
      {/* ZF Brand Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Workshops Card */}
        <Card className="border border-gray-200 shadow-md bg-white hover:shadow-lg transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                  Werkstätten
                </p>
                <div className="flex items-baseline space-x-2">
                  <span className="text-3xl font-bold text-gray-900">{stats.total}</span>
                  <span className="text-sm text-gray-600 font-medium">gesamt</span>
                </div>
                <p className="text-xs text-gray-500">
                  Stand: {DATA_LAST_UPDATED}
                </p>
              </div>
              <div className="w-12 h-12 bg-[#005787] rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Phone Numbers Card */}
        <Card className="border border-gray-200 shadow-md bg-white hover:shadow-lg transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                  Telefonnummern
                </p>
                <div className="flex items-baseline space-x-2">
                  <span className="text-3xl font-bold text-gray-900">
                    {Math.round((stats.withPhone / stats.total) * 100)}%
                  </span>
                  <span className="text-sm text-gray-600 font-medium">verfügbar</span>
                </div>
                <p className="text-xs text-gray-500">
                  {stats.withPhone} von {stats.total}
                </p>
              </div>
              <div className="w-12 h-12 bg-[#005787] rounded-lg flex items-center justify-center">
                <Phone className="h-6 w-6 text-white" />
              </div>
            </div>
            {/* Progress Bar */}
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-[#005787] h-2 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${(stats.withPhone / stats.total) * 100}%` }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Email Addresses Card */}
        <Card className="border border-gray-200 shadow-md bg-white hover:shadow-lg transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                  E-Mail-Adressen
                </p>
                <div className="flex items-baseline space-x-2">
                  <span className="text-3xl font-bold text-gray-900">
                    {Math.round((stats.withEmail / stats.total) * 100)}%
                  </span>
                  <span className="text-sm text-gray-600 font-medium">verfügbar</span>
                </div>
                <p className="text-xs text-gray-500">
                  {stats.withEmail} von {stats.total}
                </p>
              </div>
              <div className="w-12 h-12 bg-[#005787] rounded-lg flex items-center justify-center">
                <Mail className="h-6 w-6 text-white" />
              </div>
            </div>
            {/* Progress Bar */}
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-[#005787] h-2 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${(stats.withEmail / stats.total) * 100}%` }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Websites Card */}
        <Card className="border border-gray-200 shadow-md bg-white hover:shadow-lg transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                  Websites
                </p>
                <div className="flex items-baseline space-x-2">
                  <span className="text-3xl font-bold text-gray-900">
                    {Math.round((stats.withWebsite / stats.total) * 100)}%
                  </span>
                  <span className="text-sm text-gray-600 font-medium">verfügbar</span>
                </div>
                <p className="text-xs text-gray-500">
                  {stats.withWebsite} von {stats.total}
                </p>
              </div>
              <div className="w-12 h-12 bg-[#005787] rounded-lg flex items-center justify-center">
                <Globe className="h-6 w-6 text-white" />
              </div>
            </div>
            {/* Progress Bar */}
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-[#005787] h-2 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${(stats.withWebsite / stats.total) * 100}%` }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Map and Concepts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Map */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MapPin className="mr-2 h-5 w-5" />
              Standorte
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-96">
              <MapComponent data={filteredData} />
            </div>
          </CardContent>
        </Card>

        {/* Concepts & Networks */}
        <Card className="border border-gray-200 shadow-md bg-white">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center text-lg font-semibold text-gray-900">
              <div className="w-8 h-8 bg-[#005787] rounded-lg flex items-center justify-center mr-3">
                <Building className="h-4 w-4 text-white" />
              </div>
              Konzepte & Netzwerke
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Premium Concepts */}
              <div>
                <div className="flex items-center mb-3">
                  <div className="w-2 h-2 bg-[#005787] rounded-full mr-2"></div>
                  <h4 className="font-semibold text-sm text-gray-700 uppercase tracking-wide">Premium-Konzepte</h4>
                </div>
                <div className="space-y-2">
                  {premiumConcepts.map(concept => (
                    <div 
                      key={concept}
                      className={`group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                        filters.concept === concept 
                          ? 'bg-[#005787] text-white shadow-lg' 
                          : 'bg-gray-50 hover:bg-gray-100 border border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleConceptClick(concept)}
                    >
                      <span className={`text-sm font-medium ${
                        filters.concept === concept ? 'text-white' : 'text-gray-800'
                      }`}>
                        {concept}
                      </span>
                      <Badge 
                        variant="secondary" 
                        className={`${
                          filters.concept === concept 
                            ? 'bg-white/20 text-white border-white/30' 
                            : 'bg-white text-gray-700 border-gray-300'
                        } transition-all duration-200`}
                      >
                        {getConceptCount(concept)}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>

              {/* Other Concepts */}
              <div>
                <div className="flex items-center mb-3">
                  <div className="w-2 h-2 bg-gray-400 rounded-full mr-2"></div>
                  <h4 className="font-semibold text-sm text-gray-700 uppercase tracking-wide">Weitere Konzepte</h4>
                </div>
                <div className="space-y-1 max-h-64 overflow-y-auto custom-scrollbar">
                  {otherConcepts.slice(0, 15).map(concept => (
                    <div 
                      key={concept}
                      className={`group flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-all duration-200 ${
                        filters.concept === concept 
                          ? 'bg-[#005787] text-white shadow-md' 
                          : 'hover:bg-gray-50 border border-transparent hover:border-gray-200'
                      }`}
                      onClick={() => handleConceptClick(concept)}
                    >
                      <span className={`text-sm ${
                        filters.concept === concept ? 'text-white font-medium' : 'text-gray-700'
                      }`}>
                        {concept}
                      </span>
                      <Badge 
                        variant="outline"
                        className={`${
                          filters.concept === concept 
                            ? 'bg-white/20 text-white border-white/30' 
                            : 'border-gray-300 text-gray-600 group-hover:border-gray-400'
                        } transition-all duration-200`}
                      >
                        {getConceptCount(concept)}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Export Section */}
      <Card className="border border-gray-200 shadow-md bg-white">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center text-lg font-semibold text-gray-900">
            <div className="w-8 h-8 bg-[#005787] rounded-lg flex items-center justify-center mr-3">
              <Download className="h-4 w-4 text-white" />
            </div>
            Datenexport
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-sm text-gray-700 font-medium">
                Exportieren Sie die gefilterten Werkstattdaten
              </p>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-[#005787] rounded-full"></div>
                <p className="text-xs text-gray-500">
                  {filteredData.length} Einträge werden exportiert
                </p>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  className="ml-4 bg-[#005787] hover:bg-[#004066] text-white shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleJSONExport}>
                  <Download className="h-4 w-4 mr-2" />
                  JSON
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleCSVExport}>
                  <Download className="h-4 w-4 mr-2" />
                  CSV
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <Link to="/api-docs">
                  <DropdownMenuItem>
                    <Code className="h-4 w-4 mr-2" />
                    API
                  </DropdownMenuItem>
                </Link>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>

      {/* Workshop List */}
      <Card>
        <CardHeader>
          <CardTitle>
            Werkstattadressen ({filteredData.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredData.length === 0 ? (
            <div className="text-center py-12">
              <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-2">{t('common.noResultsFound')}</p>
              <p className="text-sm text-muted-foreground">
                {t('common.noResultsText')}
              </p>
            </div>
          ) : (
            <>
              <div className="grid gap-4">
                {displayData.map((item) => (
                  <Link 
                    key={item.id}
                    to={`/detail/${item.id}`}
                    className="block group"
                  >
                    <div className="p-6 border border-gray-200 rounded-xl hover:shadow-lg hover:border-[#005787]/20 transition-all duration-300 bg-white group-hover:bg-gray-50/50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          {/* Header with Status */}
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="font-semibold text-lg text-gray-900 group-hover:text-[#005787] transition-colors">
                              {item.name}
                            </h3>
                            <Badge 
                              className={`${
                                item.operational_status === 'OPERATIONAL' 
                                  ? 'bg-green-100 text-green-800 border-green-200' 
                                  : 'bg-red-100 text-red-800 border-red-200'
                              } text-xs`}
                            >
                              {item.operational_status === 'OPERATIONAL' ? 'Aktiv' : 'Inaktiv'}
                            </Badge>
                          </div>
                          
                          {/* Address */}
                          <div className="flex items-center text-gray-600 mb-4">
                            <MapPin className="h-4 w-4 mr-2 text-[#005787]" />
                            <span className="text-sm">
                              {item.street} {item.house_number}, {item.zip_code} {item.city}
                            </span>
                          </div>
                          
                          {/* Contact Actions */}
                          <div className="flex flex-wrap gap-3 mb-4">
                            {item.contact_telephone && (
                              <div 
                                className="flex items-center px-3 py-1.5 bg-[#005787]/5 rounded-lg border border-[#005787]/10 hover:bg-[#005787]/10 transition-colors cursor-pointer"
                                onClick={(e) => {
                                  e.preventDefault();
                                  window.open(`tel:${item.contact_telephone}`, '_self');
                                }}
                              >
                                <Phone className="h-3 w-3 mr-1.5 text-[#005787]" />
                                <span className="text-xs text-[#005787] font-medium">
                                  {item.contact_telephone}
                                </span>
                              </div>
                            )}
                            {item.email_1 && (
                              <div 
                                className="flex items-center px-3 py-1.5 bg-[#005787]/5 rounded-lg border border-[#005787]/10 hover:bg-[#005787]/10 transition-colors cursor-pointer"
                                onClick={(e) => {
                                  e.preventDefault();
                                  window.open(`mailto:${item.email_1}`, '_self');
                                }}
                              >
                                <Mail className="h-3 w-3 mr-1.5 text-[#005787]" />
                                <span className="text-xs text-[#005787] font-medium">E-Mail</span>
                              </div>
                            )}
                            {item.website_url && (
                              <div 
                                className="flex items-center px-3 py-1.5 bg-[#005787]/5 rounded-lg border border-[#005787]/10 hover:bg-[#005787]/10 transition-colors cursor-pointer"
                                onClick={(e) => {
                                  e.preventDefault();
                                  window.open(item.website_url, '_blank');
                                }}
                              >
                                <Globe className="h-3 w-3 mr-1.5 text-[#005787]" />
                                <span className="text-xs text-[#005787] font-medium">Website</span>
                              </div>
                            )}
                          </div>
                          
                          {/* Concepts & Networks */}
                          {item.concepts_networks && item.concepts_networks.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {item.concepts_networks.split(',').slice(0, 4).map((concept, idx) => (
                                <Badge 
                                  key={idx} 
                                  variant="outline" 
                                  className="text-xs border-[#005787]/20 text-[#005787] bg-[#005787]/5 hover:bg-[#005787]/10 transition-colors"
                                >
                                  {concept.trim()}
                                </Badge>
                              ))}
                              {item.concepts_networks.split(',').length > 4 && (
                                <Badge 
                                  variant="outline" 
                                  className="text-xs border-gray-300 text-gray-600 bg-gray-50"
                                >
                                  +{item.concepts_networks.split(',').length - 4} weitere
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                        
                        {/* Arrow indicator */}
                        <div className="ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="w-8 h-8 bg-[#005787] rounded-full flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Show More Button */}
              {!showAllEntries && filteredData.length > 10 && (
                <div className="text-center mt-6">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowAllEntries(true)}
                  >
                    Alle {filteredData.length} Einträge anzeigen
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="mt-12 pt-8 border-t border-border">
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            <img 
              src={auteonLogo} 
              alt="auteon Logo" 
              className="h-8 w-8 rounded-full"
            />
          </div>
          
          <div className="text-sm text-muted-foreground mb-6">
            <p>© 2025 auteon GmbH. Alle Rechte vorbehalten.</p>
          </div>

          {/* Disclaimer */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-left max-w-4xl mx-auto">
            <div className="flex items-start space-x-3">
              <div className="h-5 w-5 text-gray-500 mt-0.5 flex-shrink-0">⚠️</div>
              <div className="text-sm text-gray-700">
                <p className="mb-3">
                  {t('footer.sampleUsage')}
                </p>
                <p className="mb-3">
                  {t('footer.gdprCompliance')}
                </p>
                <p>
                  {t('common.disclaimer')}
                </p>
                <p className="mt-3">
                  <strong>{t('footer.noWarranty')}</strong>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

import React, { useState, useMemo } from 'react';
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
import { Search, Filter, X, Building, MapPin, Calendar, ExternalLink, Download, ChevronDown, Code } from 'lucide-react';
import auteonLogo from '../assets/auteon-logo.jpg';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { filterEmails, filterEmailsFromArray } from '../utils/emailFilter';
import { convertToCSV } from '../utils/dataUtils';
import { useLanguage } from '../contexts/LanguageContext';

const CompanyFoundingsPageIntegrated = ({ data }) => {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState({ from: undefined, to: undefined });

  // Helper function to parse German date format (DD.MM.YYYY)
  const parseGermanDate = (dateString) => {
    if (!dateString) return null;
    const parts = dateString.split('.');
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1; // JavaScript months are 0-based
      const year = parseInt(parts[2], 10);
      return new Date(year, month, day);
    }
    return new Date(dateString); // Fallback to default parsing
  };

  // Extract all founding events from the data
  const foundingEvents = useMemo(() => {
    const events = [];
    data.forEach(workshop => {
      if (workshop.events) {
        workshop.events.forEach(event => {
          if (event.event_type === 'founding') {
            events.push({
              ...event,
              workshop_id: workshop.id,
              workshop_name: workshop.name,
              workshop_city: workshop.city,
              workshop_zip: workshop.zip_code,
              workshop_street: workshop.street,
              workshop_house_number: workshop.house_number,
              workshop_classification: workshop.primary_classification
            });
          }
        });
      }
    });
    return events.sort((a, b) => {
      const dateA = parseGermanDate(a.event_date);
      const dateB = parseGermanDate(b.event_date);
      return dateB - dateA;
    });
  }, [data]);

  // Filter events
  const filteredEvents = foundingEvents.filter(event => {
    const matchesSearch = !searchTerm || 
      event.workshop_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.workshop_city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.description?.toLowerCase().includes(searchTerm.toLowerCase());

    // Date range filter
    let matchesDateRange = true;
    if (dateRange.from || dateRange.to) {
      const eventDate = parseGermanDate(event.event_date);
      
      if (dateRange.from && eventDate < dateRange.from) {
        matchesDateRange = false;
      }
      if (dateRange.to && eventDate > dateRange.to) {
        matchesDateRange = false;
      }
    }

    return matchesSearch && matchesDateRange;
  });

  // Statistics based on filtered events
  const totalFoundings = filteredEvents.length;
  const gmbhCount = filteredEvents.filter(event => event.details?.legal_form === 'GmbH').length;
  const ugCount = filteredEvents.filter(event => event.details?.legal_form === 'UG').length;
  const uniqueCities = new Set(filteredEvents.map(event => event.workshop_city)).size;

  const clearFilters = () => {
    setSearchTerm('');
    setDateRange({ from: undefined, to: undefined });
  };

  // Consistent styling system
  const badgeStyles = {
    // Status badges
    status: {
      active: "bg-emerald-50 text-emerald-700 border-emerald-200",
      inactive: "bg-red-50 text-red-700 border-red-200",
      operational: "bg-emerald-50 text-emerald-700 border-emerald-200"
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

  // Export function for filtered companies as JSON
  const exportFilteredCompaniesJSON = () => {
    // Get all unique company IDs from filtered events
    const filteredCompanyIds = new Set(filteredEvents.map(event => event.workshop_id));
    
    // Get all data for these companies and clean them
    const companiesToExport = data.filter(workshop => filteredCompanyIds.has(workshop.id))
      .map(workshop => cleanDataForExport(workshop));
    
    // Create export metadata
    const exportMetadata = {
      exportDate: new Date().toISOString(),
      totalRecords: companiesToExport.length,
      filteredEvents: filteredEvents.length,
      filters: {
        searchTerm: searchTerm || null,
        dateRange: {
          from: dateRange.from ? format(dateRange.from, "yyyy-MM-dd") : null,
          to: dateRange.to ? format(dateRange.to, "yyyy-MM-dd") : null
        }
      },
      description: "Gefilterte Unternehmensdaten basierend auf Gründungsereignissen"
    };

    // Create the export object
    const exportData = {
      metadata: exportMetadata,
      companies: companiesToExport,
      foundingEvents: filteredEvents
    };

    // Create and download JSON file
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
      type: 'application/json' 
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gruendungen_gefiltert_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Export function for filtered companies as CSV
  const exportFilteredCompaniesCSV = () => {
    // Get all unique company IDs from filtered events
    const filteredCompanyIds = new Set(filteredEvents.map(event => event.workshop_id));
    
    // Get all data for these companies and clean them
    const companiesToExport = data.filter(workshop => filteredCompanyIds.has(workshop.id))
      .map(workshop => cleanDataForExport(workshop));
    
    // Convert to CSV format
    const csvData = convertToCSV(companiesToExport);
    
    // Create and download CSV file
    const blob = new Blob([csvData], { 
      type: 'text/csv;charset=utf-8;' 
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gruendungen_gefiltert_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-16 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link to="/">
                <Button variant="outline" size="sm">
                  {t('common.backToOverview')}
                </Button>
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">{t('foundings.title')}</h1>
            </div>
            <div className="flex items-center space-x-3">
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <Badge variant="outline" className={`${badgeStyles.callout} text-sm px-3 py-1`}>
                  <Calendar className="w-3 h-3 mr-1" />
                  {t('foundings.subtitle')}
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
                      {t('common.export')} ({filteredEvents.length > 0 ? new Set(filteredEvents.map(event => event.workshop_id)).size : 0})
                      <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={exportFilteredCompaniesJSON}>
                      <Download className="h-4 w-4 mr-2" />
                      {t('foundings.json')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={exportFilteredCompaniesCSV}>
                      <Download className="h-4 w-4 mr-2" />
                      {t('foundings.csv')}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <Link to="/api-docs">
                      <DropdownMenuItem>
                        <Code className="h-4 w-4 mr-2" />
                        {t('foundings.api')}
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

        {/* Search and Filters */}
        <Card className="border border-gray-200 shadow-md bg-white mb-8">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Input
                  placeholder={t('foundings.searchPlaceholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                />
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
              
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {dateRange.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "dd.MM.yyyy", { locale: de })} -{" "}
                          {format(dateRange.to, "dd.MM.yyyy", { locale: de })}
                        </>
                      ) : (
                        format(dateRange.from, "dd.MM.yyyy", { locale: de })
                      )
                    ) : (
                      <span>Zeitraum wählen</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange.from}
                    selected={dateRange}
                    onSelect={(range) => {
                      if (range) {
                        setDateRange(range);
                      }
                    }}
                    numberOfMonths={2}
                    locale={de}
                  />
                </PopoverContent>
              </Popover>

              <Button 
                variant="outline" 
                onClick={clearFilters}
                className="text-[color:var(--action-500)] border-[color:var(--action-500)] hover:bg-[color:var(--action-500)] hover:text-white"
              >
                <X className="mr-2 h-4 w-4" />
                {t('common.clearFilters')}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border border-gray-200 shadow-md bg-white hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-[#005787]">{totalFoundings}</p>
                  <p className="text-sm text-gray-600 mt-1">Gründungen</p>
                </div>
                <div className="brand-tint-10 p-3 rounded-lg">
                  <Building className="h-6 w-6 brand-text" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-gray-200 shadow-md bg-white hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-[#005787]">{gmbhCount}</p>
                  <p className="text-sm text-gray-600 mt-1">GmbH</p>
                </div>
                <div className="brand-tint-10 p-3 rounded-lg">
                  <Building className="h-6 w-6 brand-text" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-gray-200 shadow-md bg-white hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-[#005787]">{ugCount}</p>
                  <p className="text-sm text-gray-600 mt-1">UG</p>
                </div>
                <div className="brand-tint-10 p-3 rounded-lg">
                  <Building className="h-6 w-6 brand-text" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-gray-200 shadow-md bg-white hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-[#005787]">{uniqueCities}</p>
                  <p className="text-sm text-gray-600 mt-1">Städte</p>
                </div>
                <div className="brand-tint-10 p-3 rounded-lg">
                  <MapPin className="h-6 w-6 brand-text" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Results */}
        <Card className="border border-gray-200 shadow-md bg-white">
          <CardHeader>
            <CardTitle className="flex items-center text-gray-900">
              <Calendar className="mr-2 h-5 w-5 text-[#005787]" />
              Gründungen ({filteredEvents.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {filteredEvents.map((event, index) => (
                <Link 
                  key={index} 
                  to={`/detail/${event.workshop_id}`}
                  className="block border rounded-lg p-6 bg-white hover:bg-gray-50 transition-colors hover:shadow-md cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="text-xl font-semibold text-[#005787]">
                        {event.workshop_name}
                      </div>
                      <div className="flex items-center space-x-2 mt-2">
                        <Badge className="bg-green-50 text-green-700 border-green-200 text-sm">
                          Neueintragung
                        </Badge>
                        <span className="text-sm text-gray-500">{event.event_date}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div>
                        <span className="font-medium text-gray-700">Branche:</span>
                        <p className="text-gray-900 mt-1">{event.details?.branch || event.workshop_classification || 'Nicht verfügbar'}</p>
                      </div>
                      
                      <div>
                        <span className="font-medium text-gray-700">Straße:</span>
                        <p className="text-gray-900 mt-1">
                          {event.workshop_street} {event.workshop_house_number}
                        </p>
                      </div>
                      
                      {event.details?.register_id && (
                        <div>
                          <span className="font-medium text-gray-700">Register-ID:</span>
                          <p className="text-gray-900 mt-1">{event.details.register_id}</p>
                        </div>
                      )}
                    </div>

                    <div className="space-y-3">
                      <div>
                        <span className="font-medium text-gray-700">Ort:</span>
                        <p className="text-gray-900 mt-1">{event.workshop_zip} {event.workshop_city}</p>
                      </div>
                      
                      {event.details?.court && (
                        <div>
                          <span className="font-medium text-gray-700">Amtsgericht:</span>
                          <p className="text-gray-900 mt-1">{event.details.court}</p>
                        </div>
                      )}
                      
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t flex items-center justify-end">
                    <span className="text-xs text-gray-500">
                      Erstellt: {new Date(event.created_at).toLocaleDateString('de-DE')}
                    </span>
                  </div>
                </Link>
              ))}

              {filteredEvents.length === 0 && (
                <div className="text-center py-12">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">{t('common.noResultsFound')}</h3>
                  <p className="text-gray-500">
                    {t('common.noResultsText')}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
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
                {t('footer.importantNotice')}
              </h3>
              <div className="text-xs text-gray-600 space-y-1">
                <p>{t('footer.sampleUsage')}</p>
                <p>{t('footer.gdprCompliance')}</p>
                <p>{t('common.disclaimer')}</p>
                <p><strong>{t('footer.noWarranty')}</strong></p>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default CompanyFoundingsPageIntegrated;

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Calendar, Building, MapPin, Euro, Users, FileText } from 'lucide-react';
import auteonLogo from '../assets/auteon-logo.jpg';

const CompanyFoundingsPage = () => {
  const [foundingsData, setFoundingsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [branchFilter, setBranchFilter] = useState('');

  useEffect(() => {
    const loadFoundingsData = async () => {
      try {
        const response = await fetch('/foundings-data.json');
        if (response.ok) {
          const data = await response.json();
          // Sort by date descending (newest first)
          const sortedData = data.sort((a, b) => {
            const dateA = new Date(a["Eintragung Datum"]?.split('.').reverse().join('-') || '1900-01-01');
            const dateB = new Date(b["Eintragung Datum"]?.split('.').reverse().join('-') || '1900-01-01');
            return dateB - dateA;
          });
          setFoundingsData(sortedData);
        }
      } catch (error) {
        console.error('Error loading foundings data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadFoundingsData();
  }, []);

  // Filter data based on search, date, and branch code
  const filteredData = foundingsData.filter(item => {
    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        item.Name?.toLowerCase().includes(searchLower) ||
        item.Ort?.toLowerCase().includes(searchLower) ||
        item.Rechtsform?.toLowerCase().includes(searchLower) ||
        item["Branche (WZ)"]?.toLowerCase().includes(searchLower) ||
        item.Straße?.toLowerCase().includes(searchLower);
      
      if (!matchesSearch) return false;
    }

    // Date filter
    if (dateFilter) {
      const itemDateStr = item["Eintragung Datum"];
      if (itemDateStr) {
        // Convert DD.MM.YYYY to YYYY-MM-DD for comparison
        const itemDate = itemDateStr.split('.').reverse().join('-');
        if (itemDate !== dateFilter) return false;
      } else {
        return false; // Exclude items without date if filter is set
      }
    }

    // Branch code filter
    if (branchFilter) {
      const branchCode = item["Branche (WZ)"];
      if (!branchCode || !branchCode.startsWith(branchFilter)) {
        return false;
      }
    }

    return true;
  });

  // Get unique dates for filter
  const uniqueDates = [...new Set(
    foundingsData
      .map(item => item["Eintragung Datum"])
      .filter(Boolean)
      .map(dateStr => dateStr.split('.').reverse().join('-')) // Convert to YYYY-MM-DD
  )].sort().reverse();

  // Statistics
  const stats = {
    total: filteredData.length,
    gmbh: filteredData.filter(item => item.Rechtsform?.includes('GmbH')).length,
    ug: filteredData.filter(item => item.Rechtsform?.includes('UG')).length,
    cities: [...new Set(filteredData.map(item => item.Ort))].filter(Boolean).length
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p>Lade Gründungsdaten...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Unternehmensgründungen</h1>
        <p className="text-muted-foreground">
          Übersicht der Werkstatt-Gründungen aus den Northdata-Beispieldaten
        </p>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Suchen nach Firma, Ort, Geschäftsführer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
              >
                <option value="">Alle Daten</option>
                {uniqueDates.map(date => (
                  <option key={date} value={date}>
                    {new Date(date).toLocaleDateString('de-DE')}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={branchFilter}
                onChange={(e) => setBranchFilter(e.target.value)}
                className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
              >
                <option value="">Alle Branchen</option>
                <option value="45.20.1">45.20.1 - PKW Reparatur</option>
                <option value="45.20.2">45.20.2 - Karosserie & Lackierung</option>
                <option value="45.20.3">45.20.3 - PKW ≤ 3,5t Reparatur</option>
                <option value="45.20.4">45.20.4 - LKW > 3,5t Reparatur</option>
                <option value="45.20">45.20 - Allgemeine KFZ-Reparatur</option>
              </select>
            </div>

            <Button 
              variant="outline" 
              onClick={() => {
                setSearchTerm('');
                setDateFilter('');
                setBranchFilter('');
              }}
            >
              Filter zurücksetzen
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border border-gray-200 shadow-md bg-white hover:shadow-lg transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
                <p className="text-xs text-gray-600">Gründungen</p>
              </div>
              <div className="w-10 h-10 bg-[#005787] rounded-lg flex items-center justify-center">
                <Building className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 shadow-md bg-white hover:shadow-lg transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-900">{stats.gmbh}</div>
                <p className="text-xs text-gray-600">GmbH</p>
              </div>
              <div className="w-10 h-10 bg-[#005787] rounded-lg flex items-center justify-center">
                <FileText className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 shadow-md bg-white hover:shadow-lg transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-900">{stats.ug}</div>
                <p className="text-xs text-gray-600">UG</p>
              </div>
              <div className="w-10 h-10 bg-[#005787] rounded-lg flex items-center justify-center">
                <FileText className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 shadow-md bg-white hover:shadow-lg transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-900">{stats.cities}</div>
                <p className="text-xs text-gray-600">Städte</p>
              </div>
              <div className="w-10 h-10 bg-[#005787] rounded-lg flex items-center justify-center">
                <MapPin className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Results */}
      <Card>
        <CardHeader>
          <CardTitle>
            Gründungen ({filteredData.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredData.length === 0 ? (
            <div className="text-center py-12">
              <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-2">Keine Gründungen gefunden</p>
              <p className="text-sm text-muted-foreground">
                Versuchen Sie andere Suchbegriffe oder entfernen Sie die Filter.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredData.map((item, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1">{item.Name}</h3>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-2">
                        <div className="flex items-center">
                          <Calendar className="mr-1 h-4 w-4" />
                          {item["Eintragung Datum"] || 'Datum nicht verfügbar'}
                        </div>
                        <div className="flex items-center">
                          <MapPin className="mr-1 h-4 w-4" />
                          {item.PLZ} {item.Ort}
                        </div>
                      </div>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={
                        item.Rechtsform?.includes('GmbH') ? 'bg-blue-50 text-blue-700 border-blue-200' :
                        item.Rechtsform?.includes('UG') ? 'bg-green-50 text-green-700 border-green-200' :
                        'bg-gray-50 text-gray-700 border-gray-200'
                      }
                    >
                      {item.Rechtsform}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    {item["Branche (WZ)"] && (
                      <div>
                        <span className="font-medium text-muted-foreground">Branche:</span>
                        <p className="mt-1">{item["Branche (WZ)"]}</p>
                      </div>
                    )}
                    
                    {item.Straße && (
                      <div>
                        <span className="font-medium text-muted-foreground">Straße:</span>
                        <p className="mt-1">{item.Straße}</p>
                      </div>
                    )}
                    
                    {item["Register-ID"] && (
                      <div>
                        <span className="font-medium text-muted-foreground">Register-ID:</span>
                        <p className="mt-1">{item["Register-ID"]}</p>
                      </div>
                    )}
                    
                    {item["HR Amtsgericht"] && (
                      <div>
                        <span className="font-medium text-muted-foreground">Amtsgericht:</span>
                        <p className="mt-1">{item["HR Amtsgericht"]}</p>
                      </div>
                    )}
                  </div>

                  {item["North Data URL"] && (
                    <div className="mt-3 pt-3 border-t">
                      <span className="font-medium text-muted-foreground">Northdata:</span>
                      <p className="mt-1 text-sm">
                        <a 
                          href={item["North Data URL"]} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          Weitere Details anzeigen
                        </a>
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
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
                  Die bereitgestellten Daten dienen ausschließlich als Beispiel („Sample") und dürfen nur in Stichproben zur Qualitätsüberprüfung verwendet werden. Eine vollständige Nutzung, Weitergabe oder sonstige Verwertung ist nicht gestattet.
                </p>
                <p className="mb-3">
                  Jede Verwendung der Daten muss vom Verwender eigenverantwortlich auf ihre DSGVO-Konformität geprüft werden. auteon erteilt mit der Bereitstellung ausdrücklich keine Rechte zur Nutzung der Daten außerhalb der geltenden datenschutzrechtlichen Bestimmungen.
                </p>
                <p>
                  Die Daten stammen nicht aus vertraulichen Informationen, die Werkstätten auteon im Rahmen der Nutzung von auteon übermittelt haben oder daraus entstanden sind.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyFoundingsPage;

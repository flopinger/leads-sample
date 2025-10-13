import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Calendar, Building, Users, AlertCircle, ExternalLink, Info } from 'lucide-react';
import { Link } from 'react-router-dom';
import auteonLogo from '../assets/auteon-logo.jpg';

const ManagementChangesPage = ({ data }) => {
  const [changesData, setChangesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [lastUpdated, setLastUpdated] = useState('');

  useEffect(() => {
    const loadChangesData = async () => {
      try {
        const response = await fetch('/management-changes.json');
        if (response.ok) {
          const allChanges = await response.json();
          
          // Filter to only show entries with "In Daten verfügbar" (available data)
          // and that have management change information
          const availableChanges = allChanges.filter(change => 
            change.Managementwechsel && 
            change["Managementwechsel Datum"] &&
            change.Managementwechsel !== "In Daten verfügbar"
          );
          
          // Sort by date descending (newest first)
          const sortedChanges = availableChanges.sort((a, b) => {
            const dateA = new Date(a["Managementwechsel Datum"]?.split('.').reverse().join('-') || '1900-01-01');
            const dateB = new Date(b["Managementwechsel Datum"]?.split('.').reverse().join('-') || '1900-01-01');
            return dateB - dateA;
          });
          
          setChangesData(sortedChanges);
          
          // Set a centralized update date (use current date as data snapshot date)
          setLastUpdated('01.10.2025');
        }
      } catch (error) {
        console.error('Error loading management changes:', error);
      } finally {
        setLoading(false);
      }
    };

    loadChangesData();
  }, [data]);

  // Filter data based on search
  const filteredData = changesData.filter(item => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        item.Name?.toLowerCase().includes(searchLower) ||
        item.Ort?.toLowerCase().includes(searchLower) ||
        item.Managementwechsel?.toLowerCase().includes(searchLower) ||
        item.Rechtsform?.toLowerCase().includes(searchLower) ||
        item["Branche (WZ)"]?.toLowerCase().includes(searchLower);
      
      if (!matchesSearch) return false;
    }

    return true;
  });

  // Helper function to format date
  const formatDate = (dateStr) => {
    if (!dateStr) return 'Datum nicht verfügbar';
    return dateStr; // Already in DD.MM.YYYY format
  };

  // Statistics
  const stats = {
    total: filteredData.length,
    thisYear: filteredData.filter(item => {
      const dateStr = item["Managementwechsel Datum"];
      if (!dateStr) return false;
      const year = parseInt(dateStr.split('.')[2]);
      return year === 2025;
    }).length,
    organizations: [...new Set(filteredData.map(item => item.Name))].filter(Boolean).length
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p>Lade Management-Änderungen...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Management-Änderungen</h1>
        <p className="text-muted-foreground">
          Übersicht der Management-Wechsel in den Sample-Werkstätten
        </p>
      </div>

      {/* Last Updated Callout */}
      {lastUpdated && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-4">
            <div className="flex items-center space-x-2">
              <Info className="h-5 w-5 text-blue-600" />
              <div>
                <p className="font-medium text-blue-800">
                  Datenstand: {lastUpdated}
                </p>
                <p className="text-sm text-blue-700">
                  Zeigt nur Einträge mit verfügbaren Management-Änderungsdaten aus den Northdata-Beispieldaten.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Suchen nach Firma, Stadt, Management-Änderung..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Button 
              variant="outline" 
              onClick={() => setSearchTerm('')}
            >
              Suche zurücksetzen
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border border-gray-200 shadow-md bg-white hover:shadow-lg transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
                <p className="text-xs text-gray-600">Änderungen</p>
              </div>
              <div className="w-10 h-10 bg-[#005787] rounded-lg flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 shadow-md bg-white hover:shadow-lg transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-900">{stats.thisYear}</div>
                <p className="text-xs text-gray-600">2025</p>
              </div>
              <div className="w-10 h-10 bg-[#005787] rounded-lg flex items-center justify-center">
                <Calendar className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 shadow-md bg-white hover:shadow-lg transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-900">{stats.organizations}</div>
                <p className="text-xs text-gray-600">Organisationen</p>
              </div>
              <div className="w-10 h-10 bg-[#005787] rounded-lg flex items-center justify-center">
                <Building className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Results */}
      <Card>
        <CardHeader>
          <CardTitle>
            Management-Änderungen ({filteredData.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredData.length === 0 ? (
            <div className="text-center py-12">
              <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-2">Keine Management-Änderungen gefunden</p>
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
                      <div className="flex items-center space-x-2 mb-2">
                        <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                          <Calendar className="mr-1 h-3 w-3" />
                          {formatDate(item["Managementwechsel Datum"])}
                        </Badge>
                        <Badge variant="outline" className={
                          item.Rechtsform?.includes('GmbH') ? 'bg-blue-50 text-blue-700 border-blue-200' :
                          item.Rechtsform?.includes('UG') ? 'bg-green-50 text-green-700 border-green-200' :
                          'bg-gray-50 text-gray-700 border-gray-200'
                        }>
                          {item.Rechtsform}
                        </Badge>
                      </div>
                      
                      <div className="mb-2">
                        <h3 className="font-semibold text-lg">{item.Name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {item.Straße}, {item.PLZ} {item.Ort}
                        </p>
                      </div>
                      
                      <div className="text-sm space-y-1">
                        <p><span className="font-medium">Management-Änderung:</span> {item.Managementwechsel}</p>
                        {item["Branche (WZ)"] && (
                          <p><span className="font-medium">Branche:</span> {item["Branche (WZ)"]}</p>
                        )}
                      </div>
                    </div>
                    
                    {item["North Data URL"] && (
                      <div className="ml-4">
                        <a 
                          href={item["North Data URL"]} 
                          target="_blank" 
                          rel="noopener noreferrer"
                        >
                          <Button variant="outline" size="sm">
                            <ExternalLink className="mr-1 h-3 w-3" />
                            Northdata
                          </Button>
                        </a>
                      </div>
                    )}
                  </div>
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
            <p>© 2025 auteon GmbH.</p>
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

export default ManagementChangesPage;

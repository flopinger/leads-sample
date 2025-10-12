import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  Clock, 
  Building,
  Users,
  CheckCircle,
  ExternalLink,
  Calendar,
  Database,
  Settings,
  Star,
  TrendingUp,
  BarChart3
} from 'lucide-react';
import auteonLogo from '../assets/auteon-logo.jpg';
import { getOpeningStatus, getStatusColor, getStatusIcon } from '../utils/openingHours';

const DetailPageIntegrated = ({ data }) => {
  const { id } = useParams();
  const [item, setItem] = useState(null);

  useEffect(() => {
    if (data && id) {
      const foundItem = data.find(workshop => workshop.id === id);
      setItem(foundItem);
    }
  }, [data, id]);

  if (!item) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Werkstatt nicht gefunden</h2>
          <Link to="/">
            <Button>Zurück zur Übersicht</Button>
          </Link>
        </div>
      </div>
    );
  }

  const safeRender = (value) => {
    if (value === null || value === undefined || value === '') return 'Nicht verfügbar';
    return String(value);
  };

  // Parse working hours
  const workingHours = (() => {
    try {
      if (item.working_hours_structured && typeof item.working_hours_structured === 'string') {
        return JSON.parse(item.working_hours_structured);
      }
    } catch (error) {
      console.error('Error parsing working hours:', error);
    }
    return null;
  })();

  // Get Google Business data
  const googleBusinessData = (() => {
    const googleRel = item.relationships?.find(rel => rel.handle === 'GOOGLE_BUSINESS');
    if (googleRel) {
      try {
        return JSON.parse(googleRel.source_data);
      } catch (error) {
        console.error('Error parsing Google Business data:', error);
      }
    }
    return null;
  })();

  // Get Northdata data
  const northdataData = (() => {
    const northdataRel = item.relationships?.find(rel => rel.handle === 'NORTHDATA');
    if (northdataRel) {
      try {
        return JSON.parse(northdataRel.source_data);
      } catch (error) {
        console.error('Error parsing Northdata:', error);
      }
    }
    return null;
  })();

  // Get management changes and foundings from events
  const managementChanges = item.events?.filter(event => event.event_type === 'management_change') || [];
  const foundings = item.events?.filter(event => event.event_type === 'founding') || [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link to="/">
              <Button variant="outline" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Zurück zur Übersicht
              </Button>
            </Link>
            <img src={auteonLogo} alt="auteon" className="h-8" />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          
          {/* Main Info Card */}
          <Card className="border border-gray-200 shadow-md bg-white">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-2xl font-bold text-gray-900 mb-2">
                    {safeRender(item.name)}
                  </CardTitle>
                  <div className="flex items-center space-x-2 mb-4">
                    <Badge className="bg-green-100 text-green-800 border-green-200">
                      {item.operational_status === 'OPERATIONAL' ? 'AKTIV' : (item.operational_status || 'AKTIV')}
                    </Badge>
                    {(() => {
                      const gmapsType = item.relationships?.GMAPS_CRAWLER?.type;
                      const classification = gmapsType || item.primary_classification;
                      return classification ? (
                        <Badge className="bg-[#005787]/10 text-[#005787] border-[#005787]/20">
                          {classification}
                        </Badge>
                      ) : null;
                    })()}
                  </div>

                  {/* Data Source USPs */}
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="bg-green-100 p-2 rounded-lg">
                          <Database className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-green-800">
                            {(() => {
                              let sourceCount = 1; // Main dataset
                              if (item.relationships) {
                                sourceCount += Object.keys(item.relationships).length;
                              }
                              return `${sourceCount} Datenquellen`;
                            })()}
                          </p>
                          <p className="text-sm text-green-700">
                            Verifizierte Informationen aus mehreren Quellen
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-green-800">
                          {item.updated_at ? new Date(item.updated_at).toLocaleDateString('de-DE') : 'Aktuell'}
                        </p>
                        <p className="text-sm text-green-700">Letztes Update</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Google Rating */}
                  {googleBusinessData?.rating && (
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="flex items-center">
                        <Star className="h-5 w-5 text-yellow-500 fill-current" />
                        <span className="ml-1 font-semibold text-lg">{googleBusinessData.rating}</span>
                      </div>
                      <span className="text-gray-600">({googleBusinessData.reviews} Bewertungen)</span>
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Google Place ID</p>
                  <p className="font-mono text-xs text-[#005787]">{item.google_place_id}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* Contact Information */}
                <div className="space-y-6">
                  <h3 className="font-semibold flex items-center text-[#005787] text-lg">
                    <Phone className="mr-2 h-5 w-5" />
                    Kontakt & Ansprechpartner
                  </h3>
                  
                  {/* Address */}
                  <div className="space-y-2">
                    <span className="font-medium text-gray-700">Adresse:</span>
                    <div className="flex items-start space-x-2">
                      <MapPin className="mr-2 h-4 w-4 text-[#005787] mt-1" />
                      <div>
                        <p className="text-gray-900">{safeRender(item.street)} {safeRender(item.house_number)}</p>
                        <p className="text-gray-900">{safeRender(item.zip_code)} {safeRender(item.city)}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Phone */}
                  {item.telephone && (
                    <div className="space-y-2">
                      <span className="font-medium text-gray-700">Telefon:</span>
                      <div className="flex items-center">
                        <Phone className="mr-2 h-4 w-4 text-[#005787]" />
                        <a href={`tel:${item.telephone}`} className="text-[#005787] hover:underline font-medium">
                          {item.telephone}
                        </a>
                      </div>
                    </div>
                  )}
                  
                  {/* Email */}
                  {item.email && item.email.length > 0 && (
                    <div className="space-y-2">
                      <span className="font-medium text-gray-700">E-Mail:</span>
                      {item.email.map((email, index) => (
                        <div key={index} className="flex items-center">
                          <Mail className="mr-2 h-4 w-4 text-[#005787]" />
                          <a href={`mailto:${email}`} className="text-[#005787] hover:underline font-medium">
                            {email}
                          </a>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Website */}
                  {item.website_url && (
                    <div className="space-y-2">
                      <span className="font-medium text-gray-700">Website:</span>
                      <div className="flex items-center">
                        <Globe className="mr-2 h-4 w-4 text-[#005787]" />
                        <a href={item.website_url} target="_blank" rel="noopener noreferrer" className="text-[#005787] hover:underline font-medium">
                          {item.website_url.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                        </a>
                      </div>
                    </div>
                  )}
                  
                  {/* Contact Persons */}
                  {item.contact_persons && item.contact_persons.length > 0 && (
                    <div className="space-y-2">
                      <span className="font-medium text-gray-700">Ansprechpartner:</span>
                      {item.contact_persons.map((contact, index) => (
                        <div key={index} className="flex items-center">
                          <Users className="mr-2 h-4 w-4 text-[#005787]" />
                          <span className="text-gray-700">{contact}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Business Information */}
                <div className="space-y-6">
                  <h3 className="font-semibold flex items-center text-[#005787] text-lg">
                    <Building className="mr-2 h-5 w-5" />
                    Unternehmensinformationen
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <span className="font-medium text-gray-700">Klassifikation:</span>
                      <p className="text-gray-900 mt-1">
                        {safeRender(item.relationships?.GMAPS_CRAWLER?.type || item.primary_classification)}
                      </p>
                    </div>
                    
                    {/* Concepts & Networks */}
                    {item.concepts_networks && item.concepts_networks.length > 0 && (
                      <div className="space-y-3">
                        <span className="font-medium text-gray-700">Konzepte & Netzwerke:</span>
                        <div className="flex flex-wrap gap-2">
                          {item.concepts_networks.map((concept, index) => (
                            <Badge 
                              key={index} 
                              className="bg-[#005787]/10 text-[#005787] border-[#005787]/20 hover:bg-[#005787]/20 transition-colors"
                            >
                              {concept}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Northdata Information */}
                    {northdataData && (
                      <div className="space-y-3">
                        <span className="font-medium text-gray-700">Handelsregister:</span>
                        <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                          {northdataData['Register-ID'] && (
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Register-ID:</span>
                              <span className="text-sm font-medium">{northdataData['Register-ID']}</span>
                            </div>
                          )}
                          {northdataData['Rechtsform'] && (
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Rechtsform:</span>
                              <span className="text-sm font-medium">{northdataData['Rechtsform']}</span>
                            </div>
                          )}
                          {northdataData['Umsatz EUR'] && (
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Umsatz:</span>
                              <span className="text-sm font-medium">{northdataData['Umsatz EUR']} EUR</span>
                            </div>
                          )}
                          {northdataData['Mitarbeiterzahl'] && (
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Mitarbeiter:</span>
                              <span className="text-sm font-medium">{northdataData['Mitarbeiterzahl']}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Opening Hours */}
          {workingHours && (
            <Card className="border border-gray-200 shadow-md bg-white">
              <CardHeader>
                <CardTitle className="flex items-center text-gray-900">
                  <Clock className="mr-2 h-5 w-5 text-[#005787]" />
                  Öffnungszeiten
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Real-time Status */}
                {(() => {
                  const status = getOpeningStatus(workingHours);
                  return (
                    <div className={`mb-6 p-4 rounded-lg border ${getStatusColor(status.status)}`}>
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{getStatusIcon(status.status)}</span>
                        <span className="font-medium">{status.message}</span>
                      </div>
                    </div>
                  );
                })()}
                
                {/* Opening Hours Table */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(workingHours).map(([day, hours]) => {
                    const isToday = new Date().toLocaleDateString('de-DE', { weekday: 'long' }) === day;
                    return (
                      <div key={day} className={`flex justify-between p-3 rounded-lg ${isToday ? 'bg-[#005787] text-white' : 'bg-gray-50'}`}>
                        <span className="font-medium">{day}:</span>
                        <span className={isToday ? 'text-white' : 'text-gray-600'}>{hours}</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Google Business Information */}
          {googleBusinessData && (
            <Card className="border border-gray-200 shadow-md bg-white">
              <CardHeader>
                <CardTitle className="flex items-center text-gray-900">
                  <Star className="mr-2 h-5 w-5 text-[#005787]" />
                  Google Business
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Rating Details */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Bewertungen</h4>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center">
                          <span className="text-2xl font-bold text-[#005787] mr-2">{googleBusinessData.rating}</span>
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star 
                                key={star} 
                                className={`h-5 w-5 ${
                                  star <= Math.floor(googleBusinessData.rating) 
                                    ? 'text-yellow-500 fill-current' 
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        <span className="text-gray-600">({googleBusinessData.reviews} Bewertungen)</span>
                      </div>
                      
                      {/* Rating Distribution */}
                      {googleBusinessData.reviews_per_score_5 && (
                        <div className="space-y-1">
                          {[5, 4, 3, 2, 1].map((stars) => {
                            const count = googleBusinessData[`reviews_per_score_${stars}`] || 0;
                            const percentage = googleBusinessData.reviews > 0 ? (count / googleBusinessData.reviews * 100) : 0;
                            return (
                              <div key={stars} className="flex items-center space-x-2 text-sm">
                                <span className="w-8">{stars}★</span>
                                <div className="flex-1 bg-gray-200 rounded-full h-2">
                                  <div 
                                    className="bg-yellow-500 h-2 rounded-full" 
                                    style={{ width: `${percentage}%` }}
                                  ></div>
                                </div>
                                <span className="w-8 text-gray-600">{count}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Business Features */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Ausstattung & Services</h4>
                    <div className="space-y-2">
                      {googleBusinessData.about?.Accessibility && Object.entries(googleBusinessData.about.Accessibility).map(([feature, available]) => (
                        available && (
                          <div key={feature} className="flex items-center space-x-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span className="text-gray-700 text-sm">{feature.replace(/-/g, ' ')}</span>
                          </div>
                        )
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Management Changes */}
          {managementChanges.length > 0 && (
            <Card className="border border-gray-200 shadow-md bg-white">
              <CardHeader>
                <CardTitle className="flex items-center text-gray-900">
                  <Users className="mr-2 h-5 w-5 text-[#005787]" />
                  Management-Änderungen
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {managementChanges.map((change, index) => (
                    <div key={index} className="p-4 border rounded-lg bg-gray-50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900">{change.description}</span>
                        <span className="text-sm text-gray-500">{change.event_date}</span>
                      </div>
                      {change.details?.register_id && (
                        <p className="text-sm text-gray-600">Register-ID: {change.details.register_id}</p>
                      )}
                      <p className="text-xs text-gray-500 mt-2">Quelle: {change.source}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Foundings */}
          {foundings.length > 0 && (
            <Card className="border border-gray-200 shadow-md bg-white">
              <CardHeader>
                <CardTitle className="flex items-center text-gray-900">
                  <Calendar className="mr-2 h-5 w-5 text-[#005787]" />
                  Gründungsinformationen
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {foundings.map((founding, index) => (
                    <div key={index} className="p-4 border rounded-lg bg-gray-50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900">{founding.description}</span>
                        <span className="text-sm text-gray-500">{founding.event_date}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">Quelle: {founding.source}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Data Sources */}
          <Card className="border border-gray-200 shadow-md bg-white">
            <CardHeader>
              <CardTitle className="flex items-center text-gray-900">
                <Database className="mr-2 h-5 w-5 text-[#005787]" />
                Datenquellen
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium">Letzte Aktualisierung:</span>
                  <span className="text-[#005787]">{new Date(item.updated_at).toLocaleDateString('de-DE')}</span>
                </div>
                
                {/* Relationship Sources */}
                <div className="space-y-2">
                  <span className="font-medium text-gray-700">Verfügbare Datenquellen:</span>
                  <div className="flex flex-wrap gap-2">
                    {item.relationships?.map((rel, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {rel.handle.replace(/_/g, ' ')}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div className="text-xs text-gray-500 text-center pt-4 border-t">
                  Integrierte Daten aus Google Maps, Northdata, AutoCrew und weiteren Quellen
                </div>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center space-x-4">
            <img src={auteonLogo} alt="auteon" className="h-6" />
            <span className="text-sm text-gray-500">
              © 2025 auteon. Alle Daten ohne Gewähr.
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default DetailPageIntegrated;

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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
  XCircle,
  CreditCard,
  Car,
  Wrench,
  Shield,
  Euro,
  Calendar
} from 'lucide-react';
import { getOpeningStatus, getStatusColor, getStatusIcon } from '../utils/openingHours';

const DetailPageNew = ({ data }) => {
  const { id } = useParams();
  const item = data?.find(workshop => workshop.id === id);

  if (!item) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Werkstatt nicht gefunden</h2>
            <p className="text-gray-600 mb-4">Die angeforderte Werkstatt konnte nicht gefunden werden.</p>
            <Link to="/">
              <Button className="bg-[#005787] hover:bg-[#004066]">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Zurück zur Übersicht
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Parse working hours safely
  let workingHours = null;
  try {
    if (item.working_hours_structured && typeof item.working_hours_structured === 'string') {
      workingHours = JSON.parse(item.working_hours_structured);
    }
  } catch (error) {
    console.error('Error parsing working hours:', error);
    workingHours = null;
  }

  // Extract data from relationships safely
  let northdataData = {};
  let gmapsData = {};
  let repareoData = {};

  try {
    const northdata = item.relationships?.find(r => r.handle === 'NORTHDATA');
    const gmaps = item.relationships?.find(r => r.handle === 'GMAPS_CRAWLER');
    const repareo = item.relationships?.find(r => r.handle === 'REPAREO');

    if (northdata?.source_data && typeof northdata.source_data === 'string') {
      northdataData = JSON.parse(northdata.source_data);
    }
    if (gmaps?.source_data && typeof gmaps.source_data === 'string') {
      gmapsData = JSON.parse(gmaps.source_data);
    }
    if (repareo?.source_data && typeof repareo.source_data === 'string') {
      repareoData = JSON.parse(repareo.source_data);
    }
  } catch (error) {
    console.error('Error parsing relationship data:', error);
    // Continue with empty objects if parsing fails
  }

  // Extract main concept/network
  const mainConcept = item.concepts_networks ? 
    item.concepts_networks.split(',')[0]?.trim() : null;

  // Helper function to safely render data
  const safeRender = (value, fallback = 'Nicht verfügbar') => {
    return value && value !== 'null' && value !== '' ? value : fallback;
  };

  // Format classification
  const formatClassification = (classification) => {
    if (!classification) return 'Autowerkstatt';
    // Extract main category after the code
    const parts = classification.split(' ');
    if (parts.length > 1) {
      return parts.slice(1).join(' ');
    }
    return classification;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <Link to="/">
              <Button variant="outline" className="mb-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Zurück zur Übersicht
              </Button>
            </Link>
          </div>
          
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {item.name}
              </h1>
              <div className="flex items-center space-x-4 mb-4">
                <Badge 
                  className={`${
                    item.operational_status === 'OPERATIONAL' 
                      ? 'bg-green-100 text-green-800 border-green-200' 
                      : 'bg-red-100 text-red-800 border-red-200'
                  }`}
                >
                  <CheckCircle className="mr-1 h-3 w-3" />
                  {item.operational_status === 'OPERATIONAL' ? 'Aktiv' : 'Inaktiv'}
                </Badge>
                {mainConcept && (
                  <Badge className="bg-[#005787] text-white">
                    {mainConcept}
                  </Badge>
                )}
              </div>
              <p className="text-lg text-gray-600">
                {formatClassification(item.primary_classification)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column - Primary Information */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Contact & Location */}
            <Card className="border border-gray-200 shadow-md bg-white">
              <CardHeader>
                <CardTitle className="flex items-center text-gray-900">
                  <MapPin className="mr-2 h-5 w-5 text-[#005787]" />
                  Kontakt & Standort
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Adresse</h4>
                      <p className="text-gray-600">
                        {item.street} {item.house_number}<br />
                        {item.zip_code} {item.city}
                      </p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-2"
                        onClick={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(item.street + ' ' + item.house_number + ', ' + item.zip_code + ' ' + item.city)}`, '_blank')}
                      >
                        <MapPin className="mr-1 h-3 w-3" />
                        Route planen
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    {item.contact_telephone && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Telefon</h4>
                        <Button 
                          variant="outline" 
                          className="w-full justify-start"
                          onClick={() => window.open(`tel:${item.contact_telephone}`, '_self')}
                        >
                          <Phone className="mr-2 h-4 w-4 text-[#005787]" />
                          {item.contact_telephone}
                        </Button>
                      </div>
                    )}
                    
                    {item.email_1 && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">E-Mail</h4>
                        <Button 
                          variant="outline" 
                          className="w-full justify-start"
                          onClick={() => window.open(`mailto:${item.email_1}`, '_self')}
                        >
                          <Mail className="mr-2 h-4 w-4 text-[#005787]" />
                          {item.email_1}
                        </Button>
                      </div>
                    )}
                    
                    {item.website_url && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Website</h4>
                        <Button 
                          variant="outline" 
                          className="w-full justify-start"
                          onClick={() => window.open(item.website_url, '_blank')}
                        >
                          <Globe className="mr-2 h-4 w-4 text-[#005787]" />
                          Website besuchen
                        </Button>
                      </div>
                    )}
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
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">{getStatusIcon(status.status)}</span>
                          <div>
                            <p className="font-semibold text-lg">{status.message}</p>
                            <p className="text-sm opacity-75">Aktueller Status</p>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                  
                  {/* Weekly Schedule */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {Object.entries(workingHours).map(([day, hours]) => {
                      const isToday = new Date().toLocaleDateString('de-DE', { weekday: 'long' }) === day;
                      return (
                        <div 
                          key={day} 
                          className={`flex justify-between items-center p-3 rounded-lg ${
                            isToday ? 'bg-[#005787] text-white' : 'bg-gray-50'
                          }`}
                        >
                          <span className="font-medium">{day}</span>
                          <span className={isToday ? 'text-white' : 'text-gray-600'}>
                            {hours}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Services & Equipment (from Google Maps) */}
            {gmapsData.about && (
              <Card className="border border-gray-200 shadow-md bg-white">
                <CardHeader>
                  <CardTitle className="flex items-center text-gray-900">
                    <Wrench className="mr-2 h-5 w-5 text-[#005787]" />
                    Services & Ausstattung
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {gmapsData.about.Angebote && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-3">Angebote</h4>
                        <div className="space-y-2">
                          {Object.entries(gmapsData.about.Angebote).map(([service, available]) => (
                            available && (
                              <div key={service} className="flex items-center space-x-2">
                                <CheckCircle className="h-4 w-4 text-green-500" />
                                <span className="text-gray-700">{service}</span>
                              </div>
                            )
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {gmapsData.about.Ausstattung && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-3">Ausstattung</h4>
                        <div className="space-y-2">
                          {Object.entries(gmapsData.about.Ausstattung).map(([feature, available]) => (
                            available && (
                              <div key={feature} className="flex items-center space-x-2">
                                <Shield className="h-4 w-4 text-blue-500" />
                                <span className="text-gray-700">{feature}</span>
                              </div>
                            )
                          ))}
                        </div>
                      </div>
                    )}
                    
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Secondary Information */}
          <div className="space-y-6">
            
            {/* Business Information */}
            <Card className="border border-gray-200 shadow-md bg-white">
              <CardHeader>
                <CardTitle className="flex items-center text-gray-900">
                  <Building className="mr-2 h-5 w-5 text-[#005787]" />
                  Geschäftsinformationen
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {(item.firstname_1 && item.lastname_1) && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Geschäftsführung</h4>
                    <div className="space-y-1">
                      <p className="text-gray-700">
                        {item.firstname_1} {item.lastname_1}
                      </p>
                      {(item.firstname_2 && item.lastname_2) && (
                        <p className="text-gray-700">
                          {item.firstname_2} {item.lastname_2}
                        </p>
                      )}
                    </div>
                  </div>
                )}
                
                {item.concepts_networks && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Netzwerke</h4>
                    <div className="flex flex-wrap gap-2">
                      {item.concepts_networks.split(',').slice(0, 3).map((concept, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {concept.trim()}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Company Data (from Northdata) */}
            {northdataData && Object.keys(northdataData).length > 0 && (
              <Card className="border border-gray-200 shadow-md bg-white">
                <CardHeader>
                  <CardTitle className="flex items-center text-gray-900">
                    <Euro className="mr-2 h-5 w-5 text-[#005787]" />
                    Unternehmensdaten
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {northdataData['Umsatz EUR'] && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Umsatz</span>
                      <span className="font-medium">{northdataData['Umsatz EUR']}</span>
                    </div>
                  )}
                  
                  {northdataData['Rechtsform'] && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Rechtsform</span>
                      <span className="font-medium">{northdataData['Rechtsform']}</span>
                    </div>
                  )}
                  
                  {northdataData['Mitarbeiterzahl'] && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Mitarbeiter</span>
                      <span className="font-medium">{northdataData['Mitarbeiterzahl']}</span>
                    </div>
                  )}
                  
                  {northdataData['Eigenkapital EUR'] && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Eigenkapital</span>
                      <span className="font-medium">{northdataData['Eigenkapital EUR']}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Data Source */}
            <Card className="border border-gray-200 shadow-md bg-white">
              <CardHeader>
                <CardTitle className="flex items-center text-gray-900">
                  <Calendar className="mr-2 h-5 w-5 text-[#005787]" />
                  Datenquelle
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Letzte Aktualisierung</span>
                  <span>{new Date(item.updated_at).toLocaleDateString('de-DE')}</span>
                </div>
                {item.google_place_id && (
                  <div className="flex justify-between">
                    <span>Google Verifiziert</span>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailPageNew;

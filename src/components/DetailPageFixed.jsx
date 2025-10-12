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
  ExternalLink,
  Calendar,
  Database,
  Settings
} from 'lucide-react';
import auteonLogo from '../assets/auteon-logo.jpg';
import { getOpeningStatus, getStatusColor, getStatusIcon } from '../utils/openingHours';

const DetailPageFixed = ({ data }) => {
  const { id } = useParams();
  const [managementChanges, setManagementChanges] = useState([]);
  const [loading, setLoading] = useState(true);

  const item = data?.find(workshop => workshop.id === id);

  useEffect(() => {
    const loadManagementChanges = async () => {
      if (!item) return;

      // Extract Register-ID from Northdata
      let registerID = null;
      try {
        const northdata = item.relationships?.find(r => r.handle === 'NORTHDATA');
        if (northdata?.source_data) {
          const northdataData = JSON.parse(northdata.source_data);
          registerID = northdataData['Register-ID'];
        }
      } catch (error) {
        console.error('Error extracting Register-ID:', error);
      }

      if (registerID) {
        console.log('Looking for Register-ID:', registerID);

        try {
          const response = await fetch('/management-changes.json');
          if (response.ok) {
            const changes = await response.json();
            // Find changes for this company by Register-ID matching
            const companyChanges = changes.filter(change => 
              change['Register-ID'] === registerID
            );
            setManagementChanges(companyChanges.slice(0, 3)); // Limit to 3 most recent
            console.log(`Found ${companyChanges.length} management changes for ${registerID}`);
          }
        } catch (error) {
          console.error('Error loading management changes:', error);
        }
      }

      setLoading(false);
    };

    loadManagementChanges();
  }, [item]);

  if (!data) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p>Daten werden geladen...</p>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Werkstatt nicht gefunden</h1>
          <p className="text-muted-foreground mb-4">
            Die angeforderte Werkstatt konnte nicht gefunden werden.
          </p>
          <Link to="/">
            <Button>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Zurück zur Übersicht
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Helper function to safely render values
  const safeRender = (value) => {
    if (value === null || value === undefined || value === '') return 'Nicht verfügbar';
    return String(value);
  };

  // Parse working hours if available
  const parseWorkingHours = (hoursText) => {
    if (!hoursText) return null;
    try {
      const hours = JSON.parse(hoursText);
      return hours;
    } catch {
      return null;
    }
  };

  const workingHours = parseWorkingHours(item.working_hours_structured);

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link to="/">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Zurück zur Übersicht
          </Button>
        </Link>
      </div>

      {/* Main Info */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl mb-2">{item.name}</CardTitle>
              <div className="flex items-center text-muted-foreground mb-2">
                <MapPin className="mr-2 h-4 w-4" />
                {item.street} {item.house_number}, {item.zip_code} {item.city}
              </div>
            </div>
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              <CheckCircle className="mr-1 h-3 w-3" />
              {item.operational_status || 'OPERATIONAL'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Comprehensive Contact Information */}
            <div className="space-y-4">
              <h3 className="font-semibold flex items-center text-[#005787]">
                <Phone className="mr-2 h-5 w-5" />
                Kontakt & Ansprechpartner
              </h3>
              
              {/* All Phone Numbers */}
              {(() => {
                const phoneNumbers = new Set();
                if (item.contact_telephone) phoneNumbers.add(item.contact_telephone);
                if (item.phone_1) phoneNumbers.add(item.phone_1);
                if (item.phone_2) phoneNumbers.add(item.phone_2);
                if (item.phone_3) phoneNumbers.add(item.phone_3);
                
                // Extract phone numbers from relationships
                try {
                  const gmaps = item.relationships?.find(r => r.handle === 'GMAPS_CRAWLER');
                  if (gmaps?.source_data) {
                    const gmapsData = JSON.parse(gmaps.source_data);
                    if (gmapsData.phone) phoneNumbers.add(gmapsData.phone);
                  }
                } catch (error) {}
                
                const uniquePhones = Array.from(phoneNumbers).filter(Boolean);
                
                return uniquePhones.length > 0 && (
                  <div className="space-y-2">
                    <span className="font-medium text-gray-700">Telefonnummern:</span>
                    {uniquePhones.map((phone, index) => (
                      <div key={index} className="flex items-center">
                        <Phone className="mr-2 h-4 w-4 text-[#005787]" />
                        <a 
                          href={`tel:${phone}`} 
                          className="text-[#005787] hover:underline font-medium"
                        >
                          {phone}
                        </a>
                      </div>
                    ))}
                  </div>
                );
              })()}
              
              {/* All Email Addresses */}
              {(() => {
                const emailAddresses = new Set();
                if (item.email_1) emailAddresses.add(item.email_1);
                if (item.email_2) emailAddresses.add(item.email_2);
                if (item.email_3) emailAddresses.add(item.email_3);
                
                const uniqueEmails = Array.from(emailAddresses).filter(Boolean);
                
                return uniqueEmails.length > 0 && (
                  <div className="space-y-2">
                    <span className="font-medium text-gray-700">E-Mail-Adressen:</span>
                    {uniqueEmails.map((email, index) => (
                      <div key={index} className="flex items-center">
                        <Mail className="mr-2 h-4 w-4 text-[#005787]" />
                        <a 
                          href={`mailto:${email}`} 
                          className="text-[#005787] hover:underline font-medium"
                        >
                          {email}
                        </a>
                      </div>
                    ))}
                  </div>
                );
              })()}
              
              {/* All Websites */}
              {(() => {
                const websites = new Set();
                if (item.website_url) websites.add(item.website_url);
                if (item.website_1) websites.add(item.website_1);
                if (item.website_2) websites.add(item.website_2);
                if (item.website_3) websites.add(item.website_3);
                
                const uniqueWebsites = Array.from(websites).filter(Boolean);
                
                return uniqueWebsites.length > 0 && (
                  <div className="space-y-2">
                    <span className="font-medium text-gray-700">Webseiten:</span>
                    {uniqueWebsites.map((website, index) => (
                      <div key={index} className="flex items-center">
                        <Globe className="mr-2 h-4 w-4 text-[#005787]" />
                        <a 
                          href={website} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-[#005787] hover:underline font-medium"
                        >
                          {website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                        </a>
                      </div>
                    ))}
                  </div>
                );
              })()}
              
              {/* All Contact Persons */}
              {(() => {
                const contacts = [];
                if (item.firstname_1 && item.lastname_1) {
                  contacts.push(`${item.firstname_1} ${item.lastname_1}`);
                }
                if (item.firstname_2 && item.lastname_2) {
                  contacts.push(`${item.firstname_2} ${item.lastname_2}`);
                }
                if (item.firstname_3 && item.lastname_3) {
                  contacts.push(`${item.firstname_3} ${item.lastname_3}`);
                }
                
                return contacts.length > 0 && (
                  <div className="space-y-2">
                    <span className="font-medium text-gray-700">Ansprechpartner:</span>
                    {contacts.map((contact, index) => (
                      <div key={index} className="flex items-center">
                        <Users className="mr-2 h-4 w-4 text-[#005787]" />
                        <span className="text-gray-700">{contact}</span>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>

            {/* Business Information */}
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center">
                <Building className="mr-2 h-4 w-4" />
                Unternehmen
              </h3>
              <div>
                <span className="font-medium">Klassifikation:</span>
                <p className="text-sm text-muted-foreground">{safeRender(item.primary_classification)}</p>
              </div>
              
              {/* Extract and display Northdata information */}
              {(() => {
                try {
                  const northdata = item.relationships?.find(r => r.handle === 'NORTHDATA');
                  if (northdata?.source_data) {
                    const northdataData = JSON.parse(northdata.source_data);
                    return (
                      <div className="space-y-2">
                        {northdataData['Rechtsform'] && (
                          <div>
                            <span className="font-medium">Rechtsform:</span>
                            <p className="text-sm text-muted-foreground">{northdataData['Rechtsform']}</p>
                          </div>
                        )}
                        {northdataData['Mitarbeiterzahl'] && (
                          <div>
                            <span className="font-medium">Mitarbeiter:</span>
                            <p className="text-sm text-muted-foreground">{northdataData['Mitarbeiterzahl']}</p>
                          </div>
                        )}
                        {northdataData['Umsatz EUR'] && (
                          <div>
                            <span className="font-medium">Umsatz:</span>
                            <p className="text-sm text-muted-foreground">{northdataData['Umsatz EUR']} EUR</p>
                          </div>
                        )}
                        {northdataData['Register-ID'] && (
                          <div>
                            <span className="font-medium">Register-ID:</span>
                            <p className="text-sm text-muted-foreground">{northdataData['Register-ID']}</p>
                          </div>
                        )}
                      </div>
                    );
                  }
                } catch (error) {
                  console.error('Error parsing Northdata:', error);
                }
                return null;
              })()}
              
              {/* All Concepts & Networks */}
              {(() => {
                const allConcepts = new Set();
                
                // From main concepts_networks field
                if (item.concepts_networks) {
                  const concepts = typeof item.concepts_networks === 'string' 
                    ? item.concepts_networks.split(',') 
                    : item.concepts_networks;
                  concepts.forEach(concept => {
                    if (concept && concept.trim()) {
                      allConcepts.add(concept.trim());
                    }
                  });
                }
                
                // From individual concept fields
                if (item.concept_1) allConcepts.add(item.concept_1.trim());
                if (item.concept_2) allConcepts.add(item.concept_2.trim());
                if (item.concept_3) allConcepts.add(item.concept_3.trim());
                
                // From network fields
                if (item.network_1) allConcepts.add(item.network_1.trim());
                if (item.network_2) allConcepts.add(item.network_2.trim());
                if (item.network_3) allConcepts.add(item.network_3.trim());
                
                const uniqueConcepts = Array.from(allConcepts).filter(Boolean);
                
                return uniqueConcepts.length > 0 && (
                  <div className="space-y-3">
                    <span className="font-medium text-gray-700">Konzepte & Netzwerke:</span>
                    <div className="flex flex-wrap gap-2">
                      {uniqueConcepts.map((concept, index) => (
                        <Badge 
                          key={index} 
                          className="bg-[#005787]/10 text-[#005787] border-[#005787]/20 hover:bg-[#005787]/20 transition-colors"
                        >
                          {concept}
                        </Badge>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Working Hours */}
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
                <div className={`mb-4 p-3 rounded-lg border ${getStatusColor(status.status)}`}>
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{getStatusIcon(status.status)}</span>
                    <span className="font-medium">{status.message}</span>
                  </div>
                </div>
              );
            })()}
            
            {/* Opening Hours Table */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {Object.entries(workingHours).map(([day, hours]) => {
                const isToday = new Date().toLocaleDateString('de-DE', { weekday: 'long' }) === day;
                return (
                  <div key={day} className={`flex justify-between p-2 rounded ${isToday ? 'bg-[#005787] text-white' : ''}`}>
                    <span className="font-medium">{day}:</span>
                    <span className={isToday ? 'text-white' : 'text-gray-600'}>{hours}</span>
                  </div>
                );
              })}
            </div>
            
            {/* Popular Times Graph from Google Maps */}
            {(() => {
              try {
                const gmaps = item.relationships?.find(r => r.handle === 'GMAPS_CRAWLER');
                if (gmaps?.source_data) {
                  const gmapsData = JSON.parse(gmaps.source_data);
                  if (gmapsData.popular_times && gmapsData.popular_times.length > 0) {
                    const days = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];
                    const currentDay = new Date().getDay();
                    const adjustedCurrentDay = currentDay === 0 ? 6 : currentDay - 1; // Convert Sunday=0 to Sunday=6
                    
                    return (
                      <div className="mt-6">
                        <h4 className="font-medium text-gray-900 mb-4 flex items-center">
                          <div className="w-6 h-6 bg-[#005787] rounded-full flex items-center justify-center mr-2">
                            <span className="text-white text-xs">📊</span>
                          </div>
                          Auslastung (Google Daten)
                        </h4>
                        <div className="space-y-4">
                          {gmapsData.popular_times.map((dayData, dayIndex) => {
                            const isCurrentDay = dayIndex === adjustedCurrentDay;
                            return (
                              <div key={dayIndex} className={`p-3 rounded-lg ${isCurrentDay ? 'bg-[#005787]/5 border border-[#005787]/20' : 'bg-gray-50'}`}>
                                <div className="flex items-center justify-between mb-2">
                                  <span className={`font-medium ${isCurrentDay ? 'text-[#005787]' : 'text-gray-700'}`}>
                                    {days[dayIndex]}
                                  </span>
                                  {isCurrentDay && (
                                    <Badge className="bg-[#005787] text-white text-xs">Heute</Badge>
                                  )}
                                </div>
                                <div className="flex items-end space-x-1 h-12">
                                  {dayData.data ? dayData.data.map((value, hourIndex) => {
                                    const height = Math.max(2, (value / 100) * 48); // Min height 2px, max 48px
                                    const currentHour = new Date().getHours();
                                    const isCurrentHour = isCurrentDay && hourIndex === currentHour;
                                    
                                    return (
                                      <div key={hourIndex} className="flex-1 flex flex-col items-center">
                                        <div 
                                          className={`w-full rounded-sm ${
                                            isCurrentHour 
                                              ? 'bg-[#005787]' 
                                              : isCurrentDay 
                                                ? 'bg-[#005787]/60' 
                                                : 'bg-gray-400'
                                          }`}
                                          style={{ height: `${height}px` }}
                                          title={`${hourIndex}:00 - ${value}% Auslastung`}
                                        />
                                        {hourIndex % 6 === 0 && (
                                          <span className="text-xs text-gray-500 mt-1">{hourIndex}</span>
                                        )}
                                      </div>
                                    );
                                  }) : (
                                    <span className="text-sm text-gray-500">Keine Daten verfügbar</span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        <div className="mt-3 text-xs text-gray-500 text-center">
                          Auslastungsdaten basieren auf Google Maps Besucherstatistiken
                        </div>
                      </div>
                    );
                  }
                }
              } catch (error) {
                console.error('Error parsing popular times:', error);
              }
              return null;
            })()}
          </CardContent>
        </Card>
      )}

      {/* Google Business Information */}
      {(() => {
        try {
          const gmaps = item.relationships?.find(r => r.handle === 'GMAPS_CRAWLER');
          if (gmaps?.source_data) {
            const gmapsData = JSON.parse(gmaps.source_data);
            return (
              <Card className="border border-gray-200 shadow-md bg-white">
                <CardHeader>
                  <CardTitle className="flex items-center text-gray-900">
                    <div className="w-8 h-8 bg-[#005787] rounded-lg flex items-center justify-center mr-3">
                      <Settings className="h-4 w-4 text-white" />
                    </div>
                    Google Business Profil
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Google Rating */}
                    {(gmapsData.rating || gmapsData.reviews_count) && (
                      <div className="bg-gradient-to-r from-[#005787]/5 to-[#005787]/10 p-4 rounded-lg border border-[#005787]/20">
                        <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                          <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center mr-2">
                            <span className="text-white text-xs">★</span>
                          </div>
                          Google Bewertungen
                        </h4>
                        <div className="flex items-center space-x-4">
                          {gmapsData.rating && (
                            <div className="flex items-center">
                              <span className="text-2xl font-bold text-[#005787] mr-2">{gmapsData.rating}</span>
                              <div className="flex">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <span 
                                    key={star} 
                                    className={`text-lg ${
                                      star <= Math.floor(gmapsData.rating) 
                                        ? 'text-yellow-500' 
                                        : star <= gmapsData.rating 
                                          ? 'text-yellow-300' 
                                          : 'text-gray-300'
                                    }`}
                                  >
                                    ★
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          {gmapsData.reviews_count && (
                            <div className="text-gray-600">
                              <span className="font-medium">{gmapsData.reviews_count}</span> Bewertungen
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Services & Equipment Grid */}
                    {gmapsData.about && (gmapsData.about.Angebote || gmapsData.about.Ausstattung || gmapsData.about.Zahlungen) && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-4">Services & Ausstattung</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {gmapsData.about.Angebote && Object.keys(gmapsData.about.Angebote).length > 0 && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-3">Angebote</h4>
                          <div className="space-y-2">
                            {Object.entries(gmapsData.about.Angebote).map(([service, available]) => (
                              available && (
                                <div key={service} className="flex items-center space-x-2">
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                  <span className="text-gray-700 text-sm">{service}</span>
                                </div>
                              )
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {gmapsData.about.Ausstattung && Object.keys(gmapsData.about.Ausstattung).length > 0 && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-3">Ausstattung</h4>
                          <div className="space-y-2">
                            {Object.entries(gmapsData.about.Ausstattung).map(([feature, available]) => (
                              available && (
                                <div key={feature} className="flex items-center space-x-2">
                                  <CheckCircle className="h-4 w-4 text-blue-500" />
                                  <span className="text-gray-700 text-sm">{feature}</span>
                                </div>
                              )
                            ))}
                          </div>
                        </div>
                      )}
                      
                    
                    {/* Additional Google Business Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Business Status & Verification */}
                      <div>
                        <h4 className="font-medium text-gray-900 mb-3">Geschäftsstatus</h4>
                        <div className="space-y-2">
                          {gmapsData.business_status && (
                            <div className="flex items-center space-x-2">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              <span className="text-gray-700 text-sm">Status: {gmapsData.business_status}</span>
                            </div>
                          )}
                          {gmapsData.permanently_closed === false && (
                            <div className="flex items-center space-x-2">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              <span className="text-gray-700 text-sm">Geöffnet</span>
                            </div>
                          )}
                          {gmapsData.place_id && (
                            <div className="flex items-center space-x-2">
                              <CheckCircle className="h-4 w-4 text-blue-500" />
                              <span className="text-gray-700 text-sm">Google verifiziert</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Additional Details */}
                      <div>
                        <h4 className="font-medium text-gray-900 mb-3">Weitere Details</h4>
                        <div className="space-y-2">
                          {gmapsData.plus_code && (
                            <div className="flex items-center space-x-2">
                              <MapPin className="h-4 w-4 text-[#005787]" />
                              <span className="text-gray-700 text-sm">Plus Code: {gmapsData.plus_code}</span>
                            </div>
                          )}
                          {gmapsData.price_level && (
                            <div className="flex items-center space-x-2">
                              <span className="text-[#005787]">€</span>
                              <span className="text-gray-700 text-sm">
                                Preisklasse: {'€'.repeat(gmapsData.price_level)} ({gmapsData.price_level}/4)
                              </span>
                            </div>
                          )}
                          {gmapsData.wheelchair_accessible_entrance !== undefined && (
                            <div className="flex items-center space-x-2">
                              <CheckCircle className={`h-4 w-4 ${gmapsData.wheelchair_accessible_entrance ? 'text-green-500' : 'text-red-500'}`} />
                              <span className="text-gray-700 text-sm">
                                Rollstuhlgerecht: {gmapsData.wheelchair_accessible_entrance ? 'Ja' : 'Nein'}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
              </Card>
            );
          }
        } catch (error) {
          console.error('Error parsing Google Maps data:', error);
        }
        return null;
      })()}

      {/* REPAREO Specializations */}
      {(() => {
        try {
          const repareo = item.relationships?.find(r => r.handle === 'REPAREO');
          if (repareo?.source_data) {
            const repareoData = JSON.parse(repareo.source_data);
            if (repareoData['Komfort Services'] || repareoData['Supports BEV'] || repareoData['Supports Commercial Vehicles']) {
              return (
                <Card className="border border-gray-200 shadow-md bg-white">
                  <CardHeader>
                    <CardTitle className="flex items-center text-gray-900">
                      <Users className="mr-2 h-5 w-5 text-[#005787]" />
                      Spezialisierungen
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {repareoData['Komfort Services'] && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-3">Komfort Services</h4>
                          <div className="space-y-2">
                            {repareoData['Komfort Services'].split(',').map((service, index) => (
                              <div key={index} className="flex items-center space-x-2">
                                <CheckCircle className="h-4 w-4 text-[#005787]" />
                                <span className="text-gray-700 text-sm">{service.trim()}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <div>
                        <h4 className="font-medium text-gray-900 mb-3">Fahrzeugtypen</h4>
                        <div className="space-y-2">
                          {repareoData['Supports BEV'] === '1' && (
                            <div className="flex items-center space-x-2">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              <span className="text-gray-700 text-sm">Elektrofahrzeuge (BEV)</span>
                            </div>
                          )}
                          {repareoData['Supports Commercial Vehicles'] && (
                            <div className="flex items-center space-x-2">
                              <CheckCircle className="h-4 w-4 text-blue-500" />
                              <span className="text-gray-700 text-sm">Nutzfahrzeuge</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            }
          }
        } catch (error) {
          console.error('Error parsing REPAREO data:', error);
        }
        return null;
      })()}

      {/* Comprehensive Registry Data (Handelsregister) */}
      {(() => {
        try {
          const northdata = item.relationships?.find(r => r.handle === 'NORTHDATA');
          if (northdata?.source_data) {
            const northdataData = JSON.parse(northdata.source_data);
            
            // Check if we have significant registry data
            const hasRegistryData = northdataData['Register-ID'] || northdataData['Rechtsform'] || 
                                   northdataData['Stammkapital EUR'] || northdataData['Gründungsdatum'] ||
                                   northdataData['Umsatz EUR'] || northdataData['Mitarbeiterzahl'];
            
            if (hasRegistryData) {
              return (
                <Card className="border border-gray-200 shadow-md bg-white">
                  <CardHeader>
                    <CardTitle className="flex items-center text-gray-900">
                      <div className="w-8 h-8 bg-[#005787] rounded-lg flex items-center justify-center mr-3">
                        <Database className="h-4 w-4 text-white" />
                      </div>
                      Handelsregister & Unternehmensdaten
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Basic Registry Information */}
                      <div>
                        <h4 className="font-medium text-gray-900 mb-4 flex items-center">
                          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center mr-2">
                            <span className="text-white text-xs">📋</span>
                          </div>
                          Grunddaten
                        </h4>
                        <div className="space-y-3">
                          {northdataData['Register-ID'] && (
                            <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                              <span className="font-medium text-gray-700">Register-ID:</span>
                              <span className="text-[#005787] font-mono">{northdataData['Register-ID']}</span>
                            </div>
                          )}
                          {northdataData['Rechtsform'] && (
                            <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                              <span className="font-medium text-gray-700">Rechtsform:</span>
                              <span className="text-gray-900">{northdataData['Rechtsform']}</span>
                            </div>
                          )}
                          {northdataData['Gründungsdatum'] && (
                            <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                              <span className="font-medium text-gray-700">Gründung:</span>
                              <span className="text-gray-900">{northdataData['Gründungsdatum']}</span>
                            </div>
                          )}
                          {northdataData['Stammkapital EUR'] && (
                            <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                              <span className="font-medium text-gray-700">Stammkapital:</span>
                              <span className="text-gray-900">{northdataData['Stammkapital EUR']} EUR</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Financial & Business Data */}
                      <div>
                        <h4 className="font-medium text-gray-900 mb-4 flex items-center">
                          <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mr-2">
                            <span className="text-white text-xs">💰</span>
                          </div>
                          Geschäftsdaten
                        </h4>
                        <div className="space-y-3">
                          {northdataData['Umsatz EUR'] && (
                            <div className="flex justify-between items-center p-2 bg-green-50 rounded">
                              <span className="font-medium text-gray-700">Umsatz:</span>
                              <span className="text-green-700 font-semibold">
                                {parseInt(northdataData['Umsatz EUR']).toLocaleString('de-DE')} EUR
                              </span>
                            </div>
                          )}
                          {northdataData['Mitarbeiterzahl'] && (
                            <div className="flex justify-between items-center p-2 bg-blue-50 rounded">
                              <span className="font-medium text-gray-700">Mitarbeiter:</span>
                              <span className="text-blue-700 font-semibold">{northdataData['Mitarbeiterzahl']}</span>
                            </div>
                          )}
                          {northdataData['Eigenkapital EUR'] && (
                            <div className="flex justify-between items-center p-2 bg-purple-50 rounded">
                              <span className="font-medium text-gray-700">Eigenkapital:</span>
                              <span className="text-purple-700 font-semibold">
                                {parseInt(northdataData['Eigenkapital EUR']).toLocaleString('de-DE')} EUR
                              </span>
                            </div>
                          )}
                          {northdataData['Bilanzsumme EUR'] && (
                            <div className="flex justify-between items-center p-2 bg-orange-50 rounded">
                              <span className="font-medium text-gray-700">Bilanzsumme:</span>
                              <span className="text-orange-700 font-semibold">
                                {parseInt(northdataData['Bilanzsumme EUR']).toLocaleString('de-DE')} EUR
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Additional Registry Details */}
                    {(northdataData['Branche (WZ)'] || northdataData['Sitz'] || northdataData['Zweigniederlassung']) && (
                      <div className="mt-6 pt-6 border-t border-gray-200">
                        <h4 className="font-medium text-gray-900 mb-4">Weitere Angaben</h4>
                        <div className="grid grid-cols-1 gap-3">
                          {northdataData['Branche (WZ)'] && (
                            <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded">
                              <Building className="h-5 w-5 text-[#005787] mt-0.5" />
                              <div>
                                <span className="font-medium text-gray-700">Branche (WZ):</span>
                                <p className="text-gray-900 text-sm mt-1">{northdataData['Branche (WZ)']}</p>
                              </div>
                            </div>
                          )}
                          {northdataData['Sitz'] && (
                            <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded">
                              <MapPin className="h-5 w-5 text-[#005787] mt-0.5" />
                              <div>
                                <span className="font-medium text-gray-700">Sitz:</span>
                                <p className="text-gray-900 text-sm mt-1">{northdataData['Sitz']}</p>
                              </div>
                            </div>
                          )}
                          {northdataData['Zweigniederlassung'] && (
                            <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded">
                              <Building className="h-5 w-5 text-[#005787] mt-0.5" />
                              <div>
                                <span className="font-medium text-gray-700">Zweigniederlassung:</span>
                                <p className="text-gray-900 text-sm mt-1">{northdataData['Zweigniederlassung']}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Data Source */}
                    <div className="mt-6 pt-4 border-t border-gray-200">
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>Datenquelle: Northdata</span>
                        {northdataData['Letztes Update'] && (
                          <span>Stand: {northdataData['Letztes Update']}</span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            }
          }
        } catch (error) {
          console.error('Error parsing Northdata registry data:', error);
        }
        return null;
      })()}

      {/* Management Changes */}
      {managementChanges.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="mr-2 h-5 w-5" />
              Management-Änderungen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {managementChanges.map((change, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                      <Calendar className="mr-1 h-3 w-3" />
                      {change["Managementwechsel Datum"]}
                    </Badge>
                  </div>
                  <p className="text-sm">{change.Managementwechsel}</p>
                  {change["North Data URL"] && (
                    <div className="mt-2">
                      <a 
                        href={change["North Data URL"]} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline text-sm"
                      >
                        <ExternalLink className="inline mr-1 h-3 w-3" />
                        Weitere Details
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Data Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Database className="mr-2 h-5 w-5" />
            Datenquelle
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p><span className="font-medium">Letzte Aktualisierung:</span> {item.updated_at ? new Date(item.updated_at).toLocaleDateString('de-DE') : 'Nicht verfügbar'}</p>
            <p><span className="font-medium">Google Place ID:</span> {safeRender(item.google_place_id)}</p>
            {item.google_business_cid && (
              <p><span className="font-medium">Google Business CID:</span> {item.google_business_cid}</p>
            )}
          </div>
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

export default DetailPageFixed;

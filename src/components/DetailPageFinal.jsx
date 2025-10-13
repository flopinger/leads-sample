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
  Settings
} from 'lucide-react';
import auteonLogo from '../assets/auteon-logo.jpg';
import { getOpeningStatus, getStatusColor, getStatusIcon } from '../utils/openingHours';

const DetailPageFinal = ({ data }) => {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [managementChanges, setManagementChanges] = useState([]);

  useEffect(() => {
    if (data && id) {
      const foundItem = data.find(workshop => workshop.id === id);
      setItem(foundItem);
      
      // Load management changes with Register-ID matching
      if (foundItem && foundItem['Register-ID']) {
        fetch('/management-changes.json')
          .then(response => response.json())
          .then(managementData => {
            const matchingChanges = managementData.filter(change => 
              change['Register-ID'] === foundItem['Register-ID']
            );
            console.log('Register-ID found:', foundItem['Register-ID']);
            console.log('Matching management changes:', matchingChanges.length);
            setManagementChanges(matchingChanges);
          })
          .catch(error => console.error('Error loading management changes:', error));
      }
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
      if (item.working_hours && typeof item.working_hours === 'string') {
        return JSON.parse(item.working_hours);
      }
    } catch (error) {
      console.error('Error parsing working hours:', error);
    }
    return null;
  })();

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
                  <div className="flex items-center space-x-2">
                    <Badge className="bg-green-100 text-green-800 border-green-200">
                      OPERATIONAL
                    </Badge>
                    {item.concept_1 && (
                      <Badge className="bg-[#005787]/10 text-[#005787] border-[#005787]/20">
                        {item.concept_1}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Register-ID</p>
                  <p className="font-mono text-[#005787]">{safeRender(item['Register-ID'])}</p>
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
                        <p className="text-gray-900">{safeRender(item.postal_code)} {safeRender(item.city)}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Phone Numbers */}
                  {(() => {
                    const phoneNumbers = new Set();
                    if (item.contact_telephone) phoneNumbers.add(item.contact_telephone);
                    if (item.phone_1) phoneNumbers.add(item.phone_1);
                    if (item.phone_2) phoneNumbers.add(item.phone_2);
                    if (item.phone_3) phoneNumbers.add(item.phone_3);
                    
                    const uniquePhones = Array.from(phoneNumbers).filter(Boolean);
                    
                    return uniquePhones.length > 0 && (
                      <div className="space-y-2">
                        <span className="font-medium text-gray-700">Telefonnummern:</span>
                        {uniquePhones.map((phone, index) => (
                          <div key={index} className="flex items-center">
                            <Phone className="mr-2 h-4 w-4 text-[#005787]" />
                            <a href={`tel:${phone}`} className="text-[#005787] hover:underline font-medium">
                              {phone}
                            </a>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                  
                  {/* Email Addresses */}
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
                            <a href={`mailto:${email}`} className="text-[#005787] hover:underline font-medium">
                              {email}
                            </a>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                  
                  {/* Websites */}
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
                            <a href={website} target="_blank" rel="noopener noreferrer" className="text-[#005787] hover:underline font-medium">
                              {website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                            </a>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                  
                  {/* Contact Persons */}
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
                <div className="space-y-6">
                  <h3 className="font-semibold flex items-center text-[#005787] text-lg">
                    <Building className="mr-2 h-5 w-5" />
                    Unternehmensinformationen
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <span className="font-medium text-gray-700">Klassifikation:</span>
                      <p className="text-gray-900 mt-1">{safeRender(item.primary_classification)}</p>
                    </div>
                    
                    {/* Concepts & Networks */}
                    {(() => {
                      const allConcepts = new Set();
                      
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
                      
                      if (item.concept_1) allConcepts.add(item.concept_1.trim());
                      if (item.concept_2) allConcepts.add(item.concept_2.trim());
                      if (item.concept_3) allConcepts.add(item.concept_3.trim());
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
                  {Object.entries(workingHours)
                    .sort((a,b) => {
                      const order = ['Montag','Dienstag','Mittwoch','Donnerstag','Freitag','Samstag','Sonntag'];
                      const ia = order.indexOf(a[0]);
                      const ib = order.indexOf(b[0]);
                      return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
                    })
                    .map(([day, hours]) => {
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
                        <span className="font-medium text-gray-900">{change['Firma']}</span>
                        <span className="text-sm text-gray-500">{change['Datum']}</span>
                      </div>
                      <p className="text-gray-700">{change['Management-Wechsel']}</p>
                      {change['Branche'] && (
                        <p className="text-sm text-gray-500 mt-2">Branche: {change['Branche']}</p>
                      )}
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
                  <span className="text-[#005787]">10.10.2025</span>
                </div>
                {item.google_place_id && (
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium">Google Place ID:</span>
                    <span className="font-mono text-sm text-gray-600">{item.google_place_id}</span>
                  </div>
                )}
                <div className="text-xs text-gray-500 text-center pt-4 border-t">
                  Daten aus Google Maps, Northdata, REPAREO und weiteren Quellen
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

export default DetailPageFinal;

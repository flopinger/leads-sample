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
  Star,
  ExternalLink,
  Calendar,
  Building,
  Users,
  CheckCircle,
  AlertTriangle,
  Navigation,
  Database,
  Verified
} from 'lucide-react';
// import MapComponent from './MapComponent';
import auteonLogo from '../assets/auteon-logo.jpg';

const DetailPage = ({ data }) => {
  const { id } = useParams();
  const [companyChanges, setCompanyChanges] = useState([]);
  const [loading, setLoading] = useState(true);

  const item = data.find(workshop => workshop.id === id);

  useEffect(() => {
    const loadCompanyChanges = async () => {
      try {
        const response = await fetch('/management-changes.json');
        if (response.ok) {
          const changes = await response.json();
          const filteredChanges = changes.filter(change => 
            change.organization_id === id
          );
          setCompanyChanges(filteredChanges);
        }
      } catch (error) {
        console.error('Error loading company changes:', error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadCompanyChanges();
    }
  }, [id]);

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

  // Safe render function
  const safeRender = (value) => {
    if (value === null || value === undefined) return 'Nicht verfügbar';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  // Parse opening hours
  const parseOpeningHours = (hoursString) => {
    if (!hoursString) return null;
    
    try {
      const days = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];
      const parts = hoursString.split('|');
      const hours = {};
      
      parts.forEach((part, index) => {
        if (index < days.length) {
          const [day, time] = part.split(':');
          hours[days[index]] = time || 'Geschlossen';
        }
      });
      
      return hours;
    } catch (error) {
      return null;
    }
  };

  // Get current status
  const getCurrentStatus = (hours) => {
    if (!hours) return { status: 'unknown', text: 'Unbekannt', color: 'gray' };
    
    const now = new Date();
    const currentDay = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'][now.getDay()];
    const currentTime = now.getHours() * 100 + now.getMinutes();
    
    const todayHours = hours[currentDay];
    if (!todayHours || todayHours === 'Geschlossen') {
      return { status: 'closed', text: 'Geschlossen', color: 'red' };
    }
    
    try {
      const [open, close] = todayHours.split('-');
      const [openHour, openMin] = open.split(':').map(Number);
      const [closeHour, closeMin] = close.split(':').map(Number);
      
      const openTime = openHour * 100 + openMin;
      const closeTime = closeHour * 100 + closeMin;
      
      if (currentTime >= openTime && currentTime <= closeTime) {
        if (closeTime - currentTime <= 100) {
          return { status: 'closing', text: 'Schließt bald', color: 'orange' };
        }
        return { status: 'open', text: 'Geöffnet', color: 'green' };
      }
      
      return { status: 'closed', text: 'Geschlossen', color: 'red' };
    } catch (error) {
      return { status: 'unknown', text: 'Unbekannt', color: 'gray' };
    }
  };

  // Parse Google Business data
  const parseGoogleBusiness = (relationships) => {
    const gmapsData = relationships?.find(rel => rel.handle === 'GMAPS_CRAWLER');
    if (!gmapsData?.source_data) return null;
    
    try {
      return typeof gmapsData.source_data === 'string' 
        ? JSON.parse(gmapsData.source_data) 
        : gmapsData.source_data;
    } catch (error) {
      return null;
    }
  };

  // Parse REPAREO data
  const parseRepareoData = (relationships) => {
    const repareoData = relationships?.find(rel => rel.handle === 'REPAREO');
    if (!repareoData?.source_data) return null;
    
    try {
      return typeof repareoData.source_data === 'string' 
        ? JSON.parse(repareoData.source_data) 
        : repareoData.source_data;
    } catch (error) {
      return null;
    }
  };

  // Parse NORTHDATA
  const parseNorthdata = (relationships) => {
    const northdata = relationships?.find(rel => rel.handle === 'NORTHDATA');
    if (!northdata?.source_data) return null;
    
    try {
      return typeof northdata.source_data === 'string' 
        ? JSON.parse(northdata.source_data) 
        : northdata.source_data;
    } catch (error) {
      return null;
    }
  };

  const googleBusiness = parseGoogleBusiness(item.relationships);
  const repareoData = parseRepareoData(item.relationships);
  const northdata = parseNorthdata(item.relationships);
  
  const openingHours = parseOpeningHours(googleBusiness?.opening_hours);
  const currentStatus = getCurrentStatus(openingHours);

  // Count data sources
  const sourceCount = (item.relationships?.length || 0) + 1; // +1 for main dataset

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
        
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <Database className="mr-1 h-3 w-3" />
            {sourceCount} Quellen
          </Badge>
          {item.updated_at && (
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              <Calendar className="mr-1 h-3 w-3" />
              Aktualisiert: {new Date(item.updated_at).toLocaleDateString('de-DE')}
            </Badge>
          )}
        </div>
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
              {item.primary_classification && (
                <Badge variant="secondary" className="mb-2">
                  {item.primary_classification}
                </Badge>
              )}
            </div>
            {item.operational_status === 'OPERATIONAL' && (
              <Badge className="bg-green-100 text-green-800 border-green-200">
                <CheckCircle className="mr-1 h-3 w-3" />
                Aktiv
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {item.contact_telephone && (
              <div className="flex items-center">
                <Phone className="mr-2 h-4 w-4 text-muted-foreground" />
                <a href={`tel:${item.contact_telephone}`} className="text-blue-600 hover:underline">
                  {item.contact_telephone}
                </a>
              </div>
            )}
            {item.email_1 && (
              <div className="flex items-center">
                <Mail className="mr-2 h-4 w-4 text-muted-foreground" />
                <a href={`mailto:${item.email_1}`} className="text-blue-600 hover:underline">
                  {item.email_1}
                </a>
              </div>
            )}
            {item.website_url && (
              <div className="flex items-center">
                <Globe className="mr-2 h-4 w-4 text-muted-foreground" />
                <a href={item.website_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  Website besuchen
                </a>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Sub-Classifications */}
      {googleBusiness?.subtypes && googleBusiness.subtypes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Sub-Klassifikationen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {googleBusiness.subtypes.slice(0, 8).map((subtype, index) => (
                <Badge key={index} variant="outline">
                  {subtype}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Concepts & Networks */}
      {item.concepts_networks && item.concepts_networks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Konzepte & Netzwerke</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {item.concepts_networks.map((concept, index) => (
                <Badge key={index} variant="secondary" className="bg-blue-50 text-blue-700">
                  {concept}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Contact Persons */}
      {(item.firstname_1 || item.lastname_1 || item.firstname_2 || item.lastname_2) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Ansprechpartner</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {(item.firstname_1 || item.lastname_1) && (
                <div className="flex items-center">
                  <Users className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>{item.firstname_1} {item.lastname_1}</span>
                </div>
              )}
              {(item.firstname_2 || item.lastname_2) && (
                <div className="flex items-center">
                  <Users className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>{item.firstname_2} {item.lastname_2}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Opening Hours */}
      {openingHours && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <Clock className="mr-2 h-5 w-5" />
              Öffnungszeiten
              <Badge 
                className={`ml-2 ${
                  currentStatus.color === 'green' ? 'bg-green-100 text-green-800' :
                  currentStatus.color === 'orange' ? 'bg-orange-100 text-orange-800' :
                  'bg-red-100 text-red-800'
                }`}
              >
                {currentStatus.text}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {Object.entries(openingHours).map(([day, hours]) => (
                <div key={day} className="flex justify-between py-1">
                  <span className="font-medium">{day}</span>
                  <span className={hours === 'Geschlossen' ? 'text-red-600' : 'text-green-600'}>
                    {hours}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Map */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <MapPin className="mr-2 h-5 w-5" />
            Standort
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 mb-4">
            {/* <MapComponent data={[item]} /> */}
            <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
              <p className="text-gray-500">Karte temporär deaktiviert</p>
            </div>
          </div>
          {googleBusiness?.location_link && (
            <Button variant="outline" className="w-full" asChild>
              <a href={googleBusiness.location_link} target="_blank" rel="noopener noreferrer">
                <Navigation className="mr-2 h-4 w-4" />
                Route planen
              </a>
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Google Business */}
      {googleBusiness && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Google Business</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {googleBusiness.places_id && (
                <div>
                  <span className="font-medium">Places ID:</span>
                  <p className="text-sm text-muted-foreground">{googleBusiness.places_id}</p>
                </div>
              )}
              {googleBusiness.category && (
                <div>
                  <span className="font-medium">Kategorie:</span>
                  <p className="text-sm text-muted-foreground">{googleBusiness.category}</p>
                </div>
              )}
              {googleBusiness.description && (
                <div className="md:col-span-2">
                  <span className="font-medium">Beschreibung:</span>
                  <p className="text-sm text-muted-foreground">{googleBusiness.description}</p>
                </div>
              )}
            </div>

            {/* Verification Status */}
            {googleBusiness.verified && (
              <div className="flex items-center p-3 bg-green-50 border border-green-200 rounded-lg">
                <Verified className="mr-2 h-5 w-5 text-green-600" />
                <span className="text-green-800 font-medium">Verifiziertes Unternehmen</span>
              </div>
            )}

            {/* Booking Link */}
            {googleBusiness.booking_appointment_link && (
              <div>
                <Button variant="outline" asChild>
                  <a href={googleBusiness.booking_appointment_link} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Buchungslink
                  </a>
                </Button>
              </div>
            )}

            {/* Ratings */}
            {googleBusiness.rating && (
              <div className="space-y-2">
                <h4 className="font-medium">Bewertungen</h4>
                <div className="flex items-center space-x-2">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        className={`h-4 w-4 ${
                          i < Math.floor(googleBusiness.rating) 
                            ? 'text-yellow-400 fill-current' 
                            : 'text-gray-300'
                        }`} 
                      />
                    ))}
                  </div>
                  <span className="font-medium">{googleBusiness.rating}</span>
                  {googleBusiness.reviews && (
                    <span className="text-muted-foreground">({googleBusiness.reviews} Bewertungen)</span>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Additional Information */}
      {repareoData && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Weitere Informationen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(repareoData)
                .filter(([key]) => !['city', 'postcode', 'street', 'calendars', 'chain', 'chain_id', 'collect_return_radius', 'email_besitzer'].includes(key.toLowerCase()))
                .map(([key, value]) => (
                  <div key={key}>
                    <span className="font-medium">{key}:</span>
                    <p className="text-sm text-muted-foreground">{safeRender(value)}</p>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Company Registry */}
      {northdata && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Handelsregister</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(northdata).map(([key, value]) => (
                <div key={key}>
                  <span className="font-medium">{key}:</span>
                  <p className="text-sm text-muted-foreground">{safeRender(value)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Management Changes */}
      {companyChanges.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Wesentliche Veränderungen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {companyChanges.map((change, index) => (
                <div key={index} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline">
                      {change.event_date ? new Date(change.event_date).toLocaleDateString('de-DE') : 'Unbekanntes Datum'}
                    </Badge>
                  </div>
                  <p className="text-sm">{change.note || 'Keine Details verfügbar'}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

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

export default DetailPage;

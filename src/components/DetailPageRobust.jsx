import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Phone, Mail, Globe, MapPin, Clock, Star, Users, Building, Database, Calendar, Settings } from 'lucide-react';

const DetailPageRobust = () => {
  const { id } = useParams();
  const [workshop, setWorkshop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadWorkshop = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Load workshop data
        const response = await fetch('/werkstatt-adressen-filtered-750.json');
        if (!response.ok) {
          throw new Error('Failed to load workshop data');
        }
        
        const data = await response.json();
        const foundWorkshop = data.find(w => w.id === id);
        
        if (!foundWorkshop) {
          throw new Error('Workshop not found');
        }
        
        setWorkshop(foundWorkshop);
      } catch (err) {
        console.error('Error loading workshop:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadWorkshop();
    }
  }, [id]);

  const getOpeningStatus = (openingHours) => {
    if (!openingHours) return { status: 'unknown', text: 'Öffnungszeiten nicht verfügbar', color: 'gray' };
    
    const now = new Date();
    const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    // Map day numbers to German day names
    const dayMap = {
      0: 'Sonntag', 1: 'Montag', 2: 'Dienstag', 3: 'Mittwoch',
      4: 'Donnerstag', 5: 'Freitag', 6: 'Samstag'
    };
    
    const todayName = dayMap[currentDay];
    const todayHours = openingHours[todayName];
    
    if (!todayHours || todayHours === 'Geschlossen') {
      return { status: 'closed', text: 'Heute geschlossen', color: 'red' };
    }
    
    // Parse opening hours (e.g., "08:00-17:00")
    const timeMatch = todayHours.match(/(\d{2}):(\d{2})-(\d{2}):(\d{2})/);
    if (!timeMatch) {
      return { status: 'unknown', text: 'Öffnungszeiten unklar', color: 'gray' };
    }
    
    const openTime = parseInt(timeMatch[1]) * 60 + parseInt(timeMatch[2]);
    const closeTime = parseInt(timeMatch[3]) * 60 + parseInt(timeMatch[4]);
    
    if (currentTime < openTime) {
      const openHour = Math.floor(openTime / 60);
      const openMinute = openTime % 60;
      return { 
        status: 'closed', 
        text: `Geschlossen - Öffnet um ${openHour.toString().padStart(2, '0')}:${openMinute.toString().padStart(2, '0')}`, 
        color: 'red' 
      };
    } else if (currentTime > closeTime) {
      return { status: 'closed', text: 'Heute geschlossen', color: 'red' };
    } else if (closeTime - currentTime <= 60) {
      return { status: 'closing', text: 'Schließt in Kürze', color: 'yellow' };
    } else {
      return { status: 'open', text: 'Gerade geöffnet', color: 'green' };
    }
  };

  const getDataSourceCount = (workshop) => {
    let count = 1; // Main dataset
    if (workshop.relationships) {
      count += Object.keys(workshop.relationships).length;
    }
    return count;
  };

  const formatPhoneNumber = (phone) => {
    if (!phone) return null;
    // Remove all non-digit characters except +
    const cleaned = phone.replace(/[^\d+]/g, '');
    return cleaned;
  };

  const getClassification = (workshop) => {
    // Use type from GMAPS_CRAWLER relationship if available
    if (workshop.relationships?.GMAPS_CRAWLER?.type) {
      return workshop.relationships.GMAPS_CRAWLER.type;
    }
    // Fallback to main classification
    return workshop.classification || 'Nicht verfügbar';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#005787] mx-auto mb-4"></div>
          <p className="text-gray-600">Werkstatt-Details werden geladen...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-4">
            <p className="font-semibold">Fehler beim Laden</p>
            <p className="text-sm">{error}</p>
          </div>
          <Link to="/" className="text-[#005787] hover:underline">
            ← Zurück zur Übersicht
          </Link>
        </div>
      </div>
    );
  }

  if (!workshop) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Werkstatt nicht gefunden</p>
          <Link to="/" className="text-[#005787] hover:underline">
            ← Zurück zur Übersicht
          </Link>
        </div>
      </div>
    );
  }

  const openingStatus = getOpeningStatus(workshop.opening_hours);
  const dataSourceCount = getDataSourceCount(workshop);
  const classification = getClassification(workshop);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Back Button */}
        <Link to="/" className="inline-flex items-center text-[#005787] hover:text-[#004066] mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Zurück zur Übersicht
        </Link>

        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{workshop.name}</h1>
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                  AKTIV
                </span>
                {workshop.concepts && workshop.concepts.map((concept, index) => (
                  <span key={index} className="bg-[#005787] text-white px-3 py-1 rounded-full text-sm">
                    {concept}
                  </span>
                ))}
              </div>
              
              {/* Data Source USP */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <div className="flex items-center">
                  <Database className="w-5 h-5 text-green-600 mr-2" />
                  <div>
                    <p className="text-green-800 font-semibold">
                      {dataSourceCount} Datenquellen
                    </p>
                    <p className="text-green-700 text-sm">
                      Verifizierte Informationen aus mehreren Quellen • Letzte Aktualisierung: {workshop.updated_at || '10.10.2025'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Contact & Location */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <MapPin className="w-5 h-5 text-[#005787] mr-2" />
                Kontakt & Standort
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Adresse</p>
                  <p className="text-gray-900">{workshop.address}</p>
                  <p className="text-gray-900">{workshop.postal_code} {workshop.city}</p>
                </div>
                <div className="space-y-3">
                  {workshop.phone && (
                    <a href={`tel:${formatPhoneNumber(workshop.phone)}`} 
                       className="flex items-center text-[#005787] hover:text-[#004066]">
                      <Phone className="w-4 h-4 mr-2" />
                      {workshop.phone}
                    </a>
                  )}
                  {workshop.email && (
                    <a href={`mailto:${workshop.email}`} 
                       className="flex items-center text-[#005787] hover:text-[#004066]">
                      <Mail className="w-4 h-4 mr-2" />
                      {workshop.email}
                    </a>
                  )}
                  {workshop.website && (
                    <a href={workshop.website.startsWith('http') ? workshop.website : `https://${workshop.website}`} 
                       target="_blank" rel="noopener noreferrer"
                       className="flex items-center text-[#005787] hover:text-[#004066]">
                      <Globe className="w-4 h-4 mr-2" />
                      Website besuchen
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Opening Hours */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Clock className="w-5 h-5 text-[#005787] mr-2" />
                Öffnungszeiten
              </h2>
              <div className="mb-4">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  openingStatus.color === 'green' ? 'bg-green-100 text-green-800' :
                  openingStatus.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {openingStatus.text}
                </span>
              </div>
              {workshop.opening_hours && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {Object.entries(workshop.opening_hours).map(([day, hours]) => (
                    <div key={day} className="flex justify-between py-1">
                      <span className="text-gray-600">{day}</span>
                      <span className="text-gray-900">{hours}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Google Business */}
            {workshop.relationships?.GMAPS_CRAWLER && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Star className="w-5 h-5 text-[#005787] mr-2" />
                  Google Business
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {workshop.relationships.GMAPS_CRAWLER.rating && (
                    <div className="text-center">
                      <div className="text-2xl font-bold text-[#005787]">
                        {workshop.relationships.GMAPS_CRAWLER.rating}
                      </div>
                      <div className="flex justify-center mb-1">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`w-4 h-4 ${
                            i < Math.floor(workshop.relationships.GMAPS_CRAWLER.rating) 
                              ? 'text-yellow-400 fill-current' 
                              : 'text-gray-300'
                          }`} />
                        ))}
                      </div>
                      <div className="text-sm text-gray-600">
                        {workshop.relationships.GMAPS_CRAWLER.user_ratings_total} Bewertungen
                      </div>
                    </div>
                  )}
                  <div className="md:col-span-2">
                    <p className="text-sm text-gray-600 mb-2">Klassifikation</p>
                    <p className="text-gray-900">{classification}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Business Information */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Building className="w-5 h-5 text-[#005787] mr-2" />
                Unternehmensdaten
              </h2>
              <div className="space-y-3">
                {workshop.relationships?.NORTHDATA?.legal_form && (
                  <div>
                    <p className="text-sm text-gray-600">Rechtsform</p>
                    <p className="text-gray-900">{workshop.relationships.NORTHDATA.legal_form}</p>
                  </div>
                )}
                {workshop.relationships?.NORTHDATA?.revenue && (
                  <div>
                    <p className="text-sm text-gray-600">Umsatz</p>
                    <p className="text-gray-900">{workshop.relationships.NORTHDATA.revenue}</p>
                  </div>
                )}
                {workshop.management && workshop.management.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-600">Geschäftsführung</p>
                    <p className="text-gray-900">{workshop.management.join(', ')}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Events */}
            {workshop.events && workshop.events.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Calendar className="w-5 h-5 text-[#005787] mr-2" />
                  Aktuelle Ereignisse
                </h2>
                <div className="space-y-3">
                  {workshop.events.slice(0, 3).map((event, index) => (
                    <div key={index} className="border-l-4 border-[#005787] pl-3">
                      <p className="text-sm font-medium text-gray-900">{event.type}</p>
                      <p className="text-sm text-gray-600">{event.date}</p>
                      {event.description && (
                        <p className="text-sm text-gray-700 mt-1">{event.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailPageRobust;

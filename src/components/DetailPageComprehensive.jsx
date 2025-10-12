import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import auteonLogo from '../assets/auteon-logo.jpg';
import { 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  Clock, 
  Star, 
  ExternalLink, 
  ArrowLeft,
  Building,
  Users,
  Calendar,
  Camera,
  CheckCircle,
  Info,
  FileText,
  Wrench,
  Network,
  Share2,
  CreditCard,
  Tag,
  Database,
  Download
} from 'lucide-react';

const DetailPageComprehensive = () => {
  const { id } = useParams();
  const [workshop, setWorkshop] = useState(null);
  const [googleData, setGoogleData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);

  // Scroll to top when component mounts or ID changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  // Export function for current workshop
  const exportCurrentWorkshop = () => {
    if (!workshop) return;
    
    // Create export metadata
    const exportMetadata = {
      exportDate: new Date().toISOString(),
      totalRecords: 1,
      workshopId: workshop.id,
      workshopName: workshop.name,
      description: "Einzelner Werkstatt-Datensatz"
    };

    // Create the export object with cleaned data
    const exportData = {
      metadata: exportMetadata,
      workshop: cleanDataForExport(workshop),
      googleData: googleData
    };

    // Create and download JSON file
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
      type: 'application/json' 
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `werkstatt_${workshop.id}_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Get company logo from Google Business data
  const getCompanyLogo = () => {
    if (!googleData) return null;
    return safeGet(googleData, 'logo');
  };

  // Get company photo from Google Business data
  const getCompanyPhoto = () => {
    if (!googleData) return null;
    return safeGet(googleData, 'photo');
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

  // Clean data for export - rename NORTHDATA to HANDELSREGISTER and filter *northdata* fields
  const cleanDataForExport = (data) => {
    if (!data) return data;
    
    // Deep clone to avoid mutating original data
    const cleanedData = JSON.parse(JSON.stringify(data));
    
    // Process relationships array
    if (cleanedData.relationships && Array.isArray(cleanedData.relationships)) {
      cleanedData.relationships = cleanedData.relationships.map(rel => {
        // Rename NORTHDATA handle to HANDELSREGISTER
        if (rel.handle === 'NORTHDATA') {
          rel.handle = 'HANDELSREGISTER';
        }
        
        // Filter out fields containing *northdata* values
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

  // Safe helper function to get nested values
  const safeGet = (obj, path, defaultValue = null) => {
    try {
      return path.split('.').reduce((current, key) => {
        return (current && current[key] !== undefined) ? current[key] : defaultValue;
      }, obj);
    } catch (e) {
      return defaultValue;
    }
  };

  // Safe array check
  const safeArray = (arr) => {
    return Array.isArray(arr) ? arr : [];
  };

  // Safe object check
  const safeObject = (obj) => {
    return obj && typeof obj === 'object' ? obj : {};
  };

  useEffect(() => {
    const fetchWorkshopData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch('/werkstatt-adressen-filtered-750.json');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Loaded data:', data.length, 'workshops');
        
        const foundWorkshop = data.find(w => w.id === id);
        if (!foundWorkshop) {
          console.error('Workshop not found for ID:', id);
          setError('Werkstatt nicht gefunden');
          return;
        }
        
        console.log('Found workshop:', foundWorkshop.name, foundWorkshop.id);
        setWorkshop(foundWorkshop);
        
        // Extract Google Business data safely
        const relationships = safeArray(foundWorkshop.relationships);
        const googleRel = relationships.find(rel => rel?.handle === 'GOOGLE_BUSINESS');
        if (googleRel?.source_data) {
          try {
            const googleData = typeof googleRel.source_data === 'string' 
              ? JSON.parse(googleRel.source_data) 
              : googleRel.source_data;
            console.log('Google data loaded for:', foundWorkshop.name);
            setGoogleData(safeObject(googleData));
          } catch (e) {
            console.error('Error parsing Google Business data for', foundWorkshop.name, ':', e);
            setGoogleData({});
          }
        } else {
          console.log('No Google Business data found for:', foundWorkshop.name);
          setGoogleData({});
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching workshop data:', err);
        setError('Fehler beim Laden der Daten: ' + err.message);
        setLoading(false);
      }
    };

    if (id) {
      fetchWorkshopData();
    }
  }, [id]);

  useEffect(() => {
    if (workshop) {
      initializeMap();
    }
  }, [workshop]);

  // Get coordinates from relationships
  const getCoordinates = () => {
    const relationships = safeArray(workshop?.relationships);
    
    // Try Google Business first
    const googleRel = relationships.find(rel => rel?.handle === 'GOOGLE_BUSINESS');
    if (googleRel?.source_data) {
      try {
        const data = typeof googleRel.source_data === 'string' 
          ? JSON.parse(googleRel.source_data) 
          : googleRel.source_data;
        const lat = safeGet(data, 'latitude');
        const lng = safeGet(data, 'longitude');
        if (lat && lng) {
          return { lat: parseFloat(lat), lng: parseFloat(lng) };
        }
      } catch (e) {
        console.error('Error parsing Google Business coordinates:', e);
      }
    }
    
    // Try OpenStreetMap as fallback
    const osmRel = relationships.find(rel => rel?.handle === 'OPENSTREETMAP_NOMINATIM');
    if (osmRel?.source_data) {
      try {
        const data = typeof osmRel.source_data === 'string' 
          ? JSON.parse(osmRel.source_data) 
          : osmRel.source_data;
        const lat = safeGet(data, 'lat');
        const lng = safeGet(data, 'lon');
        if (lat && lng) {
          return { lat: parseFloat(lat), lng: parseFloat(lng) };
        }
      } catch (e) {
        console.error('Error parsing OSM coordinates:', e);
      }
    }
    
    return null;
  };

  // Normalize phone number
  const normalizePhoneNumber = (phone) => {
    if (!phone || typeof phone !== 'string') return '';
    let cleaned = phone.replace(/[^\d+]/g, '');
    
    if (cleaned.startsWith('+49')) {
      cleaned = '0' + cleaned.substring(3);
    } else if (cleaned.startsWith('49') && cleaned.length > 10) {
      cleaned = '0' + cleaned.substring(2);
    }
    
    if (cleaned.startsWith('0')) {
      if (cleaned.length === 11) {
        return cleaned.replace(/(\d{3})(\d{4})(\d{4})/, '$1 $2 $3');
      } else if (cleaned.length === 12) {
        return cleaned.replace(/(\d{4})(\d{4})(\d{4})/, '$1 $2 $3');
      } else if (cleaned.length === 10) {
        return cleaned.replace(/(\d{2,3})(\d{3,4})(\d{3,4})/, '$1 $2 $3');
      }
    }
    
    return cleaned;
  };

  // Get all unique phone numbers from all sources
  const getAllPhoneNumbers = () => {
    if (!workshop) return [];
    
    const phones = new Set();
    
    // Main telephone
    const mainPhone = safeGet(workshop, 'telephone');
    if (mainPhone) {
      phones.add(normalizePhoneNumber(mainPhone));
    }
    
    // From Google Business data
    const googlePhone = safeGet(googleData, 'phone');
    if (googlePhone) {
      phones.add(normalizePhoneNumber(googlePhone));
    }
    
    // From relationships
    const relationships = safeArray(workshop.relationships);
    relationships.forEach(rel => {
      if (rel?.source_data) {
        try {
          const data = typeof rel.source_data === 'string' ? JSON.parse(rel.source_data) : rel.source_data;
          const phone = safeGet(data, 'phone');
          const tel = safeGet(data, 'Tel');
          const fax = safeGet(data, 'Fax');
          
          if (phone) phones.add(normalizePhoneNumber(phone));
          if (tel) phones.add(normalizePhoneNumber(tel));
          if (fax) phones.add(normalizePhoneNumber(fax));
        } catch (e) {
          // Ignore parsing errors
        }
      }
    });
    
    return Array.from(phones).filter(phone => phone && phone.length > 0);
  };

  // Get all unique email addresses
  const getAllEmails = () => {
    if (!workshop) return [];
    
    const emails = new Set();
    
    // Main email array
    const mainEmails = safeGet(workshop, 'email');
    if (Array.isArray(mainEmails)) {
      mainEmails.forEach(email => {
        if (email && typeof email === 'string') {
          emails.add(email);
        }
      });
    } else if (mainEmails && typeof mainEmails === 'string') {
      emails.add(mainEmails);
    }
    
    // From Google Business data
    const googleEmails = [
      safeGet(googleData, 'email_1'),
      safeGet(googleData, 'email_2'),
      safeGet(googleData, 'email_3')
    ].filter(email => email && typeof email === 'string');
    
    googleEmails.forEach(email => emails.add(email));
    
    // From relationships
    const relationships = safeArray(workshop.relationships);
    relationships.forEach(rel => {
      if (rel?.source_data) {
        try {
          const data = typeof rel.source_data === 'string' ? JSON.parse(rel.source_data) : rel.source_data;
          const email = safeGet(data, 'email');
          const emailAlt = safeGet(data, 'E-Mail');
          
          if (email && typeof email === 'string') emails.add(email);
          if (emailAlt && typeof emailAlt === 'string') emails.add(emailAlt);
        } catch (e) {
          // Ignore parsing errors
        }
      }
    });
    
    return Array.from(emails).filter(email => email && email.includes('@'));
  };

  // Normalize website URL
  const normalizeWebsite = (url) => {
    if (!url || typeof url !== 'string') return null;
    
    let normalized = url.trim();
    if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
      normalized = 'https://' + normalized;
    }
    
    // Remove trailing slash
    normalized = normalized.replace(/\/$/, '');
    
    return normalized;
  };

  // Get all unique websites with better deduplication
  const getAllWebsites = () => {
    if (!workshop) return [];
    
    const websites = new Set();
    
    // Main website
    const mainWebsite = safeGet(workshop, 'website_url');
    if (mainWebsite) {
      const normalized = normalizeWebsite(mainWebsite);
      if (normalized) websites.add(normalized);
    }
    
    // From Google Business data
    const googleSite = safeGet(googleData, 'site');
    if (googleSite) {
      const normalized = normalizeWebsite(googleSite);
      if (normalized) websites.add(normalized);
    }
    
    // From relationships
    const relationships = safeArray(workshop.relationships);
    relationships.forEach(rel => {
      if (rel?.source_data) {
        try {
          const data = typeof rel.source_data === 'string' ? JSON.parse(rel.source_data) : rel.source_data;
          const website = safeGet(data, 'website');
          const websiteAlt = safeGet(data, 'Website');
          
          if (website) {
            const normalized = normalizeWebsite(website);
            if (normalized) websites.add(normalized);
          }
          if (websiteAlt) {
            const normalized = normalizeWebsite(websiteAlt);
            if (normalized) websites.add(normalized);
          }
        } catch (e) {
          // Ignore parsing errors
        }
      }
    });
    
    return Array.from(websites).filter(website => website && website.length > 0);
  };

  // Get social media links
  const getSocialMediaLinks = () => {
    const links = [];
    
    const socialPlatforms = [
      { key: 'facebook', name: 'Facebook', icon: '📘' },
      { key: 'instagram', name: 'Instagram', icon: '📷' },
      { key: 'twitter', name: 'Twitter', icon: '🐦' },
      { key: 'youtube', name: 'YouTube', icon: '📺' },
      { key: 'linkedin', name: 'LinkedIn', icon: '💼' }
    ];
    
    socialPlatforms.forEach(platform => {
      const url = safeGet(googleData, platform.key);
      if (url && typeof url === 'string' && url.startsWith('http')) {
        links.push({
          platform: platform.name,
          url: url,
          icon: platform.icon
        });
      }
    });
    
    return links;
  };

  // Get service types
  const getServiceTypes = () => {
    const subtypes = safeGet(googleData, 'subtypes');
    if (!subtypes || typeof subtypes !== 'string') return [];
    
    return subtypes.split(',').map(type => type.trim()).filter(type => type.length > 0);
  };

  // Get review tags
  const getReviewTags = () => {
    const tags = safeGet(googleData, 'reviews_tags');
    if (!tags || typeof tags !== 'string') return [];
    
    return tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
  };

  // Get booking links
  const getBookingLinks = () => {
    const links = [];
    
    const bookingLink = safeGet(googleData, 'booking_appointment_link');
    if (bookingLink && typeof bookingLink === 'string') {
      links.push({
        type: 'Terminbuchung',
        url: bookingLink
      });
    }
    
    const orderLinks = safeGet(googleData, 'order_links');
    if (orderLinks && typeof orderLinks === 'string') {
      links.push({
        type: 'Online-Bestellung',
        url: orderLinks
      });
    }
    
    return links;
  };

  // Get Northdata data
  const getNorthdataData = () => {
    const relationships = safeArray(workshop?.relationships);
    const northdataRel = relationships.find(rel => rel?.handle === 'NORTHDATA');
    if (!northdataRel?.source_data) return null;
    
    try {
      const data = typeof northdataRel.source_data === 'string' 
        ? JSON.parse(northdataRel.source_data) 
        : northdataRel.source_data;
      
      return {
        company_name: safeGet(data, 'Name'),
        legal_form: safeGet(data, 'Rechtsform'),
        register_id: safeGet(data, 'Register-ID'),
        court: safeGet(data, 'HR Amtsgericht'),
        vat_id: safeGet(data, 'USt.-Id.'),
        industry: safeGet(data, 'Branche (WZ)'),
        status: safeGet(data, 'Status'),
        management_changes: safeGet(data, 'Managementwechsel') ? [safeGet(data, 'Managementwechsel')] : [],
        profile_url: safeGet(data, 'North Data URL')
      };
    } catch (e) {
      console.error('Error parsing Northdata:', e);
      return null;
    }
  };

  const northdataData = getNorthdataData();

  // Get networks/partnerships
  const getNetworks = () => {
    if (!workshop) return [];
    const networks = safeGet(workshop, 'concepts_networks');
    return Array.isArray(networks) ? networks : [];
  };

  // Calculate data sources count
  const getDataSourcesCount = () => {
    if (!workshop) return 1;
    
    let count = 1; // Main dataset
    
    // Add relationships
    const relationships = safeArray(workshop.relationships);
    count += relationships.length;
    
    // Add events
    const events = safeArray(workshop.events);
    count += events.length;
    
    return count;
  };

  // Parse working hours
  const parseWorkingHours = () => {
    if (!workshop) return {};
    
    try {
      const workingHours = safeGet(workshop, 'working_hours_structured');
      if (workingHours && typeof workingHours === 'string') {
        return JSON.parse(workingHours);
      }
    } catch (e) {
      console.error('Error parsing working hours:', e);
    }
    
    return {};
  };

  const workingHours = parseWorkingHours();

  // Check if currently open
  const isCurrentlyOpen = () => {
    if (!workingHours || Object.keys(workingHours).length === 0) return null;
    
    const now = new Date();
    const currentDay = now.toLocaleDateString('de-DE', { weekday: 'long' });
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const todayHours = workingHours[currentDay];
    if (!todayHours || todayHours === 'Geschlossen') return false;
    
    const [start, end] = todayHours.split('-');
    if (!start || !end) return null;
    
    const [startHour, startMin] = start.split(':').map(Number);
    const [endHour, endMin] = end.split(':').map(Number);
    
    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;
    
    return currentTime >= startTime && currentTime <= endTime;
  };

  // Get next opening time
  const getNextOpeningTime = () => {
    if (!workingHours || Object.keys(workingHours).length === 0) return null;
    
    const now = new Date();
    const days = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];
    const currentDayIndex = now.getDay() === 0 ? 6 : now.getDay() - 1;
    
    for (let i = 0; i < 7; i++) {
      const dayIndex = (currentDayIndex + i) % 7;
      const day = days[dayIndex];
      const hours = workingHours[day];
      
      if (hours && hours !== 'Geschlossen') {
        const [start] = hours.split('-');
        if (start) {
          return {
            day: day,
            time: start,
            isToday: i === 0
          };
        }
      }
    }
    
    return null;
  };

  // Translate service type
  const translateServiceType = (type) => {
    const translations = {
      'Autowerkstatt': 'Autowerkstatt',
      'Klimaservice für Autos': 'Klimaservice für Autos',
      'Autoglaswerkstatt': 'Autoglaswerkstatt',
      'Kfz-Ersatzteilgeschäft': 'Kfz-Ersatzteilgeschäft',
      'Bremsenspezialist': 'Bremsenspezialist',
      'Kfz-Prüfstelle': 'Kfz-Prüfstelle',
      'Reparaturwerkstatt für Elektromotoren': 'Reparaturwerkstatt für Elektromotoren',
      'Mechaniker': 'Mechaniker',
      'Ölwechseldienst': 'Ölwechseldienst',
      'Reifengeschäft': 'Reifengeschäft'
    };
    return translations[type] || type;
  };

  // Translate business type
  const translateBusinessType = (type) => {
    const translations = {
      'Autowerkstatt': 'Autowerkstatt',
      'car repair and maintenance': 'Autoreparatur und Wartung',
      'REPAIR_CARS_PASSENGER': 'Pkw-Reparatur'
    };
    return translations[type] || type;
  };

  // Initialize map
  const initializeMap = () => {
    if (!window.google || !mapRef.current) return;
    
    const coordinates = getCoordinates();
    if (!coordinates) {
      console.log('No coordinates available for map');
      return;
    }
    
    try {
      const map = new window.google.maps.Map(mapRef.current, {
        zoom: 15,
        center: coordinates,
        mapTypeId: window.google.maps.MapTypeId.ROADMAP
      });
      
      const marker = new window.google.maps.Marker({
        position: coordinates,
        map: map,
        title: safeGet(workshop, 'name', 'Werkstatt'),
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <!-- Blue circular background -->
              <circle cx="16" cy="16" r="14" fill="#005787" stroke="none"/>
              <!-- White circular interior -->
              <circle cx="16" cy="16" r="10" fill="white" stroke="none"/>
              <!-- Car repair icon in blue -->
              <g transform="translate(8, 8) scale(0.13)">
                <path fill="#005787" d="M13.26,32.17C2.94,26.92,4.13,21.08,14.49,21.69L16.81,26,21.6,11.16C23.48,5.31,26.61,0,32.74,0H93.92c6.13,0,9.67,5.21,11.15,11.16l3.59,14.42,2.07-3.89c10.66-.62,11.61,5.57.33,10.92l1.83,2.81c6.63,6.81,6.78,13.61,5.91,28.41a27.21,27.21,0,0,0-3.49-1.77c-14.43-6-22.66.15-30.47,6-2.54,1.9-5,3.72-6.29,3.71L44.34,72c-.52,0-1,0-1.27-.08l-.17-.06h0l-.15,0a6.07,6.07,0,0,1-1.34-.72c-.94-.61-2.35-1.69-4.27-3.2-6.26-4.93-13.56-7.46-20.81-7.06a26.53,26.53,0,0,0-12,3.59C3.21,51,2.48,39.15,13.26,32.17Zm19,17.13L19,47.63c-3.12-.34-4,1-2.89,3.66l1.42,3.47a5,5,0,0,0,1.79,2,6.05,6.05,0,0,0,3,.82l11.78.09c2.85,0,4.08-1.15,3.19-3.76a6.37,6.37,0,0,0-5-4.6Zm58.38,0,13.21-1.67c3.12-.34,4,1,2.9,3.66l-1.43,3.47a5,5,0,0,1-1.79,2,6,6,0,0,1-3,.82l-11.78.09c-2.85,0-4.08-1.15-3.19-3.76a6.39,6.39,0,0,1,5-4.6Zm-68.86-20h81.59l-3.6-15c-1-4.56-3.82-8.51-8.5-8.51H34.77c-4.67,0-7.07,4.06-8.5,8.51l-4.5,15v0Z"/>
                <path fill="#005787" d="M11.28,107.32c-5.06-2.1-9.12-6.7-11.28-12.43,20.09,9.85,28.19-16.43,4.09-18,7.63-8.65,18.48-8.24,27.07-1.48,4.05,3.19,6.34,4.81,8.71,5.55a14.79,14.79,0,0,0,4.26.6l34.34-.24C89.68,81.48,95.86,64.44,111.6,71c5.06,2.1,9.11,6.71,11.28,12.43-20.09-9.85-28.2,16.44-4.09,18-7.63,8.65-18.48,8.25-27.07,1.48-3.76-3-6.08-6.41-13.67-6.43l-33.28.43a15.42,15.42,0,0,0-4.84.7,17.74,17.74,0,0,0-4.1,2.25c-8.09,5.52-14,11.92-24.55,7.52Z"/>
              </g>
            </svg>
          `),
          scaledSize: new window.google.maps.Size(32, 32),
          anchor: new window.google.maps.Point(16, 32),
          optimized: false
        }
      });
      
      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div>
            <h3>${safeGet(workshop, 'name', 'Werkstatt')}</h3>
            <p>${safeGet(workshop, 'street', '')} ${safeGet(workshop, 'house_number', '')}</p>
            <p>${safeGet(workshop, 'zip_code', '')} ${safeGet(workshop, 'city', '')}</p>
            <p>Tel: ${safeGet(workshop, 'telephone', 'Nicht verfügbar')}</p>
          </div>
        `
      });
      
      marker.addListener('click', () => {
        infoWindow.open(map, marker);
      });
      
      mapInstanceRef.current = map;
    } catch (error) {
      console.error('Error initializing map:', error);
    }
  };

  if (loading) {
  return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#005787] mx-auto mb-4"></div>
          <p className="text-gray-600">Lade Werkstatt-Daten...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Fehler</h2>
          <p className="text-gray-600 mb-4">{error}</p>
            <Link to="/">
            <Button className="bg-[#005787] hover:bg-[#004066]">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Zurück zur Übersicht
              </Button>
            </Link>
          </div>
      </div>
    );
  }

  if (!workshop) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Werkstatt nicht gefunden</h2>
          <p className="text-gray-600 mb-4">Die angeforderte Werkstatt konnte nicht gefunden werden.</p>
          <Link to="/">
            <Button className="bg-[#005787] hover:bg-[#004066]">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Zurück zur Übersicht
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-16 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link to="/">
                <Button variant="outline" size="sm">
                  ← Zurück
                </Button>
              </Link>
              <div className="flex items-center space-x-3">
                {/* Company Logo */}
                {getCompanyLogo() && (
                  <img 
                    src={getCompanyLogo()} 
                    alt={`${safeGet(workshop, 'name', 'Company')} Logo`}
                    className="h-8 w-auto object-contain"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                )}
                <h1 className="text-2xl font-bold text-gray-900">
                  {safeGet(workshop, 'name', 'Unbekannte Werkstatt')}
                </h1>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {/* USP Callout */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className={`${badgeStyles.callout} text-sm px-3 py-1`}>
                    <Calendar className="w-3 h-3 mr-1" />
                    Aktualisiert: {(() => {
                      const dateStr = safeGet(workshop, 'updated_at', 'Unbekannt').split(' ')[0];
                      if (dateStr === 'Unbekannt') return 'Unbekannt';
                      try {
                        const date = new Date(dateStr);
                        return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
                      } catch (e) {
                        return dateStr;
                      }
                    })()}
                  </Badge>
                  <Badge variant="outline" className={`${badgeStyles.callout} text-sm px-3 py-1`}>
                    <Database className="w-3 h-3 mr-1" />
                    {getDataSourcesCount()} Datenquellen
                    </Badge>
                </div>
              </div>
              {/* Export Button */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <Button 
                  onClick={exportCurrentWorkshop}
                  className="bg-[#005787] hover:bg-[#004066] text-white"
                  size="sm"
                >
                  <Download className="mr-2 h-4 w-4" />
                  JSON Export
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Phone className="w-5 h-5 text-[#005787] mr-2" />
                  Kontaktinformationen
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column */}
                  <div className="space-y-4">
                    {/* Address */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                        <MapPin className="w-4 h-4 mr-2 text-gray-600" />
                        Adresse
                      </h4>
                      <div className="flex items-center text-gray-600">
                        <MapPin className="w-4 h-4 mr-2" />
                        <span>
                          {safeGet(workshop, 'street', '')} {safeGet(workshop, 'house_number', '')}, {safeGet(workshop, 'zip_code', '')} {safeGet(workshop, 'city', '')}
                        </span>
                    </div>
                  </div>
                  
                    {/* Phone Numbers */}
                    {getAllPhoneNumbers().length > 0 && (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                          <Phone className="w-4 h-4 mr-2 text-gray-600" />
                          Telefon
                        </h4>
                        <div className="space-y-2">
                          {getAllPhoneNumbers().map((phone, index) => (
                            <div key={index} className="flex items-center">
                              <a href={`tel:${phone.replace(/\s/g, '')}`} className="text-[#005787] hover:text-[#004066] font-medium">
                                {phone}
                              </a>
                    </div>
                          ))}
                  </div>
                      </div>
                    )}

                    {/* Email Addresses */}
                    {getAllEmails().length > 0 && (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                          <Mail className="w-4 h-4 mr-2 text-gray-600" />
                          E-Mail
                        </h4>
                        <div className="space-y-2">
                          {getAllEmails().map((email, index) => (
                            <div key={index} className="flex items-center">
                              <a href={`mailto:${email}`} className="text-[#005787] hover:text-[#004066] font-medium">
                                {email}
                              </a>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Websites */}
                    {getAllWebsites().length > 0 && (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                          <Globe className="w-4 h-4 mr-2 text-gray-600" />
                          Websites
                        </h4>
                        <div className="space-y-2">
                          {getAllWebsites().map((website, index) => (
                            <div key={index} className="flex items-center">
                              <a href={website} target="_blank" rel="noopener noreferrer" className="text-[#005787] hover:text-[#004066] font-medium flex items-center">
                                {website}
                                <ExternalLink className="w-3 h-3 ml-1" />
                              </a>
              </div>
                          ))}
            </div>
          </div>
                    )}
        </div>

                  {/* Right Column */}
                  <div className="space-y-4">
                    {/* Contact Persons */}
                    {safeArray(workshop.contact_persons).length > 0 && (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                          <Users className="w-4 h-4 mr-2 text-gray-600" />
                          Ansprechpartner
                        </h4>
                        <div className="space-y-2">
                          {safeArray(workshop.contact_persons).map((person, index) => (
                            <div key={index} className="text-sm">
                              <span className="font-medium">
                                {safeGet(person, 'firstname', '')} {safeGet(person, 'lastname', '')}
                              </span>
                              {safeGet(person, 'title') && (
                                <span className="text-gray-600 ml-1">({safeGet(person, 'title')})</span>
                              )}
      </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Social Media */}
                    {getSocialMediaLinks().length > 0 && (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                          <Share2 className="w-4 h-4 mr-2 text-gray-600" />
                          Social Media
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {getSocialMediaLinks().map((link, index) => (
                            <a key={index} href={link.url} target="_blank" rel="noopener noreferrer" className="text-[#005787] hover:text-[#004066] flex items-center bg-white px-2 py-1 rounded border">
                              <span className="mr-1">{link.icon}</span>
                              {link.platform}
                              <ExternalLink className="w-3 h-3 ml-1" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Online Booking */}
                    {getBookingLinks().length > 0 && (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                          <Calendar className="w-4 h-4 mr-2 text-gray-600" />
                          Online-Buchung
                        </h4>
                        <div className="space-y-2">
                          {getBookingLinks().map((link, index) => (
                            <div key={index} className="flex items-center">
                              <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-[#005787] hover:text-[#004066] font-medium flex items-center">
                                {link.type}
                                <ExternalLink className="w-3 h-3 ml-1" />
                              </a>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

              </CardContent>
            </Card>

            {/* Status & Classification */}
            <Card>
                <CardHeader>
                <CardTitle className="flex items-center">
                  <Building className="w-5 h-5 text-[#005787] mr-2" />
                  Status & Klassifikation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column */}
                  <div className="space-y-4">
                    {/* Operational Status */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                        <CheckCircle className={`w-4 h-4 mr-2 ${safeGet(workshop, 'operational_status') === 'OPERATIONAL' ? 'text-green-600' : 'text-red-600'}`} />
                        Betriebsstatus
                      </h4>
                      <Badge variant={safeGet(workshop, 'operational_status') === 'OPERATIONAL' ? 'default' : 'destructive'} className="text-sm">
                        {safeGet(workshop, 'operational_status') === 'OPERATIONAL' ? 'Aktiv' : 'Inaktiv'}
                      </Badge>
                  </div>
                  
                    {/* Primary Classification */}
                    {safeGet(workshop, 'primary_classification') && (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                          <Tag className="w-4 h-4 mr-2 text-gray-600" />
                          Hauptklassifikation
                        </h4>
                        <Badge variant="outline" className="text-sm bg-white">
                          {safeGet(workshop, 'primary_classification')}
                        </Badge>
                      </div>
                    )}
                    
                    {/* Business Type */}
                    {safeGet(googleData, 'type') && (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                          <Building className="w-4 h-4 mr-2 text-gray-600" />
                          Geschäftstyp
                        </h4>
                        <Badge variant="outline" className="text-sm bg-white">
                          {translateBusinessType(safeGet(googleData, 'type'))}
                        </Badge>
                      </div>
                    )}
                  </div>

                  {/* Right Column */}
                  <div className="space-y-4">
                    {/* Service Types */}
                    {getServiceTypes().length > 0 && (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                          <Wrench className="w-4 h-4 mr-2 text-gray-600" />
                          Service-Typen
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {getServiceTypes().map((type, index) => (
                            <Badge key={index} variant="outline" className="text-sm bg-white">
                              {translateServiceType(type)}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Verification Status */}
                    {safeGet(googleData, 'verified') && (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                          <CheckCircle className="w-4 h-4 mr-2 text-gray-600" />
                          Verifizierung
                        </h4>
                        <div className="flex items-center">
                          <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                          <span className="text-sm text-gray-600">Google verifiziert</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Company History */}
            {safeArray(workshop.events).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Calendar className="w-5 h-5 text-[#005787] mr-2" />
                    Unternehmenshistorie (2025)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {safeArray(workshop.events).map((event, index) => {
                      const eventType = safeGet(event, 'event_type', 'Unbekanntes Ereignis');
                      const displayName = eventType === 'management_change' ? 'Management-Wechsel' : eventType;
                      const eventDate = safeGet(event, 'event_date', safeGet(event, 'date', 'Datum unbekannt'));
                      
                    return (
                        <div key={index} className="border-l-4 border-[#005787] pl-4 py-2">
                          <div className="font-semibold text-gray-900">{displayName}</div>
                          <div className="text-sm text-gray-600">{eventDate}</div>
                          {safeGet(event, 'description') && (
                            <div className="text-sm text-gray-700 mt-1">{safeGet(event, 'description')}</div>
                    )}
                          </div>
                      );
                    })}
                        </div>
              </CardContent>
            </Card>
            )}

            {/* Opening Hours */}
            {Object.keys(workingHours).length > 0 && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center">
                      <Clock className="w-5 h-5 text-[#005787] mr-2" />
                    Öffnungszeiten
                  </CardTitle>
                    {/* Current Status */}
                  {(() => {
                      const currentStatus = isCurrentlyOpen();
                      const nextOpening = getNextOpeningTime();

                      if (currentStatus === true) {
                    return (
                          <div className="flex items-center bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                            <div className="w-3 h-3 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                            <span className="text-sm font-semibold text-green-700">Jetzt geöffnet</span>
                      </div>
                    );
                      } else if (currentStatus === false) {
                        return (
                          <div className="flex items-center bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                            <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                            <span className="text-sm font-semibold text-red-700">
                              {nextOpening ? (
                                nextOpening.isToday ?
                                  `Öffnet heute um ${nextOpening.time}` :
                                  `Öffnet ${nextOpening.day} um ${nextOpening.time}`
                              ) : 'Geschlossen'}
                            </span>
                      </div>
                    );
                      }
                      return null;
                  })()}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(workingHours).map(([day, hours]) => {
                      const now = new Date();
                      const currentDay = now.toLocaleDateString('de-DE', { weekday: 'long' });
                      const isToday = day === currentDay;

                      return (
                        <div 
                          key={day} 
                          className={`flex justify-between items-center py-3 px-4 rounded-lg ${
                            isToday ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center">
                            <span className={`font-medium ${isToday ? 'text-blue-900' : 'text-gray-700'}`}>
                              {day}
                            </span>
                            {isToday && (
                              <Badge variant="outline" className="ml-2 text-sm bg-blue-100 text-blue-800 border-blue-300">
                                Heute
                              </Badge>
                            )}
                          </div>
                          <span className={`text-sm font-medium ${
                            hours === 'Geschlossen'
                              ? 'text-red-600'
                              : isToday
                                ? 'text-blue-900'
                                : 'text-gray-600'
                          }`}>
                            {hours}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Handelsregister */}
            {northdataData && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="w-5 h-5 text-[#005787] mr-2" />
                    Handelsregister
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {northdataData.company_name && (
                      <div>
                      <span className="font-medium text-gray-700">Firmenname:</span>
                      <span className="ml-2">{northdataData.company_name}</span>
                              </div>
                  )}
                  {northdataData.legal_form && (
                    <div>
                      <span className="font-medium text-gray-700">Rechtsform:</span>
                      <span className="ml-2">{northdataData.legal_form}</span>
                        </div>
                  )}
                  {northdataData.register_id && (
                    <div>
                      <span className="font-medium text-gray-700">Register-ID:</span>
                      <span className="ml-2">{northdataData.register_id}</span>
                      </div>
                    )}
                  {northdataData.court && (
                      <div>
                      <span className="font-medium text-gray-700">Amtsgericht:</span>
                      <span className="ml-2">{northdataData.court}</span>
                              </div>
                  )}
                  {northdataData.vat_id && (
                    <div>
                      <span className="font-medium text-gray-700">USt.-Id.:</span>
                      <span className="ml-2">{northdataData.vat_id}</span>
                        </div>
                  )}
                  {northdataData.industry && (
                    <div>
                      <span className="font-medium text-gray-700">Branche:</span>
                      <span className="ml-2">{northdataData.industry}</span>
                      </div>
                    )}
                  {northdataData.status && (
                      <div>
                      <span className="font-medium text-gray-700">Status:</span>
                      <Badge variant="outline" className="ml-2">{northdataData.status}</Badge>
                      </div>
                    )}
                    
                  {/* Additional Northdata fields */}
                  {(() => {
                    const northdataRel = safeArray(workshop?.relationships).find(rel => rel?.handle === 'NORTHDATA');
                    if (!northdataRel?.source_data) return null;
                    
                    try {
                      const data = typeof northdataRel.source_data === 'string' 
                        ? JSON.parse(northdataRel.source_data) 
                        : northdataRel.source_data;
                      
                      return (
                        <>
                          {/* Bilanzsumme */}
                          {safeGet(data, 'Bilanzsumme EUR') && (
                      <div>
                              <span className="font-medium text-gray-700">Bilanzsumme:</span>
                              <span className="ml-2">{safeGet(data, 'Bilanzsumme EUR')} €</span>
                      </div>
                    )}
                          
                          {/* EK-Quote */}
                          {safeGet(data, 'EK-Quote %') && (
                            <div>
                              <span className="font-medium text-gray-700">EK-Quote:</span>
                              <span className="ml-2">{safeGet(data, 'EK-Quote %')} %</span>
                  </div>
                          )}
                          
                          {/* Finanzkennzahlen Datum */}
                          {safeGet(data, 'Finanzkennzahlen Datum') && (
                      <div>
                              <span className="font-medium text-gray-700">Finanzkennzahlen Datum:</span>
                              <span className="ml-2">{safeGet(data, 'Finanzkennzahlen Datum')}</span>
                            </div>
                          )}
                          
                          {/* Geschäftsführer */}
                          {(() => {
                            const managers = [];
                            if (safeGet(data, 'Ges. Vertreter 1')) managers.push(safeGet(data, 'Ges. Vertreter 1'));
                            if (safeGet(data, 'Ges. Vertreter 2')) managers.push(safeGet(data, 'Ges. Vertreter 2'));
                            if (safeGet(data, 'Ges. Vertreter 3')) managers.push(safeGet(data, 'Ges. Vertreter 3'));
                            
                            return managers.length > 0 ? (
                              <div>
                                <span className="font-medium text-gray-700">Geschäftsführer:</span>
                                <div className="ml-2 mt-1">
                                  {managers.map((manager, index) => (
                                    <div key={index} className="text-sm">{manager}</div>
                          ))}
                        </div>
                      </div>
                            ) : null;
                          })()}
                    
                          {/* Mitarbeiterzahl */}
                          {safeGet(data, 'Mitarbeiterzahl') && (
                    <div>
                              <span className="font-medium text-gray-700">Mitarbeiterzahl:</span>
                              <span className="ml-2">{safeGet(data, 'Mitarbeiterzahl')}</span>
                          </div>
                        )}
                          
                          {/* USt.-Id. (falls nicht bereits oben angezeigt) */}
                          {safeGet(data, 'USt.-Id.') && !northdataData.vat_id && (
                            <div>
                              <span className="font-medium text-gray-700">USt.-Id.:</span>
                              <span className="ml-2">{safeGet(data, 'USt.-Id.')}</span>
                          </div>
                        )}
                        </>
                      );
                    } catch (e) {
                      console.error('Error parsing additional Northdata fields:', e);
                      return null;
                    }
                  })()}
                </CardContent>
              </Card>
            )}

            {/* Description */}
            {safeGet(googleData, 'description') && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Info className="w-5 h-5 text-[#005787] mr-2" />
                    Beschreibung
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700">{safeGet(googleData, 'description')}</p>
                </CardContent>
              </Card>
            )}

            {/* Google Posts */}
            {(() => {
              const posts = safeArray(googleData.posts);
              const validPosts = posts.filter(post => {
                const title = safeGet(post, 'title', '');
                const content = safeGet(post, 'content', '');
                return title && title !== 'Ohne Titel' && title.trim() !== '' && content && content.trim() !== '';
              });
              
              return validPosts.length > 0 ? (
                <Card>
                <CardHeader>
                    <CardTitle className="flex items-center">
                      <Camera className="w-5 h-5 text-[#005787] mr-2" />
                      Google Posts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                      {validPosts.map((post, index) => (
                        <div key={index} className="border rounded-lg p-4">
                          <div className="font-semibold text-gray-900">{safeGet(post, 'title')}</div>
                          <div className="text-sm text-gray-600 mt-1">{safeGet(post, 'date', 'Datum unbekannt')}</div>
                          {safeGet(post, 'content') && (
                            <div className="text-gray-700 mt-2">{safeGet(post, 'content')}</div>
                          )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              ) : null;
            })()}

            {/* Google Reviews */}
            {safeGet(googleData, 'rating') && (
              <Card>
              <CardHeader>
                  <CardTitle className="flex items-center">
                    <Star className="w-5 h-5 text-[#005787] mr-2" />
                    Google Bewertungen
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center">
                      <Star className="w-5 h-5 text-yellow-400 fill-current" />
                      <span className="text-2xl font-bold ml-1">{safeGet(googleData, 'rating', '0')}</span>
                  </div>
                    <span className="text-gray-600">({safeGet(googleData, 'reviews', '0')} Bewertungen)</span>
                  </div>
                  
                  {/* Review Distribution */}
                  {(() => {
                    const hasReviewScores = [5, 4, 3, 2, 1].some(star => safeGet(googleData, `reviews_per_score_${star}`, 0) > 0);
                    return hasReviewScores ? (
                      <div className="space-y-2">
                        {[5, 4, 3, 2, 1].map(star => {
                          const count = safeGet(googleData, `reviews_per_score_${star}`, 0);
                          const total = safeGet(googleData, 'reviews', 1);
                          const percentage = total > 0 ? (count / total) * 100 : 0;
                          
                          return (
                            <div key={star} className="flex items-center space-x-2">
                              <span className="text-sm w-8">{star}★</span>
                              <div className="flex-1 bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-yellow-400 h-2 rounded-full" 
                                  style={{ width: `${percentage}%` }}
                                ></div>
                    </div>
                              <span className="text-sm text-gray-600 w-8">{count}</span>
                  </div>
                          );
                        })}
                      </div>
                    ) : null;
                  })()}
                
                  {/* Review Tags */}
                  {getReviewTags().length > 0 && (
                  <div>
                      <h4 className="font-semibold text-gray-700 mb-2">Bewertungsthemen:</h4>
                    <div className="flex flex-wrap gap-1">
                        {getReviewTags().map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-sm">
                            {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            )}

            {/* Popular Times */}
            {safeGet(googleData, 'popular_times') && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="w-5 h-5 text-[#005787] mr-2" />
                    Beliebte Zeiten
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-gray-600">
                    {safeGet(googleData, 'popular_times')}
                    </div>
                </CardContent>
              </Card>
                  )}
                    </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Service Offers */}
            {getServiceTypes().length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <div className="w-5 h-5 mr-2 flex items-center justify-center">
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <g transform="translate(4, 4) scale(0.08)">
                          <path fill="#005787" d="M13.26,32.17C2.94,26.92,4.13,21.08,14.49,21.69L16.81,26,21.6,11.16C23.48,5.31,26.61,0,32.74,0H93.92c6.13,0,9.67,5.21,11.15,11.16l3.59,14.42,2.07-3.89c10.66-.62,11.61,5.57.33,10.92l1.83,2.81c6.63,6.81,6.78,13.61,5.91,28.41a27.21,27.21,0,0,0-3.49-1.77c-14.43-6-22.66.15-30.47,6-2.54,1.9-5,3.72-6.29,3.71L44.34,72c-.52,0-1,0-1.27-.08l-.17-.06h0l-.15,0a6.07,6.07,0,0,1-1.34-.72c-.94-.61-2.35-1.69-4.27-3.2-6.26-4.93-13.56-7.46-20.81-7.06a26.53,26.53,0,0,0-12,3.59C3.21,51,2.48,39.15,13.26,32.17Zm19,17.13L19,47.63c-3.12-.34-4,1-2.89,3.66l1.42,3.47a5,5,0,0,0,1.79,2,6.05,6.05,0,0,0,3,.82l11.78.09c2.85,0,4.08-1.15,3.19-3.76a6.37,6.37,0,0,0-5-4.6Zm58.38,0,13.21-1.67c3.12-.34,4,1,2.9,3.66l-1.43,3.47a5,5,0,0,1-1.79,2,6,6,0,0,1-3,.82l-11.78.09c-2.85,0-4.08-1.15-3.19-3.76a6.39,6.39,0,0,1,5-4.6Zm-68.86-20h81.59l-3.6-15c-1-4.56-3.82-8.51-8.5-8.51H34.77c-4.67,0-7.07,4.06-8.5,8.51l-4.5,15v0Z"/>
                          <path fill="#005787" d="M11.28,107.32c-5.06-2.1-9.12-6.7-11.28-12.43,20.09,9.85,28.19-16.43,4.09-18,7.63-8.65,18.48-8.24,27.07-1.48,4.05,3.19,6.34,4.81,8.71,5.55a14.79,14.79,0,0,0,4.26.6l34.34-.24C89.68,81.48,95.86,64.44,111.6,71c5.06,2.1,9.11,6.71,11.28,12.43-20.09-9.85-28.2,16.44-4.09,18-7.63,8.65-18.48,8.25-27.07,1.48-3.76-3-6.08-6.41-13.67-6.43l-33.28.43a15.42,15.42,0,0,0-4.84.7,17.74,17.74,0,0,0-4.1,2.25c-8.09,5.52-14,11.92-24.55,7.52Z"/>
                        </g>
                      </svg>
                    </div>
                    Service-Angebote
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {getServiceTypes().map((service, index) => (
                      <Badge key={index} variant="outline" className="text-sm bg-green-50 text-green-700 border-green-200">
                        {translateServiceType(service)}
                      </Badge>
                    ))}
                    </div>
                </CardContent>
              </Card>
            )}

            {/* Networks & Partnerships */}
            {getNetworks().length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Network className="w-5 h-5 text-[#005787] mr-2" />
                    Netzwerke & Partnerschaften
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {getNetworks().map((network, index) => (
                      <Badge key={index} variant="outline" className="text-sm bg-blue-50 text-[#005787] border-blue-200">
                        {network}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Location & Navigation */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <div className="w-5 h-5 mr-2 flex items-center justify-center">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <g transform="translate(4, 4) scale(0.08)">
                        <path fill="#005787" d="M13.26,32.17C2.94,26.92,4.13,21.08,14.49,21.69L16.81,26,21.6,11.16C23.48,5.31,26.61,0,32.74,0H93.92c6.13,0,9.67,5.21,11.15,11.16l3.59,14.42,2.07-3.89c10.66-.62,11.61,5.57.33,10.92l1.83,2.81c6.63,6.81,6.78,13.61,5.91,28.41a27.21,27.21,0,0,0-3.49-1.77c-14.43-6-22.66.15-30.47,6-2.54,1.9-5,3.72-6.29,3.71L44.34,72c-.52,0-1,0-1.27-.08l-.17-.06h0l-.15,0a6.07,6.07,0,0,1-1.34-.72c-.94-.61-2.35-1.69-4.27-3.2-6.26-4.93-13.56-7.46-20.81-7.06a26.53,26.53,0,0,0-12,3.59C3.21,51,2.48,39.15,13.26,32.17Zm19,17.13L19,47.63c-3.12-.34-4,1-2.89,3.66l1.42,3.47a5,5,0,0,0,1.79,2,6.05,6.05,0,0,0,3,.82l11.78.09c2.85,0,4.08-1.15,3.19-3.76a6.37,6.37,0,0,0-5-4.6Zm58.38,0,13.21-1.67c3.12-.34,4,1,2.9,3.66l-1.43,3.47a5,5,0,0,1-1.79,2,6,6,0,0,1-3,.82l-11.78.09c-2.85,0-4.08-1.15-3.19-3.76a6.39,6.39,0,0,1,5-4.6Zm-68.86-20h81.59l-3.6-15c-1-4.56-3.82-8.51-8.5-8.51H34.77c-4.67,0-7.07,4.06-8.5,8.51l-4.5,15v0Z"/>
                        <path fill="#005787" d="M11.28,107.32c-5.06-2.1-9.12-6.7-11.28-12.43,20.09,9.85,28.19-16.43,4.09-18,7.63-8.65,18.48-8.24,27.07-1.48,4.05,3.19,6.34,4.81,8.71,5.55a14.79,14.79,0,0,0,4.26.6l34.34-.24C89.68,81.48,95.86,64.44,111.6,71c5.06,2.1,9.11,6.71,11.28,12.43-20.09-9.85-28.2,16.44-4.09,18-7.63,8.65-18.48,8.25-27.07,1.48-3.76-3-6.08-6.41-13.67-6.43l-33.28.43a15.42,15.42,0,0,0-4.84.7,17.74,17.74,0,0,0-4.1,2.25c-8.09,5.52-14,11.92-24.55,7.52Z"/>
                      </g>
                    </svg>
                  </div>
                  Standort & Navigation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Map */}
                  <div className="h-64 bg-gray-200 rounded-lg overflow-hidden">
                    <div ref={mapRef} className="w-full h-full"></div>
                </div>
                
                  {/* Route Planning */}
                  <div className="space-y-2">
                    <Button 
                      className="w-full bg-[#005787] hover:bg-[#004066]"
                      onClick={() => {
                        const coordinates = getCoordinates();
                        if (coordinates) {
                          const address = `${safeGet(workshop, 'street', '')} ${safeGet(workshop, 'house_number', '')}, ${safeGet(workshop, 'zip_code', '')} ${safeGet(workshop, 'city', '')}`;
                          const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;
                          window.open(mapsUrl, '_blank');
                        }
                      }}
                    >
                      <MapPin className="w-4 h-4 mr-2" />
                      Route planen
                    </Button>
                        </div>
                    </div>
              </CardContent>
            </Card>

            {/* Company Photo */}
            {getCompanyPhoto() && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Camera className="w-5 h-5 text-[#005787] mr-2" />
                    Foto der Werkstatt
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="rounded-lg overflow-hidden shadow-sm">
                    <img 
                      src={getCompanyPhoto()} 
                      alt={`${safeGet(workshop, 'name', 'Werkstatt')} Foto`}
                      className="w-full h-64 object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
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
                Wichtiger Hinweis zu den Daten
              </h3>
              <div className="text-xs text-gray-600 space-y-1">
                <p>Die bereitgestellten Daten dienen ausschließlich als Beispiel („Sample") und dürfen nur in Stichproben zur Qualitätsüberprüfung verwendet werden. Eine vollständige Nutzung, Weitergabe oder sonstige Verwertung ist nicht gestattet.</p>
                <p>Jede Verwendung der Daten muss vom Verwender eigenverantwortlich auf ihre DSGVO-Konformität geprüft werden. auteon erteilt mit der Bereitstellung ausdrücklich keine Rechte zur Nutzung der Daten außerhalb der geltenden datenschutzrechtlichen Bestimmungen.</p>
                <p>Die Daten stammen nicht aus vertraulichen Informationen, die Werkstätten auteon im Rahmen der Nutzung von auteon übermittelt haben oder daraus entstanden sind.</p>
                <p><strong>Alle Daten ohne Gewähr.</strong></p>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default DetailPageComprehensive;
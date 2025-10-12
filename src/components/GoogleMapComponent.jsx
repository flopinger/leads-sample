import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import carRepairIcon from '../assets/car-repair-mechanic-icon.svg';

const GoogleMapComponent = ({ workshops = [], selectedWorkshop = null }) => {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [markers, setMarkers] = useState([]);
  const [markerClusterer, setMarkerClusterer] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Function to extract coordinates from workshop data
  const getCoordinates = (workshop) => {
    // Try GOOGLE_BUSINESS relationship first
    const googleBusiness = workshop.relationships?.find(rel => rel.handle === 'GOOGLE_BUSINESS');
    if (googleBusiness?.source_data) {
      try {
        const sourceData = typeof googleBusiness.source_data === 'string' 
          ? JSON.parse(googleBusiness.source_data) 
          : googleBusiness.source_data;
        
        if (sourceData.latitude && sourceData.longitude) {
          return { 
            lat: parseFloat(sourceData.latitude), 
            lng: parseFloat(sourceData.longitude) 
          };
        }
      } catch (e) {
        console.warn('Could not parse GOOGLE_BUSINESS data for', workshop.name);
      }
    }

    // Try OPENSTREETMAP_NOMINATIM as fallback
    const osmData = workshop.relationships?.find(rel => rel.handle === 'OPENSTREETMAP_NOMINATIM');
    if (osmData?.source_data) {
      try {
        const sourceData = typeof osmData.source_data === 'string' 
          ? JSON.parse(osmData.source_data) 
          : osmData.source_data;
        
        if (sourceData.lat && sourceData.lon) {
          return { 
            lat: parseFloat(sourceData.lat), 
            lng: parseFloat(sourceData.lon) 
          };
        }
      } catch (e) {
        console.warn('Could not parse OPENSTREETMAP_NOMINATIM data for', workshop.name);
      }
    }

    return null;
  };

  useEffect(() => {
    // Load Google Maps API
    const loadGoogleMaps = () => {
      try {
        if (window.google) {
          initializeMap();
          return;
        }

        const script = document.createElement('script');
        // Try using environment variable first, fallback to hardcoded key
        const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyBnZCMO3gcBqlT7C8tRf_1NaKfIMy50EGc';
        console.log('Using Google Maps API key:', apiKey);
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&v=3.56`;
        script.async = true;
        script.defer = true;
        script.onload = initializeMap;
        script.onerror = () => {
          setError('Failed to load Google Maps API');
          setLoading(false);
        };
        document.head.appendChild(script);
      } catch (err) {
        setError('Error loading Google Maps');
        setLoading(false);
      }
    };

    const initializeMap = () => {
      if (!mapRef.current) return;

      try {
        const mapInstance = new window.google.maps.Map(mapRef.current, {
          center: { lat: 51.1657, lng: 10.4515 }, // Center of Germany
          zoom: 6,
          styles: [
            {
              featureType: 'poi',
              elementType: 'labels',
              stylers: [{ visibility: 'off' }]
            }
          ]
        });

        setMap(mapInstance);
        setLoading(false);
      } catch (err) {
        console.error('Error initializing map:', err);
        setError('Error initializing Google Maps');
        setLoading(false);
      }
    };

    // Global error handler for Google Maps API
    window.gm_authFailure = () => {
      setError('Google Maps API authentication failed. Please check the API key.');
      setLoading(false);
    };

    loadGoogleMaps();
  }, []);

  useEffect(() => {
    if (!map || !workshops.length) return;

    // Clear existing markers and clusterer
    markers.forEach(marker => marker.setMap(null));
    if (markerClusterer) {
      markerClusterer.clearMarkers();
    }

    const newMarkers = [];
    

    // Add markers for all workshops
    workshops.forEach((workshop, index) => {
      const coords = getCoordinates(workshop);
      if (!coords) return;

      const marker = new window.google.maps.Marker({
        position: coords,
        map: map,
        title: workshop.name,
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

      // Build address string
      const addressParts = [];
      if (workshop.street) addressParts.push(workshop.street);
      if (workshop.house_number) addressParts.push(workshop.house_number);
      const address = addressParts.length > 0 ? addressParts.join(' ') : 'Adresse nicht verfügbar';
      
      // Add info window
      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div style="padding: 16px; max-width: 300px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
            <h3 style="margin: 0 0 12px 0; color: #005787; font-size: 16px; font-weight: 600; line-height: 1.3;">
              ${workshop.name}
            </h3>
            <div style="margin-bottom: 8px;">
              <p style="margin: 0 0 4px 0; font-size: 14px; color: #374151; line-height: 1.4;">
                ${address}
              </p>
              <p style="margin: 0 0 4px 0; font-size: 14px; color: #374151; line-height: 1.4;">
                ${workshop.zip_code} ${workshop.city}
              </p>
              ${workshop.telephone ? `
                <p style="margin: 0; font-size: 14px; color: #374151; line-height: 1.4;">
                  📞 ${workshop.telephone}
                </p>
              ` : ''}
            </div>
            <div style="margin-top: 12px;">
              <button id="detail-btn-${workshop.id}" style="display: inline-block; background-color: #005787; color: white; padding: 8px 16px; border-radius: 6px; text-decoration: none; font-size: 14px; font-weight: 500; transition: background-color 0.2s; border: none; cursor: pointer;">
                Details anzeigen →
              </button>
            </div>
          </div>
        `
      });

      marker.addListener('click', () => {
        infoWindow.open(map, marker);
        
        // Add event listener for the detail link after the info window opens
        setTimeout(() => {
          const detailButton = document.getElementById(`detail-btn-${workshop.id}`);
          if (detailButton && !detailButton.hasAttribute('data-listener-added')) {
            detailButton.setAttribute('data-listener-added', 'true');
            detailButton.addEventListener('click', (e) => {
              e.preventDefault();
              navigate(`/detail/${workshop.id}`);
            });
          }
        }, 100);
      });

      newMarkers.push(marker);
    });
    
    setMarkers(newMarkers);

    // Fit map to show all markers
    if (newMarkers.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      newMarkers.forEach(marker => {
        bounds.extend(marker.getPosition());
      });
      map.fitBounds(bounds);

      // Ensure minimum zoom level
      const listener = window.google.maps.event.addListener(map, 'idle', () => {
        if (map.getZoom() > 10) map.setZoom(10);
        window.google.maps.event.removeListener(listener);
      });
    }
  }, [map, workshops]);

  // Highlight selected workshop
  useEffect(() => {
    if (!map || !selectedWorkshop || !markers.length) return;

    const coords = getCoordinates(selectedWorkshop);
    if (!coords) return;

    const selectedMarker = markers.find(marker => {
      const markerPos = marker.getPosition();
      return Math.abs(markerPos.lat() - coords.lat) < 0.001 &&
             Math.abs(markerPos.lng() - coords.lng) < 0.001;
    });

    if (selectedMarker) {
      map.setCenter(selectedMarker.getPosition());
      map.setZoom(12);

      // Animate marker
      selectedMarker.setAnimation(window.google.maps.Animation.BOUNCE);
      setTimeout(() => {
        selectedMarker.setAnimation(null);
      }, 2000);
    }
  }, [selectedWorkshop, map, markers]);

  if (error) {
    return (
      <div className="w-full h-full relative">
        <div className="w-full h-full bg-gradient-to-br from-red-50 to-red-100 rounded-lg flex items-center justify-center" style={{ minHeight: '400px' }}>
          <div className="text-center p-8">
            <div className="bg-red-500 text-white p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Google Maps Fehler</h3>
            <p className="text-sm text-gray-600 mb-4">
              {error}
            </p>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <p className="text-xs text-gray-500 mb-2">Verfügbare Werkstätten ({workshops.length}):</p>
              <div className="flex flex-wrap gap-2">
                {workshops.slice(0, 8).map((workshop, index) => (
                  <span key={index} className="bg-[#005787] text-white px-2 py-1 rounded text-xs">
                    {workshop.city}
                  </span>
                ))}
                {workshops.length > 8 && (
                  <span className="bg-gray-200 text-gray-600 px-2 py-1 rounded text-xs">
                    +{workshops.length - 8} weitere
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative">
      <div 
        ref={mapRef} 
        className="w-full h-full rounded-lg"
        style={{ minHeight: '400px' }}
      />
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#005787] mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Google Maps wird geladen...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoogleMapComponent;

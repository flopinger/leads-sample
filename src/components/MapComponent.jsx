import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in Leaflet with Webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const MapComponent = ({ data }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);

  useEffect(() => {
    if (!mapRef.current) return;

    // Initialize map if not already done
    if (!mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapRef.current).setView([51.1657, 10.4515], 6); // Center of Germany

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(mapInstanceRef.current);
    }

    // Clear existing markers
    markersRef.current.forEach(marker => {
      mapInstanceRef.current.removeLayer(marker);
    });
    markersRef.current = [];

    // Extract coordinates from data
    const validData = data.filter(item => {
      const coords = getCoordinates(item);
      return coords && coords.lat && coords.lng && !isNaN(coords.lat) && !isNaN(coords.lng);
    });

    console.log(`Found ${validData.length} entries with valid coordinates out of ${data.length} total`);

    if (validData.length === 0) {
      // Show message when no coordinates available
      const messageDiv = document.createElement('div');
      messageDiv.innerHTML = `
        <div style="
          position: absolute; 
          top: 50%; 
          left: 50%; 
          transform: translate(-50%, -50%);
          background: white;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          text-align: center;
          z-index: 1000;
        ">
          <h3 style="margin: 0 0 10px 0; color: #333;">Koordinaten werden geladen...</h3>
          <p style="margin: 0; color: #666;">Für ${data.length} Einträge werden Standortdaten verarbeitet.</p>
        </div>
      `;
      mapRef.current.appendChild(messageDiv);
      
      setTimeout(() => {
        if (messageDiv.parentNode) {
          messageDiv.parentNode.removeChild(messageDiv);
        }
      }, 3000);
      
      return;
    }

    const bounds = L.latLngBounds();

    validData.forEach(item => {
      const coords = getCoordinates(item);
      const lat = parseFloat(coords.lat);
      const lng = parseFloat(coords.lng);

      if (!isNaN(lat) && !isNaN(lng)) {
        const marker = L.marker([lat, lng]).addTo(mapInstanceRef.current);
        
        // Create popup content
        const popupContent = `
          <div style="min-width: 200px;">
            <h3 style="margin: 0 0 8px 0; font-size: 14px; font-weight: bold;">
              ${item.name || 'Unbekannt'}
            </h3>
            <p style="margin: 0 0 8px 0; font-size: 12px; color: #666;">
              ${item.street || ''} ${item.house_number || ''}<br>
              ${item.zip_code || ''} ${item.city || ''}
            </p>
            ${item.contact_telephone ? `
              <p style="margin: 0 0 4px 0; font-size: 12px;">
                📞 ${item.contact_telephone}
              </p>
            ` : ''}
            ${item.email_1 ? `
              <p style="margin: 0 0 8px 0; font-size: 12px;">
                ✉️ ${item.email_1}
              </p>
            ` : ''}
            <a href="/detail/${item.id}" 
               style="
                 display: inline-block;
                 background: #036eb8;
                 color: white;
                 padding: 4px 8px;
                 text-decoration: none;
                 border-radius: 4px;
                 font-size: 12px;
                 margin-top: 8px;
               "
               onclick="event.preventDefault(); window.location.href='/detail/${item.id}';">
              Details anzeigen
            </a>
          </div>
        `;

        marker.bindPopup(popupContent);
        markersRef.current.push(marker);
        bounds.extend([lat, lng]);
      }
    });

    // Fit map to show all markers
    if (bounds.isValid()) {
      mapInstanceRef.current.fitBounds(bounds, { padding: [20, 20] });
    }

  }, [data]);

  // Function to extract coordinates from various sources
  const getCoordinates = (item) => {
    // Try GMAPS_CRAWLER first
    const gmapsData = item.relationships?.find(rel => rel.handle === 'GMAPS_CRAWLER');
    if (gmapsData?.source_data) {
      try {
        const sourceData = typeof gmapsData.source_data === 'string' 
          ? JSON.parse(gmapsData.source_data) 
          : gmapsData.source_data;
        
        if (sourceData.latitude && sourceData.longitude) {
          return { lat: sourceData.latitude, lng: sourceData.longitude };
        }
        if (sourceData.lat && sourceData.lng) {
          return { lat: sourceData.lat, lng: sourceData.lng };
        }
      } catch (e) {
        console.warn('Could not parse GMAPS_CRAWLER data for', item.name);
      }
    }

    // Try google_place_id if available (would need geocoding API)
    if (item.google_place_id) {
      // In a real implementation, you would use Google Places API here
      // For now, we'll try to geocode using the address
    }

    // Fallback: try to geocode using address (simplified)
    // In a real implementation, you would use a geocoding service
    return null;
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <div 
      ref={mapRef} 
      className="map-container"
      style={{ height: '400px', width: '100%' }}
    />
  );
};

export default MapComponent;

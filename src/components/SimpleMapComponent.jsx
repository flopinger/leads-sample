import React, { useEffect, useRef } from 'react';
import { MapPin } from 'lucide-react';

const SimpleMapComponent = ({ data, height = '400px' }) => {
  const mapRef = useRef(null);

  useEffect(() => {
    if (!mapRef.current || !data || data.length === 0) return;

    // Create a visual map representation with multiple pins
    const mapContainer = mapRef.current;
    mapContainer.innerHTML = '';
    
    // Create map background
    const mapDiv = document.createElement('div');
    mapDiv.className = 'relative w-full h-full bg-gradient-to-br from-blue-100 to-green-100 rounded-lg overflow-hidden';
    mapDiv.style.backgroundImage = `
      radial-gradient(circle at 20% 30%, rgba(59, 130, 246, 0.1) 0%, transparent 50%),
      radial-gradient(circle at 80% 70%, rgba(34, 197, 94, 0.1) 0%, transparent 50%),
      radial-gradient(circle at 60% 20%, rgba(168, 85, 247, 0.1) 0%, transparent 50%)
    `;
    
    // Add title
    const title = document.createElement('div');
    title.className = 'absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-lg shadow-sm';
    title.innerHTML = `<div class="flex items-center space-x-2">
      <svg class="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"></path>
      </svg>
      <span class="text-sm font-medium text-gray-700">${data.length} Werkstätten</span>
    </div>`;
    mapDiv.appendChild(title);
    
    // Add sample pins at different positions
    const pinPositions = [
      { top: '25%', left: '30%', city: 'Hamburg' },
      { top: '35%', left: '45%', city: 'Berlin' },
      { top: '50%', left: '25%', city: 'Köln' },
      { top: '60%', left: '40%', city: 'Frankfurt' },
      { top: '70%', left: '50%', city: 'München' },
      { top: '40%', left: '60%', city: 'Dresden' },
      { top: '30%', left: '20%', city: 'Bremen' },
      { top: '55%', left: '35%', city: 'Kassel' }
    ];
    
    pinPositions.slice(0, Math.min(8, Math.ceil(data.length / 100))).forEach((pos, index) => {
      const pin = document.createElement('div');
      pin.className = 'absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group';
      pin.style.top = pos.top;
      pin.style.left = pos.left;
      
      const count = Math.ceil(data.length / pinPositions.length);
      pin.innerHTML = `
        <div class="relative">
          <div class="w-6 h-6 bg-red-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center group-hover:scale-110 transition-transform">
            <div class="w-2 h-2 bg-white rounded-full"></div>
          </div>
          <div class="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-black/75 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            ${pos.city}: ~${count} Werkstätten
          </div>
        </div>
      `;
      mapDiv.appendChild(pin);
    });
    
    mapContainer.appendChild(mapDiv);
  }, [data, height]);

  if (!data || data.length === 0) {
    return (
      <div className="w-full h-96 bg-gray-100 flex items-center justify-center rounded-lg">
        <div className="text-center">
          <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-500">Keine Daten für Karte verfügbar</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full" style={{ height }}>
      <div ref={mapRef} className="w-full h-full rounded-lg overflow-hidden">
        <div className="w-full h-full bg-gray-100 flex items-center justify-center">
          <div className="text-center">
            <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500">Karte wird geladen...</p>
            <p className="text-sm text-gray-400 mt-1">{data.length} Werkstätten</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleMapComponent;

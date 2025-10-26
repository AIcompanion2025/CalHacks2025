import { useEffect, useRef } from 'react';
import { Place } from '@/types';

interface MapViewProps {
  places: Place[];
  selectedPlace: Place | null;
  onPlaceSelect: (place: Place) => void;
}

const MapView = ({ places, selectedPlace, onPlaceSelect }: MapViewProps) => {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // This would integrate with a real map service like Mapbox, Google Maps, or Leaflet
    // For now, we'll create a visual representation
    if (mapRef.current && places.length > 0) {
      // Clear previous content
      mapRef.current.innerHTML = '';
      
      // Create a simple visual representation
      const mapContainer = document.createElement('div');
      mapContainer.className = 'relative w-full h-full bg-gradient-to-br from-blue-100 to-green-100 dark:from-blue-900 dark:to-green-900';
      
      // Add places as markers
      places.forEach((place, index) => {
        const marker = document.createElement('div');
        marker.className = `absolute w-4 h-4 bg-red-500 rounded-full border-2 border-white shadow-lg cursor-pointer transform -translate-x-1/2 -translate-y-1/2 ${
          selectedPlace?.id === place.id ? 'ring-4 ring-blue-300 scale-125' : ''
        }`;
        
        // Position markers in a route-like pattern
        const x = 20 + (index * 15) + Math.random() * 10;
        const y = 30 + Math.sin(index * 0.5) * 20;
        
        marker.style.left = `${x}%`;
        marker.style.top = `${y}%`;
        
        marker.addEventListener('click', () => onPlaceSelect(place));
        
        // Add place name tooltip
        const tooltip = document.createElement('div');
        tooltip.className = 'absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 hover:opacity-100 transition-opacity';
        tooltip.textContent = place.name;
        marker.appendChild(tooltip);
        
        mapContainer.appendChild(marker);
      });
      
      // Add route line
      const routeLine = document.createElement('div');
      routeLine.className = 'absolute w-full h-1 bg-blue-500 opacity-30';
      routeLine.style.top = '50%';
      routeLine.style.transform = 'translateY(-50%)';
      mapContainer.appendChild(routeLine);
      
      mapRef.current.appendChild(mapContainer);
    }
  }, [places, selectedPlace, onPlaceSelect]);

  return (
    <div ref={mapRef} className="w-full h-full relative">
      {/* Fallback content */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-xl">🗺️</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-300 mb-2">
            Interactive Map
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {places.length > 0 
              ? `Showing ${places.length} places in your route`
              : 'Your route will appear here'
            }
          </p>
        </div>
      </div>
    </div>
  );
};

export default MapView;


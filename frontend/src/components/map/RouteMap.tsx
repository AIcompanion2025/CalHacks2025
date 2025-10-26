import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import { Icon, LatLngBounds } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Place, Route } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, Clock, MapPin, ExternalLink } from 'lucide-react';

// Fix for default Leaflet icons
delete (Icon.Default.prototype as any)._getIconUrl;
Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// Custom numbered markers
const createNumberedIcon = (number: number, isSelected: boolean = false) => {
  const color = isSelected ? '#ef4444' : '#3b82f6';
  const size = isSelected ? 35 : 30;
  
  return new Icon({
    iconUrl: `data:image/svg+xml;base64,${btoa(`
      <svg width="${size}" height="${size}" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" fill="${color}" stroke="white" stroke-width="2"/>
        <text x="12" y="16" text-anchor="middle" fill="white" font-size="12" font-weight="bold">${number}</text>
      </svg>
    `)}`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  });
};

// Component to fit map bounds to route
const FitBounds: React.FC<{ places: Place[] }> = ({ places }) => {
  const map = useMap();
  
  useEffect(() => {
    if (places.length > 0) {
      try {
        const validPlaces = places.filter(place => 
          place.coordinates && 
          typeof place.coordinates.lat === 'number' && 
          typeof place.coordinates.lng === 'number'
        );
        
        if (validPlaces.length > 0) {
          const bounds = new LatLngBounds(
            validPlaces.map(place => [place.coordinates.lat, place.coordinates.lng])
          );
          map.fitBounds(bounds, { padding: [20, 20] });
        }
      } catch (error) {
        console.error('Error fitting map bounds:', error);
      }
    }
  }, [map, places]);
  
  return null;
};

interface RouteMapProps {
  route: Route | null;
  selectedPlace: Place | null;
  onPlaceSelect: (place: Place) => void;
}

const RouteMap: React.FC<RouteMapProps> = ({ route, selectedPlace, onPlaceSelect }) => {
  const [mapCenter, setMapCenter] = useState<[number, number]>([37.8715, -122.2730]); // Berkeley default
  
  useEffect(() => {
    if (route && route.places.length > 0) {
      const centerLat = route.places.reduce((sum, place) => sum + place.coordinates.lat, 0) / route.places.length;
      const centerLng = route.places.reduce((sum, place) => sum + place.coordinates.lng, 0) / route.places.length;
      setMapCenter([centerLat, centerLng]);
    }
  }, [route]);

  if (!route || route.places.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800">
        <div className="text-center text-gray-500">
          <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium">No route to display</p>
          <p className="text-sm">Generate a route to see it visualized on the map</p>
        </div>
      </div>
    );
  }

  // Validate route data
  if (!route.places || !Array.isArray(route.places)) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800">
        <div className="text-center text-gray-500">
          <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium">Invalid route data</p>
          <p className="text-sm">Please try generating a new route</p>
        </div>
      </div>
    );
  }

  const routePath = route.places
    .filter(place => place.coordinates && typeof place.coordinates.lat === 'number' && typeof place.coordinates.lng === 'number')
    .map(place => [place.coordinates.lat, place.coordinates.lng] as [number, number]);

  return (
    <div className="h-full relative">
      <MapContainer
        center={mapCenter}
        zoom={13}
        className="h-full w-full"
        style={{ zIndex: 1 }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
        />
        
        {/* Fit bounds to show all places */}
        <FitBounds places={route.places} />
        
        {/* Route polyline */}
        {routePath.length > 1 && (
          <Polyline
            positions={routePath}
            color="#3b82f6"
            weight={4}
            opacity={0.8}
            dashArray="10, 10"
          />
        )}
        
        {/* Place markers */}
        {route.places.map((place, index) => (
          <Marker
            key={place.id}
            position={[place.coordinates.lat, place.coordinates.lng]}
            icon={createNumberedIcon(index + 1, selectedPlace?.id === place.id)}
            eventHandlers={{
              click: () => onPlaceSelect(place),
            }}
          >
            <Popup className="custom-popup">
              <div className="min-w-[200px]">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                    {index + 1}
                  </div>
                  <h3 className="font-semibold text-gray-900 truncate">
                    {place.name}
                  </h3>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-1 text-sm">
                    <Star className="h-4 w-4 text-yellow-500 fill-current" />
                    <span className="font-medium">{place.rating}</span>
                    <span className="text-gray-500">({place.review_count} reviews)</span>
                  </div>
                  
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <Clock className="h-4 w-4" />
                    <span>{place.walking_time} min walk</span>
                  </div>
                  
                  <p className="text-sm text-gray-700 line-clamp-2">
                    {place.description}
                  </p>
                  
                  <div className="flex flex-wrap gap-1 mt-2">
                    {place.tags.slice(0, 3).map((tag, tagIndex) => (
                      <Badge key={tagIndex} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  
                  <button
                    onClick={() => onPlaceSelect(place)}
                    className="w-full mt-2 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                  >
                    View Details
                  </button>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      
      {/* Route info overlay */}
      <div className="absolute top-4 left-4 z-10">
        <Card className="bg-white/90 backdrop-blur-sm">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-blue-600" />
              <span className="font-medium">{route.places.length} stops</span>
              <span className="text-gray-500">•</span>
              <Clock className="h-4 w-4 text-green-600" />
              <span className="font-medium">
                {Math.floor(route.total_walking_time / 60)}h {route.total_walking_time % 60}m
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RouteMap;

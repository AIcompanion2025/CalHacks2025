import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { GoogleMap, Marker, Polyline, InfoWindow, useLoadScript, DirectionsRenderer } from '@react-google-maps/api';
import { Place, Route } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, Clock, MapPin, Navigation, Sparkles } from 'lucide-react';

const mapContainerStyle = {
  width: '100%',
  height: '100%',
};

const mapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: true,
  fullscreenControl: true,
  styles: [
    {
      featureType: 'poi',
      elementType: 'labels',
      stylers: [{ visibility: 'off' }],
    },
  ],
};

interface GoogleRouteMapProps {
  route: Route | null;
  selectedPlace: Place | null;
  onPlaceSelect: (place: Place) => void;
}

const GoogleRouteMap: React.FC<GoogleRouteMapProps> = ({ route, selectedPlace, onPlaceSelect }) => {
  const [activeMarker, setActiveMarker] = useState<Place | null>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [directionsService, setDirectionsService] = useState<google.maps.DirectionsService | null>(null);
  const [directionsResult, setDirectionsResult] = useState<google.maps.DirectionsResult | null>(null);
  const [directionsLoading, setDirectionsLoading] = useState(false);
  const [routeStats, setRouteStats] = useState<{duration: string, distance: string} | null>(null);

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: 'AIzaSyBdiibSY28S5DStZl_ChdaB5PH7SqvBj-Y',
    libraries: ['places'],
  });

  const center = useMemo(() => {
    if (route && route.places.length > 0) {
      const centerLat = route.places.reduce((sum, place) => sum + place.coordinates.lat, 0) / route.places.length;
      const centerLng = route.places.reduce((sum, place) => sum + place.coordinates.lng, 0) / route.places.length;
      return { lat: centerLat, lng: centerLng };
    }
    return { lat: 37.8715, lng: -122.2730 }; // Default Berkeley center
  }, [route]);

  const routePath = useMemo(() => {
    if (!route || route.places.length === 0) return [];
    return route.places.map(place => ({
      lat: place.coordinates.lat,
      lng: place.coordinates.lng,
    }));
  }, [route]);

  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
    setDirectionsService(new google.maps.DirectionsService());
    
    if (route && route.places.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      route.places.forEach(place => {
        bounds.extend(new google.maps.LatLng(place.coordinates.lat, place.coordinates.lng));
      });
      map.fitBounds(bounds, { top: 50, right: 50, bottom: 50, left: 50 });
    }
  }, [route]);

  // Calculate directions when route changes
  useEffect(() => {
    if (directionsService && route && route.places.length > 1) {
      setDirectionsLoading(true);
      
      const waypoints = route.places.slice(1, -1).map(place => ({
        location: new google.maps.LatLng(place.coordinates.lat, place.coordinates.lng),
        stopover: true
      }));

      const request: google.maps.DirectionsRequest = {
        origin: new google.maps.LatLng(route.places[0].coordinates.lat, route.places[0].coordinates.lng),
        destination: new google.maps.LatLng(
          route.places[route.places.length - 1].coordinates.lat, 
          route.places[route.places.length - 1].coordinates.lng
        ),
        waypoints: waypoints,
        travelMode: google.maps.TravelMode.WALKING,
        optimizeWaypoints: true
      };

              directionsService.route(request, (result, status) => {
                setDirectionsLoading(false);
                if (status === google.maps.DirectionsStatus.OK && result) {
                  setDirectionsResult(result);
                  
                  // Extract accurate route stats from Google Directions API
                  const route = result.routes[0];
                  const leg = route.legs[0];
                  const totalDuration = route.legs.reduce((total, leg) => total + leg.duration.value, 0);
                  const totalDistance = route.legs.reduce((total, leg) => total + leg.distance.value, 0);
                  
                  setRouteStats({
                    duration: `${Math.floor(totalDuration / 60)}h ${totalDuration % 60}m`,
                    distance: `${(totalDistance / 1000).toFixed(1)} km`
                  });
                  
                  // Fit map to show the entire route
                  if (map) {
                    const bounds = new google.maps.LatLngBounds();
                    result.routes[0].overview_path.forEach(point => {
                      bounds.extend(point);
                    });
                    map.fitBounds(bounds, { top: 50, right: 50, bottom: 50, left: 50 });
                  }
                } else {
                  console.error('Directions request failed due to ' + status);
                  setDirectionsResult(null);
                  setRouteStats(null);
                }
              });
    }
  }, [directionsService, route, map]);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  const handleMarkerClick = (place: Place) => {
    setActiveMarker(place);
    onPlaceSelect(place);
  };

  const handleInfoWindowClose = () => {
    setActiveMarker(null);
  };

  const getDirectionsUrl = (place: Place) => {
    return `https://www.google.com/maps/dir/?api=1&destination=${place.coordinates.lat},${place.coordinates.lng}`;
  };

  if (!isLoaded) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800">
        <div className="text-center text-gray-500">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg font-medium">Loading Map...</p>
          <p className="text-sm">Please wait while we initialize Google Maps</p>
        </div>
      </div>
    );
  }

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

  return (
    <div className="h-full relative">
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={center}
        zoom={13}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={mapOptions}
      >
                {/* Directions Renderer with colored segments */}
                {directionsResult && (
                  <DirectionsRenderer
                    directions={directionsResult}
                    options={{
                      suppressMarkers: true, // We'll use our custom markers
                      polylineOptions: {
                        strokeColor: '#3b82f6', // Blue for main route
                        strokeOpacity: 0.9,
                        strokeWeight: 6,
                        icons: [{
                          icon: {
                            path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                            scale: 4,
                            strokeColor: '#1d4ed8',
                            fillColor: '#3b82f6',
                            fillOpacity: 1,
                          },
                          offset: '100%',
                          repeat: '120px'
                        }],
                      },
                      suppressInfoWindows: true,
                    }}
                  />
                )}

        {/* Fallback Polyline if directions fail */}
        {!directionsResult && routePath.length > 1 && (
          <Polyline
            path={routePath}
            options={{
              strokeColor: '#f59e0b', // Amber for fallback route
              strokeOpacity: 0.8,
              strokeWeight: 5,
              geodesic: true,
              icons: [{
                icon: {
                  path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                  scale: 4,
                  strokeColor: '#d97706',
                  fillColor: '#f59e0b',
                  fillOpacity: 1,
                },
                offset: '100%',
                repeat: '120px'
              }],
            }}
          />
        )}

        {/* Place Markers */}
        {route.places.map((place, index) => {
          const isSelected = selectedPlace?.id === place.id;
          const isFirst = index === 0;
          const isLast = index === route.places.length - 1;
          
          // Different colors for different marker types
          let markerColor = '#3b82f6'; // Default blue
          if (isFirst) markerColor = '#10b981'; // Green for start
          if (isLast) markerColor = '#ef4444'; // Red for end
          if (isSelected) markerColor = '#8b5cf6'; // Purple for selected
          
          return (
            <Marker
              key={place.id}
              position={{ lat: place.coordinates.lat, lng: place.coordinates.lng }}
              onClick={() => handleMarkerClick(place)}
              icon={{
                url: `data:image/svg+xml;base64,${btoa(`
                  <svg width="48" height="48" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="24" cy="24" r="22" fill="${markerColor}" stroke="white" stroke-width="4"/>
                    <text x="24" y="30" text-anchor="middle" fill="white" font-size="16" font-weight="bold" font-family="Arial, sans-serif">${index + 1}</text>
                    ${isFirst ? '<text x="24" y="42" text-anchor="middle" fill="white" font-size="9" font-weight="bold" font-family="Arial, sans-serif">START</text>' : ''}
                    ${isLast ? '<text x="24" y="42" text-anchor="middle" fill="white" font-size="9" font-weight="bold" font-family="Arial, sans-serif">END</text>' : ''}
                  </svg>
                `)}`,
                scaledSize: new google.maps.Size(48, 48),
                anchor: new google.maps.Point(24, 24),
              }}
            />
          );
        })}

        {/* Info Window */}
        {activeMarker && (
          <InfoWindow
            position={{ lat: activeMarker.coordinates.lat, lng: activeMarker.coordinates.lng }}
            onCloseClick={handleInfoWindowClose}
          >
            <div className="p-2 min-w-[250px]">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                  {route.places.findIndex(p => p.id === activeMarker.id) + 1}
                </div>
                <h3 className="font-semibold text-gray-900 truncate">
                  {activeMarker.name}
                </h3>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-1 text-sm">
                  <Star className="h-4 w-4 text-yellow-500 fill-current" />
                  <span className="font-medium">{activeMarker.rating}</span>
                  <span className="text-gray-500">({activeMarker.reviewCount} reviews)</span>
                </div>
                
                <div className="flex items-center gap-1 text-sm text-gray-600">
                  <Clock className="h-4 w-4" />
                  <span>{activeMarker.walkingTime} min walk</span>
                </div>
                
                <p className="text-sm text-gray-700 line-clamp-2">
                  {activeMarker.description}
                </p>
                
                <div className="flex flex-wrap gap-1 mt-2">
                  {activeMarker.tags.slice(0, 3).map((tag, tagIndex) => (
                    <Badge key={tagIndex} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
                
                <div className="flex gap-2 mt-3">
                  <a
                    href={getDirectionsUrl(activeMarker)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors text-center"
                  >
                    <Navigation className="h-3 w-3 inline mr-1" />
                    Directions
                  </a>
                  <button
                    onClick={() => onPlaceSelect(activeMarker)}
                    className="flex-1 px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 transition-colors"
                  >
                    View Details
                  </button>
                </div>
              </div>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>

              {/* Route Info Overlay */}
              <div className="absolute top-4 left-4 z-10">
                <Card className="bg-white/95 backdrop-blur-sm shadow-xl border border-gray-200">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                        <MapPin className="h-4 w-4 text-blue-600" />
                        <span className="font-semibold text-gray-800">{route.places.length} stops</span>
                      </div>
                      <span className="text-gray-400">•</span>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-blue-600" />
                        <span className="font-semibold text-gray-800">
                          {routeStats ? routeStats.duration : `${Math.floor(route.totalWalkingTime / 60)}h ${route.totalWalkingTime % 60}m`}
                        </span>
                      </div>
                      {routeStats && (
                        <>
                          <span className="text-gray-400">•</span>
                          <div className="flex items-center gap-2">
                            <Navigation className="h-4 w-4 text-blue-600" />
                            <span className="font-semibold text-gray-800">{routeStats.distance}</span>
                          </div>
                        </>
                      )}
                      {directionsLoading && (
                        <>
                          <span className="text-gray-400">•</span>
                          <div className="flex items-center gap-2">
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                            <span className="text-xs text-blue-600 font-medium">Calculating route...</span>
                          </div>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

      {/* Route Name Overlay */}
      <div className="absolute top-4 right-4 z-10">
        <Card className="bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-xl border-0">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              <h2 className="font-semibold text-sm truncate max-w-[200px]">
                {route.name}
              </h2>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default GoogleRouteMap;

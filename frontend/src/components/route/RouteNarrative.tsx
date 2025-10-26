import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, MapPin, Star, Users, DollarSign, Sparkles, ExternalLink, Navigation, Globe } from 'lucide-react';
import { Route } from '@/types';

interface RouteNarrativeProps {
  route: Route;
}

const RouteNarrative: React.FC<RouteNarrativeProps> = ({ route }) => {
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const getPriceLevelText = (level: number) => {
    switch (level) {
      case 1: return 'Budget';
      case 2: return 'Moderate';
      case 3: return 'Upscale';
      case 4: return 'Luxury';
      default: return 'Varies';
    }
  };

  const getPriceLevelColor = (level: number) => {
    switch (level) {
      case 1: return 'bg-green-100 text-green-800';
      case 2: return 'bg-yellow-100 text-yellow-800';
      case 3: return 'bg-orange-100 text-orange-800';
      case 4: return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };


  return (
    <div className="space-y-4">
      {/* Route Header - Compact */}
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-800 dark:to-gray-900 shadow-md">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-4 w-4 text-blue-600" />
            <CardTitle className="text-lg font-bold text-blue-900 dark:text-white">
              {route.name}
            </CardTitle>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="flex items-center gap-1 text-xs">
              <Clock className="h-3 w-3" />
              {formatDuration(route.totalWalkingTime)}
            </Badge>
            <Badge variant="secondary" className="flex items-center gap-1 text-xs">
              <MapPin className="h-3 w-3" />
              {route.places.length} stops
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
            Discover {route.places.length} carefully selected places that match your interests.
          </p>
        </CardContent>
      </Card>

      {/* Route Stats - Compact */}
      <div className="grid grid-cols-1 gap-3">
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Star className="h-4 w-4 text-yellow-500" />
            <span className="text-lg font-bold text-gray-900 dark:text-white">
              {(route.places.reduce((sum, place) => sum + place.rating, 0) / route.places.length).toFixed(1)}
            </span>
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">Avg Rating</div>
        </div>
      </div>

      {/* Places List - Compact */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <MapPin className="h-4 w-4 text-blue-600" />
          Route Stops
        </h3>
        
        <div className="space-y-2">
          {route.places.map((place, index) => (
            <div key={place.id} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <div className="flex items-start gap-3">
                {/* Stop Number */}
                <div className="flex-shrink-0">
                  <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                    {index + 1}
                  </div>
                </div>
                
                {/* Place Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-1">
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white text-sm truncate">
                        {place.name}
                      </h4>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {place.category}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-1 text-xs">
                      <Star className="h-3 w-3 text-yellow-500 fill-current" />
                      <span className="font-medium">{place.rating}</span>
                    </div>
                  </div>
                  
                  <p className="text-xs text-gray-700 dark:text-gray-300 mb-2 line-clamp-2">
                    {place.description}
                  </p>
                  
                  {/* AI Summary - More prominent */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 p-2 rounded-md mb-2 border-l-2 border-blue-300 dark:border-blue-700">
                    <div className="flex items-start gap-1 mb-1">
                      <Sparkles className="h-3 w-3 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                      <p className="text-xs font-medium text-blue-900 dark:text-blue-100">AI Insight:</p>
                    </div>
                    <p className="text-xs italic text-blue-800 dark:text-blue-200 ml-4">
                      "{place.aiSummary}"
                    </p>
                  </div>
                  
                  <div className="flex flex-wrap gap-1 mb-2">
                    <Badge variant="outline" className="text-xs h-5 px-1">
                      <Clock className="h-2 w-2 mr-1" />
                      {place.walkingTime}m
                    </Badge>
                    
                    <Badge 
                      variant="outline" 
                      className={`text-xs h-5 px-1 ${getPriceLevelColor(place.priceLevel)}`}
                    >
                      <DollarSign className="h-2 w-2 mr-1" />
                      {getPriceLevelText(place.priceLevel)}
                    </Badge>
                  </div>
                  
                  {/* Compact Links */}
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs h-6 px-2"
                      onClick={() => {
                        const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name + ' ' + place.coordinates.lat + ',' + place.coordinates.lng)}`;
                        window.open(googleMapsUrl, '_blank');
                      }}
                    >
                      <Navigation className="h-3 w-3" />
                    </Button>
                    
                    {place.website && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs h-6 px-2"
                        onClick={() => window.open(place.website, '_blank')}
                      >
                        <Globe className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RouteNarrative;

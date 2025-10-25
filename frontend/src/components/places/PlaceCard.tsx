import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Place } from '@/types';
import { MapPin, Clock, Car, Star, DollarSign } from 'lucide-react';

interface PlaceCardProps {
  place: Place;
  onViewDetails: (place: Place) => void;
  onAddToRoute?: (place: Place) => void;
  showAddButton?: boolean;
}

const PlaceCard = ({ place, onViewDetails, onAddToRoute, showAddButton = false }: PlaceCardProps) => {
  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer overflow-hidden h-full flex flex-col">
      {/* Place Image */}
      <div className="relative h-48 w-full overflow-hidden bg-gradient-to-br from-indigo-100 to-purple-100">
        <img 
          src={place.imageUrl} 
          alt={place.name}
          className="w-full h-full object-cover"
          onError={(e) => {
            // Fallback to gradient background if image fails to load
            e.currentTarget.style.display = 'none';
          }}
        />
        <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm rounded-full px-2 py-1 flex items-center gap-1 shadow-sm">
          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
          <span className="text-sm font-medium">{place.rating}</span>
        </div>
      </div>

      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-lg line-clamp-1">{place.name}</CardTitle>
            <CardDescription className="mt-1">{place.category}</CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3 flex-1 flex flex-col">
        <p className="text-sm text-muted-foreground line-clamp-2 flex-1">{place.aiSummary}</p>
        
        <div className="flex flex-wrap gap-1">
          {place.vibe.slice(0, 3).map(vibe => (
            <Badge key={vibe} variant="secondary" className="text-xs">
              {vibe}
            </Badge>
          ))}
        </div>

        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>{place.walkingTime} min</span>
          </div>
          <div className="flex items-center gap-1">
            <Car className="w-4 h-4" />
            <span>{place.drivingTime} min</span>
          </div>
          <div className="flex items-center">
            {Array.from({ length: place.priceLevel || 1 }).map((_, i) => (
              <DollarSign key={i} className="w-3 h-3" />
            ))}
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1"
            onClick={() => onViewDetails(place)}
          >
            <MapPin className="w-4 h-4 mr-1" />
            Details
          </Button>
          {showAddButton && onAddToRoute && (
            <Button 
              size="sm" 
              className="flex-1"
              onClick={() => onAddToRoute(place)}
            >
              Add to Route
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PlaceCard;
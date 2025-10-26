import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Place } from '@/types';
import { Star } from 'lucide-react';

interface CompactPlaceCardProps {
  place: Place;
  onClick: (place: Place) => void;
}

const CompactPlaceCard = ({ place, onClick }: CompactPlaceCardProps) => {
  return (
    <Card 
      className="hover:shadow-md transition-all cursor-pointer overflow-hidden h-full"
      onClick={() => onClick(place)}
    >
      <div className="relative h-32 w-full overflow-hidden bg-gradient-to-br from-indigo-100 to-purple-100">
        <img 
          src={place.imageUrl} 
          alt={place.name}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
        <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm rounded-full px-2 py-0.5 flex items-center gap-1 shadow-sm">
          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
          <span className="text-xs font-medium">{place.rating}</span>
        </div>
      </div>
      
      <div className="p-3 space-y-2">
        <div>
          <h4 className="font-semibold text-sm line-clamp-1">{place.name}</h4>
          <p className="text-xs text-muted-foreground">{place.category}</p>
        </div>
        
        <div className="flex flex-wrap gap-1">
          {place.vibe.slice(0, 2).map(vibe => (
            <Badge key={vibe} variant="secondary" className="text-xs px-1.5 py-0">
              {vibe}
            </Badge>
          ))}
        </div>
      </div>
    </Card>
  );
};

export default CompactPlaceCard;
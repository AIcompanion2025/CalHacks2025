import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { mockPlaces } from '@/data/mockPlaces';
import { Place } from '@/types';
import { ArrowLeft, MapPin, Clock, Car, Star, DollarSign, Navigation } from 'lucide-react';

const PlaceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [place, setPlace] = useState<Place | null>(null);

  useEffect(() => {
    const foundPlace = mockPlaces.find(p => p.id === id);
    if (foundPlace) {
      setPlace(foundPlace);
    }
  }, [id]);

  const handleGetDirections = () => {
    if (place) {
      const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${place.coordinates.lat},${place.coordinates.lng}`;
      window.open(mapsUrl, '_blank');
    }
  };

  if (!place) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Place not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Place Information */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-2xl">{place.name}</CardTitle>
                    <CardDescription className="text-lg mt-1">{place.category}</CardDescription>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    <span className="font-bold text-lg">{place.rating}</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">AI Summary</h4>
                  <p className="text-muted-foreground">{place.aiSummary}</p>
                </div>

                <Separator />

                <div>
                  <h4 className="font-semibold mb-2">Description</h4>
                  <p className="text-muted-foreground">{place.description}</p>
                </div>

                <Separator />

                <div>
                  <h4 className="font-semibold mb-2">Vibe</h4>
                  <div className="flex flex-wrap gap-2">
                    {place.vibe.map(v => (
                      <Badge key={v} variant="secondary">{v}</Badge>
                    ))}
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm">Walking Time</span>
                    </div>
                    <p className="font-semibold">{place.walkingTime} minutes</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <Car className="w-4 h-4" />
                      <span className="text-sm">Driving Time</span>
                    </div>
                    <p className="font-semibold">{place.drivingTime} minutes</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <DollarSign className="w-4 h-4" />
                      <span className="text-sm">Price Level</span>
                    </div>
                    <div className="flex">
                      {Array.from({ length: place.priceLevel || 1 }).map((_, i) => (
                        <DollarSign key={i} className="w-4 h-4" />
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <Star className="w-4 h-4" />
                      <span className="text-sm">Reviews</span>
                    </div>
                    <p className="font-semibold">{place.reviewCount} reviews</p>
                  </div>
                </div>

                <Button className="w-full" size="lg" onClick={handleGetDirections}>
                  <Navigation className="w-4 h-4 mr-2" />
                  Get Directions
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Map View */}
          <div className="space-y-6">
            <Card className="h-[600px]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Location
                </CardTitle>
              </CardHeader>
              <CardContent className="h-[calc(100%-80px)]">
                <iframe
                  width="100%"
                  height="100%"
                  style={{ border: 0, borderRadius: '8px' }}
                  loading="lazy"
                  allowFullScreen
                  src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${place.coordinates.lat},${place.coordinates.lng}&zoom=15`}
                ></iframe>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlaceDetail;
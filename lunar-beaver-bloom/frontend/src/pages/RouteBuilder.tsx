import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import PlaceCard from '@/components/places/PlaceCard';
import { mockPlaces } from '@/data/mockPlaces';
import { getUser, saveRoute } from '@/utils/storage';
import { generateRouteNarrative, calculateStreetCred } from '@/utils/aiMock';
import { Place, Route, User } from '@/types';
import { ArrowLeft, Plus, X, Sparkles, Save, MapPin } from 'lucide-react';
import { toast } from 'sonner';

const RouteBuilder = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [routeName, setRouteName] = useState('');
  const [selectedPlaces, setSelectedPlaces] = useState<Place[]>([]);
  const [availablePlaces, setAvailablePlaces] = useState<Place[]>(mockPlaces);
  const [filterCategory, setFilterCategory] = useState<string>('all');

  useEffect(() => {
    const currentUser = getUser();
    if (currentUser) {
      setUser(currentUser);
    }
  }, []);

  const categories = ['all', 'Café', 'Restaurant', 'Park', 'Shopping', 'Historic Site', 'Bookstore', 'Gallery', 'Attraction'];

  const filteredPlaces = filterCategory === 'all' 
    ? availablePlaces 
    : availablePlaces.filter(p => p.category === filterCategory);

  const handleAddPlace = (place: Place) => {
    if (selectedPlaces.find(p => p.id === place.id)) {
      toast.error('This place is already in your route');
      return;
    }
    setSelectedPlaces([...selectedPlaces, place]);
    toast.success(`Added ${place.name} to your route`);
  };

  const handleRemovePlace = (placeId: string) => {
    setSelectedPlaces(selectedPlaces.filter(p => p.id !== placeId));
  };

  const handleSaveRoute = () => {
    if (!routeName.trim()) {
      toast.error('Please enter a route name');
      return;
    }
    if (selectedPlaces.length < 2) {
      toast.error('Please add at least 2 places to your route');
      return;
    }

    const totalWalkingTime = selectedPlaces.reduce((sum, place) => sum + place.walkingTime, 0);
    const totalDrivingTime = selectedPlaces.reduce((sum, place) => sum + place.drivingTime, 0);
    const narrative = generateRouteNarrative(selectedPlaces);

    const newRoute: Route = {
      id: Date.now().toString(),
      name: routeName,
      places: selectedPlaces,
      totalWalkingTime,
      totalDrivingTime,
      narrative,
      createdAt: new Date().toISOString()
    };

    saveRoute(newRoute);
    
    // Update user's street cred
    if (user) {
      const routes = JSON.parse(localStorage.getItem('ai_city_companion_routes') || '[]');
      user.streetCred = calculateStreetCred(user.visitedPlaces.length, routes.length);
      localStorage.setItem('ai_city_companion_user', JSON.stringify(user));
    }

    toast.success('Route saved successfully!');
    navigate('/routes');
  };

  const handleViewDetails = (place: Place) => {
    navigate(`/place/${place.id}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <Button variant="ghost" onClick={() => navigate('/')} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Create Custom Route</h1>
          <p className="text-muted-foreground">
            Build your perfect exploration route by selecting places
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Route Builder Panel */}
          <div className="lg:col-span-1 space-y-4">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-600" />
                  Your Route
                </CardTitle>
                <CardDescription>
                  {selectedPlaces.length} {selectedPlaces.length === 1 ? 'place' : 'places'} selected
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="routeName">Route Name</Label>
                  <Input
                    id="routeName"
                    value={routeName}
                    onChange={(e) => setRouteName(e.target.value)}
                    placeholder="e.g., Morning Coffee Walk"
                    className="mt-1"
                  />
                </div>

                <Separator />

                {selectedPlaces.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No places selected yet</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedPlaces.map((place, index) => (
                      <div
                        key={place.id}
                        className="flex items-center justify-between p-2 bg-muted rounded-lg"
                      >
                        <div className="flex items-center gap-2 flex-1">
                          <Badge variant="outline">{index + 1}</Badge>
                          <span className="text-sm font-medium truncate">{place.name}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemovePlace(place.id)}
                          className="h-8 w-8"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {selectedPlaces.length > 0 && (
                  <>
                    <Separator />
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total Walking Time:</span>
                        <span className="font-semibold">
                          {selectedPlaces.reduce((sum, p) => sum + p.walkingTime, 0)} min
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total Driving Time:</span>
                        <span className="font-semibold">
                          {selectedPlaces.reduce((sum, p) => sum + p.drivingTime, 0)} min
                        </span>
                      </div>
                    </div>
                  </>
                )}

                <Button
                  className="w-full"
                  onClick={handleSaveRoute}
                  disabled={selectedPlaces.length < 2 || !routeName.trim()}
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Route
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Available Places */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Select Places</CardTitle>
                <CardDescription>
                  Choose places to add to your route
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 mb-4">
                  {categories.map(category => (
                    <Badge
                      key={category}
                      variant={filterCategory === category ? 'default' : 'outline'}
                      className="cursor-pointer capitalize"
                      onClick={() => setFilterCategory(category)}
                    >
                      {category}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredPlaces.map(place => (
                <PlaceCard
                  key={place.id}
                  place={place}
                  onViewDetails={handleViewDetails}
                  onAddToRoute={handleAddPlace}
                  showAddButton={true}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RouteBuilder;
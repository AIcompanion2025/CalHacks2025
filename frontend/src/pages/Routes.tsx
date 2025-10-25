import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { getRoutes, saveRoute } from '@/utils/storage';
import { Route } from '@/types';
import { ArrowLeft, MapPin, Clock, Car, Trash2, Plus } from 'lucide-react';

const Routes = () => {
  const navigate = useNavigate();
  const [routes, setRoutes] = useState<Route[]>([]);

  useEffect(() => {
    setRoutes(getRoutes());
  }, []);

  const handleDeleteRoute = (routeId: string) => {
    if (confirm('Are you sure you want to delete this route?')) {
      const updatedRoutes = routes.filter(r => r.id !== routeId);
      localStorage.setItem('ai_city_companion_routes', JSON.stringify(updatedRoutes));
      setRoutes(updatedRoutes);
    }
  };

  const handleViewRoute = (route: Route) => {
    // Navigate to first place in the route
    if (route.places.length > 0) {
      navigate(`/place/${route.places[0].id}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={() => navigate('/')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
          <Button onClick={() => navigate('/route-builder')}>
            <Plus className="w-4 h-4 mr-2" />
            Create New Route
          </Button>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">My Routes</h1>
          <p className="text-muted-foreground">
            Your saved exploration routes
          </p>
        </div>

        {routes.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <MapPin className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No routes yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first custom route to start exploring!
              </p>
              <Button onClick={() => navigate('/route-builder')}>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Route
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {routes.map(route => (
              <Card key={route.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle>{route.name}</CardTitle>
                      <CardDescription className="mt-1">
                        {route.places.length} stops • Created {new Date(route.createdAt).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteRoute(route.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {route.narrative}
                  </p>

                  <Separator />

                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm">Stops:</h4>
                    <div className="flex flex-wrap gap-2">
                      {route.places.map((place, index) => (
                        <Badge key={place.id} variant="secondary">
                          {index + 1}. {place.name}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{route.totalWalkingTime} min walk</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Car className="w-4 h-4" />
                      <span>{route.totalDrivingTime} min drive</span>
                    </div>
                  </div>

                  <Button 
                    className="w-full" 
                    onClick={() => handleViewRoute(route)}
                  >
                    <MapPin className="w-4 h-4 mr-2" />
                    View Route
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Routes;
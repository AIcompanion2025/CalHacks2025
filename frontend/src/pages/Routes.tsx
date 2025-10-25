import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getRoutes } from '@/utils/storage';
import { Route } from '@/types';
import { MapPin, Clock, Plus, Trash2 } from 'lucide-react';

const Routes = () => {
  const navigate = useNavigate();
  const [routes, setRoutes] = useState<Route[]>([]);

  useEffect(() => {
    setRoutes(getRoutes());
  }, []);

  const handleDeleteRoute = (routeId: string) => {
    if (confirm('Delete this route?')) {
      const updatedRoutes = routes.filter(r => r.id !== routeId);
      localStorage.setItem('ai_city_companion_routes', JSON.stringify(updatedRoutes));
      setRoutes(updatedRoutes);
    }
  };

  const handleViewRoute = (route: Route) => {
    if (route.places.length > 0) {
      navigate(`/place/${route.places[0].id}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Mobile Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-10">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold">My Routes</h1>
              <p className="text-xs text-muted-foreground">
                {routes.length} saved {routes.length === 1 ? 'route' : 'routes'}
              </p>
            </div>
            <Button size="sm" onClick={() => navigate('/route-builder')}>
              <Plus className="w-4 h-4 mr-1" />
              New
            </Button>
          </div>
        </div>
      </header>

      <div className="px-4 py-4">
        {routes.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <MapPin className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No routes yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Create your first route to start exploring!
              </p>
              <Button onClick={() => navigate('/route-builder')}>
                <Plus className="w-4 h-4 mr-2" />
                Create Route
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {routes.map(route => (
              <Card key={route.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base truncate">{route.name}</CardTitle>
                      <CardDescription className="text-xs">
                        {route.places.length} stops • {new Date(route.createdAt).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteRoute(route.id)}
                      className="text-destructive hover:text-destructive flex-shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {route.narrative}
                  </p>

                  <div className="flex flex-wrap gap-1">
                    {route.places.slice(0, 3).map((place, index) => (
                      <Badge key={place.id} variant="secondary" className="text-xs">
                        {index + 1}. {place.name}
                      </Badge>
                    ))}
                    {route.places.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{route.places.length - 3} more
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{route.totalWalkingTime} min</span>
                    </div>
                  </div>

                  <Button 
                    className="w-full" 
                    size="sm"
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
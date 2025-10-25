import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getUser, getRoutes, clearAllData } from '@/utils/storage';
import { calculateLevel, getLevelTitle, getStreetCredForNextLevel } from '@/utils/aiMock';
import { User } from '@/types';
import { TrendingUp, MapPin, Award, Settings } from 'lucide-react';

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [routeCount, setRouteCount] = useState(0);

  useEffect(() => {
    const currentUser = getUser();
    if (currentUser) {
      setUser(currentUser);
      setRouteCount(getRoutes().length);
    }
  }, []);

  const handleResetData = () => {
    if (confirm('Reset all data? This cannot be undone.')) {
      clearAllData();
      navigate('/onboarding');
    }
  };

  if (!user) return null;

  const userLevel = calculateLevel(user.streetCred);
  const levelTitle = getLevelTitle(userLevel);
  const nextLevelCred = getStreetCredForNextLevel(userLevel);
  const currentLevelCred = (userLevel - 1) * 100;
  const credInCurrentLevel = user.streetCred - currentLevelCred;
  const credNeededForNext = nextLevelCred - currentLevelCred;
  const progressPercent = (credInCurrentLevel / credNeededForNext) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Mobile Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-10">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold">Profile</h1>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
            <Settings className="w-5 h-5 text-muted-foreground" />
          </div>
        </div>
      </header>

      <div className="px-4 py-4 space-y-4">
        {/* User Info */}
        <Card>
          <CardContent className="pt-6 pb-4">
            <div className="text-center mb-4">
              <h2 className="text-2xl font-bold mb-1">{user.name}</h2>
              <p className="text-sm text-muted-foreground">{levelTitle}</p>
            </div>
            
            <div className="bg-muted rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-indigo-600" />
                  <span className="text-sm font-semibold">Level {userLevel}</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {credInCurrentLevel} / {credNeededForNext}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                <div 
                  className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300" 
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                {user.streetCred} Street Cred
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardContent className="pt-4 pb-4 text-center">
              <MapPin className="w-8 h-8 mx-auto mb-2 text-indigo-600" />
              <p className="text-2xl font-bold">{user.visitedPlaces.length}</p>
              <p className="text-xs text-muted-foreground">Places</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4 text-center">
              <TrendingUp className="w-8 h-8 mx-auto mb-2 text-indigo-600" />
              <p className="text-2xl font-bold">{routeCount}</p>
              <p className="text-xs text-muted-foreground">Routes</p>
            </CardContent>
          </Card>
        </div>

        {/* Preferences */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Your Preferences</CardTitle>
            <CardDescription className="text-xs">What you love to explore</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <h4 className="text-sm font-semibold mb-2">Moods</h4>
              <div className="flex flex-wrap gap-1">
                {user.preferences.mood.map(mood => (
                  <Badge key={mood} variant="secondary" className="text-xs">{mood}</Badge>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold mb-2">Interests</h4>
              <div className="flex flex-wrap gap-1">
                {user.preferences.interests.map(interest => (
                  <Badge key={interest} variant="secondary" className="text-xs">{interest}</Badge>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold mb-2">Atmosphere</h4>
              <div className="flex flex-wrap gap-1">
                {user.preferences.atmosphere.map(atm => (
                  <Badge key={atm} variant="secondary" className="text-xs">{atm}</Badge>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="text-center p-2 bg-muted rounded">
                <p className="text-xs text-muted-foreground">Pace</p>
                <p className="text-sm font-semibold capitalize">{user.preferences.pace}</p>
              </div>
              <div className="text-center p-2 bg-muted rounded">
                <p className="text-xs text-muted-foreground">Budget</p>
                <p className="text-sm font-semibold capitalize">{user.preferences.budget}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Level Up Card */}
        <Card className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-0">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-base">Level Up!</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-indigo-100 mb-3">
              Earn {credNeededForNext - credInCurrentLevel} more Street Cred to reach Level {userLevel + 1}!
            </p>
            <div className="space-y-1 text-sm text-indigo-100 mb-3">
              <p>• Visit new places (+10 cred)</p>
              <p>• Create routes (+25 cred)</p>
            </div>
            <Button variant="secondary" className="w-full" size="sm" onClick={() => navigate('/')}>
              Explore More
            </Button>
          </CardContent>
        </Card>

        {/* Settings */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" className="w-full justify-start text-sm" size="sm">
              Edit Preferences
            </Button>
            <Button 
              variant="destructive" 
              className="w-full justify-start text-sm"
              size="sm"
              onClick={handleResetData}
            >
              Reset All Data
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
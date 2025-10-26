import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { getUser, getRoutes, clearAllData } from '@/utils/storage';
import { calculateLevel, getLevelTitle, getStreetCredForNextLevel } from '@/utils/aiMock';
import { User } from '@/types';
import { ArrowLeft, TrendingUp, MapPin, Award, Settings } from 'lucide-react';

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
    if (confirm('Are you sure you want to reset all data? This cannot be undone.')) {
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
      <div className="container mx-auto px-4 py-8">
        <Button variant="ghost" onClick={() => navigate('/')} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Info */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Profile</CardTitle>
                <CardDescription>Your exploration journey</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2">{user.name}</h3>
                  <p className="text-muted-foreground">{user.email}</p>
                </div>

                <Separator />

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Award className="w-5 h-5 text-indigo-600" />
                      Explorer Level
                    </h4>
                    <div className="text-right">
                      <div className="text-2xl font-bold">Level {userLevel}</div>
                      <p className="text-sm text-muted-foreground">{user.streetCred} Street Cred</p>
                    </div>
                  </div>
                  
                  <div className="bg-muted rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-indigo-600">{levelTitle}</span>
                      <span className="text-sm text-muted-foreground">
                        {credInCurrentLevel} / {credNeededForNext} to Level {userLevel + 1}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                      <div 
                        className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300" 
                        style={{ width: `${progressPercent}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <MapPin className="w-8 h-8 mx-auto mb-2 text-indigo-600" />
                    <p className="text-2xl font-bold">{user.visitedPlaces.length}</p>
                    <p className="text-sm text-muted-foreground">Places Visited</p>
                    <p className="text-xs text-muted-foreground mt-1">+10 cred each</p>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <TrendingUp className="w-8 h-8 mx-auto mb-2 text-indigo-600" />
                    <p className="text-2xl font-bold">{routeCount}</p>
                    <p className="text-sm text-muted-foreground">Routes Created</p>
                    <p className="text-xs text-muted-foreground mt-1">+25 cred each</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Your Preferences</CardTitle>
                <CardDescription>What makes your perfect exploration</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Moods</h4>
                  <div className="flex flex-wrap gap-2">
                    {user.preferences.mood.map(mood => (
                      <Badge key={mood} variant="secondary">{mood}</Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Interests</h4>
                  <div className="flex flex-wrap gap-2">
                    {user.preferences.interests.map(interest => (
                      <Badge key={interest} variant="secondary">{interest}</Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Atmosphere</h4>
                  <div className="flex flex-wrap gap-2">
                    {user.preferences.atmosphere.map(atm => (
                      <Badge key={atm} variant="secondary">{atm}</Badge>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Pace</p>
                    <p className="font-semibold capitalize">{user.preferences.pace}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Budget</p>
                    <p className="font-semibold capitalize">{user.preferences.budget}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Settings */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  Edit Preferences
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  Privacy Settings
                </Button>
                <Button 
                  variant="destructive" 
                  className="w-full justify-start"
                  onClick={handleResetData}
                >
                  Reset All Data
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
              <CardHeader>
                <CardTitle className="text-white">Level Up!</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-indigo-100 mb-4">
                  Earn {credNeededForNext - credInCurrentLevel} more Street Cred to reach Level {userLevel + 1}!
                </p>
                <div className="space-y-2 text-sm text-indigo-100 mb-4">
                  <p>• Visit new places (+10 cred)</p>
                  <p>• Create routes (+25 cred)</p>
                </div>
                <Button variant="secondary" className="w-full" onClick={() => navigate('/')}>
                  Explore More
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
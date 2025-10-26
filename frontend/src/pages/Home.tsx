import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import CompactPlaceCard from '@/components/places/CompactPlaceCard';
import AppLogo from '@/components/logo/AppLogo';
import { getUser } from '@/utils/storage';
import { generatePersonalizedRecommendations, calculateLevel, getLevelTitle } from '@/utils/aiMock';
import { Place, User } from '@/types';
import { Sparkles, Award, Loader2 } from 'lucide-react';
import { api } from '@/utils/api';
import { toast } from 'sonner';

const Home = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [recommendations, setRecommendations] = useState<Place[]>([]);
  const [moodInput, setMoodInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    const currentUser = getUser();
    if (currentUser) {
      setUser(currentUser);
      const recs = generatePersonalizedRecommendations(
        currentUser.preferences.mood[0] || 'curious',
        60,
        currentUser.preferences.interests
      );
      setRecommendations(recs);
    }
  }, []);

  const handleMoodSearch = async () => {
    if (!user || !moodInput.trim()) {
      toast.error('Please enter how you\'re feeling');
      return;
    }

    setIsGenerating(true);
    try {
      // Call the AI route demo endpoint
      const response = await api.generateAIRouteDemo(
        `I'm feeling ${moodInput}. Show me places that match this mood in Berkeley, CA`,
        'Berkeley, CA'
      );

      if (response.error) {
        toast.error('Failed to generate recommendations');
        // Fallback to mock data
        const recs = generatePersonalizedRecommendations(
          moodInput || user.preferences.mood[0] || 'curious',
          60,
          user.preferences.interests
        );
        setRecommendations(recs);
      } else if (response.data?.route?.places) {
        // Convert AI route places to our Place format
        const aiPlaces: Place[] = response.data.route.places.map((place: any) => ({
          id: place.id,
          name: place.name,
          category: place.category,
          description: place.description,
          aiSummary: place.aiSummary || place.description,
          rating: place.rating,
          reviewCount: place.reviewCount,
          priceLevel: place.priceLevel,
          walkingTime: place.walkingTime,
          drivingTime: place.drivingTime,
          coordinates: place.coordinates,
          imageUrl: place.imageUrl,
          tags: place.tags || [],
          vibe: place.vibe || []
        }));
        setRecommendations(aiPlaces);
        toast.success(`Found ${aiPlaces.length} places for your mood!`);
      }
    } catch (error) {
      console.error('Error generating AI recommendations:', error);
      toast.error('Something went wrong. Using local recommendations.');
      // Fallback to mock data
      const recs = generatePersonalizedRecommendations(
        moodInput || user.preferences.mood[0] || 'curious',
        60,
        user.preferences.interests
      );
      setRecommendations(recs);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePlaceClick = (place: Place) => {
    navigate(`/place/${place.id}`);
  };

  const handleQuickMood = async (mood: string) => {
    setMoodInput(mood);
    if (!user) return;

    setIsGenerating(true);
    try {
      const response = await api.generateAIRouteDemo(
        `I'm feeling ${mood}. Show me places that match this mood in Berkeley, CA`,
        'Berkeley, CA'
      );

      if (response.error) {
        // Fallback to mock data
        const recs = generatePersonalizedRecommendations(mood, 60, user.preferences.interests);
        setRecommendations(recs);
      } else if (response.data?.route?.places) {
        const aiPlaces: Place[] = response.data.route.places.map((place: any) => ({
          id: place.id,
          name: place.name,
          category: place.category,
          description: place.description,
          aiSummary: place.aiSummary || place.description,
          rating: place.rating,
          reviewCount: place.reviewCount,
          priceLevel: place.priceLevel,
          walkingTime: place.walkingTime,
          drivingTime: place.drivingTime,
          coordinates: place.coordinates,
          imageUrl: place.imageUrl,
          tags: place.tags || [],
          vibe: place.vibe || []
        }));
        setRecommendations(aiPlaces);
        toast.success(`Found ${aiPlaces.length} places for ${mood} mood!`);
      }
    } catch (error) {
      console.error('Error generating AI recommendations:', error);
      const recs = generatePersonalizedRecommendations(mood, 60, user.preferences.interests);
      setRecommendations(recs);
    } finally {
      setIsGenerating(false);
    }
  };

  if (!user) return null;

  const userLevel = calculateLevel(user.streetCred);
  const levelTitle = getLevelTitle(userLevel);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Mobile Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-10">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AppLogo className="w-8 h-8" />
              <h1 className="text-lg font-bold">AI City Companion</h1>
            </div>
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-indigo-600" />
              <span className="text-sm font-semibold">Lv {userLevel}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="px-4 py-4 space-y-4">
        {/* Welcome Section */}
        <div>
          <h2 className="text-2xl font-bold mb-1">Welcome, {user.name}!</h2>
          <p className="text-sm text-muted-foreground">
            {levelTitle} • {user.streetCred} Street Cred
          </p>
        </div>

        {/* Mood Search */}
        <Card className="border-2 border-indigo-200 bg-gradient-to-br from-white to-indigo-50 dark:from-gray-800 dark:to-indigo-950">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              How are you feeling?
            </CardTitle>
            <CardDescription className="text-xs">
              Tell me your mood and I'll find perfect spots
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Input
                placeholder="e.g., relaxed, adventurous..."
                value={moodInput}
                onChange={(e) => setMoodInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleMoodSearch()}
                className="text-sm"
              />
              <Button onClick={handleMoodSearch} size="sm" disabled={isGenerating || !moodInput.trim()}>
                {isGenerating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
              </Button>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {['adventurous', 'relaxed', 'curious', 'energetic'].map(mood => (
                <Badge
                  key={mood}
                  variant={moodInput === mood ? 'default' : 'outline'}
                  className="cursor-pointer text-xs"
                  onClick={() => handleQuickMood(mood)}
                >
                  {mood}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recommendations */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-bold">For You</h3>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate('/route-builder')}
              className="text-xs"
            >
              Create Route
            </Button>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            {recommendations.slice(0, 6).map(place => (
              <CompactPlaceCard
                key={place.id}
                place={place}
                onClick={handlePlaceClick}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
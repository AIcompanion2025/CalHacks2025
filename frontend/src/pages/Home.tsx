import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import CompactPlaceCard from '@/components/places/CompactPlaceCard';
import WeatherCard from '@/components/weather/WeatherCard';
import CityInfoCard from '@/components/city/CityInfoCard';
import AppLogo from '@/components/logo/AppLogo';
import { getUser } from '@/utils/storage';
import { generatePersonalizedRecommendations, calculateLevel, getLevelTitle } from '@/utils/aiMock';
import { Place, User } from '@/types';
import { Sparkles, MapPin, TrendingUp, User as UserIcon, Award, DollarSign } from 'lucide-react';

const Home = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [recommendations, setRecommendations] = useState<Place[]>([]);
  const [moodInput, setMoodInput] = useState('');
  const [selectedPrice, setSelectedPrice] = useState<number | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<number | null>(null);

  useEffect(() => {
    const currentUser = getUser();
    if (currentUser) {
      setUser(currentUser);
      // Generate initial recommendations based on user preferences
      const recs = generatePersonalizedRecommendations(
        currentUser.preferences.mood[0] || 'curious',
        60,
        currentUser.preferences.interests
      );
      setRecommendations(recs);
    }
  }, []);

  const handleMoodSearch = () => {
    if (user) {
      let recs = generatePersonalizedRecommendations(
        moodInput || user.preferences.mood[0] || 'curious',
        selectedDuration || 60,
        user.preferences.interests
      );

      // Filter by price if selected
      if (selectedPrice !== null) {
        recs = recs.filter(place => place.priceLevel <= selectedPrice);
      }

      setRecommendations(recs);
    }
  };

  const handlePlaceClick = (place: Place) => {
    navigate(`/place/${place.id}`);
  };

  const handleQuickMood = (mood: string) => {
    setMoodInput(mood);
    if (user) {
      let recs = generatePersonalizedRecommendations(mood, selectedDuration || 60, user.preferences.interests);
      if (selectedPrice !== null) {
        recs = recs.filter(place => place.priceLevel <= selectedPrice);
      }
      setRecommendations(recs);
    }
  };

  const handleQuickPrice = (price: number) => {
    setSelectedPrice(price === selectedPrice ? null : price);
    if (user) {
      let recs = generatePersonalizedRecommendations(
        moodInput || user.preferences.mood[0] || 'curious',
        selectedDuration || 60,
        user.preferences.interests
      );
      if (price !== selectedPrice) {
        recs = recs.filter(place => place.priceLevel <= price);
      }
      setRecommendations(recs);
    }
  };

  const handleQuickDuration = (duration: number) => {
    setSelectedDuration(duration === selectedDuration ? null : duration);
    if (user) {
      let recs = generatePersonalizedRecommendations(
        moodInput || user.preferences.mood[0] || 'curious',
        duration === selectedDuration ? 60 : duration,
        user.preferences.interests
      );
      if (selectedPrice !== null) {
        recs = recs.filter(place => place.priceLevel <= selectedPrice);
      }
      setRecommendations(recs);
    }
  };

  if (!user) return null;

  const priceOptions = [
    { value: 1, label: '$' },
    { value: 2, label: '$$' },
    { value: 3, label: '$$$' }
  ];

  const durationOptions = [
    { value: 15, label: '15 min' },
    { value: 30, label: '30 min' },
    { value: 60, label: '1 hour' },
    { value: 120, label: '2+ hours' }
  ];

  const userLevel = calculateLevel(user.streetCred);
  const levelTitle = getLevelTitle(userLevel);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AppLogo className="w-8 h-8" />
              <h1 className="text-xl font-bold">AI City Companion</h1>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => navigate('/routes')}>
                <MapPin className="w-4 h-4 mr-2" />
                My Routes
              </Button>
              <Button variant="ghost" size="sm" onClick={() => navigate('/expenses')}>
                <DollarSign className="w-4 h-4 mr-2" />
                Expenses
              </Button>
              <Button variant="ghost" size="sm" onClick={() => navigate('/profile')}>
                <UserIcon className="w-4 h-4 mr-2" />
                Profile
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section with Street Cred and Weather side by side */}
        <div className="mb-8">
          <div className="mb-4">
            <h2 className="text-3xl font-bold mb-2">Welcome back, {user.name}!</h2>
            <p className="text-muted-foreground">
              Ready to discover something new in Downtown Berkeley?
            </p>
          </div>

          {/* Street Cred and Weather Cards - Always 50/50 Split */}
          <div className="flex gap-4 w-full">
            {/* Compact Street Cred Score - 50% width */}
            <Card className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-0 shadow-lg flex-1">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <Award className="w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0" />
                    <div>
                      <div className="text-xl sm:text-2xl font-bold">Level {userLevel}</div>
                      <div className="text-xs text-indigo-100 truncate">{levelTitle}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-base sm:text-lg font-semibold">{user.streetCred}</div>
                    <div className="text-xs text-indigo-100">Street Cred</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Compact Weather Card - 50% width */}
            <div className="flex-1">
              <WeatherCard />
            </div>
          </div>
        </div>

        {/* Compact Recommendations Carousel */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold">Recommended for You</h3>
            <Button variant="outline" size="sm" onClick={() => navigate('/route-builder')}>
              Create Custom Route
            </Button>
          </div>
          
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-2">
              {recommendations.map(place => (
                <CarouselItem key={place.id} className="pl-2 basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/5">
                  <CompactPlaceCard
                    place={place}
                    onClick={handlePlaceClick}
                  />
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="hidden md:flex" />
            <CarouselNext className="hidden md:flex" />
          </Carousel>
        </div>

        {/* Mood-Based Search - Highlighted */}
        <Card className="mb-8 border-2 border-indigo-200 bg-gradient-to-br from-white to-indigo-50 dark:from-gray-800 dark:to-indigo-950 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              How are you feeling today?
            </CardTitle>
            <CardDescription>
              Tell me your mood and I'll find the perfect spots for you
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="e.g., I want something quiet with vintage vibes and good coffee..."
                value={moodInput}
                onChange={(e) => setMoodInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleMoodSearch()}
              />
              <Button onClick={handleMoodSearch}>
                <Sparkles className="w-4 h-4 mr-2" />
                Find Places
              </Button>
            </div>
            
            {/* Quick Moods */}
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-sm text-muted-foreground font-medium">Quick moods:</span>
              {['adventurous', 'relaxed', 'curious', 'energetic'].map(mood => (
                <Badge
                  key={mood}
                  variant={moodInput === mood ? 'default' : 'outline'}
                  className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                  onClick={() => handleQuickMood(mood)}
                >
                  {mood}
                </Badge>
              ))}
            </div>

            {/* Quick Price */}
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-sm text-muted-foreground font-medium">Quick price:</span>
              {priceOptions.map(option => (
                <Badge
                  key={option.value}
                  variant={selectedPrice === option.value ? 'default' : 'outline'}
                  className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                  onClick={() => handleQuickPrice(option.value)}
                >
                  {option.label}
                </Badge>
              ))}
            </div>

            {/* Quick Duration */}
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-sm text-muted-foreground font-medium">Quick duration:</span>
              {durationOptions.map(option => (
                <Badge
                  key={option.value}
                  variant={selectedDuration === option.value ? 'default' : 'outline'}
                  className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                  onClick={() => handleQuickDuration(option.value)}
                >
                  {option.label}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* City Info Card */}
        <div className="mb-8">
          <CityInfoCard />
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <MapPin className="w-8 h-8 text-indigo-600" />
                <div>
                  <div className="text-2xl font-bold">{user.visitedPlaces.length}</div>
                  <div className="text-sm text-muted-foreground">Places Visited</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-8 h-8 text-indigo-600" />
                <div>
                  <div className="text-2xl font-bold">
                    {JSON.parse(localStorage.getItem('ai_city_companion_routes') || '[]').length}
                  </div>
                  <div className="text-sm text-muted-foreground">Routes Created</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-0">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Sparkles className="w-8 h-8" />
                <div>
                  <div className="text-2xl font-bold">Explore</div>
                  <div className="text-sm text-indigo-100">Start Your Adventure</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Home;
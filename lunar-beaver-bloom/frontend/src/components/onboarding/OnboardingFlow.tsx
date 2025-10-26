import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { User, UserPreferences } from '@/types';
import { saveUser, setOnboardingComplete } from '@/utils/storage';
import { calculateStreetCred } from '@/utils/aiMock';
import { Sparkles } from 'lucide-react';

const OnboardingFlow = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [preferences, setPreferences] = useState<UserPreferences>({
    mood: [],
    interests: [],
    pace: 'moderate',
    budget: 'moderate',
    atmosphere: []
  });

  const moodOptions = ['adventurous', 'relaxed', 'curious', 'energetic', 'contemplative', 'social'];
  const interestOptions = ['food', 'art', 'history', 'nature', 'shopping', 'culture', 'architecture', 'music'];
  const atmosphereOptions = ['quiet', 'lively', 'vintage', 'modern', 'cozy', 'spacious'];

  const toggleSelection = (category: keyof UserPreferences, value: string) => {
    setPreferences(prev => {
      const current = prev[category] as string[];
      if (current.includes(value)) {
        return { ...prev, [category]: current.filter(v => v !== value) };
      } else {
        return { ...prev, [category]: [...current, value] };
      }
    });
  };

  const handleComplete = () => {
    const newUser: User = {
      id: Date.now().toString(),
      name,
      email,
      streetCred: calculateStreetCred(0, 0),
      preferences,
      visitedPlaces: [],
      createdAt: new Date().toISOString()
    };
    
    saveUser(newUser);
    setOnboardingComplete();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-6 h-6 text-indigo-600" />
            <CardTitle>Welcome to AI City Companion</CardTitle>
          </div>
          <CardDescription>
            Let's personalize your experience in {step === 1 ? '3' : step === 2 ? '2' : '1'} quick steps
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Your Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="mt-1"
                />
              </div>
              <Button 
                onClick={() => setStep(2)} 
                disabled={!name || !email}
                className="w-full"
              >
                Continue
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <Label className="text-base mb-3 block">What's your typical mood when exploring?</Label>
                <div className="flex flex-wrap gap-2">
                  {moodOptions.map(mood => (
                    <Badge
                      key={mood}
                      variant={preferences.mood.includes(mood) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => toggleSelection('mood', mood)}
                    >
                      {mood}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-base mb-3 block">What interests you most?</Label>
                <div className="flex flex-wrap gap-2">
                  {interestOptions.map(interest => (
                    <Badge
                      key={interest}
                      variant={preferences.interests.includes(interest) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => toggleSelection('interests', interest)}
                    >
                      {interest}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-base mb-3 block">Preferred atmosphere?</Label>
                <div className="flex flex-wrap gap-2">
                  {atmosphereOptions.map(atm => (
                    <Badge
                      key={atm}
                      variant={preferences.atmosphere.includes(atm) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => toggleSelection('atmosphere', atm)}
                    >
                      {atm}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                  Back
                </Button>
                <Button 
                  onClick={() => setStep(3)} 
                  disabled={preferences.mood.length === 0 || preferences.interests.length === 0}
                  className="flex-1"
                >
                  Continue
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div>
                <Label className="text-base mb-3 block">What's your exploration pace?</Label>
                <div className="grid grid-cols-3 gap-2">
                  {(['slow', 'moderate', 'fast'] as const).map(pace => (
                    <Button
                      key={pace}
                      variant={preferences.pace === pace ? 'default' : 'outline'}
                      onClick={() => setPreferences(prev => ({ ...prev, pace }))}
                      className="capitalize"
                    >
                      {pace}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-base mb-3 block">Budget preference?</Label>
                <div className="grid grid-cols-3 gap-2">
                  {(['budget', 'moderate', 'luxury'] as const).map(budget => (
                    <Button
                      key={budget}
                      variant={preferences.budget === budget ? 'default' : 'outline'}
                      onClick={() => setPreferences(prev => ({ ...prev, budget }))}
                      className="capitalize"
                    >
                      {budget}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                  Back
                </Button>
                <Button onClick={handleComplete} className="flex-1">
                  Start Exploring
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OnboardingFlow;
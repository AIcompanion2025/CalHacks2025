import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { UserPreferences } from '@/types';
import { setOnboardingComplete } from '@/utils/storage';
import { api } from '@/utils/api';
import { Sparkles, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const OnboardingFlow = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState(0); // 0 = login/register choice, 1 = credentials, 2+ = preferences
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
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

  const handleAuth = async () => {
    if (!email || !password || (!isLogin && !name)) {
      toast({
        title: 'Missing fields',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = isLogin
        ? await api.login(email, password)
        : await api.register(name, email, password);

      if (response.error) {
        toast({
          title: 'Authentication failed',
          description: response.error,
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }

      toast({
        title: 'Success!',
        description: isLogin ? 'Logged in successfully' : 'Account created successfully',
      });

      if (isLogin) {
        // If logging in, skip preferences and go straight to app
        setOnboardingComplete();
        navigate('/');
      } else {
        // If registering, continue to preferences
        setStep(2);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleComplete = () => {
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
            {step === 0 ? 'Sign in or create an account to get started' :
             step === 1 ? 'Enter your credentials' :
             `Let's personalize your experience in ${step === 2 ? '2' : '1'} quick steps`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 0 && (
            <div className="space-y-4">
              <Button
                onClick={() => { setIsLogin(true); setStep(1); }}
                className="w-full"
                size="lg"
              >
                Sign In
              </Button>
              <Button
                onClick={() => { setIsLogin(false); setStep(1); }}
                variant="outline"
                className="w-full"
                size="lg"
              >
                Create Account
              </Button>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              {!isLogin && (
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
              )}
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
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="mt-1"
                  minLength={8}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setStep(0)}
                  className="flex-1"
                  disabled={isLoading}
                >
                  Back
                </Button>
                <Button
                  onClick={handleAuth}
                  disabled={isLoading || !email || !password || (!isLogin && !name)}
                  className="flex-1"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {isLogin ? 'Signing in...' : 'Creating account...'}
                    </>
                  ) : (
                    isLogin ? 'Sign In' : 'Continue'
                  )}
                </Button>
              </div>
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
                <Button
                  onClick={() => setStep(3)}
                  disabled={preferences.mood.length === 0 || preferences.interests.length === 0}
                  className="w-full"
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
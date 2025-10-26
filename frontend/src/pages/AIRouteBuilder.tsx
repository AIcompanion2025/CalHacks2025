import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { aiRouteService, AIRouteResponse, RouteSuggestion } from '@/services/aiRouteService';
import { Place, Route } from '@/types';
import { Sparkles, Loader2, ArrowLeft, MapPin, Clock, Users } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const AIRouteBuilder = () => {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState('');
  const [city, setCity] = useState('Berkeley, CA');
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiRoute, setAiRoute] = useState<Route | null>(null);
  const [suggestions, setSuggestions] = useState<RouteSuggestion[]>([]);

  const handleGenerateRoute = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Please enter a prompt",
        description: "Tell us what kind of route you're looking for",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const response: AIRouteResponse = await aiRouteService.generateRoute({
        prompt: prompt.trim()
        // City will be auto-detected from the prompt, or use the selected city
      });

      if (response.success && response.route) {
        const route = aiRouteService.convertAIRouteToRoute(response.route);
        setAiRoute(route);
        
        toast({
          title: "Route Generated!",
          description: `Created "${route.name}" with ${route.places.length} places`,
        });
      } else {
        toast({
          title: "Failed to generate route",
          description: response.error || "Please try again",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error generating route:', error);
      toast({
        title: "Error",
        description: "Failed to generate route. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSuggestionClick = (suggestion: RouteSuggestion) => {
    setPrompt(suggestion.prompt);
  };

  const handlePlaceClick = (place: Place) => {
    navigate(`/place/${place.id}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-10">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/')}
                className="p-1"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <h1 className="text-lg font-bold">AI Route Builder</h1>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              <span className="text-sm font-semibold">Powered by AI</span>
            </div>
          </div>
        </div>
      </header>

      <div className="px-4 py-4 space-y-4">
        {/* Route Generation Form */}
        <Card className="border-2 border-indigo-200 bg-gradient-to-br from-white to-indigo-50 dark:from-gray-800 dark:to-indigo-950">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              Create Your Perfect Route
            </CardTitle>
            <CardDescription className="text-xs">
              Describe what you're looking for and AI will create a personalized route
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">What kind of experience are you looking for?</label>
              <Textarea
                placeholder="e.g., I want to explore Berkeley's coffee culture with some great cafes and hidden gems..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="min-h-[80px]"
                disabled={isGenerating}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">City</label>
              <Select value={city} onValueChange={setCity} disabled={isGenerating}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Berkeley, CA">Berkeley, CA</SelectItem>
                  <SelectItem value="San Francisco, CA">San Francisco, CA</SelectItem>
                  <SelectItem value="Oakland, CA">Oakland, CA</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button 
              onClick={handleGenerateRoute}
              disabled={isGenerating || !prompt.trim()}
              className="w-full"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Generating Route...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate AI Route
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Quick Suggestions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Quick Suggestions</CardTitle>
            <CardDescription className="text-xs">
              Click any suggestion to auto-fill the form
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3">
              {[
                {
                  prompt: "Show me the best coffee shops and cafes in Berkeley",
                  theme: "Coffee Culture",
                  duration: "2-3 hours",
                  description: "Discover Berkeley's vibrant coffee scene"
                },
                {
                  prompt: "I want to explore Berkeley's parks and outdoor spaces",
                  theme: "Nature & Parks",
                  duration: "3-4 hours",
                  description: "Connect with nature in Berkeley's beautiful outdoor spaces"
                },
                {
                  prompt: "Find me some hidden gems and local favorites",
                  theme: "Hidden Gems",
                  duration: "2-3 hours",
                  description: "Discover places only locals know about"
                },
                {
                  prompt: "I'm interested in art and culture, what should I visit?",
                  theme: "Arts & Culture",
                  duration: "3-4 hours",
                  description: "Explore Berkeley's artistic and cultural side"
                }
              ].map((suggestion, index) => (
                <div
                  key={index}
                  className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  <div className="flex items-center justify-between mb-1">
                    <Badge variant="outline" className="text-xs">
                      {suggestion.theme}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {suggestion.duration}
                    </span>
                  </div>
                  <p className="text-sm font-medium mb-1">{suggestion.prompt}</p>
                  <p className="text-xs text-muted-foreground">{suggestion.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Generated Route */}
        {aiRoute && (
          <Card className="border-2 border-green-200 bg-gradient-to-br from-white to-green-50 dark:from-gray-800 dark:to-green-950">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Sparkles className="w-5 h-5 text-green-600" />
                {aiRoute.name}
              </CardTitle>
              <CardDescription className="text-sm">
                {aiRoute.narrative}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span>{aiRoute.places.length} places</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span>{aiRoute.totalWalkingTime} min walk</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span>AI Generated</span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {aiRoute.places.map((place, index) => (
                  <div
                    key={place.id}
                    className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    onClick={() => handlePlaceClick(place)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{place.name}</h4>
                      <div className="flex items-center gap-1">
                        <span className="text-sm text-muted-foreground">⭐ {place.rating}</span>
                        <span className="text-xs text-muted-foreground">({place.reviewCount})</span>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{place.description}</p>
                    <p className="text-xs italic text-indigo-600">{place.aiSummary}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {place.tags.slice(0, 3).map(tag => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AIRouteBuilder;

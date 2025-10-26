import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import GoogleRouteMap from '@/components/map/GoogleRouteMap';
import RouteNarrative from '@/components/route/RouteNarrative';
import { PanelGroup, Panel, PanelResizeHandle } from 'react-resizable-panels';
import { aiRouteService, AIRouteResponse } from '@/services/aiRouteService';
import { Place, User, Route } from '@/types';
import { getUser, saveRoute, getRoutes } from '@/utils/storage';
import { 
  Send, 
  Loader2, 
  MapPin, 
  Clock, 
  Star, 
  Navigation,
  Sparkles,
  MessageSquare,
  Map,
  Route as RouteIcon,
  ChevronRight,
  ExternalLink,
  Coffee, Palette, Mountain, Utensils, ShoppingBag, Music,
  Bookmark
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  route?: Route;
  places?: Place[];
}

// Helper function to extract city from current route
const extractCityFromCurrentRoute = (route: Route): string => {
  // Try to extract city from route name or places
  const routeName = route.name.toLowerCase();
  const placeNames = route.places.map(p => p.name.toLowerCase()).join(' ');
  
  // Check for common city indicators
  const cityIndicators = ['london', 'paris', 'new york', 'san francisco', 'berlin', 'rome', 'barcelona', 'tokyo', 'sydney'];
  
  for (const city of cityIndicators) {
    if (routeName.includes(city) || placeNames.includes(city)) {
      return city.charAt(0).toUpperCase() + city.slice(1);
    }
  }
  
  // Default fallback
  return 'London'; // Most common city for demo
};

const AIExplorer = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentRoute, setCurrentRoute] = useState<Route | null>(null); 
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [showSplitScreen, setShowSplitScreen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const currentUser = getUser();
    if (currentUser) {
      setUser(currentUser);
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const exampleRoutes = [
    {
      id: '1',
      title: 'Coffee Culture Tour',
      description: 'Discover the best coffee shops and cafes',
      duration: '2-3 hours',
      places: 4,
      category: 'Coffee',
      icon: <Coffee className="h-5 w-5" />,
      prompt: 'I want to explore coffee culture in Berkeley',
      image: '/api/placeholder/300/200'
    },
    {
      id: '2',
      title: 'Art Gallery Walk',
      description: 'Visit the most inspiring art galleries and museums',
      duration: '3-4 hours',
      places: 5,
      category: 'Arts & Culture',
      icon: <Palette className="h-5 w-5" />,
      prompt: 'Show me the best art galleries and museums in Berkeley',
      image: '/api/placeholder/300/200'
    },
    {
      id: '3',
      title: 'Nature & Parks',
      description: 'Explore beautiful parks and outdoor spaces',
      duration: '2-3 hours',
      places: 3,
      category: 'Nature',
      icon: <Mountain className="h-5 w-5" />,
      prompt: 'I want to visit parks and nature spots in Berkeley',
      image: '/api/placeholder/300/200'
    },
    {
      id: '4',
      title: 'Foodie Adventure',
      description: 'Taste the best local restaurants and food spots',
      duration: '3-4 hours',
      places: 6,
      category: 'Food & Drink',
      icon: <Utensils className="h-5 w-5" />,
      prompt: 'Find me the best restaurants and food spots in Berkeley',
      image: '/api/placeholder/300/200'
    },
    {
      id: '5',
      title: 'Shopping & Markets',
      description: 'Discover unique shops and local markets',
      duration: '2-3 hours',
      places: 4,
      category: 'Shopping',
      icon: <ShoppingBag className="h-5 w-5" />,
      prompt: 'Show me the best shopping areas and markets in Berkeley',
      image: '/api/placeholder/300/200'
    },
    {
      id: '6',
      title: 'Live Music & Nightlife',
      description: 'Experience the vibrant music scene and evening entertainment',
      duration: '3-5 hours',
      places: 3,
      category: 'Entertainment',
      icon: <Music className="h-5 w-5" />,
      prompt: 'Where can I find live music and good nightlife in Berkeley?',
      image: '/api/placeholder/300/200'
    },
  ];

  const handleSendMessage = async (customPrompt?: string) => {
    const prompt = customPrompt || inputValue.trim();
    if (!prompt || !user) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: prompt,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsGenerating(true);
    setShowSplitScreen(true); // Switch to split screen immediately

    try {
        // For modification prompts, pass the previous city context
        const previousCity = currentRoute ? extractCityFromCurrentRoute(currentRoute) : undefined;
        const response: AIRouteResponse = await aiRouteService.generateRoute({
          prompt: prompt
        }, previousCity);

      if (response.success && response.route) {
        const places = aiRouteService.convertAIRouteToPlaces(response.route);
        const route = aiRouteService.convertAIRouteToRoute(response.route);
        
        setCurrentRoute(route);
        setSelectedPlace(places[0] || null);

        const aiMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          type: 'ai',
          content: `I've created a personalized route for you: **${route.name}**\n\n${route.narrative}\n\nThis route includes ${places.length} carefully selected places that match your request. Each location has been chosen for its unique character and relevance to your interests.`,
          timestamp: new Date(),
          route: route,
          places: places
        };

        setMessages(prev => [...prev, aiMessage]);
        
        toast({
          title: "Route Generated!",
          description: `Created ${route.name} with ${places.length} places`,
        });
      } else {
        const errorMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          type: 'ai',
          content: response.message || "I apologize, but I'm having trouble generating a route right now. Could you try rephrasing your request or asking for something more specific?",
          timestamp: new Date()
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error('Error generating route:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: "I'm experiencing some technical difficulties. Please try again in a moment.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSaveRoute = () => {
    if (currentRoute) {
      saveRoute(currentRoute);
      toast({
        title: "Route Saved!",
        description: `${currentRoute.name} has been saved to your routes`,
      });
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!user) return null;

  return (
    <div className="h-screen flex bg-gray-50 dark:bg-gray-900">
      {!showSplitScreen ? (
        // Welcome Screen - Full Width
        <div className="w-full flex flex-col">
          {/* Chat Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h1 className="font-semibold text-gray-900 dark:text-white">AI City Explorer</h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Your personal travel companion</p>
                </div>
              </div>
            </div>
          </div>

              {/* Centered Content */}
              <div className="flex-1 flex flex-col items-center justify-center px-4">
                <div className="max-w-2xl w-full text-center">
                  {/* Main Title */}
                  <div className="mb-8">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Sparkles className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                      AI City Explorer
                    </h1>
                    <p className="text-lg text-gray-600 dark:text-gray-400">
                      Discover amazing places and create personalized routes in any city worldwide
                    </p>
                  </div>

                  {/* Main Chat Input */}
                  <div className="mb-8">
                    <div className="relative">
                      <Input
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Ask me about places, routes, or experiences... (e.g., 'coffee culture in Tokyo', 'hidden gems in Paris')"
                        className="w-full h-16 text-lg px-6 pr-16 border-2 border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 bg-white dark:bg-gray-800"
                        disabled={isGenerating}
                      />
                      <Button 
                        onClick={() => handleSendMessage()}
                        disabled={isGenerating || !inputValue.trim()}
                        size="lg"
                        className="absolute right-2 top-2 h-12 w-12 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 shadow-lg"
                      >
                        {isGenerating ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <Send className="w-5 h-5" />
                        )}
                      </Button>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">
                      Try: "coffee culture", "hidden gems", "parks and nature", "art galleries", or any city worldwide
                    </p>
                  </div>

                  {/* Subtle Examples */}
                  <div className="mb-8">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Popular searches:</p>
                    <div className="flex flex-wrap justify-center gap-2">
                      {exampleRoutes.slice(0, 4).map((example) => (
                        <button
                          key={example.id}
                          onClick={() => handleSendMessage(example.prompt)}
                          className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full transition-colors duration-200 text-gray-700 dark:text-gray-300"
                        >
                          {example.title}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Recent Routes - Only if exists */}
                  {getRoutes().length > 0 && (
                    <div className="text-left">
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Recent routes:</p>
                      <div className="space-y-2">
                        {getRoutes().slice(0, 2).map((route) => (
                          <button
                            key={route.id}
                            onClick={() => {
                              setCurrentRoute(route);
                              setShowSplitScreen(true);
                              setSelectedPlace(route.places[0] || null);
                            }}
                            className="w-full p-3 text-left bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
                          >
                            <div className="font-medium text-gray-900 dark:text-white text-sm">
                              {route.name}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {route.places.length} places • {Math.floor(route.totalWalkingTime / 60)}h {route.totalWalkingTime % 60}m
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
        </div>
      ) : (
        // Resizable Three Panel Layout
        <PanelGroup direction="horizontal" className="h-full w-full">
          {/* Left Panel - Chat */}
          <Panel defaultSize={25} minSize={20} maxSize={40}>
            <div className="flex flex-col h-full border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              {/* Chat Header */}
              <div className="flex-shrink-0 p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h1 className="font-semibold text-gray-900 dark:text-white text-sm">AI Explorer</h1>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Travel companion</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs h-7 px-2"
                    onClick={() => {
                      setShowSplitScreen(false);
                      setCurrentRoute(null);
                      setSelectedPlace(null);
                      setMessages([]);
                    }}
                  >
                    <MessageSquare className="h-3 w-3 mr-1" />
                    New
                  </Button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-3 min-h-0">
                <div className="space-y-3">
                  {messages.map((message) => (
                    <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] ${message.type === 'user' ? 'order-2' : 'order-1'}`}>
                        <div className={`rounded-xl px-3 py-2 ${
                          message.type === 'user' 
                            ? 'bg-blue-500 text-white' 
                            : 'bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600'
                        }`}>
                          <div className="whitespace-pre-wrap text-xs">{message.content}</div>
                          <div className={`text-xs mt-1 ${
                            message.type === 'user' ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
                          }`}>
                            {formatTime(message.timestamp)}
                          </div>
                        </div>
                        
                        {/* Route Summary for AI messages */}
                        {message.route && (
                          <div className="mt-2 p-2 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-1">
                                <RouteIcon className="w-3 h-3 text-green-600" />
                                <span className="text-xs font-medium text-green-800 dark:text-green-200">
                                  Route Ready
                                </span>
                              </div>
                              <div className="flex gap-1">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-xs h-5 px-1"
                                  onClick={() => {
                                    setCurrentRoute(message.route);
                                    setSelectedPlace(message.places?.[0] || null);
                                  }}
                                >
                                  <MapPin className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-xs h-5 px-1"
                                  onClick={() => {
                                    if (message.route) {
                                      saveRoute(message.route);
                                      toast({
                                        title: "Route Saved!",
                                        description: `${message.route.name} has been saved to your routes`,
                                      });
                                    }
                                  }}
                                >
                                  <Bookmark className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-green-700 dark:text-green-300">
                              <span>📍 {message.places?.length}</span>
                              <span>🚶 {Math.floor(message.route.totalWalkingTime / 60)}h {message.route.totalWalkingTime % 60}m</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {isGenerating && (
                    <div className="flex justify-start">
                      <div className="bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2">
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-3 h-3 animate-spin text-gray-500" />
                          <span className="text-xs text-gray-500">Creating route...</span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* Input */}
              <div className="flex-shrink-0 p-3 border-t border-gray-200 dark:border-gray-700">
                <div className="flex gap-2">
                  <Input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask about places..."
                    className="flex-1 text-xs h-8"
                    disabled={isGenerating}
                  />
                  <Button 
                    onClick={() => handleSendMessage()}
                    disabled={isGenerating || !inputValue.trim()}
                    size="sm"
                    className="h-8 w-8 p-0"
                  >
                    <Send className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </div>
          </Panel>

          {/* Resize Handle */}
          <PanelResizeHandle className="w-2 bg-gray-200 dark:bg-gray-700 hover:bg-blue-300 dark:hover:bg-blue-600 transition-colors duration-200 flex items-center justify-center group">
            <div className="w-1 h-8 bg-gray-400 dark:bg-gray-500 rounded-full group-hover:bg-blue-600 dark:group-hover:bg-blue-300 transition-colors duration-200" />
          </PanelResizeHandle>

          {/* Middle Panel - Map */}
          <Panel defaultSize={50} minSize={30}>
            <div className="h-full bg-gray-100 dark:bg-gray-800">
              {currentRoute ? (
                <GoogleRouteMap 
                  route={currentRoute}
                  selectedPlace={selectedPlace}
                  onPlaceSelect={setSelectedPlace}
                />
              ) : (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <Map className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-300 mb-2">
                      Start a Conversation
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">
                      Ask me about places, experiences, or routes you'd like to explore. 
                      I'll create a personalized route just for you!
                    </p>
                  </div>
                </div>
              )}
            </div>
          </Panel>

          {/* Resize Handle */}
          <PanelResizeHandle className="w-2 bg-gray-200 dark:bg-gray-700 hover:bg-blue-300 dark:hover:bg-blue-600 transition-colors duration-200 flex items-center justify-center group">
            <div className="w-1 h-8 bg-gray-400 dark:bg-gray-500 rounded-full group-hover:bg-blue-600 dark:group-hover:bg-blue-300 transition-colors duration-200" />
          </PanelResizeHandle>

          {/* Right Panel - Route Details */}
          <Panel defaultSize={25} minSize={20} maxSize={40}>
            <div className="h-full border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col">
              {currentRoute ? (
                <div className="flex-1 overflow-y-auto p-4">
                  <RouteNarrative route={currentRoute} />
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center p-4">
                  <div className="text-center">
                    <RouteIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-2">
                      Route Details
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Route information will appear here once generated
                    </p>
                  </div>
                </div>
              )}
            </div>
          </Panel>
        </PanelGroup>
      )}
    </div>
  );
};

export default AIExplorer;
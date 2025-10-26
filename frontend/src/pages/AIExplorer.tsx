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
import { getUser, saveUser, saveRoute, getRoutes } from '@/utils/storage';
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
  const [activePromptIndex, setActivePromptIndex] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [placeholderIndex, setPlaceholderIndex] = useState(0);

  useEffect(() => {
    let currentUser = getUser();
    if (!currentUser) {
      // Create a default user if none exists
      currentUser = {
        id: '1',
        name: 'Explorer',
        email: 'explorer@example.com',
        preferences: {
          interests: ['culture', 'food', 'nature'],
          mood: ['curious'],
          budget: 'moderate',
          pace: 'moderate',
          atmosphere: ['casual', 'vibrant']
        },
        visitedPlaces: [],
        streetCred: 0,
        createdAt: new Date().toISOString()
      };
      saveUser(currentUser);
    }
    setUser(currentUser);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Animated placeholder prompts
  const placeholderPrompts = [
    "Generate a 2-hour walk in Tokyo including coffee shops...",
    "Create a 3-hour route in Paris including art galleries...",
    "Plan a 4-hour tour in London including historical landmarks...",
    "Design a 2-hour foodie adventure in New York...",
    "Explore Barcelona architecture in a 3-hour walking tour...",
    "Find hidden gems in Rome for a 4-hour cultural tour...",
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % placeholderPrompts.length);
    }, 4000); // Change placeholder every 4 seconds

    return () => clearInterval(interval);
  }, []);

  // Mouse parallax effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth - 0.5) * 20,
        y: (e.clientY / window.innerHeight - 0.5) * 20,
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const exampleRoutes = [
    {
      id: '1',
      title: 'Coffee Culture Tour',
      city: 'Tokyo',
      description: 'Discover the best coffee shops and cafes',
      duration: '2-3 hours',
      places: 4,
      category: 'Coffee',
      icon: <Coffee className="h-5 w-5" />,
      prompt: 'Show me the best coffee shops and cafes in Tokyo',
      gradient: 'from-blue-500 to-purple-600',
      image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400'
    },
    {
      id: '2',
      title: 'Art Gallery Walk',
      city: 'Paris',
      description: 'Visit the most inspiring art galleries and museums',
      duration: '3-4 hours',
      places: 5,
      category: 'Arts & Culture',
      icon: <Palette className="h-5 w-5" />,
      prompt: 'Show me the best art galleries and museums in Paris',
      gradient: 'from-pink-500 to-rose-600',
      image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400'
    },
    {
      id: '3',
      title: 'Historical Landmarks',
      city: 'London',
      description: 'Explore famous landmarks and historical sites',
      duration: '3-4 hours',
      places: 5,
      category: 'History',
      icon: <Mountain className="h-5 w-5" />,
      prompt: 'Create a route around Hyde Park and Trafalgar Square in London',
      gradient: 'from-red-500 to-orange-600',
      image: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=400'
    },
    {
      id: '4',
      title: 'Foodie Adventure',
      city: 'New York',
      description: 'Taste the best local restaurants and food spots',
      duration: '3-4 hours',
      places: 6,
      category: 'Food & Drink',
      icon: <Utensils className="h-5 w-5" />,
      prompt: 'Find me the best restaurants and food spots in New York',
      gradient: 'from-green-500 to-emerald-600',
      image: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=400'
    },
    {
      id: '5',
      title: 'Architecture Tour',
      city: 'Barcelona',
      description: 'Discover unique architecture and modern design',
      duration: '3-4 hours',
      places: 4,
      category: 'Architecture',
      icon: <ShoppingBag className="h-5 w-5" />,
      prompt: 'Show me the best architecture and design spots in Barcelona',
      gradient: 'from-indigo-500 to-blue-600',
      image: 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=400'
    },
    {
      id: '6',
      title: 'Live Music & Nightlife',
      city: 'Berlin',
      description: 'Experience the vibrant music scene and evening entertainment',
      duration: '3-5 hours',
      places: 3,
      category: 'Entertainment',
      icon: <Music className="h-5 w-5" />,
      prompt: 'Where can I find live music and good nightlife in Berlin?',
      gradient: 'from-amber-500 to-yellow-600',
      image: 'https://images.unsplash.com/photo-1587330979470-3585ac3b4a57?w=400'
    },
    {
      id: '7',
      title: 'Cultural Heritage',
      city: 'Rome',
      description: 'Explore ancient ruins and cultural sites',
      duration: '4-5 hours',
      places: 4,
      category: 'Culture',
      icon: <Mountain className="h-5 w-5" />,
      prompt: 'Show me the most important historical sites in Rome',
      gradient: 'from-purple-500 to-pink-600',
      image: 'https://images.unsplash.com/photo-1529260830199-42c24126f198?w=400'
    },
    {
      id: '8',
      title: 'Nature & Parks',
      city: 'Sydney',
      description: 'Explore beautiful parks and coastal views',
      duration: '2-3 hours',
      places: 3,
      category: 'Nature',
      icon: <Mountain className="h-5 w-5" />,
      prompt: 'I want to visit parks and nature spots in Sydney',
      gradient: 'from-cyan-500 to-teal-600',
      image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400'
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
        const previousCity = currentRoute ? extractCityFromCurrentRoute(currentRoute) : 'London';
        const response: AIRouteResponse = await aiRouteService.generateRoute({
          prompt: prompt,
          city: previousCity
        });

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
    <div className="h-screen flex bg-gray-50 dark:bg-gray-900 overflow-y-auto">
      {!showSplitScreen ? (
        // Welcome Screen - Full Width with Animated Hero
        <div className="w-full flex flex-col relative min-h-screen">
          {/* Animated Hero Background */}
          <div className="absolute inset-0 -z-10">
            {/* Gradient Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
              {/* Animated Circles */}
              <div 
                className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-200 rounded-full blur-3xl opacity-30 dark:opacity-10 animate-pulse"
                style={{
                  transform: `translate(${mousePosition.x * 2}px, ${mousePosition.y * 2}px)`
                }}
              />
              <div 
                className="absolute top-1/2 right-1/4 w-96 h-96 bg-purple-200 rounded-full blur-3xl opacity-30 dark:opacity-10 animate-pulse delay-300"
                style={{
                  transform: `translate(${-mousePosition.x * 2}px, ${-mousePosition.y * 2}px)`
                }}
              />
              <div 
                className="absolute bottom-1/4 left-1/2 w-96 h-96 bg-pink-200 rounded-full blur-3xl opacity-30 dark:opacity-10 animate-pulse delay-700"
                style={{
                  transform: `translate(${mousePosition.x * 1.5}px, ${-mousePosition.y * 1.5}px)`
                }}
              />
            </div>
          </div>

              {/* Centered Content - No Header */}
              <div className="flex-1 flex flex-col items-center justify-center px-4 py-16 relative z-10">
                <div className="max-w-4xl w-full">
                  {/* Main Title */}
                  <div className="mb-12 text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Sparkles className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                      AI City Explorer
                    </h1>
                    <p className="text-lg text-gray-600 dark:text-gray-400">
                      Discover amazing places and create personalized routes in any city worldwide
                    </p>
                  </div>

                  {/* Main Chat Input - Emphasized with Animated Placeholder */}
                  <div className="mb-12">
                    <div className="relative">
                      <Input
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder={placeholderPrompts[placeholderIndex]}
                        className="w-full h-24 text-xl px-10 pr-28 border-3 border-gray-300 dark:border-gray-600 focus:border-blue-600 dark:focus:border-blue-500 rounded-3xl shadow-2xl hover:shadow-3xl transition-all duration-300 bg-white dark:bg-gray-800 placeholder:transition-all placeholder:duration-500"
                        disabled={isGenerating}
                      />
                      <Button 
                        onClick={() => handleSendMessage()}
                        disabled={isGenerating || !inputValue.trim()}
                        size="lg"
                        className="absolute right-4 top-4 h-16 w-16 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:bg-gray-400 shadow-xl hover:shadow-2xl"
                      >
                        {isGenerating ? (
                          <Loader2 className="w-6 h-6 animate-spin" />
                        ) : (
                          <Send className="w-6 h-6" />
                        )}
                      </Button>
                    </div>
                    <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-4">
                      Or tap a city card above to get started
                    </p>
                  </div>

                  {/* Compact Square City Cards Carousel */}
                  <div className="mb-8">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 text-center">Explore cities worldwide</p>
                    <div className="relative overflow-hidden rounded-2xl">
                      {/* Infinite Scroll Container */}
                      <div className="flex gap-4 overflow-hidden whitespace-nowrap">
                        {/* Original Set */}
                        <div className="flex gap-4 animate-scroll">
                          {exampleRoutes.map((example) => (
                            <button
                              key={example.id}
                              onClick={() => handleSendMessage(example.prompt)}
                              className="group relative overflow-hidden rounded-2xl bg-white dark:bg-gray-800 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 flex-shrink-0 w-48 h-48"
                              style={{
                                backgroundImage: `url(${example.image})`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center'
                              }}
                            >
                              {/* Gradient Overlay */}
                              <div className={`absolute inset-0 bg-gradient-to-br ${example.gradient} opacity-85 group-hover:opacity-75 transition-opacity duration-300`} />
                              
                              {/* Content */}
                              <div className="relative z-10 h-full flex flex-col justify-between p-4">
                                <div className="text-white">
                                  <div className="text-xs font-semibold uppercase tracking-wide mb-1">{example.category}</div>
                                  <h3 className="text-lg font-bold">{example.city}</h3>
                                </div>
                                <div className="text-white text-xs flex items-center gap-2">
                                  <Clock className="w-3 h-3" />
                                  <span>{example.duration}</span>
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                        
                        {/* Duplicate Set for Seamless Loop */}
                        <div className="flex gap-4 animate-scroll">
                          {exampleRoutes.map((example) => (
                            <button
                              key={`duplicate-${example.id}`}
                              onClick={() => handleSendMessage(example.prompt)}
                              className="group relative overflow-hidden rounded-2xl bg-white dark:bg-gray-800 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 flex-shrink-0 w-48 h-48"
                              style={{
                                backgroundImage: `url(${example.image})`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center'
                              }}
                            >
                              <div className={`absolute inset-0 bg-gradient-to-br ${example.gradient} opacity-85 group-hover:opacity-75 transition-opacity duration-300`} />
                              
                              <div className="relative z-10 h-full flex flex-col justify-between p-4">
                                <div className="text-white">
                                  <div className="text-xs font-semibold uppercase tracking-wide mb-1">{example.category}</div>
                                  <h3 className="text-lg font-bold">{example.city}</h3>
                                </div>
                                <div className="text-white text-xs flex items-center gap-2">
                                  <Clock className="w-3 h-3" />
                                  <span>{example.duration}</span>
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Recent Routes - Only if exists */}
                  {getRoutes().length > 0 && (
                    <div className="text-center mb-8">
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Recent routes:</p>
                      <div className="flex flex-col gap-2 items-center">
                        {getRoutes().slice(0, 2).map((route) => (
                          <button
                            key={route.id}
                            onClick={() => {
                              setCurrentRoute(route);
                              setShowSplitScreen(true);
                              setSelectedPlace(route.places[0] || null);
                            }}
                            className="w-full max-w-md p-4 text-left bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-700 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-xl transition-colors duration-200 shadow-sm"
                          >
                            <div className="font-medium text-gray-900 dark:text-white">
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
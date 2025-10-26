// API service for connecting to the backend AI route generation
import { Place, Route } from '@/types';

const API_BASE_URL = 'http://localhost:8000/api/v1/ai';

export interface AIRouteRequest {
  prompt: string;
  city: string;
}

export interface AIPlace {
  id: string;
  name: string;
  category: string;
  description: string;
  aiSummary: string;
  rating: number;
  reviewCount: number;
  priceLevel: number;
  walkingTime: number;
  drivingTime: number;
  coordinates: {
    lat: number;
    lng: number;
  };
  imageUrl: string;
  tags: string[];
  vibe: string[];
}

export interface AIRoute {
  id: string;
  name: string;
  user_id: string;
  place_ids: string[];
  places: AIPlace[];
  narrative: string;
  total_walking_time: number;
  total_driving_time: number;
  created_at: string;
  demo_mode: boolean;
}

export interface AIRouteResponse {
  success: boolean;
  message: string;
  route: AIRoute | null;
  error: string | null;
}

export interface RouteSuggestion {
  prompt: string;
  theme: string;
  duration: string;
  description: string;
}

export interface AIRouteSuggestionsResponse {
  suggestions: RouteSuggestion[];
  user_route_count: number;
  message: string;
  demo_mode: boolean;
}

class AIRouteService {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  // Extract city from user prompt using intelligent parsing
  private extractCityFromPrompt(prompt: string): string {
    const promptLower = prompt.toLowerCase();
    
    // Famous landmarks that indicate specific cities
    const landmarkToCity: { [key: string]: string } = {
      // London landmarks
      'hyde park': 'London, UK',
      'trafalgar square': 'London, UK',
      'big ben': 'London, UK',
      'london eye': 'London, UK',
      'tower bridge': 'London, UK',
      'buckingham palace': 'London, UK',
      'westminster': 'London, UK',
      'piccadilly': 'London, UK',
      'covent garden': 'London, UK',
      // Paris landmarks
      'eiffel tower': 'Paris, France',
      'louvre': 'Paris, France',
      'notre dame': 'Paris, France',
      'champs elysees': 'Paris, France',
      'arc de triomphe': 'Paris, France',
      'montmartre': 'Paris, France',
      // New York landmarks
      'times square': 'New York, NY',
      'central park': 'New York, NY',
      'statue of liberty': 'New York, NY',
      'empire state building': 'New York, NY',
      'brooklyn bridge': 'New York, NY',
      'manhattan': 'New York, NY',
      // San Francisco landmarks
      'golden gate bridge': 'San Francisco, CA',
      'fisherman\'s wharf': 'San Francisco, CA',
      'alcatraz': 'San Francisco, CA',
      'chinatown': 'San Francisco, CA',
      // Berkeley landmarks
      'uc berkeley': 'Berkeley, CA',
      'telegraph avenue': 'Berkeley, CA',
      'berkeley marina': 'Berkeley, CA',
      // Rome landmarks
      'colosseum': 'Rome, Italy',
      'vatican': 'Rome, Italy',
      'trevi fountain': 'Rome, Italy',
      // Barcelona landmarks
      'sagrada familia': 'Barcelona, Spain',
      'park guell': 'Barcelona, Spain',
      // Berlin landmarks
      'brandenburg gate': 'Berlin, Germany',
      'berlin wall': 'Berlin, Germany',
      // Moscow landmarks
      'red square': 'Moscow, Russia',
      'kremlin': 'Moscow, Russia',
      // Sydney landmarks
      'sydney opera house': 'Sydney, Australia',
      'harbour bridge': 'Sydney, Australia',
      'bondi beach': 'Sydney, Australia',
    };

    // Check for famous landmarks first
    for (const [landmark, city] of Object.entries(landmarkToCity)) {
      if (promptLower.includes(landmark)) {
        console.log(`Detected landmark "${landmark}" -> city: ${city}`);
        return city;
      }
    }
    
    // Common patterns for city mentions
    const cityPatterns = [
      // "in [city]" pattern
      /in\s+([a-zA-Z\s]+?)(?:\s|$|,)/i,
      // "around [city]" pattern  
      /around\s+([a-zA-Z\s]+?)(?:\s|$|,)/i,
      // "near [city]" pattern
      /near\s+([a-zA-Z\s]+?)(?:\s|$|,)/i,
      // "at [city]" pattern
      /at\s+([a-zA-Z\s]+?)(?:\s|$|,)/i,
      // "visit [city]" pattern
      /visit\s+([a-zA-Z\s]+?)(?:\s|$|,)/i,
      // "explore [city]" pattern
      /explore\s+([a-zA-Z\s]+?)(?:\s|$|,)/i,
      // "[city] area" pattern
      /([a-zA-Z\s]+?)\s+area/i,
      // "[city] downtown" pattern
      /([a-zA-Z\s]+?)\s+downtown/i,
      // "[city] city" pattern
      /([a-zA-Z\s]+?)\s+city/i,
    ];

    // Try to extract city from patterns
    for (const pattern of cityPatterns) {
      const match = promptLower.match(pattern);
      if (match && match[1]) {
        let city = match[1].trim();
        
        // Clean up common words
        city = city.replace(/\b(the|a|an|some|any|all)\b/g, '').trim();
        
        // Skip if it's too short or common words
        if (city.length < 2 || /^(coffee|food|restaurant|cafe|park|museum|art|culture|nightlife|shopping|entertainment)$/i.test(city)) {
          continue;
        }
        
        // Capitalize first letter of each word
        city = city.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
        
        console.log(`Extracted city from pattern: ${city}`);
        return city;
      }
    }

    // If no city found, let the AI handle it by not specifying a city
    // This allows the AI to work with any city worldwide
    return '';
  }

  async generateRoute(request: AIRouteRequest, previousCity?: string): Promise<AIRouteResponse> {
    try {
      // Extract city from prompt if not explicitly provided
      let city = this.extractCityFromPrompt(request.prompt) || request.city;
      
      // If no city detected and we have a previous city, use it
      if (!city && previousCity) {
        city = previousCity;
      }
      
      console.log(`Generating route with city: "${city}" from prompt: "${request.prompt}"`);
      
      // Add timeout and better error handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      const response = await fetch(`${this.baseUrl}/generate-route-demo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...request,
          city: city
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: AIRouteResponse = await response.json();
      return data;
    } catch (error: any) {
      console.error('Error generating AI route:', error);
      
      // Handle different types of errors
      if (error.name === 'AbortError') {
        return {
          success: false,
          message: "Request timed out. The AI service is taking too long to respond.",
          route: null,
          error: "TIMEOUT_ERROR"
        };
      }
      
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        return {
          success: false,
          message: "Cannot connect to the AI service. Please check if the backend server is running.",
          route: null,
          error: "NETWORK_ERROR"
        };
      }
      
      if (error.message.includes('HTTP error')) {
        return {
          success: false,
          message: `Server error: ${error.message}`,
          route: null,
          error: "SERVER_ERROR"
        };
      }
      
      return {
        success: false,
        message: "An unexpected error occurred while generating the route.",
        route: null,
        error: error.message || "UNKNOWN_ERROR"
      };
    }
  }

  async getRouteSuggestions(): Promise<AIRouteSuggestionsResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/route-suggestions-demo`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: AIRouteSuggestionsResponse = await response.json();
      return data;
    } catch (error) {
      console.error('Error getting route suggestions:', error);
      return {
        suggestions: [],
        user_route_count: 0,
        message: 'Failed to get suggestions',
        demo_mode: true,
      };
    }
  }

  // Convert AI route to frontend Place format
  convertAIRouteToPlaces(aiRoute: AIRoute): Place[] {
    return aiRoute.places.map(place => ({
      id: place.id,
      name: place.name,
      category: place.category,
      description: place.description,
      aiSummary: place.aiSummary,
      rating: place.rating,
      reviewCount: place.reviewCount,
      priceLevel: place.priceLevel,
      walkingTime: place.walkingTime,
      drivingTime: place.drivingTime,
      coordinates: place.coordinates,
      imageUrl: place.imageUrl,
      tags: place.tags,
      vibe: place.vibe,
    }));
  }

  // Convert AI route to frontend Route format
  convertAIRouteToRoute(aiRoute: AIRoute): Route {
    return {
      id: aiRoute.id,
      name: aiRoute.name,
      places: this.convertAIRouteToPlaces(aiRoute),
      totalWalkingTime: aiRoute.total_walking_time,
      totalDrivingTime: aiRoute.total_driving_time,
      narrative: aiRoute.narrative,
      createdAt: aiRoute.created_at,
    };
  }
}

// Export singleton instance
export const aiRouteService = new AIRouteService();

// Export types for use in components
export type { Place, Route } from '@/types';

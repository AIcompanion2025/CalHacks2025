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
      'hyde park': 'London',
      'trafalgar square': 'London',
      'big ben': 'London',
      'london eye': 'London',
      'tower bridge': 'London',
      'buckingham palace': 'London',
      'eiffel tower': 'Paris',
      'louvre': 'Paris',
      'notre dame': 'Paris',
      'champs elysees': 'Paris',
      'arc de triomphe': 'Paris',
      'times square': 'New York',
      'central park': 'New York',
      'statue of liberty': 'New York',
      'empire state building': 'New York',
      'brooklyn bridge': 'New York',
      'golden gate bridge': 'San Francisco',
      'fisherman\'s wharf': 'San Francisco',
      'alcatraz': 'San Francisco',
      'colosseum': 'Rome',
      'vatican': 'Rome',
      'trevi fountain': 'Rome',
      'sagrada familia': 'Barcelona',
      'park guell': 'Barcelona',
      'brandenburg gate': 'Berlin',
      'berlin wall': 'Berlin',
      'red square': 'Moscow',
      'kremlin': 'Moscow',
      'sydney opera house': 'Sydney',
      'harbour bridge': 'Sydney',
      'bondi beach': 'Sydney',
    };

    // Check for famous landmarks first
    for (const [landmark, city] of Object.entries(landmarkToCity)) {
      if (promptLower.includes(landmark)) {
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
        
        // Add state/country if not present
        if (!city.includes(',') && !city.includes(' ')) {
          // For single word cities, try to determine if it's a major city
          const majorCities = ['london', 'paris', 'tokyo', 'new york', 'los angeles', 'chicago', 'houston', 'phoenix', 'philadelphia', 'san antonio', 'san diego', 'dallas', 'san jose', 'austin', 'jacksonville', 'fort worth', 'columbus', 'charlotte', 'san francisco', 'indianapolis', 'seattle', 'denver', 'washington', 'boston', 'el paso', 'nashville', 'detroit', 'oklahoma city', 'portland', 'las vegas', 'memphis', 'louisville', 'baltimore', 'milwaukee', 'albuquerque', 'tucson', 'fresno', 'sacramento', 'kansas city', 'mesa', 'atlanta', 'omaha', 'colorado springs', 'raleigh', 'miami', 'virginia beach', 'oakland', 'minneapolis', 'tulsa', 'arlington', 'tampa', 'new orleans'];
          
          if (majorCities.includes(city.toLowerCase())) {
            // For major cities, add appropriate country/state
            if (['london', 'paris', 'tokyo', 'berlin', 'rome', 'madrid', 'amsterdam', 'vienna', 'prague', 'budapest', 'warsaw', 'stockholm', 'copenhagen', 'oslo', 'helsinki', 'dublin', 'lisbon', 'athens', 'istanbul', 'moscow', 'beijing', 'shanghai', 'hong kong', 'singapore', 'sydney', 'melbourne', 'toronto', 'vancouver', 'montreal'].includes(city.toLowerCase())) {
              // International cities
              return city;
            } else {
              // US cities - add state if not obvious
              return city;
            }
          }
        }
        
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
      // For modification prompts, use previous city if no new city is detected
      let city = request.city || this.extractCityFromPrompt(request.prompt);
      
      // If no city detected and we have a previous city, use it
      if (!city && previousCity) {
        city = previousCity;
      }
      
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

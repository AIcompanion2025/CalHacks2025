// API service for connecting to the backend AI route generation
import { Place, Route } from '@/types';

const API_BASE_URL = 'https://calhacks2025-i4tb.onrender.com/api/v1/ai';

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

  async generateRoute(request: AIRouteRequest, previousCity?: string): Promise<AIRouteResponse> {
    try {
      // Let the AI determine the city from the prompt - no hardcoded logic
      // Only use the explicitly provided city from the request
      let city = request.city || '';
      
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

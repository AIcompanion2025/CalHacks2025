export interface UserPreferences {
  mood: string[];
  interests: string[];
  pace: 'slow' | 'moderate' | 'fast';
  budget: 'budget' | 'moderate' | 'luxury';
  atmosphere: string[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  streetCred: number;
  preferences: UserPreferences;
  visitedPlaces: number[];
  createdAt: string;
}

export interface Place {
  id: number;
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

export interface Route {
  id: number;
  name: string;
  places: Place[];
  totalWalkingTime: number;
  totalDrivingTime: number;
  narrative: string;
  createdAt: string;
}

export interface Adventure {
  id: number;
  routeId: number;
  title: string;
  content: string;
  places: Place[];
  date: string;
  imageUrl: string;
}

export interface Expense {
  id: number;
  amount: number;
  category: 'food' | 'transport' | 'shopping' | 'entertainment' | 'accommodation' | 'other';
  description: string;
  placeId?: number;
  placeName?: string;
  date: string;
  notes?: string;
}
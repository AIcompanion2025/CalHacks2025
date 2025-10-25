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
  visitedPlaces: string[];
  createdAt: string;
}

export interface Place {
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

export interface Route {
  id: string;
  name: string;
  places: Place[];
  totalWalkingTime: number;
  totalDrivingTime: number;
  narrative: string;
  createdAt: string;
}

export interface Adventure {
  id: string;
  routeId: string;
  title: string;
  content: string;
  places: Place[];
  date: string;
  imageUrl: string;
}

export interface Expense {
  id: string;
  amount: number;
  category: 'food' | 'transport' | 'shopping' | 'entertainment' | 'accommodation' | 'other';
  description: string;
  placeId?: string;
  placeName?: string;
  date: string;
  notes?: string;
}
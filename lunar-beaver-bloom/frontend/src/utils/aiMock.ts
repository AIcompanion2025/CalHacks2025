import { Place } from '@/types';
import { mockPlaces } from '@/data/mockPlaces';

export const generatePersonalizedRecommendations = (
  mood: string,
  timeAvailable: number,
  preferences: string[]
): Place[] => {
  // Simple mock algorithm to filter places based on preferences
  const filtered = mockPlaces.filter(place => {
    const matchesMood = place.vibe.some(v => 
      mood.toLowerCase().includes(v.toLowerCase())
    );
    const matchesPreferences = preferences.some(pref =>
      place.tags.includes(pref.toLowerCase()) || 
      place.category.toLowerCase().includes(pref.toLowerCase())
    );
    const fitsTime = place.walkingTime <= timeAvailable;
    
    return (matchesMood || matchesPreferences) && fitsTime;
  });
  
  return filtered.slice(0, 6);
};

export const generateRouteNarrative = (places: Place[]): string => {
  if (places.length === 0) return '';
  
  const narratives = [
    `Begin your journey at ${places[0].name}, where ${places[0].aiSummary.toLowerCase()} `,
    `From there, let the path guide you to ${places[1]?.name || 'your next destination'}, `,
    places.length > 2 ? `continuing to ${places[2].name} for ${places[2].description.toLowerCase()}. ` : '',
    `This curated walk captures the essence of Berkeley's hidden gems, `,
    `offering you an intimate experience that typical tourists miss.`
  ];
  
  return narratives.join('');
};

export const generateAdventureBlogPost = (
  places: Place[],
  userNotes?: string
): string => {
  const placeNames = places.map(p => p.name).join(', ');
  
  return `🌟 Today's Berkeley Adventure

I discovered some incredible hidden gems in Downtown Berkeley today! My journey took me through ${placeNames}.

${places[0] ? `Started at ${places[0].name} - ${places[0].aiSummary}` : ''}

${places[1] ? `\n\nThen explored ${places[1].name}, which was absolutely ${places[1].vibe[0]}!` : ''}

${userNotes ? `\n\n${userNotes}` : ''}

Each stop revealed something unique about Berkeley's character. This is what I love about exploring with intention - you find the stories behind the places.

#BerkeleyAdventures #HiddenGems #LocalExplorer #StreetCred`;
};

export const calculateStreetCred = (visitedPlaces: number, routesCompleted: number): number => {
  // Unbounded scoring system
  const placePoints = visitedPlaces * 10;
  const routePoints = routesCompleted * 25;
  
  return placePoints + routePoints;
};

export const calculateLevel = (streetCred: number): number => {
  // Level increases every 100 street cred points
  return Math.floor(streetCred / 100) + 1;
};

export const getStreetCredForNextLevel = (currentLevel: number): number => {
  // Points needed for next level
  return currentLevel * 100;
};

export const getLevelTitle = (level: number): string => {
  if (level === 1) return 'Novice Explorer';
  if (level >= 2 && level <= 3) return 'Local Wanderer';
  if (level >= 4 && level <= 6) return 'City Connoisseur';
  if (level >= 7 && level <= 10) return 'Urban Legend';
  if (level >= 11 && level <= 15) return 'Master Navigator';
  if (level >= 16 && level <= 20) return 'City Sage';
  return 'Legendary Explorer';
};
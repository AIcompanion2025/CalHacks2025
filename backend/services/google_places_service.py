"""Google Places API service for detailed place information."""
import logging
from typing import Dict, List, Any, Optional
import googlemaps
from config import settings

logger = logging.getLogger(__name__)

class GooglePlacesService:
    """Service for interacting with Google Places API."""
    
    def __init__(self):
        self.client = googlemaps.Client(key=settings.google_places_api_key)
    
    async def search_places_by_name(
        self, 
        place_name: str, 
        city: Optional[str] = None,
        radius: int = 5000
    ) -> Optional[Dict[str, Any]]:
        """
        Search for a place by name using Google Places API.
        
        Args:
            place_name: Name of the place to search for
            city: City to search in
            radius: Search radius in meters
            
        Returns:
            Place details dict or None if not found
        """
        try:
            # Use text search to find the place
            query = f"{place_name}"
            if city:
                query += f" {city}"
            
            places_result = self.client.places(
                query=query,
                type="establishment"
            )
            
            if not places_result.get('results'):
                logger.warning(f"No places found for: {place_name}")
                return None
            
            # Get the first result
            place = places_result['results'][0]
            place_id = place['place_id']
            
            # Get detailed information
            return await self.get_place_details(place_id)
            
        except Exception as e:
            logger.error(f"Error searching for place {place_name}: {str(e)}")
            return None
    
    async def get_place_details(self, place_id: str) -> Optional[Dict[str, Any]]:
        """
        Get detailed information about a place using its Google Places ID.
        
        Args:
            place_id: Google Places ID
            
        Returns:
            Detailed place information dict or None if not found
        """
        try:
            # Get place details
            place_details = self.client.place(
                place_id=place_id,
                fields=[
                    'name', 'formatted_address', 'geometry', 'rating', 
                    'user_ratings_total', 'price_level', 'type', 
                    'photo', 'reviews', 'opening_hours', 'website',
                    'formatted_phone_number', 'editorial_summary'
                ]
            )
            
            if not place_details.get('result'):
                return None
            
            result = place_details['result']
            
            # Extract coordinates
            location = result.get('geometry', {}).get('location', {})
            coordinates = {
                'lat': location.get('lat', 0.0),
                'lng': location.get('lng', 0.0)
            }
            
            # Get primary photo
            photo_url = None
            if result.get('photos'):
                photo_reference = result['photos'][0]['photo_reference']
                photo_url = f"https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference={photo_reference}&key={settings.google_places_api_key}"
            
            # Extract reviews
            reviews = []
            if result.get('reviews'):
                reviews = [
                    {
                        'author_name': review.get('author_name', ''),
                        'rating': review.get('rating', 0),
                        'text': review.get('text', ''),
                        'time': review.get('time', 0)
                    }
                    for review in result['reviews'][:3]  # Limit to 3 reviews
                ]
            
            # Determine category from type
            category = self._determine_category(result.get('type', []))
            
            # Build place data
            place_data = {
                'google_place_id': place_id,
                'name': result.get('name', ''),
                'address': result.get('formatted_address', ''),
                'coordinates': coordinates,
                'rating': result.get('rating', 0.0),
                'review_count': result.get('user_ratings_total', 0),
                'price_level': result.get('price_level', 0),
                'category': category,
                'type': result.get('type', []),
                'photo_url': photo_url,
                'reviews': reviews,
                'website': result.get('website', ''),
                'phone': result.get('formatted_phone_number', ''),
                'opening_hours': result.get('opening_hours', {}),
                'editorial_summary': result.get('editorial_summary', {}).get('overview', ''),
                'description': result.get('editorial_summary', {}).get('overview', '')
            }
            
            return place_data
            
        except Exception as e:
            logger.error(f"Error getting place details for {place_id}: {str(e)}")
            return None
    
    async def enhance_ai_generated_places(
        self, 
        ai_places: List[Dict[str, Any]], 
        city: str = "Berkeley, CA"
    ) -> List[Dict[str, Any]]:
        """
        Enhance AI-generated places with real Google Places data.
        
        Args:
            ai_places: List of places generated by AI
            city: City to search in
            
        Returns:
            List of enhanced places with Google Places data
        """
        enhanced_places = []
        
        for ai_place in ai_places:
            try:
                # Search for the place using Google Places
                google_place = await self.search_places_by_name(
                    ai_place['name'], city
                )
                
                if google_place:
                    # Merge AI data with Google Places data
                    enhanced_place = self._merge_place_data(ai_place, google_place)
                    enhanced_places.append(enhanced_place)
                else:
                    # Keep AI data if Google Places doesn't find it
                    logger.warning(f"Could not find Google Places data for: {ai_place['name']}")
                    enhanced_place = ai_place.copy()
                    enhanced_place['google_verified'] = False
                    enhanced_place['coordinates'] = {'lat': 0.0, 'lng': 0.0}  # Default coordinates
                    enhanced_places.append(enhanced_place)
                    
            except Exception as e:
                logger.error(f"Error enhancing place {ai_place.get('name', 'Unknown')}: {str(e)}")
                # Keep original AI data as fallback
                enhanced_place = ai_place.copy()
                enhanced_place['google_verified'] = False
                enhanced_places.append(enhanced_place)
        
        return enhanced_places
    
    async def calculate_walking_times(
        self, 
        places: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        Calculate walking times between places using Google Maps API.
        
        Args:
            places: List of places with coordinates
            
        Returns:
            List of places with updated walking times
        """
        if len(places) < 2:
            return places
        
        enhanced_places = places.copy()
        
        try:
            for i in range(len(enhanced_places) - 1):
                current_place = enhanced_places[i]
                next_place = enhanced_places[i + 1]
                
                # Calculate walking time between places
                walking_time = await self._calculate_walking_time(
                    current_place['coordinates'],
                    next_place['coordinates']
                )
                
                # Update walking time
                enhanced_places[i]['walking_time_to_next'] = walking_time
                enhanced_places[i]['walking_time'] = walking_time
            
            # Set walking time for last place to 0
            enhanced_places[-1]['walking_time_to_next'] = 0
            enhanced_places[-1]['walking_time'] = 0
            
            return enhanced_places
            
        except Exception as e:
            logger.error(f"Error calculating walking times: {str(e)}")
            return places
    
    def _determine_category(self, types: List[str]) -> str:
        """Determine the primary category from Google Places types."""
        category_mapping = {
            'restaurant': ['restaurant', 'food', 'meal_takeaway', 'meal_delivery'],
            'cafe': ['cafe', 'bakery'],
            'park': ['park', 'tourist_attraction', 'zoo', 'aquarium'],
            'museum': ['museum', 'art_gallery'],
            'shop': ['store', 'shopping_mall', 'clothing_store', 'book_store'],
            'entertainment': ['movie_theater', 'night_club', 'bar', 'casino'],
            'nature': ['park', 'natural_feature', 'campground'],
            'culture': ['museum', 'art_gallery', 'library', 'university']
        }
        
        for category, type_list in category_mapping.items():
            if any(t in types for t in type_list):
                return category
        
        return 'establishment'
    
    def _merge_place_data(
        self, 
        ai_place: Dict[str, Any], 
        google_place: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Merge AI-generated place data with Google Places data."""
        merged = ai_place.copy()
        
        # Update with Google Places data
        merged.update({
            'google_place_id': google_place.get('google_place_id', ''),
            'address': google_place.get('address', ''),
            'coordinates': google_place.get('coordinates', {'lat': 0.0, 'lng': 0.0}),
            'rating': google_place.get('rating', 0.0),
            'review_count': google_place.get('review_count', 0),
            'price_level': google_place.get('price_level', 0),
            'photo_url': google_place.get('photo_url', ''),
            'reviews': google_place.get('reviews', []),
            'website': google_place.get('website', ''),
            'phone': google_place.get('phone', ''),
            'opening_hours': google_place.get('opening_hours', {}),
            'google_verified': True
        })
        
        # Use Google's description if available, otherwise keep AI description
        if google_place.get('description'):
            merged['description'] = google_place['description']
        
        # Use Google's category if more specific
        if google_place.get('category') and google_place['category'] != 'establishment':
            merged['category'] = google_place['category']
        
        return merged
    
    async def _calculate_walking_time(
        self, 
        origin: Dict[str, float], 
        destination: Dict[str, float]
    ) -> int:
        """Calculate walking time between two coordinates."""
        try:
            directions = self.client.directions(
                origin=(origin['lat'], origin['lng']),
                destination=(destination['lat'], destination['lng']),
                mode="walking"
            )
            
            if directions and directions[0].get('legs'):
                duration = directions[0]['legs'][0]['duration']['value']  # Duration in seconds
                return duration // 60  # Convert to minutes
            
            return 10  # Default 10 minutes if calculation fails
            
        except Exception as e:
            logger.error(f"Error calculating walking time: {str(e)}")
            return 10  # Default fallback


# Global instance
google_places_service = GooglePlacesService()

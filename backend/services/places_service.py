"""Google Places API service for fetching detailed place information."""
import asyncio
import logging
from typing import Dict, List, Any, Optional
import httpx
from config import settings

logger = logging.getLogger(__name__)


class PlacesService:
    """Service for interacting with Google Places API using httpx."""
    
    def __init__(self, api_key: str):
        """
        Initialize the PlacesService.
        
        Args:
            api_key: Google Places API key
        """
        self.api_key = api_key
        self.client = httpx.AsyncClient(timeout=30.0)
        self.text_search_url = f"{settings.places_api_endpoint}/textsearch/json"
        self.details_url = f"{settings.places_api_endpoint}/details/json"
        self.max_retries = 2
        self.retry_delay = 1.0  # Initial delay in seconds
    
    async def get_place_details(
        self, 
        place_name: str, 
        location_context: str
    ) -> Optional[Dict[str, Any]]:
        """
        Fetch detailed place information from Google Places API.
        
        Args:
            place_name: Name of the place to search for
            location_context: Location bias (e.g., "San Francisco, CA")
            
        Returns:
            Dictionary containing place details or None if not found:
            {
                'name': str,
                'description': str,
                'rating': float,
                'review_count': int,
                'price_level': int,
                'coordinates': {'lat': float, 'lng': float},
                'address': str,
                'place_id': str,
                'reviews': [{'author_name': str, 'rating': int, 'text': str}]
            }
        """
        try:
            # Step 1: Search for the place using Text Search
            place_id = await self._search_place(place_name, location_context)
            
            if not place_id:
                logger.warning(f"Place not found: {place_name} in {location_context}")
                return None
            
            # Step 2: Get detailed information using Place Details
            place_details = await self._fetch_place_details(place_id)
            
            if not place_details:
                logger.warning(f"Could not fetch details for place_id: {place_id}")
                return None
            
            # Step 3: Format and return the data
            return self._format_place_data(place_details)
            
        except Exception as e:
            logger.error(f"Error getting place details for '{place_name}': {str(e)}")
            return None
    
    async def _search_place(
        self, 
        place_name: str, 
        location_context: str
    ) -> Optional[str]:
        """
        Search for a place using Google Places Text Search API.
        
        Args:
            place_name: Name of the place
            location_context: Location context for the search
            
        Returns:
            Google place_id or None if not found
        """
        query = f"{place_name}, {location_context}"
        params = {
            "query": query,
            "key": self.api_key
        }
        
        for attempt in range(self.max_retries + 1):
            try:
                response = await self.client.get(self.text_search_url, params=params)
                response.raise_for_status()
                
                data = response.json()
                
                # Check API status
                if data.get("status") == "ZERO_RESULTS":
                    logger.info(f"No results found for: {query}")
                    return None
                
                if data.get("status") != "OK":
                    logger.error(f"Places API error: {data.get('status')} - {data.get('error_message', '')}")
                    return None
                
                # Get the first result's place_id
                results = data.get("results", [])
                if results:
                    return results[0].get("place_id")
                
                return None
                
            except httpx.HTTPStatusError as e:
                if e.response.status_code == 429:  # Rate limit
                    if attempt < self.max_retries:
                        delay = self.retry_delay * (2 ** attempt)  # Exponential backoff
                        logger.warning(f"Rate limit hit, retrying in {delay}s...")
                        await asyncio.sleep(delay)
                        continue
                logger.error(f"HTTP error during place search: {str(e)}")
                return None
                
            except httpx.RequestError as e:
                if attempt < self.max_retries:
                    delay = self.retry_delay * (2 ** attempt)
                    logger.warning(f"Network error, retrying in {delay}s: {str(e)}")
                    await asyncio.sleep(delay)
                    continue
                logger.error(f"Network error during place search: {str(e)}")
                return None
                
            except Exception as e:
                logger.error(f"Unexpected error during place search: {str(e)}")
                return None
        
        return None
    
    async def _fetch_place_details(self, place_id: str) -> Optional[Dict[str, Any]]:
        """
        Fetch detailed information for a place using Place Details API.
        
        Args:
            place_id: Google place_id
            
        Returns:
            Raw place details from API or None if error
        """
        params = {
            "place_id": place_id,
            "fields": "name,formatted_address,geometry,rating,user_ratings_total,"
                     "price_level,types,reviews,editorial_summary,opening_hours,website",
            "key": self.api_key
        }
        
        for attempt in range(self.max_retries + 1):
            try:
                response = await self.client.get(self.details_url, params=params)
                response.raise_for_status()
                
                data = response.json()
                
                # Check API status
                if data.get("status") != "OK":
                    logger.error(f"Place Details API error: {data.get('status')} - {data.get('error_message', '')}")
                    return None
                
                return data.get("result")
                
            except httpx.HTTPStatusError as e:
                if e.response.status_code == 429:  # Rate limit
                    if attempt < self.max_retries:
                        delay = self.retry_delay * (2 ** attempt)
                        logger.warning(f"Rate limit hit, retrying in {delay}s...")
                        await asyncio.sleep(delay)
                        continue
                logger.error(f"HTTP error fetching place details: {str(e)}")
                return None
                
            except httpx.RequestError as e:
                if attempt < self.max_retries:
                    delay = self.retry_delay * (2 ** attempt)
                    logger.warning(f"Network error, retrying in {delay}s: {str(e)}")
                    await asyncio.sleep(delay)
                    continue
                logger.error(f"Network error fetching place details: {str(e)}")
                return None
                
            except Exception as e:
                logger.error(f"Unexpected error fetching place details: {str(e)}")
                return None
        
        return None
    
    def _format_place_data(self, raw_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Format raw Google Places API data into standardized structure.
        
        Args:
            raw_data: Raw data from Place Details API
            
        Returns:
            Formatted place data dictionary
        """
        # Extract coordinates
        geometry = raw_data.get("geometry", {})
        location = geometry.get("location", {})
        coordinates = {
            "lat": location.get("lat", 0.0),
            "lng": location.get("lng", 0.0)
        }
        
        # Extract description from editorial summary or types
        description = ""
        editorial_summary = raw_data.get("editorial_summary", {})
        if editorial_summary:
            description = editorial_summary.get("overview", "")
        
        # If no editorial summary, create description from types
        if not description:
            types = raw_data.get("types", [])
            if types:
                # Format types into readable description
                readable_types = [t.replace("_", " ").title() for t in types[:3]]
                description = f"A {', '.join(readable_types)}"
        
        # Extract top 3 reviews
        reviews = []
        raw_reviews = raw_data.get("reviews", [])
        for review in raw_reviews[:3]:
            reviews.append({
                "author_name": review.get("author_name", "Anonymous"),
                "rating": review.get("rating", 0),
                "text": review.get("text", "")
            })
        
        # Build formatted data
        formatted_data = {
            "name": raw_data.get("name", ""),
            "description": description,
            "rating": raw_data.get("rating", 0.0),
            "review_count": raw_data.get("user_ratings_total", 0),
            "price_level": raw_data.get("price_level", 1),  # Default to 1 if not available
            "coordinates": coordinates,
            "address": raw_data.get("formatted_address", ""),
            "place_id": raw_data.get("place_id", ""),
            "reviews": reviews,
            "types": raw_data.get("types", []),
            "website": raw_data.get("website", ""),
            "opening_hours": raw_data.get("opening_hours", {})
        }
        
        return formatted_data
    
    async def close(self):
        """Close the httpx client properly."""
        try:
            await self.client.aclose()
            logger.info("PlacesService client closed successfully")
        except Exception as e:
            logger.error(f"Error closing PlacesService client: {str(e)}")


# Global instance factory
def create_places_service() -> PlacesService:
    """
    Create a PlacesService instance with the configured API key.
    
    Returns:
        PlacesService instance
    """
    return PlacesService(api_key=settings.google_places_api_key)
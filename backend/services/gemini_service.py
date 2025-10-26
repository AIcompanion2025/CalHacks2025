"""Google Gemini API service for AI-powered route generation and refinement."""
import asyncio
import json
import logging
from typing import Dict, List, Any, Optional
import google.generativeai as genai
from config import settings

logger = logging.getLogger(__name__)


class GeminiService:
    """Service for interacting with Google Gemini API for route generation."""
    
    def __init__(self, api_key: str):
        """
        Initialize the GeminiService.
        
        Args:
            api_key: Google Gemini API key
        """
        self.api_key = api_key
        self.max_retries = 2
        self.retry_delay = 1.0  # Initial delay in seconds
        
        # Configure the Gemini API
        genai.configure(api_key=self.api_key)
        
        # Set up generation config
        self.generation_config = {
            "temperature": settings.temperature,
            "max_output_tokens": settings.max_tokens,
            "response_mime_type": "application/json",
        }
        
        # Initialize the model
        self.model = genai.GenerativeModel(
            model_name=settings.gemini_model,
            generation_config=self.generation_config
        )
        
        logger.info(f"GeminiService initialized with model: {settings.gemini_model}")
    
    async def generate_initial_route(
        self, 
        user_prompt: str, 
        location: str
    ) -> Dict[str, Any]:
        """
        Generate initial route suggestions from user prompt.
        
        Args:
            user_prompt: User's request for the route
            location: Location context (e.g., "San Francisco, CA")
            
        Returns:
            Dictionary containing:
            {
                'name': str (route name),
                'stops': List[str] (place names),
                'descriptions': dict (place_name -> brief description)
            }
            
        Raises:
            Exception: If route generation fails after retries
        """
        try:
            logger.info(f"Generating initial route for: {user_prompt} in {location}")
            
            # Create the prompt
            prompt = self._create_initial_route_prompt(user_prompt, location)
            
            # Generate content with retry logic
            response_text = await self._generate_with_retry(prompt)
            
            # Parse the JSON response
            route_data = self._parse_json_response(response_text)
            
            # Validate the response structure
            self._validate_initial_route_response(route_data)
            
            logger.info(f"Successfully generated initial route: {route_data.get('name')}")
            return route_data
            
        except Exception as e:
            logger.error(f"Error generating initial route: {str(e)}")
            raise Exception(f"Failed to generate initial route: {str(e)}")
    
    async def refine_route_narrative(
        self, 
        initial_route: Dict[str, Any], 
        places_details: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Refine route with enriched place details and generate narrative.
        
        Args:
            initial_route: Initial route data with name and stops
            places_details: List of enriched place details from Google Places API
            
        Returns:
            Dictionary containing:
            {
                'narrative': str (engaging story connecting places),
                'refined_name': str (optional improved route name),
                'travel_times': dict (place connections and estimated times)
            }
            
        Raises:
            Exception: If refinement fails after retries
        """
        try:
            logger.info(f"Refining route narrative for: {initial_route.get('name')}")
            
            # Create the refinement prompt
            prompt = self._create_refinement_prompt(initial_route, places_details)
            
            # Generate content with retry logic
            response_text = await self._generate_with_retry(prompt)
            
            # Parse the JSON response
            refined_data = self._parse_json_response(response_text)
            
            # Validate the response structure
            self._validate_refinement_response(refined_data)
            
            logger.info(f"Successfully refined route narrative")
            return refined_data
            
        except Exception as e:
            logger.error(f"Error refining route narrative: {str(e)}")
            raise Exception(f"Failed to refine route narrative: {str(e)}")
    
    async def _generate_with_retry(self, prompt: str) -> str:
        """
        Generate content with retry logic for transient errors.
        
        Args:
            prompt: The prompt to send to Gemini
            
        Returns:
            Generated text response
            
        Raises:
            Exception: If all retries fail
        """
        last_error = None
        
        for attempt in range(self.max_retries + 1):
            try:
                # Use asyncio to run the synchronous generate_content in a thread pool
                response = await asyncio.to_thread(
                    self.model.generate_content,
                    prompt
                )
                
                # Check if response has text
                if not response.text:
                    raise ValueError("Empty response from Gemini API")
                
                return response.text
                
            except Exception as e:
                last_error = e
                error_msg = str(e).lower()
                
                # Check for rate limiting or transient errors
                if "rate" in error_msg or "quota" in error_msg or "429" in error_msg:
                    if attempt < self.max_retries:
                        delay = self.retry_delay * (2 ** attempt)  # Exponential backoff
                        logger.warning(f"Rate limit or quota error, retrying in {delay}s...")
                        await asyncio.sleep(delay)
                        continue
                
                # Check for content filtering/safety issues
                if "safety" in error_msg or "blocked" in error_msg:
                    logger.error(f"Content filtered by safety settings: {str(e)}")
                    raise Exception("Content was blocked by safety filters. Please rephrase your request.")
                
                # For other errors, retry if we have attempts left
                if attempt < self.max_retries:
                    delay = self.retry_delay * (2 ** attempt)
                    logger.warning(f"Error generating content, retrying in {delay}s: {str(e)}")
                    await asyncio.sleep(delay)
                    continue
                
                # If we've exhausted retries, raise the error
                logger.error(f"Failed to generate content after {self.max_retries + 1} attempts")
                raise
        
        # If we get here, all retries failed
        raise Exception(f"Failed to generate content after {self.max_retries + 1} attempts: {str(last_error)}")
    
    def _create_initial_route_prompt(self, user_prompt: str, location: str) -> str:
        """
        Create the initial route generation prompt.
        
        Args:
            user_prompt: User's request
            location: Location context
            
        Returns:
            Formatted prompt string
        """
        prompt = f"""You are an expert travel guide creating personalized walking tour itineraries.

User Request: "{user_prompt}"
Location: "{location}"

Create a walking tour with 3-5 interesting places. Your response MUST be ONLY valid JSON with this exact structure:
{{
  "name": "Creative route name",
  "stops": ["Place 1", "Place 2", "Place 3"],
  "descriptions": {{
    "Place 1": "Brief description",
    "Place 2": "Brief description",
    "Place 3": "Brief description"
  }}
}}

IMPORTANT: 
- Return ONLY the JSON object, no other text
- Ensure all JSON brackets and quotes are properly closed
- Include descriptions for ALL stops
- Use real, well-known locations in {location}
- Make the route name creative and descriptive"""

        return prompt
    
    def _create_refinement_prompt(
        self, 
        initial_route: Dict[str, Any], 
        places_details: List[Dict[str, Any]]
    ) -> str:
        """
        Create the route refinement prompt.
        
        Args:
            initial_route: Initial route data
            places_details: Enriched place details
            
        Returns:
            Formatted prompt string
        """
        route_name = initial_route.get('name', 'Untitled Route')
        
        # Format places details for the prompt
        places_json = []
        for place in places_details:
            place_info = {
                "name": place.get('name', ''),
                "description": place.get('description', ''),
                "rating": place.get('rating', 0),
                "review_count": place.get('review_count', 0),
                "address": place.get('address', ''),
                "reviews": place.get('reviews', [])[:2]  # Include top 2 reviews
            }
            places_json.append(place_info)
        
        formatted_places = json.dumps(places_json, indent=2)
        
        prompt = f"""You are an expert travel guide. Based on the following verified place details, create a compelling narrative for this tour.

Route: "{route_name}"

Places:
{formatted_places}

Your response MUST be valid JSON with this structure:
{{
  "narrative": "2-3 paragraph engaging story connecting these places",
  "refined_name": "Improved route name (optional)",
  "travel_times": {{
    "Place 1 to Place 2": {{"walking": 10, "driving": 3}},
    "Place 2 to Place 3": {{"walking": 15, "driving": 5}}
  }}
}}

Make the narrative engaging and informative, incorporating the ratings and reviews.
The narrative should tell a story that connects these places thematically.
Estimate realistic walking times between consecutive places (in minutes).
If the original route name is already good, you can omit refined_name or keep it the same."""

        return prompt
    
    def _parse_json_response(self, response_text: str) -> Dict[str, Any]:
        """
        Parse JSON response from Gemini, handling various formats.
        
        Args:
            response_text: Raw response text from Gemini
            
        Returns:
            Parsed JSON dictionary
            
        Raises:
            ValueError: If JSON parsing fails
        """
        try:
            # Try direct JSON parsing
            return json.loads(response_text)
        except json.JSONDecodeError:
            # Try to extract JSON from markdown code blocks
            if "```json" in response_text:
                start = response_text.find("```json") + 7
                end = response_text.find("```", start)
                json_str = response_text[start:end].strip()
                return json.loads(json_str)
            elif "```" in response_text:
                start = response_text.find("```") + 3
                end = response_text.find("```", start)
                json_str = response_text[start:end].strip()
                return json.loads(json_str)
            else:
                # Try to find JSON object in the text
                start = response_text.find("{")
                end = response_text.rfind("}") + 1
                if start != -1 and end > start:
                    json_str = response_text[start:end]
                    return json.loads(json_str)
                
                raise ValueError(f"Could not extract valid JSON from response: {response_text[:200]}")
    
    def _validate_initial_route_response(self, route_data: Dict[str, Any]) -> None:
        """
        Validate the structure of initial route response.
        
        Args:
            route_data: Parsed route data
            
        Raises:
            ValueError: If validation fails
        """
        required_fields = ['name', 'stops', 'descriptions']
        for field in required_fields:
            if field not in route_data:
                raise ValueError(f"Missing required field in route response: {field}")
        
        if not isinstance(route_data['stops'], list) or len(route_data['stops']) < 2:
            raise ValueError("Route must have at least 2 stops")
        
        if len(route_data['stops']) > settings.max_places_per_route:
            logger.warning(f"Route has {len(route_data['stops'])} stops, truncating to {settings.max_places_per_route}")
            route_data['stops'] = route_data['stops'][:settings.max_places_per_route]
        
        if not isinstance(route_data['descriptions'], dict):
            raise ValueError("Descriptions must be a dictionary")
    
    def _validate_refinement_response(self, refined_data: Dict[str, Any]) -> None:
        """
        Validate the structure of refinement response.
        
        Args:
            refined_data: Parsed refinement data
            
        Raises:
            ValueError: If validation fails
        """
        if 'narrative' not in refined_data:
            raise ValueError("Missing required field in refinement response: narrative")
        
        if not isinstance(refined_data['narrative'], str) or len(refined_data['narrative']) < 50:
            raise ValueError("Narrative must be a substantial text (at least 50 characters)")
        
        # travel_times is optional but should be a dict if present
        if 'travel_times' in refined_data and not isinstance(refined_data['travel_times'], dict):
            raise ValueError("travel_times must be a dictionary")


# Global instance factory
def create_gemini_service() -> GeminiService:
    """
    Create a GeminiService instance with the configured API key.
    
    Returns:
        GeminiService instance
        
    Raises:
        ValueError: If API key is not configured
    """
    if not settings.gemini_api_key:
        raise ValueError("Gemini API key not configured. Please set GEMINI_API_KEY in .env file")
    
    return GeminiService(api_key=settings.gemini_api_key)


# Global instance for easy import
try:
    gemini_service = create_gemini_service()
    logger.info("Global GeminiService instance created successfully")
except Exception as e:
    logger.error(f"Failed to create global GeminiService instance: {str(e)}")
    gemini_service = None

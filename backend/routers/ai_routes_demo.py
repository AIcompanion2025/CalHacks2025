"""Demo AI Route Generation router - Works without MongoDB for CalHacks demo."""
from fastapi import APIRouter, HTTPException
from typing import Dict, Any, Optional
from pydantic import BaseModel, Field
from services.gemini_service import create_gemini_service
from services.google_places_service import google_places_service
from models.ai_route import AIRouteRequest, AIRouteResponse, AIRoute, AIPlace, RouteSuggestion, AIRouteSuggestionsResponse
from config import settings
import logging
import asyncio

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/ai", tags=["ai-routes-demo"])


@router.get("/health")
async def health_check():
    """Simple health check endpoint."""
    return {"status": "healthy", "message": "AI routes demo service is running"}


# Models are now imported from models.ai_route


@router.post("/generate-route-demo", response_model=AIRouteResponse)
async def generate_ai_route_demo(request: AIRouteRequest):
    """
    Generate a personalized route using AI - DEMO VERSION (No Database Required).
    
    This endpoint combines Google Gemini AI with Google Places API to:
    1. Generate a route based on your prompt
    2. Find real places and get detailed information
    3. Calculate accurate walking times
    4. Create an engaging narrative
    5. Return complete route data (no database saving)
    
    **Example prompts:**
    - "I want to explore Berkeley's food scene with some coffee and dessert"
    - "Show me the best parks and outdoor spaces for a relaxing afternoon"
    - "I'm interested in art and culture, what should I visit?"
    - "Find me some hidden gems and local favorites"
    
    **Request Body:**
    - **prompt**: Your request (10-500 characters)
    - **city**: City to explore (default: Berkeley, CA)
    
    **Returns:**
    Complete route with places, descriptions, walking times, and narrative.
    """
    try:
        logger.info(f"Demo AI route generation request: {request.prompt}")
        
        # Create services
        gemini_service = create_gemini_service()
        
        # Step 1: Generate initial route with Gemini
        city = request.city or "any city"  # Let AI figure out the city from the prompt
        initial_route = await gemini_service.generate_initial_route(request.prompt, city)
        logger.info(f"Generated initial route: {initial_route['name']}")
        
        # Step 2: Enrich places with Google Places API
        enriched_places = []
        place_names = initial_route.get('stops', [])
        
        logger.info(f"Enriching {len(place_names)} places with Google Places API")
        for place_name in place_names:
            try:
                # Use the detected city or let Google Places figure it out
                search_city = city if city != "any city" else None
                place_details = await google_places_service.search_places_by_name(place_name, search_city)
                if place_details:
                    # Add the initial description from Gemini
                    place_details['ai_description'] = initial_route.get('descriptions', {}).get(place_name, '')
                    enriched_places.append(place_details)
                    logger.info(f"Successfully enriched place: {place_name}")
                else:
                    logger.warning(f"Could not find place details for: {place_name}")
            except Exception as e:
                logger.error(f"Error enriching place '{place_name}': {str(e)}")
                continue
        
        if not enriched_places:
            return AIRouteResponse(
                success=False,
                message="Could not find any of the suggested places",
                error="No places found in Google Places API"
            )
        
        logger.info(f"Successfully enriched {len(enriched_places)} out of {len(place_names)} places")
        
        # Step 3: Generate refined narrative (with fallback)
        try:
            refined_data = await gemini_service.refine_route_narrative(initial_route, enriched_places)
            narrative = refined_data.get('narrative', '')
            refined_name = refined_data.get('refined_name', initial_route.get('name'))
        except Exception as e:
            logger.warning(f"Failed to refine narrative, using fallback: {str(e)}")
            # Fallback narrative
            narrative = f"Embark on an exciting journey through {initial_route.get('name', 'Berkeley')}, where each stop offers unique experiences and discoveries. This carefully curated route takes you through the best that {request.city} has to offer, combining local favorites with hidden gems."
            refined_name = initial_route.get('name')
        
        # Step 4: Calculate real walking times using Google Directions
        enhanced_places_with_times = []
        total_walking_time = 0
        
        for i, place in enumerate(enriched_places):
            walking_time_to_next = 0
            
            # Calculate walking time to next place (except for the last one)
            if i < len(enriched_places) - 1:
                try:
                    next_place = enriched_places[i + 1]
                    current_coords = place.get('coordinates', {'lat': 0.0, 'lng': 0.0})
                    next_coords = next_place.get('coordinates', {'lat': 0.0, 'lng': 0.0})
                    
                    # Use Google Directions to calculate walking time
                    gm_client = google_places_service.client
                    directions = gm_client.directions(
                        origin=(current_coords['lat'], current_coords['lng']),
                        destination=(next_coords['lat'], next_coords['lng']),
                        mode="walking"
                    )
                    
                    if directions and directions[0].get('legs'):
                        duration = directions[0]['legs'][0]['duration']['value']  # Duration in seconds
                        walking_time_to_next = duration // 60  # Convert to minutes
                        total_walking_time += walking_time_to_next
                    else:
                        walking_time_to_next = 10  # Fallback if calculation fails
                        total_walking_time += 10
                        
                except Exception as e:
                    logger.warning(f"Error calculating walking time: {str(e)}")
                    walking_time_to_next = 10  # Fallback
                    total_walking_time += 10
            
            # Use real review_count from Google Places API
            review_count = place.get('review_count', 0)
            
            # Create place with REAL data only
            if review_count == 0 or place.get('rating', 0) == 0:
                logger.warning(f"Skipping {place.get('name')} - no real review data from Google Places")
                continue
            
            place_dict = AIPlace(
                id=f"demo_place_{i}",
                name=place.get('name', 'Unknown Place'),
                category=place.get('category', 'Place'),
                description=place.get('description', 'No description available'),
                aiSummary=place.get('ai_description', ''),
                rating=place.get('rating', 0.0),
                reviewCount=review_count,  # REAL data from Google Places
                priceLevel=place.get('price_level', 1),
                walkingTime=walking_time_to_next,  # REAL calculated time
                drivingTime=walking_time_to_next // 2,  # Approximate driving time
                coordinates=place.get('coordinates', {'lat': 0.0, 'lng': 0.0}),
                imageUrl=place.get('photo_url', "/placeholder.svg"),
                tags=place.get('type', [])[:3] if place.get('type') else ['interesting'],
                vibe=['popular'] if place.get('rating', 0) > 4.0 else ['interesting']
            )
            enhanced_places_with_times.append(place_dict)
        
        # If we don't have enough valid places, return error
        if not enhanced_places_with_times:
            return AIRouteResponse(
                success=False,
                message="Could not get real data from Google Places API for the suggested places",
                error="No valid places with real data"
            )
        
        places_response = enhanced_places_with_times
        total_driving_time = total_walking_time // 2
        
        route_response = AIRoute(
            id="demo_route_123",
            name=refined_name,
            user_id="demo_user_123",
            place_ids=[f"demo_place_{i}" for i in range(len(enriched_places))],
            places=places_response,
            narrative=narrative,
            total_walking_time=total_walking_time,
            total_driving_time=total_driving_time,
            created_at="2024-01-01T00:00:00Z",
            demo_mode=True
        )
        
        return AIRouteResponse(
            success=True,
            message=f"Successfully generated demo route: {refined_name}",
            route=route_response
        )
        
    except Exception as e:
        logger.error(f"Error generating demo route: {str(e)}")
        return AIRouteResponse(
            success=False,
            message="Failed to generate route",
            error=str(e)
        )


@router.get("/route-suggestions-demo", response_model=AIRouteSuggestionsResponse)
async def get_route_suggestions_demo():
    """
    Get AI-generated route suggestions - DEMO VERSION.
    
    Returns demo suggestions for testing.
    """
    try:
        suggestions = [
            RouteSuggestion(
                prompt="Show me the best coffee shops and cafes in Berkeley",
                theme="Coffee Culture",
                duration="2-3 hours",
                description="Discover Berkeley's vibrant coffee scene"
            ),
            RouteSuggestion(
                prompt="I want to explore Berkeley's parks and outdoor spaces",
                theme="Nature & Parks",
                duration="3-4 hours",
                description="Connect with nature in Berkeley's beautiful outdoor spaces"
            ),
            RouteSuggestion(
                prompt="Find me some hidden gems and local favorites",
                theme="Hidden Gems",
                duration="2-3 hours",
                description="Discover places only locals know about"
            ),
            RouteSuggestion(
                prompt="I'm interested in art and culture, what should I visit?",
                theme="Arts & Culture",
                duration="3-4 hours",
                description="Explore Berkeley's artistic and cultural side"
            ),
            RouteSuggestion(
                prompt="Show me the best food scene with restaurants and cafes",
                theme="Food Scene",
                duration="4-5 hours",
                description="Taste your way through Berkeley's culinary delights"
            )
        ]
        
        return AIRouteSuggestionsResponse(
            suggestions=suggestions,
            user_route_count=0,
            message="Demo suggestions for testing the AI route generation",
            demo_mode=True
        )
        
    except Exception as e:
        logger.error(f"Error getting demo suggestions: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get suggestions")

"""Places router for AI City Companion API."""
from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List, Optional
from bson import ObjectId
from database import get_database
from models.place import PlaceResponse
from models.user import User

router = APIRouter(prefix="/api/v1/places", tags=["places"])


@router.get("", response_model=dict)
async def list_places(
    category: Optional[str] = Query(None, description="Filter by category"),
    priceLevel: Optional[int] = Query(None, description="Filter by max price level"),
    tags: Optional[str] = Query(None, description="Filter by tags (comma-separated)")
):
    """
    List all places with optional filtering.
    
    - **category**: Filter by place category
    - **priceLevel**: Filter by maximum price level (0-3)
    - **tags**: Filter by tags (comma-separated, e.g., "coffee,cozy")
    """
    db = get_database()
    places_collection = db.places
    
    # Build filter query
    filter_query = {}
    
    if category:
        filter_query["category"] = category
    
    if priceLevel is not None:
        filter_query["price_level"] = {"$lte": priceLevel}
    
    if tags:
        # Split tags by comma and filter places that have any of these tags
        tag_list = [tag.strip() for tag in tags.split(",")]
        filter_query["tags"] = {"$in": tag_list}
    
    # Fetch places from database
    places_cursor = places_collection.find(filter_query)
    places_list = await places_cursor.to_list(length=None)
    
    # Convert to response format
    places_response = [PlaceResponse.from_db(place) for place in places_list]
    
    return {"places": [place.model_dump() for place in places_response]}


@router.get("/{place_id}", response_model=dict)
async def get_place(
    place_id: str
):
    """
    Get a single place by ID.
    
    - **place_id**: The ID of the place to retrieve
    """
    db = get_database()
    places_collection = db.places
    
    # Validate ObjectId
    if not ObjectId.is_valid(place_id):
        raise HTTPException(status_code=400, detail="Invalid place ID format")
    
    # Fetch place from database
    place_doc = await places_collection.find_one({"_id": ObjectId(place_id)})
    
    if not place_doc:
        raise HTTPException(status_code=404, detail="Place not found")
    
    # Convert to response format
    place_response = PlaceResponse.from_db(place_doc)
    
    return {"place": place_response.model_dump()}


@router.post("/recommendations", response_model=dict)
async def get_recommendations(
    request_data: dict
):
    """
    Get personalized place recommendations based on user preferences.
    
    Request body:
    - **mood**: User's current mood (string)
    - **timeAvailable**: Available time in minutes (int)
    - **priceLevel**: Maximum price level (int, 0-3)
    - **interests**: List of interests (array of strings)
    """
    from utils.recommendations import generate_recommendations
    
    mood = request_data.get("mood", "")
    time_available = request_data.get("timeAvailable", 60)
    price_level = request_data.get("priceLevel", 3)
    interests = request_data.get("interests", [])
    
    db = get_database()
    
    # Generate recommendations
    recommendations = await generate_recommendations(
        db=db,
        mood=mood,
        time_available=time_available,
        price_level=price_level,
        interests=interests
    )
    
    return {"recommendations": recommendations}
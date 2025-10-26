"""Routes router for AI City Companion API - NO AUTH VERSION."""
from fastapi import APIRouter, HTTPException
from typing import List
from bson import ObjectId
from datetime import datetime
from database import get_database
from models.route import RouteCreate, RouteResponse
from models.place import PlaceResponse
from utils.narrative import generate_route_narrative

router = APIRouter(prefix="/api/v1/routes", tags=["routes"])


async def get_or_create_mock_user(db):
    """Get or create a mock user for development without auth."""
    from models.user import UserInDB
    
    user_data = await db.users.find_one({"email": "mock@example.com"})
    
    if not user_data:
        # Create mock user
        user_dict = {
            "name": "Mock User",
            "email": "mock@example.com",
            "password_hash": "mock_hash",
            "street_cred": 0,
            "visited_places": [],
            "preferences": {
                "mood": [],
                "interests": [],
                "pace": "moderate",
                "budget": "moderate",
                "atmosphere": []
            },
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        result = await db.users.insert_one(user_dict)
        user_dict["_id"] = str(result.inserted_id)
        return UserInDB(**user_dict)
    
    # Convert ObjectId to string
    if "_id" in user_data and isinstance(user_data["_id"], ObjectId):
        user_data["_id"] = str(user_data["_id"])
    
    return UserInDB(**user_data)


@router.post("", response_model=dict)
async def create_route(
    route_data: RouteCreate
    ):
    """
    Create a new route with multiple places.
    
    - **name**: Route name (required)
    - **place_ids**: List of place IDs (minimum 2 required)
    
    Returns the created route with populated place details.
    Updates user's Street Cred by +25 points.
    """
    db = get_database()
    places_collection = db.places
    routes_collection = db.routes
    users_collection = db.users
    
    current_user = await get_or_create_mock_user(db)
    
    # Validate minimum 2 places
    if len(route_data.place_ids) < 2:
        raise HTTPException(
            status_code=400,
            detail="Route must include at least 2 places"
        )
    
    # Validate all place IDs and fetch place details
    place_objects = []
    for place_id in route_data.place_ids:
        place_doc = await places_collection.find_one({"_id": place_id})
        if not place_doc:
            raise HTTPException(
                status_code=404,
                detail=f"Place not found: {place_id}"
            )
        place_objects.append(place_doc)
    
    # Calculate total walking and driving times
    total_walking_time = sum(place.get("walking_time", 0) for place in place_objects)
    total_driving_time = sum(place.get("driving_time", 0) for place in place_objects)
    
    # Generate narrative
    narrative = generate_route_narrative(place_objects)
    
    # Create route document
    route_doc = {
        "user_id": current_user.id,
        "name": route_data.name,
        "place_ids": route_data.place_ids,
        "total_walking_time": total_walking_time,
        "total_driving_time": total_driving_time,
        "narrative": narrative,
        "created_at": datetime.utcnow()
    }
    
    # Insert route into database
    result = await routes_collection.insert_one(route_doc)
    route_doc["_id"] = result.inserted_id
    
    # Update user's Street Cred (+25 points for creating a route)
    # First, count total routes for this user
    routes_count = await routes_collection.count_documents({"user_id": current_user.id})
    
    # Calculate new Street Cred
    from utils.gamification import calculate_street_cred
    new_street_cred = calculate_street_cred(
        visited_places=current_user.visited_places,
        routes_completed=routes_count
    )
    
    # Update user's street_cred in database
    await users_collection.update_one(
        {"_id": ObjectId(current_user.id)},
        {"$set": {"street_cred": new_street_cred}}
    )
    
    # Convert places to response format
    places_response = [PlaceResponse.from_db(place).model_dump() for place in place_objects]
    
    # Build response
    route_response = {
        "_id": route_doc["_id"],
        "user_id": current_user.id,
        "name": route_doc["name"],
        "place_ids": route_data.place_ids,
        "total_walking_time": total_walking_time,
        "total_driving_time": total_driving_time,
        "narrative": narrative,
        "created_at": route_doc["created_at"],
        "places": places_response
    }
    
    return {"route": route_response}


@router.get("", response_model=dict)
async def list_routes():
    """
    List all routes created by the current user.
    
    Returns routes sorted by creation date (newest first) with populated place details.
    """
    db = get_database()
    routes_collection = db.routes
    places_collection = db.places
    
    current_user = await get_or_create_mock_user(db)
    
    # Fetch user's routes
    routes_cursor = routes_collection.find(
        {"user_id": current_user.id}
    ).sort("created_at", -1)
    
    routes_list = await routes_cursor.to_list(length=None)
    
    # Populate place details for each route
    routes_response = []
    for route_doc in routes_list:
        # Fetch place details
        place_objects = []
        for place_id in route_doc.get("place_ids", []):
            place_doc = await places_collection.find_one({"_id": place_id})
            if place_doc:
                place_objects.append(PlaceResponse.from_db(place_doc).model_dump())
        
        # Build route response
        route_response = {
            "_id": route_doc["_id"],
            "user_id": route_doc["user_id"],
            "name": route_doc["name"],
            "place_ids": route_doc.get("place_ids", []),
            "total_walking_time": route_doc.get("total_walking_time", 0),
            "total_driving_time": route_doc.get("total_driving_time", 0),
            "narrative": route_doc.get("narrative", ""),
            "created_at": route_doc["created_at"],
            "places": place_objects
        }
        routes_response.append(route_response)
    
    return {"routes": routes_response}


@router.get("/{route_id}", response_model=dict)
async def get_route(
    route_id: int
):
    """
    Get a single route by ID with full place details.
    
    - **route_id**: The ID of the route to retrieve
    
    Returns 404 if route not found or doesn't belong to current user.
    """
    db = get_database()
    routes_collection = db.routes
    places_collection = db.places
    
    current_user = await get_or_create_mock_user(db)
    
    # Fetch route from database
    route_doc = await routes_collection.find_one({"_id": route_id})
    
    if not route_doc:
        raise HTTPException(status_code=404, detail="Route not found")
    
    # Verify route belongs to current user
    if route_doc["user_id"] != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Fetch place details
    place_objects = []
    for place_id in route_doc.get("place_ids", []):
        place_doc = await places_collection.find_one({"_id": place_id})
        if place_doc:
            place_objects.append(PlaceResponse.from_db(place_doc).model_dump())
    
    # Build route response
    route_response = {
        "_id": route_doc["_id"],
        "user_id": route_doc["user_id"],
        "name": route_doc["name"],
        "place_ids": route_doc.get("place_ids", []),
        "total_walking_time": route_doc.get("total_walking_time", 0),
        "total_driving_time": route_doc.get("total_driving_time", 0),
        "narrative": route_doc.get("narrative", ""),
        "created_at": route_doc["created_at"],
        "places": place_objects
    }
    
    return {"route": route_response}


@router.delete("/{route_id}", response_model=dict)
async def delete_route(
    route_id: str
):
    """
    Delete a route by ID.
    
    - **route_id**: The ID of the route to delete
    
    Returns 404 if route not found or 403 if route doesn't belong to current user.
    """
    db = get_database()
    routes_collection = db.routes
    
    current_user = await get_or_create_mock_user(db)
    
    # Fetch route to verify ownership
    route_doc = await routes_collection.find_one({"_id": route_id})
    
    if not route_doc:
        raise HTTPException(status_code=404, detail="Route not found")
    
    # Verify route belongs to current user
    if route_doc["user_id"] != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Delete route
    await routes_collection.delete_one({"_id": route_id})
    
    return {"message": "Route deleted successfully"}
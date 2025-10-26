"""User profile and preferences management endpoints."""
from fastapi import APIRouter, Depends, HTTPException, status
from typing import Dict, Any
from datetime import datetime
from bson import ObjectId

from services.auth import get_current_user  # your auth dependency
from models.user import UserInDB, UserResponse, UserPreferences
from database import get_database
from utils.gamification import calculate_level, get_level_title, get_level_progress
from pydantic import BaseModel, Field


router = APIRouter(prefix="/api/v1/users", tags=["users"])


class ProfileUpdateRequest(BaseModel):
    """Request model for updating user profile."""
    name: str = Field(..., min_length=1)


class PreferencesUpdateRequest(BaseModel):
    """Request model for updating user preferences."""
    mood: list[str] = Field(default_factory=list)
    interests: list[str] = Field(default_factory=list)
    pace: str | None = None
    budget: str | None = None
    atmosphere: list[str] = Field(default_factory=list)


class VisitPlaceRequest(BaseModel):
    """Request model for marking a place as visited."""
    placeId: str = Field(..., alias="placeId")


class ProfileStatsResponse(BaseModel):
    """Response model for profile statistics."""
    visitedPlaces: int
    routesCreated: int


class ProfileResponse(BaseModel):
    """Response model for user profile with stats."""
    user: UserResponse
    stats: ProfileStatsResponse


class VisitPlaceResponse(BaseModel):
    """Response model for visit place action."""
    streetCred: int
    level: int
    visitedPlaces: list[str]

async def get_user_profile(user: UserInDB, db=None) -> ProfileResponse:
    """
    Returns a ProfileResponse for a given user.
    """
    # Count user's routes if db is provided
    routes_count = 0
    if db is not None:
        routes_count = await db.routes.count_documents({"user_id": user.id})

    # Convert user to response model
    user_dict = user.model_dump(by_alias=True)
    user_dict["_id"] = str(user.id)
    user_response = UserResponse(**user_dict)

    # Prepare stats
    stats = ProfileStatsResponse(
        visitedPlaces=len(user.visited_places),
        routesCreated=routes_count
    )

    return ProfileResponse(user=user_response, stats=stats)

router = APIRouter()

@router.get("/profile", response_model=ProfileResponse)
async def profile(
    current_user: UserInDB = Depends(get_current_user)  # inject logged-in user
):
    db = get_database()
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection unavailable"
        )

    return await get_user_profile(current_user, db=db)



@router.put("/profile", response_model=Dict[str, UserResponse])
async def update_profile(
    profile_update: ProfileUpdateRequest,
    current_user: UserInDB
) -> Dict[str, UserResponse]:
    """
    Update user profile (name only, email is immutable).
    
    Args:
        profile_update: Profile update data
        
    Returns:
        Updated user object
    """
    db = get_database()
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection unavailable"
        )
    
    # Update user in database
    update_data = {
        "name": profile_update.name,
        "updated_at": datetime.utcnow()
    }
    
    result = await db.users.update_one(
        {"_id": current_user.id},
        {"$set": update_data}
    )
    
    if result.modified_count == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to update profile"
        )
    
    # Fetch updated user
    updated_user_data = await db.users.find_one({"_id": current_user.id})
    if updated_user_data is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Convert to response model
    updated_user_data["_id"] = str(updated_user_data["_id"])
    user_response = UserResponse(**updated_user_data)
    
    return {"user": user_response}


@router.put("/preferences", response_model=Dict[str, UserPreferences])
async def update_preferences(
    preferences_update: PreferencesUpdateRequest,
    current_user: UserInDB
) -> Dict[str, UserPreferences]:
    """
    Update user preferences for personalized recommendations.
    
    Args:
        preferences_update: Preferences update data
        
    Returns:
        Updated preferences object
    """
    db = get_database()
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection unavailable"
        )
    
    # Prepare preferences data
    preferences_data = preferences_update.model_dump()
    
    # Update user preferences in database
    update_data = {
        "preferences": preferences_data,
        "updated_at": datetime.utcnow()
    }
    
    result = await db.users.update_one(
        {"_id": current_user.id},
        {"$set": update_data}
    )
    
    if result.modified_count == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to update preferences"
        )
    
    # Return updated preferences
    preferences_response = UserPreferences(**preferences_data)
    
    return {"preferences": preferences_response}


@router.post("/visit-place", response_model=VisitPlaceResponse)
async def visit_place(
    visit_request: VisitPlaceRequest,
    current_user: UserInDB
) -> VisitPlaceResponse:
    """
    Mark a place as visited and update Street Cred.
    
    Args:
        visit_request: Place ID to mark as visited
        
    Returns:
        Updated Street Cred, level, and visited places list
    """
    db = get_database()
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection unavailable"
        )
    
    place_id = visit_request.placeId
    
    # Check if place exists
    try:
        place = await db.places.find_one({"_id": ObjectId(place_id)})
        if place is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Place not found"
            )
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid place ID"
        )
    
    # Check if place is already visited
    if place_id in current_user.visited_places:
        # Return current state without updating
        level = calculate_level(current_user.street_cred)
        return VisitPlaceResponse(
            streetCred=current_user.street_cred,
            level=level,
            visitedPlaces=current_user.visited_places
        )
    
    # Add place to visited places and update Street Cred
    new_street_cred = current_user.street_cred + 10
    new_visited_places = current_user.visited_places + [place_id]
    
    # Update user in database
    result = await db.users.update_one(
        {"_id": current_user.id},
        {
            "$set": {
                "street_cred": new_street_cred,
                "visited_places": new_visited_places,
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    if result.modified_count == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to update visited places"
        )
    
    # Calculate new level
    new_level = calculate_level(new_street_cred)
    
    return VisitPlaceResponse(
        streetCred=new_street_cred,
        level=new_level,
        visitedPlaces=new_visited_places
    )


    
"""AI Route Models - Compatible with AI Route Generator output."""
from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class Coordinates(BaseModel):
    """Coordinates model for places."""
    lat: float
    lng: float


class AIPlace(BaseModel):
    """Place model compatible with AI route generator output."""
    id: int
    name: str
    category: str
    description: str
    aiSummary: str
    rating: float
    reviewCount: int
    priceLevel: int
    walkingTime: int
    drivingTime: int
    coordinates: Coordinates
    imageUrl: str
    tags: List[str]
    vibe: List[str]


class AIRoute(BaseModel):
    """Route model compatible with AI route generator output."""
    id: int
    name: str
    user_id: str
    place_ids: List[int]
    places: List[AIPlace]
    narrative: str
    total_walking_time: int
    total_driving_time: int
    created_at: str
    demo_mode: bool = True


class AIRouteRequest(BaseModel):
    """Request model for AI route generation."""
    prompt: str = Field(..., min_length=10, max_length=500, description="User's request for the route")
    city: Optional[str] = Field(default=None, description="City to generate route for (optional - AI will detect from prompt)")


class AIRouteResponse(BaseModel):
    """Response model for AI route generation."""
    success: bool
    message: str
    route: Optional[AIRoute] = None
    error: Optional[str] = None


class RouteSuggestion(BaseModel):
    """Model for route suggestions."""
    prompt: str
    theme: str
    duration: str
    description: str


class AIRouteSuggestionsResponse(BaseModel):
    """Response model for route suggestions."""
    suggestions: List[RouteSuggestion]
    user_route_count: int
    message: str
    demo_mode: bool = True

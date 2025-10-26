from datetime import datetime
from typing import Optional, List
from bson import ObjectId
from pydantic import BaseModel, Field
from pydantic import GetCoreSchemaHandler
from pydantic_core import core_schema


class PyObjectId(ObjectId):
    """Pydantic v2-compatible ObjectId type."""

    @classmethod
    def __get_pydantic_core_schema__(cls, source_type, handler: GetCoreSchemaHandler):
        return core_schema.no_info_after_validator_function(
            cls.validate, core_schema.str_schema()
        )

    @classmethod
    def __get_pydantic_json_schema__(cls, core_schema, handler):
        json_schema = handler(core_schema)
        json_schema.update(type="string")
        return json_schema

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return ObjectId(v)


class Coordinates(BaseModel):
    lat: float
    lng: float


class Place(BaseModel):
    id: Optional[int] = Field(default=None, alias="_id")  # Changed to int
    name: str
    category: str
    description: str
    ai_summary: str = Field(alias="aiSummary")
    rating: float = Field(default=0.0)
    review_count: int = Field(default=0, alias="reviewCount")
    price_level: int = Field(default=1, alias="priceLevel")
    walking_time: int = Field(default=10, alias="walkingTime")
    driving_time: int = Field(default=5, alias="drivingTime")
    coordinates: Coordinates
    image_url: str = Field(default="/placeholder.svg", alias="imageUrl")
    tags: List[str] = Field(default_factory=list)
    vibe: List[str] = Field(default_factory=list)
    created_at: Optional[datetime] = Field(default=None, alias="createdAt")

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}
        json_schema_extra = {
            "example": {
                "name": "Hidden Gem Coffee Roasters",
                "category": "Café",
                "description": "Artisan coffee shop tucked away in a converted warehouse",
                "aiSummary": "This intimate café feels like a secret only locals know.",
                "rating": 4.9,
                "reviewCount": 567,
                "priceLevel": 2,
                "walkingTime": 8,
                "drivingTime": 3,
                "coordinates": {"lat": 37.8695, "lng": -122.2710},
                "imageUrl": "/placeholder.svg",
                "tags": ["coffee", "cozy", "artisan"],
                "vibe": ["warm", "intimate", "creative"],
            }
        }


class PlaceResponse(BaseModel):
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

    @classmethod
    def from_db(cls, place_doc: dict):
        return cls(
            id=place_doc["_id"],
            name=place_doc["name"],
            category=place_doc["category"],
            description=place_doc["description"],
            aiSummary=place_doc["ai_summary"],
            rating=place_doc["rating"],
            reviewCount=place_doc["review_count"],
            priceLevel=place_doc["price_level"],
            walkingTime=place_doc["walking_time"],
            drivingTime=place_doc["driving_time"],
            coordinates=Coordinates(**place_doc["coordinates"]),
            imageUrl=place_doc["image_url"],
            tags=place_doc["tags"],
            vibe=place_doc["vibe"],
        )

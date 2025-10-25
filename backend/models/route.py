from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field
from bson import ObjectId


class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v, info=None):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return ObjectId(v)

    @classmethod
    def __get_pydantic_json_schema__(cls, field_schema):
        field_schema.update(type="string")


class RouteBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    place_ids: List[str] = Field(..., min_length=2)


class RouteCreate(RouteBase):
    pass


class RouteInDB(RouteBase):
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    user_id: str
    total_walking_time: int = 0
    total_driving_time: int = 0
    narrative: str = ""
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


class RouteResponse(BaseModel):
    id: str = Field(alias="_id")
    user_id: str
    name: str
    place_ids: List[str]
    total_walking_time: int
    total_driving_time: int
    narrative: str
    created_at: datetime
    places: Optional[List[dict]] = None

    class Config:
        populate_by_name = True
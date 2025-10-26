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


class RouteBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    place_ids: Optional[List[int]] = Field(default=None, min_length=2)


class RouteCreate(RouteBase):
    pass


class RouteInDB(RouteBase):
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    user_id: str
    total_walking_time: int = 0
    total_driving_time: int = 0
    narrative: str = ""
    created_at: datetime = Field(default_factory=datetime.utcnow)
    demo_mode: Optional[bool] = Field(default=False)

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


class RouteResponse(BaseModel):
    id: int = Field(alias="_id")
    user_id: str
    name: str
    place_ids: Optional[List[int]] = None
    total_walking_time: int
    total_driving_time: int
    narrative: str
    created_at: datetime
    places: Optional[List[dict]] = None
    demo_mode: Optional[bool] = Field(default=False)

    class Config:
        populate_by_name = True

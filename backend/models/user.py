from datetime import datetime
from typing import Optional, List
from bson import ObjectId
from pydantic import BaseModel, EmailStr, Field
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


class UserPreferences(BaseModel):
    mood: List[str] = Field(default_factory=list)
    interests: List[str] = Field(default_factory=list)
    pace: Optional[str] = None
    budget: Optional[str] = None
    atmosphere: List[str] = Field(default_factory=list)


class UserBase(BaseModel):
    name: str = Field(..., min_length=1)
    email: EmailStr


class UserCreate(UserBase):
    password: str = Field(..., min_length=8)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserInDB(UserBase):
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    password_hash: str
    street_cred: int = Field(default=0)
    visited_places: List[str] = Field(default_factory=list)
    preferences: UserPreferences = Field(default_factory=UserPreferences)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


class UserResponse(UserBase):
    id: str = Field(..., alias="_id")
    street_cred: int = 0
    visited_places: List[str] = Field(default_factory=list)
    preferences: UserPreferences = Field(default_factory=UserPreferences)
    created_at: datetime
    updated_at: datetime

    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}


class UserWithToken(BaseModel):
    user: UserResponse
    token: str


User = UserBase

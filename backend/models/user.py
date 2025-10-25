from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime
from bson import ObjectId


class PyObjectId(ObjectId):
    """Custom ObjectId type for Pydantic."""
    
    @classmethod
    def __get_validators__(cls):
        yield cls.validate
    
    @classmethod
    def validate(cls, v, field=None):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return ObjectId(v)
    
    @classmethod
    def __get_pydantic_json_schema__(cls, field_schema):
        field_schema.update(type="string")


class UserPreferences(BaseModel):
    """User preferences for personalized recommendations."""
    mood: List[str] = Field(default_factory=list)
    interests: List[str] = Field(default_factory=list)
    pace: Optional[str] = None  # slow/moderate/fast
    budget: Optional[str] = None  # budget/moderate/luxury
    atmosphere: List[str] = Field(default_factory=list)


class UserBase(BaseModel):
    """Base user model with common fields."""
    name: str = Field(..., min_length=1)
    email: EmailStr


class UserCreate(UserBase):
    """User creation model with password."""
    password: str = Field(..., min_length=8)


class UserLogin(BaseModel):
    """User login model."""
    email: EmailStr
    password: str


class UserInDB(UserBase):
    """User model as stored in database."""
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
    """User response model (without sensitive data)."""
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
    """User response with JWT token."""
    user: UserResponse
    token: str
    

User = UserBase
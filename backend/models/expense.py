from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, field_validator
from bson import ObjectId


class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v, handler):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return ObjectId(v)

    @classmethod
    def __get_pydantic_json_schema__(cls, field_schema):
        field_schema.update(type="string")


class ExpenseBase(BaseModel):
    amount: float = Field(..., gt=0, description="Expense amount, must be greater than 0")
    category: str = Field(..., description="Expense category")
    description: str = Field(..., min_length=1, description="Expense description")
    place_id: Optional[str] = Field(None, description="Associated place ID")
    place_name: Optional[str] = Field(None, description="Associated place name")
    notes: Optional[str] = Field(None, description="Additional notes")
    date: datetime = Field(default_factory=datetime.utcnow, description="Expense date")

    @field_validator("category")
    @classmethod
    def validate_category(cls, v):
        valid_categories = ["food", "transport", "shopping", "entertainment", "accommodation", "other"]
        if v not in valid_categories:
            raise ValueError(f"Category must be one of: {', '.join(valid_categories)}")
        return v


class ExpenseCreate(ExpenseBase):
    pass


class ExpenseInDB(ExpenseBase):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    user_id: PyObjectId
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}
        json_schema_extra = {
            "example": {
                "amount": 15.50,
                "category": "food",
                "description": "Lunch at Cheese Board",
                "place_id": "507f1f77bcf86cd799439011",
                "place_name": "Cheese Board Collective",
                "notes": "Amazing vegetarian pizza",
                "date": "2025-01-01T12:00:00Z"
            }
        }


class ExpenseResponse(BaseModel):
    id: str = Field(alias="_id")
    user_id: str
    amount: float
    category: str
    description: str
    place_id: Optional[str] = None
    place_name: Optional[str] = None
    notes: Optional[str] = None
    date: datetime
    created_at: datetime

    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}


class ExpenseSummary(BaseModel):
    total: float = Field(description="Total amount of all expenses")
    count: int = Field(description="Number of expenses")
    average: float = Field(description="Average expense amount")
    by_category: dict[str, float] = Field(description="Breakdown by category with amounts")
    category_percentages: dict[str, float] = Field(description="Percentage of total for each category")


class ExpenseListResponse(BaseModel):
    expenses: list[ExpenseResponse]
    summary: ExpenseSummary
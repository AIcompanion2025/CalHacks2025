from datetime import datetime
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status
from bson import ObjectId

from auth.dependencies import get_current_user
from database import get_database
from models.user import User
from models.expense import (
    ExpenseCreate,
    ExpenseInDB,
    ExpenseResponse,
    ExpenseSummary,
    ExpenseListResponse
)

router = APIRouter(prefix="/api/v1/expenses", tags=["expenses"])


@router.post("", response_model=ExpenseResponse, status_code=status.HTTP_201_CREATED)
async def create_expense(
    expense_data: ExpenseCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    db=Depends(get_database)
):
    """
    Create a new expense for the current user.
    
    - **amount**: Expense amount (must be > 0)
    - **category**: One of: food, transport, shopping, entertainment, accommodation, other
    - **description**: Description of the expense
    - **place_id**: Optional associated place ID
    - **place_name**: Optional associated place name
    - **notes**: Optional additional notes
    - **date**: Expense date (defaults to current time)
    """
    # Create expense document
    expense_dict = expense_data.model_dump()
    expense_dict["user_id"] = ObjectId(current_user.id)
    expense_dict["created_at"] = datetime.utcnow()
    
    # Ensure date is set
    if "date" not in expense_dict or expense_dict["date"] is None:
        expense_dict["date"] = datetime.utcnow()
    
    # Insert into database
    result = await db.expenses.insert_one(expense_dict)
    
    # Fetch the created expense
    created_expense = await db.expenses.find_one({"_id": result.inserted_id})
    
    # Convert to response model
    return ExpenseResponse(
        _id=str(created_expense["_id"]),
        user_id=str(created_expense["user_id"]),
        amount=created_expense["amount"],
        category=created_expense["category"],
        description=created_expense["description"],
        place_id=str(created_expense["place_id"]) if created_expense.get("place_id") else None,
        place_name=created_expense.get("place_name"),
        notes=created_expense.get("notes"),
        date=created_expense["date"],
        created_at=created_expense["created_at"]
    )


@router.get("", response_model=ExpenseListResponse)
async def list_expenses(
    current_user: Annotated[User, Depends(get_current_user)],
    db=Depends(get_database)
):
    """
    List all expenses for the current user with summary statistics.
    
    Returns:
    - List of expenses sorted by date (newest first)
    - Summary with total, count, average, and category breakdown
    """
    # Fetch all expenses for the current user
    cursor = db.expenses.find({"user_id": ObjectId(current_user.id)}).sort("date", -1)
    expenses_list = await cursor.to_list(length=None)
    
    # Convert to response models
    expense_responses = []
    for expense in expenses_list:
        expense_responses.append(ExpenseResponse(
            _id=str(expense["_id"]),
            user_id=str(expense["user_id"]),
            amount=expense["amount"],
            category=expense["category"],
            description=expense["description"],
            place_id=str(expense["place_id"]) if expense.get("place_id") else None,
            place_name=expense.get("place_name"),
            notes=expense.get("notes"),
            date=expense["date"],
            created_at=expense["created_at"]
        ))
    
    # Calculate summary statistics
    total = sum(expense["amount"] for expense in expenses_list)
    count = len(expenses_list)
    average = total / count if count > 0 else 0.0
    
    # Calculate category breakdown
    by_category = {}
    for expense in expenses_list:
        category = expense["category"]
        by_category[category] = by_category.get(category, 0.0) + expense["amount"]
    
    # Calculate category percentages
    category_percentages = {}
    if total > 0:
        for category, amount in by_category.items():
            category_percentages[category] = round((amount / total) * 100, 2)
    
    summary = ExpenseSummary(
        total=round(total, 2),
        count=count,
        average=round(average, 2),
        by_category=by_category,
        category_percentages=category_percentages
    )
    
    return ExpenseListResponse(
        expenses=expense_responses,
        summary=summary
    )


@router.delete("/{expense_id}", status_code=status.HTTP_200_OK)
async def delete_expense(
    expense_id: str,
    current_user: Annotated[User, Depends(get_current_user)],
    db=Depends(get_database)
):
    """
    Delete an expense.
    
    Only the owner of the expense can delete it.
    """
    # Validate ObjectId
    if not ObjectId.is_valid(expense_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid expense ID format"
        )
    
    # Find the expense
    expense = await db.expenses.find_one({"_id": ObjectId(expense_id)})
    
    if not expense:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Expense not found"
        )
    
    # Verify ownership
    if str(expense["user_id"]) != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this expense"
        )
    
    # Delete the expense
    await db.expenses.delete_one({"_id": ObjectId(expense_id)})
    
    return {"message": "Expense deleted successfully"}
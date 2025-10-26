"""Authentication router for AI City Companion API."""
from fastapi import APIRouter, HTTPException, status
from datetime import timedelta

from models.user import UserCreate, UserLogin, UserWithToken, UserResponse
from services.auth import authenticate_user, create_user, create_access_token
from config import settings

router = APIRouter(prefix="/api/v1/auth", tags=["authentication"])


@router.post("/register", response_model=UserWithToken, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate):
    """
    Register a new user.
    
    Args:
        user_data: User registration data (name, email, password)
        
    Returns:
        User object with JWT access token
        
    Raises:
        HTTPException: If email already exists or registration fails
    """
    # Create user
    user = await create_user(user_data)
    
    # Create access token
    access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
    access_token = create_access_token(
        data={"sub": str(user.id)},
        expires_delta=access_token_expires
    )
    
    # Convert user to response format
    user_dict = user.model_dump(by_alias=True)
    user_dict["_id"] = str(user.id)
    user_response = UserResponse(**user_dict)
    
    return UserWithToken(user=user_response, token=access_token)


@router.post("/login", response_model=UserWithToken)
async def login(credentials: UserLogin):
    """
    Login with email and password.
    
    Args:
        credentials: User login credentials (email, password)
        
    Returns:
        User object with JWT access token
        
    Raises:
        HTTPException: If credentials are invalid
    """
    # Authenticate user
    user = await authenticate_user(credentials.email, credentials.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create access token
    access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
    access_token = create_access_token(
        data={"sub": str(user.id)},
        expires_delta=access_token_expires
    )
    
    # Convert user to response format
    user_dict = user.model_dump(by_alias=True)
    user_dict["_id"] = str(user.id)
    user_response = UserResponse(**user_dict)
    
    return UserWithToken(user=user_response, token=access_token)
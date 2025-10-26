"""Authentication router for AI City Companion API."""
from fastapi import APIRouter, HTTPException, status
from datetime import timedelta

from models.user import UserCreate, UserLogin, UserWithToken, UserResponse
from services.auth import authenticate_user, create_user, create_access_token
from config import settings
import logging
from pydantic import BaseModel, EmailStr

router = APIRouter(tags=["authentication"])  # Remove prefix from here
logger = logging.getLogger(__name__)

class AuthResponse(BaseModel):
    message: str
    user: UserResponse
    token: str


@router.post("/register", status_code=status.HTTP_201_CREATED, response_model=AuthResponse)
async def register(user_data: UserCreate):
    logger.info(f"=== REGISTER ENDPOINT HIT ===")
    logger.info(f"Received data: {user_data}")
    
    try:
        logger.info("About to call create_user")
        user = await create_user(user_data)
        logger.info(f"User created: {user}")
        
        # Create access token
        access_token = create_access_token(data={"sub": user.email})
        
        # Return the proper response format with timestamps
        return {
            "message": "User created successfully",
            "user": {
                "id": str(user.id),
                "email": user.email,
                "name": user.name,
                "street_cred": user.street_cred,
                "created_at": user.created_at,
                "updated_at": user.updated_at
            },
            "token": access_token
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"ERROR: {str(e)}")
        logger.error(f"Exception type: {type(e)}")
        import traceback
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

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
        data={"sub": user.email},
        expires_delta=access_token_expires
    )
    
    # Convert user to response format - ensure _id is a string
    user_dict = user.model_dump(by_alias=True, exclude={'password_hash'})
    # Make sure _id is converted to string
    if '_id' in user_dict:
        user_dict["_id"] = str(user_dict["_id"])
    
    user_response = UserResponse(**user_dict)
    
    return UserWithToken(user=user_response, token=access_token)
from fastapi import APIRouter, HTTPException, status, Depends
from datetime import datetime
from bson import ObjectId
from database import get_database
from models.user import UserCreate, UserLogin, UserWithToken, UserResponse, UserInDB, UserPreferences
from auth.utils import hash_password, verify_password, create_access_token
from auth.dependencies import get_current_user

router = APIRouter(prefix="/api/v1/auth", tags=["Authentication"])


@router.post("/signup", response_model=UserWithToken, status_code=status.HTTP_201_CREATED)
async def signup(user_data: UserCreate):
    """
    Register a new user.
    
    - Validates email format and password length (min 8 chars)
    - Checks email uniqueness
    - Hashes password with Argon2
    - Creates user in MongoDB with initial Street Cred of 0
    - Returns user object and JWT token
    """
    db = get_database()
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection unavailable"
        )
    
    # Check if email already exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Hash the password
    password_hash = hash_password(user_data.password)
    
    # Create user document
    now = datetime.utcnow()
    user_doc = {
        "name": user_data.name,
        "email": user_data.email,
        "password_hash": password_hash,
        "street_cred": 0,
        "visited_places": [],
        "preferences": {
            "mood": [],
            "interests": [],
            "pace": None,
            "budget": None,
            "atmosphere": []
        },
        "created_at": now,
        "updated_at": now
    }
    
    # Insert user into database
    result = await db.users.insert_one(user_doc)
    user_doc["_id"] = result.inserted_id
    
    # Create JWT token
    token = create_access_token(data={"sub": str(result.inserted_id)})
    
    # Convert to response model
    user_response = UserResponse(
        _id=str(result.inserted_id),
        name=user_doc["name"],
        email=user_doc["email"],
        street_cred=user_doc["street_cred"],
        visited_places=user_doc["visited_places"],
        preferences=UserPreferences(**user_doc["preferences"]),
        created_at=user_doc["created_at"],
        updated_at=user_doc["updated_at"]
    )
    
    return UserWithToken(user=user_response, token=token)


@router.post("/login", response_model=UserWithToken)
async def login(credentials: UserLogin):
    """
    Login an existing user.
    
    - Validates credentials
    - Verifies password hash
    - Generates JWT token
    - Returns user object and token
    """
    db = get_database()
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection unavailable"
        )
    
    # Find user by email
    user_doc = await db.users.find_one({"email": credentials.email})
    if not user_doc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Verify password
    if not verify_password(credentials.password, user_doc["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Create JWT token
    token = create_access_token(data={"sub": str(user_doc["_id"])})
    
    # Convert to response model
    user_response = UserResponse(
        _id=str(user_doc["_id"]),
        name=user_doc["name"],
        email=user_doc["email"],
        street_cred=user_doc.get("street_cred", 0),
        visited_places=user_doc.get("visited_places", []),
        preferences=UserPreferences(**user_doc.get("preferences", {})),
        created_at=user_doc["created_at"],
        updated_at=user_doc["updated_at"]
    )
    
    return UserWithToken(user=user_response, token=token)


@router.post("/logout")
async def logout():
    """
    Logout user (client-side token removal).
    
    Returns success message. The client is responsible for removing the JWT token.
    """
    return {"message": "Logged out successfully"}


@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(current_user: UserInDB = Depends(get_current_user)):
    """
    Get current authenticated user's profile.
    
    Requires valid JWT token in Authorization header.
    Returns current user profile data.
    """
    return UserResponse(
        _id=str(current_user.id),
        name=current_user.name,
        email=current_user.email,
        street_cred=current_user.street_cred,
        visited_places=current_user.visited_places,
        preferences=current_user.preferences,
        created_at=current_user.created_at,
        updated_at=current_user.updated_at
    )
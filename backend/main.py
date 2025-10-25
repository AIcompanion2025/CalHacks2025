from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from config import settings
from database import connect_to_mongo, close_mongo_connection, get_database
from routers import auth, users

app = FastAPI(
    title="AI City Companion API",
    description="Backend API for AI City Companion - Berkeley exploration app",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(users.router)


@app.on_event("startup")
async def startup_event():
    """Connect to MongoDB on startup."""
    await connect_to_mongo()


@app.on_event("shutdown")
async def shutdown_event():
    """Close MongoDB connection on shutdown."""
    await close_mongo_connection()


@app.get("/healthz")
async def health_check():
    """Health check endpoint with database status."""
    try:
        db = get_database()
        if db is None:
            return {"status": "ok", "database": "disconnected"}
        
        # Ping the database to verify connection
        await db.command('ping')
        return {"status": "ok", "database": "connected"}
    except Exception as e:
        return {"status": "ok", "database": f"error: {str(e)}"}


@app.get("/")
async def root():
    """Root endpoint."""
    return {"message": "AI City Companion API", "version": "1.0.0"}
from motor.motor_asyncio import AsyncIOMotorClient  # NOT from pymongo!
from config import settings

client = None
db = None

async def connect_to_mongo():
    global client, db
    try:
        # This MUST be AsyncIOMotorClient, not MongoClient
        client = AsyncIOMotorClient(settings.mongodb_uri)
        
        # Get database name from URI or specify explicitly
        db = client["appthing"]  # Replace with your database name
        
        # Test the connection
        await client.admin.command('ping')
        print("Connected to MongoDB successfully!")
    except Exception as e:
        print(f"Failed to connect to MongoDB: {e}")
        raise

async def close_mongo_connection():
    global client
    if client:
        client.close()
        print("MongoDB connection closed.")

def get_database():
    return db
from motor.motor_asyncio import AsyncIOMotorClient
from config import settings
import logging

logger = logging.getLogger(__name__)

# Global database client
client: AsyncIOMotorClient = None
database = None


async def connect_to_mongo():
    """Connect to MongoDB Atlas on startup."""
    global client, database
    try:
        client = AsyncIOMotorClient(settings.mongodb_uri)
        database = client.ai_city_companion
        
        # Ping the database to verify connection
        await client.admin.command('ping')
        logger.info("✅ Connected to MongoDB Atlas")
    except Exception as e:
        logger.error(f"❌ Failed to connect to MongoDB: {e}")
        raise


async def close_mongo_connection():
    """Close MongoDB connection on shutdown."""
    global client
    if client:
        client.close()
        logger.info("🔌 Closed MongoDB connection")


def get_database():
    """Get database instance."""
    return database
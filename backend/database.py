from motor.motor_asyncio import AsyncIOMotorClient
from config import settings
import logging
import certifi
import ssl

logger = logging.getLogger(__name__)

# Database connection state
class DatabaseConnection:
    client: AsyncIOMotorClient = None
    db = None

_db_connection = DatabaseConnection()

async def connect_to_mongo():
    """Connect to MongoDB and initialize the database."""
    try:
        logger.info(f"Connecting to MongoDB...")
        logger.info(f"URI preview: {settings.mongodb_uri[:30]}...")
        
        # Configure TLS/SSL settings for MongoDB Atlas
        _db_connection.client = AsyncIOMotorClient(
            settings.mongodb_uri,
            tlsCAFile=certifi.where(),
            serverSelectionTimeoutMS=5000,
            connectTimeoutMS=20000,
            socketTimeoutMS=20000
        )
        
        # Extract database name from the connection string or use default
        # Format: mongodb+srv://user:pass@cluster.mongodb.net/DATABASE_NAME?params
        
        # Try to get database name from URI
        if "/" in settings.mongodb_uri.split("@")[-1]:
            db_name = settings.mongodb_uri.split("@")[-1].split("/")[1].split("?")[0]
            if not db_name:
                db_name = "appthing"  # fallback
        else:
            db_name = "appthing"  # default database name
        
        _db_connection.db = _db_connection.client[db_name]
        
        # Test the connection
        await _db_connection.client.admin.command('ping')
        logger.info(f"✓ Connected to MongoDB successfully! Database: {db_name}")
        logger.info(f"✓ Database object created: {_db_connection.db is not None}")
        
    except Exception as e:
        logger.error(f"✗ Failed to connect to MongoDB: {e}")
        import traceback
        logger.error(traceback.format_exc())
        _db_connection.db = None
        raise

async def close_mongo_connection():
    """Close MongoDB connection."""
    if _db_connection.client:
        _db_connection.client.close()
        logger.info("MongoDB connection closed.")

def get_database():
    """Get the database instance."""
    if _db_connection.db is None:
        logger.error("❌ get_database() called but db is None!")
        logger.error(f"Client exists: {_db_connection.client is not None}")
    else:
        logger.info(f"✓ get_database() returning database: {_db_connection.db.name}")
    return _db_connection.db
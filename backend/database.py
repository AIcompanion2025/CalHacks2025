from motor.motor_asyncio import AsyncIOMotorClient
from config import settings
import logging

logger = logging.getLogger(__name__)

client = None
db = None

async def connect_to_mongo():
    global client, db
    try:
        logger.info(f"Connecting to MongoDB...")
        logger.info(f"URI preview: {settings.mongodb_uri[:30]}...")
        
        client = AsyncIOMotorClient(settings.mongodb_uri)
        
        # Extract database name from the connection string or use default
        # Your URI likely has the database name in it
        # Format: mongodb+srv://user:pass@cluster.mongodb.net/DATABASE_NAME?params
        
        # Try to get database name from URI
        if "/" in settings.mongodb_uri.split("@")[-1]:
            db_name = settings.mongodb_uri.split("@")[-1].split("/")[1].split("?")[0]
            if not db_name:
                db_name = "appthing"  # fallback
        else:
            db_name = "appthing"  # default database name
        
        db = client[db_name]
        
        # Test the connection
        await client.admin.command('ping')
        logger.info(f"✓ Connected to MongoDB successfully! Database: {db_name}")
        logger.info(f"✓ Database object created: {db is not None}")
        
    except Exception as e:
        logger.error(f"✗ Failed to connect to MongoDB: {e}")
        import traceback
        logger.error(traceback.format_exc())
        db = None
        raise

async def close_mongo_connection():
    global client
    if client:
        client.close()
        logger.info("MongoDB connection closed.")

def get_database():
    if db is None:
        logger.error("❌ get_database() called but db is None!")
        logger.error(f"Client exists: {client is not None}")
    else:
        logger.info(f"✓ get_database() returning database: {db.name}")
    return db
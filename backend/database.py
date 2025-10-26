# database.py
from pymongo import MongoClient
from config import settings

client = None
db = None

def connect_to_mongo():
    """Connect to MongoDB and initialize the database."""
    global client, db
    try:
        client = MongoClient("mongodb://localhost:27017/")
        db = client["mydatabase"]
        print("Connected to MongoDB successfully!")
    except Exception as e:
        print("MongoDB connection failed:", e)

def get_database():
    """Return the database instance."""
    global db
    return db

def close_mongo_connection():
    """Close the MongoDB connection."""
    global client
    if client:
        client.close()
        print("MongoDB connection closed.")

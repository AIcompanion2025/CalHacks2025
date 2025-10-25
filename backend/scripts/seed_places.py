"""Seed script to populate the database with places data."""
import asyncio
import sys
import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from .env file
env_path = Path(__file__).parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

# Add parent directory to path to import backend modules
sys.path.append(str(Path(__file__).parent.parent.parent))

from motor.motor_asyncio import AsyncIOMotorClient
from backend.config import settings
from datetime import datetime


# Places data converted from frontend mockPlaces.ts
PLACES_DATA = [
    {
        "name": "Vintage Berkeley Post Office",
        "category": "Historic Site",
        "description": "A beautifully preserved 1914 post office building with stunning architecture",
        "ai_summary": "Step into a time capsule of early 20th century Berkeley. The ornate details and quiet atmosphere make this a perfect spot for reflection and photography.",
        "rating": 4.7,
        "review_count": 234,
        "price_level": 0,
        "walking_time": 5,
        "driving_time": 2,
        "coordinates": {"lat": 37.8715, "lng": -122.2730},
        "image_url": "/placeholder.svg",
        "tags": ["historic", "architecture", "photo-worthy"],
        "vibe": ["quiet", "vintage", "reflective"]
    },
    {
        "name": "Hidden Gem Coffee Roasters",
        "category": "Café",
        "description": "Artisan coffee shop tucked away in a converted warehouse",
        "ai_summary": "This intimate café feels like a secret only locals know. The aroma of freshly roasted beans and the warm lighting create the perfect cozy atmosphere.",
        "rating": 4.9,
        "review_count": 567,
        "price_level": 2,
        "walking_time": 8,
        "driving_time": 3,
        "coordinates": {"lat": 37.8695, "lng": -122.2710},
        "image_url": "/placeholder.svg",
        "tags": ["coffee", "cozy", "artisan"],
        "vibe": ["warm", "intimate", "creative"]
    },
    {
        "name": "Telegraph Avenue Vintage Market",
        "category": "Shopping",
        "description": "Eclectic vintage store with curated finds from the 60s-90s",
        "ai_summary": "A treasure trove for vintage enthusiasts. Each item tells a story, and the owner is always ready to share the history behind the pieces.",
        "rating": 4.6,
        "review_count": 189,
        "price_level": 2,
        "walking_time": 12,
        "driving_time": 5,
        "coordinates": {"lat": 37.8685, "lng": -122.2590},
        "image_url": "/placeholder.svg",
        "tags": ["vintage", "shopping", "unique"],
        "vibe": ["nostalgic", "eclectic", "discovery"]
    },
    {
        "name": "Berkeley Rose Garden",
        "category": "Park",
        "description": "Terraced amphitheater garden with over 3,000 rose bushes",
        "ai_summary": "A hidden oasis above the city. The terraced design offers stunning views while the fragrant roses create a sensory experience unlike any other.",
        "rating": 4.8,
        "review_count": 892,
        "price_level": 0,
        "walking_time": 25,
        "driving_time": 8,
        "coordinates": {"lat": 37.8795, "lng": -122.2650},
        "image_url": "/placeholder.svg",
        "tags": ["nature", "scenic", "peaceful"],
        "vibe": ["serene", "romantic", "beautiful"]
    },
    {
        "name": "Cheese Board Collective",
        "category": "Restaurant",
        "description": "Worker-owned cooperative serving legendary vegetarian pizza",
        "ai_summary": "More than just pizza—it's a Berkeley institution. The daily-changing menu and live music create a vibrant community atmosphere.",
        "rating": 4.7,
        "review_count": 1234,
        "price_level": 1,
        "walking_time": 15,
        "driving_time": 6,
        "coordinates": {"lat": 37.8795, "lng": -122.2685},
        "image_url": "/placeholder.svg",
        "tags": ["food", "vegetarian", "local-favorite"],
        "vibe": ["lively", "community", "delicious"]
    },
    {
        "name": "Moe's Books",
        "category": "Bookstore",
        "description": "Four-story independent bookstore with rare and used books",
        "ai_summary": "Get lost in the labyrinth of literary treasures. Each floor reveals new discoveries, and the creaky wooden floors add to the charm.",
        "rating": 4.8,
        "review_count": 445,
        "price_level": 1,
        "walking_time": 10,
        "driving_time": 4,
        "coordinates": {"lat": 37.8680, "lng": -122.2595},
        "image_url": "/placeholder.svg",
        "tags": ["books", "culture", "browsing"],
        "vibe": ["intellectual", "cozy", "timeless"]
    },
    {
        "name": "Berkeley Art Studio",
        "category": "Gallery",
        "description": "Contemporary art space featuring local emerging artists",
        "ai_summary": "Raw creativity on display. The rotating exhibitions showcase Berkeley's vibrant art scene and often feature interactive installations.",
        "rating": 4.5,
        "review_count": 156,
        "price_level": 0,
        "walking_time": 18,
        "driving_time": 7,
        "coordinates": {"lat": 37.8705, "lng": -122.2720},
        "image_url": "/placeholder.svg",
        "tags": ["art", "culture", "contemporary"],
        "vibe": ["creative", "inspiring", "modern"]
    },
    {
        "name": "Tilden Park Steam Trains",
        "category": "Attraction",
        "description": "Miniature steam train rides through redwood groves",
        "ai_summary": "A whimsical journey through nature. The vintage trains and scenic route make this a delightful escape from the urban environment.",
        "rating": 4.9,
        "review_count": 678,
        "price_level": 1,
        "walking_time": 45,
        "driving_time": 15,
        "coordinates": {"lat": 37.8925, "lng": -122.2475},
        "image_url": "/placeholder.svg",
        "tags": ["family", "nature", "unique"],
        "vibe": ["playful", "nostalgic", "scenic"]
    },
    {
        "name": "Guerrilla Café",
        "category": "Café",
        "description": "Minimalist café known for exceptional espresso and pastries",
        "ai_summary": "A coffee purist's dream. The baristas are true craftspeople, and the simple aesthetic lets the quality of the coffee shine through.",
        "rating": 4.8,
        "review_count": 423,
        "price_level": 2,
        "walking_time": 7,
        "driving_time": 3,
        "coordinates": {"lat": 37.8700, "lng": -122.2680},
        "image_url": "/placeholder.svg",
        "tags": ["coffee", "minimalist", "quality"],
        "vibe": ["focused", "modern", "refined"]
    },
    {
        "name": "Indian Rock Park",
        "category": "Park",
        "description": "Natural rock formation with panoramic bay views",
        "ai_summary": "Climb to the top for breathtaking 360-degree views. It's a local favorite for sunset watching and a surprisingly peaceful escape.",
        "rating": 4.7,
        "review_count": 512,
        "price_level": 0,
        "walking_time": 30,
        "driving_time": 10,
        "coordinates": {"lat": 37.8890, "lng": -122.2710},
        "image_url": "/placeholder.svg",
        "tags": ["nature", "views", "hiking"],
        "vibe": ["adventurous", "scenic", "peaceful"]
    },
    {
        "name": "Chez Panisse",
        "category": "Restaurant",
        "description": "Legendary farm-to-table restaurant by Alice Waters",
        "ai_summary": "The birthplace of California cuisine. Every dish is a celebration of local, seasonal ingredients prepared with reverence and creativity.",
        "rating": 4.9,
        "review_count": 2341,
        "price_level": 3,
        "walking_time": 20,
        "driving_time": 8,
        "coordinates": {"lat": 37.8795, "lng": -122.2695},
        "image_url": "/placeholder.svg",
        "tags": ["fine-dining", "farm-to-table", "iconic"],
        "vibe": ["elegant", "sophisticated", "memorable"]
    },
    {
        "name": "Berkeley Flea Market",
        "category": "Shopping",
        "description": "Weekend market with vintage finds, crafts, and local goods",
        "ai_summary": "Every visit is different. From antique furniture to handmade jewelry, you never know what treasures you'll discover among the stalls.",
        "rating": 4.4,
        "review_count": 287,
        "price_level": 1,
        "walking_time": 35,
        "driving_time": 12,
        "coordinates": {"lat": 37.8650, "lng": -122.2800},
        "image_url": "/placeholder.svg",
        "tags": ["vintage", "crafts", "local"],
        "vibe": ["bustling", "eclectic", "treasure-hunt"]
    },
    {
        "name": "Habitot Children's Museum",
        "category": "Attraction",
        "description": "Interactive museum designed for young children",
        "ai_summary": "A wonderland for little ones. The hands-on exhibits encourage creativity and learning through play in a safe, engaging environment.",
        "rating": 4.6,
        "review_count": 534,
        "price_level": 1,
        "walking_time": 22,
        "driving_time": 9,
        "coordinates": {"lat": 37.8720, "lng": -122.2750},
        "image_url": "/placeholder.svg",
        "tags": ["family", "educational", "interactive"],
        "vibe": ["playful", "colorful", "energetic"]
    },
    {
        "name": "Elmwood Café",
        "category": "Café",
        "description": "Neighborhood café with outdoor seating and fresh pastries",
        "ai_summary": "The heart of the Elmwood district. Perfect for people-watching while enjoying a latte and the best croissants in Berkeley.",
        "rating": 4.5,
        "review_count": 398,
        "price_level": 2,
        "walking_time": 16,
        "driving_time": 6,
        "coordinates": {"lat": 37.8600, "lng": -122.2620},
        "image_url": "/placeholder.svg",
        "tags": ["coffee", "pastries", "outdoor-seating"],
        "vibe": ["relaxed", "neighborhood", "friendly"]
    },
    {
        "name": "Berkeley Marina",
        "category": "Park",
        "description": "Waterfront park with walking trails and bay views",
        "ai_summary": "Where the city meets the water. The pier extends into the bay, offering stunning views of San Francisco and the Golden Gate Bridge.",
        "rating": 4.7,
        "review_count": 1089,
        "price_level": 0,
        "walking_time": 50,
        "driving_time": 15,
        "coordinates": {"lat": 37.8650, "lng": -122.3150},
        "image_url": "/placeholder.svg",
        "tags": ["waterfront", "views", "walking"],
        "vibe": ["breezy", "expansive", "refreshing"]
    },
    {
        "name": "Amoeba Music",
        "category": "Shopping",
        "description": "Massive independent music store with vinyl, CDs, and memorabilia",
        "ai_summary": "A music lover's paradise. Spend hours browsing through rare vinyl, catching in-store performances, and discovering new artists.",
        "rating": 4.8,
        "review_count": 876,
        "price_level": 2,
        "walking_time": 11,
        "driving_time": 4,
        "coordinates": {"lat": 37.8675, "lng": -122.2585},
        "image_url": "/placeholder.svg",
        "tags": ["music", "vinyl", "culture"],
        "vibe": ["nostalgic", "vibrant", "discovery"]
    },
    {
        "name": "The Foundry",
        "category": "Gallery",
        "description": "Industrial-chic gallery space showcasing digital and mixed media art",
        "ai_summary": "Where technology meets artistry. This converted warehouse hosts cutting-edge exhibitions that push the boundaries of contemporary art.",
        "rating": 4.7,
        "review_count": 203,
        "price_level": 0,
        "walking_time": 14,
        "driving_time": 5,
        "coordinates": {"lat": 37.8710, "lng": -122.2695},
        "image_url": "/placeholder.svg",
        "tags": ["art", "digital", "contemporary"],
        "vibe": ["creative", "modern", "innovative"]
    },
    {
        "name": "Makers Workshop",
        "category": "Attraction",
        "description": "Community makerspace with 3D printers, laser cutters, and workshops",
        "ai_summary": "Bring your ideas to life. This collaborative space empowers creators with tools and knowledge to build anything they can imagine.",
        "rating": 4.9,
        "review_count": 312,
        "price_level": 1,
        "walking_time": 19,
        "driving_time": 7,
        "coordinates": {"lat": 37.8688, "lng": -122.2715},
        "image_url": "/placeholder.svg",
        "tags": ["technology", "workshop", "hands-on"],
        "vibe": ["creative", "inspiring", "collaborative"]
    },
    {
        "name": "Lightbox Studio",
        "category": "Gallery",
        "description": "Photography gallery featuring emerging and established artists",
        "ai_summary": "Every image tells a story. The carefully curated exhibitions showcase powerful visual narratives that challenge and inspire.",
        "rating": 4.6,
        "review_count": 178,
        "price_level": 0,
        "walking_time": 13,
        "driving_time": 5,
        "coordinates": {"lat": 37.8702, "lng": -122.2708},
        "image_url": "/placeholder.svg",
        "tags": ["photography", "art", "visual"],
        "vibe": ["inspiring", "modern", "thought-provoking"]
    },
    {
        "name": "Urban Canvas",
        "category": "Gallery",
        "description": "Street art gallery celebrating graffiti and urban culture",
        "ai_summary": "Art without boundaries. This vibrant space brings street art indoors while maintaining its raw, rebellious energy.",
        "rating": 4.8,
        "review_count": 267,
        "price_level": 0,
        "walking_time": 16,
        "driving_time": 6,
        "coordinates": {"lat": 37.8692, "lng": -122.2598},
        "image_url": "/placeholder.svg",
        "tags": ["street-art", "urban", "graffiti"],
        "vibe": ["creative", "bold", "modern"]
    },
    {
        "name": "Nexus Innovation Hub",
        "category": "Café",
        "description": "Tech-forward café with coworking space and startup events",
        "ai_summary": "Where ideas meet execution. This sleek space buzzes with entrepreneurial energy and serves excellent coffee to fuel innovation.",
        "rating": 4.7,
        "review_count": 445,
        "price_level": 2,
        "walking_time": 12,
        "driving_time": 4,
        "coordinates": {"lat": 37.8698, "lng": -122.2672},
        "image_url": "/placeholder.svg",
        "tags": ["coworking", "tech", "networking"],
        "vibe": ["modern", "inspiring", "dynamic"]
    },
    {
        "name": "Prism Design Studio",
        "category": "Gallery",
        "description": "Multidisciplinary design studio with rotating installations",
        "ai_summary": "Design in all its forms. From furniture to fashion, this studio showcases how thoughtful design shapes our daily lives.",
        "rating": 4.8,
        "review_count": 189,
        "price_level": 0,
        "walking_time": 15,
        "driving_time": 6,
        "coordinates": {"lat": 37.8705, "lng": -122.2685},
        "image_url": "/placeholder.svg",
        "tags": ["design", "installation", "multidisciplinary"],
        "vibe": ["creative", "inspiring", "modern"]
    },
    {
        "name": "The Glass House",
        "category": "Café",
        "description": "Minimalist café with floor-to-ceiling windows and natural light",
        "ai_summary": "A sanctuary of light and space. The transparent design creates a seamless connection between inside and outside.",
        "rating": 4.9,
        "review_count": 521,
        "price_level": 2,
        "walking_time": 10,
        "driving_time": 4,
        "coordinates": {"lat": 37.8708, "lng": -122.2678},
        "image_url": "/placeholder.svg",
        "tags": ["coffee", "architecture", "minimalist"],
        "vibe": ["modern", "serene", "inspiring"]
    },
    {
        "name": "Velocity Art Collective",
        "category": "Gallery",
        "description": "Artist-run gallery featuring experimental and avant-garde works",
        "ai_summary": "Art that challenges conventions. This collective pushes boundaries and invites viewers to question their perceptions.",
        "rating": 4.6,
        "review_count": 234,
        "price_level": 0,
        "walking_time": 17,
        "driving_time": 7,
        "coordinates": {"lat": 37.8695, "lng": -122.2702},
        "image_url": "/placeholder.svg",
        "tags": ["experimental", "avant-garde", "collective"],
        "vibe": ["creative", "bold", "inspiring"]
    }
]


async def seed_places():
    """Seed the database with places data."""
    print("🌱 Starting places seed script...")
    
    # Connect to MongoDB
    client = AsyncIOMotorClient(settings.mongodb_uri)
    db = client.ai_city_companion
    places_collection = db.places
    
    try:
        # Check if places already exist
        existing_count = await places_collection.count_documents({})
        if existing_count > 0:
            print(f"⚠️  Database already contains {existing_count} places.")
            response = input("Do you want to clear existing places and reseed? (yes/no): ")
            if response.lower() == 'yes':
                await places_collection.delete_many({})
                print("🗑️  Cleared existing places.")
            else:
                print("❌ Seed cancelled.")
                return
        
        # Add created_at timestamp to each place
        for place in PLACES_DATA:
            place["created_at"] = datetime.utcnow()
        
        # Insert all places
        result = await places_collection.insert_many(PLACES_DATA)
        print(f"✅ Successfully seeded {len(result.inserted_ids)} places!")
        
        # Verify insertion
        total_places = await places_collection.count_documents({})
        print(f"📊 Total places in database: {total_places}")
        
    except Exception as e:
        print(f"❌ Error seeding places: {e}")
    finally:
        client.close()
        print("🔌 Closed MongoDB connection")


if __name__ == "__main__":
    asyncio.run(seed_places())
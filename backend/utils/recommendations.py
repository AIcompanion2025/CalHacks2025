"""Recommendations algorithm for AI City Companion."""
from typing import List, Dict, Any
from models.place import PlaceResponse


async def generate_recommendations(
    db,
    mood: str,
    time_available: int,
    price_level: int,
    interests: List[str]
) -> List[Dict[str, Any]]:
    """
    Generate personalized place recommendations based on user preferences.
    
    Algorithm:
    1. Filter places by walking_time <= time_available
    2. Filter places by price_level <= max price
    3. Score places based on mood matching vibe
    4. Score places based on interests matching tags/category
    5. Return top 6 matches sorted by score
    
    Args:
        db: Database instance
        mood: User's current mood (e.g., "relaxed", "adventurous", "curious")
        time_available: Available time in minutes
        price_level: Maximum price level (0-3)
        interests: List of user interests
    
    Returns:
        List of recommended places with scores
    """
    places_collection = db.places
    
    # Build base filter query
    filter_query = {
        "walking_time": {"$lte": time_available},
        "price_level": {"$lte": price_level}
    }
    
    # Fetch matching places
    places_cursor = places_collection.find(filter_query)
    places_list = await places_cursor.to_list(length=None)
    
    if not places_list:
        return []
    
    # Score each place
    scored_places = []
    mood_lower = mood.lower() if mood else ""
    interests_lower = [interest.lower() for interest in interests]
    
    for place in places_list:
        score = 0
        
        # Mood matching with vibe (+1 for each match)
        if mood_lower:
            place_vibes = [vibe.lower() for vibe in place.get("vibe", [])]
            if mood_lower in place_vibes:
                score += 2  # Exact match
            else:
                # Check for related moods
                mood_synonyms = get_mood_synonyms(mood_lower)
                for vibe in place_vibes:
                    if vibe in mood_synonyms:
                        score += 1
        
        # Interest matching with tags and category (+1 for each match)
        if interests_lower:
            place_tags = [tag.lower() for tag in place.get("tags", [])]
            place_category = place.get("category", "").lower()
            
            for interest in interests_lower:
                if interest in place_tags:
                    score += 1
                if interest in place_category:
                    score += 1
        
        # Bonus for high ratings
        rating = place.get("rating", 0)
        if rating >= 4.8:
            score += 2
        elif rating >= 4.5:
            score += 1
        
        # Convert to response format and add score
        place_response = PlaceResponse.from_db(place)
        place_dict = place_response.model_dump()
        place_dict["score"] = score
        
        scored_places.append(place_dict)
    
    # Sort by score (descending) and return top 6
    scored_places.sort(key=lambda x: x["score"], reverse=True)
    
    # Remove score from final output (internal use only)
    top_recommendations = scored_places[:6]
    for rec in top_recommendations:
        rec.pop("score", None)
    
    return top_recommendations


def get_mood_synonyms(mood: str) -> List[str]:
    """
    Get synonyms and related words for a given mood.
    
    Args:
        mood: The mood to find synonyms for
    
    Returns:
        List of related mood words
    """
    mood_map = {
        "relaxed": ["peaceful", "serene", "calm", "quiet", "tranquil", "cozy"],
        "adventurous": ["exciting", "bold", "daring", "playful", "energetic"],
        "curious": ["discovery", "exploring", "intellectual", "thought-provoking"],
        "energetic": ["lively", "vibrant", "dynamic", "bustling", "playful"],
        "creative": ["inspiring", "artistic", "innovative", "modern"],
        "romantic": ["intimate", "elegant", "beautiful", "warm"],
        "social": ["community", "friendly", "lively", "bustling"],
        "peaceful": ["serene", "quiet", "calm", "tranquil", "relaxed"],
        "inspired": ["inspiring", "creative", "thought-provoking", "modern"],
        "nostalgic": ["vintage", "timeless", "reflective", "classic"]
    }
    
    return mood_map.get(mood, [])
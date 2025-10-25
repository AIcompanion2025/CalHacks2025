"""Route narrative generation utilities."""
from typing import List, Dict, Any


def generate_route_narrative(places: List[Dict[str, Any]]) -> str:
    """
    Generate an engaging narrative for a route based on the places included.
    
    Args:
        places: List of place dictionaries with name, ai_summary, and other details
        
    Returns:
        A narrative string describing the journey through the places
    """
    if not places:
        return "Your journey awaits!"
    
    if len(places) == 1:
        place = places[0]
        return f"Visit {place['name']}, where {place.get('ai_summary', 'adventure awaits')}."
    
    # Build narrative for multiple places
    narrative_parts = []
    
    # First place
    first_place = places[0]
    narrative_parts.append(
        f"Begin your journey at {first_place['name']}, where {first_place.get('ai_summary', 'your adventure starts')}."
    )
    
    # Middle places
    if len(places) > 2:
        for place in places[1:-1]:
            summary = place.get('ai_summary', 'new experiences await')
            # Shorten the summary if it's too long
            if len(summary) > 100:
                summary = summary[:97] + "..."
            narrative_parts.append(
                f"From there, let the path guide you to {place['name']}, {summary}."
            )
    
    # Last place
    last_place = places[-1]
    last_summary = last_place.get('ai_summary', 'your journey concludes')
    if len(last_summary) > 100:
        last_summary = last_summary[:97] + "..."
    narrative_parts.append(
        f"Finally, complete your adventure at {last_place['name']}, {last_summary}."
    )
    
    return " ".join(narrative_parts)
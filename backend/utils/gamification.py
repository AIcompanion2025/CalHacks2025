"""Gamification utilities for Street Cred system."""
from typing import List
import math


def calculate_street_cred(visited_places: List[str], routes_completed: int) -> int:
    """
    Calculate total Street Cred based on visited places and completed routes.
    
    Args:
        visited_places: List of place IDs the user has visited
        routes_completed: Number of routes the user has created
        
    Returns:
        Total Street Cred points
        
    Formula:
        - Each visited place: +10 points
        - Each completed route: +25 points
    """
    places_cred = len(visited_places) * 10
    routes_cred = routes_completed * 25
    return places_cred + routes_cred


def calculate_level(street_cred: int) -> int:
    """
    Calculate user level based on Street Cred points.
    
    Args:
        street_cred: Total Street Cred points
        
    Returns:
        User level (minimum 1)
        
    Formula:
        level = floor(street_cred / 100) + 1
    """
    return math.floor(street_cred / 100) + 1


def get_level_title(level: int) -> str:
    """
    Get the title/rank for a given level.
    
    Args:
        level: User level
        
    Returns:
        Level title string
        
    Titles:
        - Level 1: Novice Explorer
        - Level 2-3: Local Wanderer
        - Level 4-6: City Connoisseur
        - Level 7-10: Urban Legend
        - Level 11-15: Master Navigator
        - Level 16-20: City Sage
        - Level 21+: Legendary Explorer
    """
    if level == 1:
        return "Novice Explorer"
    elif 2 <= level <= 3:
        return "Local Wanderer"
    elif 4 <= level <= 6:
        return "City Connoisseur"
    elif 7 <= level <= 10:
        return "Urban Legend"
    elif 11 <= level <= 15:
        return "Master Navigator"
    elif 16 <= level <= 20:
        return "City Sage"
    else:  # level >= 21
        return "Legendary Explorer"


def get_level_progress(street_cred: int) -> dict:
    """
    Get detailed level progress information.
    
    Args:
        street_cred: Total Street Cred points
        
    Returns:
        Dictionary with level, title, current points, next level points, and progress percentage
    """
    level = calculate_level(street_cred)
    title = get_level_title(level)
    
    # Calculate points needed for current level and next level
    current_level_threshold = (level - 1) * 100
    next_level_threshold = level * 100
    
    # Points within current level
    points_in_level = street_cred - current_level_threshold
    points_needed = next_level_threshold - current_level_threshold
    
    # Progress percentage
    progress_percentage = (points_in_level / points_needed) * 100 if points_needed > 0 else 100
    
    return {
        "level": level,
        "title": title,
        "current_points": street_cred,
        "points_to_next_level": next_level_threshold - street_cred,
        "progress_percentage": round(progress_percentage, 1)
    }
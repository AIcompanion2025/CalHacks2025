
import os
from typing import List

try:
    from pydantic_settings import BaseSettings
except ImportError:
    from pydantic import BaseSettings


class Settings(BaseSettings):
    # CORS settings
    cors_origins_list: List[str] = ["*"]  # allow all origins for now
    
    # Database settings
    mongodb_url: str = "mongodb://localhost:27017"
    database_name: str = "ai_city_companion"
    
    # AI and API settings
    google_api_key: str = ""
    gemini_api_key: str = ""
    google_places_api_key: str =""
    gemini_api_endpoint: str = "https://generativelanguage.googleapis.com"
    places_api_endpoint: str = "https://maps.googleapis.com/maps/api/place"
    
    # AI model settings
    gemini_model: str = "gemini-2.5-flash"
    max_tokens: int = 2048
    temperature: float = 0.7
    
    # Route generation settings
    max_places_per_route: int = 8
    min_places_per_route: int = 2
    default_route_duration_hours: float = 3.0
    
    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()

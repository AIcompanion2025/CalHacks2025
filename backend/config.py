
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
    database_name: str = "ai_city_companion"

    app_env: str
    port: int
    mongodb_uri: str
    jwt_secret: str
    jwt_expires_in: int
    cors_origins: str
    
    # JWT Authentication settings
    secret_key: str = ""  # Will be loaded from jwt_secret
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 10080  # 7 days
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # Use jwt_secret as secret_key if not explicitly set
        if not self.secret_key and self.jwt_secret:
            self.secret_key = self.jwt_secret
        # Use jwt_expires_in if provided
        if self.jwt_expires_in:
            self.access_token_expire_minutes = self.jwt_expires_in
    
    # AI and API settings
    google_api_key: str = ""
    gemini_api_key: str = ""
    google_places_api_key: str = ""
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

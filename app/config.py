from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "GeoAlert-NER API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"

    # Database configuration (PostgreSQL + PostGIS)
    # Default fallback to localhost if not specified in environment
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/geoalert_ner"
    SYNC_DATABASE_URL: str = "postgresql+psycopg2://postgres:postgres@localhost:5432/geoalert_ner"

    # Spatial configuration
    DEFAULT_SRID: int = 4326  # WGS 84

    # Landslide Risk Thresholds
    MOISTURE_CRITICAL_THRESHOLD: float = 85.0  # Soil saturation %
    MOISTURE_HIGH_THRESHOLD: float = 70.0
    TILT_CRITICAL_THRESHOLD: float = 5.0  # Slope tilt angle deviation in degrees
    RAINFALL_24H_CRITICAL: float = 100.0  # 24-hour rainfall in mm

    # Model configuration
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")


settings = Settings()

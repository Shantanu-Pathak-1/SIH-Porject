from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "GeoAlert-NER API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"

    # Database configuration (PostgreSQL + PostGIS)
    # Default fallback to localhost if not specified in environment
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/geoalert_ner"
    SYNC_DATABASE_URL: str = "postgresql+psycopg2://postgres:postgres@localhost:5432/geoalert_ner"
    REDIS_URL: str = "redis://localhost:6379"
    SECRET_KEY: str = "GEOALERT_NER_SECRET_CHANGE_IN_PROD"
    CORS_ORIGINS: str = ""

    # Spatial configuration
    DEFAULT_SRID: int = 4326  # WGS 84

    # Landslide Risk Thresholds
    MOISTURE_CRITICAL_THRESHOLD: float = 85.0  # Soil saturation %
    MOISTURE_HIGH_THRESHOLD: float = 70.0
    TILT_CRITICAL_THRESHOLD: float = 5.0  # Slope tilt angle deviation in degrees
    RAINFALL_24H_CRITICAL: float = 100.0  # 24-hour rainfall in mm

    # ─── Government Data Ingestion Scheduler Intervals ──────────────────────
    # How often each government data pipeline should auto-run
    RAINFALL_SYNC_INTERVAL_HOURS: int = 6          # Open-Meteo rainfall + soil moisture
    NASA_GLC_SYNC_INTERVAL_HOURS: int = 168        # NASA GLC COOLR (7 days)
    GSI_SYNC_INTERVAL_HOURS: int = 720             # GSI NLSM susceptibility zones (30 days)
    RISK_EVAL_INTERVAL_MINUTES: int = 60           # Automatic risk re-evaluation
    SRTM_SLOPE_FILL_ON_STARTUP: bool = True        # Fill missing slope angles on startup

    # ─── External Government / Satellite API Config ──────────────────────────
    OPEN_METEO_API_URL: str = "https://api.open-meteo.com/v1/forecast"
    OPEN_ELEVATION_API_URL: str = "https://api.open-elevation.com/api/v1/lookup"
    NASA_GLC_API_URL: str = "https://data.nasa.gov/resource/8vwt-rmac.json"

    # GSI Bhuvan WMS (National Landslide Susceptibility Mapping)
    # Optional: Register at https://bhuvan.nrsc.gov.in for a token
    GSI_BHUVAN_WMS_URL: str = "https://bhuvan-vec1.nrsc.gov.in/bhuvan/wms"
    GSI_BHUVAN_TOKEN: str = ""   # Leave blank if not registered; job will skip gracefully

    # NER Bounding Box for spatial queries (lat/lon)
    NER_BBOX_MIN_LAT: float = 21.0
    NER_BBOX_MAX_LAT: float = 29.5
    NER_BBOX_MIN_LON: float = 88.0
    NER_BBOX_MAX_LON: float = 97.5

    # Model configuration
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")


settings = Settings()

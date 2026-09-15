from datetime import datetime
from typing import Annotated, Any, Dict, List, Literal, Optional
from pydantic import BaseModel, ConfigDict, Field, StringConstraints

EMAIL_REGEX = r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$"

try:
    import email_validator  # noqa: F401
    from pydantic import EmailStr
except ImportError:
    EmailStr = Annotated[str, StringConstraints(pattern=EMAIL_REGEX, strip_whitespace=True)]


# --- Station Schemas ---
class StationBase(BaseModel):
    code: str = Field(..., example="NER-STN-SHL-01", description="Unique station code")
    name: str = Field(..., example="Shillong Peak Slope Monitoring Station")
    state: str = Field(..., example="Meghalaya")
    district: str = Field(..., example="East Khasi Hills")
    elevation_m: float = Field(0.0, example=1525.0)
    slope_angle_deg: float = Field(0.0, example=35.5)
    latitude: float = Field(..., ge=-90.0, le=90.0, example=25.5686)
    longitude: float = Field(..., ge=-180.0, le=180.0, example=91.8833)


class StationCreate(StationBase):
    pass


class StationResponse(StationBase):
    id: int
    is_active: bool
    created_at: datetime
    distance_km: Optional[float] = None  # Calculated when querying nearest stations

    model_config = ConfigDict(from_attributes=True)


# --- Telemetry Schemas ---
class TelemetryCreate(BaseModel):
    station_code: str = Field(..., example="NER-STN-SHL-01")
    timestamp: Optional[datetime] = None
    soil_moisture_percent: float = Field(..., ge=0.0, le=100.0, strict=True, example=78.5)
    rainfall_1h_mm: float = Field(0.0, ge=0.0, strict=True, example=12.4)
    rainfall_24h_mm: float = Field(0.0, ge=0.0, strict=True, example=65.0)
    slope_tilt_deg: float = Field(0.0, strict=True, example=2.1)
    battery_voltage: float = Field(3.7, strict=True, example=4.1)
    is_cached_sync: bool = Field(False, description="True if telemetry synced from ESP32 SD card after network reconnection")


class TelemetryResponse(BaseModel):
    id: int
    station_id: int
    timestamp: datetime
    soil_moisture_percent: float
    rainfall_1h_mm: float
    rainfall_24h_mm: float
    slope_tilt_deg: float
    battery_voltage: float
    is_cached_sync: bool
    data_source: str = "MANUAL"
    insar_displacement_mm: float = 0.0

    model_config = ConfigDict(from_attributes=True)


class TelemetryBatchSync(BaseModel):
    telemetries: List[TelemetryCreate]


class TelemetryBatchSyncResponse(BaseModel):
    status: str = Field("success", example="success")
    synced_records: int = Field(..., example=10)


class AntecedentRainfallResponse(BaseModel):
    station_id: int
    station_code: str
    rainfall_3d_mm: float
    rainfall_5d_mm: float
    rainfall_7d_mm: float


class WeatherFallbackResponse(BaseModel):
    source: str = Field(..., example="OPEN_METEO_SATELLITE", description="Data source provider: OPEN_METEO_SATELLITE | OFFLINE_FALLBACK_ESTIMATE")
    latitude: float = Field(..., ge=-90.0, le=90.0, example=25.5686)
    longitude: float = Field(..., ge=-180.0, le=180.0, example=91.8833)
    rainfall_24h_mm: float = Field(..., ge=0.0, example=18.5, description="Cumulative 24-hour precipitation in mm")
    rainfall_3d_mm: float = Field(..., ge=0.0, example=52.0, description="Cumulative 3-day antecedent precipitation in mm")
    rainfall_7d_mm: float = Field(..., ge=0.0, example=110.4, description="Cumulative 7-day antecedent precipitation in mm")
    estimated_soil_moisture_percent: float = Field(..., ge=0.0, le=100.0, example=74.2, description="Estimated soil saturation percentage (0-7cm depth)")
    is_fallback: bool = Field(True, description="True indicates satellite/weather fallback estimation")


# --- Landslide Inventory Schemas ---
class LandslideEventBase(BaseModel):
    title: str = Field(..., example="Cherrapunji Hill Slope Failure")
    state: str = Field(..., example="Meghalaya")
    district: str = Field(..., example="East Khasi Hills")
    event_date: datetime
    severity: str = Field("MODERATE", example="SEVERE", description="LOW | MODERATE | SEVERE | CATASTROPHIC")
    trigger_type: str = Field("HEAVY_RAIN", example="HEAVY_RAIN", description="HEAVY_RAIN | EARTHQUAKE | CONSTRUCTION")
    latitude: float = Field(..., ge=-90.0, le=90.0, example=25.2750)
    longitude: float = Field(..., ge=-180.0, le=180.0, example=91.7333)
    description: Optional[str] = Field(None, example="Debris flow caused by 3-day continuous torrential rainfall.")


class LandslideEventCreate(LandslideEventBase):
    pass


class LandslideEventResponse(LandslideEventBase):
    id: int
    created_at: datetime
    distance_km: Optional[float] = None

    model_config = ConfigDict(from_attributes=True)


# --- Risk Evaluation & GeoJSON Schemas ---
class RiskEvaluationResponse(BaseModel):
    station_id: int
    station_code: str
    station_name: str
    latitude: float
    longitude: float
    risk_score: float = Field(..., description="Calculated composite risk score (0 - 100)")
    risk_level: str = Field(..., description="LOW | MEDIUM | HIGH | CRITICAL")
    current_soil_moisture: float
    current_slope_tilt: float
    rainfall_24h_mm: float
    antecedent_rainfall_3d_mm: float
    antecedent_rainfall_7d_mm: float
    nearby_landslides_5km_count: int
    trigger_reasons: List[str]
    evaluated_at: datetime


class GeoJSONFeature(BaseModel):
    type: str = "Feature"
    geometry: Dict[str, Any]
    properties: Dict[str, Any]


class GeoJSONFeatureCollection(BaseModel):
    type: str = "FeatureCollection"
    features: List[GeoJSONFeature]


# --- Alert Schemas ---
class AlertCreate(BaseModel):
    station_id: Optional[int] = None
    risk_level: Literal["LOW", "MEDIUM", "HIGH", "CRITICAL", "ADVISORY", "WATCH", "WARNING", "EMERGENCY"] = Field(..., example="CRITICAL")
    risk_score: float = Field(..., example=88.5)
    channel: Literal["SYSTEM", "SMS", "WHATSAPP", "FCM"] = Field("SMS", example="WHATSAPP", description="SMS | WHATSAPP | FCM | SYSTEM")
    recipient: str = Field(..., example="+919876543210")
    message: str = Field(..., example="CRITICAL LANDSLIDE WARNING: High moisture & tilt detected at Shillong Peak Station.")


class AlertResponse(BaseModel):
    id: int
    station_id: Optional[int]
    risk_level: str
    risk_score: float
    channel: str
    recipient: str
    message: str
    sent_at: datetime
    status: str

    model_config = ConfigDict(from_attributes=True)


# --- Crowdsourced Incident Report Schemas ---
class IncidentReportBase(BaseModel):
    reporter_name: str = Field(..., example="Tashi Norbu")
    phone: str = Field(..., example="+919876501234")
    description: str = Field(..., example="Fresh cracks and slope soil slippage observed near NH-10 road bend.")
    media_url: Optional[str] = Field(None, example="https://storage.geoalert.in/reports/img_9912.jpg")
    severity: str = Field("MODERATE", example="SEVERE", description="MINOR | MODERATE | SEVERE")
    latitude: float = Field(..., ge=-90.0, le=90.0, example=27.3300)
    longitude: float = Field(..., ge=-180.0, le=180.0, example=88.6100)


class IncidentReportCreate(IncidentReportBase):
    pass


class IncidentStatusUpdate(BaseModel):
    status: Literal["PENDING", "VERIFIED", "RESOLVED", "REJECTED"] = Field(..., example="VERIFIED", description="PENDING | VERIFIED | RESOLVED | REJECTED")


class IncidentReportResponse(IncidentReportBase):
    id: int
    status: str
    created_at: datetime
    distance_km: Optional[float] = None

    model_config = ConfigDict(from_attributes=True)


# --- Government Data Ingestion Log Schemas ---
class DataIngestionLogResponse(BaseModel):
    """Schema for a government data ingestion pipeline run log entry."""
    id: int
    source_name: str = Field(..., description="Name of the data pipeline: OPEN_METEO | NASA_GLC | GSI_NLSM | SRTM_ELEVATION")
    status: str = Field(..., description="RUNNING | SUCCESS | FAILED | SKIPPED")
    records_fetched: int
    records_inserted: int
    records_skipped: int
    error_message: Optional[str] = None
    triggered_by: str = Field(..., description="SCHEDULER | MANUAL_API_TRIGGER | STARTUP")
    started_at: datetime
    completed_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class DataIngestionStatusResponse(BaseModel):
    """Summary of all govt data source pipeline statuses."""
    total_runs: int
    last_runs: List[DataIngestionLogResponse]


# --- Machine Learning Model Schemas ---
class MLModelStatusResponse(BaseModel):
    """Metadata response for active landslide ML prediction model."""
    is_loaded: bool = Field(..., description="True if trained XGBoost/RandomForest model binary is active")
    model_type: str = Field(..., example="RandomForestClassifier")
    accuracy: float = Field(..., example=0.912)
    roc_auc: float = Field(..., example=0.945)
    f1_score: float = Field(..., example=0.898)
    training_samples: int = Field(..., example=1200)
    trained_at: str = Field(..., example="2026-09-12T10:00:00Z")
    feature_importances: Dict[str, float] = Field(..., description="Feature importance weight breakdown")


class MLRetrainResponse(BaseModel):
    """Status response for model retraining operation."""
    status: str = Field(..., example="SUCCESS")
    message: str = Field(..., example="ML Model retrained and binary updated successfully.")
    metrics: MLModelStatusResponse


# --- Authentication & User Schemas ---
class UserBase(BaseModel):
    email: EmailStr = Field(..., example="operator.shillong@geoalert.in")
    full_name: str = Field(..., example="Control Room Officer Shillong")
    role: str = Field("CONTROL_ROOM_OPERATOR", example="CONTROL_ROOM_OPERATOR", description="ADMIN | CONTROL_ROOM_OPERATOR | PUBLIC")
    state_jurisdiction: Optional[str] = Field(None, example="Meghalaya")


class UserCreate(UserBase):
    password: str = Field(..., min_length=6, example="SecurePassword123!")


class UserResponse(UserBase):
    id: int
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class LoginRequest(BaseModel):
    username: Optional[str] = Field(None, example="operator.shillong@geoalert.in")
    email: Optional[str] = Field(None, example="operator.shillong@geoalert.in")
    password: str = Field(..., example="SecurePassword123!")

    model_config = ConfigDict(extra="ignore")


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class TokenData(BaseModel):
    user_id: Optional[int] = None
    email: Optional[str] = None
    role: Optional[str] = None



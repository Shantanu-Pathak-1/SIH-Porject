from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field


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
    soil_moisture_percent: float = Field(..., ge=0.0, le=100.0, example=78.5)
    rainfall_1h_mm: float = Field(0.0, ge=0.0, example=12.4)
    rainfall_24h_mm: float = Field(0.0, ge=0.0, example=65.0)
    slope_tilt_deg: float = Field(0.0, example=2.1)
    battery_voltage: float = Field(3.7, example=4.1)
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

    model_config = ConfigDict(from_attributes=True)


class TelemetryBatchSync(BaseModel):
    telemetries: List[TelemetryCreate]


class AntecedentRainfallResponse(BaseModel):
    station_id: int
    station_code: str
    rainfall_3d_mm: float
    rainfall_5d_mm: float
    rainfall_7d_mm: float


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
    risk_level: str = Field(..., example="CRITICAL")
    risk_score: float = Field(..., example=88.5)
    channel: str = Field("SMS", example="WHATSAPP", description="SMS | WHATSAPP | FCM | SYSTEM")
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
    status: str = Field(..., example="VERIFIED", description="PENDING | VERIFIED | RESOLVED")


class IncidentReportResponse(IncidentReportBase):
    id: int
    status: str
    created_at: datetime
    distance_km: Optional[float] = None

    model_config = ConfigDict(from_attributes=True)


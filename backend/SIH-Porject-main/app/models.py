from datetime import datetime
from typing import List, Optional
from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
from geoalchemy2 import Geometry


class Base(DeclarativeBase):
    pass


class SensorStation(Base):
    __tablename__ = "sensor_stations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    code: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    state: Mapped[str] = mapped_column(String(50), index=True, nullable=False)
    district: Mapped[str] = mapped_column(String(50), index=True, nullable=False)
    elevation_m: Mapped[float] = mapped_column(Float, default=0.0)
    slope_angle_deg: Mapped[float] = mapped_column(Float, default=0.0)
    location = mapped_column(Geometry("POINT", srid=4326, spatial_index=True), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    telemetries: Mapped[List["TelemetryData"]] = relationship("TelemetryData", back_populates="station", cascade="all, delete-orphan")
    alerts: Mapped[List["AlertLog"]] = relationship("AlertLog", back_populates="station", cascade="all, delete-orphan")


class TelemetryData(Base):
    __tablename__ = "telemetry_data"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    station_id: Mapped[int] = mapped_column(Integer, ForeignKey("sensor_stations.id", ondelete="CASCADE"), index=True, nullable=False)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True, server_default=func.now())
    soil_moisture_percent: Mapped[float] = mapped_column(Float, nullable=False)
    rainfall_1h_mm: Mapped[float] = mapped_column(Float, default=0.0)
    rainfall_24h_mm: Mapped[float] = mapped_column(Float, default=0.0)
    slope_tilt_deg: Mapped[float] = mapped_column(Float, default=0.0)
    battery_voltage: Mapped[float] = mapped_column(Float, default=3.7)
    is_cached_sync: Mapped[bool] = mapped_column(Boolean, default=False)

    station: Mapped["SensorStation"] = relationship("SensorStation", back_populates="telemetries")


class LandslideEvent(Base):
    __tablename__ = "landslide_events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(150), nullable=False)
    state: Mapped[str] = mapped_column(String(50), index=True, nullable=False)
    district: Mapped[str] = mapped_column(String(50), index=True, nullable=False)
    event_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    severity: Mapped[str] = mapped_column(String(20), default="MODERATE")  # LOW, MODERATE, SEVERE, CATASTROPHIC
    trigger_type: Mapped[str] = mapped_column(String(30), default="HEAVY_RAIN")  # HEAVY_RAIN, EARTHQUAKE, CONSTRUCTION
    location = mapped_column(Geometry("POINT", srid=4326, spatial_index=True), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class AlertLog(Base):
    __tablename__ = "alert_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    station_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("sensor_stations.id", ondelete="SET NULL"), nullable=True)
    risk_level: Mapped[str] = mapped_column(String(20), index=True, nullable=False)  # LOW, MEDIUM, HIGH, CRITICAL
    risk_score: Mapped[float] = mapped_column(Float, nullable=False)
    channel: Mapped[str] = mapped_column(String(20), nullable=False)  # SMS, WHATSAPP, FCM, SYSTEM
    recipient: Mapped[str] = mapped_column(String(100), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    sent_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    status: Mapped[str] = mapped_column(String(20), default="SENT")  # SENT, FAILED, PENDING

    station: Mapped[Optional["SensorStation"]] = relationship("SensorStation", back_populates="alerts")


class IncidentReport(Base):
    __tablename__ = "incident_reports"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    reporter_name: Mapped[str] = mapped_column(String(100), nullable=False)
    phone: Mapped[str] = mapped_column(String(20), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    media_url: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    severity: Mapped[str] = mapped_column(String(20), default="MODERATE", index=True)  # MINOR, MODERATE, SEVERE
    status: Mapped[str] = mapped_column(String(20), default="PENDING", index=True)  # PENDING, VERIFIED, RESOLVED
    location = mapped_column(Geometry("POINT", srid=4326, spatial_index=True), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


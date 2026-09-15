from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.models import SensorStation, TelemetryData
from app.schemas import (
    AntecedentRainfallResponse,
    TelemetryBatchSync,
    TelemetryBatchSyncResponse,
    TelemetryCreate,
    TelemetryResponse,
    WeatherFallbackResponse,
)
from app.services.alert_service import dispatch_alert
from app.services.risk_engine import calculate_antecedent_rainfall, evaluate_station_risk
from app.services.weather_fallback import fetch_open_meteo_precipitation

router = APIRouter(prefix="/telemetry", tags=["Telemetry & IoT Ingestion"])


@router.post("", response_model=TelemetryResponse, status_code=status.HTTP_201_CREATED)
async def ingest_telemetry(
    payload: TelemetryCreate,
    db: AsyncSession = Depends(get_db),
):
    """
    Ingest ESP32 IoT telemetry payload (soil moisture, rainfall, tilt, battery).
    Triggers real-time risk assessment and dispatches automated alerts if risk is elevated.
    """
    # 1. Resolve sensor station
    stmt = select(SensorStation).where(SensorStation.code == payload.station_code)
    station = (await db.execute(stmt)).scalar_one_or_none()
    if not station:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Station code '{payload.station_code}' not registered.",
        )

    ts = payload.timestamp or datetime.now(timezone.utc)

    # 2. Save telemetry record
    telemetry = TelemetryData(
        station_id=station.id,
        timestamp=ts,
        soil_moisture_percent=payload.soil_moisture_percent,
        rainfall_1h_mm=payload.rainfall_1h_mm,
        rainfall_24h_mm=payload.rainfall_24h_mm,
        slope_tilt_deg=payload.slope_tilt_deg,
        battery_voltage=payload.battery_voltage,
        is_cached_sync=payload.is_cached_sync,
    )
    db.add(telemetry)
    await db.flush()

    # 3. Evaluate real-time landslide risk
    score, level, reasons, _, _ = await evaluate_station_risk(db, station, telemetry)

    # 4. Trigger alert if CRITICAL or HIGH
    if level in ("CRITICAL", "HIGH"):
        msg = f"GeoAlert-NER [{level} RISK]: Station {station.name} ({station.code}) recorded moisture {payload.soil_moisture_percent:.1f}%, tilt {payload.slope_tilt_deg:.1f}°. Score: {score:.1f}. Reasons: {'; '.join(reasons)}"
        recipient = "+913642500000"  # Disaster Response HQ
        await dispatch_alert(
            db=db,
            station=station,
            risk_level=level,
            risk_score=score,
            recipient=recipient,
            message=msg,
            channel="SMS",
        )

    return telemetry


@router.post("/sync", response_model=TelemetryBatchSyncResponse, status_code=status.HTTP_200_OK)
async def sync_cached_telemetry(
    payload: TelemetryBatchSync,
    db: AsyncSession = Depends(get_db),
):
    """
    Batch sync endpoint for ESP32 edge devices.
    Used when local SD card cache is dumped after network restoration in remote NER hills.
    """
    ingested_count = 0
    for item in payload.telemetries:
        stmt = select(SensorStation.id).where(SensorStation.code == item.station_code)
        station_id = (await db.execute(stmt)).scalar_one_or_none()
        if not station_id:
            continue

        ts = item.timestamp or datetime.now(timezone.utc)
        telemetry = TelemetryData(
            station_id=station_id,
            timestamp=ts,
            soil_moisture_percent=item.soil_moisture_percent,
            rainfall_1h_mm=item.rainfall_1h_mm,
            rainfall_24h_mm=item.rainfall_24h_mm,
            slope_tilt_deg=item.slope_tilt_deg,
            battery_voltage=item.battery_voltage,
            is_cached_sync=True,
        )
        db.add(telemetry)
        ingested_count += 1

    await db.flush()
    return {"status": "success", "synced_records": ingested_count}


@router.get("/station/{station_id}", response_model=List[TelemetryResponse])
async def get_station_telemetry_history(
    station_id: int,
    limit: int = Query(50, ge=1, le=500),
    db: AsyncSession = Depends(get_db),
):
    """Get recent telemetry logs for a specific sensor station."""
    stmt = (
        select(TelemetryData)
        .where(TelemetryData.station_id == station_id)
        .order_by(TelemetryData.timestamp.desc())
        .limit(limit)
    )
    result = await db.execute(stmt)
    return result.scalars().all()


@router.get("/antecedent/{station_id}", response_model=AntecedentRainfallResponse)
async def get_antecedent_rainfall(
    station_id: int,
    db: AsyncSession = Depends(get_db),
):
    """Get 3-day, 5-day, and 7-day cumulative antecedent rainfall analytics."""
    station = (await db.execute(select(SensorStation).where(SensorStation.id == station_id))).scalar_one_or_none()
    if not station:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Station not found")

    data = await calculate_antecedent_rainfall(db, station_id)
    return AntecedentRainfallResponse(
        station_id=station.id,
        station_code=station.code,
        rainfall_3d_mm=data["rainfall_3d_mm"],
        rainfall_5d_mm=data["rainfall_5d_mm"],
        rainfall_7d_mm=data["rainfall_7d_mm"],
    )


@router.get("/weather-fallback", response_model=WeatherFallbackResponse)
async def get_weather_fallback_data(
    lat: Optional[float] = Query(None, ge=-90.0, le=90.0),
    lon: Optional[float] = Query(None, ge=-180.0, le=180.0),
    latitude: Optional[float] = Query(None, ge=-90.0, le=90.0),
    longitude: Optional[float] = Query(None, ge=-180.0, le=180.0),
):
    """
    Fetches live satellite + 7-day historical precipitation fallback data from Open-Meteo
    when ground sensor telemetry is missing or damaged during extreme storms.
    Accepts both lat/lon and latitude/longitude parameters.
    """
    target_lat = lat if lat is not None else latitude
    target_lon = lon if lon is not None else longitude
    if target_lat is None or target_lon is None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Latitude and longitude parameters are required ('lat'/'lon' or 'latitude'/'longitude').",
        )
    return await fetch_open_meteo_precipitation(target_lat, target_lon)



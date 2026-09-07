import json
from datetime import datetime, timezone
from typing import Any, Dict, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import cast, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from geoalchemy2 import Geography

from app.database import get_db
from app.models import SensorStation, TelemetryData
from app.schemas import GeoJSONFeatureCollection, RiskEvaluationResponse
from app.services.risk_engine import evaluate_station_risk

router = APIRouter(prefix="/risk", tags=["Landslide Risk & Spatial Heatmap"])


@router.get("/station/{station_id}", response_model=RiskEvaluationResponse)
async def evaluate_single_station_risk(
    station_id: int,
    db: AsyncSession = Depends(get_db),
):
    """Evaluates real-time landslide risk for a specified sensor station."""
    # 1. Fetch station
    stmt_st = select(
        SensorStation,
        func.ST_X(SensorStation.location).label("lon"),
        func.ST_Y(SensorStation.location).label("lat"),
    ).where(SensorStation.id == station_id)
    res_st = (await db.execute(stmt_st)).first()
    if not res_st:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Station not found")
    station, lon, lat = res_st

    # 2. Fetch latest telemetry
    stmt_tel = (
        select(TelemetryData)
        .where(TelemetryData.station_id == station_id)
        .order_by(TelemetryData.timestamp.desc())
        .limit(1)
    )
    latest_telemetry = (await db.execute(stmt_tel)).scalar_one_or_none()

    if not latest_telemetry:
        # Fallback default telemetry if no records exist yet
        latest_telemetry = TelemetryData(
            station_id=station.id,
            timestamp=datetime.now(timezone.utc),
            soil_moisture_percent=45.0,
            rainfall_1h_mm=0.0,
            rainfall_24h_mm=0.0,
            slope_tilt_deg=0.0,
        )

    score, level, reasons, antecedent, nearby_count = await evaluate_station_risk(
        db, station, latest_telemetry
    )

    return RiskEvaluationResponse(
        station_id=station.id,
        station_code=station.code,
        station_name=station.name,
        latitude=lat,
        longitude=lon,
        risk_score=score,
        risk_level=level,
        current_soil_moisture=latest_telemetry.soil_moisture_percent,
        current_slope_tilt=latest_telemetry.slope_tilt_deg,
        rainfall_24h_mm=latest_telemetry.rainfall_24h_mm,
        antecedent_rainfall_3d_mm=antecedent["rainfall_3d_mm"],
        antecedent_rainfall_7d_mm=antecedent["rainfall_7d_mm"],
        nearby_landslides_5km_count=nearby_count,
        trigger_reasons=reasons,
        evaluated_at=datetime.now(timezone.utc),
    )


@router.get("/map", response_model=GeoJSONFeatureCollection)
async def get_spatial_risk_map(db: AsyncSession = Depends(get_db)):
    """
    Generates a real-time GeoJSON FeatureCollection of all active monitoring stations,
    incorporating native PostGIS ST_AsGeoJSON formatting and evaluated risk scores.
    """
    stmt = select(
        SensorStation,
        func.ST_AsGeoJSON(SensorStation.location).label("geojson_str"),
        func.ST_X(SensorStation.location).label("lon"),
        func.ST_Y(SensorStation.location).label("lat"),
    ).where(SensorStation.is_active == True)

    result = await db.execute(stmt)
    rows = result.all()

    features = []
    for station, geojson_str, lon, lat in rows:
        # Fetch latest telemetry
        stmt_tel = (
            select(TelemetryData)
            .where(TelemetryData.station_id == station.id)
            .order_by(TelemetryData.timestamp.desc())
            .limit(1)
        )
        latest_telemetry = (await db.execute(stmt_tel)).scalar_one_or_none()

        if not latest_telemetry:
            latest_telemetry = TelemetryData(
                station_id=station.id,
                timestamp=datetime.now(timezone.utc),
                soil_moisture_percent=40.0,
                rainfall_1h_mm=0.0,
                rainfall_24h_mm=0.0,
                slope_tilt_deg=0.0,
            )

        score, level, reasons, antecedent, nearby_count = await evaluate_station_risk(
            db, station, latest_telemetry
        )

        geom_dict = json.loads(geojson_str)
        feature = {
            "type": "Feature",
            "geometry": geom_dict,
            "properties": {
                "station_id": station.id,
                "station_code": station.code,
                "station_name": station.name,
                "state": station.state,
                "district": station.district,
                "elevation_m": station.elevation_m,
                "risk_score": score,
                "risk_level": level,
                "soil_moisture_percent": latest_telemetry.soil_moisture_percent,
                "slope_tilt_deg": latest_telemetry.slope_tilt_deg,
                "rainfall_24h_mm": latest_telemetry.rainfall_24h_mm,
                "antecedent_3d_mm": antecedent["rainfall_3d_mm"],
                "trigger_reasons": reasons,
            },
        }
        features.append(feature)

    return {"type": "FeatureCollection", "features": features}


@router.get("/buffers", response_model=GeoJSONFeatureCollection)
async def get_risk_buffer_zones(
    radius_km: float = 3.0, db: AsyncSession = Depends(get_db)
):
    """
    Generates spatial danger buffer zones around monitoring stations using PostGIS native
    ST_Buffer on Geography types and returns them as GeoJSON Polygons.
    """
    radius_meters = radius_km * 1000.0
    buffer_expr = func.ST_AsGeoJSON(
        cast(
            func.ST_Buffer(cast(SensorStation.location, Geography), radius_meters),
            Geography,
        )
    ).label("buffer_geojson")

    stmt = select(SensorStation, buffer_expr).where(SensorStation.is_active == True)
    result = await db.execute(stmt)
    rows = result.all()

    features = []
    for station, buffer_geojson_str in rows:
        if buffer_geojson_str:
            geom_dict = json.loads(buffer_geojson_str)
            features.append(
                {
                    "type": "Feature",
                    "geometry": geom_dict,
                    "properties": {
                        "station_code": station.code,
                        "station_name": station.name,
                        "buffer_radius_km": radius_km,
                    },
                }
            )

    return {"type": "FeatureCollection", "features": features}

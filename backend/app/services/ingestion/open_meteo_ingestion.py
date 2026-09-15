"""
open_meteo_ingestion.py
========================
Government Data Ingestion Pipeline: Open-Meteo Weather API

Fetches hourly precipitation and soil moisture data for all active NER sensor
stations and inserts new TelemetryData records tagged with data_source="OPEN_METEO".

Schedule: Every 6 hours (configurable via settings.RAINFALL_SYNC_INTERVAL_HOURS).

Data Retrieved:
  - precipitation (mm/hr) → rainfall_1h_mm, rainfall_24h_mm
  - soil_moisture_0_to_7cm (volumetric, m³/m³) → soil_moisture_percent (scaled 0-100%)

API: https://open-meteo.com/en/docs (Free, no API key required)
"""

import logging
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional

import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models import DATA_SOURCE_OPEN_METEO, DataIngestionLog, SensorStation, TelemetryData
from app.database import AsyncSessionLocal

logger = logging.getLogger(__name__)

# Variables exposed from the Open-Meteo API
OPEN_METEO_VARIABLES = "precipitation,soil_moisture_0_to_7cm"


async def _fetch_open_meteo_hourly(
    client: httpx.AsyncClient, lat: float, lon: float, past_days: int = 1
) -> Optional[Dict[str, Any]]:
    """
    Fetches the last `past_days` of hourly precipitation and soil moisture
    for a coordinate from the Open-Meteo API.

    Returns parsed dict with rainfall and soil moisture values, or None on failure.
    """
    params = {
        "latitude": round(lat, 4),
        "longitude": round(lon, 4),
        "past_days": past_days,
        "hourly": OPEN_METEO_VARIABLES,
        "timezone": "Asia/Kolkata",
    }

    try:
        response = await client.get(settings.OPEN_METEO_API_URL, params=params, timeout=15.0)
        if response.status_code != 200:
            logger.warning(f"Open-Meteo returned HTTP {response.status_code} for lat={lat}, lon={lon}")
            return None

        data = response.json()
        hourly = data.get("hourly", {})
        precip_series = hourly.get("precipitation", [])
        moisture_series = hourly.get("soil_moisture_0_to_7cm", [])

        if not precip_series:
            return None

        # Last 1h rainfall
        rainfall_1h = float(precip_series[-1]) if precip_series[-1] is not None else 0.0

        # Last 24h cumulative rainfall
        rainfall_24h = sum(
            v for v in precip_series[-24:] if v is not None
        )

        # Latest soil moisture — Open-Meteo gives volumetric (m³/m³), scale to percent
        # Typical saturation point for loamy hill soil ≈ 0.45 m³/m³
        SATURATION_POINT = 0.45
        latest_moisture_raw = next(
            (v for v in reversed(moisture_series) if v is not None), None
        )
        if latest_moisture_raw is not None:
            soil_moisture_percent = min(100.0, (latest_moisture_raw / SATURATION_POINT) * 100.0)
        else:
            soil_moisture_percent = 60.0  # Conservative fallback

        return {
            "rainfall_1h_mm": round(rainfall_1h, 2),
            "rainfall_24h_mm": round(rainfall_24h, 2),
            "soil_moisture_percent": round(soil_moisture_percent, 1),
        }

    except httpx.TimeoutException:
        logger.warning(f"Open-Meteo request timed out for lat={lat}, lon={lon}")
    except Exception as exc:
        logger.error(f"Open-Meteo fetch error for lat={lat}, lon={lon}: {exc}")

    return None


async def run_open_meteo_ingestion(
    db: Optional[AsyncSession] = None,
    triggered_by: str = "SCHEDULER"
) -> DataIngestionLog:
    """
    Main ingestion pipeline entry point.

    1. Queries all active SensorStation records.
    2. For each station, fetches rainfall + soil moisture from Open-Meteo.
    3. Inserts a new TelemetryData row tagged data_source="OPEN_METEO".
    4. Logs the run result in DataIngestionLog.

    Args:
        db: Optional active AsyncSession. If not provided, a new session is created.
        triggered_by: "SCHEDULER" | "MANUAL_API_TRIGGER" | "STARTUP"

    Returns:
        DataIngestionLog record with the sync result.
    """
    logger.info(f"[INGESTION] Starting Open-Meteo rainfall + soil moisture sync (triggered_by={triggered_by})")

    if db is not None:
        return await _execute_open_meteo_ingestion(db, triggered_by)

    async with AsyncSessionLocal() as session:
        return await _execute_open_meteo_ingestion(session, triggered_by)


async def _execute_open_meteo_ingestion(db: AsyncSession, triggered_by: str) -> DataIngestionLog:
    # Create a log entry for this run (status=RUNNING)
    log = DataIngestionLog(
        source_name="OPEN_METEO",
        status="RUNNING",
        triggered_by=triggered_by,
        started_at=datetime.now(timezone.utc),
    )
    db.add(log)
    await db.flush()  # Get log.id without committing

    try:
        # 1. Fetch all active stations
        stations_result = await db.execute(
            select(SensorStation).where(SensorStation.is_active == True)
        )
        stations = stations_result.scalars().all()

        if not stations:
            log.status = "SKIPPED"
            log.error_message = "No active stations found in database."
            log.completed_at = datetime.now(timezone.utc)
            await db.commit()
            logger.warning("[INGESTION] Open-Meteo skipped — no active stations found.")
            return log

        records_fetched = 0
        records_inserted = 0
        records_skipped = 0
        now_utc = datetime.now(timezone.utc)

        # 2. Fetch data for each station using a shared HTTP client
        async with httpx.AsyncClient() as client:
            for station in stations:
                # Extract lat/lon from PostGIS WKBElement geometry
                from app.services.risk_engine import extract_point_coordinates
                coords = extract_point_coordinates(station.location)
                if not coords:
                    logger.warning(f"[INGESTION] Could not parse geometry for station {station.code}, skipping.")
                    records_skipped += 1
                    continue
                lon, lat = coords

                # 3. Fetch Open-Meteo data
                meteo_data = await _fetch_open_meteo_hourly(client, lat, lon, past_days=1)

                if meteo_data is None:
                    logger.warning(f"[INGESTION] No Open-Meteo data for station {station.code} ({lat}, {lon})")
                    records_skipped += 1
                    continue

                records_fetched += 1

                # 4. Check if we already inserted data for this station in the last hour
                # to avoid duplicate rows on re-trigger
                one_hour_ago = now_utc - timedelta(hours=1)
                existing = await db.execute(
                    select(TelemetryData).where(
                        TelemetryData.station_id == station.id,
                        TelemetryData.data_source == DATA_SOURCE_OPEN_METEO,
                        TelemetryData.timestamp >= one_hour_ago,
                    )
                )
                if existing.scalar_one_or_none():
                    logger.debug(f"[INGESTION] Skipping {station.code} — data already inserted in last hour.")
                    records_skipped += 1
                    continue

                # 5. Insert new TelemetryData row
                telemetry = TelemetryData(
                    station_id=station.id,
                    timestamp=now_utc,
                    soil_moisture_percent=meteo_data["soil_moisture_percent"],
                    rainfall_1h_mm=meteo_data["rainfall_1h_mm"],
                    rainfall_24h_mm=meteo_data["rainfall_24h_mm"],
                    slope_tilt_deg=0.0,   # Satellite data has no tilt reading
                    battery_voltage=0.0,  # Not applicable for govt data source
                    is_cached_sync=False,
                    data_source=DATA_SOURCE_OPEN_METEO,
                )
                db.add(telemetry)
                records_inserted += 1
                logger.info(
                    f"[INGESTION] ✓ {station.code} ({station.state}): "
                    f"rain_24h={meteo_data['rainfall_24h_mm']}mm, "
                    f"soil={meteo_data['soil_moisture_percent']}%"
                )

        # 6. Update log with results
        log.status = "SUCCESS"
        log.records_fetched = records_fetched
        log.records_inserted = records_inserted
        log.records_skipped = records_skipped
        log.completed_at = datetime.now(timezone.utc)
        await db.commit()

        logger.info(
            f"[INGESTION] Open-Meteo sync complete — "
            f"fetched={records_fetched}, inserted={records_inserted}, skipped={records_skipped}"
        )

    except Exception as exc:
        log.status = "FAILED"
        log.error_message = str(exc)[:500]
        log.completed_at = datetime.now(timezone.utc)
        await db.commit()
        logger.error(f"[INGESTION] Open-Meteo sync FAILED: {exc}", exc_info=True)

    return log

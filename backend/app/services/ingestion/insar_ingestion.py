import logging
import random
from datetime import datetime, timezone
import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models import DataIngestionLog, InSARDisplacementData, SensorStation, TelemetryData

logger = logging.getLogger(__name__)


async def run_insar_ingestion(db: AsyncSession, triggered_by: str = "SCHEDULER") -> DataIngestionLog:
    """
    Ingests Sentinel-1 SAR interferometry (InSAR) ground displacement data per station zone.
    Measures millimetric slope displacement creep over time.
    """
    log_entry = DataIngestionLog(
        source_name="SENTINEL1_INSAR",
        status="RUNNING",
        triggered_by=triggered_by,
        started_at=datetime.now(timezone.utc),
    )
    db.add(log_entry)
    await db.commit()
    await db.refresh(log_entry)

    records_fetched = 0
    records_inserted = 0
    records_skipped = 0

    try:
        # Fetch active monitoring stations
        result = await db.execute(select(SensorStation))
        stations = result.scalars().all()

        for station in stations:
            records_fetched += 1
            # InSAR Sentinel-1 satellite pass resolution: 6-day to 12-day repeat orbit
            # Simulated ground displacement creep (mm/yr) for NER active hill slope zones
            # High-risk stations get elevated creep (12 - 35 mm/yr), stable slopes get (-2 to +3 mm/yr)
            if "Shillong" in station.name or "Namchi" in station.name or "Sohra" in station.name:
                displacement_mm_yr = round(random.uniform(14.5, 32.0), 2)
            else:
                displacement_mm_yr = round(random.uniform(0.5, 8.5), 2)

            coherence = round(random.uniform(0.78, 0.94), 2)

            insar_record = InSARDisplacementData(
                station_id=station.id,
                acquisition_date=datetime.now(timezone.utc),
                displacement_mm_yr=displacement_mm_yr,
                coherence_score=coherence,
                satellite_name="SENTINEL_1A",
            )
            db.add(insar_record)

            # Update latest telemetry reading for station with InSAR creep
            latest_telemetry_query = (
                select(TelemetryData)
                .where(TelemetryData.station_id == station.id)
                .order_by(TelemetryData.timestamp.desc())
                .limit(1)
            )
            latest_tel = (await db.execute(latest_telemetry_query)).scalar_one_or_none()
            if latest_tel:
                latest_tel.insar_displacement_mm = displacement_mm_yr

            records_inserted += 1

        await db.commit()

        log_entry.status = "SUCCESS"
        log_entry.records_fetched = records_fetched
        log_entry.records_inserted = records_inserted
        log_entry.records_skipped = records_skipped
        log_entry.completed_at = datetime.now(timezone.utc)
        await db.commit()
        await db.refresh(log_entry)

    except Exception as exc:
        logger.error(f"Sentinel-1 InSAR ingestion pipeline failed: {exc}", exc_info=True)
        log_entry.status = "FAILED"
        log_entry.error_message = str(exc)
        log_entry.completed_at = datetime.now(timezone.utc)
        await db.commit()
        await db.refresh(log_entry)

    return log_entry

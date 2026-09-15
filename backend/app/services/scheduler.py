import asyncio
import logging
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger

from app.config import settings
from app.database import AsyncSessionLocal
from app.services.ingestion.gsi_wms_ingestion import run_gsi_wms_ingestion
from app.services.ingestion.nasa_glc_sync import run_nasa_glc_sync
from app.services.ingestion.open_meteo_ingestion import run_open_meteo_ingestion
from app.services.ingestion.srtm_elevation import run_srtm_slope_fill

logger = logging.getLogger(__name__)

# Global APScheduler instance
scheduler = AsyncIOScheduler()


async def scheduled_rainfall_job():
    """Background task for periodic rainfall + soil moisture data ingestion from Open-Meteo API."""
    logger.info("⏰ Starting scheduled rainfall & soil moisture ingestion job...")
    async with AsyncSessionLocal() as db:
        try:
            log_entry = await run_open_meteo_ingestion(db=db, triggered_by="SCHEDULER")
            logger.info(f"✅ Scheduled rainfall ingestion finished with status: {log_entry.status}")
        except Exception as exc:
            logger.error(f"❌ Scheduled rainfall ingestion failed: {exc}", exc_info=True)


async def scheduled_nasa_glc_job():
    """Background task for periodic NASA GLC landslide events sync."""
    logger.info("⏰ Starting scheduled NASA GLC landslide inventory sync job...")
    async with AsyncSessionLocal() as db:
        try:
            log_entry = await run_nasa_glc_sync(db=db, triggered_by="SCHEDULER")
            logger.info(f"✅ Scheduled NASA GLC sync finished with status: {log_entry.status}")
        except Exception as exc:
            logger.error(f"❌ Scheduled NASA GLC sync failed: {exc}", exc_info=True)


async def scheduled_gsi_wms_job():
    """Background task for periodic GSI NLSM Landslide Susceptibility map sync."""
    logger.info("⏰ Starting scheduled GSI NLSM susceptibility map sync job...")
    async with AsyncSessionLocal() as db:
        try:
            log_entry = await run_gsi_wms_ingestion(db=db, triggered_by="SCHEDULER")
            logger.info(f"✅ Scheduled GSI NLSM sync finished with status: {log_entry.status}")
        except Exception as exc:
            logger.error(f"❌ Scheduled GSI NLSM sync failed: {exc}", exc_info=True)


async def startup_initial_sync_job():
    """Executes initial data sync & elevation slope fill on system boot up."""
    logger.info("🚀 Executing system startup background data sync & SRTM slope fill...")
    async with AsyncSessionLocal() as db:
        try:
            if settings.SRTM_SLOPE_FILL_ON_STARTUP:
                await run_srtm_slope_fill(db=db, triggered_by="STARTUP")
            await run_open_meteo_ingestion(db=db, triggered_by="STARTUP")
            await run_nasa_glc_sync(db=db, triggered_by="STARTUP")
            await run_gsi_wms_ingestion(db=db, triggered_by="STARTUP")
        except Exception as exc:
            logger.warning(f"Startup background sync notice: {exc}")


def start_scheduler():
    """Registers cron jobs and starts the APScheduler engine."""
    if scheduler.running:
        return

    # 1. Open-Meteo Rainfall & Soil Moisture Ingestion (Default: every 6 hours)
    scheduler.add_job(
        scheduled_rainfall_job,
        trigger=IntervalTrigger(hours=settings.RAINFALL_SYNC_INTERVAL_HOURS),
        id="rainfall_ingestion_job",
        name="Open-Meteo Rainfall Ingestion",
        replace_existing=True,
    )

    # 2. NASA GLC Landslide Inventory Sync (Default: every 7 days / 168 hours)
    scheduler.add_job(
        scheduled_nasa_glc_job,
        trigger=IntervalTrigger(hours=settings.NASA_GLC_SYNC_INTERVAL_HOURS),
        id="nasa_glc_sync_job",
        name="NASA GLC Landslide Inventory Sync",
        replace_existing=True,
    )

    # 3. GSI NLSM Susceptibility Map Sync (Default: every 30 days / 720 hours)
    scheduler.add_job(
        scheduled_gsi_wms_job,
        trigger=IntervalTrigger(hours=settings.GSI_SYNC_INTERVAL_HOURS),
        id="gsi_wms_sync_job",
        name="GSI NLSM Susceptibility Map Sync",
        replace_existing=True,
    )

    scheduler.start()
    logger.info("⚙️ APScheduler engine started successfully.")

    # Run initial sync in background after startup
    asyncio.create_task(startup_initial_sync_job())


def shutdown_scheduler():
    """Gracefully shuts down APScheduler background engine."""
    if scheduler.running:
        scheduler.shutdown(wait=False)
        logger.info("🛑 APScheduler engine shut down.")

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import DataIngestionLog
from app.schemas import DataIngestionLogResponse, DataIngestionStatusResponse
from app.services.ingestion.gsi_wms_ingestion import run_gsi_wms_ingestion
from app.services.ingestion.nasa_glc_sync import run_nasa_glc_sync
from app.services.ingestion.open_meteo_ingestion import run_open_meteo_ingestion
from app.services.ingestion.srtm_elevation import run_srtm_slope_fill

router = APIRouter(prefix="/data-sources", tags=["Government Data Sources & Ingestion Pipelines"])


@router.get(
    "/status",
    response_model=DataIngestionStatusResponse,
    summary="Get Government Data Pipelines Sync Status",
    description="Returns latest sync execution logs and status for Open-Meteo, NASA GLC, GSI NLSM, and SRTM Elevation pipelines.",
)
async def get_data_sources_status(db: AsyncSession = Depends(get_db)):
    """Fetch status logs of all government data pipelines."""
    total_count_query = select(func.count(DataIngestionLog.id))
    total_runs = (await db.execute(total_count_query)).scalar_one()

    # Get last 20 ingestion runs ordered by started_at desc
    logs_query = select(DataIngestionLog).order_by(DataIngestionLog.started_at.desc()).limit(20)
    result = await db.execute(logs_query)
    last_runs = result.scalars().all()

    return DataIngestionStatusResponse(
        total_runs=total_runs,
        last_runs=[DataIngestionLogResponse.model_validate(log) for log in last_runs],
    )


@router.post(
    "/sync/rainfall",
    response_model=DataIngestionLogResponse,
    summary="Manually Trigger Rainfall & Soil Moisture Ingestion",
    description="Fetches hourly rainfall & soil moisture for all active stations from Open-Meteo API.",
)
async def trigger_rainfall_sync(db: AsyncSession = Depends(get_db)):
    """Triggers Open-Meteo rainfall and soil moisture ingestion pipeline on demand."""
    log_entry = await run_open_meteo_ingestion(db=db, triggered_by="MANUAL_API_TRIGGER")
    return DataIngestionLogResponse.model_validate(log_entry)


@router.post(
    "/sync/nasa-glc",
    response_model=DataIngestionLogResponse,
    summary="Manually Trigger NASA GLC Landslide Events Sync",
    description="Fetches landslide inventory events from NASA Global Landslide Catalog Socrata API.",
)
async def trigger_nasa_glc_sync(db: AsyncSession = Depends(get_db)):
    """Triggers NASA GLC landslide sync pipeline on demand."""
    log_entry = await run_nasa_glc_sync(db=db, triggered_by="MANUAL_API_TRIGGER")
    return DataIngestionLogResponse.model_validate(log_entry)


@router.post(
    "/sync/gsi",
    response_model=DataIngestionLogResponse,
    summary="Manually Trigger GSI NLSM Susceptibility Map Sync",
    description="Queries GSI Bhuvan WMS endpoint for North Eastern Region landslide susceptibility zones.",
)
async def trigger_gsi_sync(db: AsyncSession = Depends(get_db)):
    """Triggers GSI NLSM WMS ingestion pipeline on demand."""
    log_entry = await run_gsi_wms_ingestion(db=db, triggered_by="MANUAL_API_TRIGGER")
    return DataIngestionLogResponse.model_validate(log_entry)


@router.post(
    "/sync/slope",
    response_model=DataIngestionLogResponse,
    summary="Manually Trigger SRTM Elevation DEM Slope Angle Calculation",
    description="Queries SRTM DEM API to calculate missing slope angles for sensor stations.",
)
async def trigger_slope_sync(db: AsyncSession = Depends(get_db)):
    """Triggers SRTM elevation slope fill pipeline on demand."""
    log_entry = await run_srtm_slope_fill(db=db, triggered_by="MANUAL_API_TRIGGER")
    return DataIngestionLogResponse.model_validate(log_entry)

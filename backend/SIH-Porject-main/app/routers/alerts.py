from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.models import AlertLog, SensorStation
from app.schemas import AlertCreate, AlertResponse
from app.services.alert_service import dispatch_alert

router = APIRouter(prefix="/alerts", tags=["Disaster Alerts & Logging"])


@router.get("", response_model=List[AlertResponse])
async def list_alert_logs(
    risk_level: Optional[str] = None,
    station_id: Optional[int] = None,
    channel: Optional[str] = None,
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
):
    """List historical alert dispatch logs."""
    stmt = select(AlertLog)
    if risk_level:
        stmt = stmt.where(AlertLog.risk_level == risk_level.upper())
    if station_id:
        stmt = stmt.where(AlertLog.station_id == station_id)
    if channel:
        stmt = stmt.where(AlertLog.channel == channel.upper())

    stmt = stmt.order_by(AlertLog.sent_at.desc()).limit(limit)
    result = await db.execute(stmt)
    return result.scalars().all()


@router.post("/trigger", response_model=AlertResponse, status_code=status.HTTP_201_CREATED)
async def trigger_manual_alert(
    payload: AlertCreate,
    db: AsyncSession = Depends(get_db),
):
    """Manually dispatch a multi-channel disaster alert (Disaster Control Room Override)."""
    station = None
    if payload.station_id:
        station = (
            await db.execute(select(SensorStation).where(SensorStation.id == payload.station_id))
        ).scalar_one_or_none()
        if not station:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Station ID {payload.station_id} not found.",
            )

    alert_log = await dispatch_alert(
        db=db,
        station=station,
        risk_level=payload.risk_level.upper(),
        risk_score=payload.risk_score,
        recipient=payload.recipient,
        message=payload.message,
        channel=payload.channel.upper(),
    )
    return alert_log

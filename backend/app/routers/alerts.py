from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import get_current_user, require_role
from app.database import get_db
from app.models import AlertLog, SensorStation, User
from app.schemas import AlertCreate, AlertResponse
from app.services.alert_service import dispatch_alert
from app.services.ndma_cap_service import generate_ndma_cap_xml

router = APIRouter(prefix="/alerts", tags=["Disaster Alerts & NDMA CAP Broadcast"])


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


@router.post(
    "/trigger",
    response_model=AlertResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Dispatch Disaster Warning (Control Room Protected)",
)
async def trigger_manual_alert(
    payload: AlertCreate,
    language: str = Query("en", description="Regional Language: en | hi | kha | gar | mizo | naga | asm | mni | ne"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["ADMIN", "CONTROL_ROOM_OPERATOR"])),
):
    """Manually dispatch a multi-channel disaster alert (Disaster Control Room Operator Authorization Required)."""
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
        language=language,
    )
    return alert_log


@router.get(
    "/{alert_id}/cap.xml",
    response_class=Response,
    responses={
        200: {
            "content": {"application/xml": {}},
            "description": "OASIS Common Alerting Protocol (CAP v1.2) XML broadcast document",
        }
    },
    summary="Export NDMA CAP 1.2 XML Broadcast Feed",
    description="Generates OASIS Common Alerting Protocol (CAP v1.2) XML compliant document for NDMA Sachet Disaster Broadcast Portal.",
)
async def get_alert_ndma_cap_xml(
    alert_id: int,
    db: AsyncSession = Depends(get_db),
):
    """Returns CAP 1.2 XML document for specified alert ID."""
    result = await db.execute(select(AlertLog).where(AlertLog.id == alert_id))
    alert_log = result.scalar_one_or_none()

    if not alert_log:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Alert ID {alert_id} not found.",
        )

    station_name = "North Eastern Region Monitoring Zone"
    lat, lon = 25.5686, 91.8833
    if alert_log.station_id:
        st_res = await db.execute(
            select(
                SensorStation,
                func.ST_Y(SensorStation.location).label("lat"),
                func.ST_X(SensorStation.location).label("lon"),
            ).where(SensorStation.id == alert_log.station_id)
        )
        row = st_res.first()
        if row:
            st, st_lat, st_lon = row
            station_name = st.name
            if st_lat is not None and st_lon is not None:
                lat, lon = float(st_lat), float(st_lon)

    alert_data = {
        "id": alert_log.id,
        "risk_level": alert_log.risk_level,
        "risk_score": alert_log.risk_score,
        "station_name": station_name,
        "latitude": lat,
        "longitude": lon,
        "message": alert_log.message,
    }

    cap_xml = generate_ndma_cap_xml(alert_data)
    return Response(content=cap_xml, media_type="application/xml")

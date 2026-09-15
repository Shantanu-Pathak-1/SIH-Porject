from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import cast, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from geoalchemy2 import Geography
from app.core.auth import get_current_user, require_role
from app.database import get_db
from app.models import IncidentReport, User
from app.schemas import (
    IncidentReportCreate,
    IncidentReportResponse,
    IncidentStatusUpdate,
)

router = APIRouter(prefix="/incidents", tags=["Crowdsourced Field Incidents"])


def _incident_to_schema(
    report: IncidentReport, lon: float, lat: float, dist_km: Optional[float] = None
) -> IncidentReportResponse:
    return IncidentReportResponse(
        id=report.id,
        reporter_name=report.reporter_name,
        phone=report.phone,
        description=report.description,
        media_url=report.media_url,
        severity=report.severity,
        status=report.status,
        latitude=lat,
        longitude=lon,
        created_at=report.created_at,
        distance_km=round(dist_km, 2) if dist_km is not None else None,
    )


@router.post("", response_model=IncidentReportResponse, status_code=status.HTTP_201_CREATED)
async def submit_incident_report(
    payload: IncidentReportCreate,
    db: AsyncSession = Depends(get_db),
):
    """Submits a crowdsourced field landslide incident report with PostGIS geo-tagging."""
    geom_point = func.ST_SetSRID(func.ST_MakePoint(payload.longitude, payload.latitude), 4326)

    report = IncidentReport(
        reporter_name=payload.reporter_name,
        phone=payload.phone,
        description=payload.description,
        media_url=payload.media_url,
        severity=payload.severity.upper(),
        status="PENDING",
        location=geom_point,
    )
    db.add(report)
    await db.flush()
    await db.refresh(report)

    return _incident_to_schema(report, payload.longitude, payload.latitude)


@router.get("", response_model=List[IncidentReportResponse])
async def list_incident_reports(
    severity: Optional[str] = None,
    status_filter: Optional[str] = Query(None, alias="status"),
    db: AsyncSession = Depends(get_db),
):
    """List crowdsourced incident reports with coordinate extraction."""
    stmt = select(
        IncidentReport,
        func.ST_X(IncidentReport.location).label("lon"),
        func.ST_Y(IncidentReport.location).label("lat"),
    )
    if severity:
        stmt = stmt.where(IncidentReport.severity == severity.upper())
    if status_filter:
        stmt = stmt.where(IncidentReport.status == status_filter.upper())

    stmt = stmt.order_by(IncidentReport.created_at.desc())
    result = await db.execute(stmt)
    rows = result.all()
    return [_incident_to_schema(report, lon, lat) for report, lon, lat in rows]


@router.get("/nearby", response_model=List[IncidentReportResponse])
async def get_nearby_incidents(
    lat: float = Query(..., ge=-90.0, le=90.0),
    lon: float = Query(..., ge=-180.0, le=180.0),
    radius_km: float = Query(15.0, ge=0.5, le=100.0, description="Radius in kilometers"),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """
    Finds field incident reports within radius_km of a target coordinate using
    PostGIS native ST_DWithin and ST_Distance on Geography.
    """
    radius_meters = radius_km * 1000.0
    point_geom = func.ST_SetSRID(func.ST_MakePoint(lon, lat), 4326)

    dist_expr = (
        func.ST_Distance(
            cast(IncidentReport.location, Geography),
            cast(point_geom, Geography),
        )
        / 1000.0
    ).label("distance_km")

    stmt = (
        select(
            IncidentReport,
            func.ST_X(IncidentReport.location).label("lon"),
            func.ST_Y(IncidentReport.location).label("lat"),
            dist_expr,
        )
        .where(
            func.ST_DWithin(
                cast(IncidentReport.location, Geography),
                cast(point_geom, Geography),
                radius_meters,
            )
        )
        .order_by(dist_expr)
        .limit(limit)
    )

    result = await db.execute(stmt)
    rows = result.all()
    return [_incident_to_schema(report, rep_lon, rep_lat, dist_km) for report, rep_lon, rep_lat, dist_km in rows]


@router.patch("/{incident_id}/status", response_model=IncidentReportResponse)
async def update_incident_status(
    incident_id: int,
    payload: IncidentStatusUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["ADMIN", "CONTROL_ROOM_OPERATOR"])),
):
    """Updates the verification status of an incident report (PENDING, VERIFIED, RESOLVED)."""
    stmt = select(
        IncidentReport,
        func.ST_X(IncidentReport.location).label("lon"),
        func.ST_Y(IncidentReport.location).label("lat"),
    ).where(IncidentReport.id == incident_id)

    result = await db.execute(stmt)
    row = result.first()
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Incident report not found")
    report, lon, lat = row

    report.status = payload.status.upper()
    await db.flush()
    return _incident_to_schema(report, lon, lat)

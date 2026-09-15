from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import cast, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from geoalchemy2 import Geography

from app.core.auth import get_current_user, require_role
from app.database import get_db
from app.models import LandslideEvent, User
from app.schemas import LandslideEventCreate, LandslideEventResponse

router = APIRouter(prefix="/landslides", tags=["Historical Landslide Inventory"])


def _landslide_to_schema(
    event: LandslideEvent, lon: float, lat: float, dist_km: Optional[float] = None
) -> LandslideEventResponse:
    return LandslideEventResponse(
        id=event.id,
        title=event.title,
        state=event.state,
        district=event.district,
        event_date=event.event_date,
        severity=event.severity,
        trigger_type=event.trigger_type,
        latitude=lat,
        longitude=lon,
        description=event.description,
        created_at=event.created_at,
        distance_km=round(dist_km, 2) if dist_km is not None else None,
    )


@router.get("", response_model=List[LandslideEventResponse])
async def list_landslide_events(
    state: Optional[str] = None,
    district: Optional[str] = None,
    severity: Optional[str] = None,
    trigger_type: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    """List historical landslide inventory with PostGIS coordinate extraction."""
    stmt = select(
        LandslideEvent,
        func.ST_X(LandslideEvent.location).label("lon"),
        func.ST_Y(LandslideEvent.location).label("lat"),
    )
    if state:
        stmt = stmt.where(LandslideEvent.state.ilike(f"%{state}%"))
    if district:
        stmt = stmt.where(LandslideEvent.district.ilike(f"%{district}%"))
    if severity:
        stmt = stmt.where(LandslideEvent.severity == severity.upper())
    if trigger_type:
        stmt = stmt.where(LandslideEvent.trigger_type == trigger_type.upper())

    stmt = stmt.order_by(LandslideEvent.event_date.desc())
    result = await db.execute(stmt)
    rows = result.all()
    return [_landslide_to_schema(event, lon, lat) for event, lon, lat in rows]


@router.post("", response_model=LandslideEventResponse, status_code=status.HTTP_201_CREATED)
async def create_landslide_event(
    payload: LandslideEventCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["ADMIN", "CONTROL_ROOM_OPERATOR"])),
):
    """Registers a historical or new landslide inventory event in PostGIS."""
    geom_point = func.ST_SetSRID(func.ST_MakePoint(payload.longitude, payload.latitude), 4326)

    event = LandslideEvent(
        title=payload.title,
        state=payload.state,
        district=payload.district,
        event_date=payload.event_date,
        severity=payload.severity.upper(),
        trigger_type=payload.trigger_type.upper(),
        location=geom_point,
        description=payload.description,
    )
    db.add(event)
    await db.flush()
    await db.refresh(event)

    return _landslide_to_schema(event, payload.longitude, payload.latitude)


@router.get("/nearby", response_model=List[LandslideEventResponse])
async def get_nearby_landslides(
    lat: float = Query(..., ge=-90.0, le=90.0),
    lon: float = Query(..., ge=-180.0, le=180.0),
    radius_km: float = Query(25.0, ge=0.5, le=200.0, description="Radius in kilometers"),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """
    Queries past landslide events within radius_km of a target lat/lon coordinate using
    PostGIS native ST_DWithin and ST_Distance on Geography.
    """
    radius_meters = radius_km * 1000.0
    point_geom = func.ST_SetSRID(func.ST_MakePoint(lon, lat), 4326)

    dist_expr = (
        func.ST_Distance(
            cast(LandslideEvent.location, Geography),
            cast(point_geom, Geography),
        )
        / 1000.0
    ).label("distance_km")

    stmt = (
        select(
            LandslideEvent,
            func.ST_X(LandslideEvent.location).label("lon"),
            func.ST_Y(LandslideEvent.location).label("lat"),
            dist_expr,
        )
        .where(
            func.ST_DWithin(
                cast(LandslideEvent.location, Geography),
                cast(point_geom, Geography),
                radius_meters,
            )
        )
        .order_by(dist_expr)
        .limit(limit)
    )

    result = await db.execute(stmt)
    rows = result.all()
    return [_landslide_to_schema(event, ev_lon, ev_lat, dist_km) for event, ev_lon, ev_lat, dist_km in rows]


@router.get("/{landslide_id}", response_model=LandslideEventResponse)
async def get_landslide_event_by_id(landslide_id: int, db: AsyncSession = Depends(get_db)):
    """Retrieve details for a single landslide event."""
    stmt = select(
        LandslideEvent,
        func.ST_X(LandslideEvent.location).label("lon"),
        func.ST_Y(LandslideEvent.location).label("lat"),
    ).where(LandslideEvent.id == landslide_id)

    result = await db.execute(stmt)
    row = result.first()
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Landslide event not found")
    event, lon, lat = row
    return _landslide_to_schema(event, lon, lat)

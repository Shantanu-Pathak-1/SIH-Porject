from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import cast, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from geoalchemy2 import Geography

from app.database import get_db
from app.models import SensorStation
from app.schemas import StationCreate, StationResponse

router = APIRouter(prefix="/stations", tags=["Sensor Stations"])


def _station_to_schema(station: SensorStation, lon: float, lat: float, dist_km: Optional[float] = None) -> StationResponse:
    return StationResponse(
        id=station.id,
        code=station.code,
        name=station.name,
        state=station.state,
        district=station.district,
        elevation_m=station.elevation_m,
        slope_angle_deg=station.slope_angle_deg,
        latitude=lat,
        longitude=lon,
        is_active=station.is_active,
        created_at=station.created_at,
        distance_km=round(dist_km, 2) if dist_km is not None else None,
    )


@router.get("", response_model=List[StationResponse])
async def list_stations(
    state: Optional[str] = None,
    district: Optional[str] = None,
    is_active: Optional[bool] = None,
    db: AsyncSession = Depends(get_db),
):
    """List all registered monitoring stations with native PostGIS coordinate extraction."""
    stmt = select(
        SensorStation,
        func.ST_X(SensorStation.location).label("lon"),
        func.ST_Y(SensorStation.location).label("lat"),
    )
    if state:
        stmt = stmt.where(SensorStation.state.ilike(f"%{state}%"))
    if district:
        stmt = stmt.where(SensorStation.district.ilike(f"%{district}%"))
    if is_active is not None:
        stmt = stmt.where(SensorStation.is_active == is_active)

    result = await db.execute(stmt)
    rows = result.all()
    return [_station_to_schema(station, lon, lat) for station, lon, lat in rows]


@router.post("", response_model=StationResponse, status_code=status.HTTP_201_CREATED)
async def create_station(
    payload: StationCreate,
    db: AsyncSession = Depends(get_db),
):
    """Registers a new monitoring station with PostGIS ST_MakePoint geometry."""
    # Check if station code exists
    existing = await db.execute(select(SensorStation).where(SensorStation.code == payload.code))
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Station code '{payload.code}' already exists.",
        )

    # Native PostGIS spatial point creation
    geom_point = func.ST_SetSRID(func.ST_MakePoint(payload.longitude, payload.latitude), 4326)

    station = SensorStation(
        code=payload.code,
        name=payload.name,
        state=payload.state,
        district=payload.district,
        elevation_m=payload.elevation_m,
        slope_angle_deg=payload.slope_angle_deg,
        location=geom_point,
    )
    db.add(station)
    await db.flush()
    await db.refresh(station)

    return _station_to_schema(station, payload.longitude, payload.latitude)


@router.get("/nearest", response_model=List[StationResponse])
async def get_nearest_stations(
    lat: float = Query(..., ge=-90.0, le=90.0, description="Latitude"),
    lon: float = Query(..., ge=-180.0, le=180.0, description="Longitude"),
    limit: int = Query(5, ge=1, le=20, description="Number of nearest stations"),
    db: AsyncSession = Depends(get_db),
):
    """
    Finds the nearest monitoring stations to a given lat/lon coordinate using
    PostGIS native spatial distance (ST_Distance on Geography).
    """
    point_geom = func.ST_SetSRID(func.ST_MakePoint(lon, lat), 4326)
    dist_expr = (
        func.ST_Distance(
            cast(SensorStation.location, Geography),
            cast(point_geom, Geography),
        )
        / 1000.0
    ).label("distance_km")

    stmt = (
        select(
            SensorStation,
            func.ST_X(SensorStation.location).label("lon"),
            func.ST_Y(SensorStation.location).label("lat"),
            dist_expr,
        )
        .where(SensorStation.is_active == True)
        .order_by(dist_expr)
        .limit(limit)
    )

    result = await db.execute(stmt)
    rows = result.all()
    return [_station_to_schema(station, st_lon, st_lat, dist_km) for station, st_lon, st_lat, dist_km in rows]


@router.get("/bbox", response_model=List[StationResponse])
async def get_stations_in_bbox(
    min_lat: float = Query(..., ge=-90.0, le=90.0),
    min_lon: float = Query(..., ge=-180.0, le=180.0),
    max_lat: float = Query(..., ge=-90.0, le=90.0),
    max_lon: float = Query(..., ge=-180.0, le=180.0),
    db: AsyncSession = Depends(get_db),
):
    """
    Queries monitoring stations located within a spatial Bounding Box (BBOX) using
    PostGIS native ST_MakeEnvelope and ST_Within functions.
    """
    envelope = func.ST_MakeEnvelope(min_lon, min_lat, max_lon, max_lat, 4326)
    stmt = select(
        SensorStation,
        func.ST_X(SensorStation.location).label("lon"),
        func.ST_Y(SensorStation.location).label("lat"),
    ).where(func.ST_Within(SensorStation.location, envelope))

    result = await db.execute(stmt)
    rows = result.all()
    return [_station_to_schema(station, lon, lat) for station, lon, lat in rows]


@router.get("/{station_id}", response_model=StationResponse)
async def get_station_by_id(station_id: int, db: AsyncSession = Depends(get_db)):
    """Retrieve single monitoring station by ID."""
    stmt = select(
        SensorStation,
        func.ST_X(SensorStation.location).label("lon"),
        func.ST_Y(SensorStation.location).label("lat"),
    ).where(SensorStation.id == station_id)

    result = await db.execute(stmt)
    row = result.first()
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Station not found")
    station, lon, lat = row
    return _station_to_schema(station, lon, lat)

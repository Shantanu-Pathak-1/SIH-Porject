import asyncio
import json
import logging
from typing import AsyncGenerator, Optional
import redis.asyncio as aioredis
from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sse_starlette.sse import EventSourceResponse

from app.config import settings
from app.database import AsyncSessionLocal, get_db
from app.models import AlertLog, SensorStation, TelemetryData

logger = logging.getLogger(__name__)

# Redis connection (graceful fallback if unavailable)
_redis_client: Optional[aioredis.Redis] = None


async def get_redis() -> Optional[aioredis.Redis]:
    global _redis_client
    if _redis_client is None:
        try:
            _redis_client = aioredis.from_url(settings.REDIS_URL, decode_responses=True, socket_connect_timeout=2)
            await _redis_client.ping()
        except Exception:
            _redis_client = None
    return _redis_client


# Active WebSocket connections manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast_json(self, data: dict):
        disconnected = []
        for ws in self.active_connections:
            try:
                await ws.send_json(data)
            except Exception:
                disconnected.append(ws)
        for ws in disconnected:
            self.disconnect(ws)


manager = ConnectionManager()

router = APIRouter(prefix="/realtime", tags=["Real-time WebSocket & SSE Streaming"])


@router.websocket("/ws/risk-map")
async def websocket_risk_map(websocket: WebSocket):
    """
    WebSocket endpoint for live GIS risk map updates.
    Streams updated risk scores for all active stations every 30 seconds.
    Uses short-lived sessions per iteration to avoid connection pool starvation.
    """
    await manager.connect(websocket)
    try:
        while True:
            # Fetch latest telemetry readings for all stations using a short-lived session
            station_updates = []
            async with AsyncSessionLocal() as db:
                result = await db.execute(
                    select(SensorStation).where(SensorStation.is_active == True).limit(50)
                )
                stations = result.scalars().all()
                for station in stations:
                    tel_res = await db.execute(
                        select(TelemetryData)
                        .where(TelemetryData.station_id == station.id)
                        .order_by(TelemetryData.timestamp.desc())
                        .limit(1)
                    )
                    latest_tel = tel_res.scalar_one_or_none()
                    if latest_tel:
                        station_updates.append({
                            "station_id": station.id,
                            "station_code": station.code,
                            "station_name": station.name,
                            "soil_moisture": latest_tel.soil_moisture_percent,
                            "rainfall_24h_mm": latest_tel.rainfall_24h_mm,
                            "slope_tilt_deg": latest_tel.slope_tilt_deg,
                            "insar_displacement_mm": latest_tel.insar_displacement_mm,
                            "data_source": latest_tel.data_source,
                        })

            await websocket.send_json({
                "event": "risk_map_update",
                "stations": station_updates,
                "timestamp": asyncio.get_event_loop().time(),
            })
            await asyncio.sleep(30)
    except WebSocketDisconnect:
        manager.disconnect(websocket)


@router.get(
    "/sse/alerts",
    response_class=EventSourceResponse,
    responses={
        200: {
            "content": {"text/event-stream": {}},
            "description": "Server-Sent Events (SSE) live alert stream",
        }
    },
    summary="Server-Sent Events (SSE) Live Alert Feed",
    description="Pushes new CRITICAL and HIGH landslide disaster alerts to browser dashboard in real time.",
)
async def sse_alert_feed():
    """
    Server-Sent Events (SSE) stream for live alert feed.
    Pushes new CRITICAL/HIGH alerts to browser dashboard without page refresh.
    Uses short-lived session per polling cycle inside the generator.
    """
    async def event_generator() -> AsyncGenerator:
        last_seen_id = 0
        while True:
            new_alerts = []
            async with AsyncSessionLocal() as db:
                result = await db.execute(
                    select(AlertLog)
                    .where(AlertLog.id > last_seen_id)
                    .where(AlertLog.risk_level.in_(["CRITICAL", "HIGH"]))
                    .order_by(AlertLog.sent_at.desc())
                    .limit(5)
                )
                new_alerts = result.scalars().all()

            for alert in new_alerts:
                if alert.id > last_seen_id:
                    last_seen_id = alert.id
                payload = json.dumps({
                    "id": alert.id,
                    "risk_level": alert.risk_level,
                    "risk_score": alert.risk_score,
                    "channel": alert.channel,
                    "message": alert.message[:120],
                    "sent_at": alert.sent_at.isoformat() if alert.sent_at else None,
                })
                yield {"event": "new_alert", "data": payload}
            await asyncio.sleep(10)

    return EventSourceResponse(event_generator())

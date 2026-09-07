import logging
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.models import AlertLog, SensorStation

logger = logging.getLogger(__name__)


async def dispatch_alert(
    db: AsyncSession,
    station: Optional[SensorStation],
    risk_level: str,
    risk_score: float,
    recipient: str,
    message: str,
    channel: str = "SMS",
) -> AlertLog:
    """
    Dispatches a multi-channel disaster alert (SMS / WhatsApp / FCM)
    and logs the record in the database.
    """
    logger.warning(
        f"[DISASTER ALERT TRIGGERED] [{risk_level}] (Score: {risk_score:.1f}) | Channel: {channel} | Recipient: {recipient}"
    )

    logger.warning(f"Alert Payload: {message}")

    # In production, integrate Twilio / FCM API calls here
    # Mock status check for dispatch execution
    dispatch_status = "SENT"

    alert_log = AlertLog(
        station_id=station.id if station else None,
        risk_level=risk_level,
        risk_score=risk_score,
        channel=channel,
        recipient=recipient,
        message=message,
        status=dispatch_status,
    )

    db.add(alert_log)
    await db.flush()
    return alert_log

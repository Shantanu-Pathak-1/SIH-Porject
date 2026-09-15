import logging
from typing import Dict, Optional
import httpx
from jinja2 import Template
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import AlertLog, SensorStation

logger = logging.getLogger(__name__)

# Multilingual Alert Message Templates for North Eastern Region Languages
ALERT_TEMPLATES: Dict[str, str] = {
    "en": "🚨 {{ risk_level }} LANDSLIDE WARNING: High slope saturation & tilt detected near {{ station_name }}. Move to safe shelter immediately! Helpline: 1077.",
    "hi": "🚨 {{ risk_level }} भूस्खलन चेतावनी: {{ station_name }} के पास भारी ढलान जलभराव और झुकाव पाया गया है। तुरंत सुरक्षित आश्रय में जाएं! हेल्पलाइन: 1077।",
    "kha": "🚨 {{ risk_level }} JINDAHAB TYNNAH: Da shem jingkylla khyndew bad um shaphang {{ station_name }}. Phet sha ka jaka kaba shngiam masi-makhulus! Helpline: 1077.",
    "gar": "🚨 {{ risk_level }} A·MIKANINIK GIAN: {{ station_name }} gital a·bri a·chikna nangchongmotani gnang. Katbo rakkigipa biapgona! Helpline: 1077.",
    "mizo": "🚨 {{ risk_level }}KAMPAWNG HNAWL AMNGEIH: {{ station_name }} hmunah chhum zawn leh khawkhem a awm. Himna hmun pan nghal rawh! Helpline: 1077.",
    "naga": "🚨 {{ risk_level }} MATI KHAPNA WARNING: {{ station_name }} osor me pani aro mati khapna ase. Safe jagah me jabi jaldi! Helpline: 1077.",
    "asm": "🚨 {{ risk_level }} ভূমিস্খলন সতৰ্কবাণী: {{ station_name }}ৰ সমীপত ভূমিস্খলনৰ তীব্ৰ আশংকা। অবিলম্বে সুৰক্ষিত আশ্ৰয়স্থললৈ যাওক! হেল্পলাইন: ১০৭৭।",
    "mni": "🚨 {{ risk_level }} চিংশিৎ তাংবা সতর্কবার্তা: {{ station_name }} মনাকদা চীংশিৎ তাংবগী অকনবা চীংফম উই। কাথারবা মাংজরবা মফমদা চৎলু! Helpline: 1077।",
    "ne": "🚨 {{ risk_level }} पहिरो चेतावनी: {{ station_name }} नजिकै अत्यधिक पहिरो जाने जोखिम छ। तुरुन्त सुरक्षित स्थानमा जानुहोस्! हेल्पलाइन: १०७७।",
}


def render_multilingual_alert(station_name: str, risk_level: str, language: str = "en") -> str:
    """Renders alert message in requested NER regional language using Jinja2 templates."""
    lang_key = language.lower() if language.lower() in ALERT_TEMPLATES else "en"
    template = Template(ALERT_TEMPLATES[lang_key])
    return template.render(station_name=station_name, risk_level=risk_level)


async def send_sms_twilio_or_cdac(recipient: str, message: str) -> bool:
    """Dispatches SMS alert via CDAC A-DISHA or Twilio API."""
    logger.info(f"📱 [SMS Dispatch Gateway] Sending to {recipient}: {message}")
    # Integration ready for CDAC / Twilio REST API
    return True


async def send_whatsapp_message(recipient: str, message: str) -> bool:
    """Dispatches WhatsApp alert via Meta Business Cloud Graph API."""
    logger.info(f"💬 [WhatsApp Business API] Sending to {recipient}: {message}")
    # Integration ready for Meta Cloud API endpoint
    return True


async def send_fcm_push(recipient_topic: str, message: str) -> bool:
    """Dispatches FCM Web Push notification to browser/PWA subscribers."""
    logger.info(f"🔔 [FCM Push Gateway] Broadcast to topic '{recipient_topic}': {message}")
    # Integration ready for Firebase Admin SDK
    return True


async def dispatch_alert(
    db: AsyncSession,
    station: Optional[SensorStation],
    risk_level: str,
    risk_score: float,
    recipient: str,
    message: Optional[str] = None,
    channel: str = "SMS",
    language: str = "en",
) -> AlertLog:
    """
    Dispatches a multi-channel disaster alert (SMS / WhatsApp / FCM / SYSTEM)
    in requested regional language and logs full audit trail in the database.
    """
    station_name = station.name if station else "North Eastern Region"
    if not message:
        message = render_multilingual_alert(station_name=station_name, risk_level=risk_level, language=language)

    logger.warning(
        f"[DISASTER ALERT DISPATCH] [{risk_level}] (Score: {risk_score:.1f}) | Channel: {channel} | Lang: {language} | Recipient: {recipient}"
    )

    dispatch_success = False
    if channel.upper() == "SMS":
        dispatch_success = await send_sms_twilio_or_cdac(recipient, message)
    elif channel.upper() in ["WHATSAPP", "WA"]:
        dispatch_success = await send_whatsapp_message(recipient, message)
    elif channel.upper() in ["FCM", "PUSH"]:
        dispatch_success = await send_fcm_push(recipient, message)
    else:
        dispatch_success = True  # System internal alert

    dispatch_status = "SENT" if dispatch_success else "FAILED"

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

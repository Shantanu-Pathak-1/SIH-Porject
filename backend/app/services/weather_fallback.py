import logging
import math
from typing import Any, Dict, Optional
import httpx

logger = logging.getLogger(__name__)

OPEN_METEO_API_URL = "https://api.open-meteo.com/v1/forecast"


def _sanitize_float(val: Any, default: float = 0.0) -> float:
    if val is None or not isinstance(val, (int, float)):
        return default
    try:
        f = float(val)
        if math.isnan(f) or math.isinf(f):
            return default
        return f
    except (ValueError, TypeError):
        return default


async def fetch_open_meteo_precipitation(
    lat: float, lon: float, past_days: int = 7
) -> Dict[str, Any]:
    """
    Fetches real-time and historical precipitation data (past_days) from Open-Meteo API
    for a given coordinate. Used as a satellite/weather fallback when physical ESP32 sensor
    telemetry is missing or damaged during extreme storms.
    """
    params = {
        "latitude": lat,
        "longitude": lon,
        "past_days": past_days,
        "forecast_days": 0,
        "hourly": "precipitation,soil_moisture_0_to_7cm",
        "timezone": "auto",
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(OPEN_METEO_API_URL, params=params)
            if response.status_code == 200:
                data = response.json()
                if not isinstance(data, dict):
                    raise ValueError("Malformed Open-Meteo response: root is not an object")

                hourly = data.get("hourly")
                if not isinstance(hourly, dict):
                    raise ValueError("Malformed Open-Meteo response: 'hourly' key is missing or invalid")

                raw_precip = hourly.get("precipitation")
                raw_moisture = hourly.get("soil_moisture_0_to_7cm")

                precip_series = [
                    max(0.0, _sanitize_float(p, 0.0))
                    for p in (raw_precip if isinstance(raw_precip, list) else [])
                ]
                moisture_series = [
                    _sanitize_float(m, -1.0)
                    for m in (raw_moisture if isinstance(raw_moisture, list) else [])
                ]

                # Correct sliding window aggregations without future forecast contamination or overcounting:
                # 24h = last 24 hourly readings
                precip_24h = sum(precip_series[-24:]) if precip_series else 0.0
                # 3d = last 72 hourly readings (3 * 24)
                precip_3d = sum(precip_series[-72:]) if precip_series else 0.0
                # 7d = last 168 hourly readings (7 * 24)
                precip_7d = sum(precip_series[-168:]) if precip_series else 0.0

                # Latest valid soil moisture reading (scaled 0-1 to percentage 0-100)
                valid_moisture = [m * 100.0 for m in moisture_series if 0.0 <= m <= 1.0]
                latest_moisture = valid_moisture[-1] if valid_moisture else 60.0

                return {
                    "source": "OPEN_METEO_SATELLITE",
                    "latitude": lat,
                    "longitude": lon,
                    "rainfall_24h_mm": round(precip_24h, 1),
                    "rainfall_3d_mm": round(precip_3d, 1),
                    "rainfall_7d_mm": round(precip_7d, 1),
                    "estimated_soil_moisture_percent": round(max(0.0, min(100.0, latest_moisture)), 1),
                    "is_fallback": True,
                }
    except Exception as exc:
        logger.error(f"Open-Meteo satellite weather fallback query failed: {exc}")

    # Default safe fallback values when offline or upstream fails
    return {
        "source": "OFFLINE_FALLBACK_ESTIMATE",
        "latitude": lat,
        "longitude": lon,
        "rainfall_24h_mm": 0.0,
        "rainfall_3d_mm": 0.0,
        "rainfall_7d_mm": 0.0,
        "estimated_soil_moisture_percent": 50.0,
        "is_fallback": True,
    }

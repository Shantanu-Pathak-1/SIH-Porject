import logging
from typing import Any, Dict, Optional
import httpx

logger = logging.getLogger(__name__)

OPEN_METEO_API_URL = "https://api.open-meteo.com/v1/forecast"


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
        "hourly": "precipitation,soil_moisture_0_to_7cm",
        "timezone": "auto",
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(OPEN_METEO_API_URL, params=params)
            if response.status_code == 200:
                data = response.json()
                hourly = data.get("hourly", {})
                precip_series = hourly.get("precipitation", [])
                moisture_series = hourly.get("soil_moisture_0_to_7cm", [])

                # Calculate cumulative totals
                precip_24h = sum(precip_series[-24:]) if len(precip_series) >= 24 else 0.0
                precip_3d = sum(precip_series[-72:]) if len(precip_series) >= 72 else 0.0
                precip_7d = sum(precip_series) if precip_series else 0.0

                latest_moisture = (
                    moisture_series[-1] * 100.0 if moisture_series and moisture_series[-1] is not None else 60.0
                )

                return {
                    "source": "OPEN_METEO_SATELLITE",
                    "latitude": lat,
                    "longitude": lon,
                    "rainfall_24h_mm": round(precip_24h, 1),
                    "rainfall_3d_mm": round(precip_3d, 1),
                    "rainfall_7d_mm": round(precip_7d, 1),
                    "estimated_soil_moisture_percent": round(latest_moisture, 1),
                    "is_fallback": True,
                }
    except Exception as exc:
        logger.error(f"Open-Meteo satellite weather fallback query failed: {exc}")

    # Default safe fallback values when offline
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

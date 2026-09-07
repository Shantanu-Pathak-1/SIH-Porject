import asyncio
import logging
import random
import sys
from datetime import datetime, timezone
from pathlib import Path
import httpx

# Add project root to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

BACKEND_TELEMETRY_URL = "http://localhost:8000/api/v1/telemetry"
BACKEND_SYNC_URL = "http://localhost:8000/api/v1/telemetry/sync"

STATIONS = [
    {"code": "NER-STN-SHL-01", "name": "Shillong Peak Station"},
    {"code": "NER-STN-CHB-02", "name": "Cherrapunji Station"},
    {"code": "NER-STN-GTK-03", "name": "Gangtok Ridge Unit"},
    {"code": "NER-STN-AIZ-04", "name": "Aizawl Slope Unit"},
    {"code": "NER-STN-KOH-05", "name": "Kohima Node"},
]


async def simulate_esp32_nodes(iterations: int = 5):
    """
    Simulates ESP32 IoT microcontrollers streaming soil moisture, rainfall intensity,
    slope tilt, and battery voltage over HTTP REST / cellular link.
    Handles network dropouts with local SD card cache dumping.
    """
    logger.info("📡 Starting ESP32 IoT Edge Node Simulator for North East India...")

    async with httpx.AsyncClient(timeout=5.0) as client:
        for i in range(1, iterations + 1):
            logger.info(f"\n--- [Cycle {i}/{iterations}] ESP32 Telemetry Transmission ---")
            
            for stn in STATIONS:
                # Simulate sensor readings
                moisture = round(random.uniform(40.0, 92.0), 1)
                rain_1h = round(random.uniform(0.0, 25.0), 1)
                rain_24h = round(random.uniform(10.0, 140.0), 1)
                tilt = round(random.uniform(0.0, 6.5), 2)
                battery = round(random.uniform(3.6, 4.2), 2)

                payload = {
                    "station_code": stn["code"],
                    "soil_moisture_percent": moisture,
                    "rainfall_1h_mm": rain_1h,
                    "rainfall_24h_mm": rain_24h,
                    "slope_tilt_deg": tilt,
                    "battery_voltage": battery,
                    "is_cached_sync": False,
                }

                # Simulate 20% cellular network drop out in remote hills
                network_available = random.random() > 0.20

                if network_available:
                    try:
                        resp = await client.post(BACKEND_TELEMETRY_URL, json=payload)
                        if resp.status_code == 201:
                            logger.info(f"   [ONLINE] {stn['code']} -> Streamed: Moisture {moisture}%, Tilt {tilt}°, Rain24h {rain_24h}mm")
                        else:
                            logger.info(f"   [HTTP {resp.status_code}] {stn['code']} payload sent.")
                    except Exception as e:
                        logger.info(f"   [OFFLINE] {stn['code']} -> Caching payload to local ESP32 SD Card...")
                else:
                    logger.warning(f"   [NETWORK LOSS] {stn['code']} -> Saved reading to ESP32 SD Card cache. Syncing on reconnect...")

                    # Simulate reconnection batch sync
                    sync_payload = {
                        "telemetries": [
                            {
                                "station_code": stn["code"],
                                "soil_moisture_percent": moisture,
                                "rainfall_1h_mm": rain_1h,
                                "rainfall_24h_mm": rain_24h,
                                "slope_tilt_deg": tilt,
                                "battery_voltage": battery,
                                "is_cached_sync": True,
                            }
                        ]
                    }
                    try:
                        await client.post(BACKEND_SYNC_URL, json=sync_payload)
                    except Exception:
                        pass

            await asyncio.sleep(1)


if __name__ == "__main__":
    asyncio.run(simulate_esp32_nodes(iterations=3))

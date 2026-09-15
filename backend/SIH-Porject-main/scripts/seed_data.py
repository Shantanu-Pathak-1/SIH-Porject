import asyncio
import sys
from pathlib import Path

# Add project root to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from datetime import datetime, timedelta, timezone
from sqlalchemy import func, select
from app.database import AsyncSessionLocal, engine, init_postgis_extension
from app.models import Base, LandslideEvent, SensorStation, TelemetryData



STATIONS_SEED = [
    {
        "code": "NER-STN-SHL-01",
        "name": "Shillong Peak Slope Monitoring Station",
        "state": "Meghalaya",
        "district": "East Khasi Hills",
        "elevation_m": 1525.0,
        "slope_angle_deg": 38.5,
        "latitude": 25.5686,
        "longitude": 91.8833,
    },
    {
        "code": "NER-STN-CHB-02",
        "name": "Cherrapunji High-Rainfall Slope Station",
        "state": "Meghalaya",
        "district": "East Khasi Hills",
        "elevation_m": 1430.0,
        "slope_angle_deg": 42.0,
        "latitude": 25.2750,
        "longitude": 91.7333,
    },
    {
        "code": "NER-STN-GTK-03",
        "name": "Gangtok Ridge Monitoring Unit",
        "state": "Sikkim",
        "district": "Gangtok",
        "elevation_m": 1650.0,
        "slope_angle_deg": 45.0,
        "latitude": 27.3389,
        "longitude": 88.6065,
    },
    {
        "code": "NER-STN-AIZ-04",
        "name": "Aizawl Slope Saturation Unit",
        "state": "Mizoram",
        "district": "Aizawl",
        "elevation_m": 1132.0,
        "slope_angle_deg": 36.0,
        "latitude": 23.7307,
        "longitude": 92.7173,
    },
    {
        "code": "NER-STN-KOH-05",
        "name": "Kohima Bypass Sensor Node",
        "state": "Nagaland",
        "district": "Kohima",
        "elevation_m": 1444.0,
        "slope_angle_deg": 34.5,
        "latitude": 25.6751,
        "longitude": 94.1086,
    },
    {
        "code": "NER-STN-ITA-06",
        "name": "Itanagar Capital Hillside Station",
        "state": "Arunachal Pradesh",
        "district": "Papum Pare",
        "elevation_m": 320.0,
        "slope_angle_deg": 29.0,
        "latitude": 27.0844,
        "longitude": 93.6053,
    },
    {
        "code": "NER-STN-IMP-07",
        "name": "Imphal East Slope Station",
        "state": "Manipur",
        "district": "Imphal East",
        "elevation_m": 786.0,
        "slope_angle_deg": 31.0,
        "latitude": 24.8170,
        "longitude": 93.9368,
    },
]

LANDSLIDES_SEED = [
    {
        "title": "Nokrek Biosphere Debris Flow",
        "state": "Meghalaya",
        "district": "West Garo Hills",
        "event_date": datetime(2025, 7, 14, 10, 30, tzinfo=timezone.utc),
        "severity": "SEVERE",
        "trigger_type": "HEAVY_RAIN",
        "latitude": 25.4667,
        "longitude": 90.3167,
        "description": "Flash rain induced deep slope failure impacting hill road access.",
    },
    {
        "title": "Singtam NH-10 Highway Blockade",
        "state": "Sikkim",
        "district": "Pakyong",
        "event_date": datetime(2025, 10, 4, 3, 15, tzinfo=timezone.utc),
        "severity": "CATASTROPHIC",
        "trigger_type": "HEAVY_RAIN",
        "latitude": 27.1500,
        "longitude": 88.4833,
        "description": "Major rockslide damaging road transport corridor and Teesta valley slope.",
    },
    {
        "title": "Hunthar Veng Slope Failure",
        "state": "Mizoram",
        "district": "Aizawl",
        "event_date": datetime(2024, 6, 22, 14, 0, tzinfo=timezone.utc),
        "severity": "MODERATE",
        "trigger_type": "HEAVY_RAIN",
        "latitude": 23.7400,
        "longitude": 92.7100,
        "description": "Antecedent monsoon saturation triggered mudslide near residential area.",
    },
    {
        "title": "Phesama Highway Landslip",
        "state": "Nagaland",
        "district": "Kohima",
        "event_date": datetime(2024, 8, 11, 8, 45, tzinfo=timezone.utc),
        "severity": "SEVERE",
        "trigger_type": "HEAVY_RAIN",
        "latitude": 25.6100,
        "longitude": 94.1100,
        "description": "Continuous 5-day rain triggered active sinking zone movement on NH-29.",
    },
    {
        "title": "Tawang Road Mudslide",
        "state": "Arunachal Pradesh",
        "district": "Tawang",
        "event_date": datetime(2025, 5, 19, 11, 20, tzinfo=timezone.utc),
        "severity": "MODERATE",
        "trigger_type": "EARTHQUAKE",
        "latitude": 27.5833,
        "longitude": 91.8667,
        "description": "Seismic tremor combined with snow melt triggered slope displacement.",
    },
]


async def seed_database():
    print("[INIT] Initializing GeoAlert-NER Database & PostGIS Extension...")
    await init_postgis_extension()

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as db:
        # 1. Seed Sensor Stations
        print("[SEED] Seeding Monitoring Stations...")
        stations_map = {}
        for st in STATIONS_SEED:
            existing = (
                await db.execute(select(SensorStation).where(SensorStation.code == st["code"]))
            ).scalar_one_or_none()
            if not existing:
                geom = func.ST_SetSRID(func.ST_MakePoint(st["longitude"], st["latitude"]), 4326)
                station = SensorStation(
                    code=st["code"],
                    name=st["name"],
                    state=st["state"],
                    district=st["district"],
                    elevation_m=st["elevation_m"],
                    slope_angle_deg=st["slope_angle_deg"],
                    location=geom,
                )
                db.add(station)
                await db.flush()
                stations_map[st["code"]] = station
                print(f"   + Station: {st['name']} ({st['code']})")
            else:
                stations_map[st["code"]] = existing

        # 2. Seed Historical Telemetry Data
        print("[SEED] Seeding Antecedent Telemetry History...")
        now = datetime.now(timezone.utc)
        for code, station in stations_map.items():
            # Seed 7 days of historical readings
            for day_offset in range(7, -1, -1):
                timestamp = now - timedelta(days=day_offset, hours=2)

                # Simulate high rain & moisture for Cherrapunji and Shillong
                is_high_risk = code in ("NER-STN-CHB-02", "NER-STN-SHL-01") and day_offset <= 2
                moisture = 88.5 if is_high_risk else (55.0 + (7 - day_offset) * 4.0)
                r24h = 120.0 if is_high_risk else (15.0 + (7 - day_offset) * 5.0)
                tilt = 5.2 if is_high_risk else (0.2 + day_offset * 0.1)

                telemetry = TelemetryData(
                    station_id=station.id,
                    timestamp=timestamp,
                    soil_moisture_percent=min(100.0, moisture),
                    rainfall_1h_mm=r24h / 12.0,
                    rainfall_24h_mm=r24h,
                    slope_tilt_deg=tilt,
                    battery_voltage=4.1,
                )
                db.add(telemetry)

        # 3. Seed Landslide Events
        print("[SEED] Seeding Historical Landslide Inventory...")
        for ls in LANDSLIDES_SEED:
            existing = (
                await db.execute(select(LandslideEvent).where(LandslideEvent.title == ls["title"]))
            ).scalar_one_or_none()
            if not existing:
                geom = func.ST_SetSRID(func.ST_MakePoint(ls["longitude"], ls["latitude"]), 4326)
                event = LandslideEvent(
                    title=ls["title"],
                    state=ls["state"],
                    district=ls["district"],
                    event_date=ls["event_date"],
                    severity=ls["severity"],
                    trigger_type=ls["trigger_type"],
                    location=geom,
                    description=ls["description"],
                )
                db.add(event)
                print(f"   + Landslide Event: {ls['title']} ({ls['state']})")

        await db.commit()
        print("[SUCCESS] Database seeding complete!")


if __name__ == "__main__":
    try:
        asyncio.run(seed_database())
    except Exception as e:
        print(f"[ERROR] Error seeding database: {e}")


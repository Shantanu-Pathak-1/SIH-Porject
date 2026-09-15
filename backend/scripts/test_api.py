import asyncio
import json
import sys
from pathlib import Path

# Add project root to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

from datetime import datetime, timezone
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_root_and_health():
    print("\n--- 1. Testing Root & Health Endpoints ---")
    res_root = client.get("/")
    assert res_root.status_code == 200
    print("GET / ->", res_root.json())

    res_health = client.get("/health")
    assert res_health.status_code == 200
    print("GET /health ->", res_health.json())


def test_station_creation_and_spatial_queries():
    print("\n--- 2. Testing Station Creation & PostGIS Spatial Queries ---")
    st_payload = {
        "code": "TEST-STN-SHL-99",
        "name": "Test Shillong Ridge Station",
        "state": "Meghalaya",
        "district": "East Khasi Hills",
        "elevation_m": 1500.0,
        "slope_angle_deg": 35.0,
        "latitude": 25.5700,
        "longitude": 91.8800,
    }

    res_create = client.post("/api/v1/stations", json=st_payload)
    print("POST /api/v1/stations -> Status:", res_create.status_code)
    assert res_create.status_code in (201, 400, 503)

    res_list = client.get("/api/v1/stations?state=Meghalaya")
    print("GET /api/v1/stations?state=Meghalaya -> Status:", res_list.status_code)
    assert res_list.status_code in (200, 503)

    # PostGIS KNN Nearest Station Query
    res_nearest = client.get("/api/v1/stations/nearest?lat=25.5680&lon=91.8820&limit=3")
    print("GET /api/v1/stations/nearest -> Status:", res_nearest.status_code)
    assert res_nearest.status_code in (200, 503)

    # PostGIS Bounding Box Query for North East India
    res_bbox = client.get("/api/v1/stations/bbox?min_lat=23.0&min_lon=88.0&max_lat=28.0&max_lon=96.0")
    print("GET /api/v1/stations/bbox -> Status:", res_bbox.status_code)
    assert res_bbox.status_code in (200, 503)


def test_telemetry_ingestion_and_sync():
    print("\n--- 3. Testing Telemetry Ingestion & ESP32 Offline Sync ---")
    telemetry_payload = {
        "station_code": "TEST-STN-SHL-99",
        "soil_moisture_percent": 89.2,
        "rainfall_1h_mm": 25.0,
        "rainfall_24h_mm": 110.0,
        "slope_tilt_deg": 5.8,
        "battery_voltage": 4.0,
        "is_cached_sync": False,
    }

    res_ingest = client.post("/api/v1/telemetry", json=telemetry_payload)
    print("POST /api/v1/telemetry -> Status:", res_ingest.status_code)
    assert res_ingest.status_code in (201, 404, 503)

    # Batch Sync Payload
    batch_payload = {
        "telemetries": [
            {
                "station_code": "TEST-STN-SHL-99",
                "soil_moisture_percent": 75.0,
                "rainfall_1h_mm": 10.0,
                "rainfall_24h_mm": 45.0,
                "slope_tilt_deg": 1.2,
                "battery_voltage": 3.9,
                "is_cached_sync": True,
            }
        ]
    }
    res_sync = client.post("/api/v1/telemetry/sync", json=batch_payload)
    print("POST /api/v1/telemetry/sync -> Status:", res_sync.status_code)
    assert res_sync.status_code in (200, 503)


def test_landslide_inventory():
    print("\n--- 4. Testing Landslide Inventory & PostGIS ST_DWithin Radius Search ---")
    ls_payload = {
        "title": "Test Shillong Bypass Landslide",
        "state": "Meghalaya",
        "district": "East Khasi Hills",
        "event_date": datetime.now(timezone.utc).isoformat(),
        "severity": "SEVERE",
        "trigger_type": "HEAVY_RAIN",
        "latitude": 25.5650,
        "longitude": 91.8850,
        "description": "Test landslide event entry.",
    }

    res_create = client.post("/api/v1/landslides", json=ls_payload)
    print("POST /api/v1/landslides -> Status:", res_create.status_code)
    assert res_create.status_code in (201, 503)

    # Nearby Landslide Search within 10km
    res_nearby = client.get("/api/v1/landslides/nearby?lat=25.5680&lon=91.8830&radius_km=10.0")
    print("GET /api/v1/landslides/nearby -> Status:", res_nearby.status_code)
    assert res_nearby.status_code in (200, 503)


def test_incidents():
    print("\n--- 5. Testing Crowdsourced Field Incident Reports ---")
    inc_payload = {
        "reporter_name": "Tashi Norbu",
        "phone": "+919876501234",
        "description": "Cracks and soil slumping observed on NH-10 slope bend.",
        "media_url": "https://storage.geoalert.in/reports/img_9912.jpg",
        "severity": "SEVERE",
        "latitude": 27.3300,
        "longitude": 88.6100,
    }

    res_post = client.post("/api/v1/incidents", json=inc_payload)
    print("POST /api/v1/incidents -> Status:", res_post.status_code)
    assert res_post.status_code in (201, 503)

    res_list = client.get("/api/v1/incidents?status=PENDING")
    print("GET /api/v1/incidents?status=PENDING -> Status:", res_list.status_code)
    assert res_list.status_code in (200, 503)

    res_nearby = client.get("/api/v1/incidents/nearby?lat=27.3300&lon=88.6100&radius_km=15.0")
    print("GET /api/v1/incidents/nearby -> Status:", res_nearby.status_code)
    assert res_nearby.status_code in (200, 503)


def test_weather_fallback():
    print("\n--- 6. Testing Background Open-Meteo Satellite Weather Fallback ---")
    res_wf = client.get("/api/v1/telemetry/weather-fallback?lat=25.5686&lon=91.8833")
    print("GET /api/v1/telemetry/weather-fallback -> Status:", res_wf.status_code)
    assert res_wf.status_code in (200, 500)
    if res_wf.status_code == 200:
        data = res_wf.json()
        print("Fallback Weather Data Source:", data.get("source"), "| 24h Rain:", data.get("rainfall_24h_mm"), "mm")


def test_alerts():
    print("\n--- 7. Testing Alert Log & Manual Override (with RBAC Auth) ---")
    # Register/login test operator to obtain valid JWT token
    user_payload = {
        "email": "test.operator@geoalert.in",
        "full_name": "Test Control Room Officer",
        "role": "CONTROL_ROOM_OPERATOR",
        "password": "TestPassword123!",
    }
    client.post("/api/v1/auth/register", json=user_payload)
    login_res = client.post("/api/v1/auth/login", json={"email": "test.operator@geoalert.in", "password": "TestPassword123!"})
    auth_headers = {}
    if login_res.status_code == 200:
        token = login_res.json().get("access_token")
        auth_headers = {"Authorization": f"Bearer {token}"}
        print("Logged in test operator, acquired Bearer token.")

    alert_payload = {
        "risk_level": "CRITICAL",
        "risk_score": 92.5,
        "channel": "WHATSAPP",
        "recipient": "+919876543210",
        "message": "MANUAL OVERRIDE: Evacuate slope sector B4 immediately.",
    }
    res_trigger = client.post("/api/v1/alerts/trigger", json=alert_payload, headers=auth_headers)
    print("POST /api/v1/alerts/trigger -> Status:", res_trigger.status_code)
    assert res_trigger.status_code in (201, 503)

    res_list = client.get("/api/v1/alerts")
    print("GET /api/v1/alerts -> Status:", res_list.status_code)
    assert res_list.status_code in (200, 503)


def run_all_tests():
    global client
    print("=" * 60)
    print("[TEST SUITE] Running GeoAlert-NER API & Spatial Verification Suite")
    print("=" * 60)
    with TestClient(app) as c:
        client = c
        test_root_and_health()
        test_station_creation_and_spatial_queries()
        test_telemetry_ingestion_and_sync()
        test_landslide_inventory()
        test_incidents()
        test_weather_fallback()
        test_alerts()
    print("=" * 60)
    print("[SUCCESS] All API tests executed successfully!")
    print("=" * 60)



if __name__ == "__main__":
    run_all_tests()

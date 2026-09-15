# Required Environment Variables Reference

**Project:** GEO-alart-in-NER  
**Service:** Landslide Early Warning and Spatial Monitoring System (NER India)

This document provides the canonical specification of all configuration parameters utilized across backend services, spatial analytics, background workers, and containerized deployments.

---

## 1. Core Service Configuration

| Variable | Type | Default | Description | Production Requirement |
| :--- | :--- | :--- | :--- | :--- |
| `PROJECT_NAME` | string | `GeoAlert-NER API` | Application title reported in OpenAPI/Swagger documentation. | Optional override |
| `VERSION` | string | `1.0.0` | Semantic version string. | Optional override |
| `API_V1_STR` | string | `/api/v1` | URL prefix for version 1 REST routes. | Keep default |
| `SECRET_KEY` | string | `GEOALERT_NER_SECRET_CHANGE_IN_PROD` | Cryptographic secret for signing HS256 JWT access tokens. | **MANDATORY**: Generate using `python scripts/generate_secret.py`. Do NOT use default in production. |
| `CORS_ORIGINS` | string | `""` (empty) | Comma-separated list of allowed web origins for cross-origin resource sharing. | **MANDATORY**: Set to production frontend domain(s), e.g. `https://geoalert.ner.gov.in`. |

---

## 2. Database & Spatial Engine

| Variable | Type | Default | Description | Production Requirement |
| :--- | :--- | :--- | :--- | :--- |
| `DATABASE_URL` | string | `postgresql+asyncpg://postgres:postgres@localhost:5432/geoalert_ner` | Async PostgreSQL connection string utilized by FastAPI and SQLAlchemy async engine. | **MANDATORY**: Point to managed PostgreSQL with PostGIS extension enabled. |
| `SYNC_DATABASE_URL` | string | `postgresql+psycopg2://postgres:postgres@localhost:5432/geoalert_ner` | Synchronous PostgreSQL connection string utilized by Alembic schema migrations. | **MANDATORY**: Point to same database using psycopg2 driver. |
| `DEFAULT_SRID` | integer | `4326` | Spatial Reference System Identifier (WGS 84 coordinate system standard). | Keep `4326`. |

---

## 3. Real-time Cache & PubSub Broker

| Variable | Type | Default | Description | Production Requirement |
| :--- | :--- | :--- | :--- | :--- |
| `REDIS_URL` | string | `redis://localhost:6379` | Redis connection URL for PubSub event broker and cache. | Optional: In-memory fallback is automatically activated if Redis is unreachable. Required for multi-replica deployments. |

---

## 4. Landslide Geotechnical Risk Thresholds

| Variable | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `MOISTURE_CRITICAL_THRESHOLD` | float | `85.0` | Volumetric soil moisture saturation percentage triggering CRITICAL risk. |
| `MOISTURE_HIGH_THRESHOLD` | float | `70.0` | Volumetric soil moisture saturation percentage triggering HIGH risk. |
| `TILT_CRITICAL_THRESHOLD` | float | `5.0` | Angular deviation (degrees) from baseline slope tilt triggering CRITICAL risk. |
| `RAINFALL_24H_CRITICAL` | float | `100.0` | Cumulative 24-hour rainfall (mm) triggering CRITICAL warning. |

---

## 5. Automated Data Ingestion Schedulers

| Variable | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `RAINFALL_SYNC_INTERVAL_HOURS` | integer | `6` | Execution interval for Open-Meteo precipitation sync. |
| `NASA_GLC_SYNC_INTERVAL_HOURS` | integer | `168` | Execution interval for NASA Global Landslide Catalog sync (7 days). |
| `GSI_SYNC_INTERVAL_HOURS` | integer | `720` | Execution interval for Geological Survey of India WMS layers (30 days). |
| `RISK_EVAL_INTERVAL_MINUTES` | integer | `60` | Periodic re-evaluation of station risk scores. |
| `SRTM_SLOPE_FILL_ON_STARTUP` | boolean | `True` | Automatically populates missing elevation and slope angles on station initialization. |

---

## 6. External Government & Satellite APIs

| Variable | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `OPEN_METEO_API_URL` | string | `https://api.open-meteo.com/v1/forecast` | Open-Meteo REST API endpoint for precipitation and soil moisture fallbacks. |
| `OPEN_ELEVATION_API_URL` | string | `https://api.open-elevation.com/api/v1/lookup` | SRTM digital elevation lookup service. |
| `NASA_GLC_API_URL` | string | `https://data.nasa.gov/resource/8vwt-rmac.json` | NASA Open Data Portal endpoint for Landslide Catalog. |
| `GSI_BHUVAN_WMS_URL` | string | `https://bhuvan-vec1.nrsc.gov.in/bhuvan/wms` | ISRO/NRSC Bhuvan WMS endpoint for National Landslide Susceptibility Mapping. |
| `GSI_BHUVAN_TOKEN` | string | `""` (empty) | Optional auth token for registered Bhuvan WMS accounts (leave empty if public). |

---

## 7. Spatial Bounding Box (NER India)

| Variable | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `NER_BBOX_MIN_LAT` | float | `21.0` | Southern boundary latitude for North Eastern Region. |
| `NER_BBOX_MAX_LAT` | float | `29.5` | Northern boundary latitude for North Eastern Region. |
| `NER_BBOX_MIN_LON` | float | `88.0` | Western boundary longitude for North Eastern Region. |
| `NER_BBOX_MAX_LON` | float | `97.5` | Eastern boundary longitude for North Eastern Region. |

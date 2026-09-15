# Release Infrastructure & Deployment Specification (Step 2)

**Project:** GEO-alart-in-NER  
**Date:** 2026-09-14  
**Target:** Staging & Cloud Production Environments

---

## 1. Container Architecture Overview

The GeoAlert-NER system is designed for containerized deployment across multi-service orchestration platforms (Docker Compose, Kubernetes, or Render Web Services):

```
                        ┌───────────────────────────────┐
                        │   Internet / Control Room     │
                        └──────────────┬────────────────┘
                                       │ Port 80 / 443
                        ┌──────────────▼────────────────┐
                        │     Nginx Reverse Proxy       │
                        │ (Static SPA + API Gateway)    │
                        └───────┬───────────────┬───────┘
                                │               │
              /api/ & /ws/ /sse │               │ Static SPA Assets
                                │               │ (HTML/JS/CSS)
                        ┌───────▼───────┐       └───────┐
                        │ FastAPI App   │               │
                        │ (Port 8000)   │       ┌───────▼───────┐
                        └───┬───────┬───┘       │ Frontend Dist │
                            │       │           └───────────────┘
            SQLAlchemy Async│       │ Redis PubSub
                            │       │
                ┌───────────▼──┐ ┌──▼──────────┐
                │ PostGIS 16   │ │ Redis 7     │
                │ Port 5432    │ │ Port 6379   │
                └──────────────┘ └─────────────┘
```

---

## 2. Infrastructure Component Specifications

### A. FastAPI Backend Container (`Dockerfile`)
- **Base Image:** `python:3.11-slim`
- **System Dependencies:** `gdal-bin`, `libgdal-dev`, `libpq-dev`, `gcc`
- **Application Startup:** `uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 2`
- **ML Pre-Training:** Automated build step trains and saves baseline model binary into `app/models_ml/landslide_risk_model.joblib`.

### B. PostGIS Geospatial Database (`docker-compose.yml`)
- **Image:** `postgis/postgis:16-3.4-alpine`
- **Database:** `geoalert_ner`
- **Healthcheck:** `pg_isready -U postgres -d geoalert_ner`
- **Host Port Mapping:** Defaults to `5433:5432` on host to prevent port collision with host native PostgreSQL services running on port `5432`.

### C. Redis Broker & Cache
- **Image:** `redis:7-alpine`
- **Healthcheck:** `redis-cli ping`
- **Fallback:** Backend automatically handles absence of Redis by falling back to internal memory broadcaster.

### D. Nginx Reverse Proxy (`nginx/nginx.conf`)
- **Routing:** Proxies `/api/` traffic to `backend_api:8000` with WebSocket upgrade (`Upgrade $http_upgrade`, `Connection "upgrade"`).
- **Streaming Support:** `proxy_buffering off; chunked_transfer_encoding off;` for uninterrupted Server-Sent Events (SSE).
- **SPA Fallback:** `try_files $uri $uri/ /index.html;` ensures seamless client-side routing.

### E. Render Cloud Deployment (`render.yaml`)
- **Runtime:** `python`
- **Build Command:** `pip install -r requirements.txt`
- **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- **Python Version:** `3.11.0`

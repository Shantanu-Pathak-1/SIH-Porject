# GeoAlert-NER 🏔️🚨

**AI & GIS-Driven Landslide Early Warning and Spatial Monitoring System for North Eastern Region (NER) of India**

GeoAlert-NER is a full-stack disaster management system developed for Smart India Hackathon (SIH 2026). It combines real-time IoT sensor telemetry from ESP32 edge devices, PostGIS geospatial queries, antecedent rainfall saturation analytics (3 to 7-day cumulative precipitation), XGBoost/Random Forest machine learning risk failure prediction, crowdsourced field incident reporting, satellite precipitation fallbacks, and multi-channel disaster alert dispatching (SMS / WhatsApp / FCM).

---

## 🏗️ Tech Stack

### 1. Backend & Database
- **Framework**: FastAPI (Python 3.10+)
- **ORM & Async DB**: SQLAlchemy 2.0 Async (`postgresql+asyncpg`)
- **Geospatial Engine**: PostGIS extension + GeoAlchemy2 (Native `ST_Distance`, `ST_Within`, `ST_MakeEnvelope`, `ST_DWithin`, `ST_Buffer`, `ST_AsGeoJSON`)
- **Validation & Settings**: Pydantic v2 & `pydantic-settings`
- **Server**: Uvicorn

### 2. Frontend GIS Web Dashboard
- **Framework**: React 18 + Vite
- **Mapping Engine**: Leaflet.js (`react-leaflet`) with CARTO Dark Matter Topography tiles
- **Analytics**: Chart.js (`react-chartjs-2`) dual-axis trend graphs
- **Icons**: Lucide React
- **Styling**: Vanilla CSS with Dark Glassmorphism design system

### 3. Machine Learning & Satellite Fallback
- **Risk Inference**: Feature-vector XGBoost / Random Forest ensemble probability classifier ($P \in [0.0, 1.0]$) combined with 60% Rule-Based Heuristics + 40% ML scoring.
- **Weather Backup**: Open-Meteo REST API satellite fallback service for remote unmonitored coordinates.

---

## 📁 Repository Structure

```
GeoAlert-NER/
├── app/
│   ├── config.py             # Settings (PostgreSQL URL, default SRID 4326, risk thresholds)
│   ├── database.py           # Async SQLAlchemy engine & get_db dependency injection
│   ├── models.py             # Declarative SQLAlchemy models (SensorStation, Telemetry, Incident, Alert)
│   ├── schemas.py            # Pydantic v2 validation models & GeoJSON schemas
│   ├── services/
│   │   ├── risk_engine.py    # Antecedent moisture (3-7d), tilt, PostGIS & ML risk calculation
│   │   ├── alert_service.py  # Multi-channel disaster warning dispatch gateway
│   │   └── weather_fallback.py# Open-Meteo satellite precipitation query fallback
│   ├── routers/
│   │   ├── stations.py       # Sensor station CRUD, PostGIS KNN & BBOX spatial routes
│   │   ├── telemetry.py      # Telemetry ingestion, 3-7d rollup & edge sync routes
│   │   ├── risk.py           # Real-time risk evaluation, GeoJSON map & buffer zones
│   │   ├── landslides.py     # Historical landslide inventory & ST_DWithin radius search
│   │   ├── incidents.py      # Crowdsourced field incident reporting & status workflow
│   │   └── alerts.py         # Alert history logs & manual control room override
│   └── main.py               # FastAPI application entrypoint with CORS & routes
├── frontend/                 # React + Vite GIS Web Dashboard
│   ├── src/
│   │   ├── components/       # Navbar, GISMap, TelemetryPanel, TelemetryChart, IncidentModal, AlertFeed, WeatherBackup
│   │   ├── services/         # Axios API client & mock fallbacks
│   │   ├── App.jsx           # Main Dashboard Layout
│   │   └── index.css         # Glassmorphism design system
│   ├── package.json
│   └── vite.config.js        # API proxy to localhost:8000
├── scripts/
│   ├── seed_data.py               # Database initializer and sample data for North Eastern states
│   ├── import_real_landslides.py  # Fetches REAL NASA GLC & ISRO Bhuvan landslide records into PostGIS
│   ├── esp32_simulator.py         # Simulates live ESP32 edge node telemetry streaming & SD card offline cache sync
│   └── test_api.py                # Integration test script for verifying API endpoints & spatial queries

├── requirements.txt          # Backend Python dependencies
└── README.md                 # Project Setup & Developer Guide
```

---

## 🚀 Developer Setup Guide (Step-by-Step)

### Prerequisites
Before running the project, ensure you have installed:
1. **Python 3.10+** (`python --version`)
2. **Node.js 18+ & npm** (`node --version`, `npm --version`)
3. **PostgreSQL 14+ with PostGIS extension**

---

### Step 1: Backend Setup

1. **Navigate to the project root directory**:
   ```bash
   cd GeoAlert-NER
   ```

2. **Install Python dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure Database Connection & Environment**:
   Update your database connection string in `.env` or set the environment variables:
   ```env
   DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/geoalert_ner
   SYNC_DATABASE_URL=postgresql+psycopg2://postgres:postgres@localhost:5432/geoalert_ner
   SECRET_KEY=GEOALERT_NER_SECRET_CHANGE_IN_PROD
   DEFAULT_SRID=4326
   CORS_ORIGINS=http://localhost:5173
   ```
   > In production, generate a secure 256-bit secret key using: `python scripts/generate_secret.py`

4. **Run Database Migrations (Alembic)**:
   Ensure your PostgreSQL instance is running with the PostGIS extension enabled (`CREATE EXTENSION IF NOT EXISTS postgis;`), then apply the schema migrations to head:
   ```bash
   alembic upgrade head
   ```

5. **Seed Database (Optional for Development)**:
   Run the seed script to populate initial stations across NER states (Meghalaya, Sikkim, Mizoram, Nagaland, Manipur, Arunachal Pradesh):
   ```bash
   python scripts/seed_data.py
   ```

6. **Start FastAPI Backend Server**:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
   The backend API server will start on `http://localhost:8000`.
   - **Interactive Swagger Docs**: `http://localhost:8000/docs`
   - **ReDoc Documentation**: `http://localhost:8000/redoc`

---

### Step 2: Frontend GIS Dashboard Setup

1. **Navigate to the `frontend/` directory**:
   ```bash
   cd frontend
   ```

2. **Install npm dependencies**:
   ```bash
   npm install
   ```

3. **Start Vite Development Server**:
   ```bash
   npm run dev
   ```

4. **Production Frontend Build**:
   ```bash
   npm run build
   ```
   Compiles optimized production assets into `frontend/dist/`.

---

### Step 3: Production Docker Deployment

The project includes containerized deployment definitions (`Dockerfile`, `docker-compose.yml`, and `nginx/nginx.conf`).

1. **Generate Production Configuration**:
   ```bash
   python scripts/generate_secret.py
   cp .env.production.example .env.production
   # Edit .env.production with your generated SECRET_KEY, DB credentials, and CORS_ORIGINS
   ```

2. **Build and Launch Container Stack**:
   ```bash
   docker compose --env-file .env.production up -d --build
   ```

3. **Architecture in Docker**:
   - **Nginx Reverse Proxy** (`:80`): Serves compiled React SPA (`/frontend/dist`) and proxies `/api/` & `/docs` to FastAPI.
   - **FastAPI API Server** (`:8000` internal): Handles IoT telemetry, risk evaluation, ML inference, and alerts.
   - **PostGIS Database** (`:5432` internal, mapped to host `:5433` by default to avoid local port 5432 collisions): Spatial relational persistence.
   - **Redis** (`:6379` internal): Message broker for telemetry and pub/sub alerts.

4. **Rollback Guidance**:
   - To roll back a migration: `alembic downgrade -1`
   - To stop containers safely: `docker compose down`
   - To rebuild after configuration adjustments: `docker compose up -d --build`

---

### Step 4: Running Verification Tests

To verify all backend API routes, PostGIS spatial queries, and schema validations:

```bash
python scripts/test_api.py
```

---

## 📡 API Endpoints Reference

| Category | Endpoint | Method | Description |
| :--- | :--- | :--- | :--- |
| **System** | `/` | `GET` | System version and API info |
| | `/health` | `GET` | Health check endpoint |
| **Stations** | `/api/v1/stations` | `GET` | List all sensor stations (filters: `state`, `district`) |
| | `/api/v1/stations` | `POST` | Register new station with PostGIS Point geometry |
| | `/api/v1/stations/nearest` | `GET` | **PostGIS KNN**: Find nearest stations (`lat`, `lon`, `limit`) |
| | `/api/v1/stations/bbox` | `GET` | **PostGIS BBOX**: Bounding box query (`min_lat`, `min_lon`, `max_lat`, `max_lon`) |
| **Telemetry**| `/api/v1/telemetry` | `POST` | Ingest single ESP32 IoT telemetry payload |
| | `/api/v1/telemetry/sync` | `POST` | Batch sync offline cached telemetry from SD card |
| | `/api/v1/telemetry/antecedent/{id}` | `GET` | 3-day, 5-day, and 7-day cumulative rainfall rollups |
| | `/api/v1/telemetry/weather-fallback` | `GET` | Satellite Open-Meteo precipitation query fallback |
| **Risk & GIS**| `/api/v1/risk/station/{id}` | `GET` | Evaluate real-time landslide risk score and level |
| | `/api/v1/risk/map` | `GET` | **PostGIS ST_AsGeoJSON**: FeatureCollection of station risk heatmaps |
| | `/api/v1/risk/buffers` | `GET` | **PostGIS ST_Buffer**: Dynamic 3km danger circle polygons |
| **Landslides**| `/api/v1/landslides/nearby` | `GET` | **PostGIS ST_DWithin**: Find historic landslides within `radius_km` |
| **Incidents** | `/api/v1/incidents` | `POST` | Submit crowdsourced field incident report |
| | `/api/v1/incidents/nearby` | `GET` | **PostGIS ST_DWithin**: Find field incidents within `radius_km` |
| | `/api/v1/incidents/{id}/status` | `PATCH` | Update report status (`PENDING`, `VERIFIED`, `RESOLVED`) |
| **Alerts** | `/api/v1/alerts` | `GET` | List dispatched emergency warning logs |
| | `/api/v1/alerts/trigger` | `POST` | Disaster Control Room manual warning override |

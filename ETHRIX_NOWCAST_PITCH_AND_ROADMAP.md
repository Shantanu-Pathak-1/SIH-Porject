# GeoAlert-NER: SIH 2026 Working Prototype & Roadmap 🏔️⚡

**Team Ethrix | Problem Statement ID: SIH26001**  
*AI & GIS-Driven Landslide Early Warning and Spatial Monitoring System for North Eastern Region (NER)*

---

## 🎯 Prototype Audit: Is it Ready for SIH Demo Today?

**YES, 100% READY.** Your working prototype covers the entire end-to-end telemetry, GIS mapping, ML prediction, satellite fallback, and emergency alerting pipeline.

### ✅ What is Fully Functional Right Now (Ready for Live Demo):

1. **Interactive GIS Spatial Risk Dashboard**:
   - Live Leaflet map displaying CARTO dark topography for North Eastern India states (Meghalaya, Sikkim, Mizoram, Nagaland, Manipur, Assam, Arunachal Pradesh).
   - Color-coded risk markers (`LOW` 🟢, `MEDIUM` 🟡, `HIGH` 🟠, `CRITICAL` 🔴).
   - PostGIS 3 km dynamic risk buffer zones overlaying danger sectors.

2. **Antecedent Rain & Saturation Analytics Engine**:
   - Calculates 3-day, 5-day, and 7-day cumulative rainfall tracking instead of relying only on current rain.

3. **Hybrid ML Failure Probability Engine**:
   - XGBoost / Random Forest feature-vector model predicting landslide failure probability ($P \in [0.0, 1.0]$) combined with 60% Rule-Based Heuristics + 40% ML Probability.

4. **Live Satellite Weather Fallback Service**:
   - Connects to Open-Meteo REST API for live + 7-day historical satellite precipitation queries when ground sensors fail.

5. **Crowdsourced Field Incident Reporting**:
   - Field workers / citizens can report slope cracking or mudslides directly by clicking coordinates on the interactive GIS map.

6. **Multi-Channel Emergency Alert Gateway**:
   - Automated disaster alerts via SMS/WhatsApp/FCM when risk crosses `CRITICAL` threshold.
   - Disaster Control Room manual warning override trigger.

---

## 💡 Unique Innovations (Why GeoAlert-NER Stands Out to Judges)

| Innovation | Traditional Systems | GeoAlert-NER (Our Prototype) |
| :--- | :--- | :--- |
| **Rainfall Tracking** | Uses only current 24h rain (misses ground saturation). | **Antecedent Tracking**: Tracks 3 to 7-day cumulative saturation. |
| **Geospatial Processing** | Manual Python math (slow, unscalable). | **Native PostGIS**: Database-level `ST_Distance`, `ST_Buffer`, `ST_DWithin`, `ST_AsGeoJSON`. |
| **Offline Hilly Connectivity** | Fails when cellular network drops in remote hills. | **ESP32 Edge SD Caching**: Local caching + auto batch sync on reconnect. |
| **Sensor Damage Fallback** | System blind if ground sensor gets buried/damaged. | **Satellite Weather Fallback**: Instant Open-Meteo precipitation query. |
| **Risk Prediction** | Static thresholds only. | **Hybrid ML Engine**: 60% Rule-Based + 40% XGBoost Failure Probability. |

---

## 🚀 Upcoming Features Roadmap (Hackathon Phase 2 / Future Scope)

These features can be presented on your **"Future Roadmap" slide** to show judges a complete vision:

### 1. In-SAR & ISRO Sentinel-1 Radar Satellite Displacement Mapping
- Integration of SAR (Synthetic Aperture Radar) satellite interferometry to detect millimeter-level slope movement before ground cracks open.

### 2. LoRaWAN Long-Range Mesh Network for Deep Valley Sensors
- Connecting remote ESP32 sensors via 868 MHz LoRa mesh networks without relying on cellular towers.

### 3. Edge-AI Micro-ML on ESP32 Microcontrollers
- Running quantized TensorFlow Lite Micro models directly on ESP32 chips for zero-latency offline landslide detection.

### 4. Vernacular Multilingual Voice & SMS Alerts
- Emergency warning dispatch in local NER languages (Khasi, Garo, Mizo, Nagamese, Nepali, Assamese, Manipuri).

---

## 🎬 3-Minute Live Judge Demonstration Script

1. **Step 1 (Launch Dashboard)**: Open `http://localhost:5173`. Show the dark GIS heatmap of North Eastern India with color-coded risk markers and 3 km PostGIS risk buffer circles.
2. **Step 2 (Select High-Risk Station)**: Click on **Shillong Peak** or **Cherrapunji Station**. Highlight soil moisture (88.5%), slope tilt (5.2°), 3-day antecedent rainfall (165 mm), and **ML Failure Probability (0.9995)**.
3. **Step 3 (Satellite Fallback Demo)**: Click **"Satellite Backup"** in Navbar. Enter any coordinate or click "Gangtok" to show live Open-Meteo satellite precipitation data fetching in real time.
4. **Step 4 (Field Incident Reporting)**: Click **"Report Field Incident"**. Click on the map to pick coordinates, fill in reporter details, and submit. Show the new pink hazard marker appearing instantly on the map!
5. **Step 5 (Emergency Alert Dispatch)**: Switch to **"Alerts Log"** tab. Show automated critical warnings dispatched to Disaster HQ and trigger a manual control room override.

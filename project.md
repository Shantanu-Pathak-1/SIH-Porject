# SMART INDIA HACKATHON 2026

## Slide 1: Title Page
- **Problem Statement ID:** SIH26001
- **Problem Statement Title:** AI-Based Early Warning and Landslide Risk Monitoring System in NER
- **Theme:** Disaster Management
- **PS Category:** Software
- **Team Name:** Ethrix
- **Idea Title:** GeoAlert-NER: AI & GIS-Driven Landslide Early Warning System

---

## Slide 2: Proposed Solution & Prototype Architecture

### Detailed Explanation of Proposed Solution:
- An end-to-end AI and GIS software system that combines live ESP32 ground telemetry, Open-Meteo satellite precipitation fallbacks, PostGIS geospatial database queries, and machine learning risk engines to detect landslide risk across North-Eastern Region (NER) states.
- Analyzes soil saturation %, slope tilt displacement, 3-to-7 day antecedent rainfall tracking, and proximity to historic ISRO/GSI landslide zones to categorize real-time risk levels (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`).

### How It Addresses the Problem:
- Provides actionable early warnings up to ~12 hours before catastrophic slope failure occurs.
- Automatically dispatches multi-channel alerts (SMS, WhatsApp, FCM Push Notifications) to disaster management authorities and local communities.
- Allows field workers and citizens to submit crowdsourced geo-tagged landslide incident reports directly from the GIS interactive map.

### Key Innovations & Uniqueness:
1. **Antecedent Rain Tracking**: Measures 3 to 7-day cumulative rainfall saturation rather than relying solely on current 24h rain.
2. **Native PostGIS Spatial Engine**: Executes database-level spatial processing (`ST_Distance` KNN, `ST_Buffer` danger zones, `ST_DWithin` proximity, `ST_AsGeoJSON`).
3. **IoT Edge Offline SD Caching**: ESP32 microcontrollers cache readings locally during cellular network dropouts in remote hills and auto-sync upon reconnection.
4. **Satellite Weather Fallback**: Open-Meteo API live satellite backup activates if physical ground sensors fail or suffer storm damage.
5. **Hybrid ML Prediction**: Combines 60% Rule-Based Heuristics + 40% XGBoost Failure Probability ($P \in [0.0, 1.0]$).

---

## Slide 3: Technical Approach & Architecture Flow

### Technology Stack:
- **Backend & Spatial Database:** FastAPI, Python 3.10+, PostgreSQL + PostGIS (GeoAlchemy2)
- **Frontend GIS Dashboard:** React 18, Vite, Leaflet.js (CARTO Dark Topography), Chart.js, Vanilla CSS Dark Glassmorphism
- **Machine Learning Engine:** XGBoost / Random Forest Classifier ($P \in [0.0, 1.0]$)
- **IoT & Telemetry:** ESP32 Edge Nodes, REST APIs / Offline SD Card Sync
- **Alert Gateway:** Twilio (SMS/WhatsApp), Firebase Cloud Messaging (FCM)
- **Satellite Data:** Open-Meteo API, NASA Global Landslide Catalog (GLC), ISRO Bhuvan / GSI NLSM

### Real-Time Geo-Risk Assessment System Flow:
1. **Field Telemetry Stream**: Soil moisture and slope tilt sensors send telemetry to FastAPI backend (`/api/v1/telemetry`).
2. **Edge Fallback & Offline Sync**:
   - **If Network Online**: Direct JSON streaming to backend engine.
   - **If Network Offline**: Save reading to ESP32 local SD card -> Auto batch sync on reconnection (`/api/v1/telemetry/sync`).
3. **Satellite Backup Layer**: If sensor fails, trigger Open-Meteo live satellite precipitation fallback (`/api/v1/telemetry/weather-fallback`).
4. **Hybrid Risk Calculation**: Compute 3-7d antecedent rain, slope tilt angle, PostGIS proximity to past landslides, and XGBoost failure probability.
5. **Multi-Channel Alert Dispatch**:
   - **If Critical**: Trigger multi-channel disaster warnings (SMS, WhatsApp, FCM) + Control Room Manual Override.
   - **If Low / Medium**: Render GIS risk heatmap markers and 3 km buffer danger circles.

---

## Slide 4: Current Working Prototype Status vs. Future Roadmap

### 🟢 Current Working Prototype (SIH Demo Ready):
- **Interactive GIS Heatmap**: Leaflet map displaying active stations, 3 km PostGIS risk buffer circles, and historic landslides in NER.
- **Antecedent Saturation Engine**: Real-time 3d, 5d, and 7d rainfall accumulation analytics.
- **Hybrid ML Failure Scoring**: Real-time failure probability inference ($P \in [0.0, 1.0]$).
- **Satellite Fallback**: Open-Meteo live satellite precipitation queries for any coordinate.
- **Crowdsourced Incidents**: Geo-tagged incident report submission modal with click-on-map pin location.
- **Alert Control Room**: Warning dispatch history log stream & manual alert override.

### 🚀 Future Roadmap (SIH Phase 2 / Hackathon Scope):
1. **In-SAR & ISRO Sentinel-1 Satellite Displacement**: Integration of Synthetic Aperture Radar (SAR) interferometry to detect millimeter-scale slope ground deformation before surface cracking occurs.
2. **LoRaWAN Long-Range Mesh Network**: Connecting deep mountain valley ESP32 sensors using 868 MHz LoRa mesh networks without relying on cellular towers.
3. **Edge-AI Micro-ML on ESP32**: Quantized TensorFlow Lite Micro models executing directly on ESP32 microcontrollers for zero-latency offline detection.
4. **Vernacular Multilingual Warning Dispatch**: Emergency warnings in local NER languages (Khasi, Garo, Mizo, Nagamese, Assamese, Manipuri, Nepali).

---

## Slide 5: Feasibility, Viability & Risk Mitigation Matrix

### Feasibility Analysis:
- **Technical Feasibility**: Built with open-source GIS tools (Leaflet, PostGIS, FastAPI) and low-cost ESP32 sensors, making the system modular, scalable, and affordable to deploy.
- **Operational Feasibility**: Easily integrates into State Disaster Management Authority (SDMA) control rooms and district emergency operation centers (DEOC).

### Risk, Challenge & Mitigation Matrix:

| Potential Risk / Challenge | Technical Impact | Mitigation Strategy |
| :--- | :--- | :--- |
| **Network Loss in Remote Hills** | Sensor telemetry cannot be sent. | **Local Edge SD Caching:** ESP32 caches data locally and auto batch syncs upon network restoration. |
| **Extreme Rain / Sensor Damage** | Ground sensors damaged or buried. | **Open-Meteo Satellite Fallback:** Instant live satellite precipitation fallback query. |
| **False Alarms** | Unnecessary evacuations reduce trust. | **Hybrid Multi-Factor Check:** Warning triggers only when both antecedent rain, tilt, and ML failure probability cross thresholds. |

---

## Slide 6: Impact and Benefits

### Target Audience Impact:
- Grants disaster management authorities real-time spatial risk heatmaps to prepare and respond up to ~12 hours in advance.
- Delivers early warnings to local vulnerable communities, reducing casualties and providing evacuation lead time.
- **Actionable Lead Time:** ~12 Hours.
- **Automated Alerts:** SMS, WhatsApp, and Web Push.

### Benefits of the Solution:
- **Social Benefits**: Saves lives in vulnerable hilly terrain, minimizes community isolation, and streamlines emergency evacuations.
- **Economic Benefits**: Protects highways (NH-10, NH-2, NH-29) and critical infrastructure, lowering repair costs and preventing supply chain disruptions.
- **Environmental Benefits**: Continuous spatial monitoring of slope displacement, soil saturation, and soil erosion risk over time.

---

## Slide 7: Research & References

### Official Geospatial & Satellite Data Portals:
- **ISRO Landslide Atlas of India & Bhuvan Geoportal**: NRSC/ISRO mapped database of Indian landslide inventories across North-East India.
- **Geological Survey of India (GSI) Portal**: National Landslide Susceptibility Mapping (NLSM) dataset.
- **NASA Global Landslide Catalog (GLC) & COOLR**: Global database of rainfall-triggered landslide events.
- **Open-Meteo Historical & Forecast Precipitation API**: Live satellite weather API.

### Technical & Research Framework Papers:
- **Rainfall Thresholds & Antecedent Saturation for Early Warning (ScienceDirect/Elsevier)**
- **PostGIS Spatial Queries & GeoAlchemy2 Documentation**
- **XGBoost Gradient Boosting & Random Forest Classifier Documentation**
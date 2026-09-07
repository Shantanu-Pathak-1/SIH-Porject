# Extract all text and structure it cleanly into a markdown file

md_content = """# SMART INDIA HACKATHON 2026

## Slide 1: Title Page
- **Problem Statement ID:** SIH26001
- **Problem Statement Title:** AI-Based Early Warning and Landslide Risk Monitoring System in NER
- **Theme:** Disaster Management
- **PS Category:** Software
- **Team ID:** *(Blank)*
- **Team Name:** Ethrix
- **Idea Title:** GeoAlert-NER: AI & GIS-Driven Landslide Early Warning System

---

## Slide 2: Proposed Solution
*(Describe your Idea/Solution/Prototype)*

### Detailed explanation of the proposed solution:
- A software system that combines satellite data, past landslide records, rainfall data, and live sensor data to detect landslide risk.
- The system analyzes rainfall, soil conditions, terrain, and past landslide data to estimate the risk of landslides in hilly areas of NER (North-Eastern Region).

### How it addresses the problem:
- Provides early warnings several hours before a possible landslide, giving authorities more time to respond.
- Automatically sends alerts through SMS, WhatsApp, and web notifications to relevant authorities.

### Innovation and uniqueness of the solution:
- Uses rainfall collected over the previous 3–7 days instead of relying only on current rainfall (antecedent moisture tracking).
- Shows real-time risk areas on a map and uses ESP32 sensors to collect data locally.

---

## Slide 3: Technical Approach

### Technologies to be Used:
- **Machine Learning:** Python, Random Forest Classifier, XGBoost
- **Backend & Database:** FastAPI, PostgreSQL + PostGIS
- **Frontend & GIS:** React.js, Leaflet.js / Mapbox GL
- **IoT & Telemetry:** ESP32, REST APIs / MQTT
- **Alert Gateway:** Twilio (SMS/WhatsApp), Firebase Cloud Messaging (FCM)

### Real-Time Geo-Risk Assessment System Flow:
1. **Field Sensors:** Soil Saturation / Tilt sensors monitor ground parameters.
2. **Edge Processing & Connectivity:** ESP32 performs edge processing and checks connectivity.
   - **If Network Available (YES):** Streams JSON telemetry to Central FastAPI Backend Engine.
   - **If Network Loss / Damage (NO):**
     - Step 1: Cache data locally on ESP32 SD Card.
     - Step 2 (Fallback): Trigger Satellite API Data (IMD Rainfall & ISRO Bhuvan Maps).
3. **ML Prediction Engine:** Evaluates 3–7 day saturation & slope tilt using XGBoost / Random Forest.
4. **Risk Scoring:** Categorized into `LOW` | `MEDIUM` | `HIGH` | `CRITICAL`.
5. **Threshold Check:**
   - **If Critical:** Trigger Automated Multi-Channel Alerts (SMS / WhatsApp / FCM).
   - **If Low / Medium:** Update Mapbox Heatmap & Routine Logs.

---

## Slide 4: Feasibility and Viability

### Analysis of Feasibility:
- **Technical Feasibility:** Uses reliable open-source mapping tools and affordable ESP32 sensors, making the system practical to build and scale.
- **Operational Feasibility:** Can be integrated with existing disaster management systems used by authorities and monitoring centers.

### Risk, Challenge & Mitigation Matrix:

| Potential Risk / Challenge | Technical Impact | Mitigation Strategy |
| :--- | :--- | :--- |
| **Network Loss in Remote Hills** | Sensor data cannot be sent. | **Local Edge Caching:** ESP32 stores data locally and automatically sends it when the network is restored. |
| **Extreme Rain / Sensor Damage** | Sensor data may be missing or inaccurate. | **Backup Data Sources:** Uses weather APIs and ISRO Bhuvan satellite data when sensor data is unavailable. |
| **False Alarms** | Unnecessary warnings may cause panic and reduce trust. | **Multiple Checks:** An alert is sent only when both rainfall and soil-moisture conditions cross their risk limits. |

---

## Slide 5: Impact and Benefits

### Potential Impact on Target Audience:
- Gives disaster management authorities real-time risk maps to prepare and respond before a landslide occurs.
- Sends early warnings to local communities, helping reduce casualties and giving people more time to move to safer areas.
- **Actionable Lead Time:** ~12 Hours.
- **Automated Alerts:** SMS, WhatsApp, and Email.

### Benefits of the Solution:
- **Social Benefits:** Helps save lives, reduce isolation, and support timely evacuation.
- **Economic Benefits:** Reduces damage to roads and other infrastructure, lowers repair costs, and helps avoid disruptions to transportation and supplies.
- **Environmental Benefits:** Monitors slope stability, soil moisture, and areas at risk of erosion over time.

---

## Slide 6: Research and References

### Official Geospatial & Satellite Data Portals (Government Portals):
- **ISRO Landslide Atlas of India & Bhuvan Geoportal:**
  - *Details:* Mapped by ISRO/NRSC, containing a comprehensive database of over 80,000 Indian landslide inventories (including North-East India).
- **ISRO Bhuvan Disaster Management Support:**
  - ISRO Bhuvan Portal
- **Geological Survey of India (GSI) Portal:**
  - National Landslide Susceptibility Mapping (NLSM) dataset.
- **NASA Global Landslide Catalog (GLC) & COOLR:**
  - Global database of rainfall-triggered landslides.

### Technical & Research Framework Papers:
- **Rainfall Thresholds & Antecedent Saturation for Early Warning (ScienceDirect/Elsevier):**
  - Research supporting the use of rainfall from the previous 3–5 days for landslide prediction.
- **PostGIS & Geospatial Machine Learning:**
  - PostGIS Spatial Queries Documentation
  - XGBoost Gradient Boosting Documentation
"""

output_path = "SIH2026_IDEA_Presentation.md"
with open(output_path, "w", encoding="utf-8") as f:
    f.write(md_content)

print(f"Markdown file successfully created: {output_path}")
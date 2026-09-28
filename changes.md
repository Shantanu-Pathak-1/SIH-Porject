# 🚨 URGENT: Project Update & Problem Statement Change for SIH 2026

Hey Antigravity, 
We had to change our Problem Statement (PS) for the SIH idea submission because the previous one hit the 500-submission limit. 

**Don't worry, the new PS is very similar to what we've already built.** 
Our current Vercel deployment (`https://geo-alert-ner.vercel.app/`) serves as a perfect base. We just need to re-align the UI, data labels, and project narrative from "pure landslides" to a **"Hyper-Local Weather & Cloudburst Early Warning System"**.

---

## 📌 1. The New Problem Statement (Problem ID: 26077)
**Goal:** Develop an AI-driven hyper-local early warning system for extreme weather events (Cloudbursts, Flash Floods, Severe Thunderstorms) with a 2-6 hour lead time.

**Our Final Tech Stack & Architecture (For the Pitch):**
We are presenting a 5-Tier Architecture:
*   **Tier 1 (Data):** ISRO INSAT-3D (Satellite), NCMRWF IMDAA (Atmospheric), ISRO CartoDEM (30m Topography).
*   **Tier 2 (AI Brain):** Earthformer (Spatiotemporal Backbone) + 3 U-Net Heads (for Thunderstorm, Cloudburst, Flash Flood probabilities).
*   **Tier 3 (Verification):** Grad-CAM (Explainable AI) to show visual heatmaps of triggers.
*   **Tier 4 (GenAI):** Gemini/Groq LLM to convert raw ML probabilities into actionable Hindi/English SMS alerts.
*   **Tier 5 (Action):** FastAPI + PostGIS backend plotting to our React/Mapbox dashboard.

---

## 🛑 2. STRICT LIMITS FOR CURRENT PROTOTYPE (SCREENING PHASE)
Since this is just the online Idea Submission phase (PPT round), **DO NOT build the live backend or integrate real-time ISRO/IMD APIs yet.** If we get selected for the finale, we will code the actual backend.

For now, the prototype ONLY needs to visually prove our concept to the judges. 

**What we need to build/tweak right now:**
1.  **Mock Data (JSON):** Create a static/dummy JSON representing a historical event (e.g., a past cloudburst in Himachal/Uttarakhand). No live data ingestion.
2.  **UI Updates:** Rename the app branding (e.g., from GeoAlert to **Ethrix**). Update the map legends from pure landslide metrics to atmospheric metrics (CAPE, CIN, Cloud Top Temp).
3.  **Time Slider (The "Wow" Factor):** Add a simple time slider on the UI. As the user drags it, read from the dummy JSON to gradually display/intensify a Red/Orange Grad-CAM heatmap over a specific ward/valley.
4.  **XAI Risk Panel:** When clicking a high-risk zone on the map, open a side panel showing:
    *   `Threat Level: Cloudburst (88%)`
    *   `Trigger: Rapid Cloud Top Cooling detected.`
5.  **LLM Alert Button:** Add a "Dispatch AI Alert" button. Clicking it should just display a pre-written bilingual (Hindi/English) evacuation SMS (mocking the Tier 4 output).

---

## 🛠️ 3. Action Items for You (Antigravity)
1.  **Clone/Branch:** Branch out from the current `geo-alert-ner` repo.
2.  **Rebrand:** Change logos/titles to match the new weather/cloudburst theme.
3.  **Mock the Map:** Feed static GeoJSON polygons/heatmaps to Mapbox to simulate the Grad-CAM outputs.
4.  **Deploy:** Push the updated mocked UI to a new Vercel link (e.g., `ethrix-nowcast.vercel.app`) so we can generate a QR code for the PPT.

Let's keep it lightweight, fast, and highly visual. The backend heavy-lifting will happen in the 36-hour hackathon finale!
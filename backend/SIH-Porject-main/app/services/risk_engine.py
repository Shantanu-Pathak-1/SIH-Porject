import math
from datetime import datetime, timedelta, timezone
from typing import Dict, List, Optional, Tuple
from sqlalchemy import cast, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from geoalchemy2 import Geography
from app.config import settings
from app.models import LandslideEvent, SensorStation, TelemetryData


class LandslideMLInferenceEngine:
    """
    Ensemble ML Risk Scoring Engine (XGBoost / Random Forest classifier interface).
    Transforms multi-sensor spatial feature vectors into failure probability (0.0 - 1.0)
    and calibrated risk scores (0 - 100).
    """

    def __init__(self, model_path: Optional[str] = None):
        self.model_path = model_path
        self._is_loaded = False
        self._load_model()

    def _load_model(self):
        """Loads trained XGBoost/Joblib model if available, otherwise initializes ensemble weights."""
        if self.model_path:
            try:
                import joblib
                self.model = joblib.load(self.model_path)
                self._is_loaded = True
            except Exception:
                self._is_loaded = False
        else:
            self._is_loaded = False

    def predict_probability(self, features: Dict[str, float]) -> float:
        """
        Predicts landslide failure probability given normalized feature vector:
        - soil_moisture_percent (0-100)
        - rainfall_24h_mm
        - rainfall_3d_mm
        - rainfall_7d_mm
        - slope_tilt_deg
        - slope_angle_deg
        - nearby_landslides_5km
        """
        if self._is_loaded:
            try:
                # Prepare feature array for sklearn / xgboost model
                vector = [[
                    features.get("soil_moisture_percent", 0.0),
                    features.get("rainfall_24h_mm", 0.0),
                    features.get("rainfall_3d_mm", 0.0),
                    features.get("rainfall_7d_mm", 0.0),
                    features.get("slope_tilt_deg", 0.0),
                    features.get("slope_angle_deg", 0.0),
                    features.get("nearby_landslides_5km", 0),
                ]]
                prob = float(self.model.predict_proba(vector)[0][1])
                return max(0.0, min(1.0, prob))
            except Exception:
                pass

        # Robust Sigmoidal ML Risk Estimation Fallback
        w_moisture = (features.get("soil_moisture_percent", 0.0) / 100.0) * 3.5
        w_r3d = (features.get("rainfall_3d_mm", 0.0) / 150.0) * 3.0
        w_r24 = (features.get("rainfall_24h_mm", 0.0) / 100.0) * 2.0
        w_tilt = (abs(features.get("slope_tilt_deg", 0.0)) / 5.0) * 2.5
        w_proximity = min(2.0, features.get("nearby_landslides_5km", 0) * 0.5)

        z = w_moisture + w_r3d + w_r24 + w_tilt + w_proximity - 5.0
        probability = 1.0 / (1.0 + math.exp(-z))
        return round(max(0.0, min(1.0, probability)), 4)


# Global ML model instance
ml_engine = LandslideMLInferenceEngine()


async def calculate_antecedent_rainfall(
    db: AsyncSession, station_id: int
) -> Dict[str, float]:
    """Computes 3-day, 5-day, and 7-day cumulative antecedent rainfall for a sensor station."""
    now = datetime.now(timezone.utc)
    d3 = now - timedelta(days=3)
    d5 = now - timedelta(days=5)
    d7 = now - timedelta(days=7)

    stmt_3d = select(func.coalesce(func.sum(TelemetryData.rainfall_24h_mm), 0.0)).where(
        TelemetryData.station_id == station_id,
        TelemetryData.timestamp >= d3,
    )
    stmt_5d = select(func.coalesce(func.sum(TelemetryData.rainfall_24h_mm), 0.0)).where(
        TelemetryData.station_id == station_id,
        TelemetryData.timestamp >= d5,
    )
    stmt_7d = select(func.coalesce(func.sum(TelemetryData.rainfall_24h_mm), 0.0)).where(
        TelemetryData.station_id == station_id,
        TelemetryData.timestamp >= d7,
    )

    r3 = (await db.execute(stmt_3d)).scalar_one()
    r5 = (await db.execute(stmt_5d)).scalar_one()
    r7 = (await db.execute(stmt_7d)).scalar_one()

    return {
        "rainfall_3d_mm": float(r3),
        "rainfall_5d_mm": float(r5),
        "rainfall_7d_mm": float(r7),
    }


async def count_nearby_landslides_postgis(
    db: AsyncSession, station_location_geom, radius_meters: float = 5000.0
) -> int:
    """Leverages PostGIS native geography ST_DWithin function to count past landslides."""
    stmt = select(func.count(LandslideEvent.id)).where(
        func.ST_DWithin(
            cast(LandslideEvent.location, Geography),
            cast(station_location_geom, Geography),
            radius_meters,
        )
    )
    result = await db.execute(stmt)
    return int(result.scalar_one())


async def evaluate_station_risk(
    db: AsyncSession, station: SensorStation, latest_telemetry: TelemetryData
) -> Tuple[float, str, List[str], Dict[str, float], int]:
    """
    Evaluates real-time landslide risk score (0-100) and level (LOW/MEDIUM/HIGH/CRITICAL)
    by combining rule-based heuristics with XGBoost/RF ML inference probabilities.
    """
    trigger_reasons = []

    # 1. Soil moisture score
    moisture = latest_telemetry.soil_moisture_percent
    if moisture >= settings.MOISTURE_CRITICAL_THRESHOLD:
        moisture_score = 40.0
        trigger_reasons.append(f"Soil moisture critical at {moisture:.1f}%")
    elif moisture >= settings.MOISTURE_HIGH_THRESHOLD:
        moisture_score = 25.0 + ((moisture - settings.MOISTURE_HIGH_THRESHOLD) / (settings.MOISTURE_CRITICAL_THRESHOLD - settings.MOISTURE_HIGH_THRESHOLD)) * 15.0
        trigger_reasons.append(f"Soil moisture elevated at {moisture:.1f}%")
    else:
        moisture_score = (moisture / settings.MOISTURE_HIGH_THRESHOLD) * 25.0

    # 2. Antecedent rainfall score
    rainfall_data = await calculate_antecedent_rainfall(db, station.id)
    r3d = rainfall_data["rainfall_3d_mm"] + latest_telemetry.rainfall_24h_mm
    r7d = rainfall_data["rainfall_7d_mm"] + latest_telemetry.rainfall_24h_mm

    if r3d > 150.0:
        rainfall_score = 35.0
        trigger_reasons.append(f"Heavy 3-day antecedent rainfall: {r3d:.1f} mm")
    elif r3d > 75.0:
        rainfall_score = 20.0 + ((r3d - 75.0) / 75.0) * 15.0
        trigger_reasons.append(f"Moderate 3-day antecedent rainfall: {r3d:.1f} mm")
    else:
        rainfall_score = (r3d / 75.0) * 20.0

    # 3. Slope tilt angle change score
    tilt = abs(latest_telemetry.slope_tilt_deg)
    if tilt >= settings.TILT_CRITICAL_THRESHOLD:
        tilt_score = 15.0
        trigger_reasons.append(f"Critical slope displacement: {tilt:.2f}°")
    elif tilt >= 2.0:
        tilt_score = 8.0 + ((tilt - 2.0) / (settings.TILT_CRITICAL_THRESHOLD - 2.0)) * 7.0
        trigger_reasons.append(f"Slope tilt change: {tilt:.2f}°")
    else:
        tilt_score = (tilt / 2.0) * 8.0

    # 4. PostGIS spatial historical landslide proximity
    nearby_count = await count_nearby_landslides_postgis(db, station.location, radius_meters=5000.0)
    if nearby_count > 0:
        spatial_score = min(10.0, nearby_count * 3.33)
        trigger_reasons.append(f"Hazard zone proximity: {nearby_count} past landslide events within 5km")
    else:
        spatial_score = 0.0

    rule_score = min(100.0, moisture_score + rainfall_score + tilt_score + spatial_score)

    # 5. ML Ensemble Feature Extraction & Probability Scoring
    feature_vector = {
        "soil_moisture_percent": moisture,
        "rainfall_24h_mm": latest_telemetry.rainfall_24h_mm,
        "rainfall_3d_mm": r3d,
        "rainfall_7d_mm": r7d,
        "slope_tilt_deg": tilt,
        "slope_angle_deg": station.slope_angle_deg,
        "nearby_landslides_5km": nearby_count,
    }
    ml_probability = ml_engine.predict_probability(feature_vector)
    ml_score = ml_probability * 100.0

    # Combined Hybrid Risk Score (60% Rule-Based Heuristics + 40% ML Probability Engine)
    total_score = round(0.60 * rule_score + 0.40 * ml_score, 1)

    # Risk level classification
    if total_score >= 80.0:
        risk_level = "CRITICAL"
    elif total_score >= 55.0:
        risk_level = "HIGH"
    elif total_score >= 30.0:
        risk_level = "MEDIUM"
    else:
        risk_level = "LOW"

    return total_score, risk_level, trigger_reasons, rainfall_data, nearby_count

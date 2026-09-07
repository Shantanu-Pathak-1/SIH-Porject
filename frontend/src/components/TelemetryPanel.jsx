import React from 'react';
import { Activity, Droplets, Compass, CloudRain, AlertTriangle, Layers, BrainCircuit, CheckCircle2 } from 'lucide-react';
import TelemetryChart from './TelemetryChart';

export default function TelemetryPanel({ stationRisk, telemetryHistory = [] }) {
  if (!stationRisk) {
    return (
      <div className="glass-panel" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <Activity size={32} color="#6366f1" style={{ marginBottom: '12px' }} />
        <h3>Select a Monitoring Station</h3>
        <p style={{ fontSize: '0.85rem', marginTop: '6px' }}>
          Click any station marker on the GIS map to inspect real-time ESP32 sensor telemetry, antecedent moisture analytics, and ML failure probability.
        </p>
      </div>
    );
  }

  const {
    station_code,
    station_name,
    latitude,
    longitude,
    risk_score,
    risk_level,
    current_soil_moisture,
    current_slope_tilt,
    rainfall_24h_mm,
    antecedent_rainfall_3d_mm,
    antecedent_rainfall_7d_mm,
    nearby_landslides_5km_count,
    trigger_reasons = []
  } = stationRisk;

  // ML Failure Probability approximation from score
  const mlProb = (risk_score / 100).toFixed(4);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto', maxHeight: '100%' }}>
      
      {/* Station Header */}
      <div className="glass-panel" style={{ padding: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#818cf8', letterSpacing: '0.05em' }}>
              {station_code}
            </span>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.15rem', fontWeight: 700, marginTop: '2px' }}>
              {station_name}
            </h2>
          </div>
          <span className={`badge badge-${risk_level.toLowerCase()}`}>
            {risk_level} RISK
          </span>
        </div>

        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '8px' }}>
          <div>Coordinates: <strong>{latitude.toFixed(4)}°, {longitude.toFixed(4)}°</strong></div>
          <div>Elevation: <strong>1,525 m</strong></div>
        </div>
      </div>

      {/* Composite Risk Score & ML Engine */}
      <div className="glass-panel" style={{ padding: '16px', background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 41, 59, 0.6) 100%)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BrainCircuit size={20} color="#818cf8" />
            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Composite Landslide Risk Score</span>
          </div>
          <span style={{ fontSize: '1.4rem', fontWeight: 800, color: risk_score >= 80 ? '#ef4444' : risk_score >= 55 ? '#f97316' : '#10b981' }}>
            {risk_score} <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>/ 100</span>
          </span>
        </div>

        {/* Progress Bar */}
        <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden', marginBottom: '12px' }}>
          <div style={{
            width: `${risk_score}%`,
            height: '100%',
            background: risk_score >= 80 ? 'linear-gradient(90deg, #f97316, #ef4444)' : 'linear-gradient(90deg, #10b981, #f59e0b)',
            transition: 'width 0.5s ease'
          }} />
        </div>

        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
          <span>ML Failure Probability: <strong style={{ color: '#f8fafc' }}>{mlProb}</strong></span>
          <span>Inference: <strong style={{ color: '#818cf8' }}>XGBoost Ensemble</strong></span>
        </div>
      </div>

      {/* Key Sensor Telemetry Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        
        {/* Soil Moisture */}
        <div className="glass-panel" style={{ padding: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.78rem', marginBottom: '6px' }}>
            <Droplets size={16} color="#38bdf8" />
            <span>Soil Moisture Saturation</span>
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: current_soil_moisture >= 85 ? '#ef4444' : '#f8fafc' }}>
            {current_soil_moisture}%
          </div>
          <div style={{ fontSize: '0.7rem', color: current_soil_moisture >= 85 ? '#f87171' : '#34d399', marginTop: '2px' }}>
            {current_soil_moisture >= 85 ? 'Critical Liquefaction Limit' : 'Normal Moisture Range'}
          </div>
        </div>

        {/* Slope Tilt Angle */}
        <div className="glass-panel" style={{ padding: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.78rem', marginBottom: '6px' }}>
            <Compass size={16} color="#fbbf24" />
            <span>Slope Displacement Tilt</span>
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: Math.abs(current_slope_tilt) >= 5.0 ? '#ef4444' : '#f8fafc' }}>
            {current_slope_tilt}°
          </div>
          <div style={{ fontSize: '0.7rem', color: Math.abs(current_slope_tilt) >= 5.0 ? '#f87171' : '#fbbf24', marginTop: '2px' }}>
            {Math.abs(current_slope_tilt) >= 5.0 ? 'Active Ground Movement' : 'Stable Inclinometer'}
          </div>
        </div>

        {/* 24h Rain */}
        <div className="glass-panel" style={{ padding: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.78rem', marginBottom: '6px' }}>
            <CloudRain size={16} color="#818cf8" />
            <span>24h Current Rainfall</span>
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f8fafc' }}>
            {rainfall_24h_mm} <span style={{ fontSize: '0.8rem', fontWeight: 400 }}>mm</span>
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>Precipitation Gauge</div>
        </div>

        {/* 3-Day Antecedent Saturation */}
        <div className="glass-panel" style={{ padding: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.78rem', marginBottom: '6px' }}>
            <Layers size={16} color="#a78bfa" />
            <span>3-Day Antecedent Rain</span>
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: antecedent_rainfall_3d_mm > 150 ? '#ef4444' : '#f8fafc' }}>
            {antecedent_rainfall_3d_mm} <span style={{ fontSize: '0.8rem', fontWeight: 400 }}>mm</span>
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>7-Day Total: {antecedent_rainfall_7d_mm} mm</div>
        </div>

      </div>

      {/* Historical Landslide Proximity */}
      <div className="glass-panel" style={{ padding: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <AlertTriangle size={18} color="#f97316" />
          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>PostGIS Hazard Proximity (5km):</span>
        </div>
        <span style={{ fontSize: '0.9rem', fontWeight: 700, color: nearby_landslides_5km_count > 0 ? '#fb923c' : '#34d399' }}>
          {nearby_landslides_5km_count} Past Landslides
        </span>
      </div>

      {/* Trigger Reasons Checklist */}
      {trigger_reasons.length > 0 && (
        <div className="glass-panel" style={{ padding: '14px', borderColor: 'rgba(239, 68, 68, 0.3)' }}>
          <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#f87171', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <AlertTriangle size={16} /> Active Danger Triggers
          </div>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {trigger_reasons.map((reason, idx) => (
              <li key={idx} style={{ fontSize: '0.78rem', color: '#cbd5e1', display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                <span style={{ color: '#ef4444', marginTop: '2px' }}>•</span> {reason}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 7-Day Trend Chart */}
      <div className="glass-panel" style={{ padding: '16px' }}>
        <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Activity size={16} color="#6366f1" /> 7-Day Telemetry Trend Line
        </div>
        <TelemetryChart dataHistory={telemetryHistory} />
      </div>

    </div>
  );
}

import React, { useState } from 'react';
import { X, CloudRain, Satellite, RefreshCw, Layers } from 'lucide-react';
import { fetchWeatherFallback } from '../services/api';

export default function WeatherBackup({ isOpen, onClose }) {
  const [lat, setLat] = useState('25.5686');
  const [lon, setLon] = useState('91.8833');
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleQuery = async () => {
    setIsLoading(true);
    const result = await fetchWeatherFallback(parseFloat(lat), parseFloat(lon));
    setData(result);
    setIsLoading(false);
  };

  const handlePreset = (presetLat, presetLon) => {
    setLat(presetLat);
    setLon(presetLon);
  };

  return (
    <div className="modal-overlay">
      <div className="glass-panel modal-content" style={{ padding: '24px', maxWidth: '580px' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Satellite size={22} color="#38bdf8" />
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.15rem', fontWeight: 700 }}>
              Satellite Open-Meteo Weather Backup
            </h3>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
          Query live and 7-day historical satellite precipitation fallback data when physical ESP32 sensor telemetry is unavailable or damaged in remote NER hills.
        </p>

        {/* Presets */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
          <button className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '4px 10px' }} onClick={() => handlePreset('25.5686', '91.8833')}>Shillong</button>
          <button className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '4px 10px' }} onClick={() => handlePreset('25.2750', '91.7333')}>Cherrapunji</button>
          <button className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '4px 10px' }} onClick={() => handlePreset('27.3389', '88.6065')}>Gangtok</button>
          <button className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '4px 10px' }} onClick={() => handlePreset('23.7307', '92.7173')}>Aizawl</button>
          <button className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '4px 10px' }} onClick={() => handlePreset('25.6751', '94.1086')}>Kohima</button>
        </div>

        {/* Lat / Lon Input */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 120px', gap: '10px', marginBottom: '16px' }}>
          <div>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Latitude</label>
            <input type="text" value={lat} onChange={(e) => setLat(e.target.value)} style={{ width: '100%', padding: '8px', background: 'rgba(15,23,42,0.8)', border: '1px solid var(--border-light)', borderRadius: '6px', color: 'white' }} />
          </div>
          <div>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Longitude</label>
            <input type="text" value={lon} onChange={(e) => setLon(e.target.value)} style={{ width: '100%', padding: '8px', background: 'rgba(15,23,42,0.8)', border: '1px solid var(--border-light)', borderRadius: '6px', color: 'white' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button className="btn btn-primary" style={{ width: '100%', height: '37px' }} onClick={handleQuery} disabled={isLoading}>
              <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} /> {isLoading ? '...' : 'Query'}
            </button>
          </div>
        </div>

        {/* Result Output */}
        {data && (
          <div className="glass-panel" style={{ padding: '16px', background: 'rgba(15,23,42,0.9)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '0.82rem' }}>
              <span>Data Source: <strong style={{ color: '#38bdf8' }}>{data.source}</strong></span>
              <span style={{ color: '#34d399' }}>Status: Satellite Backup Active</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
              <div style={{ background: 'rgba(255,255,255,0.05)', padding: '10px', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>24h Rain</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc' }}>{data.rainfall_24h_mm} mm</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.05)', padding: '10px', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>3-Day Rain</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#818cf8' }}>{data.rainfall_3d_mm} mm</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.05)', padding: '10px', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>7-Day Total</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#a78bfa' }}>{data.rainfall_7d_mm} mm</div>
              </div>
            </div>

            <div style={{ marginTop: '12px', fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
              <span>Estimated Soil Saturation: <strong style={{ color: '#38bdf8' }}>{data.estimated_soil_moisture_percent}%</strong></span>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

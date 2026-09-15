import React from 'react';
import { ShieldAlert, Activity, MapPin, CloudRain, PlusCircle, Radio } from 'lucide-react';

export default function Navbar({
  criticalCount,
  stationCount,
  onOpenReportModal,
  onOpenWeatherModal,
  activeTab,
  setActiveTab
}) {
  return (
    <header className="glass-panel" style={{ borderRadius: 0, borderTop: 0, borderLeft: 0, borderRight: 0, padding: '12px 24px', zIndex: 1000 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        
        {/* Branding & Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            background: 'linear-gradient(135deg, #ef4444 0%, #6366f1 100%)',
            padding: '10px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 15px rgba(99, 102, 241, 0.4)'
          }}>
            <ShieldAlert size={24} color="#ffffff" />
          </div>
          <div>
            <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.35rem', fontWeight: 700, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '8px' }}>
              GeoAlert<span style={{ color: '#6366f1' }}>-NER</span>
              <span style={{ fontSize: '0.7rem', padding: '2px 8px', background: 'rgba(99, 102, 241, 0.2)', border: '1px solid rgba(99, 102, 241, 0.4)', borderRadius: '12px', color: '#818cf8' }}>
                AI & GIS Engine v1.0
              </span>
            </h1>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              North Eastern Region Landslide Early Warning & Antecedent Saturation Monitoring
            </p>
          </div>
        </div>

        {/* Live System Stats & Quick Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          
          {/* Status Indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', background: 'rgba(255,255,255,0.05)', borderRadius: '20px', border: '1px solid var(--border-light)' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }}></span>
            <span style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-main)' }}>Live Telemetry Engine</span>
          </div>

          {/* Active Station Count */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            <MapPin size={16} color="#818cf8" />
            <span><strong>{stationCount}</strong> Stations</span>
          </div>

          {/* Critical Hazard Counter */}
          {criticalCount > 0 && (
            <div className="badge badge-critical">
              <Radio size={14} className="animate-pulse" />
              <span>{criticalCount} Critical Emergency</span>
            </div>
          )}

          {/* Tab Navigation */}
          <div style={{ display: 'flex', background: 'rgba(0,0,0,0.3)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
            <button
              className={`btn ${activeTab === 'map' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '6px 12px', fontSize: '0.8rem' }}
              onClick={() => setActiveTab('map')}
            >
              <Activity size={14} /> GIS Heatmap
            </button>
            <button
              className={`btn ${activeTab === 'alerts' ? 'btn-danger' : 'btn-secondary'}`}
              style={{ padding: '6px 12px', fontSize: '0.8rem' }}
              onClick={() => setActiveTab('alerts')}
            >
              <ShieldAlert size={14} /> Alerts Log
            </button>
          </div>

          {/* Weather Satellite Backup */}
          <button
            className="btn btn-secondary"
            onClick={onOpenWeatherModal}
            title="Open Satellite Precipitation Query"
          >
            <CloudRain size={16} color="#38bdf8" /> Satellite Backup
          </button>

          {/* Submit Incident Button */}
          <button
            className="btn btn-primary"
            onClick={onOpenReportModal}
          >
            <PlusCircle size={16} /> Report Field Incident
          </button>

        </div>

      </div>
    </header>
  );
}

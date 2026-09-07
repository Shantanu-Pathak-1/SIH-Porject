import React, { useState } from 'react';
import { X, MapPin, Send, AlertTriangle } from 'lucide-react';

export default function IncidentModal({
  isOpen,
  onClose,
  onSubmitReport,
  isSelectingLocation,
  setIsSelectingLocation,
  pinLocation
}) {
  const [reporterName, setReporterName] = useState('');
  const [phone, setPhone] = useState('');
  const [severity, setSeverity] = useState('MODERATE');
  const [description, setDescription] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const lat = pinLocation ? pinLocation.lat : 27.3300;
  const lon = pinLocation ? pinLocation.lng : 88.6100;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reporterName || !phone || !description) return;

    setIsSubmitting(true);
    await onSubmitReport({
      reporter_name: reporterName,
      phone: phone,
      description: description,
      media_url: mediaUrl || null,
      severity: severity,
      latitude: parseFloat(lat),
      longitude: parseFloat(lon)
    });
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="glass-panel modal-content" style={{ padding: '24px' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertTriangle size={22} color="#ec4899" />
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.15rem', fontWeight: 700 }}>
              Report Field Landslide Incident
            </h3>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          
          {/* Map Coordinate Picker Toggle */}
          <div style={{
            background: 'rgba(255,255,255,0.05)',
            padding: '12px',
            borderRadius: '8px',
            border: isSelectingLocation ? '1px solid #6366f1' : '1px solid var(--border-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div>
              <div style={{ fontSize: '0.82rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MapPin size={16} color="#6366f1" /> Geo-Coordinates
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Lat: <strong>{lat.toFixed(4)}°</strong>, Lon: <strong>{lon.toFixed(4)}°</strong>
              </div>
            </div>
            <button
              type="button"
              className={`btn ${isSelectingLocation ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '6px 12px', fontSize: '0.75rem' }}
              onClick={() => setIsSelectingLocation(!isSelectingLocation)}
            >
              {isSelectingLocation ? 'Click on Map to Pick' : 'Pick on Map'}
            </button>
          </div>

          {/* Reporter Name & Phone */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                Reporter Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Tashi Norbu"
                value={reporterName}
                onChange={(e) => setReporterName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  background: 'rgba(15,23,42,0.8)',
                  border: '1px solid var(--border-light)',
                  borderRadius: '6px',
                  color: 'white',
                  fontSize: '0.85rem'
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                Phone Number *
              </label>
              <input
                type="text"
                required
                placeholder="+919876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  background: 'rgba(15,23,42,0.8)',
                  border: '1px solid var(--border-light)',
                  borderRadius: '6px',
                  color: 'white',
                  fontSize: '0.85rem'
                }}
              />
            </div>
          </div>

          {/* Severity Selector */}
          <div>
            <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
              Hazard Severity
            </label>
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                background: 'rgba(15,23,42,0.8)',
                border: '1px solid var(--border-light)',
                borderRadius: '6px',
                color: 'white',
                fontSize: '0.85rem'
              }}
            >
              <option value="MINOR">MINOR (Minor soil erosion / minor rockfall)</option>
              <option value="MODERATE">MODERATE (Active slope cracks / partial road block)</option>
              <option value="SEVERE">SEVERE (Major mudslide / debris flow / evacuation needed)</option>
            </select>
          </div>

          {/* Description */}
          <div>
            <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
              Field Observation Details *
            </label>
            <textarea
              required
              rows={3}
              placeholder="Describe ground cracks, rainfall intensity, affected roads or structures..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                background: 'rgba(15,23,42,0.8)',
                border: '1px solid var(--border-light)',
                borderRadius: '6px',
                color: 'white',
                fontSize: '0.85rem',
                fontFamily: 'inherit'
              }}
            />
          </div>

          {/* Photo / Media URL */}
          <div>
            <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
              Photo / Image URL (Optional)
            </label>
            <input
              type="url"
              placeholder="https://storage.geoalert.in/reports/photo.jpg"
              value={mediaUrl}
              onChange={(e) => setMediaUrl(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                background: 'rgba(15,23,42,0.8)',
                border: '1px solid var(--border-light)',
                borderRadius: '6px',
                color: 'white',
                fontSize: '0.85rem'
              }}
            />
          </div>

          {/* Form Action Buttons */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ flex: 1 }}
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary"
              style={{ flex: 1 }}
            >
              <Send size={16} /> {isSubmitting ? 'Submitting...' : 'Submit Incident'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}

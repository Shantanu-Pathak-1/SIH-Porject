import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

// Custom Map Click Listener for Incident Report Coordinate Selection
function MapClickListener({ onMapClick, isSelectingLocation }) {
  useMapEvents({
    click(e) {
      if (isSelectingLocation && onMapClick) {
        onMapClick(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
}

// Marker Icon Generators
const createRiskIcon = (riskLevel) => {
  let color = '#10b981';
  let className = '';

  if (riskLevel === 'CRITICAL') {
    color = '#ef4444';
    className = 'pulse-marker-critical';
  } else if (riskLevel === 'HIGH') {
    color = '#f97316';
  } else if (riskLevel === 'MEDIUM') {
    color = '#f59e0b';
  }

  return L.divIcon({
    className: 'custom-station-icon',
    html: `
      <div style="
        background-color: ${color};
        width: 22px;
        height: 22px;
        border-radius: 50%;
        border: 2px solid white;
        box-shadow: 0 0 10px ${color};
        display: flex;
        align-items: center;
        justify-content: center;
      " class="${className}">
        <div style="width: 6px; height: 6px; background: white; border-radius: 50%;"></div>
      </div>
    `,
    iconSize: [22, 22],
    iconAnchor: [11, 11]
  });
};

const landslideIcon = L.divIcon({
  className: 'custom-landslide-icon',
  html: `
    <div style="
      background-color: #8b5cf6;
      width: 18px;
      height: 18px;
      transform: rotate(45deg);
      border: 1.5px solid white;
      box-shadow: 0 0 8px #8b5cf6;
    "></div>
  `,
  iconSize: [18, 18],
  iconAnchor: [9, 9]
});

const incidentIcon = L.divIcon({
  className: 'custom-incident-icon',
  html: `
    <div style="
      background-color: #ec4899;
      width: 20px;
      height: 20px;
      border-radius: 4px;
      border: 2px solid white;
      box-shadow: 0 0 10px #ec4899;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 10px;
      font-weight: bold;
    ">!</div>
  `,
  iconSize: [20, 20],
  iconAnchor: [10, 10]
});

export default function GISMap({
  riskFeatures = [],
  landslides = [],
  incidents = [],
  selectedStationId,
  onSelectStation,
  isSelectingLocation,
  onMapClick,
  pinLocation
}) {
  // Center map on North Eastern Region (Shillong / Assam / Sikkim hub)
  const centerLatLon = [25.8000, 92.5000];

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <MapContainer
        center={centerLatLon}
        zoom={7}
        scrollWheelZoom={true}
        style={{ width: '100%', height: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        <MapClickListener onMapClick={onMapClick} isSelectingLocation={isSelectingLocation} />

        {/* Selected Pin for Field Incident Submission */}
        {pinLocation && (
          <Marker position={[pinLocation.lat, pinLocation.lng]}>
            <Popup>
              <strong>Selected Location</strong><br />
              Lat: {pinLocation.lat.toFixed(4)}, Lon: {pinLocation.lng.toFixed(4)}
            </Popup>
          </Marker>
        )}

        {/* Monitoring Stations & Risk Heatmap Overlays */}
        {riskFeatures.map((feat, idx) => {
          const coords = feat.geometry.coordinates; // [lon, lat]
          const props = feat.properties;
          const lat = coords[1];
          const lon = coords[0];
          const isSelected = props.station_id === selectedStationId;

          // Buffer color matching risk
          let strokeColor = '#10b981';
          if (props.risk_level === 'CRITICAL') strokeColor = '#ef4444';
          else if (props.risk_level === 'HIGH') strokeColor = '#f97316';
          else if (props.risk_level === 'MEDIUM') strokeColor = '#f59e0b';

          return (
            <React.Fragment key={`stn-${props.station_id || idx}`}>
              {/* PostGIS ST_Buffer 3km Risk Danger Circle Overlay */}
              <Circle
                center={[lat, lon]}
                radius={3000} // 3 km radius
                pathOptions={{
                  color: strokeColor,
                  fillColor: strokeColor,
                  fillOpacity: isSelected ? 0.25 : 0.12,
                  weight: isSelected ? 3 : 1.5,
                  dashArray: props.risk_level === 'CRITICAL' ? '6, 6' : undefined
                }}
              />

              {/* Station Marker */}
              <Marker
                position={[lat, lon]}
                icon={createRiskIcon(props.risk_level)}
                eventHandlers={{
                  click: () => onSelectStation && onSelectStation(props.station_id),
                }}
              >
                <Popup>
                  <div style={{ minWidth: '200px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <strong style={{ fontSize: '0.9rem', color: '#f8fafc' }}>{props.station_name}</strong>
                      <span className={`badge badge-${props.risk_level?.toLowerCase()}`}>
                        {props.risk_level}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#cbd5e1', lineHeight: '1.6' }}>
                      <div>State: <strong>{props.state}</strong></div>
                      <div>Soil Moisture: <strong>{props.soil_moisture_percent}%</strong></div>
                      <div>Slope Tilt: <strong>{props.slope_tilt_deg}°</strong></div>
                      <div>24h Rainfall: <strong>{props.rainfall_24h_mm} mm</strong></div>
                      <div>Risk Score: <strong style={{ color: strokeColor }}>{props.risk_score} / 100</strong></div>
                    </div>
                  </div>
                </Popup>
              </Marker>
            </React.Fragment>
          );
        })}

        {/* Historical Landslide Events */}
        {landslides.map((event) => (
          <Marker
            key={`ls-${event.id}`}
            position={[event.latitude, event.longitude]}
            icon={landslideIcon}
          >
            <Popup>
              <div style={{ fontSize: '0.82rem' }}>
                <strong style={{ color: '#a78bfa' }}>📜 Historic Landslide Event</strong>
                <div style={{ fontWeight: 600, marginTop: '4px' }}>{event.title}</div>
                <div>State: {event.state} ({event.district})</div>
                <div>Severity: <strong style={{ color: '#ef4444' }}>{event.severity}</strong></div>
                <p style={{ marginTop: '4px', fontSize: '0.75rem', color: '#94a3b8' }}>{event.description}</p>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Crowdsourced Incidents */}
        {incidents.map((inc) => (
          <Marker
            key={`inc-${inc.id}`}
            position={[inc.latitude, inc.longitude]}
            icon={incidentIcon}
          >
            <Popup>
              <div style={{ fontSize: '0.82rem' }}>
                <strong style={{ color: '#f472b6' }}>📢 Field Incident Report</strong>
                <div style={{ fontWeight: 600, marginTop: '4px' }}>Reporter: {inc.reporter_name}</div>
                <div>Status: <span className="badge badge-high">{inc.status}</span></div>
                <div>Severity: <strong>{inc.severity}</strong></div>
                <p style={{ marginTop: '4px', fontSize: '0.75rem', color: '#cbd5e1' }}>{inc.description}</p>
              </div>
            </Popup>
          </Marker>
        ))}

      </MapContainer>

      {/* Map Legend Overlay */}
      <div className="glass-panel" style={{
        position: 'absolute',
        bottom: '20px',
        left: '20px',
        padding: '12px 16px',
        zIndex: 1000,
        fontSize: '0.78rem'
      }}>
        <div style={{ fontWeight: 600, marginBottom: '8px', color: 'var(--text-main)' }}>Map Layers Legend</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444' }}></span> Critical Emergency Hazard Zone
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f97316' }}></span> High Landslide Risk Area
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b' }}></span> Medium Warning Zone
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981' }}></span> Low / Stable Terrain
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
            <span style={{ width: '10px', height: '10px', transform: 'rotate(45deg)', background: '#8b5cf6' }}></span> Historic ISRO/GSI Landslide Record
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '10px', height: '10px', background: '#ec4899', borderRadius: '2px' }}></span> Crowdsourced Field Incident
          </div>
        </div>
      </div>
    </div>
  );
}

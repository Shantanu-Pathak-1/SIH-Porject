import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import GISMap from './components/GISMap';
import TelemetryPanel from './components/TelemetryPanel';
import AlertFeed from './components/AlertFeed';
import IncidentModal from './components/IncidentModal';
import WeatherBackup from './components/WeatherBackup';
import {
  fetchStations,
  fetchRiskMapGeoJSON,
  fetchStationRisk,
  fetchStationTelemetryHistory,
  fetchNearbyLandslides,
  fetchIncidents,
  submitIncidentReport,
  fetchAlertLogs,
  triggerManualAlert
} from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('map');
  const [stations, setStations] = useState([]);
  const [riskFeatures, setRiskFeatures] = useState([]);
  const [landslides, setLandslides] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [alerts, setAlerts] = useState([]);
  
  const [selectedStationId, setSelectedStationId] = useState(1);
  const [stationRisk, setStationRisk] = useState(null);
  const [telemetryHistory, setTelemetryHistory] = useState([]);
  
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isWeatherModalOpen, setIsWeatherModalOpen] = useState(false);
  const [isSelectingLocation, setIsSelectingLocation] = useState(false);
  const [pinLocation, setPinLocation] = useState(null);

  // Initial Data Fetch
  useEffect(() => {
    async function loadData() {
      const stns = await fetchStations();
      setStations(stns);

      const geojson = await fetchRiskMapGeoJSON();
      if (geojson && geojson.features) {
        setRiskFeatures(geojson.features);
      }

      const ls = await fetchNearbyLandslides(25.5, 91.8, 100);
      setLandslides(ls);

      const incs = await fetchIncidents();
      setIncidents(incs);

      const alrts = await fetchAlertLogs();
      setAlerts(alrts);
    }
    loadData();
  }, []);

  // Fetch Station Risk Details when selected station changes
  useEffect(() => {
    if (!selectedStationId) return;
    async function loadStationDetails() {
      const risk = await fetchStationRisk(selectedStationId);
      setStationRisk(risk);

      const history = await fetchStationTelemetryHistory(selectedStationId);
      setTelemetryHistory(history);
    }
    loadStationDetails();
  }, [selectedStationId]);

  // Handle map click when picking coordinate for incident report
  const handleMapClick = (lat, lng) => {
    setPinLocation({ lat, lng });
    setIsSelectingLocation(false);
    setIsReportModalOpen(true);
  };

  const handleSubmitReport = async (payload) => {
    const newReport = await submitIncidentReport(payload);
    setIncidents([newReport, ...incidents]);
  };

  const handleTriggerAlert = async (payload) => {
    const newAlert = await triggerManualAlert(payload);
    setAlerts([newAlert, ...alerts]);
  };

  const criticalCount = riskFeatures.filter(f => f.properties?.risk_level === 'CRITICAL').length;

  return (
    <div id="root">
      {/* Top Navbar */}
      <Navbar
        criticalCount={criticalCount}
        stationCount={stations.length}
        onOpenReportModal={() => setIsReportModalOpen(true)}
        onOpenWeatherModal={() => setIsWeatherModalOpen(true)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main View Area */}
      <main style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {activeTab === 'map' ? (
          <div style={{ width: '100%', height: '100%', display: 'flex' }}>
            
            {/* GIS Map */}
            <div style={{ flex: 1, height: '100%', position: 'relative' }}>
              <GISMap
                riskFeatures={riskFeatures}
                landslides={landslides}
                incidents={incidents}
                selectedStationId={selectedStationId}
                onSelectStation={(id) => setSelectedStationId(id)}
                isSelectingLocation={isSelectingLocation}
                onMapClick={handleMapClick}
                pinLocation={pinLocation}
              />
            </div>

            {/* Telemetry & Risk Analytics Sidebar */}
            <div style={{
              width: '420px',
              height: '100%',
              padding: '16px',
              borderLeft: '1px solid var(--border-light)',
              background: 'rgba(7, 10, 18, 0.85)',
              backdropFilter: 'blur(12px)',
              overflowY: 'auto'
            }}>
              <TelemetryPanel
                stationRisk={stationRisk}
                telemetryHistory={telemetryHistory}
              />
            </div>

          </div>
        ) : (
          <div style={{ width: '100%', height: '100%' }}>
            <AlertFeed
              alerts={alerts}
              onTriggerManualAlert={handleTriggerAlert}
            />
          </div>
        )}
      </main>

      {/* Crowdsourced Field Incident Modal */}
      <IncidentModal
        isOpen={isReportModalOpen}
        onClose={() => {
          setIsReportModalOpen(false);
          setIsSelectingLocation(false);
        }}
        onSubmitReport={handleSubmitReport}
        isSelectingLocation={isSelectingLocation}
        setIsSelectingLocation={setIsSelectingLocation}
        pinLocation={pinLocation}
      />

      {/* Satellite Weather Backup Modal */}
      <WeatherBackup
        isOpen={isWeatherModalOpen}
        onClose={() => setIsWeatherModalOpen(false)}
      />

    </div>
  );
}

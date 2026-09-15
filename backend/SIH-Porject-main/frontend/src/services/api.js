import axios from 'axios';

const API_BASE_URL = '/api/v1';

export const fetchStations = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/stations`);
    return response.data;
  } catch (err) {
    console.warn('API unavailable, returning default monitoring stations:', err);
    return DEFAULT_STATIONS;
  }
};

export const fetchRiskMapGeoJSON = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/risk/map`);
    return response.data;
  } catch (err) {
    console.warn('API unavailable, returning default risk GeoJSON:', err);
    return DEFAULT_RISK_GEOJSON;
  }
};

export const fetchStationRisk = async (stationId) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/risk/station/${stationId}`);
    return response.data;
  } catch (err) {
    console.warn('API unavailable, using default risk details for station', stationId);
    return DEFAULT_STATION_RISKS[stationId] || DEFAULT_STATION_RISKS[1];
  }
};

export const fetchStationTelemetryHistory = async (stationId) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/telemetry/station/${stationId}`);
    return response.data;
  } catch (err) {
    return DEFAULT_TELEMETRY_HISTORY;
  }
};

export const fetchNearbyLandslides = async (lat, lon, radiusKm = 25.0) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/landslides/nearby`, {
      params: { lat, lon, radius_km: radiusKm }
    });
    return response.data;
  } catch (err) {
    return DEFAULT_LANDSLIDES;
  }
};

export const fetchIncidents = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/incidents`);
    return response.data;
  } catch (err) {
    return DEFAULT_INCIDENTS;
  }
};

export const submitIncidentReport = async (payload) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/incidents`, payload);
    return response.data;
  } catch (err) {
    console.warn('Mock submit incident report:', payload);
    return {
      id: Date.now(),
      ...payload,
      status: 'PENDING',
      created_at: new Date().toISOString()
    };
  }
};

export const fetchAlertLogs = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/alerts`);
    return response.data;
  } catch (err) {
    return DEFAULT_ALERTS;
  }
};

export const triggerManualAlert = async (payload) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/alerts/trigger`, payload);
    return response.data;
  } catch (err) {
    return {
      id: Date.now(),
      ...payload,
      sent_at: new Date().toISOString(),
      status: 'SENT'
    };
  }
};

export const fetchWeatherFallback = async (lat, lon) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/telemetry/weather-fallback`, {
      params: { lat, lon }
    });
    return response.data;
  } catch (err) {
    return {
      source: 'OPEN_METEO_SATELLITE',
      latitude: lat,
      longitude: lon,
      rainfall_24h_mm: 18.5,
      rainfall_3d_mm: 52.0,
      rainfall_7d_mm: 110.4,
      estimated_soil_moisture_percent: 74.2,
      is_fallback: true
    };
  }
};

// --- Default Data ---
const DEFAULT_STATIONS = [
  {
    id: 1,
    code: 'NER-STN-SHL-01',
    name: 'Shillong Peak Monitoring Station',
    state: 'Meghalaya',
    district: 'East Khasi Hills',
    elevation_m: 1525.0,
    slope_angle_deg: 38.5,
    latitude: 25.5686,
    longitude: 91.8833,
    is_active: true
  },
  {
    id: 2,
    code: 'NER-STN-CHB-02',
    name: 'Cherrapunji High-Rainfall Slope',
    state: 'Meghalaya',
    district: 'East Khasi Hills',
    elevation_m: 1430.0,
    slope_angle_deg: 42.0,
    latitude: 25.2750,
    longitude: 91.7333,
    is_active: true
  },
  {
    id: 3,
    code: 'NER-STN-GTK-03',
    name: 'Gangtok Ridge Monitoring Unit',
    state: 'Sikkim',
    district: 'Gangtok',
    elevation_m: 1650.0,
    slope_angle_deg: 45.0,
    latitude: 27.3389,
    longitude: 88.6065,
    is_active: true
  },
  {
    id: 4,
    code: 'NER-STN-AIZ-04',
    name: 'Aizawl Slope Saturation Unit',
    state: 'Mizoram',
    district: 'Aizawl',
    elevation_m: 1132.0,
    slope_angle_deg: 36.0,
    latitude: 23.7307,
    longitude: 92.7173,
    is_active: true
  },
  {
    id: 5,
    code: 'NER-STN-KOH-05',
    name: 'Kohima Bypass Sensor Node',
    state: 'Nagaland',
    district: 'Kohima',
    elevation_m: 1444.0,
    slope_angle_deg: 34.5,
    latitude: 25.6751,
    longitude: 94.1086,
    is_active: true
  }
];

const DEFAULT_RISK_GEOJSON = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [91.8833, 25.5686] },
      properties: {
        station_id: 1,
        station_code: 'NER-STN-SHL-01',
        station_name: 'Shillong Peak Monitoring Station',
        state: 'Meghalaya',
        risk_score: 86.5,
        risk_level: 'CRITICAL',
        soil_moisture_percent: 88.5,
        slope_tilt_deg: 5.2,
        rainfall_24h_mm: 120.0,
        antecedent_3d_mm: 165.0,
        trigger_reasons: [
          'Soil moisture is critical at 88.5%',
          'Heavy 3-day antecedent rainfall recorded: 165.0 mm',
          'Critical slope tilt displacement detected: 5.20°',
          'Station located in active hazard zone with 3 past landslides within 5km'
        ]
      }
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [91.7333, 25.2750] },
      properties: {
        station_id: 2,
        station_code: 'NER-STN-CHB-02',
        station_name: 'Cherrapunji High-Rainfall Slope',
        state: 'Meghalaya',
        risk_score: 92.0,
        risk_level: 'CRITICAL',
        soil_moisture_percent: 94.2,
        slope_tilt_deg: 6.1,
        rainfall_24h_mm: 210.0,
        antecedent_3d_mm: 310.0,
        trigger_reasons: [
          'Torrential precipitation 210mm in 24h',
          'Antecedent 3-day rainfall saturation > 300mm',
          'Slope tilt acceleration exceeding safety threshold'
        ]
      }
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [88.6065, 27.3389] },
      properties: {
        station_id: 3,
        station_code: 'NER-STN-GTK-03',
        station_name: 'Gangtok Ridge Monitoring Unit',
        state: 'Sikkim',
        risk_score: 68.0,
        risk_level: 'HIGH',
        soil_moisture_percent: 74.0,
        slope_tilt_deg: 2.8,
        rainfall_24h_mm: 55.0,
        antecedent_3d_mm: 95.0,
        trigger_reasons: [
          'Soil moisture elevated at 74.0%',
          'Moderate 3-day antecedent rainfall: 95.0 mm'
        ]
      }
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [92.7173, 23.7307] },
      properties: {
        station_id: 4,
        station_code: 'NER-STN-AIZ-04',
        station_name: 'Aizawl Slope Saturation Unit',
        state: 'Mizoram',
        risk_score: 42.0,
        risk_level: 'MEDIUM',
        soil_moisture_percent: 58.5,
        slope_tilt_deg: 0.8,
        rainfall_24h_mm: 22.0,
        antecedent_3d_mm: 40.0,
        trigger_reasons: ['Moderate antecedent rainfall in 3-day window']
      }
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [94.1086, 25.6751] },
      properties: {
        station_id: 5,
        station_code: 'NER-STN-KOH-05',
        station_name: 'Kohima Bypass Sensor Node',
        state: 'Nagaland',
        risk_score: 24.0,
        risk_level: 'LOW',
        soil_moisture_percent: 35.0,
        slope_tilt_deg: 0.1,
        rainfall_24h_mm: 5.0,
        antecedent_3d_mm: 12.0,
        trigger_reasons: []
      }
    }
  ]
};

const DEFAULT_STATION_RISKS = {
  1: {
    station_id: 1,
    station_code: 'NER-STN-SHL-01',
    station_name: 'Shillong Peak Monitoring Station',
    latitude: 25.5686,
    longitude: 91.8833,
    risk_score: 86.5,
    risk_level: 'CRITICAL',
    current_soil_moisture: 88.5,
    current_slope_tilt: 5.2,
    rainfall_24h_mm: 120.0,
    antecedent_rainfall_3d_mm: 165.0,
    antecedent_rainfall_7d_mm: 240.0,
    nearby_landslides_5km_count: 3,
    trigger_reasons: [
      'Soil moisture is critical at 88.5%',
      'Heavy 3-day antecedent rainfall recorded: 165.0 mm',
      'Critical slope tilt displacement detected: 5.20°',
      'Station located in active hazard zone with 3 past landslides within 5km'
    ],
    evaluated_at: new Date().toISOString()
  }
};

const DEFAULT_TELEMETRY_HISTORY = [
  { timestamp: '7d ago', soil_moisture_percent: 45.0, rainfall_24h_mm: 15.0, slope_tilt_deg: 0.2 },
  { timestamp: '6d ago', soil_moisture_percent: 49.0, rainfall_24h_mm: 20.0, slope_tilt_deg: 0.3 },
  { timestamp: '5d ago', soil_moisture_percent: 54.0, rainfall_24h_mm: 28.0, slope_tilt_deg: 0.5 },
  { timestamp: '4d ago', soil_moisture_percent: 62.0, rainfall_24h_mm: 45.0, slope_tilt_deg: 0.9 },
  { timestamp: '3d ago', soil_moisture_percent: 71.0, rainfall_24h_mm: 68.0, slope_tilt_deg: 1.8 },
  { timestamp: '2d ago', soil_moisture_percent: 82.0, rainfall_24h_mm: 95.0, slope_tilt_deg: 3.4 },
  { timestamp: '1d ago', soil_moisture_percent: 88.5, rainfall_24h_mm: 120.0, slope_tilt_deg: 5.2 }
];

const DEFAULT_LANDSLIDES = [
  {
    id: 101,
    title: 'Singtam NH-10 Highway Blockade',
    state: 'Sikkim',
    district: 'Pakyong',
    event_date: '2025-10-04T03:15:00Z',
    severity: 'CATASTROPHIC',
    trigger_type: 'HEAVY_RAIN',
    latitude: 27.1500,
    longitude: 88.4833,
    description: 'Major rockslide damaging road transport corridor and Teesta valley slope.'
  },
  {
    id: 102,
    title: 'Hunthar Veng Slope Failure',
    state: 'Mizoram',
    district: 'Aizawl',
    event_date: '2024-06-22T14:00:00Z',
    severity: 'MODERATE',
    trigger_type: 'HEAVY_RAIN',
    latitude: 23.7400,
    longitude: 92.7100,
    description: 'Antecedent monsoon saturation triggered mudslide near residential area.'
  }
];

const DEFAULT_INCIDENTS = [
  {
    id: 201,
    reporter_name: 'Tashi Norbu',
    phone: '+919876501234',
    description: 'Fresh tension cracks and slope soil slippage observed near NH-10 road bend.',
    media_url: 'https://storage.geoalert.in/reports/img_9912.jpg',
    severity: 'SEVERE',
    status: 'VERIFIED',
    latitude: 27.3300,
    longitude: 88.6100,
    created_at: new Date(Date.now() - 3600000 * 4).toISOString()
  }
];

const DEFAULT_ALERTS = [
  {
    id: 301,
    station_id: 1,
    risk_level: 'CRITICAL',
    risk_score: 86.5,
    channel: 'SMS',
    recipient: '+913642500000',
    message: 'GeoAlert-NER [CRITICAL RISK]: Station Shillong Peak recorded moisture 88.5%, tilt 5.2°. Evacuation advisory active.',
    sent_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    status: 'SENT'
  }
];

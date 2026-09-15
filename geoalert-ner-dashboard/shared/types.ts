/**
 * Unified type exports for GeoAlert-NER Dashboard
 */

export interface User {
  id?: string;
  name: string;
  email: string;
  password?: string;
  role: "Admin / Operator" | "Citizen" | "Disaster Management Authority" | "District Collector" | "Field Engineer";
  state?: string;
  district?: string;
  token?: string;
  latitude?: number;
  longitude?: number;
}

export interface DistrictRecord {
  id: string;
  name: string;
  state: string;
  station: string;
  coordinates: [number, number];
  risk: "Low" | "Moderate" | "High" | "Critical";
  riskIndex: number;
  rainfall: number;
  saturation: number;
  leadTime: string;
  action: string;
}

export interface TelemetryRecord {
  id: string;
  districtId: string;
  districtName: string;
  state: string;
  rainfall: number;
  saturation: number;
  displacement: number;
  riskIndex: number;
  timestamp: string;
}

export interface BroadcastLogRecord {
  id: string;
  refCode: string;
  district: string;
  state: string;
  channel: string;
  recipient: string;
  time: string;
  date: string;
  advisory: string;
  status: "Dispatched" | "Delivered" | "Verified";
  timestamp: number;
}

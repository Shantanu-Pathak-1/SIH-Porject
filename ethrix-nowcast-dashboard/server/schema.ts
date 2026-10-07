import { defaultDistricts, type District } from "../client/src/lib/districtsData";
import type { BroadcastLogRecord, TelemetryRecord, User } from "../shared/types";

// In-Memory & Database state initializer
export const initialUsers: User[] = [
  {
    id: "usr-01",
    name: "Shantanu Pathak",
    email: "shantanu.pathak@geoalert.gov.in",
    role: "Admin / Operator",
    state: "Assam",
    district: "Karbi Anglong (Diphu)",
  },
  {
    id: "usr-02",
    name: "District Collector Tawang",
    email: "collector.tawang@arunachal.gov.in",
    role: "District Collector",
    state: "Arunachal Pradesh",
    district: "Tawang",
  },
  {
    id: "usr-03",
    name: "Field Officer Sohra",
    email: "field.sohra@meghalaya.gov.in",
    role: "Field Engineer",
    state: "Meghalaya",
    district: "East Khasi Hills (Shillong)",
  },
];

export const initialBroadcastLogs: BroadcastLogRecord[] = [
  {
    id: "LOG-01",
    refCode: "GEO-TAW-42",
    district: "Tawang",
    state: "Arunachal Pradesh",
    channel: "Local Public Siren Array",
    recipient: "Tawang District Disaster Management Cell",
    time: "11:15 PM",
    date: "Today",
    advisory: "Stage local response teams near the north slope corridor. Slope displacement +1.8mm detected.",
    status: "Verified",
    timestamp: Date.now() - 3600000 * 2,
  },
  {
    id: "LOG-02",
    refCode: "GEO-EKH-18",
    district: "East Khasi Hills (Shillong)",
    state: "Meghalaya",
    channel: "WhatsApp Emergency Channel",
    recipient: "Sohra & Shillong Highway Patrol Units",
    time: "08:30 PM",
    date: "Today",
    advisory: "Issue immediate slope hazard alert for Sohra & Shillong bypass roads. Rainfall peak 128mm.",
    status: "Delivered",
    timestamp: Date.now() - 3600000 * 5,
  },
  {
    id: "LOG-03",
    refCode: "GEO-WSI-29",
    district: "West Siang",
    state: "Arunachal Pradesh",
    channel: "SMS Alert Array",
    recipient: "Along Sub-Divisional Officer & Relief Team",
    time: "02:45 PM",
    date: "Today",
    advisory: "High soil moisture saturation +86% observed. Pre-position emergency relief supplies.",
    status: "Dispatched",
    timestamp: Date.now() - 3600000 * 10,
  },
];

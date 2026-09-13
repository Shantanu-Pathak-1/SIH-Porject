export type RiskLevel = "Low" | "Moderate" | "High" | "Critical";

export type DistrictId =
  | "tawang"
  | "aizawl"
  | "west-siang"
  | "shillong"
  | "dima-hasao"
  | "diphu"
  | "gangtok"
  | "ukhrul"
  | "champhai"
  | "kohima";

export type District = {
  id: DistrictId;
  name: string;
  state: string;
  coordinates: [number, number];
  risk: RiskLevel;
  riskIndex: number;
  rainfall: number;
  saturation: number;
  leadTime: string;
  action: string;
  station: string;
  sensorCount: string;
};

export const defaultDistricts: District[] = [
  {
    id: "tawang",
    name: "Tawang",
    state: "Arunachal Pradesh",
    coordinates: [27.586, 91.86],
    risk: "High",
    riskIndex: 0.78,
    rainfall: 92,
    saturation: 68,
    leadTime: "12h",
    action: "Stage local response teams near the north slope corridor.",
    station: "TAW-07",
    sensorCount: "18 / 20",
  },
  {
    id: "shillong",
    name: "East Khasi Hills (Shillong)",
    state: "Meghalaya",
    coordinates: [25.576, 91.893],
    risk: "Critical",
    riskIndex: 0.89,
    rainfall: 142,
    saturation: 84,
    leadTime: "5h",
    action: "Issue immediate slope hazard alert for Sohra & Shillong bypass roads.",
    station: "EKH-01",
    sensorCount: "22 / 24",
  },
  {
    id: "west-siang",
    name: "West Siang",
    state: "Arunachal Pradesh",
    coordinates: [28.23, 94.73],
    risk: "Critical",
    riskIndex: 0.91,
    rainfall: 118,
    saturation: 81,
    leadTime: "7h",
    action: "Activate district evacuation readiness and field verification.",
    station: "WSI-03",
    sensorCount: "18 / 20",
  },
  {
    id: "dima-hasao",
    name: "Dima Hasao (Haflong)",
    state: "Assam",
    coordinates: [25.18, 93.02],
    risk: "High",
    riskIndex: 0.82,
    rainfall: 110,
    saturation: 75,
    leadTime: "9h",
    action: "Monitor hill railway track embankments and high-risk cuttings.",
    station: "DMH-05",
    sensorCount: "15 / 16",
  },
  {
    id: "aizawl",
    name: "Aizawl",
    state: "Mizoram",
    coordinates: [23.727, 92.717],
    risk: "Moderate",
    riskIndex: 0.56,
    rainfall: 65,
    saturation: 52,
    leadTime: "24h",
    action: "Keep municipal teams informed and monitor drainage points.",
    station: "AIZ-12",
    sensorCount: "16 / 18",
  },
  {
    id: "gangtok",
    name: "Gangtok",
    state: "Sikkim",
    coordinates: [27.33, 88.61],
    risk: "High",
    riskIndex: 0.76,
    rainfall: 98,
    saturation: 71,
    leadTime: "11h",
    action: "Check National Highway 10 alignment for debris flow indicators.",
    station: "GTK-02",
    sensorCount: "19 / 20",
  },
  {
    id: "ukhrul",
    name: "Ukhrul",
    state: "Manipur",
    coordinates: [25.11, 94.36],
    risk: "High",
    riskIndex: 0.84,
    rainfall: 104,
    saturation: 78,
    leadTime: "8h",
    action: "Alert district disaster management cells along Eastern hill corridors.",
    station: "UKH-04",
    sensorCount: "14 / 15",
  },
  {
    id: "kohima",
    name: "Kohima",
    state: "Nagaland",
    coordinates: [25.67, 94.11],
    risk: "Critical",
    riskIndex: 0.88,
    rainfall: 126,
    saturation: 83,
    leadTime: "6h",
    action: "Restrict heavy vehicle traffic on vulnerable NH-2 slope segments.",
    station: "KHM-06",
    sensorCount: "17 / 18",
  },
  {
    id: "diphu",
    name: "Karbi Anglong (Diphu)",
    state: "Assam",
    coordinates: [25.84, 93.43],
    risk: "Moderate",
    riskIndex: 0.48,
    rainfall: 54,
    saturation: 46,
    leadTime: "30h",
    action: "Maintain routine telemetry logging and hill ridge observation.",
    station: "KBA-09",
    sensorCount: "12 / 14",
  },
  {
    id: "champhai",
    name: "Champhai",
    state: "Mizoram",
    coordinates: [23.47, 93.32],
    risk: "Moderate",
    riskIndex: 0.52,
    rainfall: 58,
    saturation: 49,
    leadTime: "28h",
    action: "Monitor international border road cuttings for soil creep.",
    station: "CPM-08",
    sensorCount: "14 / 15",
  },
];

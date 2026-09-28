import { historicalSimulationSteps, type NowcastDistrict, type XaiFeatureAttribution, type BilingualAlert } from "./nowcastData";

export type RiskLevel = "Low" | "Moderate" | "High" | "Critical";

export type DistrictId =
  | "dharamshala"
  | "kullu"
  | "mandi"
  | "kedarnath"
  | "chamoli"
  | "shimla"
  | "shillong"
  | "gangtok"
  | "tawang"
  | "dima-hasao"
  | "aizawl"
  | "west-siang"
  | "diphu"
  | "ukhrul"
  | "champhai"
  | "kohima";

export type District = NowcastDistrict | {
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
  cape?: number;
  cin?: number;
  cloudTopTemp?: number;
  radarReflectivity?: number;
  rainfallRate?: number;
  threatCategory?: string;
  cloudburstProb?: number;
  flashFloodProb?: number;
  thunderstormProb?: number;
  gradCamIntensity?: number;
  primaryTrigger?: string;
  triggers?: string[];
  xaiAttributions?: XaiFeatureAttribution[];
  bilingualAlert?: BilingualAlert;
};

// Default districts primed from historical simulation T-1h / active watch state
export const defaultDistricts: District[] = historicalSimulationSteps[3].districts;

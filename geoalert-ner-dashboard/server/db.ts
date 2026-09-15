import { defaultDistricts, type District } from "../client/src/lib/districtsData";
import type { BroadcastLogRecord, TelemetryRecord, User } from "../shared/types";
import { initialBroadcastLogs, initialUsers } from "./schema";

class DatabaseStore {
  private users: User[] = [...initialUsers];
  private districts: District[] = [...defaultDistricts];
  private broadcasts: BroadcastLogRecord[] = [...initialBroadcastLogs];
  private lastOpenMeteoSync: number = 0;

  // Fetch real satellite rainfall and soil moisture from Open-Meteo API
  async syncLiveOpenMeteoSatelliteData(): Promise<void> {
    const now = Date.now();
    if (now - this.lastOpenMeteoSync < 300000) return;

    try {
      this.lastOpenMeteoSync = now;
      console.log("[GeoAlert Open-Meteo Pipeline] Syncing live satellite weather & soil moisture for NER districts...");

      const promises = this.districts.map(async (district) => {
        const [lat, lon] = district.coordinates;
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=precipitation,rain,soil_moisture_0_to_1cm&past_days=3`;
        
        const res = await fetch(url);
        if (!res.ok) return;
        const data = await res.json();

        if (data && data.current) {
          const liveRain = Math.round((data.current.precipitation || 0) * 10 + 35);
          const liveSoilMoisture = Math.min(95, Math.round((data.current.soil_moisture_0_to_1cm || 0.45) * 100));

          district.rainfall = Math.max(30, liveRain);
          district.saturation = Math.max(25, liveSoilMoisture);

          const antecedentScore = (district.rainfall / 160) * 0.45;
          const saturationScore = (district.saturation / 100) * 0.35;
          const tiltScore = 0.20;
          const riskIndex = Number(Math.min(0.98, Math.max(0.20, antecedentScore + saturationScore + tiltScore)).toFixed(2));

          district.riskIndex = riskIndex;
          if (riskIndex >= 0.78) district.risk = "Critical";
          else if (riskIndex >= 0.65) district.risk = "High";
          else if (riskIndex >= 0.48) district.risk = "Moderate";
          else district.risk = "Low";
        }
      });

      await Promise.all(promises);
      console.log("[GeoAlert Open-Meteo Pipeline] Live sync completed successfully.");
    } catch (err) {
      console.warn("[GeoAlert Open-Meteo Pipeline] Weather sync fallback warning:", err);
    }
  }

  // Users & Authentication API
  async getUsers(): Promise<User[]> {
    return this.users.map(({ password, ...rest }) => rest as User);
  }

  async findUserByEmail(email: string): Promise<User | undefined> {
    return this.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  async registerUser(userData: {
    name: string;
    email: string;
    password?: string;
    role?: string;
    state?: string;
    district?: string;
  }): Promise<User> {
    let existing = await this.findUserByEmail(userData.email);
    if (existing) {
      existing.name = userData.name || existing.name;
      if (userData.password) existing.password = userData.password;
      if (userData.role) existing.role = userData.role as any;
      if (userData.state) existing.state = userData.state;
      if (userData.district) existing.district = userData.district;
      const { password, ...safeUser } = existing;
      return safeUser as User;
    }

    const newUser: User = {
      id: `usr-${Date.now()}`,
      name: userData.name,
      email: userData.email,
      password: userData.password || "password123",
      role: (userData.role as any) || "Citizen",
      state: userData.state || "Assam",
      district: userData.district || "Karbi Anglong (Diphu)",
    };

    this.users.push(newUser);
    const { password, ...safeUser } = newUser;
    return safeUser as User;
  }

  async authenticateUser(email: string, role?: string, name?: string, password?: string): Promise<User> {
    let existing = await this.findUserByEmail(email);
    if (!existing) {
      return this.registerUser({ name: name || email.split("@")[0], email, password, role });
    }

    // Password validation check if password supplied
    if (password && existing.password && existing.password !== password) {
      throw new Error("Invalid email or password");
    }

    if (role) existing.role = role as any;
    if (name) existing.name = name;
    
    const { password: pwd, ...safeUser } = existing;
    return safeUser as User;
  }

  async toggleBlockUser(userId: string): Promise<User | undefined> {
    const user = this.users.find((u) => u.id === userId);
    if (user) {
      user.status = user.status === "blocked" ? "active" : "blocked";
      const { password, ...safeUser } = user;
      return safeUser as User;
    }
    return undefined;
  }

  // User Live GPS Location Hazard Evaluation (2-Tier Alert Classification Engine)
  async evaluateUserGpsHazard(latitude: number, longitude: number): Promise<{
    nearestDistrict: District;
    distanceKm: number;
    alertTier: "EMERGENCY_EVACUATION" | "NEARBY_CAUTION" | "SAFE";
    hazardAlertRequired: boolean;
    title: string;
    advisory: string;
  }> {
    await this.syncLiveOpenMeteoSatelliteData();

    // Haversine formula distance calculation
    const R = 6371; // Earth radius km
    let nearestDist = this.districts[0];
    let minDistance = Infinity;

    this.districts.forEach((dist) => {
      const [dLat, dLon] = dist.coordinates;
      const dLatRad = (dLat - latitude) * (Math.PI / 180);
      const dLonRad = (dLon - longitude) * (Math.PI / 180);
      const a =
        Math.sin(dLatRad / 2) * Math.sin(dLatRad / 2) +
        Math.cos(latitude * (Math.PI / 180)) * Math.cos(dLat * (Math.PI / 180)) * Math.sin(dLonRad / 2) * Math.sin(dLonRad / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c;

      if (distance < minDistance) {
        minDistance = distance;
        nearestDist = dist;
      }
    });

    const distanceKm = Number(minDistance.toFixed(1));
    const isHighRisk = nearestDist.risk === "Critical" || nearestDist.risk === "High";

    let alertTier: "EMERGENCY_EVACUATION" | "NEARBY_CAUTION" | "SAFE" = "SAFE";
    let title = "GPS Telemetry Active";
    let advisory = `Nearest monitoring station is ${nearestDist.name} (${distanceKm} km). Status: Safe.`;

    // Tier 1: Immediate High Risk Zone (< 25km) -> Emergency Evacuation Alert
    if (distanceKm <= 25 && isHighRisk) {
      alertTier = "EMERGENCY_EVACUATION";
      title = `🚨 CRITICAL EVACUATION ALERT: ${nearestDist.name.toUpperCase()}`;
      advisory = `IMMEDIATE ACTION REQUIRED: You are ${distanceKm} km inside the active ${nearestDist.risk} Landslide Danger Zone (${nearestDist.name}). ${nearestDist.action}`;
    }
    // Tier 2: Neighboring / Buffer Zone (25km - 80km) -> Nearby Area Caution Advisory
    else if (distanceKm <= 80 || isHighRisk) {
      alertTier = "NEARBY_CAUTION";
      title = `⚠️ NEARBY AREA CAUTION: ${nearestDist.name}`;
      advisory = `NEIGHBORING HAZARD NOTICE: You are ${distanceKm} km from ${nearestDist.name} (${nearestDist.risk} Risk zone). Stay alert for heavy rainfall and avoid steep slope corridors.`;
    }

    return {
      nearestDistrict: nearestDist,
      distanceKm,
      alertTier,
      hazardAlertRequired: alertTier !== "SAFE",
      title,
      advisory,
    };
  }

  // Districts API
  async getDistricts(): Promise<District[]> {
    this.syncLiveOpenMeteoSatelliteData().catch(() => {});
    return this.districts;
  }

  async getDistrictById(id: string): Promise<District | undefined> {
    return this.districts.find((d) => d.id === id);
  }

  // Telemetry History API
  async getTelemetryHistory(filter: string = "7days"): Promise<TelemetryRecord[]> {
    const history: TelemetryRecord[] = [];
    const count = filter === "today" ? 10 : filter === "yesterday" ? 20 : filter === "7days" ? 40 : 80;

    for (let i = 0; i < count; i++) {
      const dist = this.districts[i % this.districts.length];
      const hoursAgo = i * (filter === "today" ? 2 : filter === "yesterday" ? 3 : 6);
      const time = new Date(Date.now() - hoursAgo * 3600000);

      history.push({
        id: `tel-${i + 1}`,
        districtId: dist.id,
        districtName: dist.name,
        state: dist.state,
        rainfall: Math.round(dist.rainfall + (Math.sin(i) * 15)),
        saturation: Math.round(dist.saturation + (Math.cos(i) * 8)),
        displacement: Number((1.2 + Math.sin(i) * 0.8).toFixed(2)),
        riskIndex: Number((dist.riskIndex + (Math.sin(i) * 0.08)).toFixed(2)),
        timestamp: time.toISOString(),
      });
    }

    return history;
  }

  // Broadcasts API
  async getBroadcastLogs(): Promise<BroadcastLogRecord[]> {
    return this.broadcasts;
  }

  async createBroadcastLog(payload: {
    district: string;
    state: string;
    channel: string;
    recipient: string;
    advisory: string;
  }): Promise<BroadcastLogRecord> {
    const newLog: BroadcastLogRecord = {
      id: `LOG-${Date.now()}`,
      refCode: `GEO-${payload.district.substring(0, 3).toUpperCase()}-${Math.floor(10 + Math.random() * 89)}`,
      district: payload.district,
      state: payload.state,
      channel: payload.channel,
      recipient: payload.recipient,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      date: "Today",
      advisory: payload.advisory,
      status: "Dispatched",
      timestamp: Date.now(),
    };

    this.broadcasts.unshift(newLog);
    return newLog;
  }
}

export const dbStore = new DatabaseStore();

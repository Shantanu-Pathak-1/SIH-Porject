import type { BroadcastLogRecord, DistrictRecord, TelemetryRecord, User } from "../../../shared/types";

const API_BASE = "/api";

export async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
      ...options,
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `API error (${res.status}): ${res.statusText}`);
    }

    return await res.json();
  } catch (err: any) {
    console.warn(`[GeoAlert API Client] Endpoint ${endpoint} fallback:`, err?.message || err);
    return null;
  }
}

export const api = {
  // Auth
  register: async (payload: {
    name: string;
    email: string;
    password?: string;
    role?: string;
    state?: string;
    district?: string;
  }): Promise<User | null> => {
    const data = await fetchApi<{ user: User }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return data?.user || null;
  },

  login: async (email: string, password?: string, role?: string, name?: string): Promise<User | null> => {
    const data = await fetchApi<{ user: User }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password, role, name }),
    });
    return data?.user || null;
  },

  getMe: async (email?: string): Promise<User | null> => {
    const data = await fetchApi<{ user: User }>(`/auth/me${email ? `?email=${encodeURIComponent(email)}` : ""}`);
    return data?.user || null;
  },

  // GPS Location Evaluation
  evaluateLocation: async (latitude: number, longitude: number): Promise<{
    nearestDistrict: DistrictRecord;
    distanceKm: number;
    hazardAlertRequired: boolean;
    advisory: string;
  } | null> => {
    return fetchApi("/location/evaluate", {
      method: "POST",
      body: JSON.stringify({ latitude, longitude }),
    });
  },

  // Districts
  getDistricts: async (): Promise<DistrictRecord[] | null> => {
    const data = await fetchApi<{ districts: DistrictRecord[] }>("/districts");
    return data?.districts || null;
  },

  // Telemetry History
  getTelemetryHistory: async (filter: string = "7days"): Promise<TelemetryRecord[] | null> => {
    const data = await fetchApi<{ history: TelemetryRecord[] }>(`/telemetry/history?filter=${filter}`);
    return data?.history || null;
  },

  // Emergency Broadcasts
  getBroadcastLogs: async (): Promise<BroadcastLogRecord[] | null> => {
    const data = await fetchApi<{ logs: BroadcastLogRecord[] }>("/broadcasts");
    return data?.logs || null;
  },

  dispatchBroadcast: async (payload: {
    district: string;
    state?: string;
    channel: string;
    recipient?: string;
    advisory?: string;
  }): Promise<BroadcastLogRecord | null> => {
    const data = await fetchApi<{ log: BroadcastLogRecord }>("/broadcasts/dispatch", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return data?.log || null;
  },
};

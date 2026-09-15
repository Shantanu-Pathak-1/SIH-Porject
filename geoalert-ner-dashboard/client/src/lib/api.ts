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

    if (res.status === 404 && endpoint.startsWith("/auth/me")) {
      return null;
    }

    if (!res.ok) {
      let serverErrorMsg = "";
      try {
        const textData = await res.text();
        try {
          const parsed = JSON.parse(textData);
          serverErrorMsg = parsed.error || parsed.message;
        } catch {
          serverErrorMsg = textData;
        }
      } catch {
        // Ignore read error
      }

      throw new Error(serverErrorMsg || `Request failed with status code ${res.status}`);
    }

    return await res.json();
  } catch (err: any) {
    if (err?.message === "Failed to fetch") {
      throw new Error("Unable to connect to server. Please check your network connection.");
    }
    throw err;
  }
}

// Local In-Memory Auth Fallback Store (for client-side or standalone dev execution)
const localAuthUsers: User[] = [
  {
    id: "usr-01",
    name: "Shantanu Pathak",
    email: "shantanu.pathak@geoalert.gov.in",
    password: "password123",
    role: "Admin / Operator",
    state: "Assam",
    district: "Karbi Anglong (Diphu)",
    status: "active",
  },
  {
    id: "usr-02",
    name: "District Collector Tawang",
    email: "collector.tawang@arunachal.gov.in",
    password: "password123",
    role: "District Collector",
    state: "Arunachal Pradesh",
    district: "Tawang",
    status: "active",
  },
  {
    id: "usr-03",
    name: "Field Officer Sohra",
    email: "field.sohra@meghalaya.gov.in",
    password: "password123",
    role: "Field Engineer",
    state: "Meghalaya",
    district: "East Khasi Hills (Shillong)",
    status: "active",
  },
];

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
    try {
      const data = await fetchApi<{ user: User }>("/auth/register", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      if (data?.user) return data.user;
    } catch (err: any) {
      if (!err?.message?.includes("404") && !err?.message?.includes("status code 404")) {
        throw err;
      }
    }

    let existing = localAuthUsers.find((u) => u.email.toLowerCase() === payload.email.toLowerCase());
    if (existing) {
      throw new Error(`An account already exists with ${payload.email} (Registered as ${existing.role || "User"}). Please sign in instead.`);
    }

    const newUser: User = {
      id: `usr-${Date.now()}`,
      name: payload.name,
      email: payload.email,
      password: payload.password || "password123",
      role: (payload.role as any) || "Citizen",
      state: payload.state || "Assam",
      district: payload.district || "Karbi Anglong (Diphu)",
      status: "active",
    };

    localAuthUsers.push(newUser);
    const { password, ...safeUser } = newUser;
    return safeUser as User;
  },

  login: async (email: string, password?: string, role?: string, name?: string): Promise<User | null> => {
    try {
      const data = await fetchApi<{ user: User }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password, role, name }),
      });
      if (data?.user) return data.user;
    } catch (err: any) {
      if (!err?.message?.includes("404") && !err?.message?.includes("status code 404")) {
        throw err;
      }
    }

    let existing = localAuthUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!existing) {
      throw new Error(`Account not found for ${email}. Please check your email or click 'Create account' to register.`);
    }

    if (existing.status === "blocked") {
      throw new Error(`Account (${email}) is suspended by system administrator.`);
    }

    if (password && existing.password && existing.password !== password) {
      throw new Error("Incorrect password. Please try again.");
    }

    if (role) existing.role = role as any;
    if (name) existing.name = name;

    const { password: pwd, ...safeUser } = existing;
    return safeUser as User;
  },

  getMe: async (email?: string): Promise<User | null> => {
    if (!email) return null;
    try {
      const data = await fetchApi<{ user: User }>(`/auth/me?email=${encodeURIComponent(email)}`);
      if (data?.user) return data.user;
    } catch (err) {
      // Ignore
    }

    const localUser = localAuthUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (localUser) {
      const { password, ...safeUser } = localUser;
      return safeUser as User;
    }
    return null;
  },

  updateProfile: async (payload: {
    email: string;
    name?: string;
    state?: string;
    district?: string;
  }): Promise<User | null> => {
    const data = await fetchApi<{ user: User }>("/auth/profile", {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    return data?.user || null;
  },

  deleteAccount: async (email: string): Promise<boolean> => {
    const data = await fetchApi<{ success: boolean }>("/auth/profile", {
      method: "DELETE",
      body: JSON.stringify({ email }),
    });
    return data?.success || false;
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

  // Admin / Operator Control API
  admin: {
    getUsers: async (): Promise<User[] | null> => {
      const data = await fetchApi<{ users: User[] }>("/admin/users");
      return data?.users || null;
    },

    toggleBlockUser: async (userId: string): Promise<User | null> => {
      const data = await fetchApi<{ user: User }>(`/admin/users/${userId}/block`, {
        method: "POST",
      });
      return data?.user || null;
    },

    sendTargetedAlert: async (payload: {
      state?: string;
      district: string;
      alertTier?: string;
      title?: string;
      advisory?: string;
    }): Promise<{ success: boolean; message: string; log: BroadcastLogRecord } | null> => {
      return fetchApi("/admin/targeted-alert", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
  },
};


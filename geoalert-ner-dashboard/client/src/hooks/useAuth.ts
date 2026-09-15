import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export interface User {
  id?: string | number;
  name?: string;
  email?: string;
  role?: string;
  state?: string;
  district?: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(() => {
    const session = typeof window !== "undefined" ? localStorage.getItem("geoalert-session") : null;
    if (!session) {
      return null;
    }
    const storedUser = localStorage.getItem("geoalert-user") || "District Operator";
    const storedRole = localStorage.getItem("geoalert-role") || "Disaster Management Authority";
    const storedEmail = localStorage.getItem("geoalert-email") || `${storedUser.toLowerCase().replace(/\s+/g, ".")}@gmail.com`;
    const storedState = localStorage.getItem("geoalert-state") || "";
    const storedDistrict = localStorage.getItem("geoalert-district") || "";

    return {
      name: storedUser,
      role: storedRole,
      email: storedEmail,
      state: storedState,
      district: storedDistrict,
    };
  });

  // Sync with Backend API session if available
  useEffect(() => {
    if (user?.email) {
      api.getMe(user.email).then((remoteUser) => {
        if (remoteUser && remoteUser.role !== user.role) {
          setUser((curr) => (curr ? { ...curr, role: remoteUser.role, name: remoteUser.name } : curr));
        }
      });
    }
  }, []);

  const loginWithBackend = async (email: string, password?: string, role?: string, name?: string) => {
    const backendUser = await api.login(email, password, role, name);
    if (backendUser) {
      localStorage.setItem("geoalert-session", "active");
      localStorage.setItem("geoalert-user", backendUser.name || email.split("@")[0]);
      localStorage.setItem("geoalert-role", backendUser.role || role || "Citizen");
      localStorage.setItem("geoalert-email", backendUser.email || email);
      if (backendUser.state) localStorage.setItem("geoalert-state", backendUser.state);
      if (backendUser.district) localStorage.setItem("geoalert-district", backendUser.district);
      setUser(backendUser);
    }
    return backendUser;
  };

  const registerWithBackend = async (payload: {
    name: string;
    email: string;
    password?: string;
    role?: string;
    state?: string;
    district?: string;
  }) => {
    const backendUser = await api.register(payload);
    if (backendUser) {
      localStorage.setItem("geoalert-session", "active");
      localStorage.setItem("geoalert-user", backendUser.name || payload.name);
      localStorage.setItem("geoalert-role", backendUser.role || payload.role || "Citizen");
      localStorage.setItem("geoalert-email", backendUser.email || payload.email);
      if (payload.state) localStorage.setItem("geoalert-state", payload.state);
      if (payload.district) localStorage.setItem("geoalert-district", payload.district);
      setUser(backendUser);
    }
    return backendUser;
  };

  const updateProfile = async (updates: { name?: string; state?: string; district?: string }) => {
    if (!user?.email) return null;
    const updatedUser = await api.updateProfile({ email: user.email, ...updates });
    if (updatedUser) {
      if (updatedUser.name) localStorage.setItem("geoalert-user", updatedUser.name);
      if (updatedUser.state) localStorage.setItem("geoalert-state", updatedUser.state);
      if (updatedUser.district) localStorage.setItem("geoalert-district", updatedUser.district);
      setUser((curr) => (curr ? { ...curr, ...updatedUser } : curr));
    }
    return updatedUser;
  };

  const deleteAccount = async () => {
    if (!user?.email) return false;
    const success = await api.deleteAccount(user.email);
    if (success) {
      logout();
    }
    return success;
  };

  const logout = () => {
    localStorage.removeItem("geoalert-session");
    localStorage.removeItem("geoalert-user");
    localStorage.removeItem("geoalert-role");
    localStorage.removeItem("geoalert-email");
    localStorage.removeItem("geoalert-state");
    localStorage.removeItem("geoalert-district");
    setUser(null);
    window.location.href = "/login";
  };

  return {
    user,
    isAuthenticated: !!user,
    loading: false,
    loginWithBackend,
    registerWithBackend,
    updateProfile,
    deleteAccount,
    logout,
  };
}

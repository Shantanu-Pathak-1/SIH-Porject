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

  const loginWithBackend = async (email: string, role: string, name?: string) => {
    const backendUser = await api.login(email, role, name);
    if (backendUser) {
      localStorage.setItem("geoalert-session", "active");
      localStorage.setItem("geoalert-user", backendUser.name);
      localStorage.setItem("geoalert-role", backendUser.role);
      localStorage.setItem("geoalert-email", backendUser.email);
      setUser(backendUser);
    }
    return backendUser;
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
    logout,
  };
}

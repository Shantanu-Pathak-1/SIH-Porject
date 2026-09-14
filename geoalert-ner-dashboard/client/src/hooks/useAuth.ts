import { useState } from "react";

export interface User {
  id?: string | number;
  name?: string;
  email?: string;
  role?: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(() => {
    const session = typeof window !== "undefined" ? localStorage.getItem("geoalert-session") : null;
    if (!session) {
      return null;
    }
    const storedUser = localStorage.getItem("geoalert-user") || "District Operator";
    const storedRole = localStorage.getItem("geoalert-role") || "Disaster Management Authority";

    return {
      name: storedUser,
      role: storedRole,
      email: `${storedUser.toLowerCase().replace(/\s+/g, ".")}@geoalert.gov.in`,
    };
  });

  const logout = () => {
    localStorage.removeItem("geoalert-session");
    localStorage.removeItem("geoalert-user");
    localStorage.removeItem("geoalert-role");
    setUser(null);
    window.location.href = "/login";
  };

  return {
    user,
    isAuthenticated: !!user,
    loading: false,
    logout,
  };
}

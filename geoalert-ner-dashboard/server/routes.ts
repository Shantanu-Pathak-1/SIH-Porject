import { Router } from "express";
import { dbStore } from "./db";

export const apiRouter = Router();

// GET /api/health
apiRouter.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "GeoAlert-NER Backend API", timestamp: new Date().toISOString() });
});

// Auth Routes: Register & Login with Password validation
apiRouter.post("/auth/register", async (req, res) => {
  try {
    const { name, email, password, role, state, district } = req.body || {};
    if (!email || !name) {
      return res.status(400).json({ error: "Name and Email are required for account registration." });
    }

    const user = await dbStore.registerUser({ name, email, password, role, state, district });
    res.json({ success: true, user });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Registration failed" });
  }
});

apiRouter.post("/auth/login", async (req, res) => {
  try {
    const { email, password, role, name } = req.body || {};
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const user = await dbStore.authenticateUser(email, role, name, password);
    res.json({ success: true, user });
  } catch (error: any) {
    res.status(401).json({ error: error.message || "Authentication failed" });
  }
});

apiRouter.get("/auth/me", async (req, res) => {
  try {
    const email = req.query.email as string;

    if (email) {
      const user = await dbStore.findUserByEmail(email);
      if (user) {
        const { password, ...safeUser } = user as any;
        return res.json({ user: safeUser });
      }
    }

    const users = await dbStore.getUsers();
    res.json({ user: users[0] });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// User GPS Geolocation Hazard Evaluation Route
apiRouter.post("/location/evaluate", async (req, res) => {
  try {
    const { latitude, longitude } = req.body || {};
    if (typeof latitude !== "number" || typeof longitude !== "number") {
      return res.status(400).json({ error: "Latitude and Longitude numbers are required." });
    }

    const result = await dbStore.evaluateUserGpsHazard(latitude, longitude);
    res.json({ success: true, ...result });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Districts Routes
apiRouter.get("/districts", async (_req, res) => {
  try {
    const districts = await dbStore.getDistricts();
    res.json({ districts });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

apiRouter.get("/districts/:id", async (req, res) => {
  try {
    const district = await dbStore.getDistrictById(req.params.id);
    if (!district) {
      return res.status(404).json({ error: "District not found" });
    }
    res.json({ district });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Telemetry & History Routes
apiRouter.get("/telemetry/history", async (req, res) => {
  try {
    const filter = (req.query.filter as string) || "7days";
    const history = await dbStore.getTelemetryHistory(filter);
    res.json({ filter, history });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Emergency Broadcast Routes
apiRouter.get("/broadcasts", async (_req, res) => {
  try {
    const logs = await dbStore.getBroadcastLogs();
    res.json({ logs });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

apiRouter.post("/broadcasts/dispatch", async (req, res) => {
  try {
    const { district, state, channel, recipient, advisory } = req.body || {};
    if (!district || !channel) {
      return res.status(400).json({ error: "District and Channel are required for dispatch" });
    }

    const log = await dbStore.createBroadcastLog({
      district,
      state: state || "North East Region",
      channel,
      recipient: recipient || `${district} Response Force`,
      advisory: advisory || `Emergency slope hazard alert dispatched to ${district}.`,
    });

    res.json({ success: true, log });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

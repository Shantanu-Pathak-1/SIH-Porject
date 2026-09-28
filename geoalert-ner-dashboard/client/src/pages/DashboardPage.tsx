import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, BellRing, BrainCircuit, Check, ChevronRight, CloudLightning, CloudRain, Crosshair, Database, Flame, Gauge, Layers, Loader2, MapPin, Radio, Satellite, Sparkles, Waves, X } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import GeoRiskMap from "@/components/GeoRiskMap";
import TrendCharts from "@/components/TrendCharts";
import SensorNodeAnalytics from "@/components/SensorNodeAnalytics";
import NowcastTimeSlider from "@/components/NowcastTimeSlider";
import XaiRiskPanel from "@/components/XaiRiskPanel";
import LlmAlertModal from "@/components/LlmAlertModal";
import { BroadcastHistory, type BroadcastHistoryItem } from "@/components/OpsPanels";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";
import { toast } from "sonner";
import { historicalSimulationSteps, type NowcastDistrict, type NowcastTimeStep } from "@/lib/nowcastData";
import type { District, DistrictId, RiskLevel } from "@/lib/districtsData";
import { api } from "@/lib/api";

const channels = ["Cell Broadcast (CAP-1.2)", "WhatsApp Gov Alert Gateway", "Local Public Siren Array", "SMS Emergency Dispatch"];

function AnimatedNumber({ value, decimals = 0 }: { value: number; decimals?: number }) {
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    setDisplay(value);
  }, [value]);

  return <span className="tabular-nums">{display.toFixed(decimals)}</span>;
}

function RiskPill({ risk }: { risk: RiskLevel }) {
  return (
    <span className={cn("risk-pill", `risk-pill-${risk.toLowerCase()}`)}>
      <span className="risk-dot" />
      {risk}
    </span>
  );
}

function MetricTile({
  icon: Icon,
  label,
  value,
  unit,
  tone = "default",
  sublabel,
}: {
  icon: any;
  label: string;
  value: number | string;
  unit: string;
  tone?: string;
  sublabel?: string;
}) {
  return (
    <div className={cn("metric-tile", tone)}>
      <div className="metric-icon">
        <Icon size={17} strokeWidth={1.5} />
      </div>
      <div>
        <p className="eyebrow">{label}</p>
        <p className="metric-value">
          {typeof value === "number" ? <AnimatedNumber value={value} /> : <span>{value}</span>}{" "}
          <span className="text-xs font-normal text-zinc-400">{unit}</span>
        </p>
        {sublabel && <p className="text-[10px] font-mono text-zinc-400 mt-0.5">{sublabel}</p>}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { theme } = useTheme();
  const [sessionRole] = useState(
    () =>
      typeof window !== "undefined"
        ? localStorage.getItem("geoalert-role") || "Command Operator"
        : "Command Operator"
  );

  // Time Slider Step (0 to 5) - Defaulting to Step 3 (T-1h: Critical Cooling Alert)
  const [currentStepIndex, setCurrentStepIndex] = useState(3);
  const currentTimeStep: NowcastTimeStep = historicalSimulationSteps[currentStepIndex];

  // Active district list is driven by the time slider!
  const districts: NowcastDistrict[] = currentTimeStep.districts;
  const [selectedId, setSelectedId] = useState<DistrictId>("dharamshala");
  const [lastUpdated, setLastUpdated] = useState(() => new Date());
  const [broadcastHistory, setBroadcastHistory] = useState<BroadcastHistoryItem[]>([
    {
      id: "bc-init-01",
      district: "Dharamshala (Bhagsu)",
      districtId: "dharamshala" as any,
      channel: "Cell Broadcast (CAP-1.2)",
      recipient: "Kangra Disaster Management Unit",
      time: "17:05 IST",
      status: "Dispatched",
    },
  ]);

  // Modals state
  const [xaiOpen, setXaiOpen] = useState(false);
  const [llmAlertOpen, setLlmAlertOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [broadcastDistrict, setBroadcastDistrict] = useState<DistrictId>("dharamshala");
  const [broadcastChannel, setBroadcastChannel] = useState(channels[0]);
  const [dispatchState, setDispatchState] = useState<"idle" | "sending" | "sent">("idle");

  const districtsById = useMemo(
    () => Object.fromEntries(districts.map((d) => [d.id, d])) as Record<DistrictId, NowcastDistrict>,
    [districts]
  );

  const selected: NowcastDistrict = districtsById[selectedId] || districts[0];
  const broadcastTarget = districtsById[broadcastDistrict] || districts[0];

  const networkSensors = useMemo(() => {
    return districts.reduce(
      (sum, d) => {
        const [online, total] = (d.sensorCount || "18/20").split("/").map((v) => Number.parseInt(v.trim(), 10));
        return { online: sum.online + (isNaN(online) ? 18 : online), total: sum.total + (isNaN(total) ? 20 : total) };
      },
      { online: 0, total: 0 }
    );
  }, [districts]);

  const openBroadcast = () => {
    setBroadcastDistrict(selectedId);
    setDispatchState("idle");
    setModalOpen(true);
  };

  const dispatchAlert = () => {
    if (dispatchState !== "idle") return;
    setDispatchState("sending");

    setTimeout(() => {
      setBroadcastHistory((current) => [
        {
          id: `eth-${broadcastTarget.id}-${Date.now()}`,
          district: broadcastTarget.name,
          districtId: broadcastTarget.id as any,
          channel: broadcastChannel,
          recipient: `${broadcastTarget.name} Authorities & Citizens`,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          status: "Dispatched",
        },
        ...current,
      ]);
      setDispatchState("sent");
      toast.success(`Emergency alert dispatched to ${broadcastTarget.name}`, {
        description: `${broadcastChannel} channel · 45,000 citizens notified`,
      });
      setTimeout(() => setModalOpen(false), 2000);
    }, 1000);
  };

  return (
    <DashboardLayout>
      <div className="w-full max-w-full min-w-0 space-y-5 overflow-x-hidden">
        {/* Top Command Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono uppercase tracking-wider mb-1">
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                ETHRIX-NOWCAST / OPERATIONAL SYSTEM
              </span>
              <span className="text-zinc-400">· 5-Tier Early Warning Architecture</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-foreground tracking-tight flex items-center gap-2">
              <span>Hyper-Local Weather & Cloudburst Command Console</span>
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Earthformer Spatiotemporal Backbone (2–6h Lead Time Nowcast) · INSAT-3D TIR1 + NCMRWF IMDAA + CartoDEM 30m
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={() => setXaiOpen(true)}
              variant="outline"
              size="sm"
              className="gap-1.5 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10 cursor-pointer"
            >
              <BrainCircuit size={15} /> Tier-3 Grad-CAM (XAI)
            </Button>
            <Button
              onClick={() => setLlmAlertOpen(true)}
              size="sm"
              className="gap-1.5 bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-mono text-xs cursor-pointer shadow-lg shadow-red-950/50"
            >
              <Sparkles size={15} /> Dispatch AI Alert (Tier 4 LLM)
            </Button>
            <Button onClick={openBroadcast} size="sm" variant="secondary" className="gap-1.5 cursor-pointer">
              <BellRing size={15} /> Emergency Siren
            </Button>
          </div>
        </div>

        {/* Interactive Nowcast Time Slider (The "Wow" Factor) */}
        <NowcastTimeSlider
          currentStepIndex={currentStepIndex}
          onStepChange={(newIndex) => {
            setCurrentStepIndex(newIndex);
            setLastUpdated(new Date());
          }}
        />

        {/* Main Console Layout */}
        <section className="monitor-section !mt-0" id="monitor">
          <div className="console-layout">
            {/* Sidebar Watchlist */}
            <aside className="console-sidebar">
              <div className="sidebar-label">
                <span>ACTIVE CATCHMENT ZONES</span>
                <span>{districts.length.toString().padStart(2, "0")} WATCHED</span>
              </div>
              <div className="district-list max-h-[380px] sm:max-h-[520px] overflow-y-auto">
                {districts.map((district) => (
                  <button
                    key={district.id}
                    className={cn("district-row cursor-pointer", selectedId === district.id && "district-row-active")}
                    onClick={() => setSelectedId(district.id)}
                  >
                    <span className={cn("district-marker", `marker-${district.risk.toLowerCase()}`)} />
                    <span className="district-row-copy">
                      <strong className="flex items-center gap-1.5">
                        {district.name}
                        {district.cloudburstProb >= 80 && (
                          <Flame size={12} className="text-red-400 animate-pulse shrink-0" />
                        )}
                      </strong>
                      <small>
                        {district.state.split(" ")[0]} · {district.threatCategory}
                      </small>
                    </span>
                    <span className="district-row-index font-mono">
                      {district.cloudburstProb}%
                    </span>
                    <ChevronRight size={14} />
                  </button>
                ))}
              </div>
              <div className="sidebar-insight">
                <div className="insight-icon">
                  <Crosshair size={16} />
                </div>
                <div>
                  <p className="eyebrow">AI MODEL FOCUS</p>
                  <strong>{selected.name} Catchment</strong>
                  <p className="line-clamp-2">{selected.primaryTrigger}</p>
                </div>
              </div>
            </aside>

            {/* GIS Map Card */}
            <section className="map-card">
              <div className="map-card-header">
                <div>
                  <p className="eyebrow">TIER-3 GRAD-CAM SALIENCY HEATMAP OVERLAY</p>
                  <h3>
                    {selected.name}
                    <span> / {selected.state}</span>
                  </h3>
                </div>
                <div className="map-controls flex items-center gap-2">
                  <span className="map-control-label">
                    <span className="live-dot" /> LIVE SIMULATION
                  </span>
                  <button
                    onClick={() => setXaiOpen(true)}
                    className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30 transition-colors cursor-pointer"
                  >
                    View XAI Weights
                  </button>
                </div>
              </div>

              <GeoRiskMap
                districts={districts}
                selectedId={selectedId}
                onSelectDistrict={setSelectedId}
                gradCamZones={currentTimeStep.activeGradCamZones}
                onOpenXai={() => setXaiOpen(true)}
              />

              <div className="map-footer">
                <span>
                  <MapPin size={13} /> {selected.coordinates[0].toFixed(3)}° N&nbsp;&nbsp;
                  {selected.coordinates[1].toFixed(3)}° E
                </span>
                <span>
                  <Satellite size={13} /> INSAT-3D TIR1: {selected.cloudTopTemp}°C
                </span>
                <span>
                  <Radio size={13} /> Doppler Radar: {selected.radarReflectivity} dBZ
                </span>
              </div>
            </section>
          </div>

          {/* Atmospheric Telemetry Detail Grid */}
          <div className="detail-grid">
            <div className="detail-primary">
              <div className="detail-topline">
                <p className="eyebrow">ACTIVE EVENT MONITOR / {selected.station}</p>
                <RiskPill risk={selected.risk} />
              </div>
              <div className="detail-title-row">
                <div>
                  <h3 className="flex items-center gap-2">
                    <span>{selected.name}</span>
                    <em className="text-zinc-400 text-sm font-sans font-normal">
                      · {selected.catchment}
                    </em>
                  </h3>
                  <p className="text-xs text-zinc-300 mt-1">{selected.action}</p>
                </div>
                <div className="risk-index">
                  <span>NOWCAST PROB</span>
                  <strong>
                    <AnimatedNumber value={selected.cloudburstProb} decimals={0} />%
                  </strong>
                  <small>/ 100%</small>
                </div>
              </div>

              {/* Atmospheric Metrics Replacement Tiles */}
              <div className="metric-grid grid grid-cols-2 md:grid-cols-4 gap-3">
                <MetricTile
                  icon={Satellite}
                  label="Cloud Top Temp (CTT)"
                  value={selected.cloudTopTemp}
                  unit="°C"
                  tone="lead-tone"
                  sublabel="INSAT-3D TIR1 (Rapid Cooling)"
                />
                <MetricTile
                  icon={CloudLightning}
                  label="Surface CAPE"
                  value={selected.cape}
                  unit="J/kg"
                  tone="rain-tone"
                  sublabel={`CIN: ${selected.cin} J/kg (Barrier Broken)`}
                />
                <MetricTile
                  icon={Radio}
                  label="Doppler Radar"
                  value={selected.radarReflectivity}
                  unit="dBZ"
                  tone="soil-tone"
                  sublabel="IMD Severe Hail/Precip Core"
                />
                <MetricTile
                  icon={CloudRain}
                  label="Instant Rainfall Rate"
                  value={selected.rainfallRate}
                  unit="mm/h"
                  tone="rain-tone"
                  sublabel={`3h Accum: ${selected.accumulatedRainfall || selected.rainfall} mm`}
                />
              </div>
            </div>

            {/* Model Recommendation Panel */}
            <div className="detail-action space-y-3">
              <div className="action-topline">
                <Sparkles size={15} />
                <span>TIER-4 GENAI RECOMMENDATION</span>
              </div>
              <h4 className="text-base font-serif font-bold text-white">
                {selected.risk === "Critical"
                  ? "Issue Immediate Cloudburst Evacuation."
                  : selected.risk === "High"
                  ? "Pre-position Emergency Response Teams."
                  : "Maintain Multi-Radar Telemetry Vigil."}
              </h4>
              <p className="text-xs text-zinc-300 leading-relaxed font-sans">
                {selected.primaryTrigger}
              </p>
              <div className="pt-2 border-t border-white/10 flex flex-col gap-2">
                <button
                  onClick={() => setLlmAlertOpen(true)}
                  className="flex items-center justify-between px-3 py-2 rounded-lg bg-red-600/30 hover:bg-red-600/40 text-red-200 border border-red-500/40 text-xs font-mono font-semibold transition-all cursor-pointer"
                >
                  <span>Generate Bilingual SMS Alert</span>
                  <ArrowUpRight size={14} />
                </button>
                <button
                  onClick={() => setXaiOpen(true)}
                  className="flex items-center justify-between px-3 py-2 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-mono transition-all cursor-pointer"
                >
                  <span>Inspect Grad-CAM Layer Weights</span>
                  <ArrowUpRight size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* Trend Charts & Analytics */}
          <TrendCharts district={selected as any} theme={theme} />
          <SensorNodeAnalytics
            district={selected as any}
            lastUpdated={lastUpdated}
            networkOnline={networkSensors.online}
            networkTotal={networkSensors.total}
          />
          <div className="ops-grid !grid-cols-1">
            <BroadcastHistory history={broadcastHistory} onOpenBroadcast={openBroadcast} />
          </div>
        </section>
      </div>

      {/* Tier-3 XAI Risk Panel Drawer */}
      <XaiRiskPanel
        district={selected}
        isOpen={xaiOpen}
        onClose={() => setXaiOpen(false)}
        onOpenLlmAlert={() => {
          setXaiOpen(false);
          setLlmAlertOpen(true);
        }}
      />

      {/* Tier-4 GenAI Bilingual Alert Modal */}
      <LlmAlertModal
        district={selected}
        isOpen={llmAlertOpen}
        onClose={() => setLlmAlertOpen(false)}
        onDispatched={() => {
          setBroadcastHistory((prev) => [
            {
              id: `llm-alert-${Date.now()}`,
              district: selected.name,
              districtId: selected.id as any,
              channel: "Cell Broadcast & WhatsApp (Bilingual SMS)",
              recipient: `${selected.name} Citizens & SDRF`,
              time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              status: "Dispatched",
            },
            ...prev,
          ]);
        }}
      />

      {/* Emergency Broadcast Simulation Modal */}
      {modalOpen && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setModalOpen(false);
          }}
        >
          <div className="broadcast-modal" role="dialog" aria-modal="true" aria-labelledby="broadcast-title">
            <button
              className="modal-close icon-button"
              onClick={() => setModalOpen(false)}
              aria-label="Close emergency broadcast dialog"
            >
              <X size={17} />
            </button>
            {dispatchState === "sent" ? (
              <div className="dispatch-success">
                <span className="success-mark">
                  <Check size={25} />
                </span>
                <p className="eyebrow">DISPATCH CONFIRMED</p>
                <h3>
                  Signal sent to
                  <br />
                  <em>{broadcastTarget.name} authorities.</em>
                </h3>
                <p>The response brief is queued for {broadcastChannel}. Siren array triggered.</p>
                <span className="dispatch-id">
                  ETH-{broadcastTarget.station}-{new Date().getMinutes().toString().padStart(2, "0")}
                </span>
              </div>
            ) : (
              <>
                <p className="eyebrow accent-eyebrow">
                  <span className="eyebrow-line" /> EMERGENCY BROADCAST CONSOLE
                </p>
                <h3 id="broadcast-title">
                  Dispatch Siren &amp;
                  <br />
                  <em>Evacuation Brief.</em>
                </h3>
                <p className="modal-intro">
                  Trigger automated early warning sirens and district emergency response SOPs across the target valley.
                </p>
                <label className="field-label" htmlFor="broadcast-district">
                  TARGET CATCHMENT ZONE
                </label>
                <select
                  id="broadcast-district"
                  value={broadcastDistrict}
                  onChange={(event) => setBroadcastDistrict(event.target.value as DistrictId)}
                >
                  {districts.map((district) => (
                    <option key={district.id} value={district.id}>
                      {district.name} · {district.risk} risk ({district.cloudburstProb}%)
                    </option>
                  ))}
                </select>
                <label className="field-label" htmlFor="broadcast-channel">
                  ALERT CHANNEL
                </label>
                <select
                  id="broadcast-channel"
                  value={broadcastChannel}
                  onChange={(event) => setBroadcastChannel(event.target.value)}
                >
                  {channels.map((channel) => (
                    <option key={channel}>{channel}</option>
                  ))}
                </select>
                <div className="broadcast-preview">
                  <span className="preview-icon">
                    <Radio size={15} />
                  </span>
                  <div>
                    <span className="eyebrow">BILINGUAL PREVIEW</span>
                    <p className="line-clamp-2">
                      <strong>{broadcastTarget.name}:</strong> {broadcastTarget.bilingualAlert?.hindi || broadcastTarget.action}
                    </p>
                  </div>
                </div>
                <button
                  className="dispatch-button cursor-pointer"
                  onClick={dispatchAlert}
                  disabled={dispatchState !== "idle"}
                >
                  {dispatchState === "sending" ? (
                    <>
                      <Loader2 size={15} className="dispatch-spinner" /> Dispatching Siren…
                    </>
                  ) : (
                    <>
                      Confirm &amp; dispatch alert <ArrowUpRight size={15} />
                    </>
                  )}
                </button>
                <button className="cancel-button cursor-pointer" onClick={() => setModalOpen(false)}>
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

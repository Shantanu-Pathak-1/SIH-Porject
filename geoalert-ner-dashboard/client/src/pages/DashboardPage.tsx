import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, BellRing, Check, ChevronRight, CloudRain, Crosshair, Database, Gauge, Loader2, MapPin, Radio, Satellite, Sparkles, Waves, X } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import GeoRiskMap from "@/components/GeoRiskMap";
import TrendCharts from "@/components/TrendCharts";
import SensorNodeAnalytics from "@/components/SensorNodeAnalytics";
import { BroadcastHistory, type BroadcastHistoryItem } from "@/components/OpsPanels";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { clampTelemetry } from "@/lib/geoalert";
import { useTheme } from "@/contexts/ThemeContext";
import { toast } from "sonner";
import { defaultDistricts, type District, type DistrictId, type RiskLevel } from "@/lib/districtsData";

const channels = ["SMS", "WhatsApp", "Local Siren"];

function AnimatedNumber({ value, decimals = 0 }: { value: number; decimals?: number }) {
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    setDisplay(value);
  }, [value]);

  return <span className="tabular-nums">{display.toFixed(decimals)}</span>;
}

function RiskPill({ risk }: { risk: RiskLevel }) {
  return <span className={cn("risk-pill", `risk-pill-${risk.toLowerCase()}`)}><span className="risk-dot" />{risk}</span>;
}

function MetricTile({ icon: Icon, label, value, unit, tone = "default" }: { icon: typeof CloudRain; label: string; value: number; unit: string; tone?: string }) {
  return (
    <div className={cn("metric-tile", tone)}>
      <div className="metric-icon"><Icon size={17} strokeWidth={1.5} /></div>
      <div>
        <p className="eyebrow">{label}</p>
        <p className="metric-value"><AnimatedNumber value={value} /> <span>{unit}</span></p>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { theme } = useTheme();
  const [sessionRole] = useState(() => typeof window !== "undefined" ? localStorage.getItem("geoalert-role") || "Disaster Management Authority" : "Disaster Management Authority");
  
  const roleBriefs: Record<string, string> = {
    "Admin / Operator": "Regional command surface · coordinate response & dispatch broadcast sirens",
    "Citizen": "Citizen early warning mode · monitor local rainfall, slope hazard & public advisories",
    "Disaster Management Authority": "Regional overview · coordinate multi-district response",
    "District Collector": "District command · approve local action and public warning",
    "Field Engineer": "Field verification · validate sensor and slope conditions",
  };
  
  const roleBrief = roleBriefs[sessionRole] || "Protected user · monitor terrain and regional alerts";
  const canDispatch = sessionRole !== "Citizen" && sessionRole !== "Field Engineer";

  const [districts, setDistricts] = useState<District[]>(defaultDistricts);
  const [selectedId, setSelectedId] = useState<DistrictId>("tawang");
  const [lastUpdated, setLastUpdated] = useState(() => new Date());
  const [broadcastHistory, setBroadcastHistory] = useState<BroadcastHistoryItem[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [broadcastDistrict, setBroadcastDistrict] = useState<DistrictId>("tawang");
  const [broadcastChannel, setBroadcastChannel] = useState(channels[0]);
  const [dispatchState, setDispatchState] = useState<"idle" | "sending" | "sent">("idle");

  const districtsById = useMemo(() => Object.fromEntries(districts.map((d) => [d.id, d])) as Record<DistrictId, District>, [districts]);
  const networkSensors = useMemo(() => districts.reduce((sum, d) => {
    const [online, total] = d.sensorCount.split("/").map((v) => Number.parseInt(v.trim(), 10));
    return { online: sum.online + online, total: sum.total + total };
  }, { online: 0, total: 0 }), [districts]);

  const selected = districtsById[selectedId] || districts[0];
  const broadcastTarget = districtsById[broadcastDistrict] || districts[0];

  useEffect(() => {
    const interval = window.setInterval(() => {
      setDistricts((current) => current.map((d) => ({
        ...d,
        rainfall: Math.round(clampTelemetry(d.rainfall + (Math.random() - 0.42) * 9, 30, 150)),
        saturation: Math.round(clampTelemetry(d.saturation + (Math.random() - 0.48) * 4, 22, 95)),
      })));
      setLastUpdated(new Date());
    }, 3000);
    return () => window.clearInterval(interval);
  }, []);

  const openBroadcast = () => {
    if (!canDispatch) {
      toast.info("Broadcast dispatch requires authority approval", { description: "Field Engineer access is read-only for public alert actions." });
      return;
    }
    setBroadcastDistrict(selectedId);
    setDispatchState("idle");
    setModalOpen(true);
  };

  const dispatchAlert = () => {
    if (dispatchState !== "idle") return;
    setDispatchState("sending");
    window.setTimeout(() => {
      setBroadcastHistory((current) => [{ id: `${broadcastTarget.id}-${Date.now()}`, district: broadcastTarget.name, districtId: broadcastTarget.id, channel: broadcastChannel, recipient: `${broadcastTarget.name} authorities`, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), status: "Dispatched" }, ...current]);
      setDispatchState("sent");
      toast.success(`Alert dispatched to ${broadcastTarget.name}`, { description: `${broadcastChannel} channel · authorities notified` });
      window.setTimeout(() => setModalOpen(false), 2200);
    }, 1100);
  };

  return (
    <DashboardLayout>
      <div className="w-full max-w-full min-w-0 space-y-6 overflow-x-hidden">
        {/* Top Console Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-emerald-500 uppercase tracking-wider mb-1">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              GEOALERT-NER / COMMAND & RESPONSE CONSOLE
            </div>
            <h1 className="text-2xl font-serif font-bold text-foreground">
              District Command Surface
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {roleBrief} · Updated {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={openBroadcast} size="sm" className="gap-2">
              <BellRing size={15} /> Emergency Broadcast
            </Button>
          </div>
        </div>

        {/* Main Response Console Layout */}
        <section className="monitor-section !mt-0" id="monitor">
          <div className="console-layout">
            <aside className="console-sidebar">
              <div className="sidebar-label">
                <span>WATCHLIST</span>
                <span>{districts.length.toString().padStart(2, "0")} DISTRICTS</span>
              </div>
              <div className="district-list max-h-[520px] overflow-y-auto">
                {districts.map((district) => (
                  <button key={district.id} className={cn("district-row", selectedId === district.id && "district-row-active")} onClick={() => setSelectedId(district.id)}>
                    <span className={cn("district-marker", `marker-${district.risk.toLowerCase()}`)} />
                    <span className="district-row-copy"><strong>{district.name}</strong><small>{district.state}</small></span>
                    <span className="district-row-index">{district.riskIndex.toFixed(2)}</span>
                    <ChevronRight size={14} />
                  </button>
                ))}
              </div>
              <div className="sidebar-insight">
                <div className="insight-icon"><Crosshair size={16} /></div>
                <div>
                  <p className="eyebrow">CURRENT FOCUS</p>
                  <strong>{selected.name} signal cluster</strong>
                  <p>{selected.action}</p>
                </div>
              </div>
            </aside>

            <section className="map-card">
              <div className="map-card-header">
                <div>
                  <p className="eyebrow">NORTH-EASTERN REGION · LIVE MODEL</p>
                  <h3>{selected.name}<span> / {selected.state}</span></h3>
                </div>
                <div className="map-controls">
                  <span className="map-control-label"><span className="live-dot" /> AUTO-REFRESH</span>
                </div>
              </div>
              <GeoRiskMap districts={districts} selectedId={selectedId} onSelectDistrict={setSelectedId} />
              <div className="map-footer">
                <span><MapPin size={13} /> {selected.coordinates[0].toFixed(3)}° N&nbsp;&nbsp;{selected.coordinates[1].toFixed(3)}° E</span>
                <span><Satellite size={13} /> Satellite context connected</span>
                <span><Database size={13} /> {selected.sensorCount} sensors live</span>
              </div>
            </section>
          </div>

          <div className="detail-grid">
            <div className="detail-primary">
              <div className="detail-topline">
                <p className="eyebrow">SELECTED DISTRICT / {selected.station}</p>
                <RiskPill risk={selected.risk} />
              </div>
              <div className="detail-title-row">
                <div>
                  <h3>{selected.name} <em>field signal</em></h3>
                  <p>{selected.action}</p>
                </div>
                <div className="risk-index">
                  <span>RISK INDEX</span>
                  <strong><AnimatedNumber value={selected.riskIndex} decimals={2} /></strong>
                  <small>/ 1.00</small>
                </div>
              </div>
              <div className="metric-grid">
                <MetricTile icon={CloudRain} label="3–7 day rainfall" value={selected.rainfall} unit="mm" tone="rain-tone" />
                <MetricTile icon={Waves} label="Soil saturation" value={selected.saturation} unit="%" tone="soil-tone" />
                <MetricTile icon={Gauge} label="Estimated lead time" value={Number.parseInt(selected.leadTime, 10)} unit="hours" tone="lead-tone" />
              </div>
            </div>

            <div className="detail-action">
              <div className="action-topline"><Sparkles size={15} /><span>MODEL RECOMMENDATION</span></div>
              <h4>{selected.risk === "Critical" ? "Move from watch to action." : selected.risk === "High" ? "Prepare to respond." : "Keep the district informed."}</h4>
              <p>{selected.action} Confirm a field reading before dispatching public-facing alerts.</p>
              <button onClick={openBroadcast}>Review broadcast brief <ArrowUpRight size={14} /></button>
            </div>
          </div>

          <TrendCharts district={selected} theme={theme} />
          <SensorNodeAnalytics district={selected} lastUpdated={lastUpdated} networkOnline={networkSensors.online} networkTotal={networkSensors.total} />
          <div className="ops-grid !grid-cols-1">
            <BroadcastHistory history={broadcastHistory} onOpenBroadcast={openBroadcast} />
          </div>
        </section>
      </div>

      {modalOpen && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setModalOpen(false); }}>
          <div className="broadcast-modal" role="dialog" aria-modal="true" aria-labelledby="broadcast-title">
            <button className="modal-close icon-button" onClick={() => setModalOpen(false)} aria-label="Close emergency broadcast dialog"><X size={17} /></button>
            {dispatchState === "sent" ? (
              <div className="dispatch-success">
                <span className="success-mark"><Check size={25} /></span>
                <p className="eyebrow">DISPATCH CONFIRMED</p>
                <h3>Signal sent to<br /><em>{broadcastTarget.name} authorities.</em></h3>
                <p>The response brief is queued for {broadcastChannel}. Keep the field channel open for confirmation.</p>
                <span className="dispatch-id">GEO-{broadcastTarget.station}-{new Date().getMinutes().toString().padStart(2, "0")}</span>
              </div>
            ) : (
              <>
                <p className="eyebrow accent-eyebrow"><span className="eyebrow-line" /> EMERGENCY BROADCAST</p>
                <h3 id="broadcast-title">Dispatch a clear<br /><em>next step.</em></h3>
                <p className="modal-intro">Send a prepared response brief to district authorities. This simulation does not contact external services.</p>
                <label className="field-label" htmlFor="broadcast-district">TARGET DISTRICT</label>
                <select id="broadcast-district" value={broadcastDistrict} onChange={(event) => setBroadcastDistrict(event.target.value as DistrictId)}>
                  {districts.map((district) => (
                    <option key={district.id} value={district.id}>{district.name} · {district.risk} risk</option>
                  ))}
                </select>
                <label className="field-label" htmlFor="broadcast-channel">ALERT CHANNEL</label>
                <select id="broadcast-channel" value={broadcastChannel} onChange={(event) => setBroadcastChannel(event.target.value)}>
                  {channels.map((channel) => (
                    <option key={channel}>{channel}</option>
                  ))}
                </select>
                <div className="broadcast-preview">
                  <span className="preview-icon"><Radio size={15} /></span>
                  <div>
                    <span className="eyebrow">MESSAGE PREVIEW</span>
                    <p><strong>{broadcastTarget.name}</strong> is at <strong>{broadcastTarget.risk.toLowerCase()} risk</strong>. {broadcastTarget.action}</p>
                  </div>
                </div>
                <button className="dispatch-button" onClick={dispatchAlert} disabled={dispatchState !== "idle"}>
                  {dispatchState === "sending" ? <><Loader2 size={15} className="dispatch-spinner" /> Dispatching alert…</> : <>Confirm & dispatch alert <ArrowUpRight size={15} /></>}
                </button>
                <button className="cancel-button" onClick={() => setModalOpen(false)}>Cancel</button>
              </>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

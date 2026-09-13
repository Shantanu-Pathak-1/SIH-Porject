// GeoAlert-NER style: sensor telemetry is shown as a readable field mesh, with enough detail to explain the 58-node network without overwhelming the response view.
import { useState } from "react";
import { Activity, CloudRain, Download, Gauge, Radio, Search, SlidersHorizontal, Waves } from "lucide-react";
import type { District } from "@/lib/districtsData";

type NodeStatus = "LIVE" | "WATCH" | "BUFFERED";
type SensorNode = { id: string; label: string; icon: typeof CloudRain; metric: string; detail: string; battery: string; status: NodeStatus; tone: "live" | "watch" | "buffered"; updated: string };

export default function SensorNodeAnalytics({ district, lastUpdated, networkOnline, networkTotal }: { district: District; lastUpdated: Date; networkOnline: number; networkTotal: number }) {
  const [online, total] = district.sensorCount.split("/").map((value) => Number.parseInt(value.trim(), 10));
  const offline = Math.max(0, total - online);
  const prefix = district.station;
  const hourlyRain = Math.max(3, Math.round(district.rainfall / 8));
  const heartbeat = lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | NodeStatus>("ALL");
  const nodes: SensorNode[] = [
    { id: `${prefix}-RAIN`, label: "Rain gauge", icon: CloudRain, metric: `${hourlyRain} mm/h`, detail: "Accumulation stream", battery: "91%", status: "LIVE", tone: "live", updated: heartbeat },
    { id: `${prefix}-SOIL`, label: "Soil moisture", icon: Waves, metric: `${district.saturation}%`, detail: "Saturation probe", battery: "86%", status: "LIVE", tone: "live", updated: heartbeat },
    { id: `${prefix}-SLOPE`, label: "Slope movement", icon: Activity, metric: `${(district.riskIndex * 0.46).toFixed(2)} mm`, detail: "Tilt anomaly index", battery: district.risk === "Critical" ? "64%" : "78%", status: district.risk === "Critical" ? "WATCH" : "LIVE", tone: district.risk === "Critical" ? "watch" : "live", updated: heartbeat },
    { id: `${prefix}-EDGE`, label: "Edge gateway", icon: Radio, metric: "98%", detail: "Signal strength", battery: "73%", status: offline > 0 ? "BUFFERED" : "LIVE", tone: offline > 0 ? "buffered" : "live", updated: heartbeat },
  ];
  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredNodes = nodes.filter((node) => node.id.toLowerCase().includes(normalizedSearch) && (statusFilter === "ALL" || node.status === statusFilter));

  const exportTelemetryCsv = () => {
    const rows = filteredNodes.map(({ id, label, metric, battery, status, updated }) => [id, label, metric, battery, status, updated]);
    const csv = [["node_id", "sensor_type", "reading", "battery_level", "status", "last_updated"], ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `geoalert-${district.id}-telemetry.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="sensor-panel" aria-labelledby="sensor-panel-title">
      <div className="ops-panel-head sensor-panel-head">
        <div>
          <p className="eyebrow">TELEMETRY MESH / FIELD NODES</p>
          <h3 id="sensor-panel-title">Sensor status &amp; analytics</h3>
        </div>
        <div className="sensor-head-meta"><span className="sensor-count"><strong>{online}</strong> / {total} live · {networkOnline} / {networkTotal} network</span><span className="sensor-updated"><span className="live-dot" /> Updated {heartbeat}</span><button className="sensor-export" onClick={exportTelemetryCsv}><Download size={13} /> Export CSV</button></div>
      </div>
      <div className="sensor-summary"><span><Gauge size={14} /> {district.name} node cluster</span><span className="sensor-summary-live">{online} online</span><span className="sensor-summary-offline">{offline} buffered / offline</span></div>
      <div className="sensor-filters" aria-label="Filter sensor telemetry">
        <label className="sensor-search"><Search size={14} /><span className="sr-only">Search node ID</span><input type="search" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search node ID" /></label>
        <label className="sensor-status-filter"><SlidersHorizontal size={13} /><span>Status</span><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as "ALL" | NodeStatus)} aria-label="Filter nodes by status"><option value="ALL">All states</option><option value="LIVE">Live</option><option value="WATCH">Watch</option><option value="BUFFERED">Buffered</option></select></label>
        <span className="sensor-result-count">{filteredNodes.length} of {nodes.length} shown</span>
      </div>
      <div className="sensor-table" role="table" aria-label={`${district.name} sensor node status`}>
        <div className="sensor-table-row sensor-table-head" role="row"><span>NODE</span><span>TYPE</span><span>READING</span><span>BATTERY</span><span>STATE</span><span>LAST UPDATE</span></div>
        {filteredNodes.length > 0 ? filteredNodes.map(({ id, label, icon: Icon, metric, detail, battery, status, tone, updated }) => <div className="sensor-table-row" role="row" key={id}><span className="sensor-node-id"><Icon size={14} /><strong>{id}</strong></span><span className="sensor-type">{label}<small>{detail}</small></span><strong className="sensor-reading">{metric}</strong><strong className="sensor-battery">{battery}</strong><span className={`sensor-state sensor-state-${tone}`}><span />{status}</span><time className="sensor-last-update">{updated}</time></div>) : <div className="sensor-empty-row">No nodes match this search or status filter.</div>}
      </div>
      <div className="sensor-panel-footer"><span>Showing {filteredNodes.length} representative nodes from the {total}-node district mesh · network {networkOnline}/{networkTotal} live</span><span>Next heartbeat in &lt; 03 sec</span></div>
    </section>
  );
}

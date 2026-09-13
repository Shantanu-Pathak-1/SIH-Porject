// GeoAlert-NER style: operational evidence is presented like a field log—monospaced, timestamped, and visually subordinate to the action it supports.
import { useEffect, useState } from "react";
import { CheckCircle2, ChevronRight, CloudOff, RadioTower, TerminalSquare } from "lucide-react";
import type { DistrictId } from "@/pages/Home";

export type BroadcastHistoryItem = { id: string; district: string; districtId: DistrictId; channel: string; recipient: string; time: string; status: "Dispatched" | "Queued" };

const fallbackLogs = [
  "[ESP32_Tawang] Network Lost -> Caching data locally to SD Card...",
  "[EDGE_BUFFER] 04 telemetry packets secured · awaiting uplink",
  "[ESP32_Tawang] Soil saturation snapshot saved · 68%",
  "[MQTT_RELAY] Retry window in 00:18 · radio link standby",
  "[EDGE_BUFFER] Local inference active · XGBoost v2.4",
];

export function BroadcastHistory({ history, onOpenBroadcast }: { history: BroadcastHistoryItem[]; onOpenBroadcast: () => void }) {
  return <section className="ops-history-panel"><div className="ops-panel-head"><div><p className="eyebrow">ALERT DISPATCH / AUDIT LOG</p><h3>Broadcast history</h3></div><button className="ops-link" onClick={onOpenBroadcast}>Trigger emergency broadcast <ChevronRight size={14} /></button></div>{history.length === 0 ? <div className="empty-history"><RadioTower size={18} /><span>No alerts dispatched in this session.<small>Use the emergency broadcast control to create an auditable response event.</small></span></div> : <div className="history-list">{history.map((item) => <div className="history-row" key={item.id}><span className="history-status"><CheckCircle2 size={14} /></span><div><strong>{item.district}</strong><small>{item.recipient} · {item.channel}</small></div><time>{item.time}</time><span className="history-badge">{item.status}</span></div>)}</div>}</section>;
}

export function OfflineTerminal() {
  const [visibleLogs, setVisibleLogs] = useState(fallbackLogs.slice(0, 3));
  const [networkState, setNetworkState] = useState<"OFFLINE" | "SYNCING">("OFFLINE");

  useEffect(() => {
    let index = 3;
    const timer = window.setInterval(() => {
      setNetworkState("SYNCING");
      setVisibleLogs((current) => [...current.slice(-3), fallbackLogs[index % fallbackLogs.length]]);
      index += 1;
      window.setTimeout(() => setNetworkState("OFFLINE"), 700);
    }, 3600);
    return () => window.clearInterval(timer);
  }, []);

  return <section className="offline-terminal-panel"><div className="ops-panel-head terminal-head"><div><p className="eyebrow">EDGE COMPUTING / FIELD NODE</p><h3><TerminalSquare size={17} /> Offline fallback terminal</h3></div><span className="terminal-state"><span className="terminal-dot" /> {networkState}</span></div><div className="terminal-window"><div className="terminal-window-bar"><span><i /><i /><i /></span><small>ESP32_TAWANG / LOCAL BUFFER</small><span className="terminal-lock"><CloudOff size={12} /> SD CARD MIRROR</span></div><div className="terminal-log">{visibleLogs.map((log, index) => <p key={`${log}-${index}`} className={index === visibleLogs.length - 1 ? "terminal-log-current" : ""}><span className="terminal-time">{`10:${String(42 + index).padStart(2, "0")}:1${index}`}</span><span>{log}</span></p>)}</div><div className="terminal-footer"><span>BUFFER <strong>04 / 128</strong></span><span>LAST SYNC <strong>12m ago</strong></span><span>EDGE INFERENCE <strong>ACTIVE</strong></span></div></div></section>;
}

import { useEffect, useState } from "react";
import { ArrowUpRight, BellRing, Check, CheckCircle2, ChevronRight, Loader2, Radio, RadioTower, ShieldAlert, X } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { defaultDistricts, type District, type DistrictId } from "@/lib/districtsData";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { api } from "@/lib/api";

const channels = ["SMS Alert Array", "WhatsApp Emergency Channel", "Local Public Siren Array"];

export type BroadcastLog = {
  id: string;
  refCode: string;
  district: string;
  state: string;
  channel: string;
  recipient: string;
  time: string;
  date: string;
  advisory: string;
  status: "Dispatched" | "Delivered" | "Verified";
};

const initialBroadcastLogs: BroadcastLog[] = [
  {
    id: "LOG-01",
    refCode: "GEO-TAW-42",
    district: "Tawang",
    state: "Arunachal Pradesh",
    channel: "Local Public Siren Array",
    recipient: "Tawang District Disaster Management Cell",
    time: "11:15 PM",
    date: "Today",
    advisory: "Stage local response teams near the north slope corridor. Slope displacement +1.8mm detected.",
    status: "Verified",
  },
  {
    id: "LOG-02",
    refCode: "GEO-EKH-18",
    district: "East Khasi Hills (Shillong)",
    state: "Meghalaya",
    channel: "WhatsApp Emergency Channel",
    recipient: "Sohra & Shillong Highway Patrol Units",
    time: "08:30 PM",
    date: "Today",
    advisory: "Issue immediate slope hazard alert for Sohra & Shillong bypass roads. Rainfall peak 128mm.",
    status: "Delivered",
  },
  {
    id: "LOG-03",
    refCode: "GEO-WSI-91",
    district: "West Siang",
    state: "Arunachal Pradesh",
    channel: "SMS Alert Array",
    recipient: "West Siang Civil Defense Cell",
    time: "03:45 PM",
    date: "Yesterday",
    advisory: "Prepare evacuation protocol for lower valley settlements. Soil saturation 86%.",
    status: "Dispatched",
  },
  {
    id: "LOG-04",
    refCode: "GEO-DHA-12",
    district: "Dima Hasao (Haflong)",
    state: "Assam",
    channel: "SMS Alert Array",
    recipient: "Haflong Hill Section Rail & Highway Guard",
    time: "09:20 AM",
    date: "Yesterday",
    advisory: "Alert district disaster management cells along Eastern hill corridors.",
    status: "Verified",
  },
  {
    id: "LOG-05",
    refCode: "GEO-AIZ-05",
    district: "Aizawl",
    state: "Mizoram",
    channel: "WhatsApp Emergency Channel",
    recipient: "Aizawl Slope Security Force",
    time: "05:10 PM",
    date: "13 Sep 2026",
    advisory: "Routine watch advisory issued. Soil saturation monitored at 56%.",
    status: "Delivered",
  },
];

export default function BroadcastsPage() {
  const [districts] = useState<District[]>(defaultDistricts);
  const [broadcastLogs, setBroadcastLogs] = useState<BroadcastLog[]>(initialBroadcastLogs);
  const [modalOpen, setModalOpen] = useState(false);
  const [targetDistrictId, setTargetDistrictId] = useState<DistrictId>("tawang");
  const [selectedChannel, setSelectedChannel] = useState(channels[0]);
  const [dispatchState, setDispatchState] = useState<"idle" | "sending" | "sent">("idle");

  const targetDistrict = districts.find((d) => d.id === targetDistrictId) || districts[0];

  const handleOpenModal = () => {
    setDispatchState("idle");
    setModalOpen(true);
  };

  const handleDispatch = () => {
    if (dispatchState !== "idle") return;
    setDispatchState("sending");

    api.dispatchBroadcast({
      district: targetDistrict.name,
      state: targetDistrict.state,
      channel: selectedChannel,
      recipient: `${targetDistrict.name} Disaster Response Unit`,
      advisory: targetDistrict.action,
    }).then((resLog) => {
      const newLog: BroadcastLog = resLog || {
        id: `LOG-${Date.now()}`,
        refCode: `GEO-${targetDistrict.station}-${Math.floor(10 + Math.random() * 89)}`,
        district: targetDistrict.name,
        state: targetDistrict.state,
        channel: selectedChannel,
        recipient: `${targetDistrict.name} Disaster Response Unit`,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        date: "Just now",
        advisory: targetDistrict.action,
        status: "Dispatched",
      };

      setBroadcastLogs((prev) => [newLog, ...prev]);
      setDispatchState("sent");
      toast.success(`Emergency Alert Dispatched to ${targetDistrict.name}!`, {
        description: `Channel: ${selectedChannel} · Reference: ${newLog.refCode}`,
      });

      setTimeout(() => {
        setModalOpen(false);
      }, 1800);
    });
  };

  return (
    <DashboardLayout>
      <div className="w-full max-w-full min-w-0 space-y-6 overflow-x-hidden">
        {/* Yellow-Themed Prominent Header Box */}
        <div className="bg-amber-500/10 border border-amber-500/40 rounded-2xl p-6 relative overflow-hidden shadow-xl">
          <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-amber-500/10 to-transparent pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono text-[11px] font-bold tracking-wider uppercase">
                <span className="h-2 w-2 rounded-full bg-amber-400 animate-ping" />
                EMERGENCY BROADCAST CONTROL CENTER
              </div>
              <h1 className="text-2xl md:text-3xl font-serif font-bold text-amber-100">
                Live Alert Dispatch & Broadcast Logs
              </h1>
              <p className="text-xs text-amber-200/80 max-w-2xl leading-relaxed">
                Send multi-channel sirens, SMS alerts & WhatsApp emergency briefs to district disaster response authorities across Northeast India.
              </p>
            </div>

            <button
              onClick={handleOpenModal}
              className="h-11 px-5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-mono text-xs uppercase tracking-wider font-bold flex items-center gap-2 transition-all shadow-lg hover:shadow-amber-500/30 active:scale-95 cursor-pointer shrink-0"
            >
              <BellRing size={16} /> Trigger New Broadcast
            </button>
          </div>
        </div>

        {/* Quick Stats Summary Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-card border border-amber-500/20 p-4 rounded-xl flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-lg">
              {broadcastLogs.length}
            </div>
            <div>
              <p className="text-[10px] font-mono uppercase text-muted-foreground">Total Broadcasts Sent</p>
              <p className="text-sm font-semibold text-foreground">Verified Log History</p>
            </div>
          </div>

          <div className="bg-card border border-amber-500/20 p-4 rounded-xl flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-lg">
              03
            </div>
            <div>
              <p className="text-[10px] font-mono uppercase text-muted-foreground">Active Channels</p>
              <p className="text-sm font-semibold text-foreground">SMS · WhatsApp · Siren</p>
            </div>
          </div>

          <div className="bg-card border border-amber-500/20 p-4 rounded-xl flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-lg">
              10
            </div>
            <div>
              <p className="text-[10px] font-mono uppercase text-muted-foreground">NER District Reach</p>
              <p className="text-sm font-semibold text-foreground">07 States Covered</p>
            </div>
          </div>
        </div>

        {/* Recent Emergency Broadcast Logs Table */}
        <div className="bg-card border border-border/60 rounded-xl p-5 space-y-4 shadow-lg">
          <div className="flex items-center justify-between border-b border-border/40 pb-3">
            <div className="flex items-center gap-2">
              <RadioTower size={18} className="text-amber-400" />
              <h2 className="text-lg font-serif font-bold text-foreground">Recent Emergency Broadcast Activity</h2>
            </div>
            <span className="text-xs font-mono text-amber-400/90 font-semibold">{broadcastLogs.length} Records</span>
          </div>

          <div className="space-y-3">
            {broadcastLogs.map((log) => (
              <div
                key={log.id}
                className="p-4 rounded-xl bg-background/60 border border-amber-500/20 hover:border-amber-500/40 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="font-mono text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                      {log.refCode}
                    </span>
                    <strong className="text-sm font-semibold text-foreground">{log.district}</strong>
                    <span className="text-xs text-muted-foreground">({log.state})</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 ml-auto md:ml-0">
                      {log.status}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                    {log.advisory}
                  </p>
                  <p className="text-[10px] font-mono text-muted-foreground/70">
                    Recipient: <span className="text-foreground">{log.recipient}</span> · Channel: <span className="text-amber-300">{log.channel}</span>
                  </p>
                </div>

                <div className="text-right shrink-0 font-mono text-xs text-muted-foreground border-t md:border-t-0 border-border/20 pt-2 md:pt-0">
                  <p className="text-foreground font-semibold">{log.time}</p>
                  <p className="text-[10px] opacity-75">{log.date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Broadcast Modal */}
      {modalOpen && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) setModalOpen(false); }}>
          <div className="broadcast-modal !border-amber-500/40" role="dialog">
            <button className="modal-close icon-button" onClick={() => setModalOpen(false)}>
              <X size={17} />
            </button>
            {dispatchState === "sent" ? (
              <div className="dispatch-success">
                <span className="success-mark !bg-amber-500/20 !text-amber-400"><Check size={25} /></span>
                <p className="eyebrow text-amber-400">DISPATCH CONFIRMED</p>
                <h3>Broadcast sent to<br /><em className="text-amber-300">{targetDistrict.name} authorities.</em></h3>
                <p>Response brief successfully dispatched via {selectedChannel}.</p>
              </div>
            ) : (
              <>
                <p className="eyebrow accent-eyebrow !text-amber-400"><span className="eyebrow-line !bg-amber-400" /> EMERGENCY BROADCAST</p>
                <h3>Dispatch Emergency<br /><em className="text-amber-400">Alert Brief.</em></h3>
                <p className="modal-intro">Send immediate response brief to district disaster cells & field teams.</p>

                <label className="field-label" htmlFor="b-district">TARGET DISTRICT</label>
                <select
                  id="b-district"
                  value={targetDistrictId}
                  onChange={(e) => setTargetDistrictId(e.target.value as DistrictId)}
                  className="w-full h-10 px-3 bg-background border border-border rounded text-xs font-mono"
                >
                  {districts.map((d) => (
                    <option key={d.id} value={d.id}>{d.name} ({d.state}) · {d.risk} Risk</option>
                  ))}
                </select>

                <label className="field-label" htmlFor="b-channel">ALERT CHANNEL</label>
                <select
                  id="b-channel"
                  value={selectedChannel}
                  onChange={(e) => setSelectedChannel(e.target.value)}
                  className="w-full h-10 px-3 bg-background border border-border rounded text-xs font-mono"
                >
                  {channels.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>

                <div className="broadcast-preview !border-amber-500/30 !bg-amber-500/10">
                  <span className="preview-icon text-amber-400"><Radio size={15} /></span>
                  <div>
                    <span className="eyebrow text-amber-300">MESSAGE ADVISORY PREVIEW</span>
                    <p className="text-xs"><strong>{targetDistrict.name}</strong> is at <strong>{targetDistrict.risk.toLowerCase()} risk</strong>. {targetDistrict.action}</p>
                  </div>
                </div>

                <button
                  className="dispatch-button !bg-amber-500 hover:!bg-amber-400 !text-slate-950 !font-bold"
                  onClick={handleDispatch}
                  disabled={dispatchState !== "idle"}
                >
                  {dispatchState === "sending" ? <><Loader2 size={15} className="dispatch-spinner" /> Dispatching Alert…</> : <>Confirm & Dispatch Now <ArrowUpRight size={15} /></>}
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

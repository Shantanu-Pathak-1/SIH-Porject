import { useState } from "react";
import { Check, Copy, MessageSquare, Radio, Send, ShieldAlert, Sparkles, Smartphone, Volume2, X } from "lucide-react";
import type { NowcastDistrict } from "@/lib/nowcastData";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface LlmAlertModalProps {
  district: NowcastDistrict;
  isOpen: boolean;
  onClose: () => void;
  onDispatched?: () => void;
}

export default function LlmAlertModal({
  district,
  isOpen,
  onClose,
  onDispatched,
}: LlmAlertModalProps) {
  const [activeTab, setActiveTab] = useState<"hindi" | "english" | "payload">("hindi");
  const [dispatchStatus, setDispatchStatus] = useState<"idle" | "sending" | "dispatched">("idle");
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const alert = district.bilingualAlert;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Alert text copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDispatch = () => {
    setDispatchStatus("sending");
    setTimeout(() => {
      setDispatchStatus("dispatched");
      toast.success(`Emergency alert dispatched for ${district.name}!`, {
        description: `Bilingual SMS sent via Cell Broadcast & WhatsApp Gateway · 45,000 simulated recipients`,
      });
      if (onDispatched) onDispatched();
    }, 1200);
  };

  const jsonPayload = JSON.stringify(
    {
      system: "Ethrix-Nowcast Tier-4 GenAI Alert Engine (Gemini-1.5-Pro / Groq)",
      problemStatementId: "SIH-2026-26077",
      event: {
        zone: district.name,
        catchment: district.catchment,
        coordinates: district.coordinates,
        threat: district.threatCategory,
        prob_cloudburst: `${district.cloudburstProb}%`,
        prob_flashflood: `${district.flashFloodProb}%`,
        lead_time: district.leadTime,
        peak_intensity_mm_h: district.rainfallRate,
      },
      channels: ["Cell Broadcast CAP-1.2", "WhatsApp Gov-API", "Acoustic Siren Array"],
      outputs: {
        hindi_sms: alert.hindi,
        english_sms: alert.english,
        safe_assembly_zones: alert.safeZones,
        emergency_helpline: alert.helpline,
      },
    },
    null,
    2
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-2xl rounded-2xl bg-[#08221f] border border-white/20 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10 bg-gradient-to-r from-red-950/60 via-black/40 to-amber-950/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-red-500 to-amber-500 text-white shadow-lg shadow-red-500/30">
              <Sparkles size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold">
                  Tier-4 GenAI Natural Language Synthesis
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 font-mono text-zinc-300">
                  Gemini / Groq LLM
                </span>
              </div>
              <h3 className="text-lg font-serif font-bold text-white">
                Bilingual Evacuation Alert · {district.name}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close alert modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-5 pt-3 border-b border-white/10 bg-black/30">
          <button
            onClick={() => setActiveTab("hindi")}
            className={cn(
              "px-4 py-2 text-xs font-mono font-semibold transition-all border-b-2 cursor-pointer",
              activeTab === "hindi"
                ? "border-amber-400 text-amber-300 font-bold"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            )}
          >
            🇮🇳 हिंदी संदेश (Hindi SMS)
          </button>
          <button
            onClick={() => setActiveTab("english")}
            className={cn(
              "px-4 py-2 text-xs font-mono font-semibold transition-all border-b-2 cursor-pointer",
              activeTab === "english"
                ? "border-emerald-400 text-emerald-300 font-bold"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            )}
          >
            🌐 English SMS & Siren Brief
          </button>
          <button
            onClick={() => setActiveTab("payload")}
            className={cn(
              "px-4 py-2 text-xs font-mono font-semibold transition-all border-b-2 cursor-pointer",
              activeTab === "payload"
                ? "border-cyan-400 text-cyan-300 font-bold"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            )}
          >
            ⚙️ AI JSON Prompt & Payload
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          {activeTab === "hindi" && (
            <div className="space-y-4">
              {/* Phone Mockup Preview */}
              <div className="rounded-xl border border-amber-500/40 bg-gradient-to-br from-amber-950/40 to-black/60 p-4 shadow-xl">
                <div className="flex items-center justify-between text-xs font-mono text-amber-300 pb-2 border-b border-amber-500/20 mb-3">
                  <span className="flex items-center gap-1.5">
                    <Smartphone size={14} /> NDMA Flash Cell Broadcast (Hindi)
                  </span>
                  <span className="text-[10px] text-zinc-400">प्राथमिकता: अति उच्च (Urgent)</span>
                </div>
                <p className="text-sm font-sans text-white leading-relaxed whitespace-pre-wrap font-medium">
                  {alert.hindi}
                </p>
                <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-xs font-mono text-zinc-400">
                  <span>प्रभावित क्षेत्र: {district.catchment}</span>
                  <button
                    onClick={() => handleCopy(alert.hindi)}
                    className="flex items-center gap-1 text-amber-400 hover:text-amber-300 cursor-pointer"
                  >
                    {copied ? <Check size={13} /> : <Copy size={13} />} कॉपी करें
                  </button>
                </div>
              </div>

              {/* Safe Assembly Points */}
              <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 space-y-2">
                <span className="text-xs font-mono text-emerald-400 uppercase tracking-wider font-semibold block">
                  📍 निर्धारित सुरक्षित स्थल (Designated Safe Zones)
                </span>
                <div className="flex flex-wrap gap-2">
                  {alert.safeZones.map((zone, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-200 text-xs font-sans"
                    >
                      {zone}
                    </span>
                  ))}
                </div>
                <p className="text-[11px] font-mono text-zinc-400 pt-1">
                  आपदा हेल्पलाइन: <strong className="text-white">{alert.helpline}</strong> / 112
                </p>
              </div>
            </div>
          )}

          {activeTab === "english" && (
            <div className="space-y-4">
              {/* Phone Mockup Preview */}
              <div className="rounded-xl border border-emerald-500/40 bg-gradient-to-br from-emerald-950/40 to-black/60 p-4 shadow-xl">
                <div className="flex items-center justify-between text-xs font-mono text-emerald-300 pb-2 border-b border-emerald-500/20 mb-3">
                  <span className="flex items-center gap-1.5">
                    <Smartphone size={14} /> NDMA Flash Cell Broadcast (English)
                  </span>
                  <span className="text-[10px] text-zinc-400">Priority: Critical Evacuation</span>
                </div>
                <p className="text-sm font-sans text-white leading-relaxed whitespace-pre-wrap font-medium">
                  {alert.english}
                </p>
                <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-xs font-mono text-zinc-400">
                  <span>Target Zone: {district.catchment}</span>
                  <button
                    onClick={() => handleCopy(alert.english)}
                    className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 cursor-pointer"
                  >
                    {copied ? <Check size={13} /> : <Copy size={13} />} Copy Text
                  </button>
                </div>
              </div>

              {/* Siren Sequence Details */}
              <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 space-y-2">
                <span className="text-xs font-mono text-cyan-400 uppercase tracking-wider font-semibold flex items-center gap-1.5">
                  <Volume2 size={14} /> Solar Siren Array Activation Protocol
                </span>
                <p className="text-xs text-zinc-300 leading-relaxed font-sans">
                  Three 45-second high-pitch acoustic warbles with 15-second pause intervals. Automated bilingual
                  voice advisory broadcasted over municipal loudspeaker array at {district.elevationMeters}m altitude.
                </p>
              </div>
            </div>
          )}

          {activeTab === "payload" && (
            <div className="space-y-2">
              <span className="text-xs font-mono text-zinc-400 block">
                Raw JSON Output from Tier-4 LLM Multi-Turn Prompting:
              </span>
              <pre className="p-4 rounded-xl bg-black/70 border border-white/10 text-xs font-mono text-emerald-300 overflow-x-auto max-h-72 leading-relaxed">
                {jsonPayload}
              </pre>
            </div>
          )}

          {/* Target Delivery Channels */}
          <div className="p-3 rounded-xl bg-black/30 border border-white/10">
            <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider block mb-2 font-semibold">
              Configured Dispatch Gateways:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-mono">
              <div className="flex items-center gap-2 p-2 rounded bg-white/5 border border-white/10 text-emerald-300">
                <Radio size={14} className="text-emerald-400" />
                <span>Cell Broadcast (CAP 1.2)</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded bg-white/5 border border-white/10 text-emerald-300">
                <MessageSquare size={14} className="text-emerald-400" />
                <span>WhatsApp Bot Gateway</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded bg-white/5 border border-white/10 text-emerald-300">
                <Volume2 size={14} className="text-emerald-400" />
                <span>Local Solar Sirens</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-white/10 bg-black/40 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-mono text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            onClick={handleDispatch}
            disabled={dispatchStatus !== "idle"}
            className={cn(
              "flex items-center gap-2 px-5 py-2.5 rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition-all shadow-xl cursor-pointer",
              dispatchStatus === "dispatched"
                ? "bg-emerald-500 text-black"
                : dispatchStatus === "sending"
                ? "bg-amber-500 text-black"
                : "bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white"
            )}
          >
            {dispatchStatus === "sending" ? (
              <>
                <Send size={14} className="animate-spin" /> Dispatching Broadcast…
              </>
            ) : dispatchStatus === "dispatched" ? (
              <>
                <Check size={14} /> Alert Dispatched Successfully
              </>
            ) : (
              <>
                <Send size={14} /> Simulate AI Broadcast to All Channels
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

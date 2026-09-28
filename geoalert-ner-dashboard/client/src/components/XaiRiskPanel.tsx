import { AlertTriangle, BrainCircuit, CheckCircle2, ChevronRight, CloudRain, Flame, Layers, MapPin, Radio, Satellite, ShieldAlert, Sparkles, X, Zap } from "lucide-react";
import type { NowcastDistrict } from "@/lib/nowcastData";
import { cn } from "@/lib/utils";

interface XaiRiskPanelProps {
  district: NowcastDistrict;
  isOpen: boolean;
  onClose: () => void;
  onOpenLlmAlert: () => void;
}

export default function XaiRiskPanel({
  district,
  isOpen,
  onClose,
  onOpenLlmAlert,
}: XaiRiskPanelProps) {
  if (!isOpen) return null;

  const isCritical = district.risk === "Critical";
  const isHigh = district.risk === "High";

  return (
    <div
      className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-[#08221f]/95 text-foreground backdrop-blur-2xl border-l border-white/15 shadow-2xl flex flex-col transition-all duration-300 animate-in slide-in-from-right"
      role="dialog"
      aria-modal="true"
    >
      {/* Top Header */}
      <div className="flex items-center justify-between p-5 border-b border-white/10 bg-black/20">
        <div className="flex items-center gap-2.5">
          <div
            className={cn(
              "p-2 rounded-lg text-white shadow-md",
              isCritical
                ? "bg-red-500 animate-pulse shadow-red-500/50"
                : isHigh
                ? "bg-amber-500 shadow-amber-500/50"
                : "bg-emerald-500"
            )}
          >
            <BrainCircuit size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 font-bold">
                Tier-3 Explainable AI (Grad-CAM)
              </span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/10 font-mono text-zinc-300">
                Earthformer Verified
              </span>
            </div>
            <h3 className="text-lg font-serif font-bold text-white tracking-wide">
              {district.name}
            </h3>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-2 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          aria-label="Close XAI risk panel"
        >
          <X size={18} />
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {/* District Overview Card */}
        <div className="p-4 rounded-xl bg-black/30 border border-white/10 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
            <span className="flex items-center gap-1">
              <MapPin size={12} className="text-emerald-400" /> {district.state} · {district.elevationMeters}m
            </span>
            <span className="text-zinc-400">Catchment: {district.catchment}</span>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-white/10">
            <div>
              <p className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider">THREAT LEVEL</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span
                  className={cn(
                    "text-lg font-serif font-bold",
                    isCritical ? "text-red-400" : isHigh ? "text-amber-400" : "text-emerald-400"
                  )}
                >
                  {district.threatCategory} ({district.cloudburstProb}%)
                </span>
                <span
                  className={cn(
                    "px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase",
                    isCritical
                      ? "bg-red-500/20 text-red-300 border border-red-500/40"
                      : isHigh
                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                      : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                  )}
                >
                  {district.risk} Risk
                </span>
              </div>
            </div>

            <div className="text-right">
              <p className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider">EST. LEAD TIME</p>
              <p className="text-lg font-mono font-bold text-amber-300 mt-0.5">{district.leadTime}</p>
            </div>
          </div>
        </div>

        {/* Primary Trigger Banner */}
        <div
          className={cn(
            "p-3.5 rounded-xl border flex items-start gap-3",
            isCritical
              ? "bg-red-950/40 border-red-500/40 text-red-200"
              : "bg-amber-950/30 border-amber-500/40 text-amber-200"
          )}
        >
          <Flame size={18} className="shrink-0 mt-0.5 text-red-400" />
          <div className="space-y-1">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-red-300">
              Primary AI Trigger Detected
            </h4>
            <p className="text-xs leading-relaxed font-sans">{district.primaryTrigger}</p>
          </div>
        </div>

        {/* Multi-Head U-Net Predictions (Tier 2 Output) */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-zinc-300 uppercase tracking-wider font-semibold flex items-center gap-1.5">
              <Layers size={13} className="text-emerald-400" /> Multi-Head U-Net Probabilities
            </span>
            <span className="text-[10px] text-zinc-400 font-mono">Model: Earthformer-2.4</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="p-3 rounded-lg bg-black/40 border border-white/10 text-center">
              <span className="text-[10px] font-mono text-zinc-400 block">Cloudburst</span>
              <strong className="text-base font-mono text-red-400 font-bold block mt-1">
                {district.cloudburstProb}%
              </strong>
              <div className="w-full bg-white/10 h-1 rounded-full mt-2 overflow-hidden">
                <div className="bg-red-500 h-full" style={{ width: `${district.cloudburstProb}%` }} />
              </div>
            </div>

            <div className="p-3 rounded-lg bg-black/40 border border-white/10 text-center">
              <span className="text-[10px] font-mono text-zinc-400 block">Flash Flood</span>
              <strong className="text-base font-mono text-amber-400 font-bold block mt-1">
                {district.flashFloodProb}%
              </strong>
              <div className="w-full bg-white/10 h-1 rounded-full mt-2 overflow-hidden">
                <div className="bg-amber-500 h-full" style={{ width: `${district.flashFloodProb}%` }} />
              </div>
            </div>

            <div className="p-3 rounded-lg bg-black/40 border border-white/10 text-center">
              <span className="text-[10px] font-mono text-zinc-400 block">Thunderstorm</span>
              <strong className="text-base font-mono text-cyan-400 font-bold block mt-1">
                {district.thunderstormProb}%
              </strong>
              <div className="w-full bg-white/10 h-1 rounded-full mt-2 overflow-hidden">
                <div className="bg-cyan-400 h-full" style={{ width: `${district.thunderstormProb}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Grad-CAM Feature Attributions (Tier 3 XAI) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-zinc-300 uppercase tracking-wider font-semibold flex items-center gap-1.5">
              <BrainCircuit size={13} className="text-emerald-400" /> Grad-CAM Saliency Attributions
            </span>
            <span className="text-[10px] text-zinc-400 font-mono">XAI Verification Layer</span>
          </div>

          <div className="space-y-2">
            {district.xaiAttributions.map((attr, index) => (
              <div
                key={index}
                className="p-3 rounded-lg bg-black/40 border border-white/10 space-y-1.5 hover:border-emerald-500/40 transition-colors"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-zinc-200">{attr.feature}</span>
                  <span className="font-mono text-emerald-400 font-bold text-[11px]">
                    Weight: {attr.weight}%
                  </span>
                </div>

                <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-700",
                      index === 0
                        ? "bg-red-500"
                        : index === 1
                        ? "bg-amber-500"
                        : index === 2
                        ? "bg-cyan-500"
                        : "bg-emerald-500"
                    )}
                    style={{ width: `${attr.weight}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 pt-0.5">
                  <span className="text-zinc-400 font-sans">{attr.description}</span>
                  <span className="text-amber-300 font-semibold">{attr.value}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Atmospheric Sensor Telemetry Grid */}
        <div className="space-y-2">
          <span className="text-xs font-mono text-zinc-300 uppercase tracking-wider font-semibold block">
            Atmospheric Cross-Section (Tier 1 Data)
          </span>
          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            <div className="p-2.5 rounded-lg bg-black/30 border border-white/10">
              <span className="text-[10px] text-zinc-400 block">INSAT-3D CTT</span>
              <strong className="text-sm text-cyan-300">{district.cloudTopTemp}°C</strong>
              <small className="text-[10px] text-zinc-400 block">TIR1 Channel</small>
            </div>
            <div className="p-2.5 rounded-lg bg-black/30 border border-white/10">
              <span className="text-[10px] text-zinc-400 block">CAPE</span>
              <strong className="text-sm text-amber-300">{district.cape} J/kg</strong>
              <small className="text-[10px] text-zinc-400 block">CIN: {district.cin} J/kg</small>
            </div>
            <div className="p-2.5 rounded-lg bg-black/30 border border-white/10">
              <span className="text-[10px] text-zinc-400 block">Doppler Radar</span>
              <strong className="text-sm text-rose-300">{district.radarReflectivity} dBZ</strong>
              <small className="text-[10px] text-zinc-400 block">IMD Network</small>
            </div>
            <div className="p-2.5 rounded-lg bg-black/30 border border-white/10">
              <span className="text-[10px] text-zinc-400 block">Rainfall Rate</span>
              <strong className="text-sm text-emerald-300">{district.rainfallRate} mm/h</strong>
              <small className="text-[10px] text-zinc-400 block">Soil Sat: {district.soilSaturation}%</small>
            </div>
          </div>
        </div>

        {/* Active Triggers Checklist */}
        <div className="space-y-2 p-3.5 rounded-xl bg-black/30 border border-white/10">
          <span className="text-xs font-mono text-zinc-300 uppercase tracking-wider font-semibold block">
            Grad-CAM Activation Trigger Chain
          </span>
          <ul className="space-y-1.5 text-xs text-zinc-300">
            {district.triggers.map((trigger, i) => (
              <li key={i} className="flex items-start gap-2">
                <CheckCircle2 size={13} className="text-emerald-400 shrink-0 mt-0.5" />
                <span>{trigger}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Action Footer */}
      <div className="p-4 border-t border-white/10 bg-black/40 space-y-2">
        <button
          onClick={onOpenLlmAlert}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-mono text-xs font-bold tracking-wider uppercase shadow-xl transition-all hover:scale-[1.01] cursor-pointer"
        >
          <Sparkles size={16} /> Dispatch Tier-4 AI Evacuation Alert
        </button>
        <p className="text-[10px] font-mono text-zinc-400 text-center">
          Generates bilingual Hindi & English evacuation SMS using Gemini/Groq LLM
        </p>
      </div>
    </div>
  );
}

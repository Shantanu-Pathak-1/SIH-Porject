import { useEffect, useState } from "react";
import { Play, Pause, SkipBack, SkipForward, Clock, CloudLightning, Satellite, Radio, Flame, ShieldAlert, Sparkles, RefreshCw } from "lucide-react";
import { historicalSimulationSteps, type NowcastTimeStep } from "@/lib/nowcastData";
import { cn } from "@/lib/utils";

interface NowcastTimeSliderProps {
  currentStepIndex: number;
  onStepChange: (index: number) => void;
  className?: string;
}

export default function NowcastTimeSlider({
  currentStepIndex,
  onStepChange,
  className,
}: NowcastTimeSliderProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const currentStep: NowcastTimeStep = historicalSimulationSteps[currentStepIndex] || historicalSimulationSteps[0];
  const totalSteps = historicalSimulationSteps.length;

  // Auto-play interval
  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => {
      onStepChange((currentStepIndex + 1) % totalSteps);
    }, 4000);
    return () => clearInterval(timer);
  }, [isPlaying, currentStepIndex, totalSteps, onStepChange]);

  const handlePrev = () => {
    onStepChange((currentStepIndex - 1 + totalSteps) % totalSteps);
  };

  const handleNext = () => {
    onStepChange((currentStepIndex + 1) % totalSteps);
  };

  const isCriticalPhase = currentStepIndex >= 3;
  const isPeakCloudburst = currentStepIndex === 4;

  return (
    <div
      className={cn(
        "relative rounded-xl border p-4 sm:p-5 backdrop-blur-xl transition-all duration-500 shadow-2xl",
        isPeakCloudburst
          ? "border-red-500/50 bg-gradient-to-br from-red-950/40 via-[#0a1a17]/95 to-red-950/30 shadow-red-950/40 ring-1 ring-red-500/30"
          : isCriticalPhase
          ? "border-amber-500/40 bg-gradient-to-br from-amber-950/30 via-[#082a27]/95 to-[#0b3732]/80 shadow-amber-950/30 ring-1 ring-amber-500/20"
          : "border-emerald-500/30 bg-gradient-to-br from-[#082a27]/90 via-[#0b3732]/95 to-[#08201d]/90 shadow-emerald-950/30",
        className
      )}
    >
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <span
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-lg font-mono text-xs font-bold transition-all shadow-inner",
              isPeakCloudburst
                ? "bg-red-500 text-white animate-pulse"
                : isCriticalPhase
                ? "bg-amber-500 text-black"
                : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
            )}
          >
            {isPeakCloudburst ? <Flame size={15} /> : <Clock size={14} />}
          </span>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 font-semibold">
                Tier-2 Spatiotemporal Verification
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 font-mono text-zinc-300">
                Lead Time: 2–6h Nowcast
              </span>
            </div>
            <h4 className="text-sm sm:text-base font-serif font-bold text-white tracking-wide flex items-center gap-2">
              <span>{currentStep.phaseTitle}</span>
              {isPeakCloudburst && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/50 uppercase tracking-wider animate-pulse">
                  Cloudburst Active
                </span>
              )}
            </h4>
          </div>
        </div>

        {/* Phase Telemetry Chips */}
        <div className="flex items-center gap-2 text-xs font-mono">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-black/40 border border-white/10 text-cyan-300">
            <Satellite size={13} className="text-cyan-400" />
            <span className="text-[11px] text-zinc-400">CTT:</span>
            <strong className="font-semibold text-cyan-200">{currentStep.insat3dMinCtt}°C</strong>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-black/40 border border-white/10 text-amber-300">
            <CloudLightning size={13} className="text-amber-400" />
            <span className="text-[11px] text-zinc-400">CAPE:</span>
            <strong className="font-semibold text-amber-200">{currentStep.peakCape} J/kg</strong>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-black/40 border border-white/10 text-rose-300">
            <Radio size={13} className="text-rose-400" />
            <span className="text-[11px] text-zinc-400">Radar:</span>
            <strong className="font-semibold text-rose-200">{currentStep.radarCompositeDbz} dBZ</strong>
          </div>
        </div>
      </div>

      {/* Phase Narrative Context */}
      <p className="text-xs sm:text-sm text-zinc-300/90 my-2.5 leading-relaxed font-sans">
        <strong className="text-emerald-400 font-mono text-xs mr-1">
          [{currentStep.relativeTime} · {currentStep.timestamp}]
        </strong>
        {currentStep.phaseSummary}
      </p>

      {/* Time Steps Bar & Slider */}
      <div className="space-y-2 pt-1">
        <div className="relative flex items-center justify-between">
          {/* Progress connector line */}
          <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 bg-white/10 rounded-full z-0" />
          <div
            className={cn(
              "absolute left-0 top-1/2 -translate-y-1/2 h-1 rounded-full z-0 transition-all duration-500",
              isPeakCloudburst
                ? "bg-gradient-to-r from-emerald-500 via-amber-500 to-red-500"
                : "bg-gradient-to-r from-emerald-500 to-amber-500"
            )}
            style={{ width: `${(currentStepIndex / (totalSteps - 1)) * 100}%` }}
          />

          {historicalSimulationSteps.map((step, idx) => {
            const isActive = idx === currentStepIndex;
            const isPassed = idx < currentStepIndex;
            const isStepPeak = idx === 4;

            return (
              <button
                key={step.id}
                onClick={() => onStepChange(idx)}
                className="relative z-10 flex flex-col items-center group focus:outline-none"
                title={`${step.label}: ${step.phaseTitle}`}
              >
                <div
                  className={cn(
                    "h-6 w-6 rounded-full flex items-center justify-center font-mono text-[10px] font-bold transition-all duration-300 border-2 cursor-pointer",
                    isActive
                      ? isStepPeak
                        ? "bg-red-500 border-white text-white scale-125 shadow-lg shadow-red-500/50 ring-2 ring-red-400 animate-pulse"
                        : "bg-emerald-400 border-white text-slate-950 scale-125 shadow-lg shadow-emerald-500/50 ring-2 ring-emerald-300"
                      : isPassed
                      ? "bg-emerald-600 border-emerald-400 text-white"
                      : "bg-[#0b2420] border-zinc-600 text-zinc-400 group-hover:border-zinc-400"
                  )}
                >
                  {idx + 1}
                </div>
                <div className="mt-1.5 text-center hidden sm:block">
                  <span
                    className={cn(
                      "block text-[11px] font-mono leading-tight transition-colors",
                      isActive
                        ? isStepPeak
                          ? "text-red-400 font-bold"
                          : "text-emerald-300 font-bold"
                        : "text-zinc-400 group-hover:text-zinc-200"
                    )}
                  >
                    {step.label.split("·")[0].trim()}
                  </span>
                  <span className="block text-[9px] font-mono text-zinc-400/80">
                    {step.timestamp}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Control Buttons & Playback Bar */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/10">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold font-mono tracking-wider transition-all shadow-md cursor-pointer",
              isPlaying
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/50 hover:bg-amber-500/30"
                : "bg-emerald-500 text-slate-950 hover:bg-emerald-400"
            )}
          >
            {isPlaying ? (
              <>
                <Pause size={14} /> PAUSE NOWCAST
              </>
            ) : (
              <>
                <Play size={14} className="fill-current" /> PLAY SIMULATION
              </>
            )}
          </button>

          <button
            onClick={handlePrev}
            className="p-1.5 rounded-md bg-white/5 border border-white/10 text-zinc-300 hover:bg-white/10 transition-colors cursor-pointer"
            title="Previous Time Step"
          >
            <SkipBack size={14} />
          </button>
          <button
            onClick={handleNext}
            className="p-1.5 rounded-md bg-white/5 border border-white/10 text-zinc-300 hover:bg-white/10 transition-colors cursor-pointer"
            title="Next Time Step"
          >
            <SkipForward size={14} />
          </button>
        </div>

        {/* Preset quick jump buttons */}
        <div className="flex items-center gap-1.5 text-[11px] font-mono">
          <span className="text-zinc-400 mr-1 hidden md:inline">Jump to:</span>
          <button
            onClick={() => onStepChange(0)}
            className={cn(
              "px-2 py-0.5 rounded border transition-all cursor-pointer",
              currentStepIndex === 0
                ? "bg-emerald-500/30 border-emerald-400 text-emerald-200"
                : "bg-black/30 border-white/10 text-zinc-400 hover:text-zinc-200"
            )}
          >
            T-4h Baseline
          </button>
          <button
            onClick={() => onStepChange(3)}
            className={cn(
              "px-2 py-0.5 rounded border transition-all cursor-pointer",
              currentStepIndex === 3
                ? "bg-amber-500/30 border-amber-400 text-amber-200"
                : "bg-black/30 border-white/10 text-zinc-400 hover:text-zinc-200"
            )}
          >
            T-1h Trigger
          </button>
          <button
            onClick={() => onStepChange(4)}
            className={cn(
              "px-2 py-0.5 rounded border transition-all cursor-pointer",
              currentStepIndex === 4
                ? "bg-red-500/30 border-red-400 text-red-200 animate-pulse font-bold"
                : "bg-black/30 border-white/10 text-zinc-400 hover:text-zinc-200"
            )}
          >
            T0 Cloudburst Peak ⚡
          </button>
        </div>
      </div>
    </div>
  );
}

import { useState } from "react";
import { ArrowUpRight, BellRing, Database, Layers, MapPin, Radio, Satellite, ShieldAlert, Sparkles, Waves } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import GeoRiskMap from "@/components/GeoRiskMap";
import { defaultDistricts, type District, type DistrictId } from "@/lib/districtsData";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

export default function MapViewPage() {
  const { user } = useAuth();
  const [districts] = useState<District[]>(defaultDistricts);
  const [selectedId, setSelectedId] = useState<DistrictId>("tawang");
  const [mapMode, setMapMode] = useState<"satellite" | "heatmap" | "sensors">("satellite");

  const selected = districts.find((d) => d.id === selectedId) || districts[0];

  const handleQuickBroadcast = () => {
    toast.success(`Emergency alert brief initiated for ${selected.name}`, {
      description: `Channel: SMS/WhatsApp · Target: ${selected.name} Disaster Management Unit`,
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-5">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 uppercase tracking-wider mb-1">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              GIS TERRAIN & MAP SURFACE
            </div>
            <h1 className="text-2xl font-serif font-bold text-foreground">
              Interactive Regional Risk Map
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              High-resolution spatial model across 07 North-Eastern states · Focus: <strong className="text-emerald-400">{selected.name}, {selected.state}</strong>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleQuickBroadcast}
              className="h-9 px-3.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-mono text-[11px] uppercase tracking-wider font-bold flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
            >
              <BellRing size={14} /> Dispatch Alert for {selected.name}
            </button>
          </div>
        </div>

        {/* District Quick Select Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar border-b border-border/20">
          <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider shrink-0 mr-1">Select District:</span>
          {districts.map((d) => {
            const isSelected = d.id === selectedId;
            return (
              <button
                key={d.id}
                onClick={() => setSelectedId(d.id)}
                className={cn(
                  "px-3 py-1.5 rounded-lg font-mono text-xs whitespace-nowrap transition-all flex items-center gap-2 border cursor-pointer",
                  isSelected
                    ? "bg-emerald-600/20 text-emerald-300 border-emerald-500/50 font-semibold shadow-sm"
                    : "bg-card/40 text-muted-foreground border-border/40 hover:text-foreground hover:bg-card"
                )}
              >
                <span className={cn(
                  "h-2 w-2 rounded-full",
                  d.risk === "Critical" ? "bg-red-500" : d.risk === "High" ? "bg-orange-400" : d.risk === "Moderate" ? "bg-amber-400" : "bg-emerald-400"
                )} />
                {d.name}
                <span className="opacity-60 text-[10px]">({d.riskIndex.toFixed(2)})</span>
              </button>
            );
          })}
        </div>

        {/* Map Container Card - Full Height & High Resolution */}
        <div className="bg-card border border-border/60 rounded-2xl overflow-hidden shadow-2xl space-y-0">
          {/* Map Sub-Header Controls */}
          <div className="p-4 bg-muted/20 border-b border-border/40 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-8 px-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 font-mono text-xs flex items-center gap-2 font-medium">
                <MapPin size={13} /> {selected.name} · {selected.state}
              </div>
              <span className="text-xs text-muted-foreground font-mono">
                COORDINATES: {selected.coordinates[0].toFixed(4)}° N, {selected.coordinates[1].toFixed(4)}° E
              </span>
            </div>

            {/* Layer View Mode Toggles */}
            <div className="flex items-center gap-1.5 bg-background/80 p-1 rounded-lg border border-border/40">
              <button
                onClick={() => setMapMode("satellite")}
                className={cn(
                  "px-2.5 py-1 rounded-md text-[11px] font-mono uppercase tracking-wider transition-all cursor-pointer",
                  mapMode === "satellite" ? "bg-emerald-600 text-white font-semibold" : "text-muted-foreground hover:text-foreground"
                )}
              >
                ESRI Satellite
              </button>
              <button
                onClick={() => setMapMode("heatmap")}
                className={cn(
                  "px-2.5 py-1 rounded-md text-[11px] font-mono uppercase tracking-wider transition-all cursor-pointer",
                  mapMode === "heatmap" ? "bg-emerald-600 text-white font-semibold" : "text-muted-foreground hover:text-foreground"
                )}
              >
                Heatmap Overlay
              </button>
              <button
                onClick={() => setMapMode("sensors")}
                className={cn(
                  "px-2.5 py-1 rounded-md text-[11px] font-mono uppercase tracking-wider transition-all cursor-pointer",
                  mapMode === "sensors" ? "bg-emerald-600 text-white font-semibold" : "text-muted-foreground hover:text-foreground"
                )}
              >
                Sensor Nodes
              </button>
            </div>
          </div>

          {/* High-Height Map Shell */}
          <div className="w-full h-[580px] relative">
            <GeoRiskMap districts={districts} selectedId={selectedId} onSelectDistrict={setSelectedId} />
          </div>

          {/* Map Footer Information */}
          <div className="p-4 bg-card border-t border-border/40 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
            <div className="space-y-1">
              <span className="text-muted-foreground text-[10px] uppercase tracking-wider block">RAINFALL (3-DAY)</span>
              <strong className="text-foreground text-sm font-semibold">{selected.rainfall} mm</strong>
            </div>
            <div className="space-y-1">
              <span className="text-muted-foreground text-[10px] uppercase tracking-wider block">SOIL SATURATION</span>
              <strong className="text-foreground text-sm font-semibold">{selected.saturation}%</strong>
            </div>
            <div className="space-y-1">
              <span className="text-muted-foreground text-[10px] uppercase tracking-wider block">LEAD TIME</span>
              <strong className="text-emerald-400 text-sm font-semibold">{selected.leadTime}</strong>
            </div>
            <div className="space-y-1">
              <span className="text-muted-foreground text-[10px] uppercase tracking-wider block">HAZARD STATUS</span>
              <span className={cn(
                "inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                selected.risk === "Critical" ? "bg-red-500/20 text-red-300 border border-red-500/30" : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
              )}>
                {selected.risk} Risk ({selected.riskIndex.toFixed(2)})
              </span>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

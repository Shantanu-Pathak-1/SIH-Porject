import { useState } from "react";
import { ArrowUpRight, BellRing, Database, Layers, Locate, MapPin, Navigation, Radio, Satellite, ShieldAlert, Sparkles, Waves } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import GeoRiskMap from "@/components/GeoRiskMap";
import { defaultDistricts, type District, type DistrictId } from "@/lib/districtsData";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { triggerTieredAlert } from "@/lib/audioAlert";

export default function MapViewPage() {
  const { user } = useAuth();
  const [districts] = useState<District[]>(defaultDistricts);
  const [selectedId, setSelectedId] = useState<DistrictId>("tawang");
  const [userCoords, setUserCoords] = useState<[number, number] | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsData, setGpsData] = useState<{
    tier: "EMERGENCY_EVACUATION" | "NEARBY_CAUTION" | "SAFE";
    title: string;
    advisory: string;
  } | null>(null);

  const selected = districts.find((d) => d.id === selectedId) || districts[0];

  const handleQuickBroadcast = () => {
    triggerTieredAlert("EMERGENCY_EVACUATION", `🚨 CRITICAL SIREN DISPATCH`, `Emergency warning for ${selected.name} (${selected.state}).`);

    api.dispatchBroadcast({
      district: selected.name,
      state: selected.state,
      channel: "Local Public Siren Array",
      recipient: `${selected.name} Disaster Management Unit`,
      advisory: selected.action,
    });

    toast.error(`EMERGENCY SIREN DISPATCHED FOR ${selected.name.toUpperCase()}!`, {
      description: `Tier 1 Alarm Siren & Web Push Triggered · Target: ${selected.name} Emergency Unit`,
    });
  };

  const handleGetUserLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    setGpsLoading(true);
    toast.info("Requesting GPS location permission...", { description: "Please allow location access in your browser prompt." });

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        setUserCoords([lat, lon]);
        setGpsLoading(false);

        const evalResult = (await api.evaluateLocation(lat, lon)) as any;
        if (evalResult) {
          const tier = evalResult.alertTier || (evalResult.hazardAlertRequired ? "EMERGENCY_EVACUATION" : "SAFE");
          const title = evalResult.title || (tier === "EMERGENCY_EVACUATION" ? "CRITICAL LANDSLIDE ALARM" : "NEARBY CAUTION NOTICE");
          
          setGpsData({ tier, title, advisory: evalResult.advisory });
          triggerTieredAlert(tier, title, evalResult.advisory);

          if (tier === "EMERGENCY_EVACUATION") {
            toast.error(title, { description: evalResult.advisory });
          } else if (tier === "NEARBY_CAUTION") {
            toast.warning(title, { description: evalResult.advisory });
          } else {
            toast.success("GPS Location Acquired: Safe Zone", { description: evalResult.advisory });
          }
        } else {
          toast.success(`GPS Location Acquired: ${lat.toFixed(4)}° N, ${lon.toFixed(4)}° E`);
        }
      },
      (err) => {
        setGpsLoading(false);
        toast.error("Location permission denied or unavailable", {
          description: "Defaulting to selected North-East monitoring station.",
        });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <DashboardLayout>
      <div className="w-full max-w-full min-w-0 space-y-4 overflow-x-hidden">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-border/40 pb-3">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-mono text-emerald-400 uppercase tracking-wider mb-0.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              GIS TERRAIN & MAP SURFACE
            </div>
            <h1 className="text-xl sm:text-2xl font-serif font-bold text-foreground tracking-tight">
              Interactive Regional Risk Map
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              High-resolution spatial model across 07 North-Eastern states · Focus: <strong className="text-emerald-400">{selected.name}, {selected.state}</strong>
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <button
              onClick={handleGetUserLocation}
              disabled={gpsLoading}
              className="h-9 px-3.5 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/40 font-mono text-[11px] uppercase tracking-wider font-bold flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <Navigation size={14} className={gpsLoading ? "animate-spin" : ""} />
              {gpsLoading ? "Acquiring GPS..." : "📍 Locate Me (Live GPS)"}
            </button>

            <button
              onClick={handleQuickBroadcast}
              className="h-9 px-3.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-mono text-[11px] uppercase tracking-wider font-bold flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
            >
              <BellRing size={14} /> Dispatch Siren Alert
            </button>
          </div>
        </div>

        {gpsData && (
          <div
            className={cn(
              "p-3.5 rounded-xl text-xs font-mono flex items-center justify-between gap-3 animate-fadeIn border shadow-lg",
              gpsData.tier === "EMERGENCY_EVACUATION"
                ? "bg-red-500/20 text-red-200 border-red-500/60 shadow-red-950/40"
                : gpsData.tier === "NEARBY_CAUTION"
                ? "bg-amber-500/15 text-amber-200 border-amber-500/50"
                : "bg-emerald-500/15 text-emerald-200 border-emerald-500/40"
            )}
          >
            <div className="flex items-center gap-2.5">
              <ShieldAlert
                size={18}
                className={cn(
                  "shrink-0",
                  gpsData.tier === "EMERGENCY_EVACUATION"
                    ? "text-red-400 animate-ping"
                    : gpsData.tier === "NEARBY_CAUTION"
                    ? "text-amber-400 animate-pulse"
                    : "text-emerald-400"
                )}
              />
              <div>
                <strong className="block text-xs font-bold uppercase tracking-wider">{gpsData.title}</strong>
                <p className="opacity-90">{gpsData.advisory}</p>
              </div>
            </div>

            <span className={cn(
              "px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider shrink-0 border",
              gpsData.tier === "EMERGENCY_EVACUATION"
                ? "bg-red-600 text-white border-red-400 animate-pulse"
                : gpsData.tier === "NEARBY_CAUTION"
                ? "bg-amber-500/30 text-amber-300 border-amber-400"
                : "bg-emerald-500/30 text-emerald-300 border-emerald-400"
            )}>
              {gpsData.tier === "EMERGENCY_EVACUATION" ? "Tier 1: Evacuation" : gpsData.tier === "NEARBY_CAUTION" ? "Tier 2: Caution" : "Tier 3: Safe"}
            </span>
          </div>
        )}

        {/* District Quick Select Bar */}
        <div className="w-full max-w-full flex flex-wrap items-center gap-2 pb-2 pr-4 border-b border-border/20">
          <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider shrink-0 mr-1">Select District:</span>
          {districts.map((d) => {
            const isSelected = d.id === selectedId;
            return (
              <button
                key={d.id}
                onClick={() => setSelectedId(d.id)}
                className={cn(
                  "px-2.5 py-1.5 rounded-lg font-mono text-xs whitespace-nowrap transition-all flex items-center gap-1.5 border cursor-pointer shrink-0",
                  isSelected
                    ? "bg-emerald-600/20 text-emerald-300 border-emerald-500/50 font-semibold shadow-sm"
                    : "bg-card/40 text-muted-foreground border-border/40 hover:text-foreground hover:bg-card"
                )}
              >
                <span className={cn(
                  "h-2 w-2 rounded-full shrink-0",
                  d.risk === "Critical" ? "bg-red-500" : d.risk === "High" ? "bg-orange-400" : d.risk === "Moderate" ? "bg-amber-400" : "bg-emerald-400"
                )} />
                {d.name}
                <span className="opacity-60 text-[10px]">({d.riskIndex.toFixed(2)})</span>
              </button>
            );
          })}
        </div>

        {/* Map Container Card - Full Height & High Resolution */}
        <div className="bg-card border border-border/60 rounded-2xl overflow-hidden shadow-xl w-full max-w-full">
          {/* Map Sub-Header Controls */}
          <div className="px-4 py-3 bg-muted/20 border-b border-border/40 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="h-7 px-2.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 font-mono text-xs flex items-center gap-1.5 font-medium">
                <MapPin size={13} /> {selected.name} · {selected.state}
              </div>
              <span className="text-xs text-muted-foreground font-mono">
                COORDINATES: {selected.coordinates[0].toFixed(4)}° N, {selected.coordinates[1].toFixed(4)}° E
              </span>
            </div>

            <div className="text-[11px] font-mono text-emerald-400 flex items-center gap-2 font-medium">
              <span className="h-2 w-2 rounded-full bg-emerald-400 inline-block animate-pulse" /> Live Telemetry Active
            </div>
          </div>

          {/* High-Height Map Shell */}
          <div className="w-full h-[540px] sm:h-[580px] relative">
            <GeoRiskMap districts={districts} selectedId={selectedId} onSelectDistrict={setSelectedId} initialTile="satellite" userLocation={userCoords} />
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

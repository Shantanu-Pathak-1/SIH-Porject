import { useState } from "react";
import { ArrowUpRight, BarChart3, Calendar, Download, FileText, Filter, History, RefreshCw, ShieldAlert, Waves } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import TrendCharts from "@/components/TrendCharts";
import SensorNodeAnalytics from "@/components/SensorNodeAnalytics";
import { defaultDistricts, type District, type DistrictId } from "@/lib/districtsData";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const timeFilterOptions = [
  { id: "today", label: "Today (Live)" },
  { id: "yesterday", label: "Yesterday" },
  { id: "7days", label: "Past 7 Days" },
  { id: "30days", label: "Past 30 Days" },
];

const mockIncidents = [
  { id: "INC-901", date: "2026-09-15 14:30", district: "Tawang", state: "Arunachal Pradesh", rainfallPeak: "142 mm", saturationPeak: "88%", maxRisk: "Critical", status: "Alert Dispatched" },
  { id: "INC-898", date: "2026-09-14 08:15", district: "East Khasi Hills", state: "Meghalaya", rainfallPeak: "128 mm", saturationPeak: "84%", maxRisk: "High", status: "Siren Activated" },
  { id: "INC-885", date: "2026-09-12 19:40", district: "Dima Hasao", state: "Assam", rainfallPeak: "115 mm", saturationPeak: "79%", maxRisk: "High", status: "Buffered Edge" },
  { id: "INC-872", date: "2026-09-10 11:10", district: "West Siang", state: "Arunachal Pradesh", rainfallPeak: "135 mm", saturationPeak: "86%", maxRisk: "Critical", status: "SMS Broadcast" },
  { id: "INC-860", date: "2026-09-08 16:50", district: "Ukhrul", state: "Manipur", rainfallPeak: "96 mm", saturationPeak: "74%", maxRisk: "Moderate", status: "Routine Log" },
];

export default function HistoryPage() {
  const { theme } = useTheme();
  const [districts] = useState<District[]>(defaultDistricts);
  const [selectedId, setSelectedId] = useState<DistrictId>("tawang");
  const [timeFilter, setTimeFilter] = useState("7days");
  const [lastUpdated] = useState(() => new Date());

  const selected = districts.find((d) => d.id === selectedId) || districts[0];

  const handleExportReport = () => {
    toast.success(`Exporting ${timeFilter.toUpperCase()} telemetry report for ${selected.name}`, {
      description: "File: GEOALERT_TELEMETRY_REPORT.csv · 1,480 telemetry records processed",
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 uppercase tracking-wider mb-1">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              HISTORICAL TELEMETRY & ANALYTICS
            </div>
            <h1 className="text-2xl font-serif font-bold text-foreground">
              History, Trends & Audit Reports
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Multi-day rainfall curves, sensor telemetry logs and historical landslide hazard reports
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportReport}
              className="h-9 px-3.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-[11px] uppercase tracking-wider font-semibold flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
            >
              <Download size={14} /> Export CSV Report
            </button>
          </div>
        </div>

        {/* Time-frame Filter Tabs & District Selector */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-card p-3 rounded-xl border border-border/50">
          <div className="flex items-center gap-1.5 bg-background p-1 rounded-lg border border-border/40">
            <Calendar size={14} className="text-emerald-400 ml-2 mr-1" />
            {timeFilterOptions.map((opt) => (
              <button
                key={opt.id}
                onClick={() => setTimeFilter(opt.id)}
                className={cn(
                  "px-3 py-1.5 rounded-md text-xs font-mono transition-all cursor-pointer",
                  timeFilter === opt.id ? "bg-emerald-600 text-white font-semibold shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-muted-foreground uppercase">District:</span>
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value as DistrictId)}
              className="h-9 px-3 rounded-lg bg-background border border-border text-xs font-mono font-medium text-foreground outline-none focus:border-emerald-400"
            >
              {districts.map((d) => (
                <option key={d.id} value={d.id}>{d.name} ({d.state})</option>
              ))}
            </select>
          </div>
        </div>

        {/* Interactive Trend Charts */}
        <TrendCharts district={selected} theme={theme} />

        {/* Sensor Node Analytics & Mesh Network Table */}
        <SensorNodeAnalytics
          district={selected}
          lastUpdated={lastUpdated}
          networkOnline={18}
          networkTotal={20}
        />

        {/* Historical Event & Incident Audit Table */}
        <div className="bg-card border border-border/60 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-border/40 pb-3">
            <div>
              <p className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider">HISTORICAL HAZARD LOG</p>
              <h3 className="text-lg font-serif font-bold text-foreground">Past Slope Displacement & Incident Records</h3>
            </div>
            <span className="text-xs font-mono text-muted-foreground">{mockIncidents.length} Events Recorded</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead>
                <tr className="border-b border-border/40 text-[10px] text-muted-foreground uppercase tracking-wider">
                  <th className="py-2.5 px-3">Event ID</th>
                  <th className="py-2.5 px-3">Date & Time</th>
                  <th className="py-2.5 px-3">District</th>
                  <th className="py-2.5 px-3">Rainfall Peak</th>
                  <th className="py-2.5 px-3">Soil Saturation</th>
                  <th className="py-2.5 px-3">Peak Risk</th>
                  <th className="py-2.5 px-3">Action Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {mockIncidents.map((row) => (
                  <tr key={row.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-3 font-bold text-emerald-400">{row.id}</td>
                    <td className="py-3 px-3 text-muted-foreground">{row.date}</td>
                    <td className="py-3 px-3 font-semibold text-foreground">{row.district}, <span className="text-muted-foreground font-normal">{row.state}</span></td>
                    <td className="py-3 px-3">{row.rainfallPeak}</td>
                    <td className="py-3 px-3">{row.saturationPeak}</td>
                    <td className="py-3 px-3">
                      <span className={cn(
                        "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                        row.maxRisk === "Critical" ? "bg-red-500/20 text-red-300 border border-red-500/30" : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                      )}>
                        {row.maxRisk}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-emerald-300">{row.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

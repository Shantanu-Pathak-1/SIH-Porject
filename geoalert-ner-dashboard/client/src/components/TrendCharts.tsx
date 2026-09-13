// GeoAlert-NER style: data graphics are quiet instruments—thin lines, generous breathing room, and ochre reserved for the signal that needs attention.
import { useMemo, useState } from "react";
import { Chart as ChartJS, CategoryScale, Filler, Legend, LinearScale, LineElement, PointElement, Tooltip } from "chart.js";
import { Line } from "react-chartjs-2";
import type { District } from "@/lib/districtsData";
import { trendSeries } from "@/lib/geoalert";

ChartJS.register(CategoryScale, Filler, Legend, LinearScale, LineElement, PointElement, Tooltip);

const labels = ["D−6", "D−5", "D−4", "D−3", "D−2", "D−1", "NOW"];

export default function TrendCharts({ district, theme }: { district: District; theme: "light" | "dark" }) {
  const [range, setRange] = useState<"7d" | "24h">("7d");
  const palette = theme === "dark" ? { text: "#93b0a7", grid: "rgba(215,235,224,.1)", card: "#0e3b35" } : { text: "#6c8880", grid: "rgba(18,59,54,.1)", card: "#ffffff" };
  const chartLabels = range === "7d" ? labels : ["00h", "04h", "08h", "12h", "16h", "20h", "NOW"];
  const rainData = useMemo(() => trendSeries(district.rainfall, "rain", district.rainfall, range), [district.rainfall, range]);
  const soilData = useMemo(() => trendSeries(district.saturation, "soil", district.saturation, range), [district.saturation, range]);

  const chartOptions = (unit: string, min: number, max: number) => ({
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 550, easing: "easeOutQuart" as const },
    interaction: { intersect: false, mode: "index" as const },
    plugins: { legend: { display: false }, tooltip: { backgroundColor: "#123b36", titleFont: { family: "IBM Plex Mono", size: 10 }, bodyFont: { family: "Source Sans 3", size: 12 }, displayColors: false, padding: 10, callbacks: { label: (context: { parsed: { y: number | null } }) => `${context.parsed.y ?? 0} ${unit}` } } },
    scales: { x: { grid: { display: false }, ticks: { color: palette.text, font: { family: "IBM Plex Mono", size: 9 }, padding: 5 } }, y: { min, max, grid: { color: palette.grid }, ticks: { color: palette.text, font: { family: "IBM Plex Mono", size: 9 }, maxTicksLimit: 4, callback: (tickValue: string | number) => `${tickValue}` } } },
  });

  const commonDataset = (values: number[], color: string, fill: string) => ({ labels: chartLabels, datasets: [{ data: values, borderColor: color, backgroundColor: fill, fill: true, borderWidth: 2, pointRadius: 0, pointHoverRadius: 4, pointHoverBackgroundColor: color, pointHoverBorderColor: palette.card, pointHoverBorderWidth: 2, tension: .38 }] });

  return <div className="trend-section"><div className="trend-section-header"><div><p className="eyebrow">SIGNAL HISTORY / {range === "7d" ? "07 DAYS" : "24 HOURS"}</p><h3>Rain &amp; soil, read together.</h3></div><div className="trend-header-actions"><div className="trend-range-toggle" role="group" aria-label="Select trend time range"><button className={range === "24h" ? "active" : ""} onClick={() => setRange("24h")}>24H</button><button className={range === "7d" ? "active" : ""} onClick={() => setRange("7d")}>7D</button></div><span className="trend-context"><span className="live-dot" /> {district.name} field series</span></div></div><div className="trend-chart-grid"><article className="trend-chart-card"><div className="trend-card-head"><span className="trend-icon rain-icon">RAIN</span><div><strong>Rainfall trend</strong><small>{range === "7d" ? "Rolling 3–7 day accumulation" : "Intra-day rainfall intensity"}</small></div><b>{district.rainfall}<small> mm</small></b></div><div className="chart-canvas"><Line data={commonDataset(rainData, "#e6b04a", "rgba(230,176,74,.14)" )} options={chartOptions("mm", 0, Math.max(140, Math.ceil(Math.max(...rainData) / 20) * 20))} /></div></article><article className="trend-chart-card"><div className="trend-card-head"><span className="trend-icon soil-icon">SOIL</span><div><strong>Soil saturation</strong><small>{range === "7d" ? "Moisture retention index" : "Current moisture response"}</small></div><b>{district.saturation}<small> %</small></b></div><div className="chart-canvas"><Line data={commonDataset(soilData, "#5f9e8d", "rgba(95,158,141,.15)" )} options={chartOptions("%", 0, 100)} /></div></article></div></div>;
}

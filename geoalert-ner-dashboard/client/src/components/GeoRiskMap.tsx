// GeoAlert-NER style: the map is a calm mint terrain instrument with ochre and severity marker signals, never a decorative map layer.
import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { District, DistrictId } from "@/lib/districtsData";

const riskColors: Record<string, string> = {
  Low: "#6eaa86",
  Moderate: "#d9aa48",
  High: "#ee8b56",
  Critical: "#d75d52",
};

export default function GeoRiskMap({ districts, selectedId, onSelectDistrict }: { districts: District[]; selectedId: DistrictId; onSelectDistrict: (id: DistrictId) => void }) {
  const mapElement = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Record<string, L.Marker>>({});
  const lastFocusedIdRef = useRef<DistrictId | null>(null);

  useEffect(() => {
    if (!mapElement.current || mapRef.current) return;

    const map = L.map(mapElement.current, { zoomControl: false, attributionControl: false, minZoom: 4, maxZoom: 11 }).setView([26.2, 93.4], 5.5);
    L.control.zoom({ position: "bottomright" }).addTo(map);
    L.control.scale({ position: "bottomleft", imperial: false, metric: true, maxWidth: 100 }).addTo(map);
    L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
      maxZoom: 18,
      attribution: "Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics",
    }).addTo(map);
    // Overlay subtle boundaries & labels
    L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png", {
      maxZoom: 18,
      subdomains: "abcd",
    }).addTo(map);
    const heatmapLayer = L.layerGroup().addTo(map);

    districts.forEach((district) => {
      const color = riskColors[district.risk];
      const baseRadius = district.risk === "Critical" ? 36000 : district.risk === "High" ? 27000 : district.risk === "Moderate" ? 22000 : 15000;
      const heatOpacity = district.risk === "Critical" ? 0.16 : district.risk === "High" ? 0.13 : district.risk === "Moderate" ? 0.1 : 0.07;
      [baseRadius * 1.5, baseRadius * 1.18, baseRadius].forEach((radius, index) => L.circle(district.coordinates, { radius, color, fillColor: color, fillOpacity: heatOpacity / (index + 1), weight: index === 2 ? 1.25 : 0, opacity: 0.5 }).addTo(heatmapLayer));
      const marker = L.marker(district.coordinates, {
        icon: L.divIcon({ className: `risk-marker risk-marker-${district.risk.toLowerCase()}`, html: `<span class="marker-halo"></span><span class="marker-core"></span>`, iconSize: [34, 34], iconAnchor: [17, 17] }),
        keyboard: true,
        title: `${district.name} · ${district.risk} risk`,
      }).addTo(map);
      marker.bindTooltip(`<strong>${district.name}</strong><br /><span>${district.risk} risk · ${district.riskIndex.toFixed(2)}</span>`, { direction: "top", offset: [0, -12], className: "risk-tooltip" });
      marker.on("click", () => onSelectDistrict(district.id));
      markersRef.current[district.id] = marker;
    });

    mapRef.current = map;
    lastFocusedIdRef.current = selectedId;
    window.setTimeout(() => map.invalidateSize(), 80);
    return () => {
      map.remove();
      mapRef.current = null;
      markersRef.current = {};
    };
  // Marker geometry is static for this simulation; keep the Leaflet instance alive while data values refresh.
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || lastFocusedIdRef.current === selectedId) return;
    const selected = districts.find((district) => district.id === selectedId);
    if (!selected) return;
    const focusMap = () => {
      const container = map.getContainer();
      if (!container.clientWidth || !container.clientHeight) {
        map.invalidateSize();
        return;
      }
      map.stop();
      map.flyTo(selected.coordinates, 6.3, { duration: 0.65 });
    };
    lastFocusedIdRef.current = selectedId;
    const focusTimer = window.setTimeout(focusMap, 80);
    Object.entries(markersRef.current).forEach(([id, marker]) => marker.setZIndexOffset(id === selectedId ? 900 : 100));
    return () => window.clearTimeout(focusTimer);
  }, [selectedId]);

  return <div className="leaflet-map-shell"><div ref={mapElement} className="leaflet-map" /><div className="map-legend"><span><i className="legend-dot legend-low" /> Safe</span><span><i className="legend-dot legend-moderate" /> Moderate</span><span><i className="legend-dot legend-high" /> High</span><span><i className="legend-dot legend-critical" /> Critical</span></div><div className="map-context-note"><span>ESRI Satellite basemap</span><span>Risk heatmap layer</span><span>Scale in km</span></div><div className="map-attribution">Tiles © Esri · Earthstar Geographics</div></div>;
}

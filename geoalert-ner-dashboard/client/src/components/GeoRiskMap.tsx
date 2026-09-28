// Ethrix-Nowcast: GIS command map with interactive Grad-CAM heatmap overlays, atmospheric layers, and XAI inspection
import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { District, DistrictId } from "@/lib/districtsData";
import type { GradCamZone } from "@/lib/nowcastData";

const riskColors: Record<string, string> = {
  Low: "#10b981", // emerald
  Moderate: "#eab308", // amber
  High: "#f97316", // orange
  Critical: "#ef4444", // red
};

export type MapTileStyle = "satellite" | "topo" | "street";
export type AtmosphericOverlay = "gradcam" | "radar" | "ctt" | "all";

export default function GeoRiskMap({
  districts,
  selectedId,
  onSelectDistrict,
  gradCamZones = [],
  onOpenXai,
  initialTile = "satellite",
  userLocation,
}: {
  districts: District[];
  selectedId: DistrictId;
  onSelectDistrict: (id: DistrictId) => void;
  gradCamZones?: GradCamZone[];
  onOpenXai?: (district: District) => void;
  initialTile?: MapTileStyle;
  userLocation?: [number, number] | null;
}) {
  const mapElement = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Record<string, L.Marker>>({});
  const heatmapLayerRef = useRef<L.LayerGroup | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const lastFocusedIdRef = useRef<DistrictId | null>(null);
  const baseTileLayerRef = useRef<L.TileLayer | null>(null);
  const labelTileLayerRef = useRef<L.TileLayer | null>(null);

  const [tileStyle, setTileStyle] = useState<MapTileStyle>(initialTile);
  const [activeOverlay, setActiveOverlay] = useState<AtmosphericOverlay>("all");

  // Initialize Map
  useEffect(() => {
    if (!mapElement.current || mapRef.current) return;

    // Center over Himachal / Northern India with view covering Himalayas & NER
    const map = L.map(mapElement.current, {
      zoomControl: false,
      attributionControl: false,
      minZoom: 3,
      maxZoom: 21,
    }).setView([31.9, 77.2], 7);

    L.control.zoom({ position: "bottomright" }).addTo(map);
    L.control.scale({ position: "bottomleft", imperial: false, metric: true, maxWidth: 100 }).addTo(map);

    const getTileConfig = (style: MapTileStyle) => {
      if (style === "street") {
        return {
          url: "https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}",
          subdomains: ["0", "1", "2", "3"],
          attribution: "Google Maps",
        };
      }
      if (style === "topo") {
        return {
          url: "https://mt{s}.google.com/vt/lyrs=p&x={x}&y={y}&z={z}",
          subdomains: ["0", "1", "2", "3"],
          attribution: "Google Maps Terrain",
        };
      }
      return {
        url: "https://mt{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}",
        subdomains: ["0", "1", "2", "3"],
        attribution: "Google Maps Satellite Hybrid",
      };
    };

    const initialConfig = getTileConfig(tileStyle);
    const baseTile = L.tileLayer(initialConfig.url, {
      maxZoom: 21,
      maxNativeZoom: 20,
      subdomains: initialConfig.subdomains,
      attribution: initialConfig.attribution,
    }).addTo(map);
    baseTileLayerRef.current = baseTile;

    const labelsTile = L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png", {
      maxZoom: 21,
      maxNativeZoom: 19,
      subdomains: "abcd",
    }).addTo(map);
    labelTileLayerRef.current = labelsTile;

    const heatLayer = L.layerGroup().addTo(map);
    heatmapLayerRef.current = heatLayer;

    mapRef.current = map;
    lastFocusedIdRef.current = selectedId;

    const t1 = window.setTimeout(() => map.invalidateSize(), 80);
    const t2 = window.setTimeout(() => map.invalidateSize(), 300);

    let resizeObserver: ResizeObserver | null = null;
    if (mapElement.current && typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(() => {
        map.invalidateSize();
      });
      resizeObserver.observe(mapElement.current);
    }

    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      resizeObserver?.disconnect();
      map.remove();
      mapRef.current = null;
      markersRef.current = {};
      heatmapLayerRef.current = null;
    };
  }, []);

  // Reactive Update: Heatmaps & Markers whenever districts, time-step zones or overlay changes!
  useEffect(() => {
    const map = mapRef.current;
    const heatLayer = heatmapLayerRef.current;
    if (!map || !heatLayer) return;

    // Clear previous dynamic layers
    heatLayer.clearLayers();
    Object.values(markersRef.current).forEach((m) => m.remove());
    markersRef.current = {};

    // 1. Render Grad-CAM Saliency Zones if active
    if (activeOverlay === "gradcam" || activeOverlay === "all") {
      gradCamZones.forEach((zone) => {
        // Multi-ring Grad-CAM attention field
        const rings = [zone.radiusMeters * 1.4, zone.radiusMeters, zone.radiusMeters * 0.6];
        rings.forEach((radius, i) => {
          L.circle(zone.center, {
            radius,
            color: zone.heatColor,
            fillColor: zone.heatColor,
            fillOpacity: (zone.intensity * 0.45) / (i + 1),
            weight: i === 2 ? 2 : 0,
            opacity: 0.8,
            dashArray: i === 2 ? "4, 6" : undefined,
          }).addTo(heatLayer);
        });

        // Pulsing Grad-CAM core label
        L.marker(zone.center, {
          icon: L.divIcon({
            className: "gradcam-hotspot-label",
            html: `
              <div class="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-950/80 border border-red-500/80 text-[10px] font-mono text-red-200 shadow-xl backdrop-blur-md whitespace-nowrap pointer-events-none">
                <span class="h-2 w-2 rounded-full bg-red-500 animate-ping"></span>
                <strong>Grad-CAM Core (${(zone.intensity * 100).toFixed(0)}%)</strong>
              </div>
            `,
            iconSize: [140, 24],
            iconAnchor: [70, 12],
          }),
        }).addTo(heatLayer);
      });
    }

    // 2. Render District Heatmap Rings & Markers
    districts.forEach((district) => {
      const color = riskColors[district.risk] || "#10b981";
      const isCritical = district.risk === "Critical";
      const isHigh = district.risk === "High";

      const baseRadius = isCritical ? 34000 : isHigh ? 26000 : district.risk === "Moderate" ? 20000 : 14000;
      const heatOpacity = isCritical ? 0.35 : isHigh ? 0.25 : 0.12;

      // Draw atmospheric concentric influence rings
      [baseRadius * 1.5, baseRadius * 1.15, baseRadius].forEach((radius, index) => {
        L.circle(district.coordinates, {
          radius,
          color,
          fillColor: color,
          fillOpacity: heatOpacity / (index + 1.2),
          weight: index === 2 ? 1.5 : 0,
          opacity: 0.6,
        }).addTo(heatLayer);
      });

      // Display key atmospheric metric on badge
      const displayMetric = district.cloudburstProb
        ? `⚡ ${district.cloudburstProb}% Nowcast`
        : district.cloudTopTemp
        ? `CTT ${district.cloudTopTemp}°C`
        : `${district.risk} (${district.riskIndex.toFixed(2)})`;

      const marker = L.marker(district.coordinates, {
        icon: L.divIcon({
          className: `risk-marker-container risk-marker-${district.risk.toLowerCase()} cursor-pointer`,
          html: `
            <div class="marker-pin-wrapper group">
              <span class="marker-halo ${isCritical ? "animate-ping opacity-75" : ""}"></span>
              <span class="marker-core"></span>
              <div class="marker-label-badge !min-w-[120px] transition-transform duration-200 group-hover:scale-105">
                <strong class="text-white flex items-center justify-between gap-1">
                  <span>${district.name.split(" ")[0]}</span>
                  <span class="text-[9px] font-mono text-emerald-300 font-normal">XAI</span>
                </strong>
                <small class="font-mono ${isCritical ? "text-red-300 font-bold" : "text-zinc-200"}">
                  ${displayMetric}
                </small>
              </div>
            </div>
          `,
          iconSize: [130, 44],
          iconAnchor: [18, 18],
        }),
        keyboard: true,
        title: `${district.name} · ${district.risk} Risk · Click for Tier-3 XAI Verification`,
      }).addTo(map);

      // Tooltip with full atmospheric stats
      const cttText = district.cloudTopTemp !== undefined ? `Cloud Top: ${district.cloudTopTemp}°C` : "";
      const capeText = district.cape !== undefined ? `CAPE: ${district.cape} J/kg` : "";
      const radarText = district.radarReflectivity !== undefined ? `Radar: ${district.radarReflectivity} dBZ` : "";

      marker.bindTooltip(
        `
          <div class="p-1 font-sans">
            <strong class="text-sm block font-serif text-white">${district.name} (${district.state})</strong>
            <span class="text-xs text-amber-300 font-mono block mt-0.5">Threat: ${district.threatCategory || district.risk} · Prob: ${district.cloudburstProb || 0}%</span>
            <div class="text-[11px] font-mono text-zinc-300 mt-1 space-y-0.5 border-t border-white/20 pt-1">
              <div>${cttText} ${radarText ? `· ${radarText}` : ""}</div>
              <div>${capeText} ${district.leadTime ? `· Lead: ${district.leadTime}` : ""}</div>
            </div>
            <small class="text-[10px] text-emerald-400 font-mono block mt-1">▶ Click to inspect Tier-3 Grad-CAM</small>
          </div>
        `,
        { direction: "top", offset: [0, -16], className: "risk-tooltip" }
      );

      marker.on("click", () => {
        onSelectDistrict(district.id);
        if (onOpenXai) onOpenXai(district);
      });

      markersRef.current[district.id] = marker;
    });
  }, [districts, gradCamZones, activeOverlay, onSelectDistrict, onOpenXai]);

  // Update Base Tile Layer when style changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !baseTileLayerRef.current) return;

    map.removeLayer(baseTileLayerRef.current);

    let config = {
      url: "https://mt{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}",
      subdomains: ["0", "1", "2", "3"],
      attribution: "Google Maps Satellite Hybrid",
    };

    if (tileStyle === "street") {
      config = {
        url: "https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}",
        subdomains: ["0", "1", "2", "3"],
        attribution: "Google Maps",
      };
    } else if (tileStyle === "topo") {
      config = {
        url: "https://mt{s}.google.com/vt/lyrs=p&x={x}&y={y}&z={z}",
        subdomains: ["0", "1", "2", "3"],
        attribution: "Google Maps Terrain",
      };
    }

    const newTile = L.tileLayer(config.url, {
      maxZoom: 21,
      maxNativeZoom: 20,
      subdomains: config.subdomains,
      attribution: config.attribution,
    }).addTo(map);

    baseTileLayerRef.current = newTile;

    if (labelTileLayerRef.current) {
      labelTileLayerRef.current.bringToFront();
    }
  }, [tileStyle]);

  // Render User Live GPS Location Marker & Fly To Coordinates
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !userLocation) return;

    if (userMarkerRef.current) {
      map.removeLayer(userMarkerRef.current);
    }

    const userMarker = L.marker(userLocation, {
      icon: L.divIcon({
        className: "user-gps-marker-container",
        html: `
          <div class="marker-pin-wrapper">
            <span class="marker-halo animate-ping bg-blue-500" style="width: 32px; height: 32px; margin-left: -16px; margin-top: -16px;"></span>
            <span class="marker-core bg-blue-500 border-2 border-white" style="width: 16px; height: 16px; margin-left: -8px; margin-top: -8px;"></span>
            <div class="marker-label-badge" style="background: rgba(30, 58, 138, 0.95); border-color: #3b82f6;">
              <strong style="color: #60a5fa;">📍 Your Location</strong>
              <small>${userLocation[0].toFixed(3)}° N, ${userLocation[1].toFixed(3)}° E</small>
            </div>
          </div>
        `,
        iconSize: [120, 42],
        iconAnchor: [8, 8],
      }),
      zIndexOffset: 1000,
    }).addTo(map);

    userMarkerRef.current = userMarker;
    map.flyTo(userLocation, 8.5, { duration: 1.2 });
  }, [userLocation]);

  // Focus Map on Selected District
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
      map.flyTo(selected.coordinates, 8, { duration: 0.8 });
    };
    lastFocusedIdRef.current = selectedId;
    const focusTimer = window.setTimeout(focusMap, 80);
    Object.entries(markersRef.current).forEach(([id, marker]) => marker.setZIndexOffset(id === selectedId ? 900 : 100));
    return () => window.clearTimeout(focusTimer);
  }, [selectedId, districts]);

  return (
    <div className="leaflet-map-shell w-full h-full relative" style={{ width: "100%", height: "100%", minHeight: "360px" }}>
      <div ref={mapElement} className="leaflet-map w-full h-full" style={{ width: "100%", height: "100%", minHeight: "360px", position: "absolute", inset: 0 }} />

      {/* Atmospheric Overlays Selector */}
      <div className="absolute top-3 left-3 z-[400] flex flex-wrap items-center gap-1.5 p-1.5 rounded-xl bg-black/60 backdrop-blur-xl border border-white/15 shadow-xl">
        <span className="text-[10px] font-mono text-zinc-400 px-2 uppercase tracking-wider font-semibold">
          LAYERS:
        </span>
        <button
          type="button"
          onClick={() => setActiveOverlay("all")}
          className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition-all cursor-pointer ${
            activeOverlay === "all" ? "bg-emerald-500 text-black font-bold shadow-md" : "text-zinc-300 hover:bg-white/10"
          }`}
        >
          Composite All
        </button>
        <button
          type="button"
          onClick={() => setActiveOverlay("gradcam")}
          className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition-all cursor-pointer ${
            activeOverlay === "gradcam" ? "bg-red-500 text-white font-bold shadow-md" : "text-zinc-300 hover:bg-white/10"
          }`}
        >
          🧠 Grad-CAM Heatmap
        </button>
        <button
          type="button"
          onClick={() => setActiveOverlay("radar")}
          className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition-all cursor-pointer ${
            activeOverlay === "radar" ? "bg-amber-500 text-black font-bold shadow-md" : "text-zinc-300 hover:bg-white/10"
          }`}
        >
          📡 Doppler dBZ
        </button>
      </div>

      {/* Base Map Style Switcher (Street / Topo / Satellite) */}
      <div className="map-layer-selector">
        <button
          type="button"
          onClick={() => setTileStyle("satellite")}
          className={`layer-btn ${tileStyle === "satellite" ? "active" : ""}`}
          title="High-Res Hybrid Satellite Imagery"
        >
          🛰️ Satellite Hybrid
        </button>
        <button
          type="button"
          onClick={() => setTileStyle("topo")}
          className={`layer-btn ${tileStyle === "topo" ? "active" : ""}`}
          title="Topographic Terrain Map - Mountain & Slope Relief"
        >
          🏔️ CartoDEM 30m Topo
        </button>
        <button
          type="button"
          onClick={() => setTileStyle("street")}
          className={`layer-btn ${tileStyle === "street" ? "active" : ""}`}
          title="Street Cartography"
        >
          🗺️ Street Map
        </button>
      </div>

      {/* Weather & Cloudburst Early Warning Legend */}
      <div className="map-legend !bg-black/75 !backdrop-blur-md !border-white/15">
        <span className="font-mono text-[10px] text-zinc-400 uppercase tracking-wider mr-1 hidden sm:inline">
          Threat Thresholds:
        </span>
        <span><i className="legend-dot legend-low" /> Advisory (CAPE &lt; 1500)</span>
        <span><i className="legend-dot legend-moderate" /> Watch (CAPE 1500-2200)</span>
        <span><i className="legend-dot legend-high" /> Warning (Radar &gt; 45 dBZ)</span>
        <span><i className="legend-dot legend-critical" /> Critical (Cloudburst 88%+)</span>
      </div>

      <div className="map-attribution !bg-black/60 !text-[10px] !text-zinc-400">
        Ethrix-Nowcast · INSAT-3D TIR1 · NCMRWF IMDAA · ISRO CartoDEM
      </div>
    </div>
  );
}

// GeoAlert-NER: Enhanced readable map for citizens and operators with free tile layers (Street, Topo, Satellite)
import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { District, DistrictId } from "@/lib/districtsData";

const riskColors: Record<string, string> = {
  Low: "#6eaa86",
  Moderate: "#d9aa48",
  High: "#ee8b56",
  Critical: "#d75d52",
};

export type MapTileStyle = "street" | "topo" | "satellite";

export default function GeoRiskMap({
  districts,
  selectedId,
  onSelectDistrict,
  initialTile = "satellite",
  userLocation,
}: {
  districts: District[];
  selectedId: DistrictId;
  onSelectDistrict: (id: DistrictId) => void;
  initialTile?: MapTileStyle;
  userLocation?: [number, number] | null;
}) {
  const mapElement = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Record<string, L.Marker>>({});
  const userMarkerRef = useRef<L.Marker | null>(null);
  const lastFocusedIdRef = useRef<DistrictId | null>(null);
  const baseTileLayerRef = useRef<L.TileLayer | null>(null);
  const labelTileLayerRef = useRef<L.TileLayer | null>(null);

  const [tileStyle, setTileStyle] = useState<MapTileStyle>(initialTile);

  // Initialize Map
  useEffect(() => {
    if (!mapElement.current || mapRef.current) return;

    const map = L.map(mapElement.current, {
      zoomControl: false,
      attributionControl: false,
      minZoom: 3,
      maxZoom: 21,
    }).setView([26.2, 93.4], 5.8);

    L.control.zoom({ position: "bottomright" }).addTo(map);
    L.control.scale({ position: "bottomleft", imperial: false, metric: true, maxWidth: 100 }).addTo(map);

    // Initial Tile Layer based on tileStyle
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
      // Satellite Hybrid: Satellite + Villages + Roads + State/District Borders
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

    // Additional contrast Overlay Labels layer for crystal clear reading
    const labelsTile = L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png", {
      maxZoom: 21,
      maxNativeZoom: 19,
      subdomains: "abcd",
    }).addTo(map);
    labelTileLayerRef.current = labelsTile;

    const heatmapLayer = L.layerGroup().addTo(map);

    districts.forEach((district) => {
      const color = riskColors[district.risk];
      const baseRadius = district.risk === "Critical" ? 36000 : district.risk === "High" ? 27000 : district.risk === "Moderate" ? 22000 : 15000;
      const heatOpacity = district.risk === "Critical" ? 0.18 : district.risk === "High" ? 0.15 : district.risk === "Moderate" ? 0.11 : 0.08;

      [baseRadius * 1.5, baseRadius * 1.18, baseRadius].forEach((radius, index) =>
        L.circle(district.coordinates, {
          radius,
          color,
          fillColor: color,
          fillOpacity: heatOpacity / (index + 1),
          weight: index === 2 ? 1.25 : 0,
          opacity: 0.5,
        }).addTo(heatmapLayer)
      );

      // Marker with clear HTML label badge for instant reading by normal users
      const marker = L.marker(district.coordinates, {
        icon: L.divIcon({
          className: `risk-marker-container risk-marker-${district.risk.toLowerCase()}`,
          html: `
            <div class="marker-pin-wrapper">
              <span class="marker-halo"></span>
              <span class="marker-core"></span>
              <div class="marker-label-badge">
                <strong>${district.name}</strong>
                <small>${district.risk} (${district.riskIndex.toFixed(2)})</small>
              </div>
            </div>
          `,
          iconSize: [110, 42],
          iconAnchor: [17, 17],
        }),
        keyboard: true,
        title: `${district.name} · ${district.risk} risk`,
      }).addTo(map);

      marker.bindTooltip(
        `<strong>${district.name} (${district.state})</strong><br /><span>Risk Level: ${district.risk} · Index: ${district.riskIndex.toFixed(2)}</span><br /><small>${district.action}</small>`,
        { direction: "top", offset: [0, -14], className: "risk-tooltip" }
      );

      marker.on("click", () => onSelectDistrict(district.id));
      markersRef.current[district.id] = marker;
    });

    mapRef.current = map;
    lastFocusedIdRef.current = selectedId;

    const t1 = window.setTimeout(() => map.invalidateSize(), 60);
    const t2 = window.setTimeout(() => map.invalidateSize(), 250);
    const t3 = window.setTimeout(() => map.invalidateSize(), 600);

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
      window.clearTimeout(t3);
      resizeObserver?.disconnect();
      map.remove();
      mapRef.current = null;
      markersRef.current = {};
    };
  }, []);

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
      map.flyTo(selected.coordinates, 6.3, { duration: 0.65 });
    };
    lastFocusedIdRef.current = selectedId;
    const focusTimer = window.setTimeout(focusMap, 80);
    Object.entries(markersRef.current).forEach(([id, marker]) => marker.setZIndexOffset(id === selectedId ? 900 : 100));
    return () => window.clearTimeout(focusTimer);
  }, [selectedId, districts]);

  return (
    <div className="leaflet-map-shell w-full h-full relative" style={{ width: "100%", height: "100%", minHeight: "280px" }}>
      <div ref={mapElement} className="leaflet-map w-full h-full" style={{ width: "100%", height: "100%", minHeight: "280px", position: "absolute", inset: 0 }} />

      {/* Free Interactive Layer Switcher (Street / Topo / Satellite) */}
      <div className="map-layer-selector">
        <button
          type="button"
          onClick={() => setTileStyle("street")}
          className={`layer-btn ${tileStyle === "street" ? "active" : ""}`}
          title="Normal Street Map - Easy to read for everyone"
        >
          🗺️ Street (Normal)
        </button>
        <button
          type="button"
          onClick={() => setTileStyle("topo")}
          className={`layer-btn ${tileStyle === "topo" ? "active" : ""}`}
          title="Topographic Terrain Map - Mountain & Slope Relief"
        >
          🏔️ Topo / Terrain
        </button>
        <button
          type="button"
          onClick={() => setTileStyle("satellite")}
          className={`layer-btn ${tileStyle === "satellite" ? "active" : ""}`}
          title="Satellite Aerial View"
        >
          🛰️ Satellite
        </button>
      </div>

      {/* Map Legend */}
      <div className="map-legend">
        <span><i className="legend-dot legend-low" /> Safe</span>
        <span><i className="legend-dot legend-moderate" /> Moderate</span>
        <span><i className="legend-dot legend-high" /> High</span>
        <span><i className="legend-dot legend-critical" /> Critical</span>
      </div>
      <div className="map-attribution">OpenStreetMap · CartoDB · Esri</div>
    </div>
  );
}


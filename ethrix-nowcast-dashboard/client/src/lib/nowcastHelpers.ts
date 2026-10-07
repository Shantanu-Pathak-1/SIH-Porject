// GeoAlert-NER style: pure signal helpers keep the live console deterministic enough to test while the UI remains dynamic.
export type TrendKind = "rain" | "soil";
export type TrendRange = "7d" | "24h";

export function clampTelemetry(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function trendSeries(value: number, kind: TrendKind, seed: number, range: TrendRange = "7d") {
  const offsetsByRange: Record<TrendRange, Record<TrendKind, number[]>> = {
    "7d": {
      rain: [-24, -12, -18, -4, 8, 15, 0],
      soil: [-13, -9, -7, -2, 4, 7, 0],
    },
    "24h": {
      rain: [-17, -8, 2, 15, 27, 11, 0],
      soil: [-10, -5, 1, 9, 14, 6, 0],
    },
  };
  const offsets = offsetsByRange[range][kind];
  const amplitude = range === "24h" ? (kind === "rain" ? 3 : 1.5) : (kind === "rain" ? 4 : 2);
  const floor = kind === "rain" ? 15 : 18;
  return offsets.map((offset, index) => Math.max(floor, Math.round(value + offset + Math.sin(index + seed) * amplitude)));
}

import type { MapPosition } from './geo';

export type LngLat = [longitude: number, latitude: number];

export type PolygonGeometry = {
  type: 'Polygon';
  coordinates: LngLat[][];
};

export type PolygonResult = { ok: true; polygon: PolygonGeometry } | { ok: false; error: string };

const earthRadiusMeters = 6378137;
const coordinatePrecision = 1e7;

function round(value: number): number {
  return Math.round(value * coordinatePrecision) / coordinatePrecision;
}

function samePoint(a: LngLat, b: LngLat): boolean {
  return a[0] === b[0] && a[1] === b[1];
}

function closeRing(ring: LngLat[]): LngLat[] {
  const deduplicated = ring.filter(
    (point, index) => index === 0 || !samePoint(point, ring[index - 1]),
  );
  const first = deduplicated[0];
  const last = deduplicated[deduplicated.length - 1];
  return first && last && !samePoint(first, last) ? [...deduplicated, first] : deduplicated;
}

function orientation(a: LngLat, b: LngLat, c: LngLat): number {
  const value = (b[1] - a[1]) * (c[0] - b[0]) - (b[0] - a[0]) * (c[1] - b[1]);
  return Math.abs(value) < 1e-15 ? 0 : value > 0 ? 1 : 2;
}

function onSegment(a: LngLat, b: LngLat, c: LngLat): boolean {
  return (
    b[0] <= Math.max(a[0], c[0]) &&
    b[0] >= Math.min(a[0], c[0]) &&
    b[1] <= Math.max(a[1], c[1]) &&
    b[1] >= Math.min(a[1], c[1])
  );
}

function segmentsIntersect(p1: LngLat, q1: LngLat, p2: LngLat, q2: LngLat): boolean {
  const o1 = orientation(p1, q1, p2);
  const o2 = orientation(p1, q1, q2);
  const o3 = orientation(p2, q2, p1);
  const o4 = orientation(p2, q2, q1);
  if (o1 !== o2 && o3 !== o4) return true;
  return (
    (o1 === 0 && onSegment(p1, p2, q1)) ||
    (o2 === 0 && onSegment(p1, q2, q1)) ||
    (o3 === 0 && onSegment(p2, p1, q2)) ||
    (o4 === 0 && onSegment(p2, q1, q2))
  );
}

function ringSelfIntersects(ring: LngLat[]): boolean {
  const segments = ring.length - 1;
  for (let i = 0; i < segments; i += 1) {
    for (let j = i + 1; j < segments; j += 1) {
      const adjacent = j === i + 1 || (i === 0 && j === segments - 1);
      if (!adjacent && segmentsIntersect(ring[i], ring[i + 1], ring[j], ring[j + 1])) return true;
    }
  }
  return false;
}

function readPoint(value: unknown): LngLat | null {
  if (!Array.isArray(value) || value.length < 2) return null;
  const [longitude, latitude] = value;
  if (typeof longitude !== 'number' || typeof latitude !== 'number') return null;
  if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) return null;
  return [longitude, latitude];
}

export function normalizePolygonCoordinates(coordinates: unknown): PolygonResult {
  if (!Array.isArray(coordinates) || coordinates.length === 0) {
    return { ok: false, error: 'The polygon has no coordinates.' };
  }
  const rings: LngLat[][] = [];
  for (const [ringIndex, rawRing] of coordinates.entries()) {
    if (!Array.isArray(rawRing))
      return { ok: false, error: 'The polygon coordinates are malformed.' };
    const points: LngLat[] = [];
    for (const rawPoint of rawRing) {
      const point = readPoint(rawPoint);
      if (!point) return { ok: false, error: 'The polygon contains malformed coordinates.' };
      if (Math.abs(point[0]) > 180 || Math.abs(point[1]) > 90) {
        return {
          ok: false,
          error: 'Coordinates must be longitude and latitude in WGS 84 (EPSG:4326).',
        };
      }
      points.push([round(point[0]), round(point[1])]);
    }
    const ring = closeRing(points);
    const distinct = new Set(ring.slice(0, -1).map((point) => point.join(','))).size;
    if (distinct < 3) {
      return {
        ok: false,
        error:
          ringIndex === 0
            ? 'The boundary needs at least three distinct points.'
            : 'A hole in the boundary needs at least three distinct points.',
      };
    }
    if (ringSelfIntersects(ring)) {
      return { ok: false, error: 'The boundary crosses itself. Adjust the points and try again.' };
    }
    rings.push(ring);
  }
  return { ok: true, polygon: { type: 'Polygon', coordinates: rings } };
}

export function polygonFromPositions(rings: MapPosition[][]): PolygonResult {
  return normalizePolygonCoordinates(
    rings.map((ring) => ring.map(([latitude, longitude]) => [longitude, latitude])),
  );
}

function ringAreaSquareMeters(ring: LngLat[]): number {
  let sum = 0;
  for (let index = 0; index < ring.length - 1; index += 1) {
    const [lon1, lat1] = ring[index];
    const [lon2, lat2] = ring[index + 1];
    sum +=
      (((lon2 - lon1) * Math.PI) / 180) *
      (2 + Math.sin((lat1 * Math.PI) / 180) + Math.sin((lat2 * Math.PI) / 180));
  }
  return Math.abs((sum * earthRadiusMeters * earthRadiusMeters) / 2);
}

export function estimatePolygonAreaHectares(polygon: PolygonGeometry): number {
  const [outer, ...holes] = polygon.coordinates;
  if (!outer) return 0;
  const squareMeters =
    ringAreaSquareMeters(outer) - holes.reduce((sum, hole) => sum + ringAreaSquareMeters(hole), 0);
  return Math.max(0, squareMeters / 10_000);
}

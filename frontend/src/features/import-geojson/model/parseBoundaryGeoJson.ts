import {
  normalizePolygonCoordinates,
  type PolygonGeometry,
  type PolygonResult,
} from '@/shared/lib/polygon';

export type BoundaryImport = { ok: true; boundary: PolygonGeometry } | { ok: false; error: string };

type GeoJsonObject = { type?: unknown; [key: string]: unknown };

const maxFileBytes = 5 * 1024 * 1024;

function isObject(value: unknown): value is GeoJsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function geometryFromFeature(feature: GeoJsonObject): GeoJsonObject | string {
  if (!isObject(feature.geometry)) return 'The feature in this file has no geometry.';
  return feature.geometry;
}

function singleGeometry(data: unknown): GeoJsonObject | string {
  if (!isObject(data) || typeof data.type !== 'string') {
    return 'This file is not GeoJSON. Export the boundary as a GeoJSON Polygon.';
  }
  if (data.type === 'Feature') return geometryFromFeature(data);
  if (data.type === 'FeatureCollection') {
    const features = Array.isArray(data.features) ? data.features.filter(isObject) : [];
    if (features.length === 0) return 'This file contains no features.';
    if (features.length > 1) {
      return `This file contains ${features.length} features. Import a file with exactly one field boundary.`;
    }
    return geometryFromFeature(features[0]);
  }
  return data;
}

function toResult(result: PolygonResult): BoundaryImport {
  return result.ok ? { ok: true, boundary: result.polygon } : result;
}

export function parseBoundaryGeoJson(text: string): BoundaryImport {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return { ok: false, error: 'This file is not valid JSON.' };
  }

  const geometry = singleGeometry(data);
  if (typeof geometry === 'string') return { ok: false, error: geometry };

  switch (geometry.type) {
    case 'Polygon':
      return toResult(normalizePolygonCoordinates(geometry.coordinates));
    case 'MultiPolygon':
      return {
        ok: false,
        error: 'MultiPolygon boundaries are not supported. Export a single Polygon instead.',
      };
    case 'Point':
    case 'MultiPoint':
    case 'LineString':
    case 'MultiLineString':
    case 'GeometryCollection':
      return {
        ok: false,
        error: `A ${geometry.type} cannot be used as a field boundary. Import a Polygon.`,
      };
    default:
      return { ok: false, error: 'This file does not contain a supported GeoJSON geometry.' };
  }
}

export async function readBoundaryFile(file: File): Promise<BoundaryImport> {
  if (file.size > maxFileBytes) {
    return { ok: false, error: 'This file is larger than 5 MB. Import a single field boundary.' };
  }
  try {
    return parseBoundaryGeoJson(await file.text());
  } catch {
    return { ok: false, error: 'This file could not be read.' };
  }
}

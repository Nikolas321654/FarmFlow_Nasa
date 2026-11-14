import {
  FIELD_AREA_MAX_HECTARES,
  FIELD_AREA_MIN_HECTARES,
  UNSUPPORTED_SOUTH_OF_LATITUDE,
} from '@/shared/config/thresholds';
import { estimatePolygonAreaHectares, type PolygonGeometry } from '@/shared/lib/polygon';

const hectares = new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 });

export function formatHectares(value: number): string {
  return `${hectares.format(value)} ha`;
}

export function boundaryRuleError(boundary: PolygonGeometry): string | null {
  const reachesAntarctica = boundary.coordinates.some((ring) =>
    ring.some(([, latitude]) => latitude < UNSUPPORTED_SOUTH_OF_LATITUDE),
  );
  if (reachesAntarctica) {
    return 'Fields south of 60°S are not supported. NASA soil data is not available there.';
  }
  const area = estimatePolygonAreaHectares(boundary);
  if (area < FIELD_AREA_MIN_HECTARES) {
    return `Field area is below the ${formatHectares(FIELD_AREA_MIN_HECTARES)} minimum. Draw a larger boundary.`;
  }
  if (area > FIELD_AREA_MAX_HECTARES) {
    return `Field area exceeds the ${formatHectares(FIELD_AREA_MAX_HECTARES)} limit. Reduce the boundary or divide it into smaller fields.`;
  }
  return null;
}

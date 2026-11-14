export type MapPosition = [latitude: number, longitude: number];

export function polygonPositions(boundary: unknown): MapPosition[][] | null {
  if (
    typeof boundary !== 'object' ||
    boundary === null ||
    !('type' in boundary) ||
    boundary.type !== 'Polygon' ||
    !('coordinates' in boundary) ||
    !Array.isArray(boundary.coordinates) ||
    !boundary.coordinates.length
  )
    return null;

  const rings: MapPosition[][] = [];
  for (const ring of boundary.coordinates) {
    if (!Array.isArray(ring) || ring.length < 4) return null;
    const positions: MapPosition[] = [];
    for (const point of ring) {
      if (!Array.isArray(point) || point.length < 2) return null;
      const [longitude, latitude] = point;
      if (
        !Number.isFinite(longitude) ||
        !Number.isFinite(latitude) ||
        Math.abs(longitude) > 180 ||
        Math.abs(latitude) > 90
      )
        return null;
      positions.push([latitude, longitude]);
    }
    const first = positions[0];
    const last = positions.at(-1);
    if (!first || !last || first[0] !== last[0] || first[1] !== last[1]) return null;
    if (new Set(positions.slice(0, -1).map((point) => point.join(','))).size < 3) return null;
    rings.push(positions);
  }
  return rings;
}

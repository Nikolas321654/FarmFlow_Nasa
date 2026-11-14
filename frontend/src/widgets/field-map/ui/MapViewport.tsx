import { latLngBounds } from 'leaflet';
import { useEffect, useRef } from 'react';
import { useMapEvents } from 'react-leaflet';
import type { MapPosition } from '@/shared/lib/geo';

type MapViewportProps = {
  positions: MapPosition[][][];
  selectedPositions: MapPosition[][] | null;
  selectedFieldId: string | null;
  overviewRequest: number;
  onZoomChange: (zoom: number) => void;
  onOverviewAvailabilityChange: (available: boolean) => void;
};

export function MapViewport({
  positions,
  selectedPositions,
  selectedFieldId,
  overviewRequest,
  onZoomChange,
  onOverviewAvailabilityChange,
}: MapViewportProps) {
  const map = useMapEvents({
    zoomend: () => onZoomChange(map.getZoom()),
    moveend: () => {
      const allPoints = positions.flat(2);
      if (allPoints.length) {
        onOverviewAvailabilityChange(!map.getBounds().contains(latLngBounds(allPoints)));
      }
    },
  });
  const fittedInitially = useRef(false);
  const previousSelection = useRef<string | null>(null);
  const previousOverviewRequest = useRef(overviewRequest);

  useEffect(() => {
    const resizeObserver = new ResizeObserver(() => map.invalidateSize());
    resizeObserver.observe(map.getContainer());
    return () => resizeObserver.disconnect();
  }, [map]);

  useEffect(() => {
    const overviewChanged = previousOverviewRequest.current !== overviewRequest;
    const selectionChanged = previousSelection.current !== selectedFieldId;
    previousOverviewRequest.current = overviewRequest;
    previousSelection.current = selectedFieldId;

    const allPoints = positions.flat(2);
    const selectedPoints = selectedPositions?.flat() ?? [];
    const points = selectedFieldId && selectedPoints.length ? selectedPoints : allPoints;
    if (!points.length) return;
    if (!fittedInitially.current || overviewChanged || selectionChanged) {
      map.fitBounds(latLngBounds(points), { padding: [32, 32], maxZoom: 16, animate: false });
      fittedInitially.current = true;
    }
  }, [map, overviewRequest, positions, selectedFieldId, selectedPositions]);

  return null;
}

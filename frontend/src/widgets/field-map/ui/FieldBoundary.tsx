import type { Polygon as LeafletPolygon } from 'leaflet';
import { useEffect, useRef } from 'react';
import { Polygon, Tooltip } from 'react-leaflet';
import type { FieldSummary } from '@/entities/field';
import type { MapPosition } from '@/shared/lib/geo';
import { statusColor } from '../model/status';

type FieldBoundaryProps = {
  field: FieldSummary;
  positions: MapPosition[][];
  selected: boolean;
  onSelect: (id: string) => void;
};

export function FieldBoundary({ field, positions, selected, onSelect }: FieldBoundaryProps) {
  const polygon = useRef<LeafletPolygon>(null);
  const color = statusColor[field.workabilityStatus] ?? '#626960';

  useEffect(() => {
    const element = polygon.current?.getElement();
    if (!element) return;
    element.setAttribute('role', 'button');
    element.setAttribute('tabindex', '0');
    element.setAttribute('aria-label', `${field.name}, ${field.workabilityStatus} workability`);
    const onKeyDown = (event: Event) => {
      if (!(event instanceof KeyboardEvent)) return;
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        onSelect(field.id);
      }
    };
    element.addEventListener('keydown', onKeyDown);
    return () => element.removeEventListener('keydown', onKeyDown);
  }, [field.id, field.name, field.workabilityStatus, onSelect]);

  return (
    <Polygon
      ref={polygon}
      positions={positions}
      pathOptions={{
        color: selected ? '#101D17' : color,
        fillColor: color,
        fillOpacity: selected ? 0.33 : 0.25,
        weight: selected ? 4 : 3,
      }}
      eventHandlers={{ click: () => onSelect(field.id) }}
    >
      <Tooltip sticky permanent={selected} direction="top">
        {field.name} · {field.workabilityStatus} workability
      </Tooltip>
    </Polygon>
  );
}

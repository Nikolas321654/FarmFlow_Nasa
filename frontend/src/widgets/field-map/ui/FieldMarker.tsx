import type { CircleMarker as LeafletCircleMarker } from 'leaflet';
import { useEffect, useRef } from 'react';
import { CircleMarker, Tooltip } from 'react-leaflet';
import type { FieldSummary } from '@/entities/field';
import { statusColor } from '../model/status';

type FieldMarkerProps = {
  field: FieldSummary;
  selected: boolean;
  onSelect: (id: string) => void;
};

export function FieldMarker({ field, selected, onSelect }: FieldMarkerProps) {
  const marker = useRef<LeafletCircleMarker>(null);
  const color = statusColor[field.workabilityStatus] ?? '#626960';

  useEffect(() => {
    const element = marker.current?.getElement();
    if (!element) return;
    element.setAttribute('role', 'button');
    element.setAttribute('tabindex', '0');
    element.setAttribute(
      'aria-label',
      `Show ${field.name}, ${field.workabilityStatus} workability`,
    );
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
    <CircleMarker
      ref={marker}
      center={[field.centroidLat, field.centroidLon]}
      radius={13}
      pathOptions={{
        color: selected ? '#101D17' : '#FCF9F5',
        weight: 3,
        fillColor: color,
        fillOpacity: 1,
      }}
      eventHandlers={{ click: () => onSelect(field.id) }}
    >
      <Tooltip direction="top" permanent={selected}>
        {field.name} · {field.workabilityStatus} workability
      </Tooltip>
    </CircleMarker>
  );
}

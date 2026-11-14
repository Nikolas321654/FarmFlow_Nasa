import type { Polygon as LeafletPolygon } from 'leaflet';
import { useEffect, useRef } from 'react';
import { Polygon, Tooltip } from 'react-leaflet';
import type { FieldSummary } from '@/entities/field';
import type { MapPosition } from '@/shared/lib/geo';
import { appearanceFor } from '../model/status';

type FieldBoundaryProps = {
  field: FieldSummary;
  positions: MapPosition[][];
  selected: boolean;
  hovered: boolean;
  onSelect: (id: string) => void;
  onHover: (id: string | null) => void;
};

export function FieldBoundary({
  field,
  positions,
  selected,
  hovered,
  onSelect,
  onHover,
}: FieldBoundaryProps) {
  const polygon = useRef<LeafletPolygon>(null);
  const color = appearanceFor(field.workabilityStatus).color;

  useEffect(() => {
    const element = polygon.current?.getElement();
    if (!element) return;
    element.setAttribute('role', 'button');
    element.setAttribute('tabindex', '0');
    element.setAttribute(
      'aria-label',
      `${field.name}, ${field.workabilityStatus} workability. Select field`,
    );
    const onKeyDown = (event: Event) => {
      if (!(event instanceof KeyboardEvent)) return;
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        onSelect(field.id);
      }
    };
    const onFocus = () => polygon.current?.openTooltip();
    const onBlur = () => polygon.current?.closeTooltip();
    element.addEventListener('keydown', onKeyDown);
    element.addEventListener('focus', onFocus);
    element.addEventListener('blur', onBlur);
    return () => {
      element.removeEventListener('keydown', onKeyDown);
      element.removeEventListener('focus', onFocus);
      element.removeEventListener('blur', onBlur);
    };
  }, [field.id, field.name, field.workabilityStatus, onSelect]);

  return (
    <Polygon
      ref={polygon}
      positions={positions}
      pathOptions={{
        color: selected ? '#101D17' : color,
        fillColor: color,
        fillOpacity: selected ? 0.29 : hovered ? 0.31 : 0.23,
        weight: selected || hovered ? 4 : 3,
      }}
      eventHandlers={{
        click: () => onSelect(field.id),
        mouseover: () => onHover(field.id),
        mouseout: () => onHover(null),
      }}
    >
      <Tooltip direction="top" className="rivnova-field-tooltip">
        {field.name}
      </Tooltip>
    </Polygon>
  );
}

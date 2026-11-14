import { faExclamation } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { divIcon, type Marker as LeafletMarker } from 'leaflet';
import { useEffect, useMemo, useRef } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Marker, Tooltip } from 'react-leaflet';
import type { FieldSummary } from '@/entities/field';
import { appearanceFor } from '../model/status';

type FieldMarkerProps = {
  field: FieldSummary;
  selected: boolean;
  hovered: boolean;
  onSelect: (id: string) => void;
  onHover: (id: string | null) => void;
};

export function FieldMarker({ field, selected, hovered, onSelect, onHover }: FieldMarkerProps) {
  const marker = useRef<LeafletMarker>(null);
  const appearance = appearanceFor(field.workabilityStatus);
  const hasAlert = field.hasActiveStressAlert || field.hasBiomassAnomaly;
  const icon = useMemo(
    () =>
      divIcon({
        className: 'rivnova-field-marker',
        html: renderToStaticMarkup(
          <span
            className="rivnova-field-marker__symbol"
            style={{ backgroundColor: appearance.color }}
          >
            <FontAwesomeIcon icon={appearance.icon} aria-hidden="true" />
            {hasAlert && (
              <span className="rivnova-field-marker__alert" aria-hidden="true">
                <FontAwesomeIcon icon={faExclamation} />
              </span>
            )}
          </span>,
        ),
        iconSize: [36, 36],
        iconAnchor: [18, 18],
        tooltipAnchor: [0, -20],
      }),
    [appearance.color, appearance.icon, hasAlert],
  );

  useEffect(() => {
    marker.current
      ?.getElement()
      ?.classList.toggle('rivnova-field-marker--active', selected || hovered);
  }, [hovered, selected]);

  useEffect(() => {
    const element = marker.current?.getElement();
    if (!element) return;
    element.setAttribute('role', 'button');
    element.setAttribute(
      'aria-label',
      `${field.name}, ${field.workabilityStatus} workability${hasAlert ? ', additional alert' : ''}. Select field`,
    );
    const onKeyDown = (event: Event) => {
      if (!(event instanceof KeyboardEvent)) return;
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        onSelect(field.id);
      }
    };
    const onFocus = () => marker.current?.openTooltip();
    const onBlur = () => marker.current?.closeTooltip();
    element.addEventListener('keydown', onKeyDown);
    element.addEventListener('focus', onFocus);
    element.addEventListener('blur', onBlur);
    return () => {
      element.removeEventListener('keydown', onKeyDown);
      element.removeEventListener('focus', onFocus);
      element.removeEventListener('blur', onBlur);
    };
  }, [field.id, field.name, field.workabilityStatus, hasAlert, onSelect]);

  return (
    <Marker
      ref={marker}
      position={[field.centroidLat, field.centroidLon]}
      icon={icon}
      keyboard
      zIndexOffset={selected ? 1000 : hovered ? 500 : 0}
      eventHandlers={{
        click: () => onSelect(field.id),
        mouseover: () => onHover(field.id),
        mouseout: () => onHover(null),
      }}
    >
      <Tooltip direction="top" className="rivnova-field-tooltip">
        {field.name}
      </Tooltip>
    </Marker>
  );
}

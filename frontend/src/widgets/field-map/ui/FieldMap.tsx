import { faArrowsToCircle, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useMemo, useState, type ReactNode } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './fieldMap.css';
import type { FieldSummary } from '@/entities/field';
import { env } from '@/shared/config/env';
import { polygonPositions } from '@/shared/lib/geo';
import { Button } from '@/shared/ui';
import { statusAppearance } from '../model/status';
import { FieldBoundary } from './FieldBoundary';
import { FieldMarker } from './FieldMarker';
import { MapViewport } from './MapViewport';

type FieldMapProps = {
  fields: FieldSummary[];
  selectedFieldId: string | null;
  hoveredFieldId: string | null;
  onSelectField: (id: string | null) => void;
  onHoverField: (id: string | null) => void;
  loading?: boolean;
  error?: boolean;
  controls?: ReactNode;
};

const legend = Object.entries(statusAppearance) as [
  keyof typeof statusAppearance,
  (typeof statusAppearance)[keyof typeof statusAppearance],
][];

export function FieldMap({
  fields,
  selectedFieldId,
  hoveredFieldId,
  onSelectField,
  onHoverField,
  loading = false,
  error = false,
  controls,
}: FieldMapProps) {
  const [overviewRequest, setOverviewRequest] = useState(0);
  const [tileError, setTileError] = useState(false);
  const [zoom, setZoom] = useState(6);
  const [overviewAvailable, setOverviewAvailable] = useState(false);
  const visibleFields = useMemo(
    () =>
      fields
        .map((field) => ({ field, positions: polygonPositions(field.boundary) }))
        .filter(
          (
            entry,
          ): entry is { field: FieldSummary; positions: NonNullable<typeof entry.positions> } =>
            entry.positions !== null,
        ),
    [fields],
  );
  const invalidCount = fields.length - visibleFields.length;
  const selected = visibleFields.find(({ field }) => field.id === selectedFieldId);
  const hovered = visibleFields.find(({ field }) => field.id === hoveredFieldId);

  const showAllFields = visibleFields.length > 0 && (selectedFieldId !== null || overviewAvailable);

  const showOverview = () => {
    onSelectField(null);
    setOverviewRequest((value) => value + 1);
  };

  return (
    <div className="relative h-full min-h-0 w-full min-w-0 overflow-hidden rounded-control">
      <MapContainer
        center={[48.5, 31.5]}
        zoom={6}
        zoomControl
        attributionControl
        className="relative z-0 h-full w-full"
        scrollWheelZoom
      >
        <TileLayer
          url={env.mapTileUrl}
          attribution={env.mapTileAttribution}
          eventHandlers={{ tileerror: () => setTileError(true) }}
        />
        {visibleFields.map(({ field, positions }) =>
          zoom < 12 &&
          Number.isFinite(field.centroidLat) &&
          Number.isFinite(field.centroidLon) &&
          Math.abs(field.centroidLat) <= 90 &&
          Math.abs(field.centroidLon) <= 180 ? (
            <FieldMarker
              key={field.id}
              field={field}
              selected={field.id === selectedFieldId}
              hovered={field.id === hoveredFieldId}
              onSelect={onSelectField}
              onHover={onHoverField}
            />
          ) : (
            <FieldBoundary
              key={field.id}
              field={field}
              positions={positions}
              selected={field.id === selectedFieldId}
              hovered={field.id === hoveredFieldId}
              onSelect={onSelectField}
              onHover={onHoverField}
            />
          ),
        )}
        <MapViewport
          positions={visibleFields.map(({ positions }) => positions)}
          selectedPositions={selected?.positions ?? null}
          selectedFieldId={selectedFieldId}
          hoveredFieldId={hoveredFieldId}
          hoveredCentroid={hovered ? [hovered.field.centroidLat, hovered.field.centroidLon] : null}
          overviewRequest={overviewRequest}
          onZoomChange={setZoom}
          onOverviewAvailabilityChange={setOverviewAvailable}
        />
      </MapContainer>

      {(showAllFields || controls) && (
        <div className="pointer-events-none absolute left-14 right-4 top-4 z-10 flex flex-wrap justify-end gap-2 [&>*]:pointer-events-auto">
          {showAllFields && (
            <Button variant="secondary" className="shadow-sm" onClick={showOverview}>
              <FontAwesomeIcon icon={faArrowsToCircle} aria-hidden="true" /> All fields
            </Button>
          )}
          {controls}
        </div>
      )}

      <div className="pointer-events-none absolute bottom-7 left-3 z-10 max-w-[calc(100%-1.5rem)] rounded-control border border-border bg-surface px-3 py-2 text-ui-xs text-text-primary sm:bottom-8 sm:left-4">
        <p className="mb-1 text-ui-xs font-semibold">Workability</p>
        <ul className="flex flex-wrap gap-x-3 gap-y-1.5">
          {legend.map(([label, appearance]) => (
            <li key={label} className="flex items-center gap-1.5">
              <span
                className="flex size-4 items-center justify-center rounded-full text-[9px] text-white"
                style={{ backgroundColor: appearance.color }}
                aria-hidden="true"
              >
                <FontAwesomeIcon icon={appearance.icon} />
              </span>
              {label}
            </li>
          ))}
        </ul>
      </div>

      {(loading || error || (!fields.length && !loading) || invalidCount > 0 || tileError) && (
        <div
          role="status"
          className="pointer-events-none absolute left-3 right-3 top-20 z-10 mx-auto max-w-md space-y-1 rounded-control border border-border bg-surface/95 p-3 text-ui-sm text-text-primary shadow-sm"
        >
          {loading && <p>Loading fields…</p>}
          {error && <p>Unable to load fields. Check the backend connection and try again.</p>}
          {!error && !loading && !fields.length && <p>No fields are available yet.</p>}
          {invalidCount > 0 && (
            <p>
              <FontAwesomeIcon icon={faTriangleExclamation} aria-hidden="true" /> {invalidCount}{' '}
              field {invalidCount === 1 ? 'boundary is' : 'boundaries are'} missing or invalid.
            </p>
          )}
          {tileError && (
            <p>Some map tiles could not be loaded. Check the tile provider connection.</p>
          )}
        </div>
      )}
    </div>
  );
}

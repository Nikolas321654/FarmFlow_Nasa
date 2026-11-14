import '../lib/leafletGlobal';
import '@geoman-io/leaflet-geoman-free';
import {
  faCheck,
  faDrawPolygon,
  faPenToSquare,
  faTrashCan,
  faXmark,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  latLngBounds,
  polygon as leafletPolygon,
  type LatLng,
  type Layer,
  type Map as LeafletMap,
  type PathOptions,
  type Polygon as LeafletPolygon,
} from 'leaflet';
import { useEffect, useEffectEvent, useRef, useState } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './drawFieldMap.css';
import { env } from '@/shared/config/env';
import { polygonPositions, type MapPosition } from '@/shared/lib/geo';
import { polygonFromPositions, type PolygonGeometry } from '@/shared/lib/polygon';
import { Button } from '@/shared/ui';

type DrawFieldMapProps = {
  boundary: PolygonGeometry | null;
  onBoundaryChange: (boundary: PolygonGeometry | null) => void;
  onBoundaryError: (message: string) => void;
};

type DrawMode = 'idle' | 'drawing' | 'editing';

const draftStyle: PathOptions = {
  color: '#24543a',
  weight: 3,
  fillColor: '#357646',
  fillOpacity: 0.18,
};

const editingStyle: PathOptions = { ...draftStyle, dashArray: '6 6', fillOpacity: 0.12 };

function layerRings(layer: LeafletPolygon): MapPosition[][] {
  const latLngs = layer.getLatLngs() as LatLng[] | LatLng[][];
  const rings = (Array.isArray(latLngs[0]) ? latLngs : [latLngs]) as LatLng[][];
  return rings.map((ring) => ring.map((point) => [point.lat, point.lng] as MapPosition));
}

export function DrawFieldMap({ boundary, onBoundaryChange, onBoundaryError }: DrawFieldMapProps) {
  const [map, setMap] = useState<LeafletMap | null>(null);
  const [mode, setMode] = useState<DrawMode>('idle');
  const layerRef = useRef<LeafletPolygon | null>(null);
  const emittedRef = useRef<string | null>(null);
  const effectiveMode = mode === 'editing' && !boundary ? 'idle' : mode;

  const commitLayer = (layer: LeafletPolygon) => {
    const result = polygonFromPositions(layerRings(layer));
    if (!result.ok) {
      onBoundaryError(result.error);
      return;
    }
    emittedRef.current = JSON.stringify(result.polygon);
    onBoundaryChange(result.polygon);
  };

  const emitLayer = useEffectEvent(commitLayer);

  const watchLayer = useEffectEvent((layer: LeafletPolygon) => {
    layer.on('pm:edit', () => emitLayer(layer));
  });

  useEffect(() => {
    if (!map) return;
    map.pm.setGlobalOptions({
      allowSelfIntersection: false,
      snappable: false,
      pathOptions: draftStyle,
      templineStyle: { color: '#24543a', weight: 2, dashArray: '6 6' },
      hintlineStyle: { color: '#24543a', weight: 2, dashArray: '2 6', opacity: 0.7 },
    });

    const onCreate = (event: { layer: Layer }) => {
      const created = event.layer as LeafletPolygon;
      layerRef.current?.remove();
      created.setStyle(draftStyle);
      layerRef.current = created;
      watchLayer(created);
      emitLayer(created);
      setMode('idle');
    };
    const onDrawEnd = () => setMode((current) => (current === 'drawing' ? 'idle' : current));

    map.on('pm:create', onCreate);
    map.on('pm:drawend', onDrawEnd);
    return () => {
      map.off('pm:create', onCreate);
      map.off('pm:drawend', onDrawEnd);
      map.pm.disableDraw();
    };
  }, [map]);

  useEffect(() => {
    if (!map) return;
    const serialized = boundary ? JSON.stringify(boundary) : null;
    if (serialized !== null && serialized === emittedRef.current && layerRef.current) return;

    layerRef.current?.pm.disable();
    layerRef.current?.remove();
    layerRef.current = null;
    emittedRef.current = serialized;

    const positions = boundary ? polygonPositions(boundary) : null;
    if (!positions) return;
    const layer = leafletPolygon(positions, draftStyle).addTo(map);
    layerRef.current = layer;
    watchLayer(layer);
    map.fitBounds(latLngBounds(positions.flat()), { padding: [48, 48], maxZoom: 17 });
  }, [map, boundary]);

  const startDrawing = () => {
    if (!map) return;
    layerRef.current?.pm.disable();
    map.pm.enableDraw('Polygon');
    setMode('drawing');
  };

  const cancelDrawing = () => {
    map?.pm.disableDraw();
    setMode('idle');
  };

  const toggleEditing = () => {
    const layer = layerRef.current;
    if (!layer) return;
    if (effectiveMode === 'editing') {
      layer.pm.disable();
      layer.setStyle(draftStyle);
      commitLayer(layer);
      setMode('idle');
    } else {
      layer.setStyle(editingStyle);
      layer.pm.enable({ allowSelfIntersection: false });
      setMode('editing');
    }
  };

  const clearBoundary = () => {
    map?.pm.disableDraw();
    setMode('idle');
    onBoundaryChange(null);
  };

  return (
    <div className="rivnova-draw-map relative h-full min-h-0 w-full min-w-0 overflow-hidden rounded-control">
      <MapContainer
        ref={setMap}
        center={[48.5, 31.5]}
        zoom={6}
        scrollWheelZoom
        className="relative z-0 h-full w-full"
      >
        <TileLayer url={env.mapTileUrl} attribution={env.mapTileAttribution} />
      </MapContainer>

      <div className="pointer-events-none absolute left-14 right-3 top-3 z-10 flex flex-wrap justify-end gap-2 [&>*]:pointer-events-auto">
        {effectiveMode === 'drawing' ? (
          <Button variant="secondary" className="shadow-sm" onClick={cancelDrawing}>
            <FontAwesomeIcon icon={faXmark} aria-hidden="true" />
            Cancel drawing
          </Button>
        ) : (
          <>
            {boundary && (
              <>
                <Button variant="secondary" className="shadow-sm" onClick={toggleEditing}>
                  <FontAwesomeIcon
                    icon={effectiveMode === 'editing' ? faCheck : faPenToSquare}
                    aria-hidden="true"
                  />
                  {effectiveMode === 'editing' ? 'Done editing' : 'Edit points'}
                </Button>
                <Button
                  variant="secondary"
                  className="shadow-sm"
                  onClick={clearBoundary}
                  disabled={effectiveMode === 'editing'}
                >
                  <FontAwesomeIcon icon={faTrashCan} aria-hidden="true" />
                  Clear
                </Button>
              </>
            )}
            {effectiveMode !== 'editing' && (
              <Button className="shadow-sm" onClick={startDrawing}>
                <FontAwesomeIcon icon={faDrawPolygon} aria-hidden="true" />
                {boundary ? 'Redraw' : 'Draw boundary'}
              </Button>
            )}
          </>
        )}
      </div>

      {effectiveMode !== 'idle' && (
        <p
          role="status"
          className="pointer-events-none absolute inset-x-3 bottom-8 z-10 mx-auto w-fit max-w-[calc(100%-1.5rem)] rounded-control border border-border bg-surface px-3 py-2 text-center text-ui-sm text-text-primary shadow-sm"
        >
          {effectiveMode === 'drawing'
            ? boundary
              ? 'Click to place points. Finish on the first point to replace the current boundary.'
              : 'Click to place points. Finish by clicking the first point.'
            : 'Drag points to adjust the boundary. Right-click a point to remove it.'}
        </p>
      )}
    </div>
  );
}

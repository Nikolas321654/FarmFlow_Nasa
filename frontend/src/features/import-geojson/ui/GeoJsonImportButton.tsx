import { faFileImport } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useId, useRef, useState, type ChangeEvent } from 'react';
import type { PolygonGeometry } from '@/shared/lib/polygon';
import { Button } from '@/shared/ui';
import { readBoundaryFile } from '../model/parseBoundaryGeoJson';

type GeoJsonImportButtonProps = {
  onImport: (boundary: PolygonGeometry, fileName: string) => void;
  disabled?: boolean;
};

export function GeoJsonImportButton({ onImport, disabled = false }: GeoJsonImportButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const errorId = useId();
  const [error, setError] = useState<string | null>(null);
  const [reading, setReading] = useState(false);

  const onFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setReading(true);
    const result = await readBoundaryFile(file);
    setReading(false);
    if (result.ok) {
      setError(null);
      onImport(result.boundary, file.name);
    } else {
      setError(`${file.name}: ${result.error}`);
    }
  };

  return (
    <div className="grid gap-2">
      <input
        ref={inputRef}
        type="file"
        accept=".geojson,.json,application/geo+json,application/json"
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(event) => void onFileChange(event)}
      />
      <Button
        variant="secondary"
        onClick={() => inputRef.current?.click()}
        loading={reading}
        disabled={disabled}
        aria-describedby={error ? errorId : undefined}
        className="w-full"
      >
        {!reading && <FontAwesomeIcon icon={faFileImport} aria-hidden="true" />}
        Import GeoJSON
      </Button>
      {error && (
        <p id={errorId} role="alert" className="text-ui-sm text-status-danger">
          {error}
        </p>
      )}
    </div>
  );
}

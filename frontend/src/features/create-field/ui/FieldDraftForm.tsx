import {
  faCircleCheck,
  faDrawPolygon,
  faFileLines,
  faTriangleExclamation,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useId, type FormEvent, type ReactNode } from 'react';
import { estimatePolygonAreaHectares } from '@/shared/lib/polygon';
import { Button, SelectField, TextField } from '@/shared/ui';
import { formatHectares } from '../model/boundaryRules';
import {
  cropTypes,
  fieldNameMaxLength,
  isCropType,
  type FieldDraft,
  type FieldDraftErrors,
} from '../model/fieldDraft';

type FieldDraftFormProps = {
  draft: FieldDraft;
  errors: FieldDraftErrors;
  onChange: (patch: Partial<FieldDraft>) => void;
  onSubmit: () => void;
  onCancel: () => void;
  saving: boolean;
  checkingSession: boolean;
  submitError: string | null;
  notice?: ReactNode;
  boundaryActions?: ReactNode;
  footer?: ReactNode;
};

function boundaryStatus(draft: FieldDraft): string {
  if (!draft.boundary) return 'No boundary yet';
  if (draft.boundarySource?.kind === 'imported') {
    return `Imported from ${draft.boundarySource.fileName}`;
  }
  return 'Drawn on the map';
}

export function FieldDraftForm({
  draft,
  errors,
  onChange,
  onSubmit,
  onCancel,
  saving,
  checkingSession,
  submitError,
  notice,
  boundaryActions,
  footer,
}: FieldDraftFormProps) {
  const nameId = useId();
  const cropId = useId();
  const dateId = useId();
  const boundaryTitleId = useId();
  const area = draft.boundary ? estimatePolygonAreaHectares(draft.boundary) : null;
  const boundaryInvalid = Boolean(draft.boundary && errors.boundary);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit();
  };

  return (
    <form noValidate onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-5 pb-5 pt-5">
        <h2 className="type-panel-title">New field</h2>
        {notice}

        <section aria-labelledby={boundaryTitleId} className="grid gap-3">
          <h3 id={boundaryTitleId} className="type-section-title">
            Boundary
          </h3>
          <div
            className={`flex items-start gap-3 rounded-control px-3 py-2.5 ${boundaryInvalid ? 'bg-status-danger-bg' : draft.boundary ? 'bg-status-success-bg' : 'bg-surface-muted'}`}
          >
            <FontAwesomeIcon
              icon={
                boundaryInvalid
                  ? faTriangleExclamation
                  : !draft.boundary
                    ? faDrawPolygon
                    : draft.boundarySource?.kind === 'imported'
                      ? faFileLines
                      : faCircleCheck
              }
              className={`mt-0.5 ${boundaryInvalid ? 'text-status-danger' : draft.boundary ? 'text-status-success' : 'text-text-secondary'}`}
              aria-hidden="true"
            />
            <div className="min-w-0">
              <p className="break-words type-item-title">{boundaryStatus(draft)}</p>
              {area === null && (
                <p className="type-label">Use Draw boundary on the map, or import a file.</p>
              )}
            </div>
          </div>
          {area !== null && (
            <dl className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
              <dt className="type-label">Estimated area</dt>
              <dd className="type-value text-ui-sm">{formatHectares(area)}</dd>
              <dd className="w-full type-label">
                The final area is calculated when the field is saved.
              </dd>
            </dl>
          )}
          {errors.boundary && (
            <p role="alert" className="text-ui-sm text-status-danger">
              {errors.boundary}
            </p>
          )}
          {boundaryActions}
          <p className="type-label">
            GeoJSON files must contain exactly one Polygon in WGS 84 coordinates.
          </p>
        </section>

        <section className="grid gap-4" aria-label="Field details">
          <h3 className="type-section-title">Details</h3>
          <TextField
            id={nameId}
            label="Field name"
            value={draft.name}
            onChange={(event) => onChange({ name: event.target.value })}
            autoComplete="off"
            error={errors.name}
            hint={`Up to ${fieldNameMaxLength} characters.`}
          />
          <SelectField
            id={cropId}
            label="Crop type"
            value={draft.cropType}
            onChange={(event) =>
              onChange({ cropType: isCropType(event.target.value) ? event.target.value : '' })
            }
            error={errors.cropType}
          >
            <option value="">Select a crop</option>
            {cropTypes.map((crop) => (
              <option key={crop} value={crop}>
                {crop}
              </option>
            ))}
          </SelectField>
          <TextField
            id={dateId}
            label="Planting date"
            type="date"
            value={draft.plantedAt}
            min="1900-01-01"
            max="2100-12-31"
            onChange={(event) => onChange({ plantedAt: event.target.value })}
            error={errors.plantedAt}
          />
        </section>
      </div>

      <div className="grid shrink-0 gap-3 border-t border-border px-5 py-4">
        {submitError && (
          <p role="alert" className="text-ui-sm text-status-danger">
            {submitError}
          </p>
        )}
        {footer ?? (
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="secondary" onClick={onCancel} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" loading={saving} disabled={checkingSession}>
              {saving ? 'Saving field…' : 'Save field'}
            </Button>
          </div>
        )}
      </div>
    </form>
  );
}

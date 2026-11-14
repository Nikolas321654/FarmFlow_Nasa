import type { FieldSummary } from '@/entities/field';
import { polygonPositions } from '@/shared/lib/geo';
import { attentionReasons } from '../model/attention';

type NeedsAttentionProps = {
  fields: FieldSummary[];
  loading: boolean;
  error: boolean;
  onSelectField: (id: string) => void;
};

export function NeedsAttention({ fields, loading, error, onSelectField }: NeedsAttentionProps) {
  const items = fields
    .map((field) => ({ field, reasons: attentionReasons(field) }))
    .filter(({ reasons }) => reasons.length > 0);

  return (
    <section
      aria-labelledby="needs-attention-title"
      className="flex min-h-0 flex-col rounded-control px-4 py-3 text-surface"
      style={{ backgroundColor: 'var(--color-navy)' }}
    >
      <div className="flex shrink-0 items-baseline justify-between gap-3">
        <h2 id="needs-attention-title" className="text-ui-base font-semibold">
          Needs attention
        </h2>
        {!loading && !error && (
          <span className="text-ui-xs text-surface/75">
            {items.length} {items.length === 1 ? 'field' : 'fields'}
          </span>
        )}
      </div>
      {loading && <p className="mt-2 text-ui-sm text-surface/80">Checking field status…</p>}
      {error && <p className="mt-2 text-ui-sm text-surface/80">Field status unavailable.</p>}
      {!loading && !error && items.length === 0 && (
        <p className="mt-2 text-ui-sm text-surface/80">
          {fields.length === 0 ? 'No fields available to review.' : 'No current field alerts.'}
        </p>
      )}
      {!loading && !error && items.length > 0 && (
        <ul className="mt-2 min-h-0 divide-y divide-surface/20 md:overflow-y-auto">
          {items.map(({ field, reasons }) => {
            const selectable = polygonPositions(field.boundary) !== null;
            return (
              <li key={field.id}>
                <button
                  type="button"
                  onClick={() => onSelectField(field.id)}
                  disabled={!selectable}
                  aria-label={`Locate ${field.name} on map`}
                  className="flex min-h-11 w-full flex-wrap items-center justify-between gap-x-4 gap-y-0.5 rounded-control px-1 text-left hover:bg-surface/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-surface disabled:cursor-default disabled:opacity-70 md:min-h-9"
                >
                  <span className="text-ui-sm font-semibold">{field.name}</span>
                  <span className="text-ui-xs text-surface/80">
                    {reasons.join(' · ')}
                    {!selectable && ' · Boundary unavailable'}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

import { faDroplet, faLeaf } from '@fortawesome/free-solid-svg-icons';
import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import type { FieldSummary } from '../model/types';
import { Badge, Card } from '@/shared/ui';

type FieldCardProps = {
  field: FieldSummary;
  selected: boolean;
  selectable: boolean;
  onSelect: (id: string) => void;
};

const areaFormatter = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 });
const statusTone = { Optimal: 'success', Marginal: 'warning', Blocked: 'danger' } as const;

export function FieldCard({ field, selected, selectable, onSelect }: FieldCardProps) {
  const card = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selected) card.current?.scrollIntoView({ block: 'center' });
  }, [selected]);

  return (
    <Card
      ref={card}
      tone={selected ? 'muted' : 'default'}
      className={`min-w-0 !rounded-control !p-3 transition-colors ${selected ? '!border-primary ring-1 ring-primary' : ''}`}
    >
      <button
        type="button"
        onClick={() => onSelect(field.id)}
        disabled={!selectable}
        aria-pressed={selected}
        aria-label={`Select ${field.name} on map`}
        className="w-full min-w-0 rounded-control text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed"
      >
        <span className="block truncate text-ui-sm font-semibold text-text-primary">
          {field.name}
        </span>
        <span className="mt-1 block text-ui-xs text-text-secondary">
          {field.cropType} · {areaFormatter.format(field.areaHectares)} ha
        </span>
        <span className="mt-2 flex flex-wrap gap-1.5">
          <Badge tone={statusTone[field.workabilityStatus] ?? 'neutral'}>
            {field.workabilityStatus} workability
          </Badge>
          {field.hasActiveStressAlert && (
            <Badge tone="warning" icon={faDroplet}>
              Water stress
            </Badge>
          )}
          {field.hasBiomassAnomaly && (
            <Badge tone="danger" icon={faLeaf}>
              Biomass anomaly
            </Badge>
          )}
        </span>
      </button>
      {!selectable && <p className="mt-2 text-ui-xs text-status-warning">Boundary unavailable</p>}
      <Link
        to={`/fields/${encodeURIComponent(field.id)}`}
        className="mt-2 inline-flex min-h-11 items-center rounded-control text-ui-xs font-semibold text-primary underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        View insights
      </Link>
    </Card>
  );
}

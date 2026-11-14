import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import type { FieldSummary } from '../model/types';
import { Badge, Card, MetaList } from '@/shared/ui';

type FieldCardProps = {
  field: FieldSummary;
  selected: boolean;
  hovered: boolean;
  selectable: boolean;
  onSelect: (id: string) => void;
  onHover: (id: string | null) => void;
};

const areaFormatter = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 });
const statusTone = { Optimal: 'success', Marginal: 'warning', Blocked: 'danger' } as const;

export function FieldCard({
  field,
  selected,
  hovered,
  selectable,
  onSelect,
  onHover,
}: FieldCardProps) {
  const card = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selected) card.current?.scrollIntoView({ block: 'center' });
  }, [selected]);

  return (
    <Card
      ref={card}
      tone={selected ? 'selected' : 'default'}
      onMouseEnter={() => onHover(field.id)}
      onMouseLeave={() => onHover(null)}
      onFocus={() => onHover(field.id)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) onHover(null);
      }}
      className={`min-w-0 !rounded-control !px-3 !py-2.5 transition-colors ${selected ? '!border-primary' : hovered ? '!border-primary/60' : ''}`}
    >
      <button
        type="button"
        onClick={() => onSelect(field.id)}
        disabled={!selectable}
        aria-pressed={selected}
        aria-label={`Select ${field.name} on map`}
        className="w-full min-w-0 rounded-control text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed"
      >
        <span className="block truncate type-item-title">{field.name}</span>
        <MetaList className="mt-0.5 text-ui-xs text-text-secondary tabular-nums">
          {field.cropType}
          {`${areaFormatter.format(field.areaHectares)} ha`}
        </MetaList>
        <span className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
          <Badge tone={statusTone[field.workabilityStatus] ?? 'neutral'}>
            {field.workabilityStatus} workability
          </Badge>
        </span>
      </button>
      {!selectable && <p className="mt-2 text-ui-xs text-status-warning">Boundary unavailable</p>}
      <Link
        to={`/fields/${encodeURIComponent(field.id)}`}
        className="mt-1 inline-flex min-h-11 items-center rounded-control text-ui-xs font-medium text-primary underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:min-h-8"
      >
        View insights
      </Link>
    </Card>
  );
}

type StatTileProps = {
  label: string;
  value: string;
  unit?: string;
  fullValue?: string;
  tone?: 'default' | 'danger' | 'warning';
};

const valueTone = {
  default: '',
  danger: 'text-status-danger',
  warning: 'text-status-warning',
} as const;

export function StatTile({ label, value, unit, fullValue, tone = 'default' }: StatTileProps) {
  return (
    <div className="min-w-0 rounded-control bg-surface-muted px-3 py-2.5">
      <dt className="truncate type-label">{label}</dt>
      <dd className={`mt-0.5 flex min-w-0 items-baseline type-metric ${valueTone[tone]}`}>
        <span className="truncate" title={fullValue}>
          {value}
        </span>
        {unit && (
          <span className="ml-1 shrink-0 text-ui-xs font-normal text-text-secondary">{unit}</span>
        )}
      </dd>
    </div>
  );
}

import { useId, useState, type KeyboardEvent, type PointerEvent } from 'react';

export type SparklinePoint = {
  date: string;
  value: number;
};

type SparklineProps = {
  label: string;
  points: SparklinePoint[];
  digits?: number;
  description: string;
  status?: { label: string; tone: 'warning' | 'neutral' };
};

const width = 100;
const height = 32;
const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  timeZone: 'UTC',
});

function formatDate(date: string): string {
  const timestamp = Date.parse(date);
  return Number.isFinite(timestamp) ? dateFormatter.format(timestamp) : date;
}

export function Sparkline({ label, points, digits = 2, description, status }: SparklineProps) {
  const titleId = useId();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  if (points.length < 2) {
    return (
      <div>
        <p className="text-ui-xs text-text-secondary">{label}</p>
        <p className="mt-1 text-ui-xs text-text-secondary">Not enough data for a trend.</p>
      </div>
    );
  }

  const values = points.map((point) => point.value);
  const rawMin = Math.min(...values);
  const rawMax = Math.max(...values);
  const pad = Math.max((rawMax - rawMin) * 0.15, 0.02);
  const min = rawMin - pad;
  const max = rawMax + pad;
  const x = (index: number) => (index / (points.length - 1)) * width;
  const y = (value: number) => height - ((value - min) / (max - min)) * height;
  const path = points
    .map(
      (point, index) =>
        `${index === 0 ? 'M' : 'L'}${x(index).toFixed(2)},${y(point.value).toFixed(2)}`,
    )
    .join(' ');

  const first = points[0];
  const last = points[points.length - 1];
  const shownIndex = activeIndex ?? points.length - 1;
  const shown = points[shownIndex];
  const change = last.value - first.value;
  const signed = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
    signDisplay: 'exceptZero',
  });

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    const ratio = (event.clientX - box.left) / box.width;
    setActiveIndex(
      Math.min(points.length - 1, Math.max(0, Math.round(ratio * (points.length - 1)))),
    );
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const last = points.length - 1;
    const current = activeIndex ?? last;
    const next =
      event.key === 'ArrowLeft'
        ? Math.max(0, current - 1)
        : event.key === 'ArrowRight'
          ? Math.min(last, current + 1)
          : event.key === 'Home'
            ? 0
            : event.key === 'End'
              ? last
              : null;
    if (next === null) return;
    event.preventDefault();
    setActiveIndex(next);
  };

  return (
    <figure className="min-w-0">
      <figcaption className="flex items-baseline justify-between gap-2">
        <span className="flex min-w-0 items-baseline gap-2">
          <span id={titleId} className="type-label" title={description}>
            {label}
          </span>
          {status && (
            <span
              className={`text-ui-2xs font-medium ${status.tone === 'warning' ? 'text-status-warning' : 'text-text-secondary'}`}
            >
              {status.label}
            </span>
          )}
        </span>
        <span className="text-ui-xs tabular-nums">
          <span className="type-value">{shown.value.toFixed(digits)}</span>
          <span className="ml-1.5 text-text-secondary">
            {activeIndex === null
              ? `${signed.format(change)} vs ${formatDate(first.date)}`
              : formatDate(shown.date)}
          </span>
        </span>
      </figcaption>
      <div
        tabIndex={0}
        aria-label={`${label} chart. Use the arrow keys to read daily values.`}
        aria-describedby={`${titleId}-description`}
        className="relative mt-1 h-8 touch-none rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        onPointerMove={onPointerMove}
        onPointerLeave={() => setActiveIndex(null)}
        onKeyDown={onKeyDown}
        onBlur={() => setActiveIndex(null)}
      >
        <svg
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="none"
          className="h-full w-full overflow-visible text-primary"
          role="img"
          aria-labelledby={titleId}
          aria-describedby={`${titleId}-summary`}
        >
          <path
            d={path}
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
        {activeIndex !== null && (
          <span
            className="pointer-events-none absolute inset-y-0 w-px bg-border"
            style={{ left: `${(x(shownIndex) / width) * 100}%` }}
            aria-hidden="true"
          />
        )}
        <span
          className="pointer-events-none absolute size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary ring-2 ring-surface"
          style={{
            left: `${(x(shownIndex) / width) * 100}%`,
            top: `${(y(shown.value) / height) * 100}%`,
          }}
          aria-hidden="true"
        />
      </div>
      <p id={`${titleId}-description`} className="sr-only">
        {description}
      </p>
      <p aria-live="polite" className="sr-only">
        {activeIndex === null ? '' : `${formatDate(shown.date)}: ${shown.value.toFixed(digits)}`}
      </p>
      <p id={`${titleId}-summary`} className="sr-only">
        {`${label} from ${first.value.toFixed(digits)} on ${formatDate(first.date)} to ${last.value.toFixed(digits)} on ${formatDate(last.date)}, range ${rawMin.toFixed(digits)} to ${rawMax.toFixed(digits)}.`}
      </p>
    </figure>
  );
}

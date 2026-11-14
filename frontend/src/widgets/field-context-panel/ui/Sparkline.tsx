import { useId, useState, type PointerEvent } from 'react';

export type SparklinePoint = {
  date: string;
  value: number;
};

type SparklineProps = {
  label: string;
  points: SparklinePoint[];
  digits?: number;
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

export function Sparkline({ label, points, digits = 2 }: SparklineProps) {
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

  return (
    <figure className="min-w-0">
      <figcaption className="flex items-baseline justify-between gap-2">
        <span id={titleId} className="type-label">
          {label}
        </span>
        <span className="text-ui-xs tabular-nums">
          <span className="type-value">{shown.value.toFixed(digits)}</span>
          <span className="ml-1.5 text-text-secondary">
            {activeIndex === null
              ? `${signed.format(change)} in ${points.length}d`
              : formatDate(shown.date)}
          </span>
        </span>
      </figcaption>
      <div
        className="relative mt-1 h-8 touch-none"
        onPointerMove={onPointerMove}
        onPointerLeave={() => setActiveIndex(null)}
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
      <p id={`${titleId}-summary`} className="sr-only">
        {`${label} from ${first.value.toFixed(digits)} on ${formatDate(first.date)} to ${last.value.toFixed(digits)} on ${formatDate(last.date)}, range ${rawMin.toFixed(digits)} to ${rawMax.toFixed(digits)}.`}
      </p>
    </figure>
  );
}

import type { FieldDashboard } from '@/entities/field';

export type ImpactSummary = {
  waterSavedM3: number;
  waterSavedM3PerHa: number;
  maxLeadTimeDays: number;
  runoffPreventedFields: number;
};

export function summarizeImpact(dashboards: FieldDashboard[]): ImpactSummary | null {
  if (dashboards.length === 0) return null;
  const totalArea = dashboards.reduce((sum, item) => sum + item.areaHectares, 0);
  const waterSavedM3 = dashboards.reduce(
    (sum, item) => sum + item.impactMetrics.estimatedWaterSavedM3PerHa * item.areaHectares,
    0,
  );
  return {
    waterSavedM3,
    waterSavedM3PerHa: totalArea > 0 ? waterSavedM3 / totalArea : 0,
    maxLeadTimeDays: Math.max(
      ...dashboards.map((item) => item.impactMetrics.earlyWarningLeadTimeDays),
    ),
    runoffPreventedFields: dashboards.filter((item) => item.impactMetrics.preventedRunoffRisk)
      .length,
  };
}

export type DataProvenance = {
  live: boolean;
  simulated: boolean;
  latestObservation: string | null;
  generatedAt: string | null;
};

const validDate = /^\d{4}-\d{2}-\d{2}$/;

function isObservationDate(value: unknown): value is string {
  return typeof value === 'string' && validDate.test(value) && Number.isFinite(Date.parse(value));
}

function latest(values: string[]): string | null {
  return [...values].sort((a, b) => Date.parse(b) - Date.parse(a))[0] ?? null;
}

export function summarizeProvenance(dashboards: FieldDashboard[]): DataProvenance {
  return {
    live: dashboards.some((item) => item.dataSource === 'NASA_POWER_LIVE'),
    simulated: dashboards.some((item) => item.dataSource === 'MOCK_FIXTURE'),
    latestObservation: latest(
      dashboards
        .filter((item) => item.dataSource === 'NASA_POWER_LIVE')
        .flatMap((item) => item.timeSeries.map((point) => point.date))
        .filter(isObservationDate),
    ),
    generatedAt: latest(
      dashboards
        .map((item) => item.lastUpdatedUtc)
        .filter((value) => Number.isFinite(Date.parse(value))),
    ),
  };
}

const monthDay = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  timeZone: 'UTC',
});
const day = new Intl.DateTimeFormat('en-US', { day: 'numeric', timeZone: 'UTC' });
const year = new Intl.DateTimeFormat('en-US', { year: 'numeric', timeZone: 'UTC' });

export function formatObservationDate(date: string): string {
  return monthDay.format(Date.parse(date));
}

export function observationRange(dates: string[]): string | null {
  if (dates.length === 0 || !dates.every(isObservationDate)) return null;
  const sorted = [...dates].sort();
  const first = Date.parse(sorted[0]);
  const last = Date.parse(sorted[sorted.length - 1]);
  const sameYear = year.format(first) === year.format(last);
  const sameMonth = sameYear && sorted[0].slice(0, 7) === sorted[sorted.length - 1].slice(0, 7);
  if (first === last) return `${monthDay.format(first)}, ${year.format(first)}`;
  if (sameMonth) return `${monthDay.format(first)}-${day.format(last)}, ${year.format(last)}`;
  if (sameYear) return `${monthDay.format(first)}-${monthDay.format(last)}, ${year.format(last)}`;
  return `${monthDay.format(first)}, ${year.format(first)}-${monthDay.format(last)}, ${year.format(last)}`;
}

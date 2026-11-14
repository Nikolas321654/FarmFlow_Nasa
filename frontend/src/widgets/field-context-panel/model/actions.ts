import {
  fieldShortName,
  withoutFieldPrefix,
  type AlertSeverity,
  type FieldDashboard,
} from '@/entities/field';
import { withoutLongDashes } from '@/shared/lib/text';

export type FieldActionKind = 'irrigate' | 'spray' | 'machinery' | 'scout';

export type FieldAction = {
  id: string;
  fieldId: string;
  kind: FieldActionKind;
  severity: AlertSeverity;
  title: string;
  detail: string;
  recommendation: string;
};

const severityRank: Record<AlertSeverity, number> = { Critical: 0, Warning: 1, Info: 2 };
const kindRank: Record<FieldActionKind, number> = { irrigate: 0, spray: 1, machinery: 2, scout: 3 };
// Mirrors the backend spraying rule: forecast_24h >= 5 mm blocks spraying (P0-6).
const sprayForecastLimitMm = 5;

const mm = new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 });

function serverText(text: string, fieldName: string): string {
  return withoutLongDashes(withoutFieldPrefix(text, fieldName));
}

/** Turns one field's dashboard evaluations into task rows. */
export function buildFieldActions(dashboard: FieldDashboard): FieldAction[] {
  const { fieldId, fieldName, stressAndIrrigation, workability, biomass } = dashboard;
  const name = fieldShortName(fieldName);
  const actions: FieldAction[] = [];

  if (stressAndIrrigation.irrigationRecommended) {
    actions.push({
      id: `${fieldId}:irrigate`,
      fieldId,
      kind: 'irrigate',
      severity: stressAndIrrigation.severity,
      title: `Irrigate ${name}`,
      detail: `${mm.format(stressAndIrrigation.recommendedIrrigationMm)} mm within ${stressAndIrrigation.recommendedWindowHours}h`,
      recommendation: serverText(stressAndIrrigation.recommendation, fieldName),
    });
  }

  if (!workability.sprayingSafe) {
    actions.push({
      id: `${fieldId}:spray`,
      fieldId,
      kind: 'spray',
      severity: 'Warning',
      title: `Don't spray ${name}`,
      detail:
        workability.rainForecast24hMm >= sprayForecastLimitMm
          ? `${mm.format(workability.rainForecast24hMm)} mm rain forecast`
          : `${mm.format(workability.rainLast12hMm)} mm rain in last 12h`,
      recommendation: serverText(workability.recommendation, fieldName),
    });
  } else if (workability.status !== 'Optimal') {
    actions.push({
      id: `${fieldId}:machinery`,
      fieldId,
      kind: 'machinery',
      severity: workability.status === 'Blocked' ? 'Warning' : 'Info',
      title:
        workability.status === 'Blocked'
          ? `Keep machinery off ${name}`
          : `Light machinery only on ${name}`,
      detail: `Surface moisture ${workability.surfaceMoisture.toFixed(2)}`,
      recommendation: serverText(workability.recommendation, fieldName),
    });
  }

  if (biomass.isAnomalyDetected) {
    actions.push({
      id: `${fieldId}:scout`,
      fieldId,
      kind: 'scout',
      severity: 'Warning',
      title: `Scout ${name}`,
      // The backend only flags an anomaly when rootzone moisture is healthy.
      detail: `NDVI down ${Math.round(Math.abs(biomass.deltaPercent))}%, soil moisture OK`,
      recommendation: serverText(biomass.recommendation, fieldName),
    });
  }

  return actions;
}

export function sortActions(actions: FieldAction[]): FieldAction[] {
  return [...actions].sort(
    (a, b) =>
      severityRank[a.severity] - severityRank[b.severity] || kindRank[a.kind] - kindRank[b.kind],
  );
}

export function buildTodayActions(dashboards: FieldDashboard[]): FieldAction[] {
  return sortActions(dashboards.flatMap(buildFieldActions));
}

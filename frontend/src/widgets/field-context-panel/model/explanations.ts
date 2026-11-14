import type { FieldDashboard } from '@/entities/field';
import { WATER_DEFICIT_ALERT_THRESHOLD } from '@/shared/config/thresholds';

export const wdiExplanation = `Combines rootzone moisture (60%) and evaporative stress (40%). Higher values mean a larger water deficit. Rivnova raises an alert above ${WATER_DEFICIT_ALERT_THRESHOLD}.`;

export const ndviExplanation =
  'NDVI measures how green and dense the vegetation is, from 0 (bare) to 1 (dense canopy).';

export const rootzoneExplanation =
  'Rootzone moisture is soil wetness in the top metre, from 0 (dry) to 1 (saturated).';

const percent = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 1,
  signDisplay: 'exceptZero',
});

export type AssessmentLine = {
  title: string;
  finding: string;
  scope: string;
};

export function assessmentLines(dashboard: FieldDashboard): AssessmentLine[] {
  const { workability, stressAndIrrigation, biomass } = dashboard;
  const wdi = stressAndIrrigation.waterDeficitIndex;
  return [
    {
      title: 'Workability',
      finding: `${workability.status}. Spraying ${workability.sprayingSafe ? 'is not blocked by the rain rules' : 'is blocked by recent or expected rain'}.`,
      scope: 'Reflects soil and rain conditions for field operations, not overall crop health.',
    },
    {
      title: 'Water stress',
      finding: `Index ${wdi.toFixed(2)}, ${wdi > WATER_DEFICIT_ALERT_THRESHOLD ? 'above' : 'below'} the ${WATER_DEFICIT_ALERT_THRESHOLD} alert. Irrigation ${stressAndIrrigation.irrigationRecommended ? 'recommended' : 'not recommended'}.`,
      scope: 'Assessed separately from workability.',
    },
    {
      title: 'Vegetation',
      finding: `NDVI ${percent.format(biomass.deltaPercent)}% against its 14-day average. ${biomass.isAnomalyDetected ? 'Unusual decline detected.' : 'No unusual decline.'}`,
      scope: 'NDVI changes can signal an anomaly but do not identify its cause.',
    },
  ];
}

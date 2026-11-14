import type { FieldSummary } from '@/entities/field';

export function attentionReasons(field: FieldSummary): string[] {
  const reasons: string[] = [];
  if (field.workabilityStatus !== 'Optimal') {
    reasons.push(`${field.workabilityStatus} workability`);
  }
  if (field.hasActiveStressAlert) reasons.push('Water stress');
  if (field.hasBiomassAnomaly) reasons.push('Biomass anomaly');
  return reasons;
}

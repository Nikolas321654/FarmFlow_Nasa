import type { DashboardStressAndIrrigation } from '@/entities/field';
import { WATER_DEFICIT_ALERT_THRESHOLD } from '@/shared/config/thresholds';
import { wdiExplanation } from '../model/explanations';
import { severityTone } from '../model/tones';

type WdiMeterProps = {
  stress: DashboardStressAndIrrigation;
};

function percent(value: number): string {
  return `${Math.min(Math.max(value, 0), 1) * 100}%`;
}

export function WdiMeter({ stress }: WdiMeterProps) {
  const value = stress.waterDeficitIndex;
  const aboveThreshold = value > WATER_DEFICIT_ALERT_THRESHOLD;
  const tone = severityTone[aboveThreshold ? stress.severity : 'Info'];
  const statusLabel = stress.isHiddenStressDetected
    ? 'Hidden stress'
    : aboveThreshold
      ? `Above ${WATER_DEFICIT_ALERT_THRESHOLD} alert`
      : stress.irrigationRecommended
        ? 'Below alert, low moisture'
        : `Below ${WATER_DEFICIT_ALERT_THRESHOLD} alert`;
  const statusClass = aboveThreshold
    ? tone.text
    : stress.irrigationRecommended
      ? 'text-status-warning'
      : 'text-status-success';

  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <p className="type-section-title" title={wdiExplanation}>
          Water deficit index
        </p>
        <p className="text-ui-sm">
          <span className="type-value">{value.toFixed(2)}</span>
          <span className={`ml-2 text-ui-xs font-medium ${statusClass}`}>{statusLabel}</span>
        </p>
      </div>
      <div
        role="meter"
        aria-label="Water deficit index"
        aria-valuemin={0}
        aria-valuemax={1}
        aria-valuenow={value}
        aria-valuetext={`${value.toFixed(2)}, ${statusLabel}, alert threshold ${WATER_DEFICIT_ALERT_THRESHOLD}`}
        className="relative mt-2 h-2 rounded-badge bg-status-neutral-bg"
      >
        <div className={`h-full rounded-badge ${tone.fill}`} style={{ width: percent(value) }} />
        <div
          className="absolute -top-1 -bottom-1 w-0.5 rounded-badge bg-navy"
          style={{ left: percent(WATER_DEFICIT_ALERT_THRESHOLD) }}
          aria-hidden="true"
        />
      </div>
      <div
        className="relative mt-1 h-4 text-ui-2xs text-text-secondary tabular-nums"
        aria-hidden="true"
      >
        <span className="absolute left-0">0</span>
        <span
          className="absolute -translate-x-1/2"
          style={{ left: percent(WATER_DEFICIT_ALERT_THRESHOLD) }}
        >
          {WATER_DEFICIT_ALERT_THRESHOLD} alert
        </span>
        <span className="absolute right-0">1</span>
      </div>
    </div>
  );
}

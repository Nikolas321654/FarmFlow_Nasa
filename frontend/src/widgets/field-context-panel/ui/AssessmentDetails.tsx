import { faChevronDown } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { FieldDashboard } from '@/entities/field';
import { assessmentLines } from '../model/explanations';

type AssessmentDetailsProps = {
  dashboard: FieldDashboard;
  simulated: boolean;
  live: boolean;
};

export function AssessmentDetails({ dashboard, simulated, live }: AssessmentDetailsProps) {
  return (
    <details className="group rounded-control bg-surface-muted px-3 py-2">
      <summary className="flex min-h-9 cursor-pointer list-none items-center justify-between gap-2 rounded-control text-ui-sm font-medium text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary [&::-webkit-details-marker]:hidden">
        Why this assessment?
        <FontAwesomeIcon
          icon={faChevronDown}
          className="text-ui-xs text-text-secondary transition-transform group-open:rotate-180 motion-reduce:transition-none"
          aria-hidden="true"
        />
      </summary>
      <dl className="mt-2 grid gap-3 pb-1">
        {assessmentLines(dashboard).map((line) => (
          <div key={line.title}>
            <dt className="type-item-title">{line.title}</dt>
            <dd className="text-ui-sm text-text-primary">{line.finding}</dd>
            <dd className="type-label">{line.scope}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-2 border-t border-border pt-2 type-label">
        NDVI runs from 0 (bare soil) to 1 (dense canopy). Rootzone moisture runs from 0 (dry) to 1
        (saturated).
      </p>
      {(live || simulated) && (
        <p className="mt-2 border-t border-border pt-2 type-label">
          {simulated
            ? 'These values are simulated samples, not measurements of this field.'
            : 'Soil moisture, rain and solar data come from NASA POWER. NDVI and evaporative stress are estimated from those values, not measured directly by satellite.'}
        </p>
      )}
    </details>
  );
}

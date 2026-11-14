import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
type ImpactRowProps = {
  icon: IconDefinition;
  label: string;
  value: string;
  hint: string;
};

export function ImpactRow({ icon, label, value, hint }: ImpactRowProps) {
  return (
    <div className="flex items-start gap-3">
      <span
        className="grid size-8 shrink-0 place-items-center rounded-control bg-selection text-primary"
        aria-hidden="true"
      >
        <FontAwesomeIcon icon={icon} />
      </span>
      <div className="min-w-0 flex-1">
        <dt className="type-label">{label}</dt>
        <dd className="text-ui-sm">
          <span className="type-value">{value}</span>
          <span className="block text-ui-xs text-text-secondary">{hint}</span>
        </dd>
      </div>
    </div>
  );
}

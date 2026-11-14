import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { HTMLAttributes, ReactNode } from 'react';

type BadgeProps = Omit<HTMLAttributes<HTMLSpanElement>, 'children'> & {
  children: ReactNode;
  icon?: IconDefinition;
  tone?: 'success' | 'warning' | 'danger' | 'neutral';
};

const toneClasses = {
  success: 'bg-status-success-bg text-status-success',
  warning: 'bg-status-warning-bg text-status-warning',
  danger: 'bg-status-danger-bg text-status-danger',
  neutral: 'bg-status-neutral-bg text-status-neutral',
} as const;

export function Badge({ children, className = '', icon, tone = 'neutral', ...props }: BadgeProps) {
  return (
    <span
      {...props}
      className={`inline-flex items-center gap-1.5 rounded-badge px-2.5 py-1 text-ui-xs font-medium ${toneClasses[tone]} ${className}`}
    >
      {icon && <FontAwesomeIcon icon={icon} aria-hidden="true" />}
      {children}
    </span>
  );
}

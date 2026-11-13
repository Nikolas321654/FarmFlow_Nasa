import { faSpinner } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { ButtonHTMLAttributes } from 'react';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary';
  loading?: boolean;
};

const variantClasses = {
  primary:
    'border-primary bg-primary text-surface enabled:hover:border-primary-hover enabled:hover:bg-primary-hover',
  secondary: 'border-border bg-surface text-text-primary enabled:hover:bg-surface-muted',
} as const;

export function Button({
  children,
  className = '',
  disabled,
  loading = false,
  type = 'button',
  variant = 'primary',
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-control border px-control-x py-control-y text-ui-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-50 ${variantClasses[variant]} ${className}`}
    >
      {loading && <FontAwesomeIcon icon={faSpinner} spin aria-hidden="true" />}
      {children}
    </button>
  );
}

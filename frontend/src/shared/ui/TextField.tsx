import type { InputHTMLAttributes } from 'react';

type TextFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> & {
  id: string;
  label: string;
  hint?: string;
  error?: string;
};

export function TextField({
  className = '',
  error,
  hint,
  id,
  label,
  type = 'text',
  ...props
}: TextFieldProps) {
  const descriptionId = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

  return (
    <div className="grid gap-1.5">
      <label htmlFor={id} className="text-ui-sm font-semibold text-text-primary">
        {label}
      </label>
      <input
        {...props}
        id={id}
        type={type}
        aria-invalid={Boolean(error) || undefined}
        aria-describedby={
          [props['aria-describedby'], descriptionId].filter(Boolean).join(' ') || undefined
        }
        className={`min-h-11 w-full rounded-control border bg-surface px-control-x py-control-y text-ui-base text-text-primary outline-none placeholder:text-text-secondary focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-text-secondary ${error ? 'border-status-danger enabled:hover:border-status-danger' : 'border-border enabled:hover:border-sage'} ${className}`}
      />
      {error ? (
        <p id={descriptionId} className="text-ui-sm text-status-danger">
          {error}
        </p>
      ) : (
        hint && (
          <p id={descriptionId} className="text-ui-sm text-text-secondary">
            {hint}
          </p>
        )
      )}
    </div>
  );
}

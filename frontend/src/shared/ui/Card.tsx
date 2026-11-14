import type { ComponentPropsWithRef } from 'react';

type CardProps = ComponentPropsWithRef<'div'> & {
  tone?: 'default' | 'muted' | 'selected';
};

const toneClasses = {
  default: 'bg-surface',
  muted: 'bg-surface-muted',
  selected: 'bg-selection',
} as const;

export function Card({ className = '', tone = 'default', ...props }: CardProps) {
  return (
    <div
      {...props}
      className={`rounded-card border border-border p-card ${toneClasses[tone]} ${className}`}
    />
  );
}

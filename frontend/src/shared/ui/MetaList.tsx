import { Children, Fragment, type ReactNode } from 'react';

type MetaListProps = {
  children: ReactNode;
  className?: string;
};

/** Inline metadata items separated by a small drawn dot. */
export function MetaList({ children, className = '' }: MetaListProps) {
  const items = Children.toArray(children);

  return (
    <span className={`flex flex-wrap items-center gap-x-1.5 gap-y-0.5 ${className}`}>
      {items.map((item, index) => (
        <Fragment key={index}>
          {index > 0 && (
            <span className="size-[3px] shrink-0 rounded-full bg-current opacity-50">
              <span className="sr-only">, </span>
            </span>
          )}
          <span className="min-w-0">{item}</span>
        </Fragment>
      ))}
    </span>
  );
}

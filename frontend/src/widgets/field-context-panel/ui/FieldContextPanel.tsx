import { faAnglesRight, faAnglesDown } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { FieldSummary } from '@/entities/field';
import { OverviewPanel } from './OverviewPanel';
import { SelectedFieldPanel } from './SelectedFieldPanel';

type FieldContextPanelProps = {
  id?: string;
  fields: FieldSummary[];
  selectedField: FieldSummary | null;
  loading: boolean;
  error: boolean;
  onSelectField: (id: string | null) => void;
  onCollapse: () => void;
  /** Moves focus to the collapse button on mount, e.g. after "Show details". */
  focusOnMount?: boolean;
};

export function FieldContextPanel({
  id,
  fields,
  selectedField,
  loading,
  error,
  onSelectField,
  onCollapse,
  focusOnMount = false,
}: FieldContextPanelProps) {
  return (
    <aside
      id={id}
      aria-label={selectedField ? 'Selected field conditions' : 'Current conditions'}
      className="relative flex min-h-0 min-w-0 flex-col overflow-hidden rounded-control border border-border bg-surface min-[1260px]:rounded-none min-[1260px]:border-y-0 min-[1260px]:border-r-0"
    >
      <button
        type="button"
        onClick={onCollapse}
        autoFocus={focusOnMount}
        aria-label="Hide details panel"
        aria-expanded="true"
        title="Hide details panel"
        className="absolute right-2 top-2 z-10 grid size-11 place-items-center rounded-control text-ui-xs text-text-secondary hover:bg-surface-muted hover:text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:size-8"
      >
        {/* The panel sits beside the map on wide screens and below it otherwise. */}
        <span className="min-[1260px]:hidden" aria-hidden="true">
          <FontAwesomeIcon icon={faAnglesDown} />
        </span>
        <span className="hidden min-[1260px]:inline-block" aria-hidden="true">
          <FontAwesomeIcon icon={faAnglesRight} />
        </span>
      </button>
      {selectedField ? (
        <SelectedFieldPanel
          key={selectedField.id}
          field={selectedField}
          onBack={() => onSelectField(null)}
        />
      ) : (
        <OverviewPanel
          fields={fields}
          loading={loading}
          error={error}
          onSelectField={onSelectField}
        />
      )}
    </aside>
  );
}

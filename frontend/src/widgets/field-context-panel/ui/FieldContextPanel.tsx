import { faAnglesRight, faAnglesDown } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { FieldGroup, FieldSummary } from '@/entities/field';
import { OverviewPanel } from './OverviewPanel';
import { SelectedFieldPanel } from './SelectedFieldPanel';

type FieldContextPanelProps = {
  id?: string;
  fields: FieldSummary[];
  group: FieldGroup;
  selectedField: FieldSummary | null;
  loading: boolean;
  error: boolean;
  onSelectField: (id: string | null) => void;
  onCollapse: () => void;
  focusOnMount?: boolean;
};

export function FieldContextPanel({
  id,
  fields,
  group,
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
      className="relative flex min-h-0 min-w-0 flex-col overflow-hidden rounded-control border border-border bg-surface min-[1260px]:h-full min-[1260px]:rounded-none min-[1260px]:border-y-0 min-[1260px]:border-r-0 min-[1260px]:border-border/70"
    >
      <button
        type="button"
        onClick={onCollapse}
        autoFocus={focusOnMount}
        aria-label="Hide details panel"
        aria-expanded="true"
        title="Hide details panel"
        className="absolute right-3 top-3 z-10 grid size-11 place-items-center rounded-control text-ui-xs text-text-secondary transition-colors duration-150 hover:bg-surface-muted hover:text-text-primary focus-visible:bg-surface-muted focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary motion-reduce:transition-none md:right-4 md:top-4 md:size-8"
      >
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
          group={group}
          loading={loading}
          error={error}
          onSelectField={onSelectField}
        />
      )}
    </aside>
  );
}

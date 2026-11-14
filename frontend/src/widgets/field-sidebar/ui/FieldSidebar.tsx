import { Link } from 'react-router-dom';
import { FieldCard, type FieldSummary } from '@/entities/field';
import { polygonPositions } from '@/shared/lib/geo';
import { Button } from '@/shared/ui';

type FieldSidebarProps = {
  fields: FieldSummary[];
  selectedFieldId: string | null;
  hoveredFieldId: string | null;
  onSelectField: (id: string) => void;
  onHoverField: (id: string | null) => void;
  activeTab: 'demo' | 'mine';
  onTabChange: (tab: 'demo' | 'mine') => void;
  authenticated: boolean;
  authLoading: boolean;
  authError: boolean;
  onRetryAuth: () => void;
  loading: boolean;
  error: boolean;
  onRetryFields: () => void;
};

export function FieldSidebar({
  fields,
  selectedFieldId,
  hoveredFieldId,
  onSelectField,
  onHoverField,
  activeTab,
  onTabChange,
  authenticated,
  authLoading,
  authError,
  onRetryAuth,
  loading,
  error,
  onRetryFields,
}: FieldSidebarProps) {
  const demoFields = fields.filter((field) => field.isDemo);
  const myFields = fields.filter((field) => !field.isDemo);
  const shownFields = authenticated && activeTab === 'mine' ? myFields : demoFields;

  return (
    <div className="mt-2 min-w-0">
      {authLoading && (
        <p role="status" className="text-ui-xs text-text-secondary">
          Checking account…
        </p>
      )}
      {authError && (
        <div role="alert" className="text-ui-xs text-text-secondary">
          <p>Unable to check your session.</p>
          <Button variant="secondary" onClick={onRetryAuth} className="mt-2">
            Retry account
          </Button>
        </div>
      )}
      {authenticated && (
        <div
          role="tablist"
          aria-label="Field groups"
          className="mb-3 flex gap-1 rounded-control bg-surface-muted p-1"
        >
          {(['demo', 'mine'] as const).map((tab) => (
            <button
              key={tab}
              id={`${tab}-fields-tab`}
              type="button"
              role="tab"
              aria-selected={activeTab === tab}
              aria-controls="field-group-panel"
              tabIndex={activeTab === tab ? 0 : -1}
              onClick={() => onTabChange(tab)}
              onKeyDown={(event) => {
                if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
                event.preventDefault();
                const nextTab = tab === 'demo' ? 'mine' : 'demo';
                onTabChange(nextTab);
                document.getElementById(`${nextTab}-fields-tab`)?.focus();
              }}
              className={`min-h-11 min-w-0 flex-1 rounded-control px-2 text-ui-sm font-medium focus-visible:outline-2 focus-visible:outline-primary ${activeTab === tab ? 'bg-selection text-primary' : 'text-text-secondary hover:text-text-primary'}`}
            >
              {tab === 'demo' ? 'Demo Fields' : 'My Fields'}
            </button>
          ))}
        </div>
      )}
      {!authenticated && !authLoading && <p className="mb-3 type-label">Demo Fields</p>}
      <div
        id={authenticated ? 'field-group-panel' : undefined}
        role={authenticated ? 'tabpanel' : undefined}
        aria-labelledby={authenticated ? `${activeTab}-fields-tab` : undefined}
      >
        {loading && (
          <p role="status" className="text-ui-sm text-text-secondary">
            Loading fields…
          </p>
        )}
        {error && (
          <div role="alert" className="text-ui-sm text-text-secondary">
            <p>Unable to load fields.</p>
            <Button variant="secondary" onClick={onRetryFields} className="mt-2">
              Retry
            </Button>
          </div>
        )}
        {!loading && !error && shownFields.length === 0 && (
          <div className="text-ui-sm text-text-secondary">
            <p>
              {authenticated && activeTab === 'mine'
                ? 'You have no personal fields yet.'
                : 'No demo fields are available.'}
            </p>
            {authenticated && activeTab === 'mine' && (
              <Link
                to="/fields/new"
                className="mt-2 inline-flex min-h-11 items-center font-medium text-primary underline-offset-2 hover:underline"
              >
                Add Field
              </Link>
            )}
          </div>
        )}
        {!loading && !error && (
          <ul className="space-y-1.5">
            {shownFields.map((field) => (
              <li key={field.id}>
                <FieldCard
                  field={field}
                  selected={field.id === selectedFieldId}
                  hovered={field.id === hoveredFieldId}
                  selectable={polygonPositions(field.boundary) !== null}
                  onSelect={onSelectField}
                  onHover={onHoverField}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

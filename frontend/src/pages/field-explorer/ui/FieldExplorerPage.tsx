import { faAnglesLeft, faAnglesUp, faFlask } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useFields } from '@/entities/field';
import { useCurrentUser } from '@/entities/user';
import { polygonPositions } from '@/shared/lib/geo';
import { Button } from '@/shared/ui';
import { AppShell } from '@/widgets/app-shell';
import { FieldContextPanel } from '@/widgets/field-context-panel';
import { FieldMap } from '@/widgets/field-map';
import { FieldSidebar } from '@/widgets/field-sidebar';

const selectedFieldParam = 'field';
const contextPanelId = 'field-context-panel';

export function FieldExplorerPage() {
  const fieldQuery = useFields();
  const userQuery = useCurrentUser();
  const fields = fieldQuery.data ?? [];
  const isGuest = userQuery.data?.authenticated === false;
  const [searchParams, setSearchParams] = useSearchParams();
  const [hoveredFieldId, setHoveredFieldId] = useState<string | null>(null);
  const [chosenTab, setChosenTab] = useState<'demo' | 'mine' | null>(null);
  const [panelOpen, setPanelOpen] = useState(true);
  const [focusPanelOnOpen, setFocusPanelOnOpen] = useState(false);

  const selectedFieldId = searchParams.get(selectedFieldParam);
  const selectedField =
    fields.find((field) => field.id === selectedFieldId && polygonPositions(field.boundary)) ??
    null;
  const validSelectedFieldId = selectedField?.id ?? null;
  const activeTab = chosenTab ?? (selectedField && !selectedField.isDemo ? 'mine' : 'demo');

  const selectField = (id: string | null) => {
    setSearchParams(
      (params) => {
        const next = new URLSearchParams(params);
        if (id) next.set(selectedFieldParam, id);
        else next.delete(selectedFieldParam);
        return next;
      },
      { replace: true },
    );
    const field = id ? fields.find((item) => item.id === id) : undefined;
    if (field) setChosenTab(field.isDemo ? 'demo' : 'mine');
    if (id) {
      setFocusPanelOnOpen(false);
      setPanelOpen(true);
    }
  };

  const showPanel = () => {
    setFocusPanelOnOpen(true);
    setPanelOpen(true);
  };

  return (
    <AppShell
      account={userQuery.data?.authenticated ? userQuery.data.user : undefined}
      panelContent={
        <FieldSidebar
          fields={fields}
          selectedFieldId={validSelectedFieldId}
          hoveredFieldId={hoveredFieldId}
          onSelectField={selectField}
          onHoverField={setHoveredFieldId}
          activeTab={activeTab}
          onTabChange={setChosenTab}
          authenticated={userQuery.data?.authenticated === true}
          authLoading={userQuery.isPending}
          authError={userQuery.isError}
          onRetryAuth={() => void userQuery.refetch()}
          loading={fieldQuery.isPending}
          error={fieldQuery.isError}
          onRetryFields={() => void fieldQuery.refetch()}
        />
      }
    >
      <section
        aria-label="Field Explorer workspace"
        className="min-w-0 md:h-full md:overflow-y-auto min-[1260px]:overflow-hidden"
      >
        <div
          className={`grid min-w-0 gap-3 p-3 sm:gap-4 sm:p-4 min-[1260px]:h-full min-[1260px]:gap-0 min-[1260px]:p-0 ${panelOpen ? 'min-[1260px]:grid-cols-[minmax(0,1fr)_304px]' : 'md:h-full min-[1260px]:grid-cols-1'}`}
        >
          <div className="flex min-w-0 flex-col gap-3 md:min-h-0 min-[1260px]:p-4">
            <div className="min-w-0">
              <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
                <h1 className="type-page-title">Fields map</h1>
                {isGuest && (
                  <span className="inline-flex items-center gap-1.5 rounded-badge border border-border bg-surface px-2.5 py-0.5 text-ui-xs font-medium text-text-secondary">
                    <FontAwesomeIcon icon={faFlask} aria-hidden="true" />
                    Demo mode
                  </span>
                )}
              </div>
              {isGuest && (
                <p className="mt-1 text-ui-sm text-text-secondary">
                  Explore sample fields analyzed with NASA satellite data. Sign in to add and save
                  your own.
                </p>
              )}
            </div>
            <div
              className={`h-[52dvh] min-h-80 min-w-0 min-[1260px]:h-auto min-[1260px]:min-h-0 min-[1260px]:flex-1 ${panelOpen ? '' : 'md:h-auto md:flex-1'}`}
            >
              <FieldMap
                fields={fields}
                selectedFieldId={validSelectedFieldId}
                hoveredFieldId={hoveredFieldId}
                onSelectField={selectField}
                onHoverField={setHoveredFieldId}
                loading={fieldQuery.isPending}
                error={fieldQuery.isError}
                controls={
                  !panelOpen && (
                    <Button
                      variant="secondary"
                      className="shadow-sm"
                      onClick={showPanel}
                      autoFocus
                      aria-expanded={false}
                      title="Show details panel"
                    >
                      <span className="min-[1260px]:hidden" aria-hidden="true">
                        <FontAwesomeIcon icon={faAnglesUp} />
                      </span>
                      <span className="hidden min-[1260px]:inline-block" aria-hidden="true">
                        <FontAwesomeIcon icon={faAnglesLeft} />
                      </span>
                      Show details
                    </Button>
                  )
                }
              />
            </div>
          </div>
          {panelOpen && (
            <FieldContextPanel
              id={contextPanelId}
              fields={fields}
              selectedField={selectedField}
              loading={fieldQuery.isPending}
              error={fieldQuery.isError}
              onSelectField={selectField}
              onCollapse={() => setPanelOpen(false)}
              focusOnMount={focusPanelOnOpen}
            />
          )}
        </div>
      </section>
    </AppShell>
  );
}

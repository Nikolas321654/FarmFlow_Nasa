import { faClockRotateLeft } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { FieldDraftForm } from '@/features/create-field';
import { DrawFieldMap } from '@/features/draw-field';
import { GeoJsonImportButton } from '@/features/import-geojson';
import { Button } from '@/shared/ui';
import { useAddFieldDraft } from '../model/useAddFieldDraft';

export function AddFieldPage() {
  const flow = useAddFieldDraft();

  return (
    <section
      aria-label="Add field workspace"
      className="min-w-0 md:h-full md:overflow-y-auto min-[1260px]:overflow-hidden"
    >
      <div className="grid min-w-0 gap-3 p-3 sm:gap-4 sm:p-4 min-[1260px]:h-full min-[1260px]:grid-cols-[minmax(0,1fr)_360px] min-[1260px]:gap-0 min-[1260px]:p-0">
        <div className="flex min-w-0 flex-col gap-3 min-[1260px]:min-h-0 min-[1260px]:p-4">
          <div className="min-w-0">
            <h1 className="type-page-title">Add field</h1>
            <p className="mt-1 text-ui-sm text-text-secondary">
              Draw the field boundary on the map or import it from a GeoJSON file, then add the
              field details.
            </p>
          </div>
          <div className="h-[56dvh] min-h-80 min-w-0 min-[1260px]:h-auto min-[1260px]:min-h-0 min-[1260px]:flex-1">
            <DrawFieldMap
              boundary={flow.draft.boundary}
              onBoundaryChange={(boundary) =>
                flow.updateDraft({ boundary, boundarySource: boundary ? { kind: 'drawn' } : null })
              }
              onBoundaryError={flow.setMapError}
            />
          </div>
        </div>

        <aside
          aria-label="Field configuration"
          className="flex min-h-0 min-w-0 flex-col overflow-hidden rounded-control border border-border bg-surface min-[1260px]:rounded-none min-[1260px]:border-y-0 min-[1260px]:border-r-0"
        >
          <FieldDraftForm
            draft={flow.draft}
            errors={flow.errors}
            onChange={flow.updateDraft}
            onSubmit={flow.submit}
            onCancel={flow.cancel}
            saving={flow.saving}
            checkingSession={flow.checkingSession}
            submitError={flow.submitError}
            notice={
              flow.restored && (
                <div
                  role="status"
                  className="flex items-start gap-3 rounded-control bg-selection px-3 py-2.5"
                >
                  <FontAwesomeIcon
                    icon={faClockRotateLeft}
                    className="mt-0.5 text-primary"
                    aria-hidden="true"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="type-item-title">Your draft was restored</p>
                    <p className="type-label">Review the details and save when you are ready.</p>
                  </div>
                  <button
                    type="button"
                    onClick={flow.dismissRestored}
                    className="text-ui-xs font-medium text-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  >
                    Dismiss
                  </button>
                </div>
              )
            }
            boundaryActions={
              <GeoJsonImportButton
                disabled={flow.saving}
                onImport={(boundary, fileName) =>
                  flow.updateDraft({ boundary, boundarySource: { kind: 'imported', fileName } })
                }
              />
            }
            footer={
              flow.confirmingDiscard ? (
                <div role="alert" className="grid gap-3">
                  <p className="text-ui-sm text-text-primary">
                    Discard this field draft? The boundary and details will be lost.
                  </p>
                  <div className="flex flex-wrap justify-end gap-2">
                    <Button variant="secondary" onClick={flow.keepEditing}>
                      Keep editing
                    </Button>
                    <Button
                      onClick={flow.discard}
                      className="border-status-danger bg-status-danger enabled:hover:border-status-danger enabled:hover:bg-status-danger/90"
                    >
                      Discard draft
                    </Button>
                  </div>
                </div>
              ) : undefined
            }
          />
        </aside>
      </div>
    </section>
  );
}

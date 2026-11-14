import { useState } from 'react';
import { useFields } from '@/entities/field';
import { useCurrentUser } from '@/entities/user';
import { polygonPositions } from '@/shared/lib/geo';
import { AppShell } from '@/widgets/app-shell';
import { FieldMap } from '@/widgets/field-map';
import { FieldSidebar } from '@/widgets/field-sidebar';
import { NeedsAttention } from '@/widgets/needs-attention';

export function FieldExplorerPage() {
  const fieldQuery = useFields();
  const userQuery = useCurrentUser();
  const fields = fieldQuery.data ?? [];
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'demo' | 'mine'>('demo');

  const validSelectedFieldId = fields.some(
    (field) => field.id === selectedFieldId && polygonPositions(field.boundary),
  )
    ? selectedFieldId
    : null;

  const selectField = (id: string | null) => {
    setSelectedFieldId(id);
    if (id) {
      const field = fields.find((item) => item.id === id);
      if (field) setActiveTab(field.isDemo ? 'demo' : 'mine');
    }
  };

  return (
    <AppShell
      account={userQuery.data?.authenticated ? userQuery.data.user : undefined}
      panelContent={
        <FieldSidebar
          fields={fields}
          selectedFieldId={validSelectedFieldId}
          onSelectField={selectField}
          activeTab={activeTab}
          onTabChange={setActiveTab}
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
        aria-label="Field overview workspace"
        className="min-w-0 p-3 sm:p-4 md:h-full md:overflow-y-auto"
      >
        <div className="grid gap-3 sm:gap-4 md:h-full md:min-h-[560px] md:grid-rows-[auto_minmax(320px,3fr)_minmax(170px,1fr)]">
          <div className="flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-1">
            <h1 className="text-xl text-text-primary sm:text-2xl">Field overview</h1>
            {!fieldQuery.isError && (
              <span className="text-ui-sm text-text-secondary">
                {fieldQuery.isPending
                  ? 'Loading fields…'
                  : `${fields.length} ${fields.length === 1 ? 'field' : 'fields'}`}
              </span>
            )}
          </div>
          <div className="h-[52dvh] min-h-80 min-w-0 md:h-auto md:min-h-0">
            <FieldMap
              fields={fields}
              selectedFieldId={validSelectedFieldId}
              onSelectField={selectField}
              loading={fieldQuery.isPending}
              error={fieldQuery.isError}
            />
          </div>
          <NeedsAttention
            fields={fields}
            loading={fieldQuery.isPending}
            error={fieldQuery.isError}
            onSelectField={selectField}
          />
        </div>
      </section>
    </AppShell>
  );
}

import { useState } from 'react';
import { useFields } from '@/entities/field';
import { useCurrentUser } from '@/entities/user';
import { polygonPositions } from '@/shared/lib/geo';
import { AppShell } from '@/widgets/app-shell';
import { FieldMap } from '@/widgets/field-map';
import { FieldSidebar } from '@/widgets/field-sidebar';

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
      <section aria-label="Field map workspace" className="h-full min-w-0">
        <FieldMap
          fields={fields}
          selectedFieldId={validSelectedFieldId}
          onSelectField={selectField}
          loading={fieldQuery.isPending}
          error={fieldQuery.isError}
        />
      </section>
    </AppShell>
  );
}

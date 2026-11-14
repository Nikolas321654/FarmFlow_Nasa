import { useState } from 'react';
import { useFields } from '@/entities/field';
import { polygonPositions } from '@/shared/lib/geo';
import { FieldMap } from '@/widgets/field-map';

export function FieldExplorerPage() {
  const { data: fields = [], isPending, isError } = useFields();
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);

  const validSelectedFieldId = fields.some(
    (field) => field.id === selectedFieldId && polygonPositions(field.boundary),
  )
    ? selectedFieldId
    : null;

  return (
    <section aria-label="Field map workspace" className="h-full min-w-0">
      <FieldMap
        fields={fields}
        selectedFieldId={validSelectedFieldId}
        onSelectField={setSelectedFieldId}
        loading={isPending}
        error={isError}
      />
    </section>
  );
}

import type { FieldSummary } from '@/entities/field';
import { ApiError } from '@/shared/api';
import { Button, Dialog } from '@/shared/ui';
import { useDeleteField } from '../model/useDeleteField';

type DeleteFieldDialogProps = {
  field: FieldSummary;
  onClose: () => void;
  onDeleted: (field: FieldSummary) => void;
};

function deleteErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.kind === 'unauthorized')
      return 'Your session has expired. Sign in again to delete this field.';
    if (error.kind === 'forbidden')
      return 'This field cannot be deleted. Demo fields are shared and protected.';
    if (error.kind === 'not-found')
      return 'This field no longer exists or is not available to you.';
    if (error.kind === 'network') return 'Unable to reach Rivnova. The field was not deleted.';
  }
  return 'The field could not be deleted. Please try again.';
}

export function DeleteFieldDialog({ field, onClose, onDeleted }: DeleteFieldDialogProps) {
  const deleteField = useDeleteField();

  return (
    <Dialog
      open
      onClose={onClose}
      dismissible={!deleteField.isPending}
      size="sm"
      title="Delete field?"
      description={`${field.name} will be removed from My Fields together with its analytics. This cannot be undone.`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={deleteField.isPending}>
            Cancel
          </Button>
          <Button
            onClick={() =>
              void deleteField
                .mutateAsync(field.id)
                .then(() => onDeleted(field))
                .catch(() => undefined)
            }
            loading={deleteField.isPending}
            className="border-status-danger bg-status-danger enabled:hover:border-status-danger enabled:hover:bg-status-danger/90"
          >
            {deleteField.isPending ? 'Deleting…' : 'Delete field'}
          </Button>
        </>
      }
    >
      {deleteField.isError ? (
        <p role="alert" className="text-ui-sm text-status-danger">
          {deleteErrorMessage(deleteField.error)}
        </p>
      ) : (
        <p className="text-ui-sm text-text-secondary">
          Demo fields and your other fields are not affected.
        </p>
      )}
    </Dialog>
  );
}

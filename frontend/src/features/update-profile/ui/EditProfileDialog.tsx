import { useId, useState, type FormEvent } from 'react';
import type { UserProfile } from '@/entities/user';
import { ApiError } from '@/shared/api';
import { Button, Dialog, TextField } from '@/shared/ui';
import { displayNameError, displayNameMaxLength } from '../model/displayName';
import { useUpdateProfile } from '../model/useUpdateProfile';

type EditProfileDialogProps = {
  user: UserProfile;
  onClose: () => void;
};

function saveErrorMessage(error: unknown): string {
  if (error instanceof ApiError && error.kind === 'unauthorized') {
    return 'Your session has expired. Sign in again to edit your profile.';
  }
  if (error instanceof ApiError && error.kind === 'network') {
    return 'Unable to reach Rivnova. Your changes were not saved.';
  }
  if (error instanceof ApiError && error.status === 400) {
    const errors = (error.details as { errors?: Record<string, string[]> } | undefined)?.errors;
    const firstError = errors ? Object.values(errors).flat()[0] : undefined;
    return firstError ?? error.message;
  }
  return 'Your changes could not be saved. Please try again.';
}

export function EditProfileDialog({ user, onClose }: EditProfileDialogProps) {
  const formId = useId();
  const nameId = useId();
  const emailId = useId();
  const updateProfile = useUpdateProfile();
  const [displayName, setDisplayName] = useState(user.displayName);
  const [submitted, setSubmitted] = useState(false);
  const validationError = submitted ? displayNameError(displayName) : null;
  const remaining = displayNameMaxLength - displayName.trim().length;

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
    if (displayNameError(displayName) || updateProfile.isPending) return;
    updateProfile.mutate({ displayName: displayName.trim() }, { onSuccess: onClose });
  };

  return (
    <Dialog
      open
      onClose={onClose}
      dismissible={!updateProfile.isPending}
      title="Edit profile"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={updateProfile.isPending}>
            Cancel
          </Button>
          <Button type="submit" form={formId} loading={updateProfile.isPending}>
            Save changes
          </Button>
        </>
      }
    >
      <form id={formId} noValidate onSubmit={submit} className="grid gap-5">
        <TextField
          id={nameId}
          label="Display name"
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
          autoComplete="name"
          autoFocus
          disabled={updateProfile.isPending}
          error={validationError ?? undefined}
          hint={
            remaining >= 0
              ? `Shown in Rivnova. ${remaining} characters left.`
              : `Shown in Rivnova. ${Math.abs(remaining)} characters over the limit.`
          }
        />
        <TextField
          id={emailId}
          label="Email"
          type="email"
          value={user.email}
          readOnly
          hint="Managed by your Google account."
          className="bg-surface-muted text-text-secondary enabled:hover:border-border"
        />
        {updateProfile.isError && (
          <p role="alert" className="text-ui-sm text-status-danger">
            {saveErrorMessage(updateProfile.error)}
          </p>
        )}
      </form>
    </Dialog>
  );
}

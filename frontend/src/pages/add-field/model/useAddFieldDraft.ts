import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCurrentUser, userQueryKeys } from '@/entities/user';
import {
  clearStoredDraft,
  describeCreateFieldError,
  emptyFieldDraft,
  isDraftStored,
  isFieldDraftDirty,
  loadStoredDraft,
  saveStoredDraft,
  toCreateFieldRequest,
  useCreateField,
  validateFieldDraft,
  type FieldDraft,
  type FieldDraftErrors,
} from '@/features/create-field';
import { useSignInDialog } from '@/features/sign-in';

const addFieldPath = '/fields/new';
const signInReason =
  'Sign in with Google to save this field to My Fields. Your draft is kept in this browser tab while you sign in.';

export function useAddFieldDraft() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const session = useCurrentUser();
  const { openSignIn } = useSignInDialog();
  const createField = useCreateField();
  const [initialDraft] = useState(() => loadStoredDraft());
  const [draft, setDraft] = useState<FieldDraft>(initialDraft ?? emptyFieldDraft);
  const [restored, setRestored] = useState(initialDraft !== null);
  const [showValidation, setShowValidation] = useState(false);
  const [serverErrors, setServerErrors] = useState<FieldDraftErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const [confirmingDiscard, setConfirmingDiscard] = useState(false);

  const dirty = isFieldDraftDirty(draft);
  const boundaryError = draft.boundary ? validateFieldDraft(draft).boundary : undefined;
  const errors: FieldDraftErrors = {
    ...(boundaryError ? { boundary: boundaryError } : {}),
    ...(showValidation ? validateFieldDraft(draft) : {}),
    ...serverErrors,
    ...(mapError ? { boundary: mapError } : {}),
  };

  useEffect(() => {
    if (!dirty || createField.isPending) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (isDraftStored(draft)) return;
      event.preventDefault();
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [dirty, draft, createField.isPending]);

  const updateDraft = (patch: Partial<FieldDraft>) => {
    setDraft((current) => ({ ...current, ...patch }));
    setServerErrors((current) => {
      const next = { ...current };
      for (const key of Object.keys(patch)) delete next[key as keyof FieldDraftErrors];
      return next;
    });
    if ('boundary' in patch) setMapError(null);
    setSubmitError(null);
    setConfirmingDiscard(false);
  };

  const requestSignIn = () => {
    saveStoredDraft(draft);
    openSignIn({ returnTo: addFieldPath, reason: signInReason });
  };

  const submit = () => {
    setShowValidation(true);
    setSubmitError(null);
    const request = toCreateFieldRequest(draft);
    if (!request || createField.isPending || session.isPending) return;
    if (session.isError) {
      setSubmitError('Rivnova could not check your session. Retry from the account panel.');
      return;
    }
    if (!session.data.authenticated) {
      requestSignIn();
      return;
    }
    createField.mutate(request, {
      onSuccess: (field) => {
        clearStoredDraft();
        navigate(`/?field=${encodeURIComponent(field.id)}`, { replace: true });
      },
      onError: (error) => {
        const failure = describeCreateFieldError(error);
        setServerErrors(failure.fieldErrors);
        setSubmitError(failure.message);
        if (failure.sessionExpired) {
          void queryClient.invalidateQueries({ queryKey: userQueryKeys.current });
          requestSignIn();
        }
      },
    });
  };

  const cancel = () => {
    if (dirty) setConfirmingDiscard(true);
    else navigate('/');
  };

  const discard = () => {
    clearStoredDraft();
    setDraft(emptyFieldDraft);
    navigate('/');
  };

  return {
    draft,
    errors,
    updateDraft,
    setMapError,
    submit,
    cancel,
    discard,
    keepEditing: () => setConfirmingDiscard(false),
    confirmingDiscard,
    restored,
    dismissRestored: () => setRestored(false),
    saving: createField.isPending,
    checkingSession: session.isPending,
    submitError,
  };
}

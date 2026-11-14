import { ApiError } from '@/shared/api';
import type { FieldDraftErrors } from './fieldDraft';

export type CreateFieldFailure = {
  message: string;
  fieldErrors: FieldDraftErrors;
  sessionExpired: boolean;
};

const fieldKeys: Record<string, keyof FieldDraftErrors> = {
  name: 'name',
  croptype: 'cropType',
  plantedat: 'plantedAt',
  boundary: 'boundary',
};

function serverFieldErrors(details: unknown): FieldDraftErrors {
  const errors = (details as { errors?: Record<string, string[]> } | undefined)?.errors;
  const result: FieldDraftErrors = {};
  if (!errors || typeof errors !== 'object') return result;
  for (const [key, messages] of Object.entries(errors)) {
    const field = fieldKeys[key.replace(/^\$\.?/, '').toLowerCase()];
    if (field && Array.isArray(messages) && messages[0]) result[field] = String(messages[0]);
  }
  return result;
}

export function describeCreateFieldError(error: unknown): CreateFieldFailure {
  if (error instanceof ApiError) {
    if (error.kind === 'unauthorized') {
      return {
        message: 'Your session has expired. Sign in again to save this field.',
        fieldErrors: {},
        sessionExpired: true,
      };
    }
    if (error.kind === 'forbidden') {
      return {
        message: 'Rivnova could not verify this request. Refresh the page and try saving again.',
        fieldErrors: {},
        sessionExpired: false,
      };
    }
    if (error.kind === 'network') {
      return {
        message: 'Unable to reach Rivnova. Check your connection and try again.',
        fieldErrors: {},
        sessionExpired: false,
      };
    }
    if (error.status === 400) {
      const fieldErrors = serverFieldErrors(error.details);
      return {
        message:
          Object.keys(fieldErrors).length > 0
            ? 'Some details need attention before the field can be saved.'
            : error.message || 'The field details were rejected. Check them and try again.',
        fieldErrors,
        sessionExpired: false,
      };
    }
  }
  return {
    message: 'The field could not be saved because of a server problem. Please try again.',
    fieldErrors: {},
    sessionExpired: false,
  };
}

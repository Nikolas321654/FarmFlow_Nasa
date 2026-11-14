import { ApiError, apiRequest, apiUrl } from '@/shared/api';
import type { CurrentUserResponse, UpdateProfileRequest, UserProfile } from '../model/types';

export function getCurrentUser(signal?: AbortSignal): Promise<CurrentUserResponse> {
  return apiRequest('/auth/me', { signal });
}

export function updateMyProfile(request: UpdateProfileRequest): Promise<UserProfile> {
  return apiRequest('/users/me', { method: 'PATCH', json: request });
}

export function signOut(): Promise<void> {
  return apiRequest('/auth/logout', { method: 'POST' });
}

export function googleSignInUrl(returnUrl: string): string {
  return apiUrl(`/auth/google?returnUrl=${encodeURIComponent(returnUrl)}`);
}

export async function ensureGoogleSignInAvailable(url: string): Promise<void> {
  let response: Response;
  try {
    response = await fetch(url, { credentials: 'include', redirect: 'manual' });
  } catch (error) {
    throw new ApiError('network', null, 'Unable to reach the server.', undefined, error);
  }
  if (response.type === 'opaqueredirect' || (response.status >= 300 && response.status < 400)) {
    return;
  }
  if (response.status === 503) {
    throw new ApiError('server', 503, 'Google sign-in is not configured on the server yet.');
  }
  throw new ApiError(
    response.status >= 500 ? 'server' : 'http',
    response.status,
    'Google sign-in is unavailable right now.',
  );
}

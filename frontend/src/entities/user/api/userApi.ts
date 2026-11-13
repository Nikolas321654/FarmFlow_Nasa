import { apiRequest } from '@/shared/api';
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

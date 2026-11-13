import { apiRequest } from '@/shared/api';
import type {
  BiomassTrend,
  EarlyStressAlert,
  FieldDashboard,
  WorkabilityWindow,
} from '../model/types';

function fieldPath(id: string): string {
  return `/fields/${encodeURIComponent(id)}`;
}

export function getFieldDashboard(
  id: string,
  days?: number,
  signal?: AbortSignal,
): Promise<FieldDashboard> {
  const query = days === undefined ? '' : `?days=${encodeURIComponent(days)}`;
  return apiRequest(`${fieldPath(id)}/dashboard${query}`, { signal });
}

export function getWorkabilityWindow(id: string, signal?: AbortSignal): Promise<WorkabilityWindow> {
  return apiRequest(`${fieldPath(id)}/workability`, { signal });
}

export function getEarlyStressAlert(id: string, signal?: AbortSignal): Promise<EarlyStressAlert> {
  return apiRequest(`${fieldPath(id)}/stress`, { signal });
}

export function getBiomassTrend(id: string, signal?: AbortSignal): Promise<BiomassTrend> {
  return apiRequest(`${fieldPath(id)}/biomass`, { signal });
}

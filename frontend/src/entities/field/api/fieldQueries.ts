import { queryOptions, useQueries, useQuery } from '@tanstack/react-query';
import {
  getBiomassTrend,
  getEarlyStressAlert,
  getFieldDashboard,
  getWorkabilityWindow,
} from './analyticsApi';
import { getFieldById, getFields } from './fieldApi';
import { fieldQueryKeys } from './queryKeys';

const guidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidFieldId(id: string | null | undefined): id is string {
  return typeof id === 'string' && guidPattern.test(id);
}

export function useFields() {
  return useQuery({
    queryKey: fieldQueryKeys.list(),
    queryFn: ({ signal }) => getFields(signal),
  });
}

export function useField(id: string | null | undefined) {
  return useQuery({
    queryKey: fieldQueryKeys.detail(id ?? ''),
    queryFn: ({ signal }) => getFieldById(id ?? '', signal),
    enabled: isValidFieldId(id),
  });
}

function fieldDashboardQuery(id: string | null | undefined, days?: number) {
  return queryOptions({
    queryKey: fieldQueryKeys.dashboard(id ?? '', days),
    queryFn: ({ signal }) => getFieldDashboard(id ?? '', days, signal),
    enabled: isValidFieldId(id),
  });
}

export function useFieldDashboard(id: string | null | undefined, days?: number) {
  return useQuery(fieldDashboardQuery(id, days));
}

export function useFieldDashboards(ids: string[], days?: number) {
  return useQueries({ queries: ids.map((id) => fieldDashboardQuery(id, days)) });
}

export function useFieldWorkability(id: string | null | undefined) {
  return useQuery({
    queryKey: fieldQueryKeys.workability(id ?? ''),
    queryFn: ({ signal }) => getWorkabilityWindow(id ?? '', signal),
    enabled: isValidFieldId(id),
  });
}

export function useFieldStress(id: string | null | undefined) {
  return useQuery({
    queryKey: fieldQueryKeys.stress(id ?? ''),
    queryFn: ({ signal }) => getEarlyStressAlert(id ?? '', signal),
    enabled: isValidFieldId(id),
  });
}

export function useFieldBiomass(id: string | null | undefined) {
  return useQuery({
    queryKey: fieldQueryKeys.biomass(id ?? ''),
    queryFn: ({ signal }) => getBiomassTrend(id ?? '', signal),
    enabled: isValidFieldId(id),
  });
}

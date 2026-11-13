export const fieldQueryKeys = {
  all: ['fields'] as const,
  list: () => ['fields', 'list'] as const,
  detail: (id: string) => ['fields', 'detail', id] as const,
  dashboard: (id: string, days?: number) =>
    ['fields', 'detail', id, 'dashboard', days ?? 14] as const,
  workability: (id: string) => ['fields', 'detail', id, 'workability'] as const,
  stress: (id: string) => ['fields', 'detail', id, 'stress'] as const,
  biomass: (id: string) => ['fields', 'detail', id, 'biomass'] as const,
};

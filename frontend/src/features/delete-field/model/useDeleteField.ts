import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteField, fieldQueryKeys, type FieldSummary } from '@/entities/field';

export function useDeleteField() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteField,
    onSuccess: async (_, id) => {
      await queryClient.cancelQueries({ queryKey: fieldQueryKeys.detail(id) });
      queryClient
        .getQueryCache()
        .findAll({ queryKey: fieldQueryKeys.detail(id) })
        .forEach((query) => query.reset());
      queryClient.removeQueries({ queryKey: fieldQueryKeys.detail(id) });
      queryClient.setQueryData<FieldSummary[]>(fieldQueryKeys.list(), (fields) =>
        fields?.filter((field) => field.id !== id),
      );
      await queryClient.invalidateQueries({ queryKey: fieldQueryKeys.list() });
    },
  });
}

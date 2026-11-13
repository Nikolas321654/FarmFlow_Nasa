import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteField, fieldQueryKeys } from '@/entities/field';

export function useDeleteField() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteField,
    onSuccess: async (_, id) => {
      await queryClient.cancelQueries({ queryKey: fieldQueryKeys.detail(id) });
      // Clear active observers without refetching the deleted field.
      queryClient
        .getQueryCache()
        .findAll({ queryKey: fieldQueryKeys.detail(id) })
        .forEach((query) => query.reset());
      queryClient.removeQueries({ queryKey: fieldQueryKeys.detail(id) });
      await queryClient.invalidateQueries({ queryKey: fieldQueryKeys.list() });
    },
  });
}

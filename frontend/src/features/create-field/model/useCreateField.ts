import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createField, fieldQueryKeys } from '@/entities/field';

export function useCreateField() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createField,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: fieldQueryKeys.list() }),
  });
}

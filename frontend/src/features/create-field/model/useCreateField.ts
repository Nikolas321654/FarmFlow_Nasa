import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createField, fieldQueryKeys, type FieldSummary } from '@/entities/field';

export function useCreateField() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createField,
    onSuccess: (field) => {
      queryClient.setQueryData<FieldSummary[]>(fieldQueryKeys.list(), (fields) =>
        fields && !fields.some((item) => item.id === field.id) ? [...fields, field] : fields,
      );
      return queryClient.invalidateQueries({ queryKey: fieldQueryKeys.list() });
    },
  });
}

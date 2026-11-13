import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateMyProfile, userQueryKeys } from '@/entities/user';

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateMyProfile,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: userQueryKeys.current }),
  });
}

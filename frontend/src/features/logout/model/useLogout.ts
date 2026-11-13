import { useMutation, useQueryClient } from '@tanstack/react-query';
import { fieldQueryKeys } from '@/entities/field';
import { signOut, userQueryKeys, type CurrentUserResponse } from '@/entities/user';

export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: signOut,
    onSuccess: async () => {
      await queryClient.cancelQueries({ queryKey: fieldQueryKeys.all });
      await queryClient.resetQueries({ queryKey: fieldQueryKeys.all });
      queryClient.removeQueries({ queryKey: fieldQueryKeys.all });
      queryClient.setQueryData<CurrentUserResponse>(userQueryKeys.current, {
        authenticated: false,
        user: null,
      });
      await queryClient.invalidateQueries({ queryKey: userQueryKeys.current });
    },
  });
}

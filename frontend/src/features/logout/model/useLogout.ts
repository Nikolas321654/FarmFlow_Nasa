import { useMutation, useQueryClient } from '@tanstack/react-query';
import { fieldQueryKeys } from '@/entities/field';
import { signOut, userQueryKeys, type CurrentUserResponse } from '@/entities/user';

export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: signOut,
    onSuccess: async () => {
      await queryClient.cancelQueries({ queryKey: fieldQueryKeys.all });
      queryClient
        .getQueryCache()
        .findAll({ queryKey: fieldQueryKeys.all })
        .forEach((query) => {
          query.reset();
        });
      queryClient.removeQueries({ queryKey: fieldQueryKeys.details() });
      queryClient.setQueryData<CurrentUserResponse>(userQueryKeys.current, {
        authenticated: false,
        user: null,
      });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: fieldQueryKeys.list() }),
        queryClient.invalidateQueries({ queryKey: userQueryKeys.current }),
      ]);
    },
  });
}

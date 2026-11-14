import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateMyProfile, userQueryKeys, type CurrentUserResponse } from '@/entities/user';

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateMyProfile,
    onSuccess: (user) => {
      queryClient.setQueryData<CurrentUserResponse>(userQueryKeys.current, {
        authenticated: true,
        user,
      });
      return queryClient.invalidateQueries({ queryKey: userQueryKeys.current });
    },
  });
}

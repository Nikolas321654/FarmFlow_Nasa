import { useQuery } from '@tanstack/react-query';
import { getCurrentUser } from './userApi';
import { userQueryKeys } from './queryKeys';

export function useCurrentUser() {
  return useQuery({
    queryKey: userQueryKeys.current,
    queryFn: ({ signal }) => getCurrentUser(signal),
  });
}

import { useMutation } from '@tanstack/react-query';
import { ensureGoogleSignInAvailable, googleSignInUrl } from '@/entities/user';
import { absoluteReturnUrl } from './returnUrl';

export function useGoogleSignIn() {
  return useMutation({
    mutationFn: async (returnPath: string) => {
      const url = googleSignInUrl(absoluteReturnUrl(returnPath));
      await ensureGoogleSignInAvailable(url);
      window.location.assign(url);
    },
  });
}

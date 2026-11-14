import { createContext, useContext } from 'react';

export type SignInRequest = {
  returnTo?: string;
  reason?: string;
};

export type SignInDialogContextValue = {
  openSignIn: (request?: SignInRequest) => void;
};

export const SignInDialogContext = createContext<SignInDialogContextValue | null>(null);

export function useSignInDialog(): SignInDialogContextValue {
  const context = useContext(SignInDialogContext);
  if (!context) throw new Error('useSignInDialog must be used inside SignInProvider.');
  return context;
}

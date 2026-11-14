import { QueryClientProvider } from '@tanstack/react-query';
import type { PropsWithChildren } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { SignInProvider } from '@/features/sign-in';
import { queryClient } from './queryClient';

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <SignInProvider>{children}</SignInProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

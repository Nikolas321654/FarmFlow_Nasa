import { useMemo, useState, type PropsWithChildren } from 'react';
import { useLocation } from 'react-router-dom';
import { currentReturnPath } from '../model/returnUrl';
import { SignInDialogContext, type SignInRequest } from '../model/signInDialogContext';
import { SignInDialog } from './SignInDialog';

type OpenSignIn = Required<Pick<SignInRequest, 'returnTo'>> & Pick<SignInRequest, 'reason'>;

export function SignInProvider({ children }: PropsWithChildren) {
  const location = useLocation();
  const [request, setRequest] = useState<OpenSignIn | null>(null);
  const returnPath = currentReturnPath(location);

  const value = useMemo(
    () => ({
      openSignIn: (next?: SignInRequest) =>
        setRequest({ returnTo: next?.returnTo ?? returnPath, reason: next?.reason }),
    }),
    [returnPath],
  );

  return (
    <SignInDialogContext.Provider value={value}>
      {children}
      {request && (
        <SignInDialog
          returnTo={request.returnTo}
          reason={request.reason}
          onClose={() => setRequest(null)}
        />
      )}
    </SignInDialogContext.Provider>
  );
}

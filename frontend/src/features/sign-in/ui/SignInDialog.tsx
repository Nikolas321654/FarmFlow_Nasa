import { faArrowRight } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { ApiError } from '@/shared/api';
import { Button, Dialog } from '@/shared/ui';
import { useGoogleSignIn } from '../model/useGoogleSignIn';

type SignInDialogProps = {
  returnTo: string;
  reason?: string;
  onClose: () => void;
};

function signInErrorMessage(error: unknown): string {
  if (error instanceof ApiError && error.kind === 'network') {
    return 'Unable to reach Rivnova right now. Check your connection and try again.';
  }
  if (error instanceof ApiError && error.status === 503) {
    return 'Google sign-in is not configured on the server yet. You can keep exploring the demo fields.';
  }
  return 'Google sign-in is unavailable right now. Please try again later.';
}

export function SignInDialog({ returnTo, reason, onClose }: SignInDialogProps) {
  const signIn = useGoogleSignIn();
  const redirecting = signIn.isPending || signIn.isSuccess;

  return (
    <Dialog
      open
      onClose={onClose}
      dismissible={!redirecting}
      size="sm"
      title="Sign in to Rivnova"
      description={reason ?? 'Sign in with Google to save and manage your own fields.'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={redirecting}>
            Cancel
          </Button>
          <Button onClick={() => signIn.mutate(returnTo)} loading={redirecting}>
            {redirecting ? 'Opening Google…' : 'Continue with Google'}
            {!redirecting && <FontAwesomeIcon icon={faArrowRight} aria-hidden="true" />}
          </Button>
        </>
      }
    >
      <p className="text-ui-sm text-text-secondary">
        You will be redirected to Google and brought back here afterwards. Demo fields stay
        available without an account.
      </p>
      {signIn.isError && (
        <p role="alert" className="mt-3 text-ui-sm text-status-danger">
          {signInErrorMessage(signIn.error)}
        </p>
      )}
    </Dialog>
  );
}

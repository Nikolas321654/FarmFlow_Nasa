import { faRightToBracket, faRotateRight } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useState } from 'react';
import { useCurrentUser } from '@/entities/user';
import { useSignInDialog } from '@/features/sign-in';
import { EditProfileDialog } from '@/features/update-profile';
import { Button } from '@/shared/ui';
import { AccountMenu } from './AccountMenu';

export function AccountFooter() {
  const session = useCurrentUser();
  const { openSignIn } = useSignInDialog();
  const [editingProfile, setEditingProfile] = useState(false);

  if (session.isPending) {
    return (
      <Button variant="secondary" loading className="w-full justify-start px-3">
        Checking account…
      </Button>
    );
  }

  if (session.isError) {
    return (
      <div role="alert" className="grid gap-2">
        <p className="type-label">Unable to check your session.</p>
        <Button
          variant="secondary"
          onClick={() => void session.refetch()}
          loading={session.isFetching}
          className="w-full justify-start px-3"
        >
          {!session.isFetching && <FontAwesomeIcon icon={faRotateRight} aria-hidden="true" />}
          Retry account
        </Button>
      </div>
    );
  }

  if (!session.data.authenticated) {
    return (
      <Button
        variant="secondary"
        onClick={() => openSignIn()}
        aria-haspopup="dialog"
        className="w-full justify-start px-3"
      >
        <FontAwesomeIcon icon={faRightToBracket} aria-hidden="true" />
        Sign in
      </Button>
    );
  }

  return (
    <>
      <AccountMenu user={session.data.user} onEditProfile={() => setEditingProfile(true)} />
      {editingProfile && (
        <EditProfileDialog user={session.data.user} onClose={() => setEditingProfile(false)} />
      )}
    </>
  );
}

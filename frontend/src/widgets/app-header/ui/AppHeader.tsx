import { faMap, faPlus, faRightToBracket, faUser } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Link, NavLink } from 'react-router-dom';
import { BrandLogo, Button } from '@/shared/ui';

type HeaderAccount = {
  displayName: string;
  avatarUrl?: string | null;
};

type AppHeaderProps = {
  account?: HeaderAccount | null;
  onSignIn?: () => void;
  onAccountMenu?: () => void;
};

export function AppHeader({ account, onSignIn, onAccountMenu }: AppHeaderProps) {
  return (
    <header className="border-b border-border bg-background">
      <div className="mx-auto flex w-full max-w-screen-2xl flex-wrap items-center justify-between gap-x-5 gap-y-3 px-4 py-3 sm:px-6 lg:px-10">
        <Link
          to="/"
          aria-label="Rivnova home"
          className="order-1 shrink-0 rounded-control focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <BrandLogo />
        </Link>

        <nav
          aria-label="Primary navigation"
          className="order-3 flex w-full items-center gap-3 sm:order-2 sm:w-auto sm:flex-1 sm:gap-6"
        >
          <NavLink
            to="/"
            end
            aria-label="Field Explorer"
            className={({ isActive }) =>
              `inline-flex min-h-11 items-center gap-2 rounded-control px-2 text-ui-sm font-semibold text-forest transition-colors hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${isActive ? 'bg-surface-muted' : ''}`
            }
          >
            <FontAwesomeIcon icon={faMap} aria-hidden="true" />
            <span>Fields</span>
          </NavLink>
          <NavLink
            to="/fields/new"
            className={({ isActive }) =>
              `inline-flex min-h-11 items-center gap-2 rounded-control px-4 text-ui-sm font-semibold text-forest transition-colors hover:bg-sage/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${isActive ? 'bg-sage/30' : 'bg-sage/20'}`
            }
          >
            <FontAwesomeIcon icon={faPlus} aria-hidden="true" />
            <span>Add Field</span>
          </NavLink>
        </nav>

        <div className="order-2 flex shrink-0 items-center sm:order-3 sm:ml-auto">
          {account ? (
            <Button
              variant="secondary"
              onClick={onAccountMenu}
              disabled={!onAccountMenu}
              aria-label={`Open account menu for ${account.displayName}`}
              className="rounded-full px-3"
            >
              {account.avatarUrl ? (
                <img src={account.avatarUrl} alt="" className="h-7 w-7 rounded-full object-cover" />
              ) : (
                <FontAwesomeIcon icon={faUser} aria-hidden="true" />
              )}
              <span className="hidden max-w-32 truncate md:inline">{account.displayName}</span>
            </Button>
          ) : (
            <Button
              variant="secondary"
              onClick={onSignIn}
              disabled={!onSignIn}
              className="rounded-full px-3 sm:px-4"
            >
              <FontAwesomeIcon icon={faRightToBracket} aria-hidden="true" />
              <span className="sm:hidden">Sign in</span>
              <span className="hidden sm:inline">Sign in with Google</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}

import { faMap, faPlus, faRightToBracket, faUser } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { ReactNode } from 'react';
import { Link, NavLink, Outlet, useMatch } from 'react-router-dom';
import { BrandLogo, Button } from '@/shared/ui';

type ShellAccount = {
  displayName: string;
  avatarUrl?: string | null;
};

type AppShellProps = {
  children?: ReactNode;
  account?: ShellAccount | null;
  onSignIn?: () => void;
  onAccountMenu?: () => void;
  panelTitle?: string;
  panelContent?: ReactNode;
};

export function AppShell({
  children,
  account,
  onSignIn,
  onAccountMenu,
  panelTitle,
  panelContent,
}: AppShellProps) {
  const isAddField = useMatch('/fields/new');
  const isFieldInsights = useMatch('/fields/:id');
  const currentPanelTitle =
    panelTitle ??
    (isAddField ? 'Field configuration' : isFieldInsights ? 'Field Insights' : 'Fields');

  return (
    <div className="relative flex min-h-dvh flex-col gap-3 bg-background p-3 sm:p-4 md:grid md:h-dvh md:grid-cols-[21rem_minmax(0,1fr)] xl:grid-cols-[23rem_minmax(0,1fr)]">
      <aside className="flex min-w-0 flex-col rounded-card border border-border bg-surface px-4 pb-5 pt-4 md:min-h-0 md:px-6 md:pt-6">
        <div className="pr-32 md:pr-0">
          <Link
            to="/"
            aria-label="Rivnova home"
            className="inline-block rounded-control focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <BrandLogo />
          </Link>
        </div>

        <nav
          aria-label="Primary navigation"
          className="mt-4 flex items-center gap-2 md:mt-8 md:flex-col md:items-stretch"
        >
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `inline-flex min-h-11 items-center gap-3 rounded-control px-3 text-ui-sm font-semibold text-text-primary transition-colors hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:w-full ${isActive ? 'bg-surface-muted' : ''}`
            }
          >
            {({ isActive }) => (
              <>
                <FontAwesomeIcon
                  icon={faMap}
                  aria-hidden="true"
                  className={isActive ? 'text-primary' : 'text-text-secondary'}
                />
                <span>Field Explorer</span>
              </>
            )}
          </NavLink>
          <NavLink
            to="/fields/new"
            className={({ isActive }) =>
              `inline-flex min-h-11 items-center justify-center gap-2 rounded-control bg-primary px-4 text-ui-sm font-semibold text-white transition-colors hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:w-full ${isActive ? 'bg-primary-hover' : ''}`
            }
          >
            <FontAwesomeIcon icon={faPlus} aria-hidden="true" />
            <span>Add Field</span>
          </NavLink>
        </nav>

        <section
          aria-label={currentPanelTitle}
          className="order-3 mt-5 max-h-64 min-h-16 overflow-y-auto border-t border-border pt-5 md:order-2 md:mt-8 md:max-h-none md:min-h-0 md:flex-1"
        >
          <h2 className="text-ui-sm font-semibold text-text-secondary">{currentPanelTitle}</h2>
          {panelContent}
        </section>

        <footer
          aria-label="Account"
          className="order-2 mt-5 shrink-0 border-t border-border pt-4 md:order-3 md:mt-4"
        >
          {account ? (
            <Button
              variant="secondary"
              onClick={onAccountMenu}
              disabled={!onAccountMenu}
              aria-label={`Open account menu for ${account.displayName}`}
              className="w-full justify-start rounded-control px-3"
            >
              {account.avatarUrl ? (
                <img src={account.avatarUrl} alt="" className="h-7 w-7 rounded-full object-cover" />
              ) : (
                <FontAwesomeIcon icon={faUser} aria-hidden="true" />
              )}
              <span className="truncate">{account.displayName}</span>
            </Button>
          ) : (
            <Button
              variant="secondary"
              onClick={onSignIn}
              disabled={!onSignIn}
              aria-label="Sign in with Google"
              className="w-full justify-start border-border bg-surface px-3 text-text-primary disabled:cursor-default! disabled:opacity-100!"
            >
              <FontAwesomeIcon icon={faRightToBracket} aria-hidden="true" />
              <span>Sign in</span>
            </Button>
          )}
        </footer>
      </aside>

      <main
        aria-label="Application workspace"
        className="relative isolate min-h-[55dvh] min-w-0 flex-1 rounded-card border border-border bg-surface-muted md:min-h-0 md:overflow-hidden"
      >
        {children ?? <Outlet />}
      </main>
    </div>
  );
}

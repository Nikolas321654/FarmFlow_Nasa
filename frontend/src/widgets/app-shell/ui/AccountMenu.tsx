import {
  faChevronUp,
  faPen,
  faRightFromBracket,
  faSpinner,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import type { UserProfile } from '@/entities/user';
import { useLogout } from '@/features/logout';
import { UserAvatar } from './UserAvatar';

type AccountMenuProps = {
  user: UserProfile;
  onEditProfile: () => void;
};

const itemClasses =
  'flex min-h-11 w-full items-center gap-3 rounded-control px-2.5 text-left text-ui-sm text-text-primary outline-none hover:bg-surface-muted focus-visible:bg-selection disabled:cursor-not-allowed disabled:opacity-60 md:min-h-9';

export function AccountMenu({ user, onEditProfile }: AccountMenuProps) {
  const [open, setOpen] = useState(false);
  const logout = useLogout();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerId = useId();
  const menuId = useId();

  const menuItems = () =>
    Array.from(menuRef.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]') ?? []);

  const close = (restoreFocus: boolean) => {
    setOpen(false);
    if (restoreFocus) triggerRef.current?.focus();
  };

  useEffect(() => {
    if (!open) return;
    menuItems()[0]?.focus();
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  const onMenuKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const items = menuItems().filter((item) => !item.disabled);
    const index = items.indexOf(document.activeElement as HTMLButtonElement);
    const focusAt = (next: number) => items[(next + items.length) % items.length]?.focus();
    if (event.key === 'Escape') {
      event.preventDefault();
      close(true);
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      focusAt(index + 1);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      focusAt(index - 1);
    } else if (event.key === 'Home') {
      event.preventDefault();
      focusAt(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      focusAt(items.length - 1);
    } else if (event.key === 'Tab') {
      setOpen(false);
    }
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        id={triggerId}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-label={`Account menu for ${user.displayName}`}
        onClick={() => setOpen((value) => !value)}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();
            setOpen(true);
          }
        }}
        className="flex min-h-11 w-full items-center gap-3 rounded-control border border-border bg-surface px-3 text-left text-ui-sm font-medium text-text-primary transition-colors hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        <UserAvatar url={user.avatarUrl} />
        <span className="min-w-0 flex-1 truncate">{user.displayName}</span>
        <FontAwesomeIcon
          icon={faChevronUp}
          aria-hidden="true"
          className={`text-ui-xs text-text-secondary transition-transform motion-reduce:transition-none ${open ? '' : 'rotate-180 md:rotate-0'} ${open ? 'md:rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div
          ref={menuRef}
          id={menuId}
          role="menu"
          aria-labelledby={triggerId}
          onKeyDown={onMenuKeyDown}
          className="absolute inset-x-0 top-full z-30 mt-2 rounded-card border border-border bg-surface p-1.5 shadow-lg md:top-auto md:bottom-full md:mb-2 md:mt-0"
        >
          <div className="flex items-center gap-3 px-2.5 pb-2.5 pt-2">
            <UserAvatar url={user.avatarUrl} size="md" />
            <div className="min-w-0">
              <p className="truncate type-item-title">{user.displayName}</p>
              <p className="truncate type-label">{user.email}</p>
            </div>
          </div>
          <div role="separator" className="mx-1 mb-1 h-px bg-border" />
          <button
            type="button"
            role="menuitem"
            tabIndex={-1}
            disabled={logout.isPending}
            onClick={() => {
              triggerRef.current?.focus();
              setOpen(false);
              onEditProfile();
            }}
            className={itemClasses}
          >
            <FontAwesomeIcon icon={faPen} className="w-4 text-text-secondary" aria-hidden="true" />
            Edit profile
          </button>
          <button
            type="button"
            role="menuitem"
            tabIndex={-1}
            disabled={logout.isPending}
            aria-busy={logout.isPending || undefined}
            onClick={() => logout.mutate()}
            className={itemClasses}
          >
            <FontAwesomeIcon
              icon={logout.isPending ? faSpinner : faRightFromBracket}
              spin={logout.isPending}
              className="w-4 text-text-secondary"
              aria-hidden="true"
            />
            {logout.isPending ? 'Logging out…' : 'Log out'}
          </button>
          {logout.isError && (
            <p role="alert" className="px-2.5 pb-1.5 pt-1 text-ui-xs text-status-danger">
              Logout failed. You are still signed in. Please try again.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

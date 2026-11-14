import { faUser } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useState } from 'react';

type UserAvatarProps = {
  url?: string | null;
  size?: 'sm' | 'md';
};

const sizeClasses = { sm: 'size-7 text-ui-xs', md: 'size-10 text-ui-sm' } as const;

export function UserAvatar({ url, size = 'sm' }: UserAvatarProps) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);

  if (url && failedUrl !== url) {
    return (
      <img
        src={url}
        alt=""
        referrerPolicy="no-referrer"
        onError={() => setFailedUrl(url)}
        className={`shrink-0 rounded-full object-cover ${sizeClasses[size]}`}
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className={`grid shrink-0 place-items-center rounded-full bg-selection text-primary ${sizeClasses[size]}`}
    >
      <FontAwesomeIcon icon={faUser} />
    </span>
  );
}

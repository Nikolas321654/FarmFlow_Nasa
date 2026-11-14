const relativeFormatter = new Intl.RelativeTimeFormat('en-US', {
  numeric: 'auto',
  style: 'narrow',
});

export function formatTimeAgo(iso: string, now: number = Date.now()): string | null {
  const timestamp = Date.parse(iso);
  if (!Number.isFinite(timestamp)) return null;
  const minutes = Math.round((now - timestamp) / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return relativeFormatter.format(-minutes, 'minute');
  const hours = Math.round(minutes / 60);
  if (hours < 48) return relativeFormatter.format(-hours, 'hour');
  return relativeFormatter.format(-Math.round(hours / 24), 'day');
}

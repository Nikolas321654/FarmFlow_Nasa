import { faSatellite } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { formatTimeAgo } from '@/shared/lib/time';
import { MetaList } from '@/shared/ui';
import type { DataFreshness } from '../model/overview';

type DataFreshnessFooterProps = {
  freshness: DataFreshness | null;
};

const dataSources = ['NASA POWER', 'SMAP', 'MODIS'];

export function DataFreshnessFooter({ freshness }: DataFreshnessFooterProps) {
  const updated = freshness?.lastUpdatedUtc ? formatTimeAgo(freshness.lastUpdatedUtc) : null;

  return (
    <footer className="flex shrink-0 flex-wrap items-center gap-x-2 gap-y-1 border-t border-border px-5 py-3 text-ui-xs text-text-secondary">
      <FontAwesomeIcon icon={faSatellite} aria-hidden="true" />
      <MetaList className="min-w-0">
        {dataSources}
        {updated && (
          <time dateTime={freshness?.lastUpdatedUtc ?? undefined}>updated {updated}</time>
        )}
      </MetaList>
      {freshness?.usesDemoData && (
        <span
          className="rounded-badge border border-border px-2 py-0.5 text-ui-2xs font-medium"
          title="Values come from deterministic demo fixtures, not a live NASA request"
        >
          Demo data
        </span>
      )}
    </footer>
  );
}

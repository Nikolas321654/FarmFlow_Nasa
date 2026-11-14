import { faSatellite } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { formatTimeAgo } from '@/shared/lib/time';
import { MetaList } from '@/shared/ui';
import { formatObservationDate, type DataProvenance } from '../model/overview';

type DataFreshnessFooterProps = {
  provenance: DataProvenance | null;
};

function sourceLabel(provenance: DataProvenance): string | null {
  return provenance.live ? 'NASA POWER' : null;
}

export function DataFreshnessFooter({ provenance }: DataFreshnessFooterProps) {
  const generated = provenance?.generatedAt ? formatTimeAgo(provenance.generatedAt) : null;

  return (
    <footer className="flex shrink-0 items-start gap-2 border-t border-border/70 px-5 py-3 text-ui-xs text-text-secondary">
      <FontAwesomeIcon icon={faSatellite} className="mt-0.5" aria-hidden="true" />
      <div className="grid min-w-0 gap-0.5">
        {provenance ? (
          <>
            {sourceLabel(provenance) && <p>{sourceLabel(provenance)}</p>}
            <MetaList>
              {provenance.latestObservation &&
                `Latest NASA observation ${formatObservationDate(provenance.latestObservation)}`}
              {generated && (
                <time dateTime={provenance.generatedAt ?? undefined}>Generated {generated}</time>
              )}
            </MetaList>
          </>
        ) : (
          <p>Data source unavailable</p>
        )}
      </div>
    </footer>
  );
}

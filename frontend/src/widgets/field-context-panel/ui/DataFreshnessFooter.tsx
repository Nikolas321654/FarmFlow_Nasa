import { faSatellite } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { formatTimeAgo } from '@/shared/lib/time';
import { MetaList } from '@/shared/ui';
import { formatObservationDate, type DataProvenance } from '../model/overview';

type DataFreshnessFooterProps = {
  provenance: DataProvenance | null;
};

function sourceLabel(provenance: DataProvenance): string {
  if (provenance.live && provenance.simulated) return 'NASA POWER and simulated sample data';
  if (provenance.live) return 'NASA POWER';
  return 'Simulated sample data';
}

export function DataFreshnessFooter({ provenance }: DataFreshnessFooterProps) {
  const generated = provenance?.generatedAt ? formatTimeAgo(provenance.generatedAt) : null;

  return (
    <footer className="flex shrink-0 items-start gap-2 border-t border-border px-5 py-3 text-ui-xs text-text-secondary">
      <FontAwesomeIcon icon={faSatellite} className="mt-0.5" aria-hidden="true" />
      <div className="grid min-w-0 gap-0.5">
        {provenance ? (
          <>
            <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span>{sourceLabel(provenance)}</span>
              {provenance.simulated && (
                <span
                  className="rounded-badge border border-border px-2 py-0.5 text-ui-2xs font-medium"
                  title="Deterministic sample values, not observations of a real field"
                >
                  {provenance.live ? 'Partly simulated' : 'Simulated'}
                </span>
              )}
            </p>
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

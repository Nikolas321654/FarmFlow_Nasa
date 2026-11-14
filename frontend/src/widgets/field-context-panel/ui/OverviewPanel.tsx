import { faDroplet, faHourglassHalf, faWater } from '@fortawesome/free-solid-svg-icons';
import { useFieldDashboards, type FieldDashboard, type FieldSummary } from '@/entities/field';
import { Button } from '@/shared/ui';
import { buildTodayActions } from '../model/actions';
import { summarizeFreshness, summarizeImpact } from '../model/overview';
import { ActionRow } from './ActionRow';
import { DataFreshnessFooter } from './DataFreshnessFooter';
import { ImpactRow } from './ImpactRow';
import { ParcelMotif } from './ParcelMotif';
import { StatTile } from './StatTile';

type OverviewPanelProps = {
  fields: FieldSummary[];
  loading: boolean;
  error: boolean;
  onSelectField: (id: string) => void;
};

const areaFormatter = new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 });
const largeAreaFormatter = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });
const compactAreaFormatter = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  maximumFractionDigits: 1,
});

function formatArea(hectares: number): string {
  if (hectares >= 100_000) return compactAreaFormatter.format(hectares);
  if (hectares >= 1_000) return largeAreaFormatter.format(hectares);
  return areaFormatter.format(hectares);
}
const volumeFormatter = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });

export function OverviewPanel({ fields, loading, error, onSelectField }: OverviewPanelProps) {
  const dashboardQueries = useFieldDashboards(fields.map((field) => field.id));
  const dashboards = dashboardQueries
    .map((query) => query.data)
    .filter((data): data is FieldDashboard => data !== undefined);
  const pendingCount = dashboardQueries.filter((query) => query.isPending).length;
  const failedQueries = dashboardQueries.filter((query) => query.isError);
  const analyticsReady = !loading && !error && pendingCount === 0;

  const actions = buildTodayActions(dashboards);
  const impact = summarizeImpact(dashboards);
  const totalArea = fields.reduce((sum, field) => sum + field.areaHectares, 0);
  const blockedCount = fields.filter((field) => field.workabilityStatus === 'Blocked').length;
  const unavailable = loading ? '…' : error ? 'n/a' : null;

  return (
    <>
      <div className="relative shrink-0 overflow-hidden border-b border-border px-5 pb-4 pt-5">
        <ParcelMotif />
        <div className="relative max-w-[80%]">
          <h2 className="type-page-title">Current conditions</h2>
        </div>
        <dl className="relative mt-4 grid grid-cols-2 gap-2">
          <StatTile label="Fields" value={unavailable ?? String(fields.length)} />
          <StatTile
            label="Total area"
            value={unavailable ?? formatArea(totalArea)}
            unit={unavailable ? undefined : 'ha'}
            fullValue={unavailable ? undefined : `${areaFormatter.format(totalArea)} ha`}
          />
          <StatTile
            label="Blocked"
            value={unavailable ?? String(blockedCount)}
            tone={!unavailable && blockedCount > 0 ? 'danger' : 'default'}
          />
          <StatTile
            label="Active alerts"
            value={
              unavailable ??
              (pendingCount > 0 && dashboards.length === 0 ? '…' : String(actions.length))
            }
            tone={!unavailable && actions.length > 0 ? 'warning' : 'default'}
          />
        </dl>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5 pt-4" aria-live="polite">
        <section aria-labelledby="today-actions-title">
          <div className="flex items-baseline justify-between gap-2">
            <h3 id="today-actions-title" className="type-section-title">
              Today's actions
            </h3>
            {analyticsReady && actions.length > 0 && (
              <span className="text-ui-xs text-text-secondary">By severity</span>
            )}
          </div>
          {(loading || (pendingCount > 0 && dashboards.length === 0)) && (
            <p role="status" className="mt-3 text-ui-sm text-text-secondary">
              Checking field analytics…
            </p>
          )}
          {error && (
            <p role="alert" className="mt-3 text-ui-sm text-text-secondary">
              Field status unavailable.
            </p>
          )}
          {analyticsReady && actions.length === 0 && failedQueries.length === 0 && (
            <p className="mt-3 text-ui-sm text-text-secondary">
              {fields.length === 0
                ? 'No fields available to review.'
                : 'No actions needed today. All fields are within safe limits.'}
            </p>
          )}
          {actions.length > 0 && (
            <ul className="mt-1 divide-y divide-border">
              {actions.map((action) => (
                <li key={action.id} className="py-1">
                  <ActionRow action={action} onSelect={onSelectField} />
                </li>
              ))}
            </ul>
          )}
          {pendingCount > 0 && dashboards.length > 0 && (
            <p role="status" className="mt-2 text-ui-xs text-text-secondary">
              Checking {pendingCount} more {pendingCount === 1 ? 'field' : 'fields'}…
            </p>
          )}
          {failedQueries.length > 0 && (
            <div role="alert" className="mt-3 text-ui-xs text-text-secondary">
              <p>
                Analytics unavailable for {failedQueries.length}{' '}
                {failedQueries.length === 1 ? 'field' : 'fields'}.
              </p>
              <Button
                variant="secondary"
                className="mt-2"
                onClick={() => failedQueries.forEach((query) => void query.refetch())}
              >
                Retry analytics
              </Button>
            </div>
          )}
        </section>

        {impact && (
          <section aria-labelledby="impact-title" className="mt-5 border-t border-border pt-4">
            <h3 id="impact-title" className="type-section-title">
              Impact estimate
            </h3>
            <dl className="mt-2 space-y-2.5">
              <ImpactRow
                icon={faDroplet}
                label="Water saved"
                value={`${volumeFormatter.format(impact.waterSavedM3PerHa)} m³/ha`}
                hint={`≈ ${volumeFormatter.format(impact.waterSavedM3)} m³ across ${dashboards.length} ${dashboards.length === 1 ? 'field' : 'fields'}`}
              />
              <ImpactRow
                icon={faHourglassHalf}
                label="Early warning lead time"
                value={
                  impact.maxLeadTimeDays > 0
                    ? `${impact.maxLeadTimeDays} ${impact.maxLeadTimeDays === 1 ? 'day' : 'days'}`
                    : 'None'
                }
                hint={
                  impact.maxLeadTimeDays > 0
                    ? 'Before visible wilting'
                    : 'No hidden stress detected'
                }
              />
              <ImpactRow
                icon={faWater}
                label="Runoff risk prevented"
                value={`${impact.runoffPreventedFields} of ${dashboards.length}`}
                hint="Fields with spraying held back"
              />
            </dl>
          </section>
        )}
      </div>

      <DataFreshnessFooter
        freshness={dashboards.length > 0 ? summarizeFreshness(dashboards) : null}
      />
    </>
  );
}

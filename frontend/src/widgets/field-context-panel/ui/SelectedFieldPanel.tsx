import {
  faArrowLeft,
  faArrowRight,
  faCircleCheck,
  faFlask,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Link } from 'react-router-dom';
import {
  useFieldDashboard,
  useFieldWorkability,
  withoutFieldPrefix,
  type FieldSummary,
} from '@/entities/field';
import { withoutLongDashes } from '@/shared/lib/text';
import { Button, MetaList } from '@/shared/ui';
import { buildFieldActions, sortActions } from '../model/actions';
import { ndviExplanation, rootzoneExplanation } from '../model/explanations';
import { observationRange, summarizeProvenance } from '../model/overview';
import { severityTone } from '../model/tones';
import { ActionRow } from './ActionRow';
import { AssessmentDetails } from './AssessmentDetails';
import { DataFreshnessFooter } from './DataFreshnessFooter';
import { ParcelMotif } from './ParcelMotif';
import { Sparkline } from './Sparkline';
import { WdiMeter } from './WdiMeter';
import { WorkabilityForecast } from './WorkabilityForecast';

type SelectedFieldPanelProps = {
  field: FieldSummary;
  onBack: () => void;
};

const areaFormatter = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 });
const trendDays = 14;

export function SelectedFieldPanel({ field, onBack }: SelectedFieldPanelProps) {
  const dashboardQuery = useFieldDashboard(field.id);
  const workabilityQuery = useFieldWorkability(field.id);
  const dashboard = dashboardQuery.data;

  const actions = dashboard ? sortActions(buildFieldActions(dashboard)) : [];
  const [leadAction, ...otherActions] = actions;
  const series = dashboard?.timeSeries.slice(-trendDays) ?? [];
  const forecast = workabilityQuery.data?.forecast48h ?? [];
  const forecastNote = forecast.find((period) => period.status !== 'Optimal') ?? forecast[0];
  const provenance = dashboard ? summarizeProvenance([dashboard]) : null;
  const simulated = provenance?.simulated ?? false;
  const range = observationRange(series.map((point) => point.date));

  return (
    <>
      <div className="relative shrink-0 border-b border-border/70 px-5 pb-5 pt-4">
        <ParcelMotif />
        <div className="pr-10">
          <button
            type="button"
            onClick={onBack}
            className="mb-3 inline-flex min-h-9 items-center gap-2 rounded-control text-ui-xs font-medium text-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <FontAwesomeIcon icon={faArrowLeft} aria-hidden="true" /> All fields
          </button>
          <p className="type-label">Selected field</p>
          <h2 className="mt-0.5 type-item-title text-ui-lg text-navy">{field.name}</h2>
          <MetaList className="mt-1 text-ui-sm text-text-secondary tabular-nums">
            {field.cropType}
            {`${areaFormatter.format(field.areaHectares)} ha`}
          </MetaList>
        </div>
      </div>

      <div
        className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-5 pb-5 pt-5"
        aria-live="polite"
      >
        {dashboardQuery.isPending && (
          <p role="status" className="text-ui-sm text-text-secondary">
            Loading field analytics…
          </p>
        )}
        {dashboardQuery.isError && (
          <div role="alert" className="text-ui-sm text-text-secondary">
            <p>Field analytics unavailable.</p>
            <Button
              variant="secondary"
              className="mt-2"
              onClick={() => void dashboardQuery.refetch()}
            >
              Retry
            </Button>
          </div>
        )}

        {dashboard && simulated && !field.isDemo && (
          <div
            role="status"
            className="flex items-start gap-3 rounded-control bg-status-warning-bg px-3 py-2.5"
          >
            <FontAwesomeIcon
              icon={faFlask}
              className="mt-0.5 text-status-warning"
              aria-hidden="true"
            />
            <p className="text-ui-sm text-text-primary">
              Live NASA data is unavailable for this field, so the values below are simulated
              samples. Treat them as illustrative, not as a diagnosis.
            </p>
          </div>
        )}

        {dashboard && (
          <>
            <section aria-label="Recommendation">
              {leadAction ? (
                <div
                  className={`rounded-control border-l-4 bg-surface-muted px-3 py-3 ${severityTone[leadAction.severity].text}`}
                  style={{ borderLeftColor: 'currentColor' }}
                >
                  <MetaList className="type-label font-medium text-current">
                    {leadAction.severity}
                    Do first
                  </MetaList>
                  <p className="mt-1 text-ui-base font-semibold text-text-primary">
                    {leadAction.title}: {leadAction.detail}
                  </p>
                  <p className="mt-1 text-ui-sm text-text-secondary">{leadAction.recommendation}</p>
                </div>
              ) : (
                <div className="flex gap-3 rounded-control bg-status-success-bg px-3 py-3">
                  <FontAwesomeIcon
                    icon={faCircleCheck}
                    className="mt-0.5 text-status-success"
                    aria-hidden="true"
                  />
                  <div>
                    <p className="type-item-title">
                      {simulated ? 'No action in this sample data' : 'No action needed today'}
                    </p>
                    <p className="mt-1 text-ui-sm text-text-secondary">
                      {withoutLongDashes(
                        withoutFieldPrefix(
                          dashboard.workability.recommendation,
                          dashboard.fieldName,
                        ),
                      )}
                    </p>
                  </div>
                </div>
              )}
              {otherActions.length > 0 && (
                <ul className="-mx-3 mt-2 space-y-0.5">
                  {otherActions.map((action) => (
                    <li key={action.id}>
                      <ActionRow action={action} />
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section aria-label="Water stress">
              <WdiMeter stress={dashboard.stressAndIrrigation} />
            </section>

            <section aria-labelledby="trend-title">
              <div className="mb-2 flex items-baseline justify-between gap-2">
                <p id="trend-title" className="type-section-title">
                  Observations
                </p>
                <p className="type-label tabular-nums">{range ?? 'Dates unavailable'}</p>
              </div>
              <div className="space-y-3">
                <Sparkline
                  label="NDVI"
                  description={ndviExplanation}
                  status={
                    dashboard.biomass.isAnomalyDetected
                      ? { label: 'Decline detected', tone: 'warning' }
                      : { label: 'No anomaly', tone: 'neutral' }
                  }
                  points={series.map((point) => ({ date: point.date, value: point.ndvi }))}
                />
                <Sparkline
                  label="Rootzone moisture"
                  description={rootzoneExplanation}
                  points={series.map((point) => ({
                    date: point.date,
                    value: point.rootzoneMoisture,
                  }))}
                />
              </div>
            </section>
          </>
        )}

        <section aria-label="48 hour workability">
          <p className="mb-2 type-section-title">Workability next 48h</p>
          {workabilityQuery.isPending && (
            <p role="status" className="text-ui-xs text-text-secondary">
              Loading forecast…
            </p>
          )}
          {workabilityQuery.isError && (
            <p role="alert" className="text-ui-xs text-text-secondary">
              Workability forecast unavailable.{' '}
              <button
                type="button"
                onClick={() => void workabilityQuery.refetch()}
                className="font-medium text-primary underline-offset-2 hover:underline"
              >
                Retry
              </button>
            </p>
          )}
          {forecast.length > 0 && (
            <>
              <WorkabilityForecast periods={forecast} />
              {forecastNote && (
                <p className="mt-2 text-ui-xs text-text-secondary">
                  {withoutLongDashes(forecastNote.period)}: {withoutLongDashes(forecastNote.reason)}
                </p>
              )}
              {provenance?.live && (
                <p className="mt-1 text-ui-xs text-text-secondary">
                  NASA POWER provides no rain forecast, so the next 24-48h assume no new rain.
                </p>
              )}
            </>
          )}
        </section>

        {dashboard && provenance && (
          <AssessmentDetails
            dashboard={dashboard}
            simulated={provenance.simulated}
            live={provenance.live}
          />
        )}

        <Link
          to={`/fields/${encodeURIComponent(field.id)}`}
          className="inline-flex min-h-11 w-full items-center justify-between gap-2 rounded-control bg-primary px-4 text-ui-sm font-semibold text-white! hover:bg-primary-hover hover:text-white! focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          Detailed insights <FontAwesomeIcon icon={faArrowRight} aria-hidden="true" />
        </Link>
      </div>

      <DataFreshnessFooter provenance={provenance} />
    </>
  );
}

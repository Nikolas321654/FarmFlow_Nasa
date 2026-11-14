import { faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { FieldAction } from '../model/actions';
import { panelRowBase, panelRowInteractive } from '../model/rowStyles';
import { actionIcon, severityTone } from '../model/tones';

type ActionRowProps = {
  action: FieldAction;
  onSelect?: (fieldId: string) => void;
};

export function ActionRow({ action, onSelect }: ActionRowProps) {
  const tone = severityTone[action.severity];
  const content = (
    <>
      <span
        className={`mt-0.5 grid size-8 shrink-0 place-items-center rounded-control ${tone.bg} ${tone.text}`}
        aria-hidden="true"
      >
        <FontAwesomeIcon icon={actionIcon[action.kind]} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block type-item-title">{action.title}</span>
        <span className="mt-0.5 block text-ui-xs text-text-secondary tabular-nums">
          {action.detail}
        </span>
      </span>
      <span className={`mt-0.5 shrink-0 text-ui-xs font-medium ${tone.text}`}>
        <FontAwesomeIcon icon={tone.icon} className="mr-1" aria-hidden="true" />
        {action.severity}
      </span>
    </>
  );

  if (!onSelect) return <div className={`flex items-start gap-3 ${panelRowBase}`}>{content}</div>;

  return (
    <button
      type="button"
      onClick={() => onSelect(action.fieldId)}
      title={action.recommendation}
      className={`group flex w-full items-start gap-3 text-left ${panelRowInteractive}`}
    >
      {content}
      <FontAwesomeIcon
        icon={faChevronRight}
        className="mt-1.5 shrink-0 text-ui-xs text-text-secondary group-hover:text-primary group-focus-visible:text-primary"
        aria-hidden="true"
      />
    </button>
  );
}

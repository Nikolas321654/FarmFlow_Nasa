import {
  faCheck,
  faMinus,
  faTriangleExclamation,
  faXmark,
} from '@fortawesome/free-solid-svg-icons';
import type { WorkabilityStatus } from '@/entities/field';

export const statusAppearance = {
  Optimal: { color: '#357646', icon: faCheck },
  Marginal: { color: '#9A5E12', icon: faTriangleExclamation },
  Blocked: { color: '#B75042', icon: faXmark },
  Unknown: { color: '#626960', icon: faMinus },
} as const;

export function appearanceFor(status: WorkabilityStatus) {
  return statusAppearance[status] ?? statusAppearance.Unknown;
}

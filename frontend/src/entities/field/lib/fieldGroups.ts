import type { FieldSummary } from '../model/types';

export type FieldGroup = 'demo' | 'mine';

export function visibleFieldGroup(group: FieldGroup, authenticated: boolean): FieldGroup {
  return authenticated && group === 'mine' ? 'mine' : 'demo';
}

export function fieldsInGroup(fields: FieldSummary[], group: FieldGroup): FieldSummary[] {
  return fields.filter((field) => (group === 'mine' ? !field.isDemo : field.isDemo));
}

import type { CreateFieldRequest, CropType } from '@/entities/field';
import type { PolygonGeometry } from '@/shared/lib/polygon';
import { boundaryRuleError } from './boundaryRules';

export const cropTypes: CropType[] = ['Wheat', 'Corn', 'Sunflower', 'Soy'];
export const fieldNameMaxLength = 200;

export type BoundarySource = { kind: 'drawn' } | { kind: 'imported'; fileName: string };

export type FieldDraft = {
  name: string;
  cropType: CropType | '';
  plantedAt: string;
  boundary: PolygonGeometry | null;
  boundarySource: BoundarySource | null;
};

export type FieldDraftErrors = Partial<
  Record<'name' | 'cropType' | 'plantedAt' | 'boundary', string>
>;

export const emptyFieldDraft: FieldDraft = {
  name: '',
  cropType: '',
  plantedAt: '',
  boundary: null,
  boundarySource: null,
};

export function isCropType(value: unknown): value is CropType {
  return cropTypes.includes(value as CropType);
}

export function isValidPlantingDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    year >= 1900 &&
    year <= 2100 &&
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

export function isFieldDraftDirty(draft: FieldDraft): boolean {
  return Boolean(draft.name.trim() || draft.cropType || draft.plantedAt || draft.boundary);
}

export function validateFieldDraft(draft: FieldDraft): FieldDraftErrors {
  const errors: FieldDraftErrors = {};
  const name = draft.name.trim();
  if (!name) errors.name = 'Enter a field name.';
  else if (name.length > fieldNameMaxLength) {
    errors.name = `Use ${fieldNameMaxLength} characters or fewer.`;
  }
  if (!draft.cropType) errors.cropType = 'Select a crop type.';
  if (!draft.plantedAt) errors.plantedAt = 'Enter the planting date.';
  else if (!isValidPlantingDate(draft.plantedAt)) errors.plantedAt = 'Enter a valid date.';
  if (!draft.boundary) errors.boundary = 'Draw the field boundary or import a GeoJSON file.';
  else {
    const boundaryError = boundaryRuleError(draft.boundary);
    if (boundaryError) errors.boundary = boundaryError;
  }
  return errors;
}

export function toCreateFieldRequest(draft: FieldDraft): CreateFieldRequest | null {
  if (Object.keys(validateFieldDraft(draft)).length > 0 || !draft.boundary || !draft.cropType) {
    return null;
  }
  return {
    name: draft.name.trim(),
    cropType: draft.cropType,
    plantedAt: draft.plantedAt,
    boundary: draft.boundary,
  };
}

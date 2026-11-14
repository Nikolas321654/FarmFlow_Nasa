import { normalizePolygonCoordinates } from '@/shared/lib/polygon';
import {
  isCropType,
  isValidPlantingDate,
  type BoundarySource,
  type FieldDraft,
} from './fieldDraft';

const storageKey = 'rivnova.add-field-draft.v1';
const maxDraftAgeMs = 24 * 60 * 60 * 1000;

type StoredDraft = {
  savedAt: number;
  draft: FieldDraft;
};

function storage(): Storage | null {
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

function readBoundarySource(value: unknown): BoundarySource | null {
  if (typeof value !== 'object' || value === null) return null;
  const source = value as { kind?: unknown; fileName?: unknown };
  if (source.kind === 'drawn') return { kind: 'drawn' };
  if (source.kind === 'imported' && typeof source.fileName === 'string') {
    return { kind: 'imported', fileName: source.fileName.slice(0, 200) };
  }
  return null;
}

function readDraft(value: unknown): FieldDraft | null {
  if (typeof value !== 'object' || value === null) return null;
  const draft = value as Record<string, unknown>;
  const boundary =
    draft.boundary === null
      ? null
      : typeof draft.boundary === 'object' &&
          (draft.boundary as { type?: unknown }).type === 'Polygon'
        ? normalizePolygonCoordinates((draft.boundary as { coordinates?: unknown }).coordinates)
        : undefined;
  if (boundary === undefined || (boundary !== null && !boundary.ok)) return null;
  return {
    name: typeof draft.name === 'string' ? draft.name.slice(0, 1000) : '',
    cropType: isCropType(draft.cropType) ? draft.cropType : '',
    plantedAt:
      typeof draft.plantedAt === 'string' && isValidPlantingDate(draft.plantedAt)
        ? draft.plantedAt
        : '',
    boundary: boundary?.polygon ?? null,
    boundarySource: boundary ? readBoundarySource(draft.boundarySource) : null,
  };
}

export function saveStoredDraft(draft: FieldDraft): void {
  const stored: StoredDraft = { savedAt: Date.now(), draft };
  try {
    storage()?.setItem(storageKey, JSON.stringify(stored));
  } catch {
    return;
  }
}

export function clearStoredDraft(): void {
  try {
    storage()?.removeItem(storageKey);
  } catch {
    return;
  }
}

export function loadStoredDraft(): FieldDraft | null {
  let raw: string | null;
  try {
    raw = storage()?.getItem(storageKey) ?? null;
  } catch {
    return null;
  }
  if (!raw) return null;
  try {
    const stored = JSON.parse(raw) as Partial<StoredDraft>;
    const draft = readDraft(stored.draft);
    const fresh = typeof stored.savedAt === 'number' && Date.now() - stored.savedAt < maxDraftAgeMs;
    if (draft && fresh) return draft;
  } catch {
    clearStoredDraft();
    return null;
  }
  clearStoredDraft();
  return null;
}

export function isDraftStored(draft: FieldDraft): boolean {
  try {
    const raw = storage()?.getItem(storageKey);
    return raw
      ? JSON.stringify((JSON.parse(raw) as StoredDraft).draft) === JSON.stringify(draft)
      : false;
  } catch {
    return false;
  }
}

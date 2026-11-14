export const displayNameMaxLength = 100;

export function displayNameError(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return 'Enter a display name.';
  if (trimmed.length > displayNameMaxLength) {
    return `Use ${displayNameMaxLength} characters or fewer.`;
  }
  return null;
}

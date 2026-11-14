const spacedLongDash = /\s+[\u2014\u2013]\s+/g;
const longDash = /[\u2014\u2013]/g;

/** Normalizes long dashes in server-provided text to the UI writing style. */
export function withoutLongDashes(text: string, separator = ': '): string {
  return text.replace(spacedLongDash, separator).replace(longDash, '-');
}

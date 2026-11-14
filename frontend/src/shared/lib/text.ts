const spacedLongDash = /\s+[\u2014\u2013]\s+/g;
const longDash = /[\u2014\u2013]/g;

export function withoutLongDashes(text: string, separator = ': '): string {
  return text.replace(spacedLongDash, separator).replace(longDash, '-');
}

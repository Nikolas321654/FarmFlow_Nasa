type FieldNameParts = {
  code: string | null;
  label: string;
};

const codedName = /^(Field\s*#\d+)\s*[\u2014\u2013:-]\s*(.+)$/i;

function fieldNameParts(name: string): FieldNameParts {
  const match = codedName.exec(name.trim());
  if (!match) return { code: null, label: name.trim() };
  return { code: match[1], label: match[2] };
}

/** Short name for action copy, e.g. "Central Wheat". */
export function fieldShortName(name: string): string {
  return fieldNameParts(name).label;
}

/** Removes the "<field name>: " prefix the backend adds to recommendation text. */
export function withoutFieldPrefix(text: string, name: string): string {
  const { code } = fieldNameParts(name);
  for (const prefix of [name, code].filter((value): value is string => Boolean(value))) {
    if (text.startsWith(`${prefix}:`)) return text.slice(prefix.length + 1).trim();
  }
  return text;
}

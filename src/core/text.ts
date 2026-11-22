/** Reject control characters and characters that would change a query string. */
export function hasUnsafeQueryCharacters(value: string): boolean {
  for (const char of value) {
    const code = char.charCodeAt(0);
    if (code < 32 || "/?&#=<>".includes(char)) return true;
  }
  return false;
}

/** Fold a name so "Côte d'Ivoire", "cote d’ivoire", and "COTE D IVOIRE" match. */
export function fold(input: string): string {
  return input
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

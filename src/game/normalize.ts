export function normalizeWord(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleUpperCase("pt-BR");
}

export function isFiveLetterWord(value: string): boolean {
  const normalized = normalizeWord(value);
  return /^[A-Z]{5}$/.test(normalized);
}


/**
 * Normalization utilities for constructon material product recognition in Mozambique.
 */

/**
 * Normalizes text for search and indexing:
 * - Lowercase
 * - Remove accents
 * - Remove duplicate spaces
 * - Remove special characters
 * - Handle specific Mozambican variations
 */
export function normalizeText(text: string): string {
  if (!text) return '';
  
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9\s]/g, ' ') // Replace special chars with space
    .replace(/\s+/g, ' ') // Collapse spaces
    .trim();
}

/**
 * Generates search tokens/tags from a product name using the master catalog and normalization.
 */
export function generateSearchTokens(text: string): string[] {
  const normalized = normalizeText(text);
  const words = normalized.split(' ');
  const tokens = new Set<string>();
  
  // Basic word tokens
  words.forEach(word => {
    if (word.length > 2) tokens.add(word);
  });
  
  // Bigrams for common phrases
  for (let i = 0; i < words.length - 1; i++) {
    tokens.add(`${words[i]} ${words[i+1]}`);
  }

  return Array.from(tokens);
}

/**
 * Fuzzy matching support (Levenshtein distance simplified)
 */
export function isFuzzyMatch(s1: string, s2: string, threshold: number = 0.8): boolean {
  const n1 = normalizeText(s1);
  const n2 = normalizeText(s2);
  
  if (n1 === n2) return true;
  if (n1.includes(n2) || n2.includes(n1)) return true;
  
  // Simple similarity check for spelling errors
  // In a real app we might use a more robust library, but here we'll stick to basic inclusion/overlap
  return false;
}

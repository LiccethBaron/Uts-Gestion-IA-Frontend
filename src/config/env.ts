/**
 * Configuración centralizada y tipada de variables de entorno públicas del cliente.
 * Usa acceso estático por punto para permitir el inlining de Next.js en el bundle cliente.
 */

export interface AppEnv {
  readonly API_URL: string;
  readonly SEARCH_DEBOUNCE_MS: number;
  readonly API_TIMEOUT_MS: number;
  readonly SIMILARITY_THRESHOLD: number;
}

const DEFAULT_API_URL = 'http://localhost:4000/api';
const DEFAULT_SEARCH_DEBOUNCE_MS = 350;
const DEFAULT_API_TIMEOUT_MS = 10000;
const DEFAULT_SIMILARITY_THRESHOLD = 0.60;

function parseApiUrl(rawValue: string | undefined): string {
  const trimmed = rawValue?.trim();
  if (!trimmed) return DEFAULT_API_URL;
  return trimmed.replace(/\/+$/, '');
}

function parseSearchDebounceMs(rawValue: string | undefined): number {
  if (!rawValue) return DEFAULT_SEARCH_DEBOUNCE_MS;
  const parsed = Number.parseInt(rawValue, 10);
  if (!Number.isFinite(parsed)) return DEFAULT_SEARCH_DEBOUNCE_MS;
  // Regla AGENTS.md: mínimo 350ms de debounce en búsqueda en tiempo real
  return Math.max(DEFAULT_SEARCH_DEBOUNCE_MS, parsed);
}

function parseApiTimeoutMs(rawValue: string | undefined): number {
  if (!rawValue) return DEFAULT_API_TIMEOUT_MS;
  const parsed = Number.parseInt(rawValue, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_API_TIMEOUT_MS;
  return parsed;
}

function parseSimilarityThreshold(rawValue: string | undefined): number {
  if (!rawValue) return DEFAULT_SIMILARITY_THRESHOLD;
  const parsed = Number.parseFloat(rawValue);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 1) {
    return DEFAULT_SIMILARITY_THRESHOLD;
  }
  return parsed;
}

export const env: AppEnv = {
  API_URL: parseApiUrl(process.env.NEXT_PUBLIC_API_URL),
  SEARCH_DEBOUNCE_MS: parseSearchDebounceMs(process.env.NEXT_PUBLIC_SEARCH_DEBOUNCE_MS),
  API_TIMEOUT_MS: parseApiTimeoutMs(process.env.NEXT_PUBLIC_API_TIMEOUT_MS),
  SIMILARITY_THRESHOLD: parseSimilarityThreshold(process.env.NEXT_PUBLIC_SIMILARITY_THRESHOLD),
};

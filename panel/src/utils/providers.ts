// ---------------------------------------------------------------------------
// Providers cache — avoids refetching the settings API on every page visit.
// ---------------------------------------------------------------------------

const PROVIDERS_CACHE_KEY = 'providers_cache';
const PROVIDERS_CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

export interface IProvider {
  code: string;
  name: string;
  color: string;
}


export interface ProvidersCachePayload {
  data: IProvider[];
  expiresAt: number;
}

export function readProvidersCache(): IProvider[] | null {
  try {
    const raw = localStorage.getItem(PROVIDERS_CACHE_KEY);
    if (!raw) return null;

    const parsed: ProvidersCachePayload = JSON.parse(raw);
    if (!parsed?.expiresAt || Date.now() > parsed.expiresAt) {
      localStorage.removeItem(PROVIDERS_CACHE_KEY);
      return null;
    }

    return parsed.data;
  } catch (err) {
    console.warn('Failed to read providers cache:', err);
    localStorage.removeItem(PROVIDERS_CACHE_KEY);
    return null;
  }
}

export function writeProvidersCache(data: IProvider[]) {
  try {
    const payload: ProvidersCachePayload = {
      data,
      expiresAt: Date.now() + PROVIDERS_CACHE_TTL_MS,
    };
    localStorage.setItem(PROVIDERS_CACHE_KEY, JSON.stringify(payload));
  } catch (err) {
    console.warn('Failed to write providers cache:', err);
  }
}
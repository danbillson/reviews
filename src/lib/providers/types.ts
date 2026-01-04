// Common types for all media providers

export interface ProviderSearchResult {
  externalId: string;
  title: string;
  subtitle?: string;
  description?: string;
  imageUrl?: string;
  year?: number;
  metadata: Record<string, unknown>;
}

export interface ProviderItemDetails {
  externalId: string;
  title: string;
  subtitle?: string;
  description?: string;
  imageUrl?: string;
  metadata: Record<string, unknown>;
  segments?: Array<{
    orderIndex: number;
    title: string;
    metadata?: Record<string, unknown>;
  }>;
}

export interface MediaProvider {
  key: string;
  name: string;
  search(
    query: string,
    config?: Record<string, unknown>,
  ): Promise<ProviderSearchResult[]>;
  getDetails(
    externalId: string,
    config?: Record<string, unknown>,
  ): Promise<ProviderItemDetails | null>;
}

// Provider registry
const providers = new Map<string, MediaProvider>();

export function registerProvider(provider: MediaProvider) {
  providers.set(provider.key, provider);
}

export function getProvider(key: string): MediaProvider | undefined {
  return providers.get(key);
}

export function getAllProviders(): MediaProvider[] {
  return Array.from(providers.values());
}

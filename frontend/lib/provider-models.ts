/**
 * Static provider + model configuration.
 * Each provider has a list of available models.
 * Update these lists when providers add/remove models.
 */

export interface ModelInfo {
    id: string;
    name: string;
    context: string;
}

export const PROVIDER_MODELS: Record<string, ModelInfo[]> = {
    groq: [
        { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B', context: '128K' },
        { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B Instant', context: '128K' },
        { id: 'llama-3.1-70b-versatile', name: 'Llama 3.1 70B', context: '128K' },
        { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B', context: '32K' },
        { id: 'gemma2-9b-it', name: 'Gemma 2 9B', context: '8K' },
    ],
    cerebras: [
        { id: 'gpt-oss-120b', name: 'GPT-OSS 120B', context: '65K' },
        { id: 'llama3.1-8b', name: 'Llama 3.1 8B', context: '8K' },
    ],
    bytez: [
        { id: 'gpt-4o-mini', name: 'GPT-4o Mini', context: '128K' },
        { id: 'gpt-4.1-mini', name: 'GPT-4.1 Mini', context: '128K' },
        { id: 'gpt-4o', name: 'GPT-4o', context: '128K' },
    ],
};

/** All valid provider keys */
export const PROVIDER_LIST = Object.keys(PROVIDER_MODELS) as Array<keyof typeof PROVIDER_MODELS>;

/** Human-readable provider labels */
export const PROVIDER_LABELS: Record<string, string> = {
    groq: 'Groq',
    cerebras: 'Cerebras',
    bytez: 'Bytez',
};

/**
 * Get default model for a given provider.
 * Returns the first model in the list.
 */
export function getDefaultModel(provider: string): string {
    const models = PROVIDER_MODELS[provider];
    return models && models.length > 0 ? models[0].id : '';
}

/**
 * Check if a model ID is valid for a given provider.
 */
export function isValidModel(provider: string, modelId: string): boolean {
    const models = PROVIDER_MODELS[provider];
    if (!models) return false;
    return models.some(m => m.id === modelId);
}

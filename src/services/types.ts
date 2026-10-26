/** Moteur d'IA effectivement utilisé pour une réponse. */
export type AiEngine = 'gemini' | 'gemma';

/** Contrat commun aux deux moteurs : le routeur ne connaît que cette interface. */
export interface LlmProvider {
  readonly engine: AiEngine;
  generate(prompt: string, signal?: AbortSignal): Promise<string>;
}

/** Erreur typée pour distinguer les pannes réseau (→ bascule) des autres erreurs. */
export class AiError extends Error {
  constructor(
    message: string,
    public readonly engine: AiEngine,
    public readonly retryableOffline: boolean,
    options?: { cause?: unknown }
  ) {
    super(message, options);
    this.name = 'AiError';
  }
}

import { AiError, type LlmProvider } from './types';
import { SOCRATIC_SYSTEM_PROMPT } from './socraticPrompt';

/**
 * Fournisseur en ligne : API REST Gemini (generateContent).
 * Appel via fetch natif → aucune dépendance SDK.
 */

const API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const REQUEST_TIMEOUT_MS = 20_000;

interface GeminiResponse {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
    finishReason?: string;
  }>;
  promptFeedback?: { blockReason?: string };
}

export class GeminiProvider implements LlmProvider {
  readonly engine = 'gemini' as const;

  constructor(
    private readonly apiKey: string | undefined = import.meta.env.VITE_GEMINI_API_KEY?.trim() || undefined,
    private readonly model: string = import.meta.env.VITE_GEMINI_MODEL ?? 'gemini-3.6-flash',
    // Une variable laissée vide dans .env vaut "" (et non undefined) :
    // on la normalise, sinon fetch("") viserait la page locale → HTTP 404.
    private readonly proxyUrl: string | undefined = import.meta.env.VITE_GEMINI_PROXY_URL?.trim() || undefined
  ) {}

  /** Vrai si une configuration exploitable existe (clé directe ou proxy). */
  isConfigured(): boolean {
    return Boolean(this.proxyUrl || this.apiKey);
  }

  async generate(prompt: string, signal?: AbortSignal): Promise<string> {
    if (!this.isConfigured()) {
      throw new AiError('Gemini non configuré (clé API ou proxy manquant).', 'gemini', true);
    }

    const timeout = AbortSignal.timeout(REQUEST_TIMEOUT_MS);
    const combined = signal ? AbortSignal.any([signal, timeout]) : timeout;

    const url = this.proxyUrl ?? `${API_BASE}/${encodeURIComponent(this.model)}:generateContent`;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (!this.proxyUrl && this.apiKey) headers['x-goog-api-key'] = this.apiKey;

    let res: Response;
    try {
      res = await fetch(url, {
        method: 'POST',
        headers,
        signal: combined,
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SOCRATIC_SYSTEM_PROMPT }] },
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            // Les modèles Gemini 3.x comptent leur « réflexion » interne dans ce
            // budget : on laisse de la marge et on limite la réflexion.
            maxOutputTokens: 2048,
            thinkingConfig: { thinkingLevel: 'low' }
          }
        })
      });
    } catch (cause) {
      // Abandon volontaire de l'appelant : on propage tel quel, sans bascule.
      if (signal?.aborted) throw cause;
      // Échec réseau ou timeout : le routeur peut basculer sur Gemma.
      throw new AiError('Gemini injoignable (réseau ou délai dépassé).', 'gemini', true, { cause });
    }

    if (!res.ok) {
      // 429 / 5xx : problème transitoire côté service → bascule possible.
      const retryable = res.status === 429 || res.status >= 500;
      // On remonte le message d'erreur de Google pour faciliter le diagnostic.
      let detail = '';
      try {
        const body = (await res.json()) as { error?: { message?: string } };
        detail = body.error?.message ? ` — ${body.error.message}` : '';
      } catch {
        /* corps non JSON : on l'ignore */
      }
      throw new AiError(`Gemini a répondu HTTP ${res.status}${detail}`, 'gemini', retryable);
    }

    const data = (await res.json()) as GeminiResponse;
    if (data.promptFeedback?.blockReason) {
      throw new AiError(`Requête bloquée par Gemini (${data.promptFeedback.blockReason}).`, 'gemini', false);
    }

    const text = data.candidates?.[0]?.content?.parts
      ?.map((p) => p.text ?? '')
      .join('')
      .trim();

    if (!text) throw new AiError('Réponse Gemini vide.', 'gemini', true);
    if (data.candidates?.[0]?.finishReason === 'MAX_TOKENS') {
      console.warn('[Gemini] Réponse tronquée (MAX_TOKENS) : augmenter maxOutputTokens.');
    }
    return text;
  }
}

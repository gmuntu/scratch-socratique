import { GeminiProvider } from './geminiProvider';
import { GemmaProvider, type GemmaStatus } from './gemmaProvider';
import { AiError, type AiEngine, type LlmProvider } from './types';

/**
 * Routeur IA hybride (offline-first).
 *
 *   navigator.onLine === true  → Gemini Flash (API distante)
 *                                 └─ en cas d'échec réseau/5xx/429 → bascule sur Gemma
 *   navigator.onLine === false → Gemma local (MediaPipe, WebGPU)
 *
 * Remarque : navigator.onLine === true signifie seulement « une interface réseau
 * est active », pas « Internet est joignable » (portail captif, Wi-Fi sans accès…).
 * D'où la bascule automatique sur Gemma quand l'appel Gemini échoue.
 */

export interface AiReply {
  text: string;
  engine: AiEngine;
}

const gemini = new GeminiProvider();
const gemma = new GemmaProvider();

let lastEngine: AiEngine | null = null;

function isOnline(): boolean {
  return typeof navigator === 'undefined' ? false : navigator.onLine;
}

/** Choisit le moteur prioritaire selon la connectivité et la configuration. */
function pickPrimary(): LlmProvider {
  return isOnline() && gemini.isConfigured() ? gemini : gemma;
}

/**
 * Variante détaillée : renvoie aussi le moteur utilisé (utile pour l'UI,
 * ex. afficher un badge « hors-ligne »).
 */
export async function sendMessageDetailed(prompt: string, signal?: AbortSignal): Promise<AiReply> {
  const trimmed = prompt.trim();
  if (!trimmed) throw new AiError('Le message est vide.', pickPrimary().engine, false);

  const primary = pickPrimary();
  try {
    const text = await primary.generate(trimmed, signal);
    lastEngine = primary.engine;
    return { text, engine: primary.engine };
  } catch (err) {
    const canFallback =
      primary.engine === 'gemini' && err instanceof AiError && err.retryableOffline && !signal?.aborted;
    if (!canFallback) throw err;

    console.warn('[aiRouter] Gemini indisponible, bascule sur Gemma local.', err);
    const text = await gemma.generate(trimmed, signal);
    lastEngine = 'gemma';
    return { text, engine: 'gemma' };
  }
}

/** API unifiée demandée : un prompt en entrée, la réponse texte en sortie. */
export async function sendMessage(prompt: string): Promise<string> {
  return (await sendMessageDetailed(prompt)).text;
}

/**
 * Pré-charge Gemma pendant que l'utilisateur est en ligne : le ServiceWorker
 * met alors en cache le modèle et le WASM, garantissant le mode hors-ligne.
 * Sans effet (et sans erreur) si WebGPU n'est pas disponible.
 */
export async function preloadLocalModel(): Promise<boolean> {
  if (!GemmaProvider.isSupported()) return false;
  try {
    await gemma.init();
    return true;
  } catch (err) {
    console.warn('[aiRouter] Pré-chargement de Gemma impossible.', err);
    return false;
  }
}

/** État courant, pour l'affichage. */
export function getAiStatus(): {
  online: boolean;
  geminiConfigured: boolean;
  gemmaStatus: GemmaStatus;
  webGpu: boolean;
  lastEngine: AiEngine | null;
} {
  return {
    online: isOnline(),
    geminiConfigured: gemini.isConfigured(),
    gemmaStatus: gemma.status,
    webGpu: GemmaProvider.isSupported(),
    lastEngine
  };
}

/** S'abonne aux changements de connectivité. Renvoie la fonction de désabonnement. */
export function onConnectivityChange(cb: (online: boolean) => void): () => void {
  const on = (): void => cb(true);
  const off = (): void => cb(false);
  window.addEventListener('online', on);
  window.addEventListener('offline', off);
  return () => {
    window.removeEventListener('online', on);
    window.removeEventListener('offline', off);
  };
}

export { AiError } from './types';
export type { AiEngine } from './types';

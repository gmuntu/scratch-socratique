import { FilesetResolver, LlmInference } from '@mediapipe/tasks-genai';
import { AiError, type LlmProvider } from './types';
import { toGemmaChatPrompt } from './socraticPrompt';

/**
 * Fournisseur hors-ligne : Gemma exécuté dans le navigateur via
 * MediaPipe LLM Inference API (WebGPU).
 *
 * - Chargement paresseux (lazy) et unique : le modèle (~500 Mo) n'est
 *   téléchargé/initialisé qu'une fois, puis réutilisé.
 * - Le fichier .task et le runtime WASM sont servis depuis notre origine,
 *   donc mis en cache par le ServiceWorker → disponibles hors-ligne.
 * - MediaPipe n'accepte pas deux générations simultanées : les appels sont
 *   sérialisés dans une file.
 */

const WASM_BASE_PATH = '/mediapipe-wasm';
const DEFAULT_MODEL_PATH = '/models/gemma3-1b-it-int4-web.task';

export type GemmaStatus = 'idle' | 'loading' | 'ready' | 'error' | 'unsupported';

export class GemmaProvider implements LlmProvider {
  readonly engine = 'gemma' as const;

  private llm: LlmInference | null = null;
  private initPromise: Promise<LlmInference> | null = null;
  private queue: Promise<unknown> = Promise.resolve();
  private _status: GemmaStatus = 'idle';

  constructor(
    private readonly modelPath: string = import.meta.env.VITE_GEMMA_MODEL_PATH ?? DEFAULT_MODEL_PATH
  ) {}

  get status(): GemmaStatus {
    return this._status;
  }

  /** MediaPipe LLM Inference nécessite WebGPU. */
  static isSupported(): boolean {
    return typeof navigator !== 'undefined' && 'gpu' in navigator;
  }

  /**
   * Initialise le moteur (idempotent). À appeler en ligne pour pré-télécharger
   * le modèle et le mettre en cache avant que l'utilisateur passe hors-ligne.
   */
  init(): Promise<LlmInference> {
    if (this.llm) return Promise.resolve(this.llm);
    if (this.initPromise) return this.initPromise;

    if (!GemmaProvider.isSupported()) {
      this._status = 'unsupported';
      return Promise.reject(
        new AiError('WebGPU indisponible : le modèle local ne peut pas tourner sur ce navigateur.', 'gemma', false)
      );
    }

    this._status = 'loading';
    this.initPromise = (async () => {
      try {
        const fileset = await FilesetResolver.forGenAiTasks(WASM_BASE_PATH);
        const llm = await LlmInference.createFromOptions(fileset, {
          baseOptions: { modelAssetPath: this.modelPath },
          maxTokens: 1024, // tokens d'entrée + de sortie
          topK: 40,
          temperature: 0.7,
          randomSeed: 42
        });
        this.llm = llm;
        this._status = 'ready';
        return llm;
      } catch (cause) {
        this._status = 'error';
        this.initPromise = null; // autorise une nouvelle tentative ultérieure
        throw new AiError(
          'Échec du chargement de Gemma (modèle absent du cache ou WebGPU en erreur).',
          'gemma',
          false,
          { cause }
        );
      }
    })();

    return this.initPromise;
  }

  async generate(prompt: string, signal?: AbortSignal): Promise<string> {
    const run = async (): Promise<string> => {
      // L'API MediaPipe n'est pas annulable en cours de génération :
      // on vérifie seulement avant de démarrer.
      signal?.throwIfAborted();
      const llm = await this.init();
      signal?.throwIfAborted();
      const out = await llm.generateResponse(toGemmaChatPrompt(prompt));
      const text = out.replace(/<end_of_turn>[\s\S]*$/, '').trim();
      if (!text) throw new AiError('Réponse Gemma vide.', 'gemma', false);
      return text;
    };

    // Sérialisation : chaque appel attend la fin du précédent (succès ou échec).
    const next = this.queue.then(run, run);
    this.queue = next.catch(() => undefined);
    return next;
  }

  /** Libère la mémoire GPU (ex. quand l'app passe en arrière-plan longtemps). */
  dispose(): void {
    this.llm?.close();
    this.llm = null;
    this.initPromise = null;
    this._status = 'idle';
  }
}

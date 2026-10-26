import { useCallback, useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { getAiStatus, sendMessageDetailed, type AiEngine } from '../services/aiRouter';
import type { PendingPrompt } from '../puzzles/types';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import './SocraticChat.css';

/**
 * SocraticChat — interface de dialogue mobile-first avec le tuteur Socrate.
 *
 * - Historique des messages sous forme de bulles (élève à droite, Socrate à gauche).
 * - Indicateur temps réel du mode : En ligne (Gemini) / Hors-ligne (Gemma) +
 *   état du modèle local.
 * - Chaque réponse est étiquetée avec le moteur qui l'a réellement produite
 *   (utile quand le routeur bascule automatiquement sur Gemma).
 * - Les derniers échanges sont renvoyés à l'IA pour qu'elle garde le fil.
 */

type Role = 'eleve' | 'socrate';

interface ChatMessage {
  id: string;
  role: Role;
  text: string;
  engine?: AiEngine;
  error?: boolean;
}

/** Nombre de messages précédents renvoyés comme contexte (borné pour Gemma). */
const CONTEXT_MESSAGES = 6;

const WELCOME: ChatMessage = {
  id: 'welcome',
  role: 'socrate',
  text: 'Bonjour ! Je suis Socrate. Je ne te donnerai pas les réponses, mais je vais t’aider à les trouver toi-même. Sur quel projet Scratch travailles-tu ?'
};

function newId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/** Construit le prompt envoyé à l'IA : courte transcription + nouveau message. */
function buildPrompt(history: readonly ChatMessage[], userText: string): string {
  const recent = history
    .filter((m) => m.id !== WELCOME.id && !m.error)
    .slice(-CONTEXT_MESSAGES)
    .map((m) => `${m.role === 'eleve' ? 'Élève' : 'Socrate'} : ${m.text}`)
    .join('\n');
  return recent
    ? `Conversation précédente :\n${recent}\n\nNouveau message de l’élève : ${userText}`
    : userText;
}

const GEMMA_LABEL: Record<string, string> = {
  idle: 'non chargé',
  loading: 'chargement…',
  ready: 'prêt',
  error: 'erreur',
  unsupported: 'non supporté (WebGPU absent)'
};

export interface SocraticChatProps {
  /** Message injecté depuis l'extérieur (ex. erreur du puzzle) : envoyé automatiquement. */
  pendingPrompt?: PendingPrompt | null;
  /** Appelé dès que le message injecté a été pris en charge. */
  onPendingConsumed?: () => void;
}

export function SocraticChat({ pendingPrompt = null, onPendingConsumed }: SocraticChatProps): JSX.Element {
  const online = useOnlineStatus();
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState(getAiStatus);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Rafraîchit l'état du moteur local (chargement de Gemma, etc.).
  useEffect(() => {
    setStatus(getAiStatus());
    const id = window.setInterval(() => setStatus(getAiStatus()), 1500);
    return () => window.clearInterval(id);
  }, [online]);

  // Défilement automatique vers le dernier message.
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, busy]);

  const geminiActive = online && status.geminiConfigured;
  const offlineUnavailable = !geminiActive && !status.webGpu;

  /**
   * Envoie un message. `display` est montré dans la bulle de l'élève ;
   * `promptOverride` (optionnel) est le texte réellement envoyé à l'IA.
   */
  const sendText = useCallback(
    async (display: string, promptOverride?: string): Promise<void> => {
      const text = display.trim();
      if (!text || busy) return;

      const userMsg: ChatMessage = { id: newId(), role: 'eleve', text };
      const prompt = buildPrompt(messages, promptOverride ?? text);
      setMessages((prev) => [...prev, userMsg]);
      if (promptOverride === undefined) setInput('');
      setBusy(true);

      try {
        const reply = await sendMessageDetailed(prompt);
        setMessages((prev) => [...prev, { id: newId(), role: 'socrate', text: reply.text, engine: reply.engine }]);
      } catch (err) {
        const detail = err instanceof Error ? err.message : String(err);
        setMessages((prev) => [
          ...prev,
          { id: newId(), role: 'socrate', text: `Oups, je n’ai pas pu répondre. (${detail})`, error: true }
        ]);
      } finally {
        setBusy(false);
        setStatus(getAiStatus());
        inputRef.current?.focus();
      }
    },
    [busy, messages]
  );

  const send = useCallback((): Promise<void> => sendText(input), [sendText, input]);

  // Message venant du puzzle : envoyé une seule fois, dès que Socrate est libre.
  const handledPending = useRef<string | null>(null);
  useEffect(() => {
    if (!pendingPrompt || busy || handledPending.current === pendingPrompt.id) return;
    handledPending.current = pendingPrompt.id;
    onPendingConsumed?.();
    void sendText(pendingPrompt.display, pendingPrompt.prompt);
  }, [pendingPrompt, busy, sendText, onPendingConsumed]);

  function onSubmit(e: FormEvent): void {
    e.preventDefault();
    void send();
  }

  // Entrée = envoyer ; Maj+Entrée = retour à la ligne.
  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>): void {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      void send();
    }
  }

  return (
    <section className="sc-chat" aria-label="Discussion avec Socrate">
      <header className="sc-header">
        <div className="sc-title">
          <span className="sc-avatar" aria-hidden="true">🧔🏿</span>
          <div>
            <h1>Socrate</h1>
            <p className="sc-subtitle">Ton tuteur Scratch</p>
          </div>
        </div>
        <div
          className={`sc-mode ${geminiActive ? 'is-online' : 'is-offline'}`}
          role="status"
          aria-live="polite"
          title={`Modèle local : ${GEMMA_LABEL[status.gemmaStatus] ?? status.gemmaStatus}`}
        >
          <span className="sc-dot" aria-hidden="true" />
          {geminiActive ? 'En ligne · Gemini' : 'Hors-ligne · Gemma'}
        </div>
      </header>

      {offlineUnavailable && (
        <p className="sc-banner" role="alert">
          Pas de connexion et ce navigateur ne peut pas faire tourner le modèle local. Reconnecte-toi pour continuer.
        </p>
      )}
      {!geminiActive && status.gemmaStatus === 'loading' && (
        <p className="sc-banner is-info">Chargement du modèle local… la première réponse peut prendre un moment.</p>
      )}

      <div className="sc-messages" ref={listRef} aria-live="polite">
        {messages.map((m) => (
          <div key={m.id} className={`sc-row ${m.role === 'eleve' ? 'is-user' : 'is-bot'}`}>
            <div className={`sc-bubble${m.error ? ' is-error' : ''}`}>
              <p>{m.text}</p>
              {m.engine && (
                <span className={`sc-engine is-${m.engine}`}>
                  {m.engine === 'gemini' ? 'Gemini · en ligne' : 'Gemma · hors-ligne'}
                </span>
              )}
            </div>
          </div>
        ))}
        {busy && (
          <div className="sc-row is-bot">
            <div className="sc-bubble sc-typing" aria-label="Socrate réfléchit">
              <span />
              <span />
              <span />
            </div>
          </div>
        )}
      </div>

      <form className="sc-composer" onSubmit={onSubmit}>
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Écris ta question ou ton idée…"
          rows={1}
          aria-label="Ton message"
          disabled={offlineUnavailable}
        />
        <button type="submit" disabled={busy || !input.trim() || offlineUnavailable} aria-label="Envoyer">
          ➤
        </button>
      </form>
    </section>
  );
}

import { useCallback, useEffect, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { SocraticChat } from './components/SocraticChat';
import { ScratchPuzzleWorkspace } from './components/ScratchPuzzleWorkspace';
import { PodcastPlayer } from './components/PodcastPlayer';
import { preloadLocalModel } from './services/aiRouter';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import type { PendingPrompt } from './puzzles/types';

type Tab = 'puzzle' | 'podcasts' | 'chat';
type LeftTab = Exclude<Tab, 'chat'>;

/**
 * Coquille de l'application :
 *  - mobile : trois onglets (Puzzle, Écouter, Socrate) ;
 *  - écran large : Socrate toujours visible à droite, Puzzle / Écouter à gauche.
 * Tous les panneaux restent montés pour conserver leur état (lecture audio incluse).
 */
export function App(): JSX.Element {
  const online = useOnlineStatus();
  useRegisterSW();
  const [tab, setTab] = useState<Tab>('puzzle');
  const [leftTab, setLeftTab] = useState<LeftTab>('puzzle');
  const [pending, setPending] = useState<PendingPrompt | null>(null);

  useEffect(() => {
    if (online) void preloadLocalModel();
  }, [online]);

  const select = useCallback((t: Tab) => {
    setTab(t);
    if (t !== 'chat') setLeftTab(t);
  }, []);

  const askTutor = useCallback((p: PendingPrompt) => {
    setPending(p);
    setTab('chat');
  }, []);
  const consumed = useCallback(() => setPending(null), []);

  const paneClass = (t: Tab): string =>
    `app-pane pane-${t}${tab === t ? ' is-active' : ''}${t !== 'chat' && leftTab === t ? ' is-left' : ''}`;

  return (
    <div className="app-shell">
      <nav className="app-tabs" aria-label="Navigation">
        <button type="button" className={tab === 'puzzle' ? 'is-active' : ''} data-left={leftTab === 'puzzle'} onClick={() => select('puzzle')}>
          🧩 Puzzle
        </button>
        <button type="button" className={tab === 'podcasts' ? 'is-active' : ''} data-left={leftTab === 'podcasts'} onClick={() => select('podcasts')}>
          🎧 Écouter
        </button>
        <button type="button" className={`tab-chat${tab === 'chat' ? ' is-active' : ''}`} onClick={() => select('chat')}>
          💬 Socrate
        </button>
      </nav>
      <div className={paneClass('puzzle')}>
        <ScratchPuzzleWorkspace onAskTutor={askTutor} />
      </div>
      <div className={paneClass('podcasts')}>
        <PodcastPlayer />
      </div>
      <div className={paneClass('chat')}>
        <SocraticChat pendingPrompt={pending} onPendingConsumed={consumed} />
      </div>
    </div>
  );
}

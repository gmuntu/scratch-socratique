import { useCallback, useEffect, useRef, useState } from 'react';
import { EPISODES, type Episode } from '../podcasts/episodes';
import { downloadEpisode, getCachedObjectUrl, isCached, removeEpisode } from '../podcasts/podcastCache';
import { getAllProgress, getProgress, saveProgress, type EpisodeProgress } from '../podcasts/progressStore';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import './PodcastPlayer.css';

/**
 * PodcastPlayer — mini-épisodes audio (contes et explications de logique).
 *
 * Pensé pour les connexions mobiles limitées :
 *  - preload="none" : rien n'est téléchargé tant qu'on n'appuie pas sur lecture ;
 *  - « Télécharger » range l'épisode dans le cache (podcasts-v1, partagé avec
 *    le ServiceWorker) pour l'écouter hors-ligne et sans consommer de data ;
 *  - la position est sauvegardée toutes les 5 s : reprise exacte après une
 *    coupure, une fermeture de l'appli ou un changement d'épisode ;
 *  - si le flux se coupe (réseau perdu), la lecture reprend automatiquement
 *    au retour du réseau, à la seconde près.
 * Contrôles aussi disponibles sur l'écran de verrouillage (Media Session API).
 */

const SAVE_EVERY_S = 5;
const SKIP_S = 15;
const RATES = [0.75, 1, 1.25, 1.5] as const;

type DownloadState = { status: 'idle' } | { status: 'downloading'; ratio: number } | { status: 'error'; message: string };

function formatTime(s: number): string {
  if (!Number.isFinite(s) || s < 0) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

export interface PodcastPlayerProps {
  episodes?: readonly Episode[];
}

export function PodcastPlayer({ episodes = EPISODES }: PodcastPlayerProps): JSX.Element {
  const online = useOnlineStatus();
  const audioRef = useRef<HTMLAudioElement>(null);
  const objectUrlRef = useRef<string | null>(null);
  const lastSaveRef = useRef(0);
  const resumeOnReconnectRef = useRef(false);

  const [current, setCurrent] = useState<Episode | null>(null);
  const [playing, setPlaying] = useState(false);
  const [buffering, setBuffering] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [rate, setRate] = useState<number>(1);
  const [error, setError] = useState<string | null>(null);
  const [cached, setCached] = useState<Record<string, boolean>>({});
  const [downloads, setDownloads] = useState<Record<string, DownloadState>>({});
  const [progress, setProgress] = useState<Record<string, EpisodeProgress>>(getAllProgress);

  // État du cache de chaque épisode au démarrage.
  useEffect(() => {
    let cancelled = false;
    void Promise.all(episodes.map(async (e) => [e.id, await isCached(e.src)] as const)).then((entries) => {
      if (!cancelled) setCached(Object.fromEntries(entries));
    });
    return () => {
      cancelled = true;
    };
  }, [episodes]);

  // Libère l'URL Blob au démontage.
  useEffect(
    () => () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    },
    []
  );

  const persist = useCallback((ep: Episode, t: number, d: number, done = false) => {
    const p: EpisodeProgress = { t, d, done };
    saveProgress(ep.id, p);
    setProgress((prev) => ({ ...prev, [ep.id]: p }));
  }, []);

  /** Charge un épisode (cache local en priorité) et reprend à la position sauvegardée. */
  const load = useCallback(
    async (ep: Episode, autoplay: boolean): Promise<void> => {
      const audio = audioRef.current;
      if (!audio) return;
      setError(null);
      setBuffering(true);

      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }

      let src: string = ep.src;
      const localUrl = await getCachedObjectUrl(ep.src);
      if (localUrl) {
        objectUrlRef.current = localUrl;
        src = localUrl;
      } else if (!navigator.onLine) {
        setBuffering(false);
        setError('Cet épisode n’est pas téléchargé. Reconnecte-toi ou choisis un épisode téléchargé ⬇.');
        return;
      }

      setCurrent(ep);
      lastSaveRef.current = 0;
      setTime(0);
      setDuration(ep.duration);
      audio.src = src;
      audio.playbackRate = rate;

      const saved = getProgress(ep.id);
      audio.onloadedmetadata = () => {
        if (saved && !saved.done && saved.t > 3 && saved.t < audio.duration - 5) {
          audio.currentTime = saved.t - 2; // léger recul pour retrouver le fil
        }
        setDuration(audio.duration);
      };

      if (autoplay) {
        try {
          await audio.play();
        } catch {
          setBuffering(false); // lecture bloquée (ex. autoplay) : l'élève appuiera sur ▶
        }
      }
    },
    [rate]
  );

  const toggle = useCallback(
    (ep?: Episode) => {
      const audio = audioRef.current;
      if (!audio) return;
      const target = ep ?? current;
      if (!target) return;
      if (target.id !== current?.id) {
        if (current) persist(current, audio.currentTime, audio.duration || current.duration);
        void load(target, true);
        return;
      }
      if (audio.paused) void audio.play().catch(() => setError('Lecture impossible.'));
      else audio.pause();
    },
    [current, load, persist]
  );

  const seekBy = useCallback((delta: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.max(0, Math.min((audio.duration || 0) - 0.5, audio.currentTime + delta));
  }, []);

  // --- Événements de l'élément audio ---
  function onTimeUpdate(): void {
    const audio = audioRef.current;
    if (!audio || !current) return;
    setTime(audio.currentTime);
    if (Math.abs(audio.currentTime - lastSaveRef.current) >= SAVE_EVERY_S) {
      lastSaveRef.current = audio.currentTime;
      persist(current, audio.currentTime, audio.duration || current.duration);
    }
  }
  function onPause(): void {
    setPlaying(false);
    const audio = audioRef.current;
    if (audio && current) persist(current, audio.currentTime, audio.duration || current.duration);
  }
  function onEnded(): void {
    setPlaying(false);
    if (current) persist(current, 0, duration, true);
  }
  function onAudioError(): void {
    setPlaying(false);
    setBuffering(false);
    if (!current) return;
    const audio = audioRef.current;
    // Sauvegarde la dernière position connue pour une reprise exacte.
    persist(current, audio?.currentTime || time, duration);
    if (!navigator.onLine) {
      resumeOnReconnectRef.current = true;
      setError('Connexion perdue. La lecture reprendra automatiquement au retour du réseau.');
    } else {
      setError('Cet épisode n’est pas encore disponible. Reviens bientôt !');
    }
  }

  // Reprise automatique au retour du réseau.
  useEffect(() => {
    if (online && resumeOnReconnectRef.current && current) {
      resumeOnReconnectRef.current = false;
      void load(current, true);
    }
  }, [online, current, load]);

  // Contrôles système (écran de verrouillage, casque Bluetooth).
  useEffect(() => {
    if (!('mediaSession' in navigator) || !current) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: current.title,
      artist: current.kind === 'conte' ? 'Contes de Socrate' : 'Logique avec Socrate',
      album: 'Scratch Socratique'
    });
    const ms = navigator.mediaSession;
    ms.setActionHandler('play', () => void audioRef.current?.play());
    ms.setActionHandler('pause', () => audioRef.current?.pause());
    ms.setActionHandler('seekbackward', () => seekBy(-SKIP_S));
    ms.setActionHandler('seekforward', () => seekBy(SKIP_S));
    return () => {
      for (const a of ['play', 'pause', 'seekbackward', 'seekforward'] as const) ms.setActionHandler(a, null);
    };
  }, [current, seekBy]);

  // --- Téléchargement / suppression ---
  async function download(ep: Episode): Promise<void> {
    setDownloads((d) => ({ ...d, [ep.id]: { status: 'downloading', ratio: 0 } }));
    try {
      await downloadEpisode(ep.src, (ratio) =>
        setDownloads((d) => ({ ...d, [ep.id]: { status: 'downloading', ratio } }))
      );
      setCached((c) => ({ ...c, [ep.id]: true }));
      setDownloads((d) => ({ ...d, [ep.id]: { status: 'idle' } }));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Échec du téléchargement.';
      setDownloads((d) => ({ ...d, [ep.id]: { status: 'error', message } }));
    }
  }

  async function remove(ep: Episode): Promise<void> {
    await removeEpisode(ep.src);
    setCached((c) => ({ ...c, [ep.id]: false }));
  }

  function changeRate(): void {
    const i = RATES.indexOf(rate as (typeof RATES)[number]);
    const next = RATES[(i + 1) % RATES.length] ?? 1;
    setRate(next);
    if (audioRef.current) audioRef.current.playbackRate = next;
  }

  return (
    <section className="pp" aria-label="Podcasts">
      <header className="pp-head">
        <h1>🎧 Écouter</h1>
        <p>Contes et explications pour comprendre la logique. Télécharge ⬇ un épisode pour l’écouter sans connexion.</p>
      </header>

      <ul className="pp-list">
        {episodes.map((ep) => {
          const isCurrent = current?.id === ep.id;
          const dl = downloads[ep.id] ?? { status: 'idle' };
          const isCachedEp = cached[ep.id] === true;
          const p = progress[ep.id];
          const pct = p ? (p.done ? 100 : Math.round((p.t / (p.d || ep.duration)) * 100)) : 0;
          const unavailable = !online && !isCachedEp;

          return (
            <li key={ep.id} className={`pp-item${isCurrent ? ' is-current' : ''}${unavailable ? ' is-unavailable' : ''}`}>
              <button
                type="button"
                className="pp-play"
                onClick={() => toggle(ep)}
                disabled={unavailable}
                aria-label={isCurrent && playing ? `Pause : ${ep.title}` : `Écouter : ${ep.title}`}
              >
                {isCurrent && playing ? '❚❚' : '▶'}
              </button>

              <div className="pp-info">
                <span className={`pp-tag is-${ep.kind}`}>{ep.kind === 'conte' ? 'Conte' : 'Logique'}</span>
                <span className="pp-concept">{ep.concept}</span>
                <h2>{ep.title}</h2>
                <p>{ep.description}</p>
                <span className="pp-meta">
                  {formatTime(ep.duration)} · {ep.sizeMb.toLocaleString('fr')} Mo
                  {p?.done ? ' · ✓ écouté' : pct > 0 ? ` · ${pct} % écouté` : ''}
                </span>
                {pct > 0 && !p?.done && (
                  <span className="pp-progress" aria-hidden="true">
                    <span style={{ width: `${pct}%` }} />
                  </span>
                )}
                {dl.status === 'error' && <span className="pp-error">{dl.message}</span>}
              </div>

              <div className="pp-dl">
                {dl.status === 'downloading' ? (
                  <span className="pp-dl-progress" aria-label="Téléchargement en cours">
                    {Math.round(dl.ratio * 100)} %
                  </span>
                ) : isCachedEp ? (
                  <button type="button" onClick={() => void remove(ep)} title="Supprimer du téléphone" aria-label="Supprimer le téléchargement">
                    ✓🗑
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => void download(ep)}
                    disabled={!online}
                    title={`Télécharger (${ep.sizeMb} Mo)`}
                    aria-label={`Télécharger ${ep.title}`}
                  >
                    ⬇
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      {error && (
        <p className="pp-alert" role="alert">
          {error}
        </p>
      )}

      {/* Barre de lecture */}
      <div className={`pp-bar${current ? '' : ' is-empty'}`}>
        <audio
          ref={audioRef}
          preload="none"
          onPlay={() => setPlaying(true)}
          onPlaying={() => setBuffering(false)}
          onWaiting={() => setBuffering(true)}
          onPause={onPause}
          onEnded={onEnded}
          onTimeUpdate={onTimeUpdate}
          onError={onAudioError}
        />
        {current ? (
          <>
            <div className="pp-now">
              <strong>{current.title}</strong>
              <span>{buffering ? 'Chargement…' : cached[current.id] ? 'Hors-ligne ✓' : 'En streaming'}</span>
            </div>
            <input
              type="range"
              className="pp-seek"
              min={0}
              max={duration || current.duration}
              step={1}
              value={time}
              onChange={(e) => {
                if (audioRef.current) audioRef.current.currentTime = Number(e.target.value);
              }}
              aria-label="Position de lecture"
            />
            <div className="pp-controls">
              <span className="pp-time">{formatTime(time)}</span>
              <button type="button" onClick={() => seekBy(-SKIP_S)} aria-label="Reculer de 15 secondes">↺15</button>
              <button type="button" className="pp-main" onClick={() => toggle()} aria-label={playing ? 'Pause' : 'Lecture'}>
                {playing ? '❚❚' : '▶'}
              </button>
              <button type="button" onClick={() => seekBy(SKIP_S)} aria-label="Avancer de 15 secondes">15↻</button>
              <button type="button" onClick={changeRate} aria-label="Vitesse de lecture">{rate}×</button>
              <span className="pp-time">{formatTime(duration)}</span>
            </div>
          </>
        ) : (
          <p className="pp-hint">Choisis un épisode pour commencer l’écoute.</p>
        )}
      </div>
    </section>
  );
}

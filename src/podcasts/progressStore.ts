/**
 * Mémorise la position d'écoute de chaque épisode (par appareil), pour
 * reprendre exactement là où l'élève s'était arrêté — y compris après une
 * coupure réseau ou la fermeture de l'application.
 * localStorage peut être indisponible (navigation privée) : tout est protégé.
 */

export interface EpisodeProgress {
  /** Position en secondes. */
  t: number;
  /** Durée connue en secondes. */
  d: number;
  /** Épisode écouté jusqu'au bout. */
  done: boolean;
}

const KEY = 'podcast-progress-v1';

function readAll(): Record<string, EpisodeProgress> {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Record<string, EpisodeProgress>) : {};
  } catch {
    return {};
  }
}

export function getProgress(id: string): EpisodeProgress | undefined {
  return readAll()[id];
}

export function getAllProgress(): Record<string, EpisodeProgress> {
  return readAll();
}

export function saveProgress(id: string, p: EpisodeProgress): void {
  try {
    const all = readAll();
    all[id] = p;
    localStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    /* stockage indisponible : on continue sans reprise */
  }
}

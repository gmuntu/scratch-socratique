/**
 * Catalogue des mini-épisodes audio.
 * Les fichiers sont à déposer dans public/podcasts/ (MP3 mono 48–64 kbit/s
 * recommandé : environ 0,5 Mo par minute, adapté aux forfaits mobiles limités).
 */
export type EpisodeKind = 'conte' | 'logique';

export interface Episode {
  id: string;
  kind: EpisodeKind;
  title: string;
  description: string;
  /** Notion de programmation abordée (pour faire le lien avec les puzzles). */
  concept: string;
  /** Chemin servi par l'application (même origine → cachable par le ServiceWorker). */
  src: string;
  /** Durée approximative en secondes (affichée avant chargement). */
  duration: number;
  /** Taille approximative en Mo (affichée avant téléchargement). */
  sizeMb: number;
}

export const EPISODES: readonly Episode[] = [
  {
    id: 'conte-tontine',
    kind: 'conte',
    title: 'Awa et la tontine du quartier',
    description: 'Chaque mois, la même cotisation, le même geste… Awa découvre qu’on peut tout dire en une seule phrase.',
    concept: 'Boucles « répéter »',
    src: '/podcasts/conte-tontine.mp3',
    duration: 210,
    sizeMb: 1.2
  },
  {
    id: 'logique-ordre',
    kind: 'logique',
    title: 'Pourquoi l’ordre compte',
    description: 'Rendre la monnaie avant d’être payé ? Une explication de la séquence d’instructions.',
    concept: 'Séquence',
    src: '/podcasts/logique-ordre.mp3',
    duration: 150,
    sizeMb: 0.9
  },
  {
    id: 'conte-credit',
    kind: 'conte',
    title: 'Le téléphone qui savait dire non',
    description: 'Moussa veut appeler sa grand-mère, mais son crédit est presque vide…',
    concept: 'Conditions « si … sinon »',
    src: '/podcasts/conte-credit.mp3',
    duration: 210,
    sizeMb: 1.2
  },
  {
    id: 'logique-variables',
    kind: 'logique',
    title: 'Les variables sont des calebasses',
    description: 'Une calebasse qui garde une valeur, qu’on remplit et qu’on vide : voilà une variable.',
    concept: 'Variables',
    src: '/podcasts/logique-variables.mp3',
    duration: 150,
    sizeMb: 0.9
  },
  {
    id: 'conte-arrosage',
    kind: 'conte',
    title: 'Le champ des huit rangs',
    description: 'Le vieux Koffi arrose rang après rang, jusqu’au dernier. Comment sait-il quand s’arrêter ?',
    concept: 'Boucle « répéter jusqu’à »',
    src: '/podcasts/conte-arrosage.mp3',
    duration: 210,
    sizeMb: 1.2
  }
];

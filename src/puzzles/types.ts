/** Catégories de blocs (couleurs officielles Scratch dans le CSS). */
export type BlockCategory = 'evenements' | 'controle' | 'variables' | 'apparence' | 'mouvement';

/**
 * Forme du bloc :
 *  - hat   : bloc de départ (événement), toujours en tête
 *  - c     : bloc « contenant » (répéter, si … alors) : les blocs suivants s'indentent dedans
 *  - else  : « sinon », séparateur d'un bloc si/sinon
 *  - stack : bloc simple
 */
export type BlockKind = 'hat' | 'c' | 'else' | 'stack';

export interface BlockDef {
  id: string;
  category: BlockCategory;
  kind: BlockKind;
  label: string;
}

/** Une étape attendue : quel bloc, à quel niveau d'imbrication (0 = principal). */
export interface SolutionStep {
  blockId: string;
  indent: number;
}

export interface Exercise {
  id: string;
  title: string;
  /** Analogie du quotidien que le tuteur doit réutiliser. */
  analogy: string;
  /** Mise en situation affichée à l'élève. */
  story: string;
  /** Ce que le programme doit faire. */
  goal: string;
  /** Blocs proposés (solution + pièges). Chaque bloc ne s'utilise qu'une fois. */
  blocks: readonly BlockDef[];
  solution: readonly SolutionStep[];
  /** Autres ordres également corrects. */
  alternatives?: readonly (readonly SolutionStep[])[];
}

/** Bloc placé par l'élève dans son programme. */
export interface PlacedBlock {
  uid: string;
  blockId: string;
  indent: number;
}

export type FeedbackCode =
  | 'empty'
  | 'missing-event'
  | 'event-not-first'
  | 'missing-block'
  | 'extra-block'
  | 'wrong-order'
  | 'wrong-nesting';

export type PuzzleFeedback =
  | { ok: true; message: string }
  | {
      ok: false;
      code: FeedbackCode;
      /** Message doux affiché à l'élève (ne révèle pas la solution). */
      studentMessage: string;
      /** Diagnostic précis, réservé au tuteur. */
      tutorContext: string;
      /** Position (0-based) du bloc fautif, si pertinent. */
      index?: number;
    };

/** Message transmis au chat : texte affiché à l'élève + prompt réel envoyé à l'IA. */
export interface PendingPrompt {
  id: string;
  display: string;
  prompt: string;
}

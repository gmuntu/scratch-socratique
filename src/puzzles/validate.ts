import type { Exercise, PendingPrompt, PlacedBlock, PuzzleFeedback, SolutionStep } from './types';

/**
 * Vérifie le programme de l'élève et produit un diagnostic à deux niveaux :
 *  - studentMessage : indice doux, sous forme de question, sans solution ;
 *  - tutorContext   : diagnostic précis, transmis uniquement à l'IA.
 * Les vérifications vont du plus fondamental (déclencheur) au plus fin (imbrication),
 * pour ne signaler qu'UNE erreur à la fois — principe socratique.
 */

function matches(program: readonly PlacedBlock[], sol: readonly SolutionStep[]): boolean {
  return (
    program.length === sol.length &&
    sol.every((s, i) => program[i]?.blockId === s.blockId && program[i]?.indent === s.indent)
  );
}

export function validateProgram(ex: Exercise, program: readonly PlacedBlock[]): PuzzleFeedback {
  const label = (id: string): string => ex.blocks.find((b) => b.id === id)?.label ?? id;
  const q = (id: string): string => `« ${label(id)} »`;

  if (program.length === 0) {
    return {
      ok: false,
      code: 'empty',
      studentMessage: 'Ton programme est vide. Glisse ou touche un premier bloc pour commencer !',
      tutorContext: 'L’élève n’a encore placé aucun bloc.'
    };
  }

  if ([ex.solution, ...(ex.alternatives ?? [])].some((s) => matches(program, s))) {
    return { ok: true, message: `Bravo ! Ton programme « ${ex.title} » fonctionne. Sauras-tu expliquer pourquoi ?` };
  }

  const sol = ex.solution;

  // 1. Le déclencheur (bloc chapeau) doit exister et être en tête.
  const firstStep = sol[0];
  const hat = firstStep ? ex.blocks.find((b) => b.id === firstStep.blockId && b.kind === 'hat') : undefined;
  if (hat) {
    if (!program.some((p) => p.blockId === hat.id)) {
      return {
        ok: false,
        code: 'missing-event',
        studentMessage: 'Ton programme ne sait pas quand démarrer. Quel bloc donne le signal de départ ?',
        tutorContext: `Il manque le bloc d’événement ${q(hat.id)} qui déclenche le programme.`
      };
    }
    if (program[0]?.blockId !== hat.id) {
      return {
        ok: false,
        code: 'event-not-first',
        index: 0,
        studentMessage: 'Le signal de départ est bien là… mais est-il au bon endroit ?',
        tutorContext: `Le bloc d’événement ${q(hat.id)} n’est pas en première position.`
      };
    }
  }

  const expectedIds = sol.map((s) => s.blockId);
  const placedIds = program.map((p) => p.blockId);

  // 2. Blocs manquants.
  const missing = expectedIds.filter((id) => !placedIds.includes(id));
  if (missing.length > 0) {
    return {
      ok: false,
      code: 'missing-block',
      studentMessage:
        missing.length === 1
          ? 'Il manque encore un bloc pour que l’histoire soit complète. Relis l’objectif : quelle étape n’as-tu pas encore écrite ?'
          : `Il manque encore ${missing.length} blocs. Relis l’objectif étape par étape.`,
      tutorContext: `Blocs manquants : ${missing.map(q).join(', ')}.`
    };
  }

  // 3. Blocs en trop (pièges).
  const extraIdx = program.findIndex((p) => !expectedIds.includes(p.blockId));
  const extra = program[extraIdx];
  if (extra) {
    return {
      ok: false,
      code: 'extra-block',
      index: extraIdx,
      studentMessage: `Le bloc ${q(extra.blockId)} est-il vraiment utile ici ? Que se passerait-il avec lui ?`,
      tutorContext: `Bloc piège ou en trop : ${q(extra.blockId)} (position ${extraIdx + 1}).`
    };
  }

  // 4. Ordre.
  const orderIdx = program.findIndex((p, i) => p.blockId !== sol[i]?.blockId);
  const wrong = program[orderIdx];
  const expectedAt = sol[orderIdx];
  if (wrong && expectedAt) {
    return {
      ok: false,
      code: 'wrong-order',
      index: orderIdx,
      studentMessage: `Tu as les bons blocs, mais l’ordre coince vers l’étape ${orderIdx + 1}. Dans la vraie vie, que doit-il se passer d’abord ?`,
      tutorContext: `Ordre incorrect à la position ${orderIdx + 1} : l’élève a mis ${q(wrong.blockId)} là où on attend ${q(expectedAt.blockId)}.`
    };
  }

  // 5. Imbrication (ce qui est « dedans » ou « dehors » d'une boucle / condition).
  const nestIdx = program.findIndex((p, i) => p.indent !== sol[i]?.indent);
  const nested = program[nestIdx];
  const nestExpected = sol[nestIdx];
  if (nested && nestExpected) {
    const inside = nestExpected.indent > nested.indent;
    return {
      ok: false,
      code: 'wrong-nesting',
      index: nestIdx,
      studentMessage: `Regarde le bloc ${q(nested.blockId)} : doit-il se répéter / dépendre de la condition, ou se faire une seule fois ?`,
      tutorContext: `Imbrication incorrecte : ${q(nested.blockId)} devrait être ${
        inside ? 'À L’INTÉRIEUR' : 'EN DEHORS'
      } du bloc de contrôle (niveau ${nested.indent} au lieu de ${nestExpected.indent}).`
    };
  }

  return {
    ok: false,
    code: 'wrong-order',
    studentMessage: 'Presque ! Relis ton programme bloc par bloc en imaginant ce que fait le lutin.',
    tutorContext: 'Programme différent de la solution attendue.'
  };
}

/** Rend le programme lisible pour l'IA (l'indentation montre l'imbrication). */
export function programToText(ex: Exercise, program: readonly PlacedBlock[]): string {
  if (program.length === 0) return '(vide)';
  return program
    .map((p, i) => {
      const label = ex.blocks.find((b) => b.id === p.blockId)?.label ?? p.blockId;
      return `${i + 1}. ${'    '.repeat(p.indent)}${label}`;
    })
    .join('\n');
}

/** Construit le message transmis au tuteur socratique après une erreur. */
export function buildTutorPrompt(
  ex: Exercise,
  program: readonly PlacedBlock[],
  feedback: Extract<PuzzleFeedback, { ok: false }>
): PendingPrompt {
  const prompt = `[CONTEXTE PUZZLE — informations pour toi seul, ne révèle ni la solution ni l’ordre des blocs]
Exercice : ${ex.title}
Situation : ${ex.story}
Objectif : ${ex.goal}
Programme actuel de l’élève (l’indentation = à l’intérieur d’un bloc) :
${programToText(ex, program)}
Erreur détectée : ${feedback.tutorContext}

Aide l’élève à trouver lui-même cette erreur : reformule ce qu’il a fait, utilise l’analogie de ${ex.analogy}, et termine par UNE seule question.`;

  return {
    id: `${ex.id}-${Date.now()}`,
    display: `🧩 Mon puzzle « ${ex.title} » ne marche pas encore. Tu peux m’aider ?`,
    prompt
  };
}

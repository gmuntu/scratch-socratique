import { useMemo, useState, type DragEvent } from 'react';
import { EXERCISES } from '../puzzles/exercises';
import { buildTutorPrompt, validateProgram } from '../puzzles/validate';
import type { BlockCategory, BlockDef, Exercise, PendingPrompt, PlacedBlock, PuzzleFeedback } from '../puzzles/types';
import './ScratchPuzzleWorkspace.css';

/**
 * ScratchPuzzleWorkspace — mini-espace de travail Scratch façon « puzzle ».
 *
 * L'élève compose un programme à partir d'une palette de blocs :
 *  - ordinateur : glisser-déposer (palette → programme, et réordonnancement) ;
 *  - mobile / clavier : toucher un bloc l'ajoute, puis boutons ↑ ↓ ← → ✕
 *    (le glisser-déposer HTML5 ne fonctionne pas au doigt).
 * ← / → règlent l'imbrication : un bloc décalé est « à l'intérieur » du bloc
 * de contrôle au-dessus (répéter, si … alors, sinon).
 *
 * « Vérifier » valide la séquence ; en cas d'erreur, une alerte s'affiche et
 * l'élève peut transmettre le diagnostic au tuteur socratique (onAskTutor).
 */

const MAX_INDENT = 2;

const CATEGORY_LABEL: Record<BlockCategory, string> = {
  evenements: 'Événements',
  controle: 'Contrôle',
  variables: 'Variables',
  apparence: 'Apparence',
  mouvement: 'Mouvement'
};
const CATEGORY_ORDER: readonly BlockCategory[] = ['evenements', 'controle', 'variables', 'mouvement', 'apparence'];

export interface ScratchPuzzleWorkspaceProps {
  exercises?: readonly Exercise[];
  /** Appelé quand l'élève demande de l'aide après une erreur. */
  onAskTutor?: (prompt: PendingPrompt) => void;
  /** Appelé après chaque vérification (succès ou erreur). */
  onResult?: (feedback: PuzzleFeedback, exercise: Exercise) => void;
}

let uidCounter = 0;
const nextUid = (): string => `b${++uidCounter}`;

export function ScratchPuzzleWorkspace({
  exercises = EXERCISES,
  onAskTutor,
  onResult
}: ScratchPuzzleWorkspaceProps): JSX.Element {
  const [exIndex, setExIndex] = useState(0);
  const [program, setProgram] = useState<PlacedBlock[]>([]);
  const [feedback, setFeedback] = useState<PuzzleFeedback | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);

  const exercise = exercises[exIndex];

  // Palette triée par catégorie (et non dans l'ordre de la solution).
  const palette = useMemo<BlockDef[]>(() => {
    if (!exercise) return [];
    return [...exercise.blocks].sort(
      (a, b) =>
        CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category) ||
        a.label.localeCompare(b.label, 'fr')
    );
  }, [exercise]);

  if (!exercise) return <p>Aucun exercice disponible.</p>;
  const ex: Exercise = exercise;

  const def = (id: string): BlockDef | undefined => ex.blocks.find((b) => b.id === id);
  const used = new Set(program.map((p) => p.blockId));

  /** Toute modification efface le diagnostic précédent. */
  function update(next: PlacedBlock[]): void {
    setProgram(next);
    setFeedback(null);
  }

  function addBlock(blockId: string, at: number = program.length): void {
    if (used.has(blockId)) return;
    const next = [...program];
    next.splice(at, 0, { uid: nextUid(), blockId, indent: 0 });
    update(next);
  }

  /** Déplace un bloc pour qu'il se retrouve avant la position `to` actuelle. */
  function moveTo(uid: string, to: number): void {
    const from = program.findIndex((p) => p.uid === uid);
    const item = program[from];
    if (!item) return;
    const next = program.filter((p) => p.uid !== uid);
    next.splice(from < to ? to - 1 : to, 0, item);
    update(next);
  }

  function shift(uid: string, delta: -1 | 1): void {
    const i = program.findIndex((p) => p.uid === uid);
    if (i < 0) return;
    moveTo(uid, delta < 0 ? Math.max(0, i - 1) : Math.min(program.length, i + 2));
  }

  function indent(uid: string, delta: -1 | 1): void {
    update(
      program.map((p) =>
        p.uid === uid ? { ...p, indent: Math.min(MAX_INDENT, Math.max(0, p.indent + delta)) } : p
      )
    );
  }

  function remove(uid: string): void {
    update(program.filter((p) => p.uid !== uid));
  }

  function check(): void {
    const fb = validateProgram(ex, program);
    setFeedback(fb);
    onResult?.(fb, ex);
  }

  function askTutor(): void {
    if (feedback && !feedback.ok) onAskTutor?.(buildTutorPrompt(ex, program, feedback));
  }

  function changeExercise(i: number): void {
    setExIndex(i);
    setProgram([]);
    setFeedback(null);
  }

  // --- Glisser-déposer (souris) ---
  function onDragStart(e: DragEvent<HTMLElement>, payload: string): void {
    e.dataTransfer.setData('text/plain', payload);
    e.dataTransfer.effectAllowed = 'move';
  }
  function onDragOver(e: DragEvent<HTMLElement>, index: number): void {
    e.preventDefault();
    e.stopPropagation();
    if (dropIndex !== index) setDropIndex(index);
  }
  function onDrop(e: DragEvent<HTMLElement>, index: number): void {
    e.preventDefault();
    e.stopPropagation();
    setDropIndex(null);
    const data = e.dataTransfer.getData('text/plain');
    if (data.startsWith('p:')) addBlock(data.slice(2), index);
    else if (data.startsWith('m:')) moveTo(data.slice(2), index);
  }

  const errorIndex = feedback && !feedback.ok ? feedback.index : undefined;

  return (
    <section className="pz" aria-label="Atelier de blocs Scratch">
      <header className="pz-head">
        <label className="pz-select">
          <span>Exercice</span>
          <select value={exIndex} onChange={(e) => changeExercise(Number(e.target.value))}>
            {exercises.map((x, i) => (
              <option key={x.id} value={i}>
                {i + 1}. {x.title}
              </option>
            ))}
          </select>
        </label>
        <p className="pz-story">{ex.story}</p>
        <p className="pz-goal">
          <strong>Objectif :</strong> {ex.goal}
        </p>
      </header>

      <div className="pz-body">
        <div className="pz-palette" aria-label="Blocs disponibles">
          <h2>Blocs</h2>
          <p className="pz-hint">Touche ou glisse un bloc.</p>
          <ul>
            {palette.map((b) => {
              const isUsed = used.has(b.id);
              return (
                <li key={b.id}>
                  <button
                    type="button"
                    className={`pz-block cat-${b.category} kind-${b.kind}`}
                    draggable={!isUsed}
                    disabled={isUsed}
                    onDragStart={(e) => onDragStart(e, `p:${b.id}`)}
                    onClick={() => addBlock(b.id)}
                    title={CATEGORY_LABEL[b.category]}
                  >
                    {b.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <div
          className={`pz-program${dropIndex === program.length ? ' is-drop-end' : ''}`}
          aria-label="Ton programme"
          onDragOver={(e) => onDragOver(e, program.length)}
          onDragLeave={() => setDropIndex(null)}
          onDrop={(e) => onDrop(e, program.length)}
        >
          <h2>Ton programme</h2>
          {program.length === 0 && <p className="pz-empty">Dépose tes blocs ici.</p>}
          <ol>
            {program.map((p, i) => {
              const b = def(p.blockId);
              if (!b) return null;
              return (
                <li
                  key={p.uid}
                  className={`pz-row${dropIndex === i ? ' is-drop' : ''}${errorIndex === i ? ' is-error' : ''}`}
                  style={{ paddingLeft: `${p.indent * 28}px` }}
                  draggable
                  onDragStart={(e) => onDragStart(e, `m:${p.uid}`)}
                  onDragOver={(e) => onDragOver(e, i)}
                  onDrop={(e) => onDrop(e, i)}
                >
                  <span className={`pz-block cat-${b.category} kind-${b.kind}`}>{b.label}</span>
                  <span className="pz-tools">
                    <button type="button" onClick={() => shift(p.uid, -1)} disabled={i === 0} aria-label="Monter">↑</button>
                    <button type="button" onClick={() => shift(p.uid, 1)} disabled={i === program.length - 1} aria-label="Descendre">↓</button>
                    <button type="button" onClick={() => indent(p.uid, -1)} disabled={p.indent === 0} aria-label="Sortir du bloc">←</button>
                    <button type="button" onClick={() => indent(p.uid, 1)} disabled={p.indent >= MAX_INDENT} aria-label="Mettre à l’intérieur">→</button>
                    <button type="button" onClick={() => remove(p.uid)} aria-label="Retirer">✕</button>
                  </span>
                </li>
              );
            })}
          </ol>
        </div>
      </div>

      <footer className="pz-actions">
        <button type="button" className="pz-secondary" onClick={() => update([])} disabled={program.length === 0}>
          Recommencer
        </button>
        <button type="button" className="pz-primary" onClick={check}>
          Vérifier ✔
        </button>
      </footer>

      {feedback && (
        <div className={`pz-feedback ${feedback.ok ? 'is-ok' : 'is-ko'}`} role="alert">
          {feedback.ok ? (
            <>
              <p>🎉 {feedback.message}</p>
              {exIndex < exercises.length - 1 && (
                <button type="button" className="pz-primary" onClick={() => changeExercise(exIndex + 1)}>
                  Exercice suivant →
                </button>
              )}
            </>
          ) : (
            <>
              <p>🤔 {feedback.studentMessage}</p>
              {onAskTutor && (
                <button type="button" className="pz-primary" onClick={askTutor}>
                  Demander de l’aide à Socrate
                </button>
              )}
            </>
          )}
        </div>
      )}
    </section>
  );
}

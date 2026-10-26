import type { Exercise } from './types';

/**
 * Exercices de type « puzzle de Parsons » : l'élève remet les blocs dans
 * l'ordre et règle l'imbrication. Chaque exercice s'ancre dans une
 * analogie du quotidien en Afrique francophone.
 */
export const EXERCISES: readonly Exercise[] = [
  {
    id: 'tontine',
    title: 'La tontine du quartier',
    analogy: 'la tontine',
    story: 'Douze membres versent chacun 5 000 FCFA. Le lutin trésorier doit compter la caisse.',
    goal: 'Au drapeau vert : la caisse part de 0, on ajoute 5 000 pour chacun des 12 membres, puis on annonce le total.',
    blocks: [
      { id: 'flag', category: 'evenements', kind: 'hat', label: 'quand le drapeau vert est cliqué' },
      { id: 'set0', category: 'variables', kind: 'stack', label: 'mettre caisse à 0' },
      { id: 'rep12', category: 'controle', kind: 'c', label: 'répéter 12 fois' },
      { id: 'add', category: 'variables', kind: 'stack', label: 'ajouter 5000 à caisse' },
      { id: 'say', category: 'apparence', kind: 'stack', label: 'dire (caisse)' },
      // Pièges
      { id: 'forever', category: 'controle', kind: 'c', label: 'répéter indéfiniment' },
      { id: 'set5000', category: 'variables', kind: 'stack', label: 'mettre caisse à 5000' }
    ],
    solution: [
      { blockId: 'flag', indent: 0 },
      { blockId: 'set0', indent: 0 },
      { blockId: 'rep12', indent: 0 },
      { blockId: 'add', indent: 1 },
      { blockId: 'say', indent: 0 }
    ]
  },
  {
    id: 'recharge',
    title: 'Le crédit téléphonique',
    analogy: 'la recharge téléphonique',
    story: 'Chaque appel coûte 100 unités. Quand le crédit est trop bas, le téléphone doit prévenir au lieu d’appeler.',
    goal: 'Quand on appuie sur espace : si le solde est inférieur à 100, dire « Recharge ton crédit ! », sinon retirer 100 au solde.',
    blocks: [
      { id: 'space', category: 'evenements', kind: 'hat', label: 'quand la touche espace est pressée' },
      { id: 'if', category: 'controle', kind: 'c', label: 'si solde < 100 alors' },
      { id: 'warn', category: 'apparence', kind: 'stack', label: 'dire « Recharge ton crédit ! »' },
      { id: 'else', category: 'controle', kind: 'else', label: 'sinon' },
      { id: 'pay', category: 'variables', kind: 'stack', label: 'ajouter -100 à solde' },
      // Pièges
      { id: 'ifgt', category: 'controle', kind: 'c', label: 'si solde > 100 alors' },
      { id: 'rep10', category: 'controle', kind: 'c', label: 'répéter 10 fois' }
    ],
    solution: [
      { blockId: 'space', indent: 0 },
      { blockId: 'if', indent: 0 },
      { blockId: 'warn', indent: 1 },
      { blockId: 'else', indent: 0 },
      { blockId: 'pay', indent: 1 }
    ]
  },
  {
    id: 'arrosage',
    title: 'L’arrosage du champ',
    analogy: 'l’arrosage agricole',
    story: 'Le champ compte 8 rangs. Le lutin cultivateur avance et arrose rang après rang jusqu’au dernier.',
    goal: 'Au drapeau vert : remettre le compteur à 0, puis avancer et compter un rang de plus jusqu’à 8 rangs, et enfin dire « Champ arrosé ! ».',
    blocks: [
      { id: 'flag', category: 'evenements', kind: 'hat', label: 'quand le drapeau vert est cliqué' },
      { id: 'set0', category: 'variables', kind: 'stack', label: 'mettre rangs arrosés à 0' },
      { id: 'until', category: 'controle', kind: 'c', label: 'répéter jusqu’à rangs arrosés = 8' },
      { id: 'move', category: 'mouvement', kind: 'stack', label: 'avancer de 30 pas' },
      { id: 'inc', category: 'variables', kind: 'stack', label: 'ajouter 1 à rangs arrosés' },
      { id: 'done', category: 'apparence', kind: 'stack', label: 'dire « Champ arrosé ! »' },
      // Piège
      { id: 'set8', category: 'variables', kind: 'stack', label: 'mettre rangs arrosés à 8' }
    ],
    solution: [
      { blockId: 'flag', indent: 0 },
      { blockId: 'set0', indent: 0 },
      { blockId: 'until', indent: 0 },
      { blockId: 'move', indent: 1 },
      { blockId: 'inc', indent: 1 },
      { blockId: 'done', indent: 0 }
    ],
    alternatives: [
      [
        { blockId: 'flag', indent: 0 },
        { blockId: 'set0', indent: 0 },
        { blockId: 'until', indent: 0 },
        { blockId: 'inc', indent: 1 },
        { blockId: 'move', indent: 1 },
        { blockId: 'done', indent: 0 }
      ]
    ]
  }
];

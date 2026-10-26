# Scripts des podcasts — Scratch Socratique

**Conseils d'enregistrement**
- Lis lentement (≈ 130 mots/minute), avec des pauses. Les `[pause]` = 1 à 2 secondes de silence.
- Les passages en *italique* sont des indications de jeu, à ne pas lire.
- Enregistre dans une pièce calme (un placard plein de vêtements est un excellent studio).
- Export : MP3 **mono, 48 kbit/s**, 44,1 kHz → environ 0,35 Mo par minute.
- Noms de fichiers à respecter, à déposer dans `public/podcasts/`.

Chaque épisode suit la même structure : **accroche → histoire → question à l'élève → lien avec Scratch → défi**.
On ne donne jamais la solution complète : on termine par une question, comme Socrate.

---

## 1. Conte — « Awa et la tontine du quartier »
**Fichier :** `conte-tontine.mp3` · **Notion :** boucles « répéter » · **Durée visée :** 3 min 30

*Musique douce, puis voix chaleureuse.*

Bonjour à toi ! Assieds-toi, je vais te raconter une histoire. [pause]

Dans un quartier animé, il y avait une jeune fille nommée Awa. Awa était sérieuse, et toutes les femmes du quartier lui faisaient confiance. Un jour, Maman Fatou lui dit :
« Awa, cette année, c'est toi la trésorière de notre tontine. »

Awa était fière… et un peu inquiète. [pause]

La tontine comptait douze membres. Chaque mois, chaque membre devait verser cinq mille francs. Le premier soir, Awa prit son cahier et écrivit :
« Maman Fatou verse cinq mille. J'ajoute cinq mille à la caisse.
Tata Aminata verse cinq mille. J'ajoute cinq mille à la caisse.
Madame Koné verse cinq mille. J'ajoute cinq mille à la caisse… »

Au bout de la cinquième ligne, Awa avait mal à la main. Au bout de la huitième, elle s'était trompée deux fois. [pause]

Son petit frère Ibrahim passa la tête par la porte :
« Awa, pourquoi tu écris toujours la même phrase ?
— Parce que tout le monde fait la même chose !
— Alors, pourquoi tu ne l'écris pas une seule fois, en disant combien de fois il faut la faire ? »

Awa s'arrêta. [pause] Elle barra toutes ses lignes et écrivit simplement :
« Mettre la caisse à zéro.
Répéter douze fois : ajouter cinq mille à la caisse.
Annoncer le total. »

Trois lignes au lieu de douze. Et plus aucune erreur. [pause]

*Changement de ton, plus direct.*

Et toi, à ton avis : pourquoi Awa met-elle la caisse à zéro **avant** de commencer ? [longue pause]
Que se passerait-il si elle oubliait ?

Dans Scratch, l'idée d'Ibrahim s'appelle une **boucle**. Le bloc orange « répéter … fois » fait la même action autant de fois que tu le décides.

Mais attention, voici une question pour toi : l'annonce du total, « dire caisse »… doit-elle se trouver **à l'intérieur** de la boucle, ou **après** ? Imagine Awa crier le total douze fois de suite… [pause]

Ton défi : va dans l'onglet Puzzle, choisis « La tontine du quartier », et aide Awa à construire son programme. Si tu bloques, demande à Socrate. À bientôt !

---

## 2. Logique — « Pourquoi l'ordre compte »
**Fichier :** `logique-ordre.mp3` · **Notion :** séquence d'instructions · **Durée visée :** 2 min 30

*Ton vif, comme une petite émission.*

Bienvenue dans « Logique avec Socrate » ! Aujourd'hui, une question toute simple : est-ce que l'ordre des choses est important ? [pause]

Imagine que tu es au marché. Tu achètes trois mangues à la vendeuse. Voici ce qui se passe normalement :
Un : tu choisis tes mangues.
Deux : tu donnes ton argent.
Trois : la vendeuse te rend la monnaie.
Quatre : tu repars avec tes mangues. [pause]

Maintenant, mélangeons. La vendeuse te rend la monnaie… avant que tu aies payé. [pause] Elle te donne de l'argent pour rien ! Ou bien : tu repars avec tes mangues… avant de les avoir choisies. Impossible ! [pause]

Ce sont exactement les mêmes actions. Mais dans le mauvais ordre, plus rien n'a de sens.

Un ordinateur, c'est comme une vendeuse très obéissante… mais qui ne réfléchit pas. Il fait **exactement** ce que tu écris, **dans l'ordre** où tu l'écris, de haut en bas. Il ne devinera jamais ce que tu voulais dire. [pause]

En informatique, on appelle ça une **séquence** : une suite d'instructions exécutées l'une après l'autre.

Dans Scratch, tes blocs s'emboîtent de haut en bas. Le bloc du haut s'exécute en premier.

Alors voici ma question : dans un programme Scratch, quel bloc doit **toujours** être tout en haut ? Celui qui donne le signal de départ… Tu sais lequel ? [longue pause]

Pense à la course à pied : avant de courir, il faut entendre… le coup de sifflet. Dans Scratch, c'est le drapeau vert.

Ton défi : la prochaine fois que ton programme fait n'importe quoi, lis tes blocs à voix haute, de haut en bas, comme une recette. Tu trouveras souvent l'erreur tout seul. À bientôt !

---

## 3. Conte — « Le téléphone qui savait dire non »
**Fichier :** `conte-credit.mp3` · **Notion :** conditions « si … sinon » · **Durée visée :** 3 min 30

*Voix de conteur.*

Il était une fois un garçon nommé Moussa, qui vivait en ville. Sa grand-mère, elle, vivait au village, loin, très loin. Chaque dimanche, Moussa l'appelait pour lui raconter sa semaine. [pause]

Un dimanche, Moussa compose le numéro. Au lieu d'entendre la voix de sa grand-mère, il entend une voix de robot :
« Votre crédit est insuffisant. Veuillez recharger votre compte. » [pause]

Moussa est déçu. Il regarde son téléphone et lui dit :
« Pourquoi tu m'empêches d'appeler ? »

Et, dans le conte, le téléphone lui répond :
« Moussa, je ne suis pas méchant. Avant chaque appel, je me pose une question. Une seule. [pause]
**Si** ton crédit est trop petit, **alors** je te préviens qu'il faut recharger.
**Sinon**, je lance l'appel et je retire le prix de l'appel de ton crédit. »

Moussa réfléchit.
« Donc tu ne fais jamais les deux choses à la fois ?
— Jamais. C'est l'une ou l'autre. Comme un carrefour : on prend à gauche, ou on prend à droite. » [pause]

Le lendemain, Moussa acheta une carte de recharge au kiosque du coin, et le dimanche suivant, sa grand-mère rit pendant tout l'appel.

*Changement de ton.*

Ce que le téléphone a expliqué à Moussa, c'est une **condition**. Dans Scratch, c'est le bloc orange « si … alors … sinon ».

Le téléphone compare deux choses : le crédit, et le prix d'un appel. Alors voici ma question : quand le crédit est **plus petit** que le prix de l'appel, quel est le bon signe ? Le signe « plus petit que », ou le signe « plus grand que » ? [longue pause]

Et une autre question : le bloc qui retire le prix de l'appel… doit-il être dans la partie « si », ou dans la partie « sinon » ? Que se passerait-il s'il était au mauvais endroit ? [pause]

Ton défi : ouvre le puzzle « Le crédit téléphonique » et apprends à ton lutin à dire non, comme le téléphone de Moussa. Bonne chance !

---

## 4. Logique — « Les variables sont des calebasses »
**Fichier :** `logique-variables.mp3` · **Notion :** variables · **Durée visée :** 2 min 30

*Ton d'émission, curieux.*

Bienvenue dans « Logique avec Socrate » ! Aujourd'hui, un mot qui fait peur mais qui est tout simple : **variable**. [pause]

Imagine une calebasse. Sur la calebasse, quelqu'un a écrit un nom avec du charbon : « eau ». [pause]

Le matin, la calebasse est vide. On va au puits et on la remplit. Dans la journée, on boit un peu, elle se vide un peu. Le soir, on la remplit à nouveau. [pause]

La calebasse reste la même. Son nom, « eau », reste le même. Mais ce qu'elle contient **change** au cours de la journée. Ça **varie**. Voilà pourquoi on l'appelle une **variable** ! [pause]

Dans un programme, une variable, c'est pareil : une boîte avec un nom, qui garde une valeur. Un score dans un jeu. Le crédit d'un téléphone. L'argent d'une tontine.

Dans Scratch, les blocs de variables sont oranges. Il y en a deux importants, et ils ne font pas du tout la même chose :
« **mettre** … à » : on vide la calebasse et on y met une nouvelle valeur.
« **ajouter** … à » : on garde ce qu'il y a déjà, et on en rajoute. [pause]

Alors, une question pour toi : si ma calebasse « score » contient dix, et que j'utilise « mettre score à 5 »… combien y a-t-il dedans ? [longue pause] Et si, à la place, j'utilise « ajouter 5 à score » ? [longue pause]

Encore une question, plus difficile : comment fait-on pour **enlever** quelque chose avec le bloc « ajouter » ? Un indice : pense au crédit de téléphone qui diminue à chaque appel… [pause]

Ton défi : trouve, dans les puzzles, chaque fois qu'un bloc « mettre » et un bloc « ajouter » sont utilisés, et explique à Socrate pourquoi on a choisi l'un plutôt que l'autre. À bientôt !

---

## 5. Conte — « Le champ des huit rangs »
**Fichier :** `conte-arrosage.mp3` · **Notion :** boucle « répéter jusqu'à » · **Durée visée :** 3 min 30

*Voix posée, sons de nature possibles en fond.*

Au bord du fleuve, le vieux Koffi cultivait un champ de gombo. Le champ avait huit rangs, bien droits, l'un à côté de l'autre. [pause]

Chaque soir, quand le soleil devenait moins fort, Koffi prenait son arrosoir. Il arrosait un rang. Puis il avançait jusqu'au rang suivant. Il arrosait. Il avançait. [pause]

Un soir, sa petite-fille Esi vint l'aider.
« Grand-père, comment tu sais quand tu dois t'arrêter ?
— Je compte, ma fille. À chaque rang arrosé, je fais un petit trait dans la terre avec mon bâton. »

Esi regarda les traits : un, deux, trois…
« Et quand est-ce que tu t'arrêtes ?
— Quand j'ai fait huit traits. Pas avant… et pas après. » [pause]

Esi réfléchit longtemps, puis elle dit :
« Grand-père, tu ne répètes pas huit fois. Tu répètes **jusqu'à** ce qu'il y ait huit traits ! »
Le vieux Koffi rit.
« C'est la même chose, petite futée ? Ou ce n'est pas la même chose ? »

*Changement de ton.*

Voilà la question de Koffi pour toi aussi. [pause] Dans Scratch, il existe deux boucles qui se ressemblent : « répéter 8 fois », et « répéter jusqu'à ». La deuxième ne compte pas toute seule : elle regarde une condition, et s'arrête **quand** cette condition devient vraie.

Alors, réfléchis : si Koffi oublie de faire son petit trait dans la terre après chaque rang… quand va-t-il s'arrêter d'arroser ? [longue pause]

Et le soir suivant, avant de commencer, que doit faire Koffi avec les traits de la veille ? [pause] Pense au bloc « mettre … à ».

Ton défi : ouvre le puzzle « L'arrosage du champ ». Le lutin doit avancer et compter les rangs, jusqu'au huitième. Et quand tout est fini, il annonce : « Champ arrosé ! » À toi de jouer !

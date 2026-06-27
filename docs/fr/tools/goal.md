---
doc-schema-version: 1
read_when:
    - Vous voulez qu’OpenClaw garde un objectif visible tout au long d’une longue session
    - Vous devez suspendre, reprendre, bloquer, terminer ou effacer un objectif de session
    - Vous voulez comprendre les outils get_goal, create_goal et update_goal
    - Vous voulez voir comment les objectifs apparaissent dans le TUI
summary: 'Objectifs de session : objectifs durables par session, contrôles /goal, outils d’objectif du modèle, budgets de jetons et statut TUI'
title: Objectif
x-i18n:
    generated_at: "2026-06-27T18:18:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4313983dff7f37496f6c996303cace75f6863a71c8a9cd5367fdafbcc3f459c4
    source_path: tools/goal.md
    workflow: 16
---

# Objectif

Un **objectif** est un objectif durable attaché à la session OpenClaw actuelle.
Il donne à l’agent et à l’opérateur une cible commune pour le travail de longue durée,
sans transformer cette cible en tâche d’arrière-plan, rappel, tâche Cron ou
instruction permanente.

Les objectifs sont un état de session. Ils suivent la clé de session, survivent aux
redémarrages de processus, apparaissent dans `/goal`, sont disponibles pour le modèle
via les outils d’objectif et apparaissent dans le pied de page du TUI lorsque la session active en possède un.

## Démarrage rapide

Définir un objectif :

```text
/goal start get CI green for PR 87469 and push the fix
```

Le vérifier :

```text
/goal
```

Le mettre en pause lorsque le travail est volontairement en attente :

```text
/goal pause waiting for CI
```

Le reprendre :

```text
/goal resume
```

Le marquer comme terminé :

```text
/goal complete pushed and verified
```

L’effacer :

```text
/goal clear
```

## À quoi servent les objectifs

Utilisez un objectif lorsqu’une session a un résultat concret qui doit rester visible
pendant de nombreux tours :

- Finalisation d’une PR : corriger, vérifier, lancer l’autoreview, pousser, puis ouvrir ou mettre à jour la PR.
- Session de débogage : reproduire le bug, identifier la surface propriétaire, appliquer un correctif et prouver
  la correction.
- Passage sur la documentation : lire la documentation pertinente, écrire la nouvelle page, ajouter les liens croisés et
  vérifier la compilation de la documentation.
- Tâche de maintenance : inspecter l’état actuel, effectuer des modifications limitées, exécuter les bons
  contrôles et signaler ce qui a changé.

Un objectif n’est pas une file de tâches. Utilisez [TaskFlow](/fr/automation/taskflow),
les [tâches](/fr/automation/tasks), les [tâches Cron](/fr/automation/cron-jobs) ou
les [instructions permanentes](/fr/automation/standing-orders) lorsque le travail doit s’exécuter de façon détachée,
se répéter selon un calendrier, se déployer en sous-travaux gérés ou persister comme politique.

## Référence des commandes

`/goal` sans arguments affiche le résumé de l’objectif actuel :

```text
Goal
Status: active
Objective: get CI green for PR 87469 and push the fix
Tokens used: 12k
Token budget: 12k/50k

Commands: /goal pause, /goal complete, /goal clear
```

Commandes :

- `/goal` ou `/goal status` affiche l’objectif actuel.
- `/goal start <objective>` crée un nouvel objectif pour la session actuelle.
- `/goal set <objective>` et `/goal create <objective>` sont des alias de
  `start`.
- `/goal pause [note]` met en pause un objectif actif.
- `/goal resume [note]` reprend un objectif en pause, bloqué, limité par l’usage ou
  limité par le budget.
- `/goal complete [note]` marque l’objectif comme atteint.
- `/goal done [note]` est un alias de `complete`.
- `/goal block [note]` marque l’objectif comme bloqué.
- `/goal blocked [note]` est un alias de `block`.
- `/goal clear` supprime l’objectif de la session.

Une session ne peut avoir qu’un seul objectif à la fois. Le démarrage d’un second objectif échoue
tant que l’objectif actuel n’est pas effacé.

## Statuts

Les objectifs utilisent un petit ensemble de statuts :

- `active` : la session poursuit l’objectif.
- `paused` : l’opérateur a mis l’objectif en pause ; `/goal resume` le rend à nouveau actif.
- `blocked` : l’agent ou l’opérateur a signalé un vrai blocage ; `/goal resume`
  le rend à nouveau actif lorsque de nouvelles informations ou un nouvel état sont disponibles.
- `budget_limited` : le budget de tokens configuré a été atteint ; `/goal resume`
  relance la poursuite du même objectif.
- `usage_limited` : réservé aux états d’arrêt liés aux limites d’usage ; `/goal resume`
  relance la poursuite lorsque c’est autorisé.
- `complete` : l’objectif a été atteint. Les objectifs terminés sont terminaux ; utilisez
  `/goal clear` avant de démarrer un autre objectif.

`/new` et `/reset` effacent l’objectif de session actuel, car ils démarrent volontairement
un nouveau contexte de session.

## Budgets de tokens

Les objectifs peuvent avoir un budget de tokens positif facultatif. Le budget est stocké avec
l’objectif et mesuré à partir du nouveau nombre de tokens de la session au moment de la création. Si la
session actuelle ne dispose que d’une utilisation de tokens obsolète ou inconnue au démarrage de l’objectif,
OpenClaw attend le prochain instantané frais des tokens de session et l’utilise comme
référence, afin que les tokens dépensés avant l’existence de l’objectif ne soient pas imputés à l’objectif.

Lorsque l’utilisation des tokens atteint le budget, l’objectif passe à `budget_limited`. Cela
ne supprime pas l’objectif et n’efface pas l’énoncé de l’objectif. Cela indique à l’opérateur et à
l’agent que l’objectif n’est plus activement poursuivi jusqu’à sa reprise ou son
effacement.

Les budgets de tokens sont un garde-fou d’objectif de session, pas un plafond de facturation. Les quotas fournisseur,
les rapports de coût et le comportement de la fenêtre de contexte continuent d’utiliser les contrôles normaux
d’utilisation et de modèle d’OpenClaw.

## Outils de modèle

OpenClaw expose trois outils d’objectif principaux aux harnais d’agent :

- `get_goal` : lire l’objectif de session actuel, y compris le statut, l’énoncé, l’utilisation des tokens
  et le budget de tokens.
- `create_goal` : créer un objectif uniquement lorsque les instructions utilisateur, système ou développeur
  en demandent explicitement un. Échoue si la session a déjà un
  objectif.
- `update_goal` : marquer l’objectif comme `complete` ou `blocked`.

Le modèle ne peut pas mettre en pause, reprendre, effacer ou remplacer silencieusement un objectif. Ce sont
des contrôles d’opérateur/session via `/goal` et les commandes de réinitialisation. Cela empêche
l’agent de déplacer discrètement la cible tout en conservant un chemin clair pour que
l’agent signale la réussite ou un blocage réel.

L’outil `update_goal` ne doit marquer un objectif comme `complete` que lorsque l’objectif est
réellement atteint. Il ne doit marquer un objectif comme `blocked` que lorsque la même condition
bloquante s’est répétée et que l’agent ne peut pas progresser de manière significative sans
nouvelle saisie utilisateur ou changement d’état externe.

## TUI

Le TUI garde l’objectif de la session active visible dans le pied de page à côté de
l’agent, de la session, du modèle, des contrôles d’exécution et des compteurs de tokens.

Exemples de pied de page :

- `Pursuing goal (12k/50k)` pour un objectif actif avec un budget de tokens.
- `Goal paused (/goal resume)` pour un objectif en pause.
- `Goal blocked (/goal resume)` pour un objectif bloqué.
- `Goal hit usage limits (/goal resume)` pour un objectif limité par l’usage.
- `Goal unmet (50k/50k)` pour un objectif limité par le budget.
- `Goal achieved (42k)` pour un objectif terminé.

Le pied de page est volontairement compact. Utilisez `/goal` pour l’énoncé complet de l’objectif, la note,
le budget de tokens et les commandes disponibles.

## Comportement des canaux

La commande `/goal` fonctionne dans les sessions OpenClaw capables de recevoir des commandes, y compris le
TUI et les surfaces de discussion qui autorisent les commandes texte. L’état de l’objectif est attaché à la
clé de session, pas au transport. Si deux surfaces utilisent la même session, elles voient
le même objectif.

L’état de l’objectif n’est pas une directive de livraison. Il ne force pas les réponses via un
canal, ne modifie pas le comportement de la file, n’approuve pas les outils et ne planifie pas de travail.

## Dépannage

`Goal error: goal already exists` signifie que la session a déjà un objectif. Utilisez
`/goal` pour l’inspecter, `/goal complete` s’il est terminé, ou `/goal clear` avant
de démarrer un autre objectif.

`Goal error: goal not found` signifie que la session n’a pas encore d’objectif. Démarrez-en un avec
`/goal start <objective>`.

`Goal error: goal is already complete` signifie que l’objectif est terminal. Effacez-le
avant de démarrer ou de reprendre un autre objectif.

Si l’utilisation des tokens ressemble à `0` ou semble obsolète, la session active peut ne pas encore avoir
d’instantané frais des tokens. L’utilisation se rafraîchit à mesure qu’OpenClaw enregistre l’utilisation de la session et
les totaux dérivés de la transcription.

## Connexe

- [Commandes slash](/fr/tools/slash-commands)
- [TUI](/fr/web/tui)
- [Outil de session](/fr/concepts/session-tool)
- [Compaction](/fr/concepts/compaction)
- [TaskFlow](/fr/automation/taskflow)
- [Instructions permanentes](/fr/automation/standing-orders)

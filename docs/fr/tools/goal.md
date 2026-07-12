---
doc-schema-version: 1
read_when:
    - Vous souhaitez qu’OpenClaw garde un objectif visible tout au long d’une longue session
    - Vous devez mettre en pause, reprendre, bloquer, terminer ou effacer l’objectif d’une session.
    - Vous souhaitez comprendre les outils get_goal, create_goal et update_goal
    - Vous voulez voir comment les objectifs apparaissent dans la TUI
summary: 'Objectifs de session : objectifs persistants par session, commandes /goal, outils de gestion des objectifs du modèle, budgets de jetons et état de la TUI'
title: Objectif
x-i18n:
    generated_at: "2026-07-12T03:09:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 046356770522dc8a5584a59f3322b4502554a4b7f129b074da633861050ee5fd
    source_path: tools/goal.md
    workflow: 16
---

# Objectif

Un **objectif** est un résultat durable associé à la session OpenClaw actuelle.
Il fournit à l’agent et à l’opérateur une cible commune pour les travaux de longue durée,
sans transformer cette cible en tâche d’arrière-plan, rappel, tâche Cron ou
instruction permanente.

Les objectifs font partie de l’état de la session : ils suivent la clé de session, persistent
après les redémarrages du processus et apparaissent dans `/goal`, dans les outils d’objectif
accessibles au modèle et dans le pied de page de la TUI.

## Démarrage rapide

```text
/goal start get CI green for PR 87469 and push the fix
/goal
/goal edit get CI green for PR 87469, push the fix, and update docs
/goal pause waiting for CI
/goal resume
/goal complete pushed and verified
/goal clear
```

`start` est facultatif : `/goal get CI green for PR 87469` crée également un objectif,
car tout texte placé après `/goal` qui n’est pas un mot d’action connu est traité comme un
nouvel objectif.

## Utilité des objectifs

Utilisez un objectif lorsqu’une session vise un résultat concret qui doit rester visible
pendant de nombreux échanges :

- Finaliser une PR : corriger, vérifier, effectuer une revue automatique, publier les modifications et ouvrir ou mettre à jour la PR.
- Une session de débogage : reproduire le bogue, identifier la surface responsable, appliquer un correctif et
  prouver son efficacité.
- Une passe sur la documentation : lire la documentation pertinente, rédiger la nouvelle page, ajouter les liens croisés et
  vérifier la compilation de la documentation.
- Une tâche de maintenance : inspecter l’état actuel, apporter des modifications limitées, exécuter les
  vérifications appropriées et rendre compte des changements.

Un objectif n’est pas une file d’attente de tâches. Utilisez [TaskFlow](/fr/automation/taskflow),
[les tâches](/fr/automation/tasks), [les tâches Cron](/fr/automation/cron-jobs) ou
[les instructions permanentes](/fr/automation/standing-orders) lorsque le travail doit s’exécuter de manière autonome,
se répéter selon un calendrier, se décomposer en sous-travaux gérés ou persister sous forme de politique.

## Référence des commandes

`/goal` sans argument affiche le récapitulatif de l’objectif actuel :

```text
Goal
Status: active
Objective: get CI green for PR 87469 and push the fix
Tokens used: 12k
Token budget: 12k/50k

Commands: /goal edit <objective>, /goal pause, /goal complete, /goal clear
```

| Commande                                            | Effet                                                                    |
| --------------------------------------------------- | ------------------------------------------------------------------------ |
| `/goal` ou `/goal status`                           | Affiche l’objectif actuel.                                               |
| `/goal start <objective>`                           | Crée un nouvel objectif pour la session actuelle.                        |
| `/goal set <objective>`, `/goal create <objective>` | Alias de `start`.                                                        |
| `/goal <objective>`                                 | Crée également un nouvel objectif pour tout texte qui n’est pas un mot d’action reconnu. |
| `/goal edit <objective>`                            | Reformule l’objectif actuel ; son statut et le décompte des jetons restent inchangés. |
| `/goal pause [note]`                                | Met en pause un objectif actif.                                          |
| `/goal resume [note]`                               | Reprend un objectif en pause, bloqué ou limité par l’utilisation ou le budget. |
| `/goal complete [note]`                             | Marque l’objectif comme atteint.                                         |
| `/goal done [note]`                                 | Alias de `complete`.                                                     |
| `/goal block [note]`                                | Marque l’objectif comme bloqué.                                          |
| `/goal blocked [note]`                              | Alias de `block`.                                                        |
| `/goal clear`                                       | Supprime l’objectif de la session.                                       |

Une session ne peut contenir qu’un seul objectif à la fois. La création d’un second objectif échoue
avec `Goal error: goal already exists` tant que l’objectif actuel n’a pas été supprimé.

`/goal start` n’accepte pas d’option de budget de jetons ; un budget ne peut être défini
qu’au moyen de l’outil `create_goal` accessible au modèle.

## Statuts

- `active` : la session poursuit l’objectif.
- `paused` : l’opérateur a mis l’objectif en pause ; `/goal resume` le réactive.
- `blocked` : l’agent ou l’opérateur a signalé un blocage réel ; `/goal resume`
  réactive l’objectif lorsque de nouvelles informations ou un nouvel état sont disponibles.
- `budget_limited` : le budget de jetons configuré a été atteint ; `/goal resume`
  reprend la poursuite du même objectif avec une nouvelle fenêtre budgétaire.
- `usage_limited` : réservé à un futur état d’arrêt dû à une limite d’utilisation ; `/goal
resume` reprend la poursuite de la même manière.
- `complete` : l’objectif a été atteint. Les objectifs terminés sont définitifs ; utilisez `/goal
clear` avant d’en créer un autre.

`/new` et `/reset` suppriment l’objectif de la session actuelle, car ces commandes
créent intentionnellement un nouveau contexte de session.

## Budgets de jetons

Les objectifs peuvent disposer d’un budget facultatif de jetons strictement positif, défini au moyen du
paramètre `token_budget` de l’outil `create_goal`. Le budget est mesuré à partir du
nombre de jetons actualisé de la session au moment de la création de l’objectif. Si la session ne dispose que d’un
instantané de jetons obsolète ou inconnu au démarrage de l’objectif, OpenClaw attend le
prochain instantané actualisé et l’utilise comme référence, afin que les jetons consommés avant
la création de l’objectif ne lui soient pas imputés.

Lorsque l’utilisation atteint le budget, l’objectif passe à l’état `budget_limited`. Cela ne
supprime pas l’objectif ni son énoncé ; cet état indique à l’opérateur et à
l’agent que l’objectif n’est plus activement poursuivi jusqu’à sa reprise ou sa
suppression. La reprise ouvre une nouvelle fenêtre budgétaire à partir du nombre actuel et actualisé de
jetons.

Les budgets de jetons constituent un garde-fou pour l’objectif de la session, et non un plafond de facturation. Les quotas du
fournisseur, les rapports de coûts et le comportement de la fenêtre de contexte continuent d’utiliser les mécanismes normaux
de contrôle de l’utilisation et du modèle d’OpenClaw.

## Outils du modèle

OpenClaw expose trois outils d’objectif aux environnements d’agents :

| Outil         | Fonction                                                                                                                 |
| ------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `get_goal`    | Lit l’objectif de la session actuelle : statut, énoncé, utilisation des jetons et budget de jetons.                     |
| `create_goal` | Crée un objectif uniquement lorsque les instructions de l’utilisateur ou du système le demandent explicitement. Échoue si la session possède déjà un objectif. |
| `update_goal` | Marque l’objectif comme `complete` ou `blocked`.                                                                         |

Le modèle ne peut pas mettre en pause, reprendre, supprimer ou remplacer silencieusement un objectif. Ces opérations restent
des commandes de l’opérateur ou de la session accessibles au moyen de `/goal` et des commandes de réinitialisation, afin que l’agent
puisse signaler la réussite ou un blocage réel sans modifier discrètement la
cible.

`update_goal` ne doit marquer un objectif comme `complete` que lorsque celui-ci est
réellement atteint. Il ne doit marquer un objectif comme `blocked` qu’après la réapparition de la même
condition de blocage pendant au moins trois échanges consécutifs liés à l’objectif, et non en cas de
difficulté ordinaire ou de finitions manquantes.

## Contexte de l’objectif à chaque échange

Chaque échange utilisateur ou conversationnel associé à un objectif actif comprend cette ligne de contexte avec le rôle utilisateur :

```text
Active goal: <objective> — advance it or update its status (get_goal/update_goal).
```

OpenClaw conserve une ligne compacte en tronquant les objectifs trop longs. Les objectifs en pause,
bloqués, limités par le budget, limités par l’utilisation ou terminés ne sont pas injectés,
de sorte qu’un arrêt demandé par l’opérateur reste effectif jusqu’à la reprise de l’objectif.

## Interface de contrôle

L’interface de contrôle web affiche l’objectif sous forme de pastille compacte au-dessus de la zone de saisie de la conversation :
une icône de statut, le libellé du statut, par exemple `Poursuite de l’objectif`, l’objectif tronqué
et un chronomètre actualisé en temps réel.

La pastille comporte des commandes intégrées :

- **Crayon** préremplit la zone de saisie avec `/goal edit <objective>` afin que
  l’objectif puisse être reformulé et envoyé.
- **Pause / reprise** alterne entre `/goal pause` et `/goal resume` selon
  le statut actuel.
- **Corbeille** envoie `/goal clear`.
- **Chevron** développe la pastille pour afficher l’objectif complet, la dernière note de statut,
  l’utilisation des jetons et le temps écoulé.

Les boutons d’action sont masqués lorsque la zone de saisie ne peut pas envoyer de message, par exemple
lorsque la connexion au Gateway est interrompue ; le chevron de développement reste fonctionnel.

## TUI

Le pied de page de la TUI maintient l’objectif de la session active visible à côté des champs de l’agent,
de la session et du modèle, avant les indicateurs de jetons et de mode.

Exemples de pied de page :

- `Poursuite de l’objectif (12k/50k)` pour un objectif actif doté d’un budget de jetons.
- `Objectif en pause (/goal resume)` pour un objectif en pause.
- `Objectif bloqué (/goal resume)` pour un objectif bloqué.
- `Limites d’utilisation de l’objectif atteintes (/goal resume)` pour un objectif limité par l’utilisation.
- `Objectif non atteint (50k/50k)` pour un objectif limité par le budget.
- `Objectif atteint (42k)` pour un objectif terminé.

Le pied de page est volontairement compact. Utilisez `/goal` pour afficher l’objectif complet,
la note, le budget de jetons et les commandes disponibles.

## Comportement dans les canaux

`/goal` fonctionne dans les sessions OpenClaw prenant en charge les commandes, notamment la TUI et
les interfaces de conversation qui autorisent les commandes textuelles. L’état de l’objectif est associé à la
clé de session, et non au transport ; deux interfaces partageant une même clé de session voient donc le
même objectif.

L’état de l’objectif n’est pas une directive de livraison : il ne force pas les réponses à passer par un
canal, ne modifie pas le comportement de la file d’attente, n’approuve pas les outils et ne planifie pas le travail.

## Résolution des problèmes

| Message                                | Signification                                                                                                                                |
| -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `Goal error: goal already exists`      | La session possède déjà un objectif. Utilisez `/goal` pour l’examiner, `/goal complete` s’il est atteint ou `/goal clear` avant de définir un autre objectif. |
| `Goal error: goal not found`           | La session ne possède pas encore d’objectif. Créez-en un avec `/goal start <objective>`.                                                     |
| `Goal error: goal is already complete` | L’objectif est définitif. Supprimez-le avant de créer ou de reprendre un autre objectif.                                                      |

Si l’utilisation des jetons affiche `0` ou semble obsolète, il est possible que la session active ne dispose pas encore d’un
instantané actualisé des jetons. L’utilisation est actualisée à mesure qu’OpenClaw enregistre l’utilisation de la session
et les totaux dérivés de la transcription.

## Voir aussi

- [Commandes obliques](/fr/tools/slash-commands)
- [TUI](/fr/web/tui)
- [Outil de session](/fr/concepts/session-tool)
- [Compaction](/fr/concepts/compaction)
- [TaskFlow](/fr/automation/taskflow)
- [Instructions permanentes](/fr/automation/standing-orders)

---
doc-schema-version: 1
read_when:
    - Vous souhaitez qu’OpenClaw garde un objectif visible tout au long d’une longue session
    - Vous devez suspendre, reprendre, bloquer, terminer ou effacer l’objectif d’une session
    - Vous souhaitez comprendre les outils get_goal, create_goal et update_goal
    - Vous souhaitez voir comment les objectifs apparaissent dans la TUI
summary: 'Objectifs de session : objectifs durables propres à chaque session, commandes /goal, outils d’objectif du modèle, budgets de jetons et état de la TUI'
title: Objectif
x-i18n:
    generated_at: "2026-07-12T16:02:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 046356770522dc8a5584a59f3322b4502554a4b7f129b074da633861050ee5fd
    source_path: tools/goal.md
    workflow: 16
---

# Objectif

Un **objectif** est un objectif durable associé à la session OpenClaw actuelle.
Il fournit à l’agent et à l’opérateur une cible commune pour les travaux de longue durée,
sans transformer cette cible en tâche en arrière-plan, en rappel, en tâche Cron ou en
instruction permanente.

Les objectifs font partie de l’état de la session : ils suivent la clé de session, persistent
après les redémarrages de processus et apparaissent dans `/goal`, dans les outils d’objectif
exposés au modèle et dans le pied de page de la TUI.

## Démarrage rapide

```text
/goal start rendre la CI fonctionnelle pour la PR 87469 et pousser le correctif
/goal
/goal edit rendre la CI fonctionnelle pour la PR 87469, pousser le correctif et mettre à jour la documentation
/goal pause en attente de la CI
/goal resume
/goal complete correctif poussé et vérifié
/goal clear
```

`start` est facultatif : `/goal get CI green for PR 87469` crée également un objectif,
car tout texte situé après `/goal` qui n’est pas un mot d’action connu est traité comme un
nouvel objectif.

## À quoi servent les objectifs

Utilisez un objectif lorsqu’une session vise un résultat concret qui doit rester visible
pendant de nombreux échanges :

- La finalisation d’une PR : corriger, vérifier, effectuer l’autoreview, pousser et ouvrir ou mettre à jour la PR.
- Une session de débogage : reproduire le bug, identifier la surface responsable, appliquer un correctif et
  prouver que le problème est résolu.
- Une passe sur la documentation : lire la documentation pertinente, rédiger la nouvelle page, ajouter les liens croisés et
  vérifier la compilation de la documentation.
- Une tâche de maintenance : inspecter l’état actuel, apporter des modifications limitées, exécuter les
  vérifications appropriées et indiquer ce qui a changé.

Un objectif n’est pas une file d’attente de tâches. Utilisez [TaskFlow](/fr/automation/taskflow),
[les tâches](/fr/automation/tasks), [les tâches Cron](/fr/automation/cron-jobs) ou
[les ordres permanents](/fr/automation/standing-orders) lorsque le travail doit s’exécuter de manière détachée,
se répéter selon un calendrier, être réparti en sous-tâches gérées ou persister sous forme de politique.

## Référence des commandes

`/goal` sans argument affiche le résumé de l’objectif actuel :

```text
Objectif
Statut : actif
Objectif : obtenir une CI réussie pour la PR 87469 et pousser le correctif
Jetons utilisés : 12k
Budget de jetons : 12k/50k

Commandes : /goal edit <objective>, /goal pause, /goal complete, /goal clear
```

| Commande                                            | Effet                                                                            |
| --------------------------------------------------- | -------------------------------------------------------------------------------- |
| `/goal` ou `/goal status`                           | Affiche l’objectif actuel.                                                        |
| `/goal start <objective>`                           | Crée un nouvel objectif pour la session actuelle.                                |
| `/goal set <objective>`, `/goal create <objective>` | Alias de `start`.                                                                 |
| `/goal <objective>`                                 | Crée également un nouvel objectif (tout texte qui n’est pas un mot d’action reconnu). |
| `/goal edit <objective>`                            | Reformule l’objectif actuel ; le statut et le décompte des jetons restent inchangés. |
| `/goal pause [note]`                                | Met en pause un objectif actif.                                                   |
| `/goal resume [note]`                               | Reprend un objectif en pause, bloqué, limité par l’utilisation ou par le budget. |
| `/goal complete [note]`                             | Marque l’objectif comme atteint.                                                  |
| `/goal done [note]`                                 | Alias de `complete`.                                                              |
| `/goal block [note]`                                | Marque l’objectif comme bloqué.                                                   |
| `/goal blocked [note]`                              | Alias de `block`.                                                                 |
| `/goal clear`                                       | Supprime l’objectif de la session.                                                |

Une session ne peut avoir qu’un seul objectif à la fois. Le démarrage d’un second objectif échoue
avec `Goal error: goal already exists` tant que l’objectif actuel n’a pas été supprimé.

`/goal start` n’accepte pas d’option de budget de jetons ; un budget peut uniquement être défini
au moyen de l’outil `create_goal` destiné au modèle.

## Statuts

- `active` : la session poursuit l’objectif.
- `paused` : l’opérateur a mis l’objectif en pause ; `/goal resume` le rend de nouveau actif.
- `blocked` : l’agent ou l’opérateur a signalé un véritable blocage ; `/goal resume`
  le rend de nouveau actif lorsque de nouvelles informations ou un nouvel état sont disponibles.
- `budget_limited` : le budget de jetons configuré a été atteint ; `/goal resume`
  reprend la poursuite du même objectif avec une nouvelle fenêtre budgétaire.
- `usage_limited` : réservé à un futur état d’arrêt dû à une limite d’utilisation ; `/goal
resume` reprend la poursuite de la même manière.
- `complete` : l’objectif a été atteint. Les objectifs terminés sont définitifs ; utilisez `/goal
clear` avant de démarrer un autre objectif.

`/new` et `/reset` suppriment l’objectif actuel de la session, puisqu’ils démarrent
intentionnellement un nouveau contexte de session.

## Budgets de jetons

Les objectifs peuvent avoir un budget de jetons positif facultatif, défini au moyen du
paramètre `token_budget` de l’outil `create_goal`. Le budget est mesuré à partir du
décompte actualisé des jetons de la session au moment de la création de l’objectif. Si la session ne dispose que d’un
instantané de jetons obsolète ou inconnu au démarrage de l’objectif, OpenClaw attend
le prochain instantané actualisé et l’utilise comme référence, afin que les jetons consommés avant
la création de l’objectif ne lui soient pas imputés.

Lorsque l’utilisation atteint le budget, l’objectif passe à l’état `budget_limited`. Cela ne
supprime pas l’objectif et n’efface pas son énoncé ; cela indique à l’opérateur et à
l’agent que l’objectif n’est plus activement poursuivi jusqu’à sa reprise ou sa
suppression. La reprise démarre une nouvelle fenêtre budgétaire à partir du décompte actualisé
des jetons.

Les budgets de jetons constituent un garde-fou pour l’objectif de la session, et non un plafond de facturation. Les
quotas du fournisseur, les rapports de coûts et le comportement de la fenêtre de contexte continuent d’utiliser les
contrôles habituels d’utilisation et de modèle d’OpenClaw.

## Outils du modèle

OpenClaw expose trois outils d’objectif aux environnements d’exécution d’agents :

| Outil         | Objectif                                                                                                                                             |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `get_goal`    | Lire l’objectif de la session actuelle : statut, objectif, utilisation des jetons et budget de jetons.                                                |
| `create_goal` | Créer un objectif uniquement lorsque les instructions de l’utilisateur ou du système le demandent explicitement. Échoue si la session a déjà un objectif. |
| `update_goal` | Marquer l’objectif comme `complete` ou `blocked`.                                                                                                     |

Le modèle ne peut pas suspendre, reprendre, effacer ou remplacer silencieusement un objectif. Ces opérations restent
des contrôles de l’opérateur ou de la session via `/goal` et les commandes de réinitialisation, afin que l’agent
puisse signaler l’atteinte de l’objectif ou un véritable blocage sans déplacer discrètement la
cible.

`update_goal` ne doit marquer un objectif comme `complete` que lorsque l’objectif est
réellement atteint. Il ne doit marquer un objectif comme `blocked` qu’après la réapparition de la même
condition de blocage pendant au moins trois tours consécutifs liés à l’objectif, et non en cas de
difficulté ordinaire ou de finitions manquantes.

## Contexte de l’objectif à chaque tour

Chaque tour utilisateur/de conversation avec un objectif actif inclut cette ligne de contexte de rôle utilisateur :

```text
Objectif actif : <objective> — faites-le progresser ou mettez à jour son statut (get_goal/update_goal).
```

OpenClaw conserve une ligne compacte en tronquant les objectifs longs. Les objectifs en pause,
bloqués, limités par le budget, limités par l’utilisation ou terminés ne sont pas injectés,
de sorte qu’un arrêt par l’opérateur reste en vigueur jusqu’à la reprise de l’objectif.

## Interface de contrôle

L’interface de contrôle web affiche l’objectif sous forme de pastille compacte au-dessus de la zone de rédaction du chat :
une icône d’état, le libellé d’état (par exemple `Pursuing goal`), l’objectif
tronqué et un chronomètre affichant en direct le temps écoulé.

La pastille comporte des commandes intégrées :

- **Crayon** préremplit la zone de saisie avec `/goal edit <objective>` afin que
  l’objectif puisse être reformulé et envoyé.
- **Pause / reprise** bascule entre `/goal pause` et `/goal resume` selon
  l’état actuel.
- **Corbeille** envoie `/goal clear`.
- **Chevron** développe la pastille pour afficher l’objectif complet, la dernière note
  d’état, l’utilisation des tokens et le temps écoulé.

Les boutons d’action sont masqués lorsque la zone de saisie ne peut pas envoyer de message (par exemple
quand la connexion au Gateway est interrompue) ; le chevron de développement reste fonctionnel.

## TUI

Le pied de page de la TUI maintient visible l’objectif de la session active à côté des champs de l’agent,
de la session et du modèle, avant les indicateurs de jetons et de mode.

Exemples de pieds de page :

- `Pursuing goal (12k/50k)` pour un objectif actif avec un budget de tokens.
- `Goal paused (/goal resume)` pour un objectif en pause.
- `Goal blocked (/goal resume)` pour un objectif bloqué.
- `Goal hit usage limits (/goal resume)` pour un objectif limité par l’utilisation.
- `Goal unmet (50k/50k)` pour un objectif limité par le budget.
- `Goal achieved (42k)` pour un objectif terminé.

Le pied de page est volontairement compact. Utilisez `/goal` pour afficher l’objectif complet,
la note, le budget de tokens et les commandes disponibles.

## Comportement du canal

`/goal` fonctionne dans les sessions OpenClaw prenant en charge les commandes, notamment la TUI et
les interfaces de chat qui autorisent les commandes textuelles. L’état de l’objectif est associé à la
clé de session, et non au transport ; deux interfaces partageant une même clé de session voient donc le
même objectif.

L’état de l’objectif n’est pas une directive de livraison : il ne force pas l’envoi des réponses par un
canal, ne modifie pas le comportement de la file d’attente, n’approuve pas les outils et ne planifie pas de tâches.

## Résolution des problèmes

| Message                                | Signification                                                                                                                                              |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Goal error: goal already exists`      | La session possède déjà un objectif. Utilisez `/goal` pour l’examiner, `/goal complete` s’il est atteint, ou `/goal clear` avant de définir un autre objectif. |
| `Goal error: goal not found`           | La session ne possède pas encore d’objectif. Créez-en un avec `/goal start <objective>`.                                                                    |
| `Goal error: goal is already complete` | L’objectif est dans un état terminal. Effacez-le avant de commencer ou de reprendre un autre objectif.                                                      |

Si l’utilisation des tokens affiche `0` ou semble obsolète, il est possible que la session active ne dispose pas encore d’un
instantané récent des tokens. L’utilisation est actualisée à mesure qu’OpenClaw enregistre l’utilisation de la session
et les totaux calculés à partir de la transcription.

## Voir aussi

- [Commandes slash](/fr/tools/slash-commands)
- [TUI](/fr/web/tui)
- [Outil de session](/fr/concepts/session-tool)
- [Compaction](/fr/concepts/compaction)
- [TaskFlow](/fr/automation/taskflow)
- [Ordres permanents](/fr/automation/standing-orders)

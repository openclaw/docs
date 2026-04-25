---
read_when:
    - Modification de l’exécution ou de la concurrence des réponses automatiques
summary: Conception de la file d’attente des commandes qui sérialise les exécutions entrantes de réponse automatique
title: File d’attente des commandes
x-i18n:
    generated_at: "2026-04-25T13:45:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0c027be3e9a67f91a49c5d4d69fa8191d3e7651265a152c4723b10062b339f2a
    source_path: concepts/queue.md
    workflow: 15
---

Nous sérialisons les exécutions entrantes de réponse automatique (tous canaux) via une petite file d’attente en mémoire dans le processus afin d’éviter que plusieurs exécutions d’agent n’entrent en collision, tout en permettant un parallélisme sûr entre les sessions.

## Pourquoi

- Les exécutions de réponse automatique peuvent être coûteuses (appels LLM) et entrer en collision lorsque plusieurs messages entrants arrivent à peu d’intervalle.
- La sérialisation évite la compétition pour les ressources partagées (fichiers de session, journaux, stdin CLI) et réduit le risque de limites de débit amont.

## Fonctionnement

- Une file FIFO sensible aux lanes vide chaque lane avec un plafond de concurrence configurable (par défaut 1 pour les lanes non configurées ; `main` vaut par défaut 4, `subagent` 8).
- `runEmbeddedPiAgent` met en file d’attente par **clé de session** (lane `session:<key>`) pour garantir une seule exécution active par session.
- Chaque exécution de session est ensuite mise en file dans une **lane globale** (`main` par défaut) afin que le parallélisme global soit plafonné par `agents.defaults.maxConcurrent`.
- Lorsque la journalisation verbeuse est activée, les exécutions en file émettent un court avis si elles ont attendu plus d’environ 2 s avant de démarrer.
- Les indicateurs de saisie se déclenchent toujours immédiatement lors de la mise en file (lorsque le canal le prend en charge), donc l’expérience utilisateur ne change pas pendant que nous attendons notre tour.

## Modes de file d’attente (par canal)

Les messages entrants peuvent piloter l’exécution en cours, attendre un tour de suivi, ou faire les deux :

- `steer` : injecte immédiatement dans l’exécution en cours (annule les appels d’outil en attente après la prochaine limite d’outil). Si le streaming n’est pas activé, revient à `followup`.
- `followup` : met en file pour le prochain tour d’agent après la fin de l’exécution en cours.
- `collect` : regroupe tous les messages en file dans un **seul** tour de suivi (par défaut). Si les messages ciblent des canaux/fils différents, ils sont vidés individuellement pour préserver le routage.
- `steer-backlog` (alias `steer+backlog`) : pilote maintenant **et** conserve le message pour un tour de suivi.
- `interrupt` (hérité) : abandonne l’exécution active pour cette session, puis exécute le message le plus récent.
- `queue` (alias hérité) : identique à `steer`.

`steer-backlog` signifie que vous pouvez obtenir une réponse de suivi après l’exécution pilotée ; les
surfaces de streaming peuvent donc donner l’impression de doublons. Préférez `collect`/`steer` si vous voulez
une réponse par message entrant.
Envoyez `/queue collect` comme commande autonome (par session) ou définissez `messages.queue.byChannel.discord: "collect"`.

Valeurs par défaut (lorsqu’elles ne sont pas définies dans la configuration) :

- Toutes les surfaces → `collect`

Configurez globalement ou par canal via `messages.queue` :

```json5
{
  messages: {
    queue: {
      mode: "collect",
      debounceMs: 1000,
      cap: 20,
      drop: "summarize",
      byChannel: { discord: "collect" },
    },
  },
}
```

## Options de file d’attente

Les options s’appliquent à `followup`, `collect` et `steer-backlog` (et à `steer` lorsqu’il revient à `followup`) :

- `debounceMs` : attendre une période calme avant de démarrer un tour de suivi (évite « continue, continue »).
- `cap` : nombre maximal de messages en file par session.
- `drop` : politique de débordement (`old`, `new`, `summarize`).

`Summarize` conserve une courte liste à puces des messages supprimés et l’injecte comme prompt de suivi synthétique.
Valeurs par défaut : `debounceMs: 1000`, `cap: 20`, `drop: summarize`.

## Remplacements par session

- Envoyez `/queue <mode>` comme commande autonome pour stocker le mode pour la session en cours.
- Les options peuvent être combinées : `/queue collect debounce:2s cap:25 drop:summarize`
- `/queue default` ou `/queue reset` efface le remplacement de session.

## Portée et garanties

- S’applique aux exécutions d’agent de réponse automatique sur tous les canaux entrants qui utilisent le pipeline de réponse Gateway (WhatsApp web, Telegram, Slack, Discord, Signal, iMessage, webchat, etc.).
- La lane par défaut (`main`) est à l’échelle du processus pour les messages entrants + les Heartbeat principaux ; définissez `agents.defaults.maxConcurrent` pour autoriser plusieurs sessions en parallèle.
- D’autres lanes peuvent exister (par ex. `cron`, `subagent`) afin que les travaux en arrière-plan puissent s’exécuter en parallèle sans bloquer les réponses entrantes. Ces exécutions détachées sont suivies comme [tâches en arrière-plan](/fr/automation/tasks).
- Les lanes par session garantissent qu’une seule exécution d’agent touche une session donnée à la fois.
- Aucune dépendance externe ni thread worker en arrière-plan ; uniquement TypeScript + promesses.

## Dépannage

- Si les commandes semblent bloquées, activez les journaux verbeux et recherchez les lignes « queued for …ms » pour confirmer que la file se vide.
- Si vous avez besoin de la profondeur de file, activez les journaux verbeux et surveillez les lignes de temporisation de file.

## Lié

- [Gestion des sessions](/fr/concepts/session)
- [Politique de réessai](/fr/concepts/retry)

---
read_when:
    - Modification de l’exécution ou de la concurrence des réponses automatiques
    - Expliquer les modes /queue ou le comportement de routage des messages
summary: Modes de file d’attente des réponses automatiques, valeurs par défaut et surcharges par session
title: File d’attente des commandes
x-i18n:
    generated_at: "2026-05-06T07:20:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8f182195b740d678044a203387da6368df77ac2a6bb0eb29653bb8ea45264aaf
    source_path: concepts/queue.md
    workflow: 16
---

Nous sérialisons les exécutions de réponse automatique entrantes (tous les canaux) via une petite file d’attente dans le processus afin d’éviter les collisions entre plusieurs exécutions d’agent, tout en permettant un parallélisme sûr entre les sessions.

## Pourquoi

- Les exécutions de réponse automatique peuvent être coûteuses (appels LLM) et entrer en collision lorsque plusieurs messages entrants arrivent presque en même temps.
- La sérialisation évite la concurrence pour des ressources partagées (fichiers de session, journaux, stdin de la CLI) et réduit le risque de limites de débit en amont.

## Fonctionnement

- Une file FIFO consciente des voies vide chaque voie avec une limite de concurrence configurable (1 par défaut pour les voies non configurées ; `main` vaut 4 par défaut, `subagent` 8).
- `runEmbeddedPiAgent` met en file d’attente par **clé de session** (voie `session:<key>`) afin de garantir une seule exécution active par session.
- Chaque exécution de session est ensuite placée dans une **voie globale** (`main` par défaut) afin que le parallélisme global soit limité par `agents.defaults.maxConcurrent`.
- Lorsque la journalisation détaillée est activée, les exécutions en file émettent un court avis si elles ont attendu plus d’environ 2 s avant de démarrer.
- Les indicateurs de saisie se déclenchent toujours immédiatement à l’ajout en file (quand le canal le prend en charge), de sorte que l’expérience utilisateur reste inchangée pendant l’attente du tour.

## Valeurs par défaut

Quand rien n’est défini, toutes les surfaces de canaux entrants utilisent :

- `mode: "steer"`
- `debounceMs: 500`
- `cap: 20`
- `drop: "summarize"`

`steer` est la valeur par défaut, car elle maintient le tour du modèle actif réactif sans
démarrer une seconde exécution de session. Elle vide tous les messages de pilotage arrivés
avant la frontière suivante du modèle. Si l’exécution actuelle ne peut pas accepter de pilotage,
OpenClaw revient à une entrée de file de suivi.

## Modes de file

Les messages entrants peuvent piloter l’exécution actuelle, attendre un tour de suivi, ou faire les deux :

- `steer` : place les messages de pilotage dans le runtime actif. Pi livre tous les messages de pilotage en attente **après la fin de l’exécution des appels d’outils du tour actuel de l’assistant**, avant l’appel LLM suivant ; Codex app-server reçoit un seul `turn/steer` groupé. Si l’exécution n’est pas en streaming actif ou si le pilotage est indisponible, OpenClaw revient à une entrée de file de suivi.
- `queue` (ancien) : ancien pilotage un par un. Pi livre un message de pilotage en file à chaque frontière du modèle ; Codex app-server reçoit des requêtes `turn/steer` séparées. Préférez `steer`, sauf si vous avez besoin du comportement sérialisé précédent.
- `followup` : met chaque message en file pour un tour d’agent ultérieur après la fin de l’exécution actuelle.
- `collect` : regroupe les messages en file dans un **seul** tour de suivi après la fenêtre de silence. Si les messages ciblent des canaux/fils différents, ils sont vidés individuellement pour préserver le routage.
- `steer-backlog` (aussi appelé `steer+backlog`) : pilote maintenant **et** conserve le même message pour un tour de suivi.
- `interrupt` (ancien) : abandonne l’exécution active pour cette session, puis exécute le message le plus récent.

Steer-backlog signifie que vous pouvez obtenir une réponse de suivi après l’exécution pilotée ; les
surfaces en streaming peuvent donc ressembler à des doublons. Préférez `collect`/`steer` si vous voulez
une réponse par message entrant.

Pour le minutage propre au runtime et le comportement des dépendances, consultez
[File de pilotage](/fr/concepts/queue-steering). Pour la commande explicite `/steer <message>`,
consultez [Piloter](/fr/tools/steer).

Configurez globalement ou par canal via `messages.queue` :

```json5
{
  messages: {
    queue: {
      mode: "steer",
      debounceMs: 500,
      cap: 20,
      drop: "summarize",
      byChannel: { discord: "collect" },
    },
  },
}
```

## Options de file

Les options s’appliquent à `followup`, `collect` et `steer-backlog` (ainsi qu’à `steer` ou à l’ancien `queue` lorsque le pilotage revient à un suivi) :

- `debounceMs` : fenêtre de silence avant de vider les suivis en file. Les nombres seuls sont des millisecondes ; les unités `ms`, `s`, `m`, `h` et `d` sont acceptées par les options de `/queue`.
- `cap` : nombre maximal de messages en file par session. Les valeurs inférieures à `1` sont ignorées.
- `drop: "summarize"` : valeur par défaut. Supprime les entrées en file les plus anciennes selon les besoins, conserve des résumés compacts et les injecte comme invite de suivi synthétique.
- `drop: "old"` : supprime les entrées en file les plus anciennes selon les besoins, sans conserver de résumés.
- `drop: "new"` : rejette le message le plus récent lorsque la file est déjà pleine.

Valeurs par défaut : `debounceMs: 500`, `cap: 20`, `drop: summarize`.

## Priorité

Pour la sélection du mode, OpenClaw résout :

1. Remplacement `/queue` en ligne ou stocké par session.
2. `messages.queue.byChannel.<channel>`.
3. `messages.queue.mode`.
4. Valeur par défaut `steer`.

Pour les options, les options `/queue` en ligne ou stockées l’emportent sur la configuration. Ensuite,
le debounce propre au canal (`messages.queue.debounceMsByChannel`), les valeurs par défaut de debounce du Plugin,
les options globales de `messages.queue` et les valeurs par défaut intégrées sont
appliqués. `cap` et `drop` sont des options globales/de session, pas des clés de configuration
par canal.

## Remplacements par session

- Envoyez `/queue <mode>` comme commande autonome pour stocker le mode de la session actuelle.
- Les options peuvent être combinées : `/queue collect debounce:0.5s cap:25 drop:summarize`
- `/queue default` ou `/queue reset` efface le remplacement de session.

## Portée et garanties

- S’applique aux exécutions d’agent de réponse automatique sur tous les canaux entrants qui utilisent le pipeline de réponse du Gateway (WhatsApp web, Telegram, Slack, Discord, Signal, iMessage, webchat, etc.).
- La voie par défaut (`main`) s’applique à tout le processus pour les entrées + les Heartbeats principaux ; définissez `agents.defaults.maxConcurrent` pour autoriser plusieurs sessions en parallèle.
- Des voies supplémentaires peuvent exister (par exemple `cron`, `cron-nested`, `nested`, `subagent`) afin que les tâches d’arrière-plan puissent s’exécuter en parallèle sans bloquer les réponses entrantes. Les tours d’agent cron isolés occupent un emplacement `cron` tandis que leur exécution d’agent interne utilise `cron-nested` ; les deux utilisent `cron.maxConcurrentRuns`. Les flux `nested` non cron partagés conservent leur propre comportement de voie. Ces exécutions détachées sont suivies comme des [tâches d’arrière-plan](/fr/automation/tasks).
- Les voies par session garantissent qu’une seule exécution d’agent touche une session donnée à la fois.
- Aucune dépendance externe ni thread de travail en arrière-plan ; TypeScript pur + promesses.

## Dépannage

- Si les commandes semblent bloquées, activez les journaux détaillés et recherchez les lignes "queued for ...ms" pour confirmer que la file se vide.
- Si vous avez besoin de la profondeur de file, activez les journaux détaillés et surveillez les lignes de minutage de file.
- Les exécutions Codex app-server qui acceptent un tour puis cessent d’émettre une progression sont interrompues par l’adaptateur Codex afin que la voie de session active puisse se libérer au lieu d’attendre le délai d’expiration de l’exécution externe.
- Lorsque les diagnostics sont activés, les sessions qui restent en `processing` au-delà de `diagnostics.stuckSessionWarnMs` sans réponse, outil, statut, bloc ou progression ACP observé sont classées selon l’activité actuelle. Le travail actif est journalisé comme `session.long_running` ; le travail actif sans progression récente est journalisé comme `session.stalled` ; `session.stuck` est réservé à la gestion obsolète de session sans travail actif, et seul ce chemin peut libérer la voie de session affectée afin de vider le travail en file. Les diagnostics `session.stuck` répétés appliquent un délai exponentiel tant que la session reste inchangée.

## Connexe

- [Gestion de session](/fr/concepts/session)
- [File de pilotage](/fr/concepts/queue-steering)
- [Piloter](/fr/tools/steer)
- [Politique de nouvelle tentative](/fr/concepts/retry)

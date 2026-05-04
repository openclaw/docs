---
read_when:
    - Modification de l’exécution ou de la concurrence des réponses automatiques
    - Explication des modes /queue ou du comportement d’orientation des messages
summary: Modes de file d’attente de réponse automatique, valeurs par défaut et remplacements par session
title: File d’attente des commandes
x-i18n:
    generated_at: "2026-05-04T02:23:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 085aebe7059020f027eb08bb382cce2d253ea117eed0ca77d6ffd208f295acb1
    source_path: concepts/queue.md
    workflow: 16
---

Nous sérialisons les exécutions de réponse automatique entrantes (tous les canaux) au moyen d’une petite file d’attente en processus pour éviter les collisions entre plusieurs exécutions d’agent, tout en permettant un parallélisme sûr entre les sessions.

## Pourquoi

- Les exécutions de réponse automatique peuvent être coûteuses (appels LLM) et entrer en collision lorsque plusieurs messages entrants arrivent à peu d’intervalle.
- La sérialisation évite la concurrence sur les ressources partagées (fichiers de session, journaux, stdin CLI) et réduit le risque de limites de débit en amont.

## Fonctionnement

- Une file FIFO sensible aux voies vide chaque voie avec un plafond de concurrence configurable (1 par défaut pour les voies non configurées ; la voie principale vaut 4 par défaut, celle des sous-agents 8).
- `runEmbeddedPiAgent` met en file par **clé de session** (voie `session:<key>`) afin de garantir une seule exécution active par session.
- Chaque exécution de session est ensuite placée dans une **voie globale** (`main` par défaut), de sorte que le parallélisme global soit plafonné par `agents.defaults.maxConcurrent`.
- Lorsque la journalisation détaillée est activée, les exécutions en file émettent un bref avis si elles ont attendu plus d’environ 2 s avant de démarrer.
- Les indicateurs de saisie se déclenchent toujours immédiatement lors de la mise en file (quand le canal le prend en charge), de sorte que l’expérience utilisateur reste inchangée pendant l’attente de notre tour.

## Valeurs par défaut

Lorsqu’elles ne sont pas définies, toutes les surfaces de canaux entrants utilisent :

- `mode: "steer"`
- `debounceMs: 500`
- `cap: 20`
- `drop: "summarize"`

`steer` est la valeur par défaut, car elle garde le tour du modèle actif réactif sans
démarrer une seconde exécution de session. Elle vide tous les messages de guidage arrivés
avant la prochaine frontière du modèle. Si l’exécution en cours ne peut pas accepter le guidage,
OpenClaw revient à une entrée de file de suivi.

## Modes de file

Les messages entrants peuvent guider l’exécution en cours, attendre un tour de suivi, ou faire les deux :

- `steer` : met les messages de guidage en file dans le runtime actif. Pi livre tous les messages de guidage en attente **après que le tour actuel de l’assistant a fini d’exécuter ses appels d’outils**, avant le prochain appel LLM ; le serveur d’application Codex reçoit un `turn/steer` groupé. Si l’exécution ne diffuse pas activement ou si le guidage n’est pas disponible, OpenClaw revient à une entrée de file de suivi.
- `queue` (hérité) : ancien guidage un par un. Pi livre un message de guidage en file à chaque frontière du modèle ; le serveur d’application Codex reçoit des requêtes `turn/steer` séparées. Préférez `steer`, sauf si vous avez besoin du comportement sérialisé précédent.
- `followup` : met chaque message en file pour un tour d’agent ultérieur après la fin de l’exécution en cours.
- `collect` : regroupe les messages en file en un **seul** tour de suivi après la fenêtre de silence. Si les messages ciblent différents canaux/fils, ils sont vidés individuellement afin de préserver le routage.
- `steer-backlog` (alias `steer+backlog`) : guide maintenant **et** conserve le même message pour un tour de suivi.
- `interrupt` (hérité) : abandonne l’exécution active pour cette session, puis exécute le message le plus récent.

Steer-backlog signifie que vous pouvez obtenir une réponse de suivi après l’exécution guidée, de sorte que
les surfaces de diffusion peuvent ressembler à des doublons. Préférez `collect`/`steer` si vous voulez
une réponse par message entrant.

Pour le comportement de minutage et de dépendances propre au runtime, consultez
[File de guidage](/fr/concepts/queue-steering). Pour la commande explicite `/steer <message>`,
consultez [Guider](/fr/tools/steer).

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

Les options s’appliquent à `followup`, `collect` et `steer-backlog` (ainsi qu’à `steer` ou à l’ancien `queue` lorsque le guidage revient à un suivi) :

- `debounceMs` : fenêtre de silence avant de vider les suivis en file. Les nombres seuls sont en millisecondes ; les unités `ms`, `s`, `m`, `h` et `d` sont acceptées par les options `/queue`.
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
les options globales `messages.queue` et les valeurs par défaut intégrées sont
appliqués. `cap` et `drop` sont des options globales/de session, et non des clés de configuration par canal.

## Remplacements par session

- Envoyez `/queue <mode>` comme commande autonome pour stocker le mode de la session actuelle.
- Les options peuvent être combinées : `/queue collect debounce:0.5s cap:25 drop:summarize`
- `/queue default` ou `/queue reset` efface le remplacement de session.

## Portée et garanties

- S’applique aux exécutions d’agent de réponse automatique sur tous les canaux entrants qui utilisent le pipeline de réponse du Gateway (WhatsApp web, Telegram, Slack, Discord, Signal, iMessage, webchat, etc.).
- La voie par défaut (`main`) est à l’échelle du processus pour les messages entrants et les Heartbeats principaux ; définissez `agents.defaults.maxConcurrent` pour permettre plusieurs sessions en parallèle.
- Des voies supplémentaires peuvent exister (par exemple `cron`, `cron-nested`, `nested`, `subagent`) afin que les tâches en arrière-plan puissent s’exécuter en parallèle sans bloquer les réponses entrantes. Les tours d’agent Cron isolés occupent un emplacement `cron` pendant que leur exécution d’agent interne utilise `cron-nested` ; les deux utilisent `cron.maxConcurrentRuns`. Les flux `nested` partagés non Cron conservent leur propre comportement de voie. Ces exécutions détachées sont suivies comme des [tâches d’arrière-plan](/fr/automation/tasks).
- Les voies par session garantissent qu’une seule exécution d’agent touche une session donnée à la fois.
- Aucune dépendance externe ni aucun thread worker en arrière-plan ; TypeScript pur + promesses.

## Dépannage

- Si les commandes semblent bloquées, activez les journaux détaillés et recherchez les lignes « queued for …ms » pour confirmer que la file se vide.
- Si vous avez besoin de la profondeur de file, activez les journaux détaillés et surveillez les lignes de minutage de file.
- Les exécutions du serveur d’application Codex qui acceptent un tour puis cessent d’émettre de la progression sont interrompues par l’adaptateur Codex, afin que la voie de session active puisse se libérer au lieu d’attendre l’expiration de l’exécution externe.
- Lorsque les diagnostics sont activés, les sessions qui restent en `processing` au-delà de `diagnostics.stuckSessionWarnMs` sans réponse, outil, statut, bloc ou progression ACP observés sont classées selon l’activité actuelle. Le travail actif est journalisé comme `session.long_running` ; le travail actif sans progression récente est journalisé comme `session.stalled` ; `session.stuck` est réservé à la tenue de comptabilité des sessions obsolètes sans travail actif, et seul ce chemin peut libérer la voie de session affectée afin que le travail en file s’écoule. Les diagnostics `session.stuck` répétés appliquent un délai progressif tant que la session reste inchangée.

## Liens connexes

- [Gestion des sessions](/fr/concepts/session)
- [File de guidage](/fr/concepts/queue-steering)
- [Guider](/fr/tools/steer)
- [Politique de nouvelle tentative](/fr/concepts/retry)

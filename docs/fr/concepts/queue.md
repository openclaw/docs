---
read_when:
    - Modifier l’exécution ou la concurrence des réponses automatiques
    - Explication des modes de /queue ou du comportement d’orientation des messages
summary: Modes de file d’attente de réponse automatique, valeurs par défaut et remplacements par session
title: File d’attente des commandes
x-i18n:
    generated_at: "2026-04-30T07:23:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2ac0c0ded9558b080714fa4b8be0d552f985911bf19b427020f9654ae4955b2d
    source_path: concepts/queue.md
    workflow: 16
---

Nous sérialisons les exécutions de réponse automatique entrantes (tous les canaux) via une petite file d’attente en processus afin d’éviter les collisions entre plusieurs exécutions d’agent, tout en autorisant un parallélisme sûr entre les sessions.

## Pourquoi

- Les exécutions de réponse automatique peuvent être coûteuses (appels LLM) et peuvent entrer en collision lorsque plusieurs messages entrants arrivent presque en même temps.
- La sérialisation évite la concurrence sur les ressources partagées (fichiers de session, journaux, stdin de la CLI) et réduit le risque de limites de débit en amont.

## Fonctionnement

- Une file d’attente FIFO consciente des voies vide chaque voie avec une limite de concurrence configurable (1 par défaut pour les voies non configurées ; la voie principale utilise 4 par défaut, les sous-agents 8).
- `runEmbeddedPiAgent` met en file d’attente par **clé de session** (voie `session:<key>`) afin de garantir une seule exécution active par session.
- Chaque exécution de session est ensuite placée dans une **voie globale** (`main` par défaut), de sorte que le parallélisme global est limité par `agents.defaults.maxConcurrent`.
- Lorsque la journalisation détaillée est activée, les exécutions en file émettent un court avis si elles ont attendu plus d’environ 2 s avant de démarrer.
- Les indicateurs de saisie se déclenchent toujours immédiatement lors de la mise en file (lorsque le canal le prend en charge), de sorte que l’expérience utilisateur reste inchangée pendant l’attente de notre tour.

## Valeurs par défaut

Lorsqu’elles ne sont pas définies, toutes les surfaces de canaux entrants utilisent :

- `mode: "steer"`
- `debounceMs: 500`
- `cap: 20`
- `drop: "summarize"`

`steer` est la valeur par défaut, car elle garde le tour du modèle actif réactif sans
démarrer une seconde exécution de session. Elle vide tous les messages de pilotage arrivés
avant la prochaine limite du modèle. Si l’exécution actuelle ne peut pas accepter le pilotage,
OpenClaw revient à une entrée de file de suivi.

## Modes de file d’attente

Les messages entrants peuvent piloter l’exécution actuelle, attendre un tour de suivi, ou faire les deux :

- `steer` : met les messages de pilotage en file dans le runtime actif. Pi livre tous les messages de pilotage en attente **après la fin de l’exécution des appels d’outils du tour actuel de l’assistant**, avant le prochain appel LLM ; le serveur d’application Codex reçoit un `turn/steer` groupé. Si l’exécution n’est pas en diffusion active ou si le pilotage est indisponible, OpenClaw revient à une entrée de file de suivi.
- `queue` (hérité) : ancien pilotage un par un. Pi livre un message de pilotage en file à chaque limite du modèle ; le serveur d’application Codex reçoit des requêtes `turn/steer` distinctes. Préférez `steer`, sauf si vous avez besoin du comportement sérialisé précédent.
- `followup` : met chaque message en file pour un tour d’agent ultérieur après la fin de l’exécution actuelle.
- `collect` : fusionne les messages en file dans un **seul** tour de suivi après la fenêtre de silence. Si les messages ciblent des canaux/fils différents, ils sont vidés individuellement afin de préserver le routage.
- `steer-backlog` (alias `steer+backlog`) : pilote maintenant **et** conserve le même message pour un tour de suivi.
- `interrupt` (hérité) : abandonne l’exécution active pour cette session, puis exécute le message le plus récent.

Steer-backlog signifie que vous pouvez obtenir une réponse de suivi après l’exécution pilotée, donc
les surfaces de diffusion peuvent ressembler à des doublons. Préférez `collect`/`steer` si vous voulez
une réponse par message entrant.

Pour le minutage propre au runtime et le comportement des dépendances, consultez
[File d’attente de pilotage](/fr/concepts/queue-steering).

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

## Options de file d’attente

Les options s’appliquent à `followup`, `collect` et `steer-backlog` (ainsi qu’à `steer` ou à l’ancien `queue` lorsque le pilotage revient à un suivi) :

- `debounceMs` : fenêtre de silence avant de vider les suivis en file. Les nombres nus sont des millisecondes ; les unités `ms`, `s`, `m`, `h` et `d` sont acceptées par les options `/queue`.
- `cap` : nombre maximal de messages en file par session. Les valeurs inférieures à `1` sont ignorées.
- `drop: "summarize"` : valeur par défaut. Supprime les entrées les plus anciennes en file selon les besoins, conserve des résumés compacts et les injecte comme invite de suivi synthétique.
- `drop: "old"` : supprime les entrées les plus anciennes en file selon les besoins, sans conserver de résumés.
- `drop: "new"` : rejette le message le plus récent lorsque la file est déjà pleine.

Valeurs par défaut : `debounceMs: 500`, `cap: 20`, `drop: summarize`.

## Précédence

Pour la sélection du mode, OpenClaw résout :

1. Remplacement `/queue` par session, en ligne ou stocké.
2. `messages.queue.byChannel.<channel>`.
3. `messages.queue.mode`.
4. Valeur par défaut `steer`.

Pour les options, les options `/queue` en ligne ou stockées l’emportent sur la configuration. Ensuite,
le debounce propre au canal (`messages.queue.debounceMsByChannel`), les valeurs par défaut de debounce du Plugin,
les options globales `messages.queue` et les valeurs par défaut intégrées sont
appliqués. `cap` et `drop` sont des options globales/de session, pas des clés
de configuration par canal.

## Remplacements par session

- Envoyez `/queue <mode>` comme commande autonome pour stocker le mode de la session actuelle.
- Les options peuvent être combinées : `/queue collect debounce:0.5s cap:25 drop:summarize`
- `/queue default` ou `/queue reset` efface le remplacement de session.

## Portée et garanties

- S’applique aux exécutions d’agents de réponse automatique sur tous les canaux entrants qui utilisent le pipeline de réponse du Gateway (web WhatsApp, Telegram, Slack, Discord, Signal, iMessage, webchat, etc.).
- La voie par défaut (`main`) s’applique à tout le processus pour les messages entrants et les Heartbeat principaux ; définissez `agents.defaults.maxConcurrent` pour autoriser plusieurs sessions en parallèle.
- Des voies supplémentaires peuvent exister (par exemple `cron`, `cron-nested`, `nested`, `subagent`) afin que les tâches en arrière-plan puissent s’exécuter en parallèle sans bloquer les réponses entrantes. Les tours d’agent Cron isolés occupent un emplacement `cron` pendant que leur exécution d’agent interne utilise `cron-nested` ; les deux utilisent `cron.maxConcurrentRuns`. Les flux `nested` non Cron partagés conservent leur propre comportement de voie. Ces exécutions détachées sont suivies comme des [tâches en arrière-plan](/fr/automation/tasks).
- Les voies par session garantissent qu’une seule exécution d’agent touche une session donnée à la fois.
- Aucune dépendance externe ni thread de worker en arrière-plan ; TypeScript pur + promesses.

## Dépannage

- Si les commandes semblent bloquées, activez les journaux détaillés et recherchez les lignes « queued for …ms » pour confirmer que la file se vide.
- Si vous avez besoin de la profondeur de file, activez les journaux détaillés et surveillez les lignes de minutage de la file.
- Lorsque les diagnostics sont activés, les sessions qui restent en `processing` au-delà de `diagnostics.stuckSessionWarnMs` journalisent un avertissement de session bloquée. Les exécutions intégrées actives, les opérations de réponse actives et les tâches de voie actives restent uniquement des avertissements par défaut ; une comptabilité de démarrage périmée sans travail de session actif peut libérer la voie de session concernée afin que le travail en file se vide.

## Liens connexes

- [Gestion des sessions](/fr/concepts/session)
- [File d’attente de pilotage](/fr/concepts/queue-steering)
- [Politique de nouvelle tentative](/fr/concepts/retry)

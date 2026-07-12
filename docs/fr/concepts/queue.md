---
read_when:
    - Modification de l’exécution ou de la concurrence des réponses automatiques
    - Explication des modes `/queue` ou du comportement de pilotage des messages
summary: Modes de file d’attente des réponses automatiques, valeurs par défaut et remplacements par session
title: File de commandes
x-i18n:
    generated_at: "2026-07-12T15:14:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 309d149545aaba91d2248dd6354d82e3cb7ddd489817a5f84acbb0269a0815ec
    source_path: concepts/queue.md
    workflow: 16
---

OpenClaw sérialise les exécutions de réponse automatique entrantes (tous canaux confondus) au moyen d’une petite file d’attente interne au processus afin d’empêcher les collisions entre plusieurs exécutions d’agent, tout en permettant un parallélisme sûr entre les sessions.

## Pourquoi

- Les exécutions de réponse automatique peuvent être coûteuses (appels au LLM) et entrer en collision lorsque plusieurs messages entrants arrivent presque simultanément.
- La sérialisation évite la concurrence pour les ressources partagées (fichiers de session, journaux, entrée standard de la CLI) et réduit le risque d’atteindre les limites de débit en amont.

## Fonctionnement

- Une file FIFO tenant compte des voies traite chaque voie avec une limite de concurrence configurable (1 par défaut pour les voies non configurées ; `main` utilise par défaut 4 et `subagent` 8).
- `runEmbeddedAgent` place les exécutions en file selon la **clé de session** (voie `session:<key>`) afin de garantir une seule exécution active par session.
- Chaque exécution de session est ensuite placée dans une **voie globale** (`main` par défaut), de sorte que le parallélisme global soit limité par `agents.defaults.maxConcurrent`.
- Lorsque la journalisation détaillée est activée, les exécutions en file émettent un bref avis si elles ont attendu plus de ~2s avant de démarrer.
- Les indicateurs de saisie se déclenchent toujours immédiatement lors de la mise en file (si le canal les prend en charge), de sorte que l’expérience utilisateur reste inchangée pendant que l’exécution attend son tour.

## Valeurs par défaut

Lorsque rien n’est défini, toutes les surfaces de canaux entrants utilisent :

- `mode: "steer"`
- `debounceMs: 500`
- `cap: 20`
- `drop: "summarize"`

Le pilotage au sein du même tour est utilisé par défaut. Une invite qui arrive pendant une exécution est injectée dans le runtime actif lorsque celui-ci peut accepter le pilotage, de sorte qu’aucune seconde exécution de session ne démarre. Si l’exécution active ne peut pas accepter le pilotage, OpenClaw attend qu’elle se termine avant de démarrer l’invite.

## Modes de la file d’attente

`/queue` contrôle le traitement des messages entrants normaux lorsqu’une session possède déjà une exécution active :

- `steer` : injecte les messages dans le runtime actif. OpenClaw transmet tous les messages de pilotage en attente **après que le tour actuel de l’assistant a fini d’exécuter ses appels d’outils**, avant l’appel suivant au LLM ; le serveur d’application Codex reçoit un seul `turn/steer` groupé. Si l’exécution ne diffuse pas activement de contenu ou si le pilotage n’est pas disponible, OpenClaw attend la fin de l’exécution active avant de démarrer l’invite.
- `followup` : ne pilote pas l’exécution. Place chaque message en file pour un tour d’agent ultérieur après la fin de l’exécution actuelle.
- `collect` : ne pilote pas l’exécution. Regroupe les messages en file dans un **seul** tour de suivi après la fenêtre de silence. Si les messages ciblent différents canaux ou fils de discussion, ils sont traités individuellement afin de préserver le routage.
- `interrupt` : interrompt l’exécution active de cette session, puis exécute le message le plus récent.

Pour les temporisations et le comportement des dépendances propres au runtime, consultez [File de pilotage](/fr/concepts/queue-steering). Pour la commande explicite `/steer <message>`, consultez [Piloter](/fr/tools/steer).

Configurez ce comportement globalement ou par canal via `messages.queue` :

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

## Options de la file d’attente

Les options s’appliquent à la transmission des éléments en file. `debounceMs` définit également la fenêtre de silence du pilotage Codex en mode `steer` :

- `debounceMs` : fenêtre de silence avant de traiter les suivis en file ou les lots collectés ; en mode Codex `steer`, fenêtre de silence avant l’envoi d’un `turn/steer` groupé. Les nombres sans unité sont exprimés en millisecondes ; les unités `ms`, `s`, `m`, `h` et `d` sont acceptées par les options de `/queue`.
- `cap` : nombre maximal de messages en file par session. Les valeurs inférieures à `1` sont ignorées.
- `drop: "summarize"` (valeur par défaut) : supprime les entrées les plus anciennes de la file selon les besoins, conserve des résumés compacts et les injecte sous forme d’invite de suivi synthétique.
- `drop: "old"` : supprime les entrées les plus anciennes de la file selon les besoins, sans conserver de résumés.
- `drop: "new"` : rejette le message le plus récent lorsque la file est déjà pleine.

Valeurs par défaut : `debounceMs: 500`, `cap: 20`, `drop: summarize`.

## Pilotage et diffusion

Lorsque la diffusion du canal est définie sur `partial` ou `block`, le pilotage peut se présenter sous la forme de plusieurs courtes réponses visibles pendant que l’exécution active atteint les limites du runtime :

- `partial` : l’aperçu peut être finalisé plus tôt, puis un nouvel aperçu démarre une fois le pilotage accepté.
- `block` : des blocs de la taille d’un brouillon peuvent produire la même apparence séquentielle.
- Sans diffusion, le pilotage revient à un suivi après l’exécution active lorsque le runtime ne peut pas accepter le pilotage au sein du même tour.

`steer` n’interrompt pas les outils en cours d’exécution. Utilisez `/queue interrupt` lorsque le message le plus récent doit interrompre l’exécution actuelle.

## Priorité

Pour sélectionner le mode, OpenClaw applique l’ordre suivant :

1. Remplacement `/queue` en ligne ou enregistré pour la session.
2. `messages.queue.byChannel.<channel>`.
3. `messages.queue.mode`.
4. Valeur par défaut `steer`.

Pour les options, les options `/queue` en ligne ou enregistrées prévalent sur la configuration. S’appliquent ensuite, dans cet ordre, le délai anti-rebond propre au canal (`messages.queue.debounceMsByChannel`), les valeurs par défaut du délai anti-rebond du plugin, les options globales de `messages.queue`, puis les valeurs par défaut intégrées. `cap` et `drop` sont des options globales ou de session, et non des clés de configuration propres à chaque canal.

## Remplacements par session

- Envoyez `/queue <steer|followup|collect|interrupt>` comme commande autonome pour enregistrer le mode de la file d’attente de la session actuelle.
- Les options peuvent être combinées : `/queue collect debounce:0.5s cap:25 drop:summarize`
- `/queue default` ou `/queue reset` efface le remplacement de la session.

## Annulation des tours en file

Lorsqu’une invite reste dans la file de suivi ou de collecte (par exemple, un `chat.send` provenant d’une TUI ou d’un
chat web alors qu’un autre tour est actif), le Gateway conserve une
**identité d’annulation détenue par le Gateway** pour le `runId` de ce client jusqu’à ce que le contenu en file
soit exécuté ou supprimé. L’identité suit le contenu intégré dans un
résumé de dépassement.

- `chat.abort` avec un `runId` précis annule ce tour tant qu’il est encore
  en file, si le demandeur est autorisé (mêmes règles de propriété que pour les exécutions actives).
- `chat.abort` pour une session sans `runId` annule **d’abord les tours en file autorisés**,
  puis interrompt les exécutions actives autorisées. Cet ordre empêche le traitement de la file
  de promouvoir du travail dans une session partiellement arrêtée.
- L’effacement de toute la file de la session sans vérification par demandeur ne constitue pas la
  procédure d’arrêt pour les sessions à plusieurs propriétaires.
- Les attentes en file ne sont pas représentées comme des exécutions d’agent actives dans `sessions.list` et
  ne sont pas soumises à la sémantique de délai d’expiration des exécutions actives ; seule la phase active l’est.

Les clients (y compris la TUI) transmettent les invites reçues pendant une exécution et laissent le Gateway appliquer le
mode de la file d’attente. Échap/`/stop` utilise une interruption à l’échelle de la session afin que la perte de références locales
ne puisse pas laisser s’exécuter une invite toujours en file.

## Portée et garanties

- S’applique aux exécutions d’agent de réponse automatique sur tous les canaux entrants qui utilisent le pipeline de réponse du Gateway (WhatsApp web, Telegram, Slack, Discord, Signal, iMessage, chat web, etc.).
- La voie par défaut (`main`) s’applique à l’ensemble du processus pour les messages entrants et les Heartbeats principaux ; définissez `agents.defaults.maxConcurrent` pour autoriser l’exécution parallèle de plusieurs sessions.
- Des voies supplémentaires peuvent exister (par exemple `cron`, `cron-nested`, `nested`, `subagent`) afin que les tâches en arrière-plan puissent s’exécuter en parallèle sans bloquer les réponses entrantes. Les tours d’agent Cron isolés occupent un emplacement `cron` tandis que leur exécution interne d’agent utilise `cron-nested` ; les deux utilisent `cron.maxConcurrentRuns`. Les flux `nested` partagés hors Cron conservent leur propre comportement de voie. Ces exécutions détachées sont suivies en tant que [tâches en arrière-plan](/fr/automation/tasks).
- Les voies par session garantissent qu’une seule exécution d’agent accède à une session donnée à la fois.
- Aucune dépendance externe ni aucun thread de travail en arrière-plan ; uniquement TypeScript et des promesses.

## Dépannage

- Si les commandes semblent bloquées, activez les journaux détaillés et recherchez les lignes « queued for ...ms » pour vérifier que la file est bien traitée.
- Les exécutions du serveur d’application Codex qui acceptent un tour puis cessent d’émettre des informations de progression sont interrompues par l’adaptateur Codex afin que la voie de session active puisse être libérée au lieu d’attendre le délai d’expiration de l’exécution externe.
- Lorsque les diagnostics sont activés, les sessions qui restent dans l’état `processing` au-delà de `diagnostics.stuckSessionWarnMs` sans réponse, outil, état, bloc ou progression ACP observés sont classées selon leur activité actuelle :
  - Une activité en cours avec une progression récente est journalisée sous `session.long_running`. Les appels silencieux au modèle ayant un propriétaire restent également dans l’état `session.long_running` jusqu’à `diagnostics.stuckSessionAbortMs`, afin que les fournisseurs lents ou sans diffusion ne soient pas signalés trop tôt comme bloqués.
  - Une activité en cours sans progression récente est journalisée sous `session.stalled` ; les appels au modèle ayant un propriétaire, les appels d’outils bloqués et les exécutions intégrées bloquées passent à `session.stalled` une fois le seuil d’interruption atteint ou dépassé. Une activité obsolète du modèle ou des outils sans propriétaire n’est pas masquée comme une exécution longue.
  - `session.stuck` est réservé aux données de suivi de session obsolètes mais récupérables, y compris les sessions inactives en file présentant une activité obsolète du modèle ou des outils sans propriétaire.
  - `session.stuck` déclenche toujours une récupération susceptible de libérer la voie de la session concernée. Une classification `session.stalled` au-delà de `diagnostics.stuckSessionAbortMs` (appel d’outil bloqué, appel de modèle bloqué ou exécution intégrée bloquée) peut également déclencher une récupération par interruption active ; les deux classifications peuvent donc débloquer une file, et pas uniquement `session.stuck`.
  - Les lignes répétées d’avertissement `session.stuck` et `session.long_running` dans les journaux appliquent un délai exponentiel tant que la session reste inchangée ; les tentatives de récupération continuent néanmoins à chaque cycle de Heartbeat, indépendamment de ce délai.

## Voir aussi

- [Gestion des sessions](/fr/concepts/session)
- [File de pilotage](/fr/concepts/queue-steering)
- [Piloter](/fr/tools/steer)
- [Politique de nouvelle tentative](/fr/concepts/retry)

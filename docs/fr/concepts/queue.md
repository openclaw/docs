---
read_when:
    - Modification de l’exécution ou de la concurrence des réponses automatiques
    - Explication des modes de `/queue` ou du comportement d’orientation des messages
summary: Modes de file d’attente des réponses automatiques, valeurs par défaut et remplacements par session
title: File d’attente des commandes
x-i18n:
    generated_at: "2026-07-12T02:31:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 309d149545aaba91d2248dd6354d82e3cb7ddd489817a5f84acbb0269a0815ec
    source_path: concepts/queue.md
    workflow: 16
---

OpenClaw sérialise les exécutions de réponse automatique entrantes (tous canaux confondus) au moyen d’une petite file d’attente interne au processus afin d’empêcher les collisions entre plusieurs exécutions d’agent, tout en permettant un parallélisme sûr entre les sessions.

## Pourquoi

- Les exécutions de réponse automatique peuvent être coûteuses (appels au LLM) et entrer en collision lorsque plusieurs messages entrants arrivent à peu d’intervalle.
- La sérialisation évite la concurrence pour les ressources partagées (fichiers de session, journaux, entrée standard de la CLI) et réduit le risque d’atteindre les limites de débit des services en amont.

## Fonctionnement

- Une file FIFO tenant compte des voies traite chaque voie avec une limite de concurrence configurable (1 par défaut pour les voies non configurées ; `main` utilise 4 par défaut et `subagent`, 8).
- `runEmbeddedAgent` place les exécutions en file selon la **clé de session** (voie `session:<key>`) afin de garantir une seule exécution active par session.
- Chaque exécution de session est ensuite placée dans une **voie globale** (`main` par défaut), de sorte que le parallélisme global soit limité par `agents.defaults.maxConcurrent`.
- Lorsque la journalisation détaillée est activée, les exécutions en file émettent une brève notification si elles ont attendu plus de deux secondes environ avant de démarrer.
- Les indicateurs de saisie sont toujours déclenchés immédiatement lors de la mise en file (lorsque le canal les prend en charge), afin que l’expérience utilisateur reste inchangée pendant que l’exécution attend son tour.

## Valeurs par défaut

Lorsqu’aucune valeur n’est définie, toutes les surfaces de canaux entrants utilisent :

- `mode: "steer"`
- `debounceMs: 500`
- `cap: 20`
- `drop: "summarize"`

Le pilotage au cours du même tour est le comportement par défaut. Une invite reçue pendant une exécution est injectée dans l’environnement d’exécution actif lorsque celui-ci accepte le pilotage ; aucune seconde exécution de session n’est donc lancée. Si l’exécution active ne peut pas accepter le pilotage, OpenClaw attend qu’elle se termine avant de lancer l’invite.

## Modes de la file d’attente

`/queue` détermine le traitement des messages entrants ordinaires lorsqu’une session possède déjà une exécution active :

- `steer` : injecte les messages dans l’environnement d’exécution actif. OpenClaw transmet tous les messages de pilotage en attente **une fois que le tour actuel de l’assistant a terminé l’exécution de ses appels d’outils**, avant l’appel suivant au LLM ; le serveur d’application Codex reçoit un seul `turn/steer` groupé. Si l’exécution ne diffuse pas activement de contenu ou si le pilotage n’est pas disponible, OpenClaw attend la fin de l’exécution active avant de lancer l’invite.
- `followup` : n’effectue aucun pilotage. Place chaque message en file pour un tour d’agent ultérieur, après la fin de l’exécution actuelle.
- `collect` : n’effectue aucun pilotage. Regroupe les messages en file dans un **seul** tour de suivi après la période d’inactivité. Si les messages ciblent des canaux ou des fils différents, ils sont traités individuellement afin de préserver le routage.
- `interrupt` : interrompt l’exécution active de cette session, puis exécute le message le plus récent.

Pour connaître la temporisation propre à chaque environnement d’exécution et le comportement des dépendances, consultez [File de pilotage](/fr/concepts/queue-steering). Pour la commande explicite `/steer <message>`, consultez [Piloter](/fr/tools/steer).

Configurez ce comportement globalement ou par canal au moyen de `messages.queue` :

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

Les options s’appliquent à la transmission des éléments en file. `debounceMs` définit également la période d’inactivité du pilotage Codex en mode `steer` :

- `debounceMs` : période d’inactivité avant le traitement des suivis en file ou des lots regroupés ; en mode Codex `steer`, période d’inactivité avant l’envoi du `turn/steer` groupé. Les nombres sans unité sont exprimés en millisecondes ; les unités `ms`, `s`, `m`, `h` et `d` sont acceptées par les options de `/queue`.
- `cap` : nombre maximal de messages en file par session. Les valeurs inférieures à `1` sont ignorées.
- `drop: "summarize"` (par défaut) : supprime les éléments les plus anciens de la file selon les besoins, conserve des résumés compacts et les injecte sous forme d’invite de suivi synthétique.
- `drop: "old"` : supprime les éléments les plus anciens de la file selon les besoins, sans conserver de résumé.
- `drop: "new"` : rejette le message le plus récent lorsque la file est déjà pleine.

Valeurs par défaut : `debounceMs: 500`, `cap: 20`, `drop: summarize`.

## Pilotage et diffusion

Lorsque la diffusion du canal est définie sur `partial` ou `block`, le pilotage peut apparaître comme plusieurs courtes réponses visibles pendant que l’exécution active atteint les limites de l’environnement d’exécution :

- `partial` : l’aperçu peut être finalisé prématurément, puis un nouvel aperçu commence après l’acceptation du pilotage.
- `block` : des blocs de la taille d’un brouillon peuvent produire la même apparence séquentielle.
- Sans diffusion, le pilotage revient à un suivi après l’exécution active lorsque l’environnement d’exécution ne peut pas accepter le pilotage au cours du même tour.

`steer` n’interrompt pas les outils en cours d’exécution. Utilisez `/queue interrupt` lorsque le message le plus récent doit interrompre l’exécution actuelle.

## Ordre de priorité

Pour sélectionner le mode, OpenClaw applique l’ordre suivant :

1. Remplacement `/queue` intégré ou enregistré pour la session.
2. `messages.queue.byChannel.<channel>`.
3. `messages.queue.mode`.
4. Valeur par défaut `steer`.

Pour les options, les options `/queue` intégrées ou enregistrées prévalent sur la configuration. S’appliquent ensuite, dans cet ordre, le délai anti-rebond propre au canal (`messages.queue.debounceMsByChannel`), les valeurs par défaut anti-rebond du Plugin, les options globales de `messages.queue`, puis les valeurs par défaut intégrées. `cap` et `drop` sont des options globales ou de session, et non des clés de configuration propres à chaque canal.

## Remplacements par session

- Envoyez `/queue <steer|followup|collect|interrupt>` comme commande autonome pour enregistrer le mode de file d’attente de la session actuelle.
- Les options peuvent être combinées : `/queue collect debounce:0.5s cap:25 drop:summarize`
- `/queue default` ou `/queue reset` efface le remplacement de la session.

## Annulation des tours en file d’attente

Tant qu’une invite reste dans la file de suivi ou de regroupement (par exemple, un
`chat.send` provenant de la TUI ou du chat web alors qu’un autre tour est actif), le Gateway conserve une
**identité d’annulation appartenant au Gateway** pour le `runId` de ce client jusqu’à ce que le contenu en file
soit exécuté ou supprimé. Cette identité suit le contenu intégré dans un
résumé de dépassement de capacité.

- `chat.abort` avec un `runId` précis annule ce tour tant qu’il se trouve encore
  dans la file, si l’auteur de la requête y est autorisé (selon les mêmes règles de propriété que pour les exécutions actives).
- `chat.abort` pour une session sans `runId` annule **d’abord les tours en file autorisés**,
  puis interrompt les exécutions actives autorisées. Cet ordre empêche le traitement de la file
  de promouvoir du travail dans une session partiellement arrêtée.
- L’effacement de toute la file d’une session sans vérification de chaque auteur de requête ne constitue pas la
  procédure d’arrêt des sessions ayant plusieurs propriétaires.
- Les attentes en file ne sont pas représentées comme des exécutions d’agent actives dans `sessions.list` et
  ne possèdent pas la sémantique de délai d’expiration des exécutions actives ; seule la phase active la possède.

Les clients (y compris la TUI) transmettent les invites reçues pendant une exécution et laissent le Gateway appliquer le
mode de la file d’attente. Échap/`/stop` utilise une interruption limitée à la session afin que la perte des descripteurs locaux
ne puisse pas laisser s’exécuter une invite toujours en file.

## Portée et garanties

- S’applique aux exécutions d’agent de réponse automatique sur tous les canaux entrants qui utilisent le pipeline de réponse du Gateway (WhatsApp web, Telegram, Slack, Discord, Signal, iMessage, chat web, etc.).
- La voie par défaut (`main`) s’applique à l’ensemble du processus pour les entrées et les Heartbeat principaux ; définissez `agents.defaults.maxConcurrent` pour permettre l’exécution parallèle de plusieurs sessions.
- Des voies supplémentaires peuvent exister (par exemple `cron`, `cron-nested`, `nested`, `subagent`) afin que les tâches en arrière-plan puissent s’exécuter en parallèle sans bloquer les réponses entrantes. Les tours isolés d’agent Cron occupent un emplacement `cron`, tandis que leur exécution interne d’agent utilise `cron-nested` ; tous deux utilisent `cron.maxConcurrentRuns`. Les flux `nested` partagés hors Cron conservent leur propre comportement de voie. Ces exécutions détachées sont suivies comme des [tâches en arrière-plan](/fr/automation/tasks).
- Les voies propres aux sessions garantissent qu’une seule exécution d’agent agit sur une session donnée à la fois.
- Aucune dépendance externe ni aucun thread de travail en arrière-plan ; uniquement TypeScript et des promesses.

## Résolution des problèmes

- Si des commandes semblent bloquées, activez les journaux détaillés et recherchez les lignes « queued for ...ms » pour vérifier que la file est bien traitée.
- Les exécutions du serveur d’application Codex qui acceptent un tour puis cessent d’émettre des informations de progression sont interrompues par l’adaptateur Codex, afin que la voie de session active puisse être libérée au lieu d’attendre le délai d’expiration de l’exécution externe.
- Lorsque les diagnostics sont activés, les sessions qui restent dans l’état `processing` au-delà de `diagnostics.stuckSessionWarnMs` sans réponse, outil, état, bloc ou progression ACP observés sont classées selon leur activité actuelle :
  - Une activité en cours avec une progression récente est journalisée comme `session.long_running`. Les appels silencieux au modèle ayant un propriétaire restent également `session.long_running` jusqu’à `diagnostics.stuckSessionAbortMs`, afin que les fournisseurs lents ou sans diffusion ne soient pas signalés trop tôt comme bloqués.
  - Une activité en cours sans progression récente est journalisée comme `session.stalled` ; les appels au modèle ayant un propriétaire, les appels d’outils bloqués et les exécutions intégrées bloquées passent à `session.stalled` une fois le seuil d’interruption atteint ou dépassé. Une activité obsolète de modèle ou d’outil sans propriétaire n’est pas masquée comme une exécution longue.
  - `session.stuck` est réservé à la comptabilité obsolète et récupérable des sessions, notamment aux sessions inactives en file présentant une activité obsolète de modèle ou d’outil sans propriétaire.
  - `session.stuck` déclenche toujours une récupération susceptible de libérer la voie de session concernée. Une classification `session.stalled` au-delà de `diagnostics.stuckSessionAbortMs` (appel d’outil bloqué, appel au modèle bloqué ou exécution intégrée bloquée) peut également déclencher une récupération par interruption active ; les deux classifications peuvent donc débloquer une file, et pas seulement `session.stuck`.
  - Les lignes répétées de journal d’avertissement `session.stuck` et `session.long_running` appliquent un délai exponentiel tant que la session reste inchangée ; les tentatives de récupération continuent néanmoins de s’exécuter à chaque cycle de Heartbeat, indépendamment de ce délai.

## Rubriques connexes

- [Gestion des sessions](/fr/concepts/session)
- [File de pilotage](/fr/concepts/queue-steering)
- [Piloter](/fr/tools/steer)
- [Politique de nouvelle tentative](/fr/concepts/retry)

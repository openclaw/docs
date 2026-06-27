---
read_when:
    - Modification de l’exécution ou de la concurrence des réponses automatiques
    - Expliquer les modes /queue ou le comportement de routage des messages
summary: Modes de file d’attente de réponse automatique, valeurs par défaut et surcharges par session
title: File d’attente des commandes
x-i18n:
    generated_at: "2026-06-27T17:26:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6e518b018a85ddbc7afa3925180cc2329eb1d249316d81907ba51cfb3c692375
    source_path: concepts/queue.md
    workflow: 16
---

Nous sérialisons les exécutions de réponse automatique entrantes (tous les canaux) au moyen d’une petite file d’attente en processus afin d’éviter les collisions entre plusieurs exécutions d’agent, tout en autorisant un parallélisme sûr entre les sessions.

## Pourquoi

- Les exécutions de réponse automatique peuvent être coûteuses (appels LLM) et peuvent entrer en collision lorsque plusieurs messages entrants arrivent très rapprochés.
- La sérialisation évite la concurrence pour des ressources partagées (fichiers de session, journaux, stdin de la CLI) et réduit le risque d’atteindre les limites de débit en amont.

## Fonctionnement

- Une file d’attente FIFO tenant compte des voies vide chaque voie avec un plafond de concurrence configurable (par défaut 1 pour les voies non configurées ; `main` vaut par défaut 4, `subagent` 8).
- `runEmbeddedAgent` met en file d’attente par **clé de session** (voie `session:<key>`) afin de garantir une seule exécution active par session.
- Chaque exécution de session est ensuite placée dans une **voie globale** (`main` par défaut), de sorte que le parallélisme global soit plafonné par `agents.defaults.maxConcurrent`.
- Lorsque la journalisation détaillée est activée, les exécutions en attente émettent un court avis si elles ont attendu plus d’environ 2 s avant de démarrer.
- Les indicateurs de saisie se déclenchent toujours immédiatement lors de la mise en file (quand le canal le prend en charge), de sorte que l’expérience utilisateur reste inchangée pendant l’attente du tour.

## Valeurs par défaut

Lorsqu’elles ne sont pas définies, toutes les surfaces de canaux entrants utilisent :

- `mode: "steer"`
- `debounceMs: 500`
- `cap: 20`
- `drop: "summarize"`

Le pilotage dans le même tour est le comportement par défaut. Une invite qui arrive pendant une exécution est injectée
dans l’environnement d’exécution actif lorsque celui-ci peut accepter le pilotage, de sorte qu’aucune seconde exécution
de session n’est démarrée. Si l’exécution active ne peut pas accepter le pilotage, OpenClaw attend que
l’exécution active se termine avant de lancer l’invite.

## Modes de file d’attente

`/queue` contrôle ce que font les messages entrants normaux lorsqu’une session a déjà
une exécution active :

- `steer` : injecter les messages dans l’environnement d’exécution actif. OpenClaw livre tous les messages de pilotage en attente **après que le tour actuel de l’assistant a terminé l’exécution de ses appels d’outils**, avant le prochain appel LLM ; le `app-server` Codex reçoit un `turn/steer` groupé. Si l’exécution n’est pas en streaming actif ou si le pilotage n’est pas disponible, OpenClaw attend la fin de l’exécution active avant de lancer l’invite.
- `followup` : ne pas piloter. Mettre chaque message en file pour un tour d’agent ultérieur après la fin de l’exécution actuelle.
- `collect` : ne pas piloter. Fusionner les messages en file en un **seul** tour de suivi après la fenêtre de silence. Si les messages ciblent différents canaux/fils, ils sont vidés individuellement pour préserver le routage.
- `interrupt` : interrompre l’exécution active de cette session, puis exécuter le message le plus récent.

Pour le comportement de synchronisation et de dépendance propre à l’environnement d’exécution, consultez
[File d’attente de pilotage](/fr/concepts/queue-steering). Pour la commande explicite `/steer <message>`,
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

## Options de file d’attente

Les options s’appliquent à la livraison en file d’attente. `debounceMs` définit aussi la fenêtre
de silence du pilotage Codex en mode `steer` :

- `debounceMs` : fenêtre de silence avant de vider les suivis en file ou les lots collectés ; en mode Codex `steer`, fenêtre de silence avant l’envoi du `turn/steer` groupé. Les nombres seuls sont en millisecondes ; les unités `ms`, `s`, `m`, `h` et `d` sont acceptées par les options de `/queue`.
- `cap` : nombre maximal de messages en file par session. Les valeurs inférieures à `1` sont ignorées.
- `drop: "summarize"` : valeur par défaut. Supprimer les entrées les plus anciennes de la file si nécessaire, conserver des résumés compacts et les injecter comme invite de suivi synthétique.
- `drop: "old"` : supprimer les entrées les plus anciennes de la file si nécessaire, sans conserver de résumés.
- `drop: "new"` : rejeter le message le plus récent lorsque la file est déjà pleine.

Valeurs par défaut : `debounceMs: 500`, `cap: 20`, `drop: summarize`.

## Pilotage et streaming

Lorsque le streaming du canal est `partial` ou `block`, le pilotage peut ressembler à plusieurs
courtes réponses visibles pendant que l’exécution active atteint les limites de l’environnement d’exécution :

- `partial` : l’aperçu peut se finaliser tôt, puis un nouvel aperçu démarre après
  l’acceptation du pilotage.
- `block` : des blocs de la taille d’un brouillon peuvent créer la même apparence séquentielle.
- Sans streaming, le pilotage revient à un suivi après l’exécution active lorsque
  l’environnement d’exécution ne peut pas accepter le pilotage dans le même tour.

`steer` n’interrompt pas les outils en cours d’exécution. Utilisez `/queue interrupt` lorsque le message
le plus récent doit interrompre l’exécution actuelle.

## Précédence

Pour la sélection du mode, OpenClaw résout :

1. Remplacement `/queue` en ligne ou stocké par session.
2. `messages.queue.byChannel.<channel>`.
3. `messages.queue.mode`.
4. Valeur par défaut `steer`.

Pour les options, les options `/queue` en ligne ou stockées l’emportent sur la configuration. Ensuite,
le délai spécifique au canal (`messages.queue.debounceMsByChannel`), les valeurs par défaut de délai du Plugin,
les options globales `messages.queue` et les valeurs par défaut intégrées sont
appliqués. `cap` et `drop` sont des options globales/de session, pas des clés
de configuration par canal.

## Remplacements par session

- Envoyez `/queue <steer|followup|collect|interrupt>` comme commande autonome pour stocker le mode de file d’attente de la session actuelle.
- Les options peuvent être combinées : `/queue collect debounce:0.5s cap:25 drop:summarize`
- `/queue default` ou `/queue reset` efface le remplacement de session.

## Portée et garanties

- S’applique aux exécutions d’agent en réponse automatique sur tous les canaux entrants qui utilisent le pipeline de réponse du Gateway (web WhatsApp, Telegram, Slack, Discord, Signal, iMessage, webchat, etc.).
- La voie par défaut (`main`) s’applique à tout le processus pour les messages entrants et les Heartbeats principaux ; définissez `agents.defaults.maxConcurrent` pour autoriser plusieurs sessions en parallèle.
- Des voies supplémentaires peuvent exister (par exemple `cron`, `cron-nested`, `nested`, `subagent`) afin que les tâches d’arrière-plan puissent s’exécuter en parallèle sans bloquer les réponses entrantes. Les tours d’agent Cron isolés occupent un emplacement `cron` tandis que leur exécution interne d’agent utilise `cron-nested` ; les deux utilisent `cron.maxConcurrentRuns`. Les flux partagés non-Cron `nested` conservent leur propre comportement de voie. Ces exécutions détachées sont suivies comme des [tâches d’arrière-plan](/fr/automation/tasks).
- Les voies par session garantissent qu’une seule exécution d’agent touche une session donnée à la fois.
- Aucune dépendance externe ni aucun thread de travail en arrière-plan ; TypeScript pur + promesses.

## Dépannage

- Si les commandes semblent bloquées, activez les journaux détaillés et recherchez les lignes « queued for ...ms » pour confirmer que la file se vide.
- Si vous avez besoin de la profondeur de la file, activez les journaux détaillés et surveillez les lignes de synchronisation de file.
- Les exécutions du `app-server` Codex qui acceptent un tour puis cessent d’émettre une progression sont interrompues par l’adaptateur Codex afin que la voie de session active puisse se libérer au lieu d’attendre le délai d’expiration de l’exécution externe.
- Lorsque les diagnostics sont activés, les sessions qui restent en `processing` au-delà de `diagnostics.stuckSessionWarnMs` sans réponse, outil, statut, bloc ni progression ACP observés sont classées selon leur activité actuelle. Le travail actif est journalisé comme `session.long_running` ; les appels de modèle silencieux possédés restent aussi `session.long_running` jusqu’à `diagnostics.stuckSessionAbortMs`, de sorte que les fournisseurs lents ou sans streaming ne soient pas signalés comme bloqués trop tôt. Le travail actif sans progression récente est journalisé comme `session.stalled` ; les appels de modèle possédés passent à `session.stalled` au seuil d’abandon ou après celui-ci, et l’activité obsolète de modèle/outil sans propriétaire n’est pas masquée comme exécution longue. `session.stuck` est réservé à la comptabilité récupérable de sessions obsolètes, y compris les sessions en file inactives avec activité obsolète de modèle/outil sans propriétaire, et seul ce chemin peut libérer la voie de session affectée afin que le travail en file s’écoule. Les diagnostics répétés `session.stuck` reculent tant que la session reste inchangée.

## Liens associés

- [Gestion des sessions](/fr/concepts/session)
- [File d’attente de pilotage](/fr/concepts/queue-steering)
- [Piloter](/fr/tools/steer)
- [Politique de nouvelle tentative](/fr/concepts/retry)

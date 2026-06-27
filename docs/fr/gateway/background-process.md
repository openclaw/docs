---
read_when:
    - Ajouter ou modifier le comportement d’exécution en arrière-plan
    - Débogage des tâches exec de longue durée
summary: Exécution en arrière-plan et gestion des processus
title: Exécution en arrière-plan et outil de processus
x-i18n:
    generated_at: "2026-06-27T17:28:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5822c1e26b0144c5216ae6e59e279ccc506cf4c0a42b8cd6c386f535fe458bd3
    source_path: gateway/background-process.md
    workflow: 16
---

OpenClaw exécute les commandes shell via l’outil `exec` et conserve les tâches de longue durée en mémoire. L’outil `process` gère ces sessions en arrière-plan.

## Outil exec

Paramètres clés :

- `command` (obligatoire)
- `yieldMs` (par défaut 10000) : passage automatique en arrière-plan après ce délai
- `background` (bool) : passage immédiat en arrière-plan
- `timeout` (secondes, par défaut `tools.exec.timeoutSec`) : tue le processus après ce délai d’expiration ; définissez `timeout: 0` uniquement pour désactiver le délai d’expiration du processus exec pour cet appel
- `elevated` (bool) : exécuter hors du bac à sable si le mode élevé est activé/autorisé (`gateway` par défaut, ou `node` lorsque la cible exec est `node`)
- Besoin d’un vrai TTY ? Définissez `pty: true`.
- `workdir`, `env`

Comportement :

- Les exécutions au premier plan renvoient directement la sortie.
- Lorsqu’elle passe en arrière-plan (explicitement ou par délai d’expiration), l’outil renvoie `status: "running"` + `sessionId` et un court extrait final.
- Les exécutions en arrière-plan et `yieldMs` héritent de `tools.exec.timeoutSec`, sauf si l’appel fournit un `timeout` explicite.
- La sortie est conservée en mémoire jusqu’à ce que la session soit interrogée ou effacée.
- Si l’outil `process` n’est pas autorisé, `exec` s’exécute de manière synchrone et ignore `yieldMs`/`background`.
- Les commandes exec lancées reçoivent `OPENCLAW_SHELL=exec` pour les règles shell/profil sensibles au contexte.
- Pour un travail de longue durée qui démarre maintenant, lancez-le une seule fois et comptez sur le réveil automatique
  à la fin lorsqu’il est activé et que la commande émet une sortie ou échoue.
- Si le réveil automatique à la fin n’est pas disponible, ou si vous avez besoin d’une confirmation
  de réussite silencieuse pour une commande qui s’est terminée correctement sans sortie, utilisez `process`
  pour confirmer la fin.
- N’émulez pas de rappels ni de suivis différés avec des boucles `sleep` ou des interrogations
  répétées ; utilisez cron pour les travaux futurs.

## Pont entre processus enfants

Lorsque vous lancez des processus enfants de longue durée hors des outils exec/process (par exemple, des relances CLI ou des assistants gateway), attachez l’assistant de pont de processus enfant afin que les signaux de terminaison soient transmis et que les écouteurs soient détachés à la sortie/en cas d’erreur. Cela évite les processus orphelins sous systemd et maintient un comportement d’arrêt cohérent entre les plateformes.

Remplacements d’environnement :

- `OPENCLAW_BASH_YIELD_MS` : rendement par défaut (ms)
- `OPENCLAW_BASH_MAX_OUTPUT_CHARS` : limite de sortie en mémoire (caractères)
- `OPENCLAW_BASH_PENDING_MAX_OUTPUT_CHARS` : limite stdout/stderr en attente par flux (caractères)
- `OPENCLAW_BASH_JOB_TTL_MS` : TTL pour les sessions terminées (ms, borné à 1 m–3 h)
- `OPENCLAW_PROCESS_INPUT_WAIT_IDLE_MS` : seuil de sortie inactive avant que les sessions d’arrière-plan inscriptibles soient marquées comme attendant probablement une entrée (par défaut 15000 ms)

Configuration (préférée) :

- `tools.exec.backgroundMs` (par défaut 10000)
- `tools.exec.timeoutSec` (par défaut 1800)
- `tools.exec.cleanupMs` (par défaut 1800000)
- `tools.exec.notifyOnExit` (par défaut true) : met en file un événement système + demande un Heartbeat lorsqu’un exec en arrière-plan se termine.
- `tools.exec.notifyOnExitEmptySuccess` (par défaut false) : lorsque true, met aussi en file des événements de fin pour les exécutions en arrière-plan réussies qui n’ont produit aucune sortie.

## Outil process

Actions :

- `list` : sessions en cours + terminées
- `poll` : vider la nouvelle sortie d’une session (signale aussi l’état de sortie)
- `log` : lire la sortie agrégée et afficher les indications de récupération d’entrée (prend en charge `offset` + `limit`)
- `write` : envoyer stdin (`data`, `eof` facultatif)
- `send-keys` : envoyer des jetons de touches explicites ou des octets à une session appuyée par un PTY
- `submit` : envoyer Entrée / retour chariot à une session appuyée par un PTY
- `paste` : envoyer du texte littéral, éventuellement enveloppé en mode collage entre crochets
- `kill` : terminer une session en arrière-plan
- `clear` : retirer une session terminée de la mémoire
- `remove` : tuer si en cours d’exécution, sinon effacer si terminée

Notes :

- Seules les sessions en arrière-plan sont listées/persistées en mémoire.
- Les sessions sont perdues au redémarrage du processus (aucune persistance disque).
- Les journaux de session ne sont enregistrés dans l’historique de discussion que si vous exécutez `process poll/log` et que le résultat de l’outil est enregistré.
- `process` est limité à chaque agent ; il ne voit que les sessions démarrées par cet agent.
- Utilisez `poll` / `log` pour l’état, les journaux, la confirmation de réussite silencieuse ou
  la confirmation de fin lorsque le réveil automatique à la fin n’est pas disponible.
- Utilisez `log` avant de récupérer une CLI interactive afin que la transcription actuelle,
  l’état stdin et l’indication d’attente d’entrée soient visibles ensemble.
- Utilisez `write` / `send-keys` / `submit` / `paste` / `kill` lorsque vous avez besoin d’une entrée
  ou d’une intervention.
- `process list` inclut un `name` dérivé (verbe de commande + cible) pour des vérifications rapides.
- `process list`, `poll` et `log` signalent `waitingForInput` uniquement
  lorsque la session dispose encore d’un stdin inscriptible et est inactive depuis plus longtemps que le
  seuil d’attente d’entrée.
- `process log` utilise `offset`/`limit` par ligne.
- Lorsque `offset` et `limit` sont tous deux omis, il renvoie les 200 dernières lignes et inclut une indication de pagination.
- Lorsque `offset` est fourni et que `limit` est omis, il renvoie de `offset` jusqu’à la fin (non limité à 200).
- L’interrogation sert à obtenir un état à la demande, pas à planifier une boucle d’attente. Si le travail doit
  avoir lieu plus tard, utilisez plutôt cron.

## Exemples

Exécuter une tâche longue et l’interroger plus tard :

```json
{ "tool": "exec", "command": "sleep 5 && echo done", "yieldMs": 1000 }
```

```json
{ "tool": "process", "action": "poll", "sessionId": "<id>" }
```

Inspecter une session interactive avant d’envoyer une entrée :

```json
{ "tool": "process", "action": "log", "sessionId": "<id>" }
```

Démarrer immédiatement en arrière-plan :

```json
{ "tool": "exec", "command": "npm run build", "background": true }
```

Envoyer stdin :

```json
{ "tool": "process", "action": "write", "sessionId": "<id>", "data": "y\n" }
```

Envoyer des touches PTY :

```json
{ "tool": "process", "action": "send-keys", "sessionId": "<id>", "keys": ["C-c"] }
```

Soumettre la ligne actuelle :

```json
{ "tool": "process", "action": "submit", "sessionId": "<id>" }
```

Coller du texte littéral :

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## Connexe

- [Outil exec](/fr/tools/exec)
- [Approbations exec](/fr/tools/exec-approvals)

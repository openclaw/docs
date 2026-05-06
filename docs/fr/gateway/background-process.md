---
read_when:
    - Ajout ou modification du comportement d’exécution en arrière-plan
    - Débogage des tâches exec de longue durée
summary: Exécution d’exec en arrière-plan et gestion des processus
title: Exec en arrière-plan et outil de processus
x-i18n:
    generated_at: "2026-05-06T07:21:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7677dcb1cb28b4922a034855550696f839e64cdd349b39d09fbf2c00acf8cec1
    source_path: gateway/background-process.md
    workflow: 16
---

OpenClaw exécute les commandes shell via l’outil `exec` et conserve les tâches de longue durée en mémoire. L’outil `process` gère ces sessions en arrière-plan.

## outil exec

Paramètres clés :

- `command` (obligatoire)
- `yieldMs` (par défaut 10000) : passage automatique en arrière-plan après ce délai
- `background` (booléen) : passage immédiat en arrière-plan
- `timeout` (secondes, par défaut `tools.exec.timeoutSec`) : tue le processus après ce délai d’expiration ; définissez `timeout: 0` uniquement pour désactiver le délai d’expiration du processus exec pour cet appel
- `elevated` (booléen) : exécute hors du bac à sable si le mode élevé est activé/autorisé (`gateway` par défaut, ou `node` lorsque la cible exec est `node`)
- Besoin d’un vrai TTY ? Définissez `pty: true`.
- `workdir`, `env`

Comportement :

- Les exécutions au premier plan renvoient directement la sortie.
- Lors du passage en arrière-plan (explicite ou par délai d’expiration), l’outil renvoie `status: "running"` + `sessionId` et une courte fin de sortie.
- Les exécutions en arrière-plan et avec `yieldMs` héritent de `tools.exec.timeoutSec` sauf si l’appel fournit un `timeout` explicite.
- La sortie est conservée en mémoire jusqu’à ce que la session soit interrogée ou effacée.
- Si l’outil `process` est interdit, `exec` s’exécute de façon synchrone et ignore `yieldMs`/`background`.
- Les commandes exec lancées reçoivent `OPENCLAW_SHELL=exec` pour les règles shell/profil sensibles au contexte.
- Pour les travaux de longue durée qui démarrent maintenant, lancez-les une seule fois et reposez-vous sur le réveil automatique
  à la fin lorsqu’il est activé et que la commande émet une sortie ou échoue.
- Si le réveil automatique à la fin n’est pas disponible, ou si vous avez besoin d’une
  confirmation de réussite silencieuse pour une commande qui s’est terminée proprement sans sortie, utilisez `process`
  pour confirmer la fin.
- N’émulez pas les rappels ni les suivis différés avec des boucles `sleep` ou des interrogations
  répétées ; utilisez cron pour les travaux futurs.

## Pont de processus enfants

Lors du lancement de processus enfants de longue durée hors des outils exec/process (par exemple, relances de CLI ou assistants Gateway), attachez l’assistant de pont de processus enfant afin que les signaux de terminaison soient transférés et que les écouteurs soient détachés à la sortie/erreur. Cela évite les processus orphelins sous systemd et maintient un comportement d’arrêt cohérent entre les plateformes.

Remplacements d’environnement :

- `PI_BASH_YIELD_MS` : délai par défaut avant restitution (ms)
- `PI_BASH_MAX_OUTPUT_CHARS` : plafond de sortie en mémoire (caractères)
- `OPENCLAW_BASH_PENDING_MAX_OUTPUT_CHARS` : plafond stdout/stderr en attente par flux (caractères)
- `PI_BASH_JOB_TTL_MS` : TTL des sessions terminées (ms, borné entre 1 m et 3 h)

Configuration (préférée) :

- `tools.exec.backgroundMs` (par défaut 10000)
- `tools.exec.timeoutSec` (par défaut 1800)
- `tools.exec.cleanupMs` (par défaut 1800000)
- `tools.exec.notifyOnExit` (par défaut true) : met en file un événement système + demande un Heartbeat lorsqu’une exécution exec en arrière-plan se termine.
- `tools.exec.notifyOnExitEmptySuccess` (par défaut false) : lorsque true, met aussi en file des événements d’achèvement pour les exécutions en arrière-plan réussies qui n’ont produit aucune sortie.

## outil process

Actions :

- `list` : sessions en cours + terminées
- `poll` : draine la nouvelle sortie d’une session (signale aussi le statut de sortie)
- `log` : lit la sortie agrégée (prend en charge `offset` + `limit`)
- `write` : envoie stdin (`data`, `eof` facultatif)
- `send-keys` : envoie des jetons de touches explicites ou des octets à une session adossée à un PTY
- `submit` : envoie Entrée / retour chariot à une session adossée à un PTY
- `paste` : envoie du texte littéral, éventuellement enveloppé en mode de collage encadré
- `kill` : termine une session en arrière-plan
- `clear` : supprime de la mémoire une session terminée
- `remove` : tue si en cours, sinon efface si terminée

Notes :

- Seules les sessions passées en arrière-plan sont listées/conservées en mémoire.
- Les sessions sont perdues au redémarrage du processus (aucune persistance disque).
- Les journaux de session ne sont enregistrés dans l’historique de chat que si vous exécutez `process poll/log` et que le résultat de l’outil est enregistré.
- `process` est limité à chaque agent ; il ne voit que les sessions lancées par cet agent.
- Utilisez `poll` / `log` pour le statut, les journaux, la confirmation de réussite silencieuse ou
  la confirmation d’achèvement lorsque le réveil automatique à la fin n’est pas disponible.
- Utilisez `write` / `send-keys` / `submit` / `paste` / `kill` lorsque vous avez besoin d’une entrée
  ou d’une intervention.
- `process list` inclut un `name` dérivé (verbe de commande + cible) pour des analyses rapides.
- `process log` utilise `offset`/`limit` par lignes.
- Lorsque `offset` et `limit` sont tous deux omis, il renvoie les 200 dernières lignes et inclut une indication de pagination.
- Lorsque `offset` est fourni et que `limit` est omis, il renvoie depuis `offset` jusqu’à la fin (sans plafonnement à 200).
- L’interrogation sert au statut à la demande, pas à la planification de boucles d’attente. Si le travail doit
  se produire plus tard, utilisez plutôt cron.

## Exemples

Exécuter une tâche longue et l’interroger plus tard :

```json
{ "tool": "exec", "command": "sleep 5 && echo done", "yieldMs": 1000 }
```

```json
{ "tool": "process", "action": "poll", "sessionId": "<id>" }
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

## Associé

- [Outil exec](/fr/tools/exec)
- [Approbations exec](/fr/tools/exec-approvals)

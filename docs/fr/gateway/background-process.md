---
read_when:
    - Ajout ou modification du comportement d’exécution en arrière-plan
    - Débogage des tâches d’exécution de longue durée
summary: Exécution en arrière-plan et gestion des processus
title: Exécution en arrière-plan et outil de gestion des processus
x-i18n:
    generated_at: "2026-07-12T02:49:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b540455797df71dcdb18b0caa5f5088e81ef8823e0ec79364bebad8e6f060f12
    source_path: gateway/background-process.md
    workflow: 16
---

OpenClaw exécute les commandes shell au moyen de l’outil `exec` et conserve en mémoire les tâches de longue durée. L’outil `process` gère ces sessions en arrière-plan.

## Outil exec

Paramètres :

| Paramètre    | Description                                                                                                                                                                                                 |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `command`    | Obligatoire. Commande shell à exécuter.                                                                                                                                                                      |
| `workdir`    | Répertoire de travail ; omettez-le pour utiliser le répertoire de travail courant par défaut.                                                                                                                |
| `env`        | Variables d’environnement supplémentaires pour la commande.                                                                                                                                                  |
| `yieldMs`    | Nombre de millisecondes à attendre avant de passer la tâche en arrière-plan (valeur par défaut : 10000).                                                                                                      |
| `background` | Exécute immédiatement la tâche en arrière-plan.                                                                                                                                                              |
| `timeout`    | Délai d’expiration en secondes (valeur par défaut : `tools.exec.timeoutSec`) ; tue le processus à expiration. Définissez `timeout: 0` pour désactiver le délai d’expiration du processus exec pour cet appel. |
| `pty`        | Exécute la commande dans un pseudo-terminal lorsqu’il est disponible (CLI nécessitant un TTY, agents de codage).                                                                                             |
| `elevated`   | Exécute la commande hors du bac à sable si le mode privilégié est activé/autorisé (`gateway` par défaut, ou `node` lorsque la cible d’exécution est `node`).                                                  |
| `host`       | Cible d’exécution : `auto`, `sandbox`, `gateway` ou `node`.                                                                                                                                                  |
| `node`       | Identifiant/nom du Node, utilisé avec `host: "node"`.                                                                                                                                                        |

Comportement :

- Les exécutions au premier plan renvoient directement leur sortie.
- Lorsqu’une tâche passe en arrière-plan (explicitement ou après expiration de `yieldMs`), l’outil renvoie `status: "running"` + `sessionId` ainsi qu’un court extrait de fin de sortie.
- Les exécutions en arrière-plan et celles utilisant `yieldMs` héritent de `tools.exec.timeoutSec`, sauf si l’appel fournit explicitement un `timeout`.
- La sortie reste en mémoire jusqu’à ce que la session soit interrogée ou effacée.
- Si l’outil `process` n’est pas autorisé, `exec` s’exécute de manière synchrone et ignore `yieldMs`/`background`.
- Les commandes exec lancées reçoivent `OPENCLAW_SHELL=exec` afin de permettre des règles de shell/profil tenant compte du contexte.
- Pour une tâche de longue durée qui commence maintenant : lancez-la une seule fois et fiez-vous au réveil automatique à la fin de l’exécution (lorsqu’il est activé), dès que la commande produit une sortie ou échoue.
- Si le réveil automatique à la fin de l’exécution n’est pas disponible, ou si vous avez besoin de confirmer la réussite silencieuse d’une commande qui se termine correctement sans sortie, interrogez-la avec `process`.
- N’émulez pas des rappels ou des suivis différés au moyen de boucles `sleep` ou d’interrogations répétées — utilisez Cron pour les tâches futures.

### Remplacements par variables d’environnement

| Variable                                 | Effet                                                                                                                                                    |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_BASH_YIELD_MS`                 | Délai par défaut avant le passage en arrière-plan (ms). Valeur par défaut : 10000, limitée à la plage 10-120000.                                         |
| `OPENCLAW_BASH_MAX_OUTPUT_CHARS`         | Limite de la sortie conservée en mémoire (caractères).                                                                                                    |
| `OPENCLAW_BASH_PENDING_MAX_OUTPUT_CHARS` | Limite de la sortie stdout/stderr en attente, par flux (caractères).                                                                                      |
| `OPENCLAW_BASH_JOB_TTL_MS`               | Durée de vie des sessions terminées (ms), limitée à la plage 1 min-3 h.                                                                                   |
| `OPENCLAW_PROCESS_INPUT_WAIT_IDLE_MS`    | Seuil d’inactivité de la sortie avant que les sessions en arrière-plan acceptant les écritures soient signalées comme probablement en attente d’entrée. Valeur par défaut : 15000. |

### Configuration (à privilégier par rapport aux remplacements par variables d’environnement)

| Clé                                   | Valeur par défaut | Effet                                                                                                       |
| ------------------------------------- | ----------------- | ----------------------------------------------------------------------------------------------------------- |
| `tools.exec.backgroundMs`             | 10000             | Identique à `OPENCLAW_BASH_YIELD_MS`.                                                                       |
| `tools.exec.timeoutSec`               | 1800              | Délai d’expiration par défaut pour chaque appel.                                                             |
| `tools.exec.cleanupMs`                | 1800000           | Identique à `OPENCLAW_BASH_JOB_TTL_MS`.                                                                     |
| `tools.exec.notifyOnExit`             | true              | Ajoute un événement système à la file d’attente et demande un Heartbeat lorsqu’une exécution en arrière-plan se termine. |
| `tools.exec.notifyOnExitEmptySuccess` | false             | Ajoute également des événements de fin pour les exécutions en arrière-plan réussies ne produisant aucune sortie. |

## Pont pour les processus enfants

Lors du lancement de processus enfants de longue durée hors des outils exec/process (relancements de la CLI, assistants du Gateway), attachez l’assistant de pont pour processus enfants afin que les signaux de terminaison soient transmis et que les écouteurs soient détachés en cas de sortie ou d’erreur. Cela évite les processus orphelins sous systemd et garantit un arrêt cohérent sur toutes les plateformes.

## Outil process

Actions :

| Action      | Effet                                                                                                      |
| ----------- | ---------------------------------------------------------------------------------------------------------- |
| `list`      | Sessions en cours et terminées.                                                                            |
| `poll`      | Récupère la nouvelle sortie d’une session (indique également l’état de sortie).                             |
| `log`       | Lit la sortie agrégée et les indications de reprise des entrées. Prend en charge `offset` + `limit`.        |
| `write`     | Envoie une entrée standard (`data`, avec `eof` facultatif).                                                 |
| `send-keys` | Envoie des séquences de touches explicites ou des octets à une session reposant sur un PTY.                 |
| `submit`    | Envoie Entrée/retour chariot à une session reposant sur un PTY.                                             |
| `paste`     | Envoie du texte littéral, éventuellement encapsulé dans le mode de collage entre délimiteurs.               |
| `kill`      | Met fin à une session en arrière-plan.                                                                      |
| `clear`     | Supprime de la mémoire une session terminée.                                                                |
| `remove`    | Met fin à la session si elle est en cours, sinon l’efface si elle est terminée.                             |

Remarques :

- Seules les sessions en arrière-plan sont répertoriées et conservées — uniquement en mémoire, jamais sur disque. Les sessions sont perdues lors du redémarrage du processus.
- Une session active en arrière-plan bloque la suspension coopérative de l’hôte et le redémarrage sûr du Gateway jusqu’à ce que le propriétaire du processus confirme sa sortie effective.
- `process remove` peut masquer immédiatement une session en cours après avoir demandé sa terminaison ; la suspension et le redémarrage restent bloqués jusqu’à la confirmation de la sortie.
- Les journaux de session ne sont enregistrés dans l’historique de la discussion que si vous exécutez `process poll`/`log` et que le résultat de l’outil est enregistré.
- `process` est limité à chaque agent ; il ne voit que les sessions lancées par cet agent.
- Utilisez `poll`/`log` pour obtenir l’état, les journaux ou la confirmation de fin lorsque le réveil automatique à la fin de l’exécution n’est pas disponible.
- Utilisez `log` avant de reprendre une CLI interactive, afin de voir ensemble la transcription actuelle, l’état de l’entrée standard et l’indication d’attente d’entrée.
- Utilisez `write`/`send-keys`/`submit`/`paste`/`kill` lorsqu’une saisie ou une intervention est nécessaire.
- `process list` inclut un `name` dérivé (verbe de commande + cible) pour faciliter les consultations rapides.
- `process list`, `poll` et `log` indiquent `waitingForInput` uniquement lorsque l’entrée standard de la session accepte toujours les écritures et qu’elle est inactive depuis plus longtemps que le seuil d’attente d’entrée (15000 ms par défaut, `OPENCLAW_PROCESS_INPUT_WAIT_IDLE_MS`).
- `process log` utilise des paramètres `offset`/`limit` basés sur les lignes. Lorsque les deux sont omis, il renvoie les 200 dernières lignes avec une indication de pagination. Lorsque `offset` est défini sans `limit`, il renvoie les lignes depuis `offset` jusqu’à la fin (sans limite de 200).
- Le `timeout` de `poll` attend au maximum le nombre de millisecondes indiqué avant de renvoyer un résultat ; les valeurs supérieures à 30000 sont ramenées à 30000.
- L’interrogation sert à obtenir un état à la demande, et non à planifier des boucles d’attente. Si le travail doit être effectué ultérieurement, utilisez Cron.

## Exemples

Exécuter une tâche longue et l’interroger ultérieurement :

```json
{ "tool": "exec", "command": "sleep 5 && echo done", "yieldMs": 1000 }
```

```json
{ "tool": "process", "action": "poll", "sessionId": "<id>" }
```

Examiner une session interactive avant d’envoyer une entrée :

```json
{ "tool": "process", "action": "log", "sessionId": "<id>" }
```

Démarrer immédiatement en arrière-plan :

```json
{ "tool": "exec", "command": "npm run build", "background": true }
```

Envoyer une entrée standard :

```json
{ "tool": "process", "action": "write", "sessionId": "<id>", "data": "y\n" }
```

Envoyer des touches au PTY :

```json
{ "tool": "process", "action": "send-keys", "sessionId": "<id>", "keys": ["C-c"] }
```

Valider la ligne actuelle :

```json
{ "tool": "process", "action": "submit", "sessionId": "<id>" }
```

Coller du texte littéral :

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## Pages connexes

- [Outil exec](/fr/tools/exec)
- [Approbations exec](/fr/tools/exec-approvals)

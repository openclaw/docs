---
read_when:
    - Ajout ou modification du comportement d’exécution en arrière-plan
    - Débogage des tâches d’exécution de longue durée
summary: Exécution en arrière-plan et gestion des processus
title: Exécution en arrière-plan et outil de processus
x-i18n:
    generated_at: "2026-07-12T15:19:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: b540455797df71dcdb18b0caa5f5088e81ef8823e0ec79364bebad8e6f060f12
    source_path: gateway/background-process.md
    workflow: 16
---

OpenClaw exécute les commandes shell au moyen de l’outil `exec` et conserve les tâches de longue durée en mémoire. L’outil `process` gère ces sessions en arrière-plan.

## Outil exec

Paramètres :

| Paramètre    | Description                                                                                                                                                                                                 |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `command`    | Obligatoire. Commande shell à exécuter.                                                                                                                                                                      |
| `workdir`    | Répertoire de travail ; omettez-le pour utiliser le répertoire de travail courant par défaut.                                                                                                               |
| `env`        | Variables d’environnement supplémentaires pour la commande.                                                                                                                                                 |
| `yieldMs`    | Durée d’attente en millisecondes avant le passage en arrière-plan (valeur par défaut : 10000).                                                                                                               |
| `background` | Exécuter immédiatement en arrière-plan.                                                                                                                                                                      |
| `timeout`    | Délai d’expiration en secondes (valeur par défaut : `tools.exec.timeoutSec`) ; tue le processus à l’expiration. Définissez `timeout: 0` pour désactiver le délai d’expiration du processus exec pour cet appel. |
| `pty`        | Exécuter dans un pseudo-terminal lorsqu’il est disponible (CLI nécessitant un TTY, agents de codage).                                                                                                        |
| `elevated`   | Exécuter hors du bac à sable si le mode privilégié est activé/autorisé (`gateway` par défaut, ou `node` lorsque la cible d’exécution est `node`).                                                             |
| `host`       | Cible d’exécution : `auto`, `sandbox`, `gateway` ou `node`.                                                                                                                                                  |
| `node`       | Identifiant/nom du Node, utilisé avec `host: "node"`.                                                                                                                                                        |

Comportement :

- Les exécutions au premier plan renvoient directement la sortie.
- Lors du passage en arrière-plan (explicite ou à l’expiration de `yieldMs`), l’outil renvoie `status: "running"` + `sessionId` et un court extrait de la fin de la sortie.
- Les exécutions en arrière-plan et avec `yieldMs` héritent de `tools.exec.timeoutSec`, sauf si l’appel fournit un `timeout` explicite.
- La sortie reste en mémoire jusqu’à ce que la session soit interrogée ou effacée.
- Si l’outil `process` n’est pas autorisé, `exec` s’exécute de manière synchrone et ignore `yieldMs`/`background`.
- Les commandes exec lancées reçoivent `OPENCLAW_SHELL=exec` afin de permettre des règles de shell/profil tenant compte du contexte.
- Pour une tâche de longue durée qui démarre maintenant : lancez-la une seule fois et reposez-vous sur le réveil automatique à la fin (lorsqu’il est activé) dès que la commande produit une sortie ou échoue.
- Si le réveil automatique à la fin n’est pas disponible, ou si vous devez confirmer la réussite silencieuse d’une commande qui se termine proprement sans sortie, interrogez-la avec `process`.
- N’émulez pas les rappels ou les suivis différés avec des boucles `sleep` ou des interrogations répétées — utilisez Cron pour les tâches futures.

### Remplacements par variables d’environnement

| Variable                                 | Effet                                                                                                                                                 |
| ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_BASH_YIELD_MS`                 | Délai par défaut avant le passage en arrière-plan (ms). Valeur par défaut : 10000, limitée à 10-120000.                                                |
| `OPENCLAW_BASH_MAX_OUTPUT_CHARS`         | Limite de la sortie en mémoire (caractères).                                                                                                           |
| `OPENCLAW_BASH_PENDING_MAX_OUTPUT_CHARS` | Limite de la sortie stdout/stderr en attente pour chaque flux (caractères).                                                                            |
| `OPENCLAW_BASH_JOB_TTL_MS`               | Durée de vie des sessions terminées (ms), limitée à 1m-3h.                                                                                             |
| `OPENCLAW_PROCESS_INPUT_WAIT_IDLE_MS`    | Seuil d’inactivité de la sortie avant que les sessions en arrière-plan accessibles en écriture soient signalées comme probablement en attente d’entrée. Valeur par défaut : 15000. |

### Configuration (à privilégier par rapport aux remplacements par variables d’environnement)

| Clé                                   | Valeur par défaut | Effet                                                                                                                       |
| ------------------------------------- | ----------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `tools.exec.backgroundMs`             | 10000             | Identique à `OPENCLAW_BASH_YIELD_MS`.                                                                                        |
| `tools.exec.timeoutSec`               | 1800              | Délai d’expiration par défaut pour chaque appel.                                                                             |
| `tools.exec.cleanupMs`                | 1800000           | Identique à `OPENCLAW_BASH_JOB_TTL_MS`.                                                                                      |
| `tools.exec.notifyOnExit`             | true              | Met en file d’attente un événement système et demande un Heartbeat lorsqu’une exécution en arrière-plan se termine.          |
| `tools.exec.notifyOnExitEmptySuccess` | false             | Met également en file d’attente des événements de fin pour les exécutions en arrière-plan réussies qui ne produisent aucune sortie. |

## Relais des processus enfants

Lors du lancement de processus enfants de longue durée en dehors des outils exec/process (relancements de CLI, utilitaires du Gateway), attachez l’utilitaire de relais des processus enfants afin de transmettre les signaux de terminaison et de détacher les écouteurs en cas de fin ou d’erreur. Cela évite les processus orphelins sous systemd et assure un arrêt cohérent sur toutes les plateformes.

## Outil process

Actions :

| Action      | Effet                                                                                                     |
| ----------- | --------------------------------------------------------------------------------------------------------- |
| `list`      | Sessions en cours d’exécution + terminées.                                                                |
| `poll`      | Récupérer la nouvelle sortie d’une session (indique également l’état de fin).                              |
| `log`       | Lire la sortie agrégée et les indications de reprise de la saisie. Prend en charge `offset` + `limit`.     |
| `write`     | Envoyer des données sur stdin (`data`, avec `eof` facultatif).                                             |
| `send-keys` | Envoyer des touches explicites ou des octets à une session utilisant un PTY.                              |
| `submit`    | Envoyer Entrée/retour chariot à une session utilisant un PTY.                                             |
| `paste`     | Envoyer du texte littéral, éventuellement encapsulé dans le mode de collage entre délimiteurs.            |
| `kill`      | Mettre fin à une session en arrière-plan.                                                                 |
| `clear`     | Supprimer de la mémoire une session terminée.                                                             |
| `remove`    | Mettre fin à la session si elle est en cours d’exécution, sinon l’effacer si elle est terminée.            |

Remarques :

- Seules les sessions en arrière-plan sont répertoriées/conservées — uniquement en mémoire, pas sur disque. Les sessions sont perdues au redémarrage du processus.
- Une session active en arrière-plan bloque la suspension coopérative de l’hôte et le redémarrage sécurisé du Gateway jusqu’à ce que le propriétaire du processus confirme sa fin effective.
- `process remove` peut masquer une session en cours d’exécution immédiatement après avoir demandé sa terminaison ; la suspension et le redémarrage restent bloqués jusqu’à la confirmation de sa fin.
- Les journaux de session ne sont enregistrés dans l’historique de la conversation que si vous exécutez `process poll`/`log` et que le résultat de l’outil est enregistré.
- `process` est limité à chaque agent ; il ne voit que les sessions démarrées par cet agent.
- Utilisez `poll`/`log` pour obtenir l’état, les journaux ou la confirmation de fin lorsque le réveil automatique à la fin n’est pas disponible.
- Utilisez `log` avant de reprendre une CLI interactive, afin d’afficher ensemble la transcription actuelle, l’état de stdin et l’indication d’attente d’entrée.
- Utilisez `write`/`send-keys`/`submit`/`paste`/`kill` lorsque vous devez fournir une entrée ou intervenir.
- `process list` comprend un `name` dérivé (verbe de la commande + cible) pour faciliter les vérifications rapides.
- `process list`, `poll` et `log` indiquent `waitingForInput` uniquement lorsque la session dispose toujours d’une entrée stdin accessible en écriture et qu’elle est inactive depuis une durée supérieure au seuil d’attente d’entrée (valeur par défaut : 15000 ms, `OPENCLAW_PROCESS_INPUT_WAIT_IDLE_MS`).
- `process log` utilise des valeurs `offset`/`limit` fondées sur les lignes. Lorsque les deux sont omises, il renvoie les 200 dernières lignes avec une indication de pagination. Lorsque `offset` est défini mais pas `limit`, il renvoie les lignes depuis `offset` jusqu’à la fin (sans limite à 200).
- Le `timeout` de `poll` attend jusqu’au nombre indiqué de millisecondes avant de renvoyer un résultat ; les valeurs supérieures à 30000 sont limitées à 30000.
- L’interrogation sert à obtenir un état à la demande, pas à planifier des boucles d’attente. Si le travail doit avoir lieu plus tard, utilisez Cron.

## Exemples

Exécuter une tâche longue et l’interroger ultérieurement :

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

Envoyer des données sur stdin :

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

- [Outil Exec](/fr/tools/exec)
- [Approbations Exec](/fr/tools/exec-approvals)

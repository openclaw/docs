---
read_when:
    - Vous souhaitez inspecter, auditer ou annuler des enregistrements de tâches en arrière-plan
    - Vous documentez les commandes Task Flow sous `openclaw tasks flow`
summary: Référence de la CLI pour `openclaw tasks` (registre des tâches en arrière-plan et état de Task Flow)
title: '`openclaw tasks`'
x-i18n:
    generated_at: "2026-07-12T15:13:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: b03a4aa9fab12b6e5773259a76a1e89fd6e6398c73e5b0533a31e5e3a3894f9c
    source_path: cli/tasks.md
    workflow: 16
---

Inspectez les tâches durables en arrière-plan et l’état de Task Flow. Sans sous-commande,
`openclaw tasks` équivaut à `openclaw tasks list`.

Consultez [Tâches en arrière-plan](/fr/automation/tasks) pour le modèle de cycle de vie et de livraison,
ainsi que sa section `tasks audit` pour une description complète des constats.

## Utilisation

```bash
openclaw tasks
openclaw tasks list
openclaw tasks list --runtime acp
openclaw tasks list --status running
openclaw tasks show <lookup>
openclaw tasks notify <lookup> state_changes
openclaw tasks cancel <lookup>
openclaw tasks audit
openclaw tasks maintenance
openclaw tasks maintenance --apply
openclaw tasks flow list
openclaw tasks flow show <lookup>
openclaw tasks flow cancel <lookup>
```

## Options racine

| Option             | Description                                                                                        |
| ------------------ | -------------------------------------------------------------------------------------------------- |
| `--json`           | Produit une sortie JSON.                                                                           |
| `--runtime <name>` | Filtre par type : `subagent`, `acp`, `cron` ou `cli`.                                              |
| `--status <name>`  | Filtre par état : `queued`, `running`, `succeeded`, `failed`, `timed_out`, `cancelled` ou `lost`.   |

## Sous-commandes

### `list`

```bash
openclaw tasks list [--runtime <name>] [--status <name>] [--json]
```

Répertorie les tâches en arrière-plan suivies, de la plus récente à la plus ancienne.

### `show`

```bash
openclaw tasks show <lookup> [--json]
```

Affiche une tâche à partir de son ID de tâche, de son ID d’exécution ou de sa clé de session.

### `notify`

```bash
openclaw tasks notify <lookup> <done_only|state_changes|silent>
```

Modifie la politique de notification d’une tâche en cours d’exécution.

### `cancel`

```bash
openclaw tasks cancel <lookup>
```

Annule une tâche en arrière-plan en cours d’exécution.

### `audit`

```bash
openclaw tasks audit [--severity <warn|error>] [--code <name>] [--limit <n>] [--json]
```

Signale les enregistrements de tâche et de Task Flow obsolètes, perdus, dont la livraison a échoué
ou présentant d’autres incohérences. Les tâches perdues conservées jusqu’à `cleanupAfter` génèrent des avertissements ;
les tâches perdues expirées ou sans horodatage génèrent des erreurs.

`--code` accepte les codes de tâche (`stale_queued`, `stale_running`, `lost`,
`delivery_failed`, `missing_cleanup`, `inconsistent_timestamps`) et les codes de Task
Flow (`restore_failed`, `stale_waiting`, `stale_blocked`,
`cancel_stuck`, `missing_linked_tasks`, `blocked_task_missing`). Consultez
[Tâches en arrière-plan](/fr/automation/tasks) pour plus de détails sur la gravité et les conditions de déclenchement de chaque
code.

### `maintenance`

```bash
openclaw tasks maintenance [--apply] [--json]
```

Prévisualise ou applique la réconciliation des tâches et de Task Flow, l’ajout des horodatages de nettoyage,
l’élagage et le nettoyage du registre des sessions d’exécution Cron obsolètes.

Pour les tâches Cron, la réconciliation utilise les journaux d’exécution et l’état des tâches persistés avant de
marquer une ancienne tâche active comme `lost`. Ainsi, les exécutions Cron terminées ne deviennent pas
de fausses erreurs d’audit simplement parce que l’état d’exécution en mémoire du Gateway a disparu.
L’audit hors ligne de la CLI ne fait pas autorité pour l’ensemble des tâches Cron actives, local au processus
du Gateway. Les tâches de la CLI possédant un ID d’exécution ou un ID source sont marquées comme `lost` lorsque
leur contexte d’exécution actif dans le Gateway a disparu, même si une ancienne ligne de session enfant
subsiste.

Lorsqu’elle est appliquée, la maintenance élague également les lignes du registre de sessions
`cron:<jobId>:run:<uuid>` datant de plus de 7 jours, tout en préservant les tâches Cron
en cours d’exécution et sans modifier les lignes de session non-Cron.

### `flow`

```bash
openclaw tasks flow list [--status <name>] [--json]
openclaw tasks flow show <lookup> [--json]
openclaw tasks flow cancel <lookup>
```

Inspecte ou annule l’état durable de Task Flow dans le registre des tâches.
`flow list --status` accepte `queued`, `running`, `waiting`, `blocked`,
`succeeded`, `failed`, `cancelled` ou `lost`.

## Voir aussi

- [Référence de la CLI](/fr/cli)
- [Tâches en arrière-plan](/fr/automation/tasks)

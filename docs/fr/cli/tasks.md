---
read_when:
    - Vous souhaitez inspecter, auditer ou annuler des enregistrements de tâches en arrière-plan
    - Vous documentez les commandes TaskFlow sous `openclaw tasks flow`
summary: Référence CLI pour `openclaw tasks` (registre des tâches en arrière-plan et état du flux de tâches)
title: '`openclaw tasks`'
x-i18n:
    generated_at: "2026-05-07T13:15:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: ca3f05d7c2a3fa7790ad6059ce15721ebffb548ac4a2c627188ac17986442dc6
    source_path: cli/tasks.md
    workflow: 16
---

Inspectez les tâches d’arrière-plan durables et l’état de Task Flow. Sans sous-commande,
`openclaw tasks` équivaut à `openclaw tasks list`.

Consultez [Tâches d’arrière-plan](/fr/automation/tasks) pour le cycle de vie et le modèle de livraison.

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

- `--json` : sortie JSON.
- `--runtime <name>` : filtre par type : `subagent`, `acp`, `cron` ou `cli`.
- `--status <name>` : filtre par état : `queued`, `running`, `succeeded`, `failed`, `timed_out`, `cancelled` ou `lost`.

## Sous-commandes

### `list`

```bash
openclaw tasks list [--runtime <name>] [--status <name>] [--json]
```

Liste les tâches d’arrière-plan suivies, des plus récentes aux plus anciennes.

### `show`

```bash
openclaw tasks show <lookup> [--json]
```

Affiche une tâche par ID de tâche, ID d’exécution ou clé de session.

### `notify`

```bash
openclaw tasks notify <lookup> <done_only|state_changes|silent>
```

Modifie la stratégie de notification d’une tâche en cours d’exécution.

### `cancel`

```bash
openclaw tasks cancel <lookup>
```

Annule une tâche d’arrière-plan en cours d’exécution.

### `audit`

```bash
openclaw tasks audit [--severity <warn|error>] [--code <name>] [--limit <n>] [--json]
```

Fait apparaître les enregistrements de tâches et de Task Flow obsolètes, perdus, dont la livraison a échoué ou autrement incohérents. Les tâches perdues conservées jusqu’à `cleanupAfter` sont des avertissements ; les tâches perdues expirées ou non horodatées sont des erreurs.

### `maintenance`

```bash
openclaw tasks maintenance [--apply] [--json]
```

Prévisualise ou applique la réconciliation des tâches et de Task Flow, l’horodatage du nettoyage et l’élagage.
Pour les tâches cron, la réconciliation utilise les journaux d’exécution persistés/l’état des jobs avant de marquer une
ancienne tâche active comme `lost`, afin que les exécutions cron terminées ne deviennent pas de fausses erreurs d’audit
simplement parce que l’état d’exécution en mémoire du Gateway a disparu. L’audit CLI hors ligne ne fait pas autorité
pour l’ensemble des jobs cron actifs locaux au processus du Gateway. Les tâches CLI
avec un ID d’exécution/ID source sont marquées comme `lost` lorsque leur contexte d’exécution Gateway en direct a
disparu, même s’il reste une ancienne ligne de session enfant.

### `flow`

```bash
openclaw tasks flow list [--status <name>] [--json]
openclaw tasks flow show <lookup> [--json]
openclaw tasks flow cancel <lookup>
```

Inspecte ou annule l’état durable de Task Flow sous le registre des tâches.

## Voir aussi

- [Référence CLI](/fr/cli)
- [Tâches d’arrière-plan](/fr/automation/tasks)

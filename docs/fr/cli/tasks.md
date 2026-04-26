---
read_when:
    - Vous voulez inspecter, auditer ou annuler des enregistrements de tâches en arrière-plan
    - Vous documentez les commandes Task Flow sous `openclaw tasks flow`
summary: Référence CLI pour `openclaw tasks` (journal des tâches en arrière-plan et état de TaskFlow)
title: '`openclaw tasks`'
x-i18n:
    generated_at: "2026-04-26T11:26:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6e61fb0b67a2bdd932b29543199fb219890f256260a66881c8e7ffeb9fadee33
    source_path: cli/tasks.md
    workflow: 15
---

Inspecter les tâches en arrière-plan durables et l’état de TaskFlow. Sans sous-commande,
`openclaw tasks` équivaut à `openclaw tasks list`.

Voir [Background Tasks](/fr/automation/tasks) pour le cycle de vie et le modèle de livraison.

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

- `--json` : produit une sortie JSON.
- `--runtime <name>` : filtre par type : `subagent`, `acp`, `cron` ou `cli`.
- `--status <name>` : filtre par statut : `queued`, `running`, `succeeded`, `failed`, `timed_out`, `cancelled` ou `lost`.

## Sous-commandes

### `list`

```bash
openclaw tasks list [--runtime <name>] [--status <name>] [--json]
```

Liste les tâches en arrière-plan suivies, de la plus récente à la plus ancienne.

### `show`

```bash
openclaw tasks show <lookup> [--json]
```

Affiche une tâche par ID de tâche, ID d’exécution ou clé de session.

### `notify`

```bash
openclaw tasks notify <lookup> <done_only|state_changes|silent>
```

Modifie la politique de notification pour une tâche en cours d’exécution.

### `cancel`

```bash
openclaw tasks cancel <lookup>
```

Annule une tâche en arrière-plan en cours d’exécution.

### `audit`

```bash
openclaw tasks audit [--severity <warn|error>] [--code <name>] [--limit <n>] [--json]
```

Fait ressortir les enregistrements de tâches et d’état de Task Flow périmés, perdus, en échec de livraison ou autrement incohérents. Les tâches perdues conservées jusqu’à `cleanupAfter` sont des avertissements ; les tâches perdues expirées ou sans horodatage sont des erreurs.

### `maintenance`

```bash
openclaw tasks maintenance [--apply] [--json]
```

Prévisualise ou applique le rapprochement, l’horodatage de nettoyage et la suppression des tâches et de l’état de Task Flow.
Pour les tâches Cron, le rapprochement utilise les journaux d’exécution persistés/l’état des tâches avant de marquer une
ancienne tâche active comme `lost`, afin que les exécutions Cron terminées ne deviennent pas de fausses erreurs d’audit
simplement parce que l’état du runtime Gateway en mémoire a disparu. L’audit CLI hors ligne
ne fait pas autorité pour l’ensemble local au processus des tâches Cron actives de la Gateway.

### `flow`

```bash
openclaw tasks flow list [--status <name>] [--json]
openclaw tasks flow show <lookup> [--json]
openclaw tasks flow cancel <lookup>
```

Inspecte ou annule l’état durable de Task Flow sous le journal des tâches.

## Associé

- [Référence CLI](/fr/cli)
- [Tâches en arrière-plan](/fr/automation/tasks)

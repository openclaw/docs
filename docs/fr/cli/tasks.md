---
read_when:
    - Vous souhaitez inspecter, auditer ou annuler des enregistrements de tâches en arrière-plan
    - Vous documentez les commandes TaskFlow sous `openclaw tasks flow`
summary: Référence CLI pour `openclaw tasks` (registre des tâches en arrière-plan et état TaskFlow)
title: '`openclaw tasks`'
x-i18n:
    generated_at: "2026-05-11T20:29:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7bbb97690124a8e59ec5e6a517f33166ad449ee6268894ab132ad9cb69dcaa81
    source_path: cli/tasks.md
    workflow: 16
---

Inspectez les tâches en arrière-plan durables et l’état de Task Flow. Sans sous-commande,
`openclaw tasks` est équivalent à `openclaw tasks list`.

Consultez [Tâches en arrière-plan](/fr/automation/tasks) pour le cycle de vie et le modèle de livraison.

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

## Options Racine

- `--json` : produit du JSON.
- `--runtime <name>` : filtre par type : `subagent`, `acp`, `cron` ou `cli`.
- `--status <name>` : filtre par état : `queued`, `running`, `succeeded`, `failed`, `timed_out`, `cancelled` ou `lost`.

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

Fait apparaître les enregistrements de tâches et de Task Flow obsolètes, perdus, dont la livraison a échoué ou autrement incohérents. Les tâches perdues conservées jusqu’à `cleanupAfter` sont des avertissements ; les tâches perdues expirées ou non horodatées sont des erreurs.

### `maintenance`

```bash
openclaw tasks maintenance [--apply] [--json]
```

Prévisualise ou applique la réconciliation des tâches et de Task Flow, l’horodatage de nettoyage, l’élagage,
ainsi que le nettoyage du registre de sessions d’exécution Cron obsolètes.
Pour les tâches Cron, la réconciliation utilise les journaux d’exécution/l’état de tâche persistés avant de marquer une
ancienne tâche active comme `lost`, afin que les exécutions Cron terminées ne deviennent pas de fausses erreurs d’audit
simplement parce que l’état d’exécution en mémoire du Gateway a disparu. L’audit CLI hors ligne
ne fait pas autorité pour l’ensemble des tâches Cron actives propre au processus du Gateway. Les tâches CLI
avec un ID d’exécution/ID source sont marquées `lost` lorsque leur contexte d’exécution Gateway actif a
disparu, même si une ancienne ligne de session enfant reste présente.
Lorsqu’elle est appliquée, la maintenance élague également les lignes du registre de sessions `cron:<jobId>:run:<uuid>`
datant de plus de 7 jours, tout en préservant les tâches Cron actuellement en cours d’exécution et en laissant
les lignes de session non-Cron intactes.

### `flow`

```bash
openclaw tasks flow list [--status <name>] [--json]
openclaw tasks flow show <lookup> [--json]
openclaw tasks flow cancel <lookup>
```

Inspecte ou annule l’état durable de Task Flow dans le registre des tâches.

## Connexe

- [Référence CLI](/fr/cli)
- [Tâches en arrière-plan](/fr/automation/tasks)

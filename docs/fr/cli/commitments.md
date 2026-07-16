---
read_when:
    - Vous souhaitez examiner les engagements de suivi déduits
    - Vous souhaitez ignorer les demandes de suivi en attente
    - Vous auditez ce que Heartbeat peut livrer
summary: Référence de la CLI pour `openclaw commitments` (inspecter et ignorer les suivis déduits)
title: '`openclaw commitments`'
x-i18n:
    generated_at: "2026-07-16T13:06:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: db8a7d8f5756ccb18ed0990fcedf50d1072bb67e775c29eefdbd1a7dd795b7b0
    source_path: cli/commitments.md
    workflow: 16
---

Répertoriez et gérez les engagements de suivi déduits.

Les engagements sont facultatifs (`commitments.enabled`) et constituent des souvenirs de suivi de courte durée,
créés à partir du contexte de la conversation et transmis par Heartbeat. Consultez
[Engagements déduits](/fr/concepts/commitments) pour le guide conceptuel et la configuration.

Sans sous-commande, `openclaw commitments` répertorie les engagements en attente.

## Utilisation

```bash
openclaw commitments [--all] [--agent <id>] [--status <status>] [--json]
openclaw commitments list [--all] [--agent <id>] [--status <status>] [--json]
openclaw commitments dismiss <id...> [--json]
```

## Options

- `--all` : affichez tous les statuts plutôt que seulement les engagements en attente.
- `--agent <id>` : filtrez selon l’identifiant d’un agent.
- `--status <status>` : filtrez par statut. Valeurs : `pending`, `sent`,
  `dismissed`, `snoozed` ou `expired`. Les valeurs inconnues provoquent une sortie avec une erreur.
- `--json` : produisez une sortie JSON lisible par machine.

`dismiss` marque les identifiants d’engagement indiqués comme `dismissed` afin que Heartbeat ne les
transmette pas.

## Exemples

Répertoriez les engagements en attente :

```bash
openclaw commitments
```

Répertoriez tous les engagements stockés :

```bash
openclaw commitments --all
```

Filtrez selon un agent :

```bash
openclaw commitments --agent main
```

Recherchez les engagements reportés :

```bash
openclaw commitments --status snoozed
```

Rejetez un ou plusieurs engagements :

```bash
openclaw commitments dismiss cm_abc123 cm_def456
```

Exportez au format JSON :

```bash
openclaw commitments --all --json
```

## Sortie

La sortie texte affiche le nombre d’engagements, le chemin de la base de données SQLite partagée, les éventuels filtres actifs
et une ligne par engagement :

- identifiant de l’engagement
- statut
- type (`event_check_in`, `deadline_check`, `care_check_in` ou `open_loop`)
- première échéance possible
- portée (agent/canal/cible)
- texte de suivi suggéré

La sortie JSON comprend le nombre, les filtres actifs de statut et d’agent, le
chemin de la base de données SQLite partagée et l’intégralité des enregistrements stockés.

## Voir aussi

- [Engagements déduits](/fr/concepts/commitments)
- [Vue d’ensemble de la mémoire](/fr/concepts/memory)
- [Heartbeat](/fr/gateway/heartbeat)
- [Tâches planifiées](/fr/automation/cron-jobs)

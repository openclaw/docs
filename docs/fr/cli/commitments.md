---
read_when:
    - Vous souhaitez examiner les engagements de suivi déduits
    - Vous souhaitez ignorer les demandes de suivi en attente
    - Vous auditez ce que le Heartbeat est susceptible de transmettre
summary: Référence de la CLI pour `openclaw commitments` (inspecter et ignorer les suivis déduits)
title: '`openclaw commitments`'
x-i18n:
    generated_at: "2026-07-12T02:29:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4323273a5d73975532f4728dc5e40c5d59e0c6d2e31a538f96bf3451e3fdf4d9
    source_path: cli/commitments.md
    workflow: 16
---

Répertorier et gérer les engagements de suivi déduits.

Les engagements sont facultatifs (`commitments.enabled`) et constituent des souvenirs de suivi à courte durée de vie, créés à partir du contexte de la conversation et transmis par Heartbeat. Consultez
[Engagements déduits](/fr/concepts/commitments) pour le guide conceptuel et la configuration.

Sans sous-commande, `openclaw commitments` répertorie les engagements en attente.

## Utilisation

```bash
openclaw commitments [--all] [--agent <id>] [--status <status>] [--json]
openclaw commitments list [--all] [--agent <id>] [--status <status>] [--json]
openclaw commitments dismiss <id...> [--json]
```

## Options

- `--all` : afficher tous les statuts au lieu des seuls engagements en attente.
- `--agent <id>` : filtrer selon l’identifiant d’un seul agent.
- `--status <status>` : filtrer par statut. Valeurs : `pending`, `sent`,
  `dismissed`, `snoozed` ou `expired`. Une valeur inconnue provoque une sortie avec une erreur.
- `--json` : produire du JSON lisible par une machine.

`dismiss` marque les identifiants d’engagement indiqués comme `dismissed` afin que Heartbeat ne les transmette pas.

## Exemples

Répertorier les engagements en attente :

```bash
openclaw commitments
```

Répertorier tous les engagements stockés :

```bash
openclaw commitments --all
```

Filtrer selon un seul agent :

```bash
openclaw commitments --agent main
```

Rechercher les engagements reportés :

```bash
openclaw commitments --status snoozed
```

Ignorer un ou plusieurs engagements :

```bash
openclaw commitments dismiss cm_abc123 cm_def456
```

Exporter au format JSON :

```bash
openclaw commitments --all --json
```

## Sortie

La sortie textuelle affiche le nombre d’engagements, le chemin du stockage, les filtres actifs éventuels et une ligne par engagement :

- identifiant de l’engagement
- statut
- type (`event_check_in`, `deadline_check`, `care_check_in` ou `open_loop`)
- première échéance possible
- portée (agent/canal/cible)
- texte de suivi suggéré

La sortie JSON comprend le nombre, les filtres actifs de statut et d’agent, le chemin du stockage des engagements et l’intégralité des enregistrements stockés.

## Pages connexes

- [Engagements déduits](/fr/concepts/commitments)
- [Vue d’ensemble de la mémoire](/fr/concepts/memory)
- [Heartbeat](/fr/gateway/heartbeat)
- [Tâches planifiées](/fr/automation/cron-jobs)

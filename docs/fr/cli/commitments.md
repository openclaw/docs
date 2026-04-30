---
read_when:
    - Vous souhaitez inspecter les engagements de suivi inférés
    - Vous voulez ignorer les points de suivi en attente
    - Vous auditez ce que Heartbeat peut fournir
summary: Référence CLI pour `openclaw commitments` (inspecter et écarter les suivis inférés)
title: '`openclaw commitments`'
x-i18n:
    generated_at: "2026-04-30T07:17:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 37d5e5dca25cf649a5069360aa4e41fcc33d042dea99f643b98c07189c58f21c
    source_path: cli/commitments.md
    workflow: 16
---

Répertoriez et gérez les engagements de suivi déduits.

Les engagements sont des mémoires de suivi optionnelles et de courte durée, créées à partir du
contexte de conversation. Consultez [Engagements déduits](/fr/concepts/commitments) pour le
guide conceptuel.

Sans sous-commande, `openclaw commitments` répertorie les engagements en attente.

## Utilisation

```bash
openclaw commitments [--all] [--agent <id>] [--status <status>] [--json]
openclaw commitments list [--all] [--agent <id>] [--status <status>] [--json]
openclaw commitments dismiss <id...> [--json]
```

## Options

- `--all` : afficher tous les statuts au lieu des seuls engagements en attente.
- `--agent <id>` : filtrer sur un seul identifiant d’agent.
- `--status <status>` : filtrer par statut. Valeurs : `pending`, `sent`,
  `dismissed`, `snoozed` ou `expired`.
- `--json` : produire du JSON lisible par machine.

## Exemples

Répertorier les engagements en attente :

```bash
openclaw commitments
```

Répertorier tous les engagements stockés :

```bash
openclaw commitments --all
```

Filtrer sur un seul agent :

```bash
openclaw commitments --agent main
```

Trouver les engagements reportés :

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

La sortie texte inclut :

- identifiant de l’engagement
- statut
- type
- première échéance possible
- portée
- texte de relance suggéré

La sortie JSON inclut également le chemin du magasin d’engagements et les enregistrements stockés complets.

## Connexe

- [Engagements déduits](/fr/concepts/commitments)
- [Vue d’ensemble de la mémoire](/fr/concepts/memory)
- [Heartbeat](/fr/gateway/heartbeat)
- [Tâches planifiées](/fr/automation/cron-jobs)

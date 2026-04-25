---
read_when:
    - Vous gérez des Nodes appairés (caméras, écran, canvas)
    - Vous devez approuver des demandes ou invoquer des commandes de Node
summary: Référence CLI pour `openclaw nodes` (statut, appairage, invocation, caméra/canvas/écran)
title: Nodes
x-i18n:
    generated_at: "2026-04-25T13:44:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 68a5701ce0dcba399d93f6eed864b0b0ae34320501de0176aeaad1712d392834
    source_path: cli/nodes.md
    workflow: 15
---

# `openclaw nodes`

Gérez les Nodes appairés (appareils) et invoquez les capacités des Nodes.

Lié :

- Vue d’ensemble des Nodes : [Nodes](/fr/nodes)
- Caméra : [Nodes caméra](/fr/nodes/camera)
- Images : [Nodes d’image](/fr/nodes/images)

Options courantes :

- `--url`, `--token`, `--timeout`, `--json`

## Commandes courantes

```bash
openclaw nodes list
openclaw nodes list --connected
openclaw nodes list --last-connected 24h
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes reject <requestId>
openclaw nodes rename --node <id|name|ip> --name <displayName>
openclaw nodes status
openclaw nodes status --connected
openclaw nodes status --last-connected 24h
```

`nodes list` affiche les tableaux des éléments en attente/appairés. Les lignes appairées incluent l’ancienneté de la connexion la plus récente (Last Connect).
Utilisez `--connected` pour n’afficher que les Nodes actuellement connectés. Utilisez `--last-connected <duration>` pour
filtrer les Nodes qui se sont connectés dans une durée donnée (par exemple `24h`, `7d`).

Remarque sur l’approbation :

- `openclaw nodes pending` nécessite seulement la portée d’appairage.
- `gateway.nodes.pairing.autoApproveCidrs` peut ignorer l’étape en attente uniquement pour
  l’appairage d’appareil `role: node` initial et explicitement approuvé. Cette option est désactivée par
  défaut et n’approuve pas les mises à niveau.
- `openclaw nodes approve <requestId>` hérite des exigences de portée supplémentaires de la
  demande en attente :
  - demande sans commande : appairage uniquement
  - commandes Node non exec : appairage + écriture
  - `system.run` / `system.run.prepare` / `system.which` : appairage + admin

## Invocation

```bash
openclaw nodes invoke --node <id|name|ip> --command <command> --params <json>
```

Indicateurs d’invocation :

- `--params <json>` : chaîne d’objet JSON (par défaut `{}`).
- `--invoke-timeout <ms>` : délai d’expiration de l’invocation Node (par défaut `15000`).
- `--idempotency-key <key>` : clé d’idempotence facultative.
- `system.run` et `system.run.prepare` sont bloqués ici ; utilisez l’outil `exec` avec `host=node` pour l’exécution shell.

Pour l’exécution shell sur un Node, utilisez l’outil `exec` avec `host=node` au lieu de `openclaw nodes run`.
La CLI `nodes` est désormais centrée sur les capacités : RPC direct via `nodes invoke`, plus appairage, caméra,
écran, localisation, canvas et notifications.

## Lié

- [Référence CLI](/fr/cli)
- [Nodes](/fr/nodes)

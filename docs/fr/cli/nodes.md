---
read_when:
    - Vous gérez des nœuds appariés (caméras, écran, canevas)
    - Vous devez approuver les requêtes ou exécuter des commandes Node
summary: Référence CLI pour `openclaw nodes` (status, pairing, invoke, camera/canvas/screen)
title: Nodes
x-i18n:
    generated_at: "2026-04-30T07:19:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3229db91d7e64b0d37bee29bd51895d90796f5fd33b67e3d900fd8bda2b6e7e9
    source_path: cli/nodes.md
    workflow: 16
---

# `openclaw nodes`

Gérez les nodes associés (appareils) et invoquez les capacités des nodes.

Connexe :

- Vue d’ensemble des nodes : [Nodes](/fr/nodes)
- Caméra : [Nodes caméra](/fr/nodes/camera)
- Images : [Nodes image](/fr/nodes/images)

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
openclaw nodes remove --node <id|name|ip>
openclaw nodes rename --node <id|name|ip> --name <displayName>
openclaw nodes status
openclaw nodes status --connected
openclaw nodes status --last-connected 24h
```

`nodes list` affiche les tableaux des demandes en attente et des associations. Les lignes associées incluent l’âge de connexion le plus récent (Dernière connexion).
Utilisez `--connected` pour afficher uniquement les nodes actuellement connectés. Utilisez `--last-connected <duration>` pour
filtrer les nodes qui se sont connectés dans une durée donnée (par exemple `24h`, `7d`).
Utilisez `nodes remove --node <id|name|ip>` pour supprimer un enregistrement obsolète d’association de node appartenant au Gateway.

Note d’approbation :

- `openclaw nodes pending` nécessite uniquement la portée d’association.
- `gateway.nodes.pairing.autoApproveCidrs` peut ignorer l’étape d’attente uniquement pour
  une première association d’appareil `role: node` explicitement approuvée. Elle est désactivée
  par défaut et n’approuve pas les mises à niveau.
- `openclaw nodes approve <requestId>` hérite des exigences de portée supplémentaires de la
  demande en attente :
  - demande sans commande : association uniquement
  - commandes de node non exec : association + écriture
  - `system.run` / `system.run.prepare` / `system.which` : association + administration

## Invoquer

```bash
openclaw nodes invoke --node <id|name|ip> --command <command> --params <json>
```

Indicateurs d’invocation :

- `--params <json>` : chaîne d’objet JSON (par défaut `{}`).
- `--invoke-timeout <ms>` : délai d’expiration d’invocation du node (par défaut `15000`).
- `--idempotency-key <key>` : clé d’idempotence facultative.
- `system.run` et `system.run.prepare` sont bloqués ici ; utilisez l’outil `exec` avec `host=node` pour l’exécution shell.

Pour l’exécution shell sur un node, utilisez l’outil `exec` avec `host=node` au lieu de `openclaw nodes run`.
La CLI `nodes` est désormais centrée sur les capacités : RPC direct via `nodes invoke`, ainsi que l’association, la caméra,
l’écran, la localisation, le canvas et les notifications.

## Connexe

- [Référence de la CLI](/fr/cli)
- [Nodes](/fr/nodes)

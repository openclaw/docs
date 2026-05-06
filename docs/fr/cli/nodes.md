---
read_when:
    - Vous gérez des nœuds appairés (caméras, écran, canevas)
    - Vous devez approuver les demandes ou exécuter des commandes node
summary: Référence CLI pour `openclaw nodes` (état, appairage, invocation, caméra/canvas/écran)
title: Nodes
x-i18n:
    generated_at: "2026-05-06T17:54:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: f3eb0d23037c939e4022115a2d65e0e9cb25a872daed715b8652979ce6707cf7
    source_path: cli/nodes.md
    workflow: 16
---

# `openclaw nodes`

Gérer les nodes appairés (appareils) et appeler les capacités des nodes.

Associé :

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

`nodes list` affiche les tableaux des demandes en attente et des appairages. Les lignes appairées incluent l’âge de connexion le plus récent (Last Connect).
Utilisez `--connected` pour afficher uniquement les nodes actuellement connectés. Utilisez `--last-connected <duration>` pour
filtrer les nodes qui se sont connectés dans une durée donnée (par exemple `24h`, `7d`).
Utilisez `nodes remove --node <id|name|ip>` pour supprimer un enregistrement obsolète d’appairage de node appartenant au Gateway.

Note d’approbation :

- `openclaw nodes pending` nécessite uniquement la portée d’appairage.
- `gateway.nodes.pairing.autoApproveCidrs` peut ignorer l’étape en attente uniquement pour
  l’appairage explicitement approuvé et initial d’un appareil `role: node`. Il est désactivé par
  défaut et n’approuve pas les mises à niveau.
- `openclaw nodes approve <requestId>` hérite des exigences de portée supplémentaires de la
  demande en attente :
  - demande sans commande : appairage uniquement
  - commandes de node non exec : appairage + écriture
  - `system.run` / `system.run.prepare` / `system.which` : appairage + admin

## Appeler

```bash
openclaw nodes invoke --node <id|name|ip> --command <command> --params <json>
```

Options d’appel :

- `--params <json>` : chaîne d’objet JSON (valeur par défaut `{}`).
- `--invoke-timeout <ms>` : délai d’expiration d’appel du node (valeur par défaut `15000`).
- `--idempotency-key <key>` : clé d’idempotence facultative.
- `system.run` et `system.run.prepare` sont bloqués ici ; utilisez l’outil `exec` avec `host=node` pour l’exécution shell.

Pour l’exécution shell sur un node, utilisez l’outil `exec` avec `host=node` au lieu de `openclaw nodes run`.
La CLI `nodes` est désormais axée sur les capacités : RPC direct via `nodes invoke`, plus l’appairage, la caméra,
l’écran, la localisation, le canvas et les notifications.

## Associé

- [Référence CLI](/fr/cli)
- [Nodes](/fr/nodes)

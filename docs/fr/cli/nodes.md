---
read_when:
    - Vous gérez des nœuds appairés (caméras, écran, canevas)
    - Vous devez approuver les demandes ou exécuter des commandes Node
summary: Référence CLI pour `openclaw nodes` (état, appairage, invocation, caméra/canevas/écran)
title: Nœuds
x-i18n:
    generated_at: "2026-05-07T13:14:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 681c199462d5f58c3e4346713263a78e7513335f087c713877e3050e21c8e15f
    source_path: cli/nodes.md
    workflow: 16
---

# `openclaw nodes`

Gérez les nœuds appairés (appareils) et invoquez les capacités des nœuds.

Liens connexes :

- Vue d’ensemble des nœuds : [Nœuds](/fr/nodes)
- Caméra : [Nœuds caméra](/fr/nodes/camera)
- Images : [Nœuds d’image](/fr/nodes/images)

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

`nodes list` affiche les tableaux des demandes en attente et des appairages. Les lignes appairées incluent l’âge de connexion le plus récent (Dernière connexion).
Utilisez `--connected` pour afficher uniquement les nœuds actuellement connectés. Utilisez `--last-connected <duration>` pour
filtrer les nœuds qui se sont connectés dans une durée donnée (par exemple `24h`, `7d`).
Utilisez `nodes remove --node <id|name|ip>` pour supprimer un enregistrement obsolète d’appairage de nœud détenu par le Gateway.

Note d’approbation :

- `openclaw nodes pending` ne nécessite que le périmètre d’appairage.
- `gateway.nodes.pairing.autoApproveCidrs` peut ignorer l’étape d’attente uniquement pour
  l’appairage d’un appareil `role: node` explicitement approuvé et effectué pour la première fois. Il est désactivé
  par défaut et n’approuve pas les mises à niveau.
- `openclaw nodes approve <requestId>` hérite des exigences de périmètre supplémentaires de la
  demande en attente :
  - demande sans commande : appairage uniquement
  - commandes de nœud non-exec : appairage + écriture
  - `system.run` / `system.run.prepare` / `system.which` : appairage + admin

## Invoquer

```bash
openclaw nodes invoke --node <id|name|ip> --command <command> --params <json>
```

Indicateurs d’invocation :

- `--params <json>` : chaîne d’objet JSON (par défaut `{}`).
- `--invoke-timeout <ms>` : délai d’expiration d’invocation du nœud (par défaut `15000`).
- `--idempotency-key <key>` : clé d’idempotence facultative.
- `system.run` et `system.run.prepare` sont bloqués ici ; utilisez l’outil `exec` avec `host=node` pour l’exécution shell.

Pour l’exécution shell sur un nœud, utilisez l’outil `exec` avec `host=node` au lieu de `openclaw nodes run`.
La CLI `nodes` est désormais axée sur les capacités : RPC direct via `nodes invoke`, ainsi que l’appairage, la caméra,
l’écran, la localisation, Canvas et les notifications. Les commandes Canvas sont implémentées par le Plugin Canvas expérimental intégré ; le noyau conserve un point d’extension de compatibilité afin qu’elles restent disponibles sous `openclaw nodes canvas`.

## Liens connexes

- [Référence CLI](/fr/cli)
- [Nœuds](/fr/nodes)

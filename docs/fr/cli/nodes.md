---
read_when:
    - Vous gérez des nœuds appariés (caméras, écran, canvas)
    - Vous devez approuver les demandes ou invoquer des commandes Node
summary: Référence CLI pour `openclaw nodes` (statut, appairage, invocation, caméra/canevas/écran)
title: Nodes
x-i18n:
    generated_at: "2026-06-27T17:20:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e752e4a5809e01ee7970204c84d9f1008f146d8a55954f6ed5de527a6a124bc7
    source_path: cli/nodes.md
    workflow: 16
---

# `openclaw nodes`

Gérer les nœuds (appareils) appairés et invoquer les capacités des nœuds.

Associés :

- Vue d’ensemble des nœuds : [Nœuds](/fr/nodes)
- Caméra : [Nœuds caméra](/fr/nodes/camera)
- Images : [Nœuds image](/fr/nodes/images)

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

`nodes list` affiche les tableaux des demandes en attente et des nœuds appairés. Les lignes appairées incluent l’âge de connexion le plus récent (Dernière connexion).
Utilisez `--connected` pour n’afficher que les nœuds actuellement connectés. Utilisez `--last-connected <duration>` pour
filtrer les nœuds qui se sont connectés dans une durée donnée (par exemple `24h`, `7d`).
Utilisez `nodes remove --node <id|name|ip>` pour supprimer l’appairage d’un nœud. Pour un
nœud adossé à un appareil, cela révoque le rôle `node` de l’appareil dans `devices/paired.json`
et déconnecte ses sessions avec rôle de nœud (un appareil à rôles mixtes conserve sa ligne et
perd uniquement le rôle `node` ; un appareil uniquement nœud est supprimé) ; cela efface également tout
enregistrement correspondant d’appairage de nœud hérité appartenant au Gateway. `operator.pairing` peut supprimer
les lignes de nœuds non opérateur ; un appelant avec jeton d’appareil qui révoque son propre rôle de nœud sur un
appareil à rôles mixtes nécessite en plus `operator.admin`.

Note d’approbation :

- `openclaw nodes pending` ne nécessite que le périmètre d’appairage.
- `gateway.nodes.pairing.autoApproveCidrs` peut ignorer l’étape d’attente uniquement pour
  l’appairage d’appareil `role: node` explicitement approuvé et effectué pour la première fois. Il est désactivé par
  défaut et n’approuve pas les mises à niveau.
- `openclaw nodes approve <requestId>` hérite des exigences de périmètre supplémentaires de la
  demande en attente :
  - demande sans commande : appairage uniquement
  - commandes de nœud non-exec : appairage + écriture
  - `system.run` / `system.run.prepare` / `system.which` : appairage + administration

## Invoquer

```bash
openclaw nodes invoke --node <id|name|ip> --command <command> --params <json>
```

Indicateurs d’invocation :

- `--params <json>` : chaîne d’objet JSON (valeur par défaut `{}`).
- `--invoke-timeout <ms>` : délai d’expiration de l’invocation de nœud (valeur par défaut `15000`).
- `--idempotency-key <key>` : clé d’idempotence facultative.
- `system.run` et `system.run.prepare` sont bloqués ici ; utilisez l’outil `exec` avec `host=node` pour l’exécution shell.

Pour l’exécution shell sur un nœud, utilisez l’outil `exec` avec `host=node` au lieu de `openclaw nodes run`.
La CLI `nodes` est désormais axée sur les capacités : RPC direct via `nodes invoke`, ainsi qu’appairage, caméra,
écran, emplacement, Canvas et notifications. Les commandes Canvas sont implémentées par le Plugin Canvas expérimental groupé ; le cœur conserve un point d’extension de compatibilité afin qu’elles restent disponibles sous `openclaw nodes canvas`.

## Associés

- [Référence CLI](/fr/cli)
- [Nœuds](/fr/nodes)

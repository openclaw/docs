---
read_when:
    - Ajout ou modification d’intégrations CLI externes
    - Débogage des adaptateurs RPC (signal-cli, imsg)
summary: Adaptateurs RPC pour les CLI externes (signal-cli, imsg) et modèles de Gateway
title: Adaptateurs RPC
x-i18n:
    generated_at: "2026-05-11T20:54:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: 63556f140bee55821fa0a09ff9808e163728049f8db4c58f7bb4ceca6e1cac1a
    source_path: reference/rpc.md
    workflow: 16
---

OpenClaw intègre des CLI externes via JSON-RPC. Deux modèles sont utilisés aujourd’hui.

## Modèle A : démon HTTP (signal-cli)

- `signal-cli` s’exécute comme un démon avec JSON-RPC sur HTTP.
- Le flux d’événements est SSE (`/api/v1/events`).
- Sonde d’état : `/api/v1/check`.
- OpenClaw gère le cycle de vie lorsque `channels.signal.autoStart=true`.

Consultez [Signal](/fr/channels/signal) pour la configuration et les points de terminaison.

## Modèle B : processus enfant stdio (imsg)

- OpenClaw lance `imsg rpc` comme processus enfant pour [iMessage](/fr/channels/imessage).
- JSON-RPC est délimité par lignes sur stdin/stdout (un objet JSON par ligne).
- Aucun port TCP, aucun démon requis.

Méthodes principales utilisées :

- `watch.subscribe` → notifications (`method: "message"`)
- `watch.unsubscribe`
- `send`
- `chats.list` (sonde/diagnostics)

Consultez [iMessage](/fr/channels/imessage) pour la configuration héritée et l’adressage (`chat_id` recommandé).

## Consignes pour l’adaptateur

- Gateway est responsable du processus (démarrage/arrêt liés au cycle de vie du fournisseur).
- Gardez les clients RPC résilients : délais d’expiration, redémarrage en cas de sortie.
- Préférez les identifiants stables (par exemple, `chat_id`) aux chaînes d’affichage.

## Associé

- [Protocole Gateway](/fr/gateway/protocol)

---
read_when:
    - Ajout ou modification d’intégrations CLI externes
    - Débogage des adaptateurs RPC (signal-cli, imsg)
summary: Adaptateurs RPC pour les CLI externes (signal-cli, imsg) et modèles de Gateway
title: Adaptateurs RPC
x-i18n:
    generated_at: "2026-07-12T15:51:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 6ddb3fb741c90fe7b01ba35376b71865584b1e507cf610705392452790fb76f5
    source_path: reference/rpc.md
    workflow: 16
---

OpenClaw intègre des CLI externes via JSON-RPC. Deux modèles sont actuellement utilisés.

## Modèle A : démon HTTP (signal-cli)

- `signal-cli` s’exécute en tant que démon avec JSON-RPC sur HTTP.
- Le flux d’événements utilise SSE (`/api/v1/events`).
- Sonde d’intégrité : `/api/v1/check`.
- OpenClaw gère le cycle de vie lorsque `channels.signal.autoStart=true`.

Consultez [Signal](/fr/channels/signal) pour la configuration et les points de terminaison.

## Modèle B : processus enfant stdio (imsg)

- OpenClaw lance `imsg rpc` en tant que processus enfant pour [iMessage](/fr/channels/imessage).
- Les messages JSON-RPC sont délimités par des lignes sur stdin/stdout (un objet JSON par ligne).
- Aucun port TCP ni démon requis.

Méthodes principales utilisées :

- `watch.subscribe` → notifications (`method: "message"`)
- `watch.unsubscribe`
- `send`
- `chats.list` (sonde/diagnostics)

Consultez [iMessage](/fr/channels/imessage) pour la configuration et l’adressage (`chat_id` est préférable aux chaînes d’affichage).

## Consignes pour les adaptateurs

- Le Gateway gère le processus (démarrage/arrêt liés au cycle de vie du fournisseur).
- Veillez à la résilience des clients RPC : délais d’expiration, redémarrage en cas d’arrêt.
- Préférez les identifiants stables (par exemple, `chat_id`) aux chaînes d’affichage.

## Rubriques connexes

- [Protocole du Gateway](/fr/gateway/protocol)

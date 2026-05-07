---
read_when:
    - Ajout ou modification d’intégrations CLI externes
    - Débogage des adaptateurs RPC (signal-cli, imsg)
summary: Adaptateurs RPC pour CLI externes (signal-cli, imsg) et modèles de Gateway
title: Adaptateurs RPC
x-i18n:
    generated_at: "2026-05-07T01:53:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 446e54d736352f45e6cc6988a1835233cace7f854b6e62c64bb1fae115ce76f6
    source_path: reference/rpc.md
    workflow: 16
---

OpenClaw intègre des CLI externes via JSON-RPC. Deux modèles sont utilisés aujourd’hui.

## Modèle A : démon HTTP (signal-cli)

- `signal-cli` s’exécute comme un démon avec JSON-RPC sur HTTP.
- Le flux d’événements est SSE (`/api/v1/events`).
- Sonde d’intégrité : `/api/v1/check`.
- OpenClaw possède le cycle de vie lorsque `channels.signal.autoStart=true`.

Consultez [Signal](/fr/channels/signal) pour la configuration et les points de terminaison.

## Modèle B : processus enfant stdio (hérité : imsg)

> **Remarque :** Pour les nouvelles configurations iMessage, utilisez plutôt [BlueBubbles](/fr/channels/bluebubbles).

- OpenClaw lance `imsg rpc` comme processus enfant (intégration iMessage héritée).
- JSON-RPC est délimité par lignes sur stdin/stdout (un objet JSON par ligne).
- Aucun port TCP, aucun démon requis.

Méthodes principales utilisées :

- `watch.subscribe` → notifications (`method: "message"`)
- `watch.unsubscribe`
- `send`
- `chats.list` (sonde/diagnostics)

Consultez [iMessage](/fr/channels/imessage) pour la configuration héritée et l’adressage (`chat_id` préféré).

## Consignes pour les adaptateurs

- Gateway possède le processus (démarrage/arrêt liés au cycle de vie du fournisseur).
- Gardez les clients RPC résilients : délais d’expiration, redémarrage à la sortie.
- Préférez les identifiants stables (par ex., `chat_id`) aux chaînes d’affichage.

## Associé

- [Protocole Gateway](/fr/gateway/protocol)

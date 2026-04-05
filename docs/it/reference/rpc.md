---
read_when:
    - Aggiunta o modifica di integrazioni con CLI esterne
    - Debug degli adapter RPC (signal-cli, imsg)
summary: Adapter RPC per CLI esterne (signal-cli, imsg legacy) e pattern gateway
title: Adapter RPC
x-i18n:
    generated_at: "2026-04-05T14:02:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 06dc6b97184cc704ba4ec4a9af90502f4316bcf717c3f4925676806d8b184c57
    source_path: reference/rpc.md
    workflow: 15
---

# Adapter RPC

OpenClaw integra CLI esterne tramite JSON-RPC. Oggi vengono usati due pattern.

## Pattern A: daemon HTTP (signal-cli)

- `signal-cli` gira come daemon con JSON-RPC su HTTP.
- Lo stream di eventi è SSE (`/api/v1/events`).
- Probe di salute: `/api/v1/check`.
- OpenClaw gestisce il ciclo di vita quando `channels.signal.autoStart=true`.

Vedi [Signal](/it/channels/signal) per configurazione ed endpoint.

## Pattern B: processo figlio stdio (legacy: imsg)

> **Nota:** Per nuove configurazioni iMessage, usa invece [BlueBubbles](/it/channels/bluebubbles).

- OpenClaw avvia `imsg rpc` come processo figlio (integrazione iMessage legacy).
- JSON-RPC è delimitato per riga su stdin/stdout (un oggetto JSON per riga).
- Nessuna porta TCP, nessun daemon richiesto.

Metodi core usati:

- `watch.subscribe` → notifiche (`method: "message"`)
- `watch.unsubscribe`
- `send`
- `chats.list` (probe/diagnostica)

Vedi [iMessage](/it/channels/imessage) per configurazione legacy e indirizzamento (`chat_id` preferito).

## Linee guida per gli adapter

- Il gateway gestisce il processo (avvio/arresto legati al ciclo di vita del provider).
- Mantieni i client RPC resilienti: timeout, riavvio all'uscita.
- Preferisci ID stabili (ad esempio `chat_id`) invece di stringhe visualizzate.

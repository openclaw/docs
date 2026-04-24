---
read_when:
    - Aggiunta o modifica di integrazioni CLI esterne
    - Debug degli adattatori RPC (signal-cli, imsg)
summary: Adattatori RPC per CLI esterne (signal-cli, imsg legacy) e modelli Gateway
title: Adattatori RPC
x-i18n:
    generated_at: "2026-04-24T09:00:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: e35a08831db5317071aea6fc39dbf2407a7254710b2d1b751a9cc8dc4cc0d307
    source_path: reference/rpc.md
    workflow: 15
---

OpenClaw integra CLI esterne tramite JSON-RPC. Oggi vengono usati due modelli.

## Modello A: daemon HTTP (signal-cli)

- `signal-cli` viene eseguito come daemon con JSON-RPC su HTTP.
- Il flusso eventi è SSE (`/api/v1/events`).
- Probe di stato: `/api/v1/check`.
- OpenClaw possiede il ciclo di vita quando `channels.signal.autoStart=true`.

Vedi [Signal](/it/channels/signal) per configurazione ed endpoint.

## Modello B: processo figlio stdio (legacy: imsg)

> **Nota:** Per le nuove configurazioni iMessage, usa invece [BlueBubbles](/it/channels/bluebubbles).

- OpenClaw avvia `imsg rpc` come processo figlio (integrazione iMessage legacy).
- JSON-RPC è delimitato per riga su stdin/stdout (un oggetto JSON per riga).
- Nessuna porta TCP, nessun daemon richiesto.

Metodi core usati:

- `watch.subscribe` → notifiche (`method: "message"`)
- `watch.unsubscribe`
- `send`
- `chats.list` (probe/diagnostica)

Vedi [iMessage](/it/channels/imessage) per la configurazione legacy e l'indirizzamento (`chat_id` preferito).

## Linee guida per gli adattatori

- Il Gateway possiede il processo (avvio/arresto legati al ciclo di vita del provider).
- Mantieni resilienti i client RPC: timeout, riavvio all'uscita.
- Preferisci ID stabili (ad esempio `chat_id`) alle stringhe di visualizzazione.

## Correlati

- [Protocollo del Gateway](/it/gateway/protocol)

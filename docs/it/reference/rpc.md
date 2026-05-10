---
read_when:
    - Aggiunta o modifica di integrazioni CLI esterne
    - Debug degli adattatori RPC (signal-cli, imsg)
summary: Adattatori RPC per CLI esterne (signal-cli, imsg) e pattern di Gateway
title: Adattatori RPC
x-i18n:
    generated_at: "2026-05-10T19:50:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 63556f140bee55821fa0a09ff9808e163728049f8db4c58f7bb4ceca6e1cac1a
    source_path: reference/rpc.md
    workflow: 16
---

OpenClaw integra CLI esterne tramite JSON-RPC. Oggi vengono usati due modelli.

## Modello A: daemon HTTP (signal-cli)

- `signal-cli` viene eseguito come daemon con JSON-RPC su HTTP.
- Il flusso di eventi è SSE (`/api/v1/events`).
- Controllo di integrità: `/api/v1/check`.
- OpenClaw gestisce il ciclo di vita quando `channels.signal.autoStart=true`.

Vedi [Signal](/it/channels/signal) per configurazione ed endpoint.

## Modello B: processo figlio stdio (imsg)

- OpenClaw avvia `imsg rpc` come processo figlio per [iMessage](/it/channels/imessage).
- JSON-RPC è delimitato per righe su stdin/stdout (un oggetto JSON per riga).
- Nessuna porta TCP, nessun daemon richiesto.

Metodi core usati:

- `watch.subscribe` → notifiche (`method: "message"`)
- `watch.unsubscribe`
- `send`
- `chats.list` (probe/diagnostica)

Vedi [iMessage](/it/channels/imessage) per configurazione legacy e indirizzamento (`chat_id` preferito).

## Linee guida per l'adattatore

- Gateway gestisce il processo (avvio/arresto legati al ciclo di vita del provider).
- Mantieni resilienti i client RPC: timeout, riavvio all'uscita.
- Preferisci ID stabili (ad es., `chat_id`) rispetto alle stringhe di visualizzazione.

## Correlati

- [Protocollo Gateway](/it/gateway/protocol)

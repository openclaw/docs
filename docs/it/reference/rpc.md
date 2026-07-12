---
read_when:
    - Aggiunta o modifica delle integrazioni CLI esterne
    - Debug degli adattatori RPC (signal-cli, imsg)
summary: Adattatori RPC per CLI esterne (signal-cli, imsg) e pattern del Gateway
title: Adattatori RPC
x-i18n:
    generated_at: "2026-07-12T07:29:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6ddb3fb741c90fe7b01ba35376b71865584b1e507cf610705392452790fb76f5
    source_path: reference/rpc.md
    workflow: 16
---

OpenClaw integra CLI esterne tramite JSON-RPC. Attualmente vengono utilizzati due modelli.

## Modello A: daemon HTTP (signal-cli)

- `signal-cli` viene eseguito come daemon con JSON-RPC tramite HTTP.
- Il flusso di eventi usa SSE (`/api/v1/events`).
- Verifica dello stato: `/api/v1/check`.
- OpenClaw gestisce il ciclo di vita quando `channels.signal.autoStart=true`.

Consulta [Signal](/it/channels/signal) per la configurazione e gli endpoint.

## Modello B: processo figlio stdio (imsg)

- OpenClaw avvia `imsg rpc` come processo figlio per [iMessage](/it/channels/imessage).
- JSON-RPC è delimitato da righe su stdin/stdout (un oggetto JSON per riga).
- Nessuna porta TCP e nessun daemon richiesto.

Metodi principali utilizzati:

- `watch.subscribe` → notifiche (`method: "message"`)
- `watch.unsubscribe`
- `send`
- `chats.list` (verifica/diagnostica)

Consulta [iMessage](/it/channels/imessage) per la configurazione e l'indirizzamento (è preferibile `chat_id` rispetto alle stringhe visualizzate).

## Linee guida per gli adattatori

- Il Gateway gestisce il processo (avvio/arresto legati al ciclo di vita del provider).
- Mantieni resilienti i client RPC: timeout e riavvio alla terminazione.
- Preferisci ID stabili (ad esempio `chat_id`) alle stringhe visualizzate.

## Contenuti correlati

- [Protocollo del Gateway](/it/gateway/protocol)

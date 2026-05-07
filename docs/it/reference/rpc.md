---
read_when:
    - Aggiunta o modifica delle integrazioni CLI esterne
    - Debug degli adattatori RPC (signal-cli, imsg)
summary: Adattatori RPC per CLI esterne (signal-cli, imsg) e pattern del Gateway
title: Adattatori RPC
x-i18n:
    generated_at: "2026-05-07T01:53:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 446e54d736352f45e6cc6988a1835233cace7f854b6e62c64bb1fae115ce76f6
    source_path: reference/rpc.md
    workflow: 16
---

OpenClaw integra CLI esterne tramite JSON-RPC. Oggi vengono usati due modelli.

## Modello A: daemon HTTP (signal-cli)

- `signal-cli` viene eseguito come daemon con JSON-RPC su HTTP.
- Il flusso eventi è SSE (`/api/v1/events`).
- Controllo di integrità: `/api/v1/check`.
- OpenClaw gestisce il ciclo di vita quando `channels.signal.autoStart=true`.

Vedi [Signal](/it/channels/signal) per la configurazione e gli endpoint.

## Modello B: processo figlio stdio (storico: imsg)

> **Nota:** Per le nuove configurazioni di iMessage, usa invece [BlueBubbles](/it/channels/bluebubbles).

- OpenClaw avvia `imsg rpc` come processo figlio (integrazione storica di iMessage).
- JSON-RPC è delimitato da righe su stdin/stdout (un oggetto JSON per riga).
- Nessuna porta TCP, nessun daemon richiesto.

Metodi principali usati:

- `watch.subscribe` → notifiche (`method: "message"`)
- `watch.unsubscribe`
- `send`
- `chats.list` (sonda/diagnostica)

Vedi [iMessage](/it/channels/imessage) per la configurazione storica e l'indirizzamento (`chat_id` preferito).

## Linee guida per gli adapter

- Gateway gestisce il processo (avvio/arresto legati al ciclo di vita del provider).
- Mantieni i client RPC resilienti: timeout, riavvio all'uscita.
- Preferisci ID stabili (ad es., `chat_id`) rispetto alle stringhe visualizzate.

## Correlati

- [Protocollo Gateway](/it/gateway/protocol)

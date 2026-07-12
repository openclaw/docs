---
read_when:
    - Externe CLI-integraties toevoegen of wijzigen
    - RPC-adapters debuggen (signal-cli, imsg)
summary: RPC-adapters voor externe CLI's (signal-cli, imsg) en Gateway-patronen
title: RPC-adapters
x-i18n:
    generated_at: "2026-07-12T09:24:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6ddb3fb741c90fe7b01ba35376b71865584b1e507cf610705392452790fb76f5
    source_path: reference/rpc.md
    workflow: 16
---

OpenClaw integreert externe CLI's via JSON-RPC. Momenteel worden twee patronen gebruikt.

## Patroon A: HTTP-daemon (signal-cli)

- `signal-cli` draait als daemon met JSON-RPC via HTTP.
- De gebeurtenisstroom gebruikt SSE (`/api/v1/events`).
- Statuscontrole: `/api/v1/check`.
- OpenClaw beheert de levenscyclus wanneer `channels.signal.autoStart=true`.

Zie [Signal](/nl/channels/signal) voor de configuratie en eindpunten.

## Patroon B: stdio-subproces (imsg)

- OpenClaw start `imsg rpc` als subproces voor [iMessage](/nl/channels/imessage).
- JSON-RPC is regelgescheiden via stdin/stdout (één JSON-object per regel).
- Geen TCP-poort en geen daemon vereist.

Gebruikte kernmethoden:

- `watch.subscribe` → meldingen (`method: "message"`)
- `watch.unsubscribe`
- `send`
- `chats.list` (controle/diagnostiek)

Zie [iMessage](/nl/channels/imessage) voor de configuratie en adressering (`chat_id` heeft de voorkeur boven weergaveteksten).

## Richtlijnen voor adapters

- Gateway beheert het proces (starten/stoppen is gekoppeld aan de levenscyclus van de provider).
- Houd RPC-clients robuust: gebruik time-outs en herstart ze na afsluiten.
- Geef de voorkeur aan stabiele ID's (bijvoorbeeld `chat_id`) boven weergaveteksten.

## Gerelateerd

- [Gateway-protocol](/nl/gateway/protocol)

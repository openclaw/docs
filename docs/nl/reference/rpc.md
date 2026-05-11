---
read_when:
    - Externe CLI-integraties toevoegen of wijzigen
    - RPC-adapters debuggen (signal-cli, imsg)
summary: RPC-adapters voor externe CLI's (signal-cli, imsg) en Gateway-patronen
title: RPC-adapters
x-i18n:
    generated_at: "2026-05-11T20:48:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 63556f140bee55821fa0a09ff9808e163728049f8db4c58f7bb4ceca6e1cac1a
    source_path: reference/rpc.md
    workflow: 16
---

OpenClaw integreert externe CLI's via JSON-RPC. Vandaag worden twee patronen gebruikt.

## Patroon A: HTTP-daemon (signal-cli)

- `signal-cli` draait als daemon met JSON-RPC via HTTP.
- De gebeurtenisstroom is SSE (`/api/v1/events`).
- Gezondheidscontrole: `/api/v1/check`.
- OpenClaw beheert de levenscyclus wanneer `channels.signal.autoStart=true`.

Zie [Signal](/nl/channels/signal) voor installatie en eindpunten.

## Patroon B: stdio-kindproces (imsg)

- OpenClaw start `imsg rpc` als kindproces voor [iMessage](/nl/channels/imessage).
- JSON-RPC is regelgescheiden via stdin/stdout (één JSON-object per regel).
- Geen TCP-poort, geen daemon vereist.

Gebruikte kernmethoden:

- `watch.subscribe` → meldingen (`method: "message"`)
- `watch.unsubscribe`
- `send`
- `chats.list` (probe/diagnostiek)

Zie [iMessage](/nl/channels/imessage) voor legacy-installatie en adressering (`chat_id` heeft de voorkeur).

## Adapterrichtlijnen

- Gateway beheert het proces (start/stop gekoppeld aan de levenscyclus van de provider).
- Houd RPC-clients robuust: time-outs, herstarten bij afsluiten.
- Geef de voorkeur aan stabiele ID's (bijv. `chat_id`) boven weergaveteksten.

## Gerelateerd

- [Gateway-protocol](/nl/gateway/protocol)

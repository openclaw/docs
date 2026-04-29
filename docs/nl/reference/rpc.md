---
read_when:
    - Externe CLI-integraties toevoegen of wijzigen
    - RPC-adapters debuggen (signal-cli, imsg)
summary: RPC-adapters voor externe CLI's (signal-cli, verouderde imsg) en Gateway-patronen
title: RPC-adapters
x-i18n:
    generated_at: "2026-04-29T23:15:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: e35a08831db5317071aea6fc39dbf2407a7254710b2d1b751a9cc8dc4cc0d307
    source_path: reference/rpc.md
    workflow: 16
---

OpenClaw integreert externe CLI's via JSON-RPC. Er worden momenteel twee patronen gebruikt.

## Patroon A: HTTP-daemon (signal-cli)

- `signal-cli` draait als daemon met JSON-RPC via HTTP.
- De eventstream is SSE (`/api/v1/events`).
- Gezondheidscontrole: `/api/v1/check`.
- OpenClaw beheert de levenscyclus wanneer `channels.signal.autoStart=true`.

Zie [Signal](/nl/channels/signal) voor installatie en endpoints.

## Patroon B: stdio-childproces (verouderd: imsg)

> **Opmerking:** Gebruik voor nieuwe iMessage-configuraties in plaats daarvan [BlueBubbles](/nl/channels/bluebubbles).

- OpenClaw start `imsg rpc` als childproces (verouderde iMessage-integratie).
- JSON-RPC is regelgescheiden via stdin/stdout (één JSON-object per regel).
- Geen TCP-poort, geen daemon vereist.

Gebruikte kernmethoden:

- `watch.subscribe` → meldingen (`method: "message"`)
- `watch.unsubscribe`
- `send`
- `chats.list` (controle/diagnostiek)

Zie [iMessage](/nl/channels/imessage) voor verouderde installatie en adressering (`chat_id` heeft de voorkeur).

## Adapterrichtlijnen

- Gateway beheert het proces (start/stop gekoppeld aan de providerlevenscyclus).
- Houd RPC-clients robuust: time-outs, opnieuw starten bij afsluiten.
- Geef de voorkeur aan stabiele ID's (bijv. `chat_id`) boven weergaveteksten.

## Gerelateerd

- [Gateway protocol](/nl/gateway/protocol)

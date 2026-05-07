---
read_when:
    - Externe CLI-integraties toevoegen of wijzigen
    - Debuggen van RPC-adapters (signal-cli, imsg)
summary: RPC-adapters voor externe CLI's (signal-cli, imsg) en Gateway-patronen
title: RPC-adapters
x-i18n:
    generated_at: "2026-05-07T01:53:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 446e54d736352f45e6cc6988a1835233cace7f854b6e62c64bb1fae115ce76f6
    source_path: reference/rpc.md
    workflow: 16
---

OpenClaw integreert externe CLI's via JSON-RPC. Tegenwoordig worden twee patronen gebruikt.

## Patroon A: HTTP-daemon (signal-cli)

- `signal-cli` draait als daemon met JSON-RPC via HTTP.
- De gebeurtenisstroom is SSE (`/api/v1/events`).
- Statuscontrole: `/api/v1/check`.
- OpenClaw beheert de levenscyclus wanneer `channels.signal.autoStart=true`.

Zie [Signal](/nl/channels/signal) voor configuratie en eindpunten.

## Patroon B: stdio-childproces (verouderd: imsg)

> **Opmerking:** Gebruik voor nieuwe iMessage-configuraties in plaats daarvan [BlueBubbles](/nl/channels/bluebubbles).

- OpenClaw start `imsg rpc` als childproces (verouderde iMessage-integratie).
- JSON-RPC is regelgescheiden via stdin/stdout (één JSON-object per regel).
- Geen TCP-poort, geen daemon vereist.

Gebruikte kernmethoden:

- `watch.subscribe` → meldingen (`method: "message"`)
- `watch.unsubscribe`
- `send`
- `chats.list` (probe/diagnostiek)

Zie [iMessage](/nl/channels/imessage) voor verouderde configuratie en adressering (`chat_id` aanbevolen).

## Adapterrichtlijnen

- Gateway beheert het proces (start/stop gekoppeld aan de providerlevenscyclus).
- Houd RPC-clients veerkrachtig: time-outs, herstarten bij afsluiten.
- Geef de voorkeur aan stabiele ID's (bijv. `chat_id`) boven weergavestrings.

## Gerelateerd

- [Gateway-protocol](/nl/gateway/protocol)

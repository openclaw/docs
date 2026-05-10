---
read_when:
    - Externe CLI-Integrationen hinzufügen oder ändern
    - RPC-Adapter debuggen (signal-cli, imsg)
summary: RPC-Adapter für externe CLIs (signal-cli, imsg) und Gateway-Muster
title: RPC-Adapter
x-i18n:
    generated_at: "2026-05-10T19:51:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 63556f140bee55821fa0a09ff9808e163728049f8db4c58f7bb4ceca6e1cac1a
    source_path: reference/rpc.md
    workflow: 16
---

OpenClaw integriert externe CLIs über JSON-RPC. Heute werden zwei Muster verwendet.

## Muster A: HTTP-Daemon (signal-cli)

- `signal-cli` läuft als Daemon mit JSON-RPC über HTTP.
- Der Ereignisstream ist SSE (`/api/v1/events`).
- Health-Probe: `/api/v1/check`.
- OpenClaw verwaltet den Lebenszyklus, wenn `channels.signal.autoStart=true`.

Siehe [Signal](/de/channels/signal) für Einrichtung und Endpunkte.

## Muster B: stdio-Kindprozess (imsg)

- OpenClaw startet `imsg rpc` als Kindprozess für [iMessage](/de/channels/imessage).
- JSON-RPC ist zeilengetrennt über stdin/stdout (ein JSON-Objekt pro Zeile).
- Kein TCP-Port, kein Daemon erforderlich.

Verwendete Kernmethoden:

- `watch.subscribe` → Benachrichtigungen (`method: "message"`)
- `watch.unsubscribe`
- `send`
- `chats.list` (Probe/Diagnose)

Siehe [iMessage](/de/channels/imessage) für Legacy-Einrichtung und Adressierung (`chat_id` bevorzugt).

## Adapter-Richtlinien

- Gateway verwaltet den Prozess (Start/Stopp an den Provider-Lebenszyklus gebunden).
- Halten Sie RPC-Clients resilient: Timeouts, Neustart beim Beenden.
- Bevorzugen Sie stabile IDs (z. B. `chat_id`) gegenüber Anzeigezeichenfolgen.

## Verwandt

- [Gateway-Protokoll](/de/gateway/protocol)

---
read_when:
    - Hinzufügen oder Ändern externer CLI-Integrationen
    - Fehlersuche bei RPC-Adaptern (signal-cli, imsg)
summary: RPC-Adapter für externe CLIs (signal-cli, imsg) und Gateway-Muster
title: RPC-Adapter
x-i18n:
    generated_at: "2026-05-07T01:53:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 446e54d736352f45e6cc6988a1835233cace7f854b6e62c64bb1fae115ce76f6
    source_path: reference/rpc.md
    workflow: 16
---

OpenClaw integriert externe CLIs über JSON-RPC. Derzeit werden zwei Muster verwendet.

## Muster A: HTTP-Daemon (signal-cli)

- `signal-cli` läuft als Daemon mit JSON-RPC über HTTP.
- Der Ereignisstream ist SSE (`/api/v1/events`).
- Health-Probe: `/api/v1/check`.
- OpenClaw besitzt den Lebenszyklus, wenn `channels.signal.autoStart=true`.

Siehe [Signal](/de/channels/signal) für Einrichtung und Endpunkte.

## Muster B: stdio-Kindprozess (Legacy: imsg)

> **Hinweis:** Für neue iMessage-Einrichtungen verwenden Sie stattdessen [BlueBubbles](/de/channels/bluebubbles).

- OpenClaw startet `imsg rpc` als Kindprozess (Legacy-iMessage-Integration).
- JSON-RPC ist zeilengetrennt über stdin/stdout (ein JSON-Objekt pro Zeile).
- Kein TCP-Port, kein Daemon erforderlich.

Verwendete Kernmethoden:

- `watch.subscribe` → Benachrichtigungen (`method: "message"`)
- `watch.unsubscribe`
- `send`
- `chats.list` (Probe/Diagnose)

Siehe [iMessage](/de/channels/imessage) für Legacy-Einrichtung und Adressierung (`chat_id` bevorzugt).

## Adapter-Richtlinien

- Gateway besitzt den Prozess (Start/Stopp ist an den Provider-Lebenszyklus gebunden).
- Halten Sie RPC-Clients robust: Timeouts, Neustart beim Beenden.
- Bevorzugen Sie stabile IDs (z. B. `chat_id`) gegenüber Anzeigezeichenfolgen.

## Verwandt

- [Gateway-Protokoll](/de/gateway/protocol)

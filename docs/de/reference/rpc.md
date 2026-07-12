---
read_when:
    - Externe CLI-Integrationen hinzufügen oder ändern
    - Debugging von RPC-Adaptern (signal-cli, imsg)
summary: RPC-Adapter für externe CLIs (signal-cli, imsg) und Gateway-Muster
title: RPC-Adapteren
x-i18n:
    generated_at: "2026-07-12T15:52:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 6ddb3fb741c90fe7b01ba35376b71865584b1e507cf610705392452790fb76f5
    source_path: reference/rpc.md
    workflow: 16
---

OpenClaw integriert externe CLIs über JSON-RPC. Derzeit werden zwei Muster verwendet.

## Muster A: HTTP-Daemon (signal-cli)

- `signal-cli` wird als Daemon mit JSON-RPC über HTTP ausgeführt.
- Der Ereignisstream verwendet SSE (`/api/v1/events`).
- Zustandsprüfung: `/api/v1/check`.
- OpenClaw verwaltet den Lebenszyklus, wenn `channels.signal.autoStart=true` festgelegt ist.

Einrichtung und Endpunkte finden Sie unter [Signal](/de/channels/signal).

## Muster B: Untergeordneter stdio-Prozess (imsg)

- OpenClaw startet `imsg rpc` als untergeordneten Prozess für [iMessage](/de/channels/imessage).
- JSON-RPC wird zeilenweise über stdin/stdout übertragen (ein JSON-Objekt pro Zeile).
- Kein TCP-Port und kein Daemon erforderlich.

Verwendete Kernmethoden:

- `watch.subscribe` → Benachrichtigungen (`method: "message"`)
- `watch.unsubscribe`
- `send`
- `chats.list` (Prüfung/Diagnose)

Einrichtung und Adressierung finden Sie unter [iMessage](/de/channels/imessage) (`chat_id` wird gegenüber Anzeigenamen bevorzugt).

## Richtlinien für Adapter

- Der Gateway verwaltet den Prozess (Start/Stopp sind an den Lebenszyklus des Providers gekoppelt).
- Gestalten Sie RPC-Clients robust: Zeitüberschreitungen und Neustart beim Beenden.
- Bevorzugen Sie stabile IDs (z. B. `chat_id`) gegenüber Anzeigenamen.

## Verwandte Themen

- [Gateway-Protokoll](/de/gateway/protocol)

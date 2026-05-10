---
read_when:
    - Dodawanie lub modyfikowanie zewnętrznych integracji CLI
    - Debugowanie adapterów RPC (signal-cli, imsg)
summary: Adaptery RPC dla zewnętrznych CLI (signal-cli, imsg) i wzorce Gateway
title: Adaptery RPC
x-i18n:
    generated_at: "2026-05-10T19:53:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 63556f140bee55821fa0a09ff9808e163728049f8db4c58f7bb4ceca6e1cac1a
    source_path: reference/rpc.md
    workflow: 16
---

OpenClaw integruje zewnętrzne CLI przez JSON-RPC. Obecnie używane są dwa wzorce.

## Wzorzec A: demon HTTP (signal-cli)

- `signal-cli` działa jako demon z JSON-RPC przez HTTP.
- Strumień zdarzeń to SSE (`/api/v1/events`).
- Sonda kondycji: `/api/v1/check`.
- OpenClaw zarządza cyklem życia, gdy `channels.signal.autoStart=true`.

Zobacz [Signal](/pl/channels/signal), aby poznać konfigurację i punkty końcowe.

## Wzorzec B: proces potomny stdio (imsg)

- OpenClaw uruchamia `imsg rpc` jako proces potomny dla [iMessage](/pl/channels/imessage).
- JSON-RPC jest rozdzielany wierszami przez stdin/stdout (jeden obiekt JSON na wiersz).
- Nie jest wymagany port TCP ani demon.

Używane metody bazowe:

- `watch.subscribe` → powiadomienia (`method: "message"`)
- `watch.unsubscribe`
- `send`
- `chats.list` (sonda/diagnostyka)

Zobacz [iMessage](/pl/channels/imessage), aby poznać starszą konfigurację i adresowanie (preferowane `chat_id`).

## Wytyczne dotyczące adapterów

- Gateway zarządza procesem (uruchamianie/zatrzymywanie powiązane z cyklem życia dostawcy).
- Dbaj o odporność klientów RPC: limity czasu, ponowne uruchamianie po zakończeniu.
- Preferuj stabilne identyfikatory (np. `chat_id`) zamiast ciągów wyświetlanych.

## Powiązane

- [Protokół Gateway](/pl/gateway/protocol)

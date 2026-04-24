---
read_when:
    - Dodawanie lub zmiana integracji zewnętrznych CLI
    - Debugowanie adapterów RPC (`signal-cli`, `imsg`)
summary: Adaptery RPC dla zewnętrznych CLI (`signal-cli`, legacy `imsg`) i wzorce gateway
title: Adaptery RPC
x-i18n:
    generated_at: "2026-04-24T09:31:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: e35a08831db5317071aea6fc39dbf2407a7254710b2d1b751a9cc8dc4cc0d307
    source_path: reference/rpc.md
    workflow: 15
---

OpenClaw integruje zewnętrzne CLI przez JSON-RPC. Obecnie używane są dwa wzorce.

## Wzorzec A: daemon HTTP (`signal-cli`)

- `signal-cli` działa jako daemon z JSON-RPC przez HTTP.
- Strumień zdarzeń to SSE (`/api/v1/events`).
- Health probe: `/api/v1/check`.
- OpenClaw zarządza cyklem życia, gdy `channels.signal.autoStart=true`.

Konfigurację i punkty końcowe znajdziesz w [Signal](/pl/channels/signal).

## Wzorzec B: proces potomny stdio (legacy: `imsg`)

> **Note:** W przypadku nowych konfiguracji iMessage używaj zamiast tego [BlueBubbles](/pl/channels/bluebubbles).

- OpenClaw uruchamia `imsg rpc` jako proces potomny (starsza integracja iMessage).
- JSON-RPC jest rozdzielane wierszami przez stdin/stdout (jeden obiekt JSON na wiersz).
- Brak portu TCP, daemon nie jest wymagany.

Używane metody rdzenia:

- `watch.subscribe` → powiadomienia (`method: "message"`)
- `watch.unsubscribe`
- `send`
- `chats.list` (probe/diagnostyka)

Konfigurację legacy i adresowanie (`chat_id` preferowane) znajdziesz w [iMessage](/pl/channels/imessage).

## Wskazówki dotyczące adapterów

- Gateway jest właścicielem procesu (start/stop powiązane z cyklem życia providera).
- Utrzymuj klientów RPC odpornych: limity czasu, restart po zakończeniu procesu.
- Preferuj stabilne identyfikatory (np. `chat_id`) zamiast ciągów wyświetlanych.

## Powiązane

- [Protokół Gateway](/pl/gateway/protocol)

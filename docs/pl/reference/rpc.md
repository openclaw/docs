---
read_when:
    - Dodawanie lub zmienianie zewnętrznych integracji CLI
    - Debugowanie adapterów RPC (signal-cli, imsg)
summary: Adaptery RPC dla zewnętrznych CLI (signal-cli, imsg) i wzorce Gateway
title: Adaptery RPC
x-i18n:
    generated_at: "2026-05-07T01:54:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 446e54d736352f45e6cc6988a1835233cace7f854b6e62c64bb1fae115ce76f6
    source_path: reference/rpc.md
    workflow: 16
---

OpenClaw integruje zewnętrzne narzędzia CLI przez JSON-RPC. Obecnie używane są dwa wzorce.

## Wzorzec A: demon HTTP (signal-cli)

- `signal-cli` działa jako demon z JSON-RPC przez HTTP.
- Strumień zdarzeń to SSE (`/api/v1/events`).
- Sonda kondycji: `/api/v1/check`.
- OpenClaw zarządza cyklem życia, gdy `channels.signal.autoStart=true`.

Zobacz [Signal](/pl/channels/signal), aby poznać konfigurację i punkty końcowe.

## Wzorzec B: proces potomny stdio (starsze: imsg)

> **Uwaga:** W nowych konfiguracjach iMessage używaj zamiast tego [BlueBubbles](/pl/channels/bluebubbles).

- OpenClaw uruchamia `imsg rpc` jako proces potomny (starsza integracja iMessage).
- JSON-RPC jest rozdzielany wierszami przez stdin/stdout (jeden obiekt JSON na wiersz).
- Brak portu TCP, demon nie jest wymagany.

Używane metody rdzenia:

- `watch.subscribe` → powiadomienia (`method: "message"`)
- `watch.unsubscribe`
- `send`
- `chats.list` (sonda/diagnostyka)

Zobacz [iMessage](/pl/channels/imessage), aby poznać starszą konfigurację i adresowanie (preferowane `chat_id`).

## Wytyczne dotyczące adapterów

- Gateway zarządza procesem (start/stop powiązane z cyklem życia dostawcy).
- Klienty RPC powinny być odporne: limity czasu, ponowne uruchamianie po zakończeniu.
- Preferuj stabilne identyfikatory (np. `chat_id`) zamiast wyświetlanych ciągów znaków.

## Powiązane

- [Protokół Gateway](/pl/gateway/protocol)

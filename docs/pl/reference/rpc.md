---
read_when:
    - Dodawanie lub zmienianie integracji z zewnętrznym CLI
    - Debugowanie adapterów RPC (signal-cli, imsg)
summary: Adaptery RPC dla zewnętrznych narzędzi CLI (signal-cli, imsg) i wzorce Gateway
title: Adaptery RPC
x-i18n:
    generated_at: "2026-07-12T15:34:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6ddb3fb741c90fe7b01ba35376b71865584b1e507cf610705392452790fb76f5
    source_path: reference/rpc.md
    workflow: 16
---

OpenClaw integruje zewnętrzne narzędzia CLI za pośrednictwem JSON-RPC. Obecnie używane są dwa wzorce.

## Wzorzec A: demon HTTP (signal-cli)

- `signal-cli` działa jako demon z JSON-RPC przez HTTP.
- Strumień zdarzeń korzysta z SSE (`/api/v1/events`).
- Sonda stanu: `/api/v1/check`.
- OpenClaw zarządza cyklem życia, gdy `channels.signal.autoStart=true`.

Instrukcje konfiguracji i punkty końcowe opisano w sekcji [Signal](/pl/channels/signal).

## Wzorzec B: proces potomny stdio (imsg)

- OpenClaw uruchamia `imsg rpc` jako proces potomny dla [iMessage](/pl/channels/imessage).
- Komunikaty JSON-RPC są rozdzielane wierszami i przesyłane przez stdin/stdout (jeden obiekt JSON w każdym wierszu).
- Nie jest wymagany port TCP ani demon.

Używane metody podstawowe:

- `watch.subscribe` → powiadomienia (`method: "message"`)
- `watch.unsubscribe`
- `send`
- `chats.list` (sonda/diagnostyka)

Instrukcje konfiguracji i adresowania opisano w sekcji [iMessage](/pl/channels/imessage) (preferowany jest `chat_id` zamiast wyświetlanych ciągów znaków).

## Wytyczne dotyczące adapterów

- Gateway zarządza procesem (uruchamianie i zatrzymywanie jest powiązane z cyklem życia dostawcy).
- Klienci RPC powinni być odporni na błędy: stosuj limity czasu i ponowne uruchamianie po zakończeniu procesu.
- Preferuj stabilne identyfikatory (np. `chat_id`) zamiast wyświetlanych ciągów znaków.

## Powiązane materiały

- [Protokół Gateway](/pl/gateway/protocol)

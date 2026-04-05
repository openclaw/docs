---
read_when:
    - Dodajesz lub zmieniasz integracje z zewnętrznymi CLI
    - Debugujesz adaptery RPC (`signal-cli`, `imsg`)
summary: Adaptery RPC dla zewnętrznych CLI (`signal-cli`, starszy `imsg`) i wzorce gateway
title: Adaptery RPC
x-i18n:
    generated_at: "2026-04-05T14:04:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 06dc6b97184cc704ba4ec4a9af90502f4316bcf717c3f4925676806d8b184c57
    source_path: reference/rpc.md
    workflow: 15
---

# Adaptery RPC

OpenClaw integruje zewnętrzne CLI przez JSON-RPC. Obecnie używane są dwa wzorce.

## Wzorzec A: demon HTTP (`signal-cli`)

- `signal-cli` działa jako demon z JSON-RPC przez HTTP.
- Strumień zdarzeń to SSE (`/api/v1/events`).
- Sonda health: `/api/v1/check`.
- OpenClaw zarządza cyklem życia, gdy `channels.signal.autoStart=true`.

Konfigurację i endpointy znajdziesz w [Signal](/channels/signal).

## Wzorzec B: proces potomny stdio (starszy: `imsg`)

> **Uwaga:** dla nowych konfiguracji iMessage użyj zamiast tego [BlueBubbles](/pl/channels/bluebubbles).

- OpenClaw uruchamia `imsg rpc` jako proces potomny (starsza integracja iMessage).
- JSON-RPC jest rozdzielany liniami przez stdin/stdout (jeden obiekt JSON na linię).
- Brak portu TCP, demon nie jest wymagany.

Używane główne metody:

- `watch.subscribe` → powiadomienia (`method: "message"`)
- `watch.unsubscribe`
- `send`
- `chats.list` (sonda / diagnostyka)

Szczegóły starszej konfiguracji i adresowania (`chat_id` preferowane) znajdziesz w [iMessage](/pl/channels/imessage).

## Wytyczne dla adapterów

- Gateway zarządza procesem (uruchamianie/zatrzymywanie powiązane z cyklem życia dostawcy).
- Utrzymuj klientów RPC odpornych na problemy: timeouty, restart po wyjściu.
- Preferuj stabilne identyfikatory (np. `chat_id`) zamiast ciągów wyświetlanych.

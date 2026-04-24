---
read_when:
    - Musisz zdalnie śledzić logi Gateway (bez SSH)
    - Chcesz wiersze logów JSON dla narzędzi
summary: Dokumentacja CLI dla `openclaw logs` (śledzenie logów gateway przez RPC)
title: Logi
x-i18n:
    generated_at: "2026-04-24T09:03:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 94dddb9fd507c2f1d885c5cf92b78fd381355481317bf6f56b794afbd387f402
    source_path: cli/logs.md
    workflow: 15
---

# `openclaw logs`

Śledź logi plików Gateway przez RPC (działa w trybie zdalnym).

Powiązane:

- Przegląd logowania: [Logowanie](/pl/logging)
- CLI Gateway: [gateway](/pl/cli/gateway)

## Opcje

- `--limit <n>`: maksymalna liczba wierszy logu do zwrócenia (domyślnie `200`)
- `--max-bytes <n>`: maksymalna liczba bajtów do odczytu z pliku logu (domyślnie `250000`)
- `--follow`: śledź strumień logów
- `--interval <ms>`: interwał odpytywania podczas śledzenia (domyślnie `1000`)
- `--json`: emituj zdarzenia JSON rozdzielane wierszami
- `--plain`: zwykłe dane wyjściowe tekstowe bez stylizowanego formatowania
- `--no-color`: wyłącz kolory ANSI
- `--local-time`: renderuj znaczniki czasu w lokalnej strefie czasowej

## Wspólne opcje RPC Gateway

`openclaw logs` akceptuje także standardowe flagi klienta Gateway:

- `--url <url>`: URL WebSocket Gateway
- `--token <token>`: token Gateway
- `--timeout <ms>`: limit czasu w ms (domyślnie `30000`)
- `--expect-final`: czekaj na końcową odpowiedź, gdy wywołanie Gateway jest obsługiwane przez agenta

Gdy przekażesz `--url`, CLI nie stosuje automatycznie poświadczeń z konfiguracji ani środowiska. Dodaj jawnie `--token`, jeśli docelowy Gateway wymaga uwierzytelniania.

## Przykłady

```bash
openclaw logs
openclaw logs --follow
openclaw logs --follow --interval 2000
openclaw logs --limit 500 --max-bytes 500000
openclaw logs --json
openclaw logs --plain
openclaw logs --no-color
openclaw logs --limit 500
openclaw logs --local-time
openclaw logs --follow --local-time
openclaw logs --url ws://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
```

## Uwagi

- Użyj `--local-time`, aby renderować znaczniki czasu w lokalnej strefie czasowej.
- Jeśli lokalny Gateway local loopback poprosi o parowanie, `openclaw logs` automatycznie wraca do skonfigurowanego lokalnego pliku logu. Jawne cele `--url` nie używają tego fallbacku.

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Logowanie Gateway](/pl/gateway/logging)

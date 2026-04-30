---
read_when:
    - Musisz zdalnie śledzić logi Gateway (bez SSH)
    - Potrzebujesz linii logów JSON dla narzędzi
summary: Dokumentacja referencyjna CLI dla `openclaw logs` (wyświetlanie na bieżąco logów Gateway przez RPC)
title: Dzienniki
x-i18n:
    generated_at: "2026-04-30T09:43:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0f9268fefa4d0e54297fd12c5cef30a1465bd735ae6a36292c279a438285f2b8
    source_path: cli/logs.md
    workflow: 16
---

# `openclaw logs`

Wyświetla końcowe wpisy logu plikowego Gateway przez RPC (działa w trybie zdalnym).

Powiązane:

- Omówienie logowania: [Logowanie](/pl/logging)
- CLI Gateway: [gateway](/pl/cli/gateway)

## Opcje

- `--limit <n>`: maksymalna liczba wierszy logu do zwrócenia (domyślnie `200`)
- `--max-bytes <n>`: maksymalna liczba bajtów do odczytania z pliku logu (domyślnie `250000`)
- `--follow`: śledź strumień logu
- `--interval <ms>`: interwał odpytywania podczas śledzenia (domyślnie `1000`)
- `--json`: emituj zdarzenia JSON rozdzielane wierszami
- `--plain`: wyjście zwykłym tekstem bez stylizowanego formatowania
- `--no-color`: wyłącz kolory ANSI
- `--local-time`: renderuj znaczniki czasu w lokalnej strefie czasowej

## Współdzielone opcje RPC Gateway

`openclaw logs` akceptuje także standardowe flagi klienta Gateway:

- `--url <url>`: URL WebSocket Gateway
- `--token <token>`: token Gateway
- `--timeout <ms>`: limit czasu w ms (domyślnie `30000`)
- `--expect-final`: czekaj na końcową odpowiedź, gdy wywołanie Gateway jest obsługiwane przez agenta

Gdy przekażesz `--url`, CLI nie stosuje automatycznie konfiguracji ani poświadczeń ze środowiska. Dołącz jawnie `--token`, jeśli docelowy Gateway wymaga uwierzytelniania.

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
- Jeśli niejawny Gateway local loopback poprosi o parowanie, zamknie połączenie podczas łączenia albo przekroczy limit czasu, zanim `logs.tail` odpowie, `openclaw logs` automatycznie przełączy się na skonfigurowany plik logu Gateway. Jawne cele `--url` nie używają tego mechanizmu awaryjnego.

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Logowanie Gateway](/pl/gateway/logging)

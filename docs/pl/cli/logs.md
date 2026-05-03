---
read_when:
    - Musisz zdalnie śledzić logi Gateway (bez SSH)
    - Potrzebujesz wierszy logu JSON dla narzędzi
summary: Dokumentacja referencyjna CLI dla `openclaw logs` (śledzenie logów Gateway za pomocą RPC)
title: Dzienniki
x-i18n:
    generated_at: "2026-05-03T21:28:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 89753a18e31cd643e19db80b6cef4ecac1aae0733e68d6c678e6419e28bd270e
    source_path: cli/logs.md
    workflow: 16
---

# `openclaw logs`

Śledź logi plikowe Gateway przez RPC (działa w trybie zdalnym).

Powiązane:

- Omówienie logowania: [Logowanie](/pl/logging)
- CLI Gateway: [gateway](/pl/cli/gateway)

## Opcje

- `--limit <n>`: maksymalna liczba wierszy logów do zwrócenia (domyślnie `200`)
- `--max-bytes <n>`: maksymalna liczba bajtów do odczytania z pliku logu (domyślnie `250000`)
- `--follow`: śledź strumień logów
- `--interval <ms>`: interwał odpytywania podczas śledzenia (domyślnie `1000`)
- `--json`: emituj zdarzenia JSON rozdzielane wierszami
- `--plain`: wyjście zwykłym tekstem bez stylizowanego formatowania
- `--no-color`: wyłącz kolory ANSI
- `--local-time`: renderuj znaczniki czasu w lokalnej strefie czasowej

## Współdzielone opcje RPC Gateway

`openclaw logs` akceptuje także standardowe flagi klienta Gateway:

- `--url <url>`: adres URL WebSocket Gateway
- `--token <token>`: token Gateway
- `--timeout <ms>`: limit czasu w ms (domyślnie `30000`)
- `--expect-final`: czekaj na końcową odpowiedź, gdy wywołanie Gateway jest obsługiwane przez agenta

Gdy przekażesz `--url`, CLI nie stosuje automatycznie poświadczeń z konfiguracji ani środowiska. Podaj `--token` jawnie, jeśli docelowy Gateway wymaga uwierzytelnienia.

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
- Jeśli niejawny lokalny local loopback Gateway poprosi o parowanie, zamknie połączenie podczas łączenia albo przekroczy limit czasu, zanim `logs.tail` odpowie, `openclaw logs` automatycznie przełączy się na skonfigurowany plik logu Gateway. Jawne cele `--url` nie używają tego mechanizmu awaryjnego.
- Podczas używania `--follow` przejściowe rozłączenia gateway (zamknięcie WebSocket, przekroczenie limitu czasu, zerwanie połączenia) wyzwalają automatyczne ponowne połączenie z wykładniczym opóźnieniem (do 8 ponowień, z limitem 30 s między próbami). Przy każdej ponownej próbie ostrzeżenie jest wypisywane do stderr, a po udanym odpytywaniu wypisywany jest komunikat `[logs] gateway reconnected`. W trybie `--json` zarówno ostrzeżenie o ponownej próbie, jak i przejście po ponownym połączeniu są emitowane jako rekordy `{"type":"notice"}` do stderr. Błędy nienaprawialne (błąd uwierzytelniania, zła konfiguracja) nadal powodują natychmiastowe zakończenie.

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Logowanie Gateway](/pl/gateway/logging)

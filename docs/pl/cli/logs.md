---
read_when:
    - Musisz zdalnie śledzić logi Gateway (bez SSH)
    - Potrzebujesz wierszy logów JSON na potrzeby narzędzi
summary: Dokumentacja referencyjna CLI dla `openclaw logs` (śledzenie logów Gateway przez RPC)
title: Logi
x-i18n:
    generated_at: "2026-05-03T09:44:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: a0d3d8cf986d169d484ab80e064383f037688d8d7e9a0def0daeebddf09e95af
    source_path: cli/logs.md
    workflow: 16
---

# `openclaw logs`

Śledź dzienniki plikowe Gateway przez RPC (działa w trybie zdalnym).

Powiązane:

- Omówienie rejestrowania: [Rejestrowanie](/pl/logging)
- CLI Gateway: [gateway](/pl/cli/gateway)

## Opcje

- `--limit <n>`: maksymalna liczba wierszy dziennika do zwrócenia (domyślnie `200`)
- `--max-bytes <n>`: maksymalna liczba bajtów do odczytania z pliku dziennika (domyślnie `250000`)
- `--follow`: śledź strumień dziennika
- `--interval <ms>`: interwał odpytywania podczas śledzenia (domyślnie `1000`)
- `--json`: emituj zdarzenia JSON rozdzielane wierszami
- `--plain`: wyjście w postaci zwykłego tekstu bez formatowania stylizowanego
- `--no-color`: wyłącz kolory ANSI
- `--local-time`: renderuj znaczniki czasu w lokalnej strefie czasowej

## Wspólne opcje RPC Gateway

`openclaw logs` akceptuje także standardowe flagi klienta Gateway:

- `--url <url>`: URL WebSocket Gateway
- `--token <token>`: token Gateway
- `--timeout <ms>`: limit czasu w ms (domyślnie `30000`)
- `--expect-final`: czekaj na odpowiedź końcową, gdy wywołanie Gateway jest obsługiwane przez agenta

Gdy przekażesz `--url`, CLI nie stosuje automatycznie konfiguracji ani poświadczeń środowiskowych. Dołącz jawnie `--token`, jeśli docelowy Gateway wymaga uwierzytelniania.

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
- Jeśli niejawny local loopback Gateway poprosi o parowanie, zamknie połączenie podczas łączenia albo przekroczy limit czasu, zanim `logs.tail` odpowie, `openclaw logs` automatycznie przełączy się na skonfigurowany plik dziennika Gateway. Jawne cele `--url` nie używają tego mechanizmu awaryjnego.
- Podczas używania `--follow` przejściowe rozłączenia Gateway (zamknięcie WebSocket, przekroczenie limitu czasu, zerwanie połączenia) wyzwalają automatyczne ponowne połączenie z wykładniczym opóźnieniem (do 8 prób, z limitem 30 s między próbami). Przy każdej ponownej próbie ostrzeżenie jest wypisywane do stderr. Błędy nieodwracalne (niepowodzenie uwierzytelniania, błędna konfiguracja) nadal powodują natychmiastowe zakończenie.

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Rejestrowanie Gateway](/pl/gateway/logging)

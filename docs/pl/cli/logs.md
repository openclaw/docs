---
read_when:
    - Musisz zdalnie śledzić logi Gateway (bez SSH)
    - Chcesz wierszy dziennika JSON dla narzędzi
summary: Dokumentacja CLI dla `openclaw logs` (śledzenie logów Gateway przez RPC)
title: Dzienniki
x-i18n:
    generated_at: "2026-06-27T17:21:05Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3835880c0919d4c0c67bd3b371f9f8b0f396b80a9456c545ea0caa064a6361c0
    source_path: cli/logs.md
    workflow: 16
---

# `openclaw logs`

Wyświetlaj na bieżąco logi pliku Gateway przez RPC (działa w trybie zdalnym).

Powiązane:

- Omówienie logowania: [Logowanie](/pl/logging)
- CLI Gateway: [gateway](/pl/cli/gateway)

## Opcje

- `--limit <n>`: maksymalna liczba wierszy logu do zwrócenia (domyślnie `200`)
- `--max-bytes <n>`: maksymalna liczba bajtów do odczytania z pliku logu (domyślnie `250000`)
- `--follow`: śledź strumień logów
- `--interval <ms>`: interwał odpytywania podczas śledzenia (domyślnie `1000`)
- `--json`: emituj zdarzenia JSON rozdzielane wierszami
- `--plain`: zwykłe wyjście tekstowe bez formatowania stylami
- `--no-color`: wyłącz kolory ANSI
- `--local-time`: renderuj znaczniki czasu w lokalnej strefie czasowej (domyślnie)
- `--utc`: renderuj znaczniki czasu w UTC

## Wspólne opcje RPC Gateway

`openclaw logs` akceptuje również standardowe flagi klienta Gateway:

- `--url <url>`: URL WebSocket Gateway
- `--token <token>`: token Gateway
- `--timeout <ms>`: limit czasu w ms (domyślnie `30000`)
- `--expect-final`: czekaj na odpowiedź końcową, gdy wywołanie Gateway jest obsługiwane przez agenta

Gdy przekazujesz `--url`, CLI nie stosuje automatycznie danych uwierzytelniających z konfiguracji ani środowiska. Dołącz jawnie `--token`, jeśli docelowy Gateway wymaga uwierzytelnienia.

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
openclaw logs --utc
openclaw logs --follow --local-time
openclaw logs --url ws://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
```

## Uwagi

- Znaczniki czasu są domyślnie renderowane w lokalnej strefie czasowej. Użyj `--utc`, aby uzyskać wyjście w UTC.
- Jeśli niejawny local loopback Gateway poprosi o parowanie, zamknie połączenie podczas łączenia albo przekroczy limit czasu, zanim `logs.tail` odpowie, `openclaw logs` automatycznie przełączy się na skonfigurowany plik logu Gateway. Jawne cele `--url` nie używają tego mechanizmu awaryjnego.
- `openclaw logs --follow` nie śledzi skonfigurowanych plików awaryjnych po niepowodzeniach RPC niejawnego lokalnego Gateway. W systemie Linux używa aktywnego dziennika Gateway użytkownika systemd według PID, gdy jest dostępny, i wypisuje wybrane źródło logów; w przeciwnym razie nadal ponawia próby z aktywnym Gateway zamiast śledzić potencjalnie nieaktualny plik obok.
- Podczas używania `--follow` przejściowe rozłączenia gateway (zamknięcie WebSocket, przekroczenie limitu czasu, zerwanie połączenia) wyzwalają automatyczne ponowne łączenie z wykładniczym opóźnieniem (do 8 ponowień, z limitem 30 s między próbami). Przy każdej ponownej próbie ostrzeżenie jest wypisywane na stderr, a po udanym odpytywaniu wypisywana jest informacja `[logs] gateway reconnected`. W trybie `--json` zarówno ostrzeżenie o ponowieniu, jak i przejście po ponownym połączeniu są emitowane jako rekordy `{"type":"notice"}` na stderr. Błędy niemożliwe do odzyskania (niepowodzenie uwierzytelniania, nieprawidłowa konfiguracja) nadal powodują natychmiastowe zakończenie.

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Logowanie Gateway](/pl/gateway/logging)

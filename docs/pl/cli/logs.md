---
read_when:
    - Musisz zdalnie śledzić logi Gateway (bez SSH)
    - Chcesz wierszy logów JSON dla narzędzi
summary: Informacje referencyjne CLI dla `openclaw logs` (śledzenie logów gateway przez RPC)
title: Logi
x-i18n:
    generated_at: "2026-07-01T15:32:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c2cc14132d46b60fd323b40dad3c524b6eef40b940bb98d4b445d03782e0ea07
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
- `--plain`: zwykłe wyjście tekstowe bez stylizowanego formatowania
- `--no-color`: wyłącz kolory ANSI
- `--local-time`: renderuj znaczniki czasu w lokalnej strefie czasowej (domyślnie)
- `--utc`: renderuj znaczniki czasu w UTC

## Współdzielone opcje RPC Gateway

`openclaw logs` akceptuje także standardowe flagi klienta Gateway:

- `--url <url>`: URL WebSocket Gateway
- `--token <token>`: token Gateway
- `--timeout <ms>`: limit czasu w ms (domyślnie `30000`)
- `--expect-final`: czekaj na końcową odpowiedź, gdy wywołanie Gateway jest obsługiwane przez agenta

Gdy przekażesz `--url`, CLI nie stosuje automatycznie poświadczeń z konfiguracji ani środowiska. Dołącz jawnie `--token`, jeśli docelowy Gateway wymaga uwierzytelniania.

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
- Jeśli niejawny lokalny Gateway local loopback poprosi o parowanie, zamknie połączenie podczas łączenia albo przekroczy limit czasu, zanim `logs.tail` odpowie, `openclaw logs` automatycznie przełączy się na skonfigurowany plik logu Gateway. Jawne cele `--url` nie używają tego przełączenia awaryjnego.
- `openclaw logs --follow` nie śledzi skonfigurowanych plikowych przełączeń awaryjnych po niepowodzeniach niejawnego lokalnego RPC Gateway. W systemie Linux używa aktywnego dziennika Gateway user-systemd według PID, gdy jest dostępny, i wypisuje wybrane źródło logów; w przeciwnym razie ponawia próby połączenia z działającym Gateway zamiast śledzić potencjalnie nieaktualny plik obok.
- Podczas używania `--follow` przejściowe rozłączenia gateway (zamknięcie WebSocket, limit czasu, zerwanie połączenia) wyzwalają automatyczne ponowne połączenie z wykładniczym wycofywaniem (do 8 ponowień, z limitem 30 s między próbami). Przy każdej ponownej próbie ostrzeżenie jest wypisywane do stderr, a po udanym odpytywaniu wypisywane jest powiadomienie `[logs] gateway reconnected`. W trybie `--json` zarówno ostrzeżenie o ponownej próbie, jak i przejście po ponownym połączeniu są emitowane jako rekordy `{"type":"notice"}` na stderr. Błędy nienaprawialne (niepowodzenie uwierzytelniania, zła konfiguracja) nadal powodują natychmiastowe zakończenie.
- W trybie `--follow --json` przejścia źródła logów są emitowane jako rekordy `{"type":"meta"}`. Konsumenci powinni śledzić kursory osobno dla każdego `sourceKind`: strumień może przejść z wyjścia plikowego Gateway (`sourceKind: "file"`) do lokalnego przełączenia awaryjnego na dziennik (`sourceKind: "journal"`, `localFallback: true`, z `service.pid`/`service.unit`) i z powrotem do wyjścia plikowego Gateway po odzyskaniu działania. Nie zakładaj jednego stabilnego źródła ani kursora dla całej sesji śledzenia i toleruj nakładające się wiersze, gdy odzyskiwanie odtwarza kursor pliku Gateway.

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Logowanie Gateway](/pl/gateway/logging)

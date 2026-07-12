---
read_when:
    - Musisz zdalnie śledzić logi Gateway (bez użycia SSH)
    - Potrzebujesz wierszy dziennika w formacie JSON dla narzędzi
summary: Dokumentacja CLI dla `openclaw logs` (śledzenie logów Gateway przez RPC)
title: Dzienniki
x-i18n:
    generated_at: "2026-07-12T14:55:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c54d7dd7ec46a0ea71cfee0fbe24abf43a3f1207eba3717b40862fb27ed6c9cd
    source_path: cli/logs.md
    workflow: 16
---

# `openclaw logs`

Wyświetla na bieżąco logi plikowe Gateway przez RPC. Działa w trybie zdalnym.

## Opcje

- `--limit <n>`: maksymalna liczba zwracanych wierszy logu (domyślnie `200`)
- `--max-bytes <n>`: maksymalna liczba bajtów odczytywanych z pliku logu (domyślnie `250000`)
- `--follow`: śledzi strumień logów
- `--interval <ms>`: interwał odpytywania podczas śledzenia (domyślnie `1000`)
- `--json`: generuje zdarzenia JSON rozdzielane wierszami
- `--plain`: zwykły tekst bez stylizowanego formatowania
- `--no-color`: wyłącza kolory ANSI
- `--local-time`: wyświetla znaczniki czasu w lokalnej strefie czasowej (domyślnie)
- `--utc`: wyświetla znaczniki czasu w UTC

## Wspólne opcje RPC Gateway

- `--url <url>`: adres URL WebSocket Gateway
- `--token <token>`: token Gateway
- `--timeout <ms>`: limit czasu w ms (domyślnie `30000`)
- `--expect-final`: oczekuje na odpowiedź końcową, gdy wywołanie Gateway jest obsługiwane przez agenta

Podanie `--url` pomija automatycznie stosowane dane uwierzytelniające z konfiguracji; jeśli docelowy Gateway wymaga uwierzytelnienia, jawnie podaj `--token`.

## Przykłady

```bash
openclaw logs
openclaw logs --follow
openclaw logs --follow --interval 2000
openclaw logs --limit 500 --max-bytes 500000
openclaw logs --json
openclaw logs --plain
openclaw logs --no-color
openclaw logs --utc
openclaw logs --follow --local-time
openclaw logs --url ws://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
```

## Zachowanie awaryjne i odzyskiwanie

- Jeśli niejawny Gateway local loopback poprosi o parowanie, zamknie połączenie podczas nawiązywania albo przekroczy limit czasu, zanim `logs.tail` odpowie, `openclaw logs` automatycznie przełączy się na skonfigurowany plik logu Gateway. Jawne cele `--url` nigdy nie korzystają z tego mechanizmu awaryjnego.
- Po niepowodzeniu niejawnego lokalnego wywołania RPC Gateway opcja `--follow` nie przełącza się na ten skonfigurowany plik — nieaktualny plik znajdujący się obok mógłby zafałszować śledzenie na żywo. W systemie Linux zamiast tego używa, o ile jest dostępny, aktywnego dziennika Gateway w systemd użytkownika według identyfikatora PID (i wyświetla wybrane źródło); w przeciwnym razie ponawia próby połączenia z działającym Gateway.
- Podczas działania `--follow` przejściowe rozłączenia (zamknięcie WebSocket, przekroczenie limitu czasu, zerwanie połączenia) powodują automatyczne ponowne łączenie z wykładniczo rosnącym opóźnieniem: maksymalnie 8 prób, z przerwą ograniczoną do 30 s. Przy każdej próbie ostrzeżenie jest wyświetlane na stderr, a po pomyślnym odpytywaniu jednorazowo pojawia się komunikat `[logs] gateway reconnected`. W trybie `--json` oba są emitowane na stderr jako rekordy `{"type":"notice"}`. Błędy, których nie można usunąć (niepowodzenie uwierzytelnienia, nieprawidłowa konfiguracja), nadal powodują natychmiastowe zakończenie.
- W trybie `--follow --json` zmiany źródła logów są emitowane jako rekordy `{"type":"meta"}`. Śledź kursory osobno dla każdego `sourceKind`: strumień może przejść z danych wyjściowych pliku Gateway (`sourceKind: "file"`) na lokalny dziennik awaryjny (`sourceKind: "journal"`, `localFallback: true`, z `service.pid`/`service.unit`), a po odzyskaniu połączenia wrócić do danych wyjściowych pliku Gateway. Nie zakładaj jednego stabilnego źródła ani kursora dla całej sesji i dopuszczaj nakładające się wiersze, gdy podczas odzyskiwania kursor pliku Gateway jest odtwarzany.

## Powiązane

- [Omówienie rejestrowania](/pl/logging)
- [CLI Gateway](/pl/cli/gateway)
- [Dokumentacja CLI](/pl/cli)
- [Rejestrowanie Gateway](/pl/gateway/logging)

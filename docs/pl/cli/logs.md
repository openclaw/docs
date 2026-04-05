---
read_when:
    - Musisz zdalnie śledzić logi Gateway (bez SSH)
    - Chcesz otrzymywać linie logów JSON do narzędzi
summary: Dokumentacja CLI dla `openclaw logs` (śledzenie logów bramy przez RPC)
title: logs
x-i18n:
    generated_at: "2026-04-05T13:48:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: 238a52e31a9a332cab513ced049e92d032b03c50376895ce57dffa2ee7d1e4b4
    source_path: cli/logs.md
    workflow: 15
---

# `openclaw logs`

Śledź logi plikowe Gateway przez RPC (działa w trybie zdalnym).

Powiązane:

- Omówienie logowania: [Logowanie](/logging)
- CLI Gateway: [gateway](/cli/gateway)

## Opcje

- `--limit <n>`: maksymalna liczba linii logów do zwrócenia (domyślnie `200`)
- `--max-bytes <n>`: maksymalna liczba bajtów do odczytania z pliku logów (domyślnie `250000`)
- `--follow`: śledź strumień logów
- `--interval <ms>`: interwał odpytywania podczas śledzenia (domyślnie `1000`)
- `--json`: emituj zdarzenia JSON rozdzielane liniami
- `--plain`: zwykłe wyjście tekstowe bez stylizowanego formatowania
- `--no-color`: wyłącz kolory ANSI
- `--local-time`: renderuj znaczniki czasu w lokalnej strefie czasowej

## Wspólne opcje Gateway RPC

`openclaw logs` akceptuje także standardowe flagi klienta Gateway:

- `--url <url>`: URL WebSocket Gateway
- `--token <token>`: token Gateway
- `--timeout <ms>`: limit czasu w ms (domyślnie `30000`)
- `--expect-final`: czekaj na końcową odpowiedź, gdy wywołanie Gateway jest obsługiwane przez agenta

Gdy przekazujesz `--url`, CLI nie stosuje automatycznie poświadczeń z konfiguracji ani środowiska. Dołącz jawnie `--token`, jeśli docelowy Gateway wymaga uwierzytelnienia.

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
- Jeśli Gateway local loopback poprosi o parowanie, `openclaw logs` automatycznie przełączy się na skonfigurowany lokalny plik logów. Jawne cele `--url` nie używają tego fallbacku.

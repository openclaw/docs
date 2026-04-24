---
read_when:
    - Zmiana danych wyjściowych lub formatów logowania
    - Debugowanie danych wyjściowych CLI lub Gateway
summary: Powierzchnie logowania, logi plikowe, style logów WS i formatowanie konsoli
title: Logowanie Gateway
x-i18n:
    generated_at: "2026-04-24T09:10:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 17ecbb9b781734727fc7aa8e3b0a59bc7ea22b455affd02fbc2db924c144b9f3
    source_path: gateway/logging.md
    workflow: 15
---

# Logowanie

Aby zobaczyć omówienie dla użytkownika (CLI + Control UI + konfiguracja), zobacz [/logging](/pl/logging).

OpenClaw ma dwie „powierzchnie” logowania:

- **Dane wyjściowe konsoli** (to, co widzisz w terminalu / Debug UI).
- **Logi plikowe** (wiersze JSON) zapisywane przez logger Gateway.

## Logger oparty na plikach

- Domyślny rotowany plik logów znajduje się w `/tmp/openclaw/` (jeden plik na dzień): `openclaw-YYYY-MM-DD.log`
  - Data używa lokalnej strefy czasowej hosta Gateway.
- Ścieżkę pliku logów i poziom można skonfigurować w `~/.openclaw/openclaw.json`:
  - `logging.file`
  - `logging.level`

Format pliku to jeden obiekt JSON na linię.

Karta Logs w Control UI śledzi ten plik przez Gateway (`logs.tail`).
CLI może zrobić to samo:

```bash
openclaw logs --follow
```

**Verbose a poziomy logów**

- **Logi plikowe** są kontrolowane wyłącznie przez `logging.level`.
- `--verbose` wpływa tylko na **szczegółowość konsoli** (oraz styl logów WS); **nie**
  podnosi poziomu logów plikowych.
- Aby przechwycić szczegóły widoczne tylko w verbose do logów plikowych, ustaw `logging.level` na `debug` lub
  `trace`.

## Przechwytywanie konsoli

CLI przechwytuje `console.log/info/warn/error/debug/trace` i zapisuje je do logów plikowych,
a jednocześnie nadal wypisuje je na stdout/stderr.

Szczegółowość konsoli można dostroić niezależnie przez:

- `logging.consoleLevel` (domyślnie `info`)
- `logging.consoleStyle` (`pretty` | `compact` | `json`)

## Redakcja podsumowań narzędzi

Szczegółowe podsumowania narzędzi (np. `🛠️ Exec: ...`) mogą maskować wrażliwe tokeny, zanim trafią do
strumienia konsoli. Dotyczy to **tylko narzędzi** i nie zmienia logów plikowych.

- `logging.redactSensitive`: `off` | `tools` (domyślnie: `tools`)
- `logging.redactPatterns`: tablica ciągów regex (nadpisuje wartości domyślne)
  - Używaj surowych ciągów regex (automatycznie `gi`) lub `/pattern/flags`, jeśli potrzebujesz własnych flag.
  - Dopasowania są maskowane przez zachowanie pierwszych 6 + ostatnich 4 znaków (długość >= 18), w przeciwnym razie `***`.
  - Wartości domyślne obejmują typowe przypisania kluczy, flagi CLI, pola JSON, nagłówki bearer, bloki PEM i popularne prefiksy tokenów.

## Logi WebSocket Gateway

Gateway wypisuje logi protokołu WebSocket w dwóch trybach:

- **Tryb normalny (bez `--verbose`)**: wypisywane są tylko „interesujące” wyniki RPC:
  - błędy (`ok=false`)
  - wolne wywołania (domyślny próg: `>= 50ms`)
  - błędy parsowania
- **Tryb verbose (`--verbose`)**: wypisuje cały ruch żądań/odpowiedzi WS.

### Styl logów WS

`openclaw gateway` obsługuje przełącznik stylu per Gateway:

- `--ws-log auto` (domyślnie): tryb normalny jest zoptymalizowany; tryb verbose używa wyjścia kompaktowego
- `--ws-log compact`: wyjście kompaktowe (sparowane żądanie/odpowiedź) w trybie verbose
- `--ws-log full`: pełne wyjście per-frame w trybie verbose
- `--compact`: alias dla `--ws-log compact`

Przykłady:

```bash
# optimized (only errors/slow)
openclaw gateway

# show all WS traffic (paired)
openclaw gateway --verbose --ws-log compact

# show all WS traffic (full meta)
openclaw gateway --verbose --ws-log full
```

## Formatowanie konsoli (logowanie podsystemów)

Formatter konsoli jest **świadomy TTY** i wypisuje spójne wiersze z prefiksami.
Loggery podsystemów utrzymują dane wyjściowe pogrupowane i czytelne.

Zachowanie:

- **Prefiksy podsystemów** w każdym wierszu (np. `[gateway]`, `[canvas]`, `[tailscale]`)
- **Kolory podsystemów** (stałe dla podsystemu) plus kolorowanie poziomów
- **Kolor, gdy wyjście jest TTY lub środowisko wygląda jak bogaty terminal** (`TERM`/`COLORTERM`/`TERM_PROGRAM`), z poszanowaniem `NO_COLOR`
- **Skrócone prefiksy podsystemów**: usuwa wiodące `gateway/` + `channels/`, zachowuje ostatnie 2 segmenty (np. `whatsapp/outbound`)
- **Podloggery per subsystem** (automatyczny prefiks + ustrukturyzowane pole `{ subsystem }`)
- **`logRaw()`** dla danych wyjściowych QR/UX (bez prefiksu, bez formatowania)
- **Style konsoli** (np. `pretty | compact | json`)
- **Poziom logów konsoli** oddzielony od poziomu logów plikowych (plik zachowuje pełne szczegóły, gdy `logging.level` jest ustawione na `debug`/`trace`)
- **Treści wiadomości WhatsApp** są logowane na poziomie `debug` (użyj `--verbose`, aby je zobaczyć)

Dzięki temu istniejące logi plikowe pozostają stabilne, a wyjście interaktywne staje się czytelne.

## Powiązane

- [Przegląd logowania](/pl/logging)
- [Eksport diagnostyki](/pl/gateway/diagnostics)

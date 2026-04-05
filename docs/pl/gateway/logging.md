---
read_when:
    - Zmiana danych wyjściowych logowania lub formatów
    - Debugowanie danych wyjściowych CLI lub gateway
summary: Powierzchnie logowania, logi plikowe, style logów WS i formatowanie konsoli
title: Gateway Logging
x-i18n:
    generated_at: "2026-04-05T13:53:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: 465fe66ae6a3bc844e75d3898aed15b3371481c4fe89ede40e5a9377e19bb74c
    source_path: gateway/logging.md
    workflow: 15
---

# Logging

Aby zobaczyć przegląd dla użytkownika (CLI + Control UI + konfiguracja), zobacz [/logging](/logging).

OpenClaw ma dwie „powierzchnie” logów:

- **Dane wyjściowe konsoli** (to, co widzisz w terminalu / Debug UI).
- **Logi plikowe** (linie JSON) zapisywane przez logger gateway.

## Logger oparty na plikach

- Domyślny rotowany plik logu znajduje się w `/tmp/openclaw/` (jeden plik na dzień): `openclaw-YYYY-MM-DD.log`
  - Data używa lokalnej strefy czasowej hosta gateway.
- Ścieżkę pliku logu i poziom można skonfigurować przez `~/.openclaw/openclaw.json`:
  - `logging.file`
  - `logging.level`

Format pliku to jeden obiekt JSON na linię.

Zakładka Logs w Control UI śledzi ten plik przez gateway (`logs.tail`).
CLI może zrobić to samo:

```bash
openclaw logs --follow
```

**Verbose a poziomy logów**

- **Logi plikowe** są kontrolowane wyłącznie przez `logging.level`.
- `--verbose` wpływa tylko na **szczegółowość konsoli** (i styl logów WS); **nie**
  podnosi poziomu logów plikowych.
- Aby przechwycić szczegóły widoczne tylko w trybie verbose w logach plikowych, ustaw `logging.level` na `debug` lub
  `trace`.

## Przechwytywanie konsoli

CLI przechwytuje `console.log/info/warn/error/debug/trace` i zapisuje je do logów plikowych,
jednocześnie nadal wypisując je na stdout/stderr.

Możesz niezależnie dostosować szczegółowość konsoli przez:

- `logging.consoleLevel` (domyślnie `info`)
- `logging.consoleStyle` (`pretty` | `compact` | `json`)

## Redagowanie podsumowań narzędzi

Szczegółowe podsumowania narzędzi (np. `🛠️ Exec: ...`) mogą maskować wrażliwe tokeny, zanim trafią do
strumienia konsoli. Dotyczy to **tylko narzędzi** i nie zmienia logów plikowych.

- `logging.redactSensitive`: `off` | `tools` (domyślnie: `tools`)
- `logging.redactPatterns`: tablica ciągów regex (nadpisuje domyślne)
  - Używaj surowych ciągów regex (automatycznie `gi`) albo `/pattern/flags`, jeśli potrzebujesz niestandardowych flag.
  - Dopasowania są maskowane przez zachowanie pierwszych 6 i ostatnich 4 znaków (długość >= 18), w przeciwnym razie `***`.
  - Domyślne wzorce obejmują typowe przypisania kluczy, flagi CLI, pola JSON, nagłówki bearer, bloki PEM i popularne prefiksy tokenów.

## Logi WebSocket gateway

Gateway wypisuje logi protokołu WebSocket w dwóch trybach:

- **Tryb normalny** (bez `--verbose`): wypisywane są tylko „interesujące” wyniki RPC:
  - błędy (`ok=false`)
  - wolne wywołania (domyślny próg: `>= 50ms`)
  - błędy parsowania
- **Tryb verbose** (`--verbose`): wypisuje cały ruch żądań/odpowiedzi WS.

### Styl logów WS

`openclaw gateway` obsługuje przełącznik stylu per gateway:

- `--ws-log auto` (domyślnie): tryb normalny jest zoptymalizowany; tryb verbose używa zwartego formatu
- `--ws-log compact`: zwarty format (sparowane żądanie/odpowiedź) w trybie verbose
- `--ws-log full`: pełne dane wyjściowe per frame w trybie verbose
- `--compact`: alias dla `--ws-log compact`

Przykłady:

```bash
# zoptymalizowane (tylko błędy/wolne)
openclaw gateway

# pokaż cały ruch WS (sparowany)
openclaw gateway --verbose --ws-log compact

# pokaż cały ruch WS (pełne metadane)
openclaw gateway --verbose --ws-log full
```

## Formatowanie konsoli (logowanie podsystemów)

Formatter konsoli jest **świadomy TTY** i wypisuje spójne wiersze z prefiksami.
Loggery podsystemów utrzymują dane wyjściowe pogrupowane i łatwe do przeglądania.

Zachowanie:

- **Prefiksy podsystemów** w każdym wierszu (np. `[gateway]`, `[canvas]`, `[tailscale]`)
- **Kolory podsystemów** (stabilne dla każdego podsystemu) plus kolorowanie poziomów
- **Kolorowanie, gdy dane wyjściowe są TTY lub środowisko wygląda jak bogaty terminal** (`TERM`/`COLORTERM`/`TERM_PROGRAM`), z poszanowaniem `NO_COLOR`
- **Skrócone prefiksy podsystemów**: usuwa początkowe `gateway/` + `channels/`, zachowuje ostatnie 2 segmenty (np. `whatsapp/outbound`)
- **Subloggery per podsystem** (automatyczny prefiks + pole strukturalne `{ subsystem }`)
- **`logRaw()`** dla danych wyjściowych QR/UX (bez prefiksu, bez formatowania)
- **Style konsoli** (np. `pretty | compact | json`)
- **Poziom logów konsoli** oddzielny od poziomu logów plikowych (plik zachowuje pełne szczegóły, gdy `logging.level` ustawiono na `debug`/`trace`)
- **Treści wiadomości WhatsApp** są logowane na poziomie `debug` (użyj `--verbose`, aby je zobaczyć)

Pozwala to zachować stabilność istniejących logów plikowych, a jednocześnie sprawia, że interaktywne dane wyjściowe są łatwe do przeglądania.

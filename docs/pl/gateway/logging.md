---
read_when:
    - Zmiana danych wyjściowych logów lub ich formatów
    - Debugowanie danych wyjściowych CLI lub Gateway
summary: Powierzchnie rejestrowania logów, logi plikowe, style logów WS i formatowanie konsoli
title: Rejestrowanie logów Gateway
x-i18n:
    generated_at: "2026-05-02T09:50:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: eb5f5ccd77909e82bd2938a33514ce8361c69910eb945c731d9b2c8266174c13
    source_path: gateway/logging.md
    workflow: 16
---

# Rejestrowanie

Przegląd dla użytkowników (CLI + Control UI + konfiguracja) znajdziesz w [/logging](/pl/logging).

OpenClaw ma dwie „powierzchnie” logów:

- **Wyjście konsoli** (to, co widzisz w terminalu / Debug UI).
- **Logi plikowe** (wiersze JSON) zapisywane przez logger Gateway.

## Logger oparty na plikach

- Domyślny rotowany plik logu znajduje się w `/tmp/openclaw/` (jeden plik na dzień): `openclaw-YYYY-MM-DD.log`
  - Data używa lokalnej strefy czasowej hosta Gateway.
- Aktywne pliki logów rotują przy `logging.maxFileBytes` (domyślnie: 100 MB), zachowując
  do pięciu numerowanych archiwów i kontynuując zapis do świeżego aktywnego pliku.
- Ścieżkę pliku logu i poziom można skonfigurować przez `~/.openclaw/openclaw.json`:
  - `logging.file`
  - `logging.level`

Format pliku to jeden obiekt JSON na wiersz.

Karta Logs w Control UI śledzi ten plik przez Gateway (`logs.tail`).
CLI może zrobić to samo:

```bash
openclaw logs --follow
```

**Szczegółowość a poziomy logów**

- **Logi plikowe** są kontrolowane wyłącznie przez `logging.level`.
- `--verbose` wpływa tylko na **szczegółowość konsoli** (i styl logów WS); **nie**
  podnosi poziomu logów plikowych.
- Aby przechwytywać w logach plikowych szczegóły dostępne tylko w trybie szczegółowym, ustaw `logging.level` na `debug` lub
  `trace`.
- Logowanie trace obejmuje też podsumowania diagnostyczne czasu dla wybranych gorących ścieżek,
  takich jak przygotowanie fabryki narzędzi Plugin. Zobacz
  [/tools/plugin#slow-plugin-tool-setup](/pl/tools/plugin#slow-plugin-tool-setup).

## Przechwytywanie konsoli

CLI przechwytuje `console.log/info/warn/error/debug/trace` i zapisuje je do logów plikowych,
jednocześnie nadal wypisując je na stdout/stderr.

Szczegółowość konsoli możesz dostroić niezależnie przez:

- `logging.consoleLevel` (domyślnie `info`)
- `logging.consoleStyle` (`pretty` | `compact` | `json`)

## Maskowanie

OpenClaw może maskować poufne tokeny, zanim wyjście logu lub transkrypcji opuści
proces. Ta polityka maskowania logów jest stosowana do ujść tekstowych konsoli, logów plikowych,
rekordów logów OTLP i transkrypcji sesji, więc pasujące wartości sekretów są
maskowane, zanim wiersze JSONL lub komunikaty zostaną zapisane na dysk.

- `logging.redactSensitive`: `off` | `tools` (domyślnie: `tools`)
- `logging.redactPatterns`: tablica ciągów regex (nadpisuje wartości domyślne)
  - Użyj surowych ciągów regex (automatyczne `gi`) albo `/pattern/flags`, jeśli potrzebujesz niestandardowych flag.
  - Dopasowania są maskowane przez zachowanie pierwszych 6 + ostatnich 4 znaków (długość >= 18), w przeciwnym razie `***`.
  - Wartości domyślne obejmują typowe przypisania kluczy, flagi CLI, pola JSON, nagłówki bearer, bloki PEM, popularne prefiksy tokenów oraz nazwy pól danych płatniczych, takie jak numer karty, CVC/CVV, współdzielony token płatności i dane uwierzytelniające płatności.

Niektóre granice bezpieczeństwa zawsze maskują dane niezależnie od `logging.redactSensitive`.
Obejmuje to zdarzenia wywołań narzędzi Control UI, wyjście narzędzia `sessions_history`,
eksporty wsparcia diagnostycznego, obserwacje błędów dostawców, wyświetlanie poleceń zatwierdzania exec
oraz logi protokołu Gateway WebSocket. Te powierzchnie mogą nadal używać
`logging.redactPatterns` jako dodatkowych wzorców, ale `redactSensitive: "off"`
nie sprawia, że emitują surowe sekrety.

## Logi Gateway WebSocket

Gateway wypisuje logi protokołu WebSocket w dwóch trybach:

- **Tryb normalny (bez `--verbose`)**: wypisywane są tylko „interesujące” wyniki RPC:
  - błędy (`ok=false`)
  - wolne wywołania (domyślny próg: `>= 50ms`)
  - błędy parsowania
- **Tryb szczegółowy (`--verbose`)**: wypisuje cały ruch żądań/odpowiedzi WS.

### Styl logów WS

`openclaw gateway` obsługuje przełącznik stylu dla danego Gateway:

- `--ws-log auto` (domyślnie): tryb normalny jest zoptymalizowany; tryb szczegółowy używa zwartego wyjścia
- `--ws-log compact`: zwarte wyjście (sparowane żądanie/odpowiedź) w trybie szczegółowym
- `--ws-log full`: pełne wyjście na ramkę w trybie szczegółowym
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
Loggery podsystemów utrzymują wyjście pogrupowane i łatwe do skanowania.

Zachowanie:

- **Prefiksy podsystemów** w każdym wierszu (np. `[gateway]`, `[canvas]`, `[tailscale]`)
- **Kolory podsystemów** (stabilne dla podsystemu) oraz kolorowanie poziomów
- **Kolor, gdy wyjście jest TTY albo środowisko wygląda jak bogaty terminal** (`TERM`/`COLORTERM`/`TERM_PROGRAM`), respektuje `NO_COLOR`
- **Skrócone prefiksy podsystemów**: usuwa początkowe `gateway/` + `channels/`, zachowuje ostatnie 2 segmenty (np. `whatsapp/outbound`)
- **Pod-loggery według podsystemu** (automatyczny prefiks + ustrukturyzowane pole `{ subsystem }`)
- **`logRaw()`** dla wyjścia QR/UX (bez prefiksu, bez formatowania)
- **Style konsoli** (np. `pretty | compact | json`)
- **Poziom logów konsoli** oddzielny od poziomu logów plikowych (plik zachowuje pełne szczegóły, gdy `logging.level` jest ustawione na `debug`/`trace`)
- **Treści wiadomości WhatsApp** są logowane na poziomie `debug` (użyj `--verbose`, aby je zobaczyć)

To utrzymuje stabilność istniejących logów plikowych, jednocześnie sprawiając, że interaktywne wyjście jest łatwe do skanowania.

## Powiązane

- [Rejestrowanie](/pl/logging)
- [Eksport OpenTelemetry](/pl/gateway/opentelemetry)
- [Eksport diagnostyki](/pl/gateway/diagnostics)

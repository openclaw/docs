---
read_when:
    - Zmiana wyjścia logów lub ich formatów
    - Debugowanie danych wyjściowych CLI lub Gateway
summary: Miejsca rejestrowania logów, logi plikowe, style logów WS i formatowanie konsoli
title: Rejestrowanie dzienników Gateway
x-i18n:
    generated_at: "2026-05-01T09:58:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: f843812a41c25f9ca1884543ad3a5663c8e0bc327027cbd2b58ea6557c466aa9
    source_path: gateway/logging.md
    workflow: 16
---

# Rejestrowanie

Przegląd z perspektywy użytkownika (CLI + Control UI + konfiguracja) znajdziesz w [/logging](/pl/logging).

OpenClaw ma dwie „powierzchnie” logów:

- **Wyjście konsoli** (to, co widzisz w terminalu / Debug UI).
- **Logi plikowe** (wiersze JSON) zapisywane przez logger Gateway.

## Logger oparty na plikach

- Domyślny rotowany plik logu znajduje się w `/tmp/openclaw/` (jeden plik dziennie): `openclaw-YYYY-MM-DD.log`
  - Data używa lokalnej strefy czasowej hosta Gateway.
- Aktywne pliki logów rotują przy `logging.maxFileBytes` (domyślnie: 100 MB), zachowując
  do pięciu numerowanych archiwów i kontynuując zapis do nowego aktywnego pliku.
- Ścieżkę pliku logu i poziom można skonfigurować przez `~/.openclaw/openclaw.json`:
  - `logging.file`
  - `logging.level`

Format pliku to jeden obiekt JSON w każdym wierszu.

Karta logów w Control UI śledzi ten plik przez Gateway (`logs.tail`).
CLI może zrobić to samo:

```bash
openclaw logs --follow
```

**Tryb szczegółowy a poziomy logowania**

- **Logi plikowe** są kontrolowane wyłącznie przez `logging.level`.
- `--verbose` wpływa tylko na **szczegółowość konsoli** (i styl logów WS); **nie**
  podnosi poziomu logów plikowych.
- Aby przechwycić w logach plikowych szczegóły dostępne tylko w trybie szczegółowym, ustaw `logging.level` na `debug` lub
  `trace`.

## Przechwytywanie konsoli

CLI przechwytuje `console.log/info/warn/error/debug/trace` i zapisuje je do logów plikowych,
nadal wypisując je na stdout/stderr.

Szczegółowość konsoli możesz dostroić niezależnie przez:

- `logging.consoleLevel` (domyślnie `info`)
- `logging.consoleStyle` (`pretty` | `compact` | `json`)

## Redakcja

OpenClaw może maskować wrażliwe tokeny, zanim wyjście logu lub transkrypcji opuści
proces. Ta polityka redakcji logów jest stosowana do konsoli, logów plikowych, rekordów
logów OTLP i tekstowych ujść transkrypcji sesji, więc pasujące wartości sekretów są
maskowane przed zapisaniem wierszy JSONL lub komunikatów na dysku.

- `logging.redactSensitive`: `off` | `tools` (domyślnie: `tools`)
- `logging.redactPatterns`: tablica ciągów regex (zastępuje wartości domyślne)
  - Używaj surowych ciągów regex (automatyczne `gi`) albo `/pattern/flags`, jeśli potrzebujesz własnych flag.
  - Dopasowania są maskowane przez zachowanie pierwszych 6 i ostatnich 4 znaków (długość >= 18), w przeciwnym razie `***`.
  - Domyślne wartości obejmują typowe przypisania kluczy, flagi CLI, pola JSON, nagłówki bearer, bloki PEM, popularne prefiksy tokenów oraz nazwy pól danych płatniczych, takie jak numer karty, CVC/CVV, współdzielony token płatniczy i poświadczenie płatnicze.

Niektóre granice bezpieczeństwa zawsze redagują dane niezależnie od `logging.redactSensitive`.
Obejmuje to zdarzenia wywołań narzędzi Control UI, wyjście narzędzia `sessions_history`,
eksporty wsparcia diagnostycznego, obserwacje błędów dostawców, wyświetlanie poleceń
zatwierdzania exec oraz logi protokołu WebSocket Gateway. Te powierzchnie nadal mogą używać
`logging.redactPatterns` jako dodatkowych wzorców, ale `redactSensitive: "off"`
nie sprawia, że emitują surowe sekrety.

## Logi WebSocket Gateway

Gateway wypisuje logi protokołu WebSocket w dwóch trybach:

- **Tryb normalny (bez `--verbose`)**: wypisywane są tylko „interesujące” wyniki RPC:
  - błędy (`ok=false`)
  - wolne wywołania (domyślny próg: `>= 50ms`)
  - błędy parsowania
- **Tryb szczegółowy (`--verbose`)**: wypisuje cały ruch żądań/odpowiedzi WS.

### Styl logów WS

`openclaw gateway` obsługuje przełącznik stylu dla każdego Gateway:

- `--ws-log auto` (domyślnie): tryb normalny jest zoptymalizowany; tryb szczegółowy używa kompaktowego wyjścia
- `--ws-log compact`: kompaktowe wyjście (sparowane żądanie/odpowiedź) w trybie szczegółowym
- `--ws-log full`: pełne wyjście dla każdej ramki w trybie szczegółowym
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
Loggery podsystemów utrzymują wyjście w grupach i ułatwiają skanowanie.

Zachowanie:

- **Prefiksy podsystemów** w każdym wierszu (np. `[gateway]`, `[canvas]`, `[tailscale]`)
- **Kolory podsystemów** (stabilne dla każdego podsystemu) oraz kolorowanie poziomów
- **Kolor, gdy wyjście jest TTY albo środowisko wygląda jak zaawansowany terminal** (`TERM`/`COLORTERM`/`TERM_PROGRAM`), respektuje `NO_COLOR`
- **Skrócone prefiksy podsystemów**: usuwa początkowe `gateway/` + `channels/`, zachowuje ostatnie 2 segmenty (np. `whatsapp/outbound`)
- **Pod-loggery według podsystemu** (automatyczny prefiks + strukturalne pole `{ subsystem }`)
- **`logRaw()`** do wyjścia QR/UX (bez prefiksu, bez formatowania)
- **Style konsoli** (np. `pretty | compact | json`)
- **Poziom logowania konsoli** oddzielny od poziomu logów plikowych (plik zachowuje pełne szczegóły, gdy `logging.level` jest ustawione na `debug`/`trace`)
- **Treści wiadomości WhatsApp** są logowane na poziomie `debug` (użyj `--verbose`, aby je zobaczyć)

Dzięki temu istniejące logi plikowe pozostają stabilne, a wyjście interaktywne jest łatwe do skanowania.

## Powiązane

- [Rejestrowanie](/pl/logging)
- [Eksport OpenTelemetry](/pl/gateway/opentelemetry)
- [Eksport diagnostyki](/pl/gateway/diagnostics)

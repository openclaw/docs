---
read_when:
    - Zmiana danych wyjściowych logowania lub ich formatów
    - Debugowanie danych wyjściowych CLI lub Gateway
summary: Powierzchnie rejestrowania, logi plikowe, style logów WS i formatowanie konsoli
title: Rejestrowanie logów Gateway
x-i18n:
    generated_at: "2026-05-05T01:46:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: d49ca112d3cc4ec76ecfc8b14d16dae64f74ca1f761fdb2b7bb470f73b66a246
    source_path: gateway/logging.md
    workflow: 16
---

# Rejestrowanie zdarzeń

Omówienie dla użytkownika (CLI + Control UI + konfiguracja) znajdziesz w [/logging](/pl/logging).

OpenClaw ma dwie „powierzchnie” logów:

- **Dane wyjściowe konsoli** (to, co widzisz w terminalu / Debug UI).
- **Logi plikowe** (wiersze JSON) zapisywane przez logger Gateway.

Podczas uruchamiania Gateway loguje rozwiązany domyślny model agenta wraz z
domyślnymi trybami, które wpływają na nowe sesje, na przykład:

```text
agent model: openai-codex/gpt-5.5 (thinking=medium, fast=on)
```

`thinking` pochodzi z domyślnego agenta, parametrów modelu albo globalnej wartości domyślnej agenta;
gdy nie jest ustawione, podsumowanie startowe pokazuje `medium`. `fast` pochodzi z
domyślnego agenta albo parametrów `fastMode` modelu.

## Logger oparty na plikach

- Domyślny rotowany plik logu znajduje się w `/tmp/openclaw/` (jeden plik dziennie): `openclaw-YYYY-MM-DD.log`
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

**Tryb szczegółowy a poziomy logowania**

- **Logi plikowe** są kontrolowane wyłącznie przez `logging.level`.
- `--verbose` wpływa tylko na **szczegółowość konsoli** (oraz styl logów WS); **nie**
  podnosi poziomu logów plikowych.
- Aby przechwycić szczegóły dostępne tylko w trybie szczegółowym w logach plikowych, ustaw `logging.level` na `debug` albo
  `trace`.
- Logowanie śledzenia obejmuje również diagnostyczne podsumowania czasu dla wybranych gorących ścieżek,
  takich jak przygotowanie fabryki narzędzi Plugin. Zobacz
  [/tools/plugin#slow-plugin-tool-setup](/pl/tools/plugin#slow-plugin-tool-setup).

## Przechwytywanie konsoli

CLI przechwytuje `console.log/info/warn/error/debug/trace` i zapisuje je do logów plikowych,
nadal drukując je na stdout/stderr.

Szczegółowość konsoli możesz dostroić niezależnie przez:

- `logging.consoleLevel` (domyślnie `info`)
- `logging.consoleStyle` (`pretty` | `compact` | `json`)

## Maskowanie

OpenClaw może maskować wrażliwe tokeny, zanim dane wyjściowe logu albo transkrypcji opuszczą
proces. Ta polityka maskowania logów jest stosowana do ujść tekstu konsoli, logu plikowego, rekordów logów OTLP
i transkrypcji sesji, więc pasujące wartości sekretów są
maskowane przed zapisaniem wierszy JSONL albo komunikatów na dysku.

- `logging.redactSensitive`: `off` | `tools` (domyślnie: `tools`)
- `logging.redactPatterns`: tablica ciągów regex (nadpisuje wartości domyślne)
  - Używaj surowych ciągów regex (automatyczne `gi`) albo `/pattern/flags`, jeśli potrzebujesz niestandardowych flag.
  - Dopasowania są maskowane przez zachowanie pierwszych 6 + ostatnich 4 znaków (długość >= 18), w przeciwnym razie `***`.
  - Wartości domyślne obejmują typowe przypisania kluczy, flagi CLI, pola JSON, nagłówki bearer, bloki PEM, popularne prefiksy tokenów oraz nazwy pól danych płatniczych, takich jak numer karty, CVC/CVV, współdzielony token płatności i dane uwierzytelniające płatności.

Niektóre granice bezpieczeństwa zawsze maskują dane niezależnie od `logging.redactSensitive`.
Obejmuje to zdarzenia wywołań narzędzi Control UI, dane wyjściowe narzędzia `sessions_history`,
eksporty wsparcia diagnostycznego, obserwacje błędów providerów, wyświetlanie poleceń zatwierdzania exec
oraz logi protokołu WebSocket Gateway. Te powierzchnie nadal mogą używać
`logging.redactPatterns` jako dodatkowych wzorców, ale `redactSensitive: "off"`
nie sprawia, że emitują surowe sekrety.

## Logi WebSocket Gateway

Gateway drukuje logi protokołu WebSocket w dwóch trybach:

- **Tryb normalny (bez `--verbose`)**: drukowane są tylko „interesujące” wyniki RPC:
  - błędy (`ok=false`)
  - wolne wywołania (domyślny próg: `>= 50ms`)
  - błędy parsowania
- **Tryb szczegółowy (`--verbose`)**: drukuje cały ruch żądań/odpowiedzi WS.

### Styl logów WS

`openclaw gateway` obsługuje przełącznik stylu dla pojedynczego Gateway:

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

Formatter konsoli jest **świadomy TTY** i drukuje spójne wiersze z prefiksami.
Loggery podsystemów utrzymują dane wyjściowe pogrupowane i łatwe do skanowania.

Zachowanie:

- **Prefiksy podsystemów** w każdym wierszu (np. `[gateway]`, `[canvas]`, `[tailscale]`)
- **Kolory podsystemów** (stabilne dla danego podsystemu) oraz kolorowanie poziomów
- **Kolor, gdy wyjście jest TTY albo środowisko wygląda jak bogaty terminal** (`TERM`/`COLORTERM`/`TERM_PROGRAM`), respektuje `NO_COLOR`
- **Skrócone prefiksy podsystemów**: odrzuca początkowe `gateway/` + `channels/`, zachowuje ostatnie 2 segmenty (np. `whatsapp/outbound`)
- **Podloggery według podsystemu** (automatyczny prefiks + strukturalne pole `{ subsystem }`)
- **`logRaw()`** dla wyjścia QR/UX (bez prefiksu, bez formatowania)
- **Style konsoli** (np. `pretty | compact | json`)
- **Poziom logowania konsoli** oddzielony od poziomu logów plikowych (plik zachowuje pełne szczegóły, gdy `logging.level` jest ustawione na `debug`/`trace`)
- **Treści wiadomości WhatsApp** są logowane na poziomie `debug` (użyj `--verbose`, aby je zobaczyć)

To utrzymuje istniejące logi plikowe w stabilnej postaci, a jednocześnie sprawia, że wyjście interaktywne jest łatwe do skanowania.

## Powiązane

- [Rejestrowanie zdarzeń](/pl/logging)
- [Eksport OpenTelemetry](/pl/gateway/opentelemetry)
- [Eksport diagnostyki](/pl/gateway/diagnostics)

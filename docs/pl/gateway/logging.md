---
read_when:
    - Zmienianie danych wyjściowych lub formatów logowania
    - Debugowanie danych wyjściowych CLI lub Gateway
summary: Powierzchnie logowania, logi plikowe, style logów WS i formatowanie konsoli
title: Rejestrowanie w Gateway
x-i18n:
    generated_at: "2026-06-27T17:34:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dde5e589bb48cd8c41ac6dd0d74780fec1cc1ee79d82d433b4e7c7450dc5c8b6
    source_path: gateway/logging.md
    workflow: 16
---

# Logowanie

Omówienie dla użytkowników (CLI + Control UI + konfiguracja) znajdziesz w [/logging](/pl/logging).

OpenClaw ma dwie „powierzchnie” logów:

- **Wyjście konsoli** (to, co widzisz w terminalu / Debug UI).
- **Logi plikowe** (wiersze JSON) zapisywane przez logger Gateway.

Podczas uruchamiania Gateway loguje rozwiązany domyślny model agenta wraz z
domyślnymi trybami, które wpływają na nowe sesje, na przykład:

```text
agent model: openai/gpt-5.5 (thinking=medium, fast=on)
```

`thinking` pochodzi z domyślnego agenta, parametrów modelu albo globalnej wartości domyślnej agenta;
gdy nie jest ustawione, podsumowanie uruchamiania pokazuje `medium`. `fast` pochodzi z
domyślnego agenta albo parametrów modelu `fastMode`.

## Logger oparty na plikach

- Domyślny rotowany plik logów znajduje się w `/tmp/openclaw/` (jeden plik dziennie): `openclaw-YYYY-MM-DD.log`
  - Data używa lokalnej strefy czasowej hosta Gateway.
- Aktywne pliki logów rotują po osiągnięciu `logging.maxFileBytes` (domyślnie: 100 MB), zachowując
  do pięciu numerowanych archiwów i kontynuując zapis do świeżego aktywnego pliku.
- Ścieżkę pliku logów i poziom można skonfigurować przez `~/.openclaw/openclaw.json`:
  - `logging.file`
  - `logging.level`

Format pliku to jeden obiekt JSON na wiersz.

Ścieżki kodu rozmowy, głosu w czasie rzeczywistym i zarządzanych pokojów używają współdzielonego loggera plikowego do
ograniczonych rekordów cyklu życia. Te rekordy są przeznaczone do debugowania operacyjnego
i eksportu logów OTLP; tekst transkrypcji, ładunki audio, identyfikatory tur, identyfikatory połączeń i
identyfikatory elementów dostawcy nie są kopiowane do rekordu logu.

Karta Logs w Control UI śledzi ten plik przez Gateway (`logs.tail`).
CLI może zrobić to samo:

```bash
openclaw logs --follow
```

**Tryb szczegółowy a poziomy logowania**

- **Logi plikowe** są kontrolowane wyłącznie przez `logging.level`.
- `--verbose` wpływa tylko na **szczegółowość konsoli** (oraz styl logów WS); **nie**
  podnosi poziomu logowania do pliku.
- Aby przechwycić w logach plikowych szczegóły dostępne tylko w trybie szczegółowym, ustaw `logging.level` na `debug` lub
  `trace`.
- Logowanie trace obejmuje też diagnostyczne podsumowania czasów dla wybranych gorących ścieżek,
  takich jak przygotowanie fabryki narzędzi Plugin. Zobacz
  [/tools/plugin#slow-plugin-tool-setup](/pl/tools/plugin#slow-plugin-tool-setup).

## Przechwytywanie konsoli

CLI przechwytuje `console.log/info/warn/error/debug/trace` i zapisuje je do logów plikowych,
jednocześnie nadal wypisując je na stdout/stderr.

Szczegółowość konsoli możesz dostroić niezależnie przez:

- `logging.consoleLevel` (domyślnie `info`)
- `logging.consoleStyle` (`pretty` | `compact` | `json`)

## Redakcja

OpenClaw może maskować wrażliwe tokeny, zanim wyjście logów lub transkrypcji opuści
proces. Ta polityka redakcji logowania jest stosowana w ujściach tekstowych konsoli, logów plikowych, rekordów logów OTLP
i transkrypcji sesji, więc pasujące wartości sekretów są
maskowane przed zapisaniem wierszy JSONL lub wiadomości na dysku.

- `logging.redactSensitive`: `off` | `tools` (domyślnie: `tools`)
- `logging.redactPatterns`: tablica ciągów regex (nadpisuje wartości domyślne)
  - Używaj surowych ciągów regex (automatycznie `gi`) albo `/pattern/flags`, jeśli potrzebujesz niestandardowych flag.
  - Dopasowania są maskowane przez zachowanie pierwszych 6 + ostatnich 4 znaków (długość >= 18), w przeciwnym razie `***`.
  - Wartości domyślne obejmują typowe przypisania kluczy, flagi CLI, pola JSON, nagłówki bearer, bloki PEM, popularne prefiksy tokenów oraz nazwy pól danych płatniczych, takie jak numer karty, CVC/CVV, współdzielony token płatniczy i poświadczenie płatnicze.

Niektóre granice bezpieczeństwa zawsze redagują dane niezależnie od `logging.redactSensitive`.
Obejmuje to zdarzenia wywołań narzędzi Control UI, wyjście narzędzia `sessions_history`,
eksporty wsparcia diagnostycznego, obserwacje błędów dostawcy, wyświetlanie poleceń zatwierdzania exec
oraz logi protokołu WebSocket Gateway. Te powierzchnie nadal mogą używać
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

Formatter konsoli jest **świadomy TTY** i wypisuje spójne, prefiksowane wiersze.
Loggery podsystemów utrzymują wyjście pogrupowane i łatwe do skanowania.

Zachowanie:

- **Prefiksy podsystemów** w każdym wierszu (np. `[gateway]`, `[canvas]`, `[tailscale]`)
- **Kolory podsystemów** (stabilne dla danego podsystemu) oraz kolorowanie poziomów
- **Kolor, gdy wyjście jest TTY lub środowisko wygląda jak bogaty terminal** (`TERM`/`COLORTERM`/`TERM_PROGRAM`), respektuje `NO_COLOR`
- **Skrócone prefiksy podsystemów**: usuwa początkowe `gateway/` + `channels/`, zachowuje ostatnie 2 segmenty (np. `whatsapp/outbound`)
- **Podloggery według podsystemu** (automatyczny prefiks + ustrukturyzowane pole `{ subsystem }`)
- **`logRaw()`** dla wyjścia QR/UX (bez prefiksu, bez formatowania)
- **Style konsoli** (np. `pretty | compact | json`)
- **Poziom logowania konsoli** oddzielny od poziomu logowania do pliku (plik zachowuje pełne szczegóły, gdy `logging.level` jest ustawione na `debug`/`trace`)
- **Treści wiadomości WhatsApp** są logowane na poziomie `debug` (użyj `--verbose`, aby je zobaczyć)

To utrzymuje istniejące logi plikowe stabilne, jednocześnie sprawiając, że interaktywne wyjście jest łatwe do skanowania.

## Powiązane

- [Logowanie](/pl/logging)
- [Eksport OpenTelemetry](/pl/gateway/opentelemetry)
- [Eksport diagnostyki](/pl/gateway/diagnostics)

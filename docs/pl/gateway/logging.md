---
read_when:
    - Zmiana danych wyjściowych lub formatów logowania
    - Debugowanie danych wyjściowych CLI lub Gatewaya
summary: Obszary rejestrowania, dzienniki w plikach, style dzienników WS i formatowanie konsoli
title: Rejestrowanie zdarzeń Gateway
x-i18n:
    generated_at: "2026-07-12T15:10:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6717be5eac3dfc1acf36b2f21b049d46c7fc3678945295b10ae69781d89d35ad
    source_path: gateway/logging.md
    workflow: 16
---

# Rejestrowanie

Omówienie przeznaczone dla użytkowników (CLI + interfejs Control UI + konfiguracja) znajduje się na stronie [/logging](/pl/logging).

OpenClaw udostępnia dwa rodzaje dzienników:

- **Dane wyjściowe konsoli** — informacje widoczne w terminalu lub interfejsie Debug UI.
- **Dzienniki plikowe** — wiersze JSON zapisywane przez rejestrator Gateway.

Podczas uruchamiania Gateway rejestruje określony domyślny model agenta oraz domyślne tryby wpływające na nowe sesje:

```text
agent model: openai/gpt-5.6-sol (thinking=medium, fast=on)
```

Wartość `thinking` pochodzi z konfiguracji domyślnego agenta, parametrów modelu lub globalnej wartości domyślnej agenta; jeśli jej nie ustawiono, wyświetlana jest wartość `medium`. Wartość `fast` pochodzi z konfiguracji domyślnego agenta lub parametrów `fastMode` modelu.

## Rejestrator plikowy

- Domyślny rotacyjny plik dziennika znajduje się w katalogu `/tmp/openclaw/` (jeden plik dziennie): `openclaw-YYYY-MM-DD.log`, datowany zgodnie z lokalną strefą czasową hosta Gateway. Jeśli katalog jest niezabezpieczony lub nie można w nim zapisywać (niewłaściwy właściciel, możliwość zapisu przez wszystkich albo dowiązanie symboliczne), OpenClaw używa zamiast niego ścieżki `os.tmpdir()/openclaw-<uid>` o zakresie ograniczonym do użytkownika; w systemie Windows zawsze używana jest ta ścieżka zastępcza w katalogu tymczasowym systemu operacyjnego.
- Aktywne pliki dziennika są rotowane po osiągnięciu rozmiaru `logging.maxFileBytes` (domyślnie 100 MB). Zachowywanych jest maksymalnie pięć numerowanych archiwów (od `.1` do `.5`), a dalszy zapis odbywa się w nowym aktywnym pliku.
- Ścieżkę i poziom rejestrowania pliku skonfiguruj w `~/.openclaw/openclaw.json` za pomocą ustawień `logging.file` i `logging.level`.
- Format pliku to jeden obiekt JSON w każdym wierszu.

Ścieżki kodu rozmów, głosu w czasie rzeczywistym i zarządzanych pokojów używają współdzielonego rejestratora plikowego do zapisywania ograniczonych rekordów cyklu życia przeznaczonych do diagnostyki operacyjnej i eksportowania dzienników OTLP. Tekst transkrypcji, dane audio, identyfikatory tur, identyfikatory połączeń i identyfikatory elementów dostawcy nigdy nie są kopiowane do rekordu dziennika.

Karta dzienników w interfejsie Control UI śledzi ten plik za pośrednictwem Gateway (`logs.tail`). CLI działa tak samo:

```bash
openclaw logs --follow
```

### Tryb szczegółowy a poziomy rejestrowania

- **Dzienniki plikowe** są kontrolowane wyłącznie przez `logging.level`.
- Opcja `--verbose` wpływa tylko na **szczegółowość konsoli** (oraz styl dzienników WS) — **nie** podnosi poziomu rejestrowania w pliku.
- Aby zapisywać w dziennikach plikowych szczegóły dostępne tylko w trybie szczegółowym, ustaw `logging.level` na `debug` lub `trace`.
- Rejestrowanie na poziomie `trace` obejmuje również diagnostyczne podsumowania czasów dla wybranych często wykonywanych ścieżek, takich jak przygotowanie fabryki narzędzi Pluginu. Zobacz [/tools/plugin#slow-plugin-tool-setup](/pl/tools/plugin#slow-plugin-tool-setup).

## Przechwytywanie konsoli

CLI przechwytuje wywołania `console.log/info/warn/error/debug/trace`, zapisuje je w dziennikach plikowych, a jednocześnie nadal wyświetla je w strumieniu stdout/stderr.

Szczegółowość konsoli można dostosować niezależnie:

- `logging.consoleLevel` (domyślnie `info`)
- `logging.consoleStyle` (`pretty` | `compact` | `json`; domyślnie `pretty` w TTY, a w pozostałych przypadkach `compact`)

## Redagowanie

OpenClaw maskuje poufne tokeny, zanim dane wyjściowe dziennika lub transkrypcji opuszczą proces. Ta zasada redagowania dotyczy konsoli, dzienników plikowych, rekordów dziennika OTLP oraz tekstowych miejsc docelowych transkrypcji sesji, dlatego pasujące wartości tajne są maskowane przed zapisaniem wierszy JSONL lub komunikatów na dysku.

- `logging.redactSensitive`: `off` | `tools` (domyślnie `tools`)
- `logging.redactPatterns`: tablica ciągów wyrażeń regularnych (zastępuje wartości domyślne)
  - Użyj nieprzetworzonych ciągów wyrażeń regularnych (automatycznie z flagami `gi`) albo składni `/pattern/flags`, aby określić niestandardowe flagi.
  - Dopasowania są maskowane z zachowaniem pierwszych 6 i ostatnich 4 znaków (dla wartości mających co najmniej 18 znaków); krótsze wartości są zastępowane przez `***`.
  - Domyślne wzorce obejmują typowe przypisania kluczy, flagi CLI, pola JSON, nagłówki typu bearer, bloki PEM, popularne prefiksy tokenów dostawców oraz nazwy pól danych uwierzytelniających płatności (numer karty, CVC/CVV, współdzielony token płatności i dane uwierzytelniające płatności).

Niektóre granice bezpieczeństwa zawsze stosują redagowanie niezależnie od ustawienia `logging.redactSensitive`: zdarzenia wywołań narzędzi w Control UI, dane wyjściowe narzędzia `sessions_history`, eksporty pomocy diagnostycznej, obserwacje błędów dostawcy, wyświetlanie poleceń zatwierdzania wykonania oraz dzienniki protokołu WebSocket Gateway. Te powierzchnie nadal uwzględniają `logging.redactPatterns` jako dodatkowe wzorce, ale ustawienie `redactSensitive: "off"` nie powoduje ujawniania przez nie nieprzetworzonych wartości tajnych.

## Dzienniki WebSocket Gateway

Gateway wyświetla dzienniki protokołu WebSocket w dwóch trybach:

- **Tryb normalny (bez `--verbose`)**: wyświetlane są tylko „istotne” wyniki RPC — błędy (`ok=false`), wolne wywołania (domyślny próg: `>= 50ms`) i błędy analizy składniowej.
- **Tryb szczegółowy (`--verbose`)**: wyświetla cały ruch żądań i odpowiedzi WS.

### Styl dzienników WS

Polecenie `openclaw gateway` obsługuje przełącznik stylu dla poszczególnych instancji Gateway:

- `--ws-log auto` (domyślnie): tryb normalny jest zoptymalizowany, a tryb szczegółowy używa zwartego formatu danych wyjściowych.
- `--ws-log compact`: zwarty format danych wyjściowych (sparowane żądania i odpowiedzi) w trybie szczegółowym.
- `--ws-log full`: pełne dane wyjściowe poszczególnych ramek w trybie szczegółowym.
- `--compact`: alias opcji `--ws-log compact`.

```bash
# zoptymalizowane (tylko błędy/wolne wywołania)
openclaw gateway

# pokaż cały ruch WS (sparowany)
openclaw gateway --verbose --ws-log compact

# pokaż cały ruch WS (pełne metadane)
openclaw gateway --verbose --ws-log full
```

## Formatowanie konsoli (rejestrowanie podsystemów)

Program formatujący konsolę **rozpoznaje TTY** i wyświetla spójne wiersze z prefiksami. Rejestratory podsystemów grupują dane wyjściowe i ułatwiają ich przeglądanie:

- **Prefiksy podsystemów** w każdym wierszu (np. `[gateway]`, `[canvas]`, `[tailscale]`).
- **Kolory podsystemów** (stałe dla każdego podsystemu, wyznaczane skrótem nazwy) wraz z kolorami poziomów.
- **Kolory, gdy dane wyjściowe trafiają do TTY** lub środowisko przypomina rozbudowany terminal (`TERM`/`COLORTERM`/`TERM_PROGRAM`); uwzględniane są ustawienia `NO_COLOR` i `FORCE_COLOR`.
- **Skrócone prefiksy podsystemów**: usuwany jest początkowy segment `gateway/`, `channels/` lub `providers/`, a następnie zachowywane są najwyżej 2 ostatnie pozostałe segmenty (np. `channels/turn/kernel` jest wyświetlane jako `turn/kernel`). Znane podsystemy kanałów (`telegram`, `whatsapp`, `slack` itd.) są zawsze skracane wyłącznie do nazwy kanału.
- **Rejestratory podrzędne według podsystemu** (automatyczny prefiks + ustrukturyzowane pole `{ subsystem }`).
- **`logRaw()`** do danych wyjściowych QR/UX (bez prefiksu i formatowania).
- **Style konsoli**: `pretty` | `compact` | `json`.
- **Poziom rejestrowania konsoli** jest niezależny od poziomu rejestrowania w pliku (plik zachowuje wszystkie szczegóły, gdy `logging.level` ma wartość `debug` lub `trace`).
- **Treści wiadomości WhatsApp** są rejestrowane na poziomie `debug` (użyj `--verbose`, aby je zobaczyć).

Dzięki temu dzienniki plikowe pozostają stabilne, a interaktywne dane wyjściowe są łatwe do przeglądania.

## Powiązane materiały

- [Rejestrowanie](/pl/logging)
- [Eksport OpenTelemetry](/pl/gateway/opentelemetry)
- [Eksport diagnostyczny](/pl/gateway/diagnostics)

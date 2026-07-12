---
read_when:
    - Potrzebujesz przystępnego dla początkujących omówienia rejestrowania zdarzeń w OpenClaw
    - Chcesz skonfigurować poziomy logowania, formaty lub redagowanie danych wrażliwych
    - Rozwiązujesz problem i musisz szybko znaleźć logi
summary: Logi plikowe, dane wyjściowe konsoli, śledzenie logów w CLI oraz karta Logi w interfejsie sterowania
title: Rejestrowanie zdarzeń
x-i18n:
    generated_at: "2026-07-12T15:16:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: add41e125c22ca1b2343a3a1fb1e88e94ef9c81a07c48b9eb67f4d4b2510dd08
    source_path: logging.md
    workflow: 16
---

OpenClaw ma dwie główne powierzchnie rejestrowania:

- **Dzienniki plikowe** (wiersze JSON) zapisywane przez Gateway.
- **Dane wyjściowe konsoli** w terminalu, w którym działa Gateway.

Karta **Dzienniki** interfejsu sterowania śledzi dziennik plikowy Gateway. Na tej stronie wyjaśniono, gdzie
znajdują się dzienniki, jak je odczytywać oraz jak konfigurować ich poziomy i formaty.

## Gdzie znajdują się dzienniki

Domyślnie Gateway zapisuje jeden rotacyjny plik dziennika dziennie:

`/tmp/openclaw/openclaw-YYYY-MM-DD.log`

Data używa lokalnej strefy czasowej hosta Gateway. Gdy `/tmp/openclaw` jest niebezpieczny
lub niedostępny (a w systemie Windows zawsze), OpenClaw używa zamiast niego katalogu
`openclaw-<uid>` o zakresie użytkownika w katalogu tymczasowym systemu operacyjnego. Pliki dziennika
z datami są usuwane po 24 godzinach.

Każdy plik jest rotowany, gdy kolejny zapis przekroczyłby `logging.maxFileBytes`
(domyślnie: 100 MB). OpenClaw zachowuje obok aktywnego pliku do pięciu ponumerowanych
archiwów, takich jak `openclaw-YYYY-MM-DD.1.log`, i kontynuuje zapisywanie do nowego
aktywnego dziennika zamiast pomijać informacje diagnostyczne.

Ścieżkę można zastąpić w pliku `~/.openclaw/openclaw.json`:

```json
{
  "logging": {
    "file": "/path/to/openclaw.log"
  }
}
```

## Jak odczytywać dzienniki

### CLI: śledzenie na żywo (zalecane)

Śledź plik dziennika Gateway przez RPC:

```bash
openclaw logs --follow
```

Opcje:

| Flaga               | Domyślnie | Działanie                                                                                  |
| ------------------- | --------- | ------------------------------------------------------------------------------------------ |
| `--follow`          | wyłączone | Kontynuuje śledzenie; po rozłączeniu ponawia połączenie z narastającym opóźnieniem          |
| `--limit <n>`       | `200`     | Maksymalna liczba wierszy na pobranie                                                       |
| `--max-bytes <n>`   | `250000`  | Maksymalna liczba bajtów odczytywanych na pobranie                                          |
| `--interval <ms>`   | `1000`    | Interwał odpytywania podczas śledzenia                                                      |
| `--json`            | wyłączone | JSON rozdzielany wierszami (jedno zdarzenie na wiersz)                                      |
| `--plain`           | wyłączone | Wymusza zwykły tekst w sesjach TTY                                                          |
| `--no-color`        | —         | Wyłącza kolory ANSI                                                                         |
| `--utc`             | wyłączone | Wyświetla znaczniki czasu w UTC (domyślnie używany jest czas lokalny)                       |
| `--local-time`      | wyłączone | Akceptowany wariant zgodności dla domyślnego czasu lokalnego; poza tym nie ma żadnego efektu |
| `--url` / `--token` | —         | Standardowe flagi RPC Gateway                                                               |
| `--timeout <ms>`    | `30000`   | Limit czasu RPC Gateway                                                                     |
| `--expect-final`    | wyłączone | Flaga oczekiwania na końcową odpowiedź RPC obsługiwanego przez agenta (akceptowana tutaj przez współdzieloną warstwę klienta) |

Tryby danych wyjściowych:

- **Sesje TTY**: czytelne, kolorowe i ustrukturyzowane wiersze dziennika.
- **Sesje inne niż TTY**: zwykły tekst.

Po przekazaniu jawnej flagi `--url` CLI nie stosuje automatycznie danych uwierzytelniających
z konfiguracji ani środowiska; należy samodzielnie podać `--token`, w przeciwnym razie wywołanie zakończy się
błędem `gateway url override requires explicit credentials`.

W trybie JSON CLI emituje obiekty oznaczone polem `type`:

- `meta`: metadane strumienia (plik, źródło, rodzaj źródła, usługa, kursor, rozmiar)
- `log`: przeanalizowany wpis dziennika
- `notice`: wskazówki dotyczące obcięcia lub rotacji
- `raw`: nieprzeanalizowany wiersz dziennika
- `error`: błędy połączenia z Gateway (zapisywane do stderr)

Jeśli niejawny Gateway local loopback zażąda parowania, zamknie połączenie podczas nawiązywania
albo przekroczy limit czasu przed odpowiedzią `logs.tail`, polecenie `openclaw logs` automatycznie
przełączy się na skonfigurowany plik dziennika Gateway. Jawne cele `--url` nie korzystają
z tego mechanizmu awaryjnego. `openclaw logs --follow` jest bardziej rygorystyczne: w systemie Linux używa
dziennika aktywnej usługi Gateway użytkownika w systemd według PID, jeśli jest dostępny, a w przeciwnym razie ponawia
połączenie z działającym Gateway z narastającym opóźnieniem zamiast śledzić potencjalnie nieaktualny
plik znajdujący się obok.

Jeśli Gateway jest nieosiągalny, CLI wyświetla krótką wskazówkę, aby uruchomić:

```bash
openclaw doctor
```

### Interfejs sterowania (WWW)

Karta **Dzienniki** interfejsu sterowania śledzi ten sam plik za pomocą `logs.tail`.
Informacje o jego otwieraniu zawiera strona [Interfejs sterowania](/pl/web/control-ui).

### Dzienniki tylko dla kanałów

Aby filtrować aktywność kanałów (WhatsApp/Telegram/itp.), użyj:

```bash
openclaw channels logs --channel whatsapp
```

Domyślną wartością `--channel` jest `all`; dostępne są również `--lines <n>` (domyślnie 200)
i `--json`.

## Formaty dzienników

### Dzienniki plikowe (JSONL)

Każdy wiersz pliku dziennika jest obiektem JSON. CLI i interfejs sterowania analizują te
wpisy, aby wyświetlać ustrukturyzowane dane wyjściowe (czas, poziom, podsystem, komunikat).

Rekordy JSONL dziennika plikowego zawierają także, gdy są dostępne, pola najwyższego poziomu
umożliwiające filtrowanie maszynowe:

- `hostname`: nazwa hosta Gateway.
- `message`: spłaszczony tekst komunikatu dziennika do wyszukiwania pełnotekstowego.
- `agent_id`: identyfikator aktywnego agenta, gdy wywołanie dziennika zawiera kontekst agenta.
- `session_id`: identyfikator lub klucz aktywnej sesji, gdy wywołanie dziennika zawiera kontekst sesji.
- `channel`: aktywny kanał, gdy wywołanie dziennika zawiera kontekst kanału.

OpenClaw zachowuje oryginalne ustrukturyzowane argumenty dziennika obok tych pól,
dzięki czemu istniejące parsery odczytujące numerowane klucze argumentów tslog nadal działają.

Aktywność rozmów, głosu w czasie rzeczywistym i zarządzanych pokojów emituje ograniczone rekordy dziennika
cyklu życia przez ten sam potok dziennika plikowego. Rekordy te zawierają typ zdarzenia,
tryb, transport, dostawcę oraz pomiary rozmiaru i czasu, jeśli są dostępne, ale pomijają
tekst transkrypcji, ładunki audio, identyfikatory tur, identyfikatory połączeń i identyfikatory elementów dostawcy.

### Dane wyjściowe konsoli

Dzienniki konsoli **uwzględniają TTY** i są formatowane pod kątem czytelności:

- Prefiksy podsystemów (np. `gateway/channels/whatsapp`)
- Kolorowanie poziomów (informacje/ostrzeżenia/błędy)
- Opcjonalny tryb kompaktowy lub JSON

Formatowaniem konsoli steruje `logging.consoleStyle`.

### Dzienniki WebSocket Gateway

Polecenie `openclaw gateway` obsługuje również rejestrowanie protokołu WebSocket dla ruchu RPC:

- tryb normalny: tylko istotne wyniki (błędy, błędy analizy, wolne wywołania)
- `--verbose`: cały ruch żądań i odpowiedzi
- `--ws-log auto|compact|full`: wybór szczegółowego stylu wyświetlania
- `--compact`: alias dla `--ws-log compact`

Przykłady:

```bash
openclaw gateway
openclaw gateway --verbose --ws-log compact
openclaw gateway --verbose --ws-log full
```

## Konfigurowanie rejestrowania

Cała konfiguracja rejestrowania znajduje się w sekcji `logging` pliku `~/.openclaw/openclaw.json`.

```json
{
  "logging": {
    "level": "info",
    "file": "/tmp/openclaw/openclaw-YYYY-MM-DD.log",
    "consoleLevel": "info",
    "consoleStyle": "pretty",
    "redactSensitive": "tools",
    "redactPatterns": ["sk-.*"]
  }
}
```

### Poziomy dzienników

Poziomy: `silent`, `fatal`, `error`, `warn`, `info`, `debug`, `trace`.

- `logging.level`: poziom **dzienników plikowych** (JSONL) (domyślnie: `info`).
- `logging.consoleLevel`: poziom szczegółowości **konsoli**.

Obie wartości można zastąpić za pomocą zmiennej środowiskowej **`OPENCLAW_LOG_LEVEL`** (np. `OPENCLAW_LOG_LEVEL=debug`). Zmienna środowiskowa ma pierwszeństwo przed plikiem konfiguracyjnym, dzięki czemu można zwiększyć szczegółowość pojedynczego uruchomienia bez edytowania pliku `openclaw.json`. Można również przekazać globalną opcję CLI **`--log-level <level>`** (na przykład `openclaw --log-level debug gateway run`), która dla danego polecenia zastępuje zmienną środowiskową.

`--verbose` wpływa wyłącznie na dane wyjściowe konsoli i szczegółowość dziennika WS; nie zmienia
poziomów dzienników plikowych.

### Ukierunkowana diagnostyka transportu modelu

Podczas debugowania wywołań dostawcy należy używać ukierunkowanych flag środowiskowych zamiast zwiększać
poziom wszystkich dzienników do `debug`:

```bash
OPENCLAW_DEBUG_MODEL_TRANSPORT=1 openclaw gateway
OPENCLAW_DEBUG_MODEL_PAYLOAD=tools OPENCLAW_DEBUG_SSE=events openclaw gateway
```

Dostępne flagi:

- `OPENCLAW_DEBUG_MODEL_TRANSPORT=1`: emituje rozpoczęcie żądania, odpowiedź pobierania, nagłówki
  SDK, pierwsze zdarzenie strumieniowe, zakończenie strumienia i błędy transportu na
  poziomie `info`.
- `OPENCLAW_DEBUG_MODEL_PAYLOAD=summary`: uwzględnia ograniczone podsumowanie ładunku żądania
  w dziennikach żądań modelu.
- `OPENCLAW_DEBUG_MODEL_PAYLOAD=tools`: uwzględnia w podsumowaniu ładunku wszystkie nazwy narzędzi
  widoczne dla modelu.
- `OPENCLAW_DEBUG_MODEL_PAYLOAD=full-redacted`: uwzględnia zredagowaną, ograniczoną migawkę ładunku
  JSON. Używaj tylko podczas debugowania; sekrety są redagowane, ale monity
  i tekst wiadomości mogą nadal być obecne.
- `OPENCLAW_DEBUG_SSE=events`: emituje pomiary czasu pierwszego zdarzenia i zakończenia strumienia.
- `OPENCLAW_DEBUG_SSE=peek`: emituje również ładunki pierwszych pięciu zredagowanych zdarzeń
  SSE, z limitem dla każdego zdarzenia.
- `OPENCLAW_DEBUG_CODE_MODE=1`: emituje diagnostykę powierzchni modelu w trybie kodu,
  w tym informacje o ukrywaniu natywnych narzędzi dostawcy, ponieważ powierzchnia narzędzi
  należy do trybu kodu.

Te flagi zapisują dane przez standardowy mechanizm rejestrowania OpenClaw, więc `openclaw logs --follow`
i karta Dzienniki interfejsu sterowania je wyświetlają. Bez tych flag te same informacje diagnostyczne
pozostają dostępne na poziomie `debug`.

Metadane rozpoczęcia i odpowiedzi `[model-fetch]` (dostawca, API, model, stan,
opóźnienie oraz pola żądania, takie jak metoda, adres URL, limit czasu, serwer proxy i zasady)
są zawsze emitowane na poziomie `info`, niezależnie od
`OPENCLAW_DEBUG_MODEL_TRANSPORT`, dzięki czemu podstawowa poprawność transportu modelu jest widoczna
bez flag debugowania.

### Korelacja śladów

Dzienniki plikowe mają format JSONL. Gdy wywołanie dziennika zawiera prawidłowy kontekst śladu diagnostycznego,
OpenClaw zapisuje pola śladu jako klucze JSON najwyższego poziomu (`traceId`, `spanId`,
`parentSpanId`, `traceFlags`), aby zewnętrzne procesory dzienników mogły skorelować wiersz
z zakresami OTEL i propagacją `traceparent` dostawcy.

Żądania HTTP Gateway i ramki WebSocket Gateway ustanawiają wewnętrzny zakres śladu
żądania. Dzienniki i zdarzenia diagnostyczne emitowane w tym zakresie asynchronicznym dziedziczą
ślad żądania, jeśli nie przekazują jawnego kontekstu śladu. Ślady uruchomienia agenta i
wywołań modelu stają się elementami podrzędnymi aktywnego śladu żądania, dzięki czemu lokalne dzienniki,
migawki diagnostyczne, zakresy OTEL i zaufane nagłówki `traceparent` dostawcy można
łączyć według `traceId` bez rejestrowania surowej treści żądania lub modelu.

Rekordy dziennika cyklu życia rozmów są również przekazywane do eksportu dzienników diagnostics-otel, gdy
eksport dzienników OpenTelemetry jest włączony, z użyciem tych samych ograniczonych atrybutów co dzienniki plikowe.
Skonfiguruj `diagnostics.otel.logsExporter`, aby wybrać OTLP, standardowe wyjście JSONL lub
oba miejsca docelowe.

### Rozmiar i czas wywołania modelu

Diagnostyka wywołań modelu rejestruje ograniczone pomiary żądań i odpowiedzi bez
przechwytywania surowej treści monitu ani odpowiedzi:

- `requestPayloadBytes`: rozmiar końcowego ładunku żądania modelu w bajtach UTF-8
- `responseStreamBytes`: rozmiar ładunków fragmentów strumieniowej odpowiedzi modelu w bajtach UTF-8.
  Częste zdarzenia różnicowe tekstu, rozumowania i wywołań narzędzi zliczają
  wyłącznie przyrostowe bajty `delta`, a nie pełne migawki `partial`.
- `timeToFirstByteMs`: czas, który upłynął przed pierwszym zdarzeniem odpowiedzi strumieniowej
- `durationMs`: całkowity czas trwania wywołania modelu

Pola te są dostępne dla migawek diagnostycznych, haków Pluginów wywołań modelu oraz
zakresów i metryk wywołań modelu OTEL, gdy eksport diagnostyki jest włączony.

### Style konsoli

`logging.consoleStyle`:

- `pretty`: czytelny dla człowieka, kolorowy, ze znacznikami czasu.
- `compact`: bardziej zwięzłe dane wyjściowe (najlepsze dla długich sesji).
- `json`: jeden obiekt JSON na wiersz (dla procesorów dzienników).

### Redagowanie

OpenClaw może redagować poufne tokeny, zanim trafią do danych wyjściowych konsoli, dzienników plikowych,
rekordów dziennika OTLP, utrwalonego tekstu transkrypcji sesji lub ładunków zdarzeń
narzędzi interfejsu sterowania (argumenty uruchomienia narzędzia, częściowe i końcowe ładunki wyników, pochodne
dane wyjściowe wykonania oraz podsumowania poprawek):

- `logging.redactSensitive`: `off` | `tools` (domyślnie: `tools`)
- `logging.redactPatterns`: lista ciągów wyrażeń regularnych zastępująca domyślny zestaw dla danych wyjściowych dzienników i transkrypcji. W przypadku ładunków narzędzi interfejsu sterowania niestandardowe wzorce są stosowane dodatkowo do wbudowanych wartości domyślnych, więc dodanie wzorca nigdy nie osłabia redagowania wartości już wykrywanych przez ustawienia domyślne.

Dzienniki plikowe i transkrypcje sesji pozostają w formacie JSONL, ale pasujące wartości sekretów są
maskowane przed zapisaniem wiersza lub wiadomości na dysku. Redagowanie działa na zasadzie najlepszych starań:
obejmuje treść wiadomości zawierającą tekst i ciągi dziennika, ale nie każde
pole identyfikatora ani ładunku binarnego.

Wbudowane ustawienia domyślne obejmują typowe dane uwierzytelniające API oraz nazwy
pól danych uwierzytelniających płatności, takie jak numer karty, CVC/CVV,
współdzielony token płatniczy i dane uwierzytelniające płatności, gdy występują
jako pola JSON, parametry URL, flagi CLI lub przypisania.

`logging.redactSensitive: "off"` wyłącza tylko tę ogólną zasadę dotyczącą
dzienników i transkrypcji. OpenClaw nadal redaguje ładunki na granicach
bezpieczeństwa, które mogą być wyświetlane klientom interfejsu użytkownika,
dołączane do pakietów pomocy technicznej, udostępniane obserwatorom
diagnostycznym, wyświetlane w monitach o zatwierdzenie lub przekazywane
narzędziom agenta. Przykłady obejmują zdarzenia wywołań narzędzi w interfejsie
Control UI, dane wyjściowe `sessions_history`, diagnostyczne eksporty dla pomocy
technicznej, obserwacje błędów dostawców, wyświetlanie poleceń wymagających
zatwierdzenia wykonania oraz dzienniki protokołu WebSocket Gateway. Niestandardowe
wzorce `logging.redactPatterns` mogą nadal dodawać wzorce specyficzne dla
projektu na tych powierzchniach.

## Diagnostyka i OpenTelemetry

Diagnostyka obejmuje ustrukturyzowane zdarzenia przeznaczone do odczytu
maszynowego, dotyczące uruchomień modeli oraz telemetrii przepływu wiadomości
(Webhooki, kolejkowanie, stan sesji). **Nie** zastępuje ona dzienników — zasila
metryki, ślady i eksportery. Zdarzenia są domyślnie emitowane w obrębie procesu
(aby je wyłączyć, ustaw `diagnostics.enabled: false`); ich eksportowanie jest
oddzielną funkcją.

Dwie powiązane powierzchnie:

- **Eksport OpenTelemetry** — wysyłanie metryk, śladów i dzienników przez
  OTLP/HTTP do dowolnego kolektora lub zaplecza zgodnego z OpenTelemetry
  (Datadog, Grafana, Honeycomb, New Relic, Tempo itp.). Pełna konfiguracja,
  katalog sygnałów, nazwy metryk i segmentów, zmienne środowiskowe oraz model
  prywatności znajdują się na osobnej stronie:
  [Eksport OpenTelemetry](/pl/gateway/opentelemetry).
- **Flagi diagnostyczne** — ukierunkowane flagi dzienników debugowania, które
  kierują dodatkowe wpisy do `logging.file` bez podnoszenia poziomu
  `logging.level`. Wielkość liter we flagach nie ma znaczenia, a flagi obsługują
  symbole wieloznaczne (`telegram.*`, `*`). Skonfiguruj je w
  `diagnostics.flags` lub za pomocą nadpisania przez zmienną środowiskową
  `OPENCLAW_DIAGNOSTICS=...`. Pełny przewodnik:
  [Flagi diagnostyczne](/pl/diagnostics/flags).

Informacje o eksporcie OTLP do kolektora zawiera strona [Eksport OpenTelemetry](/pl/gateway/opentelemetry).

## Wskazówki dotyczące rozwiązywania problemów

- **Brak dostępu do Gateway?** Najpierw uruchom `openclaw doctor`.
- **Dzienniki są puste?** Sprawdź, czy Gateway działa i zapisuje dane w ścieżce
  pliku określonej w `logging.file`.
- **Potrzebujesz więcej szczegółów?** Ustaw `logging.level` na `debug` lub
  `trace` i spróbuj ponownie.

## Powiązane materiały

- [Eksport OpenTelemetry](/pl/gateway/opentelemetry) — eksport OTLP/HTTP, katalog metryk i segmentów, model prywatności
- [Flagi diagnostyczne](/pl/diagnostics/flags) — ukierunkowane flagi dzienników debugowania
- [Wewnętrzne mechanizmy rejestrowania Gateway](/pl/gateway/logging) — style dzienników WS, prefiksy podsystemów i przechwytywanie konsoli
- [Dokumentacja konfiguracji](/pl/gateway/configuration-reference#diagnostics) — pełna dokumentacja pól `diagnostics.*`

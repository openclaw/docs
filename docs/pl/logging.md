---
read_when:
    - Potrzebujesz przystępnego dla początkujących omówienia rejestrowania logów w OpenClaw
    - Chcesz skonfigurować poziomy logowania, formaty lub maskowanie danych
    - Diagnozujesz problem i musisz szybko znaleźć dzienniki
summary: Pliki dzienników, wyjście konsoli, śledzenie CLI i karta Dzienniki w Control UI
title: Rejestrowanie
x-i18n:
    generated_at: "2026-05-06T17:58:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 218f68c5111b6de01dc14707dad132d15d5e78c8e906af8a5416e618807663ac
    source_path: logging.md
    workflow: 16
---

OpenClaw ma dwie główne powierzchnie dzienników:

- **Dzienniki plikowe** (wiersze JSON) zapisywane przez Gateway.
- **Wyjście konsoli** widoczne w terminalach i interfejsie debugowania Gateway.

Karta **Dzienniki** w Control UI śledzi plik dziennika gateway. Ta strona wyjaśnia, gdzie
znajdują się dzienniki, jak je czytać oraz jak konfigurować poziomy i formaty dzienników.

## Gdzie znajdują się dzienniki

Domyślnie Gateway zapisuje rotowany plik dziennika w:

`/tmp/openclaw/openclaw-YYYY-MM-DD.log`

Data używa lokalnej strefy czasowej hosta gateway.

Każdy plik jest rotowany po osiągnięciu `logging.maxFileBytes` (domyślnie: 100 MB).
OpenClaw przechowuje do pięciu ponumerowanych archiwów obok aktywnego pliku, na przykład
`openclaw-YYYY-MM-DD.1.log`, i kontynuuje zapis do świeżego aktywnego dziennika zamiast
tłumić diagnostykę.

Możesz to nadpisać w `~/.openclaw/openclaw.json`:

```json
{
  "logging": {
    "file": "/path/to/openclaw.log"
  }
}
```

## Jak czytać dzienniki

### CLI: śledzenie na żywo (zalecane)

Użyj CLI, aby śledzić plik dziennika gateway przez RPC:

```bash
openclaw logs --follow
```

Przydatne bieżące opcje:

- `--local-time`: renderuj znaczniki czasu w lokalnej strefie czasowej
- `--url <url>` / `--token <token>` / `--timeout <ms>`: standardowe flagi RPC Gateway
- `--expect-final`: flaga oczekiwania na końcową odpowiedź RPC obsługiwaną przez agenta (akceptowana tutaj przez współdzieloną warstwę klienta)

Tryby wyjścia:

- **Sesje TTY**: czytelne, kolorowane, ustrukturyzowane wiersze dziennika.
- **Sesje inne niż TTY**: zwykły tekst.
- `--json`: JSON rozdzielany wierszami (jedno zdarzenie dziennika na wiersz).
- `--plain`: wymuś zwykły tekst w sesjach TTY.
- `--no-color`: wyłącz kolory ANSI.

Gdy przekażesz jawne `--url`, CLI nie stosuje automatycznie konfiguracji ani
poświadczeń ze środowiska; dodaj samodzielnie `--token`, jeśli docelowy Gateway
wymaga uwierzytelnienia.

W trybie JSON CLI emituje obiekty oznaczone `type`:

- `meta`: metadane strumienia (plik, kursor, rozmiar)
- `log`: sparsowany wpis dziennika
- `notice`: wskazówki o obcięciu / rotacji
- `raw`: niesparsowany wiersz dziennika

Jeśli niejawny Gateway przez local loopback poprosi o parowanie, zamknie się podczas łączenia
albo przekroczy limit czasu, zanim `logs.tail` odpowie, `openclaw logs` automatycznie przełącza się na
skonfigurowany plik dziennika Gateway. Jawne cele `--url` nie używają
tego mechanizmu awaryjnego.

Jeśli Gateway jest nieosiągalny, CLI wypisuje krótką wskazówkę, aby uruchomić:

```bash
openclaw doctor
```

### Control UI (web)

Karta **Dzienniki** w Control UI śledzi ten sam plik za pomocą `logs.tail`.
Zobacz [Control UI](/pl/web/control-ui), aby dowiedzieć się, jak go otworzyć.

### Dzienniki tylko kanału

Aby filtrować aktywność kanału (WhatsApp/Telegram/itd.), użyj:

```bash
openclaw channels logs --channel whatsapp
```

## Formaty dzienników

### Dzienniki plikowe (JSONL)

Każdy wiersz w pliku dziennika jest obiektem JSON. CLI i Control UI parsują te
wpisy, aby renderować ustrukturyzowane wyjście (czas, poziom, podsystem, komunikat).

Rekordy JSONL dziennika plikowego zawierają też filtrowalne maszynowo pola najwyższego poziomu, gdy
są dostępne:

- `hostname`: nazwa hosta gateway.
- `message`: spłaszczony tekst komunikatu dziennika do wyszukiwania pełnotekstowego.
- `agent_id`: identyfikator aktywnego agenta, gdy wywołanie dziennika niesie kontekst agenta.
- `session_id`: identyfikator/klucz aktywnej sesji, gdy wywołanie dziennika niesie kontekst sesji.
- `channel`: aktywny kanał, gdy wywołanie dziennika niesie kontekst kanału.

OpenClaw zachowuje oryginalne ustrukturyzowane argumenty dziennika obok tych pól,
więc istniejące parsery odczytujące numerowane klucze argumentów tslog nadal działają.

Aktywność rozmów, głosu w czasie rzeczywistym i zarządzanych pokojów emituje ograniczone rekordy dziennika cyklu życia
przez ten sam potok dziennika plikowego. Te rekordy zawierają typ zdarzenia,
tryb, transport, dostawcę oraz pomiary rozmiaru/czasu, gdy są dostępne, ale pomijają
tekst transkrypcji, ładunki audio, identyfikatory tur, identyfikatory połączeń i identyfikatory elementów dostawcy.

### Wyjście konsoli

Dzienniki konsoli są **świadome TTY** i formatowane pod czytelność:

- Prefiksy podsystemów (np. `gateway/channels/whatsapp`)
- Kolorowanie poziomów (info/warn/error)
- Opcjonalny tryb kompaktowy lub JSON

Formatowaniem konsoli steruje `logging.consoleStyle`.

### Dzienniki WebSocket Gateway

`openclaw gateway` ma też logowanie protokołu WebSocket dla ruchu RPC:

- tryb normalny: tylko interesujące wyniki (błędy, błędy parsowania, wolne wywołania)
- `--verbose`: cały ruch żądań/odpowiedzi
- `--ws-log auto|compact|full`: wybierz styl renderowania szczegółowego
- `--compact`: alias dla `--ws-log compact`

Przykłady:

```bash
openclaw gateway
openclaw gateway --verbose --ws-log compact
openclaw gateway --verbose --ws-log full
```

## Konfigurowanie logowania

Cała konfiguracja logowania znajduje się w sekcji `logging` w `~/.openclaw/openclaw.json`.

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

- `logging.level`: poziom **dzienników plikowych** (JSONL).
- `logging.consoleLevel`: poziom szczegółowości **konsoli**.

Możesz nadpisać oba za pomocą zmiennej środowiskowej **`OPENCLAW_LOG_LEVEL`** (np. `OPENCLAW_LOG_LEVEL=debug`). Zmienna środowiskowa ma pierwszeństwo przed plikiem konfiguracji, więc możesz zwiększyć szczegółowość dla pojedynczego uruchomienia bez edytowania `openclaw.json`. Możesz też przekazać globalną opcję CLI **`--log-level <level>`** (na przykład `openclaw --log-level debug gateway run`), która nadpisuje zmienną środowiskową dla tego polecenia.

`--verbose` wpływa tylko na wyjście konsoli i szczegółowość dziennika WS; nie zmienia
poziomów dziennika plikowego.

### Korelacja śladów

Dzienniki plikowe są w formacie JSONL. Gdy wywołanie dziennika niesie prawidłowy kontekst śladu diagnostycznego,
OpenClaw zapisuje pola śladu jako klucze JSON najwyższego poziomu (`traceId`, `spanId`,
`parentSpanId`, `traceFlags`), aby zewnętrzne procesory dzienników mogły skorelować wiersz
ze spanami OTEL i propagacją `traceparent` dostawcy.

Żądania HTTP Gateway i ramki WebSocket Gateway ustanawiają wewnętrzny zakres śladu żądania.
Dzienniki i zdarzenia diagnostyczne emitowane wewnątrz tego zakresu asynchronicznego dziedziczą
ślad żądania, gdy nie przekazują jawnego kontekstu śladu. Ślady uruchomień agenta i
wywołań modelu stają się dziećmi aktywnego śladu żądania, więc lokalne dzienniki,
migawki diagnostyczne, spany OTEL i zaufane nagłówki `traceparent` dostawcy mogą
być łączone przez `traceId` bez logowania surowej treści żądania lub modelu.

Rekordy dziennika cyklu życia rozmowy trafiają też do dzienników OTLP, gdy eksport dzienników OpenTelemetry
jest włączony, używając tych samych ograniczonych atrybutów co dzienniki plikowe.

### Rozmiar i czas wywołania modelu

Diagnostyka wywołań modelu zapisuje ograniczone pomiary żądania/odpowiedzi bez
przechwytywania surowej treści promptu ani odpowiedzi:

- `requestPayloadBytes`: rozmiar w bajtach UTF-8 końcowego ładunku żądania modelu
- `responseStreamBytes`: rozmiar w bajtach UTF-8 strumieniowanych zdarzeń odpowiedzi modelu
- `timeToFirstByteMs`: czas, który upłynął do pierwszego strumieniowanego zdarzenia odpowiedzi
- `durationMs`: całkowity czas trwania wywołania modelu

Te pola są dostępne dla migawek diagnostycznych, haków Plugin wywołań modelu oraz
spanów/metryk wywołań modelu OTEL, gdy eksport diagnostyki jest włączony.

### Style konsoli

`logging.consoleStyle`:

- `pretty`: przyjazny dla człowieka, kolorowany, ze znacznikami czasu.
- `compact`: bardziej zwięzłe wyjście (najlepsze dla długich sesji).
- `json`: JSON na wiersz (dla procesorów dzienników).

### Redagowanie

OpenClaw może redagować wrażliwe tokeny, zanim trafią do wyjścia konsoli, dzienników plikowych,
rekordów dziennika OTLP, utrwalonego tekstu transkrypcji sesji albo ładunków zdarzeń narzędzi
Control UI (argumenty uruchomienia narzędzia, częściowe/końcowe ładunki wyników, pochodne
wyjście exec i podsumowania poprawek):

- `logging.redactSensitive`: `off` | `tools` (domyślnie: `tools`)
- `logging.redactPatterns`: lista ciągów regex nadpisujących domyślny zestaw. Własne wzorce stosują się ponad wbudowanymi wartościami domyślnymi dla ładunków narzędzi Control UI, więc dodanie wzorca nigdy nie osłabia redagowania wartości już wychwytywanych przez wartości domyślne.

Dzienniki plikowe i transkrypcje sesji pozostają w formacie JSONL, ale pasujące wartości sekretów są
maskowane, zanim wiersz lub komunikat zostanie zapisany na dysku. Redagowanie jest najlepszą możliwą próbą:
stosuje się do treści komunikatów zawierających tekst i ciągów dziennika, nie do każdego
identyfikatora ani pola ładunku binarnego.

Wbudowane wartości domyślne obejmują typowe poświadczenia API i nazwy pól poświadczeń płatniczych,
takie jak numer karty, CVC/CVV, współdzielony token płatniczy i poświadczenie płatnicze,
gdy pojawiają się jako pola JSON, parametry URL, flagi CLI lub przypisania.

`logging.redactSensitive: "off"` wyłącza tylko tę ogólną politykę dzienników/transkrypcji.
OpenClaw nadal redaguje ładunki na granicy bezpieczeństwa, które mogą być pokazywane klientom UI,
pakietom wsparcia, obserwatorom diagnostyki, promptom zatwierdzania lub narzędziom agenta.
Przykłady obejmują zdarzenia wywołań narzędzi Control UI, wyjście `sessions_history`,
eksporty diagnostyczne dla wsparcia, obserwacje błędów dostawcy, wyświetlanie polecenia do zatwierdzenia exec
oraz dzienniki protokołu WebSocket Gateway. Własne `logging.redactPatterns`
mogą nadal dodawać wzorce specyficzne dla projektu na tych powierzchniach.

## Diagnostyka i OpenTelemetry

Diagnostyka to ustrukturyzowane, czytelne maszynowo zdarzenia dla uruchomień modelu i
telemetrii przepływu wiadomości (Webhook, kolejkowanie, stan sesji). Nie
zastępują dzienników — zasilają metryki, ślady i eksportery. Zdarzenia są emitowane
w procesie niezależnie od tego, czy je eksportujesz.

Dwie sąsiadujące powierzchnie:

- **Eksport OpenTelemetry** — wysyłaj metryki, ślady i dzienniki przez OTLP/HTTP do
  dowolnego kolektora lub backendu zgodnego z OpenTelemetry (Grafana, Datadog,
  Honeycomb, New Relic, Tempo itd.). Pełna konfiguracja, katalog sygnałów,
  nazwy metryk/spanów, zmienne środowiskowe i model prywatności znajdują się na dedykowanej stronie:
  [Eksport OpenTelemetry](/pl/gateway/opentelemetry).
- **Flagi diagnostyczne** — ukierunkowane flagi dzienników debugowania, które kierują dodatkowe dzienniki do
  `logging.file` bez podnoszenia `logging.level`. Flagi są niewrażliwe na wielkość liter
  i obsługują symbole wieloznaczne (`telegram.*`, `*`). Skonfiguruj je pod `diagnostics.flags`
  albo przez nadpisanie zmienną środowiskową `OPENCLAW_DIAGNOSTICS=...`. Pełny przewodnik:
  [Flagi diagnostyczne](/pl/diagnostics/flags).

Aby włączyć zdarzenia diagnostyczne dla Plugin lub własnych ujść bez eksportu OTLP:

```json5
{
  diagnostics: { enabled: true },
}
```

Eksport OTLP do kolektora opisuje [Eksport OpenTelemetry](/pl/gateway/opentelemetry).

## Wskazówki dotyczące rozwiązywania problemów

- **Gateway nieosiągalny?** Najpierw uruchom `openclaw doctor`.
- **Dzienniki puste?** Sprawdź, czy Gateway działa i zapisuje do ścieżki pliku
  w `logging.file`.
- **Potrzebujesz więcej szczegółów?** Ustaw `logging.level` na `debug` albo `trace` i spróbuj ponownie.

## Powiązane

- [Eksport OpenTelemetry](/pl/gateway/opentelemetry) — eksport OTLP/HTTP, katalog metryk/spanów, model prywatności
- [Flagi diagnostyczne](/pl/diagnostics/flags) — ukierunkowane flagi dzienników debugowania
- [Wewnętrzne logowanie Gateway](/pl/gateway/logging) — style dzienników WS, prefiksy podsystemów i przechwytywanie konsoli
- [Dokumentacja konfiguracji](/pl/gateway/configuration-reference#diagnostics) — pełna dokumentacja pól `diagnostics.*`

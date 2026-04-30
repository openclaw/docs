---
read_when:
    - Potrzebujesz przystępnego dla początkujących omówienia rejestrowania zdarzeń w OpenClaw
    - Chcesz skonfigurować poziomy logowania, formaty lub maskowanie
    - Diagnozujesz problem i musisz szybko znaleźć logi
summary: Logi plików, dane wyjściowe konsoli, śledzenie logów w CLI i karta Dzienniki w Control UI
title: Rejestrowanie
x-i18n:
    generated_at: "2026-04-30T10:02:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 916fb03219d571f0302560a4cb6755940575c92fff0b4eab024b9dad53f841ce
    source_path: logging.md
    workflow: 16
---

OpenClaw ma dwie główne powierzchnie dzienników:

- **Dzienniki plikowe** (linie JSON) zapisywane przez Gateway.
- **Wyjście konsoli** wyświetlane w terminalach i interfejsie Gateway Debug UI.

Karta **Logs** w Control UI śledzi plik dziennika gatewaya. Ta strona wyjaśnia, gdzie
znajdują się dzienniki, jak je czytać oraz jak konfigurować poziomy i formaty dzienników.

## Gdzie znajdują się dzienniki

Domyślnie Gateway zapisuje rotowany plik dziennika w:

`/tmp/openclaw/openclaw-YYYY-MM-DD.log`

Data używa lokalnej strefy czasowej hosta gatewaya.

Każdy plik jest rotowany po osiągnięciu `logging.maxFileBytes` (domyślnie: 100 MB).
OpenClaw przechowuje do pięciu numerowanych archiwów obok aktywnego pliku, takich jak
`openclaw-YYYY-MM-DD.1.log`, i kontynuuje zapisywanie do nowego aktywnego dziennika zamiast
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

Użyj CLI, aby śledzić plik dziennika gatewaya przez RPC:

```bash
openclaw logs --follow
```

Przydatne bieżące opcje:

- `--local-time`: renderuje znaczniki czasu w Twojej lokalnej strefie czasowej
- `--url <url>` / `--token <token>` / `--timeout <ms>`: standardowe flagi RPC Gateway
- `--expect-final`: flaga oczekiwania na końcową odpowiedź RPC obsługiwaną przez agenta (akceptowana tutaj przez wspólną warstwę klienta)

Tryby wyjścia:

- **Sesje TTY**: estetyczne, kolorowane, ustrukturyzowane wiersze dziennika.
- **Sesje inne niż TTY**: zwykły tekst.
- `--json`: JSON rozdzielany wierszami (jedno zdarzenie dziennika na wiersz).
- `--plain`: wymusza zwykły tekst w sesjach TTY.
- `--no-color`: wyłącza kolory ANSI.

Gdy przekażesz jawne `--url`, CLI nie stosuje automatycznie konfiguracji ani
poświadczeń ze środowiska; dodaj samodzielnie `--token`, jeśli docelowy Gateway
wymaga uwierzytelnienia.

W trybie JSON CLI emituje obiekty oznaczone polem `type`:

- `meta`: metadane strumienia (plik, kursor, rozmiar)
- `log`: sparsowany wpis dziennika
- `notice`: wskazówki dotyczące obcięcia / rotacji
- `raw`: niesparsowany wiersz dziennika

Jeśli niejawny lokalny Gateway przez local loopback poprosi o parowanie, zamknie połączenie
podczas łączenia albo przekroczy limit czasu przed odpowiedzią `logs.tail`,
`openclaw logs` automatycznie przełączy się awaryjnie na skonfigurowany plik dziennika
Gateway. Jawne cele `--url` nie używają tego mechanizmu awaryjnego.

Jeśli Gateway jest nieosiągalny, CLI wyświetli krótką wskazówkę, aby uruchomić:

```bash
openclaw doctor
```

### Control UI (web)

Karta **Logs** w Control UI śledzi ten sam plik za pomocą `logs.tail`.
Zobacz [/web/control-ui](/pl/web/control-ui), aby dowiedzieć się, jak ją otworzyć.

### Dzienniki tylko kanałów

Aby filtrować aktywność kanałów (WhatsApp/Telegram/itp.), użyj:

```bash
openclaw channels logs --channel whatsapp
```

## Formaty dzienników

### Dzienniki plikowe (JSONL)

Każdy wiersz w pliku dziennika jest obiektem JSON. CLI i Control UI parsują te
wpisy, aby renderować ustrukturyzowane wyjście (czas, poziom, podsystem, komunikat).

Rekordy JSONL dziennika plikowego zawierają też możliwe do filtrowania maszynowo pola
najwyższego poziomu, gdy są dostępne:

- `hostname`: nazwa hosta gatewaya.
- `message`: spłaszczony tekst komunikatu dziennika do wyszukiwania pełnotekstowego.
- `agent_id`: identyfikator aktywnego agenta, gdy wywołanie dziennika niesie kontekst agenta.
- `session_id`: identyfikator/klucz aktywnej sesji, gdy wywołanie dziennika niesie kontekst sesji.
- `channel`: aktywny kanał, gdy wywołanie dziennika niesie kontekst kanału.

OpenClaw zachowuje oryginalne ustrukturyzowane argumenty dziennika obok tych pól,
dzięki czemu istniejące parsery odczytujące numerowane klucze argumentów tslog nadal działają.

### Wyjście konsoli

Dzienniki konsoli są **świadome TTY** i formatowane pod kątem czytelności:

- Prefiksy podsystemów (np. `gateway/channels/whatsapp`)
- Kolorowanie poziomów (info/warn/error)
- Opcjonalny tryb kompaktowy lub JSON

Formatowanie konsoli jest kontrolowane przez `logging.consoleStyle`.

### Dzienniki WebSocket Gateway

`openclaw gateway` ma również rejestrowanie protokołu WebSocket dla ruchu RPC:

- tryb normalny: tylko istotne wyniki (błędy, błędy parsowania, wolne wywołania)
- `--verbose`: cały ruch żądań/odpowiedzi
- `--ws-log auto|compact|full`: wybiera styl renderowania szczegółowego
- `--compact`: alias dla `--ws-log compact`

Przykłady:

```bash
openclaw gateway
openclaw gateway --verbose --ws-log compact
openclaw gateway --verbose --ws-log full
```

## Konfigurowanie dzienników

Cała konfiguracja dzienników znajduje się pod `logging` w `~/.openclaw/openclaw.json`.

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

Możesz nadpisać oba za pomocą zmiennej środowiskowej **`OPENCLAW_LOG_LEVEL`** (np. `OPENCLAW_LOG_LEVEL=debug`). Zmienna środowiskowa ma pierwszeństwo przed plikiem konfiguracyjnym, dzięki czemu możesz zwiększyć szczegółowość dla pojedynczego uruchomienia bez edytowania `openclaw.json`. Możesz też przekazać globalną opcję CLI **`--log-level <level>`** (na przykład `openclaw --log-level debug gateway run`), która nadpisuje zmienną środowiskową dla tego polecenia.

`--verbose` wpływa tylko na wyjście konsoli i szczegółowość dzienników WS; nie zmienia
poziomów dzienników plikowych.

### Korelacja śladów

Dzienniki plikowe są w formacie JSONL. Gdy wywołanie dziennika niesie poprawny kontekst śladu diagnostycznego,
OpenClaw zapisuje pola śladu jako klucze JSON najwyższego poziomu (`traceId`, `spanId`,
`parentSpanId`, `traceFlags`), aby zewnętrzne procesory dzienników mogły skorelować wiersz
ze spanami OTEL i propagacją `traceparent` dostawcy.

Żądania HTTP Gateway i ramki WebSocket Gateway ustanawiają wewnętrzny zakres śladu żądania.
Dzienniki i zdarzenia diagnostyczne emitowane w tym zakresie asynchronicznym dziedziczą
ślad żądania, gdy nie przekazują jawnego kontekstu śladu. Ślady uruchomienia agenta i
wywołań modelu stają się dziećmi aktywnego śladu żądania, dzięki czemu lokalne dzienniki,
migawki diagnostyczne, spany OTEL i zaufane nagłówki `traceparent` dostawcy można
łączyć po `traceId` bez rejestrowania surowej treści żądania lub modelu.

### Rozmiar i czas wywołania modelu

Diagnostyka wywołań modelu zapisuje ograniczone pomiary żądania/odpowiedzi bez
przechwytywania surowej treści promptu lub odpowiedzi:

- `requestPayloadBytes`: rozmiar w bajtach UTF-8 końcowego ładunku żądania modelu
- `responseStreamBytes`: rozmiar w bajtach UTF-8 strumieniowanych zdarzeń odpowiedzi modelu
- `timeToFirstByteMs`: czas, który upłynął przed pierwszym strumieniowanym zdarzeniem odpowiedzi
- `durationMs`: całkowity czas trwania wywołania modelu

Te pola są dostępne dla migawek diagnostycznych, haków pluginów wywołań modelu oraz
spanów/metryk OTEL wywołań modelu, gdy eksport diagnostyki jest włączony.

### Style konsoli

`logging.consoleStyle`:

- `pretty`: przyjazny dla człowieka, kolorowany, ze znacznikami czasu.
- `compact`: bardziej zwarte wyjście (najlepsze dla długich sesji).
- `json`: JSON w każdym wierszu (dla procesorów dzienników).

### Redakcja

OpenClaw może redagować wrażliwe tokeny, zanim trafią do wyjścia konsoli, dzienników plikowych,
rekordów dzienników OTLP, utrwalonego tekstu transkryptu sesji lub ładunków zdarzeń narzędzi
w Control UI (argumenty startu narzędzia, częściowe/końcowe ładunki wyników, pochodne
wyjście exec i podsumowania poprawek):

- `logging.redactSensitive`: `off` | `tools` (domyślnie: `tools`)
- `logging.redactPatterns`: lista ciągów regex nadpisująca domyślny zestaw. Własne wzorce są stosowane dodatkowo do wbudowanych ustawień domyślnych dla ładunków narzędzi Control UI, więc dodanie wzorca nigdy nie osłabia redakcji wartości już wychwytywanych przez ustawienia domyślne.

Dzienniki plikowe i transkrypty sesji pozostają w formacie JSONL, ale pasujące wartości sekretów są
maskowane przed zapisaniem wiersza lub komunikatu na dysku. Redakcja działa na zasadzie najlepszych starań:
obejmuje treść komunikatów zawierającą tekst i ciągi dzienników, a nie każde
pole identyfikatora lub ładunku binarnego.

`logging.redactSensitive: "off"` wyłącza tylko tę ogólną politykę
dzienników/transkryptów. OpenClaw nadal redaguje ładunki na granicach bezpieczeństwa, które mogą być pokazywane klientom UI,
pakietom wsparcia, obserwatorom diagnostyki, promptom zatwierdzeń lub narzędziom agentów.
Przykłady obejmują zdarzenia wywołań narzędzi Control UI, wyjście `sessions_history`,
eksporty wsparcia diagnostyki, obserwacje błędów dostawcy, wyświetlanie poleceń zatwierdzania exec
oraz dzienniki protokołu WebSocket Gateway. Własne `logging.redactPatterns`
nadal mogą dodawać wzorce specyficzne dla projektu na tych powierzchniach.

## Diagnostyka i OpenTelemetry

Diagnostyka to ustrukturyzowane, czytelne maszynowo zdarzenia dla uruchomień modelu i
telemetrii przepływu wiadomości (webhooki, kolejkowanie, stan sesji). **Nie**
zastępują dzienników — zasilają metryki, ślady i eksportery. Zdarzenia są emitowane
w procesie niezależnie od tego, czy je eksportujesz.

Dwie sąsiednie powierzchnie:

- **Eksport OpenTelemetry** — wysyłaj metryki, ślady i dzienniki przez OTLP/HTTP do
  dowolnego kolektora lub backendu zgodnego z OpenTelemetry (Grafana, Datadog,
  Honeycomb, New Relic, Tempo itd.). Pełna konfiguracja, katalog sygnałów,
  nazwy metryk/spanów, zmienne środowiskowe i model prywatności znajdują się na dedykowanej stronie:
  [Eksport OpenTelemetry](/pl/gateway/opentelemetry).
- **Flagi diagnostyki** — ukierunkowane flagi dzienników debugowania, które kierują dodatkowe dzienniki do
  `logging.file` bez podnoszenia `logging.level`. Flagi nie rozróżniają wielkości liter
  i obsługują symbole wieloznaczne (`telegram.*`, `*`). Skonfiguruj je pod `diagnostics.flags`
  lub przez nadpisanie zmienną środowiskową `OPENCLAW_DIAGNOSTICS=...`. Pełny przewodnik:
  [Flagi diagnostyki](/pl/diagnostics/flags).

Aby włączyć zdarzenia diagnostyczne dla pluginów lub własnych ujść bez eksportu OTLP:

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
- **Potrzebujesz więcej szczegółów?** Ustaw `logging.level` na `debug` lub `trace` i spróbuj ponownie.

## Powiązane

- [Eksport OpenTelemetry](/pl/gateway/opentelemetry) — eksport OTLP/HTTP, katalog metryk/spanów, model prywatności
- [Flagi diagnostyki](/pl/diagnostics/flags) — ukierunkowane flagi dzienników debugowania
- [Wewnętrzne mechanizmy dzienników Gateway](/pl/gateway/logging) — style dzienników WS, prefiksy podsystemów i przechwytywanie konsoli
- [Dokumentacja konfiguracji](/pl/gateway/configuration-reference#diagnostics) — pełna dokumentacja pól `diagnostics.*`

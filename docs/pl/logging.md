---
read_when:
    - Potrzebujesz przystępnego dla początkujących omówienia rejestrowania zdarzeń w OpenClaw
    - Chcesz skonfigurować poziomy logowania, formaty lub maskowanie
    - Diagnozujesz problem i musisz szybko znaleźć logi
summary: Dzienniki plików, dane wyjściowe konsoli, śledzenie CLI i karta Dzienniki w Control UI
title: Rejestrowanie
x-i18n:
    generated_at: "2026-05-06T09:19:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: abcdfeb0f9fbd13715762a1829198d0285738855c50f2ee531cab1e989d936b1
    source_path: logging.md
    workflow: 16
---

OpenClaw ma dwie główne powierzchnie logów:

- **Logi plikowe** (wiersze JSON) zapisywane przez Gateway.
- **Wyjście konsoli** pokazywane w terminalach i interfejsie Gateway Debug UI.

Karta **Logs** w Control UI śledzi plik logu gateway. Ta strona wyjaśnia, gdzie
znajdują się logi, jak je czytać oraz jak konfigurować poziomy i formaty logów.

## Gdzie znajdują się logi

Domyślnie Gateway zapisuje rotowany plik logu w:

`/tmp/openclaw/openclaw-YYYY-MM-DD.log`

Data używa lokalnej strefy czasowej hosta gateway.

Każdy plik rotuje po osiągnięciu `logging.maxFileBytes` (domyślnie: 100 MB).
OpenClaw przechowuje do pięciu numerowanych archiwów obok aktywnego pliku, takich jak
`openclaw-YYYY-MM-DD.1.log`, i kontynuuje zapis do nowego aktywnego logu zamiast
tłumić diagnostykę.

Możesz to nadpisać w `~/.openclaw/openclaw.json`:

```json
{
  "logging": {
    "file": "/path/to/openclaw.log"
  }
}
```

## Jak czytać logi

### CLI: śledzenie na żywo (zalecane)

Użyj CLI, aby śledzić plik logu gateway przez RPC:

```bash
openclaw logs --follow
```

Przydatne bieżące opcje:

- `--local-time`: renderuj znaczniki czasu w lokalnej strefie czasowej
- `--url <url>` / `--token <token>` / `--timeout <ms>`: standardowe flagi RPC Gateway
- `--expect-final`: flaga oczekiwania na końcową odpowiedź RPC obsługiwaną przez agenta (akceptowana tutaj przez wspólną warstwę klienta)

Tryby wyjścia:

- **Sesje TTY**: czytelne, kolorowane, strukturalne wiersze logów.
- **Sesje inne niż TTY**: zwykły tekst.
- `--json`: JSON rozdzielany wierszami (jedno zdarzenie logu na wiersz).
- `--plain`: wymuś zwykły tekst w sesjach TTY.
- `--no-color`: wyłącz kolory ANSI.

Gdy przekażesz jawny `--url`, CLI nie stosuje automatycznie konfiguracji ani
poświadczeń ze środowiska; dołącz samodzielnie `--token`, jeśli docelowy Gateway
wymaga uwierzytelnienia.

W trybie JSON CLI emituje obiekty oznaczone `type`:

- `meta`: metadane strumienia (plik, kursor, rozmiar)
- `log`: sparsowany wpis logu
- `notice`: wskazówki dotyczące obcięcia / rotacji
- `raw`: niesparsowany wiersz logu

Jeśli niejawny Gateway local loopback poprosi o parowanie, zamknie połączenie
podczas łączenia albo przekroczy limit czasu zanim `logs.tail` odpowie, `openclaw logs`
automatycznie przełączy się na skonfigurowany plik logu Gateway. Jawne cele `--url`
nie używają tego mechanizmu awaryjnego.

Jeśli Gateway jest nieosiągalny, CLI wypisuje krótką wskazówkę, aby uruchomić:

```bash
openclaw doctor
```

### Control UI (web)

Karta **Logs** w Control UI śledzi ten sam plik przy użyciu `logs.tail`.
Zobacz [Control UI](/pl/web/control-ui), aby dowiedzieć się, jak go otworzyć.

### Logi tylko kanałów

Aby filtrować aktywność kanału (WhatsApp/Telegram/itp.), użyj:

```bash
openclaw channels logs --channel whatsapp
```

## Formaty logów

### Logi plikowe (JSONL)

Każdy wiersz w pliku logu jest obiektem JSON. CLI i Control UI parsują te
wpisy, aby renderować strukturalne wyjście (czas, poziom, podsystem, komunikat).

Rekordy JSONL logów plikowych zawierają także filtrowalne maszynowo pola najwyższego poziomu, gdy
są dostępne:

- `hostname`: nazwa hosta gateway.
- `message`: spłaszczony tekst komunikatu logu do wyszukiwania pełnotekstowego.
- `agent_id`: identyfikator aktywnego agenta, gdy wywołanie logu przenosi kontekst agenta.
- `session_id`: identyfikator/klucz aktywnej sesji, gdy wywołanie logu przenosi kontekst sesji.
- `channel`: aktywny kanał, gdy wywołanie logu przenosi kontekst kanału.

OpenClaw zachowuje oryginalne strukturalne argumenty logu obok tych pól,
dzięki czemu istniejące parsery odczytujące numerowane klucze argumentów tslog nadal działają.

### Wyjście konsoli

Logi konsoli są **świadome TTY** i formatowane pod kątem czytelności:

- Prefiksy podsystemów (np. `gateway/channels/whatsapp`)
- Kolorowanie poziomów (info/warn/error)
- Opcjonalny tryb kompaktowy lub JSON

Formatowanie konsoli kontroluje `logging.consoleStyle`.

### Logi WebSocket Gateway

`openclaw gateway` ma również logowanie protokołu WebSocket dla ruchu RPC:

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

Cała konfiguracja logowania znajduje się pod `logging` w `~/.openclaw/openclaw.json`.

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

### Poziomy logowania

- `logging.level`: poziom **logów plikowych** (JSONL).
- `logging.consoleLevel`: poziom szczegółowości **konsoli**.

Możesz nadpisać oba za pomocą zmiennej środowiskowej **`OPENCLAW_LOG_LEVEL`** (np. `OPENCLAW_LOG_LEVEL=debug`). Zmienna środowiskowa ma pierwszeństwo przed plikiem konfiguracji, więc możesz zwiększyć szczegółowość dla pojedynczego uruchomienia bez edytowania `openclaw.json`. Możesz także przekazać globalną opcję CLI **`--log-level <level>`** (na przykład `openclaw --log-level debug gateway run`), która nadpisuje zmienną środowiskową dla tego polecenia.

`--verbose` wpływa tylko na wyjście konsoli i szczegółowość logów WS; nie zmienia
poziomów logów plikowych.

### Korelacja śladów

Logi plikowe są w formacie JSONL. Gdy wywołanie logu przenosi prawidłowy kontekst śladu diagnostycznego,
OpenClaw zapisuje pola śladu jako klucze JSON najwyższego poziomu (`traceId`, `spanId`,
`parentSpanId`, `traceFlags`), aby zewnętrzne procesory logów mogły korelować wiersz
ze spanami OTEL i propagacją `traceparent` dostawcy.

Żądania HTTP Gateway i ramki WebSocket Gateway ustanawiają wewnętrzny zakres śladu
żądania. Logi i zdarzenia diagnostyczne emitowane w tym zakresie asynchronicznym dziedziczą
ślad żądania, gdy nie przekazują jawnego kontekstu śladu. Ślady uruchomień agentów i
wywołań modeli stają się dziećmi aktywnego śladu żądania, więc lokalne logi,
migawki diagnostyczne, spany OTEL i zaufane nagłówki `traceparent` dostawców można
łączyć według `traceId` bez logowania surowej treści żądań lub modeli.

### Rozmiar i czas wywołań modeli

Diagnostyka wywołań modeli rejestruje ograniczone pomiary żądań/odpowiedzi bez
przechwytywania surowej treści promptu lub odpowiedzi:

- `requestPayloadBytes`: rozmiar w bajtach UTF-8 końcowego ładunku żądania modelu
- `responseStreamBytes`: rozmiar w bajtach UTF-8 strumieniowanych zdarzeń odpowiedzi modelu
- `timeToFirstByteMs`: czas, który upłynął przed pierwszym strumieniowanym zdarzeniem odpowiedzi
- `durationMs`: całkowity czas trwania wywołania modelu

Te pola są dostępne dla migawek diagnostycznych, hooków Plugin wywołań modeli oraz
spanów/metryk wywołań modeli OTEL, gdy eksport diagnostyki jest włączony.

### Style konsoli

`logging.consoleStyle`:

- `pretty`: przyjazny dla człowieka, kolorowany, ze znacznikami czasu.
- `compact`: bardziej zwięzłe wyjście (najlepsze dla długich sesji).
- `json`: JSON na wiersz (dla procesorów logów).

### Redakcja

OpenClaw może redagować wrażliwe tokeny, zanim trafią do wyjścia konsoli, logów plikowych,
rekordów logów OTLP, utrwalonego tekstu transkrypcji sesji albo ładunków zdarzeń narzędzi
Control UI (argumenty startu narzędzia, częściowe/końcowe ładunki wyników, pochodne
wyjście exec i podsumowania patchy):

- `logging.redactSensitive`: `off` | `tools` (domyślnie: `tools`)
- `logging.redactPatterns`: lista ciągów regex do nadpisania domyślnego zestawu. Własne wzorce stosują się dodatkowo do wbudowanych domyślnych dla ładunków narzędzi Control UI, więc dodanie wzorca nigdy nie osłabia redakcji wartości już wychwytywanych przez domyślne ustawienia.

Logi plikowe i transkrypcje sesji pozostają w formacie JSONL, ale pasujące wartości sekretów są
maskowane, zanim wiersz lub komunikat zostanie zapisany na dysku. Redakcja działa na zasadzie najlepszych starań:
stosuje się do treści komunikatów zawierających tekst i ciągów logów, nie do każdego
identyfikatora ani pola ładunku binarnego.

Wbudowane domyślne ustawienia obejmują typowe poświadczenia API i nazwy pól poświadczeń płatniczych,
takie jak numer karty, CVC/CVV, współdzielony token płatniczy i poświadczenie płatnicze,
gdy występują jako pola JSON, parametry URL, flagi CLI lub przypisania.

`logging.redactSensitive: "off"` wyłącza tylko tę ogólną politykę logów/transkrypcji.
OpenClaw nadal redaguje ładunki granicy bezpieczeństwa, które mogą być pokazywane klientom UI,
pakietom wsparcia, obserwatorom diagnostyki, promptom zatwierdzeń lub narzędziom agentów.
Przykłady obejmują zdarzenia wywołań narzędzi Control UI, wyjście `sessions_history`,
eksporty wsparcia diagnostyki, obserwacje błędów dostawców, wyświetlanie poleceń zatwierdzania exec
oraz logi protokołu WebSocket Gateway. Własne `logging.redactPatterns`
mogą nadal dodawać wzorce specyficzne dla projektu na tych powierzchniach.

## Diagnostyka i OpenTelemetry

Diagnostyka to strukturalne, czytelne maszynowo zdarzenia dla uruchomień modeli i
telemetrii przepływu wiadomości (webhooki, kolejkowanie, stan sesji). **Nie**
zastępują logów — zasilają metryki, ślady i eksportery. Zdarzenia są emitowane
w procesie niezależnie od tego, czy je eksportujesz.

Dwie sąsiednie powierzchnie:

- **Eksport OpenTelemetry** — wysyłaj metryki, ślady i logi przez OTLP/HTTP do
  dowolnego kolektora lub backendu zgodnego z OpenTelemetry (Grafana, Datadog,
  Honeycomb, New Relic, Tempo, itp.). Pełna konfiguracja, katalog sygnałów,
  nazwy metryk/spanów, zmienne środowiskowe i model prywatności znajdują się na osobnej stronie:
  [Eksport OpenTelemetry](/pl/gateway/opentelemetry).
- **Flagi diagnostyki** — ukierunkowane flagi logów debugowania, które kierują dodatkowe logi do
  `logging.file` bez podnoszenia `logging.level`. Flagi nie rozróżniają wielkości liter
  i obsługują symbole wieloznaczne (`telegram.*`, `*`). Skonfiguruj je pod `diagnostics.flags`
  albo przez nadpisanie środowiskowe `OPENCLAW_DIAGNOSTICS=...`. Pełny przewodnik:
  [Flagi diagnostyki](/pl/diagnostics/flags).

Aby włączyć zdarzenia diagnostyczne dla pluginów lub własnych odbiorników bez eksportu OTLP:

```json5
{
  diagnostics: { enabled: true },
}
```

W przypadku eksportu OTLP do kolektora zobacz [Eksport OpenTelemetry](/pl/gateway/opentelemetry).

## Wskazówki dotyczące rozwiązywania problemów

- **Gateway nieosiągalny?** Najpierw uruchom `openclaw doctor`.
- **Logi puste?** Sprawdź, czy Gateway działa i zapisuje do ścieżki pliku
  w `logging.file`.
- **Potrzebujesz więcej szczegółów?** Ustaw `logging.level` na `debug` lub `trace` i spróbuj ponownie.

## Powiązane

- [Eksport OpenTelemetry](/pl/gateway/opentelemetry) — eksport OTLP/HTTP, katalog metryk/spanów, model prywatności
- [Flagi diagnostyki](/pl/diagnostics/flags) — ukierunkowane flagi logów debugowania
- [Wewnętrzne mechanizmy logowania Gateway](/pl/gateway/logging) — style logów WS, prefiksy podsystemów i przechwytywanie konsoli
- [Dokumentacja konfiguracji](/pl/gateway/configuration-reference#diagnostics) — pełna dokumentacja pól `diagnostics.*`

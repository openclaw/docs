---
read_when:
    - Potrzebujesz przystępnego dla początkujących omówienia rejestrowania zdarzeń w OpenClaw
    - Chcesz skonfigurować poziomy logowania, formaty lub maskowanie danych
    - Rozwiązujesz problem i musisz szybko znaleźć logi
summary: Dzienniki plików, dane wyjściowe konsoli, śledzenie CLI i karta Dzienniki w interfejsie sterowania
title: Rejestrowanie
x-i18n:
    generated_at: "2026-05-11T20:33:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 49b28755998bbe667dd986ae8440d9006d03b0704679bb6d64b5a148a25fc50e
    source_path: logging.md
    workflow: 16
---

OpenClaw ma dwie główne powierzchnie logów:

- **Logi plikowe** (wiersze JSON) zapisywane przez Gateway.
- **Wyjście konsoli** wyświetlane w terminalach i w interfejsie Gateway Debug UI.

Karta **Logi** w interfejsie Control UI śledzi plik logu gateway. Ta strona wyjaśnia, gdzie
znajdują się logi, jak je czytać oraz jak konfigurować poziomy i formaty logowania.

## Gdzie znajdują się logi

Domyślnie Gateway zapisuje rotowany plik logu pod ścieżką:

`/tmp/openclaw/openclaw-YYYY-MM-DD.log`

Data używa lokalnej strefy czasowej hosta gateway.

Każdy plik jest rotowany po osiągnięciu `logging.maxFileBytes` (domyślnie: 100 MB).
OpenClaw przechowuje obok aktywnego pliku do pięciu numerowanych archiwów, takich jak
`openclaw-YYYY-MM-DD.1.log`, i zapisuje dalej do nowego aktywnego logu zamiast
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

- `--local-time`: renderuje znaczniki czasu w Twojej lokalnej strefie czasowej
- `--url <url>` / `--token <token>` / `--timeout <ms>`: standardowe flagi RPC Gateway
- `--expect-final`: flaga oczekiwania na końcową odpowiedź RPC obsługiwaną przez agenta (akceptowana tutaj przez współdzieloną warstwę klienta)

Tryby wyjścia:

- **Sesje TTY**: estetyczne, kolorowe, ustrukturyzowane wiersze logu.
- **Sesje inne niż TTY**: zwykły tekst.
- `--json`: JSON rozdzielany wierszami (jedno zdarzenie logu na wiersz).
- `--plain`: wymusza zwykły tekst w sesjach TTY.
- `--no-color`: wyłącza kolory ANSI.

Gdy przekażesz jawne `--url`, CLI nie stosuje automatycznie konfiguracji ani
poświadczeń ze środowiska; dodaj samodzielnie `--token`, jeśli docelowy Gateway
wymaga uwierzytelniania.

W trybie JSON CLI emituje obiekty oznaczone polem `type`:

- `meta`: metadane strumienia (plik, kursor, rozmiar)
- `log`: sparsowany wpis logu
- `notice`: wskazówki dotyczące obcięcia / rotacji
- `raw`: niesparsowany wiersz logu

Jeśli niejawny Gateway local loopback poprosi o parowanie, zamknie się podczas łączenia
albo przekroczy limit czasu, zanim `logs.tail` odpowie, `openclaw logs` automatycznie
przełączy się awaryjnie na skonfigurowany plik logu Gateway. Jawne cele `--url` nie używają
tego mechanizmu awaryjnego.

Jeśli Gateway jest nieosiągalny, CLI wypisze krótką wskazówkę, aby uruchomić:

```bash
openclaw doctor
```

### Control UI (web)

Karta **Logi** w interfejsie Control UI śledzi ten sam plik przy użyciu `logs.tail`.
Zobacz [Control UI](/pl/web/control-ui), aby dowiedzieć się, jak go otworzyć.

### Logi tylko kanału

Aby filtrować aktywność kanału (WhatsApp/Telegram/itd.), użyj:

```bash
openclaw channels logs --channel whatsapp
```

## Formaty logów

### Logi plikowe (JSONL)

Każdy wiersz w pliku logu jest obiektem JSON. CLI i Control UI parsują te
wpisy, aby renderować ustrukturyzowane wyjście (czas, poziom, podsystem, komunikat).

Rekordy JSONL logów plikowych zawierają też pola najwyższego poziomu możliwe do filtrowania maszynowo, gdy
są dostępne:

- `hostname`: nazwa hosta gateway.
- `message`: spłaszczony tekst komunikatu logu do wyszukiwania pełnotekstowego.
- `agent_id`: identyfikator aktywnego agenta, gdy wywołanie logowania niesie kontekst agenta.
- `session_id`: identyfikator/klucz aktywnej sesji, gdy wywołanie logowania niesie kontekst sesji.
- `channel`: aktywny kanał, gdy wywołanie logowania niesie kontekst kanału.

OpenClaw zachowuje oryginalne ustrukturyzowane argumenty logu obok tych pól,
dzięki czemu istniejące parsery czytające numerowane klucze argumentów tslog nadal działają.

Aktywność rozmów, głosu w czasie rzeczywistym i zarządzanych pokojów emituje ograniczone rekordy logu cyklu życia
przez ten sam potok logów plikowych. Rekordy te zawierają typ zdarzenia,
tryb, transport, dostawcę oraz pomiary rozmiaru/czasu, gdy są dostępne, ale pomijają
tekst transkrypcji, ładunki audio, identyfikatory tur, identyfikatory połączeń i identyfikatory elementów dostawcy.

### Wyjście konsoli

Logi konsoli są **świadome TTY** i formatowane pod kątem czytelności:

- Prefiksy podsystemów (np. `gateway/channels/whatsapp`)
- Kolorowanie poziomów (info/warn/error)
- Opcjonalny tryb kompaktowy lub JSON

Formatowanie konsoli jest kontrolowane przez `logging.consoleStyle`.

### Logi WebSocket Gateway

`openclaw gateway` ma też logowanie protokołu WebSocket dla ruchu RPC:

- tryb normalny: tylko interesujące wyniki (błędy, błędy parsowania, wolne wywołania)
- `--verbose`: cały ruch żądanie/odpowiedź
- `--ws-log auto|compact|full`: wybiera styl renderowania szczegółowego
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

Możesz nadpisać oba za pomocą zmiennej środowiskowej **`OPENCLAW_LOG_LEVEL`** (np. `OPENCLAW_LOG_LEVEL=debug`). Zmienna środowiskowa ma pierwszeństwo przed plikiem konfiguracji, więc możesz zwiększyć szczegółowość dla pojedynczego uruchomienia bez edytowania `openclaw.json`. Możesz też przekazać globalną opcję CLI **`--log-level <level>`** (na przykład `openclaw --log-level debug gateway run`), która nadpisuje zmienną środowiskową dla tego polecenia.

`--verbose` wpływa tylko na wyjście konsoli i szczegółowość logów WS; nie zmienia
poziomów logów plikowych.

### Ukierunkowana diagnostyka transportu modelu

Podczas debugowania wywołań dostawcy używaj ukierunkowanych flag środowiskowych zamiast zwiększać
wszystkie logi do `debug`:

```bash
OPENCLAW_DEBUG_MODEL_TRANSPORT=1 openclaw gateway
OPENCLAW_DEBUG_MODEL_PAYLOAD=tools OPENCLAW_DEBUG_SSE=events openclaw gateway
```

Dostępne flagi:

- `OPENCLAW_DEBUG_MODEL_TRANSPORT=1`: emituje rozpoczęcie żądania, odpowiedź fetch, nagłówki SDK,
  pierwsze zdarzenie strumieniowania, zakończenie strumienia i błędy transportu na
  poziomie `info`.
- `OPENCLAW_DEBUG_MODEL_PAYLOAD=summary`: dołącza ograniczone podsumowanie ładunku żądania
  do logów żądań modelu.
- `OPENCLAW_DEBUG_MODEL_PAYLOAD=tools`: dołącza wszystkie nazwy narzędzi widoczne dla modelu
  do podsumowania ładunku.
- `OPENCLAW_DEBUG_MODEL_PAYLOAD=full-redacted`: dołącza zredagowaną, ograniczoną migawkę ładunku
  JSON. Używaj tylko podczas debugowania; sekrety są redagowane, ale prompty
  i tekst wiadomości mogą nadal być obecne.
- `OPENCLAW_DEBUG_SSE=events`: emituje czas do pierwszego zdarzenia i czas zakończenia strumienia.
- `OPENCLAW_DEBUG_SSE=peek`: emituje także pierwsze pięć zredagowanych ładunków zdarzeń SSE,
  ograniczonych dla każdego zdarzenia.
- `OPENCLAW_DEBUG_CODE_MODE=1`: emituje diagnostykę powierzchni modelu w trybie kodu,
  w tym sytuacje, gdy natywne narzędzia dostawcy są ukryte, ponieważ tryb kodu posiada
  powierzchnię narzędzi.

Te flagi logują przez normalne logowanie OpenClaw, więc `openclaw logs --follow`
i karta Logi w Control UI je pokazują. Bez tych flag ta sama diagnostyka
pozostaje dostępna na poziomie `debug`.

### Korelacja śladów

Logi plikowe są w formacie JSONL. Gdy wywołanie logowania niesie prawidłowy kontekst śladu diagnostycznego,
OpenClaw zapisuje pola śladu jako klucze JSON najwyższego poziomu (`traceId`, `spanId`,
`parentSpanId`, `traceFlags`), aby zewnętrzne procesory logów mogły skorelować wiersz
ze spanami OTEL i propagacją `traceparent` dostawcy.

Żądania HTTP Gateway i ramki WebSocket Gateway ustanawiają wewnętrzny zakres śladu żądania.
Logi i zdarzenia diagnostyczne emitowane wewnątrz tego zakresu asynchronicznego dziedziczą
ślad żądania, gdy nie przekazują jawnego kontekstu śladu. Ślady uruchomień agentów i
wywołań modelu stają się dziećmi aktywnego śladu żądania, więc lokalne logi,
migawki diagnostyczne, spany OTEL i zaufane nagłówki `traceparent` dostawcy można
łączyć przez `traceId` bez logowania surowej treści żądania lub modelu.

Rekordy logu cyklu życia rozmów trafiają też do logów OTLP, gdy eksport logów OpenTelemetry
jest włączony, używając tych samych ograniczonych atrybutów co logi plikowe.

### Rozmiar i czas wywołań modelu

Diagnostyka wywołań modelu rejestruje ograniczone pomiary żądań/odpowiedzi bez
przechwytywania surowej treści promptu lub odpowiedzi:

- `requestPayloadBytes`: rozmiar w bajtach UTF-8 końcowego ładunku żądania modelu
- `responseStreamBytes`: rozmiar w bajtach UTF-8 strumieniowanych zdarzeń odpowiedzi modelu
- `timeToFirstByteMs`: czas, który upłynął przed pierwszym strumieniowanym zdarzeniem odpowiedzi
- `durationMs`: całkowity czas trwania wywołania modelu

Te pola są dostępne dla migawek diagnostycznych, hooków Plugin wywołań modelu i
spanów/metryk OTEL wywołań modelu, gdy eksport diagnostyki jest włączony.

### Style konsoli

`logging.consoleStyle`:

- `pretty`: przyjazny dla człowieka, kolorowy, ze znacznikami czasu.
- `compact`: bardziej zwarte wyjście (najlepsze dla długich sesji).
- `json`: JSON w każdym wierszu (dla procesorów logów).

### Redagowanie

OpenClaw może redagować wrażliwe tokeny, zanim trafią do wyjścia konsoli, logów plikowych,
rekordów logów OTLP, utrwalonego tekstu transkrypcji sesji lub ładunków zdarzeń narzędzi
w Control UI (argumenty startu narzędzia, częściowe/końcowe ładunki wyników, pochodne
wyjście exec i podsumowania poprawek):

- `logging.redactSensitive`: `off` | `tools` (domyślnie: `tools`)
- `logging.redactPatterns`: lista ciągów regex do nadpisania domyślnego zestawu. Niestandardowe wzorce są stosowane oprócz wbudowanych wartości domyślnych dla ładunków narzędzi Control UI, więc dodanie wzorca nigdy nie osłabia redagowania wartości już wychwytywanych przez wartości domyślne.

Logi plikowe i transkrypcje sesji pozostają JSONL, ale pasujące wartości sekretów są
maskowane przed zapisaniem wiersza lub wiadomości na dysku. Redagowanie jest najlepszym możliwym wysiłkiem:
stosuje się do treści wiadomości zawierającej tekst i ciągów logów, nie do każdego
identyfikatora lub pola ładunku binarnego.

Wbudowane wartości domyślne obejmują typowe poświadczenia API i nazwy pól poświadczeń płatniczych,
takie jak numer karty, CVC/CVV, współdzielony token płatności i poświadczenie płatnicze,
gdy pojawiają się jako pola JSON, parametry URL, flagi CLI lub przypisania.

`logging.redactSensitive: "off"` wyłącza tylko tę ogólną politykę logów/transkrypcji.
OpenClaw nadal redaguje ładunki granicy bezpieczeństwa, które mogą być pokazywane klientom UI,
pakietom wsparcia, obserwatorom diagnostyki, promptom zatwierdzeń lub narzędziom agentów.
Przykłady obejmują zdarzenia wywołań narzędzi Control UI, wyjście `sessions_history`,
eksporty wsparcia diagnostycznego, obserwacje błędów dostawcy, wyświetlanie polecenia zatwierdzenia exec
i logi protokołu WebSocket Gateway. Niestandardowe `logging.redactPatterns`
mogą nadal dodawać wzorce specyficzne dla projektu na tych powierzchniach.

## Diagnostyka i OpenTelemetry

Diagnostyka to ustrukturyzowane, czytelne maszynowo zdarzenia dla uruchomień modelu i
telemetrii przepływu wiadomości (Webhook, kolejkowanie, stan sesji). Nie
zastępują logów — zasilają metryki, ślady i eksportery. Zdarzenia są emitowane
w procesie niezależnie od tego, czy je eksportujesz.

Dwie sąsiednie powierzchnie:

- **Eksport OpenTelemetry** — wysyła metryki, ślady i logi przez OTLP/HTTP do
  dowolnego kolektora lub backendu zgodnego z OpenTelemetry (Grafana, Datadog,
  Honeycomb, New Relic, Tempo itd.). Pełna konfiguracja, katalog sygnałów,
  nazwy metryk/spanów, zmienne środowiskowe i model prywatności znajdują się na dedykowanej stronie:
  [Eksport OpenTelemetry](/pl/gateway/opentelemetry).
- **Flagi diagnostyczne** — ukierunkowane flagi logów debugowania, które kierują dodatkowe logi do
  `logging.file` bez zwiększania `logging.level`. Flagi nie rozróżniają wielkości liter
  i obsługują symbole wieloznaczne (`telegram.*`, `*`). Skonfiguruj w `diagnostics.flags`
  lub przez nadpisanie środowiskowe `OPENCLAW_DIAGNOSTICS=...`. Pełny przewodnik:
  [Flagi diagnostyczne](/pl/diagnostics/flags).

Aby włączyć zdarzenia diagnostyczne dla plugins lub niestandardowych odbiorników bez eksportu OTLP:

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
- [Flagi diagnostyczne](/pl/diagnostics/flags) — ukierunkowane flagi logów debugowania
- [Wewnętrzne mechanizmy logowania Gateway](/pl/gateway/logging) — style logów WS, prefiksy podsystemów i przechwytywanie konsoli
- [Dokumentacja konfiguracji](/pl/gateway/configuration-reference#diagnostics) — pełna dokumentacja pól `diagnostics.*`

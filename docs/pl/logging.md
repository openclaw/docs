---
read_when:
    - Potrzebujesz przystępnego dla początkujących omówienia logowania w OpenClaw
    - Chcesz skonfigurować poziomy logowania, formaty lub maskowanie danych
    - Rozwiązujesz problem i musisz szybko znaleźć logi
summary: Logi plikowe, wyjście konsoli, śledzenie w CLI i karta Logi w Control UI
title: Rejestrowanie
x-i18n:
    generated_at: "2026-06-27T17:44:32Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: caf2780dfeeaf29f4ee94429894a03422b211a4414e63062642d1134f38b6b3f
    source_path: logging.md
    workflow: 16
---

OpenClaw ma dwie główne powierzchnie dzienników:

- **Dzienniki plikowe** (wiersze JSON) zapisywane przez Gateway.
- **Dane wyjściowe konsoli** wyświetlane w terminalach i interfejsie Gateway Debug UI.

Karta **Dzienniki** w Control UI śledzi plik dziennika gateway. Ta strona wyjaśnia, gdzie
znajdują się dzienniki, jak je czytać oraz jak konfigurować poziomy i formaty dzienników.

## Gdzie znajdują się dzienniki

Domyślnie Gateway zapisuje rotacyjny plik dziennika w:

`/tmp/openclaw/openclaw-YYYY-MM-DD.log`

Data używa lokalnej strefy czasowej hosta Gateway.

Każdy plik jest rotowany, gdy osiągnie `logging.maxFileBytes` (domyślnie: 100 MB).
OpenClaw przechowuje do pięciu ponumerowanych archiwów obok aktywnego pliku, takich jak
`openclaw-YYYY-MM-DD.1.log`, i kontynuuje zapis do świeżego aktywnego dziennika zamiast
wyciszać diagnostykę.

Możesz to zastąpić w `~/.openclaw/openclaw.json`:

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

- `--local-time`: renderuj znaczniki czasu w swojej lokalnej strefie czasowej
- `--url <url>` / `--token <token>` / `--timeout <ms>`: standardowe flagi RPC Gateway
- `--expect-final`: flaga oczekiwania na końcową odpowiedź RPC obsługiwaną przez agenta (akceptowana tutaj przez wspólną warstwę klienta)

Tryby wyjścia:

- **Sesje TTY**: czytelne, kolorowane, ustrukturyzowane wiersze dziennika.
- **Sesje inne niż TTY**: zwykły tekst.
- `--json`: JSON rozdzielany wierszami (jedno zdarzenie dziennika na wiersz).
- `--plain`: wymuś zwykły tekst w sesjach TTY.
- `--no-color`: wyłącz kolory ANSI.

Gdy podasz jawny `--url`, CLI nie stosuje automatycznie poświadczeń z konfiguracji ani
środowiska; dodaj `--token` samodzielnie, jeśli docelowy Gateway
wymaga uwierzytelnienia.

W trybie JSON CLI emituje obiekty oznaczone polem `type`:

- `meta`: metadane strumienia (plik, kursor, rozmiar)
- `log`: sparsowany wpis dziennika
- `notice`: wskazówki o obcięciu / rotacji
- `raw`: niesparsowany wiersz dziennika

Jeśli niejawny Gateway local loopback poprosi o parowanie, zamknie połączenie podczas łączenia
albo przekroczy limit czasu, zanim `logs.tail` odpowie, `openclaw logs` automatycznie przełącza się na
skonfigurowany plik dziennika Gateway. Jawne cele `--url` nie używają
tego mechanizmu awaryjnego. `openclaw logs --follow` jest bardziej rygorystyczne: w Linux używa aktywnego
dziennika Gateway użytkownika w systemd według PID, gdy jest dostępny, a w przeciwnym razie ponawia próby
połączenia z żywym Gateway zamiast śledzić potencjalnie nieaktualny plik obok.

Jeśli Gateway jest nieosiągalny, CLI wypisuje krótką wskazówkę, aby uruchomić:

```bash
openclaw doctor
```

### Control UI (web)

Karta **Dzienniki** w Control UI śledzi ten sam plik za pomocą `logs.tail`.
Zobacz [Control UI](/pl/web/control-ui), aby dowiedzieć się, jak ją otworzyć.

### Dzienniki tylko kanałów

Aby filtrować aktywność kanałów (WhatsApp/Telegram/itp.), użyj:

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
- `agent_id`: identyfikator aktywnego agenta, gdy wywołanie dziennika przenosi kontekst agenta.
- `session_id`: identyfikator/klucz aktywnej sesji, gdy wywołanie dziennika przenosi kontekst sesji.
- `channel`: aktywny kanał, gdy wywołanie dziennika przenosi kontekst kanału.

OpenClaw zachowuje oryginalne ustrukturyzowane argumenty dziennika obok tych pól,
dzięki czemu istniejące parsery czytające ponumerowane klucze argumentów tslog nadal działają.

Aktywność rozmów, głosu w czasie rzeczywistym i zarządzanych pokojów emituje ograniczone rekordy dziennika cyklu życia
przez ten sam potok dzienników plikowych. Rekordy te zawierają typ zdarzenia,
tryb, transport, dostawcę oraz pomiary rozmiaru/czasu, gdy są dostępne, ale pomijają
tekst transkrypcji, ładunki audio, identyfikatory tur, identyfikatory połączeń i identyfikatory elementów dostawcy.

### Dane wyjściowe konsoli

Dzienniki konsoli są **świadome TTY** i formatowane pod kątem czytelności:

- Prefiksy podsystemów (np. `gateway/channels/whatsapp`)
- Kolorowanie poziomów (info/warn/error)
- Opcjonalny tryb kompaktowy lub JSON

Formatowanie konsoli jest kontrolowane przez `logging.consoleStyle`.

### Dzienniki Gateway WebSocket

`openclaw gateway` ma również rejestrowanie protokołu WebSocket dla ruchu RPC:

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

## Konfigurowanie rejestrowania

Cała konfiguracja rejestrowania znajduje się pod `logging` w `~/.openclaw/openclaw.json`.

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

Możesz zastąpić oba za pomocą zmiennej środowiskowej **`OPENCLAW_LOG_LEVEL`** (np. `OPENCLAW_LOG_LEVEL=debug`). Zmienna środowiskowa ma pierwszeństwo przed plikiem konfiguracyjnym, więc możesz zwiększyć szczegółowość dla pojedynczego uruchomienia bez edytowania `openclaw.json`. Możesz też przekazać globalną opcję CLI **`--log-level <level>`** (na przykład `openclaw --log-level debug gateway run`), która zastępuje zmienną środowiskową dla tego polecenia.

`--verbose` wpływa tylko na dane wyjściowe konsoli i szczegółowość dziennika WS; nie zmienia
poziomów dziennika plikowego.

### Ukierunkowana diagnostyka transportu modeli

Podczas debugowania wywołań dostawcy używaj ukierunkowanych flag środowiskowych zamiast podnosić
wszystkie dzienniki do `debug`:

```bash
OPENCLAW_DEBUG_MODEL_TRANSPORT=1 openclaw gateway
OPENCLAW_DEBUG_MODEL_PAYLOAD=tools OPENCLAW_DEBUG_SSE=events openclaw gateway
```

Dostępne flagi:

- `OPENCLAW_DEBUG_MODEL_TRANSPORT=1`: emituj rozpoczęcie żądania, odpowiedź fetch, nagłówki SDK,
  pierwsze zdarzenie strumieniowania, zakończenie strumienia i błędy transportu na
  poziomie `info`.
- `OPENCLAW_DEBUG_MODEL_PAYLOAD=summary`: dołącz ograniczone podsumowanie ładunku żądania
  w dziennikach żądań modelu.
- `OPENCLAW_DEBUG_MODEL_PAYLOAD=tools`: dołącz wszystkie nazwy narzędzi widoczne dla modelu w
  podsumowaniu ładunku.
- `OPENCLAW_DEBUG_MODEL_PAYLOAD=full-redacted`: dołącz zredagowaną, ograniczoną migawkę ładunku
  JSON. Używaj tylko podczas debugowania; sekrety są redagowane, ale prompty
  i tekst komunikatów mogą nadal być obecne.
- `OPENCLAW_DEBUG_SSE=events`: emituj czas pierwszego zdarzenia i zakończenia strumienia.
- `OPENCLAW_DEBUG_SSE=peek`: dodatkowo emituj pierwsze pięć zredagowanych ładunków zdarzeń SSE,
  ograniczonych na zdarzenie.
- `OPENCLAW_DEBUG_CODE_MODE=1`: emituj diagnostykę powierzchni modelu w trybie kodu,
  w tym sytuacje, gdy natywne narzędzia dostawcy są ukryte, ponieważ tryb kodu jest właścicielem
  powierzchni narzędzi.

Te flagi zapisują przez normalne rejestrowanie OpenClaw, więc `openclaw logs --follow`
i karta Dzienniki w Control UI je pokazują. Bez tych flag ta sama diagnostyka
pozostaje dostępna na poziomie `debug`.

Metadane rozpoczęcia i odpowiedzi `[model-fetch]` (dostawca, API, model, status,
opóźnienie oraz pola żądania, takie jak metoda, URL, limit czasu, proxy i polityka)
są zawsze emitowane na poziomie `info`, niezależnie od
`OPENCLAW_DEBUG_MODEL_TRANSPORT`, więc podstawowa higiena transportu modelu jest widoczna
bez flag debugowania.

### Korelacja śladów

Dzienniki plikowe są w formacie JSONL. Gdy wywołanie dziennika przenosi prawidłowy kontekst śladu diagnostycznego,
OpenClaw zapisuje pola śladu jako klucze JSON najwyższego poziomu (`traceId`, `spanId`,
`parentSpanId`, `traceFlags`), aby zewnętrzne procesory dzienników mogły korelować wiersz
z zakresami OTEL i propagacją `traceparent` dostawcy.

Żądania HTTP Gateway i ramki Gateway WebSocket ustanawiają wewnętrzny zakres śladu żądania.
Dzienniki i zdarzenia diagnostyczne emitowane wewnątrz tego zakresu asynchronicznego dziedziczą
ślad żądania, gdy nie przekazują jawnego kontekstu śladu. Ślady uruchomień agentów i
wywołań modeli stają się dziećmi aktywnego śladu żądania, dzięki czemu lokalne dzienniki,
migawki diagnostyczne, zakresy OTEL i zaufane nagłówki `traceparent` dostawcy mogą
być łączone według `traceId` bez rejestrowania surowej treści żądania lub modelu.

Rekordy dziennika cyklu życia rozmów trafiają też do eksportu dzienników diagnostics-otel, gdy
włączony jest eksport dzienników OpenTelemetry, używając tych samych ograniczonych atrybutów co dzienniki plikowe.
Skonfiguruj `diagnostics.otel.logsExporter`, aby wybrać OTLP, stdout JSONL albo
oba ujścia.

### Rozmiar i czas wywołań modelu

Diagnostyka wywołań modelu zapisuje ograniczone pomiary żądań/odpowiedzi bez
przechwytywania surowej treści promptu lub odpowiedzi:

- `requestPayloadBytes`: rozmiar w bajtach UTF-8 końcowego ładunku żądania modelu
- `responseStreamBytes`: rozmiar w bajtach UTF-8 ładunków fragmentów strumieniowanej odpowiedzi modelu.
  Zdarzenia częstego tekstu, rozumowania i delt wywołań narzędzi liczą
  tylko przyrostowe bajty `delta` zamiast pełnych migawek `partial`.
- `timeToFirstByteMs`: czas, który upłynął przed pierwszym zdarzeniem strumieniowanej odpowiedzi
- `durationMs`: całkowity czas trwania wywołania modelu

Te pola są dostępne dla migawek diagnostycznych, hooków pluginów wywołań modelu oraz
zakresów/metryk wywołań modelu OTEL, gdy eksport diagnostyki jest włączony.

### Style konsoli

`logging.consoleStyle`:

- `pretty`: przyjazny dla człowieka, kolorowy, ze znacznikami czasu.
- `compact`: bardziej zwięzłe wyjście (najlepsze do długich sesji).
- `json`: JSON w każdym wierszu (dla procesorów dzienników).

### Redagowanie

OpenClaw może redagować poufne tokeny, zanim trafią do danych wyjściowych konsoli, dzienników plikowych,
rekordów dziennika OTLP, utrwalonego tekstu transkrypcji sesji lub ładunków zdarzeń narzędzi
w Control UI (argumenty uruchomienia narzędzia, częściowe/końcowe ładunki wyników, pochodne
wyjście exec i podsumowania poprawek):

- `logging.redactSensitive`: `off` | `tools` (domyślnie: `tools`)
- `logging.redactPatterns`: lista ciągów regex zastępująca domyślny zestaw. Własne wzorce nakładają się na wbudowane domyślne wzorce dla ładunków narzędzi Control UI, więc dodanie wzorca nigdy nie osłabia redagowania wartości już wychwytywanych przez domyślne ustawienia.

Dzienniki plikowe i transkrypcje sesji pozostają w JSONL, ale pasujące wartości sekretów są
maskowane przed zapisaniem wiersza lub komunikatu na dysku. Redagowanie działa w trybie najlepszych starań:
stosuje się do treści komunikatów zawierających tekst i ciągów dziennika, a nie do każdego
identyfikatora lub pola ładunku binarnego.

Wbudowane ustawienia domyślne obejmują typowe poświadczenia API i nazwy pól poświadczeń płatniczych,
takie jak numer karty, CVC/CVV, współdzielony token płatności i poświadczenie płatnicze,
gdy pojawiają się jako pola JSON, parametry URL, flagi CLI lub przypisania.

`logging.redactSensitive: "off"` wyłącza tylko tę ogólną politykę dzienników/transkrypcji.
OpenClaw nadal redaguje ładunki na granicach bezpieczeństwa, które mogą być pokazywane klientom UI,
pakietom wsparcia, obserwatorom diagnostyki, promptom zatwierdzeń lub narzędziom agentów.
Przykłady obejmują zdarzenia wywołań narzędzi Control UI, wyjście `sessions_history`,
eksporty wsparcia diagnostycznego, obserwacje błędów dostawcy, wyświetlanie polecenia zatwierdzenia exec
oraz dzienniki protokołu Gateway WebSocket. Własne `logging.redactPatterns`
mogą nadal dodawać wzorce specyficzne dla projektu na tych powierzchniach.

## Diagnostyka i OpenTelemetry

Diagnostyka to ustrukturyzowane, czytelne maszynowo zdarzenia dla uruchomień modeli i
telemetrii przepływu komunikatów (webhooki, kolejkowanie, stan sesji). **Nie**
zastępują dzienników — zasilają metryki, ślady i eksportery. Zdarzenia są emitowane
w procesie niezależnie od tego, czy je eksportujesz.

Dwie sąsiadujące powierzchnie:

- **Eksport OpenTelemetry** — wysyłaj metryki, ślady i dzienniki przez OTLP/HTTP do
  dowolnego kolektora lub backendu zgodnego z OpenTelemetry (Grafana, Datadog,
  Honeycomb, New Relic, Tempo itd.). Pełna konfiguracja, katalog sygnałów,
  nazwy metryk/zakresów, zmienne środowiskowe i model prywatności znajdują się na dedykowanej stronie:
  [Eksport OpenTelemetry](/pl/gateway/opentelemetry).
- **Flagi diagnostyczne** — ukierunkowane flagi dzienników debugowania, które kierują dodatkowe dzienniki do
  `logging.file` bez podnoszenia `logging.level`. Flagi nie rozróżniają wielkości liter
  i obsługują symbole wieloznaczne (`telegram.*`, `*`). Skonfiguruj je w `diagnostics.flags`
  albo przez nadpisanie zmienną środowiskową `OPENCLAW_DIAGNOSTICS=...`. Pełny przewodnik:
  [Flagi diagnostyczne](/pl/diagnostics/flags).

Aby włączyć zdarzenia diagnostyczne dla pluginów lub własnych ujść bez eksportu OTLP:

```json5
{
  diagnostics: { enabled: true },
}
```

Eksport OTLP do kolektora opisuje [eksport OpenTelemetry](/pl/gateway/opentelemetry).

## Wskazówki dotyczące rozwiązywania problemów

- **Gateway nieosiągalny?** Najpierw uruchom `openclaw doctor`.
- **Logi są puste?** Sprawdź, czy Gateway działa i zapisuje do ścieżki pliku
  w `logging.file`.
- **Potrzebujesz więcej szczegółów?** Ustaw `logging.level` na `debug` lub `trace` i spróbuj ponownie.

## Powiązane

- [Eksport OpenTelemetry](/pl/gateway/opentelemetry) — eksport OTLP/HTTP, katalog metryk/spanów, model prywatności
- [Flagi diagnostyczne](/pl/diagnostics/flags) — ukierunkowane flagi logów debugowania
- [Wewnętrzne mechanizmy rejestrowania Gateway](/pl/gateway/logging) — style logów WS, prefiksy podsystemów i przechwytywanie konsoli
- [Dokumentacja konfiguracji](/pl/gateway/configuration-reference#diagnostics) — pełna dokumentacja pól `diagnostics.*`

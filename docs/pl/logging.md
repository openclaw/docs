---
read_when:
    - Potrzebujesz przyjaznego dla początkujących omówienia logowania w OpenClaw
    - Chcesz skonfigurować poziomy logowania, formaty lub maskowanie
    - Rozwiązujesz problem i musisz szybko znaleźć logi
summary: Logi plików, dane wyjściowe konsoli, śledzenie na żywo w CLI i karta Logi w Control UI
title: Rejestrowanie
x-i18n:
    generated_at: "2026-05-01T10:00:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: d41ce5b1ae30fe1ca65577abe387fc266bd281686acb10098f82b8e78dfaa357
    source_path: logging.md
    workflow: 16
---

OpenClaw ma dwa główne obszary logowania:

- **Dzienniki plikowe** (wiersze JSON) zapisywane przez Gateway.
- **Dane wyjściowe konsoli** wyświetlane w terminalach i w interfejsie debugowania Gateway.

Karta **Dzienniki** w Control UI śledzi plik dziennika Gateway. Ta strona wyjaśnia, gdzie
znajdują się dzienniki, jak je czytać oraz jak konfigurować poziomy i formaty logowania.

## Gdzie znajdują się dzienniki

Domyślnie Gateway zapisuje rotacyjny plik dziennika w:

`/tmp/openclaw/openclaw-YYYY-MM-DD.log`

Data używa lokalnej strefy czasowej hosta Gateway.

Każdy plik jest rotowany po osiągnięciu `logging.maxFileBytes` (domyślnie: 100 MB).
OpenClaw przechowuje do pięciu numerowanych archiwów obok aktywnego pliku, takich jak
`openclaw-YYYY-MM-DD.1.log`, i zapisuje dalej do nowego aktywnego dziennika zamiast
pomijać diagnostykę.

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

Użyj CLI, aby śledzić plik dziennika Gateway przez RPC:

```bash
openclaw logs --follow
```

Przydatne bieżące opcje:

- `--local-time`: renderuje znaczniki czasu w Twojej lokalnej strefie czasowej
- `--url <url>` / `--token <token>` / `--timeout <ms>`: standardowe flagi RPC Gateway
- `--expect-final`: flaga oczekiwania na końcową odpowiedź RPC obsługiwaną przez agenta (akceptowana tutaj przez współdzieloną warstwę klienta)

Tryby wyjścia:

- **Sesje TTY**: czytelne, kolorowane, ustrukturyzowane wiersze dziennika.
- **Sesje inne niż TTY**: zwykły tekst.
- `--json`: JSON rozdzielany wierszami (jedno zdarzenie dziennika na wiersz).
- `--plain`: wymusza zwykły tekst w sesjach TTY.
- `--no-color`: wyłącza kolory ANSI.

Gdy przekażesz jawne `--url`, CLI nie stosuje automatycznie poświadczeń z konfiguracji ani
środowiska; dołącz samodzielnie `--token`, jeśli docelowy Gateway
wymaga uwierzytelnienia.

W trybie JSON CLI emituje obiekty oznaczone polem `type`:

- `meta`: metadane strumienia (plik, kursor, rozmiar)
- `log`: sparsowany wpis dziennika
- `notice`: wskazówki dotyczące obcięcia / rotacji
- `raw`: niesparsowany wiersz dziennika

Jeśli niejawny Gateway przez local loopback poprosi o parowanie, zamknie połączenie podczas łączenia
albo przekroczy limit czasu, zanim `logs.tail` odpowie, `openclaw logs` automatycznie przełączy się na
skonfigurowany plik dziennika Gateway. Jawne cele `--url` nie używają
tego mechanizmu awaryjnego.

Jeśli Gateway jest nieosiągalny, CLI wypisze krótką wskazówkę, aby uruchomić:

```bash
openclaw doctor
```

### Control UI (web)

Karta **Dzienniki** w Control UI śledzi ten sam plik przy użyciu `logs.tail`.
Zobacz [/web/control-ui](/pl/web/control-ui), aby dowiedzieć się, jak ją otworzyć.

### Dzienniki tylko kanałów

Aby filtrować aktywność kanałów (WhatsApp/Telegram/itd.), użyj:

```bash
openclaw channels logs --channel whatsapp
```

## Formaty dzienników

### Dzienniki plikowe (JSONL)

Każdy wiersz w pliku dziennika jest obiektem JSON. CLI i Control UI parsują te
wpisy, aby renderować ustrukturyzowane dane wyjściowe (czas, poziom, podsystem, komunikat).

Rekordy JSONL dziennika plikowego zawierają też filtrowalne maszynowo pola najwyższego poziomu, gdy
są dostępne:

- `hostname`: nazwa hosta Gateway.
- `message`: spłaszczony tekst komunikatu dziennika do wyszukiwania pełnotekstowego.
- `agent_id`: identyfikator aktywnego agenta, gdy wywołanie logowania przenosi kontekst agenta.
- `session_id`: identyfikator/klucz aktywnej sesji, gdy wywołanie logowania przenosi kontekst sesji.
- `channel`: aktywny kanał, gdy wywołanie logowania przenosi kontekst kanału.

OpenClaw zachowuje oryginalne ustrukturyzowane argumenty logowania obok tych pól,
aby istniejące parsery odczytujące numerowane klucze argumentów tslog nadal działały.

### Dane wyjściowe konsoli

Dzienniki konsoli są **świadome TTY** i formatowane pod kątem czytelności:

- Prefiksy podsystemów (np. `gateway/channels/whatsapp`)
- Kolorowanie poziomów (info/warn/error)
- Opcjonalny tryb kompaktowy lub JSON

Formatowaniem konsoli steruje `logging.consoleStyle`.

### Dzienniki WebSocket Gateway

`openclaw gateway` ma też logowanie protokołu WebSocket dla ruchu RPC:

- tryb normalny: tylko interesujące wyniki (błędy, błędy parsowania, wolne wywołania)
- `--verbose`: cały ruch żądań/odpowiedzi
- `--ws-log auto|compact|full`: wybór stylu renderowania w trybie szczegółowym
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

- `logging.level`: poziom **dzienników plikowych** (JSONL).
- `logging.consoleLevel`: poziom szczegółowości **konsoli**.

Możesz nadpisać oba za pomocą zmiennej środowiskowej **`OPENCLAW_LOG_LEVEL`** (np. `OPENCLAW_LOG_LEVEL=debug`). Zmienna środowiskowa ma pierwszeństwo przed plikiem konfiguracji, więc możesz zwiększyć szczegółowość dla pojedynczego uruchomienia bez edytowania `openclaw.json`. Możesz też przekazać globalną opcję CLI **`--log-level <level>`** (na przykład `openclaw --log-level debug gateway run`), która nadpisuje zmienną środowiskową dla tego polecenia.

`--verbose` wpływa tylko na dane wyjściowe konsoli i szczegółowość dziennika WS; nie zmienia
poziomów dzienników plikowych.

### Korelacja śladów

Dzienniki plikowe są w formacie JSONL. Gdy wywołanie logowania przenosi prawidłowy kontekst śladu diagnostycznego,
OpenClaw zapisuje pola śladu jako klucze JSON najwyższego poziomu (`traceId`, `spanId`,
`parentSpanId`, `traceFlags`), aby zewnętrzne procesory dzienników mogły skorelować wiersz
z zakresami OTEL i propagacją `traceparent` dostawcy.

Żądania HTTP Gateway i ramki WebSocket Gateway ustanawiają wewnętrzny zakres śladu
żądania. Dzienniki i zdarzenia diagnostyczne emitowane wewnątrz tego zakresu asynchronicznego dziedziczą
ślad żądania, gdy nie przekazują jawnego kontekstu śladu. Ślady uruchomień agentów i
wywołań modeli stają się dziećmi aktywnego śladu żądania, dzięki czemu lokalne dzienniki,
migawki diagnostyczne, zakresy OTEL i zaufane nagłówki `traceparent` dostawców mogą
być łączone według `traceId` bez logowania surowej treści żądań lub modeli.

### Rozmiar i czas wywołania modelu

Diagnostyka wywołań modeli rejestruje ograniczone pomiary żądań/odpowiedzi bez
przechwytywania surowej treści promptu lub odpowiedzi:

- `requestPayloadBytes`: rozmiar w bajtach UTF-8 końcowego ładunku żądania modelu
- `responseStreamBytes`: rozmiar w bajtach UTF-8 strumieniowanych zdarzeń odpowiedzi modelu
- `timeToFirstByteMs`: czas, który upłynął przed pierwszym strumieniowanym zdarzeniem odpowiedzi
- `durationMs`: całkowity czas trwania wywołania modelu

Te pola są dostępne dla migawek diagnostycznych, hooków Plugin wywołań modeli oraz
zakresów/metryk OTEL wywołań modeli, gdy eksport diagnostyki jest włączony.

### Style konsoli

`logging.consoleStyle`:

- `pretty`: przyjazny dla człowieka, kolorowany, ze znacznikami czasu.
- `compact`: bardziej zwarte dane wyjściowe (najlepsze dla długich sesji).
- `json`: JSON w każdym wierszu (dla procesorów dzienników).

### Redakcja danych wrażliwych

OpenClaw może redagować wrażliwe tokeny, zanim trafią do danych wyjściowych konsoli, dzienników plikowych,
rekordów dziennika OTLP, utrwalonego tekstu transkrypcji sesji lub ładunków zdarzeń narzędzi
Control UI (argumenty rozpoczęcia narzędzia, częściowe/końcowe ładunki wyników, pochodne
dane wyjściowe exec i podsumowania poprawek):

- `logging.redactSensitive`: `off` | `tools` (domyślnie: `tools`)
- `logging.redactPatterns`: lista ciągów regex do nadpisania zestawu domyślnego. Niestandardowe wzorce są stosowane dodatkowo względem wbudowanych wartości domyślnych dla ładunków narzędzi Control UI, więc dodanie wzorca nigdy nie osłabia redakcji wartości już wychwytywanych przez wartości domyślne.

Dzienniki plikowe i transkrypcje sesji pozostają w formacie JSONL, ale pasujące wartości sekretów są
maskowane, zanim wiersz lub komunikat zostanie zapisany na dysk. Redakcja jest najlepszym możliwym wysiłkiem:
stosuje się do treści komunikatów zawierających tekst i ciągów dziennika, a nie do każdego
identyfikatora lub pola ładunku binarnego.

Wbudowane wartości domyślne obejmują popularne poświadczenia API i nazwy pól poświadczeń płatniczych,
takie jak numer karty, CVC/CVV, współdzielony token płatności i poświadczenie płatnicze,
gdy pojawiają się jako pola JSON, parametry URL, flagi CLI lub przypisania.

`logging.redactSensitive: "off"` wyłącza tylko tę ogólną politykę dzienników/transkrypcji.
OpenClaw nadal redaguje ładunki granicy bezpieczeństwa, które mogą być pokazywane klientom UI,
pakietom wsparcia, obserwatorom diagnostyki, promptom zatwierdzania lub narzędziom
agentów. Przykłady obejmują zdarzenia wywołań narzędzi Control UI, dane wyjściowe `sessions_history`,
eksporty diagnostyczne dla wsparcia, obserwacje błędów dostawców, wyświetlanie poleceń zatwierdzania exec
oraz dzienniki protokołu WebSocket Gateway. Niestandardowe `logging.redactPatterns`
mogą nadal dodawać wzorce specyficzne dla projektu na tych powierzchniach.

## Diagnostyka i OpenTelemetry

Diagnostyka to ustrukturyzowane, czytelne maszynowo zdarzenia dla uruchomień modeli i
telemetrii przepływu wiadomości (webhooki, kolejkowanie, stan sesji). **Nie**
zastępują dzienników — zasilają metryki, ślady i eksportery. Zdarzenia są emitowane
w procesie niezależnie od tego, czy je eksportujesz.

Dwa sąsiadujące obszary:

- **Eksport OpenTelemetry** — wysyłanie metryk, śladów i dzienników przez OTLP/HTTP do
  dowolnego kolektora lub backendu zgodnego z OpenTelemetry (Grafana, Datadog,
  Honeycomb, New Relic, Tempo itd.). Pełna konfiguracja, katalog sygnałów,
  nazwy metryk/zakresów, zmienne środowiskowe i model prywatności znajdują się na dedykowanej stronie:
  [Eksport OpenTelemetry](/pl/gateway/opentelemetry).
- **Flagi diagnostyczne** — ukierunkowane flagi dzienników debugowania, które kierują dodatkowe dzienniki do
  `logging.file` bez podnoszenia `logging.level`. Flagi nie rozróżniają wielkości liter
  i obsługują symbole wieloznaczne (`telegram.*`, `*`). Skonfiguruj je pod `diagnostics.flags`
  lub przez nadpisanie zmienną środowiskową `OPENCLAW_DIAGNOSTICS=...`. Pełny przewodnik:
  [Flagi diagnostyczne](/pl/diagnostics/flags).

Aby włączyć zdarzenia diagnostyczne dla plugins lub niestandardowych odbiorników bez eksportu OTLP:

```json5
{
  diagnostics: { enabled: true },
}
```

Eksport OTLP do kolektora opisuje [Eksport OpenTelemetry](/pl/gateway/opentelemetry).

## Wskazówki dotyczące rozwiązywania problemów

- **Gateway nie jest osiągalny?** Najpierw uruchom `openclaw doctor`.
- **Dzienniki są puste?** Sprawdź, czy Gateway działa i zapisuje do ścieżki pliku
  w `logging.file`.
- **Potrzebujesz więcej szczegółów?** Ustaw `logging.level` na `debug` lub `trace` i spróbuj ponownie.

## Powiązane

- [Eksport OpenTelemetry](/pl/gateway/opentelemetry) — eksport OTLP/HTTP, katalog metryk/zakresów, model prywatności
- [Flagi diagnostyczne](/pl/diagnostics/flags) — ukierunkowane flagi dzienników debugowania
- [Wewnętrzne mechanizmy logowania Gateway](/pl/gateway/logging) — style dzienników WS, prefiksy podsystemów i przechwytywanie konsoli
- [Dokumentacja konfiguracji](/pl/gateway/configuration-reference#diagnostics) — pełna dokumentacja pól `diagnostics.*`

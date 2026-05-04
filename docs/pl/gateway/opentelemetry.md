---
read_when:
    - Chcesz wysyłać dane o użyciu modeli OpenClaw, przepływie wiadomości lub metryki sesji do kolektora OpenTelemetry
    - Konfigurujesz przesyłanie śladów, metryk lub logów do Grafany, Datadog, Honeycomb, New Relic, Tempo lub innego backendu OTLP
    - Potrzebujesz dokładnych nazw metryk, nazw spanów lub struktur atrybutów, aby tworzyć pulpity nawigacyjne albo alerty
summary: Eksportuj diagnostykę OpenClaw do dowolnego kolektora OpenTelemetry za pomocą Pluginu diagnostics-otel (OTLP/HTTP)
title: Eksport OpenTelemetry
x-i18n:
    generated_at: "2026-05-04T02:24:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: d0b5be99b29fe5f13132b03cfeaf3ce978ee16f29e307aa76769bc414b5ca35f
    source_path: gateway/opentelemetry.md
    workflow: 16
---

OpenClaw eksportuje diagnostykę przez oficjalny Plugin `diagnostics-otel`
przy użyciu **OTLP/HTTP (protobuf)**. Każdy kolektor lub backend akceptujący OTLP/HTTP
działa bez zmian w kodzie. Informacje o lokalnych dziennikach plikowych i sposobie ich odczytu znajdziesz w
[Rejestrowaniu](/pl/logging).

## Jak to działa razem

- **Zdarzenia diagnostyczne** to ustrukturyzowane rekordy w procesie emitowane przez
  Gateway i dołączone pluginy dla uruchomień modeli, przepływu wiadomości, sesji, kolejek
  i wykonywania poleceń.
- **Plugin `diagnostics-otel`** subskrybuje te zdarzenia i eksportuje je jako
  OpenTelemetry **metryki**, **ślady** i **dzienniki** przez OTLP/HTTP.
- **Wywołania dostawców** otrzymują nagłówek W3C `traceparent` z zaufanego
  kontekstu zakresu wywołania modelu OpenClaw, gdy transport dostawcy akceptuje niestandardowe
  nagłówki. Kontekst śladu emitowany przez plugin nie jest propagowany.
- Eksportery są podłączane tylko wtedy, gdy włączone są zarówno powierzchnia diagnostyczna, jak i plugin,
  więc domyślnie koszt w procesie pozostaje bliski zeru.

## Szybki start

W instalacjach pakietowych najpierw zainstaluj plugin:

```bash
openclaw plugins install clawhub:@openclaw/diagnostics-otel
```

```json5
{
  plugins: {
    allow: ["diagnostics-otel"],
    entries: {
      "diagnostics-otel": { enabled: true },
    },
  },
  diagnostics: {
    enabled: true,
    otel: {
      enabled: true,
      endpoint: "http://otel-collector:4318",
      protocol: "http/protobuf",
      serviceName: "openclaw-gateway",
      traces: true,
      metrics: true,
      logs: true,
      sampleRate: 0.2,
      flushIntervalMs: 60000,
    },
  },
}
```

Plugin możesz też włączyć z CLI:

```bash
openclaw plugins enable diagnostics-otel
```

<Note>
`protocol` obsługuje obecnie tylko `http/protobuf`. `grpc` jest ignorowane.
</Note>

## Eksportowane sygnały

| Sygnał      | Co zawiera                                                                                                                                 |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| **Metryki** | Liczniki i histogramy użycia tokenów, kosztów, czasu trwania uruchomień, przepływu wiadomości, pasm kolejek, stanu sesji, wykonywania poleceń i presji pamięci. |
| **Ślady**   | Zakresy użycia modelu, wywołań modelu, cyklu życia uprzęży, wykonywania narzędzi, exec, przetwarzania webhooków/wiadomości, składania kontekstu i pętli narzędzi. |
| **Dzienniki** | Ustrukturyzowane rekordy `logging.file` eksportowane przez OTLP, gdy włączone jest `diagnostics.otel.logs`.                              |

Przełączaj `traces`, `metrics` i `logs` niezależnie. Wszystkie trzy są domyślnie włączone,
gdy `diagnostics.otel.enabled` ma wartość true.

## Informacje o konfiguracji

```json5
{
  diagnostics: {
    enabled: true,
    otel: {
      enabled: true,
      endpoint: "http://otel-collector:4318",
      tracesEndpoint: "http://otel-collector:4318/v1/traces",
      metricsEndpoint: "http://otel-collector:4318/v1/metrics",
      logsEndpoint: "http://otel-collector:4318/v1/logs",
      protocol: "http/protobuf", // grpc jest ignorowane
      serviceName: "openclaw-gateway",
      headers: { "x-collector-token": "..." },
      traces: true,
      metrics: true,
      logs: true,
      sampleRate: 0.2, // próbnik zakresów głównych, 0.0..1.0
      flushIntervalMs: 60000, // interwał eksportu metryk (min 1000ms)
      captureContent: {
        enabled: false,
        inputMessages: false,
        outputMessages: false,
        toolInputs: false,
        toolOutputs: false,
        systemPrompt: false,
      },
    },
  },
}
```

### Zmienne środowiskowe

| Zmienna                                                                                                          | Cel                                                                                                                                                                                                                                        |
| ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `OTEL_EXPORTER_OTLP_ENDPOINT`                                                                                     | Zastępuje `diagnostics.otel.endpoint`. Jeśli wartość zawiera już `/v1/traces`, `/v1/metrics` lub `/v1/logs`, jest używana bez zmian.                                                                                                      |
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` / `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` / `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | Zastąpienia punktów końcowych specyficzne dla sygnału, używane, gdy pasujący klucz konfiguracji `diagnostics.otel.*Endpoint` nie jest ustawiony. Konfiguracja specyficzna dla sygnału ma pierwszeństwo przed zmienną środowiskową specyficzną dla sygnału, a ta przed współdzielonym punktem końcowym. |
| `OTEL_SERVICE_NAME`                                                                                               | Zastępuje `diagnostics.otel.serviceName`.                                                                                                                                                                                                  |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                                                                                     | Zastępuje protokół transmisji (obecnie honorowane jest tylko `http/protobuf`).                                                                                                                                                             |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                                                                                   | Ustaw na `gen_ai_latest_experimental`, aby emitować najnowszy eksperymentalny atrybut zakresu GenAI (`gen_ai.provider.name`) zamiast starszego `gen_ai.system`. Metryki GenAI zawsze używają ograniczonych atrybutów semantycznych o niskiej kardynalności. |
| `OPENCLAW_OTEL_PRELOADED`                                                                                         | Ustaw na `1`, gdy inny preload lub proces hosta zarejestrował już globalny OpenTelemetry SDK. Plugin pomija wtedy własny cykl życia NodeSDK, ale nadal podłącza słuchacze diagnostyczne i respektuje `traces`/`metrics`/`logs`. |

## Prywatność i przechwytywanie treści

Surowa treść modelu/narzędzia **nie** jest domyślnie eksportowana. Zakresy przenoszą ograniczone
identyfikatory (kanał, dostawca, model, kategoria błędu, identyfikatory żądań tylko w postaci hasha)
i nigdy nie zawierają tekstu promptu, tekstu odpowiedzi, wejść narzędzi, wyjść narzędzi ani
kluczy sesji.

Wychodzące żądania modelu mogą zawierać nagłówek W3C `traceparent`. Ten nagłówek jest
generowany wyłącznie z należącego do OpenClaw kontekstu śladu diagnostycznego dla aktywnego
wywołania modelu. Istniejące nagłówki `traceparent` dostarczone przez wywołującego są zastępowane, więc pluginy lub
niestandardowe opcje dostawcy nie mogą podszywać się pod pochodzenie śladu między usługami.

Ustaw `diagnostics.otel.captureContent.*` na `true` tylko wtedy, gdy Twój kolektor i
polityka retencji są zatwierdzone dla tekstu promptu, odpowiedzi, narzędzia lub promptu systemowego.
Każdy podklucz jest włączany niezależnie:

- `inputMessages` — treść promptu użytkownika.
- `outputMessages` — treść odpowiedzi modelu.
- `toolInputs` — ładunki argumentów narzędzi.
- `toolOutputs` — ładunki wyników narzędzi.
- `systemPrompt` — złożony prompt systemowy/deweloperski.

Gdy dowolny podklucz jest włączony, zakresy modelu i narzędzi otrzymują ograniczone, zredagowane
atrybuty `openclaw.content.*` tylko dla tej klasy.

## Próbkowanie i opróżnianie

- **Ślady:** `diagnostics.otel.sampleRate` (tylko zakres główny, `0.0` odrzuca wszystkie,
  `1.0` zachowuje wszystkie).
- **Metryki:** `diagnostics.otel.flushIntervalMs` (minimum `1000`).
- **Dzienniki:** dzienniki OTLP respektują `logging.level` (poziom dziennika plikowego). Używają
  ścieżki redakcji rekordów dziennika diagnostycznego, a nie formatowania konsoli. Instalacje o dużym wolumenie
  powinny preferować próbkowanie/filtrowanie w kolektorze OTLP zamiast próbkowania lokalnego.
- **Korelacja dzienników plikowych:** dzienniki plikowe JSONL zawierają pola najwyższego poziomu `traceId`,
  `spanId`, `parentSpanId` i `traceFlags`, gdy wywołanie dziennika niesie prawidłowy
  kontekst śladu diagnostycznego, co pozwala procesorom dzienników łączyć lokalne linie dziennika z
  eksportowanymi zakresami.
- **Korelacja żądań:** żądania HTTP Gateway i ramki WebSocket tworzą
  wewnętrzny zakres śladu żądania. Dzienniki i zdarzenia diagnostyczne w tym zakresie
  domyślnie dziedziczą ślad żądania, a zakresy uruchomienia agenta i wywołania modelu są
  tworzone jako dzieci, dzięki czemu nagłówki `traceparent` dostawcy pozostają w tym samym śladzie.

## Eksportowane metryki

### Użycie modelu

- `openclaw.tokens` (licznik, atrybuty: `openclaw.token`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.agent`)
- `openclaw.cost.usd` (licznik, atrybuty: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.run.duration_ms` (histogram, atrybuty: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.context.tokens` (histogram, atrybuty: `openclaw.context`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `gen_ai.client.token.usage` (histogram, metryka konwencji semantycznych GenAI, atrybuty: `gen_ai.token.type` = `input`/`output`, `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`)
- `gen_ai.client.operation.duration` (histogram, sekundy, metryka konwencji semantycznych GenAI, atrybuty: `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`, opcjonalnie `error.type`)
- `openclaw.model_call.duration_ms` (histogram, atrybuty: `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`, plus `openclaw.errorCategory` i `openclaw.failureKind` przy sklasyfikowanych błędach)
- `openclaw.model_call.request_bytes` (histogram, rozmiar bajtowy UTF-8 końcowego ładunku żądania modelu; bez surowej treści ładunku)
- `openclaw.model_call.response_bytes` (histogram, rozmiar bajtowy UTF-8 zdarzeń strumieniowanej odpowiedzi modelu; bez surowej treści odpowiedzi)
- `openclaw.model_call.time_to_first_byte_ms` (histogram, czas, który upłynął przed pierwszym zdarzeniem strumieniowanej odpowiedzi)

### Przepływ wiadomości

- `openclaw.webhook.received` (licznik, atrybuty: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.webhook.error` (licznik, atrybuty: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.webhook.duration_ms` (histogram, atrybuty: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.message.queued` (licznik, atrybuty: `openclaw.channel`, `openclaw.source`)
- `openclaw.message.processed` (licznik, atrybuty: `openclaw.channel`, `openclaw.outcome`)
- `openclaw.message.duration_ms` (histogram, atrybuty: `openclaw.channel`, `openclaw.outcome`)
- `openclaw.message.delivery.started` (licznik, atrybuty: `openclaw.channel`, `openclaw.delivery.kind`)
- `openclaw.message.delivery.duration_ms` (histogram, atrybuty: `openclaw.channel`, `openclaw.delivery.kind`, `openclaw.outcome`, `openclaw.errorCategory`)

### Kolejki i sesje

- `openclaw.queue.lane.enqueue` (licznik, atrybuty: `openclaw.lane`)
- `openclaw.queue.lane.dequeue` (licznik, atrybuty: `openclaw.lane`)
- `openclaw.queue.depth` (histogram, atrybuty: `openclaw.lane` lub `openclaw.channel=heartbeat`)
- `openclaw.queue.wait_ms` (histogram, atrybuty: `openclaw.lane`)
- `openclaw.session.state` (licznik, atrybuty: `openclaw.state`, `openclaw.reason`)
- `openclaw.session.stuck` (licznik, atrybuty: `openclaw.state`; emitowane tylko dla ewidencji przestarzałych sesji bez aktywnej pracy)
- `openclaw.session.stuck_age_ms` (histogram, atrybuty: `openclaw.state`; emitowane tylko dla ewidencji przestarzałych sesji bez aktywnej pracy)
- `openclaw.run.attempt` (licznik, atrybuty: `openclaw.attempt`)

### Telemetria żywotności sesji

`diagnostics.stuckSessionWarnMs` to próg wieku bez postępu dla diagnostyki
żywotności sesji. Sesja `processing` nie starzeje się względem tego progu,
gdy OpenClaw obserwuje postęp odpowiedzi, narzędzia, statusu, bloku lub środowiska wykonawczego ACP.
Podtrzymania pisania nie są liczone jako postęp, więc cichy model lub uprząż
nadal mogą zostać wykryte.

OpenClaw klasyfikuje sesje według pracy, którą nadal może obserwować:

- `session.long_running`: aktywna praca osadzona, wywołania modelu lub wywołania narzędzi
  nadal postępują.
- `session.stalled`: aktywna praca istnieje, ale aktywne uruchomienie nie zgłosiło
  ostatnio postępu. Wstrzymane uruchomienia osadzone początkowo pozostają tylko do obserwacji, a następnie
  przechodzą w tryb abort-drain po co najmniej 10 minutach i 5x `diagnostics.stuckSessionWarnMs`
  bez postępu, aby zakolejkowane tury za daną ścieżką mogły zostać wznowione.
- `session.stuck`: nieaktualne księgowanie sesji bez aktywnej pracy. Natychmiast zwalnia
  dotkniętą ścieżkę sesji.

Tylko `session.stuck` emituje licznik `openclaw.session.stuck`,
histogram `openclaw.session.stuck_age_ms` oraz span `openclaw.session.stuck`.
Powtarzające się diagnostyki `session.stuck` stosują backoff, dopóki sesja pozostaje
niezmieniona, więc pulpity powinny alarmować przy utrzymujących się wzrostach, a nie przy każdym
takcie heartbeat. Pokrętło konfiguracji i wartości domyślne opisuje
[Odwołanie konfiguracji](/pl/gateway/configuration-reference#diagnostics).

### Cykl życia harnessa

- `openclaw.harness.duration_ms` (histogram, atrybuty: `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.harness.phase` przy błędach)

### Wykonywanie

- `openclaw.exec.duration_ms` (histogram, atrybuty: `openclaw.exec.target`, `openclaw.exec.mode`, `openclaw.outcome`, `openclaw.failureKind`)

### Wewnętrzne mechanizmy diagnostyki (pamięć i pętla narzędzi)

- `openclaw.memory.heap_used_bytes` (histogram, atrybuty: `openclaw.memory.kind`)
- `openclaw.memory.rss_bytes` (histogram)
- `openclaw.memory.pressure` (licznik, atrybuty: `openclaw.memory.level`)
- `openclaw.tool.loop.iterations` (licznik, atrybuty: `openclaw.toolName`, `openclaw.outcome`)
- `openclaw.tool.loop.duration_ms` (histogram, atrybuty: `openclaw.toolName`, `openclaw.outcome`)

## Eksportowane spany

- `openclaw.model.usage`
  - `openclaw.channel`, `openclaw.provider`, `openclaw.model`
  - `openclaw.tokens.*` (input/output/cache_read/cache_write/total)
  - domyślnie `gen_ai.system` albo `gen_ai.provider.name`, gdy włączono najnowsze konwencje semantyczne GenAI
  - `gen_ai.request.model`, `gen_ai.operation.name`, `gen_ai.usage.*`
- `openclaw.run`
  - `openclaw.outcome`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.errorCategory`
- `openclaw.model.call`
  - domyślnie `gen_ai.system` albo `gen_ai.provider.name`, gdy włączono najnowsze konwencje semantyczne GenAI
  - `gen_ai.request.model`, `gen_ai.operation.name`, `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`
  - `openclaw.errorCategory` i opcjonalnie `openclaw.failureKind` przy błędach
  - `openclaw.model_call.request_bytes`, `openclaw.model_call.response_bytes`, `openclaw.model_call.time_to_first_byte_ms`
  - `openclaw.provider.request_id_hash` (ograniczony hash oparty na SHA identyfikatora żądania dostawcy upstream; surowe identyfikatory nie są eksportowane)
- `openclaw.harness.run`
  - `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.provider`, `openclaw.model`, `openclaw.channel`
  - Po ukończeniu: `openclaw.harness.result_classification`, `openclaw.harness.yield_detected`, `openclaw.harness.items.started`, `openclaw.harness.items.completed`, `openclaw.harness.items.active`
  - Przy błędzie: `openclaw.harness.phase`, `openclaw.errorCategory`, opcjonalnie `openclaw.harness.cleanup_failed`
- `openclaw.tool.execution`
  - `gen_ai.tool.name`, `openclaw.toolName`, `openclaw.errorCategory`, `openclaw.tool.params.*`
- `openclaw.exec`
  - `openclaw.exec.target`, `openclaw.exec.mode`, `openclaw.outcome`, `openclaw.failureKind`, `openclaw.exec.command_length`, `openclaw.exec.exit_code`, `openclaw.exec.timed_out`
- `openclaw.webhook.processed`
  - `openclaw.channel`, `openclaw.webhook`
- `openclaw.webhook.error`
  - `openclaw.channel`, `openclaw.webhook`, `openclaw.error`
- `openclaw.message.processed`
  - `openclaw.channel`, `openclaw.outcome`, `openclaw.reason`
- `openclaw.message.delivery`
  - `openclaw.channel`, `openclaw.delivery.kind`, `openclaw.outcome`, `openclaw.errorCategory`, `openclaw.delivery.result_count`
- `openclaw.session.stuck`
  - `openclaw.state`, `openclaw.ageMs`, `openclaw.queueDepth`
- `openclaw.context.assembled`
  - `openclaw.prompt.size`, `openclaw.history.size`, `openclaw.context.tokens`, `openclaw.errorCategory` (bez treści promptu, historii, odpowiedzi ani klucza sesji)
- `openclaw.tool.loop`
  - `openclaw.toolName`, `openclaw.outcome`, `openclaw.iterations`, `openclaw.errorCategory` (bez komunikatów pętli, parametrów ani danych wyjściowych narzędzia)
- `openclaw.memory.pressure`
  - `openclaw.memory.level`, `openclaw.memory.heap_used_bytes`, `openclaw.memory.rss_bytes`

Gdy przechwytywanie treści jest jawnie włączone, spany modelu i narzędzi mogą także
zawierać ograniczone, zredagowane atrybuty `openclaw.content.*` dla konkretnych
klas treści, na które wyrażono zgodę.

## Katalog zdarzeń diagnostycznych

Poniższe zdarzenia stanowią podstawę powyższych metryk i spanów. Pluginy mogą także subskrybować
je bezpośrednio bez eksportu OTLP.

**Użycie modelu**

- `model.usage` — tokeny, koszt, czas trwania, kontekst, dostawca/model/kanał,
  identyfikatory sesji. `usage` to rozliczanie dostawcy/tury dla kosztów i telemetrii;
  `context.used` to bieżąca migawka promptu/kontekstu i może być niższa niż
  `usage.total` dostawcy, gdy używane są wejście z pamięci podręcznej lub wywołania pętli narzędzi.

**Przepływ wiadomości**

- `webhook.received` / `webhook.processed` / `webhook.error`
- `message.queued` / `message.processed`
- `message.delivery.started` / `message.delivery.completed` / `message.delivery.error`

**Kolejka i sesja**

- `queue.lane.enqueue` / `queue.lane.dequeue`
- `session.state` / `session.long_running` / `session.stalled` / `session.stuck`
- `run.attempt` / `run.progress`
- `diagnostic.heartbeat` (zagregowane liczniki: webhooki/kolejka/sesja)

**Cykl życia harnessa**

- `harness.run.started` / `harness.run.completed` / `harness.run.error` —
  cykl życia dla pojedynczego uruchomienia harnessa agenta. Obejmuje `harnessId`, opcjonalny
  `pluginId`, dostawcę/model/kanał oraz identyfikator uruchomienia. Ukończenie dodaje
  `durationMs`, `outcome`, opcjonalnie `resultClassification`, `yieldDetected`
  oraz liczniki `itemLifecycle`. Błędy dodają `phase`
  (`prepare`/`start`/`send`/`resolve`/`cleanup`), `errorCategory` oraz
  opcjonalnie `cleanupFailed`.

**Wykonywanie**

- `exec.process.completed` — wynik terminala, czas trwania, cel, tryb, kod wyjścia
  i rodzaj niepowodzenia. Tekst polecenia i katalogi robocze nie są
  uwzględniane.

## Bez eksportera

Możesz utrzymać zdarzenia diagnostyczne dostępne dla Pluginów lub niestandardowych odbiorników bez
uruchamiania `diagnostics-otel`:

```json5
{
  diagnostics: { enabled: true },
}
```

Aby uzyskać ukierunkowane wyjście debugowania bez podnoszenia `logging.level`, użyj flag diagnostyki.
Flagi są niewrażliwe na wielkość liter i obsługują symbole wieloznaczne (np. `telegram.*` lub
`*`):

```json5
{
  diagnostics: { flags: ["telegram.http"] },
}
```

Albo jako jednorazowe nadpisanie środowiskowe:

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload openclaw gateway
```

Wyjście flag trafia do standardowego pliku dziennika (`logging.file`) i nadal jest
redagowane przez `logging.redactSensitive`. Pełny przewodnik:
[Flagi diagnostyki](/pl/diagnostics/flags).

## Wyłączanie

```json5
{
  diagnostics: { otel: { enabled: false } },
}
```

Możesz także pominąć `diagnostics-otel` w `plugins.allow` albo uruchomić
`openclaw plugins disable diagnostics-otel`.

## Powiązane

- [Logowanie](/pl/logging) — dzienniki plikowe, wyjście konsoli, śledzenie z CLI oraz karta Dzienniki w Control UI
- [Wewnętrzne mechanizmy logowania Gateway](/pl/gateway/logging) — style logów WS, prefiksy podsystemów i przechwytywanie konsoli
- [Flagi diagnostyki](/pl/diagnostics/flags) — ukierunkowane flagi dzienników debugowania
- [Eksport diagnostyki](/pl/gateway/diagnostics) — narzędzie operatora do pakietu wsparcia (oddzielne od eksportu OTEL)
- [Odwołanie konfiguracji](/pl/gateway/configuration-reference#diagnostics) — pełne odwołanie pól `diagnostics.*`

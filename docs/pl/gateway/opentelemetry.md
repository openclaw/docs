---
read_when:
    - Chcesz wysyłać dane o użyciu modelu OpenClaw, przepływie wiadomości lub metrykach sesji do kolektora OpenTelemetry
    - Integrujesz ślady, metryki lub logi z Grafana, Datadog, Honeycomb, New Relic, Tempo lub innym backendem OTLP
    - Do tworzenia pulpitów nawigacyjnych lub alertów potrzebne są dokładne nazwy metryk, nazwy spanów albo struktury atrybutów.
summary: Eksportuj diagnostykę OpenClaw do dowolnego kolektora OpenTelemetry za pomocą pluginu diagnostics-otel (OTLP/HTTP)
title: Eksport OpenTelemetry
x-i18n:
    generated_at: "2026-05-06T09:14:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2d52e5072fcdb097a3dce36a13d9470cea8c169d2af49998cd727814013c411e
    source_path: gateway/opentelemetry.md
    workflow: 16
---

OpenClaw eksportuje diagnostykę przez oficjalny plugin `diagnostics-otel`
za pomocą **OTLP/HTTP (protobuf)**. Każdy kolektor lub backend akceptujący OTLP/HTTP
działa bez zmian w kodzie. Informacje o lokalnych logach plikowych i sposobie ich odczytywania znajdziesz w
[Logowanie](/pl/logging).

## Jak to działa razem

- **Zdarzenia diagnostyczne** to ustrukturyzowane rekordy wewnątrz procesu emitowane przez
  Gateway i dołączone pluginy dla uruchomień modeli, przepływu wiadomości, sesji, kolejek
  i exec.
- **Plugin `diagnostics-otel`** subskrybuje te zdarzenia i eksportuje je jako
  **metryki**, **ślady** i **logi** OpenTelemetry przez OTLP/HTTP.
- **Wywołania dostawców** otrzymują nagłówek W3C `traceparent` z zaufanego kontekstu
  przedziału wywołania modelu OpenClaw, gdy transport dostawcy akceptuje niestandardowe
  nagłówki. Kontekst śladu emitowany przez plugin nie jest propagowany.
- Eksportery są dołączane tylko wtedy, gdy włączone są zarówno powierzchnia diagnostyczna, jak i plugin,
  więc domyślnie koszt wewnątrz procesu pozostaje bliski zeru.

## Szybki start

W przypadku instalacji pakietowych najpierw zainstaluj plugin:

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
`protocol` obecnie obsługuje tylko `http/protobuf`. `grpc` jest ignorowane.
</Note>

## Eksportowane sygnały

| Sygnał      | Co do niego trafia                                                                                                                            |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| **Metryki** | Liczniki i histogramy użycia tokenów, kosztu, czasu trwania uruchomienia, przepływu wiadomości, pasów kolejek, stanu sesji, exec i presji pamięci.          |
| **Ślady**  | Przedziały dla użycia modeli, wywołań modeli, cyklu życia harnessu, wykonywania narzędzi, exec, przetwarzania webhooków/wiadomości, składania kontekstu i pętli narzędzi. |
| **Logi**    | Ustrukturyzowane rekordy `logging.file` eksportowane przez OTLP, gdy włączone jest `diagnostics.otel.logs`.                                              |

Przełączaj `traces`, `metrics` i `logs` niezależnie. Wszystkie trzy są domyślnie włączone,
gdy `diagnostics.otel.enabled` ma wartość true.

## Dokumentacja konfiguracji

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
      protocol: "http/protobuf", // grpc is ignored
      serviceName: "openclaw-gateway",
      headers: { "x-collector-token": "..." },
      traces: true,
      metrics: true,
      logs: true,
      sampleRate: 0.2, // root-span sampler, 0.0..1.0
      flushIntervalMs: 60000, // metric export interval (min 1000ms)
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

| Zmienna                                                                                                          | Cel                                                                                                                                                                                                                                    |
| ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `OTEL_EXPORTER_OTLP_ENDPOINT`                                                                                     | Nadpisuje `diagnostics.otel.endpoint`. Jeśli wartość zawiera już `/v1/traces`, `/v1/metrics` lub `/v1/logs`, jest używana bez zmian.                                                                                                          |
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` / `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` / `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | Nadpisania endpointów specyficzne dla sygnału, używane, gdy pasujący klucz konfiguracji `diagnostics.otel.*Endpoint` nie jest ustawiony. Konfiguracja specyficzna dla sygnału ma pierwszeństwo przed env specyficznym dla sygnału, a ten ma pierwszeństwo przed współdzielonym endpointem.                                     |
| `OTEL_SERVICE_NAME`                                                                                               | Nadpisuje `diagnostics.otel.serviceName`.                                                                                                                                                                                                   |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                                                                                     | Nadpisuje protokół przesyłania (obecnie honorowane jest tylko `http/protobuf`).                                                                                                                                                                        |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                                                                                   | Ustaw na `gen_ai_latest_experimental`, aby emitować najnowszy eksperymentalny atrybut przedziału GenAI (`gen_ai.provider.name`) zamiast starszego `gen_ai.system`. Metryki GenAI zawsze używają ograniczonych atrybutów semantycznych o niskiej kardynalności. |
| `OPENCLAW_OTEL_PRELOADED`                                                                                         | Ustaw na `1`, gdy inny preload lub proces hosta zarejestrował już globalny OpenTelemetry SDK. Plugin pomija wtedy własny cykl życia NodeSDK, ale nadal podłącza listenery diagnostyczne i honoruje `traces`/`metrics`/`logs`.                |

## Prywatność i przechwytywanie treści

Surowa treść modelu/narzędzia **nie** jest eksportowana domyślnie. Przedziały przenoszą ograniczone
identyfikatory (kanał, dostawca, model, kategoria błędu, identyfikatory żądań wyłącznie jako hashe)
i nigdy nie zawierają tekstu promptu, tekstu odpowiedzi, wejść narzędzi, wyjść narzędzi ani
kluczy sesji.

Wychodzące żądania modelu mogą zawierać nagłówek W3C `traceparent`. Ten nagłówek jest
generowany wyłącznie z kontekstu śladu diagnostycznego należącego do OpenClaw dla aktywnego
wywołania modelu. Istniejące nagłówki `traceparent` dostarczone przez wywołującego są zastępowane, więc pluginy lub
niestandardowe opcje dostawcy nie mogą podszyć się pod pochodzenie śladu między usługami.

Ustaw `diagnostics.otel.captureContent.*` na `true` tylko wtedy, gdy twój kolektor i
polityka retencji są zatwierdzone dla tekstu promptu, odpowiedzi, narzędzia lub promptu systemowego.
Każdy podklucz jest włączany niezależnie:

- `inputMessages` - treść promptu użytkownika.
- `outputMessages` - treść odpowiedzi modelu.
- `toolInputs` - ładunki argumentów narzędzi.
- `toolOutputs` - ładunki wyników narzędzi.
- `systemPrompt` - złożony prompt systemowy/deweloperski.

Gdy dowolny podklucz jest włączony, przedziały modeli i narzędzi otrzymują ograniczone, zredagowane
atrybuty `openclaw.content.*` tylko dla tej klasy.

## Próbkowanie i opróżnianie

- **Ślady:** `diagnostics.otel.sampleRate` (tylko root-span, `0.0` odrzuca wszystko,
  `1.0` zachowuje wszystko).
- **Metryki:** `diagnostics.otel.flushIntervalMs` (minimum `1000`).
- **Logi:** Logi OTLP respektują `logging.level` (poziom logów plikowych). Używają
  ścieżki redakcji rekordów logów diagnostycznych, a nie formatowania konsoli. Instalacje o dużym wolumenie
  powinny preferować próbkowanie/filtrowanie w kolektorze OTLP zamiast lokalnego próbkowania.
- **Korelacja logów plikowych:** Logi plikowe JSONL zawierają na najwyższym poziomie `traceId`,
  `spanId`, `parentSpanId` i `traceFlags`, gdy wywołanie logowania przenosi prawidłowy
  kontekst śladu diagnostycznego, co pozwala procesorom logów łączyć lokalne wiersze logów z
  eksportowanymi przedziałami.
- **Korelacja żądań:** Żądania HTTP Gateway i ramki WebSocket tworzą
  wewnętrzny zakres śladu żądania. Logi i zdarzenia diagnostyczne w tym zakresie
  domyślnie dziedziczą ślad żądania, a przedziały uruchomienia agenta i wywołania modelu są
  tworzone jako dzieci, dzięki czemu nagłówki `traceparent` dostawcy pozostają w tym samym śladzie.

## Eksportowane metryki

### Użycie modelu

- `openclaw.tokens` (licznik, attrs: `openclaw.token`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.agent`)
- `openclaw.cost.usd` (licznik, attrs: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.run.duration_ms` (histogram, attrs: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.context.tokens` (histogram, attrs: `openclaw.context`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `gen_ai.client.token.usage` (histogram, metryka konwencji semantycznych GenAI, attrs: `gen_ai.token.type` = `input`/`output`, `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`)
- `gen_ai.client.operation.duration` (histogram, sekundy, metryka konwencji semantycznych GenAI, attrs: `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`, opcjonalnie `error.type`)
- `openclaw.model_call.duration_ms` (histogram, attrs: `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`, plus `openclaw.errorCategory` i `openclaw.failureKind` przy sklasyfikowanych błędach)
- `openclaw.model_call.request_bytes` (histogram, rozmiar w bajtach UTF-8 końcowego ładunku żądania modelu; bez surowej treści ładunku)
- `openclaw.model_call.response_bytes` (histogram, rozmiar w bajtach UTF-8 strumieniowanych zdarzeń odpowiedzi modelu; bez surowej treści odpowiedzi)
- `openclaw.model_call.time_to_first_byte_ms` (histogram, czas, który upłynął przed pierwszym strumieniowanym zdarzeniem odpowiedzi)

### Przepływ wiadomości

- `openclaw.webhook.received` (licznik, attrs: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.webhook.error` (licznik, attrs: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.webhook.duration_ms` (histogram, attrs: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.message.queued` (licznik, attrs: `openclaw.channel`, `openclaw.source`)
- `openclaw.message.processed` (licznik, attrs: `openclaw.channel`, `openclaw.outcome`)
- `openclaw.message.duration_ms` (histogram, attrs: `openclaw.channel`, `openclaw.outcome`)
- `openclaw.message.delivery.started` (licznik, attrs: `openclaw.channel`, `openclaw.delivery.kind`)
- `openclaw.message.delivery.duration_ms` (histogram, attrs: `openclaw.channel`, `openclaw.delivery.kind`, `openclaw.outcome`, `openclaw.errorCategory`)

### Kolejki i sesje

- `openclaw.queue.lane.enqueue` (licznik, attrs: `openclaw.lane`)
- `openclaw.queue.lane.dequeue` (licznik, attrs: `openclaw.lane`)
- `openclaw.queue.depth` (histogram, attrs: `openclaw.lane` lub `openclaw.channel=heartbeat`)
- `openclaw.queue.wait_ms` (histogram, attrs: `openclaw.lane`)
- `openclaw.session.state` (licznik, attrs: `openclaw.state`, `openclaw.reason`)
- `openclaw.session.stuck` (licznik, attrs: `openclaw.state`; emitowane tylko dla księgowania nieaktualnych sesji bez aktywnej pracy)
- `openclaw.session.stuck_age_ms` (histogram, attrs: `openclaw.state`; emitowane tylko dla księgowania nieaktualnych sesji bez aktywnej pracy)
- `openclaw.run.attempt` (licznik, attrs: `openclaw.attempt`)

### Telemetria żywotności sesji

`diagnostics.stuckSessionWarnMs` to próg wieku bez postępu dla diagnostyki
żywotności sesji. Sesja `processing` nie zbliża się do tego progu,
gdy OpenClaw obserwuje postęp odpowiedzi, narzędzia, statusu, bloku lub środowiska wykonawczego ACP.
Keepalive'y pisania nie są liczone jako postęp, więc cichy model lub harness nadal może
zostać wykryty.

OpenClaw klasyfikuje sesje według pracy, którą nadal może obserwować:

- `session.long_running`: aktywna praca osadzona, wywołania modelu lub wywołania narzędzi
  nadal postępują.
- `session.stalled`: istnieje aktywna praca, ale aktywne uruchomienie nie zgłosiło
  ostatnio postępu. Zatrzymane uruchomienia osadzone początkowo pozostają tylko do obserwacji, a następnie
  przechodzą w abort-drain po `diagnostics.stuckSessionAbortMs` bez postępu, aby oczekujące
  tury za lane mogły zostać wznowione. Gdy nie ustawiono tej wartości, próg przerwania domyślnie używa
  bezpieczniejszego rozszerzonego okna wynoszącego co najmniej 10 minut i 5x
  `diagnostics.stuckSessionWarnMs`.
- `session.stuck`: nieaktualna ewidencja sesji bez aktywnej pracy. To natychmiast zwalnia
  dotknięty lane sesji.

Odzyskiwanie emituje ustrukturyzowane zdarzenia `session.recovery.requested` i
`session.recovery.completed`. Diagnostyczny stan sesji jest oznaczany jako bezczynny
dopiero po mutującym wyniku odzyskiwania (`aborted` lub `released`) i tylko wtedy, gdy
ta sama generacja przetwarzania jest nadal bieżąca.

Tylko `session.stuck` emituje licznik `openclaw.session.stuck`,
histogram `openclaw.session.stuck_age_ms` oraz span `openclaw.session.stuck`.
Powtarzające się diagnostyki `session.stuck` wycofują się, dopóki sesja pozostaje
bez zmian, więc pulpity powinny alarmować o utrzymujących się wzrostach, a nie o każdym
takcie heartbeat. Informacje o pokrętle konfiguracji i wartościach domyślnych znajdziesz w
[Informacje o konfiguracji](/pl/gateway/configuration-reference#diagnostics).

### Cykl życia harness

- `openclaw.harness.duration_ms` (histogram, attrs: `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.harness.phase` przy błędach)

### Exec

- `openclaw.exec.duration_ms` (histogram, attrs: `openclaw.exec.target`, `openclaw.exec.mode`, `openclaw.outcome`, `openclaw.failureKind`)

### Wewnętrzne mechanizmy diagnostyki (pamięć i pętla narzędzi)

- `openclaw.memory.heap_used_bytes` (histogram, attrs: `openclaw.memory.kind`)
- `openclaw.memory.rss_bytes` (histogram)
- `openclaw.memory.pressure` (counter, attrs: `openclaw.memory.level`)
- `openclaw.tool.loop.iterations` (counter, attrs: `openclaw.toolName`, `openclaw.outcome`)
- `openclaw.tool.loop.duration_ms` (histogram, attrs: `openclaw.toolName`, `openclaw.outcome`)

## Eksportowane spany

- `openclaw.model.usage`
  - `openclaw.channel`, `openclaw.provider`, `openclaw.model`
  - `openclaw.tokens.*` (input/output/cache_read/cache_write/total)
  - `gen_ai.system` domyślnie albo `gen_ai.provider.name`, gdy włączono najnowsze konwencje semantyczne GenAI
  - `gen_ai.request.model`, `gen_ai.operation.name`, `gen_ai.usage.*`
- `openclaw.run`
  - `openclaw.outcome`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.errorCategory`
- `openclaw.model.call`
  - `gen_ai.system` domyślnie albo `gen_ai.provider.name`, gdy włączono najnowsze konwencje semantyczne GenAI
  - `gen_ai.request.model`, `gen_ai.operation.name`, `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`
  - `openclaw.errorCategory` i opcjonalnie `openclaw.failureKind` przy błędach
  - `openclaw.model_call.request_bytes`, `openclaw.model_call.response_bytes`, `openclaw.model_call.time_to_first_byte_ms`
  - `openclaw.provider.request_id_hash` (ograniczony hash oparty na SHA identyfikatora żądania dostawcy upstream; surowe identyfikatory nie są eksportowane)
- `openclaw.harness.run`
  - `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.provider`, `openclaw.model`, `openclaw.channel`
  - Po zakończeniu: `openclaw.harness.result_classification`, `openclaw.harness.yield_detected`, `openclaw.harness.items.started`, `openclaw.harness.items.completed`, `openclaw.harness.items.active`
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
  - `openclaw.toolName`, `openclaw.outcome`, `openclaw.iterations`, `openclaw.errorCategory` (bez komunikatów pętli, parametrów ani wyjścia narzędzia)
- `openclaw.memory.pressure`
  - `openclaw.memory.level`, `openclaw.memory.heap_used_bytes`, `openclaw.memory.rss_bytes`

Gdy przechwytywanie treści jest jawnie włączone, spany modelu i narzędzi mogą również
zawierać ograniczone, zredagowane atrybuty `openclaw.content.*` dla konkretnych
klas treści, na które wyrażono zgodę.

## Katalog zdarzeń diagnostycznych

Poniższe zdarzenia zasilają metryki i spany powyżej. Pluginy mogą też subskrybować
je bezpośrednio bez eksportu OTLP.

**Użycie modelu**

- `model.usage` - tokeny, koszt, czas trwania, kontekst, dostawca/model/kanał,
  identyfikatory sesji. `usage` to rozliczanie dostawcy/tury na potrzeby kosztów i telemetrii;
  `context.used` to bieżąca migawka promptu/kontekstu i może być niższa niż
  `usage.total` dostawcy, gdy w grę wchodzą buforowane dane wejściowe lub wywołania pętli narzędzi.

**Przepływ wiadomości**

- `webhook.received` / `webhook.processed` / `webhook.error`
- `message.queued` / `message.processed`
- `message.delivery.started` / `message.delivery.completed` / `message.delivery.error`

**Kolejka i sesja**

- `queue.lane.enqueue` / `queue.lane.dequeue`
- `session.state` / `session.long_running` / `session.stalled` / `session.stuck`
- `run.attempt` / `run.progress`
- `diagnostic.heartbeat` (zagregowane liczniki: webhooki/kolejka/sesja)

**Cykl życia harness**

- `harness.run.started` / `harness.run.completed` / `harness.run.error` -
  cykl życia pojedynczego uruchomienia dla harness agenta. Obejmuje `harnessId`, opcjonalny
  `pluginId`, dostawcę/model/kanał oraz identyfikator uruchomienia. Zakończenie dodaje
  `durationMs`, `outcome`, opcjonalnie `resultClassification`, `yieldDetected`
  oraz liczniki `itemLifecycle`. Błędy dodają `phase`
  (`prepare`/`start`/`send`/`resolve`/`cleanup`), `errorCategory` oraz
  opcjonalnie `cleanupFailed`.

**Exec**

- `exec.process.completed` - końcowy wynik terminala, czas trwania, cel, tryb, kod wyjścia
  oraz rodzaj błędu. Tekst polecenia i katalogi robocze nie są
  uwzględniane.

## Bez eksportera

Możesz utrzymać dostępność zdarzeń diagnostycznych dla pluginów lub niestandardowych odbiorników bez
uruchamiania `diagnostics-otel`:

```json5
{
  diagnostics: { enabled: true },
}
```

Aby uzyskać ukierunkowane wyjście debugowania bez podnoszenia `logging.level`, użyj flag diagnostycznych.
Flagi nie rozróżniają wielkości liter i obsługują symbole wieloznaczne (np. `telegram.*` lub
`*`):

```json5
{
  diagnostics: { flags: ["telegram.http"] },
}
```

Albo jako jednorazowe nadpisanie zmienną środowiskową:

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload openclaw gateway
```

Wyjście flag trafia do standardowego pliku dziennika (`logging.file`) i nadal jest
redagowane przez `logging.redactSensitive`. Pełny przewodnik:
[Flagi diagnostyczne](/pl/diagnostics/flags).

## Wyłączanie

```json5
{
  diagnostics: { otel: { enabled: false } },
}
```

Możesz też pominąć `diagnostics-otel` w `plugins.allow` albo uruchomić
`openclaw plugins disable diagnostics-otel`.

## Powiązane

- [Logowanie](/pl/logging) - dzienniki w pliku, wyjście konsoli, śledzenie przez CLI oraz karta Logs w Control UI
- [Wewnętrzne mechanizmy logowania Gateway](/pl/gateway/logging) - style logów WS, prefiksy podsystemów i przechwytywanie konsoli
- [Flagi diagnostyczne](/pl/diagnostics/flags) - ukierunkowane flagi dziennika debugowania
- [Eksport diagnostyki](/pl/gateway/diagnostics) - narzędzie pakietu wsparcia dla operatorów (oddzielne od eksportu OTEL)
- [Informacje o konfiguracji](/pl/gateway/configuration-reference#diagnostics) - pełne informacje o polach `diagnostics.*`

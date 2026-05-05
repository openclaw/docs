---
read_when:
    - Chcesz wysyłać do kolektora OpenTelemetry dane OpenClaw o użyciu modelu, przepływie wiadomości lub metrykach sesji
    - Konfigurujesz przesyłanie śladów, metryk lub dzienników do Grafana, Datadog, Honeycomb, New Relic, Tempo albo innego backendu OTLP
    - Potrzebujesz dokładnych nazw metryk, nazw spanów lub struktur atrybutów, aby tworzyć pulpity nawigacyjne lub alerty
summary: Eksportuj diagnostykę OpenClaw do dowolnego kolektora OpenTelemetry za pośrednictwem Plugin diagnostics-otel (OTLP/HTTP)
title: Eksport OpenTelemetry
x-i18n:
    generated_at: "2026-05-05T06:17:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: b5030b8b16624f114e31838d3a055c24e8a23a6c77d63495a445cb9f2e227b6a
    source_path: gateway/opentelemetry.md
    workflow: 16
---

OpenClaw eksportuje diagnostykę przez oficjalny plugin `diagnostics-otel`
przy użyciu **OTLP/HTTP (protobuf)**. Każdy kolektor lub backend akceptujący OTLP/HTTP
działa bez zmian w kodzie. Informacje o lokalnych logach plikowych i sposobie ich odczytu znajdziesz w
[Logowanie](/pl/logging).

## Jak to działa razem

- **Zdarzenia diagnostyczne** to ustrukturyzowane, wewnątrzprocesowe rekordy emitowane przez
  Gateway i dołączone pluginy dla uruchomień modeli, przepływu wiadomości, sesji, kolejek
  oraz exec.
- **Plugin `diagnostics-otel`** subskrybuje te zdarzenia i eksportuje je jako
  **metryki**, **ślady** oraz **logi** OpenTelemetry przez OTLP/HTTP.
- **Wywołania dostawców** otrzymują nagłówek W3C `traceparent` z zaufanego kontekstu
  spanu wywołania modelu OpenClaw, gdy transport dostawcy akceptuje niestandardowe
  nagłówki. Kontekst śledzenia emitowany przez pluginy nie jest propagowany.
- Eksportery są podłączane tylko wtedy, gdy włączone są zarówno powierzchnia diagnostyczna, jak i plugin,
  więc domyślnie koszt wewnątrzprocesowy pozostaje bliski zeru.

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

Możesz też włączyć plugin z CLI:

```bash
openclaw plugins enable diagnostics-otel
```

<Note>
`protocol` obecnie obsługuje tylko `http/protobuf`. `grpc` jest ignorowany.
</Note>

## Eksportowane sygnały

| Sygnał      | Co do niego trafia                                                                                                                            |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| **Metryki** | Liczniki i histogramy użycia tokenów, kosztu, czasu trwania uruchomień, przepływu wiadomości, pasm kolejek, stanu sesji, exec i presji pamięci.          |
| **Ślady**  | Spany użycia modelu, wywołań modelu, cyklu życia harnessa, wykonywania narzędzi, exec, przetwarzania webhooków/wiadomości, składania kontekstu i pętli narzędzi. |
| **Logi**    | Ustrukturyzowane rekordy `logging.file` eksportowane przez OTLP, gdy włączone jest `diagnostics.otel.logs`.                                              |

Przełączaj `traces`, `metrics` i `logs` niezależnie. Wszystkie trzy są domyślnie włączone,
gdy `diagnostics.otel.enabled` ma wartość true.

## Odniesienie konfiguracji

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
| `OTEL_EXPORTER_OTLP_ENDPOINT`                                                                                     | Zastępuje `diagnostics.otel.endpoint`. Jeśli wartość już zawiera `/v1/traces`, `/v1/metrics` lub `/v1/logs`, jest używana bez zmian.                                                                                                          |
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` / `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` / `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | Nadpisania punktów końcowych specyficzne dla sygnału, używane, gdy odpowiadający im klucz konfiguracji `diagnostics.otel.*Endpoint` nie jest ustawiony. Konfiguracja specyficzna dla sygnału wygrywa z env specyficznym dla sygnału, a ten wygrywa ze wspólnym punktem końcowym.                                     |
| `OTEL_SERVICE_NAME`                                                                                               | Zastępuje `diagnostics.otel.serviceName`.                                                                                                                                                                                                   |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                                                                                     | Zastępuje protokół przewodowy (obecnie honorowane jest tylko `http/protobuf`).                                                                                                                                                                        |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                                                                                   | Ustaw na `gen_ai_latest_experimental`, aby emitować najnowszy eksperymentalny atrybut spanu GenAI (`gen_ai.provider.name`) zamiast starszego `gen_ai.system`. Metryki GenAI zawsze używają ograniczonych, niskokardynalnych atrybutów semantycznych. |
| `OPENCLAW_OTEL_PRELOADED`                                                                                         | Ustaw na `1`, gdy inny preload lub proces hosta już zarejestrował globalny SDK OpenTelemetry. Plugin pomija wtedy własny cykl życia NodeSDK, ale nadal podłącza listenery diagnostyczne i honoruje `traces`/`metrics`/`logs`.                |

## Prywatność i przechwytywanie treści

Surowa treść modelu/narzędzi **nie** jest domyślnie eksportowana. Spany przenoszą ograniczone
identyfikatory (kanał, dostawca, model, kategoria błędu, identyfikatory żądań tylko jako hashe)
i nigdy nie zawierają tekstu promptu, tekstu odpowiedzi, wejść narzędzi, wyjść narzędzi ani
kluczy sesji.

Wychodzące żądania modelu mogą zawierać nagłówek W3C `traceparent`. Ten nagłówek jest
generowany wyłącznie z należącego do OpenClaw diagnostycznego kontekstu śledzenia dla aktywnego
wywołania modelu. Istniejące nagłówki `traceparent` dostarczone przez wywołującego są zastępowane, więc pluginy lub
niestandardowe opcje dostawcy nie mogą podszyć się pod pochodzenie śladu między usługami.

Ustaw `diagnostics.otel.captureContent.*` na `true` tylko wtedy, gdy Twój kolektor i
polityka retencji są zatwierdzone dla tekstu promptów, odpowiedzi, narzędzi lub promptu systemowego.
Każdy podklucz jest włączany niezależnie:

- `inputMessages` — treść promptu użytkownika.
- `outputMessages` — treść odpowiedzi modelu.
- `toolInputs` — ładunki argumentów narzędzi.
- `toolOutputs` — ładunki wyników narzędzi.
- `systemPrompt` — złożony prompt systemowy/deweloperski.

Gdy dowolny podklucz jest włączony, spany modelu i narzędzi otrzymują ograniczone, zredagowane
atrybuty `openclaw.content.*` tylko dla tej klasy.

## Próbkowanie i opróżnianie

- **Ślady:** `diagnostics.otel.sampleRate` (tylko span główny, `0.0` odrzuca wszystko,
  `1.0` zachowuje wszystko).
- **Metryki:** `diagnostics.otel.flushIntervalMs` (minimum `1000`).
- **Logi:** logi OTLP respektują `logging.level` (poziom logów plikowych). Używają
  ścieżki redakcji diagnostycznych rekordów logów, a nie formatowania konsoli. Instalacje o dużym wolumenie
  powinny preferować próbkowanie/filtrowanie kolektora OTLP zamiast lokalnego próbkowania.
- **Korelacja logów plikowych:** logi plikowe JSONL zawierają najwyższego poziomu `traceId`,
  `spanId`, `parentSpanId` i `traceFlags`, gdy wywołanie logowania niesie prawidłowy
  diagnostyczny kontekst śledzenia, co pozwala procesorom logów łączyć lokalne linie logów z
  wyeksportowanymi spanami.
- **Korelacja żądań:** żądania HTTP Gateway i ramki WebSocket tworzą
  wewnętrzny zakres śladu żądania. Logi i zdarzenia diagnostyczne w tym zakresie
  domyślnie dziedziczą ślad żądania, a spany uruchomienia agenta i wywołania modelu są
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
- `openclaw.model_call.request_bytes` (histogram, rozmiar w bajtach UTF-8 finalnego ładunku żądania modelu; bez surowej treści ładunku)
- `openclaw.model_call.response_bytes` (histogram, rozmiar w bajtach UTF-8 strumieniowanych zdarzeń odpowiedzi modelu; bez surowej treści odpowiedzi)
- `openclaw.model_call.time_to_first_byte_ms` (histogram, czas, który upłynął przed pierwszym strumieniowanym zdarzeniem odpowiedzi)

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
- `openclaw.session.stuck` (licznik, atrybuty: `openclaw.state`; emitowane tylko dla porządkowania nieaktualnych sesji bez aktywnej pracy)
- `openclaw.session.stuck_age_ms` (histogram, atrybuty: `openclaw.state`; emitowane tylko dla porządkowania nieaktualnych sesji bez aktywnej pracy)
- `openclaw.run.attempt` (licznik, atrybuty: `openclaw.attempt`)

### Telemetria żywotności sesji

`diagnostics.stuckSessionWarnMs` to próg wieku bez postępu dla diagnostyki
żywotności sesji. Sesja `processing` nie zbliża się do tego progu,
dopóki OpenClaw obserwuje postęp odpowiedzi, narzędzia, statusu, bloku lub środowiska uruchomieniowego ACP.
Podtrzymania pisania nie są liczone jako postęp, więc cichy model lub harness nadal może
zostać wykryty.

OpenClaw klasyfikuje sesje według pracy, którą nadal może obserwować:

- `session.long_running`: aktywna praca osadzona, wywołania modelu lub wywołania narzędzi nadal robią postęp.
- `session.stalled`: istnieje aktywna praca, ale aktywne uruchomienie nie zgłosiło ostatnio postępu. Zatrzymane uruchomienia osadzone początkowo pozostają tylko do obserwacji, a następnie przechodzą w abort-drain po `diagnostics.stuckSessionAbortMs` bez postępu, aby zakolejkowane tury za tą ścieżką mogły zostać wznowione. Gdy wartość nie jest ustawiona, próg przerwania domyślnie używa bezpieczniejszego, wydłużonego okna wynoszącego co najmniej 10 minut oraz 5x `diagnostics.stuckSessionWarnMs`.
- `session.stuck`: nieaktualna ewidencja sesji bez aktywnej pracy. Natychmiast zwalnia to odpowiednią ścieżkę sesji.

Odzyskiwanie emituje strukturalne zdarzenia `session.recovery.requested` i `session.recovery.completed`. Diagnostyczny stan sesji jest oznaczany jako bezczynny dopiero po mutującym wyniku odzyskiwania (`aborted` lub `released`) i tylko wtedy, gdy ta sama generacja przetwarzania jest nadal bieżąca.

Tylko `session.stuck` emituje licznik `openclaw.session.stuck`, histogram `openclaw.session.stuck_age_ms` oraz span `openclaw.session.stuck`. Powtarzane diagnostyki `session.stuck` wycofują się, gdy sesja pozostaje niezmieniona, więc pulpity powinny alarmować przy utrzymujących się wzrostach, a nie przy każdym takcie Heartbeat. Informacje o przełączniku konfiguracji i wartościach domyślnych znajdziesz w [Dokumentacji konfiguracji](/pl/gateway/configuration-reference#diagnostics).

### Cykl życia harnessa

- `openclaw.harness.duration_ms` (histogram, atrybuty: `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.harness.phase` przy błędach)

### Exec

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
  - `openclaw.provider.request_id_hash` (ograniczony hash oparty na SHA identyfikatora żądania dostawcy nadrzędnego; surowe identyfikatory nie są eksportowane)
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
  - `openclaw.toolName`, `openclaw.outcome`, `openclaw.iterations`, `openclaw.errorCategory` (bez komunikatów pętli, parametrów ani wyjścia narzędzia)
- `openclaw.memory.pressure`
  - `openclaw.memory.level`, `openclaw.memory.heap_used_bytes`, `openclaw.memory.rss_bytes`

Gdy przechwytywanie treści jest jawnie włączone, spany modelu i narzędzi mogą też zawierać ograniczone, zredagowane atrybuty `openclaw.content.*` dla konkretnych klas treści, które włączono.

## Katalog zdarzeń diagnostycznych

Poniższe zdarzenia wspierają powyższe metryki i spany. Pluginy mogą też subskrybować je bezpośrednio bez eksportu OTLP.

**Użycie modelu**

- `model.usage` — tokeny, koszt, czas trwania, kontekst, dostawca/model/kanał, identyfikatory sesji. `usage` to rozliczanie dostawcy/tury dla kosztów i telemetrii; `context.used` to bieżąca migawka promptu/kontekstu i może być niższa niż `usage.total` dostawcy, gdy używane są buforowane dane wejściowe lub wywołania pętli narzędzi.

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

- `harness.run.started` / `harness.run.completed` / `harness.run.error` — cykl życia pojedynczego uruchomienia dla harnessa agenta. Obejmuje `harnessId`, opcjonalnie `pluginId`, dostawcę/model/kanał oraz identyfikator uruchomienia. Ukończenie dodaje `durationMs`, `outcome`, opcjonalnie `resultClassification`, `yieldDetected` oraz liczniki `itemLifecycle`. Błędy dodają `phase` (`prepare`/`start`/`send`/`resolve`/`cleanup`), `errorCategory` oraz opcjonalnie `cleanupFailed`.

**Exec**

- `exec.process.completed` — końcowy wynik, czas trwania, cel, tryb, kod wyjścia i rodzaj awarii. Tekst polecenia i katalogi robocze nie są uwzględniane.

## Bez eksportera

Możesz zachować dostępność zdarzeń diagnostycznych dla pluginów lub własnych sinków bez uruchamiania `diagnostics-otel`:

```json5
{
  diagnostics: { enabled: true },
}
```

Aby uzyskać ukierunkowane wyjście debugowania bez podnoszenia `logging.level`, użyj flag diagnostycznych. Flagi nie rozróżniają wielkości liter i obsługują symbole wieloznaczne (np. `telegram.*` lub `*`):

```json5
{
  diagnostics: { flags: ["telegram.http"] },
}
```

Albo jako jednorazowe nadpisanie przez zmienną środowiskową:

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload openclaw gateway
```

Wyjście flag trafia do standardowego pliku dziennika (`logging.file`) i nadal jest redagowane przez `logging.redactSensitive`. Pełny przewodnik: [Flagi diagnostyczne](/pl/diagnostics/flags).

## Wyłączanie

```json5
{
  diagnostics: { otel: { enabled: false } },
}
```

Możesz też pominąć `diagnostics-otel` w `plugins.allow` albo uruchomić `openclaw plugins disable diagnostics-otel`.

## Powiązane

- [Logowanie](/pl/logging) — dzienniki plikowe, wyjście konsoli, śledzenie CLI i karta dzienników Control UI
- [Wewnętrzne mechanizmy logowania Gateway](/pl/gateway/logging) — style dzienników WS, prefiksy podsystemów i przechwytywanie konsoli
- [Flagi diagnostyczne](/pl/diagnostics/flags) — ukierunkowane flagi dziennika debugowania
- [Eksport diagnostyki](/pl/gateway/diagnostics) — narzędzie operatora do pakietów wsparcia (oddzielne od eksportu OTEL)
- [Dokumentacja konfiguracji](/pl/gateway/configuration-reference#diagnostics) — pełna dokumentacja pól `diagnostics.*`

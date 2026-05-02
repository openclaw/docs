---
read_when:
    - Chcesz wysyłać dane o użyciu modelu OpenClaw, przepływie wiadomości lub metrykach sesji do kolektora OpenTelemetry
    - Integrujesz ślady, metryki lub logi z Grafana, Datadog, Honeycomb, New Relic, Tempo albo innym backendem OTLP
    - Potrzebujesz dokładnych nazw metryk, nazw spanów lub struktur atrybutów do tworzenia pulpitów nawigacyjnych albo alertów
summary: Eksportuj diagnostykę OpenClaw do dowolnego kolektora OpenTelemetry za pomocą pluginu diagnostics-otel (OTLP/HTTP)
title: Eksport OpenTelemetry
x-i18n:
    generated_at: "2026-05-02T20:44:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3287540a32b9b8400f227ab9400073e8145af89e5246e6af06945a96b751826f
    source_path: gateway/opentelemetry.md
    workflow: 16
---

OpenClaw eksportuje dane diagnostyczne przez oficjalny Plugin `diagnostics-otel`
przy użyciu **OTLP/HTTP (protobuf)**. Każdy kolektor lub backend akceptujący OTLP/HTTP
działa bez zmian w kodzie. Informacje o lokalnych logach plikowych i ich odczytywaniu znajdziesz w
[Logowanie](/pl/logging).

## Jak to działa razem

- **Zdarzenia diagnostyczne** to ustrukturyzowane rekordy wewnątrz procesu emitowane przez
  Gateway i dołączone pluginy dla uruchomień modeli, przepływu wiadomości, sesji, kolejek,
  oraz exec.
- **Plugin `diagnostics-otel`** subskrybuje te zdarzenia i eksportuje je jako
  **metryki**, **ślady** oraz **logi** OpenTelemetry przez OTLP/HTTP.
- **Wywołania dostawców** otrzymują nagłówek W3C `traceparent` z OpenClaw z kontekstu
  zaufanego span wywołania modelu, gdy transport dostawcy akceptuje niestandardowe
  nagłówki. Kontekst śladu emitowany przez Plugin nie jest propagowany.
- Eksportery są dołączane tylko wtedy, gdy włączone są zarówno powierzchnia diagnostyczna, jak i Plugin,
  więc domyślny koszt wewnątrz procesu pozostaje bliski zeru.

## Szybki start

W przypadku instalacji pakietowych najpierw zainstaluj Plugin:

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

Możesz także włączyć Plugin z CLI:

```bash
openclaw plugins enable diagnostics-otel
```

<Note>
`protocol` obecnie obsługuje tylko `http/protobuf`. `grpc` jest ignorowane.
</Note>

## Eksportowane sygnały

| Sygnał      | Co do niego trafia                                                                                                                         |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| **Metryki** | Liczniki i histogramy użycia tokenów, kosztu, czasu trwania uruchomienia, przepływu wiadomości, kolejek, stanu sesji, exec i presji pamięci. |
| **Ślady**   | Spany dla użycia modelu, wywołań modelu, cyklu życia harness, wykonywania narzędzi, exec, przetwarzania webhooków/wiadomości, składania kontekstu i pętli narzędzi. |
| **Logi**    | Ustrukturyzowane rekordy `logging.file` eksportowane przez OTLP, gdy włączone jest `diagnostics.otel.logs`.                                  |

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

| Zmienna                                                                                                           | Cel                                                                                                                                                                                                                                      |
| ----------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OTEL_EXPORTER_OTLP_ENDPOINT`                                                                                     | Nadpisuje `diagnostics.otel.endpoint`. Jeśli wartość zawiera już `/v1/traces`, `/v1/metrics` albo `/v1/logs`, jest używana bez zmian.                                                                                                    |
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` / `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` / `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | Nadpisania punktów końcowych specyficzne dla sygnałów, używane wtedy, gdy pasujący klucz konfiguracji `diagnostics.otel.*Endpoint` nie jest ustawiony. Konfiguracja specyficzna dla sygnału wygrywa z env specyficznym dla sygnału, a ten wygrywa ze współdzielonym punktem końcowym. |
| `OTEL_SERVICE_NAME`                                                                                               | Nadpisuje `diagnostics.otel.serviceName`.                                                                                                                                                                                                |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                                                                                     | Nadpisuje protokół przesyłania (obecnie respektowane jest tylko `http/protobuf`).                                                                                                                                                        |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                                                                                   | Ustaw na `gen_ai_latest_experimental`, aby emitować najnowszy eksperymentalny atrybut spana GenAI (`gen_ai.provider.name`) zamiast starszego `gen_ai.system`. Metryki GenAI zawsze używają ograniczonych atrybutów semantycznych o niskiej kardynalności. |
| `OPENCLAW_OTEL_PRELOADED`                                                                                         | Ustaw na `1`, gdy inny preload lub proces hosta zarejestrował już globalny OpenTelemetry SDK. Plugin pomija wtedy własny cykl życia NodeSDK, ale nadal podłącza listenery diagnostyczne i respektuje `traces`/`metrics`/`logs`.           |

## Prywatność i przechwytywanie treści

Surowa treść modelu/narzędzia **nie** jest domyślnie eksportowana. Spany przenoszą ograniczone
identyfikatory (kanał, dostawca, model, kategoria błędu, identyfikatory żądań tylko jako hash)
i nigdy nie zawierają tekstu promptu, tekstu odpowiedzi, wejść narzędzi, wyjść narzędzi ani
kluczy sesji.

Wychodzące żądania modelu mogą zawierać nagłówek W3C `traceparent`. Ten nagłówek jest
generowany wyłącznie z kontekstu śladu diagnostycznego należącego do OpenClaw dla aktywnego
wywołania modelu. Istniejące nagłówki `traceparent` dostarczone przez wywołującego są zastępowane,
więc pluginy lub niestandardowe opcje dostawcy nie mogą podszywać się pod przodków śladu między usługami.

Ustaw `diagnostics.otel.captureContent.*` na `true` tylko wtedy, gdy Twój kolektor i
polityka retencji są zatwierdzone do przechowywania tekstu promptów, odpowiedzi, narzędzi lub promptu systemowego.
Każdy podklucz jest włączany niezależnie:

- `inputMessages` — treść promptu użytkownika.
- `outputMessages` — treść odpowiedzi modelu.
- `toolInputs` — ładunki argumentów narzędzi.
- `toolOutputs` — ładunki wyników narzędzi.
- `systemPrompt` — złożony prompt systemowy/deweloperski.

Gdy dowolny podklucz jest włączony, spany modelu i narzędzi otrzymują ograniczone, zredagowane
atrybuty `openclaw.content.*` tylko dla tej klasy.

## Próbkowanie i opróżnianie

- **Ślady:** `diagnostics.otel.sampleRate` (tylko root-span, `0.0` odrzuca wszystkie,
  `1.0` zachowuje wszystkie).
- **Metryki:** `diagnostics.otel.flushIntervalMs` (minimum `1000`).
- **Logi:** logi OTLP respektują `logging.level` (poziom logu plikowego). Używają
  diagnostycznej ścieżki redakcji rekordów logów, a nie formatowania konsoli. Instalacje o dużym wolumenie
  powinny preferować próbkowanie/filtrowanie kolektora OTLP zamiast lokalnego próbkowania.
- **Korelacja logów plikowych:** logi plikowe JSONL zawierają pola najwyższego poziomu `traceId`,
  `spanId`, `parentSpanId` i `traceFlags`, gdy wywołanie logowania przenosi prawidłowy
  kontekst śladu diagnostycznego, co pozwala procesorom logów łączyć lokalne linie logów z
  eksportowanymi spanami.
- **Korelacja żądań:** żądania HTTP Gateway i ramki WebSocket tworzą
  wewnętrzny zakres śladu żądania. Logi i zdarzenia diagnostyczne wewnątrz tego zakresu
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
- `openclaw.model_call.request_bytes` (histogram, rozmiar w bajtach UTF-8 końcowego ładunku żądania modelu; bez surowej treści ładunku)
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
- `openclaw.queue.depth` (histogram, atrybuty: `openclaw.lane` albo `openclaw.channel=heartbeat`)
- `openclaw.queue.wait_ms` (histogram, atrybuty: `openclaw.lane`)
- `openclaw.session.state` (licznik, atrybuty: `openclaw.state`, `openclaw.reason`)
- `openclaw.session.stuck` (licznik, atrybuty: `openclaw.state`; emitowane tylko dla prowadzenia ewidencji nieaktualnych sesji bez aktywnej pracy)
- `openclaw.session.stuck_age_ms` (histogram, atrybuty: `openclaw.state`; emitowane tylko dla prowadzenia ewidencji nieaktualnych sesji bez aktywnej pracy)
- `openclaw.run.attempt` (licznik, atrybuty: `openclaw.attempt`)

### Telemetria żywotności sesji

`diagnostics.stuckSessionWarnMs` to próg wieku bez postępu dla diagnostyki
żywotności sesji. Sesja `processing` nie starzeje się względem tego progu,
gdy OpenClaw obserwuje postęp odpowiedzi, narzędzia, statusu, bloku lub środowiska wykonawczego ACP.
Keepalive pisania nie są liczone jako postęp, więc milczący model lub harness nadal może
zostać wykryty.

OpenClaw klasyfikuje sesje według pracy, którą nadal może obserwować:

- `session.long_running`: aktywna praca osadzona, wywołania modelu lub wywołania narzędzi
  nadal robią postępy.
- `session.stalled`: istnieje aktywna praca, ale aktywne uruchomienie nie zgłosiło
  ostatnio postępów.
- `session.stuck`: nieaktualna ewidencja sesji bez aktywnej pracy. To jest jedyna
  klasyfikacja żywotności, która zwalnia dotknięty tor sesji.

Tylko `session.stuck` emituje licznik `openclaw.session.stuck`, histogram
`openclaw.session.stuck_age_ms` oraz zakres `openclaw.session.stuck`.
Powtarzane diagnostyki `session.stuck` wycofują się, dopóki sesja pozostaje
bez zmian, więc pulpity powinny alarmować o utrzymujących się wzrostach, a nie o każdym
tyknięciu Heartbeat. Pokrętło konfiguracji i wartości domyślne opisuje
[Dokumentacja konfiguracji](/pl/gateway/configuration-reference#diagnostics).

### Cykl życia uprzęży

- `openclaw.harness.duration_ms` (histogram, atrybuty: `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.harness.phase` przy błędach)

### Exec

- `openclaw.exec.duration_ms` (histogram, atrybuty: `openclaw.exec.target`, `openclaw.exec.mode`, `openclaw.outcome`, `openclaw.failureKind`)

### Wewnętrzne elementy diagnostyki (pamięć i pętla narzędzi)

- `openclaw.memory.heap_used_bytes` (histogram, atrybuty: `openclaw.memory.kind`)
- `openclaw.memory.rss_bytes` (histogram)
- `openclaw.memory.pressure` (licznik, atrybuty: `openclaw.memory.level`)
- `openclaw.tool.loop.iterations` (licznik, atrybuty: `openclaw.toolName`, `openclaw.outcome`)
- `openclaw.tool.loop.duration_ms` (histogram, atrybuty: `openclaw.toolName`, `openclaw.outcome`)

## Eksportowane zakresy

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
  - `openclaw.channel`, `openclaw.webhook`, `openclaw.chatId`
- `openclaw.webhook.error`
  - `openclaw.channel`, `openclaw.webhook`, `openclaw.chatId`, `openclaw.error`
- `openclaw.message.processed`
  - `openclaw.channel`, `openclaw.outcome`, `openclaw.chatId`, `openclaw.messageId`, `openclaw.reason`
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

Gdy przechwytywanie treści jest jawnie włączone, zakresy modelu i narzędzi mogą także
zawierać ograniczone, zredagowane atrybuty `openclaw.content.*` dla konkretnych
klas treści, które włączono.

## Katalog zdarzeń diagnostycznych

Poniższe zdarzenia stanowią podstawę powyższych metryk i zakresów. Pluginy mogą także subskrybować
je bezpośrednio, bez eksportu OTLP.

**Użycie modelu**

- `model.usage` — tokeny, koszt, czas trwania, kontekst, dostawca/model/kanał,
  identyfikatory sesji. `usage` to rozliczanie dostawcy/turowe dla kosztów i telemetrii;
  `context.used` to bieżąca migawka promptu/kontekstu i może być niższa niż
  `usage.total` dostawcy, gdy występują buforowane dane wejściowe lub wywołania pętli narzędzi.

**Przepływ wiadomości**

- `webhook.received` / `webhook.processed` / `webhook.error`
- `message.queued` / `message.processed`
- `message.delivery.started` / `message.delivery.completed` / `message.delivery.error`

**Kolejka i sesja**

- `queue.lane.enqueue` / `queue.lane.dequeue`
- `session.state` / `session.long_running` / `session.stalled` / `session.stuck`
- `run.attempt` / `run.progress`
- `diagnostic.heartbeat` (zagregowane liczniki: Webhooki/kolejka/sesja)

**Cykl życia uprzęży**

- `harness.run.started` / `harness.run.completed` / `harness.run.error` —
  cykl życia na uruchomienie dla uprzęży agenta. Zawiera `harnessId`, opcjonalny
  `pluginId`, dostawcę/model/kanał oraz identyfikator uruchomienia. Ukończenie dodaje
  `durationMs`, `outcome`, opcjonalne `resultClassification`, `yieldDetected`
  oraz liczniki `itemLifecycle`. Błędy dodają `phase`
  (`prepare`/`start`/`send`/`resolve`/`cleanup`), `errorCategory` oraz
  opcjonalne `cleanupFailed`.

**Exec**

- `exec.process.completed` — wynik końcowy, czas trwania, cel, tryb, kod wyjścia
  i rodzaj niepowodzenia. Tekst polecenia i katalogi robocze nie są
  uwzględniane.

## Bez eksportera

Możesz zachować dostępność zdarzeń diagnostycznych dla Pluginów lub niestandardowych odbiorników bez
uruchamiania `diagnostics-otel`:

```json5
{
  diagnostics: { enabled: true },
}
```

Aby uzyskać ukierunkowane dane debugowania bez podnoszenia `logging.level`, użyj flag diagnostyki.
Flagi nie uwzględniają wielkości liter i obsługują symbole wieloznaczne (np. `telegram.*` lub
`*`):

```json5
{
  diagnostics: { flags: ["telegram.http"] },
}
```

Albo jako jednorazowe nadpisanie env:

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

- [Rejestrowanie](/pl/logging) — dzienniki plików, wyjście konsoli, śledzenie ogona w CLI oraz karta Dzienniki w Control UI
- [Wewnętrzne elementy rejestrowania Gateway](/pl/gateway/logging) — style dzienników WS, prefiksy podsystemów i przechwytywanie konsoli
- [Flagi diagnostyki](/pl/diagnostics/flags) — ukierunkowane flagi dziennika debugowania
- [Eksport diagnostyki](/pl/gateway/diagnostics) — narzędzie pakietu wsparcia dla operatora (oddzielne od eksportu OTEL)
- [Dokumentacja konfiguracji](/pl/gateway/configuration-reference#diagnostics) — pełna dokumentacja pól `diagnostics.*`

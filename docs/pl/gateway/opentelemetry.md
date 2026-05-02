---
read_when:
    - Chcesz wysyłać użycie modelu OpenClaw, przepływ wiadomości lub metryki sesji do kolektora OpenTelemetry
    - Podłączasz ślady, metryki lub logi do Grafana, Datadog, Honeycomb, New Relic, Tempo albo innego backendu OTLP
    - Potrzebujesz dokładnych nazw metryk, nazw spanów lub struktur atrybutów, aby tworzyć pulpity nawigacyjne lub alerty
summary: Eksportuj diagnostykę OpenClaw do dowolnego kolektora OpenTelemetry za pomocą Plugin diagnostics-otel (OTLP/HTTP)
title: Eksport OpenTelemetry
x-i18n:
    generated_at: "2026-05-02T09:51:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: a0aed4ca8818d3bd1f5461fb58fbbe5c0d3ed1262cac506c60ee326800d98e1b
    source_path: gateway/opentelemetry.md
    workflow: 16
---

OpenClaw eksportuje diagnostykę przez oficjalny plugin `diagnostics-otel`, używając **OTLP/HTTP (protobuf)**. Każdy kolektor lub backend akceptujący OTLP/HTTP działa bez zmian w kodzie. Informacje o lokalnych logach plikowych i sposobie ich odczytu znajdziesz w sekcji [Logowanie](/pl/logging).

## Jak to działa razem

- **Zdarzenia diagnostyczne** to ustrukturyzowane rekordy wewnątrz procesu, emitowane przez Gateway i dołączone pluginy dla uruchomień modelu, przepływu wiadomości, sesji, kolejek i exec.
- **Plugin `diagnostics-otel`** subskrybuje te zdarzenia i eksportuje je jako **metryki**, **ślady** i **logi** OpenTelemetry przez OTLP/HTTP.
- **Wywołania dostawcy** otrzymują nagłówek W3C `traceparent` z zaufanego kontekstu zakresu wywołania modelu OpenClaw, gdy transport dostawcy akceptuje niestandardowe nagłówki. Kontekst śladu emitowany przez plugin nie jest propagowany.
- Eksportery są podłączane tylko wtedy, gdy włączone są zarówno powierzchnia diagnostyczna, jak i plugin, więc domyślnie koszt wewnątrz procesu pozostaje bliski zeru.

## Szybki start

W przypadku instalacji pakietowych najpierw zainstaluj plugin:

```bash
openclaw plugins install @openclaw/diagnostics-otel
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
`protocol` obecnie obsługuje tylko `http/protobuf`. `grpc` jest ignorowane.
</Note>

## Eksportowane sygnały

| Sygnał      | Co do niego trafia                                                                                                                            |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| **Metryki** | Liczniki i histogramy użycia tokenów, kosztu, czasu trwania uruchomienia, przepływu wiadomości, pasów kolejek, stanu sesji, exec i presji pamięci.          |
| **Ślady**  | Zakresy użycia modelu, wywołań modelu, cyklu życia uprzęży, wykonywania narzędzi, exec, przetwarzania webhooków/wiadomości, składania kontekstu i pętli narzędzi. |
| **Logi**    | Ustrukturyzowane rekordy `logging.file` eksportowane przez OTLP, gdy włączone jest `diagnostics.otel.logs`.                                              |

Przełączaj `traces`, `metrics` i `logs` niezależnie. Wszystkie trzy są domyślnie włączone, gdy `diagnostics.otel.enabled` ma wartość true.

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
| `OTEL_EXPORTER_OTLP_ENDPOINT`                                                                                     | Nadpisuje `diagnostics.otel.endpoint`. Jeśli wartość już zawiera `/v1/traces`, `/v1/metrics` lub `/v1/logs`, jest używana bez zmian.                                                                                                          |
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` / `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` / `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | Nadpisania punktów końcowych specyficzne dla sygnału, używane, gdy pasujący klucz konfiguracji `diagnostics.otel.*Endpoint` nie jest ustawiony. Konfiguracja specyficzna dla sygnału ma pierwszeństwo przed zmienną środowiskową specyficzną dla sygnału, a ta ma pierwszeństwo przed współdzielonym punktem końcowym.                                     |
| `OTEL_SERVICE_NAME`                                                                                               | Nadpisuje `diagnostics.otel.serviceName`.                                                                                                                                                                                                   |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                                                                                     | Nadpisuje protokół przesyłania (obecnie honorowane jest tylko `http/protobuf`).                                                                                                                                                                        |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                                                                                   | Ustaw na `gen_ai_latest_experimental`, aby emitować najnowszy eksperymentalny atrybut zakresu GenAI (`gen_ai.provider.name`) zamiast starszego `gen_ai.system`. Metryki GenAI zawsze używają ograniczonych atrybutów semantycznych o niskiej kardynalności. |
| `OPENCLAW_OTEL_PRELOADED`                                                                                         | Ustaw na `1`, gdy inny preload lub proces hosta już zarejestrował globalny SDK OpenTelemetry. Plugin pomija wtedy własny cykl życia NodeSDK, ale nadal podłącza nasłuchiwacze diagnostyczne i honoruje `traces`/`metrics`/`logs`.                |

## Prywatność i przechwytywanie treści

Surowa treść modelu/narzędzia **nie** jest domyślnie eksportowana. Zakresy przenoszą ograniczone identyfikatory (kanał, dostawca, model, kategoria błędu, identyfikatory żądań tylko jako hasze) i nigdy nie zawierają tekstu promptu, tekstu odpowiedzi, danych wejściowych narzędzia, danych wyjściowych narzędzia ani kluczy sesji.

Wychodzące żądania modelu mogą zawierać nagłówek W3C `traceparent`. Ten nagłówek jest generowany tylko z należącego do OpenClaw kontekstu śladu diagnostycznego dla aktywnego wywołania modelu. Istniejące nagłówki `traceparent` dostarczone przez wywołującego są zastępowane, więc pluginy ani niestandardowe opcje dostawcy nie mogą podszywać się pod pochodzenie śladu między usługami.

Ustaw `diagnostics.otel.captureContent.*` na `true` tylko wtedy, gdy Twój kolektor i polityka retencji są zatwierdzone dla tekstu promptu, odpowiedzi, narzędzia lub promptu systemowego. Każdy podklucz wymaga niezależnego włączenia:

- `inputMessages` — treść promptu użytkownika.
- `outputMessages` — treść odpowiedzi modelu.
- `toolInputs` — ładunki argumentów narzędzia.
- `toolOutputs` — ładunki wyników narzędzia.
- `systemPrompt` — złożony prompt systemowy/deweloperski.

Gdy dowolny podklucz jest włączony, zakresy modelu i narzędzia otrzymują ograniczone, zredagowane atrybuty `openclaw.content.*` tylko dla tej klasy.

## Próbkowanie i opróżnianie

- **Ślady:** `diagnostics.otel.sampleRate` (tylko zakres główny, `0.0` odrzuca wszystkie, `1.0` zachowuje wszystkie).
- **Metryki:** `diagnostics.otel.flushIntervalMs` (minimum `1000`).
- **Logi:** Logi OTLP respektują `logging.level` (poziom logu plikowego). Używają ścieżki redakcji diagnostycznych rekordów logów, a nie formatowania konsoli. Instalacje o dużym wolumenie powinny preferować próbkowanie/filtrowanie kolektora OTLP zamiast lokalnego próbkowania.
- **Korelacja logów plikowych:** Logi plikowe JSONL zawierają pola najwyższego poziomu `traceId`, `spanId`, `parentSpanId` i `traceFlags`, gdy wywołanie logowania przenosi prawidłowy kontekst śladu diagnostycznego, co pozwala procesorom logów łączyć lokalne linie logów z eksportowanymi zakresami.
- **Korelacja żądań:** Żądania HTTP Gateway i ramki WebSocket tworzą wewnętrzny zakres śladu żądania. Logi i zdarzenia diagnostyczne w tym zakresie domyślnie dziedziczą ślad żądania, a zakresy uruchomienia agenta i wywołania modelu są tworzone jako dzieci, dzięki czemu nagłówki `traceparent` dostawcy pozostają w tym samym śladzie.

## Eksportowane metryki

### Użycie modelu

- `openclaw.tokens` (counter, attrs: `openclaw.token`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.agent`)
- `openclaw.cost.usd` (counter, attrs: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.run.duration_ms` (histogram, attrs: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.context.tokens` (histogram, attrs: `openclaw.context`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `gen_ai.client.token.usage` (histogram, metryka konwencji semantycznych GenAI, attrs: `gen_ai.token.type` = `input`/`output`, `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`)
- `gen_ai.client.operation.duration` (histogram, sekundy, metryka konwencji semantycznych GenAI, attrs: `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`, opcjonalnie `error.type`)
- `openclaw.model_call.duration_ms` (histogram, attrs: `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`, plus `openclaw.errorCategory` i `openclaw.failureKind` przy sklasyfikowanych błędach)
- `openclaw.model_call.request_bytes` (histogram, rozmiar w bajtach UTF-8 końcowego ładunku żądania modelu; bez surowej treści ładunku)
- `openclaw.model_call.response_bytes` (histogram, rozmiar w bajtach UTF-8 zdarzeń strumieniowanej odpowiedzi modelu; bez surowej treści odpowiedzi)
- `openclaw.model_call.time_to_first_byte_ms` (histogram, czas, który upłynął przed pierwszym zdarzeniem strumieniowanej odpowiedzi)

### Przepływ wiadomości

- `openclaw.webhook.received` (counter, attrs: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.webhook.error` (counter, attrs: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.webhook.duration_ms` (histogram, attrs: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.message.queued` (counter, attrs: `openclaw.channel`, `openclaw.source`)
- `openclaw.message.processed` (counter, attrs: `openclaw.channel`, `openclaw.outcome`)
- `openclaw.message.duration_ms` (histogram, attrs: `openclaw.channel`, `openclaw.outcome`)
- `openclaw.message.delivery.started` (counter, attrs: `openclaw.channel`, `openclaw.delivery.kind`)
- `openclaw.message.delivery.duration_ms` (histogram, attrs: `openclaw.channel`, `openclaw.delivery.kind`, `openclaw.outcome`, `openclaw.errorCategory`)

### Kolejki i sesje

- `openclaw.queue.lane.enqueue` (counter, attrs: `openclaw.lane`)
- `openclaw.queue.lane.dequeue` (counter, attrs: `openclaw.lane`)
- `openclaw.queue.depth` (histogram, attrs: `openclaw.lane` lub `openclaw.channel=heartbeat`)
- `openclaw.queue.wait_ms` (histogram, attrs: `openclaw.lane`)
- `openclaw.session.state` (counter, attrs: `openclaw.state`, `openclaw.reason`)
- `openclaw.session.stuck` (counter, attrs: `openclaw.state`; emitowane tylko dla księgowania nieświeżych sesji bez aktywnej pracy)
- `openclaw.session.stuck_age_ms` (histogram, attrs: `openclaw.state`; emitowane tylko dla księgowania nieświeżych sesji bez aktywnej pracy)
- `openclaw.run.attempt` (counter, attrs: `openclaw.attempt`)

### Telemetria żywotności sesji

`diagnostics.stuckSessionWarnMs` to próg wieku bez postępu dla diagnostyki żywotności sesji. Sesja `processing` nie zbliża się do tego progu, gdy OpenClaw obserwuje postęp odpowiedzi, narzędzia, statusu, bloku lub środowiska uruchomieniowego ACP. Keepalive'y pisania nie są liczone jako postęp, więc cichy model lub uprząż nadal mogą zostać wykryte.

OpenClaw klasyfikuje sesje według pracy, którą nadal może obserwować:

- `session.long_running`: aktywna praca osadzona, wywołania modelu lub wywołania narzędzi
  nadal postępują.
- `session.stalled`: aktywna praca istnieje, ale aktywne uruchomienie nie zgłosiło
  ostatnio postępu.
- `session.stuck`: nieaktualna księgowość sesji bez aktywnej pracy. To jedyna
  klasyfikacja żywotności, która zwalnia dotknięty pas sesji.

Tylko `session.stuck` emituje licznik `openclaw.session.stuck`, histogram
`openclaw.session.stuck_age_ms` oraz span `openclaw.session.stuck`. Powtarzające się diagnostyki `session.stuck` wycofują się, gdy sesja pozostaje
niezmieniona, więc pulpity powinny alarmować o utrzymujących się wzrostach, a nie o każdym
takcie Heartbeat. Pokrętło konfiguracji i wartości domyślne opisuje
[Dokumentacja konfiguracji](/pl/gateway/configuration-reference#diagnostics).

### Cykl życia harnessu

- `openclaw.harness.duration_ms` (histogram, attrs: `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.harness.phase` przy błędach)

### Exec

- `openclaw.exec.duration_ms` (histogram, attrs: `openclaw.exec.target`, `openclaw.exec.mode`, `openclaw.outcome`, `openclaw.failureKind`)

### Wewnętrzne mechanizmy diagnostyki (pamięć i pętla narzędzi)

- `openclaw.memory.heap_used_bytes` (histogram, attrs: `openclaw.memory.kind`)
- `openclaw.memory.rss_bytes` (histogram)
- `openclaw.memory.pressure` (licznik, attrs: `openclaw.memory.level`)
- `openclaw.tool.loop.iterations` (licznik, attrs: `openclaw.toolName`, `openclaw.outcome`)
- `openclaw.tool.loop.duration_ms` (histogram, attrs: `openclaw.toolName`, `openclaw.outcome`)

## Eksportowane spany

- `openclaw.model.usage`
  - `openclaw.channel`, `openclaw.provider`, `openclaw.model`
  - `openclaw.tokens.*` (input/output/cache_read/cache_write/total)
  - domyślnie `gen_ai.system`, albo `gen_ai.provider.name`, gdy włączone są najnowsze konwencje semantyczne GenAI
  - `gen_ai.request.model`, `gen_ai.operation.name`, `gen_ai.usage.*`
- `openclaw.run`
  - `openclaw.outcome`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.errorCategory`
- `openclaw.model.call`
  - domyślnie `gen_ai.system`, albo `gen_ai.provider.name`, gdy włączone są najnowsze konwencje semantyczne GenAI
  - `gen_ai.request.model`, `gen_ai.operation.name`, `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`
  - `openclaw.errorCategory` i opcjonalnie `openclaw.failureKind` przy błędach
  - `openclaw.model_call.request_bytes`, `openclaw.model_call.response_bytes`, `openclaw.model_call.time_to_first_byte_ms`
  - `openclaw.provider.request_id_hash` (ograniczony hash oparty na SHA identyfikatora żądania u nadrzędnego dostawcy; surowe identyfikatory nie są eksportowane)
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
  - `openclaw.prompt.size`, `openclaw.history.size`, `openclaw.context.tokens`, `openclaw.errorCategory` (bez promptu, historii, odpowiedzi ani treści klucza sesji)
- `openclaw.tool.loop`
  - `openclaw.toolName`, `openclaw.outcome`, `openclaw.iterations`, `openclaw.errorCategory` (bez komunikatów pętli, parametrów ani danych wyjściowych narzędzia)
- `openclaw.memory.pressure`
  - `openclaw.memory.level`, `openclaw.memory.heap_used_bytes`, `openclaw.memory.rss_bytes`

Gdy przechwytywanie treści jest jawnie włączone, spany modelu i narzędzi mogą także
zawierać ograniczone, zredagowane atrybuty `openclaw.content.*` dla konkretnych
klas treści, które zostały włączone.

## Katalog zdarzeń diagnostycznych

Poniższe zdarzenia obsługują powyższe metryki i spany. Pluginy mogą również subskrybować
je bezpośrednio bez eksportu OTLP.

**Użycie modelu**

- `model.usage` — tokeny, koszt, czas trwania, kontekst, dostawca/model/kanał,
  identyfikatory sesji. `usage` to rozliczanie dostawcy/tury dla kosztów i telemetrii;
  `context.used` to bieżąca migawka promptu/kontekstu i może być niższa niż
  `usage.total` dostawcy, gdy używane są dane wejściowe z pamięci podręcznej lub wywołania pętli narzędzi.

**Przepływ wiadomości**

- `webhook.received` / `webhook.processed` / `webhook.error`
- `message.queued` / `message.processed`
- `message.delivery.started` / `message.delivery.completed` / `message.delivery.error`

**Kolejka i sesja**

- `queue.lane.enqueue` / `queue.lane.dequeue`
- `session.state` / `session.long_running` / `session.stalled` / `session.stuck`
- `run.attempt` / `run.progress`
- `diagnostic.heartbeat` (zbiorcze liczniki: webhooki/kolejka/sesja)

**Cykl życia harnessu**

- `harness.run.started` / `harness.run.completed` / `harness.run.error` —
  cykl życia per uruchomienie dla harnessu agenta. Obejmuje `harnessId`, opcjonalny
  `pluginId`, dostawcę/model/kanał oraz identyfikator uruchomienia. Ukończenie dodaje
  `durationMs`, `outcome`, opcjonalne `resultClassification`, `yieldDetected`
  oraz liczniki `itemLifecycle`. Błędy dodają `phase`
  (`prepare`/`start`/`send`/`resolve`/`cleanup`), `errorCategory` oraz
  opcjonalne `cleanupFailed`.

**Exec**

- `exec.process.completed` — końcowy wynik, czas trwania, cel, tryb, kod wyjścia
  oraz rodzaj błędu. Tekst polecenia i katalogi robocze nie są
  uwzględniane.

## Bez eksportera

Możesz zachować dostępność zdarzeń diagnostycznych dla Pluginów lub niestandardowych odbiorników bez
uruchamiania `diagnostics-otel`:

```json5
{
  diagnostics: { enabled: true },
}
```

Aby uzyskać ukierunkowane dane debugowania bez podnoszenia `logging.level`, użyj flag diagnostycznych. Flagi nie uwzględniają wielkości liter i obsługują symbole wieloznaczne (np. `telegram.*` lub
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

Dane wyjściowe flag trafiają do standardowego pliku dziennika (`logging.file`) i nadal są
redagowane przez `logging.redactSensitive`. Pełny przewodnik:
[Flagi diagnostyczne](/pl/diagnostics/flags).

## Wyłączanie

```json5
{
  diagnostics: { otel: { enabled: false } },
}
```

Możesz także pominąć `diagnostics-otel` w `plugins.allow` albo uruchomić
`openclaw plugins disable diagnostics-otel`.

## Powiązane

- [Rejestrowanie](/pl/logging) — dzienniki plikowe, wyjście konsoli, śledzenie przez CLI oraz karta dzienników Control UI
- [Wewnętrzne mechanizmy rejestrowania Gateway](/pl/gateway/logging) — style dzienników WS, prefiksy podsystemów i przechwytywanie konsoli
- [Flagi diagnostyczne](/pl/diagnostics/flags) — ukierunkowane flagi dzienników debugowania
- [Eksport diagnostyki](/pl/gateway/diagnostics) — narzędzie pakietu wsparcia dla operatora (oddzielne od eksportu OTEL)
- [Dokumentacja konfiguracji](/pl/gateway/configuration-reference#diagnostics) — pełna dokumentacja pól `diagnostics.*`

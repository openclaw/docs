---
read_when:
    - Chcesz wysyłać metryki OpenClaw dotyczące użycia modeli, przepływu wiadomości lub sesji do kolektora OpenTelemetry
    - Podłączasz ślady, metryki lub logi do Grafana, Datadog, Honeycomb, New Relic, Tempo albo innego zaplecza OTLP
    - Potrzebujesz dokładnych nazw metryk, nazw spanów lub struktur atrybutów, aby tworzyć pulpity nawigacyjne lub alerty
summary: Eksportuj dane diagnostyczne OpenClaw do dowolnego kolektora OpenTelemetry za pośrednictwem Plugin diagnostics-otel (OTLP/HTTP)
title: Eksport OpenTelemetry
x-i18n:
    generated_at: "2026-05-06T10:05:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: b09453a4a1592d2698de6340e5f006ef16edfd8e86132285c48865d468d20ab6
    source_path: gateway/opentelemetry.md
    workflow: 16
---

OpenClaw eksportuje diagnostykę przez oficjalny Plugin `diagnostics-otel`
przy użyciu **OTLP/HTTP (protobuf)**. Każdy kolektor lub backend akceptujący OTLP/HTTP
działa bez zmian w kodzie. Informacje o lokalnych logach plikowych i sposobie ich odczytywania znajdziesz w
[Logowanie](/pl/logging).

## Jak to wszystko się łączy

- **Zdarzenia diagnostyczne** to ustrukturyzowane rekordy wewnątrz procesu emitowane przez
  Gateway i dołączone pluginy dla uruchomień modeli, przepływu wiadomości, sesji, kolejek
  i exec.
- **Plugin `diagnostics-otel`** subskrybuje te zdarzenia i eksportuje je jako
  **metryki**, **ślady** i **logi** OpenTelemetry przez OTLP/HTTP.
- **Wywołania dostawcy** otrzymują nagłówek W3C `traceparent` z należącego do OpenClaw
  zaufanego kontekstu zakresu wywołania modelu, gdy transport dostawcy akceptuje niestandardowe
  nagłówki. Kontekst śledzenia emitowany przez Plugin nie jest propagowany.
- Eksportery są podłączane tylko wtedy, gdy włączone są zarówno powierzchnia diagnostyczna, jak i Plugin,
  więc domyślnie koszt wewnątrz procesu pozostaje bliski zeru.

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

Możesz też włączyć Plugin z poziomu CLI:

```bash
openclaw plugins enable diagnostics-otel
```

<Note>
`protocol` obecnie obsługuje tylko `http/protobuf`. `grpc` jest ignorowany.
</Note>

## Eksportowane sygnały

| Sygnał      | Co trafia do środka                                                                                                                                         |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Metryki** | Liczniki i histogramy użycia tokenów, kosztów, czasu trwania uruchomień, przepływu wiadomości, zdarzeń Talk, pasów kolejek, stanu/odzyskiwania sesji, exec i presji pamięci. |
| **Ślady**  | Zakresy dla użycia modeli, wywołań modeli, cyklu życia harness, wykonywania narzędzi, exec, przetwarzania Webhook/wiadomości, składania kontekstu i pętli narzędzi.              |
| **Logi**    | Ustrukturyzowane rekordy `logging.file` eksportowane przez OTLP, gdy włączone jest `diagnostics.otel.logs`.                                                           |

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
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` / `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` / `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | Nadpisania punktów końcowych specyficzne dla sygnału, używane, gdy pasujący klucz konfiguracji `diagnostics.otel.*Endpoint` nie jest ustawiony. Konfiguracja specyficzna dla sygnału ma pierwszeństwo przed zmienną środowiskową specyficzną dla sygnału, która ma pierwszeństwo przed wspólnym punktem końcowym.                                     |
| `OTEL_SERVICE_NAME`                                                                                               | Nadpisuje `diagnostics.otel.serviceName`.                                                                                                                                                                                                   |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                                                                                     | Nadpisuje protokół transmisji (dziś honorowane jest tylko `http/protobuf`).                                                                                                                                                                        |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                                                                                   | Ustaw na `gen_ai_latest_experimental`, aby emitować najnowszy eksperymentalny atrybut zakresu GenAI (`gen_ai.provider.name`) zamiast starszego `gen_ai.system`. Metryki GenAI zawsze używają ograniczonych, niskokardynalnych atrybutów semantycznych niezależnie od tego. |
| `OPENCLAW_OTEL_PRELOADED`                                                                                         | Ustaw na `1`, gdy inny preload lub proces hosta już zarejestrował globalny SDK OpenTelemetry. Plugin pomija wtedy własny cykl życia NodeSDK, ale nadal podłącza listenery diagnostyczne i honoruje `traces`/`metrics`/`logs`.                |

## Prywatność i przechwytywanie treści

Surowa treść modelu/narzędzia **nie** jest domyślnie eksportowana. Zakresy przenoszą ograniczone
identyfikatory (kanał, dostawca, model, kategoria błędu, identyfikatory żądań tylko jako hash)
i nigdy nie zawierają tekstu promptu, tekstu odpowiedzi, danych wejściowych narzędzia, danych wyjściowych narzędzia ani
kluczy sesji.
Metryki Talk eksportują tylko ograniczone metadane zdarzeń, takie jak tryb, transport,
dostawca i typ zdarzenia. Nie zawierają transkryptów, ładunków audio,
identyfikatorów sesji, identyfikatorów tur, identyfikatorów wywołań, identyfikatorów pokojów ani tokenów przekazania.

Wychodzące żądania modelu mogą zawierać nagłówek W3C `traceparent`. Ten nagłówek jest
generowany wyłącznie z należącego do OpenClaw diagnostycznego kontekstu śledzenia dla aktywnego
wywołania modelu. Istniejące nagłówki `traceparent` dostarczone przez wywołującego są zastępowane, więc pluginy lub
niestandardowe opcje dostawcy nie mogą fałszować pochodzenia śladu między usługami.

Ustaw `diagnostics.otel.captureContent.*` na `true` tylko wtedy, gdy Twój kolektor i
polityka przechowywania są zatwierdzone dla tekstu promptu, odpowiedzi, narzędzia lub promptu systemowego.
Każdy podklucz jest włączany niezależnie:

- `inputMessages` - treść promptu użytkownika.
- `outputMessages` - treść odpowiedzi modelu.
- `toolInputs` - ładunki argumentów narzędzia.
- `toolOutputs` - ładunki wyników narzędzia.
- `systemPrompt` - złożony prompt systemowy/developerski.

Gdy dowolny podklucz jest włączony, zakresy modelu i narzędzia otrzymują ograniczone, zredagowane
atrybuty `openclaw.content.*` tylko dla tej klasy.

## Próbkowanie i opróżnianie

- **Ślady:** `diagnostics.otel.sampleRate` (tylko zakres główny, `0.0` odrzuca wszystkie,
  `1.0` zachowuje wszystkie).
- **Metryki:** `diagnostics.otel.flushIntervalMs` (minimum `1000`).
- **Logi:** logi OTLP respektują `logging.level` (poziom logu plikowego). Używają
  ścieżki redakcji diagnostycznych rekordów logów, a nie formatowania konsoli. Instalacje o dużym wolumenie
  powinny preferować próbkowanie/filtrowanie w kolektorze OTLP zamiast lokalnego próbkowania.
- **Korelacja logów plikowych:** logi plikowe JSONL zawierają na najwyższym poziomie `traceId`,
  `spanId`, `parentSpanId` i `traceFlags`, gdy wywołanie logowania przenosi prawidłowy
  diagnostyczny kontekst śledzenia, co pozwala procesorom logów łączyć lokalne wiersze logów z
  eksportowanymi zakresami.
- **Korelacja żądań:** żądania HTTP Gateway i ramki WebSocket tworzą
  wewnętrzny zakres śladu żądania. Logi i zdarzenia diagnostyczne wewnątrz tego zakresu
  domyślnie dziedziczą ślad żądania, a zakresy uruchomień agenta i wywołań modelu są
  tworzone jako dzieci, dzięki czemu nagłówki dostawcy `traceparent` pozostają w tym samym śladzie.

## Eksportowane metryki

### Użycie modelu

- `openclaw.tokens` (licznik, atrybuty: `openclaw.token`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.agent`)
- `openclaw.cost.usd` (licznik, atrybuty: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.run.duration_ms` (histogram, atrybuty: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.context.tokens` (histogram, atrybuty: `openclaw.context`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `gen_ai.client.token.usage` (histogram, metryka konwencji semantycznych GenAI, atrybuty: `gen_ai.token.type` = `input`/`output`, `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`)
- `gen_ai.client.operation.duration` (histogram, sekundy, metryka konwencji semantycznych GenAI, atrybuty: `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`, opcjonalnie `error.type`)
- `openclaw.model_call.duration_ms` (histogram, atrybuty: `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport` oraz `openclaw.errorCategory` i `openclaw.failureKind` przy sklasyfikowanych błędach)
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

### Talk

- `openclaw.talk.event` (licznik, atrybuty: `openclaw.talk.event_type`, `openclaw.talk.mode`, `openclaw.talk.transport`, `openclaw.talk.brain`, `openclaw.talk.provider`)
- `openclaw.talk.event.duration_ms` (histogram, atrybuty: takie same jak `openclaw.talk.event`; emitowany, gdy zdarzenie Talk zgłasza czas trwania)
- `openclaw.talk.audio.bytes` (histogram, atrybuty: takie same jak `openclaw.talk.event`; emitowany dla zdarzeń ramek audio Talk, które zgłaszają długość w bajtach)

### Kolejki i sesje

- `openclaw.queue.lane.enqueue` (licznik, atrybuty: `openclaw.lane`)
- `openclaw.queue.lane.dequeue` (licznik, atrybuty: `openclaw.lane`)
- `openclaw.queue.depth` (histogram, atrybuty: `openclaw.lane` lub `openclaw.channel=heartbeat`)
- `openclaw.queue.wait_ms` (histogram, atrybuty: `openclaw.lane`)
- `openclaw.session.state` (licznik, atrybuty: `openclaw.state`, `openclaw.reason`)
- `openclaw.session.stuck` (licznik, atrybuty: `openclaw.state`; emitowane tylko dla ewidencji przestarzałej sesji bez aktywnej pracy)
- `openclaw.session.stuck_age_ms` (histogram, atrybuty: `openclaw.state`; emitowane tylko dla ewidencji przestarzałej sesji bez aktywnej pracy)
- `openclaw.session.recovery.requested` (licznik, atrybuty: `openclaw.state`, `openclaw.action`, `openclaw.active_work_kind`, `openclaw.reason`)
- `openclaw.session.recovery.completed` (licznik, atrybuty: `openclaw.state`, `openclaw.action`, `openclaw.status`, `openclaw.active_work_kind`, `openclaw.reason`)
- `openclaw.session.recovery.age_ms` (histogram, atrybuty: takie same jak w pasującym liczniku odzyskiwania)
- `openclaw.run.attempt` (licznik, atrybuty: `openclaw.attempt`)

### Telemetria żywotności sesji

`diagnostics.stuckSessionWarnMs` to próg wieku bez postępu dla diagnostyki
żywotności sesji. Sesja `processing` nie zbliża się wiekiem do tego progu,
gdy OpenClaw obserwuje postęp odpowiedzi, narzędzia, statusu, bloku lub środowiska wykonawczego ACP.
Sygnały podtrzymujące pisanie nie są liczone jako postęp, więc cichy model lub uprząż
nadal mogą zostać wykryte.

OpenClaw klasyfikuje sesje według pracy, którą nadal może obserwować:

- `session.long_running`: aktywna praca osadzona, wywołania modelu lub wywołania narzędzi
  nadal robią postęp.
- `session.stalled`: aktywna praca istnieje, ale aktywne uruchomienie nie zgłosiło
  ostatnio postępu. Zablokowane uruchomienia osadzone najpierw pozostają tylko obserwowane, a następnie
  przechodzą w przerwanie z opróżnianiem po `diagnostics.stuckSessionAbortMs` bez postępu, aby zakolejkowane
  tury za pasem mogły zostać wznowione. Gdy nie ustawiono, próg przerwania domyślnie przyjmuje
  bezpieczniejsze rozszerzone okno wynoszące co najmniej 10 minut i 5x
  `diagnostics.stuckSessionWarnMs`.
- `session.stuck`: ewidencja przestarzałej sesji bez aktywnej pracy. To natychmiast
  zwalnia dotknięty pas sesji.

Odzyskiwanie emituje ustrukturyzowane zdarzenia `session.recovery.requested` i
`session.recovery.completed`. Diagnostyczny stan sesji jest oznaczany jako bezczynny
dopiero po mutującym wyniku odzyskiwania (`aborted` lub `released`) i tylko jeśli
ta sama generacja przetwarzania jest nadal bieżąca.

Tylko `session.stuck` emituje licznik `openclaw.session.stuck`, histogram
`openclaw.session.stuck_age_ms` oraz span `openclaw.session.stuck`.
Powtarzające się diagnostyki `session.stuck` wycofują się, dopóki sesja pozostaje
niezmieniona, więc pulpity powinny alarmować przy utrzymujących się wzrostach, a nie przy każdym
takcie Heartbeat. Pokrętło konfiguracji i wartości domyślne znajdziesz w
[Dokumentacji konfiguracji](/pl/gateway/configuration-reference#diagnostics).

### Cykl życia uprzęży

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
  - domyślnie `gen_ai.system`, albo `gen_ai.provider.name`, gdy włączono najnowsze konwencje semantyczne GenAI
  - `gen_ai.request.model`, `gen_ai.operation.name`, `gen_ai.usage.*`
- `openclaw.run`
  - `openclaw.outcome`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.errorCategory`
- `openclaw.model.call`
  - domyślnie `gen_ai.system`, albo `gen_ai.provider.name`, gdy włączono najnowsze konwencje semantyczne GenAI
  - `gen_ai.request.model`, `gen_ai.operation.name`, `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`
  - `openclaw.errorCategory` i opcjonalne `openclaw.failureKind` przy błędach
  - `openclaw.model_call.request_bytes`, `openclaw.model_call.response_bytes`, `openclaw.model_call.time_to_first_byte_ms`
  - `openclaw.provider.request_id_hash` (ograniczony hash oparty na SHA identyfikatora żądania dostawcy upstream; surowe identyfikatory nie są eksportowane)
- `openclaw.harness.run`
  - `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.provider`, `openclaw.model`, `openclaw.channel`
  - Przy ukończeniu: `openclaw.harness.result_classification`, `openclaw.harness.yield_detected`, `openclaw.harness.items.started`, `openclaw.harness.items.completed`, `openclaw.harness.items.active`
  - Przy błędzie: `openclaw.harness.phase`, `openclaw.errorCategory`, opcjonalne `openclaw.harness.cleanup_failed`
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

Gdy przechwytywanie treści jest jawnie włączone, spany modelu i narzędzi mogą także
zawierać ograniczone, zredagowane atrybuty `openclaw.content.*` dla konkretnych
klas treści, które włączono.

## Katalog zdarzeń diagnostycznych

Poniższe zdarzenia wspierają powyższe metryki i spany. Pluginy mogą również subskrybować
je bezpośrednio bez eksportu OTLP.

**Użycie modelu**

- `model.usage` - tokeny, koszt, czas trwania, kontekst, dostawca/model/kanał,
  identyfikatory sesji. `usage` to rozliczanie dostawcy/tury na potrzeby kosztów i telemetrii;
  `context.used` to bieżący zrzut promptu/kontekstu i może być niższy niż
  `usage.total` dostawcy, gdy używane są buforowane dane wejściowe lub wywołania pętli narzędzi.

**Przepływ komunikatów**

- `webhook.received` / `webhook.processed` / `webhook.error`
- `message.queued` / `message.processed`
- `message.delivery.started` / `message.delivery.completed` / `message.delivery.error`

**Kolejka i sesja**

- `queue.lane.enqueue` / `queue.lane.dequeue`
- `session.state` / `session.long_running` / `session.stalled` / `session.stuck`
- `run.attempt` / `run.progress`
- `diagnostic.heartbeat` (liczniki zbiorcze: webhooki/kolejka/sesja)

**Cykl życia uprzęży**

- `harness.run.started` / `harness.run.completed` / `harness.run.error` -
  cykl życia na uruchomienie dla uprzęży agenta. Obejmuje `harnessId`, opcjonalne
  `pluginId`, dostawcę/model/kanał oraz identyfikator uruchomienia. Ukończenie dodaje
  `durationMs`, `outcome`, opcjonalne `resultClassification`, `yieldDetected`
  oraz liczby `itemLifecycle`. Błędy dodają `phase`
  (`prepare`/`start`/`send`/`resolve`/`cleanup`), `errorCategory` oraz
  opcjonalne `cleanupFailed`.

**Exec**

- `exec.process.completed` - końcowy wynik, czas trwania, cel, tryb, kod wyjścia
  oraz rodzaj awarii. Tekst polecenia i katalogi robocze nie są
  uwzględniane.

## Bez eksportera

Możesz pozostawić zdarzenia diagnostyczne dostępne dla pluginów lub niestandardowych odbiorników bez
uruchamiania `diagnostics-otel`:

```json5
{
  diagnostics: { enabled: true },
}
```

Aby uzyskać ukierunkowane wyjście debugowania bez podnoszenia `logging.level`, użyj flag diagnostyki.
Flagi nie rozróżniają wielkości liter i obsługują symbole wieloznaczne (np. `telegram.*` lub
`*`):

```json5
{
  diagnostics: { flags: ["telegram.http"] },
}
```

Lub jako jednorazowe nadpisanie env:

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

- [Rejestrowanie](/pl/logging) - dzienniki plikowe, wyjście konsoli, śledzenie CLI oraz karta dzienników interfejsu Control UI
- [Wewnętrzne mechanizmy rejestrowania Gateway](/pl/gateway/logging) - style dzienników WS, prefiksy podsystemów i przechwytywanie konsoli
- [Flagi diagnostyki](/pl/diagnostics/flags) - ukierunkowane flagi dzienników debugowania
- [Eksport diagnostyki](/pl/gateway/diagnostics) - narzędzie pakietu wsparcia operatora (oddzielne od eksportu OTEL)
- [Dokumentacja konfiguracji](/pl/gateway/configuration-reference#diagnostics) - pełna dokumentacja pól `diagnostics.*`

---
read_when:
    - Chcesz wysyłać użycie modeli OpenClaw, przepływ wiadomości lub metryki sesji do kolektora OpenTelemetry
    - Podłączasz ślady, metryki lub logi do Grafana, Datadog, Honeycomb, New Relic, Tempo albo innego backendu OTLP
    - Potrzebujesz dokładnych nazw metryk, nazw spanów lub kształtów atrybutów, aby budować panele kontrolne lub alerty
summary: Eksportuj diagnostykę OpenClaw do kolektorów OpenTelemetry lub stdout JSONL za pomocą pluginu diagnostics-otel
title: Eksport OpenTelemetry
x-i18n:
    generated_at: "2026-06-27T17:35:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 551de723eec13f73ee7a8614a9c0faa64dae52c5f5749fccfca8a347b3307355
    source_path: gateway/opentelemetry.md
    workflow: 16
---

OpenClaw eksportuje diagnostykę przez oficjalny Plugin `diagnostics-otel`
z użyciem **OTLP/HTTP (protobuf)**. Logi mogą być także zapisywane jako JSONL na stdout dla
potoków logów kontenerów i sandboxów. Każdy kolektor lub backend akceptujący
OTLP/HTTP działa bez zmian w kodzie. Informacje o lokalnych plikach logów i sposobie ich odczytu
znajdziesz w [Logowaniu](/pl/logging).

## Jak to działa razem

- **Zdarzenia diagnostyczne** to ustrukturyzowane rekordy w procesie, emitowane przez
  Gateway oraz dołączone pluginy dla uruchomień modeli, przepływu wiadomości, sesji, kolejek,
  i exec.
- **Plugin `diagnostics-otel`** subskrybuje te zdarzenia i eksportuje je jako
  OpenTelemetry **metryki**, **ślady** i **logi** przez OTLP/HTTP. Może
  także duplikować diagnostyczne rekordy logów do JSONL na stdout.
- **Wywołania dostawców** otrzymują nagłówek W3C `traceparent` z należącego do OpenClaw
  kontekstu zaufanego zakresu wywołania modelu, gdy transport dostawcy akceptuje niestandardowe
  nagłówki. Kontekst śledzenia emitowany przez plugin nie jest propagowany.
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

Możesz też włączyć plugin z CLI:

```bash
openclaw plugins enable diagnostics-otel
```

<Note>
`protocol` obecnie obsługuje tylko `http/protobuf`. `grpc` jest ignorowane.
</Note>

## Eksportowane sygnały

| Sygnał      | Co do niego trafia                                                                                                                                                                                                    |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Metryki** | Liczniki i histogramy użycia tokenów, kosztu, czasu trwania uruchomienia, przełączenia awaryjnego, użycia Skills, przepływu wiadomości, zdarzeń Talk, torów kolejek, stanu/odzyskiwania sesji, wykonywania narzędzi, zbyt dużych ładunków, exec i presji pamięci. |
| **Ślady**  | Zakresy użycia modeli, wywołań modeli, cyklu życia harnessa, użycia Skills, wykonywania narzędzi, exec, przetwarzania webhooków/wiadomości, składania kontekstu i pętli narzędzi.                                                            |
| **Logi**    | Ustrukturyzowane rekordy `logging.file` eksportowane przez OTLP albo JSONL na stdout, gdy `diagnostics.otel.logs` jest włączone; treści logów są wstrzymywane, chyba że przechwytywanie treści zostanie jawnie włączone.                                |

Przełączaj `traces`, `metrics` i `logs` niezależnie. Ślady i metryki
są domyślnie włączone, gdy `diagnostics.otel.enabled` ma wartość true. Logi są domyślnie wyłączone i
są eksportowane tylko wtedy, gdy `diagnostics.otel.logs` ma jawnie wartość `true`. Eksport logów
domyślnie używa OTLP; ustaw `diagnostics.otel.logsExporter` na `stdout`, aby uzyskać JSONL na
stdout, albo `both`, aby wysyłać każdy diagnostyczny rekord logu do OTLP i stdout.

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
      logsExporter: "otlp", // otlp | stdout | both
      sampleRate: 0.2, // root-span sampler, 0.0..1.0
      flushIntervalMs: 60000, // metric export interval (min 1000ms)
      captureContent: {
        enabled: false,
        inputMessages: false,
        outputMessages: false,
        toolInputs: false,
        toolOutputs: false,
        systemPrompt: false,
        toolDefinitions: false,
      },
    },
  },
}
```

### Zmienne środowiskowe

| Zmienna                                                                                                          | Cel                                                                                                                                                                                                                                                                                                                                        |
| ----------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OTEL_EXPORTER_OTLP_ENDPOINT`                                                                                     | Nadpisuje `diagnostics.otel.endpoint`. Jeśli wartość zawiera już `/v1/traces`, `/v1/metrics` albo `/v1/logs`, jest używana bez zmian.                                                                                                                                                                                                              |
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` / `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` / `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | Nadpisania punktów końcowych właściwe dla sygnałów, używane, gdy odpowiadający klucz konfiguracji `diagnostics.otel.*Endpoint` nie jest ustawiony. Konfiguracja właściwa dla sygnału ma pierwszeństwo przed env właściwym dla sygnału, a ten ma pierwszeństwo przed wspólnym punktem końcowym.                                                                                                                                         |
| `OTEL_SERVICE_NAME`                                                                                               | Nadpisuje `diagnostics.otel.serviceName`.                                                                                                                                                                                                                                                                                                       |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                                                                                     | Nadpisuje protokół transmisji (obecnie respektowane jest tylko `http/protobuf`).                                                                                                                                                                                                                                                                            |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                                                                                   | Ustaw na `gen_ai_latest_experimental`, aby emitować najnowszy eksperymentalny kształt zakresu inferencji GenAI, w tym nazwy zakresów `{gen_ai.operation.name} {gen_ai.request.model}`, rodzaj zakresu `CLIENT` oraz `gen_ai.provider.name` zamiast starszego `gen_ai.system`. Metryki GenAI zawsze używają ograniczonych atrybutów semantycznych o niskiej kardynalności. |
| `OPENCLAW_OTEL_PRELOADED`                                                                                         | Ustaw na `1`, gdy inny preload albo proces hosta już zarejestrował globalny OpenTelemetry SDK. Plugin pomija wtedy własny cykl życia NodeSDK, ale nadal podłącza listenery diagnostyczne i respektuje `traces`/`metrics`/`logs`.                                                                                                                    |

## Prywatność i przechwytywanie treści

Surowa treść modelu/narzędzia **nie** jest domyślnie eksportowana. Zakresy przenoszą ograniczone
identyfikatory (kanał, dostawca, model, kategoria błędu, identyfikatory żądań tylko jako hashe,
źródło narzędzia, właściciel narzędzia oraz nazwa/źródło Skills) i nigdy nie zawierają tekstu promptu,
tekstu odpowiedzi, wejść narzędzi, wyjść narzędzi, ścieżek plików Skills ani kluczy sesji.
Rekordy logów OTLP domyślnie zachowują ważność, logger, lokalizację w kodzie, zaufany kontekst śledzenia
oraz oczyszczone atrybuty, ale surowa treść komunikatu logu jest eksportowana
tylko wtedy, gdy `diagnostics.otel.captureContent` jest ustawione na wartość logiczną `true`. Szczegółowe
podklucze `captureContent.*` nie włączają treści logów. Etykiety wyglądające jak
zakresowe klucze sesji agentów są zastępowane wartością `unknown`.
Metryki Talk eksportują tylko ograniczone metadane zdarzeń, takie jak tryb, transport,
dostawca i typ zdarzenia. Nie zawierają transkrypcji, ładunków audio,
identyfikatorów sesji, identyfikatorów tur, identyfikatorów połączeń, identyfikatorów pokoi ani tokenów przekazania.

Wychodzące żądania modeli mogą zawierać nagłówek W3C `traceparent`. Ten nagłówek jest
generowany tylko z należącego do OpenClaw diagnostycznego kontekstu śledzenia dla aktywnego wywołania modelu.
Istniejące nagłówki `traceparent` dostarczone przez wywołującego są zastępowane, więc pluginy lub
niestandardowe opcje dostawcy nie mogą podszywać się pod pochodzenie śledzenia między usługami.

Ustawiaj `diagnostics.otel.captureContent.*` na `true` tylko wtedy, gdy Twój kolektor i
polityka retencji są zatwierdzone dla tekstu promptów, odpowiedzi, narzędzi albo promptów systemowych.
Każdy podklucz jest włączany niezależnie:

- `inputMessages` - treść promptu użytkownika.
- `outputMessages` - treść odpowiedzi modelu.
- `toolInputs` - ładunki argumentów narzędzi.
- `toolOutputs` - ładunki wyników narzędzi.
- `systemPrompt` - złożony prompt systemowy/deweloperski.
- `toolDefinitions` - nazwy, opisy i schematy narzędzi modelu.

Gdy dowolny podklucz jest włączony, zakresy modeli i narzędzi otrzymują ograniczone, zredagowane
atrybuty `openclaw.content.*` tylko dla tej klasy. Używaj wartości logicznej
`captureContent: true` tylko dla szerokich przechwyceń diagnostycznych, w których treści komunikatów logów
OTLP także są zatwierdzone do eksportu.

Treść `toolInputs`/`toolOutputs` jest przechwytywana dla wykonań narzędzi wbudowanego środowiska uruchomieniowego agenta
(`openclaw.content.tool_input` na zakresach zakończonych/błędnych,
`openclaw.content.tool_output` na zakresach zakończonych). Wywołania narzędzi zewnętrznych harnessów
(Codex, Claude CLI) emitują zakresy `tool.execution.*` bez ładunków treści.
Przechwycona treść przepływa zaufanym kanałem tylko dla listenerów i nigdy nie trafia
do publicznej magistrali zdarzeń diagnostycznych.

## Próbkowanie i flushowanie

- **Ślady:** `diagnostics.otel.sampleRate` (tylko zakres główny, `0.0` odrzuca wszystko,
  `1.0` zachowuje wszystko).
- **Metryki:** `diagnostics.otel.flushIntervalMs` (minimum `1000`).
- **Logi:** logi OTLP respektują `logging.level` (poziom logów plikowych). Używają
  ścieżki redakcji diagnostycznych rekordów logów, a nie formatowania konsoli. Instalacje o dużym wolumenie
  powinny preferować próbkowanie/filtrowanie kolektora OTLP zamiast lokalnego próbkowania.
  Ustaw `diagnostics.otel.logsExporter: "stdout"`, gdy Twoja platforma już
  wysyła stdout/stderr do procesora logów i nie masz kolektora logów OTLP.
  Rekordy stdout to jeden obiekt JSON na linię z `ts`, `signal`,
  `service.name`, ważnością, treścią, zredagowanymi atrybutami oraz zaufanymi polami śledzenia,
  gdy są dostępne.
- **Korelacja logów plikowych:** plikowe logi JSONL zawierają pola najwyższego poziomu `traceId`,
  `spanId`, `parentSpanId` i `traceFlags`, gdy wywołanie logowania przenosi prawidłowy
  diagnostyczny kontekst śledzenia, co pozwala procesorom logów łączyć lokalne linie logów z
  wyeksportowanymi zakresami.
- **Korelacja żądań:** żądania HTTP Gateway i ramki WebSocket tworzą
  wewnętrzny zakres śledzenia żądania. Logi i zdarzenia diagnostyczne wewnątrz tego zakresu
  domyślnie dziedziczą ślad żądania, a uruchomienia agentów i zakresy wywołań modeli są
  tworzone jako dzieci, dzięki czemu nagłówki `traceparent` dostawcy pozostają w tym samym śladzie.

## Eksportowane metryki

### Użycie modeli

- `openclaw.tokens` (licznik, atrybuty: `openclaw.token`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.agent`)
- `openclaw.cost.usd` (licznik, atrybuty: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.run.duration_ms` (histogram, atrybuty: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.context.tokens` (histogram, atrybuty: `openclaw.context`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `gen_ai.client.token.usage` (histogram, metryka konwencji semantycznych GenAI, atrybuty: `gen_ai.token.type` = `input`/`output`, `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`)
- `gen_ai.client.operation.duration` (histogram, sekundy, metryka konwencji semantycznych GenAI, atrybuty: `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`, opcjonalny `error.type`)
- `openclaw.model_call.duration_ms` (histogram, atrybuty: `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`, plus `openclaw.errorCategory` i `openclaw.failureKind` przy sklasyfikowanych błędach)
- `openclaw.model_call.request_bytes` (histogram, rozmiar w bajtach UTF-8 finalnego ładunku żądania modelu; bez surowej treści ładunku)
- `openclaw.model_call.response_bytes` (histogram, rozmiar w bajtach UTF-8 ładunków fragmentów odpowiedzi strumieniowanej; częste delty tekstu, myślenia i wywołań narzędzi liczą tylko przyrostowe bajty `delta`; bez surowej treści odpowiedzi)
- `openclaw.model_call.time_to_first_byte_ms` (histogram, czas, który upłynął przed pierwszym zdarzeniem odpowiedzi strumieniowanej)
- `openclaw.model.failover` (licznik, atrybuty: `openclaw.provider`, `openclaw.model`, `openclaw.failover.to_provider`, `openclaw.failover.to_model`, `openclaw.failover.reason`, `openclaw.failover.suspended`, `openclaw.lane`)
- `openclaw.skill.used` (licznik, atrybuty: `openclaw.skill.name`, `openclaw.skill.source`, `openclaw.skill.activation`, opcjonalny `openclaw.agent`, opcjonalny `openclaw.toolName`)

### Przepływ wiadomości

- `openclaw.webhook.received` (licznik, atrybuty: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.webhook.error` (licznik, atrybuty: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.webhook.duration_ms` (histogram, atrybuty: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.message.queued` (licznik, atrybuty: `openclaw.channel`, `openclaw.source`)
- `openclaw.message.received` (licznik, atrybuty: `openclaw.channel`, `openclaw.source`)
- `openclaw.message.dispatch.started` (licznik, atrybuty: `openclaw.channel`, `openclaw.source`)
- `openclaw.message.dispatch.completed` (licznik, atrybuty: `openclaw.channel`, `openclaw.outcome`, `openclaw.reason`, `openclaw.source`)
- `openclaw.message.dispatch.duration_ms` (histogram, atrybuty: `openclaw.channel`, `openclaw.outcome`, `openclaw.reason`, `openclaw.source`)
- `openclaw.message.processed` (licznik, atrybuty: `openclaw.channel`, `openclaw.outcome`)
- `openclaw.message.duration_ms` (histogram, atrybuty: `openclaw.channel`, `openclaw.outcome`)
- `openclaw.message.delivery.started` (licznik, atrybuty: `openclaw.channel`, `openclaw.delivery.kind`)
- `openclaw.message.delivery.duration_ms` (histogram, atrybuty: `openclaw.channel`, `openclaw.delivery.kind`, `openclaw.outcome`, `openclaw.errorCategory`)

### Rozmowa

- `openclaw.talk.event` (licznik, atrybuty: `openclaw.talk.event_type`, `openclaw.talk.mode`, `openclaw.talk.transport`, `openclaw.talk.brain`, `openclaw.talk.provider`)
- `openclaw.talk.event.duration_ms` (histogram, atrybuty: takie same jak `openclaw.talk.event`; emitowane, gdy zdarzenie rozmowy raportuje czas trwania)
- `openclaw.talk.audio.bytes` (histogram, atrybuty: takie same jak `openclaw.talk.event`; emitowane dla zdarzeń ramek audio rozmowy, które raportują długość w bajtach)

### Kolejki i sesje

- `openclaw.queue.lane.enqueue` (licznik, atrybuty: `openclaw.lane`)
- `openclaw.queue.lane.dequeue` (licznik, atrybuty: `openclaw.lane`)
- `openclaw.queue.depth` (histogram, atrybuty: `openclaw.lane` albo `openclaw.channel=heartbeat`)
- `openclaw.queue.wait_ms` (histogram, atrybuty: `openclaw.lane`)
- `openclaw.session.state` (licznik, atrybuty: `openclaw.state`, `openclaw.reason`)
- `openclaw.session.stuck` (licznik, atrybuty: `openclaw.state`; emitowane dla możliwej do odzyskania przestarzałej ewidencji sesji)
- `openclaw.session.stuck_age_ms` (histogram, atrybuty: `openclaw.state`; emitowane dla możliwej do odzyskania przestarzałej ewidencji sesji)
- `openclaw.session.turn.created` (licznik, atrybuty: `openclaw.agent`, `openclaw.channel`, `openclaw.trigger`)
- `openclaw.session.recovery.requested` (licznik, atrybuty: `openclaw.state`, `openclaw.action`, `openclaw.active_work_kind`, `openclaw.reason`)
- `openclaw.session.recovery.completed` (licznik, atrybuty: `openclaw.state`, `openclaw.action`, `openclaw.status`, `openclaw.active_work_kind`, `openclaw.reason`)
- `openclaw.session.recovery.age_ms` (histogram, atrybuty: takie same jak pasujący licznik odzyskiwania)
- `openclaw.run.attempt` (licznik, atrybuty: `openclaw.attempt`)

### Telemetria aktywności sesji

`diagnostics.stuckSessionWarnMs` to próg wieku bez postępu dla diagnostyki
aktywności sesji. Sesja `processing` nie zbliża się do tego progu,
gdy OpenClaw obserwuje postęp odpowiedzi, narzędzia, statusu, bloku lub środowiska uruchomieniowego ACP.
Keepalive’y pisania nie są liczone jako postęp, więc cichy model lub harness nadal może
zostać wykryty.

OpenClaw klasyfikuje sesje według pracy, którą nadal może obserwować:

- `session.long_running`: aktywna praca osadzona, wywołania modelu lub wywołania narzędzi
  nadal robią postęp. Posiadane wywołania modelu, które pozostają ciche po przekroczeniu
  `diagnostics.stuckSessionWarnMs`, są także raportowane jako długotrwałe przed
  `diagnostics.stuckSessionAbortMs`, aby wolni lub niestrumieniujący dostawcy modeli
  nie wyglądali jak zablokowane sesje gatewaya, dopóki pozostają obserwowalne pod kątem przerwania.
- `session.stalled`: istnieje aktywna praca, ale aktywne uruchomienie nie zgłosiło
  ostatniego postępu. Posiadane wywołania modelu przełączają się z `session.long_running` na
  `session.stalled` w chwili osiągnięcia lub po przekroczeniu `diagnostics.stuckSessionAbortMs`; przestarzała
  aktywność modelu/narzędzia bez właściciela nie jest traktowana jako nieszkodliwa długotrwała praca.
  Zablokowane osadzone uruchomienia najpierw pozostają tylko obserwowane, a następnie są przerywane i opróżniane po
  `diagnostics.stuckSessionAbortMs` bez postępu, aby zakolejkowane tury za
  pasmem mogły zostać wznowione. Gdy nie ustawiono, próg przerwania domyślnie przyjmuje bezpieczniejsze
  rozszerzone okno wynoszące co najmniej 5 minut i 3x
  `diagnostics.stuckSessionWarnMs`.
- `session.stuck`: przestarzała ewidencja sesji bez aktywnej pracy albo bezczynna
  zakolejkowana sesja z przestarzałą aktywnością modelu/narzędzia bez właściciela. To zwalnia
  dotknięte pasmo sesji natychmiast po przejściu bramek odzyskiwania.

Odzyskiwanie emituje ustrukturyzowane zdarzenia `session.recovery.requested` i
`session.recovery.completed`. Diagnostyczny stan sesji jest oznaczany jako bezczynny
dopiero po mutującym wyniku odzyskiwania (`aborted` albo `released`) i tylko wtedy, gdy
ta sama generacja przetwarzania jest nadal aktualna.

Tylko `session.stuck` emituje licznik `openclaw.session.stuck`,
histogram `openclaw.session.stuck_age_ms` oraz span `openclaw.session.stuck`.
Powtarzające się diagnostyki `session.stuck` wycofują się, gdy sesja pozostaje
niezmieniona, więc dashboardy powinny alarmować o utrzymujących się wzrostach, a nie o każdym
takcie Heartbeat. Pokrętło konfiguracji i wartości domyślne opisuje
[odwołanie do konfiguracji](/pl/gateway/configuration-reference#diagnostics).

Ostrzeżenia aktywności emitują także:

- `openclaw.liveness.warning` (licznik, atrybuty: `openclaw.liveness.reason`)
- `openclaw.liveness.event_loop_delay_p99_ms` (histogram, atrybuty: `openclaw.liveness.reason`)
- `openclaw.liveness.event_loop_delay_max_ms` (histogram, atrybuty: `openclaw.liveness.reason`)
- `openclaw.liveness.event_loop_utilization` (histogram, atrybuty: `openclaw.liveness.reason`)
- `openclaw.liveness.cpu_core_ratio` (histogram, atrybuty: `openclaw.liveness.reason`)

### Cykl życia harnessa

- `openclaw.harness.duration_ms` (histogram, atrybuty: `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.harness.phase` przy błędach)

### Wykonywanie narzędzi

- `openclaw.tool.execution.duration_ms` (histogram, atrybuty: `gen_ai.tool.name`, `openclaw.toolName`, `openclaw.tool.source`, `openclaw.tool.owner`, `openclaw.tool.params.kind`, plus `openclaw.errorCategory` przy błędach)
- `openclaw.tool.execution.blocked` (licznik, atrybuty: `gen_ai.tool.name`, `openclaw.toolName`, `openclaw.tool.source`, `openclaw.tool.owner`, `openclaw.tool.params.kind`, `openclaw.deniedReason`)

### Exec

- `openclaw.exec.duration_ms` (histogram, atrybuty: `openclaw.exec.target`, `openclaw.exec.mode`, `openclaw.outcome`, `openclaw.failureKind`)

### Wewnętrzne diagnostyki (pamięć i pętla narzędzi)

- `openclaw.payload.large` (licznik, atrybuty: `openclaw.payload.surface`, `openclaw.payload.action`, `openclaw.channel`, `openclaw.plugin`, `openclaw.reason`)
- `openclaw.payload.large_bytes` (histogram, atrybuty: takie same jak `openclaw.payload.large`)
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
  - `openclaw.errorCategory` i opcjonalne `openclaw.failureKind` przy błędach
  - `openclaw.model_call.request_bytes`, `openclaw.model_call.response_bytes`, `openclaw.model_call.time_to_first_byte_ms`
  - `openclaw.provider.request_id_hash` (ograniczony hash oparty na SHA identyfikatora żądania dostawcy nadrzędnego; surowe identyfikatory nie są eksportowane)
  - Z `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental` spany wywołań modelu używają najnowszej nazwy spanu wnioskowania GenAI `{gen_ai.operation.name} {gen_ai.request.model}` oraz rodzaju spanu `CLIENT` zamiast `openclaw.model.call`.
- `openclaw.harness.run`
  - `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.provider`, `openclaw.model`, `openclaw.channel`
  - Po zakończeniu: `openclaw.harness.result_classification`, `openclaw.harness.yield_detected`, `openclaw.harness.items.started`, `openclaw.harness.items.completed`, `openclaw.harness.items.active`
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
  - `openclaw.toolName`, `openclaw.outcome`, `openclaw.iterations`, `openclaw.errorCategory` (bez komunikatów pętli, parametrów ani danych wyjściowych narzędzia)
- `openclaw.memory.pressure`
  - `openclaw.memory.level`, `openclaw.memory.heap_used_bytes`, `openclaw.memory.rss_bytes`

Gdy przechwytywanie treści jest jawnie włączone, spany modelu i narzędzi mogą też
zawierać ograniczone, zredagowane atrybuty `openclaw.content.*` dla konkretnych
klas treści, które wybrano.

## Katalog zdarzeń diagnostycznych

Poniższe zdarzenia obsługują powyższe metryki i spany. Pluginy mogą również
subskrybować je bezpośrednio bez eksportu OTLP.

**Użycie modelu**

- `model.usage` - tokeny, koszt, czas trwania, kontekst, dostawca/model/kanał,
  identyfikatory sesji. `usage` to rozliczanie dostawcy/tury na potrzeby kosztów i telemetrii;
  `context.used` to bieżąca migawka promptu/kontekstu i może być niższe niż
  `usage.total` dostawcy, gdy występują buforowane dane wejściowe lub wywołania pętli narzędzi.

**Przepływ wiadomości**

- `webhook.received` / `webhook.processed` / `webhook.error`
- `message.queued` / `message.processed`
- `message.delivery.started` / `message.delivery.completed` / `message.delivery.error`

**Kolejka i sesja**

- `queue.lane.enqueue` / `queue.lane.dequeue`
- `session.state` / `session.long_running` / `session.stalled` / `session.stuck`
- `run.attempt` / `run.progress`
- `diagnostic.heartbeat` (zagregowane liczniki: webhooki/kolejka/sesja)

**Cykl życia harnessu**

- `harness.run.started` / `harness.run.completed` / `harness.run.error` -
  cykl życia dla pojedynczego uruchomienia harnessu agenta. Zawiera `harnessId`, opcjonalne
  `pluginId`, dostawcę/model/kanał oraz identyfikator uruchomienia. Zakończenie dodaje
  `durationMs`, `outcome`, opcjonalne `resultClassification`, `yieldDetected`
  oraz liczniki `itemLifecycle`. Błędy dodają `phase`
  (`prepare`/`start`/`send`/`resolve`/`cleanup`), `errorCategory` i
  opcjonalne `cleanupFailed`.

**Exec**

- `exec.process.completed` - końcowy wynik, czas trwania, cel, tryb, kod wyjścia
  i rodzaj niepowodzenia. Tekst polecenia i katalogi robocze nie są
  uwzględniane.

## Bez eksportera

Zdarzenia diagnostyczne mogą pozostać dostępne dla Pluginów lub niestandardowych ujść bez
uruchamiania `diagnostics-otel`:

```json5
{
  diagnostics: { enabled: true },
}
```

Aby uzyskać ukierunkowane dane debugowania bez podnoszenia `logging.level`, użyj flag diagnostycznych.
Flagi nie rozróżniają wielkości liter i obsługują symbole wieloznaczne (np. `telegram.*` lub
`*`):

```json5
{
  diagnostics: { flags: ["telegram.http"] },
}
```

Albo jako jednorazowe nadpisanie przez zmienną środowiskową:

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

Możesz też pominąć `diagnostics-otel` w `plugins.allow` albo uruchomić
`openclaw plugins disable diagnostics-otel`.

## Powiązane

- [Rejestrowanie](/pl/logging) - dzienniki plikowe, dane wyjściowe konsoli, śledzenie z CLI oraz karta Dzienniki w Control UI
- [Wewnętrzne mechanizmy rejestrowania Gateway](/pl/gateway/logging) - style dzienników WS, prefiksy podsystemów i przechwytywanie konsoli
- [Flagi diagnostyczne](/pl/diagnostics/flags) - ukierunkowane flagi dziennika debugowania
- [Eksport diagnostyki](/pl/gateway/diagnostics) - narzędzie pakietu wsparcia dla operatora (oddzielne od eksportu OTEL)
- [Dokumentacja konfiguracji](/pl/gateway/configuration-reference#diagnostics) - pełna dokumentacja pól `diagnostics.*`

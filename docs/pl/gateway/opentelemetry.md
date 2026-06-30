---
read_when:
    - Chcesz wysyłać użycie modelu OpenClaw, przepływ wiadomości lub metryki sesji do kolektora OpenTelemetry
    - Podłączasz ślady, metryki lub logi do Grafany, Datadog, Honeycomb, New Relic, Tempo albo innego backendu OTLP
    - Potrzebujesz dokładnych nazw metryk, nazw spanów lub struktur atrybutów, aby tworzyć pulpity nawigacyjne lub alerty
summary: Eksportuj diagnostykę OpenClaw do kolektorów OpenTelemetry lub JSONL na stdout za pośrednictwem wtyczki diagnostics-otel
title: Eksport OpenTelemetry
x-i18n:
    generated_at: "2026-06-30T14:31:56Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b9cdac72cb4a2910e6ef52e60a5f2266a2667c53cf003d63908f04d284e427b0
    source_path: gateway/opentelemetry.md
    workflow: 16
---

OpenClaw eksportuje diagnostykę przez oficjalny Plugin `diagnostics-otel`
przy użyciu **OTLP/HTTP (protobuf)**. Logi można też zapisywać jako JSONL na stdout dla
potoków logów kontenerów i środowisk izolowanych. Każdy kolektor lub backend akceptujący
OTLP/HTTP działa bez zmian w kodzie. Informacje o lokalnych plikach logów i sposobie ich odczytu
znajdziesz w sekcji [Logowanie](/pl/logging).

## Jak to działa

- **Zdarzenia diagnostyczne** to ustrukturyzowane rekordy w procesie emitowane przez
  Gateway i dołączone Pluginy dla uruchomień modeli, przepływu wiadomości, sesji, kolejek
  i exec.
- **Plugin `diagnostics-otel`** subskrybuje te zdarzenia i eksportuje je jako
  OpenTelemetry **metryki**, **ślady** i **logi** przez OTLP/HTTP. Może
  także kopiować rekordy logów diagnostycznych do JSONL na stdout.
- **Wywołania dostawców** otrzymują nagłówek W3C `traceparent` z należącego do OpenClaw
  kontekstu zaufanego zakresu wywołania modelu, gdy transport dostawcy akceptuje niestandardowe
  nagłówki. Kontekst śladu emitowany przez Plugin nie jest propagowany.
- Eksportery są podłączane tylko wtedy, gdy włączone są zarówno powierzchnia diagnostyczna, jak i Plugin,
  więc domyślnie koszt w procesie pozostaje bliski zeru.

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

Możesz też włączyć Plugin z CLI:

```bash
openclaw plugins enable diagnostics-otel
```

<Note>
`protocol` obecnie obsługuje tylko `http/protobuf`. `grpc` jest ignorowany.
</Note>

## Eksportowane sygnały

| Sygnał      | Co trafia do środka                                                                                                                                                                                                    |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Metryki** | Liczniki i histogramy użycia tokenów, kosztów, czasu trwania uruchomień, przełączania awaryjnego, użycia Skills, przepływu wiadomości, zdarzeń Talk, torów kolejek, stanu/odzyskiwania sesji, wykonywania narzędzi, zbyt dużych ładunków, exec i presji pamięci. |
| **Ślady**  | Zakresy dla użycia modeli, wywołań modeli, cyklu życia harnessu, użycia Skills, wykonywania narzędzi, exec, przetwarzania webhooków/wiadomości, składania kontekstu i pętli narzędzi.                                                            |
| **Logi**    | Ustrukturyzowane rekordy `logging.file` eksportowane przez OTLP lub JSONL na stdout, gdy włączone jest `diagnostics.otel.logs`; treści logów są wstrzymywane, chyba że przechwytywanie treści zostanie jawnie włączone.                                |

Przełączaj `traces`, `metrics` i `logs` niezależnie. Ślady i metryki
są domyślnie włączone, gdy `diagnostics.otel.enabled` ma wartość true. Logi są domyślnie wyłączone i
są eksportowane tylko wtedy, gdy `diagnostics.otel.logs` jest jawnie ustawione na `true`. Eksport logów
domyślnie używa OTLP; ustaw `diagnostics.otel.logsExporter` na `stdout`, aby uzyskać JSONL na
stdout, albo `both`, aby wysyłać każdy rekord logu diagnostycznego do OTLP i stdout.

## Referencja konfiguracji

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
| `OTEL_EXPORTER_OTLP_ENDPOINT`                                                                                     | Zastępuje `diagnostics.otel.endpoint`. Jeśli wartość zawiera już `/v1/traces`, `/v1/metrics` lub `/v1/logs`, jest używana bez zmian.                                                                                                                                                                                                              |
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` / `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` / `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | Zastąpienia endpointów dla poszczególnych sygnałów używane, gdy pasujący klucz konfiguracji `diagnostics.otel.*Endpoint` nie jest ustawiony. Konfiguracja właściwa dla sygnału ma pierwszeństwo przed zmienną środowiskową właściwą dla sygnału, a ta ma pierwszeństwo przed współdzielonym endpointem.                                                                                                                                         |
| `OTEL_SERVICE_NAME`                                                                                               | Zastępuje `diagnostics.otel.serviceName`.                                                                                                                                                                                                                                                                                                       |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                                                                                     | Zastępuje protokół przesyłania (obecnie honorowane jest tylko `http/protobuf`).                                                                                                                                                                                                                                                                            |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                                                                                   | Ustaw na `gen_ai_latest_experimental`, aby emitować najnowszy eksperymentalny kształt zakresu wnioskowania GenAI, w tym nazwy zakresów `{gen_ai.operation.name} {gen_ai.request.model}`, rodzaj zakresu `CLIENT` oraz `gen_ai.provider.name` zamiast starszego `gen_ai.system`. Metryki GenAI zawsze używają ograniczonych, niskokardynalnych atrybutów semantycznych. |
| `OPENCLAW_OTEL_PRELOADED`                                                                                         | Ustaw na `1`, gdy inny preload lub proces hosta zarejestrował już globalny OpenTelemetry SDK. Plugin pomija wtedy własny cykl życia NodeSDK, ale nadal podłącza listenery diagnostyczne i honoruje `traces`/`metrics`/`logs`.                                                                                                                    |

## Prywatność i przechwytywanie treści

Surowa treść modelu/narzędzia **nie** jest domyślnie eksportowana. Zakresy przenoszą ograniczone
identyfikatory (kanał, dostawca, model, kategoria błędu, identyfikatory żądań tylko jako hash,
źródło narzędzia, właściciel narzędzia oraz nazwa/źródło Skills) i nigdy nie obejmują tekstu promptu,
tekstu odpowiedzi, wejść narzędzi, wyjść narzędzi, ścieżek plików Skills ani kluczy sesji.
Rekordy logów OTLP domyślnie zachowują ważność, logger, lokalizację kodu, zaufany kontekst śladu
i oczyszczone atrybuty, ale surowa treść komunikatu logu jest eksportowana
tylko wtedy, gdy `diagnostics.otel.captureContent` jest ustawione na wartość logiczną `true`. Szczegółowe
podklucze `captureContent.*` nie włączają treści logów. Etykiety wyglądające jak
zakresowe klucze sesji agenta są zastępowane wartością `unknown`.
Metryki Talk eksportują tylko ograniczone metadane zdarzeń, takie jak tryb, transport,
dostawca i typ zdarzenia. Nie obejmują transkrypcji, ładunków audio,
identyfikatorów sesji, identyfikatorów tur, identyfikatorów wywołań, identyfikatorów pokojów ani tokenów przekazania.

Wychodzące żądania modelu mogą zawierać nagłówek W3C `traceparent`. Ten nagłówek jest
generowany wyłącznie z należącego do OpenClaw kontekstu śladu diagnostycznego dla aktywnego wywołania modelu.
Istniejące nagłówki `traceparent` dostarczone przez wywołującego są zastępowane, więc Pluginy ani
niestandardowe opcje dostawcy nie mogą podszywać się pod pochodzenie śladu między usługami.

Ustaw `diagnostics.otel.captureContent.*` na `true` tylko wtedy, gdy Twój kolektor i
polityka retencji są zatwierdzone dla tekstu promptów, odpowiedzi, narzędzi lub promptu systemowego.
Każdy podklucz jest włączany niezależnie:

- `inputMessages` - treść promptu użytkownika.
- `outputMessages` - treść odpowiedzi modelu.
- `toolInputs` - ładunki argumentów narzędzi.
- `toolOutputs` - ładunki wyników narzędzi.
- `systemPrompt` - złożony prompt systemowy/deweloperski.
- `toolDefinitions` - nazwy, opisy i schematy narzędzi modelu.

Gdy dowolny podklucz jest włączony, zakresy modeli i narzędzi otrzymują ograniczone, zredagowane
atrybuty `openclaw.content.*` tylko dla tej klasy. Używaj wartości logicznej
`captureContent: true` tylko dla szerokich przechwyceń diagnostycznych, w których treści komunikatów logów OTLP
również są zatwierdzone do eksportu.

Treść `toolInputs`/`toolOutputs` jest przechwytywana dla wykonań narzędzi wbudowanego środowiska uruchomieniowego agenta
(`openclaw.content.tool_input` w zakresach zakończonych/błędnych,
`openclaw.content.tool_output` w zakresach zakończonych). Wywołania narzędzi zewnętrznych harnessów
(Codex, Claude CLI) emitują zakresy `tool.execution.*` bez ładunków treści.
Przechwycona treść przechodzi przez zaufany kanał tylko dla listenerów i nigdy nie jest umieszczana
na publicznej magistrali zdarzeń diagnostycznych.

## Próbkowanie i opróżnianie bufora

- **Ślady:** `diagnostics.otel.sampleRate` (tylko główny span, `0.0` odrzuca wszystko,
  `1.0` zachowuje wszystko).
- **Metryki:** `diagnostics.otel.flushIntervalMs` (minimum `1000`).
- **Logi:** logi OTLP respektują `logging.level` (poziom logów pliku). Używają
  ścieżki redakcji diagnostycznych rekordów logów, a nie formatowania konsoli.
  Instalacje o dużym wolumenie powinny preferować próbkowanie/filtrowanie
  kolektora OTLP zamiast próbkowania lokalnego. Ustaw
  `diagnostics.otel.logsExporter: "stdout"`, gdy Twoja platforma już wysyła
  stdout/stderr do procesora logów i nie masz kolektora logów OTLP. Rekordy
  stdout to jeden obiekt JSON na wiersz z `ts`, `signal`, `service.name`,
  ważnością, treścią, zredagowanymi atrybutami i zaufanymi polami śladu, gdy są
  dostępne.
- **Korelacja logów plikowych:** logi plikowe JSONL zawierają pola najwyższego
  poziomu `traceId`, `spanId`, `parentSpanId` i `traceFlags`, gdy wywołanie logu
  przenosi prawidłowy kontekst śladu diagnostycznego, co pozwala procesorom
  logów łączyć lokalne wiersze logów z wyeksportowanymi spanami.
- **Korelacja żądań:** żądania HTTP Gateway i ramki WebSocket tworzą wewnętrzny
  zakres śladu żądania. Logi i zdarzenia diagnostyczne w tym zakresie domyślnie
  dziedziczą ślad żądania, a spany uruchomienia agenta i wywołań modelu są
  tworzone jako potomne, aby nagłówki `traceparent` dostawcy pozostały w tym
  samym śladzie.
- **Korelacja wywołań modelu:** spany `openclaw.model.call` domyślnie zawierają
  bezpieczne rozmiary komponentów promptu i zawierają atrybuty tokenów dla
  pojedynczego wywołania, gdy wynik dostawcy ujawnia użycie. `openclaw.model.usage`
  pozostaje spanem rozliczeniowym na poziomie uruchomienia dla zagregowanego
  kosztu, kontekstu i pulpitów kanałów; pozostaje w tym samym śladzie
  diagnostycznym, gdy emitujące środowisko uruchomieniowe ma zaufany kontekst
  śladu.

## Eksportowane metryki

### Użycie modelu

- `openclaw.tokens` (licznik, atrybuty: `openclaw.token`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.agent`)
- `openclaw.cost.usd` (licznik, atrybuty: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.run.duration_ms` (histogram, atrybuty: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.context.tokens` (histogram, atrybuty: `openclaw.context`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `gen_ai.client.token.usage` (histogram, metryka konwencji semantycznych GenAI, atrybuty: `gen_ai.token.type` = `input`/`output`, `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`)
- `gen_ai.client.operation.duration` (histogram, sekundy, metryka konwencji semantycznych GenAI, atrybuty: `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`, opcjonalnie `error.type`)
- `openclaw.model_call.duration_ms` (histogram, atrybuty: `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`, plus `openclaw.errorCategory` i `openclaw.failureKind` przy sklasyfikowanych błędach)
- `openclaw.model_call.request_bytes` (histogram, rozmiar w bajtach UTF-8 końcowego ładunku żądania modelu; bez surowej zawartości ładunku)
- `openclaw.model_call.response_bytes` (histogram, rozmiar w bajtach UTF-8 ładunków fragmentów odpowiedzi strumieniowanej; częste delty tekstu, rozumowania i wywołań narzędzi liczą tylko przyrostowe bajty `delta`; bez surowej zawartości odpowiedzi)
- `openclaw.model_call.time_to_first_byte_ms` (histogram, czas, który upłynął przed pierwszym zdarzeniem odpowiedzi strumieniowanej)
- `openclaw.model.failover` (licznik, atrybuty: `openclaw.provider`, `openclaw.model`, `openclaw.failover.to_provider`, `openclaw.failover.to_model`, `openclaw.failover.reason`, `openclaw.failover.suspended`, `openclaw.lane`)
- `openclaw.skill.used` (licznik, atrybuty: `openclaw.skill.name`, `openclaw.skill.source`, `openclaw.skill.activation`, opcjonalnie `openclaw.agent`, opcjonalnie `openclaw.toolName`)

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

### Talk

- `openclaw.talk.event` (licznik, atrybuty: `openclaw.talk.event_type`, `openclaw.talk.mode`, `openclaw.talk.transport`, `openclaw.talk.brain`, `openclaw.talk.provider`)
- `openclaw.talk.event.duration_ms` (histogram, atrybuty: takie same jak `openclaw.talk.event`; emitowane, gdy zdarzenie Talk zgłasza czas trwania)
- `openclaw.talk.audio.bytes` (histogram, atrybuty: takie same jak `openclaw.talk.event`; emitowane dla zdarzeń ramek audio Talk, które zgłaszają długość w bajtach)

### Kolejki i sesje

- `openclaw.queue.lane.enqueue` (licznik, atrybuty: `openclaw.lane`)
- `openclaw.queue.lane.dequeue` (licznik, atrybuty: `openclaw.lane`)
- `openclaw.queue.depth` (histogram, atrybuty: `openclaw.lane` lub `openclaw.channel=heartbeat`)
- `openclaw.queue.wait_ms` (histogram, atrybuty: `openclaw.lane`)
- `openclaw.session.state` (licznik, atrybuty: `openclaw.state`, `openclaw.reason`)
- `openclaw.session.stuck` (licznik, atrybuty: `openclaw.state`; emitowane dla możliwego do odzyskania nieaktualnego księgowania sesji)
- `openclaw.session.stuck_age_ms` (histogram, atrybuty: `openclaw.state`; emitowane dla możliwego do odzyskania nieaktualnego księgowania sesji)
- `openclaw.session.turn.created` (licznik, atrybuty: `openclaw.agent`, `openclaw.channel`, `openclaw.trigger`)
- `openclaw.session.recovery.requested` (licznik, atrybuty: `openclaw.state`, `openclaw.action`, `openclaw.active_work_kind`, `openclaw.reason`)
- `openclaw.session.recovery.completed` (licznik, atrybuty: `openclaw.state`, `openclaw.action`, `openclaw.status`, `openclaw.active_work_kind`, `openclaw.reason`)
- `openclaw.session.recovery.age_ms` (histogram, atrybuty: takie same jak odpowiadający licznik odzyskiwania)
- `openclaw.run.attempt` (licznik, atrybuty: `openclaw.attempt`)

### Telemetria żywotności sesji

`diagnostics.stuckSessionWarnMs` to próg wieku bez postępu dla diagnostyki
żywotności sesji. Sesja `processing` nie starzeje się w kierunku tego progu,
gdy OpenClaw obserwuje postęp odpowiedzi, narzędzia, statusu, bloku lub
środowiska uruchomieniowego ACP. Keepalive'y pisania nie są liczone jako postęp,
więc cichy model lub harness nadal może zostać wykryty.

OpenClaw klasyfikuje sesje według pracy, którą nadal może obserwować:

- `session.long_running`: aktywna praca osadzona, wywołania modelu lub wywołania
  narzędzi nadal robią postęp. Własne wywołania modelu, które pozostają ciche po
  `diagnostics.stuckSessionWarnMs`, również są raportowane jako długotrwałe przed
  `diagnostics.stuckSessionAbortMs`, aby wolni lub niestrumieniujący dostawcy
  modeli nie wyglądali jak zablokowane sesje gateway, dopóki pozostają możliwe
  do zaobserwowania pod kątem przerwania.
- `session.stalled`: aktywna praca istnieje, ale aktywne uruchomienie nie
  zgłosiło ostatnio postępu. Własne wywołania modelu przełączają się z
  `session.long_running` na `session.stalled` w momencie lub po
  `diagnostics.stuckSessionAbortMs`; nieaktualna aktywność modelu/narzędzia bez
  właściciela nie jest traktowana jako nieszkodliwa długotrwała praca.
  Zablokowane uruchomienia osadzone pozostają początkowo tylko obserwowane, a
  następnie po `diagnostics.stuckSessionAbortMs` bez postępu przechodzą w
  przerwanie z opróżnieniem, aby zakolejkowane tury za pasem mogły zostać
  wznowione. Gdy próg przerwania nie jest ustawiony, domyślnie przyjmuje
  bezpieczniejsze rozszerzone okno wynoszące co najmniej 5 minut i 3x
  `diagnostics.stuckSessionWarnMs`.
- `session.stuck`: nieaktualne księgowanie sesji bez aktywnej pracy albo
  bezczynna zakolejkowana sesja z nieaktualną aktywnością modelu/narzędzia bez
  właściciela. To zwalnia dotknięty pas sesji natychmiast po przejściu bramek
  odzyskiwania.

Odzyskiwanie emituje ustrukturyzowane zdarzenia `session.recovery.requested` i
`session.recovery.completed`. Diagnostyczny stan sesji jest oznaczany jako
bezczynny dopiero po mutującym wyniku odzyskiwania (`aborted` lub `released`) i
tylko wtedy, gdy ta sama generacja przetwarzania jest nadal bieżąca.

Tylko `session.stuck` emituje licznik `openclaw.session.stuck`, histogram
`openclaw.session.stuck_age_ms` i span `openclaw.session.stuck`. Powtarzane
diagnostyki `session.stuck` wycofują się, dopóki sesja pozostaje niezmieniona,
więc pulpity powinny alarmować przy utrzymujących się wzrostach, a nie przy
każdym tyknięciu Heartbeat. Pokrętło konfiguracji i wartości domyślne opisuje
[Dokumentacja konfiguracji](/pl/gateway/configuration-reference#diagnostics).

Ostrzeżenia żywotności emitują także:

- `openclaw.liveness.warning` (licznik, atrybuty: `openclaw.liveness.reason`)
- `openclaw.liveness.event_loop_delay_p99_ms` (histogram, atrybuty: `openclaw.liveness.reason`)
- `openclaw.liveness.event_loop_delay_max_ms` (histogram, atrybuty: `openclaw.liveness.reason`)
- `openclaw.liveness.event_loop_utilization` (histogram, atrybuty: `openclaw.liveness.reason`)
- `openclaw.liveness.cpu_core_ratio` (histogram, atrybuty: `openclaw.liveness.reason`)

### Cykl życia harnessu

- `openclaw.harness.duration_ms` (histogram, atrybuty: `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.harness.phase` przy błędach)

### Wykonywanie narzędzi

- `openclaw.tool.execution.duration_ms` (histogram, atrybuty: `gen_ai.tool.name`, `openclaw.toolName`, `openclaw.tool.source`, `openclaw.tool.owner`, `openclaw.tool.params.kind`, plus `openclaw.errorCategory` przy błędach)
- `openclaw.tool.execution.blocked` (licznik, atrybuty: `gen_ai.tool.name`, `openclaw.toolName`, `openclaw.tool.source`, `openclaw.tool.owner`, `openclaw.tool.params.kind`, `openclaw.deniedReason`)

### Exec

- `openclaw.exec.duration_ms` (histogram, atrybuty: `openclaw.exec.target`, `openclaw.exec.mode`, `openclaw.outcome`, `openclaw.failureKind`)

### Wewnętrzne elementy diagnostyki (pamięć i pętla narzędzi)

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
  - `openclaw.errorCategory` oraz opcjonalnie `openclaw.failureKind` przy błędach
  - `openclaw.model_call.request_bytes`, `openclaw.model_call.response_bytes`, `openclaw.model_call.time_to_first_byte_ms`
  - `openclaw.model_call.prompt.input_messages_count`, `openclaw.model_call.prompt.input_messages_chars`, `openclaw.model_call.prompt.system_prompt_chars`, `openclaw.model_call.prompt.tool_definitions_count`, `openclaw.model_call.prompt.tool_definitions_chars`, `openclaw.model_call.prompt.total_chars` (tylko bezpieczne rozmiary komponentów, bez tekstu promptu)
  - `openclaw.model_call.usage.*` oraz `gen_ai.usage.*`, gdy wynik wywołania modelu zawiera użycie dostawcy dla tego pojedynczego wywołania
  - `openclaw.provider.request_id_hash` (ograniczony hash oparty na SHA identyfikatora żądania dostawcy nadrzędnego; surowe identyfikatory nie są eksportowane)
  - Z `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental` zakresy wywołań modelu używają najnowszej nazwy zakresu wnioskowania GenAI `{gen_ai.operation.name} {gen_ai.request.model}` oraz rodzaju zakresu `CLIENT` zamiast `openclaw.model.call`.
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

Gdy przechwytywanie treści jest jawnie włączone, zakresy modelu i narzędzi mogą także
zawierać ograniczone, zredagowane atrybuty `openclaw.content.*` dla konkretnych
klas treści, które włączono.

## Katalog zdarzeń diagnostycznych

Poniższe zdarzenia obsługują powyższe metryki i zakresy. Pluginy mogą też subskrybować
je bezpośrednio bez eksportu OTLP.

**Użycie modelu**

- `model.usage` - tokeny, koszt, czas trwania, kontekst, dostawca/model/kanał,
  identyfikatory sesji. `usage` to rozliczanie dostawcy/tury na potrzeby kosztów i telemetrii;
  `context.used` to bieżąca migawka promptu/kontekstu i może być niższe niż
  `usage.total` dostawcy, gdy używane są buforowane dane wejściowe lub wywołania pętli narzędzi.

**Przepływ wiadomości**

- `webhook.received` / `webhook.processed` / `webhook.error`
- `message.queued` / `message.processed`
- `message.delivery.started` / `message.delivery.completed` / `message.delivery.error`

**Kolejka i sesja**

- `queue.lane.enqueue` / `queue.lane.dequeue`
- `session.state` / `session.long_running` / `session.stalled` / `session.stuck`
- `run.attempt` / `run.progress`
- `diagnostic.heartbeat` (liczniki zagregowane: webhooki/kolejka/sesja)

**Cykl życia uprzęży**

- `harness.run.started` / `harness.run.completed` / `harness.run.error` -
  cykl życia pojedynczego uruchomienia uprzęży agenta. Obejmuje `harnessId`, opcjonalny
  `pluginId`, dostawcę/model/kanał oraz identyfikator uruchomienia. Zakończenie dodaje
  `durationMs`, `outcome`, opcjonalnie `resultClassification`, `yieldDetected`
  oraz liczniki `itemLifecycle`. Błędy dodają `phase`
  (`prepare`/`start`/`send`/`resolve`/`cleanup`), `errorCategory` oraz
  opcjonalnie `cleanupFailed`.

**Exec**

- `exec.process.completed` - końcowy wynik, czas trwania, cel, tryb, kod wyjścia
  i rodzaj awarii. Tekst polecenia i katalogi robocze nie są
  uwzględniane.

## Bez eksportera

Zdarzenia diagnostyczne można udostępnić Pluginom lub niestandardowym odbiornikom bez
uruchamiania `diagnostics-otel`:

```json5
{
  diagnostics: { enabled: true },
}
```

Aby uzyskać ukierunkowane wyjście debugowania bez podnoszenia `logging.level`, użyj flag diagnostycznych. Flagi nie rozróżniają wielkości liter i obsługują symbole wieloznaczne (np. `telegram.*` lub
`*`):

```json5
{
  diagnostics: { flags: ["telegram.http"] },
}
```

Lub jako jednorazowe nadpisanie zmienną środowiskową:

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload openclaw gateway
```

Wyjście flag trafia do standardowego pliku dziennika (`logging.file`) i nadal jest
redagowane przez `logging.redactSensitive`. Pełny przewodnik:
[Flagi diagnostyczne](/pl/diagnostics/flags).

## Wyłączenie

```json5
{
  diagnostics: { otel: { enabled: false } },
}
```

Można też pominąć `diagnostics-otel` w `plugins.allow` albo uruchomić
`openclaw plugins disable diagnostics-otel`.

## Powiązane

- [Rejestrowanie](/pl/logging) - dzienniki plikowe, wyjście konsoli, śledzenie CLI oraz karta Logs w Control UI
- [Wewnętrzne mechanizmy rejestrowania Gateway](/pl/gateway/logging) - style dzienników WS, prefiksy podsystemów i przechwytywanie konsoli
- [Flagi diagnostyczne](/pl/diagnostics/flags) - ukierunkowane flagi dzienników debugowania
- [Eksport diagnostyki](/pl/gateway/diagnostics) - narzędzie pakietu wsparcia dla operatora (oddzielne od eksportu OTEL)
- [Dokumentacja konfiguracji](/pl/gateway/configuration-reference#diagnostics) - pełna dokumentacja pól `diagnostics.*`

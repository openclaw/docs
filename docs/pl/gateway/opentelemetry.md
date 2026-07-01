---
read_when:
    - Chcesz wysyłać metryki użycia modeli OpenClaw, przepływu wiadomości lub sesji do kolektora OpenTelemetry
    - Konfigurujesz przesyłanie śladów, metryk lub logów do Grafana, Datadog, Honeycomb, New Relic, Tempo albo innego backendu OTLP
    - Potrzebujesz dokładnych nazw metryk, nazw spanów lub kształtów atrybutów, aby tworzyć pulpity nawigacyjne lub alerty
summary: Eksportuj diagnostykę OpenClaw do kolektorów OpenTelemetry lub stdout JSONL za pomocą pluginu diagnostics-otel
title: Eksport OpenTelemetry
x-i18n:
    generated_at: "2026-07-01T08:33:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d2e23876db9446a97545f01436326d08aadf222ec41a326749fd084779a7259f
    source_path: gateway/opentelemetry.md
    workflow: 16
---

OpenClaw eksportuje diagnostykę przez oficjalny plugin `diagnostics-otel`
używający **OTLP/HTTP (protobuf)**. Logi można też zapisywać jako stdout JSONL dla
potoków logów kontenerów i piaskownic. Każdy kolektor lub backend akceptujący
OTLP/HTTP działa bez zmian w kodzie. Informacje o lokalnych plikach logów i ich
odczytywaniu znajdziesz w sekcji [Rejestrowanie](/pl/logging).

## Jak to działa razem

- **Zdarzenia diagnostyczne** to ustrukturyzowane rekordy w procesie emitowane przez
  Gateway i dołączone pluginy dla uruchomień modeli, przepływu wiadomości, sesji, kolejek
  oraz wykonywania poleceń.
- **Plugin `diagnostics-otel`** subskrybuje te zdarzenia i eksportuje je jako
  OpenTelemetry **metryki**, **ślady** i **logi** przez OTLP/HTTP. Może też
  odzwierciedlać rekordy logów diagnostycznych do stdout JSONL.
- **Wywołania dostawców** otrzymują nagłówek W3C `traceparent` z należącego do OpenClaw
  kontekstu zaufanego zakresu wywołania modelu, gdy transport dostawcy akceptuje własne
  nagłówki. Kontekst śledzenia emitowany przez plugin nie jest propagowany.
- Eksportery są podłączane tylko wtedy, gdy włączone są zarówno powierzchnia diagnostyczna, jak i plugin,
  więc koszt w procesie domyślnie pozostaje bliski zeru.

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

| Sygnał      | Co trafia do środka                                                                                                                                                                                                    |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Metryki** | Liczniki i histogramy użycia tokenów, kosztów, czasu trwania uruchomień, przełączania awaryjnego, użycia Skills, przepływu wiadomości, zdarzeń Talk, torów kolejek, stanu/odzyskiwania sesji, wykonywania narzędzi, zbyt dużych ładunków, wykonywania poleceń i presji pamięci. |
| **Ślady**  | Zakresy użycia modelu, wywołań modelu, cyklu życia harnessu, użycia Skills, wykonywania narzędzi, wykonywania poleceń, przetwarzania webhooków/wiadomości, składania kontekstu i pętli narzędzi.                                                            |
| **Logi**    | Ustrukturyzowane rekordy `logging.file` eksportowane przez OTLP lub stdout JSONL, gdy włączone jest `diagnostics.otel.logs`; treści logów są wstrzymywane, chyba że przechwytywanie zawartości jest jawnie włączone.                                |

Przełączaj `traces`, `metrics` i `logs` niezależnie. Ślady i metryki
są domyślnie włączone, gdy `diagnostics.otel.enabled` ma wartość true. Logi są domyślnie wyłączone i
eksportowane tylko wtedy, gdy `diagnostics.otel.logs` jest jawnie ustawione na `true`. Eksport logów
domyślnie używa OTLP; ustaw `diagnostics.otel.logsExporter` na `stdout`, aby uzyskać JSONL na
stdout, albo `both`, aby wysłać każdy rekord logu diagnostycznego do OTLP i stdout.

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
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` / `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` / `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | Nadpisania punktów końcowych specyficzne dla sygnału, używane, gdy pasujący klucz konfiguracji `diagnostics.otel.*Endpoint` nie jest ustawiony. Konfiguracja specyficzna dla sygnału ma pierwszeństwo przed zmienną środowiskową specyficzną dla sygnału, a ta ma pierwszeństwo przed współdzielonym punktem końcowym.                                                                                                                                         |
| `OTEL_SERVICE_NAME`                                                                                               | Zastępuje `diagnostics.otel.serviceName`.                                                                                                                                                                                                                                                                                                       |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                                                                                     | Zastępuje protokół przewodowy (obecnie honorowane jest tylko `http/protobuf`).                                                                                                                                                                                                                                                                            |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                                                                                   | Ustaw na `gen_ai_latest_experimental`, aby emitować najnowszy eksperymentalny kształt zakresu wnioskowania GenAI, w tym nazwy zakresów `{gen_ai.operation.name} {gen_ai.request.model}`, rodzaj zakresu `CLIENT` oraz `gen_ai.provider.name` zamiast starszego `gen_ai.system`. Metryki GenAI zawsze używają ograniczonych atrybutów semantycznych o niskiej kardynalności. |
| `OPENCLAW_OTEL_PRELOADED`                                                                                         | Ustaw na `1`, gdy inny preload lub proces hosta zarejestrował już globalny SDK OpenTelemetry. Plugin pomija wtedy własny cykl życia NodeSDK, ale nadal podłącza listenery diagnostyczne i honoruje `traces`/`metrics`/`logs`.                                                                                                                    |

## Prywatność i przechwytywanie zawartości

Surowa zawartość modelu/narzędzia **nie** jest domyślnie eksportowana. Zakresy przenoszą ograniczone
identyfikatory (kanał, dostawca, model, kategoria błędu, identyfikatory żądań tylko jako skrót,
źródło narzędzia, właściciel narzędzia oraz nazwa/źródło Skills) i nigdy nie zawierają tekstu promptu,
tekstu odpowiedzi, wejść narzędzi, wyjść narzędzi, ścieżek plików Skills ani kluczy sesji.
Rekordy logów OTLP domyślnie zachowują ważność, logger, lokalizację w kodzie, zaufany kontekst śledzenia
i oczyszczone atrybuty, ale surowa treść komunikatu logu jest eksportowana
tylko wtedy, gdy `diagnostics.otel.captureContent` jest ustawione na wartość logiczną `true`. Szczegółowe
podklucze `captureContent.*` nie włączają treści logów. Etykiety wyglądające jak
klucze sesji agenta o zakresie są zastępowane przez `unknown`.
Metryki Talk eksportują tylko ograniczone metadane zdarzeń, takie jak tryb, transport,
dostawca i typ zdarzenia. Nie zawierają transkrypcji, ładunków audio,
identyfikatorów sesji, identyfikatorów tur, identyfikatorów połączeń, identyfikatorów pokojów ani tokenów przekazania.

Wychodzące żądania modelu mogą zawierać nagłówek W3C `traceparent`. Ten nagłówek jest
generowany wyłącznie z należącego do OpenClaw diagnostycznego kontekstu śledzenia dla aktywnego
wywołania modelu. Istniejące nagłówki `traceparent` dostarczone przez wywołującego są zastępowane, więc pluginy lub
niestandardowe opcje dostawców nie mogą podszywać się pod pochodzenie śladu między usługami.

Ustaw `diagnostics.otel.captureContent.*` na `true` tylko wtedy, gdy Twój kolektor i
zasady retencji są zatwierdzone dla tekstu promptu, odpowiedzi, narzędzia lub promptu systemowego.
Każdy podklucz jest włączany niezależnie:

- `inputMessages` - treść promptu użytkownika.
- `outputMessages` - treść odpowiedzi modelu.
- `toolInputs` - ładunki argumentów narzędzi.
- `toolOutputs` - ładunki wyników narzędzi.
- `systemPrompt` - złożony prompt systemowy/deweloperski.
- `toolDefinitions` - nazwy, opisy i schematy narzędzi modelu.

Gdy dowolny podklucz jest włączony, zakresy modeli i narzędzi otrzymują ograniczone, zredagowane
atrybuty `openclaw.content.*` tylko dla tej klasy. Używaj wartości logicznej
`captureContent: true` tylko w przypadku szerokich przechwyceń diagnostycznych, w których treści
komunikatów logów OTLP są również zatwierdzone do eksportu.

Zawartość `toolInputs`/`toolOutputs` jest przechwytywana dla wykonań narzędzi wbudowanego środowiska uruchomieniowego agenta
(`openclaw.content.tool_input` w zakresach zakończonych/błędnych,
`openclaw.content.tool_output` w zakresach zakończonych). Wywołania narzędzi zewnętrznego harnessu
(Codex, Claude CLI) emitują zakresy `tool.execution.*` bez ładunków zawartości.
Przechwycona zawartość przechodzi zaufanym kanałem tylko dla listenerów i nigdy nie jest umieszczana
w publicznej magistrali zdarzeń diagnostycznych.

## Próbkowanie i opróżnianie

- **Ślady:** `diagnostics.otel.sampleRate` (tylko główny span, `0.0` odrzuca wszystkie,
  `1.0` zachowuje wszystkie).
- **Metryki:** `diagnostics.otel.flushIntervalMs` (minimum `1000`).
- **Logi:** logi OTLP respektują `logging.level` (poziom logowania do pliku). Używają
  ścieżki redakcji diagnostycznych rekordów logów, a nie formatowania konsoli. Instalacje o dużym wolumenie
  powinny preferować próbkowanie/filtrowanie w kolektorze OTLP zamiast lokalnego próbkowania.
  Ustaw `diagnostics.otel.logsExporter: "stdout"`, gdy Twoja platforma już
  wysyła stdout/stderr do procesora logów i nie masz kolektora logów OTLP.
  Rekordy stdout to jeden obiekt JSON na wiersz z `ts`, `signal`,
  `service.name`, ważnością, treścią, zredagowanymi atrybutami i zaufanymi polami śladu,
  gdy są dostępne.
- **Korelacja logów plikowych:** logi plikowe JSONL zawierają pola najwyższego poziomu `traceId`,
  `spanId`, `parentSpanId` i `traceFlags`, gdy wywołanie logowania przenosi prawidłowy
  diagnostyczny kontekst śladu, co pozwala procesorom logów łączyć lokalne wiersze logów z
  wyeksportowanymi spanami.
- **Korelacja żądań:** żądania HTTP Gateway i ramki WebSocket tworzą
  wewnętrzny zakres śladu żądania. Logi i zdarzenia diagnostyczne w tym zakresie
  domyślnie dziedziczą ślad żądania, a spany uruchomień agenta i wywołań modelu są
  tworzone jako podrzędne, aby nagłówki `traceparent` dostawcy pozostały w tym samym śladzie.
- **Korelacja wywołań modelu:** spany `openclaw.model.call` domyślnie zawierają bezpieczne rozmiary
  komponentów promptu i zawierają atrybuty tokenów dla poszczególnych wywołań, gdy
  wynik dostawcy udostępnia użycie. `openclaw.model.usage` pozostaje spanem rozliczeniowym
  poziomu uruchomienia dla zagregowanego kosztu, kontekstu i pulpitów kanałów; pozostaje
  w tym samym śladzie diagnostycznym, gdy emitujące środowisko uruchomieniowe ma zaufany kontekst śladu.

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
- `openclaw.model_call.response_bytes` (histogram, rozmiar w bajtach UTF-8 ładunków fragmentów strumieniowanej odpowiedzi; delty tekstu, myślenia i wywołań narzędzi o wysokiej częstotliwości liczą tylko przyrostowe bajty `delta`; bez surowej treści odpowiedzi)
- `openclaw.model_call.time_to_first_byte_ms` (histogram, czas, który upłynął przed pierwszym zdarzeniem strumieniowanej odpowiedzi)
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
- `openclaw.session.stuck` (licznik, atrybuty: `openclaw.state`; emitowane dla możliwej do odzyskania przestarzałej ewidencji sesji)
- `openclaw.session.stuck_age_ms` (histogram, atrybuty: `openclaw.state`; emitowane dla możliwej do odzyskania przestarzałej ewidencji sesji)
- `openclaw.session.turn.created` (licznik, atrybuty: `openclaw.agent`, `openclaw.channel`, `openclaw.trigger`)
- `openclaw.session.recovery.requested` (licznik, atrybuty: `openclaw.state`, `openclaw.action`, `openclaw.active_work_kind`, `openclaw.reason`)
- `openclaw.session.recovery.completed` (licznik, atrybuty: `openclaw.state`, `openclaw.action`, `openclaw.status`, `openclaw.active_work_kind`, `openclaw.reason`)
- `openclaw.session.recovery.age_ms` (histogram, atrybuty: takie same jak odpowiadający licznik odzyskiwania)
- `openclaw.run.attempt` (licznik, atrybuty: `openclaw.attempt`)

### Telemetria żywotności sesji

`diagnostics.stuckSessionWarnMs` to próg wieku bez postępu dla diagnostyki
żywotności sesji. Sesja `processing` nie starzeje się względem tego progu,
gdy OpenClaw obserwuje postęp odpowiedzi, narzędzia, statusu, bloku lub środowiska uruchomieniowego ACP.
Sygnały utrzymujące pisanie nie są liczone jako postęp, więc cichy model lub harness może
nadal zostać wykryty.

OpenClaw klasyfikuje sesje według pracy, którą nadal może obserwować:

- `session.long_running`: aktywna praca osadzona, wywołania modelu lub wywołania narzędzi
  nadal robią postęp. Własne wywołania modelu, które pozostają ciche po przekroczeniu
  `diagnostics.stuckSessionWarnMs`, również zgłaszają się jako długotrwałe przed
  `diagnostics.stuckSessionAbortMs`, aby wolni lub niestrumieniujący dostawcy modeli
  nie wyglądali jak zablokowane sesje Gateway, dopóki pozostają możliwe do przerwania.
- `session.stalled`: aktywna praca istnieje, ale aktywne uruchomienie nie zgłosiło
  ostatniego postępu. Własne wywołania modelu przełączają się z `session.long_running` na
  `session.stalled` w momencie lub po `diagnostics.stuckSessionAbortMs`; przestarzała
  aktywność modelu/narzędzia bez właściciela nie jest traktowana jako nieszkodliwa praca długotrwała.
  Zablokowane uruchomienia osadzone początkowo pozostają tylko obserwowane, a następnie są przerywane i opróżniane po
  `diagnostics.stuckSessionAbortMs` bez postępu, aby zakolejkowane tury za daną
  ścieżką mogły zostać wznowione. Gdy nie ustawiono, próg przerwania domyślnie przyjmuje bezpieczniejsze
  wydłużone okno co najmniej 5 minut i 3x
  `diagnostics.stuckSessionWarnMs`.
- `session.stuck`: przestarzała ewidencja sesji bez aktywnej pracy albo bezczynna
  zakolejkowana sesja z przestarzałą aktywnością modelu/narzędzia bez właściciela. To zwalnia
  dotkniętą ścieżkę sesji natychmiast po przejściu bramek odzyskiwania.

Odzyskiwanie emituje strukturalne zdarzenia `session.recovery.requested` i
`session.recovery.completed`. Diagnostyczny stan sesji jest oznaczany jako bezczynny
dopiero po mutującym wyniku odzyskiwania (`aborted` lub `released`) i tylko wtedy, gdy
ta sama generacja przetwarzania jest nadal aktualna.

Tylko `session.stuck` emituje licznik `openclaw.session.stuck`,
histogram `openclaw.session.stuck_age_ms` i span `openclaw.session.stuck`.
Powtarzane diagnostyki `session.stuck` wycofują się, dopóki sesja pozostaje
niezmieniona, więc pulpity powinny alarmować na podstawie utrzymujących się wzrostów, a nie każdego
taktu Heartbeat. Pokrętło konfiguracji i wartości domyślne opisuje
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
  - Domyślnie `gen_ai.system` albo `gen_ai.provider.name`, gdy włączono najnowsze konwencje semantyczne GenAI
  - `gen_ai.request.model`, `gen_ai.operation.name`, `gen_ai.usage.*`
- `openclaw.run`
  - `openclaw.outcome`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.errorCategory`
- `openclaw.model.call`
  - Domyślnie `gen_ai.system` albo `gen_ai.provider.name`, gdy włączono najnowsze konwencje semantyczne GenAI
  - `gen_ai.request.model`, `gen_ai.operation.name`, `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`
  - `openclaw.errorCategory` oraz opcjonalnie `openclaw.failureKind` przy błędach
  - `openclaw.model_call.request_bytes`, `openclaw.model_call.response_bytes`, `openclaw.model_call.time_to_first_byte_ms`
  - `openclaw.model_call.prompt.input_messages_count`, `openclaw.model_call.prompt.input_messages_chars`, `openclaw.model_call.prompt.system_prompt_chars`, `openclaw.model_call.prompt.tool_definitions_count`, `openclaw.model_call.prompt.tool_definitions_chars`, `openclaw.model_call.prompt.total_chars` (tylko bezpieczne rozmiary komponentów, bez tekstu promptu)
  - `openclaw.model_call.usage.*` oraz `gen_ai.usage.*`, gdy wynik wywołania modelu zawiera użycie dostawcy dla tego konkretnego wywołania
  - `openclaw.provider.request_id_hash` (ograniczony hash oparty na SHA identyfikatora żądania dostawcy upstream; surowe identyfikatory nie są eksportowane)
  - Przy `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental` spany wywołań modelu używają najnowszej nazwy spanu wnioskowania GenAI `{gen_ai.operation.name} {gen_ai.request.model}` oraz rodzaju spanu `CLIENT` zamiast `openclaw.model.call`.
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
  - `openclaw.prompt.size`, `openclaw.history.size`, `openclaw.context.tokens`, `openclaw.errorCategory` (bez zawartości promptu, historii, odpowiedzi ani klucza sesji)
- `openclaw.tool.loop`
  - `openclaw.toolName`, `openclaw.outcome`, `openclaw.iterations`, `openclaw.errorCategory` (bez komunikatów pętli, parametrów ani wyniku narzędzia)
- `openclaw.memory.pressure`
  - `openclaw.memory.level`, `openclaw.memory.heap_used_bytes`, `openclaw.memory.rss_bytes`

Gdy przechwytywanie treści jest jawnie włączone, spany modelu i narzędzi mogą także zawierać ograniczone, zredagowane atrybuty `openclaw.content.*` dla konkretnych klas treści, które wybrano.

## Katalog zdarzeń diagnostycznych

Poniższe zdarzenia wspierają powyższe metryki i spany. Pluginy mogą też subskrybować je bezpośrednio bez eksportu OTLP.

**Użycie modelu**

- `model.usage` - tokeny, koszt, czas trwania, kontekst, dostawca/model/kanał,
  identyfikatory sesji. `usage` to rozliczanie dostawcy/tury na potrzeby kosztów i telemetrii;
  `context.used` to bieżący zrzut promptu/kontekstu i może być niższy niż
  `usage.total` dostawcy, gdy używane są buforowane dane wejściowe lub wywołania pętli narzędzi.

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
  cykl życia pojedynczego uruchomienia harnessu agenta. Zawiera `harnessId`, opcjonalnie
  `pluginId`, dostawcę/model/kanał oraz identyfikator uruchomienia. Ukończenie dodaje
  `durationMs`, `outcome`, opcjonalnie `resultClassification`, `yieldDetected`
  oraz liczniki `itemLifecycle`. Błędy dodają `phase`
  (`prepare`/`start`/`send`/`resolve`/`cleanup`), `errorCategory` oraz
  opcjonalnie `cleanupFailed`.

**Exec**

- `exec.process.completed` - końcowy wynik, czas trwania, cel, tryb, kod wyjścia
  oraz rodzaj niepowodzenia. Tekst polecenia i katalogi robocze nie są
  uwzględniane.
- `exec.approval.followup_suppressed` - odrzucona nieaktualna kontynuacja zatwierdzenia po
  odbiciu sesji. Zawiera `approvalId`, `reason` (`session_rebound`),
  `phase` (`direct_delivery` lub `gateway_preflight`) oraz znacznik czasu dyspozytora.
  Klucze sesji, trasy i tekst polecenia nie są uwzględniane.

## Bez eksportera

Możesz utrzymać zdarzenia diagnostyczne dostępne dla Pluginów lub niestandardowych odbiorników bez
uruchamiania `diagnostics-otel`:

```json5
{
  diagnostics: { enabled: true },
}
```

Aby uzyskać ukierunkowane dane debugowania bez podnoszenia `logging.level`, użyj flag diagnostycznych. Flagi nie rozróżniają wielkości liter i obsługują symbole wieloznaczne (np. `telegram.*` lub
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

- [Logowanie](/pl/logging) - dzienniki plikowe, wyjście konsoli, śledzenie z CLI oraz karta Logs w Control UI
- [Wewnętrzne mechanizmy logowania Gateway](/pl/gateway/logging) - style logów WS, prefiksy podsystemów i przechwytywanie konsoli
- [Flagi diagnostyczne](/pl/diagnostics/flags) - ukierunkowane flagi dzienników debugowania
- [Eksport diagnostyki](/pl/gateway/diagnostics) - narzędzie pakietu wsparcia dla operatora (oddzielne od eksportu OTEL)
- [Dokumentacja konfiguracji](/pl/gateway/configuration-reference#diagnostics) - pełna dokumentacja pól `diagnostics.*`

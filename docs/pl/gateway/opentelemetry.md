---
read_when:
    - Chcesz wysyłać metryki użycia modeli OpenClaw, przepływu wiadomości lub sesji do kolektora OpenTelemetry
    - Podłączasz ślady, metryki lub dzienniki do Grafany, Datadog, Honeycomb, New Relic, Tempo albo innego backendu OTLP
    - Potrzebujesz dokładnych nazw metryk, nazw spanów lub struktur atrybutów, aby tworzyć pulpity nawigacyjne lub alerty
summary: Eksportuj dane diagnostyczne OpenClaw do kolektorów OpenTelemetry lub jako JSONL na standardowe wyjście za pomocą pluginu diagnostics-otel
title: Eksport OpenTelemetry
x-i18n:
    generated_at: "2026-07-12T15:09:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d3f8a1b9e253000272def0fbd361cd311f6645b1aac5a6f06cff014b45e82388
    source_path: gateway/opentelemetry.md
    workflow: 16
---

OpenClaw eksportuje dane diagnostyczne za pośrednictwem oficjalnego pluginu `diagnostics-otel`
przy użyciu protokołu **OTLP/HTTP (protobuf)**. Logi mogą być również zapisywane jako JSONL na standardowe wyjście dla
potoków logów kontenerów i piaskownic. Każdy kolektor lub system zaplecza obsługujący
OTLP/HTTP działa bez zmian w kodzie. Informacje o lokalnych plikach logów znajdują się w sekcji
[Logowanie](/pl/logging).

- **Zdarzenia diagnostyczne** to ustrukturyzowane rekordy wewnątrzprocesowe emitowane przez
  Gateway i dołączone pluginy dla uruchomień modeli, przepływu wiadomości, sesji, kolejek
  i wykonywania poleceń.
- **`diagnostics-otel`** subskrybuje te zdarzenia i eksportuje je jako
  **metryki**, **ślady** oraz **logi** OpenTelemetry przez OTLP/HTTP, a także może
  odzwierciedlać rekordy logów jako JSONL na standardowym wyjściu.
- **Wywołania dostawców** otrzymują nagłówek W3C `traceparent` z zaufanego kontekstu
  zakresu wywołania modelu OpenClaw, gdy transport dostawcy obsługuje niestandardowe
  nagłówki. Kontekst śledzenia emitowany przez plugin nie jest propagowany.
- Eksportery są dołączane tylko wtedy, gdy włączono zarówno warstwę diagnostyczną, jak i plugin,
  dzięki czemu domyślny koszt wewnątrz procesu pozostaje bliski zeru.

## Szybki start

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

Plugin można również włączyć z poziomu CLI: `openclaw plugins enable diagnostics-otel`.

<Note>
`protocol` obsługuje wyłącznie `http/protobuf`. Ponieważ opcje `traces` i `metrics` są domyślnie włączone, każda inna wartość (w tym `grpc`) przerywa całą subskrypcję diagnostics-otel z ostrzeżeniem `unsupported protocol` — zatrzymuje to również eksport logów JSONL na standardowe wyjście. Ustaw jawnie `traces: false` i `metrics: false`, jeśli chcesz używać tylko `logsExporter: "stdout"` z wartością protokołu inną niż OTLP.
</Note>

## Eksportowane sygnały

| Sygnał      | Zawartość                                                                                                                                                                                              |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Metryki** | Liczniki/histogramy użycia tokenów, kosztów, czasu trwania uruchomień, przełączania awaryjnego, użycia Skills, przepływu wiadomości, zdarzeń Talk, torów kolejek, stanu/odzyskiwania sesji, wykonywania narzędzi i poleceń, pamięci, żywotności oraz kondycji eksportera. |
| **Ślady**  | Zakresy użycia modeli, wywołań modeli, cyklu życia mechanizmu wykonawczego, użycia Skills, wykonywania narzędzi i poleceń, przetwarzania webhooków/wiadomości, składania kontekstu oraz pętli narzędzi.                                                      |
| **Logi**    | Ustrukturyzowane rekordy `logging.file` eksportowane przez OTLP lub jako JSONL na standardowe wyjście, gdy włączono `diagnostics.otel.logs`; treść logów jest pomijana, chyba że jawnie włączono przechwytywanie zawartości.                          |

Opcje `traces`, `metrics` i `logs` można przełączać niezależnie. Ślady i metryki
są domyślnie włączone, gdy `diagnostics.otel.enabled` ma wartość `true`; logi są domyślnie wyłączone
i eksportowane tylko wtedy, gdy `diagnostics.otel.logs` ma jawnie wartość `true`. Eksport logów
domyślnie korzysta z OTLP; ustaw `diagnostics.otel.logsExporter` na `stdout`, aby zapisywać JSONL na
standardowe wyjście, lub na `both`, aby używać obu metod.

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
      protocol: "http/protobuf", // grpc wyłącza eksport OTLP
      serviceName: "openclaw-gateway", // brak ustawienia powoduje użycie OTEL_SERVICE_NAME, a następnie "openclaw"
      headers: { "x-collector-token": "..." },
      traces: true,
      metrics: true,
      logs: true,
      logsExporter: "otlp", // otlp | stdout | both
      sampleRate: 0.2, // próbnik zakresów głównych, 0.0..1.0
      flushIntervalMs: 60000, // interwał eksportu metryk (min. 1000 ms)
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

| Zmienna                                                                                                          | Przeznaczenie                                                                                                                                                                                                                                                                                                        |
| ----------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OTEL_EXPORTER_OTLP_ENDPOINT`                                                                                     | Wartość zastępcza dla `diagnostics.otel.endpoint`, gdy klucz konfiguracji nie jest ustawiony.                                                                                                                                                                                                                                         |
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` / `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` / `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | Wartości zastępcze punktów końcowych poszczególnych sygnałów, używane, gdy odpowiadający klucz konfiguracji `diagnostics.otel.*Endpoint` nie jest ustawiony. Konfiguracja właściwa dla sygnału ma pierwszeństwo przed zmienną środowiskową właściwą dla sygnału, a ta ma pierwszeństwo przed wspólnym punktem końcowym.                                                                                                         |
| `OTEL_SERVICE_NAME`                                                                                               | Wartość zastępcza dla `diagnostics.otel.serviceName`, gdy klucz konfiguracji nie jest ustawiony. Domyślna nazwa usługi to `openclaw`.                                                                                                                                                                                                  |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                                                                                     | Wartość zastępcza protokołu transmisji, gdy `diagnostics.otel.protocol` nie jest ustawiony. Eksport jest włączany wyłącznie przez `http/protobuf`.                                                                                                                                                                                                 |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                                                                                   | Ustaw na `gen_ai_latest_experimental`, aby emitować najnowszą strukturę zakresu wnioskowania GenAI: nazwy zakresów `{gen_ai.operation.name} {gen_ai.request.model}`, rodzaj zakresu `CLIENT` oraz `gen_ai.provider.name` zamiast starszego `gen_ai.system`. Metryki GenAI zawsze używają ograniczonych atrybutów o niskiej kardynalności. |
| `OPENCLAW_OTEL_PRELOADED`                                                                                         | Ustaw na `1`, gdy inny moduł wstępnego ładowania lub proces hosta zarejestrował już globalny zestaw SDK OpenTelemetry. Plugin pomija wtedy własny cykl życia NodeSDK, ale nadal podłącza nasłuchiwacze diagnostyczne i uwzględnia ustawienia `traces`/`metrics`/`logs`.                                                                                    |

## Prywatność i przechwytywanie zawartości

Surowa zawartość modelu/narzędzi **nie** jest domyślnie eksportowana. Zakresy zawierają ograniczone
identyfikatory (kanał, dostawca, model, kategoria błędu, identyfikatory żądań wyłącznie w postaci skrótów,
źródło narzędzia, właściciel narzędzia, nazwa/źródło Skills) i nigdy nie zawierają tekstu polecenia,
tekstu odpowiedzi, danych wejściowych narzędzi, danych wyjściowych narzędzi, ścieżek plików Skills ani kluczy sesji.
Wartości wyglądające jak klucze sesji agenta z zakresem (na przykład zaczynające się od
`agent:`) są zastępowane wartością `unknown` w atrybutach o niskiej kardynalności. Rekordy logów OTLP
domyślnie zachowują poziom ważności, rejestrator, położenie w kodzie, zaufany kontekst śledzenia oraz
oczyszczone atrybuty; surowa treść komunikatu logu jest eksportowana tylko
wtedy, gdy `diagnostics.otel.captureContent` ma wartość logiczną `true`. Szczegółowe
podklucze `captureContent.*` nigdy nie włączają treści logów. Metryki Talk eksportują wyłącznie
ograniczone metadane zdarzeń (tryb, transport, dostawca, typ zdarzenia) — bez
transkrypcji, danych audio, identyfikatorów sesji, identyfikatorów tur, identyfikatorów połączeń, identyfikatorów pokojów ani
tokenów przekazania.

Wychodzące żądania do modeli mogą zawierać nagłówek W3C `traceparent` wygenerowany wyłącznie
z kontekstu śledzenia diagnostycznego należącego do OpenClaw dla aktywnego wywołania modelu.
Istniejące nagłówki `traceparent` dostarczone przez wywołującego są zastępowane, dlatego pluginy ani
niestandardowe opcje dostawców nie mogą fałszować pochodzenia śladu między usługami.

Ustaw `diagnostics.otel.captureContent.*` na `true` tylko wtedy, gdy kolektor
i zasady przechowywania są zatwierdzone do obsługi tekstu poleceń, odpowiedzi, narzędzi lub
polecenia systemowego. Każdy podklucz jest niezależny:

- `inputMessages` — zawartość polecenia użytkownika.
- `outputMessages` — zawartość odpowiedzi modelu.
- `toolInputs` — dane argumentów narzędzia.
- `toolOutputs` — dane wyników narzędzia.
- `systemPrompt` — złożone polecenie systemowe/deweloperskie.
- `toolDefinitions` — nazwy, opisy i schematy narzędzi modelu.

Gdy dowolny podklucz jest włączony, zakresy modelu i narzędzi otrzymują ograniczone, zredagowane
atrybuty `openclaw.content.*` wyłącznie dla tej klasy.

<Note>
Wartość logiczna `captureContent: true` włącza jednocześnie `inputMessages`, `outputMessages`, `toolInputs`, `toolOutputs`, `toolDefinitions` oraz treści logów OTLP, ale **nie** `systemPrompt` — ustaw jawnie `captureContent.systemPrompt: true`, jeśli potrzebujesz również złożonego polecenia systemowego.
</Note>

Zawartość `toolInputs`/`toolOutputs` jest przechwytywana dla wykonań narzędzi przez
wbudowane środowisko uruchomieniowe agenta (`openclaw.content.tool_input` i
`gen_ai.tool.call.arguments` w zakresach zakończonych/błędnych;
`openclaw.content.tool_output` i `gen_ai.tool.call.result` w zakończonych
zakresach). Nazwy `openclaw.content.*` pozostają stabilnymi nazwami atrybutów
OpenClaw; kopie `gen_ai.tool.call.*` odzwierciedlają je na potrzeby przeglądarek natywnie obsługujących konwencje semantyczne.
Wywołania narzędzi zewnętrznych mechanizmów wykonawczych (Codex, Claude CLI) emitują
zakresy `tool.execution.*` bez danych zawartości. Przechwycona zawartość jest przesyłana
zaufanym kanałem dostępnym wyłącznie dla nasłuchiwaczy i nigdy nie trafia do publicznej magistrali
zdarzeń diagnostycznych.

## Próbkowanie i opróżnianie buforów

- **Ślady:** `diagnostics.otel.sampleRate` ustawia `TraceIdRatioBasedSampler`
  wyłącznie dla głównego zakresu (`0.0` odrzuca wszystkie, `1.0` zachowuje wszystkie). Brak ustawienia powoduje użycie
  wartości domyślnej zestawu SDK OpenTelemetry (zawsze włączone).
- **Metryki:** `diagnostics.otel.flushIntervalMs` (ograniczone do minimum
  `1000`); brak ustawienia powoduje użycie domyślnego okresu eksportu zestawu SDK.
- **Dzienniki:** dzienniki OTLP respektują `logging.level` (poziom dziennika plikowego) i korzystają ze
  ścieżki redagowania diagnostycznych rekordów dziennika, a nie z formatowania konsoli. Instalacje generujące duże ilości danych
  powinny preferować próbkowanie/filtrowanie w kolektorze OTLP zamiast próbkowania
  lokalnego. Ustaw `diagnostics.otel.logsExporter: "stdout"`, gdy platforma
  już przesyła stdout/stderr do procesora dzienników i nie masz kolektora dzienników
  OTLP. Rekordy stdout mają postać jednego obiektu JSON w każdym wierszu i zawierają `ts`, `signal`,
  `service.name`, poziom ważności, treść, zredagowane atrybuty oraz zaufane pola śladu,
  jeśli są dostępne.
- **Korelacja dzienników plikowych:** dzienniki plikowe JSONL zawierają pola najwyższego poziomu `traceId`,
  `spanId`, `parentSpanId` i `traceFlags`, gdy wywołanie rejestrowania zawiera prawidłowy
  kontekst śladu diagnostycznego, co pozwala procesorom dzienników łączyć lokalne wiersze dziennika z
  wyeksportowanymi zakresami.
- **Korelacja żądań:** żądania HTTP Gateway i ramki WebSocket tworzą
  wewnętrzny zakres śladu żądania. Dzienniki i zdarzenia diagnostyczne wewnątrz tego
  zakresu domyślnie dziedziczą ślad żądania, natomiast zakresy przebiegów agenta i wywołań modelu
  są tworzone jako podrzędne, dzięki czemu nagłówki `traceparent` dostawcy pozostają w tym
  samym śladzie.
- **Korelacja wywołań modelu:** zakresy `openclaw.model.call` domyślnie zawierają bezpieczne rozmiary
  składników promptu oraz atrybuty tokenów poszczególnych wywołań, gdy wynik dostawcy
  udostępnia dane o użyciu. `openclaw.model.usage` pozostaje zakresem rozliczeniowym
  na poziomie przebiegu dla zagregowanych kosztów, kontekstu i paneli kanałów oraz
  pozostaje w tym samym śladzie diagnostycznym, gdy środowisko wykonawcze emitujące dane ma zaufany
  kontekst śladu.

## Eksportowane metryki

### Użycie modelu

- `openclaw.tokens` (licznik, atrybuty: `openclaw.token`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.agent`)
- `openclaw.cost.usd` (licznik, atrybuty: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.run.duration_ms` (histogram, atrybuty: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.context.tokens` (histogram, atrybuty: `openclaw.context`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `gen_ai.client.token.usage` (histogram, metryka konwencji semantycznych GenAI, atrybuty: `gen_ai.token.type` = `input`/`output`, `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`)
- `gen_ai.client.operation.duration` (histogram, sekundy, metryka konwencji semantycznych GenAI, atrybuty: `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`, opcjonalnie `error.type`)
- `openclaw.model_call.duration_ms` (histogram, atrybuty: `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport` oraz `openclaw.errorCategory` i `openclaw.failureKind` w przypadku sklasyfikowanych błędów)
- `openclaw.model_call.request_bytes` (histogram, rozmiar w bajtach UTF-8 końcowego ładunku żądania modelu; bez surowej zawartości ładunku)
- `openclaw.model_call.response_bytes` (histogram, rozmiar w bajtach UTF-8 ładunków fragmentów strumieniowanej odpowiedzi; częste przyrosty tekstu, rozumowania i wywołań narzędzi uwzględniają tylko przyrostowe bajty `delta`; bez surowej zawartości odpowiedzi)
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

### Rozmowa

- `openclaw.talk.event` (licznik, atrybuty: `openclaw.talk.event_type`, `openclaw.talk.mode`, `openclaw.talk.transport`, `openclaw.talk.brain`, `openclaw.talk.provider`)
- `openclaw.talk.event.duration_ms` (histogram, atrybuty: takie same jak `openclaw.talk.event`; emitowany, gdy zdarzenie rozmowy zgłasza czas trwania)
- `openclaw.talk.audio.bytes` (histogram, atrybuty: takie same jak `openclaw.talk.event`; emitowany dla zdarzeń ramek dźwiękowych rozmowy, które zgłaszają długość w bajtach)

### Kolejki i sesje

- `openclaw.queue.lane.enqueue` (licznik, atrybuty: `openclaw.lane`)
- `openclaw.queue.lane.dequeue` (licznik, atrybuty: `openclaw.lane`)
- `openclaw.queue.depth` (histogram, atrybuty: `openclaw.lane` lub `openclaw.channel=heartbeat`)
- `openclaw.queue.wait_ms` (histogram, atrybuty: `openclaw.lane`)
- `openclaw.session.state` (licznik, atrybuty: `openclaw.state`, `openclaw.reason`)
- `openclaw.session.stuck` (licznik, atrybuty: `openclaw.state`; emitowany dla możliwej do odzyskania nieaktualnej ewidencji sesji)
- `openclaw.session.stuck_age_ms` (histogram, atrybuty: `openclaw.state`; emitowany dla możliwej do odzyskania nieaktualnej ewidencji sesji)
- `openclaw.session.turn.created` (licznik, atrybuty: `openclaw.agent`, `openclaw.channel`, `openclaw.trigger`)
- `openclaw.session.recovery.requested` (licznik, atrybuty: `openclaw.state`, `openclaw.action`, `openclaw.active_work_kind`, `openclaw.reason`)
- `openclaw.session.recovery.completed` (licznik, atrybuty: `openclaw.state`, `openclaw.action`, `openclaw.status`, `openclaw.active_work_kind`, `openclaw.reason`)
- `openclaw.session.recovery.age_ms` (histogram, atrybuty: takie same jak w odpowiednim liczniku odzyskiwania)
- `openclaw.run.attempt` (licznik, atrybuty: `openclaw.attempt`)

### Telemetria żywotności sesji

`diagnostics.stuckSessionWarnMs` to próg czasu bez postępu używany w diagnostyce
żywotności sesji. Sesja `processing` nie zbliża się do tego
progu, dopóki OpenClaw obserwuje postęp odpowiedzi, narzędzia, stanu, bloku lub środowiska wykonawczego
ACP. Sygnały podtrzymania pisania nie są uznawane za postęp, dlatego nadal można wykryć
milczący model lub mechanizm wykonawczy.

OpenClaw klasyfikuje sesje na podstawie pracy, którą nadal może obserwować:

- `session.long_running`: aktywna praca osadzona, wywołania modelu lub wywołania narzędzi
  nadal postępują. Wywołania modelu z przypisanym właścicielem, które pozostają bez odpowiedzi po przekroczeniu
  `diagnostics.stuckSessionWarnMs`, również są zgłaszane jako długotrwałe przed osiągnięciem
  `diagnostics.stuckSessionAbortMs`, dzięki czemu wolni lub niestrumieniujący dostawcy modeli
  nie wyglądają jak zablokowane sesje Gateway, dopóki można obserwować możliwość przerwania.
- `session.stalled`: istnieje aktywna praca, ale aktywny przebieg nie zgłosił
  ostatnio postępu. Wywołania modelu z przypisanym właścicielem przechodzą z `session.long_running` do
  `session.stalled` po osiągnięciu lub przekroczeniu `diagnostics.stuckSessionAbortMs`; nieaktualna
  aktywność modelu/narzędzia bez właściciela nie jest traktowana jako nieszkodliwa długotrwała praca.
  Zablokowane przebiegi osadzone są początkowo tylko obserwowane, a następnie przerywane i opróżniane po
  `diagnostics.stuckSessionAbortMs` bez postępu, aby oczekujące za nimi tury
  w danym torze mogły zostać wznowione. W przypadku braku ustawienia próg przerwania domyślnie przyjmuje bezpieczniejsze
  wydłużone okno wynoszące co najmniej 5 minut i trzykrotność
  `diagnostics.stuckSessionWarnMs`.
- `session.stuck`: nieaktualna ewidencja sesji bez aktywnej pracy albo bezczynna
  sesja w kolejce z nieaktualną aktywnością modelu/narzędzia bez właściciela. Powoduje to zwolnienie
  odpowiedniego toru sesji natychmiast po pomyślnym przejściu bramek odzyskiwania.

Odzyskiwanie emituje ustrukturyzowane zdarzenia `session.recovery.requested` i
`session.recovery.completed`. Diagnostyczny stan sesji jest oznaczany jako bezczynny
dopiero po wyniku odzyskiwania powodującym zmianę (`aborted` lub `released`) i tylko wtedy,
gdy ta sama generacja przetwarzania jest nadal bieżąca.

Tylko `session.stuck` emituje licznik `openclaw.session.stuck`,
histogram `openclaw.session.stuck_age_ms` i zakres `openclaw.session.stuck`.
Powtarzające się diagnostyki `session.stuck` stosują coraz dłuższe odstępy, dopóki sesja pozostaje
niezmieniona, dlatego panele powinny alarmować o utrzymujących się wzrostach, a nie o
każdym takcie Heartbeat. Opis opcji konfiguracji i wartości domyślnych znajduje się w
[Dokumentacji konfiguracji](/pl/gateway/configuration-reference#diagnostics).

Ostrzeżenia dotyczące żywotności emitują również:

- `openclaw.liveness.warning` (licznik, atrybuty: `openclaw.liveness.reason`)
- `openclaw.liveness.event_loop_delay_p99_ms` (histogram, atrybuty: `openclaw.liveness.reason`)
- `openclaw.liveness.event_loop_delay_max_ms` (histogram, atrybuty: `openclaw.liveness.reason`)
- `openclaw.liveness.event_loop_utilization` (histogram, atrybuty: `openclaw.liveness.reason`)
- `openclaw.liveness.cpu_core_ratio` (histogram, atrybuty: `openclaw.liveness.reason`)

### Cykl życia mechanizmu wykonawczego

- `openclaw.harness.duration_ms` (histogram, atrybuty: `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.harness.phase` w przypadku błędów)

### Wykonywanie narzędzi i wykrywanie pętli

- `openclaw.tool.execution.duration_ms` (histogram, atrybuty: `gen_ai.tool.name`, `openclaw.toolName`, `openclaw.tool.source`, `openclaw.tool.owner`, `openclaw.tool.params.kind` oraz `openclaw.errorCategory` w przypadku błędów)
- `openclaw.tool.execution.blocked` (licznik, atrybuty: `gen_ai.tool.name`, `openclaw.toolName`, `openclaw.tool.source`, `openclaw.tool.owner`, `openclaw.tool.params.kind`, `openclaw.deniedReason`)
- `openclaw.tool.loop` (licznik, atrybuty: `openclaw.toolName`, `openclaw.loop.level`, `openclaw.loop.action`, `openclaw.loop.detector`, `openclaw.loop.count`, opcjonalnie `openclaw.loop.paired_tool`; emitowany po wykryciu powtarzalnej pętli wywołań narzędzi)

### Exec

- `openclaw.exec.duration_ms` (histogram, atrybuty: `openclaw.exec.target`, `openclaw.exec.mode`, `openclaw.outcome`, `openclaw.failureKind`)

### Wewnętrzne elementy diagnostyki (pamięć, ładunki, stan eksporterów)

- `openclaw.payload.large` (licznik, atrybuty: `openclaw.payload.surface`, `openclaw.payload.action`, `openclaw.channel`, `openclaw.plugin`, `openclaw.reason`)
- `openclaw.payload.large_bytes` (histogram, atrybuty: takie same jak `openclaw.payload.large`)
- `openclaw.memory.rss_bytes` / `openclaw.memory.heap_used_bytes` / `openclaw.memory.heap_total_bytes` / `openclaw.memory.external_bytes` / `openclaw.memory.array_buffers_bytes` (histogramy, bez atrybutów; próbki pamięci procesu)
- `openclaw.memory.pressure` (licznik, atrybuty: `openclaw.memory.level`, `openclaw.memory.reason`)
- `openclaw.diagnostic.async_queue.dropped` (licznik, atrybuty: `openclaw.diagnostic.async_queue.drop_class`; odrzucenia spowodowane przeciążeniem wewnętrznej kolejki diagnostycznej)
- `openclaw.telemetry.exporter.events` (licznik, atrybuty: `openclaw.exporter`, `openclaw.signal`, `openclaw.status`, opcjonalnie `openclaw.reason`, opcjonalnie `openclaw.errorCategory`; samotelemetria cyklu życia i awarii eksportera)

## Eksportowane zakresy

- `openclaw.model.usage`
  - `openclaw.channel`, `openclaw.provider`, `openclaw.model`
  - `openclaw.tokens.*` (input/output/cache_read/cache_write/total)
  - domyślnie `gen_ai.system` lub `gen_ai.provider.name`, gdy włączono najnowsze konwencje semantyczne GenAI
  - `gen_ai.request.model`, `gen_ai.operation.name`, `gen_ai.usage.*`
- `openclaw.run`
  - `openclaw.outcome`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.errorCategory`
- `openclaw.model.call`
  - domyślnie `gen_ai.system` lub `gen_ai.provider.name`, gdy włączono najnowsze konwencje semantyczne GenAI
  - `gen_ai.request.model`, `gen_ai.operation.name`, `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`
  - `openclaw.errorCategory`, `error.type` oraz opcjonalnie `openclaw.failureKind` w przypadku błędów
  - `openclaw.model_call.request_bytes`, `openclaw.model_call.response_bytes`, `openclaw.model_call.time_to_first_byte_ms`
  - `openclaw.model_call.prompt.input_messages_count`, `openclaw.model_call.prompt.input_messages_chars`, `openclaw.model_call.prompt.system_prompt_chars`, `openclaw.model_call.prompt.tool_definitions_count`, `openclaw.model_call.prompt.tool_definitions_chars`, `openclaw.model_call.prompt.total_chars` (wyłącznie bezpieczne rozmiary składników, bez tekstu promptu)
  - `openclaw.model_call.usage.*` oraz `gen_ai.usage.*`, gdy wynik wywołania modelu zawiera dane użycia dostawcy dotyczące tego konkretnego wywołania
  - Zdarzenie zakresu `openclaw.provider.request` z atrybutem `openclaw.upstreamRequestIdHash` (o ograniczonym rozmiarze, opartym na skrócie), gdy wynik od dostawcy nadrzędnego udostępnia identyfikator żądania; nieprzetworzone identyfikatory nigdy nie są eksportowane
  - Przy `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental` zakresy wywołań modelu używają najnowszej nazwy zakresu wnioskowania GenAI `{gen_ai.operation.name} {gen_ai.request.model}` oraz rodzaju zakresu `CLIENT` zamiast `openclaw.model.call`.
- `openclaw.harness.run`
  - `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.provider`, `openclaw.model`, `openclaw.channel`
  - Po zakończeniu: `openclaw.harness.result_classification`, `openclaw.harness.yield_detected`, `openclaw.harness.items.started`, `openclaw.harness.items.completed`, `openclaw.harness.items.active`
  - W przypadku błędu: `openclaw.harness.phase`, `openclaw.errorCategory`, opcjonalnie `openclaw.harness.cleanup_failed`
- `openclaw.tool.execution`
  - `gen_ai.tool.name`, `gen_ai.operation.name` (`execute_tool`), `openclaw.toolName`, `openclaw.tool.source`, opcjonalnie `gen_ai.tool.call.id`, `openclaw.tool.owner`, `openclaw.tool.params.*`
  - Opcjonalnie `openclaw.errorCategory`/`openclaw.errorCode` w przypadku błędów oraz `openclaw.deniedReason` i `openclaw.outcome=blocked`, gdy odmowa wynika z zasad lub piaskownicy
- `openclaw.exec`
  - `openclaw.exec.target`, `openclaw.exec.mode`, `openclaw.outcome`, `openclaw.failureKind`, `openclaw.exec.command_length`, `openclaw.exec.exit_code`, `openclaw.exec.exit_signal`, `openclaw.exec.timed_out`
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
  - `openclaw.toolName`, `openclaw.loop.level`, `openclaw.loop.action`, `openclaw.loop.detector`, `openclaw.loop.count`, opcjonalnie `openclaw.loop.paired_tool` (bez komunikatów pętli, parametrów ani danych wyjściowych narzędzia)
- `openclaw.memory.pressure`
  - `openclaw.memory.level`, `openclaw.memory.reason`, `openclaw.memory.rss_bytes`, `openclaw.memory.heap_used_bytes`, `openclaw.memory.heap_total_bytes`, `openclaw.memory.external_bytes`, `openclaw.memory.array_buffers_bytes`, opcjonalnie `openclaw.memory.threshold_bytes`/`openclaw.memory.rss_growth_bytes`/`openclaw.memory.window_ms`

Gdy przechwytywanie zawartości jest jawnie włączone, zakresy modelu i narzędzi mogą również
zawierać ograniczone i zanonimizowane atrybuty `openclaw.content.*` dla konkretnych
klas zawartości, które wybrano.

## Katalog zdarzeń diagnostycznych

Poniższe zdarzenia stanowią podstawę opisanych wyżej metryk i zakresów. Pluginy mogą również
subskrybować je bezpośrednio bez eksportu OTLP.

**Użycie modelu**

- `model.usage` — tokeny, koszt, czas trwania, kontekst, dostawca/model/kanał
  oraz identyfikatory sesji. `usage` to rozliczanie dostawcy/tury na potrzeby kosztów i telemetrii;
  `context.used` to bieżący obraz promptu/kontekstu i może być mniejszy niż
  `usage.total` dostawcy, gdy używane są buforowane dane wejściowe lub wywołania pętli narzędzi.

**Przepływ wiadomości**

- `webhook.received` / `webhook.processed` / `webhook.error`
- `message.queued` / `message.processed`
- `message.delivery.started` / `message.delivery.completed` / `message.delivery.error`

**Kolejka i sesja**

- `queue.lane.enqueue` / `queue.lane.dequeue`
- `session.state` / `session.long_running` / `session.stalled` / `session.stuck`
- `run.attempt` / `run.progress`
- `diagnostic.heartbeat` (zagregowane liczniki: Webhooki/kolejka/sesja)

**Cykl życia mechanizmu wykonawczego**

- `harness.run.started` / `harness.run.completed` / `harness.run.error` —
  cykl życia każdego uruchomienia mechanizmu wykonawczego agenta. Obejmuje `harnessId`, opcjonalne
  `pluginId`, dostawcę/model/kanał oraz identyfikator uruchomienia. Zakończenie dodaje
  `durationMs`, `outcome`, opcjonalne `resultClassification`, `yieldDetected`
  oraz liczby `itemLifecycle`. Błędy dodają `phase`
  (`prepare`/`start`/`send`/`resolve`/`cleanup`), `errorCategory` oraz
  opcjonalne `cleanupFailed`.

**Exec**

- `exec.process.completed` — wynik końcowy, czas trwania, cel, tryb, kod
  zakończenia i rodzaj niepowodzenia. Tekst polecenia ani katalogi robocze nie są
  uwzględniane.
- `exec.approval.followup_suppressed` — odrzucono nieaktualną kontynuację zatwierdzenia
  po ponownym powiązaniu sesji. Obejmuje `approvalId`, `reason`
  (`session_rebound`), `phase` (`direct_delivery` lub `gateway_preflight`)
  oraz znacznik czasu dyspozytora. Klucze sesji, trasy ani tekst polecenia nie są
  uwzględniane.

## Bez eksportera

Zdarzenia diagnostyczne mogą pozostać dostępne dla Pluginów lub niestandardowych odbiorników bez uruchamiania
`diagnostics-otel`:

```json5
{
  diagnostics: { enabled: true },
}
```

Aby uzyskać ukierunkowane dane debugowania bez zwiększania `logging.level`, użyj flag diagnostycznych.
W flagach wielkość liter nie ma znaczenia i obsługiwane są symbole wieloznaczne (`telegram.*` lub
`*`):

```json5
{
  diagnostics: { flags: ["telegram.http"] },
}
```

Możesz też użyć jednorazowego nadpisania przez zmienną środowiskową:

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload openclaw gateway
```

Dane wyjściowe flag trafiają do standardowego pliku dziennika (`logging.file`) i nadal
podlegają anonimizacji przez `logging.redactSensitive`. Pełny przewodnik:
[Flagi diagnostyczne](/pl/diagnostics/flags).

## Wyłączanie

```json5
{
  diagnostics: { otel: { enabled: false } },
}
```

Możesz też pominąć `diagnostics-otel` w `plugins.allow` albo uruchomić
`openclaw plugins disable diagnostics-otel`.

## Powiązane materiały

- [Rejestrowanie](/pl/logging) — dzienniki plikowe, dane wyjściowe konsoli, śledzenie przez CLI oraz karta dzienników w interfejsie sterowania
- [Wewnętrzne mechanizmy rejestrowania Gateway](/pl/gateway/logging) — style dzienników WS, prefiksy podsystemów i przechwytywanie konsoli
- [Flagi diagnostyczne](/pl/diagnostics/flags) — ukierunkowane flagi dziennika debugowania
- [Eksport diagnostyki](/pl/gateway/diagnostics) — narzędzie pakietu wsparcia dla operatora (niezależne od eksportu OTEL)
- [Dokumentacja konfiguracji](/pl/gateway/configuration-reference#diagnostics) — pełna dokumentacja pól `diagnostics.*`

---
read_when:
    - Chcesz, aby Prometheus, Grafana, VictoriaMetrics lub inne narzędzie zbierające gromadziło metryki OpenClaw Gateway
    - Potrzebujesz nazw metryk Prometheus i zasad etykiet dla pulpitów lub alertów
    - Potrzebujesz metryk bez uruchamiania kolektora OpenTelemetry
sidebarTitle: Prometheus
summary: Udostępnij diagnostykę OpenClaw jako metryki tekstowe Prometheus przez Plugin diagnostics-prometheus
title: Metryki Prometheus
x-i18n:
    generated_at: "2026-06-27T17:36:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f9d3f6cf5af2e3770cd3a86e968fe25d2c3b3b87524ba1d229ef585671d320a8
    source_path: gateway/prometheus.md
    workflow: 16
---

  OpenClaw może udostępniać metryki diagnostyczne przez oficjalną wtyczkę `diagnostics-prometheus`. Nasłuchuje zaufanej diagnostyki oraz emitowanych przez rdzeń zdarzeń stabilności Gateway, a następnie renderuje tekstowy punkt końcowy Prometheus pod adresem:

  ```text
  GET /api/diagnostics/prometheus
  ```

  Typ zawartości to `text/plain; version=0.0.4; charset=utf-8`, standardowy format ekspozycji Prometheus.

  <Warning>
  Trasa używa uwierzytelniania Gateway (zakres operatora). Nie udostępniaj jej jako publicznego, nieuwierzytelnionego punktu końcowego `/metrics`. Pobieraj z niej metryki przez tę samą ścieżkę uwierzytelniania, której używasz dla innych interfejsów API operatora.
  </Warning>

  Informacje o śladach, logach, wypychaniu OTLP i atrybutach semantycznych OpenTelemetry GenAI znajdziesz w sekcji [eksport OpenTelemetry](/pl/gateway/opentelemetry).

  ## Szybki start

  <Steps>
  <Step title="Zainstaluj wtyczkę">
    ```bash
    openclaw plugins install clawhub:@openclaw/diagnostics-prometheus
    ```
  </Step>
  <Step title="Włącz wtyczkę">
    <Tabs>
      <Tab title="Konfiguracja">
        ```json5
        {
          plugins: {
            allow: ["diagnostics-prometheus"],
            entries: {
              "diagnostics-prometheus": { enabled: true },
            },
          },
          diagnostics: {
            enabled: true,
          },
        }
        ```
      </Tab>
      <Tab title="CLI">
        ```bash
        openclaw plugins enable diagnostics-prometheus
        ```
      </Tab>
    </Tabs>
  </Step>
  <Step title="Uruchom ponownie Gateway">
    Trasa HTTP jest rejestrowana podczas uruchamiania wtyczki, więc po włączeniu wykonaj ponowne wczytanie.
  </Step>
  <Step title="Pobieraj metryki z chronionej trasy">
    Wyślij to samo uwierzytelnianie Gateway, którego używają klienci operatora:

    ```bash
    curl -H "Authorization: Bearer $OPENCLAW_GATEWAY_TOKEN" \
      http://127.0.0.1:18789/api/diagnostics/prometheus
    ```

  </Step>
  <Step title="Podłącz Prometheus">
    ```yaml
    # prometheus.yml
    scrape_configs:
      - job_name: openclaw
        scrape_interval: 30s
        metrics_path: /api/diagnostics/prometheus
        authorization:
          credentials_file: /etc/prometheus/openclaw-gateway-token
        static_configs:
          - targets: ["openclaw-gateway:18789"]
    ```
  </Step>
</Steps>

<Note>
Wymagane jest `diagnostics.enabled: true`. Bez tego Plugin nadal rejestruje trasę HTTP, ale żadne zdarzenia diagnostyczne nie trafiają do eksportera, więc odpowiedź jest pusta.
</Note>

## Eksportowane metryki

| Metryka                                          | Typ       | Etykiety                                                                                  |
| ------------------------------------------------ | --------- | ----------------------------------------------------------------------------------------- |
| `openclaw_run_completed_total`                   | licznik   | `channel`, `model`, `outcome`, `provider`, `trigger`                                      |
| `openclaw_run_duration_seconds`                  | histogram | `channel`, `model`, `outcome`, `provider`, `trigger`                                      |
| `openclaw_model_call_total`                      | licznik   | `api`, `error_category`, `model`, `outcome`, `provider`, `transport`                      |
| `openclaw_model_call_duration_seconds`           | histogram | `api`, `error_category`, `model`, `outcome`, `provider`, `transport`                      |
| `openclaw_model_failover_total`                  | licznik   | `from_model`, `from_provider`, `lane`, `reason`, `suspended`, `to_model`, `to_provider`   |
| `openclaw_model_tokens_total`                    | licznik   | `agent`, `channel`, `model`, `provider`, `token_type`                                     |
| `openclaw_gen_ai_client_token_usage`             | histogram | `model`, `provider`, `token_type`                                                         |
| `openclaw_model_cost_usd_total`                  | licznik   | `agent`, `channel`, `model`, `provider`                                                   |
| `openclaw_skill_used_total`                      | licznik   | `activation`, `agent`, `skill`, `source`                                                  |
| `openclaw_tool_execution_total`                  | licznik   | `error_category`, `outcome`, `params_kind`, `tool`, `tool_owner`, `tool_source`           |
| `openclaw_tool_execution_duration_seconds`       | histogram | `error_category`, `outcome`, `params_kind`, `tool`, `tool_owner`, `tool_source`           |
| `openclaw_tool_execution_blocked_total`          | licznik   | `denied_reason`, `params_kind`, `tool`, `tool_owner`, `tool_source`                       |
| `openclaw_harness_run_total`                     | licznik   | `channel`, `error_category`, `harness`, `model`, `outcome`, `phase`, `plugin`, `provider` |
| `openclaw_harness_run_duration_seconds`          | histogram | `channel`, `error_category`, `harness`, `model`, `outcome`, `phase`, `plugin`, `provider` |
| `openclaw_webhook_received_total`                | licznik   | `channel`, `webhook`                                                                      |
| `openclaw_webhook_error_total`                   | licznik   | `channel`, `webhook`                                                                      |
| `openclaw_webhook_duration_seconds`              | histogram | `channel`, `webhook`                                                                      |
| `openclaw_message_received_total`                | licznik   | `channel`, `source`                                                                       |
| `openclaw_message_dispatch_started_total`        | licznik   | `channel`, `source`                                                                       |
| `openclaw_message_dispatch_completed_total`      | licznik   | `channel`, `outcome`, `reason`, `source`                                                  |
| `openclaw_message_dispatch_duration_seconds`     | histogram | `channel`, `outcome`, `reason`, `source`                                                  |
| `openclaw_message_processed_total`               | licznik   | `channel`, `outcome`, `reason`                                                            |
| `openclaw_message_processed_duration_seconds`    | histogram | `channel`, `outcome`, `reason`                                                            |
| `openclaw_message_delivery_started_total`        | licznik   | `channel`, `delivery_kind`                                                                |
| `openclaw_message_delivery_total`                | licznik   | `channel`, `delivery_kind`, `error_category`, `outcome`                                   |
| `openclaw_message_delivery_duration_seconds`     | histogram | `channel`, `delivery_kind`, `error_category`, `outcome`                                   |
| `openclaw_talk_event_total`                      | licznik   | `brain`, `event_type`, `mode`, `provider`, `transport`                                    |
| `openclaw_talk_event_duration_seconds`           | histogram | `brain`, `event_type`, `mode`, `provider`, `transport`                                    |
| `openclaw_talk_audio_bytes`                      | histogram | `brain`, `event_type`, `mode`, `provider`, `transport`                                    |
| `openclaw_queue_lane_size`                       | miernik   | `lane`                                                                                    |
| `openclaw_queue_lane_wait_seconds`               | histogram | `lane`                                                                                    |
| `openclaw_session_state_total`                   | licznik   | `reason`, `state`                                                                         |
| `openclaw_session_queue_depth`                   | miernik   | `state`                                                                                   |
| `openclaw_session_turn_created_total`            | licznik   | `agent`, `channel`, `trigger`                                                             |
| `openclaw_session_stuck_total`                   | licznik   | `reason`, `state`                                                                         |
| `openclaw_session_stuck_age_seconds`             | histogram | `reason`, `state`                                                                         |
| `openclaw_session_recovery_total`                | licznik   | `action`, `active_work_kind`, `state`, `status`                                           |
| `openclaw_session_recovery_age_seconds`          | histogram | `action`, `active_work_kind`, `state`, `status`                                           |
| `openclaw_liveness_warning_total`                | licznik   | `reason`                                                                                  |
| `openclaw_liveness_sessions`                     | miernik   | `state`                                                                                   |
| `openclaw_liveness_event_loop_delay_p99_seconds` | histogram | `reason`                                                                                  |
| `openclaw_liveness_event_loop_delay_max_seconds` | histogram | `reason`                                                                                  |
| `openclaw_liveness_event_loop_utilization_ratio` | histogram | `reason`                                                                                  |
| `openclaw_liveness_cpu_core_ratio`               | histogram | `reason`                                                                                  |
| `openclaw_payload_large_total`                   | licznik   | `action`, `channel`, `plugin`, `reason`, `surface`                                        |
| `openclaw_payload_large_bytes`                   | histogram | `action`, `channel`, `plugin`, `reason`, `surface`                                        |
| `openclaw_memory_bytes`                          | miernik   | `kind`                                                                                    |
| `openclaw_memory_rss_bytes`                      | histogram | brak                                                                                      |
| `openclaw_memory_pressure_total`                 | licznik   | `level`, `reason`                                                                         |
| `openclaw_telemetry_exporter_total`              | licznik   | `exporter`, `reason`, `signal`, `status`                                                  |
| `openclaw_prometheus_series_dropped_total`       | licznik   | brak                                                                                      |

## Zasady etykiet

<AccordionGroup>
  <Accordion title="Ograniczone etykiety o niskiej kardynalności">
    Etykiety Prometheus pozostają ograniczone i mają niską kardynalność. Eksporter nie emituje surowych identyfikatorów diagnostycznych, takich jak `runId`, `sessionKey`, `sessionId`, `callId`, `toolCallId`, identyfikatory wiadomości, identyfikatory czatów ani identyfikatory żądań dostawcy.

    Wartości etykiet są redagowane i muszą być zgodne z polityką znaków o niskiej kardynalności OpenClaw. Wartości, które nie spełniają tej polityki, są zastępowane przez `unknown`, `other` albo `none`, zależnie od metryki. Etykiety wyglądające jak zakresowe klucze sesji agenta również są zastępowane przez `unknown`.

  </Accordion>
  <Accordion title="Limit serii i rozliczanie przepełnienia">
    Eksporter ogranicza przechowywane w pamięci szeregi czasowe do **2048** serii łącznie dla liczników, mierników i histogramów. Nowe serie ponad ten limit są odrzucane, a `openclaw_prometheus_series_dropped_total` jest zwiększane o jeden za każdym razem.

    Obserwuj ten licznik jako jednoznaczny sygnał, że atrybut wyżej w potoku przepuszcza wartości o wysokiej kardynalności. Eksporter nigdy nie podnosi limitu automatycznie; jeśli licznik rośnie, napraw źródło zamiast wyłączać limit.

  </Accordion>
  <Accordion title="Co nigdy nie pojawia się w danych wyjściowych Prometheus">
    - tekst promptu, tekst odpowiedzi, dane wejściowe narzędzi, dane wyjściowe narzędzi, prompty systemowe
    - transkrypcje rozmów, ładunki audio, identyfikatory połączeń, identyfikatory pokojów, tokeny przekazania, identyfikatory tur i surowe identyfikatory sesji
    - surowe identyfikatory żądań dostawcy (tylko ograniczone skróty, tam gdzie ma to zastosowanie, w spanach — nigdy w metrykach)
    - klucze sesji i identyfikatory sesji
    - nazwy hostów, ścieżki plików, wartości sekretów

  </Accordion>
</AccordionGroup>

## Przykłady PromQL

```promql
# Tokens per minute, split by provider
sum by (provider) (rate(openclaw_model_tokens_total[1m]))

# Spend (USD) over the last hour, by model
sum by (model) (increase(openclaw_model_cost_usd_total[1h]))

# 95th percentile model run duration
histogram_quantile(
  0.95,
  sum by (le, provider, model)
    (rate(openclaw_run_duration_seconds_bucket[5m]))
)

# Queue wait time SLO (95p under 2s)
histogram_quantile(
  0.95,
  sum by (le, lane) (rate(openclaw_queue_lane_wait_seconds_bucket[5m]))
) < 2

# Skill usage, split by bounded source
sum by (skill, source) (increase(openclaw_skill_used_total[24h]))

# Dropped Prometheus series (cardinality alarm)
increase(openclaw_prometheus_series_dropped_total[15m]) > 0
```

<Tip>
Preferuj `gen_ai_client_token_usage` w panelach między dostawcami: jest zgodne z konwencjami semantycznymi OpenTelemetry GenAI i spójne z metrykami z usług GenAI innych niż OpenClaw.
</Tip>

## Wybór między eksportem Prometheus a OpenTelemetry

OpenClaw obsługuje oba interfejsy niezależnie. Możesz uruchomić jeden z nich, oba albo żaden.

<Tabs>
  <Tab title="diagnostics-prometheus">
    - Model **pull**: Prometheus odpytuje `/api/diagnostics/prometheus`.
    - Nie wymaga zewnętrznego kolektora.
    - Uwierzytelnianie odbywa się przez standardowe uwierzytelnianie Gateway.
    - Interfejs obejmuje tylko metryki (bez trace’ów ani logów).
    - Najlepsze dla stosów już zestandaryzowanych na Prometheus + Grafana.

  </Tab>
  <Tab title="diagnostics-otel">
    - Model **push**: OpenClaw wysyła OTLP/HTTP do kolektora lub backendu zgodnego z OTLP.
    - Interfejs obejmuje metryki, trace’y i logi.
    - Mostkuje do Prometheus przez OpenTelemetry Collector (eksporter `prometheus` lub `prometheusremotewrite`), gdy potrzebujesz obu.
    - Pełny katalog znajdziesz w [eksporcie OpenTelemetry](/pl/gateway/opentelemetry).

  </Tab>
</Tabs>

## Rozwiązywanie problemów

<AccordionGroup>
  <Accordion title="Pusta treść odpowiedzi">
    - Sprawdź `diagnostics.enabled: true` w konfiguracji.
    - Potwierdź, że Plugin jest włączony i załadowany za pomocą `openclaw plugins list --enabled`.
    - Wygeneruj trochę ruchu; liczniki i histogramy emitują wiersze dopiero po co najmniej jednym zdarzeniu.

  </Accordion>
  <Accordion title="401 / brak autoryzacji">
    Punkt końcowy wymaga zakresu operatora Gateway (`auth: "gateway"` z `gatewayRuntimeScopeSurface: "trusted-operator"`). Użyj tego samego tokenu lub hasła, którego Prometheus używa dla dowolnej innej trasy operatora Gateway. Nie ma publicznego trybu bez uwierzytelniania.
  </Accordion>
  <Accordion title="`openclaw_prometheus_series_dropped_total` rośnie">
    Nowy atrybut przekracza limit **2048** serii. Sprawdź ostatnie metryki pod kątem etykiety o nieoczekiwanie wysokiej kardynalności i napraw ją u źródła. Eksporter celowo odrzuca nowe serie zamiast po cichu przepisywać etykiety.
  </Accordion>
  <Accordion title="Prometheus pokazuje nieaktualne serie po restarcie">
    Plugin przechowuje stan wyłącznie w pamięci. Po restarcie Gateway liczniki resetują się do zera, a mierniki wznawiają działanie od następnej zgłoszonej wartości. Użyj PromQL `rate()` i `increase()`, aby czysto obsłużyć resety.
  </Accordion>
</AccordionGroup>

## Powiązane

- [Eksport diagnostyki](/pl/gateway/diagnostics) — lokalne archiwum zip diagnostyki do pakietów wsparcia
- [Kondycja i gotowość](/pl/gateway/health) — sondy `/healthz` i `/readyz`
- [Rejestrowanie](/pl/logging) — rejestrowanie oparte na plikach
- [Eksport OpenTelemetry](/pl/gateway/opentelemetry) — push OTLP dla trace’ów, metryk i logów

---
read_when:
    - Chcesz, aby Prometheus, Grafana, VictoriaMetrics lub inny mechanizm zbierający gromadził metryki OpenClaw Gateway
    - Potrzebujesz nazw metryk Prometheus i zasad dotyczących etykiet na potrzeby pulpitów nawigacyjnych lub alertów
    - Chcesz korzystać z metryk bez uruchamiania kolektora OpenTelemetry
sidebarTitle: Prometheus
summary: Udostępniaj diagnostykę OpenClaw jako metryki tekstowe Prometheus za pośrednictwem pluginu diagnostics-prometheus
title: Metryki Prometheus
x-i18n:
    generated_at: "2026-07-12T15:09:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8a3975a9a79f32f1e9731b819613fdf6b9ffeee20bc71c841b9a6d7a5e0052f4
    source_path: gateway/prometheus.md
    workflow: 16
---

  OpenClaw może udostępniać metryki diagnostyczne za pośrednictwem oficjalnego
  pluginu `diagnostics-prometheus`. Nasłuchuje on zaufanych danych diagnostycznych oraz
  wewnętrznie oznaczonych zdarzeń diagnostycznych należących do dyspozytora (sygnałów
  kolejki, pamięci i odzyskiwania sesji), a następnie udostępnia punkt końcowy w formacie tekstowym Prometheus pod adresem:

  ```text
  GET /api/diagnostics/prometheus
  ```

  Typ zawartości to `text/plain; version=0.0.4; charset=utf-8`, czyli standardowy
  format ekspozycji Prometheus.

  <Warning>
  Trasa korzysta z uwierzytelniania Gateway (zakres operatora, interfejs dla zaufanego operatora). Nie udostępniaj jej jako publicznego, nieuwierzytelnionego punktu końcowego `/metrics`. Pobieraj z niej metryki przez tę samą ścieżkę uwierzytelniania, której używasz w przypadku innych interfejsów API operatora.
  </Warning>

  Informacje o śladach, dziennikach, wysyłaniu OTLP i atrybutach semantycznych OpenTelemetry GenAI znajdziesz w sekcji [Eksport OpenTelemetry](/pl/gateway/opentelemetry).

  ## Szybki start

  <Steps>
  <Step title="Zainstaluj plugin">
    ```bash
    openclaw plugins install clawhub:@openclaw/diagnostics-prometheus
    ```
  </Step>
  <Step title="Włącz plugin">
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
    Trasa HTTP jest rejestrowana podczas uruchamiania pluginu, dlatego po jego włączeniu wykonaj ponowne załadowanie.
  </Step>
  <Step title="Pobierz metryki z chronionej trasy">
    Prześlij te same dane uwierzytelniające Gateway, których używają klienty operatora:

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
Domyślna wartość `diagnostics.enabled` to `true`; ustaw ją na `false` tylko w ściśle ograniczonych środowiskach. Jeśli ma wartość `false`, plugin nadal rejestruje trasę HTTP, ale żadne zdarzenia diagnostyczne nie trafiają do eksportera, więc odpowiedź jest pusta.
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
| `openclaw_model_usage_duration_seconds`          | histogram | `agent`, `channel`, `model`, `provider`                                                   |
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
| `openclaw_queue_lane_size`                       | wskaźnik  | `lane`                                                                                    |
| `openclaw_queue_lane_wait_seconds`               | histogram | `lane`                                                                                    |
| `openclaw_session_state_total`                   | licznik   | `reason`, `state`                                                                         |
| `openclaw_session_queue_depth`                   | wskaźnik  | `state`                                                                                   |
| `openclaw_session_turn_created_total`            | licznik   | `agent`, `channel`, `trigger`                                                             |
| `openclaw_session_stuck_total`                   | licznik   | `reason`, `state`                                                                         |
| `openclaw_session_stuck_age_seconds`             | histogram | `reason`, `state`                                                                         |
| `openclaw_session_recovery_total`                | licznik   | `action`, `active_work_kind`, `state`, `status`                                           |
| `openclaw_session_recovery_age_seconds`          | histogram | `action`, `active_work_kind`, `state`, `status`                                           |
| `openclaw_liveness_warning_total`                | licznik   | `reason`                                                                                  |
| `openclaw_liveness_sessions`                     | wskaźnik  | `state`                                                                                   |
| `openclaw_liveness_event_loop_delay_p99_seconds` | histogram | `reason`                                                                                  |
| `openclaw_liveness_event_loop_delay_max_seconds` | histogram | `reason`                                                                                  |
| `openclaw_liveness_event_loop_utilization_ratio` | histogram | `reason`                                                                                  |
| `openclaw_liveness_cpu_core_ratio`               | histogram | `reason`                                                                                  |
| `openclaw_payload_large_total`                   | licznik   | `action`, `channel`, `plugin`, `reason`, `surface`                                        |
| `openclaw_payload_large_bytes`                   | histogram | `action`, `channel`, `plugin`, `reason`, `surface`                                        |
| `openclaw_memory_bytes`                          | wskaźnik  | `kind`                                                                                    |
| `openclaw_memory_rss_bytes`                      | histogram | brak                                                                                      |
| `openclaw_memory_pressure_total`                 | licznik   | `level`, `reason`                                                                         |
| `openclaw_telemetry_exporter_total`              | licznik   | `exporter`, `reason`, `signal`, `status`                                                  |
| `openclaw_prometheus_series_dropped_total`       | licznik   | brak                                                                                      |
| `openclaw_diagnostic_async_queue_dropped_total`  | licznik   | `drop_class`                                                                              |
| `openclaw_diagnostic_async_queue_length`         | wskaźnik  | brak                                                                                      |

## Zasady dotyczące etykiet

<AccordionGroup>
  <Accordion title="Ograniczone etykiety o niskiej kardynalności">
    Etykiety Prometheus pozostają ograniczone i mają niską kardynalność. Eksporter nie emituje nieprzetworzonych identyfikatorów diagnostycznych, takich jak `runId`, `sessionKey`, `sessionId`, `callId`, `toolCallId`, identyfikatory wiadomości, identyfikatory czatów ani identyfikatory żądań dostawcy.

    Wartości etykiet są redagowane i muszą być zgodne z zasadami OpenClaw dotyczącymi znaków dozwolonych w wartościach o niskiej kardynalności. Wartości, które nie spełniają tych zasad, są zastępowane przez `unknown`, `other` lub `none`, zależnie od metryki. Etykiety przypominające klucze sesji agenta z określonym zakresem są również zastępowane przez `unknown`.

  </Accordion>
  <Accordion title="Limit serii i rozliczanie nadmiaru">
    Eksporter ogranicza liczbę przechowywanych w pamięci szeregów czasowych do **2048** łącznie dla liczników, mierników i histogramów. Nowe szeregi przekraczające ten limit są odrzucane, a wartość `openclaw_prometheus_series_dropped_total` jest za każdym razem zwiększana o jeden.

    Obserwuj ten licznik jako jednoznaczny sygnał, że atrybut na wcześniejszym etapie przepływu powoduje wyciek wartości o wysokiej kardynalności. Eksporter nigdy nie zwiększa limitu automatycznie; jeśli licznik rośnie, napraw źródło zamiast wyłączać limit.

  </Accordion>
  <Accordion title="Co nigdy nie pojawia się w danych wyjściowych Prometheus">
    - teksty promptów, teksty odpowiedzi, dane wejściowe narzędzi, dane wyjściowe narzędzi, prompty systemowe
    - transkrypcje rozmów, dane audio, identyfikatory połączeń, identyfikatory pokojów, tokeny przekazania, identyfikatory tur i nieprzetworzone identyfikatory sesji
    - nieprzetworzone identyfikatory żądań dostawcy (tylko skróty o ograniczonej liczbie wartości, tam gdzie ma to zastosowanie, w spanach — nigdy w metrykach)
    - klucze sesji i identyfikatory sesji
    - nazwy hostów, ścieżki plików, wartości sekretów

  </Accordion>
</AccordionGroup>

## Przepisy PromQL

```promql
# Tokeny na minutę, z podziałem według dostawcy
sum by (provider) (rate(openclaw_model_tokens_total[1m]))

# Wydatki (USD) w ciągu ostatniej godziny, według modelu
sum by (model) (increase(openclaw_model_cost_usd_total[1h]))

# 95. percentyl czasu trwania uruchomienia modelu
histogram_quantile(
  0.95,
  sum by (le, provider, model)
    (rate(openclaw_run_duration_seconds_bucket[5m]))
)

# SLO czasu oczekiwania w kolejce (95. percentyl poniżej 2 s)
histogram_quantile(
  0.95,
  sum by (le, lane) (rate(openclaw_queue_lane_wait_seconds_bucket[5m]))
) < 2

# Użycie Skill, z podziałem według ograniczonego zbioru źródeł
sum by (skill, source) (increase(openclaw_skill_used_total[24h]))

# Odrzucone szeregi Prometheus (alarm kardynalności)
increase(openclaw_prometheus_series_dropped_total[15m]) > 0
```

<Tip>
W przypadku pulpitów obejmujących wielu dostawców preferuj `gen_ai_client_token_usage`: metryka ta jest zgodna z konwencjami semantycznymi GenAI projektu OpenTelemetry i spójna z metrykami usług GenAI innych niż OpenClaw.
</Tip>

## Wybór między eksportem Prometheus a OpenTelemetry

OpenClaw obsługuje oba mechanizmy niezależnie. Można używać jednego z nich, obu lub żadnego.

<Tabs>
  <Tab title="diagnostics-prometheus">
    - Model **pull**: Prometheus pobiera dane z `/api/diagnostics/prometheus`.
    - Zewnętrzny kolektor nie jest wymagany.
    - Uwierzytelnianie odbywa się przy użyciu standardowego mechanizmu uwierzytelniania Gateway.
    - Udostępniane są tylko metryki (bez śladów i dzienników).
    - Najlepsze rozwiązanie dla stosów już ustandaryzowanych na Prometheus + Grafana.

  </Tab>
  <Tab title="diagnostics-otel">
    - Model **push**: OpenClaw wysyła dane przez OTLP/HTTP do kolektora lub zaplecza zgodnego z OTLP.
    - Udostępniane są metryki, ślady i dzienniki.
    - Umożliwia integrację z Prometheus za pośrednictwem kolektora OpenTelemetry (eksporter `prometheus` lub `prometheusremotewrite`), gdy potrzebne są oba mechanizmy.
    - Pełny katalog zawiera sekcja [Eksport OpenTelemetry](/pl/gateway/opentelemetry).

  </Tab>
</Tabs>

## Rozwiązywanie problemów

<AccordionGroup>
  <Accordion title="Pusta treść odpowiedzi">
    - Sprawdź, czy `diagnostics.enabled` nie ustawiono w konfiguracji na `false` (wartość domyślna to `true`).
    - Potwierdź za pomocą polecenia `openclaw plugins list --enabled`, że Plugin jest włączony i załadowany.
    - Wygeneruj ruch; liczniki i histogramy generują wiersze dopiero po wystąpieniu co najmniej jednego zdarzenia.

  </Accordion>
  <Accordion title="401 / brak autoryzacji">
    Punkt końcowy wymaga zakresu operatora Gateway (`auth: "gateway"` z `gatewayRuntimeScopeSurface: "trusted-operator"`). Użyj tego samego tokenu lub hasła, którego Prometheus używa dla pozostałych tras operatora Gateway. Publiczny tryb bez uwierzytelniania nie jest dostępny.
  </Accordion>
  <Accordion title="Wartość `openclaw_prometheus_series_dropped_total` rośnie">
    Nowy atrybut przekracza limit **2048** szeregów. Sprawdź ostatnie metryki pod kątem etykiety o nieoczekiwanie wysokiej kardynalności i usuń problem u źródła. Eksporter celowo odrzuca nowe szeregi zamiast niejawnie przepisywać etykiety.
  </Accordion>
  <Accordion title="Prometheus pokazuje nieaktualne szeregi po ponownym uruchomieniu">
    Plugin przechowuje stan wyłącznie w pamięci. Po ponownym uruchomieniu Gateway liczniki są zerowane, a mierniki rozpoczynają od kolejnej zgłoszonej wartości. Używaj funkcji PromQL `rate()` i `increase()`, aby prawidłowo obsługiwać zerowania.
  </Accordion>
</AccordionGroup>

## Powiązane materiały

- [Eksport diagnostyki](/pl/gateway/diagnostics) — lokalne archiwum ZIP z diagnostyką dołączane do pakietów pomocy technicznej
- [Kondycja i gotowość](/pl/gateway/health) — sondy `/healthz` i `/readyz`
- [Rejestrowanie](/pl/logging) — rejestrowanie oparte na plikach
- [Eksport OpenTelemetry](/pl/gateway/opentelemetry) — wysyłanie przez OTLP śladów, metryk i dzienników

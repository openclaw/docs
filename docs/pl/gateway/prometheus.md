---
read_when:
    - Chcesz, aby Prometheus, Grafana, VictoriaMetrics lub inny scraper zbierał metryki OpenClaw Gateway
    - Potrzebujesz nazw metryk Prometheus i polityki etykiet do dashboardów lub alertów
    - Chcesz metryk bez uruchamiania collectora OpenTelemetry
sidebarTitle: Prometheus
summary: Udostępniaj diagnostykę OpenClaw jako metryki tekstowe Prometheus przez plugin diagnostics-prometheus
title: Metryki Prometheus
x-i18n:
    generated_at: "2026-04-26T11:30:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 29fd3e4658ceffe20f078e8e38b61c685ea9df518ca04ca34abf2085166eb481
    source_path: gateway/prometheus.md
    workflow: 15
---

OpenClaw może udostępniać metryki diagnostyczne przez dołączony plugin `diagnostics-prometheus`. Nasłuchuje on zaufanej wewnętrznej diagnostyki i renderuje punkt końcowy tekstowy Prometheus pod adresem:

```text
GET /api/diagnostics/prometheus
```

Typ zawartości to `text/plain; version=0.0.4; charset=utf-8`, czyli standardowy format ekspozycji Prometheus.

<Warning>
Ta trasa używa auth Gateway (zakres operatora). Nie wystawiaj jej jako publicznego nieuwierzytelnionego punktu końcowego `/metrics`. Odczytuj ją przez tę samą ścieżkę auth, której używasz dla innych operatorowych API.
</Warning>

Informacje o śladach, logach, push OTLP i semantycznych atrybutach OpenTelemetry GenAI znajdziesz w [Eksport OpenTelemetry](/pl/gateway/opentelemetry).

## Szybki start

<Steps>
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
    Trasa HTTP jest rejestrowana przy starcie pluginu, więc po włączeniu wykonaj przeładowanie.
  </Step>
  <Step title="Odczytaj chronioną trasę">
    Wyślij to samo auth Gateway, którego używają twoi klienci operatora:

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
Wymagane jest `diagnostics.enabled: true`. Bez tego plugin nadal rejestruje trasę HTTP, ale żadne zdarzenia diagnostyczne nie trafiają do eksportera, więc odpowiedź jest pusta.
</Note>

## Eksportowane metryki

| Metryka                                       | Typ       | Etykiety                                                                                  |
| --------------------------------------------- | --------- | ----------------------------------------------------------------------------------------- |
| `openclaw_run_completed_total`                | counter   | `channel`, `model`, `outcome`, `provider`, `trigger`                                      |
| `openclaw_run_duration_seconds`               | histogram | `channel`, `model`, `outcome`, `provider`, `trigger`                                      |
| `openclaw_model_call_total`                   | counter   | `api`, `error_category`, `model`, `outcome`, `provider`, `transport`                      |
| `openclaw_model_call_duration_seconds`        | histogram | `api`, `error_category`, `model`, `outcome`, `provider`, `transport`                      |
| `openclaw_model_tokens_total`                 | counter   | `agent`, `channel`, `model`, `provider`, `token_type`                                     |
| `openclaw_gen_ai_client_token_usage`          | histogram | `model`, `provider`, `token_type`                                                         |
| `openclaw_model_cost_usd_total`               | counter   | `agent`, `channel`, `model`, `provider`                                                   |
| `openclaw_tool_execution_total`               | counter   | `error_category`, `outcome`, `params_kind`, `tool`                                        |
| `openclaw_tool_execution_duration_seconds`    | histogram | `error_category`, `outcome`, `params_kind`, `tool`                                        |
| `openclaw_harness_run_total`                  | counter   | `channel`, `error_category`, `harness`, `model`, `outcome`, `phase`, `plugin`, `provider` |
| `openclaw_harness_run_duration_seconds`       | histogram | `channel`, `error_category`, `harness`, `model`, `outcome`, `phase`, `plugin`, `provider` |
| `openclaw_message_processed_total`            | counter   | `channel`, `outcome`, `reason`                                                            |
| `openclaw_message_processed_duration_seconds` | histogram | `channel`, `outcome`, `reason`                                                            |
| `openclaw_message_delivery_total`             | counter   | `channel`, `delivery_kind`, `error_category`, `outcome`                                   |
| `openclaw_message_delivery_duration_seconds`  | histogram | `channel`, `delivery_kind`, `error_category`, `outcome`                                   |
| `openclaw_queue_lane_size`                    | gauge     | `lane`                                                                                    |
| `openclaw_queue_lane_wait_seconds`            | histogram | `lane`                                                                                    |
| `openclaw_session_state_total`                | counter   | `reason`, `state`                                                                         |
| `openclaw_session_queue_depth`                | gauge     | `state`                                                                                   |
| `openclaw_memory_bytes`                       | gauge     | `kind`                                                                                    |
| `openclaw_memory_rss_bytes`                   | histogram | none                                                                                      |
| `openclaw_memory_pressure_total`              | counter   | `level`, `reason`                                                                         |
| `openclaw_telemetry_exporter_total`           | counter   | `exporter`, `reason`, `signal`, `status`                                                  |
| `openclaw_prometheus_series_dropped_total`    | counter   | none                                                                                      |

## Polityka etykiet

<AccordionGroup>
  <Accordion title="Ograniczone etykiety o niskiej kardynalności">
    Etykiety Prometheus pozostają ograniczone i mają niską kardynalność. Eksporter nie emituje surowych identyfikatorów diagnostycznych, takich jak `runId`, `sessionKey`, `sessionId`, `callId`, `toolCallId`, identyfikatory wiadomości, identyfikatory czatów ani identyfikatory żądań providera.

    Wartości etykiet są redagowane i muszą być zgodne z polityką znaków niskiej kardynalności OpenClaw. Wartości, które nie spełniają tej polityki, są zastępowane przez `unknown`, `other` lub `none`, zależnie od metryki.

  </Accordion>
  <Accordion title="Limit serii i rozliczanie przepełnienia">
    Eksporter ogranicza liczbę utrzymywanych serii czasowych w pamięci do **2048** serii łącznie dla counterów, gauge’y i histogramów. Nowe serie ponad ten limit są odrzucane, a `openclaw_prometheus_series_dropped_total` zwiększa się o jeden przy każdym takim przypadku.

    Traktuj ten counter jako twardy sygnał, że jakiś atrybut wyżej w stosie przecieka wartości o wysokiej kardynalności. Eksporter nigdy nie podnosi limitu automatycznie; jeśli wartość rośnie, napraw źródło zamiast wyłączać limit.

  </Accordion>
  <Accordion title="Co nigdy nie pojawia się w wyjściu Prometheus">
    - tekst promptu, tekst odpowiedzi, wejścia narzędzi, wyjścia narzędzi, prompty systemowe
    - surowe identyfikatory żądań providera (tylko ograniczone hashe, tam gdzie dotyczy, na spanach — nigdy w metrykach)
    - klucze sesji i identyfikatory sesji
    - nazwy hostów, ścieżki plików, wartości sekretów

  </Accordion>
</AccordionGroup>

## Receptury PromQL

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

# Dropped Prometheus series (cardinality alarm)
increase(openclaw_prometheus_series_dropped_total[15m]) > 0
```

<Tip>
Dla dashboardów między providerami preferuj `gen_ai_client_token_usage`: jest zgodne z konwencjami semantycznymi OpenTelemetry GenAI i spójne z metrykami z usług GenAI spoza OpenClaw.
</Tip>

## Wybór między Prometheus a eksportem OpenTelemetry

OpenClaw obsługuje obie powierzchnie niezależnie. Możesz używać jednej, obu albo żadnej.

<Tabs>
  <Tab title="diagnostics-prometheus">
    - Model **pull**: Prometheus odczytuje `/api/diagnostics/prometheus`.
    - Nie wymaga zewnętrznego collectora.
    - Uwierzytelnianie przez zwykłe auth Gateway.
    - Powierzchnia obejmuje tylko metryki (bez śladów i logów).
    - Najlepsze dla stosów już opartych na Prometheus + Grafana.

  </Tab>
  <Tab title="diagnostics-otel">
    - Model **push**: OpenClaw wysyła OTLP/HTTP do collectora lub backendu zgodnego z OTLP.
    - Powierzchnia obejmuje metryki, ślady i logi.
    - Mostkuje do Prometheus przez OpenTelemetry Collector (eksporter `prometheus` lub `prometheusremotewrite`), gdy potrzebujesz obu.
    - Pełny katalog znajdziesz w [Eksport OpenTelemetry](/pl/gateway/opentelemetry).

  </Tab>
</Tabs>

## Rozwiązywanie problemów

<AccordionGroup>
  <Accordion title="Puste body odpowiedzi">
    - Sprawdź `diagnostics.enabled: true` w konfiguracji.
    - Potwierdź, że plugin jest włączony i załadowany, używając `openclaw plugins list --enabled`.
    - Wygeneruj trochę ruchu; countery i histogramy emitują linie dopiero po co najmniej jednym zdarzeniu.

  </Accordion>
  <Accordion title="401 / unauthorized">
    Endpoint wymaga zakresu operatora Gateway (`auth: "gateway"` z `gatewayRuntimeScopeSurface: "trusted-operator"`). Użyj tego samego tokenu lub hasła, którego Prometheus używa do każdej innej trasy operatora Gateway. Nie ma publicznego trybu nieuwierzytelnionego.
  </Accordion>
  <Accordion title="`openclaw_prometheus_series_dropped_total` rośnie">
    Nowy atrybut przekracza limit **2048** serii. Sprawdź ostatnie metryki pod kątem etykiety o nieoczekiwanie wysokiej kardynalności i napraw źródło. Eksporter celowo odrzuca nowe serie zamiast po cichu przepisywać etykiety.
  </Accordion>
  <Accordion title="Prometheus pokazuje nieaktualne serie po restarcie">
    Plugin przechowuje stan wyłącznie w pamięci. Po restarcie Gateway countery resetują się do zera, a gauge’e startują od następnej zgłoszonej wartości. Używaj w PromQL `rate()` i `increase()`, aby poprawnie obsługiwać resety.
  </Accordion>
</AccordionGroup>

## Powiązane

- [Eksport diagnostyki](/pl/gateway/diagnostics) — lokalny zip diagnostyczny do paczek wsparcia
- [Health i gotowość](/pl/gateway/health) — sondy `/healthz` i `/readyz`
- [Logowanie](/pl/logging) — logowanie oparte na plikach
- [Eksport OpenTelemetry](/pl/gateway/opentelemetry) — push OTLP dla śladów, metryk i logów

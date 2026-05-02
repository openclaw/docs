---
read_when:
    - Chcesz, aby Prometheus, Grafana, VictoriaMetrics lub inne narzędzie zbierające zbierało metryki OpenClaw Gateway
    - Potrzebujesz nazw metryk Prometheus oraz zasad dotyczących etykiet dla paneli kontrolnych lub alertów
    - Chcesz mieć metryki bez uruchamiania kolektora OpenTelemetry
sidebarTitle: Prometheus
summary: Udostępnij diagnostykę OpenClaw jako metryki tekstowe Prometheus za pomocą Plugin diagnostics-prometheus
title: Metryki Prometheusa
x-i18n:
    generated_at: "2026-05-02T20:44:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 49df17348c5b63c4b5f3c05f3378d43764e5de985135ad30c1e74ef607e0dd37
    source_path: gateway/prometheus.md
    workflow: 16
---

OpenClaw może udostępniać metryki diagnostyczne za pomocą oficjalnego Plugin `diagnostics-prometheus`. Nasłuchuje on zaufanych wewnętrznych zdarzeń diagnostycznych i renderuje tekstowy endpoint Prometheus pod adresem:

```text
GET /api/diagnostics/prometheus
```

Typ zawartości to `text/plain; version=0.0.4; charset=utf-8`, czyli standardowy format ekspozycji Prometheus.

<Warning>
Trasa używa uwierzytelniania Gateway (zakres operatora). Nie udostępniaj jej jako publicznego, nieuwierzytelnionego endpointu `/metrics`. Scrapuj ją przez tę samą ścieżkę uwierzytelniania, której używasz dla innych API operatora.
</Warning>

Informacje o śladach, logach, wypychaniu OTLP i atrybutach semantycznych OpenTelemetry GenAI znajdziesz w [eksport OpenTelemetry](/pl/gateway/opentelemetry).

## Szybki start

<Steps>
  <Step title="Zainstaluj Plugin">
    ```bash
    openclaw plugins install clawhub:@openclaw/diagnostics-prometheus
    ```
  </Step>
  <Step title="Włącz Plugin">
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
    Trasa HTTP jest rejestrowana podczas uruchamiania Plugin, więc przeładuj po włączeniu.
  </Step>
  <Step title="Scrapuj chronioną trasę">
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
`diagnostics.enabled: true` jest wymagane. Bez tego Plugin nadal rejestruje trasę HTTP, ale żadne zdarzenia diagnostyczne nie trafiają do eksportera, więc odpowiedź jest pusta.
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
| `openclaw_memory_rss_bytes`                   | histogram | brak                                                                                      |
| `openclaw_memory_pressure_total`              | counter   | `level`, `reason`                                                                         |
| `openclaw_telemetry_exporter_total`           | counter   | `exporter`, `reason`, `signal`, `status`                                                  |
| `openclaw_prometheus_series_dropped_total`    | counter   | brak                                                                                      |

## Zasady etykiet

<AccordionGroup>
  <Accordion title="Ograniczone etykiety o niskiej kardynalności">
    Etykiety Prometheus pozostają ograniczone i mają niską kardynalność. Eksporter nie emituje surowych identyfikatorów diagnostycznych, takich jak `runId`, `sessionKey`, `sessionId`, `callId`, `toolCallId`, identyfikatory wiadomości, identyfikatory czatów ani identyfikatory żądań dostawcy.

    Wartości etykiet są redagowane i muszą spełniać zasady OpenClaw dotyczące znaków o niskiej kardynalności. Wartości, które nie spełniają zasad, są zastępowane przez `unknown`, `other` lub `none`, zależnie od metryki.

  </Accordion>
  <Accordion title="Limit serii i rozliczanie przepełnienia">
    Eksporter ogranicza przechowywane szeregi czasowe w pamięci do **2048** serii łącznie dla liczników, wskaźników i histogramów. Nowe serie ponad ten limit są odrzucane, a `openclaw_prometheus_series_dropped_total` zwiększa się o jeden za każdym razem.

    Monitoruj ten licznik jako twardy sygnał, że atrybut wyżej w łańcuchu przepuszcza wartości o wysokiej kardynalności. Eksporter nigdy automatycznie nie podnosi limitu; jeśli licznik rośnie, napraw źródło zamiast wyłączać limit.

  </Accordion>
  <Accordion title="Co nigdy nie pojawia się w wyjściu Prometheus">
    - tekst promptu, tekst odpowiedzi, dane wejściowe narzędzi, dane wyjściowe narzędzi, prompty systemowe
    - surowe identyfikatory żądań dostawcy (tylko ograniczone hashe, tam gdzie ma to zastosowanie, w spanach — nigdy w metrykach)
    - klucze sesji i identyfikatory sesji
    - nazwy hostów, ścieżki plików, wartości sekretów

  </Accordion>
</AccordionGroup>

## Przepisy PromQL

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
Preferuj `gen_ai_client_token_usage` dla pulpitów między dostawcami: podąża za konwencjami semantycznymi OpenTelemetry GenAI i jest spójne z metrykami z usług GenAI innych niż OpenClaw.
</Tip>

## Wybór między eksportem Prometheus i OpenTelemetry

OpenClaw obsługuje obie powierzchnie niezależnie. Możesz uruchomić jedną, obie albo żadnej.

<Tabs>
  <Tab title="diagnostics-prometheus">
    - Model **pull**: Prometheus scrapuje `/api/diagnostics/prometheus`.
    - Nie jest wymagany zewnętrzny kolektor.
    - Uwierzytelnianie odbywa się przez normalne uwierzytelnianie Gateway.
    - Powierzchnia obejmuje tylko metryki (bez śladów ani logów).
    - Najlepsze dla stosów już ustandaryzowanych na Prometheus + Grafana.

  </Tab>
  <Tab title="diagnostics-otel">
    - Model **push**: OpenClaw wysyła OTLP/HTTP do kolektora lub backendu zgodnego z OTLP.
    - Powierzchnia obejmuje metryki, ślady i logi.
    - Łączy z Prometheus przez OpenTelemetry Collector (eksporter `prometheus` lub `prometheusremotewrite`), gdy potrzebujesz obu.
    - Pełny katalog znajdziesz w [eksport OpenTelemetry](/pl/gateway/opentelemetry).

  </Tab>
</Tabs>

## Rozwiązywanie problemów

<AccordionGroup>
  <Accordion title="Pusta treść odpowiedzi">
    - Sprawdź `diagnostics.enabled: true` w konfiguracji.
    - Potwierdź, że Plugin jest włączony i załadowany poleceniem `openclaw plugins list --enabled`.
    - Wygeneruj trochę ruchu; liczniki i histogramy emitują wiersze dopiero po co najmniej jednym zdarzeniu.

  </Accordion>
  <Accordion title="401 / brak autoryzacji">
    Endpoint wymaga zakresu operatora Gateway (`auth: "gateway"` z `gatewayRuntimeScopeSurface: "trusted-operator"`). Użyj tego samego tokenu lub hasła, którego Prometheus używa dla dowolnej innej trasy operatora Gateway. Nie ma publicznego trybu bez uwierzytelniania.
  </Accordion>
  <Accordion title="`openclaw_prometheus_series_dropped_total` rośnie">
    Nowy atrybut przekracza limit **2048** serii. Sprawdź ostatnie metryki pod kątem etykiety o nieoczekiwanie wysokiej kardynalności i napraw ją u źródła. Eksporter celowo odrzuca nowe serie zamiast po cichu przepisywać etykiety.
  </Accordion>
  <Accordion title="Prometheus pokazuje nieaktualne serie po restarcie">
    Plugin przechowuje stan tylko w pamięci. Po restarcie Gateway liczniki resetują się do zera, a wskaźniki wznawiają działanie przy następnej zgłoszonej wartości. Użyj PromQL `rate()` i `increase()`, aby poprawnie obsługiwać resety.
  </Accordion>
</AccordionGroup>

## Powiązane

- [Eksport diagnostyki](/pl/gateway/diagnostics) — lokalne archiwum zip diagnostyki dla pakietów wsparcia
- [Kondycja i gotowość](/pl/gateway/health) — sondy `/healthz` i `/readyz`
- [Logowanie](/pl/logging) — logowanie oparte na plikach
- [Eksport OpenTelemetry](/pl/gateway/opentelemetry) — wypychanie OTLP dla śladów, metryk i logów

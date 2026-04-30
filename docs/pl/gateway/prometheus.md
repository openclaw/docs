---
read_when:
    - Chcesz, aby Prometheus, Grafana, VictoriaMetrics lub inne narzędzie zbierające pobierało metryki OpenClaw Gateway
    - Potrzebujesz nazw metryk Prometheus oraz zasad dotyczących etykiet dla pulpitów nawigacyjnych lub alertów
    - Chcesz mieć metryki bez uruchamiania kolektora OpenTelemetry
sidebarTitle: Prometheus
summary: Udostępnij diagnostykę OpenClaw jako metryki tekstowe Prometheus za pośrednictwem Plugin diagnostics-prometheus
title: Metryki Prometheus
x-i18n:
    generated_at: "2026-04-30T09:55:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: d75a97a0b9dedd89eb25fee83626d8d726917872cc1c3bfcbf6e9634dd168a2b
    source_path: gateway/prometheus.md
    workflow: 16
---

OpenClaw może udostępniać metryki diagnostyczne przez dołączony Plugin `diagnostics-prometheus`. Nasłuchuje zaufanej diagnostyki wewnętrznej i renderuje tekstowy endpoint Prometheus pod adresem:

```text
GET /api/diagnostics/prometheus
```

Typ zawartości to `text/plain; version=0.0.4; charset=utf-8`, czyli standardowy format ekspozycji Prometheus.

<Warning>
Trasa używa uwierzytelniania Gateway (zakres operatora). Nie udostępniaj jej jako publicznego, nieuwierzytelnionego endpointu `/metrics`. Scrape wykonuj przez tę samą ścieżkę uwierzytelniania, której używasz dla innych API operatora.
</Warning>

Informacje o śladach, logach, push OTLP i atrybutach semantycznych OpenTelemetry GenAI znajdziesz w sekcji [Eksport OpenTelemetry](/pl/gateway/opentelemetry).

## Szybki start

<Steps>
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
    Trasa HTTP jest rejestrowana podczas uruchamiania pluginu, więc po włączeniu wykonaj ponowne wczytanie.
  </Step>
  <Step title="Scrape chronionej trasy">
    Wyślij to samo uwierzytelnianie gateway, którego używają klienci operatora:

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

## Zasady dotyczące etykiet

<AccordionGroup>
  <Accordion title="Ograniczone etykiety o niskiej kardynalności">
    Etykiety Prometheus pozostają ograniczone i mają niską kardynalność. Eksporter nie emituje surowych identyfikatorów diagnostycznych, takich jak `runId`, `sessionKey`, `sessionId`, `callId`, `toolCallId`, identyfikatory wiadomości, identyfikatory czatów ani identyfikatory żądań dostawców.

    Wartości etykiet są redagowane i muszą pasować do polityki znaków o niskiej kardynalności OpenClaw. Wartości, które nie spełniają tej polityki, są zastępowane przez `unknown`, `other` albo `none`, zależnie od metryki.

  </Accordion>
  <Accordion title="Limit serii i rozliczanie przepełnienia">
    Eksporter ogranicza liczbę przechowywanych w pamięci szeregów czasowych do **2048** serii łącznie dla liczników, mierników i histogramów. Nowe serie ponad ten limit są odrzucane, a `openclaw_prometheus_series_dropped_total` zwiększa się o jeden za każdym razem.

    Obserwuj ten licznik jako twardy sygnał, że atrybut wyżej w potoku przepuszcza wartości o wysokiej kardynalności. Eksporter nigdy nie podnosi limitu automatycznie; jeśli licznik rośnie, napraw źródło zamiast wyłączać limit.

  </Accordion>
  <Accordion title="Co nigdy nie pojawia się w wyjściu Prometheus">
    - tekst promptu, tekst odpowiedzi, dane wejściowe narzędzi, dane wyjściowe narzędzi, prompty systemowe
    - surowe identyfikatory żądań dostawców (tylko ograniczone hashe, gdy mają zastosowanie, w spanach — nigdy w metrykach)
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
Preferuj `gen_ai_client_token_usage` dla dashboardów obejmujących wielu dostawców: jest zgodne z konwencjami semantycznymi OpenTelemetry GenAI i spójne z metrykami usług GenAI innych niż OpenClaw.
</Tip>

## Wybór między Prometheus a eksportem OpenTelemetry

OpenClaw obsługuje obie powierzchnie niezależnie. Możesz uruchomić jedną z nich, obie albo żadną.

<Tabs>
  <Tab title="diagnostics-prometheus">
    - Model **pull**: Prometheus pobiera `/api/diagnostics/prometheus`.
    - Nie jest wymagany zewnętrzny kolektor.
    - Uwierzytelnianie odbywa się przez zwykłe uwierzytelnianie Gateway.
    - Powierzchnia obejmuje tylko metryki (bez śladów i logów).
    - Najlepsze dla stosów już ustandaryzowanych na Prometheus + Grafana.

  </Tab>
  <Tab title="diagnostics-otel">
    - Model **push**: OpenClaw wysyła OTLP/HTTP do kolektora albo backendu zgodnego z OTLP.
    - Powierzchnia obejmuje metryki, ślady i logi.
    - Łączy się z Prometheus przez OpenTelemetry Collector (eksporter `prometheus` albo `prometheusremotewrite`), gdy potrzebujesz obu.
    - Pełny katalog znajdziesz w sekcji [Eksport OpenTelemetry](/pl/gateway/opentelemetry).

  </Tab>
</Tabs>

## Rozwiązywanie problemów

<AccordionGroup>
  <Accordion title="Pusta treść odpowiedzi">
    - Sprawdź `diagnostics.enabled: true` w konfiguracji.
    - Potwierdź, że Plugin jest włączony i załadowany za pomocą `openclaw plugins list --enabled`.
    - Wygeneruj ruch; liczniki i histogramy emitują linie dopiero po co najmniej jednym zdarzeniu.

  </Accordion>
  <Accordion title="401 / brak autoryzacji">
    Endpoint wymaga zakresu operatora Gateway (`auth: "gateway"` z `gatewayRuntimeScopeSurface: "trusted-operator"`). Użyj tego samego tokenu albo hasła, którego Prometheus używa dla każdej innej trasy operatora Gateway. Nie ma publicznego trybu bez uwierzytelniania.
  </Accordion>
  <Accordion title="`openclaw_prometheus_series_dropped_total` rośnie">
    Nowy atrybut przekracza limit **2048** serii. Sprawdź ostatnie metryki pod kątem etykiety o nieoczekiwanie wysokiej kardynalności i napraw ją u źródła. Eksporter celowo odrzuca nowe serie zamiast po cichu przepisywać etykiety.
  </Accordion>
  <Accordion title="Prometheus pokazuje nieaktualne serie po ponownym uruchomieniu">
    Plugin przechowuje stan tylko w pamięci. Po ponownym uruchomieniu Gateway liczniki resetują się do zera, a mierniki uruchamiają się ponownie przy następnej zgłoszonej wartości. Użyj PromQL `rate()` i `increase()`, aby poprawnie obsłużyć resety.
  </Accordion>
</AccordionGroup>

## Powiązane

- [Eksport diagnostyki](/pl/gateway/diagnostics) — lokalny zip diagnostyczny dla pakietów wsparcia
- [Kondycja i gotowość](/pl/gateway/health) — sondy `/healthz` i `/readyz`
- [Logowanie](/pl/logging) — logowanie oparte na plikach
- [Eksport OpenTelemetry](/pl/gateway/opentelemetry) — push OTLP dla śladów, metryk i logów

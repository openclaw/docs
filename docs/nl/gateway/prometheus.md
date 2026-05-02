---
read_when:
    - Je wilt dat Prometheus, Grafana, VictoriaMetrics of een andere scraper OpenClaw Gateway-metrics verzamelt
    - Je hebt de Prometheus-metrieknamen en het labelbeleid nodig voor dashboards of waarschuwingen
    - Je wilt metrics zonder een OpenTelemetry-collector te draaien
sidebarTitle: Prometheus
summary: Stel OpenClaw-diagnostiek beschikbaar als Prometheus-tekstmetrieken via de diagnostics-prometheus Plugin
title: Prometheus-metrieken
x-i18n:
    generated_at: "2026-05-02T20:44:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 49df17348c5b63c4b5f3c05f3378d43764e5de985135ad30c1e74ef607e0dd37
    source_path: gateway/prometheus.md
    workflow: 16
---

OpenClaw kan diagnostische metrics beschikbaar maken via de officiële `diagnostics-prometheus` Plugin. Deze luistert naar vertrouwde interne diagnostics en rendert een Prometheus-teksteindpunt op:

```text
GET /api/diagnostics/prometheus
```

Het contenttype is `text/plain; version=0.0.4; charset=utf-8`, de standaard Prometheus-expositie-indeling.

<Warning>
De route gebruikt Gateway-authenticatie (operatorbereik). Stel deze niet bloot als openbaar, niet-geauthenticeerd `/metrics`-eindpunt. Scrape deze via hetzelfde authenticatiepad dat je gebruikt voor andere operator-API's.
</Warning>

Voor traces, logs, OTLP-push en OpenTelemetry GenAI-semantische attributen, zie [OpenTelemetry-export](/nl/gateway/opentelemetry).

## Snel aan de slag

<Steps>
  <Step title="Installeer de Plugin">
    ```bash
    openclaw plugins install clawhub:@openclaw/diagnostics-prometheus
    ```
  </Step>
  <Step title="Schakel de Plugin in">
    <Tabs>
      <Tab title="Config">
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
  <Step title="Herstart de Gateway">
    De HTTP-route wordt geregistreerd bij het opstarten van de Plugin, dus laad opnieuw na het inschakelen.
  </Step>
  <Step title="Scrape de beschermde route">
    Stuur dezelfde gateway-authenticatie die je operatorclients gebruiken:

    ```bash
    curl -H "Authorization: Bearer $OPENCLAW_GATEWAY_TOKEN" \
      http://127.0.0.1:18789/api/diagnostics/prometheus
    ```

  </Step>
  <Step title="Koppel Prometheus">
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
`diagnostics.enabled: true` is vereist. Zonder deze instelling registreert de Plugin nog steeds de HTTP-route, maar stromen er geen diagnostische events naar de exporter, waardoor de response leeg is.
</Note>

## Geëxporteerde metrics

| Metric                                        | Type      | Labels                                                                                    |
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
| `openclaw_memory_rss_bytes`                   | histogram | geen                                                                                      |
| `openclaw_memory_pressure_total`              | counter   | `level`, `reason`                                                                         |
| `openclaw_telemetry_exporter_total`           | counter   | `exporter`, `reason`, `signal`, `status`                                                  |
| `openclaw_prometheus_series_dropped_total`    | counter   | geen                                                                                      |

## Labelbeleid

<AccordionGroup>
  <Accordion title="Begrensde labels met lage cardinaliteit">
    Prometheus-labels blijven begrensd en hebben lage cardinaliteit. De exporter emitteert geen ruwe diagnostische identifiers zoals `runId`, `sessionKey`, `sessionId`, `callId`, `toolCallId`, bericht-ID's, chat-ID's of provider-request-ID's.

    Labelwaarden worden geredigeerd en moeten voldoen aan OpenClaw's tekenbeleid voor lage cardinaliteit. Waarden die niet aan het beleid voldoen, worden vervangen door `unknown`, `other` of `none`, afhankelijk van de metric.

  </Accordion>
  <Accordion title="Serielimiet en overflow-boekhouding">
    De exporter beperkt behouden tijdreeksen in het geheugen tot **2048** series in totaal voor counters, gauges en histograms samen. Nieuwe series boven die limiet worden gedropt, en `openclaw_prometheus_series_dropped_total` wordt telkens met één verhoogd.

    Houd deze counter in de gaten als hard signaal dat een upstream-attribuut waarden met hoge cardinaliteit lekt. De exporter verhoogt de limiet nooit automatisch; als deze oploopt, los dan de bron op in plaats van de limiet uit te schakelen.

  </Accordion>
  <Accordion title="Wat nooit in Prometheus-output verschijnt">
    - prompttekst, responstekst, toolinputs, tooloutputs, systeemprompts
    - ruwe provider-request-ID's (alleen begrensde hashes, waar van toepassing, op spans — nooit op metrics)
    - sessiesleutels en sessie-ID's
    - hostnamen, bestandspaden, geheime waarden

  </Accordion>
</AccordionGroup>

## PromQL-recepten

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
Geef de voorkeur aan `gen_ai_client_token_usage` voor dashboards over providers heen: dit volgt de semantische conventies van OpenTelemetry GenAI en is consistent met metrics van GenAI-services buiten OpenClaw.
</Tip>

## Kiezen tussen Prometheus- en OpenTelemetry-export

OpenClaw ondersteunt beide oppervlakken onafhankelijk. Je kunt een van beide gebruiken, allebei of geen van beide.

<Tabs>
  <Tab title="diagnostics-prometheus">
    - **Pull**-model: Prometheus scrapt `/api/diagnostics/prometheus`.
    - Geen externe collector vereist.
    - Geauthenticeerd via normale Gateway-authenticatie.
    - Het oppervlak is alleen metrics (geen traces of logs).
    - Het meest geschikt voor stacks die al gestandaardiseerd zijn op Prometheus + Grafana.

  </Tab>
  <Tab title="diagnostics-otel">
    - **Push**-model: OpenClaw stuurt OTLP/HTTP naar een collector of OTLP-compatibele backend.
    - Het oppervlak omvat metrics, traces en logs.
    - Slaat een brug naar Prometheus via een OpenTelemetry Collector (`prometheus`- of `prometheusremotewrite`-exporter) wanneer je beide nodig hebt.
    - Zie [OpenTelemetry-export](/nl/gateway/opentelemetry) voor de volledige catalogus.

  </Tab>
</Tabs>

## Problemen oplossen

<AccordionGroup>
  <Accordion title="Lege responsebody">
    - Controleer `diagnostics.enabled: true` in de config.
    - Bevestig dat de Plugin is ingeschakeld en geladen met `openclaw plugins list --enabled`.
    - Genereer wat verkeer; counters en histograms emitten pas regels na minstens één event.

  </Accordion>
  <Accordion title="401 / unauthorized">
    Het eindpunt vereist het Gateway-operatorbereik (`auth: "gateway"` met `gatewayRuntimeScopeSurface: "trusted-operator"`). Gebruik hetzelfde token of wachtwoord dat Prometheus gebruikt voor elke andere Gateway-operatorroute. Er is geen openbare, niet-geauthenticeerde modus.
  </Accordion>
  <Accordion title="`openclaw_prometheus_series_dropped_total` loopt op">
    Een nieuw attribuut overschrijdt de limiet van **2048** series. Inspecteer recente metrics op een onverwacht label met hoge cardinaliteit en los dit op bij de bron. De exporter dropt bewust nieuwe series in plaats van labels stilzwijgend te herschrijven.
  </Accordion>
  <Accordion title="Prometheus toont verouderde series na een herstart">
    De Plugin houdt status alleen in geheugen bij. Na een Gateway-herstart worden counters teruggezet naar nul en beginnen gauges opnieuw bij hun volgende gerapporteerde waarde. Gebruik PromQL `rate()` en `increase()` om resets netjes af te handelen.
  </Accordion>
</AccordionGroup>

## Gerelateerd

- [Diagnostics-export](/nl/gateway/diagnostics) — lokale diagnostics-zip voor supportbundels
- [Health en readiness](/nl/gateway/health) — `/healthz`- en `/readyz`-probes
- [Logging](/nl/logging) — bestandsgebaseerde logging
- [OpenTelemetry-export](/nl/gateway/opentelemetry) — OTLP-push voor traces, metrics en logs

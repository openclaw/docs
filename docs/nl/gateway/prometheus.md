---
read_when:
    - Je wilt dat Prometheus, Grafana, VictoriaMetrics of een andere scraper OpenClaw Gateway-metrics verzamelt
    - Je hebt de Prometheus-metricnamen en het labelbeleid nodig voor dashboards of waarschuwingen
    - Je wilt metrieken zonder een OpenTelemetry-collector te draaien
sidebarTitle: Prometheus
summary: Stel OpenClaw-diagnostiek beschikbaar als Prometheus-tekstmetrieken via de diagnostics-prometheus-plugin
title: Prometheus-metrieken
x-i18n:
    generated_at: "2026-05-06T11:28:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 864e2a343266d84baaaaca9d8e494359198a3b43e8663ec8dcfcd4e2e4c6c004
    source_path: gateway/prometheus.md
    workflow: 16
---

OpenClaw kan diagnostische metrics beschikbaar maken via de officiële `diagnostics-prometheus`-plugin. Deze luistert naar vertrouwde interne diagnostiek en geeft een Prometheus-teksteindpunt weer op:

```text
GET /api/diagnostics/prometheus
```

Het contenttype is `text/plain; version=0.0.4; charset=utf-8`, de standaard Prometheus-expositie-indeling.

<Warning>
De route gebruikt Gateway-authenticatie (operator-scope). Stel deze niet beschikbaar als openbaar, niet-geverifieerd `/metrics`-eindpunt. Scrape deze via hetzelfde authenticatiepad dat je gebruikt voor andere operator-API's.
</Warning>

Voor traces, logs, OTLP-push en OpenTelemetry GenAI-semantische attributen, zie [OpenTelemetry-export](/nl/gateway/opentelemetry).

## Snel aan de slag

<Steps>
  <Step title="Installeer de plugin">
    ```bash
    openclaw plugins install clawhub:@openclaw/diagnostics-prometheus
    ```
  </Step>
  <Step title="Schakel de plugin in">
    <Tabs>
      <Tab title="Configuratie">
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
    De HTTP-route wordt geregistreerd bij het starten van de plugin, dus laad opnieuw na het inschakelen.
  </Step>
  <Step title="Scrape de beveiligde route">
    Stuur dezelfde gateway-authenticatie mee die je operator-clients gebruiken:

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
`diagnostics.enabled: true` is vereist. Zonder deze instelling registreert de plugin nog steeds de HTTP-route, maar stromen er geen diagnostische gebeurtenissen naar de exporter, waardoor de respons leeg is.
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
| `openclaw_message_delivery_started_total`     | counter   | `channel`, `delivery_kind`                                                                |
| `openclaw_message_delivery_total`             | counter   | `channel`, `delivery_kind`, `error_category`, `outcome`                                   |
| `openclaw_message_delivery_duration_seconds`  | histogram | `channel`, `delivery_kind`, `error_category`, `outcome`                                   |
| `openclaw_talk_event_total`                   | counter   | `brain`, `event_type`, `mode`, `provider`, `transport`                                    |
| `openclaw_talk_event_duration_seconds`        | histogram | `brain`, `event_type`, `mode`, `provider`, `transport`                                    |
| `openclaw_talk_audio_bytes`                   | histogram | `brain`, `event_type`, `mode`, `provider`, `transport`                                    |
| `openclaw_queue_lane_size`                    | gauge     | `lane`                                                                                    |
| `openclaw_queue_lane_wait_seconds`            | histogram | `lane`                                                                                    |
| `openclaw_session_state_total`                | counter   | `reason`, `state`                                                                         |
| `openclaw_session_queue_depth`                | gauge     | `state`                                                                                   |
| `openclaw_session_recovery_total`             | counter   | `action`, `active_work_kind`, `state`, `status`                                           |
| `openclaw_session_recovery_age_seconds`       | histogram | `action`, `active_work_kind`, `state`, `status`                                           |
| `openclaw_memory_bytes`                       | gauge     | `kind`                                                                                    |
| `openclaw_memory_rss_bytes`                   | histogram | geen                                                                                      |
| `openclaw_memory_pressure_total`              | counter   | `level`, `reason`                                                                         |
| `openclaw_telemetry_exporter_total`           | counter   | `exporter`, `reason`, `signal`, `status`                                                  |
| `openclaw_prometheus_series_dropped_total`    | counter   | geen                                                                                      |

## Labelbeleid

<AccordionGroup>
  <Accordion title="Begrensde labels met lage cardinaliteit">
    Prometheus-labels blijven begrensd en hebben lage cardinaliteit. De exporter geeft geen onbewerkte diagnostische identifiers weer, zoals `runId`, `sessionKey`, `sessionId`, `callId`, `toolCallId`, bericht-ID's, chat-ID's of provider-request-ID's.

    Labelwaarden worden geredigeerd en moeten voldoen aan OpenClaw's tekenbeleid voor lage cardinaliteit. Waarden die niet aan het beleid voldoen, worden vervangen door `unknown`, `other` of `none`, afhankelijk van de metric.

  </Accordion>
  <Accordion title="Limiet voor reeksen en overflow-boekhouding">
    De exporteur beperkt bewaarde tijdreeksen in het geheugen tot **2048** reeksen in totaal voor counters, gauges en histogrammen samen. Nieuwe reeksen boven die limiet worden verwijderd, en `openclaw_prometheus_series_dropped_total` wordt telkens met één verhoogd.

    Houd deze counter in de gaten als duidelijk signaal dat een bovenliggend attribuut waarden met hoge cardinaliteit lekt. De exporteur verhoogt de limiet nooit automatisch; als deze oploopt, los dan de bron op in plaats van de limiet uit te schakelen.

  </Accordion>
  <Accordion title="Wat nooit in Prometheus-uitvoer verschijnt">
    - prompttekst, antwoordtekst, toolinvoer, tooluitvoer, systeemprompts
    - Talk-transcripten, audio-payloads, oproep-id's, ruimte-id's, overdrachtstokens, beurt-id's en ruwe sessie-id's
    - ruwe provider-aanvraag-id's (alleen begrensde hashes, waar van toepassing, op spans — nooit op metrics)
    - sessiesleutels en sessie-id's
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
Gebruik bij voorkeur `gen_ai_client_token_usage` voor dashboards over meerdere providers: deze volgt de semantische conventies van OpenTelemetry GenAI en is consistent met metrics van GenAI-services buiten OpenClaw.
</Tip>

## Kiezen tussen Prometheus- en OpenTelemetry-export

OpenClaw ondersteunt beide oppervlakken onafhankelijk. Je kunt een van beide, beide of geen van beide gebruiken.

<Tabs>
  <Tab title="diagnostics-prometheus">
    - **Pull**-model: Prometheus scrapt `/api/diagnostics/prometheus`.
    - Geen externe collector vereist.
    - Geauthenticeerd via normale Gateway-authenticatie.
    - Oppervlak is alleen metrics (geen traces of logs).
    - Beste keuze voor stacks die al zijn gestandaardiseerd op Prometheus + Grafana.

  </Tab>
  <Tab title="diagnostics-otel">
    - **Push**-model: OpenClaw verzendt OTLP/HTTP naar een collector of OTLP-compatibele backend.
    - Oppervlak bevat metrics, traces en logs.
    - Verbindt met Prometheus via een OpenTelemetry Collector (`prometheus`- of `prometheusremotewrite`-exporteur) wanneer je beide nodig hebt.
    - Zie [OpenTelemetry-export](/nl/gateway/opentelemetry) voor de volledige catalogus.

  </Tab>
</Tabs>

## Probleemoplossing

<AccordionGroup>
  <Accordion title="Lege antwoordbody">
    - Controleer `diagnostics.enabled: true` in de configuratie.
    - Bevestig dat de Plugin is ingeschakeld en geladen met `openclaw plugins list --enabled`.
    - Genereer wat verkeer; counters en histogrammen geven pas regels uit na minstens één gebeurtenis.

  </Accordion>
  <Accordion title="401 / niet geautoriseerd">
    Het endpoint vereist de operatorscope van de Gateway (`auth: "gateway"` met `gatewayRuntimeScopeSurface: "trusted-operator"`). Gebruik hetzelfde token of wachtwoord dat Prometheus gebruikt voor elke andere operatorroute van de Gateway. Er is geen openbare niet-geauthenticeerde modus.
  </Accordion>
  <Accordion title="`openclaw_prometheus_series_dropped_total` loopt op">
    Een nieuw attribuut overschrijdt de limiet van **2048** reeksen. Inspecteer recente metrics op een label met onverwacht hoge cardinaliteit en los dit op bij de bron. De exporteur verwijdert nieuwe reeksen bewust in plaats van labels stilzwijgend te herschrijven.
  </Accordion>
  <Accordion title="Prometheus toont verouderde reeksen na een herstart">
    De Plugin bewaart status alleen in het geheugen. Na een herstart van de Gateway worden counters teruggezet naar nul en starten gauges opnieuw bij hun volgende gerapporteerde waarde. Gebruik PromQL `rate()` en `increase()` om resets netjes af te handelen.
  </Accordion>
</AccordionGroup>

## Gerelateerd

- [Diagnostiekexport](/nl/gateway/diagnostics) — lokale diagnostiek-zip voor ondersteuningsbundels
- [Status en gereedheid](/nl/gateway/health) — `/healthz`- en `/readyz`-probes
- [Logging](/nl/logging) — bestandsgebaseerde logging
- [OpenTelemetry-export](/nl/gateway/opentelemetry) — OTLP-push voor traces, metrieken en logs

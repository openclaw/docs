---
read_when:
    - Je wilt dat Prometheus, Grafana, VictoriaMetrics of een andere scraper OpenClaw Gateway-metrics verzamelt
    - Je hebt de Prometheus-metrieknamen en het labelbeleid nodig voor dashboards of waarschuwingen
    - Je wilt metrische gegevens zonder een OpenTelemetry-collector te draaien
sidebarTitle: Prometheus
summary: Stel OpenClaw-diagnostiek beschikbaar als Prometheus-tekstmetrieken via de diagnostics-prometheus-plugin
title: Prometheus-metrieken
x-i18n:
    generated_at: "2026-06-27T17:36:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f9d3f6cf5af2e3770cd3a86e968fe25d2c3b3b87524ba1d229ef585671d320a8
    source_path: gateway/prometheus.md
    workflow: 16
---

  OpenClaw kan diagnostische metrics beschikbaar stellen via de officiële `diagnostics-prometheus`-plugin. Deze luistert naar vertrouwde diagnostiek plus door de kern uitgezonden Gateway-stabiliteitsgebeurtenissen en rendert vervolgens een Prometheus-teksteindpunt op: 

  ```text
  GET /api/diagnostics/prometheus
  ```

  Het contenttype is `text/plain; version=0.0.4; charset=utf-8`, de standaard Prometheus-expositie-indeling.

  <Warning>
  De route gebruikt Gateway-authenticatie (operator-scope). Stel deze niet beschikbaar als openbaar, niet-geauthenticeerd `/metrics`-eindpunt. Scrape deze via hetzelfde authenticatiepad dat je gebruikt voor andere operator-API's.
  </Warning>

  Zie [OpenTelemetry-export](/nl/gateway/opentelemetry) voor traces, logs, OTLP-push en OpenTelemetry GenAI-semantische attributen.

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
    De HTTP-route wordt geregistreerd bij het opstarten van de plugin, dus herlaad na het inschakelen.
  </Step>
  <Step title="Scrape de beschermde route">
    Verstuur dezelfde Gateway-authenticatie die je operatorclients gebruiken:

    ```bash
    curl -H "Authorization: Bearer $OPENCLAW_GATEWAY_TOKEN" \
      http://127.0.0.1:18789/api/diagnostics/prometheus
    ```

  </Step>
  <Step title="Prometheus aansluiten">
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
`diagnostics.enabled: true` is vereist. Zonder deze instelling registreert de Plugin nog steeds de HTTP-route, maar stromen er geen diagnostische gebeurtenissen naar de exporter, waardoor het antwoord leeg is.
</Note>

## Geëxporteerde metrics

| Metric                                           | Type      | Labels                                                                                    |
| ------------------------------------------------ | --------- | ----------------------------------------------------------------------------------------- |
| `openclaw_run_completed_total`                   | counter   | `channel`, `model`, `outcome`, `provider`, `trigger`                                      |
| `openclaw_run_duration_seconds`                  | histogram | `channel`, `model`, `outcome`, `provider`, `trigger`                                      |
| `openclaw_model_call_total`                      | counter   | `api`, `error_category`, `model`, `outcome`, `provider`, `transport`                      |
| `openclaw_model_call_duration_seconds`           | histogram | `api`, `error_category`, `model`, `outcome`, `provider`, `transport`                      |
| `openclaw_model_failover_total`                  | counter   | `from_model`, `from_provider`, `lane`, `reason`, `suspended`, `to_model`, `to_provider`   |
| `openclaw_model_tokens_total`                    | counter   | `agent`, `channel`, `model`, `provider`, `token_type`                                     |
| `openclaw_gen_ai_client_token_usage`             | histogram | `model`, `provider`, `token_type`                                                         |
| `openclaw_model_cost_usd_total`                  | counter   | `agent`, `channel`, `model`, `provider`                                                   |
| `openclaw_skill_used_total`                      | counter   | `activation`, `agent`, `skill`, `source`                                                  |
| `openclaw_tool_execution_total`                  | counter   | `error_category`, `outcome`, `params_kind`, `tool`, `tool_owner`, `tool_source`           |
| `openclaw_tool_execution_duration_seconds`       | histogram | `error_category`, `outcome`, `params_kind`, `tool`, `tool_owner`, `tool_source`           |
| `openclaw_tool_execution_blocked_total`          | counter   | `denied_reason`, `params_kind`, `tool`, `tool_owner`, `tool_source`                       |
| `openclaw_harness_run_total`                     | counter   | `channel`, `error_category`, `harness`, `model`, `outcome`, `phase`, `plugin`, `provider` |
| `openclaw_harness_run_duration_seconds`          | histogram | `channel`, `error_category`, `harness`, `model`, `outcome`, `phase`, `plugin`, `provider` |
| `openclaw_webhook_received_total`                | counter   | `channel`, `webhook`                                                                      |
| `openclaw_webhook_error_total`                   | counter   | `channel`, `webhook`                                                                      |
| `openclaw_webhook_duration_seconds`              | histogram | `channel`, `webhook`                                                                      |
| `openclaw_message_received_total`                | counter   | `channel`, `source`                                                                       |
| `openclaw_message_dispatch_started_total`        | counter   | `channel`, `source`                                                                       |
| `openclaw_message_dispatch_completed_total`      | counter   | `channel`, `outcome`, `reason`, `source`                                                  |
| `openclaw_message_dispatch_duration_seconds`     | histogram | `channel`, `outcome`, `reason`, `source`                                                  |
| `openclaw_message_processed_total`               | counter   | `channel`, `outcome`, `reason`                                                            |
| `openclaw_message_processed_duration_seconds`    | histogram | `channel`, `outcome`, `reason`                                                            |
| `openclaw_message_delivery_started_total`        | counter   | `channel`, `delivery_kind`                                                                |
| `openclaw_message_delivery_total`                | counter   | `channel`, `delivery_kind`, `error_category`, `outcome`                                   |
| `openclaw_message_delivery_duration_seconds`     | histogram | `channel`, `delivery_kind`, `error_category`, `outcome`                                   |
| `openclaw_talk_event_total`                      | counter   | `brain`, `event_type`, `mode`, `provider`, `transport`                                    |
| `openclaw_talk_event_duration_seconds`           | histogram | `brain`, `event_type`, `mode`, `provider`, `transport`                                    |
| `openclaw_talk_audio_bytes`                      | histogram | `brain`, `event_type`, `mode`, `provider`, `transport`                                    |
| `openclaw_queue_lane_size`                       | gauge     | `lane`                                                                                    |
| `openclaw_queue_lane_wait_seconds`               | histogram | `lane`                                                                                    |
| `openclaw_session_state_total`                   | counter   | `reason`, `state`                                                                         |
| `openclaw_session_queue_depth`                   | gauge     | `state`                                                                                   |
| `openclaw_session_turn_created_total`            | counter   | `agent`, `channel`, `trigger`                                                             |
| `openclaw_session_stuck_total`                   | counter   | `reason`, `state`                                                                         |
| `openclaw_session_stuck_age_seconds`             | histogram | `reason`, `state`                                                                         |
| `openclaw_session_recovery_total`                | counter   | `action`, `active_work_kind`, `state`, `status`                                           |
| `openclaw_session_recovery_age_seconds`          | histogram | `action`, `active_work_kind`, `state`, `status`                                           |
| `openclaw_liveness_warning_total`                | counter   | `reason`                                                                                  |
| `openclaw_liveness_sessions`                     | gauge     | `state`                                                                                   |
| `openclaw_liveness_event_loop_delay_p99_seconds` | histogram | `reason`                                                                                  |
| `openclaw_liveness_event_loop_delay_max_seconds` | histogram | `reason`                                                                                  |
| `openclaw_liveness_event_loop_utilization_ratio` | histogram | `reason`                                                                                  |
| `openclaw_liveness_cpu_core_ratio`               | histogram | `reason`                                                                                  |
| `openclaw_payload_large_total`                   | counter   | `action`, `channel`, `plugin`, `reason`, `surface`                                        |
| `openclaw_payload_large_bytes`                   | histogram | `action`, `channel`, `plugin`, `reason`, `surface`                                        |
| `openclaw_memory_bytes`                          | gauge     | `kind`                                                                                    |
| `openclaw_memory_rss_bytes`                      | histogram | geen                                                                                      |
| `openclaw_memory_pressure_total`                 | counter   | `level`, `reason`                                                                         |
| `openclaw_telemetry_exporter_total`              | counter   | `exporter`, `reason`, `signal`, `status`                                                  |
| `openclaw_prometheus_series_dropped_total`       | counter   | geen                                                                                      |

## Labelbeleid

<AccordionGroup>
  <Accordion title="Begrensde labels met lage kardinaliteit">
    Prometheus-labels blijven begrensd en hebben een lage kardinaliteit. De exporter geeft geen ruwe diagnostische identifiers uit, zoals `runId`, `sessionKey`, `sessionId`, `callId`, `toolCallId`, bericht-ID's, chat-ID's of aanvraag-ID's van providers.

    Labelwaarden worden geredigeerd en moeten voldoen aan OpenClaw's tekenbeleid voor lage kardinaliteit. Waarden die niet aan het beleid voldoen, worden vervangen door `unknown`, `other` of `none`, afhankelijk van de metric. Labels die lijken op gescopete sessiesleutels van agents worden ook vervangen door `unknown`.

  </Accordion>
  <Accordion title="Reekslimiet en overflow-boekhouding">
    De exporter begrenst het aantal bewaarde tijdreeksen in het geheugen tot **2048** reeksen over counters, gauges en histogrammen samen. Nieuwe reeksen boven die limiet worden verwijderd, en `openclaw_prometheus_series_dropped_total` wordt telkens met één verhoogd.

    Houd deze counter in de gaten als hard signaal dat een bovenliggend attribuut waarden met hoge kardinaliteit lekt. De exporter verhoogt de limiet nooit automatisch; als deze oploopt, repareer dan de bron in plaats van de limiet uit te schakelen.

  </Accordion>
  <Accordion title="Wat nooit in Prometheus-uitvoer verschijnt">
    - prompttekst, antwoordtekst, toolinvoer, tooluitvoer, systeemprompts
    - Talk-transcripten, audio-payloads, oproep-id's, ruimte-id's, overdrachtstokens, beurt-id's en ruwe sessie-id's
    - ruwe providerverzoek-id's (alleen begrensde hashes, waar van toepassing, op spans — nooit op metrieken)
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

# Skill usage, split by bounded source
sum by (skill, source) (increase(openclaw_skill_used_total[24h]))

# Dropped Prometheus series (cardinality alarm)
increase(openclaw_prometheus_series_dropped_total[15m]) > 0
```

<Tip>
Geef de voorkeur aan `gen_ai_client_token_usage` voor dashboards over meerdere providers: deze volgt de semantische conventies van OpenTelemetry GenAI en is consistent met metrieken van niet-OpenClaw GenAI-services.
</Tip>

## Kiezen tussen Prometheus- en OpenTelemetry-export

OpenClaw ondersteunt beide oppervlakken onafhankelijk. Je kunt een van beide, beide of geen van beide gebruiken.

<Tabs>
  <Tab title="diagnostics-prometheus">
    - **Pull**-model: Prometheus scrapet `/api/diagnostics/prometheus`.
    - Geen externe collector vereist.
    - Geauthenticeerd via normale Gateway-authenticatie.
    - Oppervlak bevat alleen metrieken (geen traces of logs).
    - Het meest geschikt voor stacks die al op Prometheus + Grafana zijn gestandaardiseerd.

  </Tab>
  <Tab title="diagnostics-otel">
    - **Push**-model: OpenClaw stuurt OTLP/HTTP naar een collector of OTLP-compatibele backend.
    - Oppervlak bevat metrieken, traces en logs.
    - Verbindt met Prometheus via een OpenTelemetry Collector (`prometheus`- of `prometheusremotewrite`-exporter) wanneer je beide nodig hebt.
    - Zie [OpenTelemetry-export](/nl/gateway/opentelemetry) voor de volledige catalogus.

  </Tab>
</Tabs>

## Problemen oplossen

<AccordionGroup>
  <Accordion title="Lege antwoordbody">
    - Controleer `diagnostics.enabled: true` in de configuratie.
    - Bevestig dat de Plugin is ingeschakeld en geladen met `openclaw plugins list --enabled`.
    - Genereer wat verkeer; tellers en histogrammen geven pas regels uit na ten minste één gebeurtenis.

  </Accordion>
  <Accordion title="401 / niet geautoriseerd">
    Het eindpunt vereist de Gateway-operatorscope (`auth: "gateway"` met `gatewayRuntimeScopeSurface: "trusted-operator"`). Gebruik hetzelfde token of wachtwoord dat Prometheus gebruikt voor elke andere Gateway-operatorroute. Er is geen openbare niet-geauthenticeerde modus.
  </Accordion>
  <Accordion title="`openclaw_prometheus_series_dropped_total` loopt op">
    Een nieuw attribuut overschrijdt de limiet van **2048** series. Inspecteer recente metrieken op een onverwacht label met hoge kardinaliteit en los dit bij de bron op. De exporter laat nieuwe series opzettelijk vallen in plaats van labels stilzwijgend te herschrijven.
  </Accordion>
  <Accordion title="Prometheus toont verouderde series na een herstart">
    De Plugin bewaart status alleen in het geheugen. Na een herstart van de Gateway worden tellers teruggezet naar nul en starten gauges opnieuw bij hun volgende gerapporteerde waarde. Gebruik PromQL `rate()` en `increase()` om resets netjes af te handelen.
  </Accordion>
</AccordionGroup>

## Gerelateerd

- [Diagnostiekexport](/nl/gateway/diagnostics) — lokale diagnostiek-zip voor supportbundels
- [Gezondheid en gereedheid](/nl/gateway/health) — `/healthz`- en `/readyz`-probes
- [Logging](/nl/logging) — bestandsgebaseerde logging
- [OpenTelemetry-export](/nl/gateway/opentelemetry) — OTLP-push voor traces, metrieken en logs

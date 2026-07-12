---
read_when:
    - Je wilt dat Prometheus, Grafana, VictoriaMetrics of een andere scraper metrische gegevens van de OpenClaw Gateway verzamelt
    - U hebt de namen van de Prometheus-metrieken en het labelbeleid nodig voor dashboards of waarschuwingen
    - U wilt metrische gegevens zonder een OpenTelemetry-collector uit te voeren
sidebarTitle: Prometheus
summary: Stel OpenClaw-diagnostiek beschikbaar als Prometheus-tekstmetrieken via de diagnostics-prometheus-Plugin
title: Prometheus-metrieken
x-i18n:
    generated_at: "2026-07-12T08:52:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8a3975a9a79f32f1e9731b819613fdf6b9ffeee20bc71c841b9a6d7a5e0052f4
    source_path: gateway/prometheus.md
    workflow: 16
---

  OpenClaw kan diagnostische metrische gegevens beschikbaar stellen via de officiële
  Plugin `diagnostics-prometheus`. Deze luistert naar vertrouwde diagnostiek plus
  intern gelabelde diagnostische gebeurtenissen die eigendom zijn van de dispatcher (signalen voor wachtrijen, geheugen en
  sessieherstel), en biedt een Prometheus-teksteindpunt op:

  ```text
  GET /api/diagnostics/prometheus
  ```

  Het inhoudstype is `text/plain; version=0.0.4; charset=utf-8`, de standaard
  Prometheus-indeling voor gegevenspresentatie.

  <Warning>
  De route gebruikt Gateway-authenticatie (operatorbereik, oppervlak voor vertrouwde operators). Stel deze niet beschikbaar als een openbaar, niet-geverifieerd `/metrics`-eindpunt. Laat deze uitlezen via hetzelfde authenticatiepad dat u voor andere operator-API's gebruikt.
  </Warning>

  Zie [OpenTelemetry-export](/nl/gateway/opentelemetry) voor traces, logboeken, OTLP-push en semantische OpenTelemetry GenAI-attributen.

  ## Snel aan de slag

  <Steps>
  <Step title="De Plugin installeren">
    ```bash
    openclaw plugins install clawhub:@openclaw/diagnostics-prometheus
    ```
  </Step>
  <Step title="De Plugin inschakelen">
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
  <Step title="De Gateway opnieuw starten">
    De HTTP-route wordt bij het starten van de Plugin geregistreerd, dus laad opnieuw nadat u deze hebt ingeschakeld.
  </Step>
  <Step title="De beveiligde route uitlezen">
    Stuur dezelfde Gateway-authenticatie die uw operatorclients gebruiken:

    ```bash
    curl -H "Authorization: Bearer $OPENCLAW_GATEWAY_TOKEN" \
      http://127.0.0.1:18789/api/diagnostics/prometheus
    ```

  </Step>
  <Step title="Prometheus koppelen">
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
`diagnostics.enabled` is standaard ingesteld op `true`; stel dit alleen in strikt beperkte omgevingen in op `false`. Als dit `false` is, registreert de Plugin nog steeds de HTTP-route, maar worden er geen diagnostische gebeurtenissen naar de exporter gestuurd, waardoor het antwoord leeg is.
</Note>

## Geëxporteerde metrische gegevens

| Metriek                                          | Type      | Labels                                                                                    |
| ------------------------------------------------ | --------- | ----------------------------------------------------------------------------------------- |
| `openclaw_run_completed_total`                   | teller    | `channel`, `model`, `outcome`, `provider`, `trigger`                                      |
| `openclaw_run_duration_seconds`                  | histogram | `channel`, `model`, `outcome`, `provider`, `trigger`                                      |
| `openclaw_model_call_total`                      | teller    | `api`, `error_category`, `model`, `outcome`, `provider`, `transport`                      |
| `openclaw_model_call_duration_seconds`           | histogram | `api`, `error_category`, `model`, `outcome`, `provider`, `transport`                      |
| `openclaw_model_failover_total`                  | teller    | `from_model`, `from_provider`, `lane`, `reason`, `suspended`, `to_model`, `to_provider`   |
| `openclaw_model_tokens_total`                    | teller    | `agent`, `channel`, `model`, `provider`, `token_type`                                     |
| `openclaw_gen_ai_client_token_usage`             | histogram | `model`, `provider`, `token_type`                                                         |
| `openclaw_model_cost_usd_total`                  | teller    | `agent`, `channel`, `model`, `provider`                                                   |
| `openclaw_model_usage_duration_seconds`          | histogram | `agent`, `channel`, `model`, `provider`                                                   |
| `openclaw_skill_used_total`                      | teller    | `activation`, `agent`, `skill`, `source`                                                  |
| `openclaw_tool_execution_total`                  | teller    | `error_category`, `outcome`, `params_kind`, `tool`, `tool_owner`, `tool_source`           |
| `openclaw_tool_execution_duration_seconds`       | histogram | `error_category`, `outcome`, `params_kind`, `tool`, `tool_owner`, `tool_source`           |
| `openclaw_tool_execution_blocked_total`          | teller    | `denied_reason`, `params_kind`, `tool`, `tool_owner`, `tool_source`                       |
| `openclaw_harness_run_total`                     | teller    | `channel`, `error_category`, `harness`, `model`, `outcome`, `phase`, `plugin`, `provider` |
| `openclaw_harness_run_duration_seconds`          | histogram | `channel`, `error_category`, `harness`, `model`, `outcome`, `phase`, `plugin`, `provider` |
| `openclaw_webhook_received_total`                | teller    | `channel`, `webhook`                                                                      |
| `openclaw_webhook_error_total`                   | teller    | `channel`, `webhook`                                                                      |
| `openclaw_webhook_duration_seconds`              | histogram | `channel`, `webhook`                                                                      |
| `openclaw_message_received_total`                | teller    | `channel`, `source`                                                                       |
| `openclaw_message_dispatch_started_total`        | teller    | `channel`, `source`                                                                       |
| `openclaw_message_dispatch_completed_total`      | teller    | `channel`, `outcome`, `reason`, `source`                                                  |
| `openclaw_message_dispatch_duration_seconds`     | histogram | `channel`, `outcome`, `reason`, `source`                                                  |
| `openclaw_message_processed_total`               | teller    | `channel`, `outcome`, `reason`                                                            |
| `openclaw_message_processed_duration_seconds`    | histogram | `channel`, `outcome`, `reason`                                                            |
| `openclaw_message_delivery_started_total`        | teller    | `channel`, `delivery_kind`                                                                |
| `openclaw_message_delivery_total`                | teller    | `channel`, `delivery_kind`, `error_category`, `outcome`                                   |
| `openclaw_message_delivery_duration_seconds`     | histogram | `channel`, `delivery_kind`, `error_category`, `outcome`                                   |
| `openclaw_talk_event_total`                      | teller    | `brain`, `event_type`, `mode`, `provider`, `transport`                                    |
| `openclaw_talk_event_duration_seconds`           | histogram | `brain`, `event_type`, `mode`, `provider`, `transport`                                    |
| `openclaw_talk_audio_bytes`                      | histogram | `brain`, `event_type`, `mode`, `provider`, `transport`                                    |
| `openclaw_queue_lane_size`                       | meter     | `lane`                                                                                    |
| `openclaw_queue_lane_wait_seconds`               | histogram | `lane`                                                                                    |
| `openclaw_session_state_total`                   | teller    | `reason`, `state`                                                                         |
| `openclaw_session_queue_depth`                   | meter     | `state`                                                                                   |
| `openclaw_session_turn_created_total`            | teller    | `agent`, `channel`, `trigger`                                                             |
| `openclaw_session_stuck_total`                   | teller    | `reason`, `state`                                                                         |
| `openclaw_session_stuck_age_seconds`             | histogram | `reason`, `state`                                                                         |
| `openclaw_session_recovery_total`                | teller    | `action`, `active_work_kind`, `state`, `status`                                           |
| `openclaw_session_recovery_age_seconds`          | histogram | `action`, `active_work_kind`, `state`, `status`                                           |
| `openclaw_liveness_warning_total`                | teller    | `reason`                                                                                  |
| `openclaw_liveness_sessions`                     | meter     | `state`                                                                                   |
| `openclaw_liveness_event_loop_delay_p99_seconds` | histogram | `reason`                                                                                  |
| `openclaw_liveness_event_loop_delay_max_seconds` | histogram | `reason`                                                                                  |
| `openclaw_liveness_event_loop_utilization_ratio` | histogram | `reason`                                                                                  |
| `openclaw_liveness_cpu_core_ratio`               | histogram | `reason`                                                                                  |
| `openclaw_payload_large_total`                   | teller    | `action`, `channel`, `plugin`, `reason`, `surface`                                        |
| `openclaw_payload_large_bytes`                   | histogram | `action`, `channel`, `plugin`, `reason`, `surface`                                        |
| `openclaw_memory_bytes`                          | meter     | `kind`                                                                                    |
| `openclaw_memory_rss_bytes`                      | histogram | geen                                                                                      |
| `openclaw_memory_pressure_total`                 | teller    | `level`, `reason`                                                                         |
| `openclaw_telemetry_exporter_total`              | teller    | `exporter`, `reason`, `signal`, `status`                                                  |
| `openclaw_prometheus_series_dropped_total`       | teller    | geen                                                                                      |
| `openclaw_diagnostic_async_queue_dropped_total`  | teller    | `drop_class`                                                                              |
| `openclaw_diagnostic_async_queue_length`         | meter     | geen                                                                                      |

## Labelbeleid

<AccordionGroup>
  <Accordion title="Begrensde labels met lage cardinaliteit">
    Prometheus-labels blijven begrensd en hebben een lage cardinaliteit. De exporter voert geen onbewerkte diagnostische identificatoren uit, zoals `runId`, `sessionKey`, `sessionId`, `callId`, `toolCallId`, bericht-ID's, chat-ID's of aanvraag-ID's van providers.

    Labelwaarden worden geredigeerd en moeten voldoen aan het tekenbeleid van OpenClaw voor lage cardinaliteit. Waarden die niet aan het beleid voldoen, worden afhankelijk van de metriek vervangen door `unknown`, `other` of `none`. Labels die lijken op sessiesleutels met een agentscope, worden ook vervangen door `unknown`.

  </Accordion>
  <Accordion title="Limiet voor reeksen en registratie van overschrijdingen">
    De exporter beperkt het aantal in het geheugen bewaarde tijdreeksen tot **2048** reeksen voor tellers, meters en histogrammen samen. Nieuwe reeksen boven die limiet worden verwijderd, waarbij `openclaw_prometheus_series_dropped_total` telkens met één wordt verhoogd.

    Houd deze teller in de gaten als een duidelijk signaal dat een bovenliggend attribuut waarden met een hoge cardinaliteit lekt. De exporter verhoogt de limiet nooit automatisch; als de teller oploopt, los dan het probleem bij de bron op in plaats van de limiet uit te schakelen.

  </Accordion>
  <Accordion title="Wat nooit in Prometheus-uitvoer verschijnt">
    - prompttekst, antwoordtekst, toolinvoer, tooluitvoer, systeemprompts
    - gesprekstranscripten, audiopayloads, oproep-id's, ruimte-id's, overdrachtstokens, beurt-id's en onbewerkte sessie-id's
    - onbewerkte aanvraag-id's van providers (alleen begrensde hashes, waar van toepassing, in spans — nooit in metrieken)
    - sessiesleutels en sessie-id's
    - hostnamen, bestandspaden, geheime waarden

  </Accordion>
</AccordionGroup>

## PromQL-recepten

```promql
# Tokens per minuut, uitgesplitst per provider
sum by (provider) (rate(openclaw_model_tokens_total[1m]))

# Uitgaven (USD) gedurende het afgelopen uur, per model
sum by (model) (increase(openclaw_model_cost_usd_total[1h]))

# 95e percentiel van de duur van modeluitvoeringen
histogram_quantile(
  0.95,
  sum by (le, provider, model)
    (rate(openclaw_run_duration_seconds_bucket[5m]))
)

# SLO voor wachttijd in de wachtrij (95e percentiel onder 2 s)
histogram_quantile(
  0.95,
  sum by (le, lane) (rate(openclaw_queue_lane_wait_seconds_bucket[5m]))
) < 2

# Skill-gebruik, uitgesplitst per begrensde bron
sum by (skill, source) (increase(openclaw_skill_used_total[24h]))

# Verwijderde Prometheus-reeksen (cardinaliteitsalarm)
increase(openclaw_prometheus_series_dropped_total[15m]) > 0
```

<Tip>
Geef voor dashboards voor meerdere providers de voorkeur aan `gen_ai_client_token_usage`: dit volgt de semantische GenAI-conventies van OpenTelemetry en is consistent met metrieken van GenAI-services die niet van OpenClaw zijn.
</Tip>

## Kiezen tussen export via Prometheus en OpenTelemetry

OpenClaw ondersteunt beide interfaces onafhankelijk van elkaar. U kunt een van beide, beide of geen van beide gebruiken.

<Tabs>
  <Tab title="diagnostics-prometheus">
    - **Pull**-model: Prometheus haalt `/api/diagnostics/prometheus` op.
    - Geen externe collector vereist.
    - Geauthenticeerd via de normale Gateway-authenticatie.
    - De interface bevat alleen metrieken (geen traces of logboeken).
    - Het meest geschikt voor stacks die al zijn gestandaardiseerd op Prometheus + Grafana.

  </Tab>
  <Tab title="diagnostics-otel">
    - **Push**-model: OpenClaw verzendt OTLP/HTTP naar een collector of OTLP-compatibele backend.
    - De interface bevat metrieken, traces en logboeken.
    - Maakt een koppeling met Prometheus via een OpenTelemetry Collector (`prometheus`- of `prometheusremotewrite`-exporter) wanneer u beide nodig hebt.
    - Zie [OpenTelemetry-export](/nl/gateway/opentelemetry) voor de volledige catalogus.

  </Tab>
</Tabs>

## Problemen oplossen

<AccordionGroup>
  <Accordion title="Lege antwoordtekst">
    - Controleer of `diagnostics.enabled` in de configuratie niet op `false` staat (de standaardwaarde is `true`).
    - Controleer met `openclaw plugins list --enabled` of de Plugin is ingeschakeld en geladen.
    - Genereer wat verkeer; tellers en histogrammen produceren pas regels nadat ten minste één gebeurtenis heeft plaatsgevonden.

  </Accordion>
  <Accordion title="401 / niet geautoriseerd">
    Het eindpunt vereist het operatorbereik van de Gateway (`auth: "gateway"` met `gatewayRuntimeScopeSurface: "trusted-operator"`). Gebruik hetzelfde token of wachtwoord dat Prometheus gebruikt voor elke andere operatorroute van de Gateway. Er is geen openbare, niet-geauthenticeerde modus.
  </Accordion>
  <Accordion title="`openclaw_prometheus_series_dropped_total` loopt op">
    Een nieuw attribuut overschrijdt de limiet van **2048** reeksen. Controleer recente metrieken op een label met een onverwacht hoge cardinaliteit en los dit bij de bron op. De exporter verwijdert bewust nieuwe reeksen in plaats van labels stilzwijgend te herschrijven.
  </Accordion>
  <Accordion title="Prometheus toont verouderde reeksen na een herstart">
    De Plugin bewaart de status uitsluitend in het geheugen. Na een herstart van de Gateway worden tellers op nul gezet en beginnen meters opnieuw bij hun eerstvolgende gerapporteerde waarde. Gebruik PromQL `rate()` en `increase()` om resets correct af te handelen.
  </Accordion>
</AccordionGroup>

## Gerelateerd

- [Diagnostische export](/nl/gateway/diagnostics) — lokaal diagnostisch zipbestand voor ondersteuningsbundels
- [Status en gereedheid](/nl/gateway/health) — `/healthz`- en `/readyz`-probes
- [Logboekregistratie](/nl/logging) — logboekregistratie op basis van bestanden
- [OpenTelemetry-export](/nl/gateway/opentelemetry) — OTLP-push voor traces, metrieken en logboeken

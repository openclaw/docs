---
read_when:
    - Vuoi che Prometheus, Grafana, VictoriaMetrics o un altro scraper raccolga le metriche del Gateway OpenClaw
    - Hai bisogno dei nomi delle metriche Prometheus e della policy delle etichette per dashboard o avvisi
    - Vuoi metriche senza eseguire un collector OpenTelemetry
sidebarTitle: Prometheus
summary: Espone la diagnostica di OpenClaw come metriche di testo Prometheus tramite il plugin diagnostics-prometheus
title: Metriche Prometheus
x-i18n:
    generated_at: "2026-06-27T17:34:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f9d3f6cf5af2e3770cd3a86e968fe25d2c3b3b87524ba1d229ef585671d320a8
    source_path: gateway/prometheus.md
    workflow: 16
---

  OpenClaw può esporre metriche di diagnostica tramite il Plugin ufficiale `diagnostics-prometheus`. Ascolta la diagnostica attendibile e gli eventi di stabilità del Gateway emessi dal core, quindi produce un endpoint di testo Prometheus in:

  ```text
  GET /api/diagnostics/prometheus
  ```

  Il tipo di contenuto è `text/plain; version=0.0.4; charset=utf-8`, il formato di esposizione Prometheus standard.

  <Warning>
  La rotta usa l'autenticazione del Gateway (ambito operatore). Non esporla come endpoint `/metrics` pubblico non autenticato. Eseguine lo scraping tramite lo stesso percorso di autenticazione che usi per le altre API operatore.
  </Warning>

  Per tracce, log, push OTLP e attributi semantici GenAI di OpenTelemetry, vedi [esportazione OpenTelemetry](/it/gateway/opentelemetry).

  ## Avvio rapido

  <Steps>
  <Step title="Installa il Plugin">
    ```bash
    openclaw plugins install clawhub:@openclaw/diagnostics-prometheus
    ```
  </Step>
  <Step title="Abilita il Plugin">
    <Tabs>
      <Tab title="Configurazione">
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
  <Step title="Riavvia il Gateway">
    La rotta HTTP viene registrata all'avvio del Plugin, quindi ricarica dopo l'abilitazione.
  </Step>
  <Step title="Esegui lo scraping della rotta protetta">
    Invia la stessa autenticazione del Gateway usata dai tuoi client operatore:

    ```bash
    curl -H "Authorization: Bearer $OPENCLAW_GATEWAY_TOKEN" \
      http://127.0.0.1:18789/api/diagnostics/prometheus
    ```

  </Step>
  <Step title="Collega Prometheus">
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
`diagnostics.enabled: true` è obbligatorio. Senza questa impostazione, il Plugin registra comunque la route HTTP ma nessun evento diagnostico arriva all'esportatore, quindi la risposta è vuota.
</Note>

## Metriche esportate

| Metrica                                          | Tipo      | Etichette                                                                                 |
| ------------------------------------------------ | --------- | ----------------------------------------------------------------------------------------- |
| `openclaw_run_completed_total`                   | contatore | `channel`, `model`, `outcome`, `provider`, `trigger`                                      |
| `openclaw_run_duration_seconds`                  | istogramma | `channel`, `model`, `outcome`, `provider`, `trigger`                                      |
| `openclaw_model_call_total`                      | contatore | `api`, `error_category`, `model`, `outcome`, `provider`, `transport`                      |
| `openclaw_model_call_duration_seconds`           | istogramma | `api`, `error_category`, `model`, `outcome`, `provider`, `transport`                      |
| `openclaw_model_failover_total`                  | contatore | `from_model`, `from_provider`, `lane`, `reason`, `suspended`, `to_model`, `to_provider`   |
| `openclaw_model_tokens_total`                    | contatore | `agent`, `channel`, `model`, `provider`, `token_type`                                     |
| `openclaw_gen_ai_client_token_usage`             | istogramma | `model`, `provider`, `token_type`                                                         |
| `openclaw_model_cost_usd_total`                  | contatore | `agent`, `channel`, `model`, `provider`                                                   |
| `openclaw_skill_used_total`                      | contatore | `activation`, `agent`, `skill`, `source`                                                  |
| `openclaw_tool_execution_total`                  | contatore | `error_category`, `outcome`, `params_kind`, `tool`, `tool_owner`, `tool_source`           |
| `openclaw_tool_execution_duration_seconds`       | istogramma | `error_category`, `outcome`, `params_kind`, `tool`, `tool_owner`, `tool_source`           |
| `openclaw_tool_execution_blocked_total`          | contatore | `denied_reason`, `params_kind`, `tool`, `tool_owner`, `tool_source`                       |
| `openclaw_harness_run_total`                     | contatore | `channel`, `error_category`, `harness`, `model`, `outcome`, `phase`, `plugin`, `provider` |
| `openclaw_harness_run_duration_seconds`          | istogramma | `channel`, `error_category`, `harness`, `model`, `outcome`, `phase`, `plugin`, `provider` |
| `openclaw_webhook_received_total`                | contatore | `channel`, `webhook`                                                                      |
| `openclaw_webhook_error_total`                   | contatore | `channel`, `webhook`                                                                      |
| `openclaw_webhook_duration_seconds`              | istogramma | `channel`, `webhook`                                                                      |
| `openclaw_message_received_total`                | contatore | `channel`, `source`                                                                       |
| `openclaw_message_dispatch_started_total`        | contatore | `channel`, `source`                                                                       |
| `openclaw_message_dispatch_completed_total`      | contatore | `channel`, `outcome`, `reason`, `source`                                                  |
| `openclaw_message_dispatch_duration_seconds`     | istogramma | `channel`, `outcome`, `reason`, `source`                                                  |
| `openclaw_message_processed_total`               | contatore | `channel`, `outcome`, `reason`                                                            |
| `openclaw_message_processed_duration_seconds`    | istogramma | `channel`, `outcome`, `reason`                                                            |
| `openclaw_message_delivery_started_total`        | contatore | `channel`, `delivery_kind`                                                                |
| `openclaw_message_delivery_total`                | contatore | `channel`, `delivery_kind`, `error_category`, `outcome`                                   |
| `openclaw_message_delivery_duration_seconds`     | istogramma | `channel`, `delivery_kind`, `error_category`, `outcome`                                   |
| `openclaw_talk_event_total`                      | contatore | `brain`, `event_type`, `mode`, `provider`, `transport`                                    |
| `openclaw_talk_event_duration_seconds`           | istogramma | `brain`, `event_type`, `mode`, `provider`, `transport`                                    |
| `openclaw_talk_audio_bytes`                      | istogramma | `brain`, `event_type`, `mode`, `provider`, `transport`                                    |
| `openclaw_queue_lane_size`                       | indicatore | `lane`                                                                                    |
| `openclaw_queue_lane_wait_seconds`               | istogramma | `lane`                                                                                    |
| `openclaw_session_state_total`                   | contatore | `reason`, `state`                                                                         |
| `openclaw_session_queue_depth`                   | indicatore | `state`                                                                                   |
| `openclaw_session_turn_created_total`            | contatore | `agent`, `channel`, `trigger`                                                             |
| `openclaw_session_stuck_total`                   | contatore | `reason`, `state`                                                                         |
| `openclaw_session_stuck_age_seconds`             | istogramma | `reason`, `state`                                                                         |
| `openclaw_session_recovery_total`                | contatore | `action`, `active_work_kind`, `state`, `status`                                           |
| `openclaw_session_recovery_age_seconds`          | istogramma | `action`, `active_work_kind`, `state`, `status`                                           |
| `openclaw_liveness_warning_total`                | contatore | `reason`                                                                                  |
| `openclaw_liveness_sessions`                     | indicatore | `state`                                                                                   |
| `openclaw_liveness_event_loop_delay_p99_seconds` | istogramma | `reason`                                                                                  |
| `openclaw_liveness_event_loop_delay_max_seconds` | istogramma | `reason`                                                                                  |
| `openclaw_liveness_event_loop_utilization_ratio` | istogramma | `reason`                                                                                  |
| `openclaw_liveness_cpu_core_ratio`               | istogramma | `reason`                                                                                  |
| `openclaw_payload_large_total`                   | contatore | `action`, `channel`, `plugin`, `reason`, `surface`                                        |
| `openclaw_payload_large_bytes`                   | istogramma | `action`, `channel`, `plugin`, `reason`, `surface`                                        |
| `openclaw_memory_bytes`                          | indicatore | `kind`                                                                                    |
| `openclaw_memory_rss_bytes`                      | istogramma | nessuna                                                                                   |
| `openclaw_memory_pressure_total`                 | contatore | `level`, `reason`                                                                         |
| `openclaw_telemetry_exporter_total`              | contatore | `exporter`, `reason`, `signal`, `status`                                                  |
| `openclaw_prometheus_series_dropped_total`       | contatore | nessuna                                                                                   |

## Criterio per le etichette

<AccordionGroup>
  <Accordion title="Etichette limitate e a bassa cardinalità">
    Le etichette Prometheus restano limitate e a bassa cardinalità. L'esportatore non emette identificatori diagnostici grezzi come `runId`, `sessionKey`, `sessionId`, `callId`, `toolCallId`, ID dei messaggi, ID delle chat o ID delle richieste del provider.

    I valori delle etichette vengono oscurati e devono corrispondere al criterio di OpenClaw per caratteri a bassa cardinalità. I valori che non soddisfano il criterio vengono sostituiti con `unknown`, `other` o `none`, a seconda della metrica. Anche le etichette che sembrano chiavi di sessione agente con ambito vengono sostituite con `unknown`.

  </Accordion>
  <Accordion title="Limite delle serie e conteggio dell'overflow">
    L'esportatore limita le serie temporali mantenute in memoria a **2048** serie complessive tra contatori, indicatori e istogrammi. Le nuove serie oltre tale limite vengono scartate e `openclaw_prometheus_series_dropped_total` viene incrementato di uno ogni volta.

    Monitora questo contatore come segnale forte che un attributo a monte sta perdendo valori ad alta cardinalità. L'esportatore non aumenta mai automaticamente il limite; se cresce, correggi l'origine invece di disabilitare il limite.

  </Accordion>
  <Accordion title="Cosa non appare mai nell'output Prometheus">
    - testo del prompt, testo della risposta, input degli strumenti, output degli strumenti, prompt di sistema
    - trascrizioni Talk, payload audio, ID chiamata, ID stanza, token di handoff, ID turno e ID sessione grezzi
    - ID richiesta provider grezzi (solo hash limitati, ove applicabile, sugli span; mai sulle metriche)
    - chiavi di sessione e ID sessione
    - nomi host, percorsi file, valori segreti

  </Accordion>
</AccordionGroup>

## Ricette PromQL

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
Preferisci `gen_ai_client_token_usage` per dashboard cross-provider: segue le convenzioni semantiche GenAI di OpenTelemetry ed è coerente con le metriche di servizi GenAI non OpenClaw.
</Tip>

## Scegliere tra esportazione Prometheus e OpenTelemetry

OpenClaw supporta entrambe le superfici in modo indipendente. Puoi eseguirne una, entrambe o nessuna.

<Tabs>
  <Tab title="diagnostics-prometheus">
    - Modello **Pull**: Prometheus esegue lo scrape di `/api/diagnostics/prometheus`.
    - Non richiede un collector esterno.
    - Autenticato tramite la normale autenticazione del Gateway.
    - La superficie include solo metriche (nessuna traccia o log).
    - Ideale per stack già standardizzati su Prometheus + Grafana.

  </Tab>
  <Tab title="diagnostics-otel">
    - Modello **Push**: OpenClaw invia OTLP/HTTP a un collector o a un backend compatibile con OTLP.
    - La superficie include metriche, tracce e log.
    - Si collega a Prometheus tramite un OpenTelemetry Collector (exporter `prometheus` o `prometheusremotewrite`) quando servono entrambi.
    - Consulta [Esportazione OpenTelemetry](/it/gateway/opentelemetry) per il catalogo completo.

  </Tab>
</Tabs>

## Risoluzione dei problemi

<AccordionGroup>
  <Accordion title="Corpo della risposta vuoto">
    - Controlla `diagnostics.enabled: true` nella configurazione.
    - Conferma che il plugin sia abilitato e caricato con `openclaw plugins list --enabled`.
    - Genera un po' di traffico; contatori e istogrammi emettono righe solo dopo almeno un evento.

  </Accordion>
  <Accordion title="401 / non autorizzato">
    L'endpoint richiede l'ambito operatore del Gateway (`auth: "gateway"` con `gatewayRuntimeScopeSurface: "trusted-operator"`). Usa lo stesso token o la stessa password che Prometheus usa per qualsiasi altra route operatore del Gateway. Non esiste una modalità pubblica non autenticata.
  </Accordion>
  <Accordion title="`openclaw_prometheus_series_dropped_total` sta aumentando">
    Un nuovo attributo sta superando il limite di **2048** serie. Ispeziona le metriche recenti per individuare un'etichetta con cardinalità inaspettatamente elevata e correggila alla fonte. L'exporter elimina intenzionalmente le nuove serie invece di riscrivere silenziosamente le etichette.
  </Accordion>
  <Accordion title="Prometheus mostra serie obsolete dopo un riavvio">
    Il plugin mantiene lo stato solo in memoria. Dopo un riavvio del Gateway, i contatori tornano a zero e i gauge ripartono dal successivo valore riportato. Usa `rate()` e `increase()` di PromQL per gestire i reset in modo pulito.
  </Accordion>
</AccordionGroup>

## Correlati

- [Esportazione diagnostica](/it/gateway/diagnostics) — zip diagnostico locale per bundle di supporto
- [Integrità e readiness](/it/gateway/health) — probe `/healthz` e `/readyz`
- [Logging](/it/logging) — logging basato su file
- [Esportazione OpenTelemetry](/it/gateway/opentelemetry) — push OTLP per tracce, metriche e log

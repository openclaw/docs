---
read_when:
    - Vuoi che Prometheus, Grafana, VictoriaMetrics o un altro scraper raccolga le metriche del Gateway OpenClaw
    - Ti servono i nomi delle metriche Prometheus e i criteri per le etichette per dashboard o avvisi
    - Vuoi ottenere metriche senza eseguire un collector OpenTelemetry
sidebarTitle: Prometheus
summary: Esponi la diagnostica di OpenClaw come metriche testuali Prometheus tramite il plugin diagnostics-prometheus
title: Metriche Prometheus
x-i18n:
    generated_at: "2026-07-12T07:04:35Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8a3975a9a79f32f1e9731b819613fdf6b9ffeee20bc71c841b9a6d7a5e0052f4
    source_path: gateway/prometheus.md
    workflow: 16
---

  OpenClaw può esporre le metriche diagnostiche tramite il Plugin ufficiale
  `diagnostics-prometheus`. Esso acquisisce i dati diagnostici attendibili e gli
  eventi diagnostici contrassegnati internamente e gestiti dal dispatcher
  (segnali relativi a code, memoria e ripristino delle sessioni), quindi rende
  disponibile un endpoint di testo Prometheus all'indirizzo:

  ```text
  GET /api/diagnostics/prometheus
  ```

  Il tipo di contenuto è `text/plain; version=0.0.4; charset=utf-8`, il formato
  standard di esposizione di Prometheus.

  <Warning>
  La route usa l'autenticazione del Gateway (ambito operatore, superficie riservata agli operatori attendibili). Non esporla come endpoint `/metrics` pubblico e privo di autenticazione. Eseguine lo scraping tramite lo stesso percorso di autenticazione usato per le altre API per operatori.
  </Warning>

  Per tracce, log, push OTLP e attributi semantici GenAI di OpenTelemetry, consulta [Esportazione OpenTelemetry](/it/gateway/opentelemetry).

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
    La route HTTP viene registrata all'avvio del Plugin, quindi ricarica il Gateway dopo l'abilitazione.
  </Step>
  <Step title="Esegui lo scraping della route protetta">
    Invia la stessa autenticazione del Gateway usata dai client degli operatori:

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
Il valore predefinito di `diagnostics.enabled` è `true`; impostalo su `false` solo in ambienti con vincoli rigorosi. Se è `false`, il plugin registra comunque la route HTTP, ma nessun evento diagnostico viene inoltrato all'esportatore, quindi la risposta è vuota.
</Note>

## Metriche esportate

| Metrica                                          | Tipo      | Etichette                                                                                 |
| ------------------------------------------------ | --------- | ----------------------------------------------------------------------------------------- |
| `openclaw_run_completed_total`                   | contatore | `channel`, `model`, `outcome`, `provider`, `trigger`                                      |
| `openclaw_run_duration_seconds`                  | istogramma | `channel`, `model`, `outcome`, `provider`, `trigger`                                     |
| `openclaw_model_call_total`                      | contatore | `api`, `error_category`, `model`, `outcome`, `provider`, `transport`                      |
| `openclaw_model_call_duration_seconds`           | istogramma | `api`, `error_category`, `model`, `outcome`, `provider`, `transport`                     |
| `openclaw_model_failover_total`                  | contatore | `from_model`, `from_provider`, `lane`, `reason`, `suspended`, `to_model`, `to_provider`   |
| `openclaw_model_tokens_total`                    | contatore | `agent`, `channel`, `model`, `provider`, `token_type`                                     |
| `openclaw_gen_ai_client_token_usage`             | istogramma | `model`, `provider`, `token_type`                                                        |
| `openclaw_model_cost_usd_total`                  | contatore | `agent`, `channel`, `model`, `provider`                                                   |
| `openclaw_model_usage_duration_seconds`          | istogramma | `agent`, `channel`, `model`, `provider`                                                  |
| `openclaw_skill_used_total`                      | contatore | `activation`, `agent`, `skill`, `source`                                                  |
| `openclaw_tool_execution_total`                  | contatore | `error_category`, `outcome`, `params_kind`, `tool`, `tool_owner`, `tool_source`           |
| `openclaw_tool_execution_duration_seconds`       | istogramma | `error_category`, `outcome`, `params_kind`, `tool`, `tool_owner`, `tool_source`          |
| `openclaw_tool_execution_blocked_total`          | contatore | `denied_reason`, `params_kind`, `tool`, `tool_owner`, `tool_source`                       |
| `openclaw_harness_run_total`                     | contatore | `channel`, `error_category`, `harness`, `model`, `outcome`, `phase`, `plugin`, `provider` |
| `openclaw_harness_run_duration_seconds`          | istogramma | `channel`, `error_category`, `harness`, `model`, `outcome`, `phase`, `plugin`, `provider` |
| `openclaw_webhook_received_total`                | contatore | `channel`, `webhook`                                                                      |
| `openclaw_webhook_error_total`                   | contatore | `channel`, `webhook`                                                                      |
| `openclaw_webhook_duration_seconds`              | istogramma | `channel`, `webhook`                                                                     |
| `openclaw_message_received_total`                | contatore | `channel`, `source`                                                                       |
| `openclaw_message_dispatch_started_total`        | contatore | `channel`, `source`                                                                       |
| `openclaw_message_dispatch_completed_total`      | contatore | `channel`, `outcome`, `reason`, `source`                                                  |
| `openclaw_message_dispatch_duration_seconds`     | istogramma | `channel`, `outcome`, `reason`, `source`                                                 |
| `openclaw_message_processed_total`               | contatore | `channel`, `outcome`, `reason`                                                            |
| `openclaw_message_processed_duration_seconds`    | istogramma | `channel`, `outcome`, `reason`                                                           |
| `openclaw_message_delivery_started_total`        | contatore | `channel`, `delivery_kind`                                                                |
| `openclaw_message_delivery_total`                | contatore | `channel`, `delivery_kind`, `error_category`, `outcome`                                   |
| `openclaw_message_delivery_duration_seconds`     | istogramma | `channel`, `delivery_kind`, `error_category`, `outcome`                                  |
| `openclaw_talk_event_total`                      | contatore | `brain`, `event_type`, `mode`, `provider`, `transport`                                    |
| `openclaw_talk_event_duration_seconds`           | istogramma | `brain`, `event_type`, `mode`, `provider`, `transport`                                   |
| `openclaw_talk_audio_bytes`                      | istogramma | `brain`, `event_type`, `mode`, `provider`, `transport`                                   |
| `openclaw_queue_lane_size`                       | indicatore | `lane`                                                                                   |
| `openclaw_queue_lane_wait_seconds`               | istogramma | `lane`                                                                                  |
| `openclaw_session_state_total`                   | contatore | `reason`, `state`                                                                         |
| `openclaw_session_queue_depth`                   | indicatore | `state`                                                                                  |
| `openclaw_session_turn_created_total`            | contatore | `agent`, `channel`, `trigger`                                                             |
| `openclaw_session_stuck_total`                   | contatore | `reason`, `state`                                                                         |
| `openclaw_session_stuck_age_seconds`             | istogramma | `reason`, `state`                                                                        |
| `openclaw_session_recovery_total`                | contatore | `action`, `active_work_kind`, `state`, `status`                                           |
| `openclaw_session_recovery_age_seconds`          | istogramma | `action`, `active_work_kind`, `state`, `status`                                          |
| `openclaw_liveness_warning_total`                | contatore | `reason`                                                                                  |
| `openclaw_liveness_sessions`                     | indicatore | `state`                                                                                  |
| `openclaw_liveness_event_loop_delay_p99_seconds` | istogramma | `reason`                                                                                 |
| `openclaw_liveness_event_loop_delay_max_seconds` | istogramma | `reason`                                                                                 |
| `openclaw_liveness_event_loop_utilization_ratio` | istogramma | `reason`                                                                                 |
| `openclaw_liveness_cpu_core_ratio`               | istogramma | `reason`                                                                                 |
| `openclaw_payload_large_total`                   | contatore | `action`, `channel`, `plugin`, `reason`, `surface`                                        |
| `openclaw_payload_large_bytes`                   | istogramma | `action`, `channel`, `plugin`, `reason`, `surface`                                       |
| `openclaw_memory_bytes`                          | indicatore | `kind`                                                                                   |
| `openclaw_memory_rss_bytes`                      | istogramma | nessuna                                                                                  |
| `openclaw_memory_pressure_total`                 | contatore | `level`, `reason`                                                                         |
| `openclaw_telemetry_exporter_total`              | contatore | `exporter`, `reason`, `signal`, `status`                                                  |
| `openclaw_prometheus_series_dropped_total`       | contatore | nessuna                                                                                   |
| `openclaw_diagnostic_async_queue_dropped_total`  | contatore | `drop_class`                                                                              |
| `openclaw_diagnostic_async_queue_length`         | indicatore | nessuna                                                                                  |

## Criteri per le etichette

<AccordionGroup>
  <Accordion title="Etichette limitate e a bassa cardinalità">
    Le etichette Prometheus rimangono limitate e a bassa cardinalità. L'esportatore non emette identificatori diagnostici non elaborati come `runId`, `sessionKey`, `sessionId`, `callId`, `toolCallId`, ID dei messaggi, ID delle chat o ID delle richieste del provider.

    I valori delle etichette vengono oscurati e devono rispettare i criteri di OpenClaw per i caratteri a bassa cardinalità. I valori che non rispettano tali criteri vengono sostituiti con `unknown`, `other` o `none`, a seconda della metrica. Anche le etichette che sembrano chiavi di sessione con ambito agente vengono sostituite con `unknown`.

  </Accordion>
  <Accordion title="Limite delle serie e contabilizzazione del superamento">
    L'esportatore limita a **2048** il numero complessivo di serie temporali mantenute in memoria tra contatori, indicatori e istogrammi. Le nuove serie che superano tale limite vengono scartate e `openclaw_prometheus_series_dropped_total` viene incrementato di uno ogni volta.

    Monitora questo contatore come segnale inequivocabile che un attributo a monte sta generando valori ad alta cardinalità. L'esportatore non innalza mai automaticamente il limite; se il contatore aumenta, correggi l'origine anziché disabilitare il limite.

  </Accordion>
  <Accordion title="Elementi che non compaiono mai nell'output di Prometheus">
    - testo dei prompt, testo delle risposte, input degli strumenti, output degli strumenti, prompt di sistema
    - trascrizioni delle conversazioni, payload audio, ID delle chiamate, ID delle stanze, token di passaggio, ID dei turni e ID di sessione non elaborati
    - ID delle richieste del provider non elaborati (solo hash con cardinalità limitata, ove applicabile, negli span, mai nelle metriche)
    - chiavi e ID di sessione
    - nomi host, percorsi di file, valori segreti

  </Accordion>
</AccordionGroup>

## Ricette PromQL

```promql
# Token al minuto, suddivisi per provider
sum by (provider) (rate(openclaw_model_tokens_total[1m]))

# Spesa (USD) nell'ultima ora, per modello
sum by (model) (increase(openclaw_model_cost_usd_total[1h]))

# 95° percentile della durata di esecuzione del modello
histogram_quantile(
  0.95,
  sum by (le, provider, model)
    (rate(openclaw_run_duration_seconds_bucket[5m]))
)

# SLO del tempo di attesa in coda (95° percentile inferiore a 2 s)
histogram_quantile(
  0.95,
  sum by (le, lane) (rate(openclaw_queue_lane_wait_seconds_bucket[5m]))
) < 2

# Utilizzo delle skill, suddiviso per origine con cardinalità limitata
sum by (skill, source) (increase(openclaw_skill_used_total[24h]))

# Serie Prometheus scartate (allarme di cardinalità)
increase(openclaw_prometheus_series_dropped_total[15m]) > 0
```

<Tip>
Per i dashboard che aggregano più provider, preferisci `gen_ai_client_token_usage`: segue le convenzioni semantiche GenAI di OpenTelemetry ed è coerente con le metriche dei servizi GenAI diversi da OpenClaw.
</Tip>

## Scelta tra esportazione Prometheus e OpenTelemetry

OpenClaw supporta entrambe le interfacce in modo indipendente. Puoi usare una delle due, entrambe oppure nessuna.

<Tabs>
  <Tab title="diagnostics-prometheus">
    - Modello **pull**: Prometheus esegue lo scraping di `/api/diagnostics/prometheus`.
    - Non è richiesto alcun collector esterno.
    - Autenticazione tramite la normale autenticazione del Gateway.
    - L'interfaccia include solo metriche, senza tracce né log.
    - Ideale per gli stack già standardizzati su Prometheus + Grafana.

  </Tab>
  <Tab title="diagnostics-otel">
    - Modello **push**: OpenClaw invia dati tramite OTLP/HTTP a un collector o a un backend compatibile con OTLP.
    - L'interfaccia include metriche, tracce e log.
    - Si integra con Prometheus tramite un OpenTelemetry Collector (esportatore `prometheus` o `prometheusremotewrite`) quando sono necessari entrambi.
    - Consulta [Esportazione OpenTelemetry](/it/gateway/opentelemetry) per il catalogo completo.

  </Tab>
</Tabs>

## Risoluzione dei problemi

<AccordionGroup>
  <Accordion title="Corpo della risposta vuoto">
    - Verifica che `diagnostics.enabled` non sia impostato su `false` nella configurazione (il valore predefinito è `true`).
    - Verifica che il Plugin sia abilitato e caricato con `openclaw plugins list --enabled`.
    - Genera del traffico; i contatori e gli istogrammi producono righe solo dopo almeno un evento.

  </Accordion>
  <Accordion title="401 / non autorizzato">
    L'endpoint richiede l'ambito operatore del Gateway (`auth: "gateway"` con `gatewayRuntimeScopeSurface: "trusted-operator"`). Usa lo stesso token o la stessa password utilizzati da Prometheus per qualsiasi altra route operatore del Gateway. Non è disponibile alcuna modalità pubblica senza autenticazione.
  </Accordion>
  <Accordion title="`openclaw_prometheus_series_dropped_total` è in aumento">
    Un nuovo attributo sta superando il limite di **2048** serie. Esamina le metriche recenti per individuare un'etichetta con una cardinalità inaspettatamente elevata e correggila all'origine. L'esportatore scarta intenzionalmente le nuove serie anziché riscrivere silenziosamente le etichette.
  </Accordion>
  <Accordion title="Prometheus mostra serie obsolete dopo un riavvio">
    Il Plugin mantiene lo stato solo in memoria. Dopo il riavvio del Gateway, i contatori vengono azzerati e gli indicatori ripartono dal successivo valore segnalato. Usa `rate()` e `increase()` di PromQL per gestire correttamente gli azzeramenti.
  </Accordion>
</AccordionGroup>

## Contenuti correlati

- [Esportazione della diagnostica](/it/gateway/diagnostics) — archivio ZIP locale della diagnostica per i pacchetti di supporto
- [Stato e disponibilità](/it/gateway/health) — probe `/healthz` e `/readyz`
- [Registrazione](/it/logging) — registrazione basata su file
- [Esportazione OpenTelemetry](/it/gateway/opentelemetry) — invio OTLP di tracce, metriche e log

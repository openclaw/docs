---
read_when:
    - Vuoi che Prometheus, Grafana, VictoriaMetrics o un altro sistema di raccolta acquisisca le metriche di OpenClaw Gateway
    - Ti servono i nomi delle metriche Prometheus e la policy delle etichette per dashboard o avvisi
    - Vuoi metriche senza eseguire un collector OpenTelemetry
sidebarTitle: Prometheus
summary: Esporre la diagnostica di OpenClaw come metriche testuali Prometheus tramite il Plugin diagnostics-prometheus
title: Metriche Prometheus
x-i18n:
    generated_at: "2026-04-30T08:53:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: d75a97a0b9dedd89eb25fee83626d8d726917872cc1c3bfcbf6e9634dd168a2b
    source_path: gateway/prometheus.md
    workflow: 16
---

OpenClaw può esporre metriche diagnostiche tramite il Plugin incluso `diagnostics-prometheus`. Ascolta la diagnostica interna attendibile e rende disponibile un endpoint di testo Prometheus su:

```text
GET /api/diagnostics/prometheus
```

Il tipo di contenuto è `text/plain; version=0.0.4; charset=utf-8`, il formato di esposizione Prometheus standard.

<Warning>
La route usa l'autenticazione del Gateway (ambito operatore). Non esporla come endpoint `/metrics` pubblico non autenticato. Eseguine lo scrape tramite lo stesso percorso di autenticazione che usi per le altre API operatore.
</Warning>

Per tracce, log, push OTLP e attributi semantici OpenTelemetry GenAI, vedi [esportazione OpenTelemetry](/it/gateway/opentelemetry).

## Avvio rapido

<Steps>
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
    La route HTTP viene registrata all'avvio del Plugin, quindi ricarica dopo l'abilitazione.
  </Step>
  <Step title="Esegui lo scrape della route protetta">
    Invia la stessa autenticazione del gateway usata dai tuoi client operatore:

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
`diagnostics.enabled: true` è richiesto. Senza questa impostazione, il Plugin registra comunque la route HTTP, ma nessun evento diagnostico arriva all'esportatore, quindi la risposta è vuota.
</Note>

## Metriche esportate

| Metrica                                       | Tipo      | Etichette                                                                                 |
| --------------------------------------------- | --------- | ----------------------------------------------------------------------------------------- |
| `openclaw_run_completed_total`                | contatore | `channel`, `model`, `outcome`, `provider`, `trigger`                                      |
| `openclaw_run_duration_seconds`               | istogramma | `channel`, `model`, `outcome`, `provider`, `trigger`                                      |
| `openclaw_model_call_total`                   | contatore | `api`, `error_category`, `model`, `outcome`, `provider`, `transport`                      |
| `openclaw_model_call_duration_seconds`        | istogramma | `api`, `error_category`, `model`, `outcome`, `provider`, `transport`                      |
| `openclaw_model_tokens_total`                 | contatore | `agent`, `channel`, `model`, `provider`, `token_type`                                     |
| `openclaw_gen_ai_client_token_usage`          | istogramma | `model`, `provider`, `token_type`                                                         |
| `openclaw_model_cost_usd_total`               | contatore | `agent`, `channel`, `model`, `provider`                                                   |
| `openclaw_tool_execution_total`               | contatore | `error_category`, `outcome`, `params_kind`, `tool`                                        |
| `openclaw_tool_execution_duration_seconds`    | istogramma | `error_category`, `outcome`, `params_kind`, `tool`                                        |
| `openclaw_harness_run_total`                  | contatore | `channel`, `error_category`, `harness`, `model`, `outcome`, `phase`, `plugin`, `provider` |
| `openclaw_harness_run_duration_seconds`       | istogramma | `channel`, `error_category`, `harness`, `model`, `outcome`, `phase`, `plugin`, `provider` |
| `openclaw_message_processed_total`            | contatore | `channel`, `outcome`, `reason`                                                            |
| `openclaw_message_processed_duration_seconds` | istogramma | `channel`, `outcome`, `reason`                                                            |
| `openclaw_message_delivery_total`             | contatore | `channel`, `delivery_kind`, `error_category`, `outcome`                                   |
| `openclaw_message_delivery_duration_seconds`  | istogramma | `channel`, `delivery_kind`, `error_category`, `outcome`                                   |
| `openclaw_queue_lane_size`                    | gauge     | `lane`                                                                                    |
| `openclaw_queue_lane_wait_seconds`            | istogramma | `lane`                                                                                    |
| `openclaw_session_state_total`                | contatore | `reason`, `state`                                                                         |
| `openclaw_session_queue_depth`                | gauge     | `state`                                                                                   |
| `openclaw_memory_bytes`                       | gauge     | `kind`                                                                                    |
| `openclaw_memory_rss_bytes`                   | istogramma | nessuna                                                                                   |
| `openclaw_memory_pressure_total`              | contatore | `level`, `reason`                                                                         |
| `openclaw_telemetry_exporter_total`           | contatore | `exporter`, `reason`, `signal`, `status`                                                  |
| `openclaw_prometheus_series_dropped_total`    | contatore | nessuna                                                                                   |

## Criteri per le etichette

<AccordionGroup>
  <Accordion title="Etichette limitate e a bassa cardinalità">
    Le etichette Prometheus restano limitate e a bassa cardinalità. L'esportatore non emette identificatori diagnostici grezzi come `runId`, `sessionKey`, `sessionId`, `callId`, `toolCallId`, ID dei messaggi, ID delle chat o ID delle richieste del provider.

    I valori delle etichette vengono oscurati e devono corrispondere ai criteri di OpenClaw per i caratteri a bassa cardinalità. I valori che non rispettano i criteri vengono sostituiti con `unknown`, `other` o `none`, a seconda della metrica.

  </Accordion>
  <Accordion title="Limite delle serie e contabilizzazione degli sforamenti">
    L'esportatore limita le serie temporali conservate in memoria a **2048** serie complessive tra contatori, gauge e istogrammi. Le nuove serie oltre quel limite vengono eliminate e `openclaw_prometheus_series_dropped_total` viene incrementato di uno ogni volta.

    Monitora questo contatore come segnale forte del fatto che un attributo a monte sta lasciando passare valori ad alta cardinalità. L'esportatore non aumenta mai automaticamente il limite; se cresce, correggi la sorgente invece di disabilitare il limite.

  </Accordion>
  <Accordion title="Cosa non compare mai nell'output Prometheus">
    - testo del prompt, testo della risposta, input degli strumenti, output degli strumenti, prompt di sistema
    - ID grezzi delle richieste del provider (solo hash limitati, dove applicabile, sugli span — mai sulle metriche)
    - chiavi di sessione e ID di sessione
    - nomi host, percorsi di file, valori segreti

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

# Dropped Prometheus series (cardinality alarm)
increase(openclaw_prometheus_series_dropped_total[15m]) > 0
```

<Tip>
Preferisci `gen_ai_client_token_usage` per dashboard tra provider: segue le convenzioni semantiche OpenTelemetry GenAI ed è coerente con le metriche di servizi GenAI non OpenClaw.
</Tip>

## Scegliere tra Prometheus ed esportazione OpenTelemetry

OpenClaw supporta entrambe le superfici in modo indipendente. Puoi usare una delle due, entrambe o nessuna.

<Tabs>
  <Tab title="diagnostics-prometheus">
    - Modello **pull**: Prometheus esegue lo scrape di `/api/diagnostics/prometheus`.
    - Nessun collector esterno richiesto.
    - Autenticato tramite la normale autenticazione del Gateway.
    - La superficie è solo metriche (nessuna traccia o log).
    - Ideale per stack già standardizzati su Prometheus + Grafana.

  </Tab>
  <Tab title="diagnostics-otel">
    - Modello **push**: OpenClaw invia OTLP/HTTP a un collector o a un backend compatibile con OTLP.
    - La superficie include metriche, tracce e log.
    - Si collega a Prometheus tramite un OpenTelemetry Collector (esportatore `prometheus` o `prometheusremotewrite`) quando ti servono entrambi.
    - Vedi [esportazione OpenTelemetry](/it/gateway/opentelemetry) per il catalogo completo.

  </Tab>
</Tabs>

## Risoluzione dei problemi

<AccordionGroup>
  <Accordion title="Corpo della risposta vuoto">
    - Controlla `diagnostics.enabled: true` nella configurazione.
    - Conferma che il Plugin sia abilitato e caricato con `openclaw plugins list --enabled`.
    - Genera un po' di traffico; contatori e istogrammi emettono righe solo dopo almeno un evento.

  </Accordion>
  <Accordion title="401 / non autorizzato">
    L'endpoint richiede l'ambito operatore del Gateway (`auth: "gateway"` con `gatewayRuntimeScopeSurface: "trusted-operator"`). Usa lo stesso token o la stessa password che Prometheus usa per qualsiasi altra route operatore del Gateway. Non esiste una modalità pubblica non autenticata.
  </Accordion>
  <Accordion title="`openclaw_prometheus_series_dropped_total` sta aumentando">
    Un nuovo attributo sta superando il limite di **2048** serie. Ispeziona le metriche recenti alla ricerca di un'etichetta con cardinalità inaspettatamente alta e correggila alla sorgente. L'esportatore elimina intenzionalmente le nuove serie invece di riscrivere silenziosamente le etichette.
  </Accordion>
  <Accordion title="Prometheus mostra serie obsolete dopo un riavvio">
    Il Plugin conserva lo stato solo in memoria. Dopo un riavvio del Gateway, i contatori vengono reimpostati a zero e i gauge ripartono dal successivo valore segnalato. Usa `rate()` e `increase()` di PromQL per gestire correttamente i reset.
  </Accordion>
</AccordionGroup>

## Correlati

- [Esportazione diagnostica](/it/gateway/diagnostics) — zip di diagnostica locale per pacchetti di supporto
- [Integrità e readiness](/it/gateway/health) — probe `/healthz` e `/readyz`
- [Logging](/it/logging) — logging basato su file
- [Esportazione OpenTelemetry](/it/gateway/opentelemetry) — push OTLP per tracce, metriche e log

---
read_when:
    - Vuoi che Prometheus, Grafana, VictoriaMetrics o un altro scraper raccolga le metriche del Gateway OpenClaw
    - Ti servono i nomi delle metriche Prometheus e la policy delle label per dashboard o avvisi
    - Vuoi metriche senza eseguire un collector OpenTelemetry separato
sidebarTitle: Prometheus
summary: Esponi la diagnostica di OpenClaw come metriche testuali Prometheus tramite il Plugin diagnostics-prometheus
title: Metriche Prometheus
x-i18n:
    generated_at: "2026-04-26T11:29:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: 29fd3e4658ceffe20f078e8e38b61c685ea9df518ca04ca34abf2085166eb481
    source_path: gateway/prometheus.md
    workflow: 15
---

OpenClaw può esporre metriche diagnostiche tramite il Plugin incluso `diagnostics-prometheus`. Il Plugin ascolta la diagnostica interna attendibile e rende disponibile un endpoint testuale Prometheus su:

```text
GET /api/diagnostics/prometheus
```

Il content type è `text/plain; version=0.0.4; charset=utf-8`, il formato di esposizione standard di Prometheus.

<Warning>
La route usa l’autenticazione del Gateway (scope operatore). Non esporla come endpoint pubblico `/metrics` senza autenticazione. Esegui lo scraping tramite lo stesso percorso auth che usi per le altre API operatore.
</Warning>

Per trace, log, push OTLP e attributi semantici GenAI di OpenTelemetry, consulta [OpenTelemetry export](/it/gateway/opentelemetry).

## Avvio rapido

<Steps>
  <Step title="Abilita il Plugin">
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
  <Step title="Riavvia il Gateway">
    La route HTTP viene registrata all’avvio del Plugin, quindi ricarica dopo l’abilitazione.
  </Step>
  <Step title="Esegui lo scraping della route protetta">
    Invia la stessa auth del gateway usata dai tuoi client operatore:

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
`diagnostics.enabled: true` è obbligatorio. Senza di esso, il Plugin registra comunque la route HTTP ma nessun evento diagnostico fluisce verso l’exporter, quindi la risposta è vuota.
</Note>

## Metriche esportate

| Metrica                                       | Tipo      | Label                                                                                     |
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

## Policy delle label

<AccordionGroup>
  <Accordion title="Label limitate e a bassa cardinalità">
    Le label Prometheus restano limitate e a bassa cardinalità. L’exporter non emette identificatori diagnostici grezzi come `runId`, `sessionKey`, `sessionId`, `callId`, `toolCallId`, ID messaggio, ID chat o ID richiesta del provider.

    I valori delle label vengono redatti e devono rispettare la policy dei caratteri a bassa cardinalità di OpenClaw. I valori che non la rispettano vengono sostituiti con `unknown`, `other` o `none`, a seconda della metrica.

  </Accordion>
  <Accordion title="Limite delle serie e contabilizzazione dell’overflow">
    L’exporter limita le serie temporali mantenute in memoria a **2048** serie complessive tra counter, gauge e histogram. Le nuove serie oltre questo limite vengono scartate e `openclaw_prometheus_series_dropped_total` aumenta di uno ogni volta.

    Monitora questo counter come segnale forte che un attributo upstream sta lasciando passare valori ad alta cardinalità. L’exporter non alza mai automaticamente il limite; se cresce, correggi la sorgente invece di disabilitare il limite.

  </Accordion>
  <Accordion title="Cosa non compare mai nell’output Prometheus">
    - testo del prompt, testo della risposta, input degli strumenti, output degli strumenti, system prompt
    - ID richiesta grezzi del provider (solo hash limitati, dove applicabile, negli span — mai nelle metriche)
    - chiavi di sessione e ID sessione
    - hostname, percorsi file, valori segreti

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

# SLO del tempo di attesa in coda (95p sotto 2s)
histogram_quantile(
  0.95,
  sum by (le, lane) (rate(openclaw_queue_lane_wait_seconds_bucket[5m]))
) < 2

# Serie Prometheus scartate (allarme cardinalità)
increase(openclaw_prometheus_series_dropped_total[15m]) > 0
```

<Tip>
Preferisci `gen_ai_client_token_usage` per dashboard cross-provider: segue le convenzioni semantiche GenAI di OpenTelemetry ed è coerente con le metriche di servizi GenAI non OpenClaw.
</Tip>

## Scegliere tra esportazione Prometheus e OpenTelemetry

OpenClaw supporta entrambe le superfici in modo indipendente. Puoi usare una sola, entrambe o nessuna.

<Tabs>
  <Tab title="diagnostics-prometheus">
    - Modello **pull**: Prometheus esegue lo scraping di `/api/diagnostics/prometheus`.
    - Non richiede un collector esterno.
    - Autenticato tramite la normale auth del Gateway.
    - La superficie include solo metriche (nessuna trace o log).
    - Ideale per stack già standardizzati su Prometheus + Grafana.

  </Tab>
  <Tab title="diagnostics-otel">
    - Modello **push**: OpenClaw invia OTLP/HTTP a un collector o a un backend compatibile OTLP.
    - La superficie include metriche, trace e log.
    - Si collega a Prometheus tramite un OpenTelemetry Collector (exporter `prometheus` o `prometheusremotewrite`) quando ti servono entrambi.
    - Consulta [OpenTelemetry export](/it/gateway/opentelemetry) per il catalogo completo.

  </Tab>
</Tabs>

## Risoluzione dei problemi

<AccordionGroup>
  <Accordion title="Corpo della risposta vuoto">
    - Controlla `diagnostics.enabled: true` nella config.
    - Conferma che il Plugin sia abilitato e caricato con `openclaw plugins list --enabled`.
    - Genera un po’ di traffico; counter e histogram emettono righe solo dopo almeno un evento.

  </Accordion>
  <Accordion title="401 / unauthorized">
    L’endpoint richiede lo scope operatore del Gateway (`auth: "gateway"` con `gatewayRuntimeScopeSurface: "trusted-operator"`). Usa lo stesso token o la stessa password che Prometheus usa per qualsiasi altra route operatore del Gateway. Non esiste una modalità pubblica senza autenticazione.
  </Accordion>
  <Accordion title="`openclaw_prometheus_series_dropped_total` sta aumentando">
    Un nuovo attributo sta superando il limite di **2048** serie. Ispeziona le metriche recenti per trovare una label con cardinalità inaspettatamente alta e correggila alla sorgente. L’exporter scarta intenzionalmente le nuove serie invece di riscrivere silenziosamente le label.
  </Accordion>
  <Accordion title="Prometheus mostra serie obsolete dopo un riavvio">
    Il Plugin mantiene lo stato solo in memoria. Dopo un riavvio del Gateway, i counter vengono azzerati e i gauge ripartono dal loro successivo valore riportato. Usa PromQL `rate()` e `increase()` per gestire i reset in modo pulito.
  </Accordion>
</AccordionGroup>

## Correlati

- [Esportazione della diagnostica](/it/gateway/diagnostics) — zip diagnostico locale per pacchetti di supporto
- [Salute e readiness](/it/gateway/health) — probe `/healthz` e `/readyz`
- [Logging](/it/logging) — logging basato su file
- [OpenTelemetry export](/it/gateway/opentelemetry) — push OTLP per trace, metriche e log

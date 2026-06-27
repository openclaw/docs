---
read_when:
    - Sie möchten, dass Prometheus, Grafana, VictoriaMetrics oder ein anderer Scraper OpenClaw-Gateway-Metriken erfasst
    - Sie benötigen die Prometheus-Metriknamen und Label-Richtlinie für Dashboards oder Warnmeldungen
    - Sie möchten Metriken nutzen, ohne einen OpenTelemetry-Collector auszuführen
sidebarTitle: Prometheus
summary: OpenClaw-Diagnosen als Prometheus-Textmetriken über das diagnostics-prometheus-Plugin bereitstellen
title: Prometheus-Metriken
x-i18n:
    generated_at: "2026-06-27T17:32:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f9d3f6cf5af2e3770cd3a86e968fe25d2c3b3b87524ba1d229ef585671d320a8
    source_path: gateway/prometheus.md
    workflow: 16
---

  OpenClaw kann Diagnosemetriken über das offizielle `diagnostics-prometheus`-Plugin bereitstellen. Es lauscht auf vertrauenswürdige Diagnosen sowie vom Core ausgegebene Gateway-Stabilitätsereignisse und stellt dann einen Prometheus-Textendpunkt unter folgender Adresse bereit:

  ```text
  GET /api/diagnostics/prometheus
  ```

  Der Inhaltstyp ist `text/plain; version=0.0.4; charset=utf-8`, das standardmäßige Prometheus-Expositionsformat.

  <Warning>
  Die Route verwendet Gateway-Authentifizierung (Operator-Scope). Stellen Sie sie nicht als öffentlichen, nicht authentifizierten `/metrics`-Endpunkt bereit. Scrapen Sie sie über denselben Authentifizierungspfad, den Sie auch für andere Operator-APIs verwenden.
  </Warning>

  Für Traces, Logs, OTLP-Push und semantische OpenTelemetry-GenAI-Attribute siehe [OpenTelemetry-Export](/de/gateway/opentelemetry).

  ## Schnellstart

  <Steps>
  <Step title="Plugin installieren">
    ```bash
    openclaw plugins install clawhub:@openclaw/diagnostics-prometheus
    ```
  </Step>
  <Step title="Plugin aktivieren">
    <Tabs>
      <Tab title="Konfiguration">
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
  <Step title="Gateway neu starten">
    Die HTTP-Route wird beim Start des Plugins registriert; laden Sie daher nach der Aktivierung neu.
  </Step>
  <Step title="Geschützte Route scrapen">
    Senden Sie dieselbe Gateway-Authentifizierung, die Ihre Operator-Clients verwenden:

    ```bash
    curl -H "Authorization: Bearer $OPENCLAW_GATEWAY_TOKEN" \
      http://127.0.0.1:18789/api/diagnostics/prometheus
    ```

  </Step>
  <Step title="Wire Prometheus">
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
`diagnostics.enabled: true` ist erforderlich. Ohne diese Einstellung registriert das Plugin weiterhin die HTTP-Route, aber es fließen keine Diagnoseereignisse in den Exporter, sodass die Antwort leer ist.
</Note>

## Exportierte Metriken

| Metrik                                           | Typ       | Labels                                                                                    |
| ------------------------------------------------ | --------- | ----------------------------------------------------------------------------------------- |
| `openclaw_run_completed_total`                   | Counter   | `channel`, `model`, `outcome`, `provider`, `trigger`                                      |
| `openclaw_run_duration_seconds`                  | Histogramm | `channel`, `model`, `outcome`, `provider`, `trigger`                                      |
| `openclaw_model_call_total`                      | Counter   | `api`, `error_category`, `model`, `outcome`, `provider`, `transport`                      |
| `openclaw_model_call_duration_seconds`           | Histogramm | `api`, `error_category`, `model`, `outcome`, `provider`, `transport`                      |
| `openclaw_model_failover_total`                  | Counter   | `from_model`, `from_provider`, `lane`, `reason`, `suspended`, `to_model`, `to_provider`   |
| `openclaw_model_tokens_total`                    | Counter   | `agent`, `channel`, `model`, `provider`, `token_type`                                     |
| `openclaw_gen_ai_client_token_usage`             | Histogramm | `model`, `provider`, `token_type`                                                         |
| `openclaw_model_cost_usd_total`                  | Counter   | `agent`, `channel`, `model`, `provider`                                                   |
| `openclaw_skill_used_total`                      | Counter   | `activation`, `agent`, `skill`, `source`                                                  |
| `openclaw_tool_execution_total`                  | Counter   | `error_category`, `outcome`, `params_kind`, `tool`, `tool_owner`, `tool_source`           |
| `openclaw_tool_execution_duration_seconds`       | Histogramm | `error_category`, `outcome`, `params_kind`, `tool`, `tool_owner`, `tool_source`           |
| `openclaw_tool_execution_blocked_total`          | Counter   | `denied_reason`, `params_kind`, `tool`, `tool_owner`, `tool_source`                       |
| `openclaw_harness_run_total`                     | Counter   | `channel`, `error_category`, `harness`, `model`, `outcome`, `phase`, `plugin`, `provider` |
| `openclaw_harness_run_duration_seconds`          | Histogramm | `channel`, `error_category`, `harness`, `model`, `outcome`, `phase`, `plugin`, `provider` |
| `openclaw_webhook_received_total`                | Counter   | `channel`, `webhook`                                                                      |
| `openclaw_webhook_error_total`                   | Counter   | `channel`, `webhook`                                                                      |
| `openclaw_webhook_duration_seconds`              | Histogramm | `channel`, `webhook`                                                                      |
| `openclaw_message_received_total`                | Counter   | `channel`, `source`                                                                       |
| `openclaw_message_dispatch_started_total`        | Counter   | `channel`, `source`                                                                       |
| `openclaw_message_dispatch_completed_total`      | Counter   | `channel`, `outcome`, `reason`, `source`                                                  |
| `openclaw_message_dispatch_duration_seconds`     | Histogramm | `channel`, `outcome`, `reason`, `source`                                                  |
| `openclaw_message_processed_total`               | Counter   | `channel`, `outcome`, `reason`                                                            |
| `openclaw_message_processed_duration_seconds`    | Histogramm | `channel`, `outcome`, `reason`                                                            |
| `openclaw_message_delivery_started_total`        | Counter   | `channel`, `delivery_kind`                                                                |
| `openclaw_message_delivery_total`                | Counter   | `channel`, `delivery_kind`, `error_category`, `outcome`                                   |
| `openclaw_message_delivery_duration_seconds`     | Histogramm | `channel`, `delivery_kind`, `error_category`, `outcome`                                   |
| `openclaw_talk_event_total`                      | Counter   | `brain`, `event_type`, `mode`, `provider`, `transport`                                    |
| `openclaw_talk_event_duration_seconds`           | Histogramm | `brain`, `event_type`, `mode`, `provider`, `transport`                                    |
| `openclaw_talk_audio_bytes`                      | Histogramm | `brain`, `event_type`, `mode`, `provider`, `transport`                                    |
| `openclaw_queue_lane_size`                       | Gauge     | `lane`                                                                                    |
| `openclaw_queue_lane_wait_seconds`               | Histogramm | `lane`                                                                                    |
| `openclaw_session_state_total`                   | Counter   | `reason`, `state`                                                                         |
| `openclaw_session_queue_depth`                   | Gauge     | `state`                                                                                   |
| `openclaw_session_turn_created_total`            | Counter   | `agent`, `channel`, `trigger`                                                             |
| `openclaw_session_stuck_total`                   | Counter   | `reason`, `state`                                                                         |
| `openclaw_session_stuck_age_seconds`             | Histogramm | `reason`, `state`                                                                         |
| `openclaw_session_recovery_total`                | Counter   | `action`, `active_work_kind`, `state`, `status`                                           |
| `openclaw_session_recovery_age_seconds`          | Histogramm | `action`, `active_work_kind`, `state`, `status`                                           |
| `openclaw_liveness_warning_total`                | Counter   | `reason`                                                                                  |
| `openclaw_liveness_sessions`                     | Gauge     | `state`                                                                                   |
| `openclaw_liveness_event_loop_delay_p99_seconds` | Histogramm | `reason`                                                                                  |
| `openclaw_liveness_event_loop_delay_max_seconds` | Histogramm | `reason`                                                                                  |
| `openclaw_liveness_event_loop_utilization_ratio` | Histogramm | `reason`                                                                                  |
| `openclaw_liveness_cpu_core_ratio`               | Histogramm | `reason`                                                                                  |
| `openclaw_payload_large_total`                   | Counter   | `action`, `channel`, `plugin`, `reason`, `surface`                                        |
| `openclaw_payload_large_bytes`                   | Histogramm | `action`, `channel`, `plugin`, `reason`, `surface`                                        |
| `openclaw_memory_bytes`                          | Gauge     | `kind`                                                                                    |
| `openclaw_memory_rss_bytes`                      | Histogramm | keine                                                                                     |
| `openclaw_memory_pressure_total`                 | Counter   | `level`, `reason`                                                                         |
| `openclaw_telemetry_exporter_total`              | Counter   | `exporter`, `reason`, `signal`, `status`                                                  |
| `openclaw_prometheus_series_dropped_total`       | Counter   | keine                                                                                     |

## Label-Richtlinie

<AccordionGroup>
  <Accordion title="Bounded, low-cardinality labels">
    Prometheus-Labels bleiben begrenzt und haben eine niedrige Kardinalität. Der Exporter gibt keine rohen Diagnosekennungen wie `runId`, `sessionKey`, `sessionId`, `callId`, `toolCallId`, Nachrichten-IDs, Chat-IDs oder Provider-Anfrage-IDs aus.

    Labelwerte werden redigiert und müssen der OpenClaw-Zeichenrichtlinie für niedrige Kardinalität entsprechen. Werte, die die Richtlinie nicht erfüllen, werden je nach Metrik durch `unknown`, `other` oder `none` ersetzt. Labels, die wie bereichsbezogene Agent-Sitzungsschlüssel aussehen, werden ebenfalls durch `unknown` ersetzt.

  </Accordion>
  <Accordion title="Series cap and overflow accounting">
    Der Exporter begrenzt die im Arbeitsspeicher vorgehaltenen Zeitreihen auf insgesamt **2048** Reihen über Counter, Gauges und Histogramme hinweg. Neue Reihen oberhalb dieser Grenze werden verworfen, und `openclaw_prometheus_series_dropped_total` wird jedes Mal um eins erhöht.

    Beobachten Sie diesen Counter als eindeutiges Signal dafür, dass ein vorgelagertes Attribut Werte mit hoher Kardinalität weitergibt. Der Exporter hebt die Grenze nie automatisch an; wenn sie erreicht wird, beheben Sie die Quelle, statt die Begrenzung zu deaktivieren.

  </Accordion>
  <Accordion title="What never appears in Prometheus output">
    - Prompt-Text, Antworttext, Tool-Eingaben, Tool-Ausgaben, System-Prompts
    - Talk-Transkripte, Audio-Payloads, Call-IDs, Raum-IDs, Handoff-Tokens, Turn-IDs und rohe Session-IDs
    - rohe Provider-Request-IDs (nur begrenzte Hashes, sofern zutreffend, auf Spans — niemals auf Metriken)
    - Session-Schlüssel und Session-IDs
    - Hostnamen, Dateipfade, geheime Werte

  </Accordion>
</AccordionGroup>

## PromQL-Rezepte

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
Bevorzugen Sie `gen_ai_client_token_usage` für Provider-übergreifende Dashboards: Es folgt den semantischen OpenTelemetry-GenAI-Konventionen und ist konsistent mit Metriken von GenAI-Diensten außerhalb von OpenClaw.
</Tip>

## Auswahl zwischen Prometheus- und OpenTelemetry-Export

OpenClaw unterstützt beide Oberflächen unabhängig voneinander. Sie können eine davon, beide oder keine ausführen.

<Tabs>
  <Tab title="diagnostics-prometheus">
    - **Pull**-Modell: Prometheus ruft `/api/diagnostics/prometheus` ab.
    - Kein externer Collector erforderlich.
    - Authentifiziert über die normale Gateway-Authentifizierung.
    - Die Oberfläche umfasst nur Metriken (keine Traces oder Logs).
    - Am besten für Stacks geeignet, die bereits auf Prometheus + Grafana standardisiert sind.

  </Tab>
  <Tab title="diagnostics-otel">
    - **Push**-Modell: OpenClaw sendet OTLP/HTTP an einen Collector oder ein OTLP-kompatibles Backend.
    - Die Oberfläche umfasst Metriken, Traces und Logs.
    - Brückt zu Prometheus über einen OpenTelemetry Collector (`prometheus`- oder `prometheusremotewrite`-Exporter), wenn Sie beides benötigen.
    - Siehe [OpenTelemetry-Export](/de/gateway/opentelemetry) für den vollständigen Katalog.

  </Tab>
</Tabs>

## Fehlerbehebung

<AccordionGroup>
  <Accordion title="Empty response body">
    - Prüfen Sie `diagnostics.enabled: true` in der Konfiguration.
    - Bestätigen Sie mit `openclaw plugins list --enabled`, dass das Plugin aktiviert und geladen ist.
    - Erzeugen Sie etwas Traffic; Counter und Histogramme geben erst nach mindestens einem Ereignis Zeilen aus.

  </Accordion>
  <Accordion title="401 / unauthorized">
    Der Endpunkt erfordert den Gateway-Operator-Scope (`auth: "gateway"` mit `gatewayRuntimeScopeSurface: "trusted-operator"`). Verwenden Sie dasselbe Token oder Passwort, das Prometheus für jede andere Gateway-Operator-Route verwendet. Es gibt keinen öffentlichen nicht authentifizierten Modus.
  </Accordion>
  <Accordion title="`openclaw_prometheus_series_dropped_total` is climbing">
    Ein neues Attribut überschreitet die Obergrenze von **2048** Serien. Prüfen Sie aktuelle Metriken auf ein Label mit unerwartet hoher Kardinalität und beheben Sie es an der Quelle. Der Exporter verwirft neue Serien absichtlich, statt Labels stillschweigend umzuschreiben.
  </Accordion>
  <Accordion title="Prometheus shows stale series after a restart">
    Das Plugin hält den Zustand nur im Arbeitsspeicher. Nach einem Gateway-Neustart werden Counter auf null zurückgesetzt, und Gauges starten wieder mit ihrem nächsten gemeldeten Wert. Verwenden Sie PromQL `rate()` und `increase()`, um Zurücksetzungen sauber zu behandeln.
  </Accordion>
</AccordionGroup>

## Verwandte Themen

- [Diagnoseexport](/de/gateway/diagnostics) — lokale Diagnose-ZIP-Datei für Support-Bundles
- [Health und Readiness](/de/gateway/health) — `/healthz`- und `/readyz`-Probes
- [Logging](/de/logging) — dateibasiertes Logging
- [OpenTelemetry-Export](/de/gateway/opentelemetry) — OTLP-Push für Traces, Metriken und Logs

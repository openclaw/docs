---
read_when:
    - Sie möchten, dass Prometheus, Grafana, VictoriaMetrics oder ein anderer Scraper OpenClaw Gateway-Metriken erfasst
    - Sie benötigen die Namen der Prometheus-Metriken und die Label-Richtlinie für Dashboards oder Warnmeldungen
    - Sie möchten Metriken erfassen, ohne einen OpenTelemetry-Collector zu betreiben
sidebarTitle: Prometheus
summary: OpenClaw-Diagnosedaten über das diagnostics-prometheus-Plugin als Prometheus-Textmetriken bereitstellen
title: Prometheus-Metriken
x-i18n:
    generated_at: "2026-04-30T06:55:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: d75a97a0b9dedd89eb25fee83626d8d726917872cc1c3bfcbf6e9634dd168a2b
    source_path: gateway/prometheus.md
    workflow: 16
---

OpenClaw kann Diagnosemetriken über das gebündelte Plugin `diagnostics-prometheus` bereitstellen. Es lauscht auf vertrauenswürdige interne Diagnosedaten und rendert einen Prometheus-Text-Endpunkt unter:

```text
GET /api/diagnostics/prometheus
```

Der Inhaltstyp ist `text/plain; version=0.0.4; charset=utf-8`, das standardmäßige Prometheus-Expositionsformat.

<Warning>
Die Route verwendet Gateway-Authentifizierung (Operator-Scope). Stellen Sie sie nicht als öffentlichen, nicht authentifizierten `/metrics`-Endpunkt bereit. Scrapen Sie sie über denselben Authentifizierungspfad, den Sie für andere Operator-APIs verwenden.
</Warning>

Für Traces, Logs, OTLP-Push und semantische OpenTelemetry-GenAI-Attribute siehe [OpenTelemetry-Export](/de/gateway/opentelemetry).

## Schnellstart

<Steps>
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
    Die HTTP-Route wird beim Plugin-Start registriert, laden Sie sie daher nach der Aktivierung neu.
  </Step>
  <Step title="Geschützte Route scrapen">
    Senden Sie dieselbe Gateway-Authentifizierung, die Ihre Operator-Clients verwenden:

    ```bash
    curl -H "Authorization: Bearer $OPENCLAW_GATEWAY_TOKEN" \
      http://127.0.0.1:18789/api/diagnostics/prometheus
    ```

  </Step>
  <Step title="Prometheus anbinden">
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
`diagnostics.enabled: true` ist erforderlich. Ohne diese Einstellung registriert das Plugin zwar weiterhin die HTTP-Route, aber es fließen keine Diagnoseereignisse in den Exporter, sodass die Antwort leer ist.
</Note>

## Exportierte Metriken

| Metrik                                        | Typ       | Labels                                                                                    |
| --------------------------------------------- | --------- | ----------------------------------------------------------------------------------------- |
| `openclaw_run_completed_total`                | Counter   | `channel`, `model`, `outcome`, `provider`, `trigger`                                      |
| `openclaw_run_duration_seconds`               | Histogramm | `channel`, `model`, `outcome`, `provider`, `trigger`                                      |
| `openclaw_model_call_total`                   | Counter   | `api`, `error_category`, `model`, `outcome`, `provider`, `transport`                      |
| `openclaw_model_call_duration_seconds`        | Histogramm | `api`, `error_category`, `model`, `outcome`, `provider`, `transport`                      |
| `openclaw_model_tokens_total`                 | Counter   | `agent`, `channel`, `model`, `provider`, `token_type`                                     |
| `openclaw_gen_ai_client_token_usage`          | Histogramm | `model`, `provider`, `token_type`                                                         |
| `openclaw_model_cost_usd_total`               | Counter   | `agent`, `channel`, `model`, `provider`                                                   |
| `openclaw_tool_execution_total`               | Counter   | `error_category`, `outcome`, `params_kind`, `tool`                                        |
| `openclaw_tool_execution_duration_seconds`    | Histogramm | `error_category`, `outcome`, `params_kind`, `tool`                                        |
| `openclaw_harness_run_total`                  | Counter   | `channel`, `error_category`, `harness`, `model`, `outcome`, `phase`, `plugin`, `provider` |
| `openclaw_harness_run_duration_seconds`       | Histogramm | `channel`, `error_category`, `harness`, `model`, `outcome`, `phase`, `plugin`, `provider` |
| `openclaw_message_processed_total`            | Counter   | `channel`, `outcome`, `reason`                                                            |
| `openclaw_message_processed_duration_seconds` | Histogramm | `channel`, `outcome`, `reason`                                                            |
| `openclaw_message_delivery_total`             | Counter   | `channel`, `delivery_kind`, `error_category`, `outcome`                                   |
| `openclaw_message_delivery_duration_seconds`  | Histogramm | `channel`, `delivery_kind`, `error_category`, `outcome`                                   |
| `openclaw_queue_lane_size`                    | Gauge     | `lane`                                                                                    |
| `openclaw_queue_lane_wait_seconds`            | Histogramm | `lane`                                                                                    |
| `openclaw_session_state_total`                | Counter   | `reason`, `state`                                                                         |
| `openclaw_session_queue_depth`                | Gauge     | `state`                                                                                   |
| `openclaw_memory_bytes`                       | Gauge     | `kind`                                                                                    |
| `openclaw_memory_rss_bytes`                   | Histogramm | keine                                                                                     |
| `openclaw_memory_pressure_total`              | Counter   | `level`, `reason`                                                                         |
| `openclaw_telemetry_exporter_total`           | Counter   | `exporter`, `reason`, `signal`, `status`                                                  |
| `openclaw_prometheus_series_dropped_total`    | Counter   | keine                                                                                     |

## Label-Richtlinie

<AccordionGroup>
  <Accordion title="Begrenzte Labels mit niedriger Kardinalität">
    Prometheus-Labels bleiben begrenzt und kardinalitätsarm. Der Exporter gibt keine rohen Diagnosekennungen wie `runId`, `sessionKey`, `sessionId`, `callId`, `toolCallId`, Nachrichten-IDs, Chat-IDs oder Provider-Anfrage-IDs aus.

    Label-Werte werden redigiert und müssen der OpenClaw-Zeichenrichtlinie für niedrige Kardinalität entsprechen. Werte, die die Richtlinie nicht erfüllen, werden je nach Metrik durch `unknown`, `other` oder `none` ersetzt.

  </Accordion>
  <Accordion title="Serienlimit und Überlaufzählung">
    Der Exporter begrenzt gespeicherte Zeitreihen im Arbeitsspeicher auf **2048** Serien über Counter, Gauges und Histogramme hinweg. Neue Serien oberhalb dieses Limits werden verworfen, und `openclaw_prometheus_series_dropped_total` wird jedes Mal um eins erhöht.

    Überwachen Sie diesen Counter als klares Signal dafür, dass ein Upstream-Attribut Werte mit hoher Kardinalität leakt. Der Exporter hebt das Limit nie automatisch an. Wenn es ansteigt, beheben Sie die Quelle, anstatt das Limit zu deaktivieren.

  </Accordion>
  <Accordion title="Was nie in der Prometheus-Ausgabe erscheint">
    - Prompt-Text, Antworttext, Tool-Eingaben, Tool-Ausgaben, System-Prompts
    - rohe Provider-Anfrage-IDs (nur begrenzte Hashes, sofern zutreffend, in Spans, nie in Metriken)
    - Sitzungsschlüssel und Sitzungs-IDs
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

# Dropped Prometheus series (cardinality alarm)
increase(openclaw_prometheus_series_dropped_total[15m]) > 0
```

<Tip>
Bevorzugen Sie `gen_ai_client_token_usage` für Provider-übergreifende Dashboards: Es folgt den semantischen OpenTelemetry-GenAI-Konventionen und ist mit Metriken aus GenAI-Diensten außerhalb von OpenClaw konsistent.
</Tip>

## Auswahl zwischen Prometheus- und OpenTelemetry-Export

OpenClaw unterstützt beide Oberflächen unabhängig voneinander. Sie können entweder eine, beide oder keine verwenden.

<Tabs>
  <Tab title="diagnostics-prometheus">
    - **Pull**-Modell: Prometheus scrapt `/api/diagnostics/prometheus`.
    - Kein externer Collector erforderlich.
    - Authentifizierung über normale Gateway-Authentifizierung.
    - Die Oberfläche umfasst nur Metriken (keine Traces oder Logs).
    - Am besten geeignet für Stacks, die bereits auf Prometheus + Grafana standardisiert sind.

  </Tab>
  <Tab title="diagnostics-otel">
    - **Push**-Modell: OpenClaw sendet OTLP/HTTP an einen Collector oder ein OTLP-kompatibles Backend.
    - Die Oberfläche umfasst Metriken, Traces und Logs.
    - Wird über einen OpenTelemetry Collector (`prometheus`- oder `prometheusremotewrite`-Exporter) mit Prometheus verbunden, wenn Sie beides benötigen.
    - Siehe [OpenTelemetry-Export](/de/gateway/opentelemetry) für den vollständigen Katalog.

  </Tab>
</Tabs>

## Fehlerbehebung

<AccordionGroup>
  <Accordion title="Leerer Antworttext">
    - Prüfen Sie `diagnostics.enabled: true` in der Konfiguration.
    - Bestätigen Sie mit `openclaw plugins list --enabled`, dass das Plugin aktiviert und geladen ist.
    - Erzeugen Sie etwas Traffic; Counter und Histogramme geben erst nach mindestens einem Ereignis Zeilen aus.

  </Accordion>
  <Accordion title="401 / nicht autorisiert">
    Der Endpunkt erfordert den Gateway-Operator-Scope (`auth: "gateway"` mit `gatewayRuntimeScopeSurface: "trusted-operator"`). Verwenden Sie dasselbe Token oder Passwort, das Prometheus für jede andere Gateway-Operator-Route verwendet. Es gibt keinen öffentlichen, nicht authentifizierten Modus.
  </Accordion>
  <Accordion title="`openclaw_prometheus_series_dropped_total` steigt">
    Ein neues Attribut überschreitet das Limit von **2048** Serien. Prüfen Sie aktuelle Metriken auf ein unerwartetes Label mit hoher Kardinalität und beheben Sie es an der Quelle. Der Exporter verwirft neue Serien absichtlich, anstatt Labels stillschweigend umzuschreiben.
  </Accordion>
  <Accordion title="Prometheus zeigt nach einem Neustart veraltete Serien">
    Das Plugin hält den Zustand nur im Arbeitsspeicher. Nach einem Gateway-Neustart werden Counter auf null zurückgesetzt und Gauges beginnen wieder mit ihrem nächsten gemeldeten Wert. Verwenden Sie PromQL `rate()` und `increase()`, um Resets sauber zu behandeln.
  </Accordion>
</AccordionGroup>

## Verwandte Themen

- [Diagnoseexport](/de/gateway/diagnostics) — lokales Diagnose-ZIP für Support-Bundles
- [Health und Readiness](/de/gateway/health) — `/healthz`- und `/readyz`-Probes
- [Logging](/de/logging) — dateibasiertes Logging
- [OpenTelemetry-Export](/de/gateway/opentelemetry) — OTLP-Push für Traces, Metriken und Logs

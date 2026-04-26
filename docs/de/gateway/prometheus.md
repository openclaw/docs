---
read_when:
    - Sie möchten, dass Prometheus, Grafana, VictoriaMetrics oder ein anderer Scraper OpenClaw-Gateway-Metriken erfasst
    - Sie benötigen die Namen der Prometheus-Metriken und die Label-Richtlinie für Dashboards oder Alerts
    - Sie möchten Metriken, ohne einen OpenTelemetry-Collector auszuführen
sidebarTitle: Prometheus
summary: OpenClaw-Diagnosen über das diagnostics-prometheus-Plugin als Prometheus-Textmetriken verfügbar machen
title: Prometheus-Metriken
x-i18n:
    generated_at: "2026-04-26T11:30:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: 29fd3e4658ceffe20f078e8e38b61c685ea9df518ca04ca34abf2085166eb481
    source_path: gateway/prometheus.md
    workflow: 15
---

OpenClaw kann Diagnostikmetriken über das gebündelte Plugin `diagnostics-prometheus` verfügbar machen. Es lauscht auf vertrauenswürdige interne Diagnosedaten und stellt einen Prometheus-Textendpunkt bereit unter:

```text
GET /api/diagnostics/prometheus
```

Der Content-Type ist `text/plain; version=0.0.4; charset=utf-8`, das Standardformat für die Prometheus-Exposition.

<Warning>
Die Route verwendet Gateway-Authentifizierung (Operator-Bereich). Stellen Sie sie nicht als öffentlichen, nicht authentifizierten Endpunkt `/metrics` bereit. Erfassen Sie sie über denselben Authentifizierungspfad, den Sie auch für andere Operator-APIs verwenden.
</Warning>

Für Traces, Logs, OTLP-Push und semantische OpenTelemetry-GenAI-Attribute siehe [OpenTelemetry export](/de/gateway/opentelemetry).

## Schnellstart

<Steps>
  <Step title="Das Plugin aktivieren">
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
  <Step title="Das Gateway neu starten">
    Die HTTP-Route wird beim Start des Plugins registriert, daher nach dem Aktivieren neu laden.
  </Step>
  <Step title="Die geschützte Route erfassen">
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
| `openclaw_memory_rss_bytes`                   | Histogramm | none                                                                                      |
| `openclaw_memory_pressure_total`              | Counter   | `level`, `reason`                                                                         |
| `openclaw_telemetry_exporter_total`           | Counter   | `exporter`, `reason`, `signal`, `status`                                                  |
| `openclaw_prometheus_series_dropped_total`    | Counter   | none                                                                                      |

## Label-Richtlinie

<AccordionGroup>
  <Accordion title="Begrenzte Labels mit niedriger Kardinalität">
    Prometheus-Labels bleiben begrenzt und von niedriger Kardinalität. Der Exporter gibt keine rohen Diagnosekennungen wie `runId`, `sessionKey`, `sessionId`, `callId`, `toolCallId`, Nachrichten-IDs, Chat-IDs oder Provider-Request-IDs aus.

    Label-Werte werden redigiert und müssen der OpenClaw-Zeichenrichtlinie für niedrige Kardinalität entsprechen. Werte, die diese Richtlinie nicht erfüllen, werden je nach Metrik durch `unknown`, `other` oder `none` ersetzt.

  </Accordion>
  <Accordion title="Obergrenze für Serien und Overflow-Zählung">
    Der Exporter begrenzt die im Speicher gehaltenen Zeitreihen auf **2048** Serien über Counter, Gauges und Histogramme zusammen. Neue Serien oberhalb dieser Grenze werden verworfen, und `openclaw_prometheus_series_dropped_total` wird jedes Mal um eins erhöht.

    Beobachten Sie diesen Counter als hartes Signal dafür, dass ein Attribut upstream hochkardinale Werte leakt. Der Exporter hebt die Grenze niemals automatisch an; wenn sie steigt, beheben Sie die Ursache statt die Grenze zu deaktivieren.

  </Accordion>
  <Accordion title="Was niemals in der Prometheus-Ausgabe erscheint">
    - Prompt-Text, Antworttext, Tool-Eingaben, Tool-Ausgaben, System-Prompts
    - rohe Provider-Request-IDs (nur begrenzte Hashes, wo anwendbar, auf Spans — niemals auf Metriken)
    - Sitzungsschlüssel und Sitzungs-IDs
    - Hostnamen, Dateipfade, geheime Werte
  </Accordion>
</AccordionGroup>

## PromQL-Rezepte

```promql
# Tokens pro Minute, aufgeteilt nach Provider
sum by (provider) (rate(openclaw_model_tokens_total[1m]))

# Kosten (USD) über die letzte Stunde, nach Modell
sum by (model) (increase(openclaw_model_cost_usd_total[1h]))

# 95. Perzentil der Modellausführungsdauer
histogram_quantile(
  0.95,
  sum by (le, provider, model)
    (rate(openclaw_run_duration_seconds_bucket[5m]))
)

# SLO für Wartezeit in der Queue (95p unter 2s)
histogram_quantile(
  0.95,
  sum by (le, lane) (rate(openclaw_queue_lane_wait_seconds_bucket[5m]))
) < 2

# Verworfene Prometheus-Serien (Kardinalitätsalarm)
increase(openclaw_prometheus_series_dropped_total[15m]) > 0
```

<Tip>
Bevorzugen Sie `gen_ai_client_token_usage` für providerübergreifende Dashboards: Es folgt den semantischen OpenTelemetry-GenAI-Konventionen und ist konsistent mit Metriken von GenAI-Diensten, die nicht von OpenClaw stammen.
</Tip>

## Auswahl zwischen Prometheus- und OpenTelemetry-Export

OpenClaw unterstützt beide Oberflächen unabhängig voneinander. Sie können entweder eine, beide oder keine verwenden.

<Tabs>
  <Tab title="diagnostics-prometheus">
    - **Pull**-Modell: Prometheus erfasst `/api/diagnostics/prometheus`.
    - Kein externer Collector erforderlich.
    - Authentifiziert über die normale Gateway-Authentifizierung.
    - Die Oberfläche umfasst nur Metriken (keine Traces oder Logs).
    - Am besten geeignet für Stacks, die bereits auf Prometheus + Grafana standardisiert sind.
  </Tab>
  <Tab title="diagnostics-otel">
    - **Push**-Modell: OpenClaw sendet OTLP/HTTP an einen Collector oder ein OTLP-kompatibles Backend.
    - Die Oberfläche umfasst Metriken, Traces und Logs.
    - Brücke zu Prometheus über einen OpenTelemetry Collector (`prometheus`- oder `prometheusremotewrite`-Exporter), wenn Sie beides benötigen.
    - Den vollständigen Katalog finden Sie unter [OpenTelemetry export](/de/gateway/opentelemetry).
  </Tab>
</Tabs>

## Fehlerbehebung

<AccordionGroup>
  <Accordion title="Leerer Antwort-Body">
    - Prüfen Sie `diagnostics.enabled: true` in der Konfiguration.
    - Bestätigen Sie mit `openclaw plugins list --enabled`, dass das Plugin aktiviert und geladen ist.
    - Erzeugen Sie etwas Traffic; Counter und Histogramme geben erst nach mindestens einem Ereignis Zeilen aus.
  </Accordion>
  <Accordion title="401 / unauthorized">
    Der Endpunkt erfordert den Gateway-Operator-Bereich (`auth: "gateway"` mit `gatewayRuntimeScopeSurface: "trusted-operator"`). Verwenden Sie dasselbe Token oder Passwort, das Prometheus auch für jede andere Gateway-Operator-Route verwendet. Es gibt keinen öffentlichen, nicht authentifizierten Modus.
  </Accordion>
  <Accordion title="`openclaw_prometheus_series_dropped_total` steigt">
    Ein neues Attribut überschreitet die Obergrenze von **2048** Serien. Prüfen Sie aktuelle Metriken auf ein unerwartet hochkardinales Label und beheben Sie es an der Quelle. Der Exporter verwirft neue Serien absichtlich, statt Labels stillschweigend umzuschreiben.
  </Accordion>
  <Accordion title="Prometheus zeigt nach einem Neustart veraltete Serien">
    Das Plugin hält den Status nur im Speicher. Nach einem Gateway-Neustart werden Counter auf null zurückgesetzt und Gauges beginnen mit ihrem nächsten gemeldeten Wert neu. Verwenden Sie PromQL `rate()` und `increase()`, um Resets sauber zu behandeln.
  </Accordion>
</AccordionGroup>

## Verwandt

- [Diagnostics export](/de/gateway/diagnostics) — lokales Diagnostik-ZIP für Support-Bundles
- [Health and readiness](/de/gateway/health) — Probes `/healthz` und `/readyz`
- [Logging](/de/logging) — dateibasierte Protokollierung
- [OpenTelemetry export](/de/gateway/opentelemetry) — OTLP-Push für Traces, Metriken und Logs

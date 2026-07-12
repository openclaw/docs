---
read_when:
    - Sie möchten, dass Prometheus, Grafana, VictoriaMetrics oder ein anderer Scraper Metriken des OpenClaw Gateway erfasst
    - Sie benötigen die Namen der Prometheus-Metriken und die Label-Richtlinie für Dashboards oder Warnmeldungen
    - Sie möchten Metriken erfassen, ohne einen OpenTelemetry-Collector zu betreiben
sidebarTitle: Prometheus
summary: OpenClaw-Diagnosedaten über das diagnostics-prometheus-Plugin als Prometheus-Textmetriken bereitstellen
title: Prometheus-Metriken
x-i18n:
    generated_at: "2026-07-12T15:21:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 8a3975a9a79f32f1e9731b819613fdf6b9ffeee20bc71c841b9a6d7a5e0052f4
    source_path: gateway/prometheus.md
    workflow: 16
---

  OpenClaw kann Diagnosemetriken über das offizielle Plugin
  `diagnostics-prometheus` bereitstellen. Es lauscht auf vertrauenswürdige Diagnosedaten sowie
  intern markierte, vom Dispatcher verwaltete Diagnoseereignisse (Warteschlangen-, Speicher- und
  Sitzungswiederherstellungssignale) und stellt einen Prometheus-Textendpunkt unter folgender Adresse bereit:

  ```text
  GET /api/diagnostics/prometheus
  ```

  Der Inhaltstyp ist `text/plain; version=0.0.4; charset=utf-8`, das standardmäßige
  Prometheus-Expositionsformat.

  <Warning>
  Die Route verwendet die Gateway-Authentifizierung (Operator-Berechtigungsumfang, Oberfläche für vertrauenswürdige Operatoren). Stellen Sie sie nicht als öffentlichen, nicht authentifizierten `/metrics`-Endpunkt bereit. Rufen Sie sie über denselben Authentifizierungspfad ab, den Sie für andere Operator-APIs verwenden.
  </Warning>

  Informationen zu Traces, Protokollen, OTLP-Push und semantischen OpenTelemetry-GenAI-Attributen finden Sie unter [OpenTelemetry-Export](/de/gateway/opentelemetry).

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
    Die HTTP-Route wird beim Start des Plugins registriert. Laden Sie daher nach der Aktivierung neu.
  </Step>
  <Step title="Geschützte Route abrufen">
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
`diagnostics.enabled` ist standardmäßig auf `true` gesetzt; setzen Sie es nur in stark eingeschränkten Umgebungen auf `false`. Wenn es auf `false` gesetzt ist, registriert das Plugin weiterhin die HTTP-Route, es fließen jedoch keine Diagnoseereignisse in den Exporter, sodass die Antwort leer ist.
</Note>

## Exportierte Metriken

| Metrik                                           | Typ       | Labels                                                                                    |
| ------------------------------------------------ | --------- | ----------------------------------------------------------------------------------------- |
| `openclaw_run_completed_total`                   | Zähler    | `channel`, `model`, `outcome`, `provider`, `trigger`                                      |
| `openclaw_run_duration_seconds`                  | Histogramm | `channel`, `model`, `outcome`, `provider`, `trigger`                                      |
| `openclaw_model_call_total`                      | Zähler    | `api`, `error_category`, `model`, `outcome`, `provider`, `transport`                      |
| `openclaw_model_call_duration_seconds`           | Histogramm | `api`, `error_category`, `model`, `outcome`, `provider`, `transport`                      |
| `openclaw_model_failover_total`                  | Zähler    | `from_model`, `from_provider`, `lane`, `reason`, `suspended`, `to_model`, `to_provider`   |
| `openclaw_model_tokens_total`                    | Zähler    | `agent`, `channel`, `model`, `provider`, `token_type`                                     |
| `openclaw_gen_ai_client_token_usage`             | Histogramm | `model`, `provider`, `token_type`                                                         |
| `openclaw_model_cost_usd_total`                  | Zähler    | `agent`, `channel`, `model`, `provider`                                                   |
| `openclaw_model_usage_duration_seconds`          | Histogramm | `agent`, `channel`, `model`, `provider`                                                   |
| `openclaw_skill_used_total`                      | Zähler    | `activation`, `agent`, `skill`, `source`                                                  |
| `openclaw_tool_execution_total`                  | Zähler    | `error_category`, `outcome`, `params_kind`, `tool`, `tool_owner`, `tool_source`           |
| `openclaw_tool_execution_duration_seconds`       | Histogramm | `error_category`, `outcome`, `params_kind`, `tool`, `tool_owner`, `tool_source`           |
| `openclaw_tool_execution_blocked_total`          | Zähler    | `denied_reason`, `params_kind`, `tool`, `tool_owner`, `tool_source`                       |
| `openclaw_harness_run_total`                     | Zähler    | `channel`, `error_category`, `harness`, `model`, `outcome`, `phase`, `plugin`, `provider` |
| `openclaw_harness_run_duration_seconds`          | Histogramm | `channel`, `error_category`, `harness`, `model`, `outcome`, `phase`, `plugin`, `provider` |
| `openclaw_webhook_received_total`                | Zähler    | `channel`, `webhook`                                                                      |
| `openclaw_webhook_error_total`                   | Zähler    | `channel`, `webhook`                                                                      |
| `openclaw_webhook_duration_seconds`              | Histogramm | `channel`, `webhook`                                                                      |
| `openclaw_message_received_total`                | Zähler    | `channel`, `source`                                                                       |
| `openclaw_message_dispatch_started_total`        | Zähler    | `channel`, `source`                                                                       |
| `openclaw_message_dispatch_completed_total`      | Zähler    | `channel`, `outcome`, `reason`, `source`                                                  |
| `openclaw_message_dispatch_duration_seconds`     | Histogramm | `channel`, `outcome`, `reason`, `source`                                                  |
| `openclaw_message_processed_total`               | Zähler    | `channel`, `outcome`, `reason`                                                            |
| `openclaw_message_processed_duration_seconds`    | Histogramm | `channel`, `outcome`, `reason`                                                            |
| `openclaw_message_delivery_started_total`        | Zähler    | `channel`, `delivery_kind`                                                                |
| `openclaw_message_delivery_total`                | Zähler    | `channel`, `delivery_kind`, `error_category`, `outcome`                                   |
| `openclaw_message_delivery_duration_seconds`     | Histogramm | `channel`, `delivery_kind`, `error_category`, `outcome`                                   |
| `openclaw_talk_event_total`                      | Zähler    | `brain`, `event_type`, `mode`, `provider`, `transport`                                    |
| `openclaw_talk_event_duration_seconds`           | Histogramm | `brain`, `event_type`, `mode`, `provider`, `transport`                                    |
| `openclaw_talk_audio_bytes`                      | Histogramm | `brain`, `event_type`, `mode`, `provider`, `transport`                                    |
| `openclaw_queue_lane_size`                       | Messwert  | `lane`                                                                                    |
| `openclaw_queue_lane_wait_seconds`               | Histogramm | `lane`                                                                                    |
| `openclaw_session_state_total`                   | Zähler    | `reason`, `state`                                                                         |
| `openclaw_session_queue_depth`                   | Messwert  | `state`                                                                                   |
| `openclaw_session_turn_created_total`            | Zähler    | `agent`, `channel`, `trigger`                                                             |
| `openclaw_session_stuck_total`                   | Zähler    | `reason`, `state`                                                                         |
| `openclaw_session_stuck_age_seconds`             | Histogramm | `reason`, `state`                                                                         |
| `openclaw_session_recovery_total`                | Zähler    | `action`, `active_work_kind`, `state`, `status`                                           |
| `openclaw_session_recovery_age_seconds`          | Histogramm | `action`, `active_work_kind`, `state`, `status`                                           |
| `openclaw_liveness_warning_total`                | Zähler    | `reason`                                                                                  |
| `openclaw_liveness_sessions`                     | Messwert  | `state`                                                                                   |
| `openclaw_liveness_event_loop_delay_p99_seconds` | Histogramm | `reason`                                                                                  |
| `openclaw_liveness_event_loop_delay_max_seconds` | Histogramm | `reason`                                                                                  |
| `openclaw_liveness_event_loop_utilization_ratio` | Histogramm | `reason`                                                                                  |
| `openclaw_liveness_cpu_core_ratio`               | Histogramm | `reason`                                                                                  |
| `openclaw_payload_large_total`                   | Zähler    | `action`, `channel`, `plugin`, `reason`, `surface`                                        |
| `openclaw_payload_large_bytes`                   | Histogramm | `action`, `channel`, `plugin`, `reason`, `surface`                                        |
| `openclaw_memory_bytes`                          | Messwert  | `kind`                                                                                    |
| `openclaw_memory_rss_bytes`                      | Histogramm | keine                                                                                     |
| `openclaw_memory_pressure_total`                 | Zähler    | `level`, `reason`                                                                         |
| `openclaw_telemetry_exporter_total`              | Zähler    | `exporter`, `reason`, `signal`, `status`                                                  |
| `openclaw_prometheus_series_dropped_total`       | Zähler    | keine                                                                                     |
| `openclaw_diagnostic_async_queue_dropped_total`  | Zähler    | `drop_class`                                                                              |
| `openclaw_diagnostic_async_queue_length`         | Messwert  | keine                                                                                     |

## Label-Richtlinie

<AccordionGroup>
  <Accordion title="Begrenzte Labels mit niedriger Kardinalität">
    Prometheus-Labels bleiben begrenzt und weisen eine niedrige Kardinalität auf. Der Exporter gibt keine unverarbeiteten Diagnosekennungen wie `runId`, `sessionKey`, `sessionId`, `callId`, `toolCallId`, Nachrichten-IDs, Chat-IDs oder Provider-Anfrage-IDs aus.

    Label-Werte werden redigiert und müssen der OpenClaw-Zeichenrichtlinie für niedrige Kardinalität entsprechen. Werte, die der Richtlinie nicht entsprechen, werden je nach Metrik durch `unknown`, `other` oder `none` ersetzt. Labels, die wie bereichsbezogene Agent-Sitzungsschlüssel aussehen, werden ebenfalls durch `unknown` ersetzt.

  </Accordion>
  <Accordion title="Serienbegrenzung und Überlauferfassung">
    Der Exporter begrenzt die im Arbeitsspeicher vorgehaltenen Zeitreihen auf insgesamt **2048** Serien über Zähler, Messwerte und Histogramme hinweg. Neue Serien, die diese Begrenzung überschreiten, werden verworfen, und `openclaw_prometheus_series_dropped_total` wird jedes Mal um eins erhöht.

    Überwachen Sie diesen Zähler als eindeutiges Signal dafür, dass ein vorgelagertes Attribut Werte mit hoher Kardinalität durchsickern lässt. Der Exporter hebt die Begrenzung niemals automatisch an; wenn der Zähler steigt, beheben Sie die Ursache, statt die Begrenzung zu deaktivieren.

  </Accordion>
  <Accordion title="Was niemals in der Prometheus-Ausgabe erscheint">
    - Prompttext, Antworttext, Tool-Eingaben, Tool-Ausgaben, System-Prompts
    - Talk-Transkripte, Audionutzdaten, Anruf-IDs, Raum-IDs, Übergabe-Token, Turn-IDs und unverarbeitete Sitzungs-IDs
    - unverarbeitete Provider-Anfrage-IDs (nur begrenzte Hashes, sofern zutreffend, in Spans – niemals in Metriken)
    - Sitzungsschlüssel und Sitzungs-IDs
    - Hostnamen, Dateipfade, geheime Werte

  </Accordion>
</AccordionGroup>

## PromQL-Rezepte

```promql
# Token pro Minute, nach Provider aufgeschlüsselt
sum by (provider) (rate(openclaw_model_tokens_total[1m]))

# Ausgaben (USD) während der letzten Stunde, nach Modell
sum by (model) (increase(openclaw_model_cost_usd_total[1h]))

# 95. Perzentil der Modelllaufzeit
histogram_quantile(
  0.95,
  sum by (le, provider, model)
    (rate(openclaw_run_duration_seconds_bucket[5m]))
)

# SLO für die Wartezeit in der Warteschlange (95. Perzentil unter 2s)
histogram_quantile(
  0.95,
  sum by (le, lane) (rate(openclaw_queue_lane_wait_seconds_bucket[5m]))
) < 2

# Skill-Nutzung, nach begrenzter Quelle aufgeschlüsselt
sum by (skill, source) (increase(openclaw_skill_used_total[24h]))

# Verworfene Prometheus-Serien (Kardinalitätsalarm)
increase(openclaw_prometheus_series_dropped_total[15m]) > 0
```

<Tip>
Bevorzugen Sie `gen_ai_client_token_usage` für Provider-übergreifende Dashboards: Die Metrik folgt den semantischen OpenTelemetry-GenAI-Konventionen und stimmt mit Metriken von GenAI-Diensten außerhalb von OpenClaw überein.
</Tip>

## Wahl zwischen Prometheus- und OpenTelemetry-Export

OpenClaw unterstützt beide Schnittstellen unabhängig voneinander. Sie können eine von beiden, beide oder keine davon verwenden.

<Tabs>
  <Tab title="diagnostics-prometheus">
    - **Pull-Modell**: Prometheus ruft `/api/diagnostics/prometheus` ab.
    - Kein externer Collector erforderlich.
    - Authentifizierung über die normale Gateway-Authentifizierung.
    - Die Schnittstelle umfasst ausschließlich Metriken (keine Traces oder Protokolle).
    - Optimal für Stacks, die bereits auf Prometheus + Grafana standardisiert sind.

  </Tab>
  <Tab title="diagnostics-otel">
    - **Push-Modell**: OpenClaw sendet OTLP/HTTP an einen Collector oder ein OTLP-kompatibles Backend.
    - Die Schnittstelle umfasst Metriken, Traces und Protokolle.
    - Stellt bei Bedarf über einen OpenTelemetry Collector (`prometheus`- oder `prometheusremotewrite`-Exporter) eine Verbindung zu Prometheus her.
    - Den vollständigen Katalog finden Sie unter [OpenTelemetry-Export](/de/gateway/opentelemetry).

  </Tab>
</Tabs>

## Fehlerbehebung

<AccordionGroup>
  <Accordion title="Leerer Antworttext">
    - Prüfen Sie, dass `diagnostics.enabled` in der Konfiguration nicht auf `false` gesetzt ist (Standardwert ist `true`).
    - Vergewissern Sie sich mit `openclaw plugins list --enabled`, dass das Plugin aktiviert und geladen ist.
    - Erzeugen Sie etwas Datenverkehr; Zähler und Histogramme geben erst nach mindestens einem Ereignis Zeilen aus.

  </Accordion>
  <Accordion title="401 / nicht autorisiert">
    Der Endpunkt erfordert den Gateway-Betreiberbereich (`auth: "gateway"` mit `gatewayRuntimeScopeSurface: "trusted-operator"`). Verwenden Sie dasselbe Token oder Passwort, das Prometheus für jede andere Gateway-Betreiberroute verwendet. Es gibt keinen öffentlichen, nicht authentifizierten Modus.
  </Accordion>
  <Accordion title="`openclaw_prometheus_series_dropped_total` steigt">
    Ein neues Attribut überschreitet die Begrenzung von **2048** Serien. Untersuchen Sie aktuelle Metriken auf ein Label mit unerwartet hoher Kardinalität und beheben Sie die Ursache. Der Exporter verwirft absichtlich neue Serien, statt Labels unbemerkt umzuschreiben.
  </Accordion>
  <Accordion title="Prometheus zeigt nach einem Neustart veraltete Serien">
    Das Plugin speichert den Zustand ausschließlich im Arbeitsspeicher. Nach einem Neustart des Gateway werden Zähler auf null zurückgesetzt, und Messwerte beginnen wieder mit ihrem nächsten gemeldeten Wert. Verwenden Sie in PromQL `rate()` und `increase()`, um Zurücksetzungen korrekt zu verarbeiten.
  </Accordion>
</AccordionGroup>

## Verwandte Themen

- [Diagnoseexport](/de/gateway/diagnostics) — lokale Diagnose-ZIP-Datei für Supportpakete
- [Systemzustand und Bereitschaft](/de/gateway/health) — `/healthz`- und `/readyz`-Prüfungen
- [Protokollierung](/de/logging) — dateibasierte Protokollierung
- [OpenTelemetry-Export](/de/gateway/opentelemetry) — OTLP-Push für Traces, Metriken und Protokolle

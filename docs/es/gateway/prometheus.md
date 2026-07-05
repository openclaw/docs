---
read_when:
    - Quieres que Prometheus, Grafana, VictoriaMetrics u otro scraper recopile métricas del Gateway de OpenClaw
    - Necesitas los nombres de las métricas de Prometheus y la política de etiquetas para paneles o alertas
    - Quieres métricas sin ejecutar un recopilador de OpenTelemetry
sidebarTitle: Prometheus
summary: Exponer los diagnósticos de OpenClaw como métricas de texto de Prometheus mediante el plugin diagnostics-prometheus
title: Métricas de Prometheus
x-i18n:
    generated_at: "2026-07-05T11:21:07Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8a3975a9a79f32f1e9731b819613fdf6b9ffeee20bc71c841b9a6d7a5e0052f4
    source_path: gateway/prometheus.md
    workflow: 16
---

  OpenClaw puede exponer métricas de diagnóstico mediante el plugin oficial
  `diagnostics-prometheus`. Escucha diagnósticos de confianza, además de eventos
  de diagnóstico etiquetados internamente y propiedad del despachador (señales de
  cola, memoria y recuperación de sesión), y representa un endpoint de texto de Prometheus en:

  ```text
  GET /api/diagnostics/prometheus
  ```

  El tipo de contenido es `text/plain; version=0.0.4; charset=utf-8`, el formato estándar
  de exposición de Prometheus.

  <Warning>
  La ruta usa autenticación de Gateway (alcance de operador, superficie de operador de confianza). No la expongas como un endpoint `/metrics` público sin autenticación. Recopílala mediante la misma ruta de autenticación que usas para otras API de operador.
  </Warning>

  Para trazas, registros, envío OTLP y atributos semánticos GenAI de OpenTelemetry, consulta [Exportación de OpenTelemetry](/es/gateway/opentelemetry).

  ## Inicio rápido

  <Steps>
  <Step title="Instalar el plugin">
    ```bash
    openclaw plugins install clawhub:@openclaw/diagnostics-prometheus
    ```
  </Step>
  <Step title="Habilitar el plugin">
    <Tabs>
      <Tab title="Configuración">
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
  <Step title="Reiniciar el Gateway">
    La ruta HTTP se registra al iniciar el plugin, así que vuelve a cargar después de habilitarlo.
  </Step>
  <Step title="Recopilar la ruta protegida">
    Envía la misma autenticación de gateway que usan tus clientes de operador:

    ```bash
    curl -H "Authorization: Bearer $OPENCLAW_GATEWAY_TOKEN" \
      http://127.0.0.1:18789/api/diagnostics/prometheus
    ```

  </Step>
  <Step title="Conectar Prometheus">
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
`diagnostics.enabled` tiene el valor predeterminado `true`; establécelo en `false` solo en entornos muy restringidos. Si es `false`, el plugin sigue registrando la ruta HTTP, pero no fluyen eventos de diagnóstico al exportador, por lo que la respuesta está vacía.
</Note>

## Métricas exportadas

| Métrica                                          | Tipo      | Etiquetas                                                                                 |
| ------------------------------------------------ | --------- | ----------------------------------------------------------------------------------------- |
| `openclaw_run_completed_total`                   | contador  | `channel`, `model`, `outcome`, `provider`, `trigger`                                      |
| `openclaw_run_duration_seconds`                  | histograma | `channel`, `model`, `outcome`, `provider`, `trigger`                                     |
| `openclaw_model_call_total`                      | contador  | `api`, `error_category`, `model`, `outcome`, `provider`, `transport`                      |
| `openclaw_model_call_duration_seconds`           | histograma | `api`, `error_category`, `model`, `outcome`, `provider`, `transport`                     |
| `openclaw_model_failover_total`                  | contador  | `from_model`, `from_provider`, `lane`, `reason`, `suspended`, `to_model`, `to_provider`   |
| `openclaw_model_tokens_total`                    | contador  | `agent`, `channel`, `model`, `provider`, `token_type`                                     |
| `openclaw_gen_ai_client_token_usage`             | histograma | `model`, `provider`, `token_type`                                                        |
| `openclaw_model_cost_usd_total`                  | contador  | `agent`, `channel`, `model`, `provider`                                                   |
| `openclaw_model_usage_duration_seconds`          | histograma | `agent`, `channel`, `model`, `provider`                                                  |
| `openclaw_skill_used_total`                      | contador  | `activation`, `agent`, `skill`, `source`                                                  |
| `openclaw_tool_execution_total`                  | contador  | `error_category`, `outcome`, `params_kind`, `tool`, `tool_owner`, `tool_source`           |
| `openclaw_tool_execution_duration_seconds`       | histograma | `error_category`, `outcome`, `params_kind`, `tool`, `tool_owner`, `tool_source`          |
| `openclaw_tool_execution_blocked_total`          | contador  | `denied_reason`, `params_kind`, `tool`, `tool_owner`, `tool_source`                       |
| `openclaw_harness_run_total`                     | contador  | `channel`, `error_category`, `harness`, `model`, `outcome`, `phase`, `plugin`, `provider` |
| `openclaw_harness_run_duration_seconds`          | histograma | `channel`, `error_category`, `harness`, `model`, `outcome`, `phase`, `plugin`, `provider` |
| `openclaw_webhook_received_total`                | contador  | `channel`, `webhook`                                                                      |
| `openclaw_webhook_error_total`                   | contador  | `channel`, `webhook`                                                                      |
| `openclaw_webhook_duration_seconds`              | histograma | `channel`, `webhook`                                                                     |
| `openclaw_message_received_total`                | contador  | `channel`, `source`                                                                       |
| `openclaw_message_dispatch_started_total`        | contador  | `channel`, `source`                                                                       |
| `openclaw_message_dispatch_completed_total`      | contador  | `channel`, `outcome`, `reason`, `source`                                                  |
| `openclaw_message_dispatch_duration_seconds`     | histograma | `channel`, `outcome`, `reason`, `source`                                                 |
| `openclaw_message_processed_total`               | contador  | `channel`, `outcome`, `reason`                                                            |
| `openclaw_message_processed_duration_seconds`    | histograma | `channel`, `outcome`, `reason`                                                           |
| `openclaw_message_delivery_started_total`        | contador  | `channel`, `delivery_kind`                                                                |
| `openclaw_message_delivery_total`                | contador  | `channel`, `delivery_kind`, `error_category`, `outcome`                                   |
| `openclaw_message_delivery_duration_seconds`     | histograma | `channel`, `delivery_kind`, `error_category`, `outcome`                                  |
| `openclaw_talk_event_total`                      | contador  | `brain`, `event_type`, `mode`, `provider`, `transport`                                    |
| `openclaw_talk_event_duration_seconds`           | histograma | `brain`, `event_type`, `mode`, `provider`, `transport`                                   |
| `openclaw_talk_audio_bytes`                      | histograma | `brain`, `event_type`, `mode`, `provider`, `transport`                                   |
| `openclaw_queue_lane_size`                       | indicador | `lane`                                                                                    |
| `openclaw_queue_lane_wait_seconds`               | histograma | `lane`                                                                                   |
| `openclaw_session_state_total`                   | contador  | `reason`, `state`                                                                         |
| `openclaw_session_queue_depth`                   | indicador | `state`                                                                                   |
| `openclaw_session_turn_created_total`            | contador  | `agent`, `channel`, `trigger`                                                             |
| `openclaw_session_stuck_total`                   | contador  | `reason`, `state`                                                                         |
| `openclaw_session_stuck_age_seconds`             | histograma | `reason`, `state`                                                                        |
| `openclaw_session_recovery_total`                | contador  | `action`, `active_work_kind`, `state`, `status`                                           |
| `openclaw_session_recovery_age_seconds`          | histograma | `action`, `active_work_kind`, `state`, `status`                                          |
| `openclaw_liveness_warning_total`                | contador  | `reason`                                                                                  |
| `openclaw_liveness_sessions`                     | indicador | `state`                                                                                   |
| `openclaw_liveness_event_loop_delay_p99_seconds` | histograma | `reason`                                                                                 |
| `openclaw_liveness_event_loop_delay_max_seconds` | histograma | `reason`                                                                                 |
| `openclaw_liveness_event_loop_utilization_ratio` | histograma | `reason`                                                                                 |
| `openclaw_liveness_cpu_core_ratio`               | histograma | `reason`                                                                                 |
| `openclaw_payload_large_total`                   | contador  | `action`, `channel`, `plugin`, `reason`, `surface`                                        |
| `openclaw_payload_large_bytes`                   | histograma | `action`, `channel`, `plugin`, `reason`, `surface`                                       |
| `openclaw_memory_bytes`                          | indicador | `kind`                                                                                    |
| `openclaw_memory_rss_bytes`                      | histograma | none                                                                                     |
| `openclaw_memory_pressure_total`                 | contador  | `level`, `reason`                                                                         |
| `openclaw_telemetry_exporter_total`              | contador  | `exporter`, `reason`, `signal`, `status`                                                  |
| `openclaw_prometheus_series_dropped_total`       | contador  | none                                                                                      |
| `openclaw_diagnostic_async_queue_dropped_total`  | contador  | `drop_class`                                                                              |
| `openclaw_diagnostic_async_queue_length`         | indicador | none                                                                                      |

## Política de etiquetas

<AccordionGroup>
  <Accordion title="Etiquetas limitadas y de baja cardinalidad">
    Las etiquetas de Prometheus se mantienen limitadas y de baja cardinalidad. El exportador no emite identificadores de diagnóstico sin procesar como `runId`, `sessionKey`, `sessionId`, `callId`, `toolCallId`, identificadores de mensajes, identificadores de chat ni identificadores de solicitudes de proveedores.

    Los valores de etiquetas se redactan y deben coincidir con la política de caracteres de baja cardinalidad de OpenClaw. Los valores que no cumplen la política se sustituyen por `unknown`, `other` o `none`, según la métrica. Las etiquetas que parecen claves de sesión de agente con ámbito también se sustituyen por `unknown`.

  </Accordion>
  <Accordion title="Límite de series y contabilización de desbordamiento">
    El exportador limita las series temporales retenidas en memoria a **2048** series en total entre contadores, medidores e histogramas. Las series nuevas que superen ese límite se descartan, y `openclaw_prometheus_series_dropped_total` aumenta en uno cada vez.

    Vigila este contador como una señal firme de que un atributo aguas arriba está filtrando valores de alta cardinalidad. El exportador nunca eleva el límite automáticamente; si aumenta, corrige el origen en lugar de desactivar el límite.

  </Accordion>
  <Accordion title="Qué nunca aparece en la salida de Prometheus">
    - texto de prompts, texto de respuestas, entradas de herramientas, salidas de herramientas, prompts del sistema
    - transcripciones de Talk, cargas de audio, ids de llamada, ids de sala, tokens de traspaso, ids de turno e ids de sesión sin procesar
    - ids de solicitud del proveedor sin procesar (solo hashes acotados, cuando corresponda, en spans; nunca en métricas)
    - claves de sesión e ids de sesión
    - nombres de host, rutas de archivo, valores secretos

  </Accordion>
</AccordionGroup>

## Recetas de PromQL

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
Prefiere `gen_ai_client_token_usage` para paneles entre proveedores: sigue las convenciones semánticas GenAI de OpenTelemetry y es coherente con las métricas de servicios GenAI que no son de OpenClaw.
</Tip>

## Elegir entre la exportación de Prometheus y OpenTelemetry

OpenClaw admite ambas superficies de forma independiente. Puedes ejecutar una, ambas o ninguna.

<Tabs>
  <Tab title="diagnostics-prometheus">
    - Modelo **pull**: Prometheus recopila `/api/diagnostics/prometheus`.
    - No requiere recopilador externo.
    - Autenticado mediante la autenticación normal del Gateway.
    - La superficie solo incluye métricas (sin trazas ni logs).
    - Ideal para stacks ya estandarizados en Prometheus + Grafana.

  </Tab>
  <Tab title="diagnostics-otel">
    - Modelo **push**: OpenClaw envía OTLP/HTTP a un recopilador o backend compatible con OTLP.
    - La superficie incluye métricas, trazas y logs.
    - Se conecta con Prometheus mediante un OpenTelemetry Collector (exportador `prometheus` o `prometheusremotewrite`) cuando necesitas ambos.
    - Consulta [Exportación de OpenTelemetry](/es/gateway/opentelemetry) para ver el catálogo completo.

  </Tab>
</Tabs>

## Solución de problemas

<AccordionGroup>
  <Accordion title="Cuerpo de respuesta vacío">
    - Comprueba que `diagnostics.enabled` no esté establecido en `false` en la configuración (su valor predeterminado es `true`).
    - Confirma que el plugin esté habilitado y cargado con `openclaw plugins list --enabled`.
    - Genera algo de tráfico; los contadores e histogramas solo emiten líneas después de al menos un evento.

  </Accordion>
  <Accordion title="401 / no autorizado">
    El endpoint requiere el alcance de operador del Gateway (`auth: "gateway"` con `gatewayRuntimeScopeSurface: "trusted-operator"`). Usa el mismo token o contraseña que Prometheus usa para cualquier otra ruta de operador del Gateway. No hay modo público sin autenticación.
  </Accordion>
  <Accordion title="`openclaw_prometheus_series_dropped_total` está aumentando">
    Un atributo nuevo está superando el límite de **2048** series. Inspecciona las métricas recientes para encontrar una etiqueta con cardinalidad inesperadamente alta y corrígela en el origen. El exportador descarta intencionadamente las series nuevas en lugar de reescribir etiquetas silenciosamente.
  </Accordion>
  <Accordion title="Prometheus muestra series obsoletas después de un reinicio">
    El plugin mantiene el estado solo en memoria. Después de un reinicio del Gateway, los contadores se restablecen a cero y los medidores se reinician en el siguiente valor que reporten. Usa `rate()` e `increase()` de PromQL para manejar los reinicios limpiamente.
  </Accordion>
</AccordionGroup>

## Relacionado

- [Exportación de diagnósticos](/es/gateway/diagnostics) — zip de diagnósticos local para paquetes de soporte
- [Salud y preparación](/es/gateway/health) — sondas `/healthz` y `/readyz`
- [Logging](/es/logging) — logging basado en archivos
- [Exportación de OpenTelemetry](/es/gateway/opentelemetry) — push de OTLP para trazas, métricas y logs

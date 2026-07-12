---
read_when:
    - Quieres que Prometheus, Grafana, VictoriaMetrics u otro recopilador recoja las métricas del Gateway de OpenClaw
    - Necesitas los nombres de las métricas de Prometheus y la política de etiquetas para paneles o alertas.
    - Quieres métricas sin ejecutar un colector de OpenTelemetry
sidebarTitle: Prometheus
summary: Expón los diagnósticos de OpenClaw como métricas de texto de Prometheus mediante el plugin diagnostics-prometheus
title: Métricas de Prometheus
x-i18n:
    generated_at: "2026-07-11T23:07:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8a3975a9a79f32f1e9731b819613fdf6b9ffeee20bc71c841b9a6d7a5e0052f4
    source_path: gateway/prometheus.md
    workflow: 16
---

  OpenClaw puede exponer métricas de diagnóstico mediante el Plugin oficial
  `diagnostics-prometheus`. Este escucha diagnósticos de confianza, además de
  eventos de diagnóstico etiquetados internamente y gestionados por el despachador
  (señales de cola, memoria y recuperación de sesiones), y presenta un endpoint de
  texto de Prometheus en:

  ```text
  GET /api/diagnostics/prometheus
  ```

  El tipo de contenido es `text/plain; version=0.0.4; charset=utf-8`, el formato
  estándar de exposición de Prometheus.

  <Warning>
  La ruta utiliza la autenticación del Gateway (ámbito de operador, superficie para operadores de confianza). No la exponga como un endpoint público `/metrics` sin autenticación. Recopile sus métricas mediante la misma ruta de autenticación que utiliza para otras API de operador.
  </Warning>

  Para trazas, registros, envío mediante OTLP y atributos semánticos de OpenTelemetry GenAI, consulte [Exportación de OpenTelemetry](/es/gateway/opentelemetry).

  ## Inicio rápido

  <Steps>
  <Step title="Instalar el Plugin">
    ```bash
    openclaw plugins install clawhub:@openclaw/diagnostics-prometheus
    ```
  </Step>
  <Step title="Habilitar el Plugin">
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
    La ruta HTTP se registra al iniciar el Plugin, por lo que debe reiniciar el servicio después de habilitarlo.
  </Step>
  <Step title="Recopilar métricas de la ruta protegida">
    Envíe la misma autenticación del Gateway que utilizan sus clientes de operador:

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
El valor predeterminado de `diagnostics.enabled` es `true`; establézcalo en `false` solo en entornos estrictamente restringidos. Si es `false`, el Plugin sigue registrando la ruta HTTP, pero no se envía ningún evento de diagnóstico al exportador, por lo que la respuesta está vacía.
</Note>

## Métricas exportadas

| Métrica                                          | Tipo       | Etiquetas                                                                                 |
| ------------------------------------------------ | ---------- | ----------------------------------------------------------------------------------------- |
| `openclaw_run_completed_total`                   | contador   | `channel`, `model`, `outcome`, `provider`, `trigger`                                      |
| `openclaw_run_duration_seconds`                  | histograma | `channel`, `model`, `outcome`, `provider`, `trigger`                                      |
| `openclaw_model_call_total`                      | contador   | `api`, `error_category`, `model`, `outcome`, `provider`, `transport`                      |
| `openclaw_model_call_duration_seconds`           | histograma | `api`, `error_category`, `model`, `outcome`, `provider`, `transport`                      |
| `openclaw_model_failover_total`                  | contador   | `from_model`, `from_provider`, `lane`, `reason`, `suspended`, `to_model`, `to_provider`   |
| `openclaw_model_tokens_total`                    | contador   | `agent`, `channel`, `model`, `provider`, `token_type`                                     |
| `openclaw_gen_ai_client_token_usage`             | histograma | `model`, `provider`, `token_type`                                                         |
| `openclaw_model_cost_usd_total`                  | contador   | `agent`, `channel`, `model`, `provider`                                                   |
| `openclaw_model_usage_duration_seconds`          | histograma | `agent`, `channel`, `model`, `provider`                                                   |
| `openclaw_skill_used_total`                      | contador   | `activation`, `agent`, `skill`, `source`                                                  |
| `openclaw_tool_execution_total`                  | contador   | `error_category`, `outcome`, `params_kind`, `tool`, `tool_owner`, `tool_source`           |
| `openclaw_tool_execution_duration_seconds`       | histograma | `error_category`, `outcome`, `params_kind`, `tool`, `tool_owner`, `tool_source`           |
| `openclaw_tool_execution_blocked_total`          | contador   | `denied_reason`, `params_kind`, `tool`, `tool_owner`, `tool_source`                       |
| `openclaw_harness_run_total`                     | contador   | `channel`, `error_category`, `harness`, `model`, `outcome`, `phase`, `plugin`, `provider` |
| `openclaw_harness_run_duration_seconds`          | histograma | `channel`, `error_category`, `harness`, `model`, `outcome`, `phase`, `plugin`, `provider` |
| `openclaw_webhook_received_total`                | contador   | `channel`, `webhook`                                                                      |
| `openclaw_webhook_error_total`                   | contador   | `channel`, `webhook`                                                                      |
| `openclaw_webhook_duration_seconds`              | histograma | `channel`, `webhook`                                                                      |
| `openclaw_message_received_total`                | contador   | `channel`, `source`                                                                       |
| `openclaw_message_dispatch_started_total`        | contador   | `channel`, `source`                                                                       |
| `openclaw_message_dispatch_completed_total`      | contador   | `channel`, `outcome`, `reason`, `source`                                                  |
| `openclaw_message_dispatch_duration_seconds`     | histograma | `channel`, `outcome`, `reason`, `source`                                                  |
| `openclaw_message_processed_total`               | contador   | `channel`, `outcome`, `reason`                                                            |
| `openclaw_message_processed_duration_seconds`    | histograma | `channel`, `outcome`, `reason`                                                            |
| `openclaw_message_delivery_started_total`        | contador   | `channel`, `delivery_kind`                                                                |
| `openclaw_message_delivery_total`                | contador   | `channel`, `delivery_kind`, `error_category`, `outcome`                                   |
| `openclaw_message_delivery_duration_seconds`     | histograma | `channel`, `delivery_kind`, `error_category`, `outcome`                                   |
| `openclaw_talk_event_total`                      | contador   | `brain`, `event_type`, `mode`, `provider`, `transport`                                    |
| `openclaw_talk_event_duration_seconds`           | histograma | `brain`, `event_type`, `mode`, `provider`, `transport`                                    |
| `openclaw_talk_audio_bytes`                      | histograma | `brain`, `event_type`, `mode`, `provider`, `transport`                                    |
| `openclaw_queue_lane_size`                       | indicador  | `lane`                                                                                    |
| `openclaw_queue_lane_wait_seconds`               | histograma | `lane`                                                                                    |
| `openclaw_session_state_total`                   | contador   | `reason`, `state`                                                                         |
| `openclaw_session_queue_depth`                   | indicador  | `state`                                                                                   |
| `openclaw_session_turn_created_total`            | contador   | `agent`, `channel`, `trigger`                                                             |
| `openclaw_session_stuck_total`                   | contador   | `reason`, `state`                                                                         |
| `openclaw_session_stuck_age_seconds`             | histograma | `reason`, `state`                                                                         |
| `openclaw_session_recovery_total`                | contador   | `action`, `active_work_kind`, `state`, `status`                                           |
| `openclaw_session_recovery_age_seconds`          | histograma | `action`, `active_work_kind`, `state`, `status`                                           |
| `openclaw_liveness_warning_total`                | contador   | `reason`                                                                                  |
| `openclaw_liveness_sessions`                     | indicador  | `state`                                                                                   |
| `openclaw_liveness_event_loop_delay_p99_seconds` | histograma | `reason`                                                                                  |
| `openclaw_liveness_event_loop_delay_max_seconds` | histograma | `reason`                                                                                  |
| `openclaw_liveness_event_loop_utilization_ratio` | histograma | `reason`                                                                                  |
| `openclaw_liveness_cpu_core_ratio`               | histograma | `reason`                                                                                  |
| `openclaw_payload_large_total`                   | contador   | `action`, `channel`, `plugin`, `reason`, `surface`                                        |
| `openclaw_payload_large_bytes`                   | histograma | `action`, `channel`, `plugin`, `reason`, `surface`                                        |
| `openclaw_memory_bytes`                          | indicador  | `kind`                                                                                    |
| `openclaw_memory_rss_bytes`                      | histograma | ninguna                                                                                   |
| `openclaw_memory_pressure_total`                 | contador   | `level`, `reason`                                                                         |
| `openclaw_telemetry_exporter_total`              | contador   | `exporter`, `reason`, `signal`, `status`                                                  |
| `openclaw_prometheus_series_dropped_total`       | contador   | ninguna                                                                                   |
| `openclaw_diagnostic_async_queue_dropped_total`  | contador   | `drop_class`                                                                              |
| `openclaw_diagnostic_async_queue_length`         | indicador  | ninguna                                                                                   |

## Política de etiquetas

<AccordionGroup>
  <Accordion title="Bounded, low-cardinality labels">
    Las etiquetas de Prometheus se mantienen acotadas y con baja cardinalidad. El exportador no emite identificadores de diagnóstico sin procesar, como `runId`, `sessionKey`, `sessionId`, `callId`, `toolCallId`, identificadores de mensajes, identificadores de chats ni identificadores de solicitudes del proveedor.

    Los valores de las etiquetas se ocultan y deben cumplir la política de caracteres de baja cardinalidad de OpenClaw. Los valores que no cumplen la política se sustituyen por `unknown`, `other` o `none`, según la métrica. Las etiquetas que parecen claves de sesión de agente con ámbito también se sustituyen por `unknown`.

  </Accordion>
  <Accordion title="Límite de series y contabilización del desbordamiento">
    El exportador limita las series temporales conservadas en memoria a **2048** series en total, combinando contadores, indicadores e histogramas. Las series nuevas que superen ese límite se descartan, y `openclaw_prometheus_series_dropped_total` aumenta en uno cada vez.

    Supervise este contador como una señal inequívoca de que algún atributo de origen está filtrando valores de alta cardinalidad. El exportador nunca eleva el límite automáticamente; si el contador aumenta, corrija el origen en lugar de desactivar el límite.

  </Accordion>
  <Accordion title="Lo que nunca aparece en la salida de Prometheus">
    - texto de solicitudes, texto de respuestas, entradas de herramientas, salidas de herramientas, solicitudes del sistema
    - transcripciones de Talk, cargas de audio, identificadores de llamadas, identificadores de salas, tokens de transferencia, identificadores de turnos e identificadores de sesión sin procesar
    - identificadores de solicitudes del proveedor sin procesar (solo hashes acotados, cuando corresponda, en los intervalos; nunca en las métricas)
    - claves de sesión e identificadores de sesión
    - nombres de host, rutas de archivos, valores secretos

  </Accordion>
</AccordionGroup>

## Recetas de PromQL

```promql
# Tokens por minuto, desglosados por proveedor
sum by (provider) (rate(openclaw_model_tokens_total[1m]))

# Gasto (USD) durante la última hora, por modelo
sum by (model) (increase(openclaw_model_cost_usd_total[1h]))

# Percentil 95 de la duración de ejecución del modelo
histogram_quantile(
  0.95,
  sum by (le, provider, model)
    (rate(openclaw_run_duration_seconds_bucket[5m]))
)

# SLO del tiempo de espera en cola (percentil 95 inferior a 2 s)
histogram_quantile(
  0.95,
  sum by (le, lane) (rate(openclaw_queue_lane_wait_seconds_bucket[5m]))
) < 2

# Uso de Skills, desglosado por origen acotado
sum by (skill, source) (increase(openclaw_skill_used_total[24h]))

# Series de Prometheus descartadas (alarma de cardinalidad)
increase(openclaw_prometheus_series_dropped_total[15m]) > 0
```

<Tip>
Prefiera `gen_ai_client_token_usage` para paneles entre proveedores: sigue las convenciones semánticas de IA generativa de OpenTelemetry y es coherente con las métricas de servicios de IA generativa ajenos a OpenClaw.
</Tip>

## Elegir entre la exportación de Prometheus y OpenTelemetry

OpenClaw admite ambas superficies de forma independiente. Puede ejecutar una, ambas o ninguna.

<Tabs>
  <Tab title="diagnostics-prometheus">
    - Modelo de **extracción**: Prometheus consulta `/api/diagnostics/prometheus`.
    - No requiere un recopilador externo.
    - Se autentica mediante la autenticación habitual del Gateway.
    - La superficie incluye solo métricas (sin trazas ni registros).
    - Es la mejor opción para pilas ya estandarizadas en Prometheus + Grafana.

  </Tab>
  <Tab title="diagnostics-otel">
    - Modelo de **envío**: OpenClaw envía datos mediante OTLP/HTTP a un recopilador o a un sistema compatible con OTLP.
    - La superficie incluye métricas, trazas y registros.
    - Se conecta con Prometheus mediante un recopilador de OpenTelemetry (exportador `prometheus` o `prometheusremotewrite`) cuando se necesitan ambos.
    - Consulte [Exportación de OpenTelemetry](/es/gateway/opentelemetry) para ver el catálogo completo.

  </Tab>
</Tabs>

## Solución de problemas

<AccordionGroup>
  <Accordion title="Cuerpo de respuesta vacío">
    - Compruebe que `diagnostics.enabled` no esté establecido en `false` en la configuración (el valor predeterminado es `true`).
    - Confirme que el Plugin esté habilitado y cargado con `openclaw plugins list --enabled`.
    - Genere algo de tráfico; los contadores y los histogramas solo emiten líneas después de al menos un evento.

  </Accordion>
  <Accordion title="401 / no autorizado">
    El punto de conexión requiere el ámbito de operador del Gateway (`auth: "gateway"` con `gatewayRuntimeScopeSurface: "trusted-operator"`). Use el mismo token o contraseña que utiliza Prometheus para cualquier otra ruta de operador del Gateway. No existe un modo público sin autenticación.
  </Accordion>
  <Accordion title="`openclaw_prometheus_series_dropped_total` está aumentando">
    Un atributo nuevo está superando el límite de **2048** series. Inspeccione las métricas recientes para detectar una etiqueta con una cardinalidad inesperadamente alta y corríjala en el origen. El exportador descarta deliberadamente las series nuevas en lugar de reescribir las etiquetas de forma silenciosa.
  </Accordion>
  <Accordion title="Prometheus muestra series obsoletas después de un reinicio">
    El Plugin conserva el estado únicamente en memoria. Después de reiniciar el Gateway, los contadores vuelven a cero y los indicadores se reinician con el siguiente valor notificado. Use `rate()` e `increase()` de PromQL para gestionar correctamente los reinicios.
  </Accordion>
</AccordionGroup>

## Recursos relacionados

- [Exportación de diagnósticos](/es/gateway/diagnostics) — archivo ZIP de diagnósticos locales para paquetes de soporte
- [Estado y disponibilidad](/es/gateway/health) — sondas `/healthz` y `/readyz`
- [Registro](/es/logging) — registro basado en archivos
- [Exportación de OpenTelemetry](/es/gateway/opentelemetry) — envío OTLP de trazas, métricas y registros

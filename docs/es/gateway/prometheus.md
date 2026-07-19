---
read_when:
    - Quiere que Prometheus, Grafana, VictoriaMetrics u otro recopilador recopile métricas del Gateway de OpenClaw
    - Necesita los nombres de las métricas de Prometheus y la política de etiquetas para paneles o alertas
    - Quiere métricas sin ejecutar un recopilador de OpenTelemetry
sidebarTitle: Prometheus
summary: Expón los diagnósticos de OpenClaw como métricas de texto de Prometheus mediante el plugin diagnostics-prometheus
title: Métricas de Prometheus
x-i18n:
    generated_at: "2026-07-19T01:57:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 9d04a46bdb401df3cdd2571b973f2a60f264862cf74da02c5a9cfa1de6ea9ffe
    source_path: gateway/prometheus.md
    workflow: 16
---

OpenClaw puede exponer métricas de diagnóstico mediante el plugin oficial
`diagnostics-prometheus`. Este escucha diagnósticos de confianza, además de
eventos de diagnóstico etiquetados internamente y gestionados por el despachador
(señales de cola, memoria y recuperación de sesiones), y presenta un endpoint de
texto de Prometheus en:

```text
GET /api/diagnostics/prometheus
```

El tipo de contenido es `text/plain; version=0.0.4; charset=utf-8`, el formato estándar
de exposición de Prometheus.

<Warning>
La ruta utiliza la autenticación del Gateway (ámbito de operador, superficie para operadores de confianza). No la exponga como un endpoint público sin autenticación `/metrics`. Recopile sus datos mediante la misma ruta de autenticación que utiliza para otras API de operador.
</Warning>

Para trazas, registros, envío mediante OTLP y atributos semánticos de IA generativa de OpenTelemetry, consulte [Exportación de OpenTelemetry](/es/gateway/opentelemetry).

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
    La ruta HTTP se registra al iniciar el plugin, por lo que debe recargarse después de habilitarlo.
  </Step>
  <Step title="Recopilar datos de la ruta protegida">
    Envíe la misma autenticación del Gateway que utilizan sus clientes de operador:

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
El valor predeterminado de `diagnostics.enabled` es `true`; establézcalo en `false` solo en entornos estrictamente restringidos. Si es `false`, el plugin sigue registrando la ruta HTTP, pero ningún evento de diagnóstico llega al exportador, por lo que la respuesta está vacía.
</Note>

## Métricas exportadas

| Métrica                                           | Tipo      | Etiquetas                                                                                 |
| ------------------------------------------------ | --------- | ----------------------------------------------------------------------------------------- |
| `openclaw_run_completed_total`                   | contador   | `channel`, `model`, `outcome`, `provider`, `trigger`                                      |
| `openclaw_run_duration_seconds`                  | histograma | `channel`, `model`, `outcome`, `provider`, `trigger`                                      |
| `openclaw_model_call_total`                      | contador   | `api`, `error_category`, `model`, `observation_unit`, `outcome`, `provider`, `transport`  |
| `openclaw_model_call_duration_seconds`           | histograma | `api`, `error_category`, `model`, `observation_unit`, `outcome`, `provider`, `transport`  |
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
| `openclaw_queue_lane_size`                       | medidor     | `lane`                                                                                    |
| `openclaw_queue_lane_wait_seconds`               | histograma | `lane`                                                                                    |
| `openclaw_session_state_total`                   | contador   | `reason`, `state`                                                                         |
| `openclaw_session_queue_depth`                   | medidor     | `state`                                                                                   |
| `openclaw_session_turn_created_total`            | contador   | `agent`, `channel`, `trigger`                                                             |
| `openclaw_session_stuck_total`                   | contador   | `reason`, `state`                                                                         |
| `openclaw_session_stuck_age_seconds`             | histograma | `reason`, `state`                                                                         |
| `openclaw_session_recovery_total`                | contador   | `action`, `active_work_kind`, `state`, `status`                                           |
| `openclaw_session_recovery_age_seconds`          | histograma | `action`, `active_work_kind`, `state`, `status`                                           |
| `openclaw_liveness_warning_total`                | contador   | `reason`                                                                                  |
| `openclaw_liveness_sessions`                     | medidor     | `state`                                                                                   |
| `openclaw_liveness_event_loop_delay_p99_seconds` | histograma | `reason`                                                                                  |
| `openclaw_liveness_event_loop_delay_max_seconds` | histograma | `reason`                                                                                  |
| `openclaw_liveness_event_loop_utilization_ratio` | histograma | `reason`                                                                                  |
| `openclaw_liveness_cpu_core_ratio`               | histograma | `reason`                                                                                  |
| `openclaw_payload_large_total`                   | contador   | `action`, `channel`, `plugin`, `reason`, `surface`                                        |
| `openclaw_payload_large_bytes`                   | histograma | `action`, `channel`, `plugin`, `reason`, `surface`                                        |
| `openclaw_memory_bytes`                          | medidor     | `kind`                                                                                    |
| `openclaw_memory_rss_bytes`                      | histograma | ninguna                                                                                      |
| `openclaw_memory_pressure_total`                 | contador   | `level`, `reason`                                                                         |
| `openclaw_telemetry_exporter_total`              | contador   | `exporter`, `reason`, `signal`, `status`                                                  |
| `openclaw_prometheus_series_dropped_total`       | contador   | ninguna                                                                                      |
| `openclaw_diagnostic_async_queue_dropped_total`  | contador   | `drop_class`                                                                              |
| `openclaw_diagnostic_async_queue_length`         | medidor     | ninguna                                                                                      |

Para las métricas de llamadas a modelos, `observation_unit="request"` mide una solicitud observable
al proveedor. `observation_unit="turn"` mide un turno sintético de agente de Claude Code
o Codex CLI que puede contener varias solicitudes ocultas al proveedor.
Mantenga esas series separadas al comparar la latencia.

## Política de etiquetas

<AccordionGroup>
  <Accordion title="Etiquetas acotadas y de baja cardinalidad">
    Las etiquetas de Prometheus se mantienen acotadas y con baja cardinalidad. El exportador no emite identificadores de diagnóstico sin procesar como `runId`, `sessionKey`, `sessionId`, `callId`, `toolCallId`, identificadores de mensajes, identificadores de chats ni identificadores de solicitudes al proveedor.

    Los valores de las etiquetas se ocultan y deben cumplir la política de caracteres de baja cardinalidad de OpenClaw. Los valores que no cumplen la política se sustituyen por `unknown`, `other` o `none`, según la métrica. Las etiquetas que parecen claves de sesión de agente con ámbito también se sustituyen por `unknown`.

  </Accordion>
  <Accordion title="Límite de series y contabilización del desbordamiento">
    El exportador limita a **2048** las series temporales conservadas en memoria entre contadores, medidores e histogramas combinados. Las nuevas series que superan ese límite se descartan y `openclaw_prometheus_series_dropped_total` se incrementa en uno cada vez.

    Supervise este contador como una señal inequívoca de que algún atributo anterior está filtrando valores de alta cardinalidad. El exportador nunca aumenta el límite automáticamente; si el contador aumenta, corrija el origen en lugar de desactivar el límite.

  </Accordion>
  <Accordion title="Qué no aparece nunca en la salida de Prometheus">
    - texto de solicitudes, texto de respuestas, entradas de herramientas, salidas de herramientas, solicitudes del sistema
    - transcripciones de conversaciones, cargas útiles de audio, identificadores de llamadas, identificadores de salas, tokens de traspaso, identificadores de turnos e identificadores de sesión sin procesar
    - identificadores de solicitudes al proveedor sin procesar (solo hashes acotados, cuando corresponda, en los tramos; nunca en las métricas)
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
Se recomienda `gen_ai_client_token_usage` para paneles que abarcan varios proveedores: sigue las convenciones semánticas de GenAI de OpenTelemetry y es coherente con las métricas de servicios GenAI ajenos a OpenClaw.
</Tip>

## Elección entre la exportación de Prometheus y OpenTelemetry

OpenClaw admite ambas superficies de forma independiente. Es posible ejecutar una, ambas o ninguna.

<Tabs>
  <Tab title="diagnostics-prometheus">
    - Modelo **pull**: Prometheus extrae datos de `/api/diagnostics/prometheus`.
    - No se requiere ningún recopilador externo.
    - La autenticación se realiza mediante la autenticación normal del Gateway.
    - La superficie solo incluye métricas (sin trazas ni registros).
    - Es la mejor opción para pilas ya estandarizadas en Prometheus + Grafana.

  </Tab>
  <Tab title="diagnostics-otel">
    - Modelo **push**: OpenClaw envía OTLP/HTTP a un recopilador o backend compatible con OTLP.
    - La superficie incluye métricas, trazas y registros.
    - Se conecta con Prometheus mediante un recopilador de OpenTelemetry (exportador `prometheus` o `prometheusremotewrite`) cuando se necesitan ambos.
    - Consulte [Exportación de OpenTelemetry](/es/gateway/opentelemetry) para ver el catálogo completo.

  </Tab>
</Tabs>

## Solución de problemas

<AccordionGroup>
  <Accordion title="Cuerpo de respuesta vacío">
    - Compruebe que `diagnostics.enabled` no esté establecido en `false` en la configuración (el valor predeterminado es `true`).
    - Confirme que el plugin esté habilitado y cargado mediante `openclaw plugins list --enabled`.
    - Genere algo de tráfico; los contadores e histogramas solo emiten líneas después de al menos un evento.

  </Accordion>
  <Accordion title="401 / no autorizado">
    El endpoint requiere el ámbito de operador del Gateway (`auth: "gateway"` con `gatewayRuntimeScopeSurface: "trusted-operator"`). Utilice el mismo token o contraseña que usa Prometheus para cualquier otra ruta de operador del Gateway. No existe ningún modo público sin autenticación.
  </Accordion>
  <Accordion title="`openclaw_prometheus_series_dropped_total` está aumentando">
    Un atributo nuevo está superando el límite de **2048** series. Inspeccione las métricas recientes para detectar una etiqueta de cardinalidad inesperadamente alta y corríjala en el origen. El exportador descarta intencionadamente las nuevas series en lugar de reescribir las etiquetas silenciosamente.
  </Accordion>
  <Accordion title="Prometheus muestra series obsoletas después de un reinicio">
    El plugin solo mantiene el estado en memoria. Tras reiniciar el Gateway, los contadores vuelven a cero y los medidores se reinician con su siguiente valor notificado. Utilice `rate()` y `increase()` de PromQL para gestionar correctamente los reinicios.
  </Accordion>
</AccordionGroup>

## Contenido relacionado

- [Exportación de diagnósticos](/es/gateway/diagnostics) — archivo zip de diagnósticos locales para paquetes de soporte
- [Estado y disponibilidad](/es/gateway/health) — sondas `/healthz` y `/readyz`
- [Registro](/es/logging) — registro basado en archivos
- [Exportación de OpenTelemetry](/es/gateway/opentelemetry) — envío mediante OTLP de trazas, métricas y registros

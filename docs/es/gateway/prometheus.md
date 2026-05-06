---
read_when:
    - Quieres que Prometheus, Grafana, VictoriaMetrics u otro recolector recopile métricas de OpenClaw Gateway
    - Necesitas los nombres de las métricas de Prometheus y la política de etiquetas para paneles o alertas
    - Quieres métricas sin ejecutar un colector de OpenTelemetry
sidebarTitle: Prometheus
summary: Exponer los diagnósticos de OpenClaw como métricas de texto de Prometheus mediante el plugin diagnostics-prometheus
title: Métricas de Prometheus
x-i18n:
    generated_at: "2026-05-06T17:56:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 864e2a343266d84baaaaca9d8e494359198a3b43e8663ec8dcfcd4e2e4c6c004
    source_path: gateway/prometheus.md
    workflow: 16
---

OpenClaw puede exponer métricas de diagnóstico mediante el Plugin oficial `diagnostics-prometheus`. Escucha diagnósticos internos de confianza y representa un endpoint de texto de Prometheus en:

```text
GET /api/diagnostics/prometheus
```

El tipo de contenido es `text/plain; version=0.0.4; charset=utf-8`, el formato estándar de exposición de Prometheus.

<Warning>
La ruta usa autenticación del Gateway (ámbito de operador). No la expongas como un endpoint `/metrics` público sin autenticación. Haz scraping a través de la misma ruta de autenticación que usas para otras API de operador.
</Warning>

Para trazas, registros, push OTLP y atributos semánticos GenAI de OpenTelemetry, consulta [exportación de OpenTelemetry](/es/gateway/opentelemetry).

## Inicio rápido

<Steps>
  <Step title="Instala el Plugin">
    ```bash
    openclaw plugins install clawhub:@openclaw/diagnostics-prometheus
    ```
  </Step>
  <Step title="Habilita el Plugin">
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
  <Step title="Reinicia el Gateway">
    La ruta HTTP se registra al iniciar el Plugin, así que recarga después de habilitarlo.
  </Step>
  <Step title="Haz scraping de la ruta protegida">
    Envía la misma autenticación del gateway que usan tus clientes de operador:

    ```bash
    curl -H "Authorization: Bearer $OPENCLAW_GATEWAY_TOKEN" \
      http://127.0.0.1:18789/api/diagnostics/prometheus
    ```

  </Step>
  <Step title="Conecta Prometheus">
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
`diagnostics.enabled: true` es obligatorio. Sin ello, el Plugin aún registra la ruta HTTP, pero no fluye ningún evento de diagnóstico al exportador, por lo que la respuesta está vacía.
</Note>

## Métricas exportadas

| Métrica                                       | Tipo      | Etiquetas                                                                                 |
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
| `openclaw_message_delivery_started_total`     | counter   | `channel`, `delivery_kind`                                                                |
| `openclaw_message_delivery_total`             | counter   | `channel`, `delivery_kind`, `error_category`, `outcome`                                   |
| `openclaw_message_delivery_duration_seconds`  | histogram | `channel`, `delivery_kind`, `error_category`, `outcome`                                   |
| `openclaw_talk_event_total`                   | counter   | `brain`, `event_type`, `mode`, `provider`, `transport`                                    |
| `openclaw_talk_event_duration_seconds`        | histogram | `brain`, `event_type`, `mode`, `provider`, `transport`                                    |
| `openclaw_talk_audio_bytes`                   | histogram | `brain`, `event_type`, `mode`, `provider`, `transport`                                    |
| `openclaw_queue_lane_size`                    | gauge     | `lane`                                                                                    |
| `openclaw_queue_lane_wait_seconds`            | histogram | `lane`                                                                                    |
| `openclaw_session_state_total`                | counter   | `reason`, `state`                                                                         |
| `openclaw_session_queue_depth`                | gauge     | `state`                                                                                   |
| `openclaw_session_recovery_total`             | counter   | `action`, `active_work_kind`, `state`, `status`                                           |
| `openclaw_session_recovery_age_seconds`       | histogram | `action`, `active_work_kind`, `state`, `status`                                           |
| `openclaw_memory_bytes`                       | gauge     | `kind`                                                                                    |
| `openclaw_memory_rss_bytes`                   | histogram | ninguna                                                                                   |
| `openclaw_memory_pressure_total`              | counter   | `level`, `reason`                                                                         |
| `openclaw_telemetry_exporter_total`           | counter   | `exporter`, `reason`, `signal`, `status`                                                  |
| `openclaw_prometheus_series_dropped_total`    | counter   | ninguna                                                                                   |

## Política de etiquetas

<AccordionGroup>
  <Accordion title="Etiquetas acotadas y de baja cardinalidad">
    Las etiquetas de Prometheus se mantienen acotadas y con baja cardinalidad. El exportador no emite identificadores de diagnóstico sin procesar, como `runId`, `sessionKey`, `sessionId`, `callId`, `toolCallId`, ID de mensajes, ID de chat o ID de solicitud del proveedor.

    Los valores de etiqueta se redactan y deben coincidir con la política de caracteres de baja cardinalidad de OpenClaw. Los valores que no cumplen la política se reemplazan por `unknown`, `other` o `none`, según la métrica.

  </Accordion>
  <Accordion title="Límite de series y contabilización del desbordamiento">
    El exportador limita las series temporales retenidas en memoria a **2048** series entre contadores, medidores e histogramas combinados. Las nuevas series que superan ese límite se descartan, y `openclaw_prometheus_series_dropped_total` aumenta en uno cada vez.

    Vigila este contador como una señal clara de que un atributo aguas arriba está filtrando valores de alta cardinalidad. El exportador nunca aumenta el límite automáticamente; si sube, corrige el origen en lugar de desactivar el límite.

  </Accordion>
  <Accordion title="Lo que nunca aparece en la salida de Prometheus">
    - texto de prompt, texto de respuesta, entradas de herramientas, salidas de herramientas, prompts del sistema
    - Transcripciones de Talk, cargas de audio, id. de llamadas, id. de salas, tokens de traspaso, id. de turnos e id. de sesión sin procesar
    - id. de solicitud del proveedor sin procesar (solo hashes acotados, cuando corresponda, en spans; nunca en métricas)
    - claves de sesión e id. de sesión
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

# Dropped Prometheus series (cardinality alarm)
increase(openclaw_prometheus_series_dropped_total[15m]) > 0
```

<Tip>
Prefiere `gen_ai_client_token_usage` para paneles entre proveedores: sigue las convenciones semánticas GenAI de OpenTelemetry y es coherente con las métricas de servicios GenAI que no son de OpenClaw.
</Tip>

## Elegir entre exportación de Prometheus y OpenTelemetry

OpenClaw admite ambas superficies de forma independiente. Puedes ejecutar una, ambas o ninguna.

<Tabs>
  <Tab title="diagnostics-prometheus">
    - Modelo **pull**: Prometheus recopila `/api/diagnostics/prometheus`.
    - No se requiere recopilador externo.
    - Autenticado mediante la autenticación normal de Gateway.
    - La superficie es solo de métricas (sin trazas ni registros).
    - Ideal para stacks ya estandarizados en Prometheus + Grafana.

  </Tab>
  <Tab title="diagnostics-otel">
    - Modelo **push**: OpenClaw envía OTLP/HTTP a un recopilador o backend compatible con OTLP.
    - La superficie incluye métricas, trazas y registros.
    - Se conecta con Prometheus mediante un OpenTelemetry Collector (exportador `prometheus` o `prometheusremotewrite`) cuando necesitas ambos.
    - Consulta [Exportación de OpenTelemetry](/es/gateway/opentelemetry) para ver el catálogo completo.

  </Tab>
</Tabs>

## Solución de problemas

<AccordionGroup>
  <Accordion title="Cuerpo de respuesta vacío">
    - Comprueba `diagnostics.enabled: true` en la configuración.
    - Confirma que el plugin esté activado y cargado con `openclaw plugins list --enabled`.
    - Genera algo de tráfico; los contadores e histogramas solo emiten líneas después de al menos un evento.

  </Accordion>
  <Accordion title="401 / no autorizado">
    El endpoint requiere el alcance de operador de Gateway (`auth: "gateway"` con `gatewayRuntimeScopeSurface: "trusted-operator"`). Usa el mismo token o contraseña que Prometheus usa para cualquier otra ruta de operador de Gateway. No hay modo público sin autenticación.
  </Accordion>
  <Accordion title="`openclaw_prometheus_series_dropped_total` está subiendo">
    Un atributo nuevo está superando el límite de **2048** series. Inspecciona las métricas recientes en busca de una etiqueta de cardinalidad inesperadamente alta y corrígela en el origen. El exportador descarta intencionadamente las nuevas series en lugar de reescribir etiquetas silenciosamente.
  </Accordion>
  <Accordion title="Prometheus muestra series obsoletas después de un reinicio">
    El plugin mantiene el estado solo en memoria. Después de reiniciar Gateway, los contadores se restablecen a cero y los medidores se reinician en su siguiente valor informado. Usa `rate()` e `increase()` de PromQL para gestionar los restablecimientos correctamente.
  </Accordion>
</AccordionGroup>

## Relacionado

- [Exportación de diagnósticos](/es/gateway/diagnostics) — ZIP de diagnósticos locales para paquetes de soporte
- [Salud y preparación](/es/gateway/health) — sondas `/healthz` y `/readyz`
- [Registro](/es/logging) — registro basado en archivos
- [Exportación de OpenTelemetry](/es/gateway/opentelemetry) — envío OTLP para trazas, métricas y registros

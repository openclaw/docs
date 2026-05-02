---
read_when:
    - Quieres que Prometheus, Grafana, VictoriaMetrics u otro scraper recopile métricas del Gateway de OpenClaw
    - Necesita los nombres de las métricas de Prometheus y la política de etiquetas para paneles o alertas
    - Quieres métricas sin ejecutar un colector de OpenTelemetry
sidebarTitle: Prometheus
summary: Expón los diagnósticos de OpenClaw como métricas de texto de Prometheus mediante el Plugin diagnostics-prometheus
title: Métricas de Prometheus
x-i18n:
    generated_at: "2026-05-02T20:48:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 49df17348c5b63c4b5f3c05f3378d43764e5de985135ad30c1e74ef607e0dd37
    source_path: gateway/prometheus.md
    workflow: 16
---

OpenClaw puede exponer métricas de diagnóstico mediante el Plugin oficial `diagnostics-prometheus`. Escucha diagnósticos internos de confianza y genera un endpoint de texto de Prometheus en:

```text
GET /api/diagnostics/prometheus
```

El tipo de contenido es `text/plain; version=0.0.4; charset=utf-8`, el formato estándar de exposición de Prometheus.

<Warning>
La ruta usa autenticación del Gateway (alcance de operador). No la expongas como un endpoint público no autenticado `/metrics`. Haz el scraping mediante la misma ruta de autenticación que usas para otras API de operador.
</Warning>

Para trazas, registros, envío OTLP y atributos semánticos GenAI de OpenTelemetry, consulta [Exportación de OpenTelemetry](/es/gateway/opentelemetry).

## Inicio rápido

<Steps>
  <Step title="Instalar el Plugin">
    ```bash
    openclaw plugins install clawhub:@openclaw/diagnostics-prometheus
    ```
  </Step>
  <Step title="Habilitar el Plugin">
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
  <Step title="Reiniciar el Gateway">
    La ruta HTTP se registra al iniciar el Plugin, así que recarga después de habilitarlo.
  </Step>
  <Step title="Hacer scraping de la ruta protegida">
    Envía la misma autenticación de gateway que usan tus clientes operadores:

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
`diagnostics.enabled: true` es obligatorio. Sin esto, el Plugin todavía registra la ruta HTTP, pero no fluye ningún evento de diagnóstico al exportador, por lo que la respuesta queda vacía.
</Note>

## Métricas exportadas

| Métrica                                       | Tipo      | Etiquetas                                                                                 |
| --------------------------------------------- | --------- | ----------------------------------------------------------------------------------------- |
| `openclaw_run_completed_total`                | contador  | `channel`, `model`, `outcome`, `provider`, `trigger`                                      |
| `openclaw_run_duration_seconds`               | histograma | `channel`, `model`, `outcome`, `provider`, `trigger`                                      |
| `openclaw_model_call_total`                   | contador  | `api`, `error_category`, `model`, `outcome`, `provider`, `transport`                      |
| `openclaw_model_call_duration_seconds`        | histograma | `api`, `error_category`, `model`, `outcome`, `provider`, `transport`                      |
| `openclaw_model_tokens_total`                 | contador  | `agent`, `channel`, `model`, `provider`, `token_type`                                     |
| `openclaw_gen_ai_client_token_usage`          | histograma | `model`, `provider`, `token_type`                                                         |
| `openclaw_model_cost_usd_total`               | contador  | `agent`, `channel`, `model`, `provider`                                                   |
| `openclaw_tool_execution_total`               | contador  | `error_category`, `outcome`, `params_kind`, `tool`                                        |
| `openclaw_tool_execution_duration_seconds`    | histograma | `error_category`, `outcome`, `params_kind`, `tool`                                        |
| `openclaw_harness_run_total`                  | contador  | `channel`, `error_category`, `harness`, `model`, `outcome`, `phase`, `plugin`, `provider` |
| `openclaw_harness_run_duration_seconds`       | histograma | `channel`, `error_category`, `harness`, `model`, `outcome`, `phase`, `plugin`, `provider` |
| `openclaw_message_processed_total`            | contador  | `channel`, `outcome`, `reason`                                                            |
| `openclaw_message_processed_duration_seconds` | histograma | `channel`, `outcome`, `reason`                                                            |
| `openclaw_message_delivery_total`             | contador  | `channel`, `delivery_kind`, `error_category`, `outcome`                                   |
| `openclaw_message_delivery_duration_seconds`  | histograma | `channel`, `delivery_kind`, `error_category`, `outcome`                                   |
| `openclaw_queue_lane_size`                    | medidor   | `lane`                                                                                    |
| `openclaw_queue_lane_wait_seconds`            | histograma | `lane`                                                                                    |
| `openclaw_session_state_total`                | contador  | `reason`, `state`                                                                         |
| `openclaw_session_queue_depth`                | medidor   | `state`                                                                                   |
| `openclaw_memory_bytes`                       | medidor   | `kind`                                                                                    |
| `openclaw_memory_rss_bytes`                   | histograma | ninguna                                                                                   |
| `openclaw_memory_pressure_total`              | contador  | `level`, `reason`                                                                         |
| `openclaw_telemetry_exporter_total`           | contador  | `exporter`, `reason`, `signal`, `status`                                                  |
| `openclaw_prometheus_series_dropped_total`    | contador  | ninguna                                                                                   |

## Política de etiquetas

<AccordionGroup>
  <Accordion title="Etiquetas acotadas y de baja cardinalidad">
    Las etiquetas de Prometheus se mantienen acotadas y con baja cardinalidad. El exportador no emite identificadores de diagnóstico sin procesar como `runId`, `sessionKey`, `sessionId`, `callId`, `toolCallId`, ID de mensajes, ID de chat ni ID de solicitud de proveedores.

    Los valores de etiquetas se redactan y deben coincidir con la política de caracteres de baja cardinalidad de OpenClaw. Los valores que no cumplen la política se sustituyen por `unknown`, `other` o `none`, según la métrica.

  </Accordion>
  <Accordion title="Límite de series y contabilización de desbordamiento">
    El exportador limita las series temporales retenidas en memoria a **2048** series entre contadores, medidores e histogramas combinados. Las series nuevas que superen ese límite se descartan, y `openclaw_prometheus_series_dropped_total` aumenta en uno cada vez.

    Observa este contador como una señal firme de que un atributo ascendente está filtrando valores de alta cardinalidad. El exportador nunca levanta el límite automáticamente; si sube, corrige el origen en lugar de deshabilitar el límite.

  </Accordion>
  <Accordion title="Lo que nunca aparece en la salida de Prometheus">
    - texto de prompts, texto de respuestas, entradas de herramientas, salidas de herramientas, prompts del sistema
    - ID de solicitud de proveedores sin procesar (solo hashes acotados, cuando corresponda, en spans; nunca en métricas)
    - claves de sesión e ID de sesión
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
Prefiere `gen_ai_client_token_usage` para paneles entre proveedores: sigue las convenciones semánticas GenAI de OpenTelemetry y es coherente con las métricas de servicios GenAI ajenos a OpenClaw.
</Tip>

## Elegir entre Prometheus y la exportación de OpenTelemetry

OpenClaw admite ambas superficies de forma independiente. Puedes ejecutar una, ambas o ninguna.

<Tabs>
  <Tab title="diagnostics-prometheus">
    - Modelo **pull**: Prometheus hace scraping de `/api/diagnostics/prometheus`.
    - No requiere recopilador externo.
    - Autenticado mediante la autenticación normal del Gateway.
    - La superficie solo incluye métricas (sin trazas ni registros).
    - Recomendado para stacks que ya están estandarizados en Prometheus + Grafana.

  </Tab>
  <Tab title="diagnostics-otel">
    - Modelo **push**: OpenClaw envía OTLP/HTTP a un recopilador o backend compatible con OTLP.
    - La superficie incluye métricas, trazas y registros.
    - Se conecta a Prometheus mediante un OpenTelemetry Collector (exportador `prometheus` o `prometheusremotewrite`) cuando necesitas ambos.
    - Consulta [Exportación de OpenTelemetry](/es/gateway/opentelemetry) para ver el catálogo completo.

  </Tab>
</Tabs>

## Solución de problemas

<AccordionGroup>
  <Accordion title="Cuerpo de respuesta vacío">
    - Revisa `diagnostics.enabled: true` en la configuración.
    - Confirma que el Plugin está habilitado y cargado con `openclaw plugins list --enabled`.
    - Genera algo de tráfico; los contadores e histogramas solo emiten líneas después de al menos un evento.

  </Accordion>
  <Accordion title="401 / no autorizado">
    El endpoint requiere el alcance de operador del Gateway (`auth: "gateway"` con `gatewayRuntimeScopeSurface: "trusted-operator"`). Usa el mismo token o contraseña que Prometheus usa para cualquier otra ruta de operador del Gateway. No hay modo público no autenticado.
  </Accordion>
  <Accordion title="`openclaw_prometheus_series_dropped_total` está subiendo">
    Un nuevo atributo está superando el límite de **2048** series. Inspecciona las métricas recientes en busca de una etiqueta con cardinalidad inesperadamente alta y corrígela en el origen. El exportador descarta intencionadamente las series nuevas en lugar de reescribir etiquetas silenciosamente.
  </Accordion>
  <Accordion title="Prometheus muestra series obsoletas después de un reinicio">
    El Plugin mantiene el estado solo en memoria. Después de reiniciar el Gateway, los contadores se restablecen a cero y los medidores se reinician con su siguiente valor informado. Usa `rate()` e `increase()` de PromQL para gestionar los reinicios limpiamente.
  </Accordion>
</AccordionGroup>

## Relacionado

- [Exportación de diagnósticos](/es/gateway/diagnostics) — zip de diagnósticos local para paquetes de soporte
- [Estado y disponibilidad](/es/gateway/health) — probes `/healthz` y `/readyz`
- [Registros](/es/logging) — registro basado en archivos
- [Exportación de OpenTelemetry](/es/gateway/opentelemetry) — envío OTLP para trazas, métricas y registros

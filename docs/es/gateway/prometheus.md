---
read_when:
    - Quieres que Prometheus, Grafana, VictoriaMetrics u otro scraper recopile métricas del Gateway de OpenClaw
    - Necesitas los nombres de métricas de Prometheus y la política de etiquetas para paneles o alertas
    - Quieres métricas sin ejecutar un recopilador de OpenTelemetry
sidebarTitle: Prometheus
summary: Exponer los diagnósticos de OpenClaw como métricas de texto de Prometheus mediante el Plugin diagnostics-prometheus
title: Métricas de Prometheus
x-i18n:
    generated_at: "2026-04-26T11:29:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: 29fd3e4658ceffe20f078e8e38b61c685ea9df518ca04ca34abf2085166eb481
    source_path: gateway/prometheus.md
    workflow: 15
---

OpenClaw puede exponer métricas de diagnóstico mediante el Plugin incluido `diagnostics-prometheus`. Escucha diagnósticos internos de confianza y genera un endpoint de texto de Prometheus en:

```text
GET /api/diagnostics/prometheus
```

El tipo de contenido es `text/plain; version=0.0.4; charset=utf-8`, el formato estándar de exposición de Prometheus.

<Warning>
La ruta usa autenticación del Gateway (alcance de operador). No la expongas como un endpoint público `/metrics` sin autenticación. Haz el scraping a través de la misma ruta de autenticación que usas para otras APIs de operador.
</Warning>

Para trazas, logs, envío OTLP y atributos semánticos GenAI de OpenTelemetry, consulta [Exportación de OpenTelemetry](/es/gateway/opentelemetry).

## Inicio rápido

<Steps>
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
    La ruta HTTP se registra al iniciar el Plugin, así que vuelve a cargar después de habilitarlo.
  </Step>
  <Step title="Haz scraping de la ruta protegida">
    Envía la misma autenticación de gateway que usan tus clientes operadores:

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
`diagnostics.enabled: true` es obligatorio. Sin él, el Plugin sigue registrando la ruta HTTP pero no fluye ningún evento de diagnóstico al exportador, por lo que la respuesta queda vacía.
</Note>

## Métricas exportadas

| Métrica                                       | Tipo      | Etiquetas                                                                                  |
| --------------------------------------------- | --------- | ------------------------------------------------------------------------------------------ |
| `openclaw_run_completed_total`                | counter   | `channel`, `model`, `outcome`, `provider`, `trigger`                                       |
| `openclaw_run_duration_seconds`               | histogram | `channel`, `model`, `outcome`, `provider`, `trigger`                                       |
| `openclaw_model_call_total`                   | counter   | `api`, `error_category`, `model`, `outcome`, `provider`, `transport`                       |
| `openclaw_model_call_duration_seconds`        | histogram | `api`, `error_category`, `model`, `outcome`, `provider`, `transport`                       |
| `openclaw_model_tokens_total`                 | counter   | `agent`, `channel`, `model`, `provider`, `token_type`                                      |
| `openclaw_gen_ai_client_token_usage`          | histogram | `model`, `provider`, `token_type`                                                          |
| `openclaw_model_cost_usd_total`               | counter   | `agent`, `channel`, `model`, `provider`                                                    |
| `openclaw_tool_execution_total`               | counter   | `error_category`, `outcome`, `params_kind`, `tool`                                         |
| `openclaw_tool_execution_duration_seconds`    | histogram | `error_category`, `outcome`, `params_kind`, `tool`                                         |
| `openclaw_harness_run_total`                  | counter   | `channel`, `error_category`, `harness`, `model`, `outcome`, `phase`, `plugin`, `provider` |
| `openclaw_harness_run_duration_seconds`       | histogram | `channel`, `error_category`, `harness`, `model`, `outcome`, `phase`, `plugin`, `provider` |
| `openclaw_message_processed_total`            | counter   | `channel`, `outcome`, `reason`                                                             |
| `openclaw_message_processed_duration_seconds` | histogram | `channel`, `outcome`, `reason`                                                             |
| `openclaw_message_delivery_total`             | counter   | `channel`, `delivery_kind`, `error_category`, `outcome`                                    |
| `openclaw_message_delivery_duration_seconds`  | histogram | `channel`, `delivery_kind`, `error_category`, `outcome`                                    |
| `openclaw_queue_lane_size`                    | gauge     | `lane`                                                                                     |
| `openclaw_queue_lane_wait_seconds`            | histogram | `lane`                                                                                     |
| `openclaw_session_state_total`                | counter   | `reason`, `state`                                                                          |
| `openclaw_session_queue_depth`                | gauge     | `state`                                                                                    |
| `openclaw_memory_bytes`                       | gauge     | `kind`                                                                                     |
| `openclaw_memory_rss_bytes`                   | histogram | none                                                                                       |
| `openclaw_memory_pressure_total`              | counter   | `level`, `reason`                                                                          |
| `openclaw_telemetry_exporter_total`           | counter   | `exporter`, `reason`, `signal`, `status`                                                   |
| `openclaw_prometheus_series_dropped_total`    | counter   | none                                                                                       |

## Política de etiquetas

<AccordionGroup>
  <Accordion title="Etiquetas acotadas y de baja cardinalidad">
    Las etiquetas de Prometheus se mantienen acotadas y con baja cardinalidad. El exportador no emite identificadores de diagnóstico sin procesar como `runId`, `sessionKey`, `sessionId`, `callId`, `toolCallId`, IDs de mensaje, IDs de chat ni IDs de solicitud del proveedor.

    Los valores de las etiquetas se redactan y deben cumplir la política de caracteres de baja cardinalidad de OpenClaw. Los valores que no cumplan la política se sustituyen por `unknown`, `other` o `none`, según la métrica.

  </Accordion>
  <Accordion title="Límite de series y contabilidad de desbordamiento">
    El exportador limita las series temporales retenidas en memoria a **2048** series entre contadores, gauges e histogramas combinados. Las nuevas series que superen ese límite se descartan, y `openclaw_prometheus_series_dropped_total` aumenta en uno cada vez.

    Supervisa este contador como una señal fuerte de que un atributo aguas arriba está filtrando valores de alta cardinalidad. El exportador nunca eleva el límite automáticamente; si sube, corrige el origen en lugar de desactivar el límite.

  </Accordion>
  <Accordion title="Lo que nunca aparece en la salida de Prometheus">
    - texto de prompts, texto de respuestas, entradas de herramientas, salidas de herramientas, prompts del sistema
    - IDs sin procesar de solicitudes del proveedor (solo hashes acotados, cuando corresponde, en spans; nunca en métricas)
    - claves de sesión e IDs de sesión
    - nombres de host, rutas de archivo, valores secretos
  </Accordion>
</AccordionGroup>

## Recetas de PromQL

```promql
# Tokens por minuto, divididos por proveedor
sum by (provider) (rate(openclaw_model_tokens_total[1m]))

# Gasto (USD) durante la última hora, por modelo
sum by (model) (increase(openclaw_model_cost_usd_total[1h]))

# Percentil 95 de duración de ejecución del modelo
histogram_quantile(
  0.95,
  sum by (le, provider, model)
    (rate(openclaw_run_duration_seconds_bucket[5m]))
)

# SLO de tiempo de espera de cola (95p por debajo de 2 s)
histogram_quantile(
  0.95,
  sum by (le, lane) (rate(openclaw_queue_lane_wait_seconds_bucket[5m]))
) < 2

# Series descartadas de Prometheus (alarma de cardinalidad)
increase(openclaw_prometheus_series_dropped_total[15m]) > 0
```

<Tip>
Prefiere `gen_ai_client_token_usage` para paneles entre proveedores: sigue las convenciones semánticas GenAI de OpenTelemetry y es coherente con las métricas de servicios GenAI ajenos a OpenClaw.
</Tip>

## Elegir entre Prometheus y la exportación de OpenTelemetry

OpenClaw admite ambas superficies de forma independiente. Puedes usar una, ambas o ninguna.

<Tabs>
  <Tab title="diagnostics-prometheus">
    - Modelo **pull**: Prometheus hace scraping de `/api/diagnostics/prometheus`.
    - No se requiere un recopilador externo.
    - Autenticado mediante la autenticación normal del Gateway.
    - La superficie es solo de métricas (sin trazas ni logs).
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
    - Comprueba `diagnostics.enabled: true` en la configuración.
    - Confirma que el Plugin está habilitado y cargado con `openclaw plugins list --enabled`.
    - Genera algo de tráfico; los contadores e histogramas solo emiten líneas después de al menos un evento.
  </Accordion>
  <Accordion title="401 / unauthorized">
    El endpoint requiere el alcance de operador del Gateway (`auth: "gateway"` con `gatewayRuntimeScopeSurface: "trusted-operator"`). Usa el mismo token o contraseña que Prometheus use para cualquier otra ruta de operador del Gateway. No existe un modo público sin autenticación.
  </Accordion>
  <Accordion title="`openclaw_prometheus_series_dropped_total` está subiendo">
    Un nuevo atributo está superando el límite de **2048** series. Inspecciona las métricas recientes en busca de una etiqueta con cardinalidad inesperadamente alta y corrígela en el origen. El exportador descarta intencionadamente las series nuevas en lugar de reescribir etiquetas en silencio.
  </Accordion>
  <Accordion title="Prometheus muestra series obsoletas después de un reinicio">
    El Plugin mantiene el estado solo en memoria. Tras un reinicio del Gateway, los contadores vuelven a cero y los gauges se reinician en su siguiente valor informado. Usa `rate()` e `increase()` en PromQL para manejar los reinicios limpiamente.
  </Accordion>
</AccordionGroup>

## Relacionado

- [Exportación de diagnósticos](/es/gateway/diagnostics) — zip local de diagnósticos para paquetes de soporte
- [Estado y preparación](/es/gateway/health) — sondas `/healthz` y `/readyz`
- [Registro](/es/logging) — registro basado en archivos
- [Exportación de OpenTelemetry](/es/gateway/opentelemetry) — envío OTLP de trazas, métricas y logs

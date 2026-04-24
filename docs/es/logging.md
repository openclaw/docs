---
read_when:
    - Necesitas un resumen de registros apto para principiantes
    - Quieres configurar niveles o formatos de registro
    - Estás solucionando problemas y necesitas encontrar registros rápidamente
summary: 'Resumen de registros: archivos de registro, salida de consola, seguimiento desde la CLI y Control UI'
title: Resumen de registros
x-i18n:
    generated_at: "2026-04-24T05:36:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9b6f274600bcb9f5597c91aa6c30512871105a3e0de446773394abbe27276058
    source_path: logging.md
    workflow: 15
---

# Registros

OpenClaw tiene dos superficies principales de registro:

- **Registros en archivo** (líneas JSON) escritos por el Gateway.
- **Salida de consola** mostrada en terminales y en la Gateway Debug UI.

La pestaña **Logs** de Control UI sigue el archivo de registro del gateway. Esta página explica dónde
viven los registros, cómo leerlos y cómo configurar niveles y formatos de registro.

## Dónde viven los registros

De forma predeterminada, el Gateway escribe un archivo de registro rotativo en:

`/tmp/openclaw/openclaw-YYYY-MM-DD.log`

La fecha usa la zona horaria local del host del gateway.

Puedes anular esto en `~/.openclaw/openclaw.json`:

```json
{
  "logging": {
    "file": "/path/to/openclaw.log"
  }
}
```

## Cómo leer los registros

### CLI: seguimiento en vivo (recomendado)

Usa la CLI para seguir el archivo de registro del gateway mediante RPC:

```bash
openclaw logs --follow
```

Opciones útiles actuales:

- `--local-time`: muestra las marcas de tiempo en tu zona horaria local
- `--url <url>` / `--token <token>` / `--timeout <ms>`: banderas estándar de RPC de Gateway
- `--expect-final`: bandera de espera de respuesta final para RPC respaldada por agente (aceptada aquí mediante la capa de cliente compartida)

Modos de salida:

- **Sesiones TTY**: líneas de registro estructuradas, coloreadas y con formato agradable.
- **Sesiones no TTY**: texto sin formato.
- `--json`: JSON delimitado por líneas (un evento de registro por línea).
- `--plain`: fuerza texto sin formato en sesiones TTY.
- `--no-color`: desactiva los colores ANSI.

Cuando pasas un `--url` explícito, la CLI no aplica automáticamente credenciales de configuración ni del
entorno; incluye tú mismo `--token` si el Gateway de destino
requiere autenticación.

En modo JSON, la CLI emite objetos etiquetados por `type`:

- `meta`: metadatos del flujo (archivo, cursor, tamaño)
- `log`: entrada de registro analizada
- `notice`: avisos de truncamiento / rotación
- `raw`: línea de registro sin analizar

Si el Gateway de `local loopback` solicita emparejamiento, `openclaw logs` recurre automáticamente
al archivo de registro local configurado. Los destinos `--url` explícitos no
usan esta alternativa.

Si no se puede acceder al Gateway, la CLI imprime una breve sugerencia para ejecutar:

```bash
openclaw doctor
```

### Control UI (web)

La pestaña **Logs** de Control UI sigue el mismo archivo usando `logs.tail`.
Consulta [/web/control-ui](/es/web/control-ui) para ver cómo abrirla.

### Registros solo de canal

Para filtrar actividad de canales (WhatsApp/Telegram/etc.), usa:

```bash
openclaw channels logs --channel whatsapp
```

## Formatos de registro

### Registros en archivo (JSONL)

Cada línea del archivo de registro es un objeto JSON. La CLI y Control UI analizan estas
entradas para mostrar una salida estructurada (hora, nivel, subsistema, mensaje).

### Salida de consola

Los registros de consola son **conscientes de TTY** y están formateados para facilitar la lectura:

- Prefijos de subsistema (por ejemplo `gateway/channels/whatsapp`)
- Colores por nivel (info/warn/error)
- Modo compacto o JSON opcional

El formato de consola se controla con `logging.consoleStyle`.

### Registros WebSocket de Gateway

`openclaw gateway` también tiene registro del protocolo WebSocket para el tráfico RPC:

- modo normal: solo resultados interesantes (errores, errores de análisis, llamadas lentas)
- `--verbose`: todo el tráfico de solicitud/respuesta
- `--ws-log auto|compact|full`: elige el estilo de renderizado detallado
- `--compact`: alias de `--ws-log compact`

Ejemplos:

```bash
openclaw gateway
openclaw gateway --verbose --ws-log compact
openclaw gateway --verbose --ws-log full
```

## Configurar el registro

Toda la configuración de registro vive bajo `logging` en `~/.openclaw/openclaw.json`.

```json
{
  "logging": {
    "level": "info",
    "file": "/tmp/openclaw/openclaw-YYYY-MM-DD.log",
    "consoleLevel": "info",
    "consoleStyle": "pretty",
    "redactSensitive": "tools",
    "redactPatterns": ["sk-.*"]
  }
}
```

### Niveles de registro

- `logging.level`: nivel de los **registros en archivo** (JSONL).
- `logging.consoleLevel`: nivel de detalle de la **consola**.

Puedes anular ambos mediante la variable de entorno **`OPENCLAW_LOG_LEVEL`** (por ejemplo `OPENCLAW_LOG_LEVEL=debug`). La variable de entorno tiene prioridad sobre el archivo de configuración, así que puedes aumentar el detalle para una sola ejecución sin editar `openclaw.json`. También puedes pasar la opción global de CLI **`--log-level <level>`** (por ejemplo, `openclaw --log-level debug gateway run`), que anula la variable de entorno para ese comando.

`--verbose` solo afecta a la salida de consola y al nivel de detalle del registro WS; no cambia
los niveles de los registros en archivo.

### Estilos de consola

`logging.consoleStyle`:

- `pretty`: legible para humanos, con colores y marcas de tiempo.
- `compact`: salida más ajustada (mejor para sesiones largas).
- `json`: JSON por línea (para procesadores de registros).

### Redacción

Los resúmenes de herramientas pueden redactar tokens sensibles antes de llegar a la consola:

- `logging.redactSensitive`: `off` | `tools` (predeterminado: `tools`)
- `logging.redactPatterns`: lista de cadenas regex para anular el conjunto predeterminado

La redacción afecta **solo a la salida de consola** y no altera los registros en archivo.

## Diagnósticos + OpenTelemetry

Los diagnósticos son eventos estructurados y legibles por máquina para ejecuciones de modelos **y**
telemetría de flujo de mensajes (webhooks, encolado, estado de sesión). **No** sustituyen a los registros;
existen para alimentar métricas, trazas y otros exportadores.

Los eventos de diagnóstico se emiten en proceso, pero los exportadores solo se adjuntan cuando
los diagnósticos y el Plugin exportador están habilitados.

### OpenTelemetry frente a OTLP

- **OpenTelemetry (OTel)**: el modelo de datos + SDK para trazas, métricas y registros.
- **OTLP**: el protocolo de transporte usado para exportar datos OTel a un recolector/backend.
- Hoy, OpenClaw exporta mediante **OTLP/HTTP (protobuf)**.

### Señales exportadas

- **Métricas**: contadores + histogramas (uso de tokens, flujo de mensajes, encolado).
- **Trazas**: spans para uso de modelos + procesamiento de webhook/mensajes.
- **Registros**: exportados por OTLP cuando `diagnostics.otel.logs` está habilitado. El
  volumen de registros puede ser alto; ten en cuenta `logging.level` y los filtros del exportador.

### Catálogo de eventos de diagnóstico

Uso de modelo:

- `model.usage`: tokens, costo, duración, contexto, provider/model/channel, ids de sesión.

Flujo de mensajes:

- `webhook.received`: entrada de webhook por canal.
- `webhook.processed`: webhook procesado + duración.
- `webhook.error`: errores del controlador de webhook.
- `message.queued`: mensaje encolado para procesamiento.
- `message.processed`: resultado + duración + error opcional.

Cola + sesión:

- `queue.lane.enqueue`: encolado en carril de cola de comandos + profundidad.
- `queue.lane.dequeue`: desencolado en carril de cola de comandos + tiempo de espera.
- `session.state`: transición de estado de sesión + motivo.
- `session.stuck`: advertencia de sesión atascada + antigüedad.
- `run.attempt`: metadatos de reintento/intento de ejecución.
- `diagnostic.heartbeat`: contadores agregados (webhooks/cola/sesión).

### Habilitar diagnósticos (sin exportador)

Úsalo si quieres que los eventos de diagnóstico estén disponibles para Plugins o receptores personalizados:

```json
{
  "diagnostics": {
    "enabled": true
  }
}
```

### Banderas de diagnóstico (registros dirigidos)

Usa banderas para activar registros adicionales de depuración dirigidos sin elevar `logging.level`.
Las banderas no distinguen mayúsculas y minúsculas y admiten comodines (por ejemplo `telegram.*` o `*`).

```json
{
  "diagnostics": {
    "flags": ["telegram.http"]
  }
}
```

Anulación por entorno (puntual):

```
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload
```

Notas:

- Los registros de banderas van al archivo de registro estándar (el mismo que `logging.file`).
- La salida sigue redactándose según `logging.redactSensitive`.
- Guía completa: [/diagnostics/flags](/es/diagnostics/flags).

### Exportar a OpenTelemetry

Los diagnósticos pueden exportarse mediante el Plugin `diagnostics-otel` (OTLP/HTTP). Esto
funciona con cualquier recolector/backend de OpenTelemetry que acepte OTLP/HTTP.

```json
{
  "plugins": {
    "allow": ["diagnostics-otel"],
    "entries": {
      "diagnostics-otel": {
        "enabled": true
      }
    }
  },
  "diagnostics": {
    "enabled": true,
    "otel": {
      "enabled": true,
      "endpoint": "http://otel-collector:4318",
      "protocol": "http/protobuf",
      "serviceName": "openclaw-gateway",
      "traces": true,
      "metrics": true,
      "logs": true,
      "sampleRate": 0.2,
      "flushIntervalMs": 60000
    }
  }
}
```

Notas:

- También puedes habilitar el Plugin con `openclaw plugins enable diagnostics-otel`.
- `protocol` actualmente solo admite `http/protobuf`. `grpc` se ignora.
- Las métricas incluyen uso de tokens, costo, tamaño de contexto, duración de ejecución y
  contadores/histogramas de flujo de mensajes (webhooks, encolado, estado de sesión, profundidad/espera de cola).
- Las trazas/métricas pueden activarse o desactivarse con `traces` / `metrics` (predeterminado: activado). Las trazas
  incluyen spans de uso de modelo además de spans de procesamiento de webhook/mensajes cuando están habilitados.
- Establece `headers` cuando tu recolector requiera autenticación.
- Variables de entorno compatibles: `OTEL_EXPORTER_OTLP_ENDPOINT`,
  `OTEL_SERVICE_NAME`, `OTEL_EXPORTER_OTLP_PROTOCOL`.

### Métricas exportadas (nombres + tipos)

Uso de modelo:

- `openclaw.tokens` (contador, attrs: `openclaw.token`, `openclaw.channel`,
  `openclaw.provider`, `openclaw.model`)
- `openclaw.cost.usd` (contador, attrs: `openclaw.channel`, `openclaw.provider`,
  `openclaw.model`)
- `openclaw.run.duration_ms` (histograma, attrs: `openclaw.channel`,
  `openclaw.provider`, `openclaw.model`)
- `openclaw.context.tokens` (histograma, attrs: `openclaw.context`,
  `openclaw.channel`, `openclaw.provider`, `openclaw.model`)

Flujo de mensajes:

- `openclaw.webhook.received` (contador, attrs: `openclaw.channel`,
  `openclaw.webhook`)
- `openclaw.webhook.error` (contador, attrs: `openclaw.channel`,
  `openclaw.webhook`)
- `openclaw.webhook.duration_ms` (histograma, attrs: `openclaw.channel`,
  `openclaw.webhook`)
- `openclaw.message.queued` (contador, attrs: `openclaw.channel`,
  `openclaw.source`)
- `openclaw.message.processed` (contador, attrs: `openclaw.channel`,
  `openclaw.outcome`)
- `openclaw.message.duration_ms` (histograma, attrs: `openclaw.channel`,
  `openclaw.outcome`)

Colas + sesiones:

- `openclaw.queue.lane.enqueue` (contador, attrs: `openclaw.lane`)
- `openclaw.queue.lane.dequeue` (contador, attrs: `openclaw.lane`)
- `openclaw.queue.depth` (histograma, attrs: `openclaw.lane` o
  `openclaw.channel=heartbeat`)
- `openclaw.queue.wait_ms` (histograma, attrs: `openclaw.lane`)
- `openclaw.session.state` (contador, attrs: `openclaw.state`, `openclaw.reason`)
- `openclaw.session.stuck` (contador, attrs: `openclaw.state`)
- `openclaw.session.stuck_age_ms` (histograma, attrs: `openclaw.state`)
- `openclaw.run.attempt` (contador, attrs: `openclaw.attempt`)

### Spans exportados (nombres + atributos clave)

- `openclaw.model.usage`
  - `openclaw.channel`, `openclaw.provider`, `openclaw.model`
  - `openclaw.sessionKey`, `openclaw.sessionId`
  - `openclaw.tokens.*` (input/output/cache_read/cache_write/total)
- `openclaw.webhook.processed`
  - `openclaw.channel`, `openclaw.webhook`, `openclaw.chatId`
- `openclaw.webhook.error`
  - `openclaw.channel`, `openclaw.webhook`, `openclaw.chatId`,
    `openclaw.error`
- `openclaw.message.processed`
  - `openclaw.channel`, `openclaw.outcome`, `openclaw.chatId`,
    `openclaw.messageId`, `openclaw.sessionKey`, `openclaw.sessionId`,
    `openclaw.reason`
- `openclaw.session.stuck`
  - `openclaw.state`, `openclaw.ageMs`, `openclaw.queueDepth`,
    `openclaw.sessionKey`, `openclaw.sessionId`

### Muestreo + vaciado

- Muestreo de trazas: `diagnostics.otel.sampleRate` (0.0–1.0, solo spans raíz).
- Intervalo de exportación de métricas: `diagnostics.otel.flushIntervalMs` (mínimo 1000 ms).

### Notas sobre el protocolo

- Los endpoints OTLP/HTTP pueden establecerse mediante `diagnostics.otel.endpoint` o
  `OTEL_EXPORTER_OTLP_ENDPOINT`.
- Si el endpoint ya contiene `/v1/traces` o `/v1/metrics`, se usa tal cual.
- Si el endpoint ya contiene `/v1/logs`, se usa tal cual para registros.
- `diagnostics.otel.logs` habilita la exportación de registros OTLP para la salida del registrador principal.

### Comportamiento de exportación de registros

- Los registros OTLP usan los mismos registros estructurados escritos en `logging.file`.
- Respetan `logging.level` (nivel de registros en archivo). La redacción de consola **no** se aplica
  a los registros OTLP.
- Las instalaciones de alto volumen deberían preferir muestreo/filtrado en el recolector OTLP.

## Consejos de solución de problemas

- **¿Gateway inaccesible?** Ejecuta primero `openclaw doctor`.
- **¿Registros vacíos?** Comprueba que el Gateway esté en ejecución y escribiendo en la ruta
  indicada por `logging.file`.
- **¿Necesitas más detalle?** Establece `logging.level` en `debug` o `trace` y vuelve a intentarlo.

## Relacionado

- [Aspectos internos del registro de Gateway](/es/gateway/logging) — estilos de registro WS, prefijos de subsistema y captura de consola
- [Diagnósticos](/es/gateway/configuration-reference#diagnostics) — exportación de OpenTelemetry y configuración de rastreo de caché

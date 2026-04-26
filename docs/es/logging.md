---
read_when:
    - Necesitas una explicación general de los registros de OpenClaw apta para principiantes
    - Quieres configurar niveles, formatos o redacción de registros
    - Estás resolviendo problemas y necesitas encontrar registros rápidamente
summary: Registros en archivo, salida de consola, seguimiento desde la CLI y la pestaña Logs de la UI de Control
title: Registro
x-i18n:
    generated_at: "2026-04-26T11:32:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6fa55caa65a2a06a757e37ad64c5fd030f958cf6827596db5c183c6c6db2ed9b
    source_path: logging.md
    workflow: 15
---

OpenClaw tiene dos superficies principales de registro:

- **Registros en archivo** (líneas JSON) escritos por el Gateway.
- **Salida de consola** mostrada en terminales y en la UI de depuración del Gateway.

La pestaña **Logs** de la UI de Control sigue el registro en archivo del gateway. Esta página explica dónde
se encuentran los registros, cómo leerlos y cómo configurar niveles y formatos de registro.

## Dónde se encuentran los registros

De forma predeterminada, el Gateway escribe un archivo de registro rotativo en:

`/tmp/openclaw/openclaw-YYYY-MM-DD.log`

La fecha usa la zona horaria local del host del gateway.

Cada archivo rota cuando alcanza `logging.maxFileBytes` (predeterminado: 100 MB).
OpenClaw mantiene hasta cinco archivos numerados junto al archivo activo, como
`openclaw-YYYY-MM-DD.1.log`, y sigue escribiendo en un nuevo registro activo en lugar de
suprimir diagnósticos.

Puedes sobrescribir esto en `~/.openclaw/openclaw.json`:

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

Opciones actuales útiles:

- `--local-time`: renderiza marcas de tiempo en tu zona horaria local
- `--url <url>` / `--token <token>` / `--timeout <ms>`: banderas estándar de RPC del Gateway
- `--expect-final`: bandera de espera de respuesta final de RPC respaldada por agente (aceptada aquí mediante la capa de cliente compartida)

Modos de salida:

- **Sesiones TTY**: líneas de registro estructuradas, legibles y con color.
- **Sesiones no TTY**: texto sin formato.
- `--json`: JSON delimitado por líneas (un evento de registro por línea).
- `--plain`: fuerza texto sin formato en sesiones TTY.
- `--no-color`: desactiva colores ANSI.

Cuando pasas un `--url` explícito, la CLI no aplica automáticamente credenciales de configuración o
entorno; incluye tú mismo `--token` si el Gateway de destino
requiere autenticación.

En modo JSON, la CLI emite objetos etiquetados por `type`:

- `meta`: metadatos del flujo (archivo, cursor, tamaño)
- `log`: entrada de registro analizada
- `notice`: indicaciones de truncamiento / rotación
- `raw`: línea de registro sin analizar

Si el Gateway local de loopback pide emparejamiento, `openclaw logs` recurre
automáticamente al archivo de registro local configurado. Los destinos explícitos `--url` no
usan este fallback.

Si no se puede alcanzar el Gateway, la CLI muestra una sugerencia breve para ejecutar:

```bash
openclaw doctor
```

### UI de Control (web)

La pestaña **Logs** de la UI de Control sigue el mismo archivo usando `logs.tail`.
Consulta [/web/control-ui](/es/web/control-ui) para saber cómo abrirla.

### Registros solo de canal

Para filtrar actividad de canales (WhatsApp/Telegram/etc.), usa:

```bash
openclaw channels logs --channel whatsapp
```

## Formatos de registro

### Registros en archivo (JSONL)

Cada línea del archivo de registro es un objeto JSON. La CLI y la UI de Control analizan estas
entradas para mostrar salida estructurada (hora, nivel, subsistema, mensaje).

### Salida de consola

Los registros de consola son **conscientes de TTY** y están formateados para facilitar la lectura:

- Prefijos de subsistema (por ejemplo `gateway/channels/whatsapp`)
- Coloreado por nivel (info/warn/error)
- Modo compacto o JSON opcional

El formato de consola está controlado por `logging.consoleStyle`.

### Registros WebSocket del Gateway

`openclaw gateway` también tiene registro del protocolo WebSocket para tráfico RPC:

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

- `logging.level`: nivel de **registros en archivo** (JSONL).
- `logging.consoleLevel`: nivel de verbosidad de la **consola**.

Puedes sobrescribir ambos mediante la variable de entorno **`OPENCLAW_LOG_LEVEL`** (por ejemplo `OPENCLAW_LOG_LEVEL=debug`). La variable de entorno tiene prioridad sobre el archivo de configuración, por lo que puedes aumentar la verbosidad para una sola ejecución sin editar `openclaw.json`. También puedes pasar la opción global de CLI **`--log-level <level>`** (por ejemplo, `openclaw --log-level debug gateway run`), que sobrescribe la variable de entorno para ese comando.

`--verbose` solo afecta a la salida de consola y a la verbosidad del registro WS; no cambia
los niveles de registro en archivo.

### Estilos de consola

`logging.consoleStyle`:

- `pretty`: legible para personas, con color y marcas de tiempo.
- `compact`: salida más ajustada (mejor para sesiones largas).
- `json`: JSON por línea (para procesadores de registros).

### Redacción

Los resúmenes de herramientas pueden redactar tokens sensibles antes de que lleguen a la consola:

- `logging.redactSensitive`: `off` | `tools` (predeterminado: `tools`)
- `logging.redactPatterns`: lista de cadenas regex para sobrescribir el conjunto predeterminado

La redacción se aplica en los sinks de registro para **salida de consola**, **diagnósticos de
consola enrutados a stderr** y **registros en archivo**. Los registros en archivo siguen siendo JSONL, pero los
valores secretos coincidentes se enmascaran antes de que la línea se escriba en disco.

## Diagnósticos y OpenTelemetry

Los diagnósticos son eventos estructurados y legibles por máquina para ejecuciones de modelos y
telemetría de flujo de mensajes (webhooks, colas, estado de sesión). **No**
reemplazan a los registros: alimentan métricas, trazas y exportadores. Los eventos se emiten
en proceso se exporten o no.

Dos superficies relacionadas:

- **Exportación de OpenTelemetry** — envía métricas, trazas y registros por OTLP/HTTP a
  cualquier colector o backend compatible con OpenTelemetry (Grafana, Datadog,
  Honeycomb, New Relic, Tempo, etc.). La configuración completa, catálogo de señales,
  nombres de métricas/spans, variables de entorno y modelo de privacidad están en una página dedicada:
  [Exportación de OpenTelemetry](/es/gateway/opentelemetry).
- **Banderas de diagnósticos** — banderas específicas de depuración que enrutan registros extra a
  `logging.file` sin elevar `logging.level`. Las banderas no distinguen mayúsculas de minúsculas
  y admiten comodines (`telegram.*`, `*`). Configúralas en `diagnostics.flags`
  o mediante la sobrescritura de entorno `OPENCLAW_DIAGNOSTICS=...`. Guía completa:
  [Banderas de diagnósticos](/es/diagnostics/flags).

Para habilitar eventos de diagnóstico para Plugins o sinks personalizados sin exportación OTLP:

```json5
{
  diagnostics: { enabled: true },
}
```

Para exportación OTLP a un colector, consulta [Exportación de OpenTelemetry](/es/gateway/opentelemetry).

## Consejos de solución de problemas

- **¿No se puede alcanzar el Gateway?** Ejecuta primero `openclaw doctor`.
- **¿Registros vacíos?** Comprueba que el Gateway esté en ejecución y escribiendo en la ruta de archivo
  en `logging.file`.
- **¿Necesitas más detalle?** Establece `logging.level` en `debug` o `trace` y vuelve a intentarlo.

## Relacionado

- [Exportación de OpenTelemetry](/es/gateway/opentelemetry) — exportación OTLP/HTTP, catálogo de métricas/spans, modelo de privacidad
- [Banderas de diagnósticos](/es/diagnostics/flags) — banderas específicas de depuración
- [Internos del registro del Gateway](/es/gateway/logging) — estilos de registro WS, prefijos de subsistema y captura de consola
- [Referencia de configuración](/es/gateway/configuration-reference#diagnostics) — referencia completa de campos `diagnostics.*`

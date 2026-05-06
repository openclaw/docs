---
read_when:
    - Necesitas una descripción general para principiantes sobre el registro de OpenClaw
    - Quieres configurar los niveles de registro, los formatos o el enmascaramiento
    - Estás solucionando problemas y necesitas encontrar registros rápidamente
summary: Registros de archivos, salida de consola, seguimiento en tiempo real desde la CLI y la pestaña Registros de la interfaz de usuario de control
title: Registro
x-i18n:
    generated_at: "2026-05-06T05:40:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: abcdfeb0f9fbd13715762a1829198d0285738855c50f2ee531cab1e989d936b1
    source_path: logging.md
    workflow: 16
---

OpenClaw tiene dos superficies principales de logs:

- **Logs de archivo** (líneas JSON) escritos por el Gateway.
- **Salida de consola** mostrada en terminales y en la UI de depuración del Gateway.

La pestaña **Logs** de la UI de control sigue el log de archivo del gateway. Esta página explica dónde
se encuentran los logs, cómo leerlos y cómo configurar niveles y formatos de log.

## Dónde se encuentran los logs

De forma predeterminada, el Gateway escribe un archivo de log rotativo en:

`/tmp/openclaw/openclaw-YYYY-MM-DD.log`

La fecha usa la zona horaria local del host del gateway.

Cada archivo rota cuando alcanza `logging.maxFileBytes` (predeterminado: 100 MB).
OpenClaw conserva hasta cinco archivos numerados junto al archivo activo, como
`openclaw-YYYY-MM-DD.1.log`, y sigue escribiendo en un log activo nuevo en lugar de
suprimir diagnósticos.

Puedes sobrescribir esto en `~/.openclaw/openclaw.json`:

```json
{
  "logging": {
    "file": "/path/to/openclaw.log"
  }
}
```

## Cómo leer logs

### CLI: seguimiento en vivo (recomendado)

Usa la CLI para seguir el archivo de log del gateway mediante RPC:

```bash
openclaw logs --follow
```

Opciones actuales útiles:

- `--local-time`: muestra las marcas de tiempo en tu zona horaria local
- `--url <url>` / `--token <token>` / `--timeout <ms>`: flags estándar de RPC del Gateway
- `--expect-final`: flag de espera de respuesta final RPC respaldada por agente (aceptado aquí mediante la capa de cliente compartida)

Modos de salida:

- **Sesiones TTY**: líneas de log estructuradas, bonitas y coloreadas.
- **Sesiones no TTY**: texto sin formato.
- `--json`: JSON delimitado por líneas (un evento de log por línea).
- `--plain`: fuerza texto sin formato en sesiones TTY.
- `--no-color`: desactiva los colores ANSI.

Cuando pasas un `--url` explícito, la CLI no aplica automáticamente credenciales de configuración o
entorno; incluye `--token` tú mismo si el Gateway de destino
requiere autenticación.

En modo JSON, la CLI emite objetos etiquetados con `type`:

- `meta`: metadatos del flujo (archivo, cursor, tamaño)
- `log`: entrada de log analizada
- `notice`: indicios de truncamiento / rotación
- `raw`: línea de log sin analizar

Si el Gateway de local loopback implícito solicita emparejamiento, se cierra durante la conexión,
o agota el tiempo antes de que `logs.tail` responda, `openclaw logs` recurre automáticamente al
log de archivo configurado del Gateway. Los destinos `--url` explícitos no usan
este mecanismo alternativo.

Si no se puede acceder al Gateway, la CLI imprime una indicación breve para ejecutar:

```bash
openclaw doctor
```

### UI de control (web)

La pestaña **Logs** de la UI de control sigue el mismo archivo usando `logs.tail`.
Consulta [UI de control](/es/web/control-ui) para saber cómo abrirla.

### Logs solo de canal

Para filtrar la actividad del canal (WhatsApp/Telegram/etc.), usa:

```bash
openclaw channels logs --channel whatsapp
```

## Formatos de log

### Logs de archivo (JSONL)

Cada línea del archivo de log es un objeto JSON. La CLI y la UI de control analizan estas
entradas para mostrar una salida estructurada (hora, nivel, subsistema, mensaje).

Los registros JSONL del log de archivo también incluyen campos de nivel superior filtrables por máquina cuando
están disponibles:

- `hostname`: nombre del host del gateway.
- `message`: texto de mensaje de log aplanado para búsqueda de texto completo.
- `agent_id`: id del agente activo cuando la llamada de log contiene contexto de agente.
- `session_id`: id/clave de sesión activa cuando la llamada de log contiene contexto de sesión.
- `channel`: canal activo cuando la llamada de log contiene contexto de canal.

OpenClaw conserva los argumentos estructurados originales del log junto a estos campos
para que sigan funcionando los analizadores existentes que leen claves numeradas de argumentos de tslog.

### Salida de consola

Los logs de consola son **conscientes de TTY** y están formateados para facilitar la lectura:

- Prefijos de subsistema (por ejemplo, `gateway/channels/whatsapp`)
- Coloración por nivel (info/warn/error)
- Modo compacto o JSON opcional

El formato de consola se controla con `logging.consoleStyle`.

### Logs de WebSocket del Gateway

`openclaw gateway` también tiene logging de protocolo WebSocket para tráfico RPC:

- modo normal: solo resultados interesantes (errores, errores de análisis, llamadas lentas)
- `--verbose`: todo el tráfico de solicitud/respuesta
- `--ws-log auto|compact|full`: elige el estilo de representación detallada
- `--compact`: alias de `--ws-log compact`

Ejemplos:

```bash
openclaw gateway
openclaw gateway --verbose --ws-log compact
openclaw gateway --verbose --ws-log full
```

## Configurar logging

Toda la configuración de logging se encuentra en `logging` dentro de `~/.openclaw/openclaw.json`.

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

### Niveles de log

- `logging.level`: nivel de **logs de archivo** (JSONL).
- `logging.consoleLevel`: nivel de verbosidad de la **consola**.

Puedes sobrescribir ambos mediante la variable de entorno **`OPENCLAW_LOG_LEVEL`** (por ejemplo, `OPENCLAW_LOG_LEVEL=debug`). La variable de entorno tiene precedencia sobre el archivo de configuración, así que puedes aumentar la verbosidad para una sola ejecución sin editar `openclaw.json`. También puedes pasar la opción global de la CLI **`--log-level <level>`** (por ejemplo, `openclaw --log-level debug gateway run`), que sobrescribe la variable de entorno para ese comando.

`--verbose` solo afecta la salida de consola y la verbosidad del log de WS; no cambia
los niveles de log de archivo.

### Correlación de trazas

Los logs de archivo son JSONL. Cuando una llamada de log contiene un contexto de traza de diagnóstico válido,
OpenClaw escribe los campos de traza como claves JSON de nivel superior (`traceId`, `spanId`,
`parentSpanId`, `traceFlags`) para que los procesadores externos de logs puedan correlacionar la línea
con spans de OTEL y propagación `traceparent` del proveedor.

Las solicitudes HTTP del Gateway y los frames WebSocket del Gateway establecen un ámbito interno de traza
de solicitud. Los logs y eventos de diagnóstico emitidos dentro de ese ámbito asíncrono heredan
la traza de solicitud cuando no pasan un contexto de traza explícito. Las trazas de ejecución de agente y
de llamada al modelo se convierten en hijas de la traza de solicitud activa, por lo que los logs locales,
las instantáneas de diagnóstico, los spans de OTEL y las cabeceras `traceparent` confiables del proveedor pueden
unirse por `traceId` sin registrar contenido bruto de solicitud o de modelo.

### Tamaño y tiempos de llamadas al modelo

Los diagnósticos de llamadas al modelo registran mediciones acotadas de solicitud/respuesta sin
capturar contenido bruto del prompt o la respuesta:

- `requestPayloadBytes`: tamaño en bytes UTF-8 de la carga útil final de solicitud al modelo
- `responseStreamBytes`: tamaño en bytes UTF-8 de los eventos de respuesta del modelo transmitidos
- `timeToFirstByteMs`: tiempo transcurrido antes del primer evento de respuesta transmitido
- `durationMs`: duración total de la llamada al modelo

Estos campos están disponibles para instantáneas de diagnóstico, hooks de Plugin de llamadas al modelo y
spans/métricas OTEL de llamadas al modelo cuando la exportación de diagnósticos está habilitada.

### Estilos de consola

`logging.consoleStyle`:

- `pretty`: fácil de leer para humanos, coloreado, con marcas de tiempo.
- `compact`: salida más ajustada (mejor para sesiones largas).
- `json`: JSON por línea (para procesadores de logs).

### Redacción

OpenClaw puede redactar tokens sensibles antes de que lleguen a la salida de consola, logs de archivo,
registros de log OTLP, texto persistido de transcripción de sesión o cargas útiles de eventos de herramientas
de la UI de control (argumentos de inicio de herramienta, cargas útiles de resultado parcial/final, salida
derivada de exec y resúmenes de parches):

- `logging.redactSensitive`: `off` | `tools` (predeterminado: `tools`)
- `logging.redactPatterns`: lista de cadenas regex para sobrescribir el conjunto predeterminado. Los patrones personalizados se aplican encima de los valores predeterminados integrados para las cargas útiles de herramientas de la UI de control, por lo que añadir un patrón nunca debilita la redacción de valores que ya detectan los predeterminados.

Los logs de archivo y las transcripciones de sesión siguen siendo JSONL, pero los valores secretos coincidentes se
enmascaran antes de que la línea o el mensaje se escriba en disco. La redacción es de mejor esfuerzo:
se aplica al contenido de mensajes con texto y a cadenas de log, no a todos
los identificadores o campos de carga útil binaria.

Los valores predeterminados integrados cubren credenciales comunes de API y nombres de campos de credenciales
de pago como número de tarjeta, CVC/CVV, token de pago compartido y credencial de pago
cuando aparecen como campos JSON, parámetros de URL, flags de CLI o asignaciones.

`logging.redactSensitive: "off"` solo desactiva esta política general de logs/transcripciones.
OpenClaw sigue redactando cargas útiles de límites de seguridad que pueden mostrarse a clientes de UI,
paquetes de soporte, observadores de diagnóstico, prompts de aprobación o herramientas de agente.
Los ejemplos incluyen eventos de llamadas a herramientas de la UI de control, salida de `sessions_history`,
exportaciones de soporte de diagnóstico, observaciones de errores de proveedores, visualización de comandos de aprobación
de exec y logs de protocolo WebSocket del Gateway. `logging.redactPatterns` personalizado
todavía puede añadir patrones específicos del proyecto en esas superficies.

## Diagnósticos y OpenTelemetry

Los diagnósticos son eventos estructurados, legibles por máquina, para ejecuciones de modelos y
telemetría de flujo de mensajes (webhooks, encolamiento, estado de sesión). **No**
sustituyen a los logs: alimentan métricas, trazas y exportadores. Los eventos se emiten
en proceso tanto si los exportas como si no.

Dos superficies adyacentes:

- **Exportación de OpenTelemetry** — envía métricas, trazas y logs por OTLP/HTTP a
  cualquier colector o backend compatible con OpenTelemetry (Grafana, Datadog,
  Honeycomb, New Relic, Tempo, etc.). La configuración completa, el catálogo de señales,
  los nombres de métricas/spans, las variables de entorno y el modelo de privacidad se encuentran en una página dedicada:
  [Exportación de OpenTelemetry](/es/gateway/opentelemetry).
- **Flags de diagnóstico** — flags de log de depuración dirigidos que enrutan logs adicionales a
  `logging.file` sin aumentar `logging.level`. Los flags no distinguen mayúsculas y minúsculas
  y admiten comodines (`telegram.*`, `*`). Configura en `diagnostics.flags`
  o mediante la sobrescritura de entorno `OPENCLAW_DIAGNOSTICS=...`. Guía completa:
  [Flags de diagnóstico](/es/diagnostics/flags).

Para habilitar eventos de diagnóstico para plugins o receptores personalizados sin exportación OTLP:

```json5
{
  diagnostics: { enabled: true },
}
```

Para exportación OTLP a un colector, consulta [Exportación de OpenTelemetry](/es/gateway/opentelemetry).

## Consejos de solución de problemas

- **¿No se puede acceder al Gateway?** Ejecuta primero `openclaw doctor`.
- **¿Logs vacíos?** Comprueba que el Gateway se esté ejecutando y escribiendo en la ruta de archivo
  de `logging.file`.
- **¿Necesitas más detalle?** Establece `logging.level` en `debug` o `trace` y vuelve a intentarlo.

## Relacionado

- [Exportación de OpenTelemetry](/es/gateway/opentelemetry) — exportación OTLP/HTTP, catálogo de métricas/spans, modelo de privacidad
- [Flags de diagnóstico](/es/diagnostics/flags) — flags de log de depuración dirigidos
- [Internos de logging del Gateway](/es/gateway/logging) — estilos de log WS, prefijos de subsistema y captura de consola
- [Referencia de configuración](/es/gateway/configuration-reference#diagnostics) — referencia completa de campos `diagnostics.*`

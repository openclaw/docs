---
read_when:
    - Necesitas una descripción general para principiantes del registro de OpenClaw
    - Quieres configurar los niveles de registro, los formatos o la ocultación
    - Está solucionando problemas y necesita encontrar registros rápidamente
summary: Registros de archivos, salida de consola, seguimiento en tiempo real de la CLI y la pestaña Registros de la interfaz de control
title: Registro
x-i18n:
    generated_at: "2026-04-30T05:49:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 916fb03219d571f0302560a4cb6755940575c92fff0b4eab024b9dad53f841ce
    source_path: logging.md
    workflow: 16
---

OpenClaw tiene dos superficies principales de registros:

- **Registros de archivo** (líneas JSON) escritos por el Gateway.
- **Salida de consola** mostrada en terminales y en la IU de depuración del Gateway.

La pestaña **Registros** de la IU de control sigue el registro de archivo del gateway. Esta página explica dónde
se almacenan los registros, cómo leerlos y cómo configurar niveles y formatos de registro.

## Dónde se almacenan los registros

De forma predeterminada, el Gateway escribe un archivo de registro rotativo en:

`/tmp/openclaw/openclaw-YYYY-MM-DD.log`

La fecha usa la zona horaria local del host del gateway.

Cada archivo rota cuando alcanza `logging.maxFileBytes` (valor predeterminado: 100 MB).
OpenClaw conserva hasta cinco archivos numerados junto al archivo activo, como
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

## Cómo leer registros

### CLI: seguimiento en vivo (recomendado)

Usa la CLI para seguir el archivo de registro del gateway mediante RPC:

```bash
openclaw logs --follow
```

Opciones actuales útiles:

- `--local-time`: renderiza marcas de tiempo en tu zona horaria local
- `--url <url>` / `--token <token>` / `--timeout <ms>`: flags estándar de RPC del Gateway
- `--expect-final`: flag de espera de respuesta final de RPC respaldada por agente (aceptado aquí mediante la capa de cliente compartida)

Modos de salida:

- **Sesiones TTY**: líneas de registro estructuradas, bonitas y con color.
- **Sesiones no TTY**: texto sin formato.
- `--json`: JSON delimitado por líneas (un evento de registro por línea).
- `--plain`: fuerza texto sin formato en sesiones TTY.
- `--no-color`: desactiva los colores ANSI.

Cuando pasas un `--url` explícito, la CLI no aplica automáticamente credenciales de configuración ni de
entorno; incluye `--token` por tu cuenta si el Gateway de destino
requiere autenticación.

En modo JSON, la CLI emite objetos etiquetados por `type`:

- `meta`: metadatos del flujo (archivo, cursor, tamaño)
- `log`: entrada de registro analizada
- `notice`: indicios de truncamiento / rotación
- `raw`: línea de registro sin analizar

Si el Gateway de local loopback implícito solicita emparejamiento, se cierra durante la conexión
o agota el tiempo de espera antes de que `logs.tail` responda, `openclaw logs` recurre
automáticamente al archivo de registro del Gateway configurado. Los destinos `--url` explícitos no usan
esta alternativa.

Si el Gateway no está accesible, la CLI imprime una breve sugerencia para ejecutar:

```bash
openclaw doctor
```

### IU de control (web)

La pestaña **Registros** de la IU de control sigue el mismo archivo usando `logs.tail`.
Consulta [/web/control-ui](/es/web/control-ui) para saber cómo abrirla.

### Registros solo de canal

Para filtrar actividad de canales (WhatsApp/Telegram/etc.), usa:

```bash
openclaw channels logs --channel whatsapp
```

## Formatos de registro

### Registros de archivo (JSONL)

Cada línea del archivo de registro es un objeto JSON. La CLI y la IU de control analizan estas
entradas para renderizar salida estructurada (hora, nivel, subsistema, mensaje).

Los registros JSONL de archivo también incluyen campos de nivel superior filtrables por máquina cuando
están disponibles:

- `hostname`: nombre del host del gateway.
- `message`: texto del mensaje de registro aplanado para búsqueda de texto completo.
- `agent_id`: id del agente activo cuando la llamada de registro lleva contexto de agente.
- `session_id`: id/clave de la sesión activa cuando la llamada de registro lleva contexto de sesión.
- `channel`: canal activo cuando la llamada de registro lleva contexto de canal.

OpenClaw conserva los argumentos de registro estructurados originales junto a estos campos
para que los analizadores existentes que leen claves numeradas de argumentos de tslog sigan funcionando.

### Salida de consola

Los registros de consola son **conscientes de TTY** y están formateados para facilitar la lectura:

- Prefijos de subsistema (p. ej. `gateway/channels/whatsapp`)
- Coloración por nivel (info/warn/error)
- Modo compacto o JSON opcional

El formato de consola se controla con `logging.consoleStyle`.

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

- `logging.level`: nivel de **registros de archivo** (JSONL).
- `logging.consoleLevel`: nivel de verbosidad de **consola**.

Puedes sobrescribir ambos mediante la variable de entorno **`OPENCLAW_LOG_LEVEL`** (p. ej. `OPENCLAW_LOG_LEVEL=debug`). La variable de entorno tiene prioridad sobre el archivo de configuración, así que puedes aumentar la verbosidad para una sola ejecución sin editar `openclaw.json`. También puedes pasar la opción global de la CLI **`--log-level <level>`** (por ejemplo, `openclaw --log-level debug gateway run`), que sobrescribe la variable de entorno para ese comando.

`--verbose` solo afecta la salida de consola y la verbosidad de registros WS; no cambia
los niveles de registro de archivo.

### Correlación de trazas

Los registros de archivo son JSONL. Cuando una llamada de registro lleva un contexto de traza diagnóstica válido,
OpenClaw escribe los campos de traza como claves JSON de nivel superior (`traceId`, `spanId`,
`parentSpanId`, `traceFlags`) para que los procesadores de registros externos puedan correlacionar la línea
con spans OTEL y propagación `traceparent` del proveedor.

Las solicitudes HTTP del Gateway y los frames WebSocket del Gateway establecen un alcance de traza de solicitud
interno. Los registros y eventos diagnósticos emitidos dentro de ese alcance asíncrono heredan
la traza de solicitud cuando no pasan un contexto de traza explícito. Las trazas de ejecución de agente y
de llamadas de modelo se convierten en hijas de la traza de solicitud activa, por lo que los registros locales,
las instantáneas diagnósticas, los spans OTEL y los encabezados `traceparent` de proveedores de confianza pueden
unirse por `traceId` sin registrar contenido bruto de solicitud o de modelo.

### Tamaño y temporización de llamadas de modelo

Los diagnósticos de llamadas de modelo registran mediciones acotadas de solicitud/respuesta sin
capturar contenido bruto del prompt o de la respuesta:

- `requestPayloadBytes`: tamaño en bytes UTF-8 de la carga final de solicitud del modelo
- `responseStreamBytes`: tamaño en bytes UTF-8 de los eventos de respuesta del modelo transmitidos
- `timeToFirstByteMs`: tiempo transcurrido antes del primer evento de respuesta transmitido
- `durationMs`: duración total de la llamada de modelo

Estos campos están disponibles para instantáneas diagnósticas, hooks de Plugin de llamadas de modelo y
spans/métricas OTEL de llamadas de modelo cuando la exportación diagnóstica está habilitada.

### Estilos de consola

`logging.consoleStyle`:

- `pretty`: fácil de leer, con color y marcas de tiempo.
- `compact`: salida más ajustada (mejor para sesiones largas).
- `json`: JSON por línea (para procesadores de registros).

### Redacción

OpenClaw puede redactar tokens sensibles antes de que lleguen a la salida de consola, registros de archivo,
registros OTLP, texto persistido de transcripción de sesión o cargas de eventos de herramientas de la IU de control
(argumentos de inicio de herramienta, cargas de resultado parcial/final, salida derivada de
exec y resúmenes de parches):

- `logging.redactSensitive`: `off` | `tools` (valor predeterminado: `tools`)
- `logging.redactPatterns`: lista de cadenas regex para sobrescribir el conjunto predeterminado. Los patrones personalizados se aplican encima de los valores predeterminados integrados para cargas de herramientas de la IU de control, por lo que agregar un patrón nunca debilita la redacción de valores que ya capturan los valores predeterminados.

Los registros de archivo y las transcripciones de sesión siguen siendo JSONL, pero los valores secretos coincidentes se
enmascaran antes de que la línea o el mensaje se escriba en disco. La redacción es de mejor esfuerzo:
se aplica al contenido de mensajes con texto y a cadenas de registro, no a todos los
identificadores ni campos de carga binaria.

`logging.redactSensitive: "off"` solo desactiva esta política general de registros/transcripción.
OpenClaw sigue redactando cargas de límites de seguridad que pueden mostrarse a clientes de IU,
paquetes de soporte, observadores diagnósticos, prompts de aprobación o herramientas de agente.
Los ejemplos incluyen eventos de llamadas de herramienta de la IU de control, salida de `sessions_history`,
exportaciones de soporte diagnóstico, observaciones de errores de proveedor, visualización de comandos de aprobación de exec
y registros del protocolo WebSocket del Gateway. Los `logging.redactPatterns` personalizados
aún pueden agregar patrones específicos del proyecto en esas superficies.

## Diagnósticos y OpenTelemetry

Los diagnósticos son eventos estructurados y legibles por máquina para ejecuciones de modelo y
telemetría de flujo de mensajes (webhooks, colas, estado de sesión). **No**
reemplazan los registros: alimentan métricas, trazas y exportadores. Los eventos se emiten
en el proceso tanto si los exportas como si no.

Dos superficies adyacentes:

- **Exportación de OpenTelemetry** — envía métricas, trazas y registros por OTLP/HTTP a
  cualquier colector o backend compatible con OpenTelemetry (Grafana, Datadog,
  Honeycomb, New Relic, Tempo, etc.). La configuración completa, el catálogo de señales,
  los nombres de métricas/spans, las variables de entorno y el modelo de privacidad viven en una página dedicada:
  [Exportación de OpenTelemetry](/es/gateway/opentelemetry).
- **Flags de diagnóstico** — flags de registro de depuración dirigidos que envían registros adicionales a
  `logging.file` sin aumentar `logging.level`. Los flags no distinguen mayúsculas y minúsculas
  y admiten comodines (`telegram.*`, `*`). Configúralos en `diagnostics.flags`
  o mediante la sobrescritura de entorno `OPENCLAW_DIAGNOSTICS=...`. Guía completa:
  [Flags de diagnóstico](/es/diagnostics/flags).

Para habilitar eventos diagnósticos para plugins o sumideros personalizados sin exportación OTLP:

```json5
{
  diagnostics: { enabled: true },
}
```

Para exportación OTLP a un colector, consulta [Exportación de OpenTelemetry](/es/gateway/opentelemetry).

## Consejos de solución de problemas

- **¿No se puede acceder al Gateway?** Ejecuta `openclaw doctor` primero.
- **¿Registros vacíos?** Comprueba que el Gateway esté en ejecución y escribiendo en la ruta de archivo
  de `logging.file`.
- **¿Necesitas más detalle?** Configura `logging.level` en `debug` o `trace` e inténtalo de nuevo.

## Relacionado

- [Exportación de OpenTelemetry](/es/gateway/opentelemetry) — exportación OTLP/HTTP, catálogo de métricas/spans, modelo de privacidad
- [Flags de diagnóstico](/es/diagnostics/flags) — flags de registro de depuración dirigidos
- [Internos de registro del Gateway](/es/gateway/logging) — estilos de registro WS, prefijos de subsistema y captura de consola
- [Referencia de configuración](/es/gateway/configuration-reference#diagnostics) — referencia completa de campos `diagnostics.*`

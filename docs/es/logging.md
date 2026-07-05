---
read_when:
    - Necesitas una descripción general para principiantes del registro de OpenClaw
    - Quieres configurar niveles, formatos o censura de registros
    - Estás solucionando problemas y necesitas encontrar registros rápidamente
summary: Registros de archivos, salida de consola, seguimiento de CLI y la pestaña Registros de Control UI
title: Registro
x-i18n:
    generated_at: "2026-07-05T11:30:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: add41e125c22ca1b2343a3a1fb1e88e94ef9c81a07c48b9eb67f4d4b2510dd08
    source_path: logging.md
    workflow: 16
---

OpenClaw tiene dos superficies de registro principales:

- **Registros de archivo** (líneas JSON) escritos por el Gateway.
- **Salida de consola** en la terminal que ejecuta el Gateway.

La pestaña **Logs** de la Control UI sigue el registro de archivo del gateway. Esta página explica dónde
se guardan los registros, cómo leerlos y cómo configurar los niveles y formatos de registro.

## Dónde se guardan los registros

De forma predeterminada, el Gateway escribe un archivo de registro rotativo por día:

`/tmp/openclaw/openclaw-YYYY-MM-DD.log`

La fecha usa la zona horaria local del host del gateway. Cuando `/tmp/openclaw` no es seguro
o no está disponible (y siempre en Windows), OpenClaw usa en su lugar un directorio
`openclaw-<uid>` con ámbito de usuario bajo el directorio temporal del sistema operativo. Los archivos de registro
fechados se eliminan después de 24 horas.

Cada archivo rota cuando la siguiente escritura superaría `logging.maxFileBytes`
(valor predeterminado: 100 MB). OpenClaw conserva hasta cinco archivos numerados junto al
archivo activo, como `openclaw-YYYY-MM-DD.1.log`, y sigue escribiendo en un nuevo
registro activo en lugar de suprimir diagnósticos.

Puedes anular la ruta en `~/.openclaw/openclaw.json`:

```json
{
  "logging": {
    "file": "/path/to/openclaw.log"
  }
}
```

## Cómo leer los registros

### CLI: seguimiento en vivo (recomendado)

Sigue el archivo de registro del gateway mediante RPC:

```bash
openclaw logs --follow
```

Opciones:

| Marca               | Predeterminado | Comportamiento                                                                       |
| ------------------- | -------------- | ------------------------------------------------------------------------------------ |
| `--follow`          | desactivado    | Mantener el seguimiento; se reconecta con backoff al desconectarse                   |
| `--limit <n>`       | `200`          | Máximo de líneas por obtención                                                       |
| `--max-bytes <n>`   | `250000`       | Máximo de bytes que leer por obtención                                               |
| `--interval <ms>`   | `1000`         | Intervalo de sondeo durante el seguimiento                                           |
| `--json`            | desactivado    | JSON delimitado por líneas (un evento por línea)                                     |
| `--plain`           | desactivado    | Forzar texto sin formato en sesiones TTY                                             |
| `--no-color`        | —              | Desactivar colores ANSI                                                              |
| `--utc`             | desactivado    | Representar marcas de tiempo en UTC (la hora local es el valor predeterminado)       |
| `--local-time`      | desactivado    | Ortografía de compatibilidad aceptada para el valor predeterminado de hora local; sin efecto adicional |
| `--url` / `--token` | —              | Marcas RPC estándar del Gateway                                                      |
| `--timeout <ms>`    | `30000`        | Tiempo de espera RPC del Gateway                                                     |
| `--expect-final`    | desactivado    | Marca de espera de respuesta final de RPC respaldada por agente (aceptada aquí mediante la capa de cliente compartida) |

Modos de salida:

- **Sesiones TTY**: líneas de registro estructuradas, atractivas y coloreadas.
- **Sesiones no TTY**: texto sin formato.

Cuando pasas un `--url` explícito, la CLI no aplica automáticamente las credenciales
de configuración ni de entorno; incluye `--token` tú mismo, o la llamada falla con
`gateway url override requires explicit credentials`.

En modo JSON, la CLI emite objetos etiquetados con `type`:

- `meta`: metadatos del flujo (file, source, sourceKind, service, cursor, size)
- `log`: entrada de registro analizada
- `notice`: indicios de truncamiento / rotación
- `raw`: línea de registro sin analizar
- `error`: fallos de conexión del gateway (escritos en stderr)

Si el Gateway de local loopback implícito solicita emparejamiento, se cierra durante la conexión,
o agota el tiempo antes de que `logs.tail` responda, `openclaw logs` recurre automáticamente al
registro de archivo del Gateway configurado. Los destinos `--url` explícitos no usan
esta alternativa. `openclaw logs --follow` es más estricto: en Linux usa el journal activo
del Gateway de user-systemd por PID cuando está disponible y, de lo contrario, reintenta el
Gateway en vivo con backoff en lugar de seguir un archivo paralelo potencialmente obsoleto.

Si no se puede acceder al Gateway, la CLI imprime una breve sugerencia para ejecutar:

```bash
openclaw doctor
```

### Control UI (web)

La pestaña **Logs** de la Control UI sigue el mismo archivo usando `logs.tail`.
Consulta [Control UI](/es/web/control-ui) para saber cómo abrirla.

### Registros solo de canales

Para filtrar actividad de canales (WhatsApp/Telegram/etc), usa:

```bash
openclaw channels logs --channel whatsapp
```

`--channel` tiene como valor predeterminado `all`; `--lines <n>` (predeterminado 200) y `--json` también
están disponibles.

## Formatos de registro

### Registros de archivo (JSONL)

Cada línea del archivo de registro es un objeto JSON. La CLI y la Control UI analizan estas
entradas para representar salida estructurada (hora, nivel, subsistema, mensaje).

Los registros JSONL de archivo también incluyen campos de nivel superior filtrables por máquina cuando
están disponibles:

- `hostname`: nombre de host del gateway.
- `message`: texto de mensaje de registro aplanado para búsqueda de texto completo.
- `agent_id`: id del agente activo cuando la llamada de registro lleva contexto de agente.
- `session_id`: id/clave de sesión activa cuando la llamada de registro lleva contexto de sesión.
- `channel`: canal activo cuando la llamada de registro lleva contexto de canal.

OpenClaw conserva los argumentos de registro estructurados originales junto con estos campos
para que sigan funcionando los analizadores existentes que leen claves de argumentos tslog numeradas.

La actividad de conversación, voz en tiempo real y salas gestionadas emite registros acotados de ciclo de vida
a través de esta misma canalización de registros de archivo. Estos registros incluyen tipo de evento,
modo, transporte, proveedor y mediciones de tamaño/tiempo cuando están disponibles, pero omiten
texto de transcripción, cargas de audio, ids de turnos, ids de llamadas e ids de elementos de proveedor.

### Salida de consola

Los registros de consola son **conscientes de TTY** y están formateados para facilitar la lectura:

- Prefijos de subsistema (por ejemplo, `gateway/channels/whatsapp`)
- Coloreado de nivel (info/warn/error)
- Modo compacto o JSON opcional

El formato de consola se controla mediante `logging.consoleStyle`.

### Registros WebSocket del Gateway

`openclaw gateway` también tiene registro de protocolo WebSocket para tráfico RPC:

- modo normal: solo resultados interesantes (errores, errores de análisis, llamadas lentas)
- `--verbose`: todo el tráfico de solicitud/respuesta
- `--ws-log auto|compact|full`: elegir el estilo de representación detallada
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

Niveles: `silent`, `fatal`, `error`, `warn`, `info`, `debug`, `trace`.

- `logging.level`: nivel de **registros de archivo** (JSONL) (predeterminado: `info`).
- `logging.consoleLevel`: nivel de verbosidad de **consola**.

Puedes anular ambos mediante la variable de entorno **`OPENCLAW_LOG_LEVEL`** (por ejemplo, `OPENCLAW_LOG_LEVEL=debug`). La variable de entorno tiene precedencia sobre el archivo de configuración, así que puedes aumentar la verbosidad para una sola ejecución sin editar `openclaw.json`. También puedes pasar la opción global de CLI **`--log-level <level>`** (por ejemplo, `openclaw --log-level debug gateway run`), que anula la variable de entorno para ese comando.

`--verbose` solo afecta la salida de consola y la verbosidad del registro WS; no cambia
los niveles de registro de archivo.

### Diagnósticos dirigidos de transporte de modelo

Al depurar llamadas a proveedores, usa marcas de entorno dirigidas en lugar de elevar
todos los registros a `debug`:

```bash
OPENCLAW_DEBUG_MODEL_TRANSPORT=1 openclaw gateway
OPENCLAW_DEBUG_MODEL_PAYLOAD=tools OPENCLAW_DEBUG_SSE=events openclaw gateway
```

Marcas disponibles:

- `OPENCLAW_DEBUG_MODEL_TRANSPORT=1`: emitir inicio de solicitud, respuesta de fetch, encabezados
  de SDK, primer evento de streaming, finalización de flujo y errores de transporte en
  nivel `info`.
- `OPENCLAW_DEBUG_MODEL_PAYLOAD=summary`: incluir un resumen acotado de la carga útil de solicitud
  en los registros de solicitud de modelo.
- `OPENCLAW_DEBUG_MODEL_PAYLOAD=tools`: incluir todos los nombres de herramientas visibles para el modelo en
  el resumen de carga útil.
- `OPENCLAW_DEBUG_MODEL_PAYLOAD=full-redacted`: incluir una instantánea JSON redactada y limitada
  de la carga útil. Úsala solo durante la depuración; los secretos se redactan, pero las instrucciones
  y el texto de mensajes aún pueden estar presentes.
- `OPENCLAW_DEBUG_SSE=events`: emitir tiempos del primer evento y de finalización de flujo.
- `OPENCLAW_DEBUG_SSE=peek`: emitir también las cargas útiles de los primeros cinco eventos SSE redactados,
  limitadas por evento.
- `OPENCLAW_DEBUG_CODE_MODE=1`: emitir diagnósticos de superficie de modelo de modo de código,
  incluso cuando las herramientas nativas del proveedor se ocultan porque el modo de código posee la
  superficie de herramientas.

Estas marcas registran mediante el registro normal de OpenClaw, así que `openclaw logs --follow`
y la pestaña Logs de la Control UI las muestran. Sin las marcas, los mismos diagnósticos
siguen disponibles en nivel `debug`.

Los metadatos de inicio y respuesta de `[model-fetch]` (proveedor, API, modelo, estado,
latencia y campos de solicitud como método, URL, tiempo de espera, proxy y política)
siempre se emiten en nivel `info`, independientemente de
`OPENCLAW_DEBUG_MODEL_TRANSPORT`, para que la higiene básica del transporte de modelo sea visible
sin marcas de depuración.

### Correlación de trazas

Los registros de archivo son JSONL. Cuando una llamada de registro lleva un contexto de traza de diagnóstico válido,
OpenClaw escribe los campos de traza como claves JSON de nivel superior (`traceId`, `spanId`,
`parentSpanId`, `traceFlags`) para que los procesadores externos de registros puedan correlacionar la línea
con spans de OTEL y propagación `traceparent` del proveedor.

Las solicitudes HTTP del Gateway y los frames WebSocket del Gateway establecen un ámbito interno de traza de solicitud.
Los registros y eventos de diagnóstico emitidos dentro de ese ámbito asíncrono heredan
la traza de solicitud cuando no pasan un contexto de traza explícito. Las trazas de ejecución de agente y
de llamada de modelo se convierten en hijas de la traza de solicitud activa, por lo que los registros locales,
instantáneas de diagnóstico, spans OTEL y encabezados `traceparent` de proveedores de confianza pueden
unirse por `traceId` sin registrar la solicitud sin procesar ni el contenido del modelo.

Los registros de ciclo de vida de conversación también fluyen a la exportación de registros diagnostics-otel cuando
la exportación de registros OpenTelemetry está habilitada, usando los mismos atributos acotados que los registros de archivo.
Configura `diagnostics.otel.logsExporter` para elegir OTLP, stdout JSONL o
ambos destinos.

### Tamaño y temporización de llamadas de modelo

Los diagnósticos de llamadas de modelo registran mediciones acotadas de solicitud/respuesta sin
capturar contenido sin procesar de instrucciones ni respuestas:

- `requestPayloadBytes`: tamaño en bytes UTF-8 de la carga útil final de solicitud al modelo
- `responseStreamBytes`: tamaño en bytes UTF-8 de cargas útiles de fragmentos de respuesta de modelo en streaming.
  Los eventos de texto de alta frecuencia, pensamiento y deltas de llamada de herramientas cuentan
  solo los bytes incrementales de `delta` en lugar de instantáneas completas de `partial`.
- `timeToFirstByteMs`: tiempo transcurrido antes del primer evento de respuesta en streaming
- `durationMs`: duración total de la llamada al modelo

Estos campos están disponibles para instantáneas de diagnóstico, hooks de Plugin de llamada de modelo y
spans/métricas OTEL de llamadas de modelo cuando la exportación de diagnósticos está habilitada.

### Estilos de consola

`logging.consoleStyle`:

- `pretty`: fácil de leer para humanos, coloreado, con marcas de tiempo.
- `compact`: salida más compacta (mejor para sesiones largas).
- `json`: JSON por línea (para procesadores de registros).

### Redacción

OpenClaw puede redactar tokens sensibles antes de que lleguen a la salida de consola, registros de archivo,
registros OTLP, texto persistido de transcripción de sesión o cargas útiles de eventos de herramientas
de la Control UI (argumentos de inicio de herramienta, cargas útiles de resultado parcial/final, salida
exec derivada y resúmenes de parches):

- `logging.redactSensitive`: `off` | `tools` (predeterminado: `tools`)
- `logging.redactPatterns`: lista de cadenas regex que reemplaza el conjunto predeterminado para salida de registros/transcripción. Para cargas útiles de herramientas de la Control UI, los patrones personalizados se aplican además de los valores predeterminados integrados, así que añadir un patrón nunca debilita la redacción de valores ya capturados por los valores predeterminados.

Los registros de archivo y las transcripciones de sesión permanecen en JSONL, pero los valores secretos coincidentes se
enmascaran antes de que la línea o el mensaje se escriba en disco. La redacción es de mejor esfuerzo:
se aplica a contenido de mensajes con texto y cadenas de registro, no a todos los
identificadores ni campos de cargas binarias.

Los valores predeterminados integrados cubren credenciales de API comunes y nombres de
campos de credenciales de pago como número de tarjeta, CVC/CVV, token de pago
compartido y credencial de pago cuando aparecen como campos JSON, parámetros de
URL, flags de CLI o asignaciones.

`logging.redactSensitive: "off"` solo desactiva esta política general de
registros/transcripciones. OpenClaw sigue redactando las cargas útiles de límite
de seguridad que pueden mostrarse a clientes de UI, paquetes de soporte,
observadores de diagnóstico, solicitudes de aprobación o herramientas de agente.
Algunos ejemplos incluyen eventos de llamadas a herramientas de Control UI, salida
de `sessions_history`, exportaciones de soporte de diagnóstico, observaciones de
errores de proveedores, visualización de comandos de aprobación de ejecución y
registros del protocolo WebSocket del Gateway. Los `logging.redactPatterns`
personalizados aún pueden agregar patrones específicos del proyecto en esas
superficies.

## Diagnóstico y OpenTelemetry

Los diagnósticos son eventos estructurados y legibles por máquina para ejecuciones
de modelos y telemetría de flujo de mensajes (webhooks, colas, estado de sesión).
**No** reemplazan los registros: alimentan métricas, trazas y exportadores. Los
eventos se emiten en el proceso de forma predeterminada (establece
`diagnostics.enabled: false` para desactivarlos); exportarlos es independiente.

Dos superficies adyacentes:

- **Exportación de OpenTelemetry** — envía métricas, trazas y registros mediante
  OTLP/HTTP a cualquier colector o backend compatible con OpenTelemetry (Datadog,
  Grafana, Honeycomb, New Relic, Tempo, etc.). La configuración completa, el
  catálogo de señales, los nombres de métricas/spans, las variables de entorno y
  el modelo de privacidad están en una página dedicada:
  [Exportación de OpenTelemetry](/es/gateway/opentelemetry).
- **Flags de diagnóstico** — flags de registros de depuración dirigidos que envían
  registros adicionales a `logging.file` sin elevar `logging.level`. Los flags no
  distinguen mayúsculas y minúsculas y admiten comodines (`telegram.*`, `*`).
  Configúralos en `diagnostics.flags` o mediante la sobrescritura de entorno
  `OPENCLAW_DIAGNOSTICS=...`. Guía completa:
  [Flags de diagnóstico](/es/diagnostics/flags).

Para exportar OTLP a un colector, consulta [Exportación de OpenTelemetry](/es/gateway/opentelemetry).

## Consejos de solución de problemas

- **¿No se puede acceder al Gateway?** Ejecuta primero `openclaw doctor`.
- **¿Los registros están vacíos?** Comprueba que el Gateway esté en ejecución y
  escribiendo en la ruta de archivo de `logging.file`.
- **¿Necesitas más detalle?** Establece `logging.level` en `debug` o `trace` y vuelve a intentarlo.

## Relacionado

- [Exportación de OpenTelemetry](/es/gateway/opentelemetry) — exportación OTLP/HTTP, catálogo de métricas/spans, modelo de privacidad
- [Flags de diagnóstico](/es/diagnostics/flags) — flags de registros de depuración dirigidos
- [Detalles internos de registro del Gateway](/es/gateway/logging) — estilos de registro WS, prefijos de subsistemas y captura de consola
- [Referencia de configuración](/es/gateway/configuration-reference#diagnostics) — referencia completa de campos `diagnostics.*`

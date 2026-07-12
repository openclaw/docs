---
read_when:
    - Necesitas una introducción al registro de OpenClaw apta para principiantes
    - Quieres configurar los niveles y formatos de registro o la ocultación de datos sensibles
    - Estás solucionando problemas y necesitas encontrar los registros rápidamente
summary: Registros de archivos, salida de la consola, seguimiento mediante la CLI y pestaña Registros de la interfaz de control
title: Registro
x-i18n:
    generated_at: "2026-07-11T23:14:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: add41e125c22ca1b2343a3a1fb1e88e94ef9c81a07c48b9eb67f4d4b2510dd08
    source_path: logging.md
    workflow: 16
---

OpenClaw tiene dos superficies principales de registro:

- **Registros de archivo** (líneas JSON) escritos por el Gateway.
- **Salida de consola** en el terminal donde se ejecuta el Gateway.

La pestaña **Registros** de la interfaz de control sigue en tiempo real el archivo de registro del Gateway. Esta página explica dónde
se encuentran los registros, cómo leerlos y cómo configurar sus niveles y formatos.

## Dónde se encuentran los registros

De forma predeterminada, el Gateway escribe un archivo de registro rotativo por día:

`/tmp/openclaw/openclaw-YYYY-MM-DD.log`

La fecha usa la zona horaria local del host del Gateway. Cuando `/tmp/openclaw` no es seguro
o no está disponible (y siempre en Windows), OpenClaw usa en su lugar un directorio
`openclaw-<uid>` específico del usuario dentro del directorio temporal del sistema operativo. Los archivos de registro
con fecha se eliminan después de 24 horas.

Cada archivo rota cuando la siguiente escritura superaría `logging.maxFileBytes`
(valor predeterminado: 100 MB). OpenClaw conserva hasta cinco archivos numerados junto al
archivo activo, como `openclaw-YYYY-MM-DD.1.log`, y continúa escribiendo en un nuevo
registro activo en lugar de suprimir los diagnósticos.

Puede sustituir la ruta en `~/.openclaw/openclaw.json`:

```json
{
  "logging": {
    "file": "/path/to/openclaw.log"
  }
}
```

## Cómo leer los registros

### CLI: seguimiento en tiempo real (recomendado)

Siga el archivo de registro del Gateway mediante RPC:

```bash
openclaw logs --follow
```

Opciones:

| Indicador           | Predeterminado | Comportamiento                                                                                           |
| ------------------- | -------------- | -------------------------------------------------------------------------------------------------------- |
| `--follow`          | desactivado    | Mantiene el seguimiento; se reconecta con espera progresiva al desconectarse                            |
| `--limit <n>`       | `200`          | Número máximo de líneas por consulta                                                                     |
| `--max-bytes <n>`   | `250000`       | Número máximo de bytes que se leen por consulta                                                          |
| `--interval <ms>`   | `1000`         | Intervalo de sondeo durante el seguimiento                                                               |
| `--json`            | desactivado    | JSON delimitado por líneas (un evento por línea)                                                         |
| `--plain`           | desactivado    | Fuerza el texto sin formato en sesiones TTY                                                              |
| `--no-color`        | —              | Desactiva los colores ANSI                                                                               |
| `--utc`             | desactivado    | Muestra las marcas de tiempo en UTC (la hora local es la opción predeterminada)                           |
| `--local-time`      | desactivado    | Variante de compatibilidad aceptada para el valor predeterminado de hora local; no tiene ningún otro efecto |
| `--url` / `--token` | —              | Indicadores RPC estándar del Gateway                                                                     |
| `--timeout <ms>`    | `30000`        | Tiempo de espera de RPC del Gateway                                                                      |
| `--expect-final`    | desactivado    | Indicador de espera de respuesta final de RPC respaldada por un agente (aceptado aquí mediante la capa de cliente compartida) |

Modos de salida:

- **Sesiones TTY**: líneas de registro estructuradas, con formato legible y colores.
- **Sesiones que no son TTY**: texto sin formato.

Cuando se proporciona un `--url` explícito, la CLI no aplica automáticamente las credenciales
de la configuración ni del entorno; incluya usted mismo `--token`, o la llamada fallará con
`gateway url override requires explicit credentials`.

En modo JSON, la CLI emite objetos etiquetados mediante `type`:

- `meta`: metadatos del flujo (archivo, origen, tipo de origen, servicio, cursor, tamaño)
- `log`: entrada de registro analizada
- `notice`: avisos de truncamiento o rotación
- `raw`: línea de registro sin analizar
- `error`: fallos de conexión con el Gateway (escritos en stderr)

Si el Gateway implícito de local loopback solicita vinculación, se cierra durante la conexión
o agota el tiempo de espera antes de que `logs.tail` responda, `openclaw logs` recurre
automáticamente al archivo de registro configurado del Gateway. Los destinos con `--url` explícito no usan
este mecanismo alternativo. `openclaw logs --follow` es más estricto: en Linux usa el diario del Gateway
de systemd del usuario activo identificado por PID cuando está disponible; de lo contrario, reintenta la conexión con el
Gateway activo con espera progresiva, en lugar de seguir un archivo adyacente que podría estar
desactualizado.

Si no se puede acceder al Gateway, la CLI muestra una breve sugerencia para ejecutar:

```bash
openclaw doctor
```

### Interfaz de control (web)

La pestaña **Registros** de la interfaz de control sigue el mismo archivo mediante `logs.tail`.
Consulte [Interfaz de control](/es/web/control-ui) para saber cómo abrirla.

### Registros exclusivos de canales

Para filtrar la actividad de los canales (WhatsApp/Telegram/etc.), use:

```bash
openclaw channels logs --channel whatsapp
```

El valor predeterminado de `--channel` es `all`; también están disponibles `--lines <n>`
(valor predeterminado: 200) y `--json`.

## Formatos de registro

### Registros de archivo (JSONL)

Cada línea del archivo de registro es un objeto JSON. La CLI y la interfaz de control analizan estas
entradas para mostrar una salida estructurada (hora, nivel, subsistema y mensaje).

Los registros JSONL de archivo también incluyen campos de nivel superior filtrables por máquina cuando
están disponibles:

- `hostname`: nombre del host del Gateway.
- `message`: texto aplanado del mensaje de registro para búsquedas de texto completo.
- `agent_id`: identificador del agente activo cuando la llamada de registro incluye contexto del agente.
- `session_id`: identificador o clave de la sesión activa cuando la llamada de registro incluye contexto de sesión.
- `channel`: canal activo cuando la llamada de registro incluye contexto del canal.

OpenClaw conserva los argumentos estructurados originales del registro junto con estos campos
para que sigan funcionando los analizadores existentes que leen claves numeradas de argumentos de tslog.

La actividad de conversación, voz en tiempo real y salas administradas emite registros delimitados
del ciclo de vida mediante esta misma canalización de registros de archivo. Estos registros incluyen el tipo de evento,
el modo, el transporte, el proveedor y las mediciones de tamaño y tiempo cuando están disponibles, pero omiten
el texto de la transcripción, las cargas de audio, los identificadores de turno, los identificadores de llamada y los identificadores de elementos del proveedor.

### Salida de consola

Los registros de consola **detectan TTY** y se formatean para facilitar su lectura:

- Prefijos de subsistema (p. ej., `gateway/channels/whatsapp`)
- Colores según el nivel (información/advertencia/error)
- Modo compacto o JSON opcional

El formato de la consola se controla mediante `logging.consoleStyle`.

### Registros WebSocket del Gateway

`openclaw gateway` también ofrece registro del protocolo WebSocket para el tráfico RPC:

- modo normal: solo resultados relevantes (errores, errores de análisis, llamadas lentas)
- `--verbose`: todo el tráfico de solicitudes y respuestas
- `--ws-log auto|compact|full`: selecciona el estilo de presentación detallada
- `--compact`: alias de `--ws-log compact`

Ejemplos:

```bash
openclaw gateway
openclaw gateway --verbose --ws-log compact
openclaw gateway --verbose --ws-log full
```

## Configuración de los registros

Toda la configuración de registros se encuentra bajo `logging` en `~/.openclaw/openclaw.json`.

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

- `logging.level`: nivel de los **registros de archivo** (JSONL) (valor predeterminado: `info`).
- `logging.consoleLevel`: nivel de detalle de la **consola**.

Puede sustituir ambos mediante la variable de entorno **`OPENCLAW_LOG_LEVEL`** (p. ej., `OPENCLAW_LOG_LEVEL=debug`). La variable de entorno tiene prioridad sobre el archivo de configuración, por lo que puede aumentar el nivel de detalle para una sola ejecución sin editar `openclaw.json`. También puede proporcionar la opción global de la CLI **`--log-level <level>`** (por ejemplo, `openclaw --log-level debug gateway run`), que sustituye la variable de entorno para ese comando.

`--verbose` solo afecta a la salida de consola y al nivel de detalle de los registros WS; no modifica
los niveles de los registros de archivo.

### Diagnósticos específicos del transporte del modelo

Al depurar llamadas a proveedores, use indicadores de entorno específicos en lugar de aumentar
todos los registros a `debug`:

```bash
OPENCLAW_DEBUG_MODEL_TRANSPORT=1 openclaw gateway
OPENCLAW_DEBUG_MODEL_PAYLOAD=tools OPENCLAW_DEBUG_SSE=events openclaw gateway
```

Indicadores disponibles:

- `OPENCLAW_DEBUG_MODEL_TRANSPORT=1`: emite el inicio de la solicitud, la respuesta de fetch, los encabezados
  del SDK, el primer evento de transmisión, la finalización del flujo y los errores de transporte con
  nivel `info`.
- `OPENCLAW_DEBUG_MODEL_PAYLOAD=summary`: incluye un resumen delimitado de la carga útil
  de la solicitud en los registros de solicitudes al modelo.
- `OPENCLAW_DEBUG_MODEL_PAYLOAD=tools`: incluye todos los nombres de herramientas visibles para el modelo en
  el resumen de la carga útil.
- `OPENCLAW_DEBUG_MODEL_PAYLOAD=full-redacted`: incluye una instantánea JSON censurada y
  limitada de la carga útil. Úselo solo durante la depuración; los secretos se censuran, pero las instrucciones
  y el texto de los mensajes aún pueden estar presentes.
- `OPENCLAW_DEBUG_SSE=events`: emite los tiempos del primer evento y de finalización del flujo.
- `OPENCLAW_DEBUG_SSE=peek`: también emite las cargas útiles censuradas de los primeros cinco eventos SSE,
  con un límite por evento.
- `OPENCLAW_DEBUG_CODE_MODE=1`: emite diagnósticos de la superficie del modelo en modo de código,
  incluso cuando las herramientas nativas del proveedor están ocultas porque el modo de código controla la
  superficie de herramientas.

Estos indicadores registran mediante el sistema normal de registros de OpenClaw, por lo que `openclaw logs --follow`
y la pestaña Registros de la interfaz de control los muestran. Sin los indicadores, los mismos diagnósticos
siguen disponibles en el nivel `debug`.

Los metadatos de inicio y respuesta de `[model-fetch]` (proveedor, API, modelo, estado,
latencia y campos de la solicitud como método, URL, tiempo de espera, proxy y política)
siempre se emiten con nivel `info`, independientemente de
`OPENCLAW_DEBUG_MODEL_TRANSPORT`, por lo que la higiene básica del transporte del modelo es visible
sin indicadores de depuración.

### Correlación de trazas

Los registros de archivo son JSONL. Cuando una llamada de registro incluye un contexto válido de traza de diagnóstico,
OpenClaw escribe los campos de la traza como claves JSON de nivel superior (`traceId`, `spanId`,
`parentSpanId`, `traceFlags`) para que los procesadores de registros externos puedan correlacionar la línea
con los intervalos de OTEL y la propagación de `traceparent` del proveedor.

Las solicitudes HTTP y las tramas WebSocket del Gateway establecen un ámbito interno de traza de solicitud.
Los registros y eventos de diagnóstico emitidos dentro de ese ámbito asíncrono heredan
la traza de la solicitud cuando no proporcionan un contexto de traza explícito. Las trazas de ejecución del agente y
de llamadas al modelo pasan a ser secundarias respecto de la traza de solicitud activa, por lo que los registros locales,
las instantáneas de diagnóstico, los intervalos de OTEL y los encabezados `traceparent` de proveedores de confianza pueden
vincularse mediante `traceId` sin registrar el contenido sin procesar de la solicitud ni del modelo.

Los registros del ciclo de vida de las conversaciones también se envían a la exportación de registros de diagnostics-otel cuando
está habilitada la exportación de registros de OpenTelemetry, usando los mismos atributos delimitados que los registros de archivo.
Configure `diagnostics.otel.logsExporter` para elegir OTLP, JSONL en stdout o
ambos destinos.

### Tamaño y tiempos de las llamadas al modelo

Los diagnósticos de llamadas al modelo registran mediciones delimitadas de solicitudes y respuestas sin
capturar el contenido sin procesar de las instrucciones ni de las respuestas:

- `requestPayloadBytes`: tamaño en bytes UTF-8 de la carga útil final de la solicitud al modelo
- `responseStreamBytes`: tamaño en bytes UTF-8 de las cargas útiles de los fragmentos de respuesta transmitidos
  del modelo. Los eventos frecuentes de texto, razonamiento y cambios incrementales de llamadas a herramientas cuentan
  únicamente los bytes incrementales de `delta`, en lugar de instantáneas `partial` completas.
- `timeToFirstByteMs`: tiempo transcurrido antes del primer evento de respuesta transmitido
- `durationMs`: duración total de la llamada al modelo

Estos campos están disponibles para las instantáneas de diagnóstico, los enlaces de Plugin de llamadas al modelo y
los intervalos y métricas de llamadas al modelo de OTEL cuando está habilitada la exportación de diagnósticos.

### Estilos de consola

`logging.consoleStyle`:

- `pretty`: fácil de leer, con colores y marcas de tiempo.
- `compact`: salida más concisa (ideal para sesiones largas).
- `json`: un objeto JSON por línea (para procesadores de registros).

### Censura

OpenClaw puede censurar tokens confidenciales antes de que lleguen a la salida de consola, los registros de archivo,
los registros OTLP, el texto persistente de las transcripciones de sesión o las cargas útiles de eventos de herramientas
de la interfaz de control (argumentos de inicio de herramientas, cargas útiles de resultados parciales y finales, salida
derivada de exec y resúmenes de parches):

- `logging.redactSensitive`: `off` | `tools` (valor predeterminado: `tools`)
- `logging.redactPatterns`: lista de cadenas de expresiones regulares que sustituye el conjunto predeterminado para la salida de registros y transcripciones. Para las cargas útiles de herramientas de la interfaz de control, los patrones personalizados se aplican además de los valores predeterminados integrados, por lo que añadir un patrón nunca reduce la censura de los valores que ya detectan los valores predeterminados.

Los registros de archivo y las transcripciones de sesión permanecen en JSONL, pero los valores secretos coincidentes
se enmascaran antes de escribir la línea o el mensaje en el disco. La censura se aplica en la medida de lo posible:
afecta al contenido textual de los mensajes y a las cadenas de registro, no a todos los
identificadores ni a los campos de cargas útiles binarias.

Los valores predeterminados integrados abarcan las credenciales de API habituales y los nombres de campos de credenciales de pago, como el número de tarjeta, CVC/CVV, el token de pago compartido y la credencial de pago, cuando aparecen como campos JSON, parámetros de URL, indicadores de la CLI o asignaciones.

`logging.redactSensitive: "off"` solo desactiva esta política general de registros y transcripciones. OpenClaw sigue ocultando los datos sensibles de las cargas útiles de los límites de seguridad que pueden mostrarse a clientes de la interfaz de usuario, paquetes de soporte, observadores de diagnóstico, solicitudes de aprobación o herramientas del agente. Algunos ejemplos son los eventos de llamadas a herramientas de la interfaz de control, la salida de `sessions_history`, las exportaciones de soporte de diagnóstico, las observaciones de errores del proveedor, la visualización de comandos para la aprobación de ejecución y los registros del protocolo WebSocket del Gateway. Los patrones personalizados de `logging.redactPatterns` pueden seguir añadiendo patrones específicos del proyecto en esas superficies.

## Diagnósticos y OpenTelemetry

Los diagnósticos son eventos estructurados y legibles por máquina para las ejecuciones de modelos y la telemetría del flujo de mensajes (webhooks, colas y estado de la sesión). **No** sustituyen a los registros: alimentan métricas, trazas y exportadores. De forma predeterminada, los eventos se emiten dentro del proceso (establezca `diagnostics.enabled: false` para desactivarlos); su exportación se configura por separado.

Dos superficies relacionadas:

- **Exportación de OpenTelemetry** — envía métricas, trazas y registros mediante OTLP/HTTP a cualquier recopilador o backend compatible con OpenTelemetry (Datadog, Grafana, Honeycomb, New Relic, Tempo, etc.). La configuración completa, el catálogo de señales, los nombres de métricas y tramos, las variables de entorno y el modelo de privacidad se describen en una página específica:
  [Exportación de OpenTelemetry](/es/gateway/opentelemetry).
- **Indicadores de diagnóstico** — indicadores específicos de registro de depuración que envían registros adicionales a `logging.file` sin aumentar `logging.level`. Los indicadores no distinguen entre mayúsculas y minúsculas y admiten comodines (`telegram.*`, `*`). Configúrelos en `diagnostics.flags` o mediante la anulación con la variable de entorno `OPENCLAW_DIAGNOSTICS=...`. Guía completa:
  [Indicadores de diagnóstico](/es/diagnostics/flags).

Para exportar mediante OTLP a un recopilador, consulte [Exportación de OpenTelemetry](/es/gateway/opentelemetry).

## Consejos para solucionar problemas

- **¿No se puede acceder al Gateway?** Ejecute primero `openclaw doctor`.
- **¿Los registros están vacíos?** Compruebe que el Gateway esté en ejecución y escribiendo en la ruta de archivo indicada en `logging.file`.
- **¿Necesita más detalles?** Establezca `logging.level` en `debug` o `trace` y vuelva a intentarlo.

## Contenido relacionado

- [Exportación de OpenTelemetry](/es/gateway/opentelemetry) — exportación mediante OTLP/HTTP, catálogo de métricas y tramos, y modelo de privacidad
- [Indicadores de diagnóstico](/es/diagnostics/flags) — indicadores específicos de registro de depuración
- [Funcionamiento interno de los registros del Gateway](/es/gateway/logging) — estilos de registro de WS, prefijos de subsistemas y captura de la consola
- [Referencia de configuración](/es/gateway/configuration-reference#diagnostics) — referencia completa de los campos `diagnostics.*`

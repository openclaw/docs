---
read_when:
    - Necesitas una descripción general de los registros de OpenClaw apta para principiantes
    - Quieres configurar los niveles de registro, los formatos o la ocultación de datos
    - Está solucionando problemas y necesita encontrar registros rápidamente
summary: Registros de archivo, salida de consola, seguimiento de la CLI y la pestaña Registros de la interfaz de control
title: Registro
x-i18n:
    generated_at: "2026-05-11T20:41:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 49b28755998bbe667dd986ae8440d9006d03b0704679bb6d64b5a148a25fc50e
    source_path: logging.md
    workflow: 16
---

OpenClaw tiene dos superficies de registro principales:

- **Registros de archivo** (líneas JSON) escritos por el Gateway.
- **Salida de consola** mostrada en terminales y en la interfaz de depuración del Gateway.

La pestaña **Registros** de la interfaz de control sigue el registro de archivo del Gateway. Esta página explica dónde
se encuentran los registros, cómo leerlos y cómo configurar niveles y formatos de registro.

## Dónde se encuentran los registros

De forma predeterminada, el Gateway escribe un archivo de registro rotativo en:

`/tmp/openclaw/openclaw-YYYY-MM-DD.log`

La fecha usa la zona horaria local del host del Gateway.

Cada archivo rota cuando alcanza `logging.maxFileBytes` (valor predeterminado: 100 MB).
OpenClaw conserva hasta cinco archivos numerados junto al archivo activo, como
`openclaw-YYYY-MM-DD.1.log`, y sigue escribiendo en un registro activo nuevo en lugar de
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

Usa la CLI para seguir el archivo de registro del Gateway mediante RPC:

```bash
openclaw logs --follow
```

Opciones actuales útiles:

- `--local-time`: muestra las marcas de tiempo en tu zona horaria local
- `--url <url>` / `--token <token>` / `--timeout <ms>`: flags RPC estándar del Gateway
- `--expect-final`: flag de espera de respuesta final RPC respaldada por agente (se acepta aquí mediante la capa de cliente compartida)

Modos de salida:

- **Sesiones TTY**: líneas de registro estructuradas, legibles y coloreadas.
- **Sesiones no TTY**: texto sin formato.
- `--json`: JSON delimitado por líneas (un evento de registro por línea).
- `--plain`: fuerza texto sin formato en sesiones TTY.
- `--no-color`: desactiva los colores ANSI.

Cuando pasas un `--url` explícito, la CLI no aplica automáticamente la configuración ni
las credenciales de entorno; incluye `--token` tú mismo si el Gateway de destino
requiere autenticación.

En modo JSON, la CLI emite objetos etiquetados con `type`:

- `meta`: metadatos de flujo (archivo, cursor, tamaño)
- `log`: entrada de registro analizada
- `notice`: indicios de truncamiento / rotación
- `raw`: línea de registro sin analizar

Si el Gateway local loopback implícito solicita emparejamiento, se cierra durante la conexión
o agota el tiempo de espera antes de que `logs.tail` responda, `openclaw logs` vuelve
automáticamente al registro de archivo del Gateway configurado. Los destinos explícitos con `--url` no usan
esta alternativa.

Si no se puede alcanzar el Gateway, la CLI imprime una breve sugerencia para ejecutar:

```bash
openclaw doctor
```

### Interfaz de control (web)

La pestaña **Registros** de la interfaz de control sigue el mismo archivo usando `logs.tail`.
Consulta [Interfaz de control](/es/web/control-ui) para saber cómo abrirla.

### Registros solo de canal

Para filtrar la actividad de canales (WhatsApp/Telegram/etc), usa:

```bash
openclaw channels logs --channel whatsapp
```

## Formatos de registro

### Registros de archivo (JSONL)

Cada línea del archivo de registro es un objeto JSON. La CLI y la interfaz de control analizan estas
entradas para mostrar salida estructurada (hora, nivel, subsistema, mensaje).

Los registros JSONL del archivo de registro también incluyen campos de nivel superior filtrables por máquina cuando
están disponibles:

- `hostname`: nombre de host del Gateway.
- `message`: texto de mensaje de registro aplanado para búsqueda de texto completo.
- `agent_id`: id del agente activo cuando la llamada de registro lleva contexto de agente.
- `session_id`: id/clave de sesión activa cuando la llamada de registro lleva contexto de sesión.
- `channel`: canal activo cuando la llamada de registro lleva contexto de canal.

OpenClaw conserva los argumentos de registro estructurados originales junto a estos campos
para que los analizadores existentes que leen claves numeradas de argumentos de tslog sigan funcionando.

La actividad de conversación, voz en tiempo real y salas administradas emite registros de ciclo de vida acotados
a través de esta misma canalización de registro de archivo. Estos registros incluyen tipo de evento,
modo, transporte, proveedor y mediciones de tamaño/tiempo cuando están disponibles, pero omiten
texto de transcripción, cargas de audio, ids de turno, ids de llamada e ids de elementos del proveedor.

### Salida de consola

Los registros de consola son **conscientes de TTY** y se formatean para facilitar la lectura:

- Prefijos de subsistema (por ejemplo, `gateway/channels/whatsapp`)
- Coloreado por nivel (info/warn/error)
- Modo compacto o JSON opcional

El formato de consola se controla con `logging.consoleStyle`.

### Registros WebSocket del Gateway

`openclaw gateway` también tiene registro de protocolo WebSocket para tráfico RPC:

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
- `logging.consoleLevel`: nivel de detalle de la **consola**.

Puedes sobrescribir ambos mediante la variable de entorno **`OPENCLAW_LOG_LEVEL`** (por ejemplo, `OPENCLAW_LOG_LEVEL=debug`). La variable de entorno tiene prioridad sobre el archivo de configuración, así que puedes aumentar el nivel de detalle para una sola ejecución sin editar `openclaw.json`. También puedes pasar la opción global de la CLI **`--log-level <level>`** (por ejemplo, `openclaw --log-level debug gateway run`), que sobrescribe la variable de entorno para ese comando.

`--verbose` solo afecta la salida de consola y el nivel de detalle del registro WS; no cambia
los niveles de registro de archivo.

### Diagnósticos dirigidos de transporte de modelo

Al depurar llamadas a proveedores, usa flags de entorno dirigidos en lugar de elevar
todos los registros a `debug`:

```bash
OPENCLAW_DEBUG_MODEL_TRANSPORT=1 openclaw gateway
OPENCLAW_DEBUG_MODEL_PAYLOAD=tools OPENCLAW_DEBUG_SSE=events openclaw gateway
```

Flags disponibles:

- `OPENCLAW_DEBUG_MODEL_TRANSPORT=1`: emite inicio de solicitud, respuesta fetch, encabezados del SDK,
  primer evento de streaming, finalización de stream y errores de transporte en
  nivel `info`.
- `OPENCLAW_DEBUG_MODEL_PAYLOAD=summary`: incluye un resumen acotado de la carga de solicitud
  en los registros de solicitud del modelo.
- `OPENCLAW_DEBUG_MODEL_PAYLOAD=tools`: incluye todos los nombres de herramientas visibles para el modelo en
  el resumen de carga.
- `OPENCLAW_DEBUG_MODEL_PAYLOAD=full-redacted`: incluye una instantánea JSON redactada y limitada
  de la carga. Úsalo solo durante depuración; los secretos se redactan, pero los prompts
  y el texto de mensajes todavía pueden estar presentes.
- `OPENCLAW_DEBUG_SSE=events`: emite tiempos del primer evento y de finalización de stream.
- `OPENCLAW_DEBUG_SSE=peek`: también emite las primeras cinco cargas de eventos SSE redactadas,
  limitadas por evento.
- `OPENCLAW_DEBUG_CODE_MODE=1`: emite diagnósticos de superficie de modelo en modo código,
  incluso cuando las herramientas nativas del proveedor se ocultan porque el modo código posee la
  superficie de herramientas.

Estos flags registran mediante el registro normal de OpenClaw, por lo que `openclaw logs --follow`
y la pestaña Registros de la interfaz de control los muestran. Sin los flags, los mismos diagnósticos
siguen disponibles en nivel `debug`.

### Correlación de trazas

Los registros de archivo son JSONL. Cuando una llamada de registro lleva un contexto de traza de diagnóstico válido,
OpenClaw escribe los campos de traza como claves JSON de nivel superior (`traceId`, `spanId`,
`parentSpanId`, `traceFlags`) para que procesadores de registro externos puedan correlacionar la línea
con spans OTEL y propagación `traceparent` del proveedor.

Las solicitudes HTTP del Gateway y los frames WebSocket del Gateway establecen un ámbito interno de traza de
solicitud. Los registros y eventos de diagnóstico emitidos dentro de ese ámbito asíncrono heredan
la traza de solicitud cuando no pasan un contexto de traza explícito. Las trazas de ejecución de agente y
de llamada a modelo se vuelven hijas de la traza de solicitud activa, por lo que los registros locales,
las instantáneas de diagnóstico, los spans OTEL y los encabezados `traceparent` de proveedores confiables pueden
unirse por `traceId` sin registrar contenido bruto de solicitud o modelo.

Los registros de ciclo de vida de conversación también fluyen a registros OTLP cuando la exportación de registros de OpenTelemetry
está habilitada, usando los mismos atributos acotados que los registros de archivo.

### Tamaño y tiempos de llamadas a modelo

Los diagnósticos de llamadas a modelo registran mediciones acotadas de solicitud/respuesta sin
capturar contenido bruto de prompt o respuesta:

- `requestPayloadBytes`: tamaño en bytes UTF-8 de la carga final de solicitud al modelo
- `responseStreamBytes`: tamaño en bytes UTF-8 de eventos de respuesta del modelo transmitidos
- `timeToFirstByteMs`: tiempo transcurrido antes del primer evento de respuesta transmitido
- `durationMs`: duración total de la llamada al modelo

Estos campos están disponibles para instantáneas de diagnóstico, hooks de Plugin de llamada a modelo y
spans/métricas OTEL de llamada a modelo cuando la exportación de diagnósticos está habilitada.

### Estilos de consola

`logging.consoleStyle`:

- `pretty`: fácil de leer, coloreado, con marcas de tiempo.
- `compact`: salida más ajustada (mejor para sesiones largas).
- `json`: JSON por línea (para procesadores de registros).

### Redacción

OpenClaw puede redactar tokens sensibles antes de que lleguen a la salida de consola, registros de archivo,
registros OTLP, texto de transcripción de sesión persistido o cargas de eventos de herramientas de la interfaz de control
(argumentos de inicio de herramienta, cargas de resultado parcial/final, salida derivada de
exec y resúmenes de parches):

- `logging.redactSensitive`: `off` | `tools` (valor predeterminado: `tools`)
- `logging.redactPatterns`: lista de cadenas regex para sobrescribir el conjunto predeterminado. Los patrones personalizados se aplican además de los valores predeterminados integrados para cargas de herramientas de la interfaz de control, así que añadir un patrón nunca debilita la redacción de valores ya detectados por los valores predeterminados.

Los registros de archivo y las transcripciones de sesión siguen siendo JSONL, pero los valores secretos coincidentes se
enmascaran antes de que la línea o el mensaje se escriba en disco. La redacción es de mejor esfuerzo:
se aplica al contenido de mensajes con texto y a cadenas de registro, no a todos los
identificadores o campos de carga binaria.

Los valores predeterminados integrados cubren credenciales de API comunes y nombres de campos de credenciales de pago
como número de tarjeta, CVC/CVV, token de pago compartido y credencial de pago
cuando aparecen como campos JSON, parámetros de URL, flags de CLI o asignaciones.

`logging.redactSensitive: "off"` solo desactiva esta política general de registro/transcripción.
OpenClaw sigue redactando cargas de límite de seguridad que pueden mostrarse a clientes de UI,
paquetes de soporte, observadores de diagnóstico, prompts de aprobación o herramientas de agente.
Entre los ejemplos se incluyen eventos de llamada de herramienta de la interfaz de control, salida de `sessions_history`,
exportaciones de soporte de diagnóstico, observaciones de errores de proveedor, visualización de comando de aprobación de exec
y registros de protocolo WebSocket del Gateway. Los `logging.redactPatterns` personalizados
todavía pueden añadir patrones específicos del proyecto en esas superficies.

## Diagnósticos y OpenTelemetry

Los diagnósticos son eventos estructurados y legibles por máquina para ejecuciones de modelo y
telemetría de flujo de mensajes (webhooks, encolado, estado de sesión). **No**
reemplazan los registros: alimentan métricas, trazas y exportadores. Los eventos se emiten
en proceso, los exportes o no.

Dos superficies adyacentes:

- **Exportación de OpenTelemetry** — envía métricas, trazas y registros por OTLP/HTTP a
  cualquier colector o backend compatible con OpenTelemetry (Grafana, Datadog,
  Honeycomb, New Relic, Tempo, etc.). La configuración completa, el catálogo de señales,
  nombres de métricas/spans, variables de entorno y modelo de privacidad viven en una página dedicada:
  [Exportación de OpenTelemetry](/es/gateway/opentelemetry).
- **Flags de diagnóstico** — flags de registro de depuración dirigidos que enrutan registros extra a
  `logging.file` sin elevar `logging.level`. Los flags no distinguen mayúsculas y minúsculas
  y admiten comodines (`telegram.*`, `*`). Configúralos bajo `diagnostics.flags`
  o mediante la sobrescritura de entorno `OPENCLAW_DIAGNOSTICS=...`. Guía completa:
  [Flags de diagnóstico](/es/diagnostics/flags).

Para habilitar eventos de diagnóstico para plugins o sumideros personalizados sin exportación OTLP:

```json5
{
  diagnostics: { enabled: true },
}
```

Para exportación OTLP a un colector, consulta [Exportación de OpenTelemetry](/es/gateway/opentelemetry).

## Consejos de resolución de problemas

- **¿Gateway no alcanzable?** Ejecuta primero `openclaw doctor`.
- **¿Registros vacíos?** Comprueba que el Gateway esté en ejecución y escribiendo en la ruta de archivo
  en `logging.file`.
- **¿Necesitas más detalle?** Establece `logging.level` en `debug` o `trace` y vuelve a intentarlo.

## Relacionado

- [Exportación de OpenTelemetry](/es/gateway/opentelemetry) — exportación OTLP/HTTP, catálogo de métricas/spans, modelo de privacidad
- [Flags de diagnóstico](/es/diagnostics/flags) — flags de registro de depuración dirigidos
- [Internos de registro del Gateway](/es/gateway/logging) — estilos de registro WS, prefijos de subsistema y captura de consola
- [Referencia de configuración](/es/gateway/configuration-reference#diagnostics) — referencia completa de campos `diagnostics.*`

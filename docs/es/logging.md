---
read_when:
    - Necesitas una descripción general de los registros de OpenClaw apta para principiantes
    - Quieres configurar niveles de registro, formatos o redacción
    - Estás solucionando problemas y necesitas encontrar registros rápidamente
summary: Archivos de registro, salida de consola, seguimiento de la CLI y la pestaña Registros de la interfaz de usuario de Control
title: Registro
x-i18n:
    generated_at: "2026-06-27T11:50:50Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: caf2780dfeeaf29f4ee94429894a03422b211a4414e63062642d1134f38b6b3f
    source_path: logging.md
    workflow: 16
---

OpenClaw tiene dos superficies principales de registro:

- **Registros de archivo** (líneas JSON) escritos por el Gateway.
- **Salida de consola** mostrada en terminales y en la interfaz de depuración del Gateway.

La pestaña **Registros** de la interfaz de control sigue el archivo de registro del Gateway. Esta página explica dónde
se alojan los registros, cómo leerlos y cómo configurar los niveles y formatos de registro.

## Dónde se alojan los registros

De forma predeterminada, el Gateway escribe un archivo de registro rotativo en:

`/tmp/openclaw/openclaw-YYYY-MM-DD.log`

La fecha usa la zona horaria local del host del Gateway.

Cada archivo rota cuando alcanza `logging.maxFileBytes` (predeterminado: 100 MB).
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

- `--local-time`: mostrar marcas de tiempo en tu zona horaria local
- `--url <url>` / `--token <token>` / `--timeout <ms>`: flags estándar de RPC del Gateway
- `--expect-final`: flag de espera de respuesta final de RPC respaldada por agente (aceptada aquí mediante la capa de cliente compartida)

Modos de salida:

- **Sesiones TTY**: líneas de registro estructuradas, bonitas y con color.
- **Sesiones no TTY**: texto plano.
- `--json`: JSON delimitado por líneas (un evento de registro por línea).
- `--plain`: forzar texto plano en sesiones TTY.
- `--no-color`: desactivar colores ANSI.

Cuando pasas un `--url` explícito, la CLI no aplica automáticamente la configuración ni
las credenciales de entorno; incluye tú mismo `--token` si el Gateway de destino
requiere autenticación.

En modo JSON, la CLI emite objetos etiquetados por `type`:

- `meta`: metadatos del flujo (archivo, cursor, tamaño)
- `log`: entrada de registro analizada
- `notice`: indicios de truncamiento / rotación
- `raw`: línea de registro sin analizar

Si el Gateway de local loopback implícito solicita emparejamiento, se cierra durante la conexión,
o agota el tiempo de espera antes de que `logs.tail` responda, `openclaw logs` recurre automáticamente al
archivo de registro configurado del Gateway. Los destinos `--url` explícitos no usan
esta alternativa. `openclaw logs --follow` es más estricto: en Linux usa el diario de Gateway
user-systemd activo por PID cuando está disponible y, si no, sigue reintentando
el Gateway en vivo en lugar de seguir un archivo paralelo potencialmente obsoleto.

Si no se puede acceder al Gateway, la CLI imprime una indicación breve para ejecutar:

```bash
openclaw doctor
```

### Interfaz de control (web)

La pestaña **Registros** de la interfaz de control sigue el mismo archivo usando `logs.tail`.
Consulta [Interfaz de control](/es/web/control-ui) para saber cómo abrirla.

### Registros solo de canal

Para filtrar la actividad de canales (WhatsApp/Telegram/etc.), usa:

```bash
openclaw channels logs --channel whatsapp
```

## Formatos de registro

### Registros de archivo (JSONL)

Cada línea del archivo de registro es un objeto JSON. La CLI y la interfaz de control analizan estas
entradas para mostrar salida estructurada (hora, nivel, subsistema, mensaje).

Los registros JSONL de archivo también incluyen campos de nivel superior filtrables por máquina cuando
están disponibles:

- `hostname`: nombre de host del Gateway.
- `message`: texto del mensaje de registro aplanado para búsqueda de texto completo.
- `agent_id`: id del agente activo cuando la llamada de registro lleva contexto de agente.
- `session_id`: id/clave de sesión activa cuando la llamada de registro lleva contexto de sesión.
- `channel`: canal activo cuando la llamada de registro lleva contexto de canal.

OpenClaw conserva los argumentos estructurados originales del registro junto con estos campos
para que los analizadores existentes que leen claves de argumentos numeradas de tslog sigan funcionando.

La actividad de conversación, voz en tiempo real y salas administradas emite registros acotados de ciclo de vida
a través de esta misma canalización de registros de archivo. Estos registros incluyen tipo de evento,
modo, transporte, proveedor y mediciones de tamaño/tiempo cuando están disponibles, pero omiten
texto de transcripción, cargas de audio, ids de turno, ids de llamada e ids de elementos del proveedor.

### Salida de consola

Los registros de consola son **conscientes de TTY** y se formatean para facilitar la lectura:

- Prefijos de subsistema (p. ej., `gateway/channels/whatsapp`)
- Coloración por nivel (info/warn/error)
- Modo compacto o JSON opcional

El formato de consola se controla con `logging.consoleStyle`.

### Registros WebSocket del Gateway

`openclaw gateway` también tiene registro del protocolo WebSocket para tráfico RPC:

- modo normal: solo resultados relevantes (errores, errores de análisis, llamadas lentas)
- `--verbose`: todo el tráfico de solicitud/respuesta
- `--ws-log auto|compact|full`: elegir el estilo de renderizado detallado
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
- `logging.consoleLevel`: nivel de verbosidad de la **consola**.

Puedes sobrescribir ambos mediante la variable de entorno **`OPENCLAW_LOG_LEVEL`** (p. ej., `OPENCLAW_LOG_LEVEL=debug`). La variable de entorno tiene precedencia sobre el archivo de configuración, así que puedes aumentar la verbosidad para una sola ejecución sin editar `openclaw.json`. También puedes pasar la opción global de la CLI **`--log-level <level>`** (por ejemplo, `openclaw --log-level debug gateway run`), que sobrescribe la variable de entorno para ese comando.

`--verbose` solo afecta la salida de consola y la verbosidad del registro WS; no cambia
los niveles de registro de archivo.

### Diagnósticos dirigidos de transporte de modelo

Al depurar llamadas a proveedores, usa flags de entorno dirigidos en lugar de elevar
todos los registros a `debug`:

```bash
OPENCLAW_DEBUG_MODEL_TRANSPORT=1 openclaw gateway
OPENCLAW_DEBUG_MODEL_PAYLOAD=tools OPENCLAW_DEBUG_SSE=events openclaw gateway
```

Flags disponibles:

- `OPENCLAW_DEBUG_MODEL_TRANSPORT=1`: emitir inicio de solicitud, respuesta de fetch, encabezados del SDK,
  primer evento de streaming, finalización del flujo y errores de transporte en
  nivel `info`.
- `OPENCLAW_DEBUG_MODEL_PAYLOAD=summary`: incluir un resumen acotado de la carga de solicitud
  en los registros de solicitud del modelo.
- `OPENCLAW_DEBUG_MODEL_PAYLOAD=tools`: incluir todos los nombres de herramientas orientadas al modelo en
  el resumen de la carga.
- `OPENCLAW_DEBUG_MODEL_PAYLOAD=full-redacted`: incluir una instantánea JSON redactada y limitada
  de la carga. Úsalo solo durante la depuración; los secretos se redactan, pero los prompts
  y el texto de mensajes aún pueden estar presentes.
- `OPENCLAW_DEBUG_SSE=events`: emitir temporización del primer evento y de finalización del flujo.
- `OPENCLAW_DEBUG_SSE=peek`: emitir también las cargas de los primeros cinco eventos SSE redactados,
  limitadas por evento.
- `OPENCLAW_DEBUG_CODE_MODE=1`: emitir diagnósticos de superficie de modelo en modo código,
  incluso cuando las herramientas nativas del proveedor se ocultan porque el modo código posee la
  superficie de herramientas.

Estos flags registran mediante el registro normal de OpenClaw, por lo que `openclaw logs --follow`
y la pestaña Registros de la interfaz de control los muestran. Sin los flags, los mismos diagnósticos
siguen disponibles en nivel `debug`.

Los metadatos de inicio y respuesta de `[model-fetch]` (proveedor, API, modelo, estado,
latencia y campos de solicitud como método, URL, tiempo de espera, proxy y política)
siempre se emiten en nivel `info` independientemente de
`OPENCLAW_DEBUG_MODEL_TRANSPORT`, por lo que la higiene básica del transporte de modelo es visible
sin flags de depuración.

### Correlación de trazas

Los registros de archivo son JSONL. Cuando una llamada de registro lleva un contexto válido de traza diagnóstica,
OpenClaw escribe los campos de traza como claves JSON de nivel superior (`traceId`, `spanId`,
`parentSpanId`, `traceFlags`) para que los procesadores externos de registros puedan correlacionar la línea
con spans OTEL y propagación `traceparent` del proveedor.

Las solicitudes HTTP del Gateway y los frames WebSocket del Gateway establecen un alcance interno de traza
de solicitud. Los registros y eventos de diagnóstico emitidos dentro de ese alcance asíncrono heredan
la traza de solicitud cuando no pasan un contexto de traza explícito. Las trazas de ejecución de agente y
de llamada de modelo se vuelven hijas de la traza de solicitud activa, de modo que los registros locales,
las instantáneas de diagnóstico, los spans OTEL y los encabezados `traceparent` de proveedores confiables pueden
unirse por `traceId` sin registrar contenido sin procesar de solicitud o de modelo.

Los registros de ciclo de vida de conversación también fluyen a la exportación de registros diagnostics-otel cuando
la exportación de registros de OpenTelemetry está habilitada, usando los mismos atributos acotados que los registros de archivo.
Configura `diagnostics.otel.logsExporter` para elegir OTLP, stdout JSONL o
ambos destinos.

### Tamaño y temporización de llamadas de modelo

Los diagnósticos de llamadas de modelo registran mediciones acotadas de solicitud/respuesta sin
capturar contenido sin procesar de prompt o respuesta:

- `requestPayloadBytes`: tamaño en bytes UTF-8 de la carga final de solicitud del modelo
- `responseStreamBytes`: tamaño en bytes UTF-8 de las cargas de fragmentos de respuesta de modelo en streaming.
  Los eventos de texto de alta frecuencia, pensamiento y deltas de llamada de herramienta cuentan
  solo los bytes incrementales de `delta` en lugar de instantáneas completas de `partial`.
- `timeToFirstByteMs`: tiempo transcurrido antes del primer evento de respuesta en streaming
- `durationMs`: duración total de la llamada de modelo

Estos campos están disponibles para instantáneas de diagnóstico, hooks de Plugin de llamada de modelo y
spans/métricas OTEL de llamada de modelo cuando la exportación de diagnósticos está habilitada.

### Estilos de consola

`logging.consoleStyle`:

- `pretty`: legible para humanos, con color y marcas de tiempo.
- `compact`: salida más ajustada (mejor para sesiones largas).
- `json`: JSON por línea (para procesadores de registros).

### Redacción

OpenClaw puede redactar tokens sensibles antes de que lleguen a la salida de consola, registros de archivo,
registros de log OTLP, texto persistido de transcripción de sesión o cargas de eventos de herramientas de la interfaz de control
(argumentos de inicio de herramienta, cargas de resultado parcial/final, salida de exec derivada
y resúmenes de parches):

- `logging.redactSensitive`: `off` | `tools` (predeterminado: `tools`)
- `logging.redactPatterns`: lista de cadenas regex para sobrescribir el conjunto predeterminado. Los patrones personalizados se aplican encima de los valores predeterminados integrados para cargas de herramientas de la interfaz de control, así que agregar un patrón nunca debilita la redacción de valores ya capturados por los valores predeterminados.

Los registros de archivo y las transcripciones de sesión siguen siendo JSONL, pero los valores secretos coincidentes se
enmascaran antes de que la línea o el mensaje se escriba en disco. La redacción es de mejor esfuerzo:
se aplica al contenido de mensajes con texto y a cadenas de registro, no a todos los
identificadores ni campos de carga binaria.

Los valores predeterminados integrados cubren credenciales de API comunes y nombres de campos de credenciales de pago
como número de tarjeta, CVC/CVV, token de pago compartido y credencial de pago
cuando aparecen como campos JSON, parámetros de URL, flags de CLI o asignaciones.

`logging.redactSensitive: "off"` solo desactiva esta política general de registros/transcripciones.
OpenClaw todavía redacta cargas de frontera de seguridad que pueden mostrarse a clientes de UI,
paquetes de soporte, observadores de diagnóstico, prompts de aprobación o herramientas de agente.
Los ejemplos incluyen eventos de llamada de herramienta de la interfaz de control, salida de `sessions_history`,
exportaciones de soporte de diagnóstico, observaciones de error de proveedor, visualización de comando de aprobación de exec
y registros de protocolo WebSocket del Gateway. `logging.redactPatterns` personalizados
todavía pueden agregar patrones específicos del proyecto en esas superficies.

## Diagnósticos y OpenTelemetry

Los diagnósticos son eventos estructurados y legibles por máquina para ejecuciones de modelo y
telemetría de flujo de mensajes (webhooks, colas, estado de sesión). **No**
reemplazan los registros: alimentan métricas, trazas y exportadores. Los eventos se emiten
en el proceso exportes o no los exportes.

Dos superficies adyacentes:

- **Exportación de OpenTelemetry** — enviar métricas, trazas y registros por OTLP/HTTP a
  cualquier colector o backend compatible con OpenTelemetry (Grafana, Datadog,
  Honeycomb, New Relic, Tempo, etc.). La configuración completa, el catálogo de señales,
  los nombres de métricas/spans, las variables de entorno y el modelo de privacidad viven en una página dedicada:
  [Exportación de OpenTelemetry](/es/gateway/opentelemetry).
- **Flags de diagnóstico** — flags dirigidos de registro de depuración que enrutan registros adicionales a
  `logging.file` sin aumentar `logging.level`. Los flags no distinguen mayúsculas y minúsculas
  y admiten comodines (`telegram.*`, `*`). Configura bajo `diagnostics.flags`
  o mediante la sobrescritura de entorno `OPENCLAW_DIAGNOSTICS=...`. Guía completa:
  [Flags de diagnóstico](/es/diagnostics/flags).

Para habilitar eventos de diagnóstico para plugins o destinos personalizados sin exportación OTLP:

```json5
{
  diagnostics: { enabled: true },
}
```

Para exportar OTLP a un collector, consulta [exportación de OpenTelemetry](/es/gateway/opentelemetry).

## Consejos de solución de problemas

- **¿Gateway no está accesible?** Ejecuta `openclaw doctor` primero.
- **¿Los registros están vacíos?** Comprueba que Gateway se esté ejecutando y escribiendo en la ruta de archivo
  en `logging.file`.
- **¿Necesitas más detalle?** Establece `logging.level` en `debug` o `trace` y vuelve a intentarlo.

## Relacionado

- [Exportación de OpenTelemetry](/es/gateway/opentelemetry) — exportación OTLP/HTTP, catálogo de métricas/spans, modelo de privacidad
- [Indicadores de diagnóstico](/es/diagnostics/flags) — indicadores de registro de depuración específicos
- [Aspectos internos del logging de Gateway](/es/gateway/logging) — estilos de registro WS, prefijos de subsistemas y captura de consola
- [Referencia de configuración](/es/gateway/configuration-reference#diagnostics) — referencia completa de campos `diagnostics.*`

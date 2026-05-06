---
read_when:
    - Necesitas una descripción general de los registros de OpenClaw apta para principiantes
    - Quieres configurar los niveles de registro, los formatos o el enmascaramiento
    - Estás solucionando problemas y necesitas encontrar registros rápidamente
summary: Registros en archivos, salida de consola, seguimiento de CLI y pestaña Registros de la interfaz de control
title: Registro
x-i18n:
    generated_at: "2026-05-06T17:58:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 218f68c5111b6de01dc14707dad132d15d5e78c8e906af8a5416e618807663ac
    source_path: logging.md
    workflow: 16
---

OpenClaw tiene dos superficies principales de registro:

- **Registros de archivo** (líneas JSON) escritos por el Gateway.
- **Salida de consola** mostrada en terminales y en la interfaz de depuración del Gateway.

La pestaña **Registros** de la interfaz de control sigue el registro de archivo del Gateway. Esta página explica dónde
se encuentran los registros, cómo leerlos y cómo configurar los niveles y formatos de registro.

## Dónde se encuentran los registros

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

- `--local-time`: muestra las marcas de tiempo en tu zona horaria local
- `--url <url>` / `--token <token>` / `--timeout <ms>`: flags estándar de RPC del Gateway
- `--expect-final`: flag de espera de respuesta final de RPC respaldada por agente (aceptado aquí mediante la capa de cliente compartida)

Modos de salida:

- **Sesiones TTY**: líneas de registro estructuradas, bonitas y coloreadas.
- **Sesiones no TTY**: texto sin formato.
- `--json`: JSON delimitado por líneas (un evento de registro por línea).
- `--plain`: fuerza texto sin formato en sesiones TTY.
- `--no-color`: desactiva los colores ANSI.

Cuando pasas un `--url` explícito, la CLI no aplica automáticamente credenciales de configuración ni de
entorno; incluye `--token` tú mismo si el Gateway de destino
requiere autenticación.

En modo JSON, la CLI emite objetos etiquetados con `type`:

- `meta`: metadatos del flujo (archivo, cursor, tamaño)
- `log`: entrada de registro analizada
- `notice`: indicios de truncamiento / rotación
- `raw`: línea de registro sin analizar

Si el Gateway implícito de local loopback solicita emparejamiento, se cierra durante la conexión
o agota el tiempo de espera antes de que `logs.tail` responda, `openclaw logs` vuelve automáticamente al
archivo de registro del Gateway configurado. Los destinos `--url` explícitos no usan
esta alternativa.

Si el Gateway no es accesible, la CLI imprime una breve sugerencia para ejecutar:

```bash
openclaw doctor
```

### Interfaz de control (web)

La pestaña **Registros** de la interfaz de control sigue el mismo archivo mediante `logs.tail`.
Consulta [interfaz de control](/es/web/control-ui) para saber cómo abrirla.

### Registros solo de canal

Para filtrar la actividad de canales (WhatsApp/Telegram/etc), usa:

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

OpenClaw conserva los argumentos de registro estructurados originales junto a estos campos
para que los analizadores existentes que leen claves numeradas de argumentos de tslog sigan funcionando.

La actividad de conversación, voz en tiempo real y salas administradas emite registros acotados de ciclo de vida
mediante esta misma canalización de registros de archivo. Estos registros incluyen tipo de evento,
modo, transporte, proveedor y mediciones de tamaño/tiempo cuando están disponibles, pero omiten
texto de transcripción, cargas de audio, ids de turno, ids de llamada e ids de elementos del proveedor.

### Salida de consola

Los registros de consola son **conscientes de TTY** y están formateados para facilitar la lectura:

- Prefijos de subsistema (por ejemplo, `gateway/channels/whatsapp`)
- Coloreado por nivel (info/warn/error)
- Modo compacto o JSON opcional

El formato de consola se controla con `logging.consoleStyle`.

### Registros WebSocket del Gateway

`openclaw gateway` también tiene registro de protocolo WebSocket para tráfico RPC:

- modo normal: solo resultados interesantes (errores, errores de análisis, llamadas lentas)
- `--verbose`: todo el tráfico de solicitudes/respuestas
- `--ws-log auto|compact|full`: elige el estilo de representación detallada
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

Puedes sobrescribir ambos mediante la variable de entorno **`OPENCLAW_LOG_LEVEL`** (por ejemplo, `OPENCLAW_LOG_LEVEL=debug`). La variable de entorno tiene prioridad sobre el archivo de configuración, de modo que puedes aumentar la verbosidad para una sola ejecución sin editar `openclaw.json`. También puedes pasar la opción global de la CLI **`--log-level <level>`** (por ejemplo, `openclaw --log-level debug gateway run`), que sobrescribe la variable de entorno para ese comando.

`--verbose` solo afecta la salida de consola y la verbosidad del registro WS; no cambia
los niveles de registro de archivo.

### Correlación de trazas

Los registros de archivo son JSONL. Cuando una llamada de registro lleva un contexto de traza de diagnóstico válido,
OpenClaw escribe los campos de traza como claves JSON de nivel superior (`traceId`, `spanId`,
`parentSpanId`, `traceFlags`) para que los procesadores de registros externos puedan correlacionar la línea
con spans de OTEL y propagación `traceparent` del proveedor.

Las solicitudes HTTP del Gateway y los frames WebSocket del Gateway establecen un ámbito interno de traza
de solicitud. Los registros y eventos de diagnóstico emitidos dentro de ese ámbito asíncrono heredan
la traza de solicitud cuando no pasan un contexto de traza explícito. Las trazas de ejecución de agente y
llamada de modelo se convierten en hijas de la traza de solicitud activa, de modo que los registros locales,
instantáneas de diagnóstico, spans de OTEL y encabezados `traceparent` de proveedores confiables pueden
unirse mediante `traceId` sin registrar la solicitud sin procesar ni el contenido del modelo.

Los registros de ciclo de vida de conversación también fluyen a registros OTLP cuando la exportación de registros de OpenTelemetry
está habilitada, usando los mismos atributos acotados que los registros de archivo.

### Tamaño y tiempos de llamada de modelo

Los diagnósticos de llamada de modelo registran mediciones acotadas de solicitud/respuesta sin
capturar el contenido sin procesar del prompt o de la respuesta:

- `requestPayloadBytes`: tamaño en bytes UTF-8 de la carga final de solicitud al modelo
- `responseStreamBytes`: tamaño en bytes UTF-8 de eventos de respuesta del modelo transmitidos
- `timeToFirstByteMs`: tiempo transcurrido antes del primer evento de respuesta transmitido
- `durationMs`: duración total de la llamada al modelo

Estos campos están disponibles para instantáneas de diagnóstico, hooks de Plugin de llamada de modelo y
spans/métricas de llamada de modelo de OTEL cuando la exportación de diagnósticos está habilitada.

### Estilos de consola

`logging.consoleStyle`:

- `pretty`: legible para humanos, coloreado, con marcas de tiempo.
- `compact`: salida más ajustada (mejor para sesiones largas).
- `json`: JSON por línea (para procesadores de registros).

### Redacción

OpenClaw puede redactar tokens sensibles antes de que lleguen a la salida de consola, registros de archivo,
registros OTLP, texto de transcripción de sesión persistido o cargas de eventos de herramientas de la
interfaz de control (argumentos de inicio de herramienta, cargas de resultados parciales/finales, salida
exec derivada y resúmenes de parches):

- `logging.redactSensitive`: `off` | `tools` (predeterminado: `tools`)
- `logging.redactPatterns`: lista de cadenas regex para sobrescribir el conjunto predeterminado. Los patrones personalizados se aplican encima de los valores predeterminados integrados para cargas de herramientas de la interfaz de control, de modo que añadir un patrón nunca debilita la redacción de valores ya capturados por los valores predeterminados.

Los registros de archivo y las transcripciones de sesión permanecen como JSONL, pero los valores secretos coincidentes se
enmascaran antes de que la línea o el mensaje se escriba en disco. La redacción es de mejor esfuerzo:
se aplica al contenido de mensajes con texto y a cadenas de registro, no a todos los
identificadores ni campos de carga binaria.

Los valores predeterminados integrados cubren credenciales comunes de API y nombres de campos de credenciales de pago
como número de tarjeta, CVC/CVV, token de pago compartido y credencial de pago
cuando aparecen como campos JSON, parámetros de URL, flags de CLI o asignaciones.

`logging.redactSensitive: "off"` solo desactiva esta política general de registros/transcripciones.
OpenClaw sigue redactando cargas de límite de seguridad que pueden mostrarse a clientes de UI,
paquetes de soporte, observadores de diagnóstico, prompts de aprobación o herramientas de agente.
Algunos ejemplos incluyen eventos de llamadas de herramientas de la interfaz de control, salida de `sessions_history`,
exportaciones de soporte de diagnóstico, observaciones de errores de proveedor, visualización de comandos de aprobación de exec
y registros de protocolo WebSocket del Gateway. `logging.redactPatterns` personalizados
aún pueden añadir patrones específicos del proyecto en esas superficies.

## Diagnósticos y OpenTelemetry

Los diagnósticos son eventos estructurados y legibles por máquina para ejecuciones de modelo y
telemetría de flujo de mensajes (webhooks, encolado, estado de sesión). **No**
reemplazan los registros: alimentan métricas, trazas y exportadores. Los eventos se emiten
en el proceso tanto si los exportas como si no.

Dos superficies adyacentes:

- **Exportación de OpenTelemetry** — envía métricas, trazas y registros por OTLP/HTTP a
  cualquier recopilador o backend compatible con OpenTelemetry (Grafana, Datadog,
  Honeycomb, New Relic, Tempo, etc.). La configuración completa, el catálogo de señales,
  nombres de métricas/spans, variables de entorno y modelo de privacidad viven en una página dedicada:
  [exportación de OpenTelemetry](/es/gateway/opentelemetry).
- **Flags de diagnóstico** — flags de registro de depuración dirigidos que enrutan registros adicionales a
  `logging.file` sin aumentar `logging.level`. Los flags no distinguen mayúsculas de minúsculas
  y admiten comodines (`telegram.*`, `*`). Configúralos bajo `diagnostics.flags`
  o mediante la sobrescritura de entorno `OPENCLAW_DIAGNOSTICS=...`. Guía completa:
  [flags de diagnóstico](/es/diagnostics/flags).

Para habilitar eventos de diagnóstico para plugins o destinos personalizados sin exportación OTLP:

```json5
{
  diagnostics: { enabled: true },
}
```

Para exportación OTLP a un recopilador, consulta [exportación de OpenTelemetry](/es/gateway/opentelemetry).

## Consejos de solución de problemas

- **¿No se puede acceder al Gateway?** Ejecuta `openclaw doctor` primero.
- **¿Los registros están vacíos?** Comprueba que el Gateway esté ejecutándose y escribiendo en la ruta de archivo
  en `logging.file`.
- **¿Necesitas más detalle?** Establece `logging.level` en `debug` o `trace` y vuelve a intentarlo.

## Relacionado

- [Exportación de OpenTelemetry](/es/gateway/opentelemetry) — exportación OTLP/HTTP, catálogo de métricas/spans, modelo de privacidad
- [Flags de diagnóstico](/es/diagnostics/flags) — flags de registro de depuración dirigidos
- [Internos de registro del Gateway](/es/gateway/logging) — estilos de registro WS, prefijos de subsistema y captura de consola
- [Referencia de configuración](/es/gateway/configuration-reference#diagnostics) — referencia completa de campos `diagnostics.*`

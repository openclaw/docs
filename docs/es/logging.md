---
read_when:
    - Necesitas una descripción general apta para principiantes sobre los registros de OpenClaw
    - Quieres configurar niveles de registro, formatos o enmascaramiento
    - Está solucionando problemas y necesita encontrar registros rápidamente
summary: Registros de archivo, salida de consola, seguimiento de CLI y la pestaña Registros de la interfaz de control
title: Registro
x-i18n:
    generated_at: "2026-05-02T05:30:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: d41ce5b1ae30fe1ca65577abe387fc266bd281686acb10098f82b8e78dfaa357
    source_path: logging.md
    workflow: 16
---

OpenClaw tiene dos superficies principales de registro:

- **Registros de archivo** (líneas JSON) escritos por el Gateway.
- **Salida de consola** mostrada en terminales y en la UI de depuración del Gateway.

La pestaña **Registros** de Control UI sigue el registro de archivo del gateway. Esta página explica dónde
se almacenan los registros, cómo leerlos y cómo configurar niveles y formatos de registro.

## Dónde se almacenan los registros

De forma predeterminada, el Gateway escribe un archivo de registro rotativo en:

`/tmp/openclaw/openclaw-YYYY-MM-DD.log`

La fecha usa la zona horaria local del host del gateway.

Cada archivo rota cuando alcanza `logging.maxFileBytes` (valor predeterminado: 100 MB).
OpenClaw conserva hasta cinco archivos numerados junto al archivo activo, como
`openclaw-YYYY-MM-DD.1.log`, y sigue escribiendo en un nuevo registro activo en lugar de
suprimir los diagnósticos.

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

- `--local-time`: renderiza las marcas de tiempo en tu zona horaria local
- `--url <url>` / `--token <token>` / `--timeout <ms>`: indicadores RPC estándar del Gateway
- `--expect-final`: indicador de espera de respuesta final RPC respaldada por agente (aceptado aquí mediante la capa de cliente compartida)

Modos de salida:

- **Sesiones TTY**: líneas de registro estructuradas, bonitas y coloreadas.
- **Sesiones no TTY**: texto sin formato.
- `--json`: JSON delimitado por líneas (un evento de registro por línea).
- `--plain`: fuerza texto sin formato en sesiones TTY.
- `--no-color`: deshabilita los colores ANSI.

Cuando pasas un `--url` explícito, la CLI no aplica automáticamente la configuración ni
las credenciales del entorno; incluye `--token` tú mismo si el Gateway de destino
requiere autenticación.

En modo JSON, la CLI emite objetos etiquetados con `type`:

- `meta`: metadatos del flujo (archivo, cursor, tamaño)
- `log`: entrada de registro analizada
- `notice`: indicios de truncamiento / rotación
- `raw`: línea de registro sin analizar

Si el Gateway local loopback implícito solicita emparejamiento, se cierra durante la conexión
o agota el tiempo de espera antes de que `logs.tail` responda, `openclaw logs` recurre
automáticamente al registro de archivo del Gateway configurado. Los destinos `--url` explícitos no usan
esta alternativa.

Si no se puede acceder al Gateway, la CLI muestra una breve sugerencia para ejecutar:

```bash
openclaw doctor
```

### Control UI (web)

La pestaña **Registros** de Control UI sigue el mismo archivo usando `logs.tail`.
Consulta [/web/control-ui](/es/web/control-ui) para saber cómo abrirla.

### Registros solo de canal

Para filtrar actividad de canales (WhatsApp/Telegram/etc.), usa:

```bash
openclaw channels logs --channel whatsapp
```

## Formatos de registro

### Registros de archivo (JSONL)

Cada línea del archivo de registro es un objeto JSON. La CLI y Control UI analizan estas
entradas para renderizar salida estructurada (hora, nivel, subsistema, mensaje).

Los registros JSONL de archivo también incluyen campos de nivel superior filtrables por máquina cuando
están disponibles:

- `hostname`: nombre de host del gateway.
- `message`: texto del mensaje de registro aplanado para búsqueda de texto completo.
- `agent_id`: id del agente activo cuando la llamada de registro lleva contexto de agente.
- `session_id`: id/clave de sesión activa cuando la llamada de registro lleva contexto de sesión.
- `channel`: canal activo cuando la llamada de registro lleva contexto de canal.

OpenClaw conserva los argumentos originales de registro estructurado junto a estos campos
para que los analizadores existentes que leen claves numeradas de argumentos tslog sigan funcionando.

### Salida de consola

Los registros de consola son **conscientes de TTY** y se formatean para facilitar la lectura:

- Prefijos de subsistema (p. ej., `gateway/channels/whatsapp`)
- Coloreado por nivel (info/warn/error)
- Modo compacto o JSON opcional

El formato de consola se controla mediante `logging.consoleStyle`.

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

## Configurar registros

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

Puedes sobrescribir ambos mediante la variable de entorno **`OPENCLAW_LOG_LEVEL`** (p. ej., `OPENCLAW_LOG_LEVEL=debug`). La variable de entorno tiene prioridad sobre el archivo de configuración, así que puedes aumentar la verbosidad para una sola ejecución sin editar `openclaw.json`. También puedes pasar la opción global de la CLI **`--log-level <level>`** (por ejemplo, `openclaw --log-level debug gateway run`), que sobrescribe la variable de entorno para ese comando.

`--verbose` solo afecta la salida de consola y la verbosidad del registro WS; no cambia
los niveles de registro de archivo.

### Correlación de trazas

Los registros de archivo son JSONL. Cuando una llamada de registro lleva un contexto válido de traza de diagnóstico,
OpenClaw escribe los campos de traza como claves JSON de nivel superior (`traceId`, `spanId`,
`parentSpanId`, `traceFlags`) para que los procesadores externos de registros puedan correlacionar la línea
con spans OTEL y propagación `traceparent` de proveedor.

Las solicitudes HTTP del Gateway y las tramas WebSocket del Gateway establecen un alcance interno de traza
de solicitud. Los registros y eventos de diagnóstico emitidos dentro de ese alcance asíncrono heredan
la traza de solicitud cuando no pasan un contexto de traza explícito. Las trazas de ejecución de agente y
de llamada a modelo se convierten en hijas de la traza de solicitud activa, así que los registros locales,
las instantáneas de diagnóstico, los spans OTEL y las cabeceras `traceparent` de proveedores de confianza pueden
unirse por `traceId` sin registrar contenido bruto de solicitudes o modelos.

### Tamaño y temporización de llamadas a modelo

Los diagnósticos de llamadas a modelo registran mediciones acotadas de solicitud/respuesta sin
capturar contenido bruto de prompt o respuesta:

- `requestPayloadBytes`: tamaño en bytes UTF-8 de la carga final de solicitud al modelo
- `responseStreamBytes`: tamaño en bytes UTF-8 de los eventos de respuesta transmitida del modelo
- `timeToFirstByteMs`: tiempo transcurrido antes del primer evento de respuesta transmitida
- `durationMs`: duración total de la llamada al modelo

Estos campos están disponibles para instantáneas de diagnóstico, hooks de Plugin de llamadas a modelo y
spans/métricas OTEL de llamadas a modelo cuando la exportación de diagnósticos está habilitada.

### Estilos de consola

`logging.consoleStyle`:

- `pretty`: legible para humanos, con color y marcas de tiempo.
- `compact`: salida más concisa (mejor para sesiones largas).
- `json`: JSON por línea (para procesadores de registros).

### Redacción

OpenClaw puede redactar tokens confidenciales antes de que lleguen a la salida de consola, registros de archivo,
registros OTLP, texto persistido de transcripción de sesión o cargas de eventos de herramientas de Control UI
(argumentos de inicio de herramienta, cargas de resultado parcial/final, salida derivada de
exec y resúmenes de parches):

- `logging.redactSensitive`: `off` | `tools` (predeterminado: `tools`)
- `logging.redactPatterns`: lista de cadenas regex para sobrescribir el conjunto predeterminado. Los patrones personalizados se aplican encima de los valores predeterminados integrados para cargas de herramientas de Control UI, así que añadir un patrón nunca debilita la redacción de valores ya capturados por los valores predeterminados.

Los registros de archivo y las transcripciones de sesión siguen siendo JSONL, pero los valores secretos coincidentes se
enmascaran antes de que la línea o el mensaje se escriba en disco. La redacción es de mejor esfuerzo:
se aplica a contenido de mensajes con texto y cadenas de registro, no a todos los
identificadores ni campos de carga binaria.

Los valores predeterminados integrados cubren credenciales comunes de API y nombres de campos de credenciales de pago,
como número de tarjeta, CVC/CVV, token de pago compartido y credencial de pago
cuando aparecen como campos JSON, parámetros URL, indicadores CLI o asignaciones.

`logging.redactSensitive: "off"` solo deshabilita esta política general de registro/transcripción.
OpenClaw sigue redactando cargas de límite de seguridad que pueden mostrarse a clientes de UI,
paquetes de soporte, observadores de diagnóstico, prompts de aprobación o herramientas de agente.
Los ejemplos incluyen eventos de llamadas a herramientas de Control UI, salida de `sessions_history`,
exportaciones de soporte de diagnóstico, observaciones de errores de proveedor, visualización de comandos de aprobación de exec
y registros del protocolo WebSocket del Gateway. Los `logging.redactPatterns` personalizados
todavía pueden añadir patrones específicos del proyecto en esas superficies.

## Diagnósticos y OpenTelemetry

Los diagnósticos son eventos estructurados y legibles por máquina para ejecuciones de modelos y
telemetría de flujo de mensajes (webhooks, colas, estado de sesión). **No**
reemplazan los registros: alimentan métricas, trazas y exportadores. Los eventos se emiten
dentro del proceso tanto si los exportas como si no.

Dos superficies adyacentes:

- **Exportación OpenTelemetry** — envía métricas, trazas y registros mediante OTLP/HTTP a
  cualquier recopilador o backend compatible con OpenTelemetry (Grafana, Datadog,
  Honeycomb, New Relic, Tempo, etc.). La configuración completa, el catálogo de señales,
  los nombres de métricas/spans, las variables de entorno y el modelo de privacidad viven en una página dedicada:
  [Exportación OpenTelemetry](/es/gateway/opentelemetry).
- **Indicadores de diagnóstico** — indicadores de registro de depuración dirigidos que enrutan registros adicionales a
  `logging.file` sin aumentar `logging.level`. Los indicadores no distinguen mayúsculas y minúsculas
  y admiten comodines (`telegram.*`, `*`). Configúralos bajo `diagnostics.flags`
  o mediante la sobrescritura de entorno `OPENCLAW_DIAGNOSTICS=...`. Guía completa:
  [Indicadores de diagnóstico](/es/diagnostics/flags).

Para habilitar eventos de diagnóstico para plugins o receptores personalizados sin exportación OTLP:

```json5
{
  diagnostics: { enabled: true },
}
```

Para exportación OTLP a un recopilador, consulta [Exportación OpenTelemetry](/es/gateway/opentelemetry).

## Consejos de solución de problemas

- **¿No se puede acceder al Gateway?** Ejecuta `openclaw doctor` primero.
- **¿Registros vacíos?** Comprueba que el Gateway esté en ejecución y escribiendo en la ruta de archivo
  de `logging.file`.
- **¿Necesitas más detalle?** Establece `logging.level` en `debug` o `trace` y vuelve a intentarlo.

## Relacionado

- [Exportación OpenTelemetry](/es/gateway/opentelemetry) — exportación OTLP/HTTP, catálogo de métricas/spans, modelo de privacidad
- [Indicadores de diagnóstico](/es/diagnostics/flags) — indicadores de registro de depuración dirigidos
- [Internos de registro del Gateway](/es/gateway/logging) — estilos de registro WS, prefijos de subsistema y captura de consola
- [Referencia de configuración](/es/gateway/configuration-reference#diagnostics) — referencia completa de campos `diagnostics.*`

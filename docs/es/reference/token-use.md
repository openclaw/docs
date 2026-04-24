---
read_when:
    - Explicar uso de tokens, costes o ventanas de contexto
    - Depurar el crecimiento del contexto o el comportamiento de Compaction
summary: Cómo OpenClaw construye el contexto del prompt e informa del uso de tokens + costes
title: Uso de tokens y costes
x-i18n:
    generated_at: "2026-04-24T05:49:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4a95e7592a06bd750c0bfc9303d8cec2a538756e95f35c3001dc960cfebcadbf
    source_path: reference/token-use.md
    workflow: 15
---

# Uso de tokens y costes

OpenClaw rastrea **tokens**, no caracteres. Los tokens dependen del modelo, pero la mayoría
de los modelos de estilo OpenAI promedian ~4 caracteres por token en texto en inglés.

## Cómo se construye el prompt del sistema

OpenClaw ensambla su propio prompt del sistema en cada ejecución. Incluye:

- Lista de herramientas + descripciones breves
- Lista de Skills (solo metadatos; las instrucciones se cargan bajo demanda con `read`).
  El bloque compacto de Skills está limitado por `skills.limits.maxSkillsPromptChars`,
  con sobrescritura opcional por agente en
  `agents.list[].skillsLimits.maxSkillsPromptChars`.
- Instrucciones de autoactualización
- Espacio de trabajo + archivos bootstrap (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` cuando es nuevo, más `MEMORY.md` cuando está presente). `memory.md` en minúsculas en la raíz no se inyecta; es entrada heredada de reparación para `openclaw doctor --fix` cuando va acompañado de `MEMORY.md`. Los archivos grandes se truncan mediante `agents.defaults.bootstrapMaxChars` (predeterminado: 12000), y la inyección total de bootstrap está limitada por `agents.defaults.bootstrapTotalMaxChars` (predeterminado: 60000). Los archivos diarios `memory/*.md` no forman parte del prompt bootstrap normal; permanecen bajo demanda mediante herramientas de memoria en turnos ordinarios, pero `/new` y `/reset` sin contenido pueden anteponer un bloque de contexto de inicio de una sola vez con memoria diaria reciente para ese primer turno. Ese preludio de inicio está controlado por `agents.defaults.startupContext`.
- Hora (UTC + zona horaria del usuario)
- Etiquetas de respuesta + comportamiento de Heartbeat
- Metadatos de tiempo de ejecución (host/SO/modelo/thinking)

Consulta el desglose completo en [Prompt del sistema](/es/concepts/system-prompt).

## Qué cuenta en la ventana de contexto

Todo lo que recibe el modelo cuenta para el límite de contexto:

- Prompt del sistema (todas las secciones listadas arriba)
- Historial de conversación (mensajes de usuario + asistente)
- Llamadas de herramientas y resultados de herramientas
- Adjuntos/transcripciones (imágenes, audio, archivos)
- Resúmenes de Compaction y artefactos de poda
- Envoltorios del proveedor o cabeceras de seguridad (no visibles, pero siguen contando)

Algunas superficies pesadas de tiempo de ejecución tienen sus propios límites explícitos:

- `agents.defaults.contextLimits.memoryGetMaxChars`
- `agents.defaults.contextLimits.memoryGetDefaultLines`
- `agents.defaults.contextLimits.toolResultMaxChars`
- `agents.defaults.contextLimits.postCompactionMaxChars`

Las sobrescrituras por agente viven en `agents.list[].contextLimits`. Estos controles
son para extractos acotados de tiempo de ejecución y bloques inyectados propiedad del tiempo de ejecución. Están
separados de los límites bootstrap, los límites del contexto de inicio y los límites del prompt de Skills.

Para imágenes, OpenClaw reduce la escala de las cargas útiles de imágenes de transcripción/herramienta antes de llamar al proveedor.
Usa `agents.defaults.imageMaxDimensionPx` (predeterminado: `1200`) para ajustarlo:

- Los valores más bajos suelen reducir el uso de tokens de visión y el tamaño de la carga útil.
- Los valores más altos conservan más detalle visual para capturas de pantalla con mucha OCR/IU.

Para un desglose práctico (por archivo inyectado, herramientas, Skills y tamaño del prompt del sistema), usa `/context list` o `/context detail`. Consulta [Contexto](/es/concepts/context).

## Cómo ver el uso actual de tokens

Usa esto en el chat:

- `/status` → **tarjeta de estado rica en emojis** con el modelo de la sesión, uso de contexto,
  tokens de entrada/salida de la última respuesta y **coste estimado** (solo clave API).
- `/usage off|tokens|full` → agrega un **pie de uso por respuesta** a cada respuesta.
  - Persiste por sesión (almacenado como `responseUsage`).
  - La autenticación OAuth **oculta el coste** (solo tokens).
- `/usage cost` → muestra un resumen local de costes desde los registros de sesión de OpenClaw.

Otras superficies:

- **TUI/Web TUI:** se admiten `/status` y `/usage`.
- **CLI:** `openclaw status --usage` y `openclaw channels list` muestran
  ventanas de cuota de proveedor normalizadas (`X% left`, no costes por respuesta).
  Proveedores actuales con ventana de uso: Anthropic, GitHub Copilot, Gemini CLI,
  OpenAI Codex, MiniMax, Xiaomi y z.ai.

Las superficies de uso normalizan aliases comunes de campos nativos del proveedor antes de mostrarlos.
Para tráfico de OpenAI-family Responses, eso incluye tanto `input_tokens` /
`output_tokens` como `prompt_tokens` / `completion_tokens`, de modo que los nombres de campos específicos del transporte no cambien `/status`, `/usage` ni los resúmenes de sesión.
El uso JSON de Gemini CLI también se normaliza: el texto de la respuesta viene de `response`, y
`stats.cached` se asigna a `cacheRead`, usando `stats.input_tokens - stats.cached`
cuando la CLI omite un campo explícito `stats.input`.
Para tráfico nativo de OpenAI-family Responses, los aliases de uso de WebSocket/SSE se
normalizan igual, y los totales recurren a entrada + salida normalizadas cuando
`total_tokens` falta o es `0`.
Cuando la instantánea actual de la sesión es escasa, `/status` y `session_status` también pueden
recuperar contadores de tokens/caché y la etiqueta activa del modelo de tiempo de ejecución desde el
registro de uso más reciente de la transcripción. Los valores vivos existentes no nulos siguen teniendo
prioridad sobre los valores alternativos de la transcripción, y los totales de la transcripción orientados al prompt más grandes pueden prevalecer cuando los totales almacenados faltan o son menores.
La autenticación de uso para ventanas de cuota del proveedor proviene de hooks específicos del proveedor cuando están disponibles; en caso contrario, OpenClaw recurre a credenciales OAuth/clave API coincidentes desde perfiles de autenticación, entorno o configuración.
Las entradas de transcripción del asistente conservan la misma forma normalizada de uso, incluyendo
`usage.cost` cuando el modelo activo tiene precios configurados y el proveedor devuelve metadatos de uso. Esto da a `/usage cost` y al estado de sesión respaldado por transcripción una fuente estable incluso después de que el estado vivo de tiempo de ejecución haya desaparecido.

## Estimación de costes (cuando se muestra)

Los costes se estiman a partir de tu configuración de precios del modelo:

```
models.providers.<provider>.models[].cost
```

Esto es **USD por 1M de tokens** para `input`, `output`, `cacheRead` y
`cacheWrite`. Si faltan precios, OpenClaw muestra solo tokens. Los tokens OAuth
nunca muestran coste en dólares.

## Impacto de TTL de caché y poda

Prompt Caching del proveedor solo se aplica dentro de la ventana TTL de caché. OpenClaw puede
ejecutar opcionalmente **cache-ttl pruning**: poda la sesión una vez que el TTL de caché
ha caducado y luego restablece la ventana de caché para que las solicitudes posteriores puedan
reutilizar el contexto recién cacheado en lugar de volver a cachear todo el historial. Esto mantiene
más bajos los costes de escritura en caché cuando una sesión permanece inactiva más allá del TTL.

Configúralo en [Configuración del Gateway](/es/gateway/configuration) y consulta los
detalles de comportamiento en [Poda de sesión](/es/concepts/session-pruning).

Heartbeat puede mantener la caché **caliente** durante los periodos de inactividad. Si el TTL de caché de tu modelo
es `1h`, establecer el intervalo de Heartbeat justo por debajo de eso (por ejemplo, `55m`) puede evitar
volver a cachear el prompt completo, reduciendo los costes de escritura en caché.

En configuraciones multiagente, puedes mantener una configuración compartida del modelo y ajustar el comportamiento de caché
por agente con `agents.list[].params.cacheRetention`.

Para una guía completa ajuste por ajuste, consulta [Prompt Caching](/es/reference/prompt-caching).

Para los precios de la API de Anthropic, las lecturas de caché son significativamente más baratas que los
tokens de entrada, mientras que las escrituras de caché se facturan con un multiplicador más alto. Consulta los
precios de Prompt Caching de Anthropic para ver las tarifas más recientes y los multiplicadores de TTL:
[https://docs.anthropic.com/docs/build-with-claude/prompt-caching](https://docs.anthropic.com/docs/build-with-claude/prompt-caching)

### Ejemplo: mantener caliente durante 1h la caché con Heartbeat

```yaml
agents:
  defaults:
    model:
      primary: "anthropic/claude-opus-4-6"
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "long"
    heartbeat:
      every: "55m"
```

### Ejemplo: tráfico mixto con estrategia de caché por agente

```yaml
agents:
  defaults:
    model:
      primary: "anthropic/claude-opus-4-6"
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "long" # base predeterminada para la mayoría de agentes
  list:
    - id: "research"
      default: true
      heartbeat:
        every: "55m" # mantener caliente la caché larga para sesiones profundas
    - id: "alerts"
      params:
        cacheRetention: "none" # evitar escrituras de caché para notificaciones irregulares
```

`agents.list[].params` se fusiona sobre los `params` del modelo seleccionado, así que puedes
sobrescribir solo `cacheRetention` y heredar sin cambios los demás valores predeterminados del modelo.

### Ejemplo: habilitar la cabecera beta de contexto 1M de Anthropic

La ventana de contexto 1M de Anthropic está actualmente restringida por beta. OpenClaw puede inyectar el
valor `anthropic-beta` requerido cuando habilitas `context1m` en modelos Opus
o Sonnet compatibles.

```yaml
agents:
  defaults:
    models:
      "anthropic/claude-opus-4-6":
        params:
          context1m: true
```

Esto se asigna a la cabecera beta `context-1m-2025-08-07` de Anthropic.

Esto solo se aplica cuando `context1m: true` está establecido en esa entrada de modelo.

Requisito: la credencial debe ser apta para uso de contexto largo. Si no lo es,
Anthropic responde con un error de límite de tasa del lado del proveedor para esa solicitud.

Si autenticas Anthropic con tokens OAuth/suscripción (`sk-ant-oat-*`),
OpenClaw omite la cabecera beta `context-1m-*` porque Anthropic actualmente
rechaza esa combinación con HTTP 401.

## Consejos para reducir la presión de tokens

- Usa `/compact` para resumir sesiones largas.
- Recorta salidas grandes de herramientas en tus flujos de trabajo.
- Reduce `agents.defaults.imageMaxDimensionPx` para sesiones con muchas capturas de pantalla.
- Mantén cortas las descripciones de Skills (la lista de Skills se inyecta en el prompt).
- Prefiere modelos más pequeños para trabajo verboso y exploratorio.

Consulta [Skills](/es/tools/skills) para ver la fórmula exacta de sobrecarga de la lista de Skills.

## Relacionado

- [Uso y costes de API](/es/reference/api-usage-costs)
- [Prompt Caching](/es/reference/prompt-caching)
- [Seguimiento de uso](/es/concepts/usage-tracking)

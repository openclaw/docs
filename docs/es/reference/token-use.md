---
read_when:
    - Explicar el uso de tokens, los costos o las ventanas de contexto
    - Depurar el crecimiento del contexto o el comportamiento de Compaction
summary: Cómo OpenClaw construye el contexto del prompt e informa el uso de tokens y los costos
title: Uso de tokens y costos
x-i18n:
    generated_at: "2026-04-21T05:19:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: d26db37353941e247eb26f84bfa105896318b3239b2975d6e033c6e9ceda6b0d
    source_path: reference/token-use.md
    workflow: 15
---

# Uso de tokens y costos

OpenClaw rastrea **tokens**, no caracteres. Los tokens dependen del modelo, pero la mayoría de
los modelos tipo OpenAI promedian ~4 caracteres por token en texto en inglés.

## Cómo se construye el prompt del sistema

OpenClaw ensambla su propio prompt del sistema en cada ejecución. Incluye:

- Lista de herramientas + descripciones breves
- Lista de Skills (solo metadatos; las instrucciones se cargan bajo demanda con `read`).
  El bloque compacto de Skills está limitado por `skills.limits.maxSkillsPromptChars`,
  con reemplazo opcional por agente en
  `agents.list[].skillsLimits.maxSkillsPromptChars`.
- Instrucciones de autoactualización
- Workspace + archivos bootstrap (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` cuando es nuevo, además de `MEMORY.md` cuando existe o `memory.md` como respaldo en minúsculas). Los archivos grandes se truncan con `agents.defaults.bootstrapMaxChars` (predeterminado: 12000), y la inyección total de bootstrap está limitada por `agents.defaults.bootstrapTotalMaxChars` (predeterminado: 60000). Los archivos diarios `memory/*.md` no forman parte del prompt bootstrap normal; siguen siendo bajo demanda mediante herramientas de memoria en turnos normales, pero `/new` y `/reset` sin más pueden anteponer un bloque único de contexto de inicio con memoria diaria reciente para ese primer turno. Ese preludio de inicio se controla con `agents.defaults.startupContext`.
- Hora (UTC + zona horaria del usuario)
- Etiquetas de respuesta + comportamiento de Heartbeat
- Metadatos de runtime (host/SO/modelo/thinking)

Consulta el desglose completo en [Prompt del sistema](/es/concepts/system-prompt).

## Qué cuenta en la ventana de contexto

Todo lo que recibe el modelo cuenta para el límite de contexto:

- Prompt del sistema (todas las secciones indicadas arriba)
- Historial de conversación (mensajes del usuario + asistente)
- Llamadas a herramientas y resultados de herramientas
- Adjuntos/transcripciones (imágenes, audio, archivos)
- Resúmenes de Compaction y artefactos de poda
- Wrappers del proveedor o encabezados de seguridad (no visibles, pero igualmente contados)

Algunas superficies pesadas de runtime tienen sus propios límites explícitos:

- `agents.defaults.contextLimits.memoryGetMaxChars`
- `agents.defaults.contextLimits.memoryGetDefaultLines`
- `agents.defaults.contextLimits.toolResultMaxChars`
- `agents.defaults.contextLimits.postCompactionMaxChars`

Los reemplazos por agente viven en `agents.list[].contextLimits`. Estos controles
son para extractos acotados de runtime y bloques inyectados propiedad del runtime. Son
separados de los límites bootstrap, los límites de contexto de inicio y los
límites del prompt de Skills.

Para imágenes, OpenClaw reduce la escala de las cargas de imágenes de transcripción/herramientas antes de las llamadas al proveedor.
Usa `agents.defaults.imageMaxDimensionPx` (predeterminado: `1200`) para ajustar esto:

- Valores más bajos suelen reducir el uso de vision tokens y el tamaño de la carga.
- Valores más altos conservan más detalle visual para OCR/capturas de UI.

Para un desglose práctico (por archivo inyectado, herramientas, Skills y tamaño del prompt del sistema), usa `/context list` o `/context detail`. Consulta [Contexto](/es/concepts/context).

## Cómo ver el uso actual de tokens

Usa esto en el chat:

- `/status` → **tarjeta de estado rica en emojis** con el modelo de la sesión, uso de contexto,
  tokens de entrada/salida de la última respuesta y **costo estimado** (solo con clave API).
- `/usage off|tokens|full` → añade un **pie de uso por respuesta** a cada respuesta.
  - Persiste por sesión (se guarda como `responseUsage`).
  - La auth OAuth **oculta el costo** (solo tokens).
- `/usage cost` → muestra un resumen local de costos desde los logs de sesión de OpenClaw.

Otras superficies:

- **TUI/Web TUI:** se admiten `/status` y `/usage`.
- **CLI:** `openclaw status --usage` y `openclaw channels list` muestran
  ventanas de cuota normalizadas del proveedor (`X% left`, no costos por respuesta).
  Proveedores actuales con ventana de uso: Anthropic, GitHub Copilot, Gemini CLI,
  OpenAI Codex, MiniMax, Xiaomi y z.ai.

Las superficies de uso normalizan alias comunes de campos nativos del proveedor antes de mostrarlos.
Para tráfico Responses de la familia OpenAI, eso incluye tanto `input_tokens` /
`output_tokens` como `prompt_tokens` / `completion_tokens`, de modo que los nombres de campos específicos
del transporte no cambian `/status`, `/usage` ni los resúmenes de sesión.
El uso JSON de Gemini CLI también se normaliza: el texto de respuesta viene de `response`, y
`stats.cached` se mapea a `cacheRead`, usando `stats.input_tokens - stats.cached`
cuando la CLI omite un campo explícito `stats.input`.
Para tráfico Responses nativo de la familia OpenAI, los alias de uso de WebSocket/SSE se
normalizan de la misma forma, y los totales recurren a entrada + salida normalizadas cuando
falta `total_tokens` o es `0`.
Cuando la instantánea de la sesión actual es escasa, `/status` y `session_status` también pueden
recuperar contadores de tokens/caché y la etiqueta del modelo activo de runtime desde el log de uso
de la transcripción más reciente. Los valores activos no nulos existentes siguen teniendo prioridad
sobre los valores recuperados de la transcripción, y los totales orientados al prompt más grandes de la
transcripción pueden imponerse cuando faltan los totales almacenados o son menores.
La auth de uso para ventanas de cuota del proveedor proviene de hooks específicos del proveedor cuando
están disponibles; en caso contrario, OpenClaw recurre a credenciales OAuth/API key coincidentes
de perfiles de auth, variables de entorno o configuración.
Las entradas de transcripción del asistente persisten la misma forma normalizada de uso, incluido
`usage.cost` cuando el modelo activo tiene precios configurados y el proveedor
devuelve metadatos de uso. Esto da a `/usage cost` y al estado de sesión respaldado por transcripción
una fuente estable incluso después de que el estado activo del runtime ya no exista.

## Estimación de costos (cuando se muestra)

Los costos se estiman a partir de la configuración de precios de tu modelo:

```
models.providers.<provider>.models[].cost
```

Son valores en **USD por 1M de tokens** para `input`, `output`, `cacheRead` y
`cacheWrite`. Si faltan precios, OpenClaw muestra solo tokens. Los tokens OAuth
nunca muestran costo en dólares.

## Impacto de cache TTL y poda

La caché de prompts del proveedor solo se aplica dentro de la ventana cache TTL. OpenClaw puede
ejecutar opcionalmente **poda cache-ttl**: poda la sesión una vez que el cache TTL
ha expirado, luego reinicia la ventana de caché para que las solicitudes posteriores puedan reutilizar el
contexto recién cacheado en lugar de volver a cachear todo el historial. Esto mantiene más bajos
los costos de escritura en caché cuando una sesión queda inactiva más allá del TTL.

Configúralo en [Configuración del Gateway](/es/gateway/configuration) y consulta
los detalles del comportamiento en [Poda de sesiones](/es/concepts/session-pruning).

Heartbeat puede mantener la caché **caliente** durante intervalos de inactividad. Si el cache TTL
de tu modelo es `1h`, configurar el intervalo de heartbeat justo por debajo (por ejemplo, `55m`) puede evitar
volver a cachear el prompt completo, reduciendo los costos de escritura en caché.

En configuraciones multiagente, puedes mantener una configuración de modelo compartida y ajustar el comportamiento de caché
por agente con `agents.list[].params.cacheRetention`.

Para una guía completa control por control, consulta [Prompt Caching](/es/reference/prompt-caching).

Para los precios de la API de Anthropic, las lecturas de caché son significativamente más baratas que los tokens
de entrada, mientras que las escrituras de caché se facturan con un multiplicador mayor. Consulta los precios de prompt caching de Anthropic para ver las tarifas y multiplicadores TTL más recientes:
[https://docs.anthropic.com/docs/build-with-claude/prompt-caching](https://docs.anthropic.com/docs/build-with-claude/prompt-caching)

### Ejemplo: mantener caliente una caché de 1h con heartbeat

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
          cacheRetention: "long" # default baseline for most agents
  list:
    - id: "research"
      default: true
      heartbeat:
        every: "55m" # keep long cache warm for deep sessions
    - id: "alerts"
      params:
        cacheRetention: "none" # avoid cache writes for bursty notifications
```

`agents.list[].params` se fusiona sobre `params` del modelo seleccionado, por lo que puedes
reemplazar solo `cacheRetention` y heredar sin cambios los demás valores predeterminados del modelo.

### Ejemplo: activar el encabezado beta de contexto 1M de Anthropic

La ventana de contexto de 1M de Anthropic está actualmente protegida por beta. OpenClaw puede inyectar el
valor `anthropic-beta` requerido cuando activas `context1m` en modelos compatibles Opus
o Sonnet.

```yaml
agents:
  defaults:
    models:
      "anthropic/claude-opus-4-6":
        params:
          context1m: true
```

Esto se asigna al encabezado beta `context-1m-2025-08-07` de Anthropic.

Esto solo se aplica cuando `context1m: true` está definido en esa entrada de modelo.

Requisito: la credencial debe ser apta para uso de contexto largo. Si no lo es,
Anthropic responde con un error de límite de tasa del lado del proveedor para esa solicitud.

Si autenticas Anthropic con tokens OAuth/suscripción (`sk-ant-oat-*`),
OpenClaw omite el encabezado beta `context-1m-*` porque Anthropic actualmente
rechaza esa combinación con HTTP 401.

## Consejos para reducir la presión de tokens

- Usa `/compact` para resumir sesiones largas.
- Recorta salidas grandes de herramientas en tus flujos.
- Reduce `agents.defaults.imageMaxDimensionPx` en sesiones cargadas de capturas.
- Mantén breves las descripciones de Skills (la lista de Skills se inyecta en el prompt).
- Prefiere modelos más pequeños para trabajo verboso y exploratorio.

Consulta [Skills](/es/tools/skills) para ver la fórmula exacta de sobrecarga de la lista de Skills.

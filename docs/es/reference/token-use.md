---
read_when:
    - Explicar el uso de tokens, los costos o las ventanas de contexto
    - Depuración del crecimiento del contexto o del comportamiento de Compaction
summary: Cómo OpenClaw construye el contexto del prompt e informa el uso de tokens y los costos
title: Uso y costos de tokens
x-i18n:
    generated_at: "2026-05-02T21:05:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 648c1624aa81e896dacdbdc10784ca10fba2e43114823903da6455e7de512ace
    source_path: reference/token-use.md
    workflow: 16
---

# Uso de tokens y costos

OpenClaw registra **tokens**, no caracteres. Los tokens dependen del modelo, pero la mayoría de los modelos de estilo OpenAI promedian ~4 caracteres por token para texto en inglés.

## Cómo se crea el prompt del sistema

OpenClaw ensambla su propio prompt del sistema en cada ejecución. Incluye:

- Lista de herramientas + descripciones breves
- Lista de Skills (solo metadatos; las instrucciones se cargan bajo demanda con `read`).
  El bloque compacto de Skills está limitado por `skills.limits.maxSkillsPromptChars`,
  con una anulación opcional por agente en
  `agents.list[].skillsLimits.maxSkillsPromptChars`.
- Instrucciones de autoactualización
- Espacio de trabajo + archivos de bootstrap (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` cuando es nuevo, más `MEMORY.md` cuando está presente). La raíz en minúsculas `memory.md` no se inyecta; es entrada de reparación heredada para `openclaw doctor --fix` cuando se combina con `MEMORY.md`. Los archivos grandes se truncan mediante `agents.defaults.bootstrapMaxChars` (predeterminado: 12000), y la inyección total de bootstrap se limita con `agents.defaults.bootstrapTotalMaxChars` (predeterminado: 60000). Los archivos diarios `memory/*.md` no forman parte del prompt de bootstrap normal; permanecen disponibles bajo demanda mediante herramientas de memoria en turnos ordinarios, pero las ejecuciones del modelo de reinicio/inicio pueden anteponer un bloque único de contexto de inicio con memoria diaria reciente para ese primer turno. Los comandos de chat simples `/new` y `/reset` se reconocen sin invocar el modelo. El preludio de inicio se controla mediante `agents.defaults.startupContext`.
- Hora (UTC + zona horaria del usuario)
- Etiquetas de respuesta + comportamiento de Heartbeat
- Metadatos de runtime (host/SO/modelo/razonamiento)

Consulta el desglose completo en [Prompt del sistema](/es/concepts/system-prompt).

## Qué cuenta en la ventana de contexto

Todo lo que recibe el modelo cuenta para el límite de contexto:

- Prompt del sistema (todas las secciones enumeradas arriba)
- Historial de conversación (mensajes del usuario + del asistente)
- Llamadas a herramientas y resultados de herramientas
- Adjuntos/transcripciones (imágenes, audio, archivos)
- Resúmenes de Compaction y artefactos de poda
- Envoltorios del proveedor o encabezados de seguridad (no visibles, pero aun así contabilizados)

Algunas superficies con mucho uso en runtime tienen sus propios límites explícitos:

- `agents.defaults.contextLimits.memoryGetMaxChars`
- `agents.defaults.contextLimits.memoryGetDefaultLines`
- `agents.defaults.contextLimits.toolResultMaxChars`
- `agents.defaults.contextLimits.postCompactionMaxChars`

Las anulaciones por agente viven bajo `agents.list[].contextLimits`. Estos controles son para extractos acotados de runtime y bloques inyectados propiedad del runtime. Son independientes de los límites de bootstrap, los límites de contexto de inicio y los límites del prompt de Skills.

Para imágenes, OpenClaw reduce la escala de las cargas útiles de imágenes de transcripción/herramientas antes de llamar a los proveedores.
Usa `agents.defaults.imageMaxDimensionPx` (predeterminado: `1200`) para ajustar esto:

- Los valores más bajos suelen reducir el uso de tokens de visión y el tamaño de la carga útil.
- Los valores más altos preservan más detalle visual para capturas de pantalla con mucho OCR/UI.

Para un desglose práctico (por archivo inyectado, herramientas, Skills y tamaño del prompt del sistema), usa `/context list` o `/context detail`. Consulta [Contexto](/es/concepts/context).

## Cómo ver el uso actual de tokens

Usa estos comandos en el chat:

- `/status` → **tarjeta de estado con abundantes emojis** con el modelo de la sesión, el uso de contexto,
  los tokens de entrada/salida de la última respuesta y el **costo estimado** (solo clave de API).
- `/usage off|tokens|full` → añade un **pie de uso por respuesta** a cada respuesta.
  - Persiste por sesión (almacenado como `responseUsage`).
  - La autenticación OAuth **oculta el costo** (solo tokens).
- `/usage cost` → muestra un resumen local de costos desde los registros de sesión de OpenClaw.

Otras superficies:

- **TUI/Web TUI:** `/status` + `/usage` son compatibles.
- **CLI:** `openclaw status --usage` y `openclaw channels list` muestran
  ventanas de cuota de proveedor normalizadas (`X% left`, no costos por respuesta).
  Proveedores actuales de ventana de uso: Anthropic, GitHub Copilot, Gemini CLI,
  OpenAI Codex, MiniMax, Xiaomi y z.ai.

Las superficies de uso normalizan alias comunes de campos nativos del proveedor antes de mostrarlos.
Para tráfico Responses de la familia OpenAI, eso incluye tanto `input_tokens` /
`output_tokens` como `prompt_tokens` / `completion_tokens`, de modo que los nombres de campos específicos del transporte no cambian `/status`, `/usage` ni los resúmenes de sesión.
El uso JSON de Gemini CLI también se normaliza: el texto de respuesta viene de `response`, y
`stats.cached` se asigna a `cacheRead`, con `stats.input_tokens - stats.cached`
usado cuando la CLI omite un campo explícito `stats.input`.
Para tráfico Responses nativo de la familia OpenAI, los alias de uso de WebSocket/SSE se normalizan de la misma forma, y los totales recurren a entrada + salida normalizadas cuando
`total_tokens` falta o es `0`.
Cuando la instantánea de la sesión actual es escasa, `/status` y `session_status` también pueden recuperar contadores de tokens/caché y la etiqueta del modelo de runtime activo desde el registro de uso de transcripción más reciente. Los valores en vivo existentes distintos de cero siguen teniendo prioridad sobre los valores de respaldo de la transcripción, y los totales de transcripción orientados al prompt más grandes pueden prevalecer cuando faltan los totales almacenados o son menores.
La autenticación de uso para ventanas de cuota del proveedor proviene de hooks específicos del proveedor cuando están disponibles; de lo contrario, OpenClaw recurre a credenciales OAuth/clave de API coincidentes desde perfiles de autenticación, env o config.
Las entradas de transcripción del asistente persisten la misma forma de uso normalizada, incluido
`usage.cost` cuando el modelo activo tiene precios configurados y el proveedor devuelve metadatos de uso. Esto da a `/usage cost` y al estado de sesión respaldado por transcripción una fuente estable incluso después de que el estado de runtime en vivo desaparece.

OpenClaw mantiene la contabilidad de uso del proveedor separada de la instantánea de contexto actual. `usage.total` del proveedor puede incluir entrada en caché, salida y varias llamadas de modelo en el bucle de herramientas, por lo que es útil para costos y telemetría, pero puede sobrestimar la ventana de contexto en vivo. Las pantallas y diagnósticos de contexto usan la instantánea del prompt más reciente (`promptTokens`, o la última llamada al modelo cuando no hay una instantánea del prompt disponible) para `context.used`.

## Estimación de costos (cuando se muestra)

Los costos se estiman a partir de la configuración de precios de tu modelo:

```
models.providers.<provider>.models[].cost
```

Estos son **USD por 1M de tokens** para `input`, `output`, `cacheRead` y
`cacheWrite`. Si faltan los precios, OpenClaw muestra solo tokens. Los tokens OAuth nunca muestran costo en dólares.

Después de que los sidecars y canales alcanzan la ruta lista de Gateway, OpenClaw inicia un bootstrap opcional de precios en segundo plano para las referencias de modelos configuradas que aún no tienen precios locales. Ese bootstrap obtiene catálogos remotos de precios de OpenRouter y LiteLLM. Establece `models.pricing.enabled: false` para omitir esas solicitudes de catálogos en redes sin conexión o restringidas; las entradas explícitas
`models.providers.*.models[].cost` siguen impulsando las estimaciones locales de costos.

## TTL de caché e impacto de la poda

El almacenamiento en caché de prompts del proveedor solo se aplica dentro de la ventana TTL de caché. OpenClaw puede ejecutar opcionalmente **poda por TTL de caché**: poda la sesión una vez que el TTL de caché ha expirado y luego restablece la ventana de caché para que las solicitudes posteriores puedan reutilizar el contexto recién almacenado en caché en lugar de volver a almacenar en caché todo el historial. Esto mantiene más bajos los costos de escritura en caché cuando una sesión queda inactiva más allá del TTL.

Configúralo en [configuración de Gateway](/es/gateway/configuration) y consulta los detalles de comportamiento en [Poda de sesiones](/es/concepts/session-pruning).

Heartbeat puede mantener la caché **caliente** durante intervalos de inactividad. Si el TTL de caché de tu modelo es `1h`, establecer el intervalo de Heartbeat justo por debajo de eso (por ejemplo, `55m`) puede evitar volver a almacenar en caché el prompt completo, reduciendo los costos de escritura en caché.

En configuraciones multiagente, puedes mantener una configuración de modelo compartida y ajustar el comportamiento de caché por agente con `agents.list[].params.cacheRetention`.

Para una guía completa control por control, consulta [Almacenamiento en caché de prompts](/es/reference/prompt-caching).

Para los precios de la API de Anthropic, las lecturas de caché son significativamente más baratas que los tokens de entrada, mientras que las escrituras de caché se facturan con un multiplicador más alto. Consulta los precios de almacenamiento en caché de prompts de Anthropic para ver las tarifas y multiplicadores de TTL más recientes:
[https://docs.anthropic.com/docs/build-with-claude/prompt-caching](https://docs.anthropic.com/docs/build-with-claude/prompt-caching)

### Ejemplo: mantener caliente la caché de 1h con Heartbeat

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

`agents.list[].params` se fusiona encima de los `params` del modelo seleccionado, así que puedes anular solo `cacheRetention` y heredar los demás valores predeterminados del modelo sin cambios.

### Ejemplo: activar el encabezado beta de contexto 1M de Anthropic

La ventana de contexto 1M de Anthropic actualmente está detrás de una beta. OpenClaw puede inyectar el valor
`anthropic-beta` requerido cuando activas `context1m` en modelos Opus
o Sonnet compatibles.

```yaml
agents:
  defaults:
    models:
      "anthropic/claude-opus-4-6":
        params:
          context1m: true
```

Esto se asigna al encabezado beta `context-1m-2025-08-07` de Anthropic.

Esto solo se aplica cuando `context1m: true` está establecido en esa entrada de modelo.

Requisito: la credencial debe ser apta para uso de contexto largo. Si no lo es,
Anthropic responde con un error de límite de tasa del lado del proveedor para esa solicitud.

Si autenticas Anthropic con tokens OAuth/suscripción (`sk-ant-oat-*`),
OpenClaw omite el encabezado beta `context-1m-*` porque Anthropic actualmente
rechaza esa combinación con HTTP 401.

## Consejos para reducir la presión de tokens

- Usa `/compact` para resumir sesiones largas.
- Recorta salidas grandes de herramientas en tus flujos de trabajo.
- Reduce `agents.defaults.imageMaxDimensionPx` para sesiones con muchas capturas de pantalla.
- Mantén breves las descripciones de Skills (la lista de Skills se inyecta en el prompt).
- Prefiere modelos más pequeños para trabajo prolijo y exploratorio.

Consulta [Skills](/es/tools/skills) para la fórmula exacta de sobrecarga de la lista de Skills.

## Relacionado

- [Uso y costos de API](/es/reference/api-usage-costs)
- [Almacenamiento en caché de prompts](/es/reference/prompt-caching)
- [Seguimiento de uso](/es/concepts/usage-tracking)

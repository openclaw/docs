---
read_when:
    - Explicar el uso de tokens, los costos o las ventanas de contexto
    - Depurar el crecimiento del contexto o el comportamiento de Compaction
summary: Cómo OpenClaw construye el contexto del prompt e informa el uso de tokens y los costos
title: Uso de tokens y costos
x-i18n:
    generated_at: "2026-04-26T11:38:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 828b282103902f55d65ce820c17753c2602169eff068bcea36e629759002f28d
    source_path: reference/token-use.md
    workflow: 15
---

# Uso de tokens y costos

OpenClaw realiza el seguimiento de **tokens**, no de caracteres. Los tokens dependen del modelo, pero la mayoría de los modelos de estilo OpenAI promedian ~4 caracteres por token en texto en inglés.

## Cómo se construye el prompt del sistema

OpenClaw ensambla su propio prompt del sistema en cada ejecución. Incluye:

- Lista de herramientas + descripciones breves
- Lista de Skills (solo metadatos; las instrucciones se cargan bajo demanda con `read`).
  El bloque compacto de Skills está limitado por `skills.limits.maxSkillsPromptChars`,
  con una anulación opcional por agente en
  `agents.list[].skillsLimits.maxSkillsPromptChars`.
- Instrucciones de autoactualización
- Espacio de trabajo + archivos de arranque (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` cuando es nuevo, además de `MEMORY.md` cuando está presente). El archivo raíz en minúsculas `memory.md` no se inyecta; es una entrada de reparación heredada para `openclaw doctor --fix` cuando se empareja con `MEMORY.md`. Los archivos grandes se truncan con `agents.defaults.bootstrapMaxChars` (predeterminado: 12000), y la inyección total de arranque está limitada por `agents.defaults.bootstrapTotalMaxChars` (predeterminado: 60000). Los archivos diarios `memory/*.md` no forman parte del prompt de arranque normal; permanecen bajo demanda mediante herramientas de memoria en turnos normales, pero `/new` y `/reset` sin argumentos pueden anteponer un bloque único de contexto de inicio con memoria diaria reciente para ese primer turno. Ese preludio de inicio está controlado por `agents.defaults.startupContext`.
- Hora (UTC + zona horaria del usuario)
- Etiquetas de respuesta + comportamiento de Heartbeat
- Metadatos de tiempo de ejecución (host/SO/modelo/thinking)

Consulta el desglose completo en [Prompt del sistema](/es/concepts/system-prompt).

## Qué cuenta en la ventana de contexto

Todo lo que recibe el modelo cuenta para el límite de contexto:

- Prompt del sistema (todas las secciones enumeradas arriba)
- Historial de la conversación (mensajes del usuario + del asistente)
- Llamadas a herramientas y resultados de herramientas
- Adjuntos/transcripciones (imágenes, audio, archivos)
- Resúmenes de Compaction y artefactos de poda
- Wrappers del proveedor o encabezados de seguridad (no visibles, pero igualmente contabilizados)

Algunas superficies con mucha carga en tiempo de ejecución tienen sus propios límites explícitos:

- `agents.defaults.contextLimits.memoryGetMaxChars`
- `agents.defaults.contextLimits.memoryGetDefaultLines`
- `agents.defaults.contextLimits.toolResultMaxChars`
- `agents.defaults.contextLimits.postCompactionMaxChars`

Las anulaciones por agente se encuentran en `agents.list[].contextLimits`. Estos controles son
para fragmentos limitados en tiempo de ejecución y bloques inyectados que pertenecen al runtime. Son
independientes de los límites de arranque, los límites de contexto de inicio y los límites del prompt
de Skills.

Para imágenes, OpenClaw reduce la escala de las cargas de imágenes de transcripción/herramientas antes de las llamadas al proveedor.
Usa `agents.defaults.imageMaxDimensionPx` (predeterminado: `1200`) para ajustarlo:

- Los valores más bajos suelen reducir el uso de tokens de visión y el tamaño de la carga.
- Los valores más altos conservan más detalle visual para capturas de pantalla con mucha OCR/UI.

Para un desglose práctico (por archivo inyectado, herramientas, Skills y tamaño del prompt del sistema), usa `/context list` o `/context detail`. Consulta [Contexto](/es/concepts/context).

## Cómo ver el uso actual de tokens

Usa esto en el chat:

- `/status` → **tarjeta de estado rica en emojis** con el modelo de la sesión, uso del contexto,
  tokens de entrada/salida de la última respuesta y **costo estimado** (solo clave de API).
- `/usage off|tokens|full` → añade un **pie de uso por respuesta** a cada respuesta.
  - Persiste por sesión (almacenado como `responseUsage`).
  - La autenticación OAuth **oculta el costo** (solo tokens).
- `/usage cost` → muestra un resumen local de costos a partir de los registros de sesión de OpenClaw.

Otras superficies:

- **TUI/Web TUI:** `/status` y `/usage` son compatibles.
- **CLI:** `openclaw status --usage` y `openclaw channels list` muestran
  ventanas de cuota del proveedor normalizadas (`X% restante`, no costos por respuesta).
  Proveedores actuales de ventana de uso: Anthropic, GitHub Copilot, Gemini CLI,
  OpenAI Codex, MiniMax, Xiaomi y z.ai.

Las superficies de uso normalizan los alias comunes de campos nativos del proveedor antes de mostrarlos.
Para el tráfico de Responses de la familia OpenAI, eso incluye tanto `input_tokens` /
`output_tokens` como `prompt_tokens` / `completion_tokens`, para que los nombres de campo específicos del transporte
no cambien `/status`, `/usage` ni los resúmenes de sesión.
El uso JSON de Gemini CLI también se normaliza: el texto de respuesta proviene de `response`, y
`stats.cached` se asigna a `cacheRead`, usando `stats.input_tokens - stats.cached`
cuando el CLI omite un campo explícito `stats.input`.
Para el tráfico nativo de Responses de la familia OpenAI, los alias de uso de WebSocket/SSE se
normalizan de la misma manera, y los totales recurren a entrada + salida normalizadas cuando
`total_tokens` falta o es `0`.
Cuando la instantánea actual de la sesión es escasa, `/status` y `session_status` también pueden
recuperar contadores de tokens/caché y la etiqueta activa del modelo de runtime del registro de uso
más reciente de la transcripción. Los valores en vivo existentes distintos de cero siguen teniendo prioridad
sobre los valores recuperados de la transcripción, y los totales de transcripción orientados al prompt más grandes
pueden prevalecer cuando los totales almacenados faltan o son menores.
La autenticación de uso para las ventanas de cuota del proveedor proviene de hooks específicos del proveedor cuando
están disponibles; de lo contrario, OpenClaw recurre a credenciales OAuth/clave de API coincidentes
de perfiles de autenticación, entorno o configuración.
Las entradas de transcripción del asistente conservan la misma estructura de uso normalizada, incluido
`usage.cost` cuando el modelo activo tiene precios configurados y el proveedor devuelve metadatos de uso.
Esto proporciona a `/usage cost` y al estado de sesión basado en transcripción una fuente estable incluso después de que el estado del runtime en vivo ya no exista.

OpenClaw mantiene la contabilidad de uso del proveedor separada de la instantánea del contexto actual.
`usage.total` del proveedor puede incluir entrada en caché, salida y múltiples llamadas al modelo en bucle de herramientas, por lo que es útil para costo y telemetría, pero puede exagerar la ventana de contexto activa. Las visualizaciones y diagnósticos del contexto usan la instantánea de prompt más reciente (`promptTokens`, o la última llamada al modelo cuando no hay instantánea de prompt disponible) para `context.used`.

## Estimación de costos (cuando se muestra)

Los costos se estiman a partir de tu configuración de precios del modelo:

```
models.providers.<provider>.models[].cost
```

Estos son **USD por 1M de tokens** para `input`, `output`, `cacheRead` y
`cacheWrite`. Si faltan los precios, OpenClaw muestra solo tokens. Los tokens OAuth
nunca muestran costo en dólares.

## Impacto del TTL de caché y la poda

El almacenamiento en caché del prompt del proveedor solo se aplica dentro de la ventana TTL de la caché. OpenClaw puede
ejecutar opcionalmente **poda por cache-ttl**: poda la sesión una vez que el TTL de la caché
ha expirado, y luego restablece la ventana de caché para que las solicitudes posteriores puedan reutilizar el
contexto recién almacenado en caché en lugar de volver a almacenar en caché todo el historial. Esto mantiene
más bajos los costos de escritura en caché cuando una sesión queda inactiva más allá del TTL.

Configúralo en [Configuración del Gateway](/es/gateway/configuration) y consulta los
detalles del comportamiento en [Poda de sesiones](/es/concepts/session-pruning).

Heartbeat puede mantener la caché **activa** durante períodos de inactividad. Si el TTL de caché de tu modelo
es `1h`, establecer el intervalo de Heartbeat justo por debajo de eso (por ejemplo, `55m`) puede evitar volver
a almacenar en caché todo el prompt, reduciendo los costos de escritura en caché.

En configuraciones con varios agentes, puedes mantener una configuración de modelo compartida y ajustar el comportamiento de caché
por agente con `agents.list[].params.cacheRetention`.

Para una guía completa control por control, consulta [Prompt Caching](/es/reference/prompt-caching).

Para los precios de la API de Anthropic, las lecturas de caché son significativamente más baratas que los tokens
de entrada, mientras que las escrituras en caché se facturan con un multiplicador más alto. Consulta los precios
de prompt caching de Anthropic para ver las tarifas y multiplicadores TTL más recientes:
[https://docs.anthropic.com/docs/build-with-claude/prompt-caching](https://docs.anthropic.com/docs/build-with-claude/prompt-caching)

### Ejemplo: mantener activa una caché de 1h con Heartbeat

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
          cacheRetention: "long" # línea base predeterminada para la mayoría de los agentes
  list:
    - id: "research"
      default: true
      heartbeat:
        every: "55m" # mantiene activa la caché larga para sesiones profundas
    - id: "alerts"
      params:
        cacheRetention: "none" # evita escrituras en caché para notificaciones esporádicas
```

`agents.list[].params` se fusiona sobre `params` del modelo seleccionado, por lo que puedes
anular solo `cacheRetention` y heredar sin cambios los demás valores predeterminados del modelo.

### Ejemplo: habilitar el encabezado beta de contexto de 1M de Anthropic

La ventana de contexto de 1M de Anthropic actualmente está limitada por beta. OpenClaw puede inyectar el
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

Esto se asigna al encabezado beta `context-1m-2025-08-07` de Anthropic.

Esto solo se aplica cuando `context1m: true` está configurado en esa entrada de modelo.

Requisito: la credencial debe ser apta para el uso de contexto largo. Si no lo es,
Anthropic responde con un error de límite de tasa del lado del proveedor para esa solicitud.

Si autenticas Anthropic con tokens OAuth/de suscripción (`sk-ant-oat-*`),
OpenClaw omite el encabezado beta `context-1m-*` porque Anthropic actualmente
rechaza esa combinación con HTTP 401.

## Consejos para reducir la presión de tokens

- Usa `/compact` para resumir sesiones largas.
- Recorta salidas grandes de herramientas en tus flujos de trabajo.
- Reduce `agents.defaults.imageMaxDimensionPx` para sesiones con muchas capturas de pantalla.
- Mantén breves las descripciones de Skills (la lista de Skills se inyecta en el prompt).
- Prefiere modelos más pequeños para trabajo detallado, exploratorio y verboso.

Consulta [Skills](/es/tools/skills) para la fórmula exacta de sobrecarga de la lista de Skills.

## Relacionado

- [Uso y costos de API](/es/reference/api-usage-costs)
- [Prompt caching](/es/reference/prompt-caching)
- [Seguimiento de uso](/es/concepts/usage-tracking)

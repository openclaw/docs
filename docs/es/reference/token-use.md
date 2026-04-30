---
read_when:
    - Explicación del uso de tokens, los costos o las ventanas de contexto
    - Depuración del crecimiento del contexto o del comportamiento de Compaction
summary: Cómo OpenClaw crea el contexto de la instrucción e informa sobre el uso de tokens y los costos
title: Uso de tokens y costos
x-i18n:
    generated_at: "2026-04-30T06:01:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: a3807ccae3313a731c2673edace8a5b37dc22259d436a67b4d787e45682dad3c
    source_path: reference/token-use.md
    workflow: 16
---

# Uso de tokens y costos

OpenClaw rastrea **tokens**, no caracteres. Los tokens son específicos del modelo, pero la mayoría de los modelos al estilo de OpenAI promedian ~4 caracteres por token para texto en inglés.

## Cómo se construye el prompt del sistema

OpenClaw ensambla su propio prompt del sistema en cada ejecución. Incluye:

- Lista de herramientas + descripciones breves
- Lista de Skills (solo metadatos; las instrucciones se cargan bajo demanda con `read`).
  El bloque compacto de Skills está limitado por `skills.limits.maxSkillsPromptChars`,
  con una anulación opcional por agente en
  `agents.list[].skillsLimits.maxSkillsPromptChars`.
- Instrucciones de autoactualización
- Archivos de espacio de trabajo + arranque (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` cuando es nuevo, más `MEMORY.md` cuando está presente). La raíz en minúsculas `memory.md` no se inyecta; es entrada de reparación heredada para `openclaw doctor --fix` cuando se empareja con `MEMORY.md`. Los archivos grandes se truncan mediante `agents.defaults.bootstrapMaxChars` (predeterminado: 12000), y la inyección total de arranque está limitada por `agents.defaults.bootstrapTotalMaxChars` (predeterminado: 60000). Los archivos diarios `memory/*.md` no forman parte del prompt de arranque normal; permanecen disponibles bajo demanda mediante herramientas de memoria en turnos ordinarios, pero las ejecuciones del modelo de reinicio/inicio pueden anteponer un bloque único de contexto de inicio con memoria diaria reciente para ese primer turno. Los comandos de chat simples `/new` y `/reset` se reconocen sin invocar al modelo. El preámbulo de inicio se controla con `agents.defaults.startupContext`.
- Hora (UTC + zona horaria del usuario)
- Etiquetas de respuesta + comportamiento de Heartbeat
- Metadatos de runtime (host/SO/modelo/razonamiento)

Consulta el desglose completo en [Prompt del sistema](/es/concepts/system-prompt).

## Qué cuenta en la ventana de contexto

Todo lo que recibe el modelo cuenta para el límite de contexto:

- Prompt del sistema (todas las secciones indicadas arriba)
- Historial de conversación (mensajes de usuario + asistente)
- Llamadas a herramientas y resultados de herramientas
- Adjuntos/transcripciones (imágenes, audio, archivos)
- Resúmenes de Compaction y artefactos de poda
- Envoltorios del proveedor o encabezados de seguridad (no visibles, pero aun así contabilizados)

Algunas superficies con mucho runtime tienen sus propios límites explícitos:

- `agents.defaults.contextLimits.memoryGetMaxChars`
- `agents.defaults.contextLimits.memoryGetDefaultLines`
- `agents.defaults.contextLimits.toolResultMaxChars`
- `agents.defaults.contextLimits.postCompactionMaxChars`

Las anulaciones por agente viven bajo `agents.list[].contextLimits`. Estos controles son
para extractos de runtime acotados y bloques inyectados propiedad del runtime. Están
separados de los límites de arranque, los límites de contexto de inicio y los límites
del prompt de Skills.

Para imágenes, OpenClaw reduce la escala de las cargas de imágenes de transcripción/herramienta antes de las llamadas al proveedor.
Usa `agents.defaults.imageMaxDimensionPx` (predeterminado: `1200`) para ajustarlo:

- Los valores más bajos suelen reducir el uso de tokens de visión y el tamaño de la carga.
- Los valores más altos preservan más detalle visual para capturas con mucho OCR/UI.

Para un desglose práctico (por archivo inyectado, herramientas, Skills y tamaño del prompt del sistema), usa `/context list` o `/context detail`. Consulta [Contexto](/es/concepts/context).

## Cómo ver el uso actual de tokens

Usa estos comandos en el chat:

- `/status` → **tarjeta de estado rica en emoji** con el modelo de la sesión, uso de contexto,
  tokens de entrada/salida de la última respuesta y **costo estimado** (solo clave de API).
- `/usage off|tokens|full` → agrega un **pie de uso por respuesta** a cada respuesta.
  - Persiste por sesión (almacenado como `responseUsage`).
  - La autenticación OAuth **oculta el costo** (solo tokens).
- `/usage cost` → muestra un resumen local de costos a partir de los registros de sesión de OpenClaw.

Otras superficies:

- **TUI/Web TUI:** `/status` + `/usage` son compatibles.
- **CLI:** `openclaw status --usage` y `openclaw channels list` muestran
  ventanas de cuota de proveedor normalizadas (`X% left`, no costos por respuesta).
  Proveedores actuales de ventana de uso: Anthropic, GitHub Copilot, Gemini CLI,
  OpenAI Codex, MiniMax, Xiaomi y z.ai.

Las superficies de uso normalizan alias comunes de campos nativos del proveedor antes de mostrarlos.
Para tráfico de Responses de la familia OpenAI, eso incluye tanto `input_tokens` /
`output_tokens` como `prompt_tokens` / `completion_tokens`, por lo que los nombres
de campos específicos del transporte no cambian `/status`, `/usage` ni los resúmenes de sesión.
El uso JSON de Gemini CLI también se normaliza: el texto de respuesta viene de `response`, y
`stats.cached` se asigna a `cacheRead`, con `stats.input_tokens - stats.cached`
usado cuando la CLI omite un campo explícito `stats.input`.
Para tráfico nativo de Responses de la familia OpenAI, los alias de uso de WebSocket/SSE se
normalizan de la misma manera, y los totales recurren a entrada + salida normalizadas cuando
`total_tokens` falta o es `0`.
Cuando la instantánea de la sesión actual es escasa, `/status` y `session_status` también pueden
recuperar contadores de tokens/caché y la etiqueta del modelo de runtime activo desde el
registro de uso de transcripción más reciente. Los valores en vivo existentes distintos de cero siguen teniendo
prioridad sobre los valores de respaldo de la transcripción, y los totales de transcripción más grandes orientados al prompt
pueden ganar cuando los totales almacenados faltan o son menores.
La autenticación de uso para ventanas de cuota de proveedor proviene de hooks específicos del proveedor cuando
están disponibles; de lo contrario, OpenClaw recurre a credenciales OAuth/clave de API coincidentes
desde perfiles de autenticación, el entorno o la configuración.
Las entradas de transcripción del asistente persisten la misma forma de uso normalizada, incluido
`usage.cost` cuando el modelo activo tiene precios configurados y el proveedor
devuelve metadatos de uso. Esto les da a `/usage cost` y al estado de sesión respaldado por transcripción
una fuente estable incluso después de que el estado de runtime en vivo haya desaparecido.

OpenClaw mantiene la contabilidad de uso del proveedor separada de la instantánea de contexto
actual. `usage.total` del proveedor puede incluir entrada en caché, salida y múltiples
llamadas de modelo del bucle de herramientas, por lo que es útil para costos y telemetría, pero puede sobrestimar
la ventana de contexto en vivo. Las visualizaciones y diagnósticos de contexto usan la última instantánea de prompt
(`promptTokens`, o la última llamada al modelo cuando no hay instantánea de prompt
disponible) para `context.used`.

## Estimación de costos (cuando se muestra)

Los costos se estiman a partir de tu configuración de precios de modelos:

```
models.providers.<provider>.models[].cost
```

Estos son **USD por 1M tokens** para `input`, `output`, `cacheRead` y
`cacheWrite`. Si faltan precios, OpenClaw muestra solo tokens. Los tokens OAuth
nunca muestran costo en dólares.

El inicio de Gateway también realiza un arranque opcional de precios en segundo plano para
referencias de modelos configuradas que aún no tienen precios locales. Ese arranque
obtiene catálogos remotos de precios de OpenRouter y LiteLLM. Establece
`models.pricing.enabled: false` para omitir esas obtenciones de catálogos al iniciar en redes sin conexión
o restringidas; las entradas explícitas `models.providers.*.models[].cost`
siguen impulsando las estimaciones de costos locales.

## TTL de caché e impacto de poda

El almacenamiento en caché de prompts del proveedor solo se aplica dentro de la ventana TTL de caché. OpenClaw puede
ejecutar opcionalmente **poda de cache-ttl**: poda la sesión una vez que el TTL de caché
ha expirado y luego restablece la ventana de caché para que las solicitudes posteriores puedan reutilizar el
contexto recién almacenado en caché en lugar de volver a almacenar en caché todo el historial. Esto mantiene más bajos
los costos de escritura en caché cuando una sesión queda inactiva más allá del TTL.

Configúralo en [Configuración de Gateway](/es/gateway/configuration) y consulta los
detalles de comportamiento en [Poda de sesión](/es/concepts/session-pruning).

Heartbeat puede mantener la caché **caliente** durante intervalos de inactividad. Si el TTL de caché de tu modelo
es `1h`, establecer el intervalo de heartbeat justo por debajo de eso (por ejemplo, `55m`) puede evitar
volver a almacenar en caché el prompt completo, lo que reduce los costos de escritura en caché.

En configuraciones multiagente, puedes mantener una configuración de modelo compartida y ajustar el comportamiento de caché
por agente con `agents.list[].params.cacheRetention`.

Para una guía completa control por control, consulta [Prompt Caching](/es/reference/prompt-caching).

Para los precios de la API de Anthropic, las lecturas de caché son significativamente más baratas que los tokens de entrada,
mientras que las escrituras de caché se facturan con un multiplicador más alto. Consulta los precios de
almacenamiento en caché de prompts de Anthropic para ver las tarifas y multiplicadores TTL más recientes:
[https://docs.anthropic.com/docs/build-with-claude/prompt-caching](https://docs.anthropic.com/docs/build-with-claude/prompt-caching)

### Ejemplo: mantener caliente la caché de 1h con heartbeat

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

`agents.list[].params` se fusiona sobre los `params` del modelo seleccionado, por lo que puedes
anular solo `cacheRetention` y heredar los demás valores predeterminados del modelo sin cambios.

### Ejemplo: habilitar el encabezado beta de contexto 1M de Anthropic

La ventana de contexto 1M de Anthropic está actualmente protegida por beta. OpenClaw puede inyectar el
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

Esto solo se aplica cuando `context1m: true` está establecido en esa entrada de modelo.

Requisito: la credencial debe ser apta para uso de contexto largo. Si no,
Anthropic responde con un error de límite de tasa del lado del proveedor para esa solicitud.

Si autenticas Anthropic con tokens OAuth/suscripción (`sk-ant-oat-*`),
OpenClaw omite el encabezado beta `context-1m-*` porque Anthropic actualmente
rechaza esa combinación con HTTP 401.

## Consejos para reducir la presión de tokens

- Usa `/compact` para resumir sesiones largas.
- Recorta salidas grandes de herramientas en tus flujos de trabajo.
- Reduce `agents.defaults.imageMaxDimensionPx` para sesiones con muchas capturas de pantalla.
- Mantén breves las descripciones de Skills (la lista de Skills se inyecta en el prompt).
- Prefiere modelos más pequeños para trabajo detallado y exploratorio.

Consulta [Skills](/es/tools/skills) para la fórmula exacta de sobrecarga de la lista de Skills.

## Relacionado

- [Uso y costos de API](/es/reference/api-usage-costs)
- [Prompt caching](/es/reference/prompt-caching)
- [Seguimiento de uso](/es/concepts/usage-tracking)

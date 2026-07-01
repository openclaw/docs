---
read_when:
    - Explicación del uso de tokens, los costos o las ventanas de contexto
    - Depuración del crecimiento del contexto o del comportamiento de Compaction
summary: Cómo OpenClaw crea el contexto del prompt y reporta el uso de tokens + costos
title: Uso y costos de tokens
x-i18n:
    generated_at: "2026-07-01T18:07:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 99e3de70aeb447bb58ae414c2c5908945e8173b9b8f2bf7e4c2eb9781657c44c
    source_path: reference/token-use.md
    workflow: 16
---

OpenClaw rastrea **tokens**, no caracteres. Los tokens son específicos del modelo, pero la mayoría de los modelos de estilo OpenAI promedian ~4 caracteres por token para texto en inglés.

## Cómo se construye el prompt del sistema

OpenClaw ensambla su propio prompt del sistema en cada ejecución. Incluye:

- Lista de herramientas + descripciones breves
- Lista de Skills (solo metadatos; las instrucciones se cargan bajo demanda con `read`).
  Los turnos nativos de Codex reciben el bloque compacto de Skills como instrucciones
  de desarrollador de colaboración con alcance de turno; otros harnesses lo reciben en la superficie
  normal del prompt. Está limitado por `skills.limits.maxSkillsPromptChars`, con
  sobrescritura opcional por agente en `agents.list[].skillsLimits.maxSkillsPromptChars`.
- Instrucciones de autoactualización
- Workspace + archivos de arranque (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` cuando es nuevo, más `MEMORY.md` cuando existe). Los turnos nativos de Codex no pegan el `MEMORY.md` sin procesar desde el workspace del agente configurado cuando las herramientas de memoria están disponibles para ese workspace; incluyen un pequeño puntero de memoria en las instrucciones de desarrollador de colaboración con alcance de turno y usan herramientas de memoria bajo demanda. Si las herramientas están deshabilitadas, la búsqueda de memoria no está disponible o el workspace activo difiere del workspace de memoria del agente, `MEMORY.md` usa la ruta normal acotada de contexto de turno. La raíz en minúsculas `memory.md` no se inyecta; es una entrada de reparación heredada para `openclaw doctor --fix` cuando se combina con `MEMORY.md`. Los archivos grandes inyectados se truncan mediante `agents.defaults.bootstrapMaxChars` (predeterminado: 20000), y la inyección total de arranque está limitada por `agents.defaults.bootstrapTotalMaxChars` (predeterminado: 60000). Los archivos diarios `memory/*.md` no forman parte del prompt de arranque normal; permanecen disponibles bajo demanda mediante herramientas de memoria en turnos ordinarios, pero las ejecuciones del modelo de reinicio/inicio pueden anteponer un bloque de contexto de inicio de un solo uso con memoria diaria reciente para ese primer turno. Los comandos de chat simples `/new` y `/reset` se reconocen sin invocar al modelo. El preámbulo de inicio está controlado por `agents.defaults.startupContext`. Los extractos de AGENTS.md posteriores a Compaction son independientes y requieren una activación explícita de `agents.defaults.compaction.postCompactionSections`.
- Hora (UTC + zona horaria del usuario)
- Etiquetas de respuesta + comportamiento de Heartbeat
- Metadatos de runtime (host/SO/modelo/razonamiento)

Consulta el desglose completo en [Prompt del sistema](/es/concepts/system-prompt).

Al documentar credenciales o fragmentos de autenticación, usa las
[Convenciones de marcadores de posición de secretos](/es/reference/secret-placeholder-conventions) para
evitar falsos positivos de escáneres de secretos en cambios solo de documentación.

## Qué cuenta en la ventana de contexto

Todo lo que recibe el modelo cuenta para el límite de contexto:

- Prompt del sistema (todas las secciones listadas arriba)
- Historial de conversación (mensajes de usuario + asistente)
- Llamadas a herramientas y resultados de herramientas
- Adjuntos/transcripciones (imágenes, audio, archivos)
- Resúmenes de Compaction y artefactos de poda
- Envoltorios del proveedor o encabezados de seguridad (no visibles, pero aun así contados)

Algunas superficies pesadas en runtime tienen sus propios límites explícitos:

- `agents.defaults.contextLimits.memoryGetMaxChars`
- `agents.defaults.contextLimits.memoryGetDefaultLines`
- `agents.defaults.contextLimits.toolResultMaxChars`
- `agents.defaults.contextLimits.postCompactionMaxChars`

Las sobrescrituras por agente viven bajo `agents.list[].contextLimits`. Estos controles son
para extractos acotados de runtime y bloques inyectados propiedad del runtime. Son
independientes de los límites de arranque, los límites de contexto de inicio y los límites del prompt de Skills.

`toolResultMaxChars` es un techo avanzado (hasta `1000000` caracteres). Cuando no está definido, OpenClaw elige
el límite activo de resultados de herramientas a partir de la ventana de contexto efectiva del modelo: `16000` caracteres
por debajo de 100K tokens, `32000` caracteres a partir de 100K tokens y `64000` caracteres a partir de 200K+
tokens, todavía limitado por la protección de cuota de contexto del runtime.

Para imágenes, OpenClaw reduce la escala de las cargas de imagen de transcripción/herramienta antes de las llamadas al proveedor.
Usa `agents.defaults.imageMaxDimensionPx` (predeterminado: `1200`) para ajustar esto:

- Los valores más bajos suelen reducir el uso de tokens de visión y el tamaño de la carga.
- Los valores más altos preservan más detalle visual para OCR/capturas de pantalla con mucha UI.

Para un desglose práctico (por archivo inyectado, herramientas, Skills y tamaño del prompt del sistema), usa `/context list` o `/context detail`. Consulta [Contexto](/es/concepts/context).

## Cómo ver el uso actual de tokens

Usa esto en el chat:

- `/status` → **tarjeta de estado con muchos emojis** con el modelo de la sesión, uso de contexto,
  tokens de entrada/salida de la última respuesta y **coste estimado** cuando los precios locales están
  configurados para el modelo activo.
- `/usage off|tokens|full` → añade un **pie de uso por respuesta** a cada respuesta.
  - Persiste por sesión (almacenado como `responseUsage`).
  - `/usage reset` (alias: `inherit`, `clear`, `default`) — borra la sobrescritura de la sesión
    para que la sesión vuelva a heredar el valor predeterminado configurado.
  - `/usage tokens` muestra detalles de tokens/caché del turno.
  - `/usage full` muestra detalles compactos de modelo/contexto/coste; el coste estimado aparece
    solo cuando OpenClaw tiene metadatos de uso y precios locales para el modelo activo.
    Los diseños personalizados de `messages.usageTemplate` pueden incluir campos de tokens/caché.
- `/usage cost` → muestra un resumen de coste local desde los registros de sesión de OpenClaw.

Otras superficies:

- **TUI/Web TUI:** `/status` + `/usage` están admitidos.
- **CLI:** `openclaw status --usage` y `openclaw channels list` muestran
  ventanas de cuota de proveedor normalizadas (`X% left`, no costes por respuesta).
  Proveedores actuales con ventana de uso: Anthropic, GitHub Copilot, Gemini CLI,
  OpenAI Codex, MiniMax, Xiaomi y z.ai.

Las superficies de uso normalizan alias comunes de campos nativos del proveedor antes de mostrarlos.
Para el tráfico Responses de la familia OpenAI, eso incluye tanto `input_tokens` /
`output_tokens` como `prompt_tokens` / `completion_tokens`, de modo que los nombres de campos específicos
del transporte no cambian `/status`, `/usage` ni los resúmenes de sesión.
El uso de Gemini CLI también se normaliza: el parser predeterminado `stream-json` lee
eventos `message` del asistente, y `stats.cached` se asigna a `cacheRead`, con
`stats.input_tokens - stats.cached` usado cuando la CLI omite un campo explícito
`stats.input`. Las sobrescrituras JSON heredadas todavía leen el texto de respuesta desde
`response`.
Para el tráfico Responses nativo de la familia OpenAI, los alias de uso WebSocket/SSE se
normalizan del mismo modo, y los totales recurren a entrada + salida normalizadas cuando
`total_tokens` falta o es `0`.
Cuando la instantánea de la sesión actual es escasa, `/status` y `session_status` también pueden
recuperar contadores de tokens/caché y la etiqueta del modelo de runtime activo desde el
registro de uso de transcripción más reciente. Los valores activos no nulos existentes siguen teniendo
precedencia sobre los valores alternativos de transcripción, y los totales de transcripción más grandes orientados al prompt
pueden ganar cuando los totales almacenados faltan o son menores.
La autenticación de uso para ventanas de cuota de proveedor proviene de hooks específicos del proveedor cuando
están disponibles; de lo contrario, OpenClaw recurre a credenciales OAuth/API-key coincidentes
desde perfiles de autenticación, entorno o configuración.
Las entradas de transcripción del asistente persisten la misma forma de uso normalizada, incluido
`usage.cost` cuando el modelo activo tiene precios configurados y el proveedor
devuelve metadatos de uso. Esto da a `/usage cost` y al estado de sesión respaldado por transcripción
una fuente estable incluso después de que desaparezca el estado activo del runtime.

OpenClaw mantiene la contabilidad de uso del proveedor separada de la instantánea de contexto actual.
`usage.total` del proveedor puede incluir entrada en caché, salida y múltiples
llamadas al modelo del bucle de herramientas, por lo que es útil para costes y telemetría, pero puede sobrestimar
la ventana de contexto activa. Las visualizaciones y diagnósticos de contexto usan la instantánea de prompt más reciente
(`promptTokens`, o la última llamada al modelo cuando no hay instantánea de prompt
disponible) para `context.used`.

## Estimación de costes (cuando se muestra)

Los costes se estiman desde tu configuración de precios del modelo:

```
models.providers.<provider>.models[].cost
```

Estos son **USD por 1M tokens** para `input`, `output`, `cacheRead` y
`cacheWrite`. Si faltan precios, `/usage full` omite el coste; usa `/usage tokens`
o un `messages.usageTemplate` personalizado cuando necesites detalles de tokens/caché en cada
respuesta. La visualización de costes no se limita a autenticación con API-key: proveedores sin API-key
como `aws-sdk` pueden mostrar coste estimado cuando su entrada de modelo configurada incluye
precios locales y el proveedor devuelve metadatos de uso.

Después de que los sidecars y canales alcancen la ruta lista del Gateway, OpenClaw inicia un
arranque opcional de precios en segundo plano para referencias de modelos configuradas que aún no
tienen precios locales. Ese arranque obtiene catálogos remotos de precios de OpenRouter y LiteLLM.
Define `models.pricing.enabled: false` para omitir esas obtenciones de catálogo
en redes sin conexión o restringidas; las entradas explícitas
`models.providers.*.models[].cost` continúan impulsando las estimaciones locales de coste.

## TTL de caché e impacto de la poda

El almacenamiento en caché de prompts del proveedor solo se aplica dentro de la ventana TTL de caché. OpenClaw puede
ejecutar opcionalmente **poda por ttl de caché**: poda la sesión una vez que el TTL de caché
ha expirado, y luego restablece la ventana de caché para que las solicitudes posteriores puedan reutilizar el
contexto recién cacheado en lugar de volver a cachear todo el historial. Esto mantiene más bajos los
costes de escritura en caché cuando una sesión queda inactiva más allá del TTL.

Configúralo en [Configuración del Gateway](/es/gateway/configuration) y consulta los
detalles de comportamiento en [Poda de sesiones](/es/concepts/session-pruning).

Heartbeat puede mantener la caché **caliente** durante intervalos de inactividad. Si el TTL de caché de tu modelo
es `1h`, establecer el intervalo de Heartbeat justo por debajo de eso (por ejemplo, `55m`) puede evitar
volver a cachear el prompt completo, lo que reduce los costes de escritura en caché.

En configuraciones multiagente, puedes mantener una configuración de modelo compartida y ajustar el comportamiento de caché
por agente con `agents.list[].params.cacheRetention`.

Para una guía completa control por control, consulta [Prompt Caching](/es/reference/prompt-caching).

Para los precios de la API de Anthropic, las lecturas de caché son significativamente más baratas que los tokens
de entrada, mientras que las escrituras de caché se facturan con un multiplicador más alto. Consulta los
precios de prompt caching de Anthropic para conocer las tarifas y multiplicadores TTL más recientes:
[https://docs.anthropic.com/docs/build-with-claude/prompt-caching](https://docs.anthropic.com/docs/build-with-claude/prompt-caching)

### Ejemplo: mantener caliente una caché de 1h con Heartbeat

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

`agents.list[].params` se fusiona encima de los `params` del modelo seleccionado, por lo que puedes
sobrescribir solo `cacheRetention` y heredar los demás valores predeterminados del modelo sin cambios.

### Contexto 1M de Anthropic

OpenClaw dimensiona modelos Claude 4.x con capacidad GA, como Opus 4.8, Opus 4.7, Opus 4.6 y
Sonnet 4.6, con la ventana de contexto 1M de Anthropic. No necesitas
`params.context1m: true` para esos modelos.

```yaml
agents:
  defaults:
    models:
      "anthropic/claude-opus-4-6":
        alias: opus
```

Las configuraciones antiguas pueden mantener `context1m: true`, pero OpenClaw ya no envía
el encabezado beta retirado `context-1m-2025-08-07` de Anthropic para este ajuste y
no expande modelos Claude antiguos no admitidos a 1M.

Requisito: la credencial debe ser apta para uso de contexto largo. Si no,
Anthropic responde con un error de límite de tasa del lado del proveedor para esa solicitud.

Si autenticas Anthropic con tokens OAuth/suscripción (`sk-ant-oat-*`),
OpenClaw preserva los encabezados beta de Anthropic requeridos por OAuth mientras elimina la
beta retirada `context-1m-*` si permanece en una configuración antigua.

## Consejos para reducir la presión de tokens

- Usa `/compact` para resumir sesiones largas.
- Recorta las salidas extensas de herramientas en tus flujos de trabajo.
- Reduce `agents.defaults.imageMaxDimensionPx` para sesiones con muchas capturas de pantalla.
- Mantén breves las descripciones de Skills (la lista de Skills se inyecta en el prompt).
- Prefiere modelos más pequeños para trabajo exploratorio y detallado.

Consulta [Skills](/es/tools/skills) para ver la fórmula exacta de sobrecarga de la lista de Skills.

## Relacionado

- [Uso y costos de API](/es/reference/api-usage-costs)
- [Almacenamiento en caché de prompts](/es/reference/prompt-caching)
- [Seguimiento del uso](/es/concepts/usage-tracking)

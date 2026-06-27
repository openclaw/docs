---
read_when:
    - Explicar el uso de tokens, los costos o las ventanas de contexto
    - Depuración del crecimiento del contexto o del comportamiento de Compaction
summary: Cómo OpenClaw crea el contexto del prompt e informa el uso de tokens y los costos
title: Uso de tokens y costos
x-i18n:
    generated_at: "2026-06-27T12:56:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0035ec9cf8d97aa6e78b9d95549cfb458af3bc2b5a4e2db83708281465c7e1af
    source_path: reference/token-use.md
    workflow: 16
---

OpenClaw registra **tokens**, no caracteres. Los tokens son específicos de cada modelo, pero la mayoría de los modelos de estilo OpenAI promedian ~4 caracteres por token para texto en inglés.

## Cómo se construye el prompt del sistema

OpenClaw ensambla su propio prompt del sistema en cada ejecución. Incluye:

- Lista de herramientas + descripciones breves
- Lista de Skills (solo metadatos; las instrucciones se cargan bajo demanda con `read`).
  Los turnos nativos de Codex reciben el bloque compacto de Skills como instrucciones de desarrollador de colaboración con alcance de turno; otros arneses lo reciben en la superficie normal del prompt. Está limitado por `skills.limits.maxSkillsPromptChars`, con una anulación opcional por agente en `agents.list[].skillsLimits.maxSkillsPromptChars`.
- Instrucciones de autoactualización
- Archivos de espacio de trabajo + arranque (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` cuando es nuevo, además de `MEMORY.md` cuando está presente). Los turnos nativos de Codex no pegan `MEMORY.md` sin procesar desde el espacio de trabajo del agente configurado cuando las herramientas de memoria están disponibles para ese espacio de trabajo; incluyen un pequeño puntero de memoria en las instrucciones de desarrollador de colaboración con alcance de turno y usan herramientas de memoria bajo demanda. Si las herramientas están deshabilitadas, la búsqueda de memoria no está disponible, o el espacio de trabajo activo difiere del espacio de trabajo de memoria del agente, `MEMORY.md` usa la ruta normal acotada de contexto de turno. La raíz en minúsculas `memory.md` no se inyecta; es entrada heredada de reparación para `openclaw doctor --fix` cuando se empareja con `MEMORY.md`. Los archivos inyectados grandes se truncan mediante `agents.defaults.bootstrapMaxChars` (predeterminado: 20000), y la inyección total de arranque se limita mediante `agents.defaults.bootstrapTotalMaxChars` (predeterminado: 60000). Los archivos diarios `memory/*.md` no forman parte del prompt de arranque normal; permanecen disponibles bajo demanda mediante herramientas de memoria en turnos ordinarios, pero las ejecuciones de modelo de restablecimiento/inicio pueden anteponer un bloque único de contexto de inicio con memoria diaria reciente para ese primer turno. Los comandos de chat simples `/new` y `/reset` se reconocen sin invocar el modelo. El preámbulo de inicio se controla con `agents.defaults.startupContext`. Los extractos de AGENTS.md posteriores a Compaction son independientes y requieren la activación explícita de `agents.defaults.compaction.postCompactionSections`.
- Hora (UTC + zona horaria del usuario)
- Etiquetas de respuesta + comportamiento de Heartbeat
- Metadatos de tiempo de ejecución (host/SO/modelo/razonamiento)

Consulta el desglose completo en [Prompt del sistema](/es/concepts/system-prompt).

Al documentar credenciales o fragmentos de autenticación, usa las
[Convenciones de marcadores de posición de secretos](/es/reference/secret-placeholder-conventions) para
evitar falsos positivos de escáneres de secretos en cambios solo de documentación.

## Qué cuenta en la ventana de contexto

Todo lo que recibe el modelo cuenta para el límite de contexto:

- Prompt del sistema (todas las secciones enumeradas arriba)
- Historial de conversación (mensajes de usuario + asistente)
- Llamadas a herramientas y resultados de herramientas
- Adjuntos/transcripciones (imágenes, audio, archivos)
- Resúmenes de Compaction y artefactos de poda
- Envoltorios del proveedor o encabezados de seguridad (no visibles, pero aun así se contabilizan)

Algunas superficies con uso intensivo del tiempo de ejecución tienen sus propios límites explícitos:

- `agents.defaults.contextLimits.memoryGetMaxChars`
- `agents.defaults.contextLimits.memoryGetDefaultLines`
- `agents.defaults.contextLimits.toolResultMaxChars`
- `agents.defaults.contextLimits.postCompactionMaxChars`

Las anulaciones por agente se encuentran en `agents.list[].contextLimits`. Estos controles son para extractos acotados en tiempo de ejecución y bloques inyectados propiedad del tiempo de ejecución. Son independientes de los límites de arranque, los límites de contexto de inicio y los límites del prompt de Skills.

`toolResultMaxChars` es un techo avanzado (hasta `1000000` caracteres). Cuando no está establecido, OpenClaw elige el límite activo de resultados de herramientas a partir de la ventana de contexto efectiva del modelo: `16000` caracteres por debajo de 100K tokens, `32000` caracteres en 100K+ tokens y `64000` caracteres en 200K+ tokens, aún limitado por la protección de participación del contexto del tiempo de ejecución.

Para imágenes, OpenClaw reduce la escala de las cargas útiles de imágenes de transcripción/herramientas antes de las llamadas al proveedor. Usa `agents.defaults.imageMaxDimensionPx` (predeterminado: `1200`) para ajustar esto:

- Los valores más bajos suelen reducir el uso de tokens de visión y el tamaño de la carga útil.
- Los valores más altos conservan más detalle visual para capturas de pantalla con mucho OCR/UI.

Para un desglose práctico (por archivo inyectado, herramientas, Skills y tamaño del prompt del sistema), usa `/context list` o `/context detail`. Consulta [Contexto](/es/concepts/context).

## Cómo ver el uso actual de tokens

Usa estos comandos en el chat:

- `/status` → **tarjeta de estado con abundantes emoji** con el modelo de sesión, el uso de contexto, los tokens de entrada/salida de la última respuesta y el **costo estimado** cuando los precios locales están configurados para el modelo activo.
- `/usage off|tokens|full` → añade un **pie de uso por respuesta** a cada respuesta.
  - Persiste por sesión (almacenado como `responseUsage`).
  - `/usage reset` (alias: `inherit`, `clear`, `default`) — borra la anulación de sesión para que la sesión vuelva a heredar el valor predeterminado configurado.
  - `/usage full` muestra el costo estimado solo cuando OpenClaw tiene metadatos de uso y precios locales para el modelo activo. De lo contrario, muestra solo tokens.
- `/usage cost` → muestra un resumen de costo local a partir de los registros de sesión de OpenClaw.

Otras superficies:

- **TUI/Web TUI:** se admiten `/status` + `/usage`.
- **CLI:** `openclaw status --usage` y `openclaw channels list` muestran
  ventanas de cuota de proveedor normalizadas (`X% left`, no costos por respuesta).
  Proveedores actuales de ventana de uso: Anthropic, GitHub Copilot, Gemini CLI,
  OpenAI Codex, MiniMax, Xiaomi y z.ai.

Las superficies de uso normalizan alias de campos nativos comunes de proveedores antes de mostrarlos. Para tráfico Responses de la familia OpenAI, eso incluye tanto `input_tokens` / `output_tokens` como `prompt_tokens` / `completion_tokens`, por lo que los nombres de campos específicos del transporte no cambian `/status`, `/usage` ni los resúmenes de sesión.
El uso de Gemini CLI también se normaliza: el analizador predeterminado `stream-json` lee eventos `message` del asistente, y `stats.cached` se asigna a `cacheRead` con `stats.input_tokens - stats.cached` utilizado cuando la CLI omite un campo explícito `stats.input`. Las anulaciones JSON heredadas siguen leyendo el texto de respuesta desde `response`.
Para tráfico Responses nativo de la familia OpenAI, los alias de uso de WebSocket/SSE se normalizan de la misma forma, y los totales recurren a entrada + salida normalizadas cuando falta `total_tokens` o es `0`.
Cuando la instantánea de sesión actual es escasa, `/status` y `session_status` también pueden recuperar contadores de tokens/caché y la etiqueta del modelo de tiempo de ejecución activo desde el registro de uso de transcripción más reciente. Los valores activos distintos de cero existentes siguen teniendo precedencia sobre los valores de respaldo de la transcripción, y los totales de transcripción más grandes orientados al prompt pueden ganar cuando los totales almacenados faltan o son menores.
La autenticación de uso para ventanas de cuota de proveedor proviene de hooks específicos del proveedor cuando están disponibles; de lo contrario, OpenClaw recurre a credenciales OAuth/API-key coincidentes de perfiles de autenticación, entorno o configuración.
Las entradas de transcripción del asistente persisten la misma forma de uso normalizada, incluido `usage.cost` cuando el modelo activo tiene precios configurados y el proveedor devuelve metadatos de uso. Esto da a `/usage cost` y al estado de sesión respaldado por transcripciones una fuente estable incluso después de que el estado activo del tiempo de ejecución haya desaparecido.

OpenClaw mantiene la contabilidad de uso del proveedor separada de la instantánea de contexto actual. `usage.total` del proveedor puede incluir entrada en caché, salida y varias llamadas de modelo del bucle de herramientas, por lo que es útil para costos y telemetría, pero puede sobreestimar la ventana de contexto activa. Las visualizaciones y diagnósticos de contexto usan la instantánea de prompt más reciente (`promptTokens`, o la última llamada al modelo cuando no hay una instantánea de prompt disponible) para `context.used`.

## Estimación de costos (cuando se muestra)

Los costos se estiman a partir de la configuración de precios de tu modelo:

```
models.providers.<provider>.models[].cost
```

Estos son **USD por 1M tokens** para `input`, `output`, `cacheRead` y `cacheWrite`. Si faltan precios, OpenClaw muestra solo tokens. La visualización de costos no se limita a autenticación por API-key: los proveedores sin API-key, como `aws-sdk`, pueden mostrar el costo estimado cuando su entrada de modelo configurada incluye precios locales y el proveedor devuelve metadatos de uso.

Después de que sidecars y canales alcancen la ruta lista del Gateway, OpenClaw inicia un arranque opcional de precios en segundo plano para referencias de modelo configuradas que aún no tienen precios locales. Ese arranque obtiene catálogos remotos de precios de OpenRouter y LiteLLM. Establece `models.pricing.enabled: false` para omitir esas recuperaciones de catálogo en redes sin conexión o restringidas; las entradas explícitas `models.providers.*.models[].cost` siguen impulsando las estimaciones de costos locales.

## TTL de caché e impacto de la poda

El almacenamiento en caché del prompt del proveedor solo se aplica dentro de la ventana TTL de caché. OpenClaw puede ejecutar opcionalmente **poda de TTL de caché**: poda la sesión una vez que el TTL de caché ha expirado, luego restablece la ventana de caché para que las solicitudes posteriores puedan reutilizar el contexto recién almacenado en caché en lugar de volver a almacenar en caché todo el historial. Esto mantiene más bajos los costos de escritura de caché cuando una sesión queda inactiva más allá del TTL.

Configúralo en [Configuración de Gateway](/es/gateway/configuration) y consulta los detalles de comportamiento en [Poda de sesiones](/es/concepts/session-pruning).

Heartbeat puede mantener la caché **caliente** durante intervalos de inactividad. Si el TTL de caché de tu modelo es `1h`, configurar el intervalo de Heartbeat justo por debajo de eso (por ejemplo, `55m`) puede evitar volver a almacenar en caché el prompt completo, reduciendo los costos de escritura de caché.

En configuraciones multiagente, puedes mantener una configuración de modelo compartida y ajustar el comportamiento de caché por agente con `agents.list[].params.cacheRetention`.

Para una guía completa control por control, consulta [Almacenamiento en caché de prompts](/es/reference/prompt-caching).

Para los precios de la API de Anthropic, las lecturas de caché son significativamente más baratas que los tokens de entrada, mientras que las escrituras de caché se facturan con un multiplicador más alto. Consulta los precios de almacenamiento en caché de prompts de Anthropic para las tarifas y multiplicadores de TTL más recientes:
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
          cacheRetention: "long" # baseline predeterminado para la mayoría de los agentes
  list:
    - id: "research"
      default: true
      heartbeat:
        every: "55m" # mantener caliente la caché larga para sesiones profundas
    - id: "alerts"
      params:
        cacheRetention: "none" # evitar escrituras de caché para notificaciones en ráfaga
```

`agents.list[].params` se fusiona sobre los `params` del modelo seleccionado, por lo que puedes anular solo `cacheRetention` y heredar sin cambios los demás valores predeterminados del modelo.

### Contexto 1M de Anthropic

OpenClaw dimensiona modelos Claude 4.x compatibles con GA, como Opus 4.8, Opus 4.7, Opus 4.6 y Sonnet 4.6, con la ventana de contexto 1M de Anthropic. No necesitas `params.context1m: true` para esos modelos.

```yaml
agents:
  defaults:
    models:
      "anthropic/claude-opus-4-6":
        alias: opus
```

Las configuraciones antiguas pueden mantener `context1m: true`, pero OpenClaw ya no envía el encabezado beta retirado `context-1m-2025-08-07` de Anthropic para este ajuste y no expande modelos Claude antiguos no compatibles a 1M.

Requisito: la credencial debe ser elegible para uso de contexto largo. Si no lo es, Anthropic responde con un error de límite de tasa del lado del proveedor para esa solicitud.

Si autenticas Anthropic con tokens OAuth/suscripción (`sk-ant-oat-*`), OpenClaw conserva los encabezados beta de Anthropic requeridos por OAuth mientras elimina la beta retirada `context-1m-*` si permanece en configuraciones antiguas.

## Consejos para reducir la presión de tokens

- Usa `/compact` para resumir sesiones largas.
- Recorta salidas grandes de herramientas en tus flujos de trabajo.
- Reduce `agents.defaults.imageMaxDimensionPx` para sesiones con muchas capturas de pantalla.
- Mantén breves las descripciones de Skills (la lista de Skills se inyecta en el prompt).
- Prefiere modelos más pequeños para trabajo exploratorio y detallado.

Consulta [Skills](/es/tools/skills) para conocer la fórmula exacta de sobrecarga de la lista de Skills.

## Relacionado

- [Uso y costos de la API](/es/reference/api-usage-costs)
- [Almacenamiento en caché de prompts](/es/reference/prompt-caching)
- [Seguimiento de uso](/es/concepts/usage-tracking)

---
read_when:
    - Explicación del uso de tokens, los costos o las ventanas de contexto
    - Depurar el crecimiento del contexto o el comportamiento de Compaction
summary: Cómo OpenClaw crea el contexto del prompt e informa el uso de tokens y los costos
title: Uso de tokens y costos
x-i18n:
    generated_at: "2026-07-05T11:46:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 07c79e137d6809ccf8c435ef62641c0cc7579b3ec43acd513e430a7ab91cd47c
    source_path: reference/token-use.md
    workflow: 16
---

OpenClaw registra **tokens**, no caracteres. Los tokens son específicos del modelo, pero la mayoría de los modelos de estilo OpenAI promedian ~4 caracteres por token en texto en inglés.

## Cómo se construye el prompt del sistema

OpenClaw ensambla su propio prompt del sistema en cada ejecución. Incluye:

- Lista de herramientas + descripciones breves
- Lista de Skills (solo metadatos; las instrucciones se cargan bajo demanda con `read`). Los turnos nativos de Codex reciben el bloque compacto de Skills como instrucciones de desarrollador de colaboración con alcance de turno; otros arneses lo reciben en la superficie normal del prompt. Limitado por `skills.limits.maxSkillsPromptChars`, con sobrescritura opcional por agente en `agents.list[].skillsLimits.maxSkillsPromptChars`.
- Instrucciones de autoactualización
- Archivos del espacio de trabajo + arranque (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` cuando son nuevos, más `MEMORY.md` cuando está presente). Los archivos grandes inyectados se truncan mediante `agents.defaults.bootstrapMaxChars` (predeterminado: `20000`); la inyección total de arranque está limitada por `agents.defaults.bootstrapTotalMaxChars` (predeterminado: `60000`).
  - Los turnos nativos de Codex no pegan `MEMORY.md` sin procesar cuando las herramientas de memoria están disponibles para ese espacio de trabajo; en su lugar reciben un pequeño puntero de memoria en las instrucciones de desarrollador de colaboración con alcance de turno y usan las herramientas de memoria bajo demanda. Si las herramientas están deshabilitadas, la búsqueda de memoria no está disponible, o el espacio de trabajo activo difiere del espacio de trabajo de memoria del agente, `MEMORY.md` vuelve a la ruta normal acotada de contexto de turno.
  - La raíz en minúsculas `memory.md` nunca se inyecta. Es entrada de reparación heredada para `openclaw doctor --fix`, que la migra a `MEMORY.md`.
  - Los archivos diarios `memory/*.md` no forman parte del prompt de arranque normal; permanecen bajo demanda mediante herramientas de memoria en turnos ordinarios. Las ejecuciones de modelo de restablecimiento/inicio pueden anteponer un bloque único de contexto de inicio con memoria diaria reciente para ese primer turno, controlado por `agents.defaults.startupContext`. El chat básico `/new` y `/reset` se confirma sin invocar al modelo.
  - Los extractos de `AGENTS.md` posteriores a Compaction son separados y requieren la adhesión explícita de `agents.defaults.compaction.postCompactionSections`.
- Hora (UTC + zona horaria del usuario)
- Etiquetas de respuesta + comportamiento de Heartbeat
- Metadatos de ejecución (host/SO/modelo/razonamiento)

Consulta el desglose completo en [Prompt del sistema](/es/concepts/system-prompt).

Al documentar credenciales o fragmentos de autenticación, usa las [Convenciones de marcador de posición de secreto](/es/reference/secret-placeholder-conventions) para evitar falsos positivos de escáneres de secretos en cambios solo de documentación.

## Qué cuenta en la ventana de contexto

Todo lo que recibe el modelo cuenta para el límite de contexto:

- Prompt del sistema (todas las secciones anteriores)
- Historial de conversación (mensajes de usuario + asistente)
- Llamadas a herramientas y resultados de herramientas
- Adjuntos/transcripciones (imágenes, audio, archivos)
- Resúmenes de Compaction y artefactos de poda
- Envoltorios de proveedor o encabezados de seguridad (no visibles, pero aun así contabilizados)

Las superficies con mucha ejecución tienen sus propios límites explícitos bajo `agents.defaults.contextLimits` (sobrescrituras por agente bajo `agents.list[].contextLimits`):

| Clave                    | Propósito                                                                |
| ------------------------ | ------------------------------------------------------------------------ |
| `memoryGetMaxChars`      | Caracteres máximos que `memory_get` devuelve antes del truncamiento.     |
| `memoryGetDefaultLines`  | Ventana de líneas predeterminada de `memory_get` cuando una solicitud omite `lines`. |
| `toolResultMaxChars`     | Techo avanzado para un único resultado de herramienta en vivo (hasta `1000000` caracteres). |
| `postCompactionMaxChars` | Caracteres máximos conservados de `AGENTS.md` durante la actualización posterior a Compaction. |

Estos son extractos de ejecución acotados y bloques inyectados propiedad de la ejecución, separados de los límites de arranque, los límites de contexto de inicio y los límites del prompt de Skills.

`toolResultMaxChars` no está definido de forma predeterminada, por lo que OpenClaw deriva el límite de resultados de herramienta en vivo a partir de la ventana de contexto efectiva del modelo: `16000` caracteres por debajo de 100K tokens, `32000` caracteres con 100K+ tokens, `64000` caracteres con 200K+ tokens. El guardián de proporción de contexto de ejecución aún limita un único resultado de herramienta al 30% de la ventana de contexto incluso cuando se configura un techo explícito mayor.

Para imágenes, OpenClaw reduce la escala de las cargas de imagen de transcripción/herramienta antes de las llamadas al proveedor. Ajusta con `agents.defaults.imageMaxDimensionPx` (predeterminado: `1200`):

- Valores más bajos reducen el uso de tokens de visión y el tamaño de la carga.
- Valores más altos preservan más detalle visual para capturas de pantalla con mucho OCR/UI.

Para un desglose práctico (por archivo inyectado, herramientas, Skills y tamaño del prompt del sistema), usa `/context list` o `/context detail`. Consulta [Contexto](/es/concepts/context).

## Cómo ver el uso actual de tokens

En el chat:

- `/status` -> tarjeta de estado con emojis con el modelo de la sesión, uso de contexto, tokens de entrada/salida de la última respuesta y costo estimado cuando los precios locales están configurados para el modelo activo.
- `/usage off|tokens|full` -> agrega un pie de uso por respuesta a cada respuesta. Persiste por sesión (almacenado como `responseUsage`).
  - `/usage reset` (alias: `inherit`, `clear`, `default`) borra la sobrescritura de sesión para que vuelva a heredar el valor predeterminado configurado.
  - `/usage tokens` muestra detalles de tokens/caché del turno.
  - `/usage full` muestra detalles compactos de modelo/contexto/costo; el costo estimado aparece solo cuando OpenClaw tiene metadatos de uso y precios locales para el modelo activo. Los diseños personalizados de `messages.usageTemplate` pueden incluir campos de tokens/caché.
- `/usage cost` -> resumen de costo local desde los registros de sesión de OpenClaw.

Otras superficies:

- **TUI/Web TUI:** `/status` y `/usage` son compatibles.
- **CLI:** `openclaw status --usage` y `openclaw channels list` muestran ventanas de cuota de proveedor normalizadas (`X% left`, no costos por respuesta). Proveedores actuales de ventana de uso: Claude (Anthropic), ClawRouter, Copilot (GitHub), DeepSeek, Gemini (Google Gemini CLI), MiniMax, OpenAI, Xiaomi, Xiaomi Token Plan y z.ai.

Las superficies de uso normalizan alias comunes de campos nativos del proveedor antes de mostrarlos. Para tráfico de Responses de la familia OpenAI, eso incluye tanto `input_tokens`/`output_tokens` como `prompt_tokens`/`completion_tokens`, por lo que los nombres de campo específicos del transporte no cambian `/status`, `/usage` ni los resúmenes de sesión. El uso de Gemini CLI también se normaliza: el analizador predeterminado `stream-json` lee eventos `message` del asistente, y `stats.cached` se asigna a `cacheRead`, con `stats.input_tokens - stats.cached` usado cuando la CLI omite un campo explícito `stats.input`. Las sobrescrituras JSON heredadas todavía leen el texto de respuesta desde `response`.

Para tráfico nativo de Responses de la familia OpenAI, los alias de uso WebSocket/SSE se normalizan del mismo modo, y los totales recurren a entrada + salida normalizadas cuando `total_tokens` falta o es `0`.

Cuando la instantánea de sesión actual es escasa, `/status` y `session_status` pueden recuperar contadores de tokens/caché y la etiqueta del modelo de ejecución activo desde el registro de uso de transcripción más reciente. Los valores en vivo existentes distintos de cero aún tienen precedencia sobre los valores de respaldo de transcripción, y los totales de transcripción más grandes orientados al prompt pueden prevalecer cuando los totales almacenados faltan o son menores.

La autenticación de uso para ventanas de cuota de proveedor proviene primero de hooks específicos del proveedor; si un proveedor no tiene hook (o el hook no resuelve un token), OpenClaw recurre a credenciales OAuth/clave de API coincidentes desde perfiles de autenticación, entorno o configuración.

Las entradas de transcripción del asistente persisten la misma forma de uso normalizada, incluido `usage.cost` cuando el modelo activo tiene precios configurados y el proveedor devuelve metadatos de uso. Esto da a `/usage cost` y al estado de sesión respaldado por transcripción una fuente estable incluso después de que el estado de ejecución en vivo haya desaparecido.

OpenClaw mantiene la contabilidad de uso del proveedor separada de la instantánea de contexto actual. `usage.total` del proveedor puede incluir entrada en caché, salida y múltiples llamadas de modelo en bucle de herramientas, por lo que es útil para costos y telemetría, pero puede exagerar la ventana de contexto en vivo. Las pantallas de contexto y diagnósticos usan la instantánea de prompt más reciente (`promptTokens`, o la última llamada de modelo cuando no hay una instantánea de prompt disponible) para `context.used`.

## Estimación de costos (cuando se muestra)

Los costos se estiman a partir de tu configuración de precios del modelo:

```text
models.providers.<provider>.models[].cost
```

Estos son **USD por 1M tokens** para `input`, `output`, `cacheRead` y `cacheWrite`. Si faltan precios, `/usage full` omite el costo; usa `/usage tokens` o un `messages.usageTemplate` personalizado cuando necesites detalles de tokens/caché en cada respuesta. La visualización de costos no se limita a autenticación con clave de API: los proveedores sin clave de API como `aws-sdk` pueden mostrar costo estimado cuando su entrada de modelo configurada incluye precios locales y el proveedor devuelve metadatos de uso.

Después de que los sidecars y canales alcanzan la ruta lista del Gateway, OpenClaw inicia un arranque opcional de precios en segundo plano para referencias de modelo configuradas que aún no tienen precios locales. Ese arranque obtiene catálogos remotos de precios de OpenRouter y LiteLLM. Establece `models.pricing.enabled: false` para omitir esas obtenciones de catálogo en redes sin conexión o restringidas; las entradas explícitas `models.providers.*.models[].cost` aún impulsan las estimaciones de costo locales.

## TTL de caché e impacto de poda

El almacenamiento en caché de prompt del proveedor solo se aplica dentro de la ventana de TTL de caché. OpenClaw puede ejecutar opcionalmente **poda por TTL de caché**: poda la sesión una vez que el TTL de caché ha expirado, luego restablece la ventana de caché para que las solicitudes posteriores reutilicen el contexto recién almacenado en caché en lugar de volver a almacenar en caché todo el historial. Esto mantiene más bajos los costos de escritura en caché cuando una sesión queda inactiva más allá del TTL.

Configúralo en [configuración del Gateway](/es/gateway/configuration) y consulta los detalles del comportamiento en [Poda de sesión](/es/concepts/session-pruning).

Heartbeat puede mantener la caché **caliente** entre pausas de inactividad. Si el TTL de caché de tu modelo es `1h`, establecer el intervalo de Heartbeat justo por debajo de eso (por ejemplo, `55m`) puede evitar volver a almacenar en caché todo el prompt, reduciendo los costos de escritura en caché.

En configuraciones multiagente, puedes mantener una configuración de modelo compartida y ajustar el comportamiento de caché por agente con `agents.list[].params.cacheRetention`.

Para una guía completa control por control, consulta [Almacenamiento de prompt en caché](/es/reference/prompt-caching).

Para precios de la API de Anthropic, las lecturas de caché son significativamente más baratas que los tokens de entrada, mientras que las escrituras de caché se facturan con un multiplicador mayor. Consulta los precios de almacenamiento de prompt en caché de Anthropic para las tarifas y multiplicadores de TTL más recientes:
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

`agents.list[].params` se combina sobre los `params` del modelo seleccionado, por lo que puedes sobrescribir solo `cacheRetention` y heredar otros valores predeterminados del modelo sin cambios.

### Contexto de 1M de Anthropic

OpenClaw dimensiona modelos Claude 4.x aptos para disponibilidad general, como Opus 4.8, Opus 4.7, Opus 4.6 y Sonnet 4.6, con la ventana de contexto de 1M de Anthropic. No necesitas `params.context1m: true` para esos modelos.

```yaml
agents:
  defaults:
    models:
      "anthropic/claude-opus-4-6":
        alias: opus
```

Las configuraciones antiguas pueden conservar `context1m: true`, pero OpenClaw ya no envía el encabezado beta retirado de Anthropic `context-1m-2025-08-07` para esta opción y no expande modelos Claude antiguos no compatibles a 1M.

Requisito: la credencial debe ser apta para el uso de contexto largo. Si no lo es,
Anthropic responde con un error de límite de tasa del proveedor para esa solicitud.

Si autenticas Anthropic con tokens de OAuth/suscripción
(`sk-ant-oat-*`), OpenClaw conserva los encabezados beta de Anthropic requeridos por OAuth
mientras elimina la beta retirada `context-1m-*` si permanece en
configuración antigua.

## Consejos para reducir la presión de tokens

- Usa `/compact` para resumir sesiones largas.
- Recorta salidas grandes de herramientas en tus flujos de trabajo.
- Reduce `agents.defaults.imageMaxDimensionPx` para sesiones con muchas capturas de pantalla.
- Mantén breves las descripciones de Skills (la lista de Skills se inyecta en el prompt).
- Prefiere modelos más pequeños para trabajo detallado y exploratorio.

Consulta [Skills](/es/tools/skills) para ver la fórmula exacta de sobrecarga de la lista de Skills.

## Relacionado

- [Uso y costos de API](/es/reference/api-usage-costs)
- [Almacenamiento en caché de prompts](/es/reference/prompt-caching)
- [Seguimiento de uso](/es/concepts/usage-tracking)

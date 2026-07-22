---
read_when:
    - Explicación del uso de tokens, los costes o las ventanas de contexto
    - Depuración del crecimiento del contexto o del comportamiento de Compaction
summary: Cómo OpenClaw crea el contexto del prompt e informa del uso de tokens y los costes
title: Uso de tokens y costes
x-i18n:
    generated_at: "2026-07-22T10:48:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: fb5d4980f73c293363ba7784fb52e7331799c327b43f1d8eabb1a18e07a62a13
    source_path: reference/token-use.md
    workflow: 16
---

OpenClaw realiza el seguimiento de **tokens**, no de caracteres. Los tokens son específicos de cada modelo, pero la mayoría de los modelos
de estilo OpenAI tienen un promedio de ~4 caracteres por token para el texto en inglés.

## Cómo se construye el prompt del sistema

OpenClaw ensambla su propio prompt del sistema en cada ejecución. Incluye:

- Lista de herramientas + descripciones breves
- Lista de Skills (solo metadatos; las instrucciones se cargan bajo demanda con `read`). Los turnos nativos
  de Codex reciben el bloque compacto de Skills como instrucciones de desarrollador
  de colaboración limitadas al turno; otros entornos de ejecución lo reciben en la superficie normal del prompt.
  Limitado por `skills.limits.maxSkillsPromptChars`, con una sustitución opcional por agente
  en `agents.entries.*.skillsLimits.maxSkillsPromptChars`.
- Instrucciones de actualización automática
- Espacio de trabajo + archivos de arranque (`AGENTS.md`, `SOUL.md`, `TOOLS.md`,
  `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` cuando es nuevo, además de
  `MEMORY.md` cuando está presente). Los archivos grandes inyectados se truncan mediante
  `agents.defaults.bootstrapMaxChars` (valor predeterminado: `20000`); la inyección total
  de arranque está limitada por `agents.defaults.bootstrapTotalMaxChars` (valor predeterminado:
  `60000`).
  - Los turnos nativos de Codex no insertan `MEMORY.md` sin procesar cuando las herramientas de memoria están
    disponibles para ese espacio de trabajo; en su lugar, reciben un pequeño puntero de memoria en
    las instrucciones de desarrollador de colaboración limitadas al turno y usan las herramientas de memoria
    bajo demanda. Si las herramientas están desactivadas, la búsqueda en memoria no está disponible o
    el espacio de trabajo activo difiere del espacio de trabajo de memoria del agente, `MEMORY.md`
    recurre a la ruta normal de contexto limitado del turno.
  - El archivo raíz en minúsculas `memory.md` nunca se inyecta. Es una entrada de reparación heredada
    para `openclaw doctor --fix`, que la migra a `MEMORY.md`.
  - Los archivos diarios `memory/*.md` no forman parte del prompt normal de arranque;
    permanecen disponibles bajo demanda mediante las herramientas de memoria en los turnos ordinarios. Las ejecuciones del modelo
    de restablecimiento/inicio pueden anteponer un bloque de contexto de inicio de un solo uso con la memoria
    diaria reciente para ese primer turno, controlado por
    `agents.defaults.startupContext`. Los mensajes de chat aislados `/new` y `/reset` se
    confirman sin invocar el modelo.
  - Los extractos de `AGENTS.md` posteriores a la Compaction requieren la habilitación explícita
    mediante `agents.defaults.compaction.postCompactionSections`; los plugins pueden añadir
    otro contexto mediante `before_prompt_build`.
- Hora (UTC + zona horaria del usuario)
- Etiquetas de respuesta + comportamiento de Heartbeat
- Metadatos del entorno de ejecución (host/SO/modelo/razonamiento)

Consulte el desglose completo en [Prompt del sistema](/es/concepts/system-prompt).

Al documentar credenciales o fragmentos de autenticación, use las
[Convenciones de marcadores de posición de secretos](/es/reference/secret-placeholder-conventions) para
evitar falsos positivos del escáner de secretos en cambios exclusivos de documentación.

## Qué cuenta en la ventana de contexto

Todo lo que recibe el modelo cuenta para el límite de contexto:

- Prompt del sistema (todas las secciones anteriores)
- Historial de conversación (mensajes del usuario + asistente)
- Llamadas a herramientas y resultados de herramientas
- Archivos adjuntos/transcripciones (imágenes, audio, archivos)
- Resúmenes de Compaction y artefactos de poda
- Envoltorios del proveedor o encabezados de seguridad (no visibles, pero también se contabilizan)

Las superficies con uso intensivo del entorno de ejecución tienen sus propios límites explícitos en
`agents.defaults.contextLimits` (sustituciones por agente en
`agents.entries.*.contextLimits`):

| Clave                    | Finalidad                                                                |
| ------------------------ | ------------------------------------------------------------------------ |
| `memoryGetMaxChars`      | Máximo de caracteres que devuelve `memory_get` antes del truncamiento.   |
| `memoryGetDefaultLines`  | Ventana de líneas predeterminada de `memory_get` cuando una solicitud omite `lines`. |
| `toolResultMaxChars`     | Límite avanzado para un único resultado de herramienta en vivo (hasta `1000000` caracteres). |
| `postCompactionMaxChars` | Máximo de caracteres conservados de `AGENTS.md` durante la actualización posterior a la Compaction. |

Estos son extractos limitados del entorno de ejecución y bloques inyectados propiedad del entorno de ejecución,
independientes de los límites de arranque, los límites del contexto de inicio y los límites
del prompt de Skills.

`toolResultMaxChars` no está configurado de forma predeterminada, por lo que OpenClaw deriva el límite
de resultados de herramientas en vivo de la ventana de contexto efectiva del modelo: `16000` caracteres por debajo de
100K tokens, `32000` caracteres con 100K+ tokens y `64000` caracteres con 200K+ tokens.
La protección de proporción del contexto del entorno de ejecución sigue limitando un único resultado de herramienta al 30 % de la
ventana de contexto, incluso cuando se configura un límite explícito mayor.

Para las imágenes, OpenClaw reduce la resolución de las cargas útiles de imágenes de transcripciones/herramientas antes de
las llamadas al proveedor. Ajústelo con `agents.defaults.imageMaxDimensionPx` (valor predeterminado:
`1200`):

- Los valores más bajos reducen el uso de tokens de visión y el tamaño de la carga útil.
- Los valores más altos conservan más detalle visual para capturas de pantalla con uso intensivo de OCR/UI.

Para obtener un desglose práctico (por archivo inyectado, herramientas, Skills y tamaño del
prompt del sistema), use `/context list` o `/context detail`. Consulte
[Contexto](/es/concepts/context).

## Cómo consultar el uso actual de tokens

En el chat:

- `/status` -> tarjeta de estado con abundantes emojis que muestra el modelo de la sesión, el uso del contexto,
  los tokens de entrada/salida de la última respuesta y el coste estimado cuando se han configurado
  precios locales para el modelo activo.
- `/usage off|tokens|full` -> añade un pie de uso por respuesta a cada
  respuesta. Persiste durante la sesión (se almacena como `responseUsage`).
  - `/usage reset` (alias: `inherit`, `clear`, `default`) elimina la
    sustitución de la sesión para que vuelva a heredar el valor predeterminado configurado.
  - `/usage tokens` muestra los detalles de tokens/caché del turno.
  - `/usage full` muestra detalles compactos del modelo/contexto/coste; el coste estimado
    solo aparece cuando OpenClaw dispone de metadatos de uso y precios locales para el
    modelo activo. Los diseños personalizados de `messages.usageTemplate` pueden incluir
    campos de tokens/caché.
- `/usage cost` -> resumen local de costes procedente de los registros de sesión de OpenClaw.

Otras superficies:

- **TUI/TUI web:** se admiten `/status` y `/usage`.
- **CLI:** `openclaw status --usage` y `openclaw channels list` muestran
  ventanas normalizadas de cuota del proveedor (`X% left`, no costes por respuesta).
  Proveedores actuales de ventanas de uso: Claude (Anthropic), ClawRouter, Copilot
  (GitHub), DeepSeek, Gemini (Google Gemini CLI), MiniMax, OpenAI, Xiaomi,
  Xiaomi Token Plan y z.ai.

Las superficies de uso normalizan los alias habituales de campos nativos del proveedor antes de
mostrarlos. Para el tráfico Responses de la familia OpenAI, esto incluye tanto
`input_tokens`/`output_tokens` como `prompt_tokens`/`completion_tokens`, de modo que
los nombres de campo específicos del transporte no cambien `/status`, `/usage` ni los resúmenes
de sesión. El uso de Gemini CLI también se normaliza: el analizador predeterminado `stream-json`
lee los eventos `message` del asistente, y `stats.cached` se asigna a
`cacheRead`, usando `stats.input_tokens - stats.cached` cuando la CLI omite
un campo `stats.input` explícito. Las sustituciones JSON heredadas siguen leyendo el texto de respuesta
de `response`.

Para el tráfico Responses nativo de la familia OpenAI, los alias de uso de WebSocket/SSE
se normalizan del mismo modo, y los totales recurren a la suma normalizada de entrada + salida
cuando falta `total_tokens` o es `0`.

Cuando la instantánea de la sesión actual contiene pocos datos, `/status` y `session_status`
pueden recuperar los contadores de tokens/caché y la etiqueta del modelo activo del entorno de ejecución a partir del
registro de uso de transcripción más reciente. Los valores en vivo existentes distintos de cero siguen teniendo
prioridad sobre los valores alternativos de la transcripción, y los totales de transcripción
más elevados y orientados al prompt pueden prevalecer cuando los totales almacenados faltan o son menores.

La autenticación de uso para las ventanas de cuota del proveedor procede primero de enlaces específicos
del proveedor; si un proveedor no tiene ningún enlace (o el enlace no resuelve un token),
OpenClaw recurre a credenciales OAuth/clave de API coincidentes de los perfiles
de autenticación, las variables de entorno o la configuración.

Las entradas de transcripción del asistente conservan la misma estructura de uso normalizada,
incluido `usage.cost` cuando el modelo activo tiene precios configurados y el
proveedor devuelve metadatos de uso. Esto proporciona a `/usage cost` y al
estado de sesión respaldado por transcripciones una fuente estable incluso después de que haya desaparecido el estado
del entorno de ejecución en vivo.

OpenClaw mantiene la contabilidad de uso del proveedor separada de la instantánea de contexto
actual. El `usage.total` del proveedor puede incluir entrada almacenada en caché, salida y
varias llamadas al modelo en bucles de herramientas, por lo que resulta útil para los costes y la telemetría, pero
puede sobreestimar la ventana de contexto en vivo. Las visualizaciones y los diagnósticos del contexto usan
la instantánea de prompt más reciente (`promptTokens`, o la última llamada al modelo cuando no hay
ninguna instantánea de prompt disponible) para `context.used`.

## Estimación de costes (cuando se muestra)

Los costes se estiman a partir de la configuración de precios del modelo:

```text
models.providers.<provider>.models[].cost
```

Estos valores están expresados en **USD por 1M de tokens** para `input`, `output`, `cacheRead` y
`cacheWrite`. Si faltan los precios, `/usage full` omite el coste; use
`/usage tokens` o un `messages.usageTemplate` personalizado cuando necesite
detalles de tokens/caché en cada respuesta. La visualización de costes no se limita a la autenticación mediante clave de API:
los proveedores sin clave de API, como `aws-sdk`, pueden mostrar el coste estimado cuando
la entrada del modelo configurado incluye precios locales y el proveedor
devuelve metadatos de uso.

Una vez que los procesos auxiliares y los canales alcanzan la ruta preparada del Gateway, OpenClaw inicia una
carga inicial opcional de precios en segundo plano para las referencias de modelos configuradas que aún no
tienen precios locales. Esta carga inicial obtiene catálogos remotos de precios de OpenRouter y
LiteLLM. Configure `models.pricing.enabled: false` para omitir esas
consultas de catálogos en redes sin conexión o restringidas; las entradas explícitas
`models.providers.*.models[].cost` seguirán determinando las estimaciones de costes locales.

## Impacto del TTL de caché y la poda

El almacenamiento en caché del prompt del proveedor solo se aplica dentro de la ventana del TTL de caché. OpenClaw
puede ejecutar opcionalmente la **poda por TTL de caché**: poda la sesión una vez que
el TTL de caché ha caducado y, a continuación, restablece la ventana de caché para que las solicitudes posteriores
reutilicen el contexto recién almacenado en caché en lugar de volver a almacenar en caché todo el historial.
Esto reduce los costes de escritura en caché cuando una sesión permanece inactiva más allá del TTL.

Configúrelo en [Configuración del Gateway](/es/gateway/configuration) y consulte los
detalles del comportamiento en [Poda de sesiones](/es/concepts/session-pruning).

Heartbeat puede mantener la caché **activa** durante los periodos de inactividad. Si el TTL de caché
del modelo es `1h`, configurar el intervalo de Heartbeat justo por debajo de ese valor (por ejemplo, `55m`) puede
evitar que se vuelva a almacenar en caché todo el prompt, lo que reduce los costes de escritura en caché.

En configuraciones con varios agentes, puede conservar una configuración compartida del modelo y ajustar el comportamiento
de la caché por agente mediante `agents.entries.*.params.cacheRetention`.

Para consultar una guía completa de cada ajuste, consulte [Almacenamiento en caché del prompt](/es/reference/prompt-caching).

En los precios de la API de Anthropic, las lecturas de caché son considerablemente más baratas que los tokens
de entrada, mientras que las escrituras de caché se facturan con un multiplicador mayor. Consulte los precios
del almacenamiento en caché del prompt de Anthropic para conocer las tarifas y los multiplicadores de TTL más recientes:
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

### Ejemplo: tráfico mixto con una estrategia de caché por agente

```yaml
agents:
  defaults:
    model:
      primary: "anthropic/claude-opus-4-6"
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "long" # base predeterminada para la mayoría de los agentes
  list:
    - id: "research"
      default: true
      heartbeat:
        every: "55m" # mantener activa la caché de larga duración para sesiones profundas
    - id: "alerts"
      params:
        cacheRetention: "none" # evitar escrituras en caché para notificaciones en ráfagas
```

`agents.entries.*.params` se combina sobre `params` del modelo seleccionado, por lo que se
puede sobrescribir únicamente `cacheRetention` y heredar los demás valores predeterminados
del modelo sin cambios.

### Contexto de 1M de Anthropic

OpenClaw configura los tamaños de los modelos Claude 4.x con disponibilidad general, como Opus 4.8, Opus 4.7, Opus
4.6 y Sonnet 4.6, con la ventana de contexto de 1M de Anthropic. No se necesita
`params.context1m: true` para esos modelos.

```yaml
agents:
  defaults:
    models:
      "anthropic/claude-opus-4-6":
        alias: opus
```

Las configuraciones anteriores pueden conservar `context1m: true`, pero OpenClaw ya no envía
el encabezado beta retirado `context-1m-2025-08-07` de Anthropic para este ajuste ni
amplía a 1M los modelos Claude anteriores no compatibles.

Requisito: la credencial debe ser apta para el uso de contexto largo. De lo contrario,
Anthropic responde con un error de límite de frecuencia del proveedor para esa solicitud.

Si se autentica Anthropic con tokens de OAuth/suscripción
(`sk-ant-oat-*`), OpenClaw conserva los encabezados beta de Anthropic
requeridos por OAuth y elimina el valor beta retirado `context-1m-*` si permanece en
una configuración anterior.

## Consejos para reducir la presión de tokens

- Use `/compact` para resumir sesiones largas.
- Recorte las salidas extensas de las herramientas en los flujos de trabajo.
- Reduzca `agents.defaults.imageMaxDimensionPx` para las sesiones con muchas capturas de pantalla.
- Mantenga breves las descripciones de las skills (la lista de skills se inserta en el prompt).
- Prefiera modelos más pequeños para trabajos detallados y exploratorios.

Consulte [Skills](/es/tools/skills) para conocer la fórmula exacta de la sobrecarga de la lista de skills.

## Temas relacionados

- [Uso y costes de la API](/es/reference/api-usage-costs)
- [Almacenamiento en caché de prompts](/es/reference/prompt-caching)
- [Seguimiento del uso](/es/concepts/usage-tracking)

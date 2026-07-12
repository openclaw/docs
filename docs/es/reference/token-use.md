---
read_when:
    - Explicación del uso de tokens, los costes o las ventanas de contexto
    - Depuración del crecimiento del contexto o del comportamiento de Compaction
summary: Cómo OpenClaw crea el contexto del prompt e informa del uso de tokens y los costes
title: Uso de tokens y costes
x-i18n:
    generated_at: "2026-07-11T23:33:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 07c79e137d6809ccf8c435ef62641c0cc7579b3ec43acd513e430a7ab91cd47c
    source_path: reference/token-use.md
    workflow: 16
---

OpenClaw realiza el seguimiento de **tokens**, no de caracteres. Los tokens dependen del modelo, pero la mayoría de los modelos
del estilo de OpenAI promedian unos 4 caracteres por token para texto en inglés.

## Cómo se construye el prompt del sistema

OpenClaw compone su propio prompt del sistema en cada ejecución. Incluye:

- Lista de herramientas y descripciones breves
- Lista de Skills (solo metadatos; las instrucciones se cargan bajo demanda con `read`). Los turnos nativos de
  Codex reciben el bloque compacto de Skills como instrucciones de desarrollador para la colaboración
  limitadas al turno; otros entornos de ejecución lo reciben en la superficie normal del prompt.
  Está limitado por `skills.limits.maxSkillsPromptChars`, con una sobrescritura opcional por agente
  en `agents.list[].skillsLimits.maxSkillsPromptChars`.
- Instrucciones de actualización automática
- Archivos del espacio de trabajo y de arranque (`AGENTS.md`, `SOUL.md`, `TOOLS.md`,
  `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` cuando es nuevo, además de
  `MEMORY.md` cuando está presente). Los archivos grandes inyectados se truncan según
  `agents.defaults.bootstrapMaxChars` (valor predeterminado: `20000`); la inyección total
  de arranque está limitada por `agents.defaults.bootstrapTotalMaxChars` (valor predeterminado:
  `60000`).
  - Los turnos nativos de Codex no insertan el contenido sin procesar de `MEMORY.md` cuando hay herramientas de memoria
    disponibles para ese espacio de trabajo; en su lugar, reciben un pequeño indicador de memoria en las
    instrucciones de desarrollador para la colaboración limitadas al turno y usan las herramientas de memoria
    bajo demanda. Si las herramientas están deshabilitadas, la búsqueda en memoria no está disponible o
    el espacio de trabajo activo difiere del espacio de trabajo de memoria del agente, `MEMORY.md`
    recurre a la ruta normal de contexto del turno con límites.
  - El archivo raíz `memory.md` en minúsculas nunca se inyecta. Es una entrada de reparación heredada
    para `openclaw doctor --fix`, que lo migra a `MEMORY.md`.
  - Los archivos diarios `memory/*.md` no forman parte del prompt normal de arranque;
    permanecen disponibles bajo demanda mediante herramientas de memoria en los turnos ordinarios. Las ejecuciones
    del modelo por restablecimiento o inicio pueden anteponer un bloque de contexto de inicio de un solo uso con la
    memoria diaria reciente para ese primer turno, controlado por
    `agents.defaults.startupContext`. Los comandos de chat simples `/new` y `/reset` se
    confirman sin invocar el modelo.
  - Los extractos de `AGENTS.md` posteriores a Compaction son independientes y requieren la activación explícita
    mediante `agents.defaults.compaction.postCompactionSections`.
- Hora (UTC y zona horaria del usuario)
- Etiquetas de respuesta y comportamiento de Heartbeat
- Metadatos del entorno de ejecución (host/SO/modelo/razonamiento)

Consulta el desglose completo en [Prompt del sistema](/es/concepts/system-prompt).

Al documentar credenciales o fragmentos de autenticación, utiliza las
[Convenciones de marcadores de posición para secretos](/es/reference/secret-placeholder-conventions) para
evitar falsos positivos del escáner de secretos en cambios exclusivos de documentación.

## Qué cuenta en la ventana de contexto

Todo lo que recibe el modelo cuenta para el límite de contexto:

- Prompt del sistema (todas las secciones anteriores)
- Historial de la conversación (mensajes del usuario y del asistente)
- Llamadas a herramientas y resultados de herramientas
- Archivos adjuntos/transcripciones (imágenes, audio, archivos)
- Resúmenes de Compaction y artefactos de poda
- Envoltorios del proveedor o encabezados de seguridad (no visibles, pero se contabilizan)

Las superficies con un uso intensivo del entorno de ejecución tienen sus propios límites explícitos en
`agents.defaults.contextLimits` (con sobrescrituras por agente en
`agents.list[].contextLimits`):

| Clave                    | Propósito                                                                                  |
| ------------------------ | ------------------------------------------------------------------------------------------ |
| `memoryGetMaxChars`      | Máximo de caracteres que devuelve `memory_get` antes del truncamiento.                     |
| `memoryGetDefaultLines`  | Ventana predeterminada de líneas de `memory_get` cuando una solicitud omite `lines`.        |
| `toolResultMaxChars`     | Límite avanzado para un único resultado de herramienta en vivo (hasta `1000000` caracteres). |
| `postCompactionMaxChars` | Máximo de caracteres conservados de `AGENTS.md` durante la actualización posterior a Compaction. |

Estos son extractos limitados del entorno de ejecución y bloques inyectados propiedad de este,
independientes de los límites de arranque, los límites del contexto de inicio y los límites
del prompt de Skills.

`toolResultMaxChars` no está definido de forma predeterminada, por lo que OpenClaw deriva el límite
de resultados de herramientas en vivo a partir de la ventana de contexto efectiva del modelo: `16000` caracteres por debajo de
100 000 tokens, `32000` caracteres a partir de 100 000 tokens y `64000` caracteres a partir de 200 000 tokens.
La protección de proporción del contexto del entorno de ejecución sigue limitando un único resultado de herramienta al 30 % de la
ventana de contexto, incluso cuando se configura un límite explícito mayor.

Para las imágenes, OpenClaw reduce la resolución de las cargas útiles de imágenes de transcripciones y herramientas antes de
las llamadas al proveedor. Ajústalo con `agents.defaults.imageMaxDimensionPx` (valor predeterminado:
`1200`):

- Los valores más bajos reducen el uso de tokens de visión y el tamaño de la carga útil.
- Los valores más altos conservan más detalle visual para capturas de pantalla con mucho contenido de OCR o interfaz.

Para obtener un desglose práctico (por archivo inyectado, herramientas, Skills y tamaño del prompt
del sistema), utiliza `/context list` o `/context detail`. Consulta
[Contexto](/es/concepts/context).

## Cómo consultar el uso actual de tokens

En el chat:

- `/status` -> tarjeta de estado con abundantes emojis que muestra el modelo de la sesión, el uso del contexto,
  los tokens de entrada/salida de la última respuesta y el costo estimado cuando hay precios locales
  configurados para el modelo activo.
- `/usage off|tokens|full` -> añade un pie de uso por respuesta a cada
  respuesta. Se conserva por sesión (almacenado como `responseUsage`).
  - `/usage reset` (alias: `inherit`, `clear`, `default`) elimina la
    sobrescritura de la sesión para que vuelva a heredar el valor predeterminado configurado.
  - `/usage tokens` muestra los detalles de tokens y caché del turno.
  - `/usage full` muestra detalles compactos del modelo, contexto y costo; el costo estimado
    solo aparece cuando OpenClaw dispone de metadatos de uso y precios locales para el
    modelo activo. Los diseños personalizados de `messages.usageTemplate` pueden incluir
    campos de tokens y caché.
- `/usage cost` -> resumen de costos locales a partir de los registros de sesión de OpenClaw.

Otras superficies:

- **TUI/TUI web:** se admiten `/status` y `/usage`.
- **CLI:** `openclaw status --usage` y `openclaw channels list` muestran
  ventanas normalizadas de cuota del proveedor (`X% left`, no costos por respuesta).
  Los proveedores actuales de ventanas de uso son: Claude (Anthropic), ClawRouter, Copilot
  (GitHub), DeepSeek, Gemini (Google Gemini CLI), MiniMax, OpenAI, Xiaomi,
  Xiaomi Token Plan y z.ai.

Las superficies de uso normalizan los alias comunes de campos nativos de los proveedores antes
de mostrarlos. Para el tráfico de Responses de la familia OpenAI, esto incluye tanto
`input_tokens`/`output_tokens` como `prompt_tokens`/`completion_tokens`, por lo que
los nombres de campos específicos del transporte no modifican `/status`, `/usage` ni los resúmenes
de sesión. El uso de Gemini CLI también se normaliza: el analizador predeterminado `stream-json`
lee los eventos `message` del asistente, y `stats.cached` se asigna a
`cacheRead`; se utiliza `stats.input_tokens - stats.cached` cuando la CLI omite
un campo `stats.input` explícito. Las sobrescrituras JSON heredadas siguen leyendo el texto de la respuesta
desde `response`.

Para el tráfico nativo de Responses de la familia OpenAI, los alias de uso de WebSocket/SSE
se normalizan del mismo modo, y los totales recurren a la suma de entrada y salida normalizadas
cuando falta `total_tokens` o su valor es `0`.

Cuando la instantánea de la sesión actual contiene pocos datos, `/status` y `session_status`
pueden recuperar los contadores de tokens/caché y la etiqueta del modelo activo en el entorno de ejecución desde el
registro de uso más reciente de la transcripción. Los valores activos distintos de cero siguen teniendo
prioridad sobre los valores de respaldo de la transcripción, y los totales más altos de la transcripción
orientados al prompt pueden prevalecer cuando los totales almacenados faltan o son menores.

La autenticación de uso para las ventanas de cuota del proveedor procede primero de hooks
específicos del proveedor; si un proveedor no tiene ningún hook (o el hook no resuelve un token),
OpenClaw recurre a credenciales OAuth o de clave de API coincidentes procedentes de perfiles
de autenticación, variables de entorno o la configuración.

Las entradas de la transcripción del asistente conservan la misma estructura de uso normalizada,
incluido `usage.cost` cuando el modelo activo tiene precios configurados y el
proveedor devuelve metadatos de uso. Esto proporciona a `/usage cost` y al
estado de sesión respaldado por la transcripción una fuente estable incluso después de que desaparezca el
estado activo del entorno de ejecución.

OpenClaw mantiene la contabilidad de uso del proveedor separada de la instantánea actual del contexto.
El valor `usage.total` del proveedor puede incluir entrada almacenada en caché, salida y
varias llamadas al modelo en bucles de herramientas, por lo que resulta útil para costos y telemetría, pero
puede sobreestimar la ventana de contexto activa. Las visualizaciones y los diagnósticos del contexto utilizan
la instantánea más reciente del prompt (`promptTokens`, o la última llamada al modelo cuando no
hay disponible una instantánea del prompt) para `context.used`.

## Estimación de costos (cuando se muestra)

Los costos se estiman a partir de la configuración de precios del modelo:

```text
models.providers.<provider>.models[].cost
```

Estos valores representan **USD por 1 millón de tokens** para `input`, `output`, `cacheRead` y
`cacheWrite`. Si faltan los precios, `/usage full` omite el costo; utiliza
`/usage tokens` o un `messages.usageTemplate` personalizado cuando necesites
detalles de tokens y caché en cada respuesta. La visualización de costos no se limita a la
autenticación mediante clave de API: los proveedores sin clave de API, como `aws-sdk`, pueden mostrar un costo estimado cuando
su entrada de modelo configurada incluye precios locales y el proveedor
devuelve metadatos de uso.

Después de que los procesos auxiliares y los canales alcancen la ruta de disponibilidad del Gateway, OpenClaw inicia una
carga opcional de precios en segundo plano para las referencias de modelos configuradas que aún no
tienen precios locales. Esa carga obtiene catálogos remotos de precios de OpenRouter y
LiteLLM. Establece `models.pricing.enabled: false` para omitir la obtención de esos
catálogos en redes sin conexión o restringidas; las entradas explícitas de
`models.providers.*.models[].cost` siguen determinando las estimaciones locales de costos.

## Impacto del TTL de caché y la poda

El almacenamiento en caché del prompt por parte del proveedor solo se aplica dentro de la ventana de TTL de la caché. OpenClaw
puede ejecutar opcionalmente la **poda por TTL de caché**: poda la sesión una vez que
el TTL de la caché ha expirado y, a continuación, restablece la ventana de caché para que las solicitudes posteriores
reutilicen el contexto recién almacenado en caché en lugar de volver a almacenar todo el historial.
Esto reduce los costos de escritura en caché cuando una sesión permanece inactiva más allá del TTL.

Configúralo en [Configuración del Gateway](/es/gateway/configuration) y consulta los
detalles del comportamiento en [Poda de sesiones](/es/concepts/session-pruning).

Heartbeat puede mantener la caché **activa** durante períodos de inactividad. Si el TTL de caché
de tu modelo es `1h`, establecer el intervalo de Heartbeat justo por debajo de ese valor (por ejemplo, `55m`) puede
evitar volver a almacenar en caché el prompt completo, lo que reduce los costos de escritura en caché.

En configuraciones con varios agentes, puedes mantener una configuración de modelo compartida y ajustar el comportamiento
de la caché por agente con `agents.list[].params.cacheRetention`.

Para consultar una guía completa de cada ajuste, consulta [Almacenamiento en caché del prompt](/es/reference/prompt-caching).

En los precios de la API de Anthropic, las lecturas de caché son considerablemente más económicas que los tokens
de entrada, mientras que las escrituras en caché se facturan con un multiplicador mayor. Consulta los
precios del almacenamiento en caché del prompt de Anthropic para conocer las tarifas y los multiplicadores de TTL más recientes:
[https://docs.anthropic.com/docs/build-with-claude/prompt-caching](https://docs.anthropic.com/docs/build-with-claude/prompt-caching)

### Ejemplo: mantener activa una caché de 1 h con Heartbeat

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

`agents.list[].params` se combina sobre los `params` del modelo seleccionado, por lo que puedes
sobrescribir únicamente `cacheRetention` y heredar sin cambios los demás valores predeterminados
del modelo.

### Contexto de 1 millón de Anthropic

OpenClaw asigna la ventana de contexto de 1 millón de Anthropic a los modelos Claude 4.x con disponibilidad general,
como Opus 4.8, Opus 4.7, Opus 4.6 y Sonnet 4.6. No necesitas
`params.context1m: true` para esos modelos.

```yaml
agents:
  defaults:
    models:
      "anthropic/claude-opus-4-6":
        alias: opus
```

Las configuraciones antiguas pueden conservar `context1m: true`, pero OpenClaw ya no envía
el encabezado beta retirado `context-1m-2025-08-07` de Anthropic para este ajuste ni
amplía a 1 millón los modelos Claude antiguos no compatibles.

Requisito: la credencial debe ser apta para el uso de contexto largo. De lo contrario,
Anthropic responde con un error de límite de solicitudes del proveedor para esa solicitud.

Si autentica Anthropic con tokens de OAuth/suscripción
(`sk-ant-oat-*`), OpenClaw conserva los encabezados beta de Anthropic requeridos por OAuth
y elimina la beta retirada `context-1m-*` si aún permanece en
una configuración anterior.

## Consejos para reducir la presión de tokens

- Use `/compact` para resumir sesiones largas.
- Reduzca las salidas extensas de las herramientas en sus flujos de trabajo.
- Reduzca `agents.defaults.imageMaxDimensionPx` en sesiones con muchas capturas de pantalla.
- Mantenga breves las descripciones de Skills (la lista de Skills se inserta en el prompt).
- Prefiera modelos más pequeños para trabajos detallados y exploratorios.

Consulte [Skills](/es/tools/skills) para conocer la fórmula exacta de la sobrecarga de la lista de Skills.

## Contenido relacionado

- [Uso y costos de la API](/es/reference/api-usage-costs)
- [Almacenamiento en caché de prompts](/es/reference/prompt-caching)
- [Seguimiento del uso](/es/concepts/usage-tracking)

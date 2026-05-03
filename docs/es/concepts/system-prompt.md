---
read_when:
    - Edición del texto del prompt del sistema, la lista de herramientas o las secciones de tiempo/Heartbeat
    - Cambiar el comportamiento de arranque del espacio de trabajo o de inyección de Skills
summary: Qué contiene el prompt del sistema de OpenClaw y cómo se ensambla
title: Prompt del sistema
x-i18n:
    generated_at: "2026-05-03T21:30:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 93533ac8090897a7b5fd82b80e542a4ad573670408314b3519c5e317d0408ade
    source_path: concepts/system-prompt.md
    workflow: 16
---

OpenClaw crea un prompt del sistema personalizado para cada ejecución de agente. El prompt es **propiedad de OpenClaw** y no usa el prompt predeterminado de pi-coding-agent.

OpenClaw ensambla el prompt y lo inyecta en cada ejecución de agente.

Los plugins de proveedor pueden aportar orientación de prompt compatible con la caché sin reemplazar
todo el prompt propiedad de OpenClaw. El runtime del proveedor puede:

- reemplazar un pequeño conjunto de secciones principales con nombre (`interaction_style`,
  `tool_call_style`, `execution_bias`)
- inyectar un **prefijo estable** por encima del límite de la caché del prompt
- inyectar un **sufijo dinámico** por debajo del límite de la caché del prompt

Usa contribuciones propiedad del proveedor para ajustes específicos de familias de modelos. Mantén la mutación de prompt heredada
`before_prompt_build` por compatibilidad o para cambios de prompt verdaderamente globales,
no para el comportamiento normal del proveedor.

La superposición de la familia OpenAI GPT-5 mantiene pequeña la regla principal de ejecución y añade
orientación específica del modelo para fijación de personalidad, salida concisa, disciplina de herramientas,
búsqueda paralela, cobertura de entregables, verificación, contexto faltante e
higiene de herramientas de terminal.

## Estructura

El prompt es intencionalmente compacto y usa secciones fijas:

- **Herramientas**: recordatorio de fuente de verdad de herramientas estructuradas más orientación de uso de herramientas en runtime.
- **Sesgo de ejecución**: orientación compacta de seguimiento: actuar dentro del turno sobre
  solicitudes accionables, continuar hasta terminar o quedar bloqueado, recuperarse de resultados débiles de herramientas,
  comprobar el estado mutable en vivo y verificar antes de finalizar.
- **Seguridad**: breve recordatorio de barandillas para evitar conductas de búsqueda de poder o eludir supervisión.
- **Skills** (cuando estén disponibles): indica al modelo cómo cargar instrucciones de Skills bajo demanda.
- **Autoactualización de OpenClaw**: cómo inspeccionar la configuración de forma segura con
  `config.schema.lookup`, parchear la configuración con `config.patch`, reemplazar toda la
  configuración con `config.apply` y ejecutar `update.run` solo ante una solicitud explícita del usuario. La herramienta `gateway`, solo para propietarios, también se niega a reescribir
  `tools.exec.ask` / `tools.exec.security`, incluidos los alias heredados `tools.bash.*`
  que se normalizan a esas rutas exec protegidas.
- **Espacio de trabajo**: directorio de trabajo (`agents.defaults.workspace`).
- **Documentación**: ruta local a la documentación de OpenClaw (repositorio o paquete npm) y cuándo leerla.
- **Archivos del espacio de trabajo (inyectados)**: indica que los archivos de arranque se incluyen a continuación.
- **Sandbox** (cuando está habilitado): indica runtime en sandbox, rutas de sandbox y si exec elevado está disponible.
- **Fecha y hora actuales**: hora local del usuario, zona horaria y formato de hora.
- **Etiquetas de respuesta**: sintaxis opcional de etiquetas de respuesta para proveedores compatibles.
- **Heartbeats**: prompt de Heartbeat y comportamiento de confirmación, cuando Heartbeats está habilitado para el agente predeterminado.
- **Runtime**: host, SO, node, modelo, raíz del repositorio (cuando se detecta), nivel de pensamiento (una línea).
- **Razonamiento**: nivel de visibilidad actual + sugerencia del interruptor /reasoning.

OpenClaw mantiene contenido estable grande, incluido **Contexto del proyecto**, por encima del
límite interno de la caché del prompt. Las secciones volátiles de canal/sesión, como
orientación de incrustación de la UI de control, **Mensajería**, **Voz**, **Contexto de chat grupal**,
**Reacciones**, **Heartbeats** y **Runtime**, se anexan por debajo de ese límite
para que los backends locales con cachés de prefijo puedan reutilizar el prefijo estable del espacio de trabajo
entre turnos de canal. Las descripciones de herramientas también deben evitar incrustar nombres de canales actuales
cuando el esquema aceptado ya contiene ese detalle de runtime.

La sección Herramientas también incluye orientación de runtime para trabajos de larga duración:

- usar cron para seguimiento futuro (`check back later`, recordatorios, trabajo recurrente)
  en lugar de bucles de espera con `exec`, trucos de demora con `yieldMs` o sondeos repetidos de `process`
- usar `exec` / `process` solo para comandos que empiezan ahora y siguen ejecutándose
  en segundo plano
- cuando la activación automática al completarse está habilitada, iniciar el comando una vez y confiar en
  la ruta de activación basada en push cuando emita salida o falle
- usar `process` para registros, estado, entrada o intervención cuando necesites
  inspeccionar un comando en ejecución
- si la tarea es mayor, preferir `sessions_spawn`; la finalización del subagente está
  basada en push y se anuncia automáticamente de vuelta al solicitante
- no sondear `subagents list` / `sessions_list` en un bucle solo para esperar la
  finalización

Cuando la herramienta experimental `update_plan` está habilitada, Herramientas también indica al
modelo que la use solo para trabajos no triviales de varios pasos, que mantenga exactamente un
paso `in_progress` y que evite repetir todo el plan después de cada actualización.

Las barandillas de seguridad en el prompt del sistema son orientativas. Guían el comportamiento del modelo, pero no aplican políticas. Usa política de herramientas, aprobaciones de exec, sandboxing y listas de permitidos de canal para aplicación estricta; los operadores pueden deshabilitarlas por diseño.

En canales con tarjetas/botones de aprobación nativos, el prompt de runtime ahora indica al
agente que confíe primero en esa UI de aprobación nativa. Solo debe incluir un comando manual
`/approve` cuando el resultado de la herramienta diga que las aprobaciones por chat no están disponibles o que
la aprobación manual es la única ruta.

## Modos de prompt

OpenClaw puede renderizar prompts del sistema más pequeños para subagentes. El runtime define un
`promptMode` para cada ejecución (no es una configuración visible para el usuario):

- `full` (predeterminado): incluye todas las secciones anteriores.
- `minimal`: usado para subagentes; omite **Skills**, **Recuerdo de memoria**, **Autoactualización de OpenClaw
  **, **Alias de modelo**, **Identidad del usuario**, **Etiquetas de respuesta**,
  **Mensajería**, **Respuestas silenciosas** y **Heartbeats**. Herramientas, **Seguridad**,
  Espacio de trabajo, Sandbox, Fecha y hora actuales (cuando se conocen), Runtime y el contexto
  inyectado siguen disponibles.
- `none`: devuelve solo la línea base de identidad.

Cuando `promptMode=minimal`, los prompts inyectados adicionales se etiquetan como **Contexto de subagente
** en lugar de **Contexto de chat grupal**.

Para ejecuciones de respuesta automática de canal, OpenClaw puede omitir la sección genérica **Respuestas silenciosas**
cuando el contexto de chat directo/grupal ya incluye el comportamiento `NO_REPLY`
específico de la conversación resuelto. Esto evita repetir la mecánica de tokens
tanto en el prompt global del sistema como en el contexto del canal.

## Instantáneas de prompt

OpenClaw mantiene instantáneas de prompt confirmadas para la ruta feliz del runtime de Codex en
`test/fixtures/agents/prompt-snapshots/codex-runtime-happy-path/`. Renderizan
parámetros seleccionados de hilo/turno del servidor de aplicaciones más una pila reconstruida de capas de prompt vinculadas al modelo
para turnos directos de Telegram, grupales de Discord y de Heartbeat. Esa pila
incluye un fixture de prompt de modelo Codex `gpt-5.5` fijado, generado a partir de la
forma del catálogo/caché de modelos de Codex, el texto de desarrollador de permisos de ruta feliz de Codex,
instrucciones de desarrollador de OpenClaw, instrucciones de modo de colaboración limitadas al turno
cuando OpenClaw las proporciona, entrada del turno del usuario y referencias a las especificaciones dinámicas de herramientas.

Actualiza el fixture fijado del prompt de modelo de Codex con
`pnpm prompt:snapshots:sync-codex-model`. De forma predeterminada, el script busca
la caché de runtime de Codex en `$CODEX_HOME/models_cache.json`, luego en
`~/.codex/models_cache.json`, y solo entonces recurre a la convención del checkout de Codex
del mantenedor en `~/code/codex/codex-rs/models-manager/models.json`. Si
ninguna de esas fuentes existe, el comando sale sin cambiar el fixture
confirmado. Pasa `--catalog <path>` para actualizar desde un archivo `models_cache.json`
o `models.json` específico.

Estas instantáneas aún no son una captura sin procesar byte por byte de una solicitud OpenAI. Codex
puede añadir contexto de espacio de trabajo propiedad del runtime, como `AGENTS.md`, contexto de entorno,
memorias, instrucciones de aplicación/plugin e instrucciones integradas del modo de colaboración
Default dentro del runtime de Codex después de que OpenClaw envíe parámetros de hilo y turno.

Regéneralas con `pnpm prompt:snapshots:gen` y verifica la deriva con
`pnpm prompt:snapshots:check`. CI ejecuta la comprobación de deriva en el fragmento adicional
de límite para que los cambios de prompt y las actualizaciones de instantáneas permanezcan adjuntos al mismo
PR.

## Inyección de arranque del espacio de trabajo

Los archivos de arranque se recortan y anexan bajo **Contexto del proyecto** para que el modelo vea el contexto de identidad y perfil sin necesitar lecturas explícitas:

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (solo en espacios de trabajo recién creados)
- `MEMORY.md` cuando está presente

Todos estos archivos se **inyectan en la ventana de contexto** en cada turno salvo que
aplique una compuerta específica del archivo. `HEARTBEAT.md` se omite en ejecuciones normales cuando
Heartbeats está deshabilitado para el agente predeterminado o
`agents.defaults.heartbeat.includeSystemPromptSection` es false. Mantén concisos los archivos
inyectados, especialmente `MEMORY.md`, que puede crecer con el tiempo y provocar
un uso de contexto inesperadamente alto y Compaction más frecuente.

Cuando una sesión se ejecuta en el arnés nativo de Codex, Codex carga `AGENTS.md`
mediante su propio descubrimiento de documentación de proyecto. OpenClaw aún resuelve los demás
archivos de arranque y los reenvía como instrucciones de configuración de Codex, por lo que `SOUL.md`,
`TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` y
`MEMORY.md` mantienen el mismo rol de contexto de espacio de trabajo sin duplicar
`AGENTS.md`.

<Note>
Los archivos diarios `memory/*.md` **no** forman parte del Contexto del proyecto de arranque normal. En turnos ordinarios se accede a ellos bajo demanda mediante las herramientas `memory_search` y `memory_get`, por lo que no cuentan contra la ventana de contexto salvo que el modelo los lea explícitamente. Los turnos simples `/new` y `/reset` son la excepción: el runtime puede anteponer memoria diaria reciente como un bloque de contexto de inicio de un solo uso para ese primer turno.
</Note>

Los archivos grandes se truncan con un marcador. El tamaño máximo por archivo se controla mediante
`agents.defaults.bootstrapMaxChars` (predeterminado: 12000). El contenido total de arranque inyectado
entre archivos está limitado por `agents.defaults.bootstrapTotalMaxChars`
(predeterminado: 60000). Los archivos faltantes inyectan un breve marcador de archivo faltante. Cuando se produce truncamiento,
OpenClaw puede inyectar un bloque de advertencia en Contexto del proyecto; controla esto con
`agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`;
predeterminado: `once`).

Las sesiones de subagente solo inyectan `AGENTS.md` y `TOOLS.md` (los demás archivos de arranque
se filtran para mantener pequeño el contexto del subagente).

Los hooks internos pueden interceptar este paso mediante `agent:bootstrap` para mutar o reemplazar
los archivos de arranque inyectados (por ejemplo, cambiando `SOUL.md` por una personalidad alternativa).

Si quieres que el agente suene menos genérico, empieza con
[Guía de personalidad de SOUL.md](/es/concepts/soul).

Para inspeccionar cuánto aporta cada archivo inyectado (sin procesar frente a inyectado, truncamiento, más sobrecarga del esquema de herramientas), usa `/context list` o `/context detail`. Consulta [Contexto](/es/concepts/context).

## Gestión del tiempo

El prompt del sistema incluye una sección dedicada **Fecha y hora actuales** cuando se conoce la
zona horaria del usuario. Para mantener estable la caché del prompt, ahora solo incluye
la **zona horaria** (sin reloj dinámico ni formato de hora).

Usa `session_status` cuando el agente necesite la hora actual; la tarjeta de estado
incluye una línea de marca de tiempo. La misma herramienta puede establecer opcionalmente una anulación de modelo por sesión
(`model=default` la borra).

Configura con:

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

Consulta [Fecha y hora](/es/date-time) para ver todos los detalles del comportamiento.

## Skills

Cuando existen Skills elegibles, OpenClaw inyecta una **lista compacta de Skills disponibles**
(`formatSkillsForPrompt`) que incluye la **ruta de archivo** de cada Skill. El
prompt indica al modelo que use `read` para cargar el SKILL.md en la ubicación
indicada (espacio de trabajo, gestionada o incluida). Si no hay Skills elegibles, la
sección Skills se omite.

La elegibilidad incluye compuertas de metadatos de Skills, comprobaciones de entorno/configuración de runtime
y la lista de permitidos efectiva de Skills del agente cuando `agents.defaults.skills` o
`agents.list[].skills` está configurado.

Las Skills incluidas con plugins solo son elegibles cuando su Plugin propietario está habilitado.
Esto permite que los plugins de herramientas expongan guías operativas más profundas sin incrustar toda
esa orientación directamente en cada descripción de herramienta.

```
<available_skills>
  <skill>
    <name>...</name>
    <description>...</description>
    <location>...</location>
  </skill>
</available_skills>
```

Esto mantiene pequeño el prompt base y a la vez permite el uso dirigido de Skills.

El presupuesto de la lista de Skills es propiedad del subsistema de Skills:

- Valor global predeterminado: `skills.limits.maxSkillsPromptChars`
- Anulación por agente: `agents.list[].skillsLimits.maxSkillsPromptChars`

Los extractos acotados genéricos de tiempo de ejecución usan una superficie diferente:

- `agents.defaults.contextLimits.*`
- `agents.list[].contextLimits.*`

Esa división mantiene el dimensionamiento de Skills separado del dimensionamiento de lectura/inyección en tiempo de ejecución, como `memory_get`, los resultados en vivo de herramientas y las actualizaciones de AGENTS.md posteriores a Compaction.

## Documentación

El prompt del sistema incluye una sección de **Documentación**. Cuando hay documentación local disponible, apunta al directorio local de documentación de OpenClaw (`docs/` en una copia de Git o la documentación del paquete npm incluido). Si no hay documentación local disponible, recurre a [https://docs.openclaw.ai](https://docs.openclaw.ai).

La misma sección también incluye la ubicación del código fuente de OpenClaw. Las copias de Git exponen la raíz local del código fuente para que el agente pueda inspeccionar el código directamente. Las instalaciones de paquete incluyen la URL del código fuente en GitHub e indican al agente que revise el código fuente allí siempre que la documentación esté incompleta u obsoleta. El prompt también menciona el espejo público de la documentación, el Discord de la comunidad y ClawHub ([https://clawhub.ai](https://clawhub.ai)) para el descubrimiento de Skills. Indica al modelo que consulte primero la documentación para el comportamiento, los comandos, la configuración o la arquitectura de OpenClaw, y que ejecute `openclaw status` por sí mismo cuando sea posible (preguntando al usuario solo cuando no tenga acceso). Para la configuración específicamente, dirige a los agentes a la acción de herramienta `gateway` `config.schema.lookup` para obtener documentación y restricciones exactas a nivel de campo, y luego a `docs/gateway/configuration.md` y `docs/gateway/configuration-reference.md` para orientación más amplia.

## Relacionado

- [Tiempo de ejecución del agente](/es/concepts/agent)
- [Espacio de trabajo del agente](/es/concepts/agent-workspace)
- [Motor de contexto](/es/concepts/context-engine)

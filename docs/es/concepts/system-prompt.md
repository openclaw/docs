---
read_when:
    - Edición del texto del prompt del sistema, de la lista de herramientas o de las secciones de hora/Heartbeat
    - Cambiar el comportamiento de arranque del espacio de trabajo o de inyección de Skills
summary: Qué contiene el prompt del sistema de OpenClaw y cómo se ensambla
title: Prompt del sistema
x-i18n:
    generated_at: "2026-05-11T20:32:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7aa3db4f53ffe5c11fd85159044344b56cd11c3bdb1a5a5de7638b21fb813135
    source_path: concepts/system-prompt.md
    workflow: 16
---

OpenClaw construye un prompt de sistema personalizado para cada ejecución de agente. El prompt es **propiedad de OpenClaw** y no usa el prompt predeterminado de pi-coding-agent.

OpenClaw ensambla el prompt y lo inyecta en cada ejecución de agente.

El ensamblaje del prompt tiene tres capas:

- `buildAgentSystemPrompt` renderiza el prompt a partir de entradas explícitas. Debe
  seguir siendo un renderizador puro y no debe leer la configuración global directamente.
- `resolveAgentSystemPromptConfig` resuelve controles del prompt respaldados por configuración, como
  visualización del propietario, indicaciones de TTS, alias de modelos, modo de cita de memoria y modo de
  delegación de subagentes para un agente específico.
- Los adaptadores de runtime (integrado, CLI, vistas previas de comando/exportación, Compaction) recopilan
  datos en vivo como herramientas, estado de sandbox, capacidades de canal, archivos de contexto
  y contribuciones al prompt del proveedor, y luego llaman a la fachada de prompt configurada.

Esto mantiene las superficies de prompts exportados/depurados alineadas con las ejecuciones en vivo sin
convertir cada detalle específico del runtime en un único constructor monolítico.

Los plugins de proveedor pueden aportar guía de prompt consciente de caché sin reemplazar
todo el prompt propiedad de OpenClaw. El runtime del proveedor puede:

- reemplazar un pequeño conjunto de secciones principales con nombre (`interaction_style`,
  `tool_call_style`, `execution_bias`)
- inyectar un **prefijo estable** por encima del límite de caché del prompt
- inyectar un **sufijo dinámico** por debajo del límite de caché del prompt

Usa contribuciones propiedad del proveedor para ajustes específicos de familias de modelos. Mantén la
mutación de prompt heredada `before_prompt_build` para compatibilidad o cambios de prompt realmente globales,
no para el comportamiento normal del proveedor.

La superposición de la familia OpenAI GPT-5 mantiene pequeña la regla de ejecución principal y agrega
guía específica del modelo para fijación de persona, salida concisa, disciplina de herramientas,
búsqueda paralela, cobertura de entregables, verificación, contexto faltante e higiene de
herramientas de terminal.

## Estructura

El prompt es intencionalmente compacto y usa secciones fijas:

- **Herramientas**: recordatorio de fuente de verdad de herramientas estructuradas más guía de uso de herramientas en runtime.
- **Sesgo de ejecución**: guía compacta de seguimiento: actuar durante el turno ante
  solicitudes accionables, continuar hasta terminar o quedar bloqueado, recuperarse de resultados débiles de herramientas,
  comprobar el estado mutable en vivo y verificar antes de finalizar.
- **Seguridad**: breve recordatorio de protección para evitar comportamientos de búsqueda de poder o eludir supervisión.
- **Skills** (cuando están disponibles): indica al modelo cómo cargar instrucciones de habilidades bajo demanda.
- **Control de OpenClaw**: indica al modelo que prefiera la herramienta `gateway` para
  trabajos de configuración/reinicio y que evite inventar comandos de CLI.
- **Autoactualización de OpenClaw**: cómo inspeccionar la configuración de forma segura con
  `config.schema.lookup`, parchear la configuración con `config.patch`, reemplazar la configuración completa
  con `config.apply` y ejecutar `update.run` solo ante una solicitud explícita del usuario.
  La herramienta `gateway`, solo para el propietario, también se niega a reescribir
  `tools.exec.ask` / `tools.exec.security`, incluidos los alias heredados `tools.bash.*`
  que se normalizan a esas rutas protegidas de exec.
- **Espacio de trabajo**: directorio de trabajo (`agents.defaults.workspace`).
- **Documentación**: ruta local a OpenClaw docs/source y cuándo leerlos.
- **Archivos del espacio de trabajo (inyectados)**: indica que los archivos de arranque se incluyen a continuación.
- **Sandbox** (cuando está habilitado): indica runtime con sandbox, rutas de sandbox y si exec elevado está disponible.
- **Fecha y hora actuales**: solo zona horaria (estable para caché; el reloj en vivo viene de `session_status`).
- **Directivas de salida del asistente**: sintaxis compacta de adjuntos, notas de voz y etiquetas de respuesta.
- **Heartbeats**: prompt de Heartbeat y comportamiento de confirmación, cuando Heartbeats están habilitados para el agente predeterminado.
- **Runtime**: host, SO, Node, modelo, raíz del repositorio (cuando se detecta), nivel de razonamiento (una línea).
- **Razonamiento**: nivel de visibilidad actual + indicación del interruptor /reasoning.

OpenClaw mantiene el contenido estable grande, incluido **Contexto del proyecto**, por encima del
límite interno de caché del prompt. Las secciones volátiles de canal/sesión como
guía integrada de interfaz de control, **Mensajería**, **Voz**, **Contexto de chat grupal**,
**Reacciones**, **Heartbeats** y **Runtime** se agregan por debajo de ese límite
para que los backends locales con cachés de prefijo puedan reutilizar el prefijo estable del espacio de trabajo
entre turnos de canal. Del mismo modo, las descripciones de herramientas deben evitar incrustar nombres de canal actuales
cuando el esquema aceptado ya lleva ese detalle de runtime.

La sección Herramientas también incluye guía de runtime para trabajos de larga duración:

- usar Cron para seguimiento futuro (`check back later`, recordatorios, trabajo recurrente)
  en lugar de bucles de suspensión con `exec`, trucos de demora con `yieldMs` o sondeos repetidos de `process`
- usar `exec` / `process` solo para comandos que comienzan ahora y siguen ejecutándose
  en segundo plano
- cuando la activación automática al completar está habilitada, iniciar el comando una vez y confiar en
  la ruta de activación basada en push cuando emita salida o falle
- usar `process` para logs, estado, entrada o intervención cuando necesites
  inspeccionar un comando en ejecución
- si la tarea es más grande, preferir `sessions_spawn`; la finalización del subagente es
  basada en push y se anuncia automáticamente al solicitante
- no sondear `subagents list` / `sessions_list` en un bucle solo para esperar
  la finalización

`agents.defaults.subagents.delegationMode` puede reforzar esta guía. El modo
predeterminado `suggest` mantiene la sugerencia base. `prefer` agrega una sección dedicada
**Delegación de subagentes** que indica al agente principal que actúe como un coordinador receptivo
y envíe todo lo que sea más complejo que una respuesta directa mediante
`sessions_spawn`. Esto es solo prompt; la política de herramientas sigue controlando si
`sessions_spawn` está disponible.

Cuando la herramienta experimental `update_plan` está habilitada, Herramientas también indica al
modelo que la use solo para trabajo no trivial de varios pasos, mantenga exactamente un paso
`in_progress` y evite repetir todo el plan después de cada actualización.

Las protecciones de seguridad en el prompt de sistema son orientativas. Guían el comportamiento del modelo pero no hacen cumplir políticas. Usa política de herramientas, aprobaciones de exec, sandboxing y allowlists de canales para cumplimiento estricto; los operadores pueden deshabilitarlos por diseño.

En canales con tarjetas/botones de aprobación nativos, el prompt de runtime ahora indica al
agente que use primero esa interfaz de aprobación nativa. Solo debe incluir un comando manual
`/approve` cuando el resultado de la herramienta indique que las aprobaciones por chat no están disponibles o
que la aprobación manual es la única vía.

## Modos de prompt

OpenClaw puede renderizar prompts de sistema más pequeños para subagentes. El runtime establece un
`promptMode` para cada ejecución (no es una configuración visible para el usuario):

- `full` (predeterminado): incluye todas las secciones anteriores.
- `minimal`: usado para subagentes; omite **Recuperación de memoria**, **Autoactualización de OpenClaw**,
  **Alias de modelos**, **Identidad del usuario**, **Directivas de salida del asistente**,
  **Mensajería**, **Respuestas silenciosas** y **Heartbeats**. Herramientas, **Seguridad**,
  **Skills** cuando se suministran, Espacio de trabajo, Sandbox, Fecha y hora actuales (cuando
  se conocen), Runtime y contexto inyectado siguen disponibles.
- `none`: devuelve solo la línea de identidad base.

Cuando `promptMode=minimal`, los prompts inyectados adicionales se etiquetan como **Contexto de subagente**
en lugar de **Contexto de chat grupal**.

Para ejecuciones de respuesta automática de canal, OpenClaw puede omitir la sección genérica **Respuestas silenciosas**
cuando el contexto de chat directo/grupal ya incluye el comportamiento resuelto
`NO_REPLY` específico de la conversación. Esto evita repetir mecánicas de tokens
tanto en el prompt de sistema global como en el contexto del canal.

## Instantáneas de prompts

OpenClaw mantiene instantáneas de prompts confirmadas para la ruta feliz del runtime de Codex bajo
`test/fixtures/agents/prompt-snapshots/codex-runtime-happy-path/`. Renderizan
parámetros seleccionados de hilo/turno del servidor de la app más una pila reconstruida de capas de prompt
vinculada al modelo para turnos directos de Telegram, de grupo de Discord y de Heartbeat. Esa pila
incluye una fixture de prompt de modelo Codex `gpt-5.5` fijada generada a partir de la forma
del catálogo/caché de modelos de Codex, el texto de desarrollador de permisos de la ruta feliz de Codex,
instrucciones de desarrollador de OpenClaw, instrucciones de modo de colaboración acotadas al turno
cuando OpenClaw las proporciona, entrada del turno del usuario y referencias a las especificaciones dinámicas de herramientas.

Actualiza la fixture fijada de prompt de modelo Codex con
`pnpm prompt:snapshots:sync-codex-model`. De forma predeterminada, el script busca la
caché de runtime de Codex en `$CODEX_HOME/models_cache.json`, luego en
`~/.codex/models_cache.json`, y solo después recurre a la convención del checkout de Codex
del mantenedor en `~/code/codex/codex-rs/models-manager/models.json`. Si
ninguna de esas fuentes existe, el comando sale sin cambiar la fixture confirmada.
Pasa `--catalog <path>` para actualizar desde un archivo `models_cache.json`
o `models.json` específico.

Estas instantáneas aún no son una captura sin procesar byte por byte de la solicitud a OpenAI. Codex
puede agregar contexto de espacio de trabajo propiedad del runtime, como `AGENTS.md`, contexto de entorno,
memorias, instrucciones de app/plugin e instrucciones integradas del modo de colaboración Default
dentro del runtime de Codex después de que OpenClaw envía los parámetros de hilo y turno.

Regenerarlas con `pnpm prompt:snapshots:gen` y verificar desviaciones con
`pnpm prompt:snapshots:check`. CI ejecuta la comprobación de desviación en el shard de límite
adicional para que los cambios de prompt y las actualizaciones de instantáneas permanezcan adjuntos al mismo
PR.

## Inyección de arranque del espacio de trabajo

Los archivos de arranque se recortan y se anexan bajo **Contexto del proyecto** para que el modelo vea contexto de identidad y perfil sin requerir lecturas explícitas:

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (solo en espacios de trabajo totalmente nuevos)
- `MEMORY.md` cuando esté presente

Todos estos archivos se **inyectan en la ventana de contexto** en cada turno, salvo que
aplique una puerta específica de archivo. `HEARTBEAT.md` se omite en ejecuciones normales cuando
Heartbeats están deshabilitados para el agente predeterminado o
`agents.defaults.heartbeat.includeSystemPromptSection` es false. Mantén los archivos inyectados
concisos, especialmente `MEMORY.md`. `MEMORY.md` está pensado para seguir siendo un
resumen curado de largo plazo; las notas diarias detalladas pertenecen en `memory/*.md`, donde
`memory_search` y `memory_get` pueden recuperarlas bajo demanda. Los archivos
`MEMORY.md` sobredimensionados aumentan el uso del prompt y pueden inyectarse parcialmente debido a
los límites de archivos de arranque que se indican abajo.

Cuando una sesión se ejecuta en el harness nativo de Codex, Codex carga `AGENTS.md`
mediante su propio descubrimiento de documentación de proyecto. OpenClaw aún resuelve los demás
archivos de arranque y los reenvía como instrucciones de configuración de Codex, por lo que `SOUL.md`,
`TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` y
`MEMORY.md` mantienen el mismo rol de contexto del espacio de trabajo sin duplicar
`AGENTS.md`.

<Note>
Los archivos diarios `memory/*.md` **no** forman parte del Contexto del proyecto de arranque normal. En turnos ordinarios se accede a ellos bajo demanda mediante las herramientas `memory_search` y `memory_get`, por lo que no cuentan contra la ventana de contexto salvo que el modelo los lea explícitamente. Los turnos `/new` y `/reset` sin más contenido son la excepción: el runtime puede anteponer memoria diaria reciente como un bloque único de contexto de inicio para ese primer turno.
</Note>

Los archivos grandes se truncan con un marcador. El tamaño máximo por archivo está controlado por
`agents.defaults.bootstrapMaxChars` (predeterminado: 12000). El contenido total de arranque inyectado
entre archivos está limitado por `agents.defaults.bootstrapTotalMaxChars`
(predeterminado: 60000). Los archivos faltantes inyectan un marcador breve de archivo faltante. Cuando se produce truncamiento,
OpenClaw puede inyectar un aviso conciso de advertencia en el prompt de sistema; controla esto con
`agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`;
predeterminado: `once`). Los recuentos detallados sin procesar/inyectados permanecen en diagnósticos como
`/context`, `/status`, doctor y logs.

Para archivos de memoria, el truncamiento no es pérdida de datos: el archivo permanece intacto en disco,
pero el modelo solo ve la copia inyectada abreviada hasta que lee o busca
memoria directamente. Si `MEMORY.md` se trunca repetidamente, destílalo en un
resumen duradero más corto y mueve el historial detallado a `memory/*.md`, o
aumenta intencionalmente los límites de arranque.

Las sesiones de subagente solo inyectan `AGENTS.md` y `TOOLS.md` (los demás archivos de arranque
se filtran para mantener pequeño el contexto del subagente).

Los hooks internos pueden interceptar este paso mediante `agent:bootstrap` para mutar o reemplazar
los archivos de arranque inyectados (por ejemplo, sustituir `SOUL.md` por una persona alternativa).

Si quieres que el agente suene menos genérico, empieza con
[Guía de personalidad SOUL.md](/es/concepts/soul).

Para inspeccionar cuánto contribuye cada archivo inyectado (sin procesar frente a inyectado, truncamiento, más sobrecarga del esquema de herramientas), usa `/context list` o `/context detail`. Consulta [Contexto](/es/concepts/context).

## Gestión del tiempo

El prompt del sistema incluye una sección dedicada **Fecha y hora actuales** cuando se
conoce la zona horaria del usuario. Para mantener estable la caché de prompts, ahora solo incluye
la **zona horaria** (sin reloj dinámico ni formato de hora).

Usa `session_status` cuando el agente necesite la hora actual; la tarjeta de estado
incluye una línea de marca de tiempo. La misma herramienta puede establecer opcionalmente una anulación de modelo por sesión
(`model=default` la borra).

Configura con:

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

Consulta [Fecha y hora](/es/date-time) para ver todos los detalles del comportamiento.

## Skills

Cuando existen Skills elegibles, OpenClaw inyecta una **lista de Skills disponibles** compacta
(`formatSkillsForPrompt`) que incluye la **ruta de archivo** de cada Skill. El
prompt indica al modelo que use `read` para cargar el SKILL.md en la ubicación
indicada (workspace, gestionada o incluida). Si no hay Skills elegibles, se omite
la sección Skills.

La elegibilidad incluye puertas de metadatos de Skills, comprobaciones del entorno/configuración en tiempo de ejecución
y la lista de permitidos efectiva de Skills del agente cuando `agents.defaults.skills` o
`agents.list[].skills` está configurado.

Las Skills incluidas con Plugin solo son elegibles cuando su Plugin propietario está habilitado.
Esto permite que los plugins de herramientas expongan guías operativas más profundas sin insertar toda
esa guía directamente en cada descripción de herramienta.

```
<available_skills>
  <skill>
    <name>...</name>
    <description>...</description>
    <location>...</location>
  </skill>
</available_skills>
```

Esto mantiene pequeño el prompt base y aun así permite el uso dirigido de Skills.

El presupuesto de la lista de Skills pertenece al subsistema de Skills:

- Valor predeterminado global: `skills.limits.maxSkillsPromptChars`
- Anulación por agente: `agents.list[].skillsLimits.maxSkillsPromptChars`

Los extractos genéricos acotados en tiempo de ejecución usan una superficie diferente:

- `agents.defaults.contextLimits.*`
- `agents.list[].contextLimits.*`

Esa separación mantiene el tamaño de Skills separado del tamaño de lectura/inyección en tiempo de ejecución, como
`memory_get`, resultados de herramientas en vivo y actualizaciones de AGENTS.md posteriores a Compaction.

## Documentación

El prompt del sistema incluye una sección **Documentación**. Cuando la documentación local está disponible,
apunta al directorio local de documentación de OpenClaw (`docs/` en un checkout de Git o la documentación incluida en el
paquete npm). Si la documentación local no está disponible, recurre a
[https://docs.openclaw.ai](https://docs.openclaw.ai).

La misma sección también incluye la ubicación del código fuente de OpenClaw. Los checkouts de Git exponen la raíz
local del código fuente para que el agente pueda inspeccionar el código directamente. Las instalaciones de paquetes incluyen la URL
del código fuente de GitHub e indican al agente que revise allí el código fuente cuando la documentación esté incompleta o
desactualizada. El prompt también menciona el espejo público de la documentación, el Discord comunitario y ClawHub
([https://clawhub.ai](https://clawhub.ai)) para descubrir Skills. Indica al modelo que
consulte primero la documentación para el comportamiento, los comandos, la configuración o la arquitectura de OpenClaw, y que
ejecute `openclaw status` por sí mismo cuando sea posible (preguntando al usuario solo cuando no tenga acceso).
Para la configuración específicamente, dirige a los agentes a la acción de herramienta `gateway`
`config.schema.lookup` para obtener documentación y restricciones exactas a nivel de campo, y luego a
`docs/gateway/configuration.md` y `docs/gateway/configuration-reference.md`
para una guía más amplia.

## Relacionado

- [Tiempo de ejecución del agente](/es/concepts/agent)
- [Workspace del agente](/es/concepts/agent-workspace)
- [Motor de contexto](/es/concepts/context-engine)

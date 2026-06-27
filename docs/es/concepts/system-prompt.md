---
read_when:
    - Edición del texto del prompt del sistema, la lista de herramientas o las secciones de tiempo/Heartbeat
    - Cambiar el comportamiento de arranque del espacio de trabajo o de inyección de Skills
summary: Qué contiene el prompt del sistema de OpenClaw y cómo se ensambla
title: Prompt del sistema
x-i18n:
    generated_at: "2026-06-27T11:20:48Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 31321b4df7494317b73c2a5609b1dc275463168ed5fe20ecb173e9bec76717cc
    source_path: concepts/system-prompt.md
    workflow: 16
---

OpenClaw construye un prompt de sistema personalizado para cada ejecución de agente. El prompt es **propiedad de OpenClaw** y no usa un prompt predeterminado en tiempo de ejecución.

OpenClaw ensambla el prompt y lo inyecta en cada ejecución de agente.

El ensamblaje del prompt tiene tres capas:

- `buildAgentSystemPrompt` renderiza el prompt a partir de entradas explícitas. Debe
  permanecer como un renderizador puro y no debe leer la configuración global directamente.
- `resolveAgentSystemPromptConfig` resuelve controles del prompt respaldados por configuración, como
  la visualización del propietario, sugerencias de TTS, alias de modelos, modo de cita de memoria y modo de
  delegación a subagentes para un agente específico.
- Los adaptadores de tiempo de ejecución (embebidos, CLI, vistas previas de comando/exportación, Compaction) recopilan
  hechos en vivo, como herramientas, estado del sandbox, capacidades del canal, archivos de contexto
  y contribuciones de prompt del proveedor, y luego llaman a la fachada de prompt configurada.

Esto mantiene las superficies de prompt exportadas/de depuración alineadas con las ejecuciones en vivo sin
convertir cada detalle específico del tiempo de ejecución en un único constructor monolítico.

Los Plugins de proveedor pueden aportar orientación de prompt consciente de la caché sin reemplazar
el prompt completo propiedad de OpenClaw. El tiempo de ejecución del proveedor puede:

- reemplazar un pequeño conjunto de secciones centrales con nombre (`interaction_style`,
  `tool_call_style`, `execution_bias`)
- inyectar un **prefijo estable** por encima del límite de caché del prompt
- inyectar un **sufijo dinámico** por debajo del límite de caché del prompt

Usa contribuciones propiedad del proveedor para ajustes específicos de familias de modelos. Mantén la
mutación de prompt heredada `before_prompt_build` para compatibilidad o cambios de prompt verdaderamente globales,
no para el comportamiento normal del proveedor.

La superposición de la familia OpenAI GPT-5 mantiene pequeña la regla central de ejecución y añade
orientación específica del modelo para fijación de persona, salida concisa, disciplina de herramientas,
búsqueda paralela, cobertura de entregables, verificación, contexto faltante e
higiene de herramientas de terminal.

## Estructura

El prompt es intencionadamente compacto y usa secciones fijas:

- **Herramientas**: recordatorio estructurado de fuente de verdad de herramientas más orientación de uso de herramientas en tiempo de ejecución.
- **Sesgo de ejecución**: orientación compacta de seguimiento: actuar dentro del turno ante
  solicitudes accionables, continuar hasta terminar o quedar bloqueado, recuperarse de resultados débiles de herramientas,
  comprobar en vivo el estado mutable y verificar antes de finalizar.
- **Seguridad**: breve recordatorio de salvaguardas para evitar comportamientos de búsqueda de poder o eludir supervisión.
- **Skills** (cuando estén disponibles): indica al modelo cómo cargar instrucciones de Skills bajo demanda.
- **Control de OpenClaw**: indica al modelo que prefiera la herramienta `gateway` para
  trabajo de configuración/reinicio y que evite inventar comandos de CLI.
- **Autoactualización de OpenClaw**: cómo inspeccionar la configuración de forma segura con
  `config.schema.lookup`, parchear la configuración con `config.patch`, reemplazar la configuración completa
  con `config.apply` y ejecutar `update.run` solo a petición explícita del usuario.
  La herramienta `gateway` orientada al agente también se niega a reescribir
  `tools.exec.ask` / `tools.exec.security`, incluidos los alias heredados `tools.bash.*`
  que se normalizan a esas rutas exec protegidas.
- **Espacio de trabajo**: directorio de trabajo (`agents.defaults.workspace`).
- **Documentación**: ruta local a la documentación/fuente de OpenClaw y cuándo leerla.
- **Archivos del espacio de trabajo (inyectados)**: indica que los archivos de arranque se incluyen abajo.
- **Sandbox** (cuando esté habilitado): indica el tiempo de ejecución en sandbox, las rutas de sandbox y si exec elevado está disponible.
- **Fecha y hora actuales**: solo zona horaria (estable en caché; el reloj en vivo viene de `session_status`).
- **Directivas de salida del asistente**: sintaxis compacta de adjuntos, notas de voz y etiquetas de respuesta.
- **Heartbeats**: prompt de Heartbeat y comportamiento de confirmación, cuando los Heartbeats están habilitados para el agente predeterminado.
- **Tiempo de ejecución**: host, SO, Node, modelo, raíz del repositorio (cuando se detecte), nivel de pensamiento (una línea).
- **Razonamiento**: nivel de visibilidad actual + sugerencia del conmutador /reasoning.

OpenClaw mantiene contenido estable grande, incluido **Contexto del proyecto**, por encima del
límite interno de caché del prompt. Las secciones volátiles de canal/sesión, como
orientación de inserción de la UI de Control, **Mensajería**, **Voz**, **Contexto de chat grupal**,
**Reacciones**, **Heartbeats** y **Tiempo de ejecución**, se añaden por debajo de ese límite
para que los backends locales con cachés de prefijo puedan reutilizar el prefijo estable del espacio de trabajo
entre turnos del canal. Las descripciones de herramientas también deben evitar incrustar nombres de
canales actuales cuando el esquema aceptado ya contiene ese detalle de tiempo de ejecución.

La sección Herramientas también incluye orientación de tiempo de ejecución para trabajo de larga duración:

- usar Cron para seguimiento futuro (`check back later`, recordatorios, trabajo recurrente)
  en lugar de bucles de suspensión con `exec`, trucos de demora `yieldMs` o sondeo repetido de `process`
- usar `exec` / `process` solo para comandos que empiezan ahora y continúan ejecutándose
  en segundo plano
- cuando la activación automática al completarse está habilitada, iniciar el comando una vez y confiar en
  la ruta de activación basada en push cuando emita salida o falle
- usar `process` para registros, estado, entrada o intervención cuando necesites
  inspeccionar un comando en ejecución
- si la tarea es más grande, preferir `sessions_spawn`; la finalización del subagente es
  basada en push y se autoanuncia al solicitante
- no sondear `subagents list` / `sessions_list` en bucle solo para esperar la
  finalización

`agents.defaults.subagents.delegationMode` puede reforzar esta orientación. El modo
predeterminado `suggest` mantiene el empujón base. `prefer` añade una sección dedicada
**Delegación a subagentes** que indica al agente principal que actúe como un coordinador
responsivo y envíe cualquier cosa más compleja que una respuesta directa mediante
`sessions_spawn`. Esto es solo de prompt; la política de herramientas sigue controlando si
`sessions_spawn` está disponible.

Cuando la herramienta experimental `update_plan` está habilitada, Herramientas también indica al
modelo que la use solo para trabajo no trivial de varios pasos, mantenga exactamente un paso
`in_progress` y evite repetir todo el plan después de cada actualización.

Las salvaguardas de seguridad en el prompt de sistema son orientativas. Guían el comportamiento del modelo, pero no aplican políticas. Usa la política de herramientas, aprobaciones de exec, sandboxing y listas de permitidos de canales para la aplicación estricta; los operadores pueden deshabilitarlas por diseño.

En canales con tarjetas/botones de aprobación nativos, el prompt de tiempo de ejecución ahora indica al
agente que primero confíe en esa UI de aprobación nativa. Solo debe incluir un comando manual
`/approve` cuando el resultado de la herramienta diga que las aprobaciones por chat no están disponibles o que
la aprobación manual es la única ruta.

## Modos de prompt

OpenClaw puede renderizar prompts de sistema más pequeños para subagentes. El tiempo de ejecución establece un
`promptMode` para cada ejecución (no es una configuración orientada al usuario):

- `full` (predeterminado): incluye todas las secciones anteriores.
- `minimal`: usado para subagentes; omite **Recuperación de memoria**, **Autoactualización de OpenClaw**,
  **Alias de modelos**, **Identidad de usuario**, **Directivas de salida del asistente**,
  **Mensajería**, **Respuestas silenciosas** y **Heartbeats**. Herramientas, **Seguridad**,
  **Skills** cuando se suministran, Espacio de trabajo, Sandbox, Fecha y hora actuales (cuando
  se conocen), Tiempo de ejecución y contexto inyectado siguen disponibles.
- `none`: devuelve solo la línea base de identidad.

Cuando `promptMode=minimal`, los prompts inyectados extra se etiquetan como **Contexto de subagente**
en lugar de **Contexto de chat grupal**.

Para ejecuciones de respuesta automática de canal, OpenClaw omite la sección genérica **Respuestas silenciosas**
cuando el contexto directo, grupal o solo de herramienta de mensajes posee el contrato de respuesta visible.
Solo el antiguo modo automático de grupo/canal debe mostrar `NO_REPLY`; los chats directos
y las respuestas solo de herramienta de mensajes no reciben orientación de token silencioso.

## Snapshots de prompt

OpenClaw mantiene snapshots de prompt confirmados para la ruta feliz del tiempo de ejecución de Codex bajo
`test/fixtures/agents/prompt-snapshots/codex-runtime-happy-path/`. Renderizan
parámetros seleccionados de hilo/turno del servidor de la app más una pila reconstruida de capas de prompt
destinadas al modelo para turnos directos de Telegram, de grupo de Discord y de Heartbeat. Esa pila
incluye un fixture de prompt de modelo Codex `gpt-5.5` fijado, generado a partir de la forma
del catálogo/caché de modelos de Codex, el texto de desarrollador de permisos de ruta feliz de Codex,
instrucciones de desarrollador de OpenClaw, instrucciones de modo de colaboración con alcance de turno
cuando OpenClaw las proporciona, entrada del turno del usuario y referencias a las especificaciones dinámicas de herramientas.

Actualiza el fixture de prompt de modelo Codex fijado con
`pnpm prompt:snapshots:sync-codex-model`. De forma predeterminada, el script busca
la caché de tiempo de ejecución de Codex en `$CODEX_HOME/models_cache.json`, luego en
`~/.codex/models_cache.json`, y solo después recurre a la convención de checkout de Codex del mantenedor
en `~/code/codex/codex-rs/models-manager/models.json`. Si
ninguna de esas fuentes existe, el comando sale sin cambiar el fixture confirmado.
Pasa `--catalog <path>` para actualizar desde un archivo `models_cache.json`
o `models.json` específico.

Estos snapshots siguen sin ser una captura sin procesar byte por byte de una solicitud OpenAI. Codex
puede añadir contexto de espacio de trabajo propiedad del tiempo de ejecución, como `AGENTS.md`, contexto de
entorno, memorias, instrucciones de app/Plugin e instrucciones integradas del modo de colaboración
Default dentro del tiempo de ejecución de Codex después de que OpenClaw envíe parámetros de hilo y turno.

Regénéralos con `pnpm prompt:snapshots:gen` y verifica desviaciones con
`pnpm prompt:snapshots:check`. CI ejecuta la comprobación de desviación en el shard de límite
adicional para que los cambios de prompt y las actualizaciones de snapshots permanezcan adjuntos al mismo
PR.

## Inyección de arranque del espacio de trabajo

Los archivos de arranque se resuelven desde el espacio de trabajo activo y luego se encaminan a la
superficie de prompt que coincide con su ciclo de vida:

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (solo en espacios de trabajo recién creados)
- `MEMORY.md` cuando esté presente

En el arnés nativo de Codex, OpenClaw evita repetir archivos estables del espacio de trabajo
en cada turno del usuario. Codex carga `AGENTS.md` mediante su propio descubrimiento de
documentación del proyecto. `SOUL.md`, `IDENTITY.md`, `TOOLS.md` y `USER.md` se reenvían como
instrucciones de desarrollador de Codex. La lista compacta de Skills de OpenClaw también se reenvía
como instrucciones de desarrollador de colaboración con alcance de turno. El contenido de `HEARTBEAT.md`
no se inyecta; los turnos de Heartbeat reciben una nota de modo de colaboración que apunta al archivo
cuando existe y no está vacío. El contenido de `MEMORY.md` del espacio de trabajo configurado del agente
no se pega en cada turno nativo de Codex; cuando las herramientas de memoria están
disponibles para ese espacio de trabajo, los turnos de Codex reciben una pequeña nota de memoria de espacio de trabajo en
instrucciones de desarrollador de colaboración con alcance de turno y deben usar `memory_search`
o `memory_get` cuando la memoria duradera sea relevante. Si las herramientas están deshabilitadas, la búsqueda de memoria
no está disponible o el espacio de trabajo activo difiere del espacio de trabajo de memoria del agente,
`MEMORY.md` recurre a la ruta normal de contexto de turno acotado. El contenido activo de
`BOOTSTRAP.md` mantiene por ahora el rol normal de contexto de turno.

En arneses que no son Codex, los archivos de arranque siguen componiéndose en el
prompt de OpenClaw según sus compuertas existentes. `HEARTBEAT.md` se omite en
ejecuciones normales cuando los Heartbeats están deshabilitados para el agente predeterminado o
`agents.defaults.heartbeat.includeSystemPromptSection` es false. Mantén los archivos inyectados
concisos, especialmente `MEMORY.md` que no sea de Codex. `MEMORY.md` está pensado para seguir siendo
un resumen curado de largo plazo; las notas diarias detalladas pertenecen a `memory/*.md`, donde
`memory_search` y `memory_get` pueden recuperarlas bajo demanda. Los archivos
`MEMORY.md` no Codex sobredimensionados aumentan el uso de prompt y pueden inyectarse parcialmente
debido a los límites de archivos de arranque indicados abajo.

<Note>
Los archivos diarios `memory/*.md` **no** forman parte del Contexto del proyecto de arranque normal. En turnos ordinarios se accede a ellos bajo demanda mediante las herramientas `memory_search` y `memory_get`, por lo que no cuentan contra la ventana de contexto salvo que el modelo los lea explícitamente. Los turnos simples `/new` y `/reset` son la excepción: el tiempo de ejecución puede anteponer memoria diaria reciente como un bloque único de contexto de inicio para ese primer turno.
</Note>

Los archivos grandes se truncan con un marcador. El tamaño máximo por archivo se controla mediante
`agents.defaults.bootstrapMaxChars` (valor predeterminado: 20000). El contenido total de bootstrap
inyectado en todos los archivos está limitado por `agents.defaults.bootstrapTotalMaxChars`
(valor predeterminado: 60000). Los archivos faltantes inyectan un marcador breve de archivo faltante. Cuando se produce
truncamiento, OpenClaw puede inyectar un aviso conciso de advertencia en el prompt del sistema; controla esto con
`agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`;
valor predeterminado: `always`). Los conteos detallados en bruto/inyectados permanecen en diagnósticos como
`/context`, `/status`, doctor y los registros.

Para los archivos de memoria, el truncamiento no implica pérdida de datos: el archivo permanece intacto en el disco.
En Codex nativo, `MEMORY.md` se lee bajo demanda mediante herramientas de memoria cuando
están disponibles, con respaldo acotado en el prompt cuando las herramientas no pueden ejecutarse. En otros
harnesses, el modelo solo ve la copia inyectada acortada hasta que lee o
busca directamente en la memoria. Si `MEMORY.md` se trunca repetidamente allí, destílalo
en un resumen duradero más breve y mueve el historial detallado a `memory/*.md`,
o aumenta intencionalmente los límites de bootstrap.

Las sesiones de subagente solo inyectan `AGENTS.md` y `TOOLS.md` (otros archivos de bootstrap
se filtran para mantener pequeño el contexto del subagente).

Los hooks internos pueden interceptar este paso mediante `agent:bootstrap` para mutar o reemplazar
los archivos de bootstrap inyectados (por ejemplo, cambiar `SOUL.md` por una personalidad alternativa).

Si quieres que el agente suene menos genérico, empieza con
[Guía de personalidad de SOUL.md](/es/concepts/soul).

Para inspeccionar cuánto aporta cada archivo inyectado (en bruto frente a inyectado, truncamiento, más sobrecarga del esquema de herramientas), usa `/context list` o `/context detail`. Consulta [Contexto](/es/concepts/context).

## Manejo del tiempo

El prompt del sistema incluye una sección dedicada de **Fecha y hora actuales** cuando se
conoce la zona horaria del usuario. Para mantener estable la caché del prompt, ahora solo incluye
la **zona horaria** (sin reloj dinámico ni formato de hora).

Usa `session_status` cuando el agente necesite la hora actual; la tarjeta de estado
incluye una línea de marca de tiempo. La misma herramienta puede establecer opcionalmente una anulación de modelo por sesión
(`model=default` la borra).

Configura con:

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

Consulta [Fecha y hora](/es/date-time) para ver todos los detalles de comportamiento.

## Skills

Cuando existen Skills elegibles, OpenClaw inyecta una **lista de Skills disponibles** compacta
(`formatSkillsForPrompt`) que incluye la **ruta del archivo** y el marcador
`<version>` derivado del contenido para cada skill. El prompt indica al modelo que use `read`
para cargar el SKILL.md en la ubicación indicada (espacio de trabajo, administrada o incluida),
y que vuelva a leer una skill cuando su `<version>` difiera de un turno anterior. Si no hay
Skills elegibles, se omite la sección Skills.

Los turnos de Codex nativo reciben esta lista como instrucciones de desarrollador de colaboración con alcance de turno
en lugar de entrada de usuario por turno, excepto los turnos ligeros de cron que
preservan el prompt programado exacto. Otros harnesses conservan la sección normal del prompt.

La ubicación puede apuntar a una skill anidada, como
`skills/personal/foo/SKILL.md`. El anidamiento es solo organizativo; el prompt sigue
usando el nombre plano de la skill del frontmatter de `SKILL.md`.

La elegibilidad incluye compuertas de metadatos de skills, comprobaciones de entorno/configuración en tiempo de ejecución,
y la lista efectiva de skills permitidas del agente cuando se configura `agents.defaults.skills` o
`agents.list[].skills`.

Las skills incluidas en Plugins solo son elegibles cuando su plugin propietario está habilitado.
Esto permite que los plugins de herramientas expongan guías operativas más profundas sin incrustar toda
esa orientación directamente en cada descripción de herramienta.

```
<available_skills>
  <skill>
    <name>...</name>
    <description>...</description>
    <location>...</location>
    <version>sha256:...</version>
  </skill>
</available_skills>
```

Esto mantiene pequeño el prompt base sin dejar de permitir el uso dirigido de skills.

El presupuesto de la lista de skills pertenece al subsistema de skills:

- Valor predeterminado global: `skills.limits.maxSkillsPromptChars`
- Anulación por agente: `agents.list[].skillsLimits.maxSkillsPromptChars`

Los extractos genéricos acotados en tiempo de ejecución usan una superficie diferente:

- `agents.defaults.contextLimits.*`
- `agents.list[].contextLimits.*`

Esa separación mantiene el dimensionamiento de skills separado del dimensionamiento de lectura/inyección en tiempo de ejecución, como
`memory_get`, resultados de herramientas en vivo y actualizaciones de AGENTS.md posteriores a Compaction.

## Documentación

El prompt del sistema incluye una sección de **Documentación**. Cuando hay documentación local disponible,
apunta al directorio local de documentación de OpenClaw (`docs/` en un checkout de Git o la documentación del paquete
npm incluido). Si la documentación local no está disponible, recurre a
[https://docs.openclaw.ai](https://docs.openclaw.ai).

La misma sección también incluye la ubicación del código fuente de OpenClaw. Los checkouts de Git exponen la raíz local
del código fuente para que el agente pueda inspeccionar el código directamente. Las instalaciones de paquetes incluyen la URL
del código fuente en GitHub e indican al agente que revise el código fuente allí cuando la documentación esté incompleta o
obsoleta. El prompt también menciona el espejo público de la documentación, el Discord de la comunidad y ClawHub
([https://clawhub.ai](https://clawhub.ai)) para descubrir skills. Presenta la documentación como la
autoridad para el autoconocimiento de OpenClaw antes de que el modelo entienda cómo funciona OpenClaw,
incluidas memoria/notas diarias, sesiones, herramientas, Gateway, configuración, comandos o contexto del proyecto.
El prompt indica al modelo que use primero la documentación local (o el espejo de la documentación cuando la documentación local
no esté disponible), y que trate AGENTS.md, el contexto del proyecto, las notas de espacio de trabajo/perfil/memoria
y `memory_search` como contexto de instrucciones o memoria del usuario, no como conocimiento de diseño o implementación
de OpenClaw. Si la documentación no dice nada o está obsoleta, el modelo debe decirlo
e inspeccionar el código fuente. El prompt también indica al modelo que ejecute `openclaw status` por sí mismo cuando
sea posible, y que pregunte al usuario solo cuando no tenga acceso.
Para la configuración específicamente, dirige a los agentes a la acción de herramienta `gateway`
`config.schema.lookup` para obtener documentación y restricciones exactas a nivel de campo, y luego a
`docs/gateway/configuration.md` y `docs/gateway/configuration-reference.md`
para orientación más amplia.

## Relacionado

- [Tiempo de ejecución del agente](/es/concepts/agent)
- [Espacio de trabajo del agente](/es/concepts/agent-workspace)
- [Motor de contexto](/es/concepts/context-engine)

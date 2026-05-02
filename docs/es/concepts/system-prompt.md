---
read_when:
    - Edición del texto del prompt del sistema, la lista de herramientas o las secciones de tiempo/Heartbeat
    - Cambiar el comportamiento de inicialización del espacio de trabajo o de inyección de Skills
summary: Qué contiene el prompt del sistema de OpenClaw y cómo se ensambla
title: Instrucción del sistema
x-i18n:
    generated_at: "2026-05-02T22:18:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3b8761a8722bb328b937e0832774be7b4e99602ae032c9a255f26843237c110c
    source_path: concepts/system-prompt.md
    workflow: 16
---

OpenClaw construye un prompt de sistema personalizado para cada ejecución de agente. El prompt es **propiedad de OpenClaw** y no usa el prompt predeterminado de pi-coding-agent.

OpenClaw ensambla el prompt y lo inyecta en cada ejecución de agente.

Los plugins de proveedor pueden aportar orientación de prompt compatible con caché sin reemplazar
todo el prompt propiedad de OpenClaw. El runtime del proveedor puede:

- reemplazar un conjunto pequeño de secciones core con nombre (`interaction_style`,
  `tool_call_style`, `execution_bias`)
- inyectar un **prefijo estable** por encima del límite de caché del prompt
- inyectar un **sufijo dinámico** por debajo del límite de caché del prompt

Usa contribuciones propiedad del proveedor para ajustes específicos de familias de modelos. Mantén la mutación de prompt heredada
`before_prompt_build` para compatibilidad o cambios de prompt verdaderamente globales,
no para el comportamiento normal del proveedor.

La superposición de la familia OpenAI GPT-5 mantiene pequeña la regla de ejecución core y agrega
orientación específica del modelo para fijación de personalidad, salida concisa, disciplina de herramientas,
búsqueda paralela, cobertura de entregables, verificación, contexto faltante e
higiene de herramientas de terminal.

## Estructura

El prompt es intencionalmente compacto y usa secciones fijas:

- **Herramientas**: recordatorio de fuente de verdad para herramientas estructuradas más orientación de uso de herramientas en runtime.
- **Sesgo de ejecución**: orientación compacta de seguimiento: actuar en el turno sobre
  solicitudes accionables, continuar hasta terminar o quedar bloqueado, recuperarse de resultados débiles de herramientas,
  comprobar en vivo el estado mutable y verificar antes de finalizar.
- **Seguridad**: breve recordatorio de límites para evitar comportamiento de búsqueda de poder o eludir supervisión.
- **Skills** (cuando están disponibles): indica al modelo cómo cargar instrucciones de Skills bajo demanda.
- **Autoactualización de OpenClaw**: cómo inspeccionar la configuración de forma segura con
  `config.schema.lookup`, parchear la configuración con `config.patch`, reemplazar la configuración
  completa con `config.apply` y ejecutar `update.run` solo por solicitud explícita del usuario.
  La herramienta `gateway`, solo para propietarios, también rechaza reescribir
  `tools.exec.ask` / `tools.exec.security`, incluidos los alias heredados `tools.bash.*`
  que se normalizan a esas rutas exec protegidas.
- **Workspace**: directorio de trabajo (`agents.defaults.workspace`).
- **Documentación**: ruta local a la documentación de OpenClaw (repo o paquete npm) y cuándo leerla.
- **Archivos de workspace (inyectados)**: indica que los archivos de arranque se incluyen abajo.
- **Sandbox** (cuando está habilitado): indica runtime en sandbox, rutas de sandbox y si exec elevado está disponible.
- **Fecha y hora actuales**: hora local del usuario, zona horaria y formato de hora.
- **Etiquetas de respuesta**: sintaxis opcional de etiquetas de respuesta para proveedores compatibles.
- **Heartbeats**: prompt de Heartbeat y comportamiento de confirmación, cuando los Heartbeats están habilitados para el agente predeterminado.
- **Runtime**: host, SO, Node, modelo, raíz del repo (cuando se detecta), nivel de pensamiento (una línea).
- **Razonamiento**: nivel de visibilidad actual + sugerencia del interruptor /reasoning.

OpenClaw mantiene contenido estable grande, incluido **Contexto del proyecto**, por encima del
límite interno de caché del prompt. Las secciones volátiles de canal/sesión, como
la orientación de inserción de Control UI, **Mensajería**, **Voz**, **Contexto de chat grupal**,
**Reacciones**, **Heartbeats** y **Runtime**, se agregan por debajo de ese límite
para que los backends locales con cachés de prefijo puedan reutilizar el prefijo estable del workspace
entre turnos de canal. Las descripciones de herramientas también deberían evitar incrustar nombres
de canal actuales cuando el esquema aceptado ya lleva ese detalle de runtime.

La sección Herramientas también incluye orientación de runtime para trabajo de larga duración:

- usa Cron para seguimiento futuro (`check back later`, recordatorios, trabajo recurrente)
  en lugar de bucles de suspensión con `exec`, trucos de demora `yieldMs` o sondeos repetidos de `process`
- usa `exec` / `process` solo para comandos que empiezan ahora y siguen ejecutándose
  en segundo plano
- cuando el despertar automático al completar está habilitado, inicia el comando una vez y confía en
  la ruta de activación basada en push cuando emita salida o falle
- usa `process` para logs, estado, entrada o intervención cuando necesites
  inspeccionar un comando en ejecución
- si la tarea es más grande, prefiere `sessions_spawn`; la finalización de subagentes está
  basada en push y se anuncia automáticamente de vuelta al solicitante
- no sondees `subagents list` / `sessions_list` en un bucle solo para esperar
  la finalización

Cuando la herramienta experimental `update_plan` está habilitada, Herramientas también indica al
modelo que la use solo para trabajo no trivial de varios pasos, que mantenga exactamente un paso
`in_progress` y que evite repetir todo el plan después de cada actualización.

Los límites de seguridad del prompt de sistema son orientativos. Guían el comportamiento del modelo, pero no aplican políticas. Usa políticas de herramientas, aprobaciones de exec, sandboxing y listas de permisos de canales para una aplicación estricta; los operadores pueden deshabilitarlos por diseño.

En canales con tarjetas/botones de aprobación nativos, el prompt de runtime ahora indica al
agente que confíe primero en esa UI de aprobación nativa. Solo debería incluir un comando manual
`/approve` cuando el resultado de la herramienta diga que las aprobaciones por chat no están disponibles o que
la aprobación manual es la única ruta.

## Modos de prompt

OpenClaw puede renderizar prompts de sistema más pequeños para subagentes. El runtime establece un
`promptMode` para cada ejecución (no es una configuración visible para el usuario):

- `full` (predeterminado): incluye todas las secciones anteriores.
- `minimal`: usado para subagentes; omite **Skills**, **Recuperación de memoria**, **Autoactualización de OpenClaw**,
  **Alias de modelo**, **Identidad de usuario**, **Etiquetas de respuesta**,
  **Mensajería**, **Respuestas silenciosas** y **Heartbeats**. Herramientas, **Seguridad**,
  Workspace, Sandbox, Fecha y hora actuales (cuando se conocen), Runtime y el contexto
  inyectado siguen disponibles.
- `none`: devuelve solo la línea base de identidad.

Cuando `promptMode=minimal`, los prompts adicionales inyectados se etiquetan como **Contexto de subagente**
en lugar de **Contexto de chat grupal**.

Para ejecuciones de respuesta automática de canal, OpenClaw puede omitir la sección genérica **Respuestas silenciosas**
cuando el contexto de chat directo/grupal ya incluye el comportamiento `NO_REPLY`
específico de la conversación resuelta. Esto evita repetir mecánicas de tokens
tanto en el prompt de sistema global como en el contexto del canal.

## Snapshots de prompt

OpenClaw mantiene snapshots de prompt confirmados para la ruta correcta del runtime Codex/message-tool
en `test/fixtures/agents/prompt-snapshots/happy-path/`. Renderizan
parámetros seleccionados de hilo/turno del app-server más una pila reconstruida de capas de prompt vinculadas al modelo
para turnos directos de Telegram, grupales de Discord y Heartbeat. Esa pila
incluye una fixture fijada de prompt del modelo Codex `gpt-5.5` generada a partir de la forma del catálogo/caché
de modelos de Codex, el texto de desarrollador de permisos de ruta correcta de Codex,
instrucciones de desarrollador de OpenClaw, entrada del turno del usuario y referencias a las especificaciones dinámicas
de herramientas.

Actualiza la fixture fijada de prompt del modelo Codex con
`pnpm prompt:snapshots:sync-codex-model`. De forma predeterminada, el script busca
la caché de runtime de Codex en `$CODEX_HOME/models_cache.json`, luego
`~/.codex/models_cache.json`, y solo entonces recurre a la convención del checkout Codex
del mantenedor en `~/code/codex/codex-rs/models-manager/models.json`. Si
ninguna de esas fuentes existe, el comando sale sin cambiar la fixture confirmada.
Pasa `--catalog <path>` para actualizar desde un archivo `models_cache.json`
o `models.json` específico.

Estos snapshots todavía no son una captura byte por byte de una solicitud OpenAI sin procesar. Codex
puede agregar contexto de workspace propiedad del runtime, como `AGENTS.md`, contexto de entorno,
memorias, instrucciones de app/plugin y futuras instrucciones de modo de colaboración
dentro del runtime de Codex después de que OpenClaw envíe los parámetros de hilo y turno.

Regénéralos con `pnpm prompt:snapshots:gen` y verifica la deriva con
`pnpm prompt:snapshots:check`. CI ejecuta la comprobación de deriva en el shard
adicional de límite para que los cambios de prompt y las actualizaciones de snapshots permanezcan adjuntos al mismo
PR.

## Inyección de arranque del workspace

Los archivos de arranque se recortan y se agregan bajo **Contexto del proyecto** para que el modelo vea contexto de identidad y perfil sin necesitar lecturas explícitas:

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (solo en workspaces completamente nuevos)
- `MEMORY.md` cuando esté presente

Todos estos archivos se **inyectan en la ventana de contexto** en cada turno salvo que
se aplique una compuerta específica del archivo. `HEARTBEAT.md` se omite en ejecuciones normales cuando
los Heartbeats están deshabilitados para el agente predeterminado o
`agents.defaults.heartbeat.includeSystemPromptSection` es false. Mantén concisos los archivos
inyectados, especialmente `MEMORY.md`, que puede crecer con el tiempo y provocar
un uso de contexto inesperadamente alto y Compaction más frecuente.

<Note>
Los archivos diarios `memory/*.md` **no** forman parte del Contexto del proyecto de arranque normal. En turnos ordinarios se accede a ellos bajo demanda mediante las herramientas `memory_search` y `memory_get`, por lo que no cuentan contra la ventana de contexto salvo que el modelo los lea explícitamente. Los turnos simples `/new` y `/reset` son la excepción: el runtime puede anteponer memoria diaria reciente como un bloque de contexto inicial de un solo uso para ese primer turno.
</Note>

Los archivos grandes se truncan con un marcador. El tamaño máximo por archivo se controla mediante
`agents.defaults.bootstrapMaxChars` (predeterminado: 12000). El contenido total de arranque inyectado
entre archivos está limitado por `agents.defaults.bootstrapTotalMaxChars`
(predeterminado: 60000). Los archivos faltantes inyectan un breve marcador de archivo faltante. Cuando se produce truncamiento,
OpenClaw puede inyectar un bloque de advertencia en Contexto del proyecto; contrólalo con
`agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`;
predeterminado: `once`).

Las sesiones de subagente solo inyectan `AGENTS.md` y `TOOLS.md` (los demás archivos de arranque
se filtran para mantener pequeño el contexto del subagente).

Los hooks internos pueden interceptar este paso mediante `agent:bootstrap` para mutar o reemplazar
los archivos de arranque inyectados (por ejemplo, intercambiar `SOUL.md` por una personalidad alternativa).

Si quieres que el agente suene menos genérico, empieza con
[Guía de personalidad de SOUL.md](/es/concepts/soul).

Para inspeccionar cuánto aporta cada archivo inyectado (sin procesar frente a inyectado, truncamiento, más sobrecarga del esquema de herramientas), usa `/context list` o `/context detail`. Consulta [Contexto](/es/concepts/context).

## Manejo del tiempo

El prompt de sistema incluye una sección dedicada **Fecha y hora actuales** cuando se conoce
la zona horaria del usuario. Para mantener estable la caché del prompt, ahora solo incluye
la **zona horaria** (sin reloj dinámico ni formato de hora).

Usa `session_status` cuando el agente necesite la hora actual; la tarjeta de estado
incluye una línea de marca de tiempo. La misma herramienta puede establecer opcionalmente una anulación de modelo
por sesión (`model=default` la borra).

Configura con:

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

Consulta [Fecha y hora](/es/date-time) para ver todos los detalles del comportamiento.

## Skills

Cuando existen Skills elegibles, OpenClaw inyecta una **lista compacta de Skills disponibles**
(`formatSkillsForPrompt`) que incluye la **ruta de archivo** de cada Skill. El
prompt indica al modelo que use `read` para cargar el SKILL.md en la ubicación
indicada (workspace, administrada o incluida). Si no hay Skills elegibles, se omite
la sección Skills.

La elegibilidad incluye compuertas de metadatos de Skills, comprobaciones de entorno/configuración de runtime
y la lista efectiva de Skills permitidas para el agente cuando `agents.defaults.skills` o
`agents.list[].skills` está configurado.

Las Skills incluidas por plugins son elegibles solo cuando su plugin propietario está habilitado.
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

Esto mantiene pequeño el prompt base y a la vez habilita el uso dirigido de Skills.

El presupuesto de la lista de Skills pertenece al subsistema de Skills:

- Valor predeterminado global: `skills.limits.maxSkillsPromptChars`
- Anulación por agente: `agents.list[].skillsLimits.maxSkillsPromptChars`

Los extractos genéricos acotados de runtime usan una superficie diferente:

- `agents.defaults.contextLimits.*`
- `agents.list[].contextLimits.*`

Esa separación mantiene el dimensionamiento de Skills separado del dimensionamiento de lectura/inyección de runtime, como
`memory_get`, resultados de herramientas en vivo y actualizaciones de AGENTS.md posteriores a Compaction.

## Documentación

El prompt del sistema incluye una sección de **Documentación**. Cuando hay documentación local disponible, apunta al directorio local de documentación de OpenClaw (`docs/` en una copia de trabajo de Git o la documentación incluida en el paquete npm). Si la documentación local no está disponible, recurre a [https://docs.openclaw.ai](https://docs.openclaw.ai).

La misma sección también incluye la ubicación del código fuente de OpenClaw. Las copias de trabajo de Git exponen la raíz del código fuente local para que el agente pueda inspeccionar el código directamente. Las instalaciones de paquetes incluyen la URL del código fuente en GitHub e indican al agente que revise el código fuente allí cuando la documentación esté incompleta o desactualizada. El prompt también señala el espejo público de la documentación, el Discord de la comunidad y ClawHub ([https://clawhub.ai](https://clawhub.ai)) para descubrir Skills. Indica al modelo que consulte primero la documentación para el comportamiento, los comandos, la configuración o la arquitectura de OpenClaw, y que ejecute `openclaw status` por sí mismo cuando sea posible (preguntando al usuario solo cuando no tenga acceso). En concreto para la configuración, dirige a los agentes a la acción de herramienta `gateway` `config.schema.lookup` para obtener documentación y restricciones exactas a nivel de campo, y luego a `docs/gateway/configuration.md` y `docs/gateway/configuration-reference.md` para obtener orientación más amplia.

## Relacionado

- [Entorno de ejecución del agente](/es/concepts/agent)
- [Área de trabajo del agente](/es/concepts/agent-workspace)
- [Motor de contexto](/es/concepts/context-engine)

---
read_when:
    - Editar el texto del prompt del sistema, la lista de herramientas o las secciones de hora/Heartbeat
    - Cambiar el comportamiento de bootstrap del espacio de trabajo o de inyección de Skills
summary: Qué contiene el prompt del sistema de OpenClaw y cómo se ensambla
title: Prompt del sistema
x-i18n:
    generated_at: "2026-04-26T11:27:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 71a4dc6dfb412d62f7c81875f1bebfb21fdae432e28cc7473e1ce8f93380f93b
    source_path: concepts/system-prompt.md
    workflow: 15
---

OpenClaw construye un prompt del sistema personalizado para cada ejecución del agente. El prompt es **propiedad de OpenClaw** y no usa el prompt predeterminado de pi-coding-agent.

El prompt es ensamblado por OpenClaw e inyectado en cada ejecución del agente.

Los plugins de proveedor pueden aportar guía de prompt con reconocimiento de caché sin reemplazar
el prompt completo propiedad de OpenClaw. El entorno de ejecución del proveedor puede:

- reemplazar un pequeño conjunto de secciones centrales con nombre (`interaction_style`,
  `tool_call_style`, `execution_bias`)
- inyectar un **prefijo estable** por encima del límite de caché del prompt
- inyectar un **sufijo dinámico** por debajo del límite de caché del prompt

Usa aportes propiedad del proveedor para ajustes específicos de familias de modelos. Mantén la mutación heredada
del prompt `before_prompt_build` para compatibilidad o cambios verdaderamente globales del prompt, no para el comportamiento normal del proveedor.

La superposición de la familia OpenAI GPT-5 mantiene pequeña la regla central de ejecución y añade
guía específica del modelo para fijación de personalidad, salida concisa, disciplina de herramientas,
búsqueda en paralelo, cobertura de entregables, verificación, contexto faltante e
higiene de herramientas de terminal.

## Estructura

El prompt es intencionalmente compacto y usa secciones fijas:

- **Tooling**: recordatorio de fuente de verdad de herramientas estructuradas más guía de uso de herramientas en tiempo de ejecución.
- **Execution Bias**: guía compacta de seguimiento: actuar en el turno sobre
  solicitudes accionables, continuar hasta terminar o quedar bloqueado, recuperarse de resultados débiles de herramientas,
  comprobar el estado mutable en vivo y verificar antes de finalizar.
- **Safety**: breve recordatorio de barreras para evitar comportamiento de búsqueda de poder o eludir supervisión.
- **Skills** (cuando están disponibles): le dice al modelo cómo cargar instrucciones de Skills bajo demanda.
- **OpenClaw Self-Update**: cómo inspeccionar la configuración de forma segura con
  `config.schema.lookup`, aplicar parches a la configuración con `config.patch`, reemplazar la configuración completa
  con `config.apply` y ejecutar `update.run` solo a solicitud explícita del usuario. La herramienta
  `gateway`, solo para propietarios, también se niega a reescribir
  `tools.exec.ask` / `tools.exec.security`, incluyendo alias heredados `tools.bash.*`
  que se normalizan a esas rutas de exec protegidas.
- **Workspace**: directorio de trabajo (`agents.defaults.workspace`).
- **Documentation**: ruta local a la documentación de OpenClaw (repo o paquete npm) y cuándo leerla.
- **Workspace Files (injected)**: indica que los archivos bootstrap se incluyen abajo.
- **Sandbox** (cuando está habilitado): indica entorno de ejecución en sandbox, rutas de sandbox y si exec elevado está disponible.
- **Current Date & Time**: hora local del usuario, zona horaria y formato de hora.
- **Reply Tags**: sintaxis opcional de etiquetas de respuesta para proveedores compatibles.
- **Heartbeats**: prompt de Heartbeat y comportamiento de acuse, cuando Heartbeat está habilitado para el agente predeterminado.
- **Runtime**: host, SO, node, modelo, raíz del repo (cuando se detecta), nivel de razonamiento (una línea).
- **Reasoning**: nivel actual de visibilidad + pista del cambio `/reasoning`.

La sección Tooling también incluye guía en tiempo de ejecución para trabajo de larga duración:

- usa Cron para seguimientos futuros (`check back later`, recordatorios, trabajo recurrente)
  en lugar de bucles `exec` con sleep, trucos de retraso `yieldMs` o sondeo repetido de `process`
- usa `exec` / `process` solo para comandos que empiecen ahora y sigan ejecutándose
  en segundo plano
- cuando está habilitado el despertar automático al completarse, inicia el comando una vez y confía en
  la ruta de activación push cuando emita salida o falle
- usa `process` para registros, estado, entrada o intervención cuando necesites
  inspeccionar un comando en ejecución
- si la tarea es mayor, prefiere `sessions_spawn`; la finalización del subagente es
  push-based y se anuncia automáticamente al solicitante
- no sondees `subagents list` / `sessions_list` en bucle solo para esperar
  la finalización

Cuando la herramienta experimental `update_plan` está habilitada, Tooling también le dice al
modelo que la use solo para trabajo no trivial de varios pasos, mantenga exactamente un
paso `in_progress` y evite repetir el plan completo después de cada actualización.

Las barreras de Safety en el prompt del sistema son consultivas. Guían el comportamiento del modelo pero no aplican políticas. Usa política de herramientas, aprobaciones de exec, sandboxing y listas de permitidos de canal para la aplicación dura; los operadores pueden desactivarlas por diseño.

En canales con tarjetas/botones de aprobación nativos, el prompt del entorno de ejecución ahora le dice al
agente que confíe primero en esa IU nativa de aprobación. Solo debe incluir un comando manual
`/approve` cuando el resultado de la herramienta diga que las aprobaciones por chat no están disponibles o
que la aprobación manual es la única vía.

## Modos de prompt

OpenClaw puede renderizar prompts del sistema más pequeños para subagentes. El entorno de ejecución establece un
`promptMode` para cada ejecución (no es una configuración visible para el usuario):

- `full` (predeterminado): incluye todas las secciones anteriores.
- `minimal`: se usa para subagentes; omite **Skills**, **Memory Recall**, **OpenClaw
  Self-Update**, **Model Aliases**, **User Identity**, **Reply Tags**,
  **Messaging**, **Silent Replies** y **Heartbeats**. Tooling, **Safety**,
  Workspace, Sandbox, Current Date & Time (cuando se conoce), Runtime y el
  contexto inyectado siguen disponibles.
- `none`: devuelve solo la línea base de identidad.

Cuando `promptMode=minimal`, los prompts extra inyectados se etiquetan como **Subagent
Context** en lugar de **Group Chat Context**.

## Inyección bootstrap del espacio de trabajo

Los archivos bootstrap se recortan y se anexan bajo **Project Context** para que el modelo vea identidad y contexto de perfil sin necesidad de lecturas explícitas:

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (solo en espacios de trabajo completamente nuevos)
- `MEMORY.md` cuando está presente

Todos estos archivos se **inyectan en la ventana de contexto** en cada turno, a menos
que se aplique una compuerta específica por archivo. `HEARTBEAT.md` se omite en ejecuciones normales cuando
Heartbeat está deshabilitado para el agente predeterminado o
`agents.defaults.heartbeat.includeSystemPromptSection` es false. Mantén concisos los archivos inyectados, especialmente `MEMORY.md`, que puede crecer con el tiempo y provocar un uso de contexto inesperadamente alto y Compaction más frecuente.

> **Nota:** los archivos diarios `memory/*.md` **no** forman parte del bootstrap normal de
> Project Context. En turnos normales se accede a ellos bajo demanda mediante las
> herramientas `memory_search` y `memory_get`, por lo que no cuentan contra la
> ventana de contexto a menos que el modelo los lea explícitamente. Los turnos simples `/new` y
> `/reset` son la excepción: el entorno de ejecución puede anteponer la memoria diaria reciente
> como un bloque único de contexto de inicio para ese primer turno.

Los archivos grandes se truncan con un marcador. El tamaño máximo por archivo está controlado por
`agents.defaults.bootstrapMaxChars` (predeterminado: 12000). El contenido bootstrap total inyectado
entre archivos está limitado por `agents.defaults.bootstrapTotalMaxChars`
(predeterminado: 60000). Los archivos faltantes inyectan un marcador breve de archivo faltante. Cuando ocurre truncamiento,
OpenClaw puede inyectar un bloque de advertencia en Project Context; controla esto con
`agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`;
predeterminado: `once`).

Las sesiones de subagente solo inyectan `AGENTS.md` y `TOOLS.md` (los demás archivos bootstrap
se filtran para mantener pequeño el contexto del subagente).

Los hooks internos pueden interceptar este paso mediante `agent:bootstrap` para mutar o reemplazar
los archivos bootstrap inyectados (por ejemplo intercambiar `SOUL.md` por una personalidad alternativa).

Si quieres que el agente suene menos genérico, empieza con
[Guía de personalidad de SOUL.md](/es/concepts/soul).

Para inspeccionar cuánto aporta cada archivo inyectado (sin procesar frente a inyectado, truncamiento, además de sobrecarga de esquema de herramientas), usa `/context list` o `/context detail`. Consulta [Contexto](/es/concepts/context).

## Manejo de la hora

El prompt del sistema incluye una sección dedicada **Current Date & Time** cuando se conoce la
zona horaria del usuario. Para mantener estable la caché del prompt, ahora solo incluye
la **zona horaria** (sin reloj dinámico ni formato de hora).

Usa `session_status` cuando el agente necesite la hora actual; la tarjeta de estado
incluye una línea de marca temporal. La misma herramienta puede opcionalmente establecer una sobrescritura
de modelo por sesión (`model=default` la borra).

Configura con:

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

Consulta [Fecha y hora](/es/date-time) para ver los detalles completos del comportamiento.

## Skills

Cuando existen Skills elegibles, OpenClaw inyecta una lista compacta de **Skills disponibles**
(`formatSkillsForPrompt`) que incluye la **ruta del archivo** para cada Skill. El
prompt instruye al modelo a usar `read` para cargar el SKILL.md en la ubicación listada
(espacio de trabajo, gestionado o incluido). Si no hay Skills elegibles, la
sección Skills se omite.

La elegibilidad incluye compuertas de metadatos de Skills, comprobaciones del entorno/configuración del entorno de ejecución
y la lista de permitidos efectiva de Skills del agente cuando `agents.defaults.skills` o
`agents.list[].skills` está configurado.

Los Skills incluidos en plugins solo son elegibles cuando su Plugin propietario está habilitado.
Esto permite que los plugins de herramientas expongan guías operativas más profundas sin incrustar toda
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

Esto mantiene pequeño el prompt base y al mismo tiempo habilita el uso dirigido de Skills.

El presupuesto de la lista de Skills es propiedad del subsistema de Skills:

- Predeterminado global: `skills.limits.maxSkillsPromptChars`
- Sobrescritura por agente: `agents.list[].skillsLimits.maxSkillsPromptChars`

Los extractos genéricos acotados del entorno de ejecución usan una superficie diferente:

- `agents.defaults.contextLimits.*`
- `agents.list[].contextLimits.*`

Esa separación mantiene el dimensionamiento de Skills aparte del dimensionamiento de lectura/inyección del entorno de ejecución
como `memory_get`, resultados de herramientas en vivo y actualizaciones de AGENTS.md posteriores a Compaction.

## Documentación

El prompt del sistema incluye una sección **Documentation**. Cuando la documentación local está disponible,
apunta al directorio local de docs de OpenClaw (`docs/` en un checkout de Git o la documentación
incluida en el paquete npm). Si la documentación local no está disponible, recurre a
[https://docs.openclaw.ai](https://docs.openclaw.ai).

La misma sección también incluye la ubicación del código fuente de OpenClaw. Los checkouts de Git exponen la raíz
local del código fuente para que el agente pueda inspeccionar el código directamente. Las instalaciones del paquete incluyen la URL del
código fuente en GitHub y le dicen al agente que revise el código allí siempre que la documentación esté incompleta o
desactualizada. El prompt también menciona el mirror público de docs, Discord de la comunidad y ClawHub
([https://clawhub.ai](https://clawhub.ai)) para descubrir Skills. Le dice al modelo que
consulte primero la documentación para comportamiento, comandos, configuración o arquitectura de OpenClaw, y que
ejecute `openclaw status` por sí mismo cuando sea posible (preguntando al usuario solo cuando no tenga acceso).
Para configuración específicamente, dirige a los agentes a la acción de la herramienta `gateway`
`config.schema.lookup` para documentación y restricciones exactas a nivel de campo, y luego a
`docs/gateway/configuration.md` y `docs/gateway/configuration-reference.md`
para una guía más amplia.

## Relacionado

- [Entorno de ejecución del agente](/es/concepts/agent)
- [Espacio de trabajo del agente](/es/concepts/agent-workspace)
- [Motor de contexto](/es/concepts/context-engine)

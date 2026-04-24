---
read_when:
    - Editar el texto del prompt del sistema, la lista de herramientas o las secciones de hora/Heartbeat
    - Cambiar el comportamiento de bootstrap del espacio de trabajo o la inyección de Skills
summary: Qué contiene el prompt del sistema de OpenClaw y cómo se ensambla
title: Prompt del sistema
x-i18n:
    generated_at: "2026-04-24T05:27:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: ff0498b99974f1a75fc9b93ca46cc0bf008ebf234b429c05ee689a4a150d29f1
    source_path: concepts/system-prompt.md
    workflow: 15
---

OpenClaw compila un prompt del sistema personalizado para cada ejecución de agente. El prompt es **propiedad de OpenClaw** y no usa el prompt predeterminado de pi-coding-agent.

El prompt es ensamblado por OpenClaw e inyectado en cada ejecución del agente.

Los Plugins de proveedor pueden aportar guía de prompt con reconocimiento de caché sin reemplazar
el prompt completo propiedad de OpenClaw. El tiempo de ejecución del proveedor puede:

- reemplazar un pequeño conjunto de secciones principales con nombre (`interaction_style`,
  `tool_call_style`, `execution_bias`)
- inyectar un **prefijo estable** por encima del límite de caché del prompt
- inyectar un **sufijo dinámico** por debajo del límite de caché del prompt

Usa contribuciones propiedad del proveedor para ajustes específicos de familias de modelos. Mantén la mutación heredada del prompt en
`before_prompt_build` para compatibilidad o cambios realmente globales del prompt, no para el comportamiento normal del proveedor.

La superposición de la familia OpenAI GPT-5 mantiene pequeña la regla principal de ejecución y agrega
guía específica del modelo para fijación de personalidad, salida concisa, disciplina de herramientas,
búsqueda en paralelo, cobertura de entregables, verificación, contexto faltante e
higiene de herramientas de terminal.

## Estructura

El prompt es intencionalmente compacto y usa secciones fijas:

- **Tooling**: recordatorio de fuente de verdad de herramientas estructuradas más guía de uso de herramientas en tiempo de ejecución.
- **Execution Bias**: guía compacta de seguimiento: actuar en el turno sobre
  solicitudes accionables, continuar hasta terminar o quedar bloqueado, recuperarse de resultados
  débiles de herramientas, comprobar el estado mutable en vivo y verificar antes de finalizar.
- **Safety**: breve recordatorio de barreras de seguridad para evitar comportamiento de búsqueda de poder o evasión de supervisión.
- **Skills** (cuando están disponibles): indica al modelo cómo cargar instrucciones de Skills bajo demanda.
- **OpenClaw Self-Update**: cómo inspeccionar la configuración de forma segura con
  `config.schema.lookup`, parchear la configuración con `config.patch`, reemplazar la
  configuración completa con `config.apply` y ejecutar `update.run` solo cuando el usuario
  lo solicite explícitamente. La herramienta `gateway`, solo para el propietario, también se niega a reescribir
  `tools.exec.ask` / `tools.exec.security`, incluidas las
  alias heredadas `tools.bash.*` que se normalizan a esas rutas protegidas de exec.
- **Workspace**: directorio de trabajo (`agents.defaults.workspace`).
- **Documentation**: ruta local a la documentación de OpenClaw (repositorio o paquete npm) y cuándo leerla.
- **Workspace Files (injected)**: indica que los archivos de bootstrap están incluidos debajo.
- **Sandbox** (cuando está habilitado): indica tiempo de ejecución en sandbox, rutas de sandbox y si exec elevado está disponible.
- **Current Date & Time**: hora local del usuario, zona horaria y formato de hora.
- **Reply Tags**: sintaxis opcional de etiquetas de respuesta para proveedores compatibles.
- **Heartbeats**: prompt de Heartbeat y comportamiento de confirmación, cuando Heartbeat está habilitado para el agente predeterminado.
- **Runtime**: host, SO, node, modelo, raíz del repositorio (cuando se detecta), nivel de razonamiento (una línea).
- **Reasoning**: nivel actual de visibilidad + sugerencia de alternancia `/reasoning`.

La sección Tooling también incluye guía de tiempo de ejecución para trabajo de larga duración:

- usar cron para seguimiento futuro (`check back later`, recordatorios, trabajo recurrente)
  en lugar de bucles sleep de `exec`, trucos de retraso `yieldMs` o sondeo repetido de `process`
- usar `exec` / `process` solo para comandos que empiezan ahora y siguen ejecutándose
  en segundo plano
- cuando la activación automática al finalizar está habilitada, iniciar el comando una sola vez y confiar en
  la ruta de activación push cuando emita salida o falle
- usar `process` para registros, estado, entrada o intervención cuando necesites
  inspeccionar un comando en ejecución
- si la tarea es más grande, preferir `sessions_spawn`; la finalización de subagentes usa
  push y se anuncia automáticamente de vuelta al solicitante
- no sondear `subagents list` / `sessions_list` en un bucle solo para esperar
  la finalización

Cuando la herramienta experimental `update_plan` está habilitada, Tooling también indica al
modelo que la use solo para trabajo no trivial de varios pasos, que mantenga exactamente un
paso `in_progress` y que evite repetir todo el plan después de cada actualización.

Las barreras de Safety del prompt del sistema son orientativas. Guían el comportamiento del modelo, pero no aplican políticas. Usa política de herramientas, aprobaciones de exec, sandboxing y listas permitidas de canales para la aplicación rígida; los operadores pueden desactivarlas por diseño.

En canales con tarjetas/botones de aprobación nativos, el prompt del tiempo de ejecución ahora indica al
agente que confíe primero en esa UI nativa de aprobación. Solo debe incluir un comando manual
`/approve` cuando el resultado de la herramienta indique que las aprobaciones en chat no están disponibles o que
la aprobación manual es la única vía.

## Modos de prompt

OpenClaw puede representar prompts del sistema más pequeños para subagentes. El tiempo de ejecución establece un
`promptMode` para cada ejecución (no es una configuración visible para el usuario):

- `full` (predeterminado): incluye todas las secciones anteriores.
- `minimal`: usado para subagentes; omite **Skills**, **Memory Recall**, **OpenClaw
  Self-Update**, **Model Aliases**, **User Identity**, **Reply Tags**,
  **Messaging**, **Silent Replies** y **Heartbeats**. Tooling, **Safety**,
  Workspace, Sandbox, Current Date & Time (cuando se conoce), Runtime y el
  contexto inyectado siguen disponibles.
- `none`: devuelve solo la línea base de identidad.

Cuando `promptMode=minimal`, los prompts inyectados adicionales se etiquetan como **Subagent
Context** en lugar de **Group Chat Context**.

## Inyección de bootstrap del espacio de trabajo

Los archivos de bootstrap se recortan y se agregan bajo **Project Context** para que el modelo vea el contexto de identidad y perfil sin necesitar lecturas explícitas:

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (solo en espacios de trabajo completamente nuevos)
- `MEMORY.md` cuando está presente

Todos estos archivos se **inyectan en la ventana de contexto** en cada turno a menos
que se aplique una restricción específica por archivo. `HEARTBEAT.md` se omite en ejecuciones normales cuando
Heartbeat está deshabilitado para el agente predeterminado o
`agents.defaults.heartbeat.includeSystemPromptSection` es false. Mantén concisos los
archivos inyectados, especialmente `MEMORY.md`, que puede crecer con el tiempo y provocar
un uso de contexto inesperadamente alto y una Compaction más frecuente.

> **Nota:** los archivos diarios `memory/*.md` **no** forman parte del bootstrap
> normal de Project Context. En turnos normales se accede a ellos bajo demanda mediante las
> herramientas `memory_search` y `memory_get`, por lo que no cuentan contra la
> ventana de contexto salvo que el modelo los lea explícitamente. Los turnos simples `/new` y
> `/reset` son la excepción: el tiempo de ejecución puede anteponer memoria diaria reciente
> como un bloque único de contexto de inicio para ese primer turno.

Los archivos grandes se truncan con un marcador. El tamaño máximo por archivo está controlado por
`agents.defaults.bootstrapMaxChars` (predeterminado: 12000). El contenido total inyectado de bootstrap
entre archivos está limitado por `agents.defaults.bootstrapTotalMaxChars`
(predeterminado: 60000). Los archivos faltantes inyectan un breve marcador de archivo faltante. Cuando ocurre truncado,
OpenClaw puede inyectar un bloque de advertencia en Project Context; contrólalo con
`agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`;
predeterminado: `once`).

Las sesiones de subagentes solo inyectan `AGENTS.md` y `TOOLS.md` (los demás archivos de bootstrap
se filtran para mantener pequeño el contexto del subagente).

Los hooks internos pueden interceptar este paso mediante `agent:bootstrap` para mutar o reemplazar
los archivos de bootstrap inyectados (por ejemplo, intercambiar `SOUL.md` por una personalidad alternativa).

Si quieres que el agente suene menos genérico, empieza con
[SOUL.md Personality Guide](/es/concepts/soul).

Para inspeccionar cuánto aporta cada archivo inyectado (sin procesar frente a inyectado, truncado, además de la sobrecarga del esquema de herramientas), usa `/context list` o `/context detail`. Consulta [Context](/es/concepts/context).

## Manejo del tiempo

El prompt del sistema incluye una sección dedicada **Current Date & Time** cuando la
zona horaria del usuario es conocida. Para mantener estable la caché del prompt, ahora solo incluye
la **zona horaria** (sin reloj dinámico ni formato de hora).

Usa `session_status` cuando el agente necesite la hora actual; la tarjeta de estado
incluye una línea de marca de tiempo. La misma herramienta puede opcionalmente establecer una anulación
de modelo por sesión (`model=default` la borra).

Configura con:

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

Consulta [Date & Time](/es/date-time) para los detalles completos del comportamiento.

## Skills

Cuando existen Skills válidas, OpenClaw inyecta una **lista compacta de Skills disponibles**
(`formatSkillsForPrompt`) que incluye la **ruta del archivo** de cada Skill. El
prompt indica al modelo que use `read` para cargar el SKILL.md en la ubicación
indicada (espacio de trabajo, gestionado o incluido). Si no hay Skills válidas,
la sección Skills se omite.

La elegibilidad incluye restricciones de metadatos de la Skill, comprobaciones de entorno/configuración del tiempo de ejecución
y la lista permitida efectiva de Skills del agente cuando `agents.defaults.skills` o
`agents.list[].skills` está configurado.

```
<available_skills>
  <skill>
    <name>...</name>
    <description>...</description>
    <location>...</location>
  </skill>
</available_skills>
```

Esto mantiene pequeño el prompt base y aun así habilita un uso dirigido de Skills.

El presupuesto de la lista de Skills pertenece al subsistema de Skills:

- Predeterminado global: `skills.limits.maxSkillsPromptChars`
- Anulación por agente: `agents.list[].skillsLimits.maxSkillsPromptChars`

Los extractos genéricos limitados del tiempo de ejecución usan una superficie distinta:

- `agents.defaults.contextLimits.*`
- `agents.list[].contextLimits.*`

Esa separación mantiene el dimensionamiento de Skills separado del dimensionamiento de lectura/inyección del tiempo de ejecución, como
`memory_get`, resultados de herramientas en vivo y actualizaciones de `AGENTS.md` posteriores a Compaction.

## Documentación

Cuando está disponible, el prompt del sistema incluye una sección **Documentation** que apunta al
directorio local de documentación de OpenClaw (ya sea `docs/` en el espacio de trabajo del repositorio o la documentación
incluida en el paquete npm) y también menciona el mirror público, el repositorio fuente, Discord de la comunidad y
ClawHub ([https://clawhub.ai](https://clawhub.ai)) para descubrir skills. El prompt indica al modelo que consulte primero la documentación local
para comportamiento, comandos, configuración o arquitectura de OpenClaw, y que ejecute
`openclaw status` por sí mismo cuando sea posible (preguntando al usuario solo cuando no tenga acceso).

## Relacionado

- [Tiempo de ejecución del agente](/es/concepts/agent)
- [Espacio de trabajo del agente](/es/concepts/agent-workspace)
- [Motor de contexto](/es/concepts/context-engine)

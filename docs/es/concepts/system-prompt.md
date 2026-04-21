---
read_when:
    - Editar el texto del prompt del sistema, la lista de herramientas o las secciones de hora/Heartbeat
    - Cambiar el comportamiento del arranque del espacio de trabajo o de la inyección de Skills
summary: Qué contiene el prompt del sistema de OpenClaw y cómo se ensambla
title: Prompt del sistema
x-i18n:
    generated_at: "2026-04-21T05:13:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: bc7b887865830e29bcbfb7f88a12fe04f490eec64cb745fc4534051b63a862dc
    source_path: concepts/system-prompt.md
    workflow: 15
---

# Prompt del sistema

OpenClaw crea un prompt del sistema personalizado para cada ejecución de agente. El prompt es **propiedad de OpenClaw** y no usa el prompt predeterminado de pi-coding-agent.

El prompt es ensamblado por OpenClaw e inyectado en cada ejecución de agente.

Los plugins de proveedor pueden aportar orientación de prompt compatible con caché sin reemplazar todo el prompt propiedad de OpenClaw. El entorno de ejecución del proveedor puede:

- reemplazar un pequeño conjunto de secciones principales con nombre (`interaction_style`,
  `tool_call_style`, `execution_bias`)
- inyectar un **prefijo estable** por encima del límite de caché del prompt
- inyectar un **sufijo dinámico** por debajo del límite de caché del prompt

Usa aportaciones propiedad del proveedor para ajustes específicos de familias de modelos. Mantén la mutación heredada del prompt `before_prompt_build` para compatibilidad o para cambios de prompt realmente globales, no para comportamiento normal del proveedor.

La superposición para la familia OpenAI GPT-5 mantiene pequeña la regla principal de ejecución y añade orientación específica del modelo para el anclaje de personalidad, salida concisa, disciplina de herramientas, búsqueda en paralelo, cobertura de entregables, verificación, contexto faltante e higiene de herramientas terminales.

## Estructura

El prompt es intencionalmente compacto y usa secciones fijas:

- **Tooling**: recordatorio de la fuente de verdad de herramientas estructuradas más orientación de uso de herramientas en tiempo de ejecución.
- **Execution Bias**: orientación compacta de continuidad: actuar en el turno ante solicitudes accionables, continuar hasta terminar o quedar bloqueado, recuperarse de resultados débiles de herramientas, comprobar en vivo el estado mutable y verificar antes de finalizar.
- **Safety**: recordatorio breve de barreras de protección para evitar comportamientos de búsqueda de poder o evasión de supervisión.
- **Skills** (cuando están disponibles): indica al modelo cómo cargar instrucciones de Skills bajo demanda.
- **OpenClaw Self-Update**: cómo inspeccionar la configuración de forma segura con `config.schema.lookup`, aplicar parches a la configuración con `config.patch`, reemplazar toda la configuración con `config.apply` y ejecutar `update.run` solo a petición explícita del usuario. La herramienta `gateway`, solo para propietarios, también rechaza reescribir `tools.exec.ask` / `tools.exec.security`, incluidas las alias heredadas `tools.bash.*` que se normalizan a esas rutas protegidas de ejecución.
- **Workspace**: directorio de trabajo (`agents.defaults.workspace`).
- **Documentation**: ruta local a la documentación de OpenClaw (repositorio o paquete npm) y cuándo leerla.
- **Workspace Files (injected)**: indica que los archivos de arranque están incluidos debajo.
- **Sandbox** (cuando está habilitado): indica el entorno de ejecución aislado, las rutas de sandbox y si la ejecución elevada está disponible.
- **Current Date & Time**: hora local del usuario, zona horaria y formato de hora.
- **Reply Tags**: sintaxis opcional de etiquetas de respuesta para proveedores compatibles.
- **Heartbeats**: prompt y comportamiento de acuse de Heartbeat, cuando Heartbeat está habilitado para el agente predeterminado.
- **Runtime**: host, SO, node, modelo, raíz del repositorio (cuando se detecta), nivel de razonamiento (una línea).
- **Reasoning**: nivel actual de visibilidad + sugerencia del conmutador `/reasoning`.

La sección Tooling también incluye orientación en tiempo de ejecución para trabajo de larga duración:

- usar Cron para seguimientos futuros (`check back later`, recordatorios, trabajo recurrente) en lugar de bucles de suspensión con `exec`, trucos de retraso con `yieldMs` o sondeos repetidos de `process`
- usar `exec` / `process` solo para comandos que comienzan ahora y siguen ejecutándose en segundo plano
- cuando la reactivación automática al completarse está habilitada, iniciar el comando una sola vez y confiar en la ruta de reactivación basada en envío cuando emita salida o falle
- usar `process` para registros, estado, entrada o intervención cuando necesites inspeccionar un comando en ejecución
- si la tarea es mayor, preferir `sessions_spawn`; la finalización del subagente se basa en envío y se anuncia automáticamente de vuelta al solicitante
- no sondear `subagents list` / `sessions_list` en un bucle solo para esperar la finalización

Cuando la herramienta experimental `update_plan` está habilitada, Tooling también indica al modelo que la use solo para trabajo no trivial de varios pasos, que mantenga exactamente un paso `in_progress` y que evite repetir el plan completo después de cada actualización.

Las barreras de protección de Safety en el prompt del sistema son orientativas. Guían el comportamiento del modelo, pero no aplican políticas. Usa política de herramientas, aprobaciones de ejecución, sandboxing y listas permitidas de canales para aplicación estricta; los operadores pueden desactivar estas medidas por diseño.

En canales con tarjetas o botones nativos de aprobación, el prompt de tiempo de ejecución ahora indica al agente que confíe primero en esa interfaz nativa de aprobación. Solo debe incluir un comando manual `/approve` cuando el resultado de la herramienta diga que las aprobaciones por chat no están disponibles o que la aprobación manual es la única vía.

## Modos de prompt

OpenClaw puede generar prompts del sistema más pequeños para subagentes. El entorno de ejecución establece un `promptMode` para cada ejecución (no es una configuración visible para el usuario):

- `full` (predeterminado): incluye todas las secciones anteriores.
- `minimal`: usado para subagentes; omite **Skills**, **Memory Recall**, **OpenClaw Self-Update**, **Model Aliases**, **User Identity**, **Reply Tags**, **Messaging**, **Silent Replies** y **Heartbeats**. **Tooling**, **Safety**, Workspace, Sandbox, Current Date & Time (cuando se conoce), Runtime y el contexto inyectado siguen disponibles.
- `none`: devuelve solo la línea base de identidad.

Cuando `promptMode=minimal`, los prompts inyectados adicionales se etiquetan como **Subagent Context** en lugar de **Group Chat Context**.

## Inyección de arranque del Workspace

Los archivos de arranque se recortan y se anexan en **Project Context** para que el modelo vea el contexto de identidad y perfil sin necesidad de lecturas explícitas:

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (solo en Workspace completamente nuevos)
- `MEMORY.md` cuando está presente; en caso contrario, `memory.md` como alternativa en minúsculas

Todos estos archivos se **inyectan en la ventana de contexto** en cada turno salvo que se aplique una condición específica del archivo. `HEARTBEAT.md` se omite en ejecuciones normales cuando Heartbeat está deshabilitado para el agente predeterminado o `agents.defaults.heartbeat.includeSystemPromptSection` es false. Mantén los archivos inyectados concisos, especialmente `MEMORY.md`, que puede crecer con el tiempo y provocar un uso del contexto inesperadamente alto y una Compaction más frecuente.

> **Nota:** los archivos diarios `memory/*.md` **no** forman parte del arranque normal de Project Context. En turnos normales se accede a ellos bajo demanda mediante las herramientas `memory_search` y `memory_get`, por lo que no cuentan contra la ventana de contexto a menos que el modelo los lea explícitamente. Los turnos simples `/new` y `/reset` son la excepción: el entorno de ejecución puede anteponer memoria diaria reciente como un bloque único de contexto de inicio para ese primer turno.

Los archivos grandes se truncan con un marcador. El tamaño máximo por archivo se controla con `agents.defaults.bootstrapMaxChars` (predeterminado: 12000). El contenido total inyectado de arranque entre archivos está limitado por `agents.defaults.bootstrapTotalMaxChars` (predeterminado: 60000). Los archivos ausentes inyectan un marcador breve de archivo ausente. Cuando ocurre truncamiento, OpenClaw puede inyectar un bloque de advertencia en Project Context; contrólalo con `agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`; predeterminado: `once`).

Las sesiones de subagentes solo inyectan `AGENTS.md` y `TOOLS.md` (los demás archivos de arranque se filtran para mantener pequeño el contexto del subagente).

Los hooks internos pueden interceptar este paso mediante `agent:bootstrap` para mutar o reemplazar los archivos de arranque inyectados (por ejemplo, sustituir `SOUL.md` por una personalidad alternativa).

Si quieres que el agente suene menos genérico, empieza con [SOUL.md Personality Guide](/es/concepts/soul).

Para inspeccionar cuánto aporta cada archivo inyectado (sin procesar frente a inyectado, truncamiento y sobrecarga del esquema de herramientas), usa `/context list` o `/context detail`. Consulta [Context](/es/concepts/context).

## Manejo de la hora

El prompt del sistema incluye una sección dedicada **Current Date & Time** cuando se conoce la zona horaria del usuario. Para mantener estable la caché del prompt, ahora solo incluye la **zona horaria** (sin reloj dinámico ni formato de hora).

Usa `session_status` cuando el agente necesite la hora actual; la tarjeta de estado incluye una línea de marca temporal. La misma herramienta también puede establecer opcionalmente una sustitución de modelo por sesión (`model=default` la borra).

Configúralo con:

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

Consulta [Date & Time](/es/date-time) para conocer el comportamiento completo.

## Skills

Cuando existen Skills aptas, OpenClaw inyecta una **lista compacta de Skills disponibles** (`formatSkillsForPrompt`) que incluye la **ruta del archivo** para cada Skill. El prompt indica al modelo que use `read` para cargar el SKILL.md en la ubicación indicada (Workspace, administrada o incluida). Si no hay Skills aptas, la sección Skills se omite.

La elegibilidad incluye condiciones de metadatos de Skills, comprobaciones del entorno/configuración de tiempo de ejecución y la lista permitida efectiva de Skills del agente cuando está configurado `agents.defaults.skills` o `agents.list[].skills`.

```
<available_skills>
  <skill>
    <name>...</name>
    <description>...</description>
    <location>...</location>
  </skill>
</available_skills>
```

Esto mantiene pequeño el prompt base y al mismo tiempo permite un uso dirigido de Skills.

El presupuesto de la lista de Skills es propiedad del subsistema de Skills:

- Predeterminado global: `skills.limits.maxSkillsPromptChars`
- Sustitución por agente: `agents.list[].skillsLimits.maxSkillsPromptChars`

Los extractos genéricos acotados de tiempo de ejecución usan una superficie distinta:

- `agents.defaults.contextLimits.*`
- `agents.list[].contextLimits.*`

Esa separación mantiene el dimensionamiento de Skills separado del dimensionamiento de lectura/inyección de tiempo de ejecución, como `memory_get`, resultados de herramientas en vivo y actualizaciones posteriores a Compaction de AGENTS.md.

## Documentation

Cuando está disponible, el prompt del sistema incluye una sección **Documentation** que apunta al directorio local de documentación de OpenClaw (ya sea `docs/` en el Workspace del repositorio o la documentación incluida en el paquete npm) y también menciona el espejo público, el repositorio fuente, la comunidad de Discord y ClawHub ([https://clawhub.ai](https://clawhub.ai)) para descubrir Skills. El prompt indica al modelo que consulte primero la documentación local para el comportamiento, los comandos, la configuración o la arquitectura de OpenClaw, y que ejecute `openclaw status` por sí mismo cuando sea posible (preguntando al usuario solo cuando no tenga acceso).

---
read_when:
    - Editar el texto del prompt del sistema, la lista de herramientas o las secciones de tiempo/Heartbeat
    - Cambiar el comportamiento de inicialización del espacio de trabajo o de inyección de Skills
summary: Qué contiene el prompt del sistema de OpenClaw y cómo se ensambla
title: Instrucción del sistema
x-i18n:
    generated_at: "2026-05-02T20:46:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 56b29c354ea4b3f48fd7279614677905b3065bc0afa6741fb4273ef229e8cebb
    source_path: concepts/system-prompt.md
    workflow: 16
---

OpenClaw crea un prompt de sistema personalizado para cada ejecución de agente. El prompt es **propiedad de OpenClaw** y no usa el prompt predeterminado de pi-coding-agent.

OpenClaw ensambla el prompt y lo inyecta en cada ejecución de agente.

Los plugins de proveedor pueden aportar orientación de prompt compatible con caché sin reemplazar
todo el prompt propiedad de OpenClaw. El runtime del proveedor puede:

- reemplazar un pequeño conjunto de secciones principales con nombre (`interaction_style`,
  `tool_call_style`, `execution_bias`)
- inyectar un **prefijo estable** por encima del límite de caché de prompt
- inyectar un **sufijo dinámico** por debajo del límite de caché de prompt

Usa contribuciones propiedad del proveedor para ajustes específicos de familias de modelos. Mantén la mutación de prompt heredada
`before_prompt_build` por compatibilidad o para cambios de prompt verdaderamente globales,
no para comportamiento normal de proveedor.

La superposición de la familia OpenAI GPT-5 mantiene pequeña la regla principal de ejecución y añade
orientación específica del modelo para fijación de persona, salida concisa, disciplina de herramientas,
búsqueda paralela, cobertura de entregables, verificación, contexto faltante e
higiene de herramientas de terminal.

## Estructura

El prompt es intencionalmente compacto y usa secciones fijas:

- **Herramientas**: recordatorio de fuente de verdad para herramientas estructuradas más orientación de uso de herramientas en runtime.
- **Sesgo de ejecución**: orientación compacta de seguimiento: actuar dentro del turno ante
  solicitudes accionables, continuar hasta terminar o quedar bloqueado, recuperarse de resultados débiles de herramientas,
  comprobar en vivo el estado mutable y verificar antes de finalizar.
- **Seguridad**: breve recordatorio de límites para evitar comportamiento de búsqueda de poder o eludir la supervisión.
- **Skills** (cuando estén disponibles): indica al modelo cómo cargar instrucciones de Skills bajo demanda.
- **Autoactualización de OpenClaw**: cómo inspeccionar la configuración de forma segura con
  `config.schema.lookup`, parchear la configuración con `config.patch`, reemplazar la configuración
  completa con `config.apply` y ejecutar `update.run` solo por solicitud explícita del usuario.
  La herramienta `gateway`, solo para el propietario, también se niega a reescribir
  `tools.exec.ask` / `tools.exec.security`, incluidos los alias heredados `tools.bash.*`
  que se normalizan a esas rutas de ejecución protegidas.
- **Espacio de trabajo**: directorio de trabajo (`agents.defaults.workspace`).
- **Documentación**: ruta local a la documentación de OpenClaw (repositorio o paquete npm) y cuándo leerla.
- **Archivos del espacio de trabajo (inyectados)**: indica que los archivos de arranque se incluyen abajo.
- **Sandbox** (cuando está habilitado): indica runtime en sandbox, rutas de sandbox y si exec elevado está disponible.
- **Fecha y hora actuales**: hora local del usuario, zona horaria y formato de hora.
- **Etiquetas de respuesta**: sintaxis opcional de etiqueta de respuesta para proveedores compatibles.
- **Heartbeats**: prompt de Heartbeat y comportamiento de ack, cuando los Heartbeats están habilitados para el agente predeterminado.
- **Runtime**: host, SO, Node, modelo, raíz del repositorio (cuando se detecta), nivel de pensamiento (una línea).
- **Razonamiento**: nivel de visibilidad actual + sugerencia del interruptor /reasoning.

OpenClaw mantiene el contenido estable grande, incluido **Contexto del proyecto**, por encima del
límite interno de caché de prompt. Las secciones volátiles de canal/sesión, como
la orientación de incrustación de Control UI, **Mensajería**, **Voz**, **Contexto de chat grupal**,
**Reacciones**, **Heartbeats** y **Runtime**, se anexan por debajo de ese límite
para que los backends locales con cachés de prefijo puedan reutilizar el prefijo estable del espacio de trabajo
entre turnos de canal. Las descripciones de herramientas también deben evitar incrustar nombres de canales actuales
cuando el esquema aceptado ya contiene ese detalle de runtime.

La sección Herramientas también incluye orientación de runtime para trabajos de larga duración:

- usar Cron para seguimientos futuros (`check back later`, recordatorios, trabajo recurrente)
  en lugar de bucles de suspensión con `exec`, trucos de demora `yieldMs` o sondeos repetidos de `process`
- usar `exec` / `process` solo para comandos que comienzan ahora y siguen ejecutándose
  en segundo plano
- cuando la activación automática al completarse está habilitada, iniciar el comando una vez y confiar en
  la ruta de activación basada en push cuando emita salida o falle
- usar `process` para logs, estado, entrada o intervención cuando necesites
  inspeccionar un comando en ejecución
- si la tarea es más grande, preferir `sessions_spawn`; la finalización de subagentes es
  basada en push y se anuncia automáticamente al solicitante
- no sondear `subagents list` / `sessions_list` en un bucle solo para esperar
  la finalización

Cuando la herramienta experimental `update_plan` está habilitada, Herramientas también indica al
modelo que la use solo para trabajo de varios pasos no trivial, mantenga exactamente un paso
`in_progress` y evite repetir todo el plan después de cada actualización.

Los límites de seguridad en el prompt de sistema son orientativos. Guían el comportamiento del modelo, pero no aplican políticas. Usa la política de herramientas, aprobaciones de exec, sandboxing y listas de canales permitidos para aplicación estricta; los operadores pueden deshabilitarlos por diseño.

En canales con tarjetas/botones de aprobación nativos, el prompt de runtime ahora indica al
agente que confíe primero en esa UI de aprobación nativa. Solo debe incluir un comando manual
`/approve` cuando el resultado de la herramienta diga que las aprobaciones por chat no están disponibles o que
la aprobación manual es la única ruta.

## Modos de prompt

OpenClaw puede renderizar prompts de sistema más pequeños para subagentes. El runtime establece un
`promptMode` para cada ejecución (no es una configuración de cara al usuario):

- `full` (predeterminado): incluye todas las secciones anteriores.
- `minimal`: usado para subagentes; omite **Skills**, **Recuperación de memoria**, **Autoactualización de OpenClaw**,
  **Alias de modelo**, **Identidad del usuario**, **Etiquetas de respuesta**,
  **Mensajería**, **Respuestas silenciosas** y **Heartbeats**. Herramientas, **Seguridad**,
  Espacio de trabajo, Sandbox, Fecha y hora actuales (cuando se conocen), Runtime y contexto
  inyectado permanecen disponibles.
- `none`: devuelve solo la línea de identidad base.

Cuando `promptMode=minimal`, los prompts inyectados adicionales se etiquetan como **Contexto de subagente**
en lugar de **Contexto de chat grupal**.

Para ejecuciones de respuesta automática de canal, OpenClaw puede omitir la sección genérica **Respuestas silenciosas**
cuando el contexto de chat directo/grupal ya incluye el comportamiento `NO_REPLY`
específico de la conversación resuelto. Esto evita repetir la mecánica de tokens
tanto en el prompt de sistema global como en el contexto de canal.

## Instantáneas de prompt

OpenClaw mantiene instantáneas de prompt de ruta feliz confirmadas para el runtime
Codex/herramienta de mensajes en `test/fixtures/agents/prompt-snapshots/happy-path/`. Renderizan
las instrucciones de desarrollador del servidor de aplicación Codex propiedad de OpenClaw, los parámetros seleccionados de
inicio/reanudación de hilo, la entrada de usuario del turno y especificaciones dinámicas de herramientas para turnos directos de Telegram,
grupales de Discord y de Heartbeat. El prompt de sistema base oculto de Codex y
las instrucciones de modo de colaboración de Codex con alcance de turno pertenecen al runtime de Codex
y OpenClaw no los renderiza.

Regénéralas con `pnpm prompt:snapshots:gen` y verifica la deriva con
`pnpm prompt:snapshots:check`.

## Inyección de arranque del espacio de trabajo

Los archivos de arranque se recortan y anexan bajo **Contexto del proyecto** para que el modelo vea el contexto de identidad y perfil sin necesitar lecturas explícitas:

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (solo en espacios de trabajo completamente nuevos)
- `MEMORY.md` cuando esté presente

Todos estos archivos se **inyectan en la ventana de contexto** en cada turno, salvo que
se aplique una puerta específica de archivo. `HEARTBEAT.md` se omite en ejecuciones normales cuando
los Heartbeats están deshabilitados para el agente predeterminado o
`agents.defaults.heartbeat.includeSystemPromptSection` es false. Mantén concisos los archivos
inyectados, especialmente `MEMORY.md`, que puede crecer con el tiempo y provocar
un uso de contexto inesperadamente alto y compactación más frecuente.

<Note>
Los archivos diarios `memory/*.md` **no** forman parte del Contexto del proyecto de arranque normal. En turnos ordinarios se accede a ellos bajo demanda mediante las herramientas `memory_search` y `memory_get`, por lo que no cuentan contra la ventana de contexto salvo que el modelo los lea explícitamente. Los turnos simples `/new` y `/reset` son la excepción: el runtime puede anteponer memoria diaria reciente como un bloque único de contexto de inicio para ese primer turno.
</Note>

Los archivos grandes se truncan con un marcador. El tamaño máximo por archivo se controla mediante
`agents.defaults.bootstrapMaxChars` (predeterminado: 12000). El contenido total de arranque inyectado
entre archivos está limitado por `agents.defaults.bootstrapTotalMaxChars`
(predeterminado: 60000). Los archivos faltantes inyectan un breve marcador de archivo faltante. Cuando ocurre truncamiento,
OpenClaw puede inyectar un bloque de advertencia en Contexto del proyecto; contrólalo con
`agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`;
predeterminado: `once`).

Las sesiones de subagente solo inyectan `AGENTS.md` y `TOOLS.md` (los demás archivos de arranque
se filtran para mantener pequeño el contexto del subagente).

Los hooks internos pueden interceptar este paso mediante `agent:bootstrap` para mutar o reemplazar
los archivos de arranque inyectados (por ejemplo, cambiar `SOUL.md` por una persona alternativa).

Si quieres que el agente suene menos genérico, empieza con
[Guía de personalidad de SOUL.md](/es/concepts/soul).

Para inspeccionar cuánto aporta cada archivo inyectado (sin procesar frente a inyectado, truncamiento, más sobrecarga del esquema de herramientas), usa `/context list` o `/context detail`. Consulta [Contexto](/es/concepts/context).

## Manejo del tiempo

El prompt de sistema incluye una sección dedicada **Fecha y hora actuales** cuando se conoce la
zona horaria del usuario. Para mantener estable el caché de prompt, ahora solo incluye
la **zona horaria** (sin reloj dinámico ni formato de hora).

Usa `session_status` cuando el agente necesite la hora actual; la tarjeta de estado
incluye una línea de marca de tiempo. La misma herramienta puede establecer opcionalmente una anulación de modelo por sesión
(`model=default` la borra).

Configura con:

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

Consulta [Fecha y hora](/es/date-time) para ver los detalles completos de comportamiento.

## Skills

Cuando existen Skills elegibles, OpenClaw inyecta una **lista compacta de Skills disponibles**
(`formatSkillsForPrompt`) que incluye la **ruta de archivo** para cada Skill. El
prompt indica al modelo que use `read` para cargar el SKILL.md en la ubicación
indicada (espacio de trabajo, gestionada o incluida). Si no hay Skills elegibles, se omite
la sección Skills.

La elegibilidad incluye puertas de metadatos de Skills, comprobaciones del entorno/configuración de runtime
y la allowlist efectiva de Skills del agente cuando `agents.defaults.skills` o
`agents.list[].skills` está configurado.

Las Skills incluidas con plugins solo son elegibles cuando su plugin propietario está habilitado.
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

Esto mantiene pequeño el prompt base y aun así permite el uso dirigido de Skills.

El presupuesto de la lista de Skills pertenece al subsistema de Skills:

- Predeterminado global: `skills.limits.maxSkillsPromptChars`
- Anulación por agente: `agents.list[].skillsLimits.maxSkillsPromptChars`

Los extractos genéricos acotados de runtime usan una superficie distinta:

- `agents.defaults.contextLimits.*`
- `agents.list[].contextLimits.*`

Esa separación mantiene el tamaño de Skills separado del tamaño de lecturas/inyecciones de runtime, como
`memory_get`, resultados de herramientas en vivo y actualizaciones de AGENTS.md después de Compaction.

## Documentación

El prompt de sistema incluye una sección **Documentación**. Cuando la documentación local está disponible,
apunta al directorio local de documentación de OpenClaw (`docs/` en un checkout de Git o la documentación incluida del
paquete npm). Si la documentación local no está disponible, recurre a
[https://docs.openclaw.ai](https://docs.openclaw.ai).

La misma sección también incluye la ubicación del código fuente de OpenClaw. Los checkouts de Git exponen la raíz
local del código fuente para que el agente pueda inspeccionar el código directamente. Las instalaciones de paquete incluyen la URL
del código fuente en GitHub e indican al agente que revise el código fuente allí cuando la documentación esté incompleta o
desactualizada. El prompt también menciona el espejo público de documentación, la comunidad de Discord y ClawHub
([https://clawhub.ai](https://clawhub.ai)) para descubrir Skills. Indica al modelo que
consulte primero la documentación para comportamiento, comandos, configuración o arquitectura de OpenClaw, y que
ejecute `openclaw status` por sí mismo cuando sea posible (preguntando al usuario solo cuando no tenga acceso).
Para la configuración específicamente, dirige a los agentes a la acción de la herramienta `gateway`
`config.schema.lookup` para obtener documentación y restricciones exactas a nivel de campo, y luego a
`docs/gateway/configuration.md` y `docs/gateway/configuration-reference.md`
para orientación más amplia.

## Relacionado

- [Entorno de ejecución del agente](/es/concepts/agent)
- [Espacio de trabajo del agente](/es/concepts/agent-workspace)
- [Motor de contexto](/es/concepts/context-engine)

---
read_when:
    - Edición del texto del prompt del sistema, la lista de herramientas o las secciones de tiempo/Heartbeat
    - Cambiar el comportamiento de arranque del espacio de trabajo o de inyección de Skills
summary: Qué contiene el prompt del sistema de OpenClaw y cómo se ensambla
title: Prompt del sistema
x-i18n:
    generated_at: "2026-04-30T05:39:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8c6258ad35d679eaa2bb4d2446e9edfc6bb129888681a0e5d5527c54c5476971
    source_path: concepts/system-prompt.md
    workflow: 16
---

OpenClaw crea un prompt de sistema personalizado para cada ejecución de agente. El prompt es **propiedad de OpenClaw** y no usa el prompt predeterminado de pi-coding-agent.

El prompt lo ensambla OpenClaw y se inyecta en cada ejecución de agente.

Los plugins de proveedor pueden aportar orientación de prompt consciente de la caché sin reemplazar
todo el prompt propiedad de OpenClaw. El runtime del proveedor puede:

- reemplazar un pequeño conjunto de secciones centrales con nombre (`interaction_style`,
  `tool_call_style`, `execution_bias`)
- inyectar un **prefijo estable** por encima del límite de la caché de prompt
- inyectar un **sufijo dinámico** por debajo del límite de la caché de prompt

Usa contribuciones propiedad del proveedor para ajustes específicos de familias de modelos. Mantén la mutación de prompt heredada
`before_prompt_build` por compatibilidad o para cambios de prompt realmente globales,
no para el comportamiento normal del proveedor.

La capa superpuesta de la familia OpenAI GPT-5 mantiene pequeña la regla central de ejecución y agrega
orientación específica del modelo para fijación de personalidad, salida concisa, disciplina de herramientas,
búsqueda paralela, cobertura de entregables, verificación, contexto faltante e
higiene de herramientas de terminal.

## Estructura

El prompt es deliberadamente compacto y usa secciones fijas:

- **Herramientas**: recordatorio de fuente de verdad de herramientas estructuradas más orientación de uso de herramientas en runtime.
- **Sesgo de ejecución**: orientación compacta de seguimiento: actuar durante el turno ante
  solicitudes accionables, continuar hasta terminar o quedar bloqueado, recuperarse de resultados débiles de herramientas,
  comprobar en vivo el estado mutable y verificar antes de finalizar.
- **Seguridad**: breve recordatorio de barreras para evitar comportamientos de búsqueda de poder o eludir la supervisión.
- **Skills** (cuando están disponibles): indica al modelo cómo cargar instrucciones de Skills bajo demanda.
- **Autoactualización de OpenClaw**: cómo inspeccionar la configuración de forma segura con
  `config.schema.lookup`, parchear la configuración con `config.patch`, reemplazar la configuración completa
  con `config.apply` y ejecutar `update.run` solo ante una solicitud explícita del usuario.
  La herramienta `gateway`, solo para propietarios, también se niega a reescribir
  `tools.exec.ask` / `tools.exec.security`, incluidos los alias heredados `tools.bash.*`
  que se normalizan a esas rutas exec protegidas.
- **Espacio de trabajo**: directorio de trabajo (`agents.defaults.workspace`).
- **Documentación**: ruta local a la documentación de OpenClaw (repositorio o paquete npm) y cuándo leerla.
- **Archivos del espacio de trabajo (inyectados)**: indica que los archivos de arranque se incluyen abajo.
- **Sandbox** (cuando está habilitado): indica runtime en sandbox, rutas de sandbox y si está disponible exec elevado.
- **Fecha y hora actuales**: hora local del usuario, zona horaria y formato de hora.
- **Etiquetas de respuesta**: sintaxis opcional de etiquetas de respuesta para proveedores compatibles.
- **Heartbeats**: prompt de Heartbeat y comportamiento de confirmación, cuando los Heartbeats están habilitados para el agente predeterminado.
- **Runtime**: host, sistema operativo, Node, modelo, raíz del repositorio (cuando se detecta), nivel de pensamiento (una línea).
- **Razonamiento**: nivel de visibilidad actual + sugerencia del conmutador /reasoning.

OpenClaw mantiene contenido estable grande, incluido **Contexto del proyecto**, por encima del
límite interno de la caché de prompt. Las secciones volátiles de canal/sesión como
orientación incrustada de Control UI, **Mensajería**, **Voz**, **Contexto de chat grupal**,
**Reacciones**, **Heartbeats** y **Runtime** se agregan por debajo de ese límite
para que los backends locales con cachés de prefijo puedan reutilizar el prefijo estable del espacio de trabajo
entre turnos de canal. Las descripciones de herramientas también deben evitar incrustar nombres de canales actuales
cuando el esquema aceptado ya contiene ese detalle de runtime.

La sección Herramientas también incluye orientación de runtime para trabajos de larga duración:

- usar Cron para seguimientos futuros (`check back later`, recordatorios, trabajo recurrente)
  en lugar de bucles de suspensión de `exec`, trucos de demora `yieldMs` o sondeo repetido de `process`
- usar `exec` / `process` solo para comandos que comienzan ahora y continúan ejecutándose
  en segundo plano
- cuando la activación automática al completarse está habilitada, iniciar el comando una vez y confiar en
  la ruta de activación basada en push cuando emita salida o falle
- usar `process` para registros, estado, entrada o intervención cuando necesites
  inspeccionar un comando en ejecución
- si la tarea es más grande, preferir `sessions_spawn`; la finalización del subagente está
  basada en push y se anuncia automáticamente al solicitante
- no sondear `subagents list` / `sessions_list` en un bucle solo para esperar la
  finalización

Cuando la herramienta experimental `update_plan` está habilitada, Herramientas también indica al
modelo que la use solo para trabajo no trivial de varios pasos, que mantenga exactamente un paso
`in_progress` y que evite repetir todo el plan después de cada actualización.

Las barreras de seguridad en el prompt de sistema son orientativas. Guían el comportamiento del modelo, pero no aplican políticas. Usa políticas de herramientas, aprobaciones de exec, sandboxing y listas de permitidos por canal para aplicación estricta; los operadores pueden deshabilitarlas por diseño.

En canales con tarjetas/botones de aprobación nativos, el prompt de runtime ahora indica al
agente que confíe primero en esa interfaz de aprobación nativa. Solo debe incluir un comando manual
`/approve` cuando el resultado de la herramienta diga que las aprobaciones por chat no están disponibles o que
la aprobación manual es la única vía.

## Modos de prompt

OpenClaw puede renderizar prompts de sistema más pequeños para subagentes. El runtime establece un
`promptMode` para cada ejecución (no es una configuración visible para el usuario):

- `full` (predeterminado): incluye todas las secciones anteriores.
- `minimal`: se usa para subagentes; omite **Skills**, **Recuperación de memoria**, **Autoactualización de OpenClaw**,
  **Alias de modelos**, **Identidad del usuario**, **Etiquetas de respuesta**,
  **Mensajería**, **Respuestas silenciosas** y **Heartbeats**. Herramientas, **Seguridad**,
  Espacio de trabajo, Sandbox, Fecha y hora actuales (cuando se conocen), Runtime y contexto
  inyectado siguen disponibles.
- `none`: devuelve solo la línea de identidad base.

Cuando `promptMode=minimal`, los prompts inyectados adicionales se etiquetan como **Contexto de subagente**
en lugar de **Contexto de chat grupal**.

Para ejecuciones de autorespuesta de canal, OpenClaw puede omitir la sección genérica **Respuestas silenciosas**
cuando el contexto de chat directo/grupal ya incluye el comportamiento `NO_REPLY`
específico de la conversación resuelta. Esto evita repetir mecánicas de tokens
tanto en el prompt de sistema global como en el contexto del canal.

## Inyección de arranque del espacio de trabajo

Los archivos de arranque se recortan y se agregan bajo **Contexto del proyecto** para que el modelo vea el contexto de identidad y perfil sin necesitar lecturas explícitas:

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (solo en espacios de trabajo completamente nuevos)
- `MEMORY.md` cuando existe

Todos estos archivos se **inyectan en la ventana de contexto** en cada turno, salvo que
se aplique una puerta específica de archivo. `HEARTBEAT.md` se omite en ejecuciones normales cuando
los Heartbeats están deshabilitados para el agente predeterminado o
`agents.defaults.heartbeat.includeSystemPromptSection` es false. Mantén los archivos inyectados
concisos, especialmente `MEMORY.md`, que puede crecer con el tiempo y provocar
un uso de contexto inesperadamente alto y una Compaction más frecuente.

<Note>
Los archivos diarios `memory/*.md` **no** forman parte del Contexto del proyecto de arranque normal. En turnos ordinarios se accede a ellos bajo demanda mediante las herramientas `memory_search` y `memory_get`, por lo que no cuentan contra la ventana de contexto salvo que el modelo los lea explícitamente. Los turnos `/new` y `/reset` sin más son la excepción: el runtime puede anteponer memoria diaria reciente como bloque único de contexto de inicio para ese primer turno.
</Note>

Los archivos grandes se truncan con un marcador. El tamaño máximo por archivo se controla con
`agents.defaults.bootstrapMaxChars` (predeterminado: 12000). El contenido total de arranque inyectado
entre archivos está limitado por `agents.defaults.bootstrapTotalMaxChars`
(predeterminado: 60000). Los archivos faltantes inyectan un breve marcador de archivo faltante. Cuando se produce truncamiento,
OpenClaw puede inyectar un bloque de advertencia en Contexto del proyecto; controla esto con
`agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`;
predeterminado: `once`).

Las sesiones de subagente solo inyectan `AGENTS.md` y `TOOLS.md` (otros archivos de arranque
se filtran para mantener pequeño el contexto del subagente).

Los hooks internos pueden interceptar este paso mediante `agent:bootstrap` para mutar o reemplazar
los archivos de arranque inyectados (por ejemplo, cambiar `SOUL.md` por una personalidad alternativa).

Si quieres que el agente suene menos genérico, empieza por
[Guía de personalidad de SOUL.md](/es/concepts/soul).

Para inspeccionar cuánto aporta cada archivo inyectado (sin procesar frente a inyectado, truncamiento, más sobrecarga de esquema de herramientas), usa `/context list` o `/context detail`. Consulta [Contexto](/es/concepts/context).

## Manejo del tiempo

El prompt de sistema incluye una sección dedicada **Fecha y hora actuales** cuando se conoce la
zona horaria del usuario. Para mantener estable la caché de prompt, ahora solo incluye
la **zona horaria** (sin reloj dinámico ni formato de hora).

Usa `session_status` cuando el agente necesite la hora actual; la tarjeta de estado
incluye una línea de marca temporal. La misma herramienta puede establecer opcionalmente una anulación de modelo por sesión
(`model=default` la borra).

Configura con:

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

Consulta [Fecha y hora](/es/date-time) para ver todos los detalles de comportamiento.

## Skills

Cuando existen Skills elegibles, OpenClaw inyecta una **lista de Skills disponibles** compacta
(`formatSkillsForPrompt`) que incluye la **ruta de archivo** de cada Skill. El
prompt indica al modelo que use `read` para cargar el SKILL.md en la ubicación
indicada (espacio de trabajo, administrada o incluida). Si no hay Skills elegibles, se omite la
sección Skills.

La elegibilidad incluye puertas de metadatos de Skills, comprobaciones de entorno/configuración de runtime
y la lista efectiva de Skills permitidas para el agente cuando `agents.defaults.skills` o
`agents.list[].skills` está configurado.

Las Skills incluidas en plugins solo son elegibles cuando su plugin propietario está habilitado.
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

Esto mantiene pequeño el prompt base y, aun así, permite el uso dirigido de Skills.

El presupuesto de la lista de Skills pertenece al subsistema de Skills:

- Valor predeterminado global: `skills.limits.maxSkillsPromptChars`
- Anulación por agente: `agents.list[].skillsLimits.maxSkillsPromptChars`

Los extractos genéricos acotados de runtime usan una superficie distinta:

- `agents.defaults.contextLimits.*`
- `agents.list[].contextLimits.*`

Esa separación mantiene el dimensionamiento de Skills separado del dimensionamiento de lecturas/inyecciones de runtime, como
`memory_get`, resultados de herramientas en vivo y actualizaciones de AGENTS.md posteriores a la Compaction.

## Documentación

El prompt de sistema incluye una sección **Documentación**. Cuando hay documentación local disponible,
apunta al directorio local de documentación de OpenClaw (`docs/` en un checkout de Git o la documentación del paquete npm
incluido). Si la documentación local no está disponible, recurre a
[https://docs.openclaw.ai](https://docs.openclaw.ai).

La misma sección también incluye la ubicación del código fuente de OpenClaw. Los checkouts de Git exponen la raíz local
del código fuente para que el agente pueda inspeccionar el código directamente. Las instalaciones de paquete incluyen la URL
del código fuente en GitHub e indican al agente que revise el código fuente allí siempre que la documentación esté incompleta o
desactualizada. El prompt también menciona el espejo público de la documentación, el Discord de la comunidad y ClawHub
([https://clawhub.ai](https://clawhub.ai)) para el descubrimiento de Skills. Indica al modelo que
consulte primero la documentación para comportamientos, comandos, configuración o arquitectura de OpenClaw, y que
ejecute `openclaw status` por sí mismo cuando sea posible (preguntando al usuario solo cuando carezca de acceso).
Para la configuración específicamente, dirige a los agentes a la acción de herramienta `gateway`
`config.schema.lookup` para documentación y restricciones exactas a nivel de campo, y luego a
`docs/gateway/configuration.md` y `docs/gateway/configuration-reference.md`
para orientación más amplia.

## Relacionado

- [Runtime del agente](/es/concepts/agent)
- [Espacio de trabajo del agente](/es/concepts/agent-workspace)
- [Motor de contexto](/es/concepts/context-engine)

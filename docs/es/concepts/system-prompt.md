---
read_when:
    - Editar el texto del mensaje del sistema, la lista de herramientas o las secciones de tiempo/Heartbeat
    - Cambiar el comportamiento de arranque del espacio de trabajo o de inyección de Skills
summary: Qué contienen las instrucciones del sistema de OpenClaw y cómo se ensamblan
title: Mensaje del sistema
x-i18n:
    generated_at: "2026-05-06T05:32:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 73c20ed6a181c0a791147d67008ebdd6f8b8651ea4c43a7797931a682694bf96
    source_path: concepts/system-prompt.md
    workflow: 16
---

OpenClaw crea un prompt del sistema personalizado para cada ejecución de agente. El prompt es **propiedad de OpenClaw** y no usa el prompt predeterminado de pi-coding-agent.

OpenClaw ensambla el prompt y lo inyecta en cada ejecución de agente.

Los plugins de proveedor pueden aportar orientación de prompt compatible con caché sin reemplazar
el prompt completo propiedad de OpenClaw. El runtime del proveedor puede:

- reemplazar un conjunto pequeño de secciones principales con nombre (`interaction_style`,
  `tool_call_style`, `execution_bias`)
- inyectar un **prefijo estable** por encima del límite de caché del prompt
- inyectar un **sufijo dinámico** por debajo del límite de caché del prompt

Usa contribuciones propiedad del proveedor para ajustes específicos de familias de modelos. Conserva la
mutación de prompt heredada `before_prompt_build` por compatibilidad o para cambios de prompt
verdaderamente globales, no para el comportamiento normal del proveedor.

La superposición de la familia OpenAI GPT-5 mantiene pequeña la regla central de ejecución y agrega
orientación específica del modelo para fijación de persona, salida concisa, disciplina de herramientas,
búsqueda paralela, cobertura de entregables, verificación, contexto faltante e
higiene de herramientas de terminal.

## Estructura

El prompt es intencionalmente compacto y usa secciones fijas:

- **Herramientas**: recordatorio de fuente de verdad para herramientas estructuradas más orientación de uso de herramientas en runtime.
- **Sesgo de ejecución**: orientación compacta de seguimiento: actuar durante el turno ante
  solicitudes accionables, continuar hasta terminar o quedar bloqueado, recuperarse de resultados débiles de herramientas,
  comprobar en vivo el estado mutable y verificar antes de finalizar.
- **Seguridad**: recordatorio breve de barreras para evitar conductas de búsqueda de poder o eludir la supervisión.
- **Skills** (cuando estén disponibles): indica al modelo cómo cargar instrucciones de Skills bajo demanda.
- **Autoactualización de OpenClaw**: cómo inspeccionar la configuración de forma segura con
  `config.schema.lookup`, parchear la configuración con `config.patch`, reemplazar la configuración
  completa con `config.apply` y ejecutar `update.run` solo ante una solicitud explícita del usuario.
  La herramienta `gateway`, solo para el propietario, también rechaza reescribir
  `tools.exec.ask` / `tools.exec.security`, incluidos los alias heredados `tools.bash.*`
  que se normalizan a esas rutas exec protegidas.
- **Espacio de trabajo**: directorio de trabajo (`agents.defaults.workspace`).
- **Documentación**: ruta local a la documentación de OpenClaw (repositorio o paquete npm) y cuándo leerla.
- **Archivos del espacio de trabajo (inyectados)**: indica que los archivos de arranque se incluyen a continuación.
- **Sandbox** (cuando está habilitado): indica runtime aislado, rutas de sandbox y si exec con privilegios elevados está disponible.
- **Fecha y hora actuales**: solo zona horaria (estable para caché; el reloj en vivo proviene de `session_status`).
- **Etiquetas de respuesta**: sintaxis opcional de etiquetas de respuesta para proveedores compatibles.
- **Heartbeats**: prompt de Heartbeat y comportamiento de ack, cuando los Heartbeats están habilitados para el agente predeterminado.
- **Runtime**: host, SO, node, modelo, raíz del repositorio (cuando se detecte), nivel de pensamiento (una línea).
- **Razonamiento**: nivel de visibilidad actual + pista del interruptor /reasoning.

OpenClaw mantiene el contenido estable grande, incluido **Contexto del proyecto**, por encima del
límite interno de caché del prompt. Las secciones volátiles de canal/sesión, como
orientación de incrustación de Control UI, **Mensajería**, **Voz**, **Contexto de chat grupal**,
**Reacciones**, **Heartbeats** y **Runtime**, se anexan por debajo de ese límite
para que los backends locales con cachés de prefijo puedan reutilizar el prefijo estable del espacio de trabajo
entre turnos de canal. Las descripciones de herramientas también deberían evitar incrustar nombres
de canales actuales cuando el esquema aceptado ya contiene ese detalle de runtime.

La sección Herramientas también incluye orientación de runtime para trabajos de larga duración:

- usar Cron para seguimiento futuro (`check back later`, recordatorios, trabajo recurrente)
  en lugar de bucles de espera con `exec`, trucos de demora `yieldMs` o sondeos repetidos de `process`
- usar `exec` / `process` solo para comandos que comienzan ahora y siguen ejecutándose
  en segundo plano
- cuando el despertar automático al completarse esté habilitado, iniciar el comando una vez y confiar en
  la ruta de despertar basada en push cuando emita salida o falle
- usar `process` para registros, estado, entrada o intervención cuando necesites
  inspeccionar un comando en ejecución
- si la tarea es más grande, preferir `sessions_spawn`; la finalización del subagente está
  basada en push y se autoanuncia al solicitante
- no sondear `subagents list` / `sessions_list` en un bucle solo para esperar la
  finalización

Cuando la herramienta experimental `update_plan` está habilitada, Herramientas también indica al
modelo que la use solo para trabajo no trivial de varios pasos, mantenga exactamente un paso
`in_progress` y evite repetir todo el plan después de cada actualización.

Las barreras de seguridad del prompt del sistema son orientativas. Guían el comportamiento del modelo pero no aplican políticas. Usa políticas de herramientas, aprobaciones de exec, sandboxing y listas de permitidos por canal para aplicación estricta; los operadores pueden deshabilitarlas por diseño.

En canales con tarjetas/botones de aprobación nativos, el prompt de runtime ahora indica al
agente que confíe primero en esa UI de aprobación nativa. Solo debe incluir un comando manual
`/approve` cuando el resultado de la herramienta diga que las aprobaciones por chat no están disponibles o que
la aprobación manual es la única ruta.

## Modos de prompt

OpenClaw puede renderizar prompts del sistema más pequeños para subagentes. El runtime establece un
`promptMode` para cada ejecución (no es una configuración orientada al usuario):

- `full` (predeterminado): incluye todas las secciones anteriores.
- `minimal`: usado para subagentes; omite **Skills**, **Recuperación de memoria**, **Autoactualización de OpenClaw**,
  **Alias de modelo**, **Identidad del usuario**, **Etiquetas de respuesta**,
  **Mensajería**, **Respuestas silenciosas** y **Heartbeats**. Herramientas, **Seguridad**,
  Espacio de trabajo, Sandbox, Fecha y hora actuales (cuando se conozcan), Runtime y contexto
  inyectado permanecen disponibles.
- `none`: devuelve solo la línea de identidad base.

Cuando `promptMode=minimal`, los prompts inyectados adicionales se etiquetan como **Contexto de subagente**
en lugar de **Contexto de chat grupal**.

Para ejecuciones de respuesta automática de canal, OpenClaw puede omitir la sección genérica **Respuestas silenciosas**
cuando el contexto de chat directo/grupal ya incluye el comportamiento `NO_REPLY`
resuelto y específico de la conversación. Esto evita repetir la mecánica de tokens
tanto en el prompt global del sistema como en el contexto del canal.

## Instantáneas de prompts

OpenClaw mantiene instantáneas de prompt confirmadas para la ruta feliz del runtime de Codex bajo
`test/fixtures/agents/prompt-snapshots/codex-runtime-happy-path/`. Renderizan
parámetros seleccionados de hilo/turno del servidor de la aplicación más una pila reconstruida de capas de prompt
vinculadas al modelo para turnos directos de Telegram, grupales de Discord y de Heartbeat. Esa pila
incluye un fixture fijado del prompt de modelo Codex `gpt-5.5`, generado a partir de la forma
del catálogo/caché de modelos de Codex, el texto de desarrollador de permisos de ruta feliz de Codex,
instrucciones de desarrollador de OpenClaw, instrucciones de modo de colaboración acotadas al turno
cuando OpenClaw las proporciona, entrada del turno del usuario y referencias a las especificaciones dinámicas de herramientas.

Actualiza el fixture fijado del prompt de modelo Codex con
`pnpm prompt:snapshots:sync-codex-model`. De forma predeterminada, el script busca
la caché de runtime de Codex en `$CODEX_HOME/models_cache.json`, luego
`~/.codex/models_cache.json` y solo entonces recurre a la convención del checkout de Codex
del mantenedor en `~/code/codex/codex-rs/models-manager/models.json`. Si
ninguna de esas fuentes existe, el comando sale sin cambiar el fixture confirmado.
Pasa `--catalog <path>` para actualizar desde un archivo específico `models_cache.json`
o `models.json`.

Estas instantáneas todavía no son una captura sin procesar byte a byte de una solicitud de OpenAI. Codex
puede agregar contexto de espacio de trabajo propiedad del runtime, como `AGENTS.md`, contexto de entorno,
memorias, instrucciones de app/plugin e instrucciones integradas del modo de colaboración
Default dentro del runtime de Codex después de que OpenClaw envía los parámetros de hilo y turno.

Regenerarlas con `pnpm prompt:snapshots:gen` y verificar la deriva con
`pnpm prompt:snapshots:check`. CI ejecuta la comprobación de deriva en el shard de límite
adicional para que los cambios de prompt y las actualizaciones de instantáneas permanezcan vinculados al mismo
PR.

## Inyección de arranque del espacio de trabajo

Los archivos de arranque se recortan y se anexan bajo **Contexto del proyecto** para que el modelo vea contexto de identidad y perfil sin necesitar lecturas explícitas:

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (solo en espacios de trabajo completamente nuevos)
- `MEMORY.md` cuando esté presente

Todos estos archivos se **inyectan en la ventana de contexto** en cada turno, salvo que
aplique una compuerta específica del archivo. `HEARTBEAT.md` se omite en ejecuciones normales cuando
los Heartbeats están deshabilitados para el agente predeterminado o
`agents.defaults.heartbeat.includeSystemPromptSection` es false. Mantén los archivos inyectados
concisos, especialmente `MEMORY.md`, que puede crecer con el tiempo y provocar
uso de contexto inesperadamente alto y Compaction más frecuente.

Cuando una sesión se ejecuta en el arnés nativo de Codex, Codex carga `AGENTS.md`
mediante su propio descubrimiento de documentación de proyecto. OpenClaw aún resuelve los demás
archivos de arranque y los reenvía como instrucciones de configuración de Codex, de modo que `SOUL.md`,
`TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` y
`MEMORY.md` mantienen el mismo rol de contexto del espacio de trabajo sin duplicar
`AGENTS.md`.

<Note>
Los archivos diarios `memory/*.md` **no** forman parte del Contexto del proyecto de arranque normal. En turnos ordinarios se accede a ellos bajo demanda mediante las herramientas `memory_search` y `memory_get`, por lo que no cuentan contra la ventana de contexto salvo que el modelo los lea explícitamente. Los turnos simples `/new` y `/reset` son la excepción: el runtime puede anteponer memoria diaria reciente como un bloque único de contexto de inicio para ese primer turno.
</Note>

Los archivos grandes se truncan con un marcador. El tamaño máximo por archivo se controla mediante
`agents.defaults.bootstrapMaxChars` (predeterminado: 12000). El contenido total de arranque inyectado
entre archivos está limitado por `agents.defaults.bootstrapTotalMaxChars`
(predeterminado: 60000). Los archivos faltantes inyectan un marcador breve de archivo faltante. Cuando ocurre truncamiento,
OpenClaw puede inyectar un aviso conciso de advertencia en el prompt del sistema; contrólalo con
`agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`;
predeterminado: `once`). Los recuentos detallados sin procesar/inyectados permanecen en diagnósticos como
`/context`, `/status`, doctor y registros.

Las sesiones de subagente solo inyectan `AGENTS.md` y `TOOLS.md` (otros archivos de arranque
se filtran para mantener pequeño el contexto del subagente).

Los hooks internos pueden interceptar este paso mediante `agent:bootstrap` para mutar o reemplazar
los archivos de arranque inyectados (por ejemplo, cambiar `SOUL.md` por una persona alternativa).

Si quieres que el agente suene menos genérico, empieza con
[Guía de personalidad de SOUL.md](/es/concepts/soul).

Para inspeccionar cuánto aporta cada archivo inyectado (sin procesar frente a inyectado, truncamiento, más sobrecarga del esquema de herramientas), usa `/context list` o `/context detail`. Consulta [Contexto](/es/concepts/context).

## Manejo del tiempo

El prompt del sistema incluye una sección dedicada **Fecha y hora actuales** cuando se conoce la
zona horaria del usuario. Para mantener estable la caché del prompt, ahora solo incluye
la **zona horaria** (sin reloj dinámico ni formato de hora).

Usa `session_status` cuando el agente necesite la hora actual; la tarjeta de estado
incluye una línea de marca de tiempo. La misma herramienta puede establecer opcionalmente una anulación de modelo por sesión
(`model=default` la borra).

Configurar con:

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

Consulta [Fecha y hora](/es/date-time) para ver detalles completos del comportamiento.

## Skills

Cuando existen Skills elegibles, OpenClaw inyecta una **lista compacta de Skills disponibles**
(`formatSkillsForPrompt`) que incluye la **ruta de archivo** de cada Skill. El
prompt indica al modelo que use `read` para cargar el SKILL.md en la ubicación indicada
(espacio de trabajo, administrada o incluida). Si no hay Skills elegibles, se omite la
sección Skills.

La elegibilidad incluye compuertas de metadatos de Skill, comprobaciones de entorno/configuración de runtime
y la lista efectiva de Skills permitidas del agente cuando `agents.defaults.skills` o
`agents.list[].skills` está configurado.

Las Skills incluidas en plugins son elegibles solo cuando su plugin propietario está habilitado.
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

Esto mantiene pequeño el prompt base y, al mismo tiempo, permite el uso dirigido de Skills.

El presupuesto de la lista de Skills es responsabilidad del subsistema de Skills:

- Valor predeterminado global: `skills.limits.maxSkillsPromptChars`
- Anulación por agente: `agents.list[].skillsLimits.maxSkillsPromptChars`

Los extractos genéricos acotados en tiempo de ejecución usan una superficie diferente:

- `agents.defaults.contextLimits.*`
- `agents.list[].contextLimits.*`

Esa separación mantiene el dimensionamiento de Skills separado del dimensionamiento de lectura/inyección en tiempo de ejecución, como `memory_get`, resultados de herramientas en vivo y actualizaciones de AGENTS.md posteriores a Compaction.

## Documentación

El prompt del sistema incluye una sección **Documentación**. Cuando la documentación local está disponible, apunta al directorio local de documentación de OpenClaw (`docs/` en un checkout de Git o la documentación incluida en el paquete npm). Si la documentación local no está disponible, recurre a [https://docs.openclaw.ai](https://docs.openclaw.ai).

La misma sección también incluye la ubicación del código fuente de OpenClaw. Los checkouts de Git exponen la raíz local del código fuente para que el agente pueda inspeccionar el código directamente. Las instalaciones de paquetes incluyen la URL del código fuente en GitHub e indican al agente que revise allí el código fuente cuando la documentación esté incompleta u obsoleta. El prompt también menciona el espejo público de la documentación, el Discord de la comunidad y ClawHub ([https://clawhub.ai](https://clawhub.ai)) para descubrir Skills. Indica al modelo que consulte primero la documentación para comportamiento, comandos, configuración o arquitectura de OpenClaw, y que ejecute `openclaw status` por sí mismo cuando sea posible (preguntando al usuario solo cuando no tenga acceso). Para la configuración en concreto, dirige a los agentes a la acción de herramienta `gateway` `config.schema.lookup` para obtener documentación y restricciones exactas a nivel de campo, y luego a `docs/gateway/configuration.md` y `docs/gateway/configuration-reference.md` para orientación más amplia.

## Relacionado

- [Runtime del agente](/es/concepts/agent)
- [Espacio de trabajo del agente](/es/concepts/agent-workspace)
- [Motor de contexto](/es/concepts/context-engine)

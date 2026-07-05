---
read_when:
    - Editar el texto del prompt del sistema, la lista de herramientas o las secciones de tiempo/Heartbeat
    - Cambiar el comportamiento del arranque del espacio de trabajo o de la inyección de Skills
summary: Qué contiene el prompt del sistema de OpenClaw y cómo se ensambla
title: Prompt del sistema
x-i18n:
    generated_at: "2026-07-05T11:17:00Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1aabd41b5d4b51ed139d47b506017322c240bb1002bae901886d5f7991c0dc5e
    source_path: concepts/system-prompt.md
    workflow: 16
---

OpenClaw construye su propio prompt de sistema para cada ejecución de agente; no hay un prompt predeterminado en tiempo de ejecución.

El ensamblaje tiene tres capas:

- `buildAgentSystemPrompt` renderiza el prompt a partir de entradas explícitas. Sigue siendo un renderizador puro y no lee directamente la configuración global.
- `resolveAgentSystemPromptConfig` resuelve los controles del prompt respaldados por configuración (nombre mostrado del propietario, pistas de TTS, alias de modelo, modo de cita de memoria, modo de delegación de subagentes) para un agente específico.
- Los adaptadores de tiempo de ejecución (integrado, CLI, vistas previas de comando/exportación, Compaction) recopilan hechos en vivo (herramientas, estado del sandbox, capacidades del canal, archivos de contexto, contribuciones al prompt del proveedor) y llaman a la fachada de prompt configurada.

Esto mantiene las superficies de prompt exportadas/de depuración alineadas con las ejecuciones en vivo sin convertir cada detalle de tiempo de ejecución en un único constructor monolítico.

Los plugins de proveedor pueden aportar orientación sensible a caché sin reemplazar el prompt propiedad de OpenClaw. Un tiempo de ejecución de proveedor puede:

- reemplazar una de tres secciones principales con nombre: `interaction_style`, `tool_call_style`, `execution_bias`
- inyectar un **prefijo estable** por encima del límite de caché del prompt
- inyectar un **sufijo dinámico** por debajo del límite de caché del prompt

Usa contribuciones propiedad del proveedor para ajustes específicos de familias de modelos. Reserva el hook heredado `before_prompt_build` para compatibilidad o cambios de prompt verdaderamente globales.

La superposición incluida para OpenAI/Codex de la familia GPT-5 (`resolveGpt5SystemPromptContribution`) usa este mecanismo: un contrato de comportamiento `stablePrefix` (política de ejecución, disciplina de herramientas, contrato de salida, contrato de finalización) más una anulación opcional de `interaction_style` para un tono más cercano. Se aplica a cualquier id de modelo `gpt-5*` enrutado a través de los plugins OpenAI o Codex, controlado por `agents.defaults.promptOverlays.gpt5.personality` (`"friendly"`/`"on"` u `"off"`).

## Estructura

El prompt es compacto, con secciones fijas:

- **Herramientas**: recordatorio de fuente de verdad de herramientas estructuradas más guía de uso de herramientas en tiempo de ejecución. Cuando la herramienta experimental `update_plan` está habilitada (`tools.experimental.planTool`), su propia descripción de herramienta añade: úsala solo para trabajo no trivial de varios pasos, mantén como máximo un paso `in_progress` y omítela para trabajo simple de un solo paso.
- **Sesgo de ejecución**: actuar dentro del turno ante solicitudes accionables, continuar hasta terminar o quedar bloqueado, recuperarse de resultados débiles de herramientas, comprobar en vivo el estado mutable y verificar antes de finalizar.
- **Seguridad**: breve recordatorio de barreras contra comportamientos de búsqueda de poder o elusión de supervisión.
- **Skills** (cuando estén disponibles): indica al modelo cómo cargar instrucciones de skill bajo demanda.
- **Control de OpenClaw**: preferir la herramienta `gateway` para trabajos de configuración/reinicio; no inventar comandos CLI.
- **Autoactualización de OpenClaw**: inspeccionar la configuración de forma segura con `config.schema.lookup`, aplicar parches con `config.patch`, reemplazar la configuración completa con `config.apply` y ejecutar `update.run` solo a petición explícita del usuario. La herramienta `gateway` orientada al agente se niega a reescribir `tools.exec.ask` / `tools.exec.security`, incluidos los alias heredados `tools.bash.*` que se normalizan a esas rutas protegidas.
- **Espacio de trabajo**: directorio de trabajo (`agents.defaults.workspace`).
- **Documentación**: ruta local de docs/fuente y cuándo leerlos.
- **Archivos del espacio de trabajo (inyectados)**: indica que los archivos de arranque se incluyen abajo.
- **Sandbox** (cuando está habilitado): tiempo de ejecución en sandbox, rutas del sandbox, disponibilidad de ejecución elevada.
- **Fecha y hora actuales**: solo zona horaria (estable para caché; el reloj en vivo viene de `session_status`).
- **Directivas de salida del asistente**: sintaxis compacta de adjuntos, notas de voz y etiquetas de respuesta.
- **Heartbeats**: prompt de Heartbeat y comportamiento de acuse, cuando los Heartbeats están habilitados para el agente predeterminado.
- **Tiempo de ejecución**: host, SO, Node, modelo, raíz del repositorio (cuando se detecta), nivel de pensamiento (una línea).
- **Razonamiento**: nivel de visibilidad actual más la pista del interruptor `/reasoning`.

El contenido estable grande (incluido **Contexto del proyecto**) permanece por encima del límite interno de caché del prompt. Las secciones volátiles por turno (guía de incrustación de la UI de Control, **Mensajería**, **Voz**, **Contexto de chat grupal**, **Reacciones**, **Heartbeats**, **Tiempo de ejecución**) se añaden por debajo de ese límite para que los backends locales con cachés de prefijo puedan reutilizar el prefijo estable del espacio de trabajo entre turnos de canal. Las descripciones de herramientas deben evitar incrustar nombres de canales actuales cuando el esquema aceptado ya transporta ese detalle de tiempo de ejecución.

Las herramientas también incluyen guía para trabajo de larga duración:

- usar Cron para seguimiento futuro (`check back later`, recordatorios, trabajo recurrente) en lugar de bucles de suspensión de `exec`, trucos de demora con `yieldMs` o sondeo repetido de `process`
- usar `exec` / `process` solo para comandos que empiezan ahora y continúan en segundo plano
- cuando la activación automática al completarse está habilitada, iniciar el comando una vez y confiar en la ruta de activación basada en push
- usar `process` para registros, estado, entrada o intervención sobre un comando en ejecución
- para tareas más grandes, preferir `sessions_spawn`; la finalización de subagentes está basada en push y se anuncia automáticamente al solicitante
- no sondear `subagents list` / `sessions_list` en un bucle solo para esperar la finalización

`agents.defaults.subagents.delegationMode` (predeterminado `"suggest"`) puede reforzar esto. `"prefer"` añade una sección dedicada **Delegación de subagentes** que indica al agente principal que actúe como coordinador receptivo y envíe cualquier cosa más compleja que una respuesta directa a través de `sessions_spawn`. Esto solo afecta al prompt; la política de herramientas sigue controlando si `sessions_spawn` está disponible.

Las barreras de seguridad en el prompt de sistema son orientativas, no de cumplimiento. Usa la política de herramientas, aprobaciones de ejecución, sandboxing y listas de permitidos de canal para el cumplimiento estricto; los operadores pueden desactivar las barreras del prompt por diseño.

En canales con tarjetas/botones nativos de aprobación, el prompt indica al agente que dependa primero de esa UI, y que incluya un comando manual `/approve` solo cuando el resultado de la herramienta diga que las aprobaciones por chat no están disponibles o que la aprobación manual es la única vía.

## Modos de prompt

OpenClaw renderiza prompts de sistema más pequeños para subagentes. El tiempo de ejecución establece un `promptMode` por ejecución (no es configuración visible para el usuario):

- `full` (predeterminado): todas las secciones anteriores.
- `minimal`: usado para subagentes; omite la sección de prompt de memoria (incluida como **Recuperación de memoria**), **Autoactualización de OpenClaw**, **Alias de modelos**, **Identidad del usuario**, **Directivas de salida del asistente**, **Mensajería**, **Respuestas silenciosas** y **Heartbeats**. Herramientas, **Seguridad**, **Skills** (cuando se proporcionen), Espacio de trabajo, Sandbox, Fecha y hora actuales (cuando se conozcan), Tiempo de ejecución y contexto inyectado siguen disponibles.
- `none`: devuelve solo la línea de identidad base.

Bajo `promptMode=minimal`, los prompts inyectados adicionales se etiquetan como **Contexto del subagente** en lugar de **Contexto de chat grupal**.

Para ejecuciones de respuesta automática de canal, OpenClaw omite la sección genérica **Respuestas silenciosas** cuando el contexto directo, grupal o solo de herramienta de mensajes ya posee el contrato de respuesta visible. Solo el modo automático heredado de grupo/canal muestra `NO_REPLY`; los chats directos y las respuestas solo con herramienta de mensajes omiten la guía de token silencioso.

## Snapshots de prompts

OpenClaw mantiene snapshots de prompts confirmados para la ruta feliz del tiempo de ejecución de Codex en `test/fixtures/agents/prompt-snapshots/codex-runtime-happy-path/`. Renderizan parámetros seleccionados de hilo/turno del servidor de la app más una pila reconstruida de capas de prompt enlazadas al modelo para turnos directos de Telegram, grupales de Discord y de Heartbeat: un fixture fijado de prompt de modelo Codex `gpt-5.5`, el texto de desarrollador de permisos de la ruta feliz de Codex, instrucciones de desarrollador de OpenClaw, instrucciones de modo de colaboración con alcance de turno cuando OpenClaw las proporciona, entrada del turno de usuario y referencias a especificaciones dinámicas de herramientas.

Actualiza el fixture fijado del prompt de modelo de Codex con `pnpm prompt:snapshots:sync-codex-model`. De forma predeterminada busca `$CODEX_HOME/models_cache.json`, luego `~/.codex/models_cache.json`, luego la convención de checkout de mantenedor `~/code/codex/codex-rs/models-manager/models.json`; si no existe ninguno, sale sin cambiar el fixture confirmado. Pasa `--catalog <path>` para actualizar desde un archivo `models_cache.json` o `models.json` específico.

Estos snapshots no son una captura sin procesar byte a byte de una solicitud de OpenAI. Codex puede añadir contexto de espacio de trabajo propiedad del tiempo de ejecución (`AGENTS.md`, contexto de entorno, memorias, instrucciones de app/plugin, instrucciones integradas predeterminadas de modo de colaboración) después de que OpenClaw envíe los parámetros de hilo y turno.

Regenera con `pnpm prompt:snapshots:gen`; verifica desviaciones con `pnpm prompt:snapshots:check`. CI ejecuta la comprobación de desviaciones junto con los shards de límites adicionales, por lo que los cambios de prompt y las actualizaciones de snapshots aterrizan en el mismo PR.

## Inyección de arranque del espacio de trabajo

Los archivos de arranque se resuelven desde el espacio de trabajo activo y se enrutan a la superficie de prompt que coincide con su duración:

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (solo en espacios de trabajo completamente nuevos)
- `MEMORY.md` cuando esté presente

En el arnés nativo de Codex, OpenClaw evita repetir archivos estables del espacio de trabajo en cada turno de usuario. Codex carga `AGENTS.md` mediante su propio descubrimiento de documentación de proyecto. `TOOLS.md` se reenvía como instrucciones de desarrollador heredadas de Codex. `SOUL.md`, `IDENTITY.md` y `USER.md` se reenvían como instrucciones de desarrollador de colaboración con alcance de turno para que los subagentes nativos de Codex no las hereden. El contenido de `HEARTBEAT.md` no se inyecta directamente; los turnos de Heartbeat reciben una nota de modo de colaboración que apunta al archivo cuando existe y no está vacío. El contenido de `MEMORY.md` tampoco se pega en cada turno nativo de Codex: cuando las herramientas de memoria están disponibles para el espacio de trabajo, los turnos de Codex reciben una pequeña nota de memoria de espacio de trabajo que dirige al modelo a `memory_search` o `memory_get`. Si las herramientas están deshabilitadas, la búsqueda de memoria no está disponible o el espacio de trabajo activo difiere del espacio de trabajo de memoria del agente, `MEMORY.md` vuelve a la ruta normal de contexto de turno acotado. `BOOTSTRAP.md` conserva el rol normal de contexto de turno.

En arneses que no son Codex, los archivos de arranque se componen en el prompt de OpenClaw según sus compuertas existentes. `HEARTBEAT.md` se omite en ejecuciones normales cuando los Heartbeats están deshabilitados para el agente predeterminado o `agents.defaults.heartbeat.includeSystemPromptSection` es false. Mantén concisos los archivos inyectados, especialmente `MEMORY.md` que no sea Codex: debe seguir siendo un resumen curado a largo plazo, con notas diarias detalladas en `memory/*.md` recuperables bajo demanda mediante `memory_search` / `memory_get`. Los archivos `MEMORY.md` que no sean Codex y sean demasiado grandes aumentan el uso de prompt y pueden inyectarse parcialmente bajo los límites de archivos de arranque indicados abajo.

<Note>
Los archivos diarios `memory/*.md` **no** forman parte del Contexto del proyecto de arranque normal. En turnos ordinarios se accede a ellos bajo demanda mediante `memory_search` / `memory_get`, por lo que no cuentan contra la ventana de contexto a menos que el modelo los lea explícitamente. Los turnos simples `/new` y `/reset` son la excepción: el tiempo de ejecución puede anteponer memoria diaria reciente como un bloque de contexto de inicio de un solo uso para ese primer turno.
</Note>

Los archivos grandes se truncan con un marcador:

| Límite                                       | Clave de configuración                            | Valor predeterminado |
| -------------------------------------------- | -------------------------------------------------- | -------- |
| Máximo de caracteres por archivo             | `agents.defaults.bootstrapMaxChars`                | 20000    |
| Total entre todos los archivos               | `agents.defaults.bootstrapTotalMaxChars`           | 60000    |
| Advertencia de truncamiento (`off`\|`once`\|`always`) | `agents.defaults.bootstrapPromptTruncationWarning` | `always` |

Los archivos faltantes inyectan un breve marcador de archivo faltante. Los recuentos brutos/inyectados detallados permanecen en diagnósticos como `/context`, `/status`, doctor y registros.

Para los archivos de memoria, el truncamiento no es pérdida de datos: el archivo permanece intacto en disco. En Codex nativo, `MEMORY.md` se lee bajo demanda mediante herramientas de memoria cuando están disponibles, con respaldo de prompt acotado en caso contrario. En otros arneses, el modelo solo ve la copia inyectada acortada hasta que lee o busca memoria directamente. Si `MEMORY.md` se trunca repetidamente, destílalo en un resumen duradero más corto, mueve el historial detallado a `memory/*.md` o aumenta intencionalmente los límites de arranque.

Las sesiones de subagente solo inyectan `AGENTS.md` y `TOOLS.md` (otros archivos de arranque se filtran para mantener pequeño el contexto del subagente).

Los hooks internos pueden interceptar este paso mediante el evento `agent:bootstrap` para modificar o reemplazar los archivos de arranque inyectados (por ejemplo, cambiar `SOUL.md` por una personalidad alternativa).

Para sonar menos genérico, empieza con [Guía de personalidad de SOUL.md](/es/concepts/soul).

Para inspeccionar cuánto aporta cada archivo inyectado (sin procesar frente a inyectado, truncamiento, sobrecarga del esquema de herramientas), usa `/context list` o `/context detail`. Consulta [Contexto](/es/concepts/context).

## Gestión del tiempo

La sección **Fecha y hora actuales** aparece solo cuando se conoce la zona horaria del usuario, e incluye únicamente la **zona horaria** (sin reloj dinámico ni formato de hora) para mantener estable la caché del prompt.

Usa `session_status` cuando el agente necesite la hora actual; su tarjeta de estado incluye una línea de marca temporal. La misma herramienta puede establecer opcionalmente una anulación de modelo por sesión (`model=default` la borra).

Configura con:

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

Consulta [Zonas horarias](/es/concepts/timezone) y [Fecha y hora](/es/date-time) para ver todos los detalles del comportamiento.

## Skills

Cuando existen skills elegibles, OpenClaw inyecta una lista compacta `<available_skills>` (`formatSkillsForPrompt`) con la **ruta de archivo** y un marcador `<version>sha256:...</version>` derivado del contenido por cada skill. El prompt indica al modelo que use `read` para cargar el SKILL.md en la ubicación listada (espacio de trabajo, gestionada o incluida), y que vuelva a leer una skill cuando su `<version>` difiera de un turno anterior. Si no hay skills elegibles, se omite la sección Skills.

Los turnos nativos de Codex reciben esta lista como instrucciones de desarrollador de colaboración con alcance de turno en lugar de entrada de usuario por turno, excepto los turnos Cron ligeros que conservan el prompt programado exacto. Otros arneses mantienen la sección normal del prompt.

La ubicación puede apuntar a una skill anidada, como `skills/personal/foo/SKILL.md`. El anidamiento es solo organizativo; el prompt usa el nombre plano de la skill desde el frontmatter de `SKILL.md`.

La elegibilidad incluye compuertas de metadatos de skill, comprobaciones de entorno/configuración de runtime y la lista efectiva de Skills permitidas del agente cuando se configura `agents.defaults.skills` o `agents.list[].skills`. Las Skills incluidas con un Plugin solo son elegibles cuando su Plugin propietario está habilitado, lo que permite que los Plugins de herramientas expongan guías operativas más profundas sin incrustar toda esa orientación en cada descripción de herramienta.

```xml
<available_skills>
  <skill>
    <name>...</name>
    <description>...</description>
    <location>...</location>
    <version>sha256:...</version>
  </skill>
</available_skills>
```

Esto mantiene pequeño el prompt base y, al mismo tiempo, permite el uso dirigido de Skills. El dimensionamiento pertenece al subsistema de Skills, separado del dimensionamiento genérico de lectura/inyección del runtime:

| Alcance   | Presupuesto del prompt de Skills                  | Presupuesto de extracto del runtime |
| --------- | ------------------------------------------------- | ----------------------------------- |
| Global    | `skills.limits.maxSkillsPromptChars`              | `agents.defaults.contextLimits.*`   |
| Por agente | `agents.list[].skillsLimits.maxSkillsPromptChars` | `agents.list[].contextLimits.*`     |

El presupuesto de extracto del runtime cubre `memory_get`, resultados de herramientas en vivo y actualizaciones de `AGENTS.md` posteriores a la Compaction.

## Documentación

La sección **Documentación** apunta a la documentación local cuando está disponible (`docs/` en un checkout de Git o la documentación del paquete npm incluido), y en caso contrario recurre a [https://docs.openclaw.ai](https://docs.openclaw.ai). También lista la ubicación del código fuente de OpenClaw: los checkouts de Git exponen la raíz del código fuente local; las instalaciones de paquete obtienen la URL del código fuente en GitHub con instrucciones para revisar allí el código fuente cuando la documentación esté incompleta o desactualizada.

El prompt presenta la documentación como la autoridad para el autoconocimiento de OpenClaw antes de que el modelo entienda cómo funciona OpenClaw (memoria/notas diarias, sesiones, herramientas, Gateway, configuración, comandos, contexto del proyecto), e indica al modelo que trate `AGENTS.md`, el contexto del proyecto, las notas de espacio de trabajo/perfil/memoria y `memory_search` como contexto de instrucciones o memoria del usuario, en lugar de conocimiento de diseño/implementación de OpenClaw. Si la documentación no dice nada o está desactualizada, el modelo debe decirlo e inspeccionar el código fuente. También indica al modelo que ejecute `openclaw status` por su cuenta cuando sea posible, y que pregunte al usuario solo cuando no tenga acceso.

Para la configuración específicamente, dirige a los agentes a la acción de herramienta `gateway` `config.schema.lookup` para obtener documentación y restricciones exactas a nivel de campo, y luego a `docs/gateway/configuration.md` y `docs/gateway/configuration-reference.md` para orientación más amplia.

## Relacionado

- [Runtime del agente](/es/concepts/agent)
- [Espacio de trabajo del agente](/es/concepts/agent-workspace)
- [Motor de contexto](/es/concepts/context-engine)

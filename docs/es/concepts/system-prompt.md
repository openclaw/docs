---
read_when:
    - Edición del texto del prompt del sistema, la lista de herramientas o las secciones de hora/Heartbeat
    - Cambio del comportamiento de inicialización del espacio de trabajo o de inyección de Skills
summary: Qué contiene el prompt del sistema de OpenClaw y cómo se ensambla
title: Prompt del sistema
x-i18n:
    generated_at: "2026-07-22T10:32:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 669fbc6f21a82a2c3c067d2ff3a6365acb3316460a85f2db165b7ad49ce79f70
    source_path: concepts/system-prompt.md
    workflow: 16
---

OpenClaw crea su propio prompt del sistema para cada ejecución del agente; no existe un prompt predeterminado en tiempo de ejecución.

El ensamblaje tiene tres capas:

- `buildAgentSystemPrompt` renderiza el prompt a partir de entradas explícitas. Se mantiene como un renderizador puro y no lee directamente la configuración global.
- `resolveAgentSystemPromptConfig` resuelve los parámetros del prompt respaldados por la configuración (visualización del propietario, indicaciones de TTS, alias de modelos, modo de citas de memoria, modo de delegación en subagentes) para un agente específico.
- Los adaptadores de tiempo de ejecución (integrado, CLI, vistas previas de comandos/exportaciones, Compaction) recopilan datos en vivo (herramientas, estado del entorno aislado, capacidades del canal, archivos de contexto, contribuciones del proveedor al prompt) y llaman a la fachada de prompts configurada.

Esto mantiene las superficies de prompts exportadas y de depuración alineadas con las ejecuciones en vivo sin convertir cada detalle del tiempo de ejecución en un único generador monolítico.

Los plugins de proveedores pueden aportar orientación compatible con la caché sin reemplazar el prompt propiedad de OpenClaw. Un tiempo de ejecución de proveedor puede:

- reemplazar una de las tres secciones principales con nombre: `interaction_style`, `tool_call_style`, `execution_bias`
- inyectar un **prefijo estable** por encima del límite de la caché de prompts
- inyectar un **sufijo dinámico** por debajo del límite de la caché de prompts

Utilice contribuciones propiedad del proveedor para ajustes específicos de la familia de modelos. Reserve el hook heredado `before_prompt_build` para compatibilidad o cambios verdaderamente globales del prompt.

La capa incluida para la familia GPT-5 de OpenAI/Codex (`resolveGpt5SystemPromptContribution`) utiliza este mecanismo: un contrato de comportamiento `stablePrefix` (política de ejecución, disciplina de herramientas, contrato de salida, contrato de finalización) más una anulación opcional `interaction_style` para un tono más cordial. Se aplica a cualquier identificador de modelo `gpt-5*` enrutado a través de los plugins de OpenAI o Codex, controlado por `agents.defaults.promptOverlays.gpt5.personality` (`"friendly"`/`"on"` o `"off"`).

## Estructura

El prompt es compacto y tiene secciones fijas:

- **Herramientas**: recordatorio de que las herramientas estructuradas son la fuente de verdad, junto con orientación sobre el uso de herramientas en tiempo de ejecución. Cuando la herramienta experimental `update_plan` está habilitada (`tools.experimental.planTool`), su propia descripción añade: utilizarla solo para trabajos no triviales de varios pasos, mantener como máximo un paso `in_progress` y omitirla para trabajos sencillos de un solo paso.
- **Predisposición a la ejecución**: actuar durante el turno ante solicitudes accionables, continuar hasta terminar o quedar bloqueado, recuperarse de resultados deficientes de herramientas, comprobar en vivo el estado mutable y verificar antes de finalizar.
- **Seguridad**: breve recordatorio de las medidas de protección contra comportamientos orientados a acumular poder o eludir la supervisión.
- **Skills** (cuando estén disponibles): indica al modelo cómo cargar bajo demanda las instrucciones de las Skills.
- **Control de OpenClaw**: dar preferencia a la herramienta `gateway` para tareas de configuración y reinicio; no inventar comandos de la CLI.
- **Actualización automática de OpenClaw**: inspeccionar la configuración de forma segura con `config.schema.lookup`, aplicar parches con `config.patch`, reemplazar toda la configuración con `config.apply` y ejecutar `update.run` solo cuando el usuario lo solicite explícitamente. La herramienta `gateway` orientada al agente se niega a reescribir `tools.exec.mode`.
- **Espacio de trabajo**: directorio de trabajo (`agents.defaults.workspace`).
- **Documentación**: ruta local de la documentación o del código fuente y cuándo consultarlos.
- **Archivos del espacio de trabajo (inyectados)**: señala que los archivos de arranque se incluyen a continuación.
- **Entorno aislado** (cuando está habilitado): tiempo de ejecución aislado, rutas del entorno aislado y disponibilidad de ejecución con privilegios elevados.
- **Fecha y hora actuales**: solo la zona horaria (estable para la caché; el reloj en vivo procede de `session_status`).
- **Directivas de salida del asistente**: sintaxis compacta de archivos adjuntos, notas de voz y etiquetas de respuesta.
- **Heartbeats**: prompt de Heartbeat y comportamiento de confirmación, cuando los Heartbeats están habilitados para el agente predeterminado.
- **Tiempo de ejecución**: host, sistema operativo, Node, modelo, raíz del repositorio (cuando se detecta), nivel de razonamiento (una línea).
- **Razonamiento**: nivel actual de visibilidad junto con la indicación del conmutador `/reasoning`.

El contenido estable de gran tamaño (incluido **Contexto del proyecto**) permanece por encima del límite interno de la caché de prompts. Las secciones volátiles de cada turno (orientación integrada de la interfaz de control, **Mensajería**, **Voz**, **Contexto del chat grupal**, **Reacciones**, **Heartbeats**, **Tiempo de ejecución**) se añaden por debajo de ese límite para que los backends locales con cachés de prefijos puedan reutilizar el prefijo estable del espacio de trabajo entre turnos del canal. Las descripciones de herramientas deben evitar incluir nombres de canales actuales cuando el esquema aceptado ya contiene ese detalle del tiempo de ejecución.

Las herramientas también incluyen orientación para trabajos de larga duración:

- utilizar Cron para seguimientos futuros (`check back later`, recordatorios, trabajo recurrente) en lugar de bucles de espera `exec`, trucos de retraso `yieldMs` o sondeos repetidos `process`
- utilizar `exec` / `process` solo para comandos que comienzan ahora y continúan en segundo plano
- cuando la activación automática al finalizar está habilitada, iniciar el comando una sola vez y confiar en la ruta de activación basada en inserción
- utilizar `process` para consultar registros y estados, proporcionar entradas o intervenir en un comando en ejecución
- para tareas más grandes, dar preferencia a `sessions_spawn`; la finalización de los subagentes se basa en inserción y se anuncia automáticamente al solicitante
- no sondear `subagents list` / `sessions_list` en un bucle únicamente para esperar a que finalicen

`agents.defaults.subagents.delegationMode` (valor predeterminado: `"suggest"`) puede reforzar esto. `"prefer"` añade una sección dedicada de **Delegación en subagentes** que indica al agente principal que actúe como coordinador receptivo y derive mediante `sessions_spawn` cualquier tarea que requiera más que una respuesta directa. Esto solo afecta al prompt; la política de herramientas sigue controlando si `sessions_spawn` está disponible.

Las medidas de protección de seguridad del prompt del sistema son orientativas, no mecanismos de aplicación. Utilice la política de herramientas, las aprobaciones de ejecución, el aislamiento y las listas de canales permitidos para una aplicación estricta; por diseño, los operadores pueden deshabilitar las medidas de protección del prompt.

En canales con tarjetas o botones de aprobación nativos, el prompt indica al agente que confíe primero en esa interfaz y que incluya un comando manual `/approve` solo cuando el resultado de la herramienta indique que las aprobaciones por chat no están disponibles o que la aprobación manual es la única vía.

## Modos de prompt

OpenClaw renderiza prompts del sistema más pequeños para los subagentes. El tiempo de ejecución establece un `promptMode` por ejecución (no es una configuración visible para el usuario):

- `full` (predeterminado): todas las secciones anteriores.
- `minimal`: utilizado para subagentes; omite la sección del prompt de memoria (incluida como **Recuperación de memoria**), **Actualización automática de OpenClaw**, **Alias de modelos**, **Identidad del usuario**, **Directivas de salida del asistente**, **Mensajería**, **Respuestas silenciosas** y **Heartbeats**. Las herramientas, la **Seguridad**, las **Skills** (cuando se proporcionan), el espacio de trabajo, el entorno aislado, la fecha y hora actuales (cuando se conocen), el tiempo de ejecución y el contexto inyectado siguen disponibles.
- `none`: devuelve únicamente la línea de identidad base.

Con `promptMode=minimal`, los prompts adicionales inyectados se etiquetan como **Contexto del subagente** en lugar de **Contexto del chat grupal**.

Para las ejecuciones de respuesta automática en canales, OpenClaw omite la sección genérica **Respuestas silenciosas** cuando el contexto directo, grupal o exclusivo de herramientas de mensajería ya controla el contrato de respuesta visible. Solo el modo automático heredado de grupos o canales muestra `NO_REPLY`; los chats directos y las respuestas exclusivas de herramientas de mensajería omiten la orientación sobre tokens silenciosos.

## Instantáneas de prompts

OpenClaw conserva instantáneas de prompts confirmadas para la ruta feliz del tiempo de ejecución de Codex en `test/fixtures/agents/prompt-snapshots/codex-runtime-happy-path/`. Renderizan parámetros seleccionados de hilos y turnos del servidor de aplicaciones, además de una pila reconstruida de capas de prompts vinculadas al modelo para turnos directos de Telegram, grupales de Discord y de Heartbeat: un recurso de prueba fijado del prompt del modelo Codex `gpt-5.5`, el texto de desarrollador sobre permisos de la ruta feliz de Codex, las instrucciones de desarrollador de OpenClaw, las instrucciones del modo de colaboración limitadas al turno cuando OpenClaw las proporciona, la entrada del turno del usuario y referencias a especificaciones dinámicas de herramientas.

Actualice el recurso de prueba fijado del prompt del modelo Codex con `pnpm prompt:snapshots:sync-codex-model`. De forma predeterminada, busca `$CODEX_HOME/models_cache.json`, después `~/.codex/models_cache.json` y, por último, la convención de checkout del mantenedor `~/code/codex/codex-rs/models-manager/models.json`; si no existe ninguno, finaliza sin modificar el recurso de prueba confirmado. Pase `--catalog <path>` para actualizarlo desde un archivo `models_cache.json` o `models.json` específico.

Estas instantáneas no son una captura sin procesar, byte por byte, de una solicitud de OpenAI. Codex puede añadir contexto del espacio de trabajo propiedad del tiempo de ejecución (`AGENTS.md`, contexto del entorno, memorias, instrucciones de aplicaciones o plugins e instrucciones integradas del modo de colaboración predeterminado) después de que OpenClaw envíe los parámetros del hilo y del turno.

Vuelva a generarlas con `pnpm prompt:snapshots:gen`; verifique las desviaciones con `pnpm prompt:snapshots:check`. La Pipeline de CI ejecuta la comprobación de desviaciones junto con los fragmentos de límites adicionales, de modo que los cambios de prompts y las actualizaciones de instantáneas se incorporen en el mismo PR.

## Inyección del arranque del espacio de trabajo

Los archivos de arranque se resuelven desde el espacio de trabajo activo y se dirigen a la superficie del prompt correspondiente a su duración:

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (solo en espacios de trabajo completamente nuevos)
- `MEMORY.md` cuando está presente

En el arnés nativo de Codex, OpenClaw evita repetir archivos estables del espacio de trabajo en cada turno del usuario. Codex carga `AGENTS.md` mediante su propio mecanismo de detección de documentación del proyecto. `TOOLS.md` se reenvía como instrucciones de desarrollador heredadas de Codex. `SOUL.md`, `IDENTITY.md` y `USER.md` se reenvían como instrucciones de desarrollador de colaboración limitadas al turno, de modo que los subagentes nativos de Codex no las hereden. El contenido de `HEARTBEAT.md` no se inyecta directamente; los turnos de Heartbeat reciben una nota del modo de colaboración que apunta al archivo cuando existe y no está vacío. El contenido de `MEMORY.md` tampoco se pega en cada turno nativo de Codex: cuando las herramientas de memoria están disponibles para el espacio de trabajo, los turnos de Codex reciben una breve nota sobre la memoria del espacio de trabajo que dirige el modelo a `memory_search` o `memory_get`. Si las herramientas están deshabilitadas, la búsqueda de memoria no está disponible o el espacio de trabajo activo difiere del espacio de trabajo de memoria del agente, `MEMORY.md` recurre a la ruta normal y acotada del contexto del turno. `BOOTSTRAP.md` conserva el rol normal del contexto del turno.

En arneses que no son Codex, los archivos de arranque se integran en el prompt de OpenClaw según sus condiciones existentes. `HEARTBEAT.md` se omite en las ejecuciones normales cuando los Heartbeats están deshabilitados para el agente predeterminado o `agents.defaults.heartbeat.includeSystemPromptSection` es falso. Mantenga concisos los archivos inyectados, especialmente `MEMORY.md` en entornos que no sean Codex: debe seguir siendo un resumen seleccionado a largo plazo, con notas diarias detalladas en `memory/*.md` recuperables bajo demanda mediante `memory_search` / `memory_get`. Los archivos `MEMORY.md` de gran tamaño en entornos que no sean Codex aumentan el uso del prompt y pueden inyectarse parcialmente conforme a los límites de archivos de arranque indicados a continuación.

<Note>
Los archivos diarios `memory/*.md` **no** forman parte del contexto normal del proyecto durante el arranque. En turnos ordinarios, se accede a ellos bajo demanda mediante `memory_search` / `memory_get`, por lo que no cuentan para la ventana de contexto a menos que el modelo los lea explícitamente. Los turnos básicos `/new` y `/reset` son la excepción: el tiempo de ejecución puede anteponer la memoria diaria reciente como un bloque de contexto de inicio de un solo uso para ese primer turno.
</Note>

Los archivos grandes se truncan con un marcador:

| Límite                                       | Clave de configuración                              | Valor predeterminado |
| -------------------------------------------- | -------------------------------------------------- | -------------------- |
| Máximo de caracteres por archivo             | `agents.defaults.bootstrapMaxChars`                | 20000                |
| Total entre todos los archivos               | `agents.defaults.bootstrapTotalMaxChars`           | 60000                |
| Advertencia de truncamiento (`off`\|`once`\|`always`) | `agents.defaults.bootstrapPromptTruncationWarning` | `always` |

Los archivos que faltan insertan un marcador breve de archivo ausente. Los recuentos detallados sin procesar/inyectados permanecen en diagnósticos como `/context`, `/status`, doctor y los registros.

En el caso de los archivos de memoria, el truncamiento no implica pérdida de datos: el archivo permanece intacto en el disco. En Codex nativo, `MEMORY.md` se lee bajo demanda mediante las herramientas de memoria cuando están disponibles; de lo contrario, se utiliza una alternativa acotada en el prompt. En otros entornos de ejecución, el modelo solo ve la copia inyectada abreviada hasta que lee o busca directamente en la memoria. Si `MEMORY.md` se trunca repetidamente, condénselo en un resumen duradero más breve, traslade el historial detallado a `memory/*.md` o aumente intencionadamente los límites de arranque.

Las sesiones de subagentes solo inyectan `AGENTS.md` y `TOOLS.md` (los demás archivos de arranque se filtran para mantener reducido el contexto de los subagentes).

Los hooks internos pueden interceptar este paso mediante el evento `agent:bootstrap` para modificar o reemplazar los archivos de arranque inyectados (por ejemplo, sustituyendo `SOUL.md` por una personalidad alternativa).

Para sonar menos genérico, comience con la [Guía de personalidad de SOUL.md](/es/concepts/soul).

Para examinar cuánto aporta cada archivo inyectado (sin procesar frente a inyectado, truncamiento y sobrecarga del esquema de herramientas), utilice `/context list` o `/context detail`. Consulte [Contexto](/es/concepts/context).

## Gestión del tiempo

La sección **Fecha y hora actuales** aparece únicamente cuando se conoce la zona horaria del usuario y solo incluye la **zona horaria** (sin reloj dinámico ni formato de hora) para mantener estable la caché del prompt.

Utilice `session_status` cuando el agente necesite la hora actual; su tarjeta de estado incluye una línea con la marca de tiempo. La misma herramienta puede establecer opcionalmente una sustitución del modelo por sesión (`model=default` la elimina).

Configure con:

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

Consulte [Zonas horarias](/es/concepts/timezone) y [Fecha y hora](/es/date-time) para conocer todos los detalles del comportamiento.

## Skills

Cuando existen Skills aptas, OpenClaw inyecta una lista compacta `<available_skills>` (`formatSkillsForPrompt`) con la **ruta del archivo** y un marcador `<version>sha256:...</version>` derivado del contenido para cada Skill. El prompt indica al modelo que utilice `read` para cargar el archivo SKILL.md en la ubicación indicada (del espacio de trabajo, administrada o integrada) y que vuelva a leer una Skill cuando su `<version>` difiera del turno anterior. Si no hay Skills aptas, se omite la sección Skills.

Los turnos de Codex nativo reciben esta lista como instrucciones de desarrollador de colaboración limitadas al turno, en lugar de como entrada del usuario en cada turno, excepto los turnos cron ligeros que conservan exactamente el prompt programado. Otros entornos de ejecución mantienen la sección normal del prompt.

La ubicación puede apuntar a una Skill anidada, como `skills/personal/foo/SKILL.md`. El anidamiento es meramente organizativo; el prompt utiliza el nombre plano de la Skill procedente del frontmatter `SKILL.md`.

La elegibilidad incluye las restricciones de los metadatos de las Skills, las comprobaciones del entorno o la configuración en tiempo de ejecución y la lista efectiva de Skills permitidas para el agente cuando se configura `agents.defaults.skills` o `agents.entries.*.skills`. Las Skills integradas en un Plugin solo son aptas cuando el Plugin propietario está habilitado, lo que permite a los Plugins de herramientas ofrecer guías operativas más detalladas sin incorporar toda esa orientación en la descripción de cada herramienta.

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

Esto mantiene reducido el prompt base y, al mismo tiempo, permite el uso específico de Skills. El subsistema de Skills gestiona el dimensionamiento, independientemente del dimensionamiento genérico de lectura e inyección en tiempo de ejecución:

| Ámbito     | Presupuesto del prompt de Skills                     | Presupuesto de extractos en tiempo de ejecución |
| ---------- | ---------------------------------------------------- | ----------------------------------------------- |
| Global     | `skills.limits.maxSkillsPromptChars`                                   | `agents.defaults.contextLimits.*`                              |
| Por agente | `agents.entries.*.skillsLimits.maxSkillsPromptChars`                                   | `agents.entries.*.contextLimits.*`                              |

El presupuesto de extractos en tiempo de ejecución abarca `memory_get`, los resultados de herramientas en vivo y las actualizaciones de `AGENTS.md` posteriores a la Compaction.

## Documentación

La sección **Documentación** apunta a la documentación local cuando está disponible (`docs/` en un checkout de Git o la documentación incluida en el paquete npm); de lo contrario, recurre a [https://docs.openclaw.ai](https://docs.openclaw.ai). También indica la ubicación del código fuente de OpenClaw: los checkouts de Git exponen la raíz local del código fuente, mientras que las instalaciones de paquetes proporcionan la URL del código fuente en GitHub con instrucciones para revisar allí el código cuando la documentación esté incompleta o desactualizada.

El prompt presenta la documentación como la fuente autorizada para el conocimiento de OpenClaw antes de que el modelo determine cómo funciona OpenClaw (memoria/notas diarias, sesiones, herramientas, Gateway, configuración, comandos y contexto del proyecto) e indica al modelo que trate `AGENTS.md`, el contexto del proyecto, las notas del espacio de trabajo/perfil/memoria y `memory_search` como contexto de instrucciones o memoria del usuario, no como conocimiento sobre el diseño o la implementación de OpenClaw. Si la documentación no aborda el tema o está desactualizada, el modelo debe indicarlo e inspeccionar el código fuente. También indica al modelo que ejecute por sí mismo `openclaw status` cuando sea posible y que solo pregunte al usuario cuando carezca de acceso.

En lo relativo específicamente a la configuración, dirige a los agentes a la acción `config.schema.lookup` de la herramienta `gateway` para obtener documentación y restricciones exactas a nivel de campo, y después a `docs/gateway/configuration.md` y `docs/gateway/configuration-reference.md` para obtener orientación más general.

## Contenido relacionado

- [Entorno de ejecución del agente](/es/concepts/agent)
- [Espacio de trabajo del agente](/es/concepts/agent-workspace)
- [Motor de contexto](/es/concepts/context-engine)

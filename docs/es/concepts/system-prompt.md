---
read_when:
    - Edición del texto del prompt del sistema, la lista de herramientas o las secciones de tiempo/Heartbeat
    - Cambio del comportamiento de inicialización del espacio de trabajo o de inyección de Skills
summary: Qué contiene el prompt del sistema de OpenClaw y cómo se ensambla
title: Prompt del sistema
x-i18n:
    generated_at: "2026-07-11T23:05:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1aabd41b5d4b51ed139d47b506017322c240bb1002bae901886d5f7991c0dc5e
    source_path: concepts/system-prompt.md
    workflow: 16
---

OpenClaw crea su propio prompt del sistema para cada ejecución de agente; no existe un prompt predeterminado en tiempo de ejecución.

El ensamblaje tiene tres capas:

- `buildAgentSystemPrompt` renderiza el prompt a partir de entradas explícitas. Se mantiene como un renderizador puro y no lee directamente la configuración global.
- `resolveAgentSystemPromptConfig` resuelve los controles del prompt respaldados por la configuración (visualización del propietario, indicaciones de TTS, alias de modelos, modo de citas de memoria y modo de delegación en subagentes) para un agente específico.
- Los adaptadores de tiempo de ejecución (integrado, CLI, vistas previas de comandos/exportaciones y Compaction) recopilan datos actuales (herramientas, estado del sandbox, capacidades del canal, archivos de contexto y contribuciones al prompt del proveedor) y llaman a la fachada de prompts configurada.

Esto mantiene las superficies de prompts exportados y de depuración alineadas con las ejecuciones reales sin convertir todos los detalles del tiempo de ejecución en un único constructor monolítico.

Los Plugins de proveedores pueden aportar orientación compatible con la caché sin reemplazar el prompt propiedad de OpenClaw. Un tiempo de ejecución de proveedor puede:

- reemplazar una de las tres secciones principales con nombre: `interaction_style`, `tool_call_style`, `execution_bias`
- insertar un **prefijo estable** por encima del límite de la caché del prompt
- insertar un **sufijo dinámico** por debajo del límite de la caché del prompt

Use contribuciones propiedad del proveedor para ajustes específicos de cada familia de modelos. Reserve el hook heredado `before_prompt_build` para la compatibilidad o para cambios verdaderamente globales del prompt.

La capa incluida para la familia GPT-5 de OpenAI/Codex (`resolveGpt5SystemPromptContribution`) utiliza este mecanismo: un contrato de comportamiento `stablePrefix` (política de ejecución, disciplina de herramientas, contrato de salida y contrato de finalización), además de una sustitución opcional de `interaction_style` para ofrecer un tono más cordial. Se aplica a cualquier identificador de modelo `gpt-5*` enrutado mediante los Plugins de OpenAI o Codex, controlado por `agents.defaults.promptOverlays.gpt5.personality` (`"friendly"`/`"on"` o `"off"`).

## Estructura

El prompt es compacto y contiene secciones fijas:

- **Herramientas**: recordatorio de que las herramientas estructuradas son la fuente de verdad, además de orientación sobre el uso de herramientas en tiempo de ejecución. Cuando está habilitada la herramienta experimental `update_plan` (`tools.experimental.planTool`), su propia descripción añade: usarla solo para trabajos no triviales de varios pasos, mantener como máximo un paso en estado `in_progress` y omitirla para trabajos sencillos de un solo paso.
- **Sesgo de ejecución**: actuar en el mismo turno ante solicitudes ejecutables, continuar hasta terminar o quedar bloqueado, recuperarse de resultados deficientes de las herramientas, consultar en vivo el estado mutable y verificar antes de finalizar.
- **Seguridad**: breve recordatorio de las medidas de protección contra comportamientos orientados a acumular poder o eludir la supervisión.
- **Skills** (cuando estén disponibles): indica al modelo cómo cargar las instrucciones de las Skills bajo demanda.
- **Control de OpenClaw**: preferir la herramienta `gateway` para tareas de configuración o reinicio; no inventar comandos de la CLI.
- **Actualización automática de OpenClaw**: inspeccionar la configuración de forma segura con `config.schema.lookup`, modificarla con `config.patch`, reemplazar la configuración completa con `config.apply` y ejecutar `update.run` solo cuando el usuario lo solicite explícitamente. La herramienta `gateway` orientada al agente se niega a reescribir `tools.exec.ask` / `tools.exec.security`, incluidos los alias heredados `tools.bash.*` que se normalizan en esas rutas protegidas.
- **Espacio de trabajo**: directorio de trabajo (`agents.defaults.workspace`).
- **Documentación**: ruta local de la documentación o del código fuente y cuándo consultarlos.
- **Archivos del espacio de trabajo (inyectados)**: señala que los archivos de arranque se incluyen más adelante.
- **Sandbox** (cuando está habilitado): tiempo de ejecución aislado, rutas del sandbox y disponibilidad de ejecución con privilegios elevados.
- **Fecha y hora actuales**: solo la zona horaria (estable para la caché; el reloj en vivo procede de `session_status`).
- **Directivas de salida del asistente**: sintaxis compacta para archivos adjuntos, notas de voz y etiquetas de respuesta.
- **Heartbeats**: prompt de Heartbeat y comportamiento de confirmación cuando los Heartbeats están habilitados para el agente predeterminado.
- **Tiempo de ejecución**: host, sistema operativo, Node, modelo, raíz del repositorio (cuando se detecta) y nivel de razonamiento (una línea).
- **Razonamiento**: nivel actual de visibilidad, además de la indicación para alternarlo con `/reasoning`.

El contenido estable de gran tamaño (incluido el **Contexto del proyecto**) permanece por encima del límite interno de la caché del prompt. Las secciones volátiles de cada turno (orientación integrada de la interfaz de control, **Mensajería**, **Voz**, **Contexto del chat grupal**, **Reacciones**, **Heartbeats** y **Tiempo de ejecución**) se añaden por debajo de ese límite para que los backends locales con cachés de prefijos puedan reutilizar el prefijo estable del espacio de trabajo entre turnos de distintos canales. Las descripciones de herramientas deben evitar incluir los nombres de los canales actuales cuando el esquema aceptado ya contiene ese detalle del tiempo de ejecución.

La sección de herramientas también incluye orientación para trabajos de larga duración:

- usar Cron para seguimientos futuros (`check back later`, recordatorios y trabajos recurrentes), en lugar de bucles de espera con `exec`, trucos de retraso con `yieldMs` o consultas repetidas mediante `process`
- usar `exec` / `process` únicamente para comandos que comienzan ahora y continúan en segundo plano
- cuando esté habilitado el despertar automático al finalizar, iniciar el comando una sola vez y confiar en la ruta de activación basada en notificaciones push
- usar `process` para obtener registros o estados, proporcionar entradas o intervenir en un comando en ejecución
- para tareas más grandes, preferir `sessions_spawn`; la finalización de los subagentes se basa en notificaciones push y se anuncia automáticamente al solicitante
- no consultar `subagents list` / `sessions_list` en un bucle solo para esperar a que finalicen

`agents.defaults.subagents.delegationMode` (valor predeterminado: `"suggest"`) puede reforzar estas indicaciones. `"prefer"` añade una sección específica de **Delegación en subagentes** que indica al agente principal que actúe como coordinador receptivo y que canalice mediante `sessions_spawn` todo aquello que requiera más que una respuesta directa. Esto solo afecta al prompt; la política de herramientas sigue controlando si `sessions_spawn` está disponible.

Las medidas de protección de seguridad del prompt del sistema son orientativas, no mecanismos de aplicación. Para imponer restricciones estrictas, use la política de herramientas, las aprobaciones de ejecución, el aislamiento en sandbox y las listas de canales permitidos; por diseño, los operadores pueden deshabilitar las medidas de protección del prompt.

En canales con tarjetas o botones de aprobación nativos, el prompt indica al agente que confíe primero en esa interfaz y que incluya un comando manual `/approve` solo cuando el resultado de la herramienta señale que las aprobaciones mediante chat no están disponibles o que la aprobación manual es la única opción.

## Modos del prompt

OpenClaw renderiza prompts del sistema más pequeños para los subagentes. El tiempo de ejecución establece un `promptMode` en cada ejecución (no es una configuración orientada al usuario):

- `full` (predeterminado): todas las secciones anteriores.
- `minimal`: utilizado para subagentes; omite la sección del prompt de memoria (incluida como **Recuperación de memoria**), **Actualización automática de OpenClaw**, **Alias de modelos**, **Identidad del usuario**, **Directivas de salida del asistente**, **Mensajería**, **Respuestas silenciosas** y **Heartbeats**. Las herramientas, la **Seguridad**, las **Skills** (cuando se proporcionen), el espacio de trabajo, el sandbox, la fecha y hora actuales (cuando se conozcan), el tiempo de ejecución y el contexto inyectado permanecen disponibles.
- `none`: devuelve únicamente la línea de identidad básica.

Con `promptMode=minimal`, los prompts adicionales inyectados se etiquetan como **Contexto del subagente** en lugar de **Contexto del chat grupal**.

En las ejecuciones de respuesta automática de canales, OpenClaw omite la sección genérica **Respuestas silenciosas** cuando el contexto directo, grupal o exclusivo de la herramienta de mensajería ya controla el contrato de respuesta visible. Solo el modo automático heredado de grupos o canales muestra `NO_REPLY`; los chats directos y las respuestas exclusivas de la herramienta de mensajería omiten las indicaciones sobre tokens de silencio.

## Instantáneas de prompts

OpenClaw conserva instantáneas de prompts registradas para la ruta satisfactoria del tiempo de ejecución de Codex en `test/fixtures/agents/prompt-snapshots/codex-runtime-happy-path/`. Estas renderizan parámetros seleccionados de hilos y turnos del servidor de aplicaciones, además de una pila reconstruida de capas de prompts vinculadas al modelo para turnos directos de Telegram, grupales de Discord y de Heartbeat: una instantánea fijada del prompt del modelo `gpt-5.5` de Codex, el texto de desarrollador de permisos de la ruta satisfactoria de Codex, las instrucciones de desarrollador de OpenClaw, las instrucciones del modo de colaboración limitadas al turno cuando OpenClaw las proporciona, la entrada del turno del usuario y referencias a especificaciones dinámicas de herramientas.

Actualice la instantánea fijada del prompt del modelo de Codex con `pnpm prompt:snapshots:sync-codex-model`. De forma predeterminada, busca `$CODEX_HOME/models_cache.json`, después `~/.codex/models_cache.json` y, por último, la convención del checkout del mantenedor `~/code/codex/codex-rs/models-manager/models.json`; si ninguno existe, finaliza sin modificar la instantánea registrada. Pase `--catalog <path>` para actualizarla desde un archivo `models_cache.json` o `models.json` específico.

Estas instantáneas no son una captura sin procesar y exacta byte por byte de una solicitud a OpenAI. Codex puede añadir contexto del espacio de trabajo propiedad del tiempo de ejecución (`AGENTS.md`, contexto del entorno, memorias, instrucciones de aplicaciones o Plugins e instrucciones integradas del modo de colaboración predeterminado) después de que OpenClaw envíe los parámetros del hilo y del turno.

Vuelva a generarlas con `pnpm prompt:snapshots:gen`; compruebe las desviaciones con `pnpm prompt:snapshots:check`. La CI ejecuta la comprobación de desviaciones junto con los fragmentos de límites adicionales, de modo que los cambios en los prompts y las actualizaciones de las instantáneas se incorporen en la misma PR.

## Inyección de archivos de arranque del espacio de trabajo

Los archivos de arranque se resuelven desde el espacio de trabajo activo y se dirigen a la superficie del prompt correspondiente a su duración:

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (solo en espacios de trabajo completamente nuevos)
- `MEMORY.md` cuando exista

En el entorno nativo de Codex, OpenClaw evita repetir los archivos estables del espacio de trabajo en cada turno del usuario. Codex carga `AGENTS.md` mediante su propio mecanismo de detección de documentación del proyecto. `TOOLS.md` se reenvía como instrucciones heredadas de desarrollador de Codex. `SOUL.md`, `IDENTITY.md` y `USER.md` se reenvían como instrucciones de desarrollador de colaboración limitadas al turno, para que los subagentes nativos de Codex no las hereden. El contenido de `HEARTBEAT.md` no se inyecta directamente; los turnos de Heartbeat reciben una nota del modo de colaboración que apunta al archivo cuando existe y no está vacío. El contenido de `MEMORY.md` tampoco se pega en cada turno nativo de Codex: cuando hay herramientas de memoria disponibles para el espacio de trabajo, los turnos de Codex reciben una breve nota sobre la memoria del espacio de trabajo que dirige al modelo a `memory_search` o `memory_get`. Si las herramientas están deshabilitadas, la búsqueda de memoria no está disponible o el espacio de trabajo activo difiere del espacio de trabajo de memoria del agente, `MEMORY.md` recurre a la ruta normal de contexto limitado del turno. `BOOTSTRAP.md` conserva su función normal de contexto del turno.

En entornos distintos de Codex, los archivos de arranque se integran en el prompt de OpenClaw conforme a sus condiciones existentes. `HEARTBEAT.md` se omite en las ejecuciones normales cuando los Heartbeats están deshabilitados para el agente predeterminado o `agents.defaults.heartbeat.includeSystemPromptSection` es `false`. Mantenga concisos los archivos inyectados, especialmente `MEMORY.md` fuera de Codex: debe seguir siendo un resumen seleccionado a largo plazo, con notas diarias detalladas en `memory/*.md` que puedan recuperarse bajo demanda mediante `memory_search` / `memory_get`. Los archivos `MEMORY.md` sobredimensionados fuera de Codex aumentan el uso del prompt y pueden inyectarse parcialmente debido a los límites de archivos de arranque que se indican más adelante.

<Note>
Los archivos diarios `memory/*.md` **no** forman parte del Contexto del proyecto de arranque normal. En los turnos ordinarios se accede a ellos bajo demanda mediante `memory_search` / `memory_get`, por lo que no ocupan la ventana de contexto a menos que el modelo los lea explícitamente. Los turnos simples `/new` y `/reset` son la excepción: el tiempo de ejecución puede anteponer la memoria diaria reciente como un bloque de contexto inicial de un solo uso para ese primer turno.
</Note>

Los archivos grandes se truncan con un marcador:

| Límite                                      | Clave de configuración                               | Valor predeterminado |
| ------------------------------------------- | ---------------------------------------------------- | -------------------- |
| Máximo de caracteres por archivo            | `agents.defaults.bootstrapMaxChars`                  | 20000                |
| Total entre todos los archivos              | `agents.defaults.bootstrapTotalMaxChars`             | 60000                |
| Aviso de truncamiento (`off`\|`once`\|`always`) | `agents.defaults.bootstrapPromptTruncationWarning` | `always`             |

Los archivos ausentes inyectan un breve marcador de archivo ausente. Los recuentos detallados de contenido sin procesar e inyectado permanecen en diagnósticos como `/context`, `/status`, doctor y los registros.

En los archivos de memoria, el truncamiento no implica pérdida de datos: el archivo permanece intacto en el disco. En Codex nativo, `MEMORY.md` se lee bajo demanda mediante las herramientas de memoria cuando están disponibles, con una alternativa de prompt limitado en caso contrario. En otros entornos, el modelo solo ve la copia inyectada abreviada hasta que lee o busca directamente en la memoria. Si `MEMORY.md` se trunca repetidamente, condénselo en un resumen duradero más breve, traslade el historial detallado a `memory/*.md` o aumente deliberadamente los límites de los archivos de arranque.

Las sesiones de subagentes solo inyectan `AGENTS.md` y `TOOLS.md` (los demás archivos de arranque se filtran para mantener reducido el contexto del subagente).

Los hooks internos pueden interceptar este paso mediante el evento `agent:bootstrap` para modificar o reemplazar los archivos de arranque inyectados (por ejemplo, sustituir `SOUL.md` por una personalidad alternativa).

Para sonar menos genérico, comienza con la [guía de personalidad de SOUL.md](/es/concepts/soul).

Para inspeccionar cuánto aporta cada archivo inyectado (contenido sin procesar frente al inyectado, truncamiento y sobrecarga del esquema de herramientas), usa `/context list` o `/context detail`. Consulta [Contexto](/es/concepts/context).

## Gestión del tiempo

La sección **Fecha y hora actuales** solo aparece cuando se conoce la zona horaria del usuario e incluye únicamente la **zona horaria** (sin reloj dinámico ni formato de hora) para mantener estable la caché del prompt.

Usa `session_status` cuando el agente necesite la hora actual; su tarjeta de estado incluye una línea con la marca de tiempo. La misma herramienta puede establecer opcionalmente una sustitución del modelo por sesión (`model=default` la elimina).

Configúralo con:

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

Consulta [Zonas horarias](/es/concepts/timezone) y [Fecha y hora](/es/date-time) para conocer todos los detalles del comportamiento.

## Skills

Cuando existen Skills aptas, OpenClaw inyecta una lista compacta `<available_skills>` (`formatSkillsForPrompt`) con la **ruta del archivo** y un marcador `<version>sha256:...</version>` derivado del contenido para cada Skill. El prompt indica al modelo que use `read` para cargar el archivo SKILL.md de la ubicación indicada (del espacio de trabajo, administrada o incluida) y que vuelva a leer una Skill cuando su `<version>` difiera del turno anterior. Si no hay Skills aptas, se omite la sección Skills.

Los turnos nativos de Codex reciben esta lista como instrucciones de desarrollador de colaboración limitadas al turno, en lugar de como entrada del usuario en cada turno, excepto los turnos ligeros de cron, que conservan el prompt programado exacto. Los demás entornos de ejecución mantienen la sección normal del prompt.

La ubicación puede apuntar a una Skill anidada, como `skills/personal/foo/SKILL.md`. El anidamiento solo tiene fines organizativos; el prompt utiliza el nombre plano de la Skill definido en el frontmatter de `SKILL.md`.

La aptitud incluye las restricciones de los metadatos de la Skill, las comprobaciones del entorno y la configuración en tiempo de ejecución, y la lista efectiva de Skills permitidas del agente cuando se configura `agents.defaults.skills` o `agents.list[].skills`. Las Skills incluidas en Plugins solo son aptas cuando su Plugin propietario está habilitado, lo que permite que los Plugins de herramientas expongan guías operativas más detalladas sin incorporar toda esa orientación en la descripción de cada herramienta.

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

Esto mantiene reducido el prompt base y, al mismo tiempo, permite el uso específico de Skills. El subsistema de Skills gestiona el dimensionamiento, de forma independiente del dimensionamiento genérico de lectura e inyección en tiempo de ejecución:

| Ámbito     | Presupuesto del prompt de Skills                   | Presupuesto de extractos en tiempo de ejecución |
| ---------- | -------------------------------------------------- | ----------------------------------------------- |
| Global     | `skills.limits.maxSkillsPromptChars`               | `agents.defaults.contextLimits.*`               |
| Por agente | `agents.list[].skillsLimits.maxSkillsPromptChars`  | `agents.list[].contextLimits.*`                 |

El presupuesto de extractos en tiempo de ejecución abarca `memory_get`, los resultados de herramientas en vivo y las actualizaciones de `AGENTS.md` posteriores a la Compaction.

## Documentación

La sección **Documentación** apunta a la documentación local cuando está disponible (`docs/` en un repositorio de Git o la documentación incluida en el paquete npm) y, de lo contrario, recurre a [https://docs.openclaw.ai](https://docs.openclaw.ai). También indica la ubicación del código fuente de OpenClaw: los repositorios de Git muestran la raíz local del código fuente, mientras que las instalaciones mediante paquetes muestran la URL del código fuente en GitHub con instrucciones para revisarlo allí cuando la documentación esté incompleta o desactualizada.

El prompt presenta la documentación como la fuente autorizada para el conocimiento de OpenClaw sobre sí mismo antes de que el modelo comprenda cómo funciona OpenClaw (memoria/notas diarias, sesiones, herramientas, Gateway, configuración, comandos y contexto del proyecto) e indica al modelo que trate `AGENTS.md`, el contexto del proyecto, las notas del espacio de trabajo, del perfil y de la memoria, y `memory_search` como contexto de instrucciones o memoria del usuario, en lugar de como conocimiento sobre el diseño o la implementación de OpenClaw. Si la documentación no contiene información o está desactualizada, el modelo debe indicarlo e inspeccionar el código fuente. También indica al modelo que ejecute por sí mismo `openclaw status` cuando sea posible y que solo se lo solicite al usuario cuando no tenga acceso.

En lo referente específicamente a la configuración, dirige a los agentes a la acción `config.schema.lookup` de la herramienta `gateway` para obtener documentación y restricciones exactas de cada campo, y después a `docs/gateway/configuration.md` y `docs/gateway/configuration-reference.md` para obtener orientación más general.

## Temas relacionados

- [Entorno de ejecución del agente](/es/concepts/agent)
- [Espacio de trabajo del agente](/es/concepts/agent-workspace)
- [Motor de contexto](/es/concepts/context-engine)

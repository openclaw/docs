---
read_when:
    - Quieres trabajo en segundo plano o en paralelo mediante el agente
    - Estás cambiando sessions_spawn o la política de herramientas de subagentes
    - Está implementando o solucionando problemas de sesiones de subagentes vinculadas a hilos
sidebarTitle: Sub-agents
summary: Inicia ejecuciones aisladas de agentes en segundo plano que notifican los resultados en la conversación del solicitante
title: Subagentes
x-i18n:
    generated_at: "2026-04-30T06:06:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 84386ea706873cf9f2ea03261f916c8fb01304999f2d9fa86e037e734a62bf7e
    source_path: tools/subagents.md
    workflow: 16
---

Los subagentes son ejecuciones de agentes en segundo plano generadas desde una ejecución de agente existente.
Se ejecutan en su propia sesión (`agent:<agentId>:subagent:<uuid>`) y,
al finalizar, **anuncian** su resultado de vuelta al canal de chat
solicitante. Cada ejecución de subagente se registra como una
[tarea en segundo plano](/es/automation/tasks).

Objetivos principales:

- Paralelizar el trabajo de "investigación / tarea larga / herramienta lenta" sin bloquear la ejecución principal.
- Mantener los subagentes aislados de forma predeterminada (separación de sesiones + aislamiento opcional).
- Mantener la superficie de herramientas difícil de usar incorrectamente: los subagentes **no** reciben herramientas de sesión de forma predeterminada.
- Admitir profundidad de anidamiento configurable para patrones de orquestador.

<Note>
**Nota de costo:** cada subagente tiene su propio contexto y uso de tokens de forma
predeterminada. Para tareas pesadas o repetitivas, configura un modelo más económico para los subagentes
y mantén tu agente principal en un modelo de mayor calidad. Configura mediante
`agents.defaults.subagents.model` o sobrescrituras por agente. Cuando un hijo
realmente necesita la transcripción actual del solicitante, el agente puede solicitar
`context: "fork"` en esa generación específica.
</Note>

## Comando de barra

Usa `/subagents` para inspeccionar o controlar ejecuciones de subagentes para la **sesión
actual**:

```text
/subagents list
/subagents kill <id|#|all>
/subagents log <id|#> [limit] [tools]
/subagents info <id|#>
/subagents send <id|#> <message>
/subagents steer <id|#> <message>
/subagents spawn <agentId> <task> [--model <model>] [--thinking <level>]
```

`/subagents info` muestra metadatos de ejecución (estado, marcas de tiempo, id de sesión,
ruta de transcripción, limpieza). Usa `sessions_history` para una vista de recuperación
acotada y filtrada por seguridad; inspecciona la ruta de transcripción en disco cuando
necesites la transcripción completa sin procesar.

### Controles de vinculación de hilos

Estos comandos funcionan en canales que admiten vinculaciones persistentes de hilos.
Consulta [Canales que admiten hilos](#thread-supporting-channels) abajo.

```text
/focus <subagent-label|session-key|session-id|session-label>
/unfocus
/agents
/session idle <duration|off>
/session max-age <duration|off>
```

### Comportamiento de generación

`/subagents spawn` inicia un subagente en segundo plano como comando de usuario (no como
retransmisión interna) y envía una actualización final de finalización de vuelta al
chat solicitante cuando termina la ejecución.

<AccordionGroup>
  <Accordion title="Finalización no bloqueante basada en push">
    - El comando de generación no bloquea; devuelve un id de ejecución inmediatamente.
    - Al finalizar, el subagente anuncia un mensaje de resumen/resultado de vuelta al canal de chat solicitante.
    - La finalización se basa en push. Una vez generado, **no** sondees `/subagents list`, `sessions_list` ni `sessions_history` en un bucle solo para esperar a que termine; inspecciona el estado solo bajo demanda para depuración o intervención.
    - Al finalizar, OpenClaw cierra con el mejor esfuerzo las pestañas/procesos de navegador registrados que abrió esa sesión de subagente antes de que continúe el flujo de limpieza del anuncio.

  </Accordion>
  <Accordion title="Resiliencia de entrega de generación manual">
    - OpenClaw intenta primero la entrega directa de `agent` con una clave de idempotencia estable.
    - Si la entrega directa falla, recurre al enrutamiento por cola.
    - Si el enrutamiento por cola aún no está disponible, el anuncio se reintenta con un retroceso exponencial corto antes de abandonar definitivamente.
    - La entrega de finalización conserva la ruta resuelta del solicitante: las rutas de finalización vinculadas a hilo o vinculadas a conversación prevalecen cuando están disponibles; si el origen de finalización solo proporciona un canal, OpenClaw rellena el destino/cuenta faltante desde la ruta resuelta de la sesión solicitante (`lastChannel` / `lastTo` / `lastAccountId`) para que la entrega directa siga funcionando.

  </Accordion>
  <Accordion title="Metadatos de traspaso de finalización">
    El traspaso de finalización a la sesión solicitante es contexto interno generado en tiempo de ejecución
    (no texto escrito por el usuario) e incluye:

    - `Result` — el texto de la respuesta visible más reciente de `assistant`; de lo contrario, el texto saneado más reciente de herramienta/toolResult. Las ejecuciones fallidas terminales no reutilizan texto de respuesta capturado.
    - `Status` — `completed successfully` / `failed` / `timed out` / `unknown`.
    - Estadísticas compactas de tiempo de ejecución/tokens.
    - Una instrucción de entrega que indica al agente solicitante que reescriba con voz normal de asistente (sin reenviar metadatos internos sin procesar).

  </Accordion>
  <Accordion title="Modos y tiempo de ejecución ACP">
    - `--model` y `--thinking` sobrescriben los valores predeterminados para esa ejecución específica.
    - Usa `info`/`log` para inspeccionar detalles y salida después de la finalización.
    - `/subagents spawn` es modo de un solo uso (`mode: "run"`). Para sesiones persistentes vinculadas a hilos, usa `sessions_spawn` con `thread: true` y `mode: "session"`.
    - Para sesiones de arnés ACP (Claude Code, Gemini CLI, OpenCode, o Codex ACP/acpx explícito), usa `sessions_spawn` con `runtime: "acp"` cuando la herramienta anuncie ese tiempo de ejecución. Consulta el [modelo de entrega ACP](/es/tools/acp-agents#delivery-model) al depurar finalizaciones o bucles de agente a agente. Cuando el Plugin `codex` está habilitado, el control de chat/hilo de Codex debe preferir `/codex ...` sobre ACP salvo que el usuario solicite explícitamente ACP/acpx.
    - OpenClaw oculta `runtime: "acp"` hasta que ACP está habilitado, el solicitante no está aislado y se ha cargado un Plugin de backend como `acpx`. `runtime: "acp"` espera un id de arnés ACP externo, o una entrada `agents.list[]` con `runtime.type="acp"`; usa el tiempo de ejecución predeterminado de subagente para agentes de configuración normal de OpenClaw desde `agents_list`.

  </Accordion>
</AccordionGroup>

## Modos de contexto

Los subagentes nativos empiezan aislados salvo que el llamador solicite explícitamente bifurcar
la transcripción actual.

| Modo       | Cuándo usarlo                                                                                                                         | Comportamiento                                                                          |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `isolated` | Investigación nueva, implementación independiente, trabajo con herramientas lentas o cualquier cosa que pueda describirse en el texto de la tarea                           | Crea una transcripción hija limpia. Este es el valor predeterminado y mantiene menor el uso de tokens.  |
| `fork`     | Trabajo que depende de la conversación actual, resultados previos de herramientas o instrucciones matizadas ya presentes en la transcripción del solicitante | Ramifica la transcripción del solicitante hacia la sesión hija antes de que el hijo empiece. |

Usa `fork` con moderación. Es para delegación sensible al contexto, no un
reemplazo de escribir una indicación de tarea clara.

## Herramienta: `sessions_spawn`

Inicia una ejecución de subagente con `deliver: false` en el carril global `subagent`,
luego ejecuta un paso de anuncio y publica la respuesta de anuncio en el canal de chat
solicitante.

La disponibilidad depende de la política efectiva de herramientas del llamador. Los perfiles `coding` y
`full` exponen `sessions_spawn` de forma predeterminada. El perfil `messaging`
no lo hace; agrega `tools.alsoAllow: ["sessions_spawn", "sessions_yield",
"subagents"]` o usa `tools.profile: "coding"` para agentes que deban delegar
trabajo. Las políticas de canal/grupo, proveedor, aislamiento y allow/deny por agente
aún pueden quitar la herramienta después de la etapa de perfil. Usa `/tools` desde la misma
sesión para confirmar la lista efectiva de herramientas.

**Valores predeterminados:**

- **Modelo:** hereda el del llamador salvo que configures `agents.defaults.subagents.model` (o `agents.list[].subagents.model` por agente); un `sessions_spawn.model` explícito sigue teniendo prioridad.
- **Thinking:** hereda el del llamador salvo que configures `agents.defaults.subagents.thinking` (o `agents.list[].subagents.thinking` por agente); un `sessions_spawn.thinking` explícito sigue teniendo prioridad.
- **Tiempo de espera de ejecución:** si se omite `sessions_spawn.runTimeoutSeconds`, OpenClaw usa `agents.defaults.subagents.runTimeoutSeconds` cuando está configurado; de lo contrario, recurre a `0` (sin tiempo de espera).

### Parámetros de herramienta

<ParamField path="task" type="string" required>
  La descripción de la tarea para el subagente.
</ParamField>
<ParamField path="label" type="string">
  Etiqueta legible opcional.
</ParamField>
<ParamField path="agentId" type="string">
  Genera bajo otro id de agente cuando `subagents.allowAgents` lo permite.
</ParamField>
<ParamField path="runtime" type='"subagent" | "acp"' default="subagent">
  `acp` es solo para arneses ACP externos (`claude`, `droid`, `gemini`, `opencode` o Codex ACP/acpx solicitado explícitamente) y para entradas `agents.list[]` cuyo `runtime.type` sea `acp`.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  Solo ACP. Reanuda una sesión existente de arnés ACP cuando `runtime: "acp"`; se ignora para generaciones nativas de subagentes.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  Solo ACP. Transmite la salida de ejecución ACP a la sesión padre cuando `runtime: "acp"`; omítelo para generaciones nativas de subagentes.
</ParamField>
<ParamField path="model" type="string">
  Sobrescribe el modelo del subagente. Los valores no válidos se omiten y el subagente se ejecuta en el modelo predeterminado con una advertencia en el resultado de la herramienta.
</ParamField>
<ParamField path="thinking" type="string">
  Sobrescribe el nivel de pensamiento para la ejecución del subagente.
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  De forma predeterminada usa `agents.defaults.subagents.runTimeoutSeconds` cuando está configurado; de lo contrario, `0`. Cuando está configurado, la ejecución del subagente se aborta después de N segundos.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Cuando es `true`, solicita vinculación de hilo de canal para esta sesión de subagente.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  Si `thread: true` y se omite `mode`, el valor predeterminado pasa a ser `session`. `mode: "session"` requiere `thread: true`.
</ParamField>
<ParamField path="cleanup" type='"delete" | "keep"' default="keep">
  `"delete"` archiva inmediatamente después del anuncio (aún conserva la transcripción mediante cambio de nombre).
</ParamField>
<ParamField path="sandbox" type='"inherit" | "require"' default="inherit">
  `require` rechaza la generación salvo que el tiempo de ejecución hijo de destino esté aislado.
</ParamField>
<ParamField path="context" type='"isolated" | "fork"' default="isolated">
  `fork` ramifica la transcripción actual del solicitante hacia la sesión hija. Solo subagentes nativos. Usa `fork` solo cuando el hijo necesite la transcripción actual.
</ParamField>

<Warning>
`sessions_spawn` **no** acepta parámetros de entrega por canal (`target`,
`channel`, `to`, `threadId`, `replyTo`, `transport`). Para la entrega, usa
`message`/`sessions_send` desde la ejecución generada.
</Warning>

## Sesiones vinculadas a hilos

Cuando las vinculaciones de hilos están habilitadas para un canal, un subagente puede permanecer vinculado
a un hilo para que los mensajes de seguimiento del usuario en ese hilo sigan enrutándose a la
misma sesión de subagente.

### Canales que admiten hilos

**Discord** es actualmente el único canal compatible. Admite
sesiones persistentes de subagentes vinculadas a hilos (`sessions_spawn` con
`thread: true`), controles manuales de hilo (`/focus`, `/unfocus`, `/agents`,
`/session idle`, `/session max-age`) y claves de adaptador
`channels.discord.threadBindings.enabled`,
`channels.discord.threadBindings.idleHours`,
`channels.discord.threadBindings.maxAgeHours` y
`channels.discord.threadBindings.spawnSubagentSessions`.

### Flujo rápido

<Steps>
  <Step title="Generar">
    `sessions_spawn` con `thread: true` (y opcionalmente `mode: "session"`).
  </Step>
  <Step title="Vincular">
    OpenClaw crea o vincula un hilo a ese destino de sesión en el canal activo.
  </Step>
  <Step title="Enrutar seguimientos">
    Las respuestas y mensajes de seguimiento en ese hilo se enrutan a la sesión vinculada.
  </Step>
  <Step title="Inspeccionar tiempos de espera">
    Usa `/session idle` para inspeccionar/actualizar el auto-desenfoque por inactividad y
    `/session max-age` para controlar el límite máximo.
  </Step>
  <Step title="Desvincular">
    Usa `/unfocus` para desvincular manualmente.
  </Step>
</Steps>

### Controles manuales

| Comando            | Efecto                                                                |
| ------------------ | --------------------------------------------------------------------- |
| `/focus <target>`  | Vincula el hilo actual (o crea uno) a un destino de subagente/sesión |
| `/unfocus`         | Elimina la vinculación del hilo vinculado actual                       |
| `/agents`          | Enumera las ejecuciones activas y el estado de vinculación (`thread:<id>` o `unbound`)       |
| `/session idle`    | Inspecciona/actualiza el auto-desenfoque por inactividad (solo hilos vinculados enfocados)         |
| `/session max-age` | Inspecciona/actualiza el límite máximo estricto (solo hilos vinculados enfocados)                  |

### Interruptores de configuración

- **Valor predeterminado global:** `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
- **Las claves de anulación por canal y vinculación automática al crear** son específicas del adaptador. Consulta [Canales compatibles con hilos](#thread-supporting-channels) arriba.

Consulta [Referencia de configuración](/es/gateway/configuration-reference) y
[Comandos slash](/es/tools/slash-commands) para ver los detalles actuales del adaptador.

### Lista de permitidos

<ParamField path="agents.list[].subagents.allowAgents" type="string[]">
  Lista de ids de agentes que pueden seleccionarse mediante `agentId` explícito (`["*"]` permite cualquiera). Valor predeterminado: solo el agente solicitante. Si defines una lista y aun así quieres que el solicitante se cree a sí mismo con `agentId`, incluye el id del solicitante en la lista.
</ParamField>
<ParamField path="agents.defaults.subagents.allowAgents" type="string[]">
  Lista de permitidos predeterminada de agentes de destino que se usa cuando el agente solicitante no define su propio `subagents.allowAgents`.
</ParamField>
<ParamField path="agents.defaults.subagents.requireAgentId" type="boolean" default="false">
  Bloquea las llamadas a `sessions_spawn` que omiten `agentId` (fuerza la selección explícita de perfil). Anulación por agente: `agents.list[].subagents.requireAgentId`.
</ParamField>

Si la sesión solicitante está en sandbox, `sessions_spawn` rechaza destinos
que se ejecutarían sin sandbox.

### Descubrimiento

Usa `agents_list` para ver qué ids de agentes están permitidos actualmente para
`sessions_spawn`. La respuesta incluye el modelo efectivo de cada agente listado
y metadatos de runtime incrustados para que los llamadores puedan distinguir PI, el
servidor de aplicación de Codex y otros runtimes nativos configurados.

### Archivado automático

- Las sesiones de subagentes se archivan automáticamente después de `agents.defaults.subagents.archiveAfterMinutes` (valor predeterminado `60`).
- El archivado usa `sessions.delete` y cambia el nombre de la transcripción a `*.deleted.<timestamp>` (misma carpeta).
- `cleanup: "delete"` archiva inmediatamente después del anuncio (aun así conserva la transcripción mediante el cambio de nombre).
- El archivado automático es de mejor esfuerzo; los temporizadores pendientes se pierden si el Gateway se reinicia.
- `runTimeoutSeconds` **no** archiva automáticamente; solo detiene la ejecución. La sesión permanece hasta el archivado automático.
- El archivado automático se aplica por igual a sesiones de profundidad 1 y profundidad 2.
- La limpieza del navegador es independiente de la limpieza de archivado: las pestañas/procesos del navegador rastreados se cierran en modalidad de mejor esfuerzo cuando termina la ejecución, incluso si se conserva el registro de transcripción/sesión.

## Subagentes anidados

De forma predeterminada, los subagentes no pueden crear sus propios subagentes
(`maxSpawnDepth: 1`). Define `maxSpawnDepth: 2` para habilitar un nivel de
anidamiento — el **patrón de orquestador**: principal → subagente orquestador →
subsubagentes trabajadores.

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxSpawnDepth: 2, // allow sub-agents to spawn children (default: 1)
        maxChildrenPerAgent: 5, // max active children per agent session (default: 5)
        maxConcurrent: 8, // global concurrency lane cap (default: 8)
        runTimeoutSeconds: 900, // default timeout for sessions_spawn when omitted (0 = no timeout)
      },
    },
  },
}
```

### Niveles de profundidad

| Profundidad | Forma de la clave de sesión                   | Rol                                           | ¿Puede crear?                |
| ----- | -------------------------------------------- | --------------------------------------------- | ---------------------------- |
| 0     | `agent:<id>:main`                            | Agente principal                              | Siempre                      |
| 1     | `agent:<id>:subagent:<uuid>`                 | Subagente (orquestador cuando se permite profundidad 2) | Solo si `maxSpawnDepth >= 2` |
| 2     | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | Subsubagente (trabajador hoja)                | Nunca                        |

### Cadena de anuncio

Los resultados fluyen de vuelta por la cadena:

1. El trabajador de profundidad 2 termina → anuncia a su padre (orquestador de profundidad 1).
2. El orquestador de profundidad 1 recibe el anuncio, sintetiza resultados, termina → anuncia al principal.
3. El agente principal recibe el anuncio y lo entrega al usuario.

Cada nivel solo ve anuncios de sus hijos directos.

<Note>
**Guía operativa:** inicia el trabajo hijo una vez y espera eventos de finalización
en lugar de construir bucles de sondeo alrededor de `sessions_list`,
`sessions_history`, `/subagents list` o comandos `exec` con sleep.
`sessions_list` y `/subagents list` mantienen las relaciones de sesiones hijas
enfocadas en el trabajo activo: los hijos activos permanecen adjuntos, los hijos finalizados siguen
visibles durante una ventana reciente breve, y los enlaces de hijos obsoletos solo en el almacén se
ignoran después de su ventana de frescura. Esto evita que metadatos antiguos de `spawnedBy` /
`parentSessionKey` resuciten hijos fantasma después de un
reinicio. Si llega un evento de finalización de hijo después de que ya enviaste la
respuesta final, el seguimiento correcto es el token silencioso exacto
`NO_REPLY` / `no_reply`.
</Note>

### Política de herramientas por profundidad

- El rol y el alcance de control se escriben en los metadatos de sesión en el momento de creación. Eso evita que claves de sesión planas o restauradas recuperen accidentalmente privilegios de orquestador.
- **Profundidad 1 (orquestador, cuando `maxSpawnDepth >= 2`):** obtiene `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history` para poder administrar sus hijos. Otras herramientas de sesión/sistema permanecen denegadas.
- **Profundidad 1 (hoja, cuando `maxSpawnDepth == 1`):** sin herramientas de sesión (comportamiento predeterminado actual).
- **Profundidad 2 (trabajador hoja):** sin herramientas de sesión — `sessions_spawn` siempre se deniega en profundidad 2. No puede crear más hijos.

### Límite de creación por agente

Cada sesión de agente (a cualquier profundidad) puede tener como máximo `maxChildrenPerAgent`
(valor predeterminado `5`) hijos activos a la vez. Esto evita una expansión descontrolada
desde un único orquestador.

### Detención en cascada

Detener un orquestador de profundidad 1 detiene automáticamente todos sus
hijos de profundidad 2:

- `/stop` en el chat principal detiene todos los agentes de profundidad 1 y se propaga en cascada a sus hijos de profundidad 2.
- `/subagents kill <id>` detiene un subagente específico y se propaga en cascada a sus hijos.
- `/subagents kill all` detiene todos los subagentes del solicitante y se propaga en cascada.

## Autenticación

La autenticación de subagentes se resuelve por **id de agente**, no por tipo de sesión:

- La clave de sesión del subagente es `agent:<agentId>:subagent:<uuid>`.
- El almacén de autenticación se carga desde el `agentDir` de ese agente.
- Los perfiles de autenticación del agente principal se fusionan como **respaldo**; los perfiles del agente anulan los perfiles principales en caso de conflicto.

La fusión es aditiva, por lo que los perfiles principales siempre están disponibles como
respaldos. La autenticación completamente aislada por agente aún no está admitida.

## Anuncio

Los subagentes informan de vuelta mediante un paso de anuncio:

- El paso de anuncio se ejecuta dentro de la sesión del subagente (no en la sesión solicitante).
- Si el subagente responde exactamente `ANNOUNCE_SKIP`, no se publica nada.
- Si el último texto del asistente es el token silencioso exacto `NO_REPLY` / `no_reply`, la salida del anuncio se suprime incluso si antes existía progreso visible.

La entrega depende de la profundidad del solicitante:

- Las sesiones solicitantes de nivel superior usan una llamada de seguimiento `agent` con entrega externa (`deliver=true`).
- Las sesiones de subagente solicitante anidadas reciben una inyección interna de seguimiento (`deliver=false`) para que el orquestador pueda sintetizar los resultados de los hijos en la sesión.
- Si una sesión de subagente solicitante anidada desaparece, OpenClaw recurre al solicitante de esa sesión cuando está disponible.

Para las sesiones solicitantes de nivel superior, la entrega directa en modo finalización primero
resuelve cualquier ruta de conversación/hilo vinculada y anulación de hook, luego rellena
los campos de destino de canal faltantes desde la ruta almacenada de la sesión solicitante.
Eso mantiene las finalizaciones en el chat/tema correcto incluso cuando el origen de la
finalización solo identifica el canal.

La agregación de finalización de hijos se limita a la ejecución solicitante actual al
construir hallazgos de finalización anidados, lo que impide que salidas de hijos de ejecuciones
anteriores obsoletas se filtren en el anuncio actual. Las respuestas de anuncio conservan
el enrutamiento de hilo/tema cuando está disponible en los adaptadores de canal.

### Contexto del anuncio

El contexto del anuncio se normaliza a un bloque de evento interno estable:

| Campo          | Origen                                                                                                        |
| -------------- | ------------------------------------------------------------------------------------------------------------- |
| Origen         | `subagent` o `cron`                                                                                          |
| Ids de sesión  | Clave/id de sesión hija                                                                                       |
| Tipo           | Tipo de anuncio + etiqueta de tarea                                                                           |
| Estado         | Derivado del resultado del runtime (`success`, `error`, `timeout` o `unknown`) — **no** inferido del texto del modelo |
| Contenido del resultado | Último texto visible del asistente; si no existe, último texto de herramienta/toolResult saneado       |
| Seguimiento    | Instrucción que describe cuándo responder frente a permanecer en silencio                                     |

Las ejecuciones fallidas terminales informan estado de fallo sin reproducir el
texto de respuesta capturado. En timeout, si el hijo solo llegó a llamadas de herramientas,
el anuncio puede colapsar ese historial en un breve resumen de progreso parcial en lugar
de reproducir la salida sin procesar de la herramienta.

### Línea de estadísticas

Las cargas de anuncio incluyen una línea de estadísticas al final (incluso cuando están envueltas):

- Runtime (p. ej. `runtime 5m12s`).
- Uso de tokens (entrada/salida/total).
- Costo estimado cuando el precio del modelo está configurado (`models.providers.*.models[].cost`).
- `sessionKey`, `sessionId` y ruta de transcripción para que el agente principal pueda obtener el historial mediante `sessions_history` o inspeccionar el archivo en disco.

Los metadatos internos están pensados solo para la orquestación; las respuestas orientadas al usuario
deben reescribirse con una voz normal de asistente.

### Por qué preferir `sessions_history`

`sessions_history` es la ruta de orquestación más segura:

- La recuperación del asistente se normaliza primero: se eliminan etiquetas de pensamiento; se elimina el andamiaje `<relevant-memories>` / `<relevant_memories>`; se eliminan los bloques de payload XML de llamadas a herramientas en texto plano (`<tool_call>`, `<function_call>`, `<tool_calls>`, `<function_calls>`), incluidos payloads truncados que nunca cierran correctamente; se elimina el andamiaje degradado de llamada/resultado de herramienta y los marcadores de contexto histórico; se eliminan tokens de control filtrados del modelo (`<|assistant|>`, otros ASCII `<|...|>`, ancho completo `<｜...｜>`); se elimina XML malformado de llamadas a herramientas de MiniMax.
- Se redacta texto similar a credenciales/tokens.
- Los bloques largos pueden truncarse.
- Los historiales muy grandes pueden descartar filas antiguas o reemplazar una fila sobredimensionada con `[sessions_history omitted: message too large]`.
- La inspección de la transcripción sin procesar en disco es el respaldo cuando necesitas la transcripción completa byte por byte.

## Política de herramientas

Los subagentes usan primero el mismo perfil y la misma canalización de política de herramientas que el agente padre o
de destino. Después de eso, OpenClaw aplica la capa de restricción
de subagente.

Sin un `tools.profile` restrictivo, los subagentes obtienen **todas las herramientas excepto
herramientas de sesión** y herramientas del sistema:

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

`sessions_history` también sigue siendo aquí una vista de recuperación acotada y saneada:
no es un volcado de transcripción sin procesar.

Cuando `maxSpawnDepth >= 2`, los subagentes orquestadores de profundidad 1 además
reciben `sessions_spawn`, `subagents`, `sessions_list` y
`sessions_history` para que puedan administrar sus hijos.

### Anulación mediante configuración

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxConcurrent: 1,
      },
    },
  },
  tools: {
    subagents: {
      tools: {
        // deny wins
        deny: ["gateway", "cron"],
        // if allow is set, it becomes allow-only (deny still wins)
        // allow: ["read", "exec", "process"]
      },
    },
  },
}
```

`tools.subagents.tools.allow` es un filtro final de solo permitidos. Puede restringir
el conjunto de herramientas ya resuelto, pero no puede **volver a agregar** una herramienta eliminada
por `tools.profile`. Por ejemplo, `tools.profile: "coding"` incluye
`web_search`/`web_fetch`, pero no la herramienta `browser`. Para permitir que
los subagentes con perfil de codificación usen automatización del navegador, agrega `browser` en la
etapa de perfil:

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

Usa `agents.list[].tools.alsoAllow: ["browser"]` por agente cuando solo un
agente deba obtener automatización del navegador.

## Concurrencia

Los subagentes usan un carril de cola dedicado dentro del proceso:

- **Nombre del carril:** `subagent`
- **Concurrencia:** `agents.defaults.subagents.maxConcurrent` (valor predeterminado `8`)

## Actividad y recuperación

OpenClaw no trata la ausencia de `endedAt` como prueba permanente de que un
subagente sigue activo. Las ejecuciones sin finalizar anteriores a la ventana de ejecuciones obsoletas
dejan de contar como activas/pendientes en `/subagents list`, los resúmenes de estado,
el control de finalización de descendientes y las comprobaciones de concurrencia por sesión.

Después de reiniciar el Gateway, las ejecuciones restauradas obsoletas y sin finalizar se depuran salvo que
su sesión secundaria esté marcada como `abortedLastRun: true`. Esas
sesiones secundarias abortadas por reinicio siguen siendo recuperables mediante el flujo de recuperación de huérfanos de subagente, que envía un mensaje sintético de reanudación antes de
borrar el marcador de abortado.

<Note>
Si la creación de un subagente falla con Gateway `PAIRING_REQUIRED` /
`scope-upgrade`, comprueba el llamador RPC antes de editar el estado de emparejamiento.
La coordinación interna de `sessions_spawn` debe conectarse como
`client.id: "gateway-client"` con `client.mode: "backend"` mediante autenticación directa
por loopback con token compartido/contraseña; esa ruta no depende de la
línea base de alcance de dispositivo emparejado de la CLI. Los llamadores remotos, `deviceIdentity`
explícito, las rutas explícitas de token de dispositivo y los clientes de navegador/Node
siguen necesitando la aprobación normal del dispositivo para las ampliaciones de alcance.
</Note>

## Detención

- Enviar `/stop` en el chat solicitante aborta la sesión solicitante y detiene cualquier ejecución activa de subagente creada desde ella, con propagación a los descendientes anidados.
- `/subagents kill <id>` detiene un subagente específico y se propaga a sus descendientes.

## Limitaciones

- El anuncio de subagente es **de mejor esfuerzo**. Si el gateway se reinicia, se pierde el trabajo pendiente de "anunciar de vuelta".
- Los subagentes siguen compartiendo los mismos recursos del proceso del gateway; trata `maxConcurrent` como una válvula de seguridad.
- `sessions_spawn` siempre es no bloqueante: devuelve `{ status: "accepted", runId, childSessionKey }` de inmediato.
- El contexto de subagente solo inyecta `AGENTS.md` + `TOOLS.md` (sin `SOUL.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` ni `BOOTSTRAP.md`).
- La profundidad máxima de anidamiento es 5 (rango de `maxSpawnDepth`: 1–5). Se recomienda una profundidad de 2 para la mayoría de los casos de uso.
- `maxChildrenPerAgent` limita los descendientes activos por sesión (valor predeterminado `5`, rango `1–20`).

## Relacionado

- [Agentes ACP](/es/tools/acp-agents)
- [Envío al agente](/es/tools/agent-send)
- [Tareas en segundo plano](/es/automation/tasks)
- [Herramientas de sandbox multiagente](/es/tools/multi-agent-sandbox-tools)

---
read_when:
    - Quieres trabajo en segundo plano o en paralelo mediante el agente
    - Está cambiando sessions_spawn o la política de herramientas de subagentes
    - Está implementando o solucionando problemas de sesiones de subagente vinculadas a un hilo
sidebarTitle: Sub-agents
summary: Inicia ejecuciones de agentes aisladas en segundo plano que anuncian los resultados de vuelta en el chat del solicitante
title: Subagentes
x-i18n:
    generated_at: "2026-05-07T13:25:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5b112f9c45bcb9cdc5d3b856f2fe2a36617606ad278b0ccc3db8830f0e847ba9
    source_path: tools/subagents.md
    workflow: 16
---

Los subagentes son ejecuciones de agentes en segundo plano generadas a partir de una ejecución de agente existente.
Se ejecutan en su propia sesión (`agent:<agentId>:subagent:<uuid>`) y,
al finalizar, **anuncian** su resultado de vuelta al canal de chat
solicitante. Cada ejecución de subagente se rastrea como una
[tarea en segundo plano](/es/automation/tasks).

Objetivos principales:

- Paralelizar trabajo de "investigación / tarea larga / herramienta lenta" sin bloquear la ejecución principal.
- Mantener los subagentes aislados de forma predeterminada (separación de sesión + aislamiento opcional).
- Hacer que la superficie de herramientas sea difícil de usar mal: los subagentes **no** reciben herramientas de sesión de forma predeterminada.
- Admitir profundidad de anidamiento configurable para patrones de orquestador.

<Note>
**Nota de costo:** cada subagente tiene su propio contexto y uso de tokens de forma predeterminada. Para tareas pesadas o repetitivas, configura un modelo más económico para los subagentes y mantén tu agente principal en un modelo de mayor calidad. Configúralo mediante `agents.defaults.subagents.model` o anulaciones por agente. Cuando un hijo necesite realmente la transcripción actual del solicitante, el agente puede solicitar `context: "fork"` en esa generación específica. Las sesiones de subagente vinculadas a hilos usan `context: "fork"` de forma predeterminada porque ramifican la conversación actual en un hilo de seguimiento.
</Note>

## Comando de barra

Usa `/subagents` para inspeccionar o controlar ejecuciones de subagente para la **sesión actual**:

```text
/subagents list
/subagents kill <id|#|all>
/subagents log <id|#> [limit] [tools]
/subagents info <id|#>
/subagents send <id|#> <message>
/subagents steer <id|#> <message>
/subagents spawn <agentId> <task> [--model <model>] [--thinking <level>]
```

Usa [`/steer <message>`](/es/tools/steer) de nivel superior para orientar la ejecución activa de la sesión solicitante actual. Usa `/subagents steer <id|#> <message>` cuando el destino sea una ejecución hija.

`/subagents info` muestra metadatos de ejecución (estado, marcas de tiempo, id de sesión,
ruta de transcripción, limpieza). Usa `sessions_history` para una vista de recuperación limitada y filtrada por seguridad; inspecciona la ruta de transcripción en disco cuando necesites la transcripción completa sin procesar.

### Controles de vinculación a hilos

Estos comandos funcionan en canales que admiten vinculaciones persistentes de hilos.
Consulta [Canales compatibles con hilos](#thread-supporting-channels) abajo.

```text
/focus <subagent-label|session-key|session-id|session-label>
/unfocus
/agents
/session idle <duration|off>
/session max-age <duration|off>
```

### Comportamiento de generación

`/subagents spawn` inicia un subagente en segundo plano como comando de usuario (no como retransmisión interna) y envía una actualización final de finalización de vuelta al chat del solicitante cuando la ejecución termina.

<AccordionGroup>
  <Accordion title="Non-blocking, push-based completion">
    - El comando de generación no bloquea; devuelve un id de ejecución inmediatamente.
    - Al finalizar, el subagente anuncia un mensaje de resumen/resultado de vuelta al canal de chat solicitante.
    - La finalización se basa en push. Una vez generado, no sondees `/subagents list`, `sessions_list` ni `sessions_history` en un bucle solo para esperar a que termine; inspecciona el estado solo bajo demanda para depuración o intervención.
    - Al finalizar, OpenClaw cierra en modo de mejor esfuerzo las pestañas/procesos de navegador rastreados que abrió esa sesión de subagente antes de que continúe el flujo de limpieza del anuncio.

  </Accordion>
  <Accordion title="Manual-spawn delivery resilience">
    - OpenClaw entrega las finalizaciones de vuelta a la sesión solicitante mediante un turno `agent` con una clave de idempotencia estable.
    - Si la ejecución solicitante sigue activa, OpenClaw primero intenta despertar/orientar esa ejecución en lugar de iniciar una segunda ruta de respuesta visible.
    - Si la entrega de finalización al agente solicitante falla o no produce salida visible, OpenClaw trata la entrega como fallida y recurre al enrutamiento/reintento por cola. No envía sin procesar el resultado del hijo directamente al chat externo.
    - Si no se puede usar la entrega directa, recurre al enrutamiento por cola.
    - Si el enrutamiento por cola aún no está disponible, el anuncio se reintenta con un breve retroceso exponencial antes del abandono final.
    - La entrega de finalización conserva la ruta resuelta del solicitante: las rutas de finalización vinculadas a hilo o vinculadas a conversación prevalecen cuando están disponibles; si el origen de finalización solo proporciona un canal, OpenClaw completa el destino/cuenta faltante desde la ruta resuelta de la sesión solicitante (`lastChannel` / `lastTo` / `lastAccountId`) para que la entrega directa aún funcione.

  </Accordion>
  <Accordion title="Completion handoff metadata">
    La entrega de finalización a la sesión solicitante es contexto interno generado en tiempo de ejecución (no texto escrito por el usuario) e incluye:

    - `Result` — texto de la respuesta `assistant` visible más reciente; si no, texto saneado de la herramienta/toolResult más reciente. Las ejecuciones terminales fallidas no reutilizan texto de respuesta capturado.
    - `Status` — `completed successfully` / `failed` / `timed out` / `unknown`.
    - Estadísticas compactas de tiempo de ejecución/tokens.
    - Una instrucción de entrega que indica al agente solicitante que reescriba con voz normal de asistente (sin reenviar metadatos internos sin procesar).

  </Accordion>
  <Accordion title="Modes and ACP runtime">
    - `--model` y `--thinking` anulan los valores predeterminados para esa ejecución específica.
    - Usa `info`/`log` para inspeccionar detalles y salida después de la finalización.
    - `/subagents spawn` es modo de una sola ejecución (`mode: "run"`). Para sesiones persistentes vinculadas a hilos, usa `sessions_spawn` con `thread: true` y `mode: "session"`.
    - Para sesiones de arnés ACP (Claude Code, Gemini CLI, OpenCode, o Codex ACP/acpx explícito), usa `sessions_spawn` con `runtime: "acp"` cuando la herramienta anuncie ese runtime. Consulta [modelo de entrega ACP](/es/tools/acp-agents#delivery-model) al depurar finalizaciones o bucles de agente a agente. Cuando el plugin `codex` está habilitado, el control de chat/hilo de Codex debe preferir `/codex ...` sobre ACP a menos que el usuario pida explícitamente ACP/acpx.
    - OpenClaw oculta `runtime: "acp"` hasta que ACP esté habilitado, el solicitante no esté aislado y se cargue un Plugin de backend como `acpx`. `runtime: "acp"` espera un id de arnés ACP externo, o una entrada `agents.list[]` con `runtime.type="acp"`; usa el runtime predeterminado de subagente para agentes de configuración normales de OpenClaw desde `agents_list`.

  </Accordion>
</AccordionGroup>

## Modos de contexto

Los subagentes nativos comienzan aislados a menos que el llamador solicite explícitamente bifurcar la transcripción actual.

| Modo       | Cuándo usarlo                                                                                                                         | Comportamiento                                                                          |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `isolated` | Investigación nueva, implementación independiente, trabajo con herramientas lentas o cualquier cosa que pueda resumirse en el texto de la tarea                           | Crea una transcripción hija limpia. Este es el valor predeterminado y mantiene menor el uso de tokens.  |
| `fork`     | Trabajo que depende de la conversación actual, resultados previos de herramientas o instrucciones matizadas ya presentes en la transcripción del solicitante | Ramifica la transcripción del solicitante en la sesión hija antes de que el hijo comience. |

Usa `fork` con moderación. Es para delegación sensible al contexto, no un reemplazo de escribir un prompt de tarea claro.

## Herramienta: `sessions_spawn`

Inicia una ejecución de subagente con `deliver: false` en el carril global `subagent`,
luego ejecuta un paso de anuncio y publica la respuesta de anuncio en el canal de chat solicitante.

La disponibilidad depende de la política de herramientas efectiva del llamador. Los perfiles `coding` y
`full` exponen `sessions_spawn` de forma predeterminada. El perfil `messaging`
no lo hace; agrega `tools.alsoAllow: ["sessions_spawn", "sessions_yield",
"subagents"]` o usa `tools.profile: "coding"` para agentes que deban delegar
trabajo. Las políticas de canal/grupo, proveedor, aislamiento y allow/deny por agente aún pueden eliminar la herramienta después de la etapa de perfil. Usa `/tools` desde la misma sesión para confirmar la lista de herramientas efectiva.

**Valores predeterminados:**

- **Modelo:** hereda el del llamador a menos que configures `agents.defaults.subagents.model` (o `agents.list[].subagents.model` por agente); un `sessions_spawn.model` explícito sigue teniendo prioridad.
- **Thinking:** hereda el del llamador a menos que configures `agents.defaults.subagents.thinking` (o `agents.list[].subagents.thinking` por agente); un `sessions_spawn.thinking` explícito sigue teniendo prioridad.
- **Tiempo de espera de ejecución:** si se omite `sessions_spawn.runTimeoutSeconds`, OpenClaw usa `agents.defaults.subagents.runTimeoutSeconds` cuando está definido; de lo contrario, recurre a `0` (sin tiempo de espera).

### Parámetros de herramienta

<ParamField path="task" type="string" required>
  La descripción de la tarea para el subagente.
</ParamField>
<ParamField path="label" type="string">
  Etiqueta opcional legible por humanos.
</ParamField>
<ParamField path="agentId" type="string">
  Generar bajo otro id de agente cuando `subagents.allowAgents` lo permita.
</ParamField>
<ParamField path="runtime" type='"subagent" | "acp"' default="subagent">
  `acp` es solo para arneses ACP externos (`claude`, `droid`, `gemini`, `opencode` o Codex ACP/acpx solicitado explícitamente) y para entradas `agents.list[]` cuyo `runtime.type` sea `acp`.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  Solo ACP. Reanuda una sesión de arnés ACP existente cuando `runtime: "acp"`; se ignora para generaciones de subagentes nativos.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  Solo ACP. Transmite la salida de ejecución ACP a la sesión padre cuando `runtime: "acp"`; omítelo para generaciones de subagentes nativos.
</ParamField>
<ParamField path="model" type="string">
  Anula el modelo del subagente. Los valores no válidos se omiten y el subagente se ejecuta en el modelo predeterminado con una advertencia en el resultado de la herramienta.
</ParamField>
<ParamField path="thinking" type="string">
  Anula el nivel de thinking para la ejecución del subagente.
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  El valor predeterminado es `agents.defaults.subagents.runTimeoutSeconds` cuando está definido; de lo contrario, `0`. Cuando está definido, la ejecución del subagente se aborta después de N segundos.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Cuando es `true`, solicita vinculación a hilo de canal para esta sesión de subagente.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  Si `thread: true` y se omite `mode`, el valor predeterminado pasa a ser `session`. `mode: "session"` requiere `thread: true`.
</ParamField>
<ParamField path="cleanup" type='"delete" | "keep"' default="keep">
  `"delete"` archiva inmediatamente después del anuncio (aún conserva la transcripción mediante renombrado).
</ParamField>
<ParamField path="sandbox" type='"inherit" | "require"' default="inherit">
  `require` rechaza la generación a menos que el runtime hijo de destino esté aislado.
</ParamField>
<ParamField path="context" type='"isolated" | "fork"' default="isolated">
  `fork` ramifica la transcripción actual del solicitante en la sesión hija. Solo subagentes nativos. Las generaciones vinculadas a hilos usan `fork` de forma predeterminada; las generaciones sin hilo usan `isolated` de forma predeterminada.
</ParamField>

<Warning>
`sessions_spawn` **no** acepta parámetros de entrega por canal (`target`,
`channel`, `to`, `threadId`, `replyTo`, `transport`). Para la entrega, usa
`message`/`sessions_send` desde la ejecución generada.
</Warning>

## Sesiones vinculadas a hilos

Cuando las vinculaciones de hilos están habilitadas para un canal, un subagente puede permanecer vinculado
a un hilo para que los mensajes de usuario de seguimiento en ese hilo sigan enrutándose a la
misma sesión de subagente.

### Canales compatibles con hilos

**Discord** es actualmente el único canal compatible. Admite
sesiones persistentes de subagente vinculadas a hilos (`sessions_spawn` con
`thread: true`), controles manuales de hilo (`/focus`, `/unfocus`, `/agents`,
`/session idle`, `/session max-age`) y claves de adaptador
`channels.discord.threadBindings.enabled`,
`channels.discord.threadBindings.idleHours`,
`channels.discord.threadBindings.maxAgeHours`, y
`channels.discord.threadBindings.spawnSessions`.

### Flujo rápido

<Steps>
  <Step title="Spawn">
    `sessions_spawn` con `thread: true` (y opcionalmente `mode: "session"`).
  </Step>
  <Step title="Bind">
    OpenClaw crea o vincula un hilo a ese destino de sesión en el canal activo.
  </Step>
  <Step title="Route follow-ups">
    Las respuestas y los mensajes de seguimiento en ese hilo se enrutan a la sesión vinculada.
  </Step>
  <Step title="Inspect timeouts">
    Usa `/session idle` para inspeccionar/actualizar el desenfoque automático por inactividad y
    `/session max-age` para controlar el límite estricto.
  </Step>
  <Step title="Detach">
    Usa `/unfocus` para desvincular manualmente.
  </Step>
</Steps>

### Controles manuales

| Comando            | Efecto                                                                |
| ------------------ | --------------------------------------------------------------------- |
| `/focus <target>`  | Vincula el hilo actual (o crea uno) a un destino de subagente/sesión |
| `/unfocus`         | Elimina la vinculación del hilo vinculado actual                       |
| `/agents`          | Lista las ejecuciones activas y el estado de vinculación (`thread:<id>` o `unbound`)       |
| `/session idle`    | Inspecciona/actualiza el desenfoque automático por inactividad (solo hilos vinculados enfocados)         |
| `/session max-age` | Inspecciona/actualiza el límite estricto (solo hilos vinculados enfocados)                  |

### Conmutadores de configuración

- **Valor predeterminado global:** `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
- **Las claves de sobrescritura por canal y de vinculación automática al generar** son específicas del adaptador. Consulta [Canales compatibles con hilos](#thread-supporting-channels) arriba.

Consulta la [Referencia de configuración](/es/gateway/configuration-reference) y
[Comandos slash](/es/tools/slash-commands) para ver los detalles actuales del adaptador.

### Lista de permitidos

<ParamField path="agents.list[].subagents.allowAgents" type="string[]">
  Lista de ids de agente que pueden ser objetivo mediante `agentId` explícito (`["*"]` permite cualquiera). Valor predeterminado: solo el agente solicitante. Si configuras una lista y aún quieres que el solicitante se genere a sí mismo con `agentId`, incluye el id del solicitante en la lista.
</ParamField>
<ParamField path="agents.defaults.subagents.allowAgents" type="string[]">
  Lista de permitidos predeterminada de agentes destino usada cuando el agente solicitante no configura su propio `subagents.allowAgents`.
</ParamField>
<ParamField path="agents.defaults.subagents.requireAgentId" type="boolean" default="false">
  Bloquea las llamadas `sessions_spawn` que omiten `agentId` (fuerza la selección explícita de perfil). Sobrescritura por agente: `agents.list[].subagents.requireAgentId`.
</ParamField>

Si la sesión solicitante está en un sandbox, `sessions_spawn` rechaza destinos
que se ejecutarían sin sandbox.

### Descubrimiento

Usa `agents_list` para ver qué ids de agente están permitidos actualmente para
`sessions_spawn`. La respuesta incluye el modelo efectivo de cada agente listado
y los metadatos de entorno de ejecución incrustados para que los llamadores puedan distinguir PI, el servidor de aplicación de Codex
y otros entornos de ejecución nativos configurados.

### Archivado automático

- Las sesiones de subagente se archivan automáticamente después de `agents.defaults.subagents.archiveAfterMinutes` (valor predeterminado `60`).
- El archivo usa `sessions.delete` y renombra la transcripción a `*.deleted.<timestamp>` (misma carpeta).
- `cleanup: "delete"` archiva inmediatamente después del anuncio (aún conserva la transcripción mediante renombrado).
- El archivado automático es de mejor esfuerzo; los temporizadores pendientes se pierden si el Gateway se reinicia.
- `runTimeoutSeconds` **no** archiva automáticamente; solo detiene la ejecución. La sesión permanece hasta el archivado automático.
- El archivado automático se aplica por igual a sesiones de profundidad 1 y profundidad 2.
- La limpieza del navegador es independiente de la limpieza del archivo: las pestañas/procesos de navegador rastreados se cierran con mejor esfuerzo cuando termina la ejecución, incluso si se conserva el registro de transcripción/sesión.

## Subagentes anidados

De forma predeterminada, los subagentes no pueden generar sus propios subagentes
(`maxSpawnDepth: 1`). Configura `maxSpawnDepth: 2` para habilitar un nivel de
anidamiento: el **patrón de orquestador**: principal → subagente orquestador →
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

| Profundidad | Forma de la clave de sesión                  | Rol                                           | ¿Puede generar?              |
| ----- | -------------------------------------------- | --------------------------------------------- | ---------------------------- |
| 0     | `agent:<id>:main`                            | Agente principal                              | Siempre                      |
| 1     | `agent:<id>:subagent:<uuid>`                 | Subagente (orquestador cuando se permite profundidad 2) | Solo si `maxSpawnDepth >= 2` |
| 2     | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | Subsubagente (trabajador hoja)                | Nunca                        |

### Cadena de anuncios

Los resultados fluyen hacia arriba por la cadena:

1. El trabajador de profundidad 2 termina → anuncia a su padre (orquestador de profundidad 1).
2. El orquestador de profundidad 1 recibe el anuncio, sintetiza los resultados, termina → anuncia al principal.
3. El agente principal recibe el anuncio y lo entrega al usuario.

Cada nivel solo ve anuncios de sus hijos directos.

<Note>
**Guía operativa:** inicia el trabajo hijo una vez y espera eventos de
finalización en lugar de construir bucles de sondeo alrededor de `sessions_list`,
`sessions_history`, `/subagents list` o comandos `exec` de espera.
`sessions_list` y `/subagents list` mantienen las relaciones de sesiones hijas
enfocadas en trabajo activo: los hijos activos permanecen adjuntos, los hijos finalizados siguen
visibles durante una ventana reciente breve, y los enlaces de hijos obsoletos solo en el almacén se
ignoran después de su ventana de frescura. Esto evita que metadatos antiguos `spawnedBy` /
`parentSessionKey` resuciten hijos fantasma después de un
reinicio. Si llega un evento de finalización de hijo después de que ya enviaste la
respuesta final, el seguimiento correcto es el token silencioso exacto
`NO_REPLY` / `no_reply`.
</Note>

### Política de herramientas por profundidad

- El rol y el alcance de control se escriben en los metadatos de sesión al momento de la generación. Eso evita que claves de sesión planas o restauradas recuperen accidentalmente privilegios de orquestador.
- **Profundidad 1 (orquestador, cuando `maxSpawnDepth >= 2`):** recibe `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history` para poder gestionar sus hijos. Otras herramientas de sesión/sistema permanecen denegadas.
- **Profundidad 1 (hoja, cuando `maxSpawnDepth == 1`):** sin herramientas de sesión (comportamiento predeterminado actual).
- **Profundidad 2 (trabajador hoja):** sin herramientas de sesión; `sessions_spawn` siempre se deniega en profundidad 2. No puede generar más hijos.

### Límite de generación por agente

Cada sesión de agente (a cualquier profundidad) puede tener como máximo `maxChildrenPerAgent`
(valor predeterminado `5`) hijos activos a la vez. Esto evita una expansión descontrolada
desde un único orquestador.

### Detención en cascada

Detener un orquestador de profundidad 1 detiene automáticamente todos sus hijos de profundidad 2:

- `/stop` en el chat principal detiene todos los agentes de profundidad 1 y se propaga a sus hijos de profundidad 2.
- `/subagents kill <id>` detiene un subagente específico y se propaga a sus hijos.
- `/subagents kill all` detiene todos los subagentes del solicitante y se propaga.

## Autenticación

La autenticación de subagentes se resuelve por **id de agente**, no por tipo de sesión:

- La clave de sesión del subagente es `agent:<agentId>:subagent:<uuid>`.
- El almacén de autenticación se carga desde el `agentDir` de ese agente.
- Los perfiles de autenticación del agente principal se fusionan como **respaldo**; los perfiles de agente sobrescriben los perfiles principales en caso de conflicto.

La fusión es aditiva, por lo que los perfiles principales siempre están disponibles como
respaldos. La autenticación completamente aislada por agente aún no está soportada.

## Anuncio

Los subagentes informan de vuelta mediante un paso de anuncio:

- El paso de anuncio se ejecuta dentro de la sesión del subagente (no en la sesión solicitante).
- Si el subagente responde exactamente `ANNOUNCE_SKIP`, no se publica nada.
- Si el texto más reciente del asistente es el token silencioso exacto `NO_REPLY` / `no_reply`, la salida de anuncio se suprime incluso si antes existió progreso visible.

La entrega depende de la profundidad del solicitante:

- Las sesiones solicitantes de nivel superior usan una llamada de seguimiento `agent` con entrega externa (`deliver=true`).
- Las sesiones de subagente solicitante anidadas reciben una inyección de seguimiento interna (`deliver=false`) para que el orquestador pueda sintetizar los resultados hijos dentro de la sesión.
- Si una sesión de subagente solicitante anidada desaparece, OpenClaw recurre al solicitante de esa sesión cuando está disponible.

Para sesiones solicitantes de nivel superior, la entrega directa en modo finalización primero
resuelve cualquier ruta de conversación/hilo vinculada y sobrescritura de hook, y luego completa
los campos faltantes de destino de canal desde la ruta almacenada de la sesión solicitante.
Eso mantiene las finalizaciones en el chat/tema correcto incluso cuando el origen de la finalización
solo identifica el canal.

La agregación de finalización de hijos se limita a la ejecución solicitante actual al
crear hallazgos de finalización anidados, lo que evita que salidas hijas obsoletas de ejecuciones previas
se filtren al anuncio actual. Las respuestas de anuncio preservan
el enrutamiento de hilo/tema cuando está disponible en adaptadores de canal.

### Contexto de anuncio

El contexto de anuncio se normaliza a un bloque de evento interno estable:

| Campo          | Origen                                                                                                        |
| -------------- | ------------------------------------------------------------------------------------------------------------- |
| Origen         | `subagent` o `cron`                                                                                          |
| Ids de sesión  | Clave/id de sesión hija                                                                                          |
| Tipo           | Tipo de anuncio + etiqueta de tarea                                                                                    |
| Estado         | Derivado del resultado del entorno de ejecución (`success`, `error`, `timeout` o `unknown`), **no** inferido del texto del modelo |
| Contenido de resultado | Último texto visible del asistente; de lo contrario, último texto de herramienta/toolResult saneado                                |
| Seguimiento    | Instrucción que describe cuándo responder frente a permanecer en silencio                                                           |

Las ejecuciones terminales fallidas informan el estado de fallo sin reproducir el texto de
respuesta capturado. En tiempo de espera, si el hijo solo llegó a llamadas de herramientas, el anuncio
puede colapsar ese historial en un breve resumen de progreso parcial en lugar
de reproducir la salida de herramienta sin procesar.

### Línea de estadísticas

Las cargas útiles de anuncio incluyen una línea de estadísticas al final (incluso cuando están envueltas):

- Tiempo de ejecución (por ejemplo, `runtime 5m12s`).
- Uso de tokens (entrada/salida/total).
- Costo estimado cuando el precio del modelo está configurado (`models.providers.*.models[].cost`).
- `sessionKey`, `sessionId` y ruta de transcripción para que el agente principal pueda recuperar el historial mediante `sessions_history` o inspeccionar el archivo en disco.

Los metadatos internos están pensados solo para orquestación; las respuestas orientadas al usuario
deben reescribirse con una voz normal de asistente.

### Por qué preferir `sessions_history`

`sessions_history` es la ruta de orquestación más segura:

- El recuerdo del asistente se normaliza primero: etiquetas de pensamiento eliminadas; andamiaje `<relevant-memories>` / `<relevant_memories>` eliminado; bloques de carga útil XML de llamadas a herramientas en texto sin formato (`<tool_call>`, `<function_call>`, `<tool_calls>`, `<function_calls>`) eliminados, incluidas cargas truncadas que nunca cierran limpiamente; andamiaje degradado de llamadas/resultados de herramientas y marcadores de contexto histórico eliminados; tokens de control de modelo filtrados (`<|assistant|>`, otros ASCII `<|...|>`, ancho completo `<｜...｜>`) eliminados; XML de llamadas a herramientas MiniMax malformado eliminado.
- El texto similar a credenciales/tokens se redacta.
- Los bloques largos pueden truncarse.
- Los historiales muy grandes pueden descartar filas antiguas o reemplazar una fila sobredimensionada por `[sessions_history omitted: message too large]`.
- La inspección de la transcripción sin procesar en disco es el respaldo cuando necesitas la transcripción completa byte por byte.

## Política de herramientas

Los subagentes usan primero el mismo perfil y canalización de políticas de herramientas que el agente principal o de destino. Después de eso, OpenClaw aplica la capa de restricciones de subagentes.

Sin un `tools.profile` restrictivo, los subagentes obtienen **todas las herramientas excepto las herramientas de sesión** y las herramientas del sistema:

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

`sessions_history` también sigue siendo aquí una vista de recuperación acotada y saneada; no es un volcado de transcripción sin procesar.

Cuando `maxSpawnDepth >= 2`, los subagentes orquestadores de profundidad 1 reciben además `sessions_spawn`, `subagents`, `sessions_list` y `sessions_history` para que puedan gestionar sus hijos.

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

`tools.subagents.tools.allow` es un filtro final de solo permitidos. Puede restringir el conjunto de herramientas ya resuelto, pero no puede **volver a agregar** una herramienta eliminada por `tools.profile`. Por ejemplo, `tools.profile: "coding"` incluye `web_search`/`web_fetch`, pero no la herramienta `browser`. Para permitir que los subagentes con perfil de codificación usen automatización del navegador, agrega browser en la etapa de perfil:

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

Usa `agents.list[].tools.alsoAllow: ["browser"]` por agente cuando solo un agente deba obtener automatización del navegador.

## Concurrencia

Los subagentes usan un carril de cola dedicado dentro del proceso:

- **Nombre del carril:** `subagent`
- **Concurrencia:** `agents.defaults.subagents.maxConcurrent` (valor predeterminado `8`)

## Actividad y recuperación

OpenClaw no trata la ausencia de `endedAt` como prueba permanente de que un subagente sigue activo. Las ejecuciones sin finalizar que sean más antiguas que la ventana de ejecución obsoleta dejan de contar como activas/pendientes en `/subagents list`, resúmenes de estado, compuertas de finalización de descendientes y comprobaciones de concurrencia por sesión.

Después de reiniciar el Gateway, las ejecuciones restauradas obsoletas sin finalizar se podan, salvo que su sesión hija esté marcada como `abortedLastRun: true`. Esas sesiones hijas abortadas por reinicio siguen siendo recuperables mediante el flujo de recuperación de subagentes huérfanos, que envía un mensaje de reanudación sintético antes de borrar el marcador de abortado.

La recuperación automática tras reinicio está acotada por sesión hija. Si el mismo subagente hijo se acepta repetidamente para recuperación de huérfanos dentro de la ventana de reatasco rápido, OpenClaw conserva una lápida de recuperación en esa sesión y deja de reanudarla automáticamente en reinicios posteriores. Ejecuta `openclaw tasks maintenance --apply` para reconciliar el registro de la tarea, o `openclaw doctor --fix` para borrar indicadores obsoletos de recuperación abortada en sesiones con lápida.

<Note>
Si la creación de un subagente falla con Gateway `PAIRING_REQUIRED` / `scope-upgrade`, revisa el llamador RPC antes de editar el estado de emparejamiento. La coordinación interna de `sessions_spawn` debe conectarse como `client.id: "gateway-client"` con `client.mode: "backend"` mediante autenticación directa por loopback con token/contraseña compartidos; esa ruta no depende de la línea base de alcance de dispositivo emparejado de la CLI. Los llamadores remotos, `deviceIdentity` explícito, rutas explícitas de token de dispositivo y clientes de navegador/Node siguen necesitando la aprobación normal del dispositivo para las ampliaciones de alcance.
</Note>

## Detención

- Enviar `/stop` en el chat solicitante aborta la sesión solicitante y detiene cualquier ejecución activa de subagente creada desde ella, propagándose a hijos anidados.
- `/subagents kill <id>` detiene un subagente específico y se propaga a sus hijos.

## Limitaciones

- El anuncio de subagentes es **de mejor esfuerzo**. Si el gateway se reinicia, se pierde el trabajo pendiente de "anunciar de vuelta".
- Los subagentes siguen compartiendo los mismos recursos del proceso del gateway; trata `maxConcurrent` como una válvula de seguridad.
- `sessions_spawn` siempre es no bloqueante: devuelve `{ status: "accepted", runId, childSessionKey }` inmediatamente.
- El contexto de subagente solo inyecta `AGENTS.md` + `TOOLS.md` (sin `SOUL.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` ni `BOOTSTRAP.md`).
- La profundidad máxima de anidamiento es 5 (rango de `maxSpawnDepth`: 1–5). Se recomienda la profundidad 2 para la mayoría de los casos de uso.
- `maxChildrenPerAgent` limita los hijos activos por sesión (valor predeterminado `5`, rango `1–20`).

## Relacionado

- [Agentes ACP](/es/tools/acp-agents)
- [Envío de agente](/es/tools/agent-send)
- [Tareas en segundo plano](/es/automation/tasks)
- [Herramientas de sandbox multiagente](/es/tools/multi-agent-sandbox-tools)

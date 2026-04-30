---
read_when:
    - Desea trabajo en segundo plano o en paralelo mediante el agente
    - Está cambiando sessions_spawn o la política de herramientas de subagentes
    - Está implementando o solucionando problemas de sesiones de subagentes vinculadas a hilos
sidebarTitle: Sub-agents
summary: Lanza ejecuciones aisladas de agentes en segundo plano que anuncian los resultados de vuelta al chat del solicitante.
title: Subagentes
x-i18n:
    generated_at: "2026-04-30T16:31:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: c7c46d2c6d9ddac23653dcbfaf20df0ff5be9619035a1b115a3b49fd48fd8280
    source_path: tools/subagents.md
    workflow: 16
---

Los subagentes son ejecuciones de agente en segundo plano generadas desde una ejecución de agente existente.
Se ejecutan en su propia sesión (`agent:<agentId>:subagent:<uuid>`) y,
al finalizar, **anuncian** su resultado de vuelta al canal de chat
solicitante. Cada ejecución de subagente se rastrea como una
[tarea en segundo plano](/es/automation/tasks).

Objetivos principales:

- Paralelizar trabajo de "investigación / tarea larga / herramienta lenta" sin bloquear la ejecución principal.
- Mantener los subagentes aislados de forma predeterminada (separación de sesión + sandboxing opcional).
- Mantener la superficie de herramientas difícil de usar mal: los subagentes **no** reciben herramientas de sesión de forma predeterminada.
- Admitir profundidad de anidamiento configurable para patrones de orquestador.

<Note>
**Nota de costo:** cada subagente tiene su propio contexto y uso de tokens de
forma predeterminada. Para tareas pesadas o repetitivas, configura un modelo más económico para los subagentes
y mantén tu agente principal en un modelo de mayor calidad. Configura mediante
`agents.defaults.subagents.model` o sobrescrituras por agente. Cuando un hijo
necesita realmente la transcripción actual del solicitante, el agente puede solicitar
`context: "fork"` en esa generación específica.
</Note>

## Comando slash

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

`/subagents info` muestra metadatos de la ejecución (estado, marcas de tiempo, id de sesión,
ruta de transcripción, limpieza). Usa `sessions_history` para una vista de recuperación acotada
y filtrada por seguridad; inspecciona la ruta de transcripción en disco cuando
necesites la transcripción completa sin procesar.

### Controles de vinculación de hilos

Estos comandos funcionan en canales que admiten vinculaciones persistentes de hilos.
Consulta [Canales compatibles con hilos](#thread-supporting-channels) más abajo.

```text
/focus <subagent-label|session-key|session-id|session-label>
/unfocus
/agents
/session idle <duration|off>
/session max-age <duration|off>
```

### Comportamiento de generación

`/subagents spawn` inicia un subagente en segundo plano como comando de usuario (no como
reenvío interno) y envía una actualización final de finalización de vuelta al
chat solicitante cuando termina la ejecución.

<AccordionGroup>
  <Accordion title="Finalización no bloqueante basada en inserción">
    - El comando de generación no bloquea; devuelve un id de ejecución inmediatamente.
    - Al finalizar, el subagente anuncia un mensaje de resumen/resultado de vuelta al canal de chat solicitante.
    - La finalización está basada en inserción. Una vez generado, no sondees `/subagents list`, `sessions_list` ni `sessions_history` en un bucle solo para esperar a que termine; inspecciona el estado solo bajo demanda para depuración o intervención.
    - Al finalizar, OpenClaw hace el mayor esfuerzo por cerrar las pestañas/procesos del navegador rastreados que haya abierto esa sesión de subagente antes de que continúe el flujo de limpieza del anuncio.

  </Accordion>
  <Accordion title="Resiliencia de entrega de generación manual">
    - OpenClaw intenta primero la entrega directa a `agent` con una clave de idempotencia estable.
    - Si falla la entrega directa, recurre al enrutamiento por cola.
    - Si el enrutamiento por cola aún no está disponible, el anuncio se reintenta con un breve retroceso exponencial antes de abandonar definitivamente.
    - La entrega de finalización conserva la ruta resuelta del solicitante: las rutas de finalización vinculadas a hilo o conversación tienen prioridad cuando están disponibles; si el origen de la finalización solo proporciona un canal, OpenClaw completa el destino/cuenta faltante desde la ruta resuelta de la sesión solicitante (`lastChannel` / `lastTo` / `lastAccountId`) para que la entrega directa siga funcionando.

  </Accordion>
  <Accordion title="Metadatos de traspaso de finalización">
    El traspaso de finalización a la sesión solicitante es contexto interno generado en tiempo de ejecución
    (no texto escrito por el usuario) e incluye:

    - `Result` — texto visible más reciente de respuesta de `assistant`, o bien texto saneado más reciente de herramienta/toolResult. Las ejecuciones terminales fallidas no reutilizan texto de respuesta capturado.
    - `Status` — `completed successfully` / `failed` / `timed out` / `unknown`.
    - Estadísticas compactas de tiempo de ejecución/tokens.
    - Una instrucción de entrega que indica al agente solicitante que reescriba en la voz normal del asistente (no que reenvíe metadatos internos sin procesar).

  </Accordion>
  <Accordion title="Modos y tiempo de ejecución ACP">
    - `--model` y `--thinking` sobrescriben los valores predeterminados para esa ejecución específica.
    - Usa `info`/`log` para inspeccionar detalles y salida después de la finalización.
    - `/subagents spawn` es modo de una sola ejecución (`mode: "run"`). Para sesiones persistentes vinculadas a hilos, usa `sessions_spawn` con `thread: true` y `mode: "session"`.
    - Para sesiones de arnés ACP (Claude Code, Gemini CLI, OpenCode, o Codex ACP/acpx explícito), usa `sessions_spawn` con `runtime: "acp"` cuando la herramienta anuncie ese tiempo de ejecución. Consulta [Modelo de entrega ACP](/es/tools/acp-agents#delivery-model) al depurar finalizaciones o bucles de agente a agente. Cuando el Plugin `codex` está habilitado, el control de chat/hilo de Codex debe preferir `/codex ...` sobre ACP a menos que el usuario solicite explícitamente ACP/acpx.
    - OpenClaw oculta `runtime: "acp"` hasta que ACP está habilitado, el solicitante no está en sandbox, y se ha cargado un Plugin de backend como `acpx`. `runtime: "acp"` espera un id de arnés ACP externo, o una entrada `agents.list[]` con `runtime.type="acp"`; usa el tiempo de ejecución predeterminado de subagente para agentes normales de configuración de OpenClaw desde `agents_list`.

  </Accordion>
</AccordionGroup>

## Modos de contexto

Los subagentes nativos empiezan aislados a menos que el llamador solicite explícitamente bifurcar
la transcripción actual.

| Modo       | Cuándo usarlo                                                                                                                         | Comportamiento                                                                          |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `isolated` | Investigación nueva, implementación independiente, trabajo con herramienta lenta, o cualquier cosa que pueda resumirse en el texto de la tarea | Crea una transcripción hija limpia. Este es el valor predeterminado y mantiene menor el uso de tokens.  |
| `fork`     | Trabajo que depende de la conversación actual, resultados de herramientas previos o instrucciones matizadas ya presentes en la transcripción solicitante | Ramifica la transcripción solicitante hacia la sesión hija antes de que el hijo empiece. |

Usa `fork` con moderación. Es para delegación sensible al contexto, no un
sustituto de escribir una indicación de tarea clara.

## Herramienta: `sessions_spawn`

Inicia una ejecución de subagente con `deliver: false` en la vía global `subagent`,
luego ejecuta un paso de anuncio y publica la respuesta de anuncio en el canal de chat
solicitante.

La disponibilidad depende de la política de herramientas efectiva del llamador. Los perfiles `coding` y
`full` exponen `sessions_spawn` de forma predeterminada. El perfil `messaging`
no lo hace; agrega `tools.alsoAllow: ["sessions_spawn", "sessions_yield",
"subagents"]` o usa `tools.profile: "coding"` para agentes que deban delegar
trabajo. Las políticas de canal/grupo, proveedor, sandbox y allow/deny por agente
aún pueden quitar la herramienta después de la etapa de perfil. Usa `/tools` desde la misma
sesión para confirmar la lista efectiva de herramientas.

**Valores predeterminados:**

- **Modelo:** hereda el del llamador a menos que configures `agents.defaults.subagents.model` (o `agents.list[].subagents.model` por agente); un `sessions_spawn.model` explícito sigue teniendo prioridad.
- **Razonamiento:** hereda el del llamador a menos que configures `agents.defaults.subagents.thinking` (o `agents.list[].subagents.thinking` por agente); un `sessions_spawn.thinking` explícito sigue teniendo prioridad.
- **Tiempo de espera de ejecución:** si se omite `sessions_spawn.runTimeoutSeconds`, OpenClaw usa `agents.defaults.subagents.runTimeoutSeconds` cuando está configurado; de lo contrario recurre a `0` (sin tiempo de espera).

### Parámetros de la herramienta

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
  `acp` es solo para arneses ACP externos (`claude`, `droid`, `gemini`, `opencode`, o Codex ACP/acpx solicitado explícitamente) y para entradas `agents.list[]` cuyo `runtime.type` sea `acp`.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  Solo ACP. Reanuda una sesión de arnés ACP existente cuando `runtime: "acp"`; se ignora para generaciones de subagentes nativos.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  Solo ACP. Transmite la salida de ejecución ACP a la sesión padre cuando `runtime: "acp"`; omítelo para generaciones de subagentes nativos.
</ParamField>
<ParamField path="model" type="string">
  Sobrescribe el modelo del subagente. Los valores inválidos se omiten y el subagente se ejecuta en el modelo predeterminado con una advertencia en el resultado de la herramienta.
</ParamField>
<ParamField path="thinking" type="string">
  Sobrescribe el nivel de razonamiento para la ejecución del subagente.
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  De forma predeterminada usa `agents.defaults.subagents.runTimeoutSeconds` cuando está configurado; de lo contrario, `0`. Cuando se configura, la ejecución del subagente se aborta después de N segundos.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Cuando es `true`, solicita vinculación de hilo de canal para esta sesión de subagente.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  Si `thread: true` y se omite `mode`, el valor predeterminado pasa a ser `session`. `mode: "session"` requiere `thread: true`.
</ParamField>
<ParamField path="cleanup" type='"delete" | "keep"' default="keep">
  `"delete"` archiva inmediatamente después del anuncio (aun así conserva la transcripción mediante renombrado).
</ParamField>
<ParamField path="sandbox" type='"inherit" | "require"' default="inherit">
  `require` rechaza la generación a menos que el tiempo de ejecución hijo de destino esté en sandbox.
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

### Canales compatibles con hilos

**Discord** es actualmente el único canal compatible. Admite
sesiones persistentes de subagente vinculadas a hilos (`sessions_spawn` con
`thread: true`), controles manuales de hilos (`/focus`, `/unfocus`, `/agents`,
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
    Usa `/session idle` para inspeccionar/actualizar el desenfoque automático por inactividad y
    `/session max-age` para controlar el límite estricto.
  </Step>
  <Step title="Desvincular">
    Usa `/unfocus` para desvincular manualmente.
  </Step>
</Steps>

### Controles manuales

| Comando           | Efecto                                                                     |
| ----------------- | -------------------------------------------------------------------------- |
| `/focus <target>` | Vincula el hilo actual (o crea uno) a un destino de subagente/sesión       |
| `/unfocus`        | Elimina la vinculación del hilo vinculado actual                           |
| `/agents`         | Lista las ejecuciones activas y el estado de vinculación (`thread:<id>` o `unbound`) |
| `/session idle`   | Inspecciona/actualiza el autoenfoque inactivo (solo hilos vinculados enfocados) |
| `/session max-age` | Inspecciona/actualiza el límite estricto (solo hilos vinculados enfocados) |

### Interruptores de configuración

- **Valor predeterminado global:** `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
- **Las claves de anulación de canal y vinculación automática al generar** son específicas del adaptador. Consulta [Canales con soporte de hilos](#thread-supporting-channels) arriba.

Consulta la [Referencia de configuración](/es/gateway/configuration-reference) y
[Comandos slash](/es/tools/slash-commands) para ver los detalles actuales del adaptador.

### Lista de permitidos

<ParamField path="agents.list[].subagents.allowAgents" type="string[]">
  Lista de id. de agentes que pueden usarse como destino mediante `agentId` explícito (`["*"]` permite cualquiera). Predeterminado: solo el agente solicitante. Si configuras una lista y aun así quieres que el solicitante se genere a sí mismo con `agentId`, incluye el id. del solicitante en la lista.
</ParamField>
<ParamField path="agents.defaults.subagents.allowAgents" type="string[]">
  Lista de permitidos predeterminada de agentes de destino que se usa cuando el agente solicitante no define su propio `subagents.allowAgents`.
</ParamField>
<ParamField path="agents.defaults.subagents.requireAgentId" type="boolean" default="false">
  Bloquea llamadas `sessions_spawn` que omiten `agentId` (fuerza la selección explícita de perfil). Anulación por agente: `agents.list[].subagents.requireAgentId`.
</ParamField>

Si la sesión solicitante está en entorno aislado, `sessions_spawn` rechaza destinos
que se ejecutarían sin aislamiento.

### Descubrimiento

Usa `agents_list` para ver qué id. de agente están permitidos actualmente para
`sessions_spawn`. La respuesta incluye el modelo efectivo de cada agente listado
y metadatos de runtime incrustados para que los llamadores puedan distinguir PI, servidor de aplicaciones de Codex
y otros runtimes nativos configurados.

### Archivado automático

- Las sesiones de subagente se archivan automáticamente después de `agents.defaults.subagents.archiveAfterMinutes` (predeterminado `60`).
- El archivado usa `sessions.delete` y cambia el nombre de la transcripción a `*.deleted.<timestamp>` (misma carpeta).
- `cleanup: "delete"` archiva inmediatamente después del anuncio (aun así conserva la transcripción mediante cambio de nombre).
- El archivado automático es de mejor esfuerzo; los temporizadores pendientes se pierden si el Gateway se reinicia.
- `runTimeoutSeconds` **no** archiva automáticamente; solo detiene la ejecución. La sesión permanece hasta el archivado automático.
- El archivado automático se aplica por igual a sesiones de profundidad 1 y profundidad 2.
- La limpieza del navegador es independiente de la limpieza de archivo: las pestañas/procesos del navegador rastreados se cierran con mejor esfuerzo cuando termina la ejecución, incluso si se conserva el registro de transcripción/sesión.

## Subagentes anidados

De forma predeterminada, los subagentes no pueden generar sus propios subagentes
(`maxSpawnDepth: 1`). Configura `maxSpawnDepth: 2` para habilitar un nivel de
anidamiento: el **patrón de orquestador**: principal → subagente orquestador →
sub-subagentes trabajadores.

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

| Profundidad | Forma de clave de sesión                    | Rol                                           | ¿Puede generar?              |
| ----------- | ------------------------------------------- | --------------------------------------------- | ---------------------------- |
| 0           | `agent:<id>:main`                           | Agente principal                              | Siempre                      |
| 1           | `agent:<id>:subagent:<uuid>`                | Subagente (orquestador cuando se permite profundidad 2) | Solo si `maxSpawnDepth >= 2` |
| 2           | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | Sub-subagente (trabajador hoja)              | Nunca                        |

### Cadena de anuncios

Los resultados fluyen de vuelta hacia arriba en la cadena:

1. El trabajador de profundidad 2 termina → anuncia a su padre (orquestador de profundidad 1).
2. El orquestador de profundidad 1 recibe el anuncio, sintetiza los resultados, termina → anuncia al principal.
3. El agente principal recibe el anuncio y lo entrega al usuario.

Cada nivel solo ve anuncios de sus hijos directos.

<Note>
**Guía operativa:** inicia el trabajo hijo una vez y espera los eventos de finalización
en lugar de construir bucles de sondeo alrededor de `sessions_list`,
`sessions_history`, `/subagents list` o comandos `exec` con espera.
`sessions_list` y `/subagents list` mantienen las relaciones de sesiones hijas
centradas en trabajo en vivo: los hijos en vivo permanecen adjuntos, los hijos finalizados siguen
visibles durante una ventana reciente breve, y los enlaces de hijos obsoletos solo de almacén se
ignoran después de su ventana de frescura. Esto evita que metadatos antiguos `spawnedBy` /
`parentSessionKey` resuciten hijos fantasma después de
reiniciar. Si llega un evento de finalización de hijo después de que ya enviaste la
respuesta final, el seguimiento correcto es el token silencioso exacto
`NO_REPLY` / `no_reply`.
</Note>

### Política de herramientas por profundidad

- El rol y el alcance de control se escriben en los metadatos de sesión al generar. Eso evita que claves de sesión planas o restauradas recuperen accidentalmente privilegios de orquestador.
- **Profundidad 1 (orquestador, cuando `maxSpawnDepth >= 2`):** recibe `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history` para poder gestionar sus hijos. Otras herramientas de sesión/sistema permanecen denegadas.
- **Profundidad 1 (hoja, cuando `maxSpawnDepth == 1`):** sin herramientas de sesión (comportamiento predeterminado actual).
- **Profundidad 2 (trabajador hoja):** sin herramientas de sesión; `sessions_spawn` siempre se deniega en profundidad 2. No puede generar más hijos.

### Límite de generación por agente

Cada sesión de agente (a cualquier profundidad) puede tener como máximo `maxChildrenPerAgent`
(predeterminado `5`) hijos activos a la vez. Esto evita la expansión descontrolada
desde un solo orquestador.

### Detención en cascada

Detener un orquestador de profundidad 1 detiene automáticamente todos sus hijos de profundidad 2:

- `/stop` en el chat principal detiene todos los agentes de profundidad 1 y se propaga a sus hijos de profundidad 2.
- `/subagents kill <id>` detiene un subagente específico y se propaga a sus hijos.
- `/subagents kill all` detiene todos los subagentes del solicitante y se propaga.

## Autenticación

La autenticación de subagente se resuelve por **id. de agente**, no por tipo de sesión:

- La clave de sesión de subagente es `agent:<agentId>:subagent:<uuid>`.
- El almacén de autenticación se carga desde el `agentDir` de ese agente.
- Los perfiles de autenticación del agente principal se fusionan como **respaldo**; los perfiles del agente sobrescriben los perfiles principales en caso de conflicto.

La fusión es aditiva, por lo que los perfiles principales siempre están disponibles como
respaldos. La autenticación totalmente aislada por agente aún no es compatible.

## Anuncio

Los subagentes informan mediante un paso de anuncio:

- El paso de anuncio se ejecuta dentro de la sesión del subagente (no en la sesión solicitante).
- Si el subagente responde exactamente `ANNOUNCE_SKIP`, no se publica nada.
- Si el texto más reciente del asistente es el token silencioso exacto `NO_REPLY` / `no_reply`, la salida de anuncio se suprime aunque haya existido progreso visible anterior.

La entrega depende de la profundidad del solicitante:

- Las sesiones solicitantes de nivel superior usan una llamada `agent` de seguimiento con entrega externa (`deliver=true`).
- Las sesiones de subagente solicitantes anidadas reciben una inyección interna de seguimiento (`deliver=false`) para que el orquestador pueda sintetizar los resultados de hijos dentro de la sesión.
- Si una sesión de subagente solicitante anidada ya no existe, OpenClaw recurre al solicitante de esa sesión cuando está disponible.

Para sesiones solicitantes de nivel superior, la entrega directa en modo de finalización primero
resuelve cualquier ruta de conversación/hilo vinculada y anulación de hook, luego rellena
los campos de destino de canal faltantes desde la ruta almacenada de la sesión solicitante.
Eso mantiene las finalizaciones en el chat/tema correcto incluso cuando el origen de la finalización
solo identifica el canal.

La agregación de finalizaciones de hijos se limita a la ejecución solicitante actual al
construir hallazgos de finalización anidados, lo que evita que salidas de hijos de ejecuciones previas obsoletas
se filtren en el anuncio actual. Las respuestas de anuncio conservan
el enrutamiento de hilo/tema cuando está disponible en los adaptadores de canal.

### Contexto de anuncio

El contexto de anuncio se normaliza en un bloque de evento interno estable:

| Campo              | Origen                                                                                                       |
| ------------------ | ------------------------------------------------------------------------------------------------------------ |
| Origen             | `subagent` o `cron`                                                                                          |
| Id. de sesión      | Clave/id. de sesión hija                                                                                     |
| Tipo               | Tipo de anuncio + etiqueta de tarea                                                                          |
| Estado             | Derivado del resultado del runtime (`success`, `error`, `timeout` o `unknown`); **no** inferido del texto del modelo |
| Contenido de resultado | Texto visible más reciente del asistente; de lo contrario, texto de herramienta/toolResult más reciente saneado |
| Seguimiento        | Instrucción que describe cuándo responder o permanecer en silencio                                           |

Las ejecuciones terminales fallidas informan el estado de fallo sin reproducir el texto
de respuesta capturado. En caso de tiempo de espera, si el hijo solo llegó a llamadas de herramienta, el anuncio
puede condensar ese historial en un resumen breve de progreso parcial en lugar
de reproducir la salida sin procesar de la herramienta.

### Línea de estadísticas

Las cargas de anuncio incluyen una línea de estadísticas al final (incluso cuando están envueltas):

- Runtime (p. ej., `runtime 5m12s`).
- Uso de tokens (entrada/salida/total).
- Costo estimado cuando el precio del modelo está configurado (`models.providers.*.models[].cost`).
- `sessionKey`, `sessionId` y ruta de transcripción para que el agente principal pueda obtener historial mediante `sessions_history` o inspeccionar el archivo en disco.

Los metadatos internos están pensados solo para orquestación; las respuestas orientadas al usuario
deben reescribirse con voz normal de asistente.

### Por qué preferir `sessions_history`

`sessions_history` es la ruta de orquestación más segura:

- El recuerdo del asistente se normaliza primero: se eliminan etiquetas de pensamiento; se elimina el andamiaje `<relevant-memories>` / `<relevant_memories>`; se eliminan bloques de carga útil XML de llamadas a herramientas en texto sin formato (`<tool_call>`, `<function_call>`, `<tool_calls>`, `<function_calls>`), incluidas cargas truncadas que nunca cierran limpiamente; se elimina el andamiaje degradado de llamadas/resultados de herramientas y marcadores de contexto histórico; se eliminan tokens de control de modelo filtrados (`<|assistant|>`, otros ASCII `<|...|>`, ancho completo `<｜...｜>`); se elimina XML malformado de llamadas a herramientas de MiniMax.
- El texto similar a credenciales/tokens se redacta.
- Los bloques largos pueden truncarse.
- Los historiales muy grandes pueden descartar filas antiguas o reemplazar una fila sobredimensionada con `[sessions_history omitted: message too large]`.
- La inspección de la transcripción sin procesar en disco es el respaldo cuando necesitas la transcripción completa byte a byte.

## Política de herramientas

Los subagentes usan primero el mismo perfil y canalización de políticas de herramientas que el padre o
agente de destino. Después, OpenClaw aplica la capa de restricciones
de subagente.

Sin un `tools.profile` restrictivo, los subagentes reciben **todas las herramientas excepto
herramientas de sesión** y herramientas de sistema:

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

`sessions_history` también sigue siendo aquí una vista de recuerdo delimitada y saneada; no
es un volcado de transcripción sin procesar.

Cuando `maxSpawnDepth >= 2`, los subagentes orquestadores de profundidad 1 además
reciben `sessions_spawn`, `subagents`, `sessions_list` y
`sessions_history` para poder gestionar a sus hijos.

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

`tools.subagents.tools.allow` es un filtro final solo de permitidos. Puede restringir
el conjunto de herramientas ya resuelto, pero no puede **volver a añadir** una herramienta eliminada
por `tools.profile`. Por ejemplo, `tools.profile: "coding"` incluye
`web_search`/`web_fetch`, pero no la herramienta `browser`. Para permitir que los
subagentes con perfil de codificación usen automatización de navegador, añade browser en la
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
agente deba obtener automatización de navegador.

## Concurrencia

Los subagentes usan un carril dedicado de cola en el proceso:

- **Nombre del carril:** `subagent`
- **Concurrencia:** `agents.defaults.subagents.maxConcurrent` (predeterminado `8`)

## Actividad y recuperación

OpenClaw no trata la ausencia de `endedAt` como prueba permanente de que un
subagente sigue activo. Las ejecuciones sin finalizar que son más antiguas que la ventana de ejecución obsoleta
dejan de contar como activas/pendientes en `/subagents list`, resúmenes de estado,
bloqueo de finalización de descendientes y comprobaciones de concurrencia por sesión.

Después de reiniciar el Gateway, las ejecuciones restauradas obsoletas y sin finalizar se podan, salvo que
su sesión hija esté marcada como `abortedLastRun: true`. Esas
sesiones hijas abortadas por reinicio siguen siendo recuperables mediante el flujo de recuperación de subagentes
huérfanos, que envía un mensaje sintético de reanudación antes de
borrar el marcador de abortado.

La recuperación automática tras reinicio está acotada por sesión hija. Si el mismo
hijo de subagente se acepta para recuperación de huérfanos repetidamente dentro de la
ventana de rebloqueo rápido, OpenClaw persiste una lápida de recuperación en esa
sesión y deja de reanudarla automáticamente en reinicios posteriores. Ejecuta
`openclaw tasks maintenance --apply` para reconciliar el registro de tarea, o
`openclaw doctor --fix` para borrar indicadores obsoletos de recuperación abortada en
sesiones con lápida.

<Note>
Si la creación de un subagente falla con Gateway `PAIRING_REQUIRED` /
`scope-upgrade`, comprueba el llamador RPC antes de editar el estado de emparejamiento.
La coordinación interna `sessions_spawn` debe conectarse como
`client.id: "gateway-client"` con `client.mode: "backend"` mediante autenticación directa
por token compartido/contraseña sobre local loopback; esa ruta no depende de la
base de alcance de dispositivos emparejados de la CLI. Los llamadores remotos, `deviceIdentity`
explícito, las rutas explícitas con token de dispositivo y los clientes browser/node
siguen necesitando la aprobación normal del dispositivo para actualizaciones de alcance.
</Note>

## Detención

- Enviar `/stop` en el chat solicitante aborta la sesión solicitante y detiene cualquier ejecución activa de subagente creada desde ella, en cascada hacia hijos anidados.
- `/subagents kill <id>` detiene un subagente específico y se propaga en cascada a sus hijos.

## Limitaciones

- El anuncio de subagente es de **mejor esfuerzo**. Si el Gateway se reinicia, el trabajo pendiente de "anunciar de vuelta" se pierde.
- Los subagentes siguen compartiendo los mismos recursos del proceso Gateway; trata `maxConcurrent` como una válvula de seguridad.
- `sessions_spawn` siempre es no bloqueante: devuelve `{ status: "accepted", runId, childSessionKey }` inmediatamente.
- El contexto de subagente solo inyecta `AGENTS.md` + `TOOLS.md` (sin `SOUL.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` ni `BOOTSTRAP.md`).
- La profundidad máxima de anidamiento es 5 (rango de `maxSpawnDepth`: 1–5). Se recomienda la profundidad 2 para la mayoría de los casos de uso.
- `maxChildrenPerAgent` limita los hijos activos por sesión (predeterminado `5`, rango `1–20`).

## Relacionado

- [Agentes ACP](/es/tools/acp-agents)
- [Envío de agente](/es/tools/agent-send)
- [Tareas en segundo plano](/es/automation/tasks)
- [Herramientas de sandbox multiagente](/es/tools/multi-agent-sandbox-tools)

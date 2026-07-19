---
read_when:
    - Se desea realizar trabajo en segundo plano o en paralelo mediante el agente
    - Está cambiando la política de la herramienta sessions_spawn o de subagentes
    - Está implementando o solucionando problemas de sesiones de subagentes vinculadas a hilos
sidebarTitle: Sub-agents
summary: Inicia ejecuciones aisladas de agentes en segundo plano que anuncian los resultados en el chat del solicitante.
title: Subagentes
x-i18n:
    generated_at: "2026-07-19T02:14:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: a8c5c41315714dddc80fe425c7596b25d60348383afa69c585879be27e5d226c
    source_path: tools/subagents.md
    workflow: 16
---

Los subagentes son ejecuciones de agentes en segundo plano generadas a partir de una ejecución de agente existente.
Cada uno se ejecuta en su propia sesión (`agent:<agentId>:subagent:<uuid>`) y,
al finalizar, **anuncia** su resultado al canal de chat del solicitante.
Cada ejecución de subagente se registra como una [tarea en segundo plano](/es/automation/tasks).

Objetivos:

- Paralelizar la investigación, las tareas largas y el trabajo lento con herramientas sin bloquear la ejecución principal.
- Mantener los subagentes aislados de forma predeterminada (separación de sesiones, aislamiento opcional).
- Evitar que la superficie de herramientas se use incorrectamente: los subagentes **no** reciben herramientas de sesión ni de mensajes de forma predeterminada.
- Admitir una profundidad de anidamiento configurable para patrones de orquestación.

<Note>
**Nota sobre costes:** de forma predeterminada, cada subagente tiene su propio contexto y consumo de tokens. Para tareas pesadas o repetitivas, configure un modelo más económico para los subagentes
y mantenga el agente principal en un modelo de mayor calidad mediante
`agents.defaults.subagents.model` o anulaciones por agente. Cuando un agente secundario
necesite realmente la transcripción actual del solicitante, genérelo con
`context: "fork"`. Las sesiones de subagentes vinculadas a hilos usan de forma predeterminada
`context: "fork"` porque bifurcan la conversación actual en un
hilo de seguimiento.
</Note>

## Comando de barra

`/subagents` inspecciona las ejecuciones de subagentes de la **sesión actual**:

```text
/subagents list
/subagents log <id|#> [limit] [tools]
/subagents info <id|#>
```

`/subagents info` muestra los metadatos de ejecución (estado, marcas de tiempo, id. de sesión,
ruta de la transcripción, limpieza). `/subagents log` imprime los turnos recientes del chat de una
ejecución; añada el token `tools` para incluir mensajes de llamadas a herramientas y sus resultados (omitidos
de forma predeterminada). Use `sessions_history` para obtener una vista de consulta
acotada y filtrada por seguridad desde un turno del agente, o inspeccione la ruta de la transcripción en el disco para
ver la transcripción completa sin procesar.

En la interfaz de control, las sesiones principales con ejecuciones secundarias recientes tienen una fila
expandible en la barra lateral. Las filas anidadas muestran el estado y el tiempo de ejecución de los agentes secundarios, y al seleccionar una
se abre el chat de ese agente secundario, manteniendo la jerarquía de la sesión principal.

### Controles de vinculación a hilos

Estos comandos funcionan en canales con vinculaciones persistentes a hilos. Consulte
[Canales compatibles con hilos](#thread-supporting-channels) a continuación.

```text
/focus <subagent-label|session-key|session-id|session-label>
/unfocus
/agents
/session idle <duration|off>
/session max-age <duration|off>
```

### Comportamiento de generación

Los agentes inician subagentes en segundo plano con la herramienta `sessions_spawn`.
Las finalizaciones se devuelven como eventos internos de la sesión principal; el agente principal/solicitante
decide si se necesita una actualización visible para el usuario.

<AccordionGroup>
  <Accordion title="Finalización no bloqueante basada en inserción">
    - `sessions_spawn` no es bloqueante; devuelve inmediatamente un id. de ejecución.
    - Al finalizar, el subagente informa a la sesión principal/solicitante.
    - Los turnos de agente que necesiten resultados de agentes secundarios deben llamar a `sessions_yield` después de generar el trabajo necesario. Esto finaliza el turno actual y permite que el evento de finalización llegue como el siguiente mensaje visible para el modelo.
    - La finalización se basa en inserción. Una vez generado, **no** consulte `/subagents list`, `sessions_list` ni `sessions_history` repetidamente en un bucle solo para esperar a que termine; compruebe el estado bajo demanda únicamente durante la depuración.
    - La salida del agente secundario es un informe o evidencia que el agente solicitante debe sintetizar. No es texto de instrucciones creado por el usuario y no puede anular las políticas del sistema, del desarrollador ni del usuario.
    - Al finalizar, OpenClaw intenta cerrar las pestañas y los procesos del navegador registrados que haya abierto esa sesión de subagente antes de que continúe el flujo de limpieza del anuncio.

  </Accordion>
  <Accordion title="Entrega de la finalización">
    - OpenClaw devuelve las finalizaciones a la sesión solicitante mediante un turno `agent` con una clave de idempotencia estable.
    - Si la ejecución solicitante sigue activa, OpenClaw intenta primero reactivarla o dirigirla, en lugar de iniciar una segunda ruta de respuesta visible.
    - Si no se puede reactivar un solicitante activo, OpenClaw recurre a una transferencia al agente solicitante con el mismo contexto de finalización, en lugar de descartar el anuncio.
    - Una transferencia correcta a la sesión principal completa la entrega del subagente, incluso cuando el agente principal decide que no se necesita ninguna actualización visible para el usuario.
    - Los subagentes nativos no reciben la herramienta de mensajes. Devuelven texto sin formato del asistente al agente principal/solicitante; las respuestas visibles para las personas siguen estando bajo la política de entrega normal del agente principal/solicitante.
    - Si no se puede usar la transferencia directa, la entrega recurre al enrutamiento mediante cola y, después, a un breve reintento del anuncio con retroceso exponencial antes de desistir definitivamente.
    - La entrega conserva la ruta resuelta del solicitante: cuando están disponibles, tienen prioridad las rutas de finalización vinculadas al hilo o a la conversación. Si el origen de la finalización solo proporciona un canal, OpenClaw completa el destino o la cuenta que falte a partir de la ruta resuelta de la sesión solicitante (`lastChannel` / `lastTo` / `lastAccountId`) para que la entrega directa siga funcionando.

  </Accordion>
  <Accordion title="Metadatos de transferencia de la finalización">
    La transferencia de la finalización a la sesión solicitante es contexto interno generado
    durante la ejecución (no texto creado por el usuario) e incluye:

    - `Result` — el texto de la respuesta `assistant` visible más reciente del agente secundario. La salida de tool/toolResult no se incorpora a los resultados del agente secundario. Las ejecuciones que terminan con error no reutilizan el texto de respuesta capturado.
    - `Status` — `completed; ready for parent review` / `failed` / `timed out` / `unknown`.
    - Estadísticas compactas de ejecución y tokens.
    - Una instrucción de revisión que indica al agente solicitante que verifique el resultado antes de decidir si la tarea original está terminada.
    - Orientación de seguimiento que indica al agente solicitante que continúe la tarea o registre una acción de seguimiento cuando el resultado del agente secundario deje trabajo pendiente.
    - Una instrucción de actualización final para cuando no haya más acciones, escrita con la voz normal del asistente y sin reenviar metadatos internos sin procesar.

  </Accordion>
  <Accordion title="Modos y entorno de ejecución ACP">
    - `--model` y `--thinking` anulan los valores predeterminados para esa ejecución concreta.
    - Use `info`/`log` para inspeccionar los detalles y la salida después de la finalización.
    - Para sesiones persistentes vinculadas a hilos, use `sessions_spawn` con `thread: true` y `mode: "session"`.
    - Si el canal solicitante no admite vinculaciones a hilos, use `mode: "run"` en lugar de volver a intentar una combinación vinculada a hilos que no puede funcionar.
    - Para sesiones del entorno de ejecución ACP (Claude Code, Gemini CLI, OpenCode o Codex ACP/acpx explícito), use `sessions_spawn` con `runtime: "acp"` cuando la herramienta anuncie ese entorno de ejecución. Consulte el [modelo de entrega de ACP](/es/tools/acp-agents#delivery-model) al depurar finalizaciones o bucles entre agentes. Cuando esté habilitado el Plugin `codex`, el control de chats e hilos de Codex debe preferir `/codex ...` frente a ACP, salvo que el usuario solicite explícitamente ACP/acpx.
    - OpenClaw oculta `runtime: "acp"` hasta que ACP esté habilitado, el solicitante no esté aislado y se haya cargado un Plugin de backend como `acpx`. `runtime: "acp"` espera un id. de entorno de ejecución ACP externo o una entrada `agents.list[]` con `runtime.type="acp"`; use el entorno de ejecución predeterminado de subagentes para los agentes de configuración normales de OpenClaw definidos en `agents_list`.

  </Accordion>
</AccordionGroup>

## Modos de contexto

Los subagentes nativos se inician aislados, salvo que el invocador solicite explícitamente bifurcar
la transcripción actual.

| Modo       | Cuándo usarlo                                                                                                                         | Comportamiento                                                                          |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `isolated` | Investigación nueva, implementación independiente, trabajo lento con herramientas o cualquier tarea que pueda describirse en el texto de la tarea                           | Crea una transcripción secundaria limpia. Es el valor predeterminado y reduce el consumo de tokens.  |
| `fork`     | Trabajo que depende de la conversación actual, de resultados anteriores de herramientas o de instrucciones detalladas ya presentes en la transcripción del solicitante | Bifurca la transcripción del solicitante en la sesión secundaria antes de iniciar el agente secundario. |

Use `fork` con moderación. Está destinado a la delegación sensible al contexto, no a
sustituir la redacción de una instrucción de tarea clara.

## Herramienta: `sessions_spawn`

Inicia una ejecución de subagente con `deliver: false` en el carril global `subagent`,
después ejecuta un paso de anuncio y publica la respuesta del anuncio en el canal de
chat del solicitante.

La disponibilidad depende de la política de herramientas efectiva del invocador. Los perfiles integrados
`coding` y `messaging` incluyen `sessions_spawn`,
`sessions_yield` y `subagents`; `minimal` no. `full` permite todas las
herramientas. Añada esas herramientas con `tools.alsoAllow` o use uno de los perfiles
anteriores para un agente con un perfil personalizado más restrictivo que aun así deba
delegar trabajo.
Las políticas de permiso o denegación del canal/grupo, proveedor, aislamiento y agente
aún pueden eliminar la herramienta después de la fase del perfil. Use `/tools` desde la misma
sesión para confirmar la lista efectiva de herramientas.

**Valores predeterminados:**

- **Modelo:** los subagentes nativos heredan el modelo del invocador, salvo que se establezca `agents.defaults.subagents.model` (o `agents.list[].subagents.model` por agente). Las generaciones del entorno de ejecución ACP usan el mismo modelo de subagente configurado cuando está disponible; de lo contrario, el entorno de ejecución ACP conserva su propio valor predeterminado. Un valor explícito de `sessions_spawn.model` sigue teniendo prioridad.
- **Razonamiento:** los subagentes nativos heredan el razonamiento del invocador, salvo que se establezca `agents.defaults.subagents.thinking` (o `agents.list[].subagents.thinking` por agente). Las generaciones del entorno de ejecución ACP también aplican `agents.defaults.models["provider/model"].params.thinking` al modelo seleccionado. Un valor explícito de `sessions_spawn.thinking` sigue teniendo prioridad.
- **Tiempo límite de ejecución:** OpenClaw usa `agents.defaults.subagents.runTimeoutSeconds` cuando está establecido; de lo contrario, recurre a `0` (sin tiempo límite). `sessions_spawn` no acepta anulaciones de tiempo límite por llamada.
- **Duración del proceso:** un subagente independiente de OpenClaw tiene su propio ciclo de vida de ejecución. Una tarea en segundo plano creada dentro de un backend de CLI externo es diferente: comparte el subproceso de la CLI principal y se detiene si dicho proceso principal alcanza `agents.defaults.timeoutSeconds`.
- **Entrega de tareas:** los subagentes nativos reciben la tarea delegada en su primer mensaje `[Subagent Task]` visible. La instrucción del sistema del subagente contiene reglas de ejecución y contexto de enrutamiento, no un duplicado oculto de la tarea.

Las generaciones de subagentes nativos aceptadas incluyen los metadatos resueltos del modelo secundario
en el resultado de la herramienta: `resolvedModel` contiene la referencia del modelo aplicada y
`resolvedProvider` contiene el prefijo del proveedor cuando la referencia incluye uno.

### Modo de instrucción de delegación

`agents.defaults.subagents.delegationMode` controla únicamente la orientación de la instrucción; no cambia la política de herramientas ni impone la delegación.

- `suggest` (predeterminado): mantiene la indicación estándar de usar subagentes para trabajos más grandes o lentos.
- `prefer`: indica al agente principal que mantenga la capacidad de respuesta y delegue mediante `sessions_spawn` cualquier tarea más compleja que una respuesta directa.

Anulación por agente: `agents.list[].subagents.delegationMode`.

```json5
{
  agents: {
    defaults: {
      subagents: {
        delegationMode: "prefer",
        maxConcurrent: 4,
      },
    },
    list: [
      {
        id: "coordinator",
        subagents: { delegationMode: "prefer" },
      },
    ],
  },
}
```

### Parámetros de la herramienta

<ParamField path="task" type="string" required>
  La descripción de la tarea para el subagente.
</ParamField>
<ParamField path="taskName" type="string">
  Identificador estable opcional para identificar a un subagente específico en una salida de estado posterior. Debe coincidir con `[a-z][a-z0-9_-]{0,63}` y no puede ser un destino reservado como `last` o `all`.
</ParamField>
<ParamField path="label" type="string">
  Etiqueta opcional legible para personas.
</ParamField>
<ParamField path="agentId" type="string">
  Genera el subagente bajo otro id de agente configurado cuando `subagents.allowAgents` lo permita.
</ParamField>
<ParamField path="cwd" type="string">
  Directorio de trabajo opcional de la tarea para la ejecución del subagente. Los subagentes nativos siguen cargando los archivos de arranque desde el espacio de trabajo del agente de destino; `cwd` solo cambia dónde realizan el trabajo delegado las herramientas de ejecución y los entornos de CLI.
</ParamField>
<ParamField path="runtime" type='"subagent" | "acp"' default="subagent">
  `acp` se usa únicamente para entornos ACP externos (`claude`, `droid`, `gemini`, `opencode` o Codex ACP/acpx solicitado explícitamente) y para entradas `agents.list[]` cuyo `runtime.type` sea `acp`.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  Solo ACP. Reanuda una sesión existente del entorno ACP cuando `runtime: "acp"`; se ignora para la generación de subagentes nativos.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  Solo ACP. Transmite la salida de la ejecución ACP a la sesión principal cuando `runtime: "acp"`; se omite para la generación de subagentes nativos.
</ParamField>
<ParamField path="model" type="string">
  Sustituye el modelo del subagente. Los valores no válidos se omiten y el subagente se ejecuta con el modelo predeterminado, con una advertencia en el resultado de la herramienta.
</ParamField>
<ParamField path="thinking" type="string">
  Sustituye el nivel de razonamiento para la ejecución del subagente. No está disponible con `visible: true`.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Cuando `true`, solicita vincular esta sesión de subagente al hilo del canal.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  Si `thread: true` y se omite `mode`, el valor predeterminado pasa a ser `session`. `mode: "session"` requiere `thread: true`.
  Si la vinculación a hilos no está disponible para el canal solicitante, utiliza `mode: "run"` en su lugar.
</ParamField>
<ParamField path="cleanup" type='"delete" | "keep"' default="keep">
  `"delete"` archiva la sesión inmediatamente después del anuncio, aunque conserva la transcripción mediante un cambio de nombre.
</ParamField>
<ParamField path="sandbox" type='"inherit" | "require"' default="inherit">
  `require` rechaza la generación, salvo que el entorno de ejecución del subagente de destino esté aislado.
</ParamField>
<ParamField path="context" type='"isolated" | "fork"' default="isolated">
  `fork` bifurca la transcripción actual del solicitante en la sesión del subagente. Solo para subagentes nativos. Las generaciones vinculadas a hilos tienen como valor predeterminado `fork`; las generaciones no vinculadas a hilos, `isolated`. Una bifurcación visible debe dirigirse al mismo agente que el solicitante.
</ParamField>
<ParamField path="visible" type="boolean" default="false">
  Crea una sesión persistente del panel que el usuario puede abrir en la interfaz de control. Las generaciones visibles solo admiten `runtime: "subagent"` y siempre conservan la sesión creada.
</ParamField>
<ParamField path="worktree" type="boolean" default="false">
  Aprovisiona un árbol de trabajo de git administrado para la nueva sesión del panel. Requiere `visible: true`.
</ParamField>
<ParamField path="worktreeName" type="string">
  Nombre opcional del árbol de trabajo administrado. Requiere `visible: true` y `worktree: true`.
</ParamField>
<ParamField path="worktreeBaseRef" type="string">
  Referencia base de git opcional para el árbol de trabajo administrado. Requiere `visible: true` y `worktree: true`.
</ParamField>

<Warning>
`sessions_spawn` **no** acepta parámetros de entrega del canal (`target`,
`channel`, `to`, `threadId`, `replyTo`, `transport`). Los subagentes nativos devuelven
su último turno del asistente al solicitante; la entrega externa sigue siendo responsabilidad
del agente principal/solicitante.
</Warning>

Con `visible: true`, se admiten `model`, `cwd` y un `context: "fork"` del mismo agente. Un destino aislado restringe `cwd` al espacio de trabajo de ese agente. La vinculación a hilos, `mode`, las sustituciones del razonamiento, el contexto de arranque ligero y la preparación de archivos adjuntos no están disponibles en esta ruta porque las sesiones visibles son sesiones persistentes del panel creadas mediante `sessions.create`. La generación visible también se rechaza cuando las restricciones de herramientas heredadas no se pueden transferir a la sesión del panel. Consulta [Árboles de trabajo administrados](/es/concepts/managed-worktrees) para obtener información sobre el nombre del checkout, la configuración, la limpieza y el comportamiento de restauración.

### Nombres de tareas y destinos

`taskName` es un identificador para el modelo destinado a la orquestación, no una clave de sesión.
Úsalo para nombres estables de subagentes como `review_subagents`,
`linux_validation` o `docs_update` cuando un coordinador pueda necesitar inspeccionar
ese subagente posteriormente.

La resolución de destinos acepta coincidencias exactas de `taskName` y
prefijos inequívocos. La coincidencia se limita a la misma ventana de destinos activos/recientes que utilizan
los destinos numerados `/subagents`, por lo que un subagente completado obsoleto no vuelve
ambiguo un identificador reutilizado. Si dos subagentes activos o recientes comparten el mismo
`taskName`, el destino es ambiguo; utiliza en su lugar el índice de la lista, la clave de sesión o
el id de ejecución.

Los destinos reservados `last` y `all` no son valores válidos de `taskName`
porque ya tienen significados de control.

## Herramienta: `sessions_yield`

Finaliza el turno actual del modelo y espera a que los eventos de ejecución, principalmente
los eventos de finalización de subagentes, lleguen como el siguiente mensaje. Úsala después
de generar el trabajo necesario de los subagentes cuando el solicitante no pueda producir una respuesta
final hasta que lleguen esas finalizaciones.

`sessions_yield` es la primitiva de espera. No la sustituyas por bucles de sondeo
sobre `subagents`, `sessions_list`, `sessions_history`, `sleep` del shell
o el sondeo de procesos solo para detectar la finalización de un subagente.

Utiliza `sessions_yield` únicamente cuando la lista efectiva de herramientas de la sesión
la incluya. Algunos perfiles de herramientas mínimos o personalizados pueden exponer `sessions_spawn` y
`subagents` sin exponer `sessions_yield`; en ese caso, no inventes
un bucle de sondeo solo para esperar a que finalice.

Cuando hay subagentes activos, OpenClaw inserta un bloque de indicaciones compacto generado en tiempo de ejecución,
`Active Subagents`, en los turnos normales para que el solicitante pueda ver
las sesiones actuales de los subagentes, los ids de ejecución, los estados, las etiquetas, las tareas y
los alias `taskName` sin realizar sondeos. Los campos de tarea y etiqueta de ese
bloque se citan como datos, no como instrucciones, porque pueden proceder
de argumentos de generación proporcionados por el usuario o el modelo.

## Herramienta: `subagents`

Enumera las ejecuciones de subagentes generadas y los registros de tareas en segundo plano que pertenecen al
árbol de sesiones del solicitante. Las filas de tareas abarcan subagentes nativos, ejecuciones ACP,
trabajo de CLI/medios del Gateway y ejecuciones de Cron. Su ámbito se limita al solicitante actual;
un subagente solo puede ver sus propios subagentes bajo control.

Utiliza `subagents` para consultar el estado y depurar bajo demanda. Utiliza `sessions_yield` para
esperar eventos de finalización.

Utiliza `action: "cancel"` con un `taskId` devuelto por `action: "list"` para detener
una tarea. La cancelación se limita al árbol de sesiones bajo control; un subagente
hoja no puede cancelar el trabajo que pertenece a otra sesión.

## Sesiones vinculadas a hilos

Cuando las vinculaciones a hilos están habilitadas para un canal, un subagente puede permanecer vinculado
a un hilo para que los mensajes de seguimiento del usuario en ese hilo sigan dirigiéndose a la
misma sesión del subagente.

### Canales compatibles con hilos

Un canal admite sesiones persistentes de subagentes vinculadas a hilos
(`sessions_spawn` con `thread: true`) cuando registra un adaptador de
vinculación de conversaciones. Canales incluidos con esa compatibilidad: **Discord**,
**iMessage**, **Matrix** y **Telegram**. Discord y Matrix crean de forma predeterminada
un hilo secundario; Telegram e iMessage vinculan de forma predeterminada la
conversación actual. Utiliza las claves de configuración `threadBindings` de cada canal para
la habilitación, los tiempos de espera y `spawnSessions`.

### Flujo rápido

<Steps>
  <Step title="Generar">
    `sessions_spawn` con `thread: true` y, opcionalmente, `mode: "session"`.
  </Step>
  <Step title="Vincular">
    OpenClaw crea o vincula un hilo a ese destino de sesión en el canal activo.
  </Step>
  <Step title="Dirigir los seguimientos">
    Las respuestas y los mensajes de seguimiento de ese hilo se dirigen a la sesión vinculada.
  </Step>
  <Step title="Inspeccionar los tiempos de espera">
    Utiliza `/session idle` para inspeccionar o actualizar la pérdida automática de foco por inactividad y
    `/session max-age` para controlar el límite máximo.
  </Step>
  <Step title="Desvincular">
    Utiliza `/unfocus` para desvincular manualmente.
  </Step>
</Steps>

### Controles manuales

| Comando            | Efecto                                                                                    |
| ------------------ | ----------------------------------------------------------------------------------------- |
| `/focus <target>`  | Vincula el hilo actual, o crea uno, a un destino de subagente/sesión                     |
| `/unfocus`         | Elimina la vinculación del hilo vinculado actual                                           |
| `/agents`          | Enumera las ejecuciones activas y el estado de vinculación (`binding:<id>`, `unbound` o `bindings unavailable`) |
| `/session idle`    | Inspecciona o actualiza la pérdida automática de foco por inactividad, solo en hilos vinculados con foco                             |
| `/session max-age` | Inspecciona o actualiza el límite máximo, solo en hilos vinculados con foco                                      |

### Opciones de configuración

- **Valor predeterminado global:** `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
- **Las claves de sustitución del canal y de vinculación automática al generar** son específicas del adaptador. Consulta [Canales compatibles con hilos](#thread-supporting-channels) más arriba.

Consulta la [Referencia de configuración](/es/gateway/configuration-reference) y
los [Comandos de barra](/es/tools/slash-commands) para obtener información actual sobre los adaptadores.

### Lista de permitidos

<ParamField path="agents.list[].subagents.allowAgents" type="string[]">
  Lista de ids de agentes configurados que pueden establecerse como destino mediante `agentId` explícito (`["*"]` permite cualquier destino configurado). Valor predeterminado: solo el agente solicitante. Si se establece una lista y se desea que el solicitante pueda generarse a sí mismo con `agentId`, se debe incluir el id del solicitante en la lista.
</ParamField>
<ParamField path="agents.defaults.subagents.allowAgents" type="string[]">
  Lista predeterminada de agentes de destino configurados permitidos que se utiliza cuando el agente solicitante no establece su propio `subagents.allowAgents`.
</ParamField>
<ParamField path="agents.defaults.subagents.requireAgentId" type="boolean" default="false">
  Bloquea las llamadas a `sessions_spawn` que omitan `agentId`, lo que obliga a seleccionar explícitamente un perfil. Sustitución por agente: `agents.list[].subagents.requireAgentId`.
</ParamField>
<ParamField path="agents.defaults.subagents.announceTimeoutMs" type="number" default="120000">
  Tiempo de espera por llamada para los intentos de entrega de anuncios de `agent` del Gateway. Los valores son milisegundos enteros positivos y se limitan al máximo seguro del temporizador de la plataforma. Los reintentos transitorios pueden hacer que la espera total del anuncio supere un tiempo de espera configurado.
</ParamField>

Si la sesión del solicitante está aislada, `sessions_spawn` rechaza los destinos
que se ejecutarían sin aislamiento.

### Detección

Utiliza `agents_list` para consultar qué ids de agentes están permitidos actualmente para
`sessions_spawn`. La respuesta incluye el modelo efectivo de cada agente enumerado y
los metadatos de ejecución integrados, para que los invocadores puedan distinguir OpenClaw, el servidor
de aplicaciones de Codex y otros entornos nativos configurados.

`allowAgents` deben apuntar a ids de agentes configurados en `agents.list[]`.
`["*"]` significa cualquier agente de destino configurado más el solicitante. Si se elimina la configuración de un agente
pero su id permanece en `allowAgents`, `sessions_spawn` rechaza ese id
y `agents_list` lo omite. Ejecute `openclaw doctor --fix` para limpiar las
entradas obsoletas de la lista de permitidos, o añada una entrada mínima de `agents.list[]` cuando el destino deba
seguir pudiendo iniciarse mientras hereda los valores predeterminados.

### Archivado automático

- Las sesiones de subagentes se archivan automáticamente después de `agents.defaults.subagents.archiveAfterMinutes` (valor predeterminado: `60`).
- El archivado utiliza `sessions.delete` y cambia el nombre de la transcripción a `*.deleted.<timestamp>` (en la misma carpeta).
- `cleanup: "delete"` archiva inmediatamente después del anuncio (la transcripción se conserva mediante el cambio de nombre).
- El archivado automático se realiza según el mejor esfuerzo; los temporizadores pendientes se pierden si se reinicia el Gateway.
- Los tiempos de espera de ejecución configurados **no** archivan automáticamente; solo detienen la ejecución. La sesión permanece hasta el archivado automático.
- El archivado automático se aplica por igual a las sesiones de profundidad 1 y 2.
- La limpieza del navegador es independiente de la limpieza del archivo: se intenta cerrar las pestañas y los procesos del navegador de los que se realiza seguimiento cuando finaliza la ejecución, aunque se conserve el registro de la transcripción o la sesión.

## Subagentes anidados

De forma predeterminada, los subagentes no pueden iniciar sus propios subagentes
(`maxSpawnDepth: 1`). Establezca `maxSpawnDepth: 2` para habilitar un nivel de
anidamiento: el **patrón de orquestador**: principal → subagente orquestador →
subsubagentes trabajadores.

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxSpawnDepth: 2, // permitir que los subagentes inicien hijos (valor predeterminado: 1, intervalo 1-5)
        maxChildrenPerAgent: 5, // máximo de hijos activos por sesión de agente (valor predeterminado: 5, intervalo 1-20)
        maxConcurrent: 8, // límite global del carril de simultaneidad (valor predeterminado: 8)
        runTimeoutSeconds: 900, // tiempo de espera predeterminado para sessions_spawn (0 = sin tiempo de espera)
        announceTimeoutMs: 120000, // tiempo de espera del anuncio del Gateway por llamada
      },
    },
  },
}
```

### Niveles de profundidad

| Profundidad | Forma de la clave de sesión                   | Rol                                           | ¿Puede iniciar?               |
| ----------- | -------------------------------------------- | --------------------------------------------- | ----------------------------- |
| 0           | `agent:<id>:main`                            | Agente principal                              | Siempre                       |
| 1           | `agent:<id>:subagent:<uuid>`                 | Subagente (orquestador cuando se permite la profundidad 2) | Solo si `maxSpawnDepth >= 2` |
| 2           | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | Subsubagente (trabajador hoja)                 | Nunca                         |

### Cadena de anuncios

Los resultados ascienden por la cadena:

1. El trabajador de profundidad 2 finaliza → anuncia el resultado a su padre (orquestador de profundidad 1).
2. El orquestador de profundidad 1 recibe el anuncio, sintetiza los resultados y finaliza → anuncia el resultado al agente principal.
3. El agente principal recibe el anuncio y lo entrega al usuario.

Cada nivel solo ve los anuncios de sus hijos directos.

<Note>
**Orientación operativa:** inicie el trabajo de los hijos una sola vez y espere los eventos
de finalización en lugar de crear bucles de sondeo en torno a `sessions_list`,
`sessions_history`, `/subagents list` o comandos de suspensión de `exec`.
`sessions_list` y `/subagents list` mantienen las relaciones entre sesiones secundarias
centradas en el trabajo activo: los hijos activos permanecen asociados, los hijos finalizados siguen
visibles durante un breve período reciente y los vínculos obsoletos a hijos presentes únicamente en el almacén se
ignoran una vez transcurrido su período de vigencia. Esto impide que los metadatos antiguos de `spawnedBy` /
`parentSessionKey` reactiven hijos fantasma después de un
reinicio. Si llega un evento de finalización de un hijo después de haber enviado la
respuesta final, el seguimiento correcto es el token silencioso exacto
`NO_REPLY` / `no_reply`.
</Note>

### Política de herramientas por profundidad

- El rol y el ámbito de control se escriben en los metadatos de la sesión al iniciarla. Esto evita que las claves de sesión planas o restauradas recuperen accidentalmente privilegios de orquestador.
- **Profundidad 1 (orquestador, cuando `maxSpawnDepth >= 2`):** obtiene `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history` para poder iniciar hijos e inspeccionar su estado. Las demás herramientas de sesión o del sistema permanecen denegadas.
- **Profundidad 1 (hoja, cuando `maxSpawnDepth == 1`):** sin herramientas de sesión (comportamiento predeterminado actual).
- **Profundidad 2 (trabajador hoja):** sin herramientas de sesión; `sessions_spawn` siempre se deniega en la profundidad 2. No puede iniciar más hijos.

### Límite de inicio por agente

Cada sesión de agente (en cualquier profundidad) puede tener como máximo `maxChildrenPerAgent`
(valor predeterminado: `5`) hijos activos al mismo tiempo. Esto evita una expansión descontrolada
desde un único orquestador.

### Detención en cascada

Al detener un orquestador de profundidad 1, se detienen automáticamente todos sus
hijos de profundidad 2:

- `/stop` en el chat principal detiene todos los agentes de profundidad 1 y propaga la detención a sus hijos de profundidad 2.

## Autenticación

La autenticación del subagente se resuelve por **id del agente**, no por el tipo de sesión:

- La clave de sesión del subagente es `agent:<agentId>:subagent:<uuid>`.
- El almacén de autenticación se carga desde el `agentDir` de ese agente.
- Los perfiles de autenticación del agente principal se combinan como **alternativa**; los perfiles del agente prevalecen sobre los del agente principal en caso de conflicto.

La combinación es aditiva, por lo que los perfiles principales siempre están disponibles como
alternativas. Todavía no se admite una autenticación totalmente aislada por agente.

## Anuncio

Los subagentes informan de vuelta mediante un paso de anuncio:

- El paso de anuncio se ejecuta dentro de la sesión del subagente (no en la sesión del solicitante).
- Si el subagente responde exactamente `ANNOUNCE_SKIP`, no se publica nada.
- Si el texto más reciente del asistente es el token silencioso exacto `NO_REPLY` / `no_reply`, se suprime la salida del anuncio aunque anteriormente hubiera progreso visible.

La entrega depende de la profundidad del solicitante:

- Las sesiones de solicitantes de nivel superior utilizan una llamada posterior a `agent` con entrega externa (`deliver=true`).
- Las sesiones anidadas de subagentes solicitantes reciben una inyección interna posterior (`deliver=false`) para que el orquestador pueda sintetizar los resultados de los hijos dentro de la sesión.
- Si una sesión anidada de subagente solicitante ya no existe, OpenClaw recurre al solicitante de esa sesión cuando está disponible.

En las sesiones de solicitantes de nivel superior, la entrega directa en modo de finalización primero
resuelve cualquier ruta vinculada de conversación o hilo y cualquier sobrescritura del enlace, y después completa
los campos de canal y destino que falten a partir de la ruta almacenada en la sesión del solicitante.
Esto mantiene las finalizaciones en el chat o tema correctos incluso cuando el origen de la finalización
solo identifica el canal.

La agregación de finalizaciones de hijos se limita a la ejecución actual del solicitante al
crear resultados de finalización anidados, lo que impide que salidas obsoletas de hijos de ejecuciones
anteriores se filtren al anuncio actual. Las respuestas de anuncio conservan
el enrutamiento de hilo o tema cuando está disponible en los adaptadores de canal.

### Contexto del anuncio

El contexto del anuncio se normaliza en un bloque de eventos interno estable:

| Campo          | Origen                                                                                                   |
| -------------- | -------------------------------------------------------------------------------------------------------- |
| Origen         | `subagent` o `cron`                                                                                     |
| Ids de sesión  | Clave/id de sesión del hijo                                                                              |
| Tipo           | Tipo de anuncio + etiqueta de tarea                                                                      |
| Estado         | Derivado del resultado de ejecución (`ok`, `error`, `timeout` o `unknown`); **no** se infiere del texto del modelo |
| Contenido del resultado | Texto visible más reciente del asistente del hijo                                              |
| Seguimiento    | Instrucción que describe cuándo responder o permanecer en silencio                                       |

Las ejecuciones que terminan con error informan del estado de error sin reproducir el
texto de respuesta capturado. La salida de herramienta/resultado de herramienta no se convierte en texto del resultado del hijo.

### Línea de estadísticas

Las cargas útiles de los anuncios incluyen una línea de estadísticas al final (incluso cuando están envueltas):

- Tiempo de ejecución (p. ej., `runtime 5m12s`).
- Uso de tokens (entrada/salida/total).
- Coste estimado cuando se configura el precio del modelo (`models.providers.*.models[].cost`).
- `sessionKey`, `sessionId` y la ruta de la transcripción para que el agente principal pueda recuperar el historial mediante `sessions_history` o inspeccionar el archivo en el disco.

Los metadatos internos están destinados únicamente a la orquestación; las respuestas dirigidas al usuario
deben reformularse con la voz habitual del asistente.

### Por qué se prefiere `sessions_history`

`sessions_history` es la ruta de orquestación más segura para leer la
transcripción de un hijo desde un turno del agente:

- Oculta texto similar a credenciales o tokens incluso cuando la ocultación de registros de propósito general está deshabilitada.
- Trunca los bloques de texto largos (4000 caracteres por bloque) y descarta las firmas de pensamiento, las cargas de reproducción del razonamiento y los datos de imágenes insertados.
- Impone un límite de respuesta de 80 KB; las filas sobredimensionadas se sustituyen por `[sessions_history omitted: message too large]`.
- Utilice `nextOffset` cuando esté presente para retroceder por ventanas más antiguas de la transcripción.
- `sessions_history` **no** elimina las etiquetas de razonamiento, el andamiaje de `<relevant-memories>` ni el XML de llamadas a herramientas del texto del mensaje; devuelve bloques de contenido estructurados próximos a la forma original de la transcripción, únicamente ocultados y limitados por tamaño. `/subagents log` aplica el saneador de prosa más intensivo (elimina las etiquetas de razonamiento, el andamiaje de memoria y el XML de llamadas a herramientas), porque representa líneas de chat simples en lugar de bloques estructurados.
- La inspección de la transcripción original en el disco es la alternativa cuando se necesita la transcripción completa byte por byte.

## Política de herramientas

Los subagentes utilizan primero el mismo perfil y la misma pipeline de políticas de herramientas que el agente padre o
de destino. Después, OpenClaw aplica la capa de restricciones
de los subagentes.

Los subagentes siempre pierden `gateway`, `agents_list`, `session_status` y
`cron`, independientemente de la profundidad o el rol (herramientas interactivas o del sistema, o
herramientas que debe coordinar el agente principal). Los subagentes hoja (comportamiento predeterminado de profundidad 1,
y siempre en la profundidad 2) pierden además `subagents`,
`sessions_list`, `sessions_history` y `sessions_spawn`. Los subagentes nunca
obtienen la herramienta `message`; se deshabilita al iniciar la sesión, no se filtra mediante
esta lista de denegación, y `sessions_send` permanece denegada para que los subagentes
se comuniquen únicamente mediante la cadena de anuncios.

`sessions_history` también sigue siendo aquí una vista de recuperación limitada y saneada; no
es un volcado de la transcripción original.

Cuando `maxSpawnDepth >= 2`, los subagentes orquestadores de profundidad 1 reciben además
`sessions_spawn`, `subagents`, `sessions_list` y
`sessions_history` para que puedan administrar a sus hijos.

### Sobrescritura mediante configuración

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
        // la denegación prevalece
        deny: ["gateway", "cron"],
        // si se establece la lista de permitidos, pasa a permitir únicamente sus elementos (la denegación sigue prevaleciendo)
        // allow: ["read", "exec", "process"]
      },
    },
  },
}
```

`tools.subagents.tools.allow` es un filtro final que solo permite elementos. Puede restringir
el conjunto de herramientas ya resuelto, pero no puede **volver a añadir** una herramienta eliminada
por `tools.profile`. Por ejemplo, `tools.profile: "coding"` incluye
`web_search`/`web_fetch`, pero no la herramienta `browser`. Para permitir que
los subagentes con perfil de programación utilicen la automatización del navegador, añada el navegador en la
fase del perfil:

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

Usa `agents.list[].tools.alsoAllow: ["browser"]` por agente cuando solo un
agente deba disponer de automatización del navegador.

## Concurrencia

Los subagentes usan un carril de cola dedicado dentro del proceso:

- **Nombre del carril:** `subagent`
- **Concurrencia:** `agents.defaults.subagents.maxConcurrent` (valor predeterminado: `8`)

## Actividad y recuperación

OpenClaw no considera la ausencia de `endedAt` una prueba permanente de que un
subagente sigue activo. Las ejecuciones sin finalizar anteriores a la ventana de obsolescencia
(2 horas, o el tiempo de espera configurado para la ejecución más un breve período de gracia,
lo que sea mayor) dejan de contar como activas o pendientes en `/subagents list`,
los resúmenes de estado, el bloqueo de finalización de descendientes y las comprobaciones de
concurrencia por sesión.

Tras reiniciar el Gateway, se eliminan las ejecuciones restauradas obsoletas y sin finalizar, salvo que
su sesión secundaria esté marcada como `abortedLastRun: true`. Las ejecuciones
interrumpidas por el reinicio permanecen registradas para el flujo de recuperación de subagentes
huérfanos: las ejecuciones obsoletas se finalizan sin reanudarse, mientras que las sesiones secundarias
recientes reciben un mensaje de reanudación sintético antes de que se borre el marcador de interrupción.

La recuperación automática tras un reinicio está limitada por sesión secundaria. Si el mismo
subagente secundario se acepta repetidamente para la recuperación de elementos huérfanos dentro de la
ventana de reincidencia rápida, OpenClaw conserva una marca de exclusión de recuperación en esa
sesión y deja de reanudarla automáticamente en reinicios posteriores. Ejecuta
`openclaw tasks maintenance --apply` para conciliar el registro de la tarea, o
`openclaw doctor --fix` para borrar las marcas obsoletas de recuperación interrumpida en
las sesiones con marca de exclusión.

<Note>
Si la creación de un subagente falla con `PAIRING_REQUIRED` /
`scope-upgrade` del Gateway, comprueba el invocador RPC antes de editar el estado de emparejamiento.
Las operaciones internas de coordinación de `sessions_spawn` se despachan dentro del proceso cuando el
invocador ya se está ejecutando en el contexto de la solicitud del Gateway, por lo que no se
abre un WebSocket de bucle invertido ni se depende del ámbito de referencia de dispositivos emparejados
de la CLI. Los invocadores externos al proceso del Gateway siguen usando la alternativa de WebSocket
como `client.id: "gateway-client"` con `client.mode: "backend"`
mediante autenticación directa de bucle invertido con token compartido o contraseña. Los invocadores remotos, el
`deviceIdentity` explícito, las rutas explícitas con token de dispositivo y los clientes
de navegador o Node siguen necesitando la aprobación normal del dispositivo para ampliar los ámbitos.
</Note>

## Detención

- Enviar `/stop` en el chat del solicitante interrumpe la sesión del solicitante y detiene todas las ejecuciones activas de subagentes iniciadas desde ella, propagándose a los elementos secundarios anidados.

## Limitaciones

- El anuncio del subagente funciona con **máximo esfuerzo**. Si el Gateway se reinicia, se pierde el trabajo pendiente de «anunciar de vuelta».
- Los subagentes siguen compartiendo los mismos recursos del proceso del Gateway; considera `maxConcurrent` una válvula de seguridad.
- `sessions_spawn` nunca bloquea: devuelve `{ status: "accepted", runId, childSessionKey }` inmediatamente.
- El contexto del subagente solo inyecta `AGENTS.md` y `TOOLS.md` (sin `SOUL.md`, `IDENTITY.md`, `USER.md`, `MEMORY.md`, `HEARTBEAT.md` ni `BOOTSTRAP.md`). Los subagentes nativos de Codex respetan el mismo límite: `TOOLS.md` permanece en las instrucciones heredadas del hilo de Codex, mientras que los archivos de perfil, identidad y usuario exclusivos del agente principal se inyectan como instrucciones de colaboración limitadas al turno para que los agentes secundarios no los clonen.
- La profundidad máxima de anidamiento es 5 (intervalo de `maxSpawnDepth`: 1-5). Se recomienda una profundidad de 2 para la mayoría de los casos de uso.
- `maxChildrenPerAgent` limita los elementos secundarios activos por sesión (valor predeterminado: `5`; intervalo: `1-20`).

## Contenido relacionado

- [Herramientas de sesión y cambios de estado](/es/concepts/session-tool)
- [Agentes ACP](/es/tools/acp-agents)
- [Envío de agentes](/es/tools/agent-send)
- [Tareas en segundo plano](/es/automation/tasks)
- [Herramientas de entorno aislado multiagente](/es/tools/multi-agent-sandbox-tools)

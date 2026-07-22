---
read_when:
    - Se desea realizar trabajo en segundo plano o en paralelo mediante el agente
    - Está cambiando la política de la herramienta sessions_spawn o de subagentes
    - Está implementando o solucionando problemas de sesiones de subagentes vinculadas a hilos
sidebarTitle: Sub-agents
summary: Inicia ejecuciones aisladas de agentes en segundo plano que anuncien los resultados en el chat del solicitante.
title: Subagentes
x-i18n:
    generated_at: "2026-07-22T10:52:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: e45b32fdb177c52ed785287712b9b6c2c30bbe392f0ce975970910ff91ed30ed
    source_path: tools/subagents.md
    workflow: 16
---

Los subagentes son ejecuciones de agentes en segundo plano que se inician desde una ejecución de agente existente.
Cada uno se ejecuta en su propia sesión (`agent:<agentId>:subagent:<uuid>`) y,
al finalizar, **anuncia** su resultado de vuelta al canal de chat solicitante.
Cada ejecución de subagente se registra como una [tarea en segundo plano](/es/automation/tasks).

Objetivos:

- Paralelizar la investigación, las tareas largas y el trabajo lento con herramientas sin bloquear la ejecución principal.
- Mantener los subagentes aislados de forma predeterminada (separación de sesiones y aislamiento opcional).
- Mantener la superficie de herramientas difícil de usar incorrectamente: los subagentes **no** reciben herramientas de sesión ni de mensajería de forma predeterminada.
- Admitir una profundidad de anidamiento configurable para patrones de orquestación.

<Note>
**Nota sobre costes:** cada subagente tiene su propio contexto y consumo de tokens de
forma predeterminada. Para tareas pesadas o repetitivas, configure un modelo más económico para los subagentes
y mantenga el agente principal en un modelo de mayor calidad mediante
`agents.defaults.subagents.model` o anulaciones por agente. Cuando un agente secundario
necesite realmente la transcripción actual del solicitante, inícielo con
`context: "fork"`. Las sesiones de subagentes vinculadas a hilos usan de forma predeterminada
`context: "fork"`, porque bifurcan la conversación actual en un
hilo de seguimiento.
</Note>

## Comando de barra

`/subagents` inspecciona las ejecuciones de subagentes de la **sesión actual**:

```text
/subagents list
/subagents log <id|#> [limit] [tools]
/subagents info <id|#>
```

`/subagents info` muestra los metadatos de la ejecución (estado, marcas de tiempo, id. de sesión,
ruta de la transcripción y limpieza). `/subagents log` muestra los turnos de chat recientes de una
ejecución; añada el token `tools` para incluir mensajes de llamadas a herramientas y sus resultados (omitidos
de forma predeterminada). Use `sessions_history` para obtener una vista de consulta
acotada y filtrada por seguridad desde un turno de agente, o inspeccione la ruta de la transcripción en el disco para
consultar la transcripción completa sin procesar.

En la interfaz de control, las sesiones principales con ejecuciones secundarias recientes tienen una fila
expandible en la barra lateral. Las filas anidadas muestran el estado y el tiempo de ejecución del agente secundario, y al seleccionar una
se abre el chat de ese agente secundario conservando la jerarquía principal.

### Controles de vinculación a hilos

Estos comandos funcionan en canales con vinculaciones persistentes a hilos. Consulte
[Canales compatibles con hilos](#thread-supporting-channels) más adelante.

```text
/focus <subagent-label|session-key|session-id|session-label>
/unfocus
/agents
/session idle <duration|off>
/session max-age <duration|off>
```

### Comportamiento de inicio

Los agentes inician subagentes en segundo plano con la herramienta `sessions_spawn`.
Las finalizaciones se devuelven como eventos internos de la sesión principal; el agente
principal/solicitante decide si es necesaria una actualización visible para el usuario.

<AccordionGroup>
  <Accordion title="Finalización no bloqueante basada en envío">
    - `sessions_spawn` no es bloqueante; devuelve inmediatamente un id. de ejecución.
    - Al finalizar, el subagente informa a la sesión principal/solicitante.
    - Los turnos de agente que necesiten resultados de agentes secundarios deben llamar a `sessions_yield` después de iniciar el trabajo requerido. Esto finaliza el turno actual y permite que el evento de finalización llegue como el siguiente mensaje visible para el modelo.
    - La finalización se basa en envío. Una vez iniciado, **no** consulte `/subagents list`, `sessions_list` ni `sessions_history` repetidamente solo para esperar a que termine; compruebe el estado bajo demanda únicamente durante la depuración.
    - La salida del agente secundario es un informe o evidencia para que el agente solicitante la sintetice. No es texto de instrucciones creado por el usuario y no puede anular las políticas del sistema, del desarrollador ni del usuario.
    - Al finalizar, OpenClaw intenta cerrar las pestañas y los procesos del navegador registrados que haya abierto la sesión de ese subagente antes de que continúe el flujo de limpieza del anuncio.

  </Accordion>
  <Accordion title="Entrega de la finalización">
    - OpenClaw devuelve las finalizaciones a la sesión solicitante mediante un turno `agent` con una clave de idempotencia estable.
    - Si la ejecución solicitante sigue activa, OpenClaw primero intenta reactivarla o dirigirla, en lugar de iniciar una segunda ruta de respuesta visible.
    - Si no se puede reactivar a un solicitante activo, OpenClaw recurre a una transferencia al agente solicitante con el mismo contexto de finalización, en lugar de descartar el anuncio.
    - Una transferencia correcta al agente principal completa la entrega del subagente incluso cuando el agente principal decide que no es necesaria ninguna actualización visible para el usuario.
    - Los subagentes nativos no reciben la herramienta de mensajería. Devuelven texto sin formato del asistente al agente principal/solicitante; las respuestas visibles para las personas siguen estando controladas por la política de entrega habitual del agente principal/solicitante.
    - Si no se puede usar la transferencia directa, la entrega recurre al enrutamiento mediante cola y, después, a un breve reintento del anuncio con retroceso exponencial antes de abandonarlo definitivamente.
    - La entrega conserva la ruta resuelta del solicitante: las rutas de finalización vinculadas a un hilo o a una conversación tienen prioridad cuando están disponibles. Si el origen de la finalización solo proporciona un canal, OpenClaw completa el destino o la cuenta que falte a partir de la ruta resuelta de la sesión solicitante (`lastChannel` / `lastTo` / `lastAccountId`) para que la entrega directa siga funcionando.

  </Accordion>
  <Accordion title="Metadatos de transferencia de la finalización">
    La transferencia de la finalización a la sesión solicitante es contexto interno generado
    durante la ejecución (no texto creado por el usuario) e incluye:

    - `Result` — el texto de respuesta `assistant` visible más reciente del agente secundario. La salida de tool/toolResult no se incorpora a los resultados del agente secundario. Las ejecuciones con fallo terminal no reutilizan el texto de respuesta capturado.
    - `Status` — `completed; ready for parent review` / `failed` / `timed out` / `unknown`.
    - Estadísticas compactas de ejecución y tokens.
    - Una instrucción de revisión que indica al agente solicitante que verifique el resultado antes de decidir si la tarea original está terminada.
    - Indicaciones de seguimiento que indican al agente solicitante que continúe la tarea o registre un seguimiento cuando el resultado del agente secundario deje acciones pendientes.
    - Una instrucción de actualización final para la ruta sin más acciones, redactada con la voz habitual del asistente sin reenviar metadatos internos sin procesar.

  </Accordion>
  <Accordion title="Modos y entorno de ejecución ACP">
    - `--model` y `--thinking` anulan los valores predeterminados para esa ejecución específica.
    - Use `info`/`log` para inspeccionar los detalles y la salida tras la finalización.
    - Para sesiones persistentes vinculadas a hilos, use `sessions_spawn` con `thread: true` y `mode: "session"`.
    - Si el canal solicitante no admite vinculaciones a hilos, use `mode: "run"` en lugar de volver a intentar una combinación vinculada a hilos que no puede funcionar.
    - Para sesiones de entornos ACP (Claude Code, Gemini CLI, OpenCode o Codex ACP/acpx explícito), use `sessions_spawn` con `runtime: "acp"` cuando la herramienta anuncie ese entorno de ejecución. Consulte [Modelo de entrega de ACP](/es/tools/acp-agents#delivery-model) al depurar finalizaciones o bucles entre agentes. Cuando el Plugin `codex` esté habilitado, el control de chats e hilos de Codex debe preferir `/codex ...` frente a ACP, salvo que el usuario solicite explícitamente ACP/acpx.
    - OpenClaw oculta `runtime: "acp"` hasta que ACP esté habilitado, el solicitante no esté aislado y se haya cargado un Plugin de backend como `acpx`. `runtime: "acp"` espera un id. de entorno ACP externo o una entrada `agents.entries.*` con `runtime.type="acp"`; use el entorno de ejecución de subagentes predeterminado para los agentes de configuración habituales de OpenClaw procedentes de `agents_list`.

  </Accordion>
</AccordionGroup>

## Modos de contexto

Los subagentes nativos comienzan aislados, salvo que el llamador solicite explícitamente bifurcar
la transcripción actual.

| Modo       | Cuándo usarlo                                                                                                                         | Comportamiento                                                                          |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `isolated` | Investigación nueva, implementación independiente, trabajo lento con herramientas o cualquier tarea que pueda explicarse en el texto de la tarea                           | Crea una transcripción secundaria limpia. Es el valor predeterminado y reduce el consumo de tokens.  |
| `fork`     | Trabajo que depende de la conversación actual, de resultados anteriores de herramientas o de instrucciones con matices ya presentes en la transcripción del solicitante | Bifurca la transcripción del solicitante en la sesión secundaria antes de que se inicie el agente secundario. |

Use `fork` con moderación. Está destinado a la delegación sensible al contexto, no a
sustituir la redacción de una instrucción de tarea clara.

## Herramienta: `sessions_spawn`

Inicia una ejecución de subagente con `deliver: false` en la vía global `subagent`,
después ejecuta un paso de anuncio y publica la respuesta del anuncio en el canal de
chat solicitante.

La disponibilidad depende de la política efectiva de herramientas del llamador. Los perfiles integrados
`coding` y `messaging` incluyen `sessions_spawn`,
`sessions_yield` y `subagents`; `minimal` no los incluye. `full` permite todas las
herramientas. Añada esas herramientas con `tools.alsoAllow`, o use uno de los perfiles
anteriores, para un agente con un perfil personalizado más restrictivo que aun así deba
delegar trabajo.
Las políticas de canal/grupo, proveedor, aislamiento y permisos o denegaciones por agente pueden
seguir eliminando la herramienta después de la etapa de perfil. Use `/tools` desde la misma
sesión para confirmar la lista efectiva de herramientas.

**Valores predeterminados:**

- **Modelo:** los subagentes nativos heredan el del llamador, salvo que se establezca `agents.defaults.subagents.model` (o `agents.entries.*.subagents.model` por agente). Los inicios del entorno de ejecución ACP usan el mismo modelo de subagente configurado cuando está presente; de lo contrario, el entorno ACP conserva su propio valor predeterminado. Un `sessions_spawn.model` explícito sigue teniendo prioridad.
- **Razonamiento:** los subagentes nativos heredan el del llamador, salvo que se establezca `agents.defaults.subagents.thinking` (o `agents.entries.*.subagents.thinking` por agente). Los inicios del entorno de ejecución ACP también aplican `agents.defaults.models["provider/model"].params.thinking` al modelo seleccionado. Un `sessions_spawn.thinking` explícito sigue teniendo prioridad.
- **Tiempo de espera de la ejecución:** OpenClaw usa `agents.defaults.subagents.runTimeoutSeconds` cuando está establecido; de lo contrario, recurre a `0` (sin tiempo de espera). `sessions_spawn` no acepta anulaciones del tiempo de espera por llamada.
- **Duración del proceso:** un subagente independiente de OpenClaw tiene su propio ciclo de vida de ejecución. Una tarea en segundo plano creada dentro de un backend de CLI externo es diferente: comparte el subproceso de CLI principal y se detiene si dicho proceso principal alcanza `agents.defaults.timeoutSeconds`.
- **Entrega de tareas:** los subagentes nativos reciben la tarea delegada en su primer mensaje `[Subagent Task]` visible. La instrucción del sistema del subagente contiene las reglas de ejecución y el contexto de enrutamiento, no un duplicado oculto de la tarea.

Los inicios de subagentes nativos aceptados incluyen los metadatos resueltos del modelo secundario
en el resultado de la herramienta: `resolvedModel` contiene la referencia de modelo aplicada y
`resolvedProvider` contiene el prefijo del proveedor cuando la referencia incluye uno.

### Modo de instrucciones de delegación

`agents.defaults.subagents.delegationMode` controla únicamente las indicaciones de las instrucciones; no cambia la política de herramientas ni impone la delegación.

- `suggest` (predeterminado): conserva la indicación estándar de usar subagentes para trabajos más grandes o lentos.
- `prefer`: indica al agente principal que mantenga la capacidad de respuesta y delegue mediante `sessions_spawn` cualquier tarea más compleja que una respuesta directa.

Anulación por agente: `agents.entries.*.subagents.delegationMode`.

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
  Identificador estable opcional para identificar un proceso secundario específico en salidas de estado posteriores. Debe coincidir con `[a-z][a-z0-9_-]{0,63}` y no puede ser un destino reservado como `last` o `all`.
</ParamField>
<ParamField path="label" type="string">
  Etiqueta opcional legible para humanos.
</ParamField>
<ParamField path="agentId" type="string">
  Inicia bajo otro id de agente configurado cuando lo permita `subagents.allowAgents`.
</ParamField>
<ParamField path="cwd" type="string">
  Directorio de trabajo opcional de la tarea para la ejecución secundaria. Los subagentes nativos siguen cargando los archivos de arranque desde el espacio de trabajo del agente de destino; `cwd` solo cambia dónde realizan el trabajo delegado las herramientas de tiempo de ejecución y los entornos de CLI.
</ParamField>
<ParamField path="runtime" type='"subagent" | "acp"' default="subagent">
  `acp` es solo para entornos ACP externos (`claude`, `droid`, `gemini`, `opencode` o Codex ACP/acpx solicitado explícitamente) y para entradas `agents.entries.*` cuyo `runtime.type` sea `acp`.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  Solo ACP. Reanuda una sesión existente del entorno ACP cuando `runtime: "acp"`; se ignora para inicios de subagentes nativos.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  Solo ACP. Transmite la salida de la ejecución ACP a la sesión principal cuando `runtime: "acp"`; se omite para inicios de subagentes nativos.
</ParamField>
<ParamField path="model" type="string">
  Sustituye el modelo del subagente. Los valores no válidos se omiten y el subagente se ejecuta con el modelo predeterminado, con una advertencia en el resultado de la herramienta.
</ParamField>
<ParamField path="thinking" type="string">
  Sustituye el nivel de razonamiento para la ejecución del subagente. No está disponible con `visible: true`.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Cuando `true`, solicita vincular esta sesión del subagente al hilo del canal.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  Si `thread: true` y se omite `mode`, el valor predeterminado pasa a ser `session`. `mode: "session"` requiere `thread: true`.
  Si la vinculación de hilos no está disponible para el canal solicitante, utilice `mode: "run"` en su lugar.
  Con `visible: true`, omita `mode`; las sesiones visibles son persistentes y no admiten `mode: "run"`.
</ParamField>
<ParamField path="cleanup" type='"delete" | "keep"' default="keep">
  `"delete"` archiva la sesión inmediatamente después del anuncio (aun así conserva la transcripción mediante un cambio de nombre).
</ParamField>
<ParamField path="sandbox" type='"inherit" | "require"' default="inherit">
  `require` rechaza el inicio a menos que el tiempo de ejecución secundario de destino esté aislado.
</ParamField>
<ParamField path="context" type='"isolated" | "fork"' default="isolated">
  `fork` bifurca la transcripción actual del solicitante en la sesión secundaria. Solo para subagentes nativos. Los inicios vinculados a hilos usan `fork` de forma predeterminada; los inicios no vinculados a hilos usan `isolated`. Una bifurcación visible debe tener como destino el mismo agente que el solicitante.
</ParamField>
<ParamField path="visible" type="boolean" default="false">
  Crea una sesión persistente del panel que el usuario puede abrir en la interfaz de control. Los inicios visibles solo admiten `runtime: "subagent"` y siempre conservan la sesión creada.
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
`sessions_spawn` **no** acepta parámetros de entrega al canal (`target`,
`channel`, `to`, `threadId`, `replyTo`, `transport`). Los subagentes nativos devuelven
su último turno del asistente al solicitante; la entrega externa permanece a cargo
del agente principal/solicitante.
</Warning>

Con `visible: true`, se admiten `model`, `cwd` y un `context: "fork"` del mismo agente. Un destino aislado restringe `cwd` al espacio de trabajo de ese agente. La vinculación de hilos, `mode`, las sustituciones del nivel de razonamiento, `lightContext`, `attachments` y `attachAs` no están disponibles en esta ruta porque las sesiones visibles son sesiones persistentes del panel creadas mediante `sessions.create`. El inicio visible se rechaza cuando el propio solicitante se inició con una lista heredada de herramientas permitidas o denegadas; esa restricción se fija en el momento del inicio y no tiene ninguna sustitución de configuración. La enumeración y el direccionamiento de sesiones cumplen `tools.sessions.visibility`; el ámbito predeterminado `tree` abarca la sesión actual y su propio subárbol de procesos iniciados. Consulte [Árboles de trabajo administrados](/es/concepts/managed-worktrees) para conocer el comportamiento de denominación, configuración, limpieza y restauración de las copias de trabajo.

### Nombres de tareas y direccionamiento

`taskName` es un identificador para la orquestación orientado al modelo, no una clave de sesión.
Utilícelo para nombres estables de procesos secundarios como `review_subagents`,
`linux_validation` o `docs_update` cuando un coordinador pueda necesitar inspeccionar
ese proceso secundario más adelante.

La resolución de destinos acepta coincidencias exactas de `taskName` y
prefijos inequívocos. La coincidencia se limita a la misma ventana de destinos
activos/recientes utilizada por los destinos numerados `/subagents`, por lo que
un proceso secundario completado y obsoleto no vuelve ambiguo un identificador reutilizado.
Si dos procesos secundarios activos o recientes comparten el mismo
`taskName`, el destino es ambiguo; utilice en su lugar el índice de la lista, la clave de sesión o
el id de ejecución.

Los destinos reservados `last` y `all` no son valores válidos de `taskName`
porque ya tienen significados de control.

## Herramienta: `sessions_yield`

Finaliza el turno actual del modelo y espera a que lleguen como siguiente mensaje
eventos del tiempo de ejecución, principalmente eventos de finalización
de subagentes. Utilícela después de iniciar el trabajo secundario necesario cuando
el solicitante no pueda producir una respuesta final hasta que lleguen esas finalizaciones.

`sessions_yield` es la primitiva de espera. No la sustituya por bucles de sondeo
sobre `subagents`, `sessions_list`, `sessions_history`, el comando de shell
`sleep` ni el sondeo de procesos únicamente para detectar la finalización de un proceso secundario.

Utilice `sessions_yield` solo cuando la lista efectiva de herramientas de la sesión
la incluya. Algunos perfiles de herramientas mínimos o personalizados pueden exponer `sessions_spawn` y
`subagents` sin exponer `sessions_yield`; en ese caso, no invente
un bucle de sondeo únicamente para esperar la finalización.

Cuando existen procesos secundarios activos, OpenClaw inserta un bloque de indicaciones compacto
`Active Subagents`, generado en tiempo de ejecución, en los turnos normales para que el solicitante pueda ver
las sesiones secundarias actuales, los id de ejecución, estados, etiquetas, tareas y
alias `taskName` sin sondeos. Los campos de tarea y etiqueta de ese
bloque se citan como datos, no como instrucciones, porque pueden proceder
de argumentos de inicio proporcionados por el usuario o el modelo.

## Herramienta: `subagents`

Enumera las ejecuciones de subagentes iniciadas y los registros de tareas en segundo plano que pertenecen al
árbol de sesiones del solicitante. Las filas de tareas abarcan subagentes nativos, ejecuciones ACP,
trabajo de CLI/multimedia del Gateway y ejecuciones de cron. Su ámbito se limita al solicitante
actual; un proceso secundario solo puede ver sus propios procesos secundarios controlados.

Utilice `subagents` para consultar el estado y depurar cuando sea necesario. Utilice `sessions_yield` para
esperar eventos de finalización.

Utilice `action: "cancel"` con un `taskId` devuelto por `action: "list"` para detener
una tarea. La cancelación se limita al árbol de sesiones controlado; un subagente
hoja no puede cancelar trabajo perteneciente a otra sesión.

## Sesiones vinculadas a hilos

Cuando las vinculaciones de hilos están habilitadas para un canal, un subagente puede permanecer vinculado
a un hilo para que los mensajes posteriores del usuario en ese hilo sigan dirigiéndose a la
misma sesión del subagente.

### Canales compatibles con hilos

Un canal admite sesiones persistentes de subagentes vinculadas a hilos
(`sessions_spawn` con `thread: true`) cuando registra un adaptador de
vinculación de conversaciones. Canales incluidos con esa compatibilidad: **Discord**,
**iMessage**, **Matrix** y **Telegram**. Discord y Matrix crean de forma predeterminada
un hilo secundario; Telegram e iMessage se vinculan de forma predeterminada a la
conversación actual. Utilice las claves de configuración `threadBindings` de cada canal para
la habilitación, los tiempos de espera y `spawnSessions`.

### Flujo rápido

<Steps>
  <Step title="Iniciar">
    `sessions_spawn` con `thread: true` (y, opcionalmente, `mode: "session"`).
  </Step>
  <Step title="Vincular">
    OpenClaw crea o vincula un hilo a ese destino de sesión en el canal activo.
  </Step>
  <Step title="Dirigir mensajes posteriores">
    Las respuestas y los mensajes posteriores de ese hilo se dirigen a la sesión vinculada.
  </Step>
  <Step title="Inspeccionar tiempos de espera">
    Utilice `/session idle` para inspeccionar/actualizar la pérdida automática de foco por inactividad y
    `/session max-age` para controlar el límite máximo.
  </Step>
  <Step title="Desvincular">
    Utilice `/unfocus` para desvincular manualmente.
  </Step>
</Steps>

### Controles manuales

| Comando            | Efecto                                                                                    |
| ------------------ | ----------------------------------------------------------------------------------------- |
| `/focus <target>`  | Vincula el hilo actual (o crea uno) a un destino de subagente/sesión                     |
| `/unfocus`         | Elimina la vinculación del hilo vinculado actual                                           |
| `/agents`          | Enumera las ejecuciones activas y el estado de vinculación (`binding:<id>`, `unbound` o `bindings unavailable`) |
| `/session idle`    | Inspecciona/actualiza la pérdida automática de foco por inactividad (solo hilos vinculados con foco)                             |
| `/session max-age` | Inspecciona/actualiza el límite máximo (solo hilos vinculados con foco)                                      |

### Opciones de configuración

- **Valor predeterminado global:** `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
- **Las claves de sustitución por canal y vinculación automática al iniciar** son específicas del adaptador. Consulte [Canales compatibles con hilos](#thread-supporting-channels) más arriba.

Consulte [Referencia de configuración](/es/gateway/configuration-reference) y
[Comandos de barra diagonal](/es/tools/slash-commands) para conocer los detalles actuales de los adaptadores.

### Lista de permitidos

<ParamField path="agents.entries.*.subagents.allowAgents" type="string[]">
  Lista de id de agentes configurados que pueden ser destinos mediante un `agentId` explícito (`["*"]` permite cualquier destino configurado). Valor predeterminado: solo el agente solicitante. Si establece una lista y aun así desea que el solicitante se inicie a sí mismo con `agentId`, incluya el id del solicitante en la lista.
</ParamField>
<ParamField path="agents.defaults.subagents.allowAgents" type="string[]">
  Lista predeterminada de agentes de destino configurados permitidos que se utiliza cuando el agente solicitante no establece su propio `subagents.allowAgents`.
</ParamField>
<ParamField path="agents.defaults.subagents.requireAgentId" type="boolean" default="false">
  Bloquea las llamadas `sessions_spawn` que omitan `agentId` (obliga a seleccionar explícitamente un perfil). Sustitución por agente: `agents.entries.*.subagents.requireAgentId`.
</ParamField>
<ParamField path="agents.defaults.subagents.announceTimeoutMs" type="number" default="120000">
  Tiempo de espera por llamada para los intentos de entrega de anuncios `agent` del Gateway. Los valores son milisegundos enteros positivos y se limitan al máximo seguro del temporizador de la plataforma. Los reintentos transitorios pueden hacer que la espera total del anuncio sea superior a un tiempo de espera configurado.
</ParamField>

Si la sesión solicitante está aislada, `sessions_spawn` rechaza los destinos
que se ejecutarían sin aislamiento.

### Descubrimiento

Usa `agents_list` para ver qué ids de agente están permitidos actualmente para
`sessions_spawn`. La respuesta incluye el modelo efectivo de cada agente enumerado
y los metadatos del entorno de ejecución integrado para que los consumidores puedan distinguir OpenClaw, el servidor de aplicaciones
de Codex y otros entornos de ejecución nativos configurados.

Las entradas de `allowAgents` deben apuntar a ids de agente configurados en `agents.entries.*`.
`["*"]` significa cualquier agente de destino configurado más el solicitante. Si se elimina una configuración de agente
pero su id permanece en `allowAgents`, `sessions_spawn` rechaza ese id
y `agents_list` lo omite. Ejecuta `openclaw doctor --fix` para limpiar entradas obsoletas
de la lista de permitidos, o añade una entrada mínima de `agents.entries.*` cuando el destino deba
seguir pudiendo iniciarse y heredar los valores predeterminados.

### Archivado automático

- Las sesiones de subagentes se archivan automáticamente después de `agents.defaults.subagents.archiveAfterMinutes` (valor predeterminado: `60`).
- El archivado usa `sessions.delete` y cambia el nombre de la transcripción a `*.deleted.<timestamp>` (en la misma carpeta).
- `cleanup: "delete"` archiva inmediatamente después del anuncio (la transcripción se conserva mediante el cambio de nombre).
- El archivado automático se realiza con el mejor esfuerzo; los temporizadores pendientes se pierden si el Gateway se reinicia.
- Los tiempos de espera de ejecución configurados **no** archivan automáticamente; solo detienen la ejecución. La sesión permanece hasta el archivado automático.
- El archivado automático se aplica por igual a las sesiones de profundidad 1 y 2.
- La limpieza del navegador es independiente de la limpieza del archivo: se intenta cerrar las pestañas y los procesos del navegador registrados cuando termina la ejecución, aunque se conserve el registro de la transcripción o la sesión.

## Subagentes anidados

De forma predeterminada, los subagentes no pueden iniciar sus propios subagentes
(`maxSpawnDepth: 1`). Establece `maxSpawnDepth: 2` para habilitar un nivel de
anidamiento: el **patrón de orquestador**: principal → subagente orquestador →
subsubagentes trabajadores.

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxSpawnDepth: 2, // permitir que los subagentes inicien hijos (valor predeterminado: 1, intervalo 1-5)
        maxChildrenPerAgent: 5, // máximo de hijos activos por sesión de agente (valor predeterminado: 5, intervalo 1-20)
        maxConcurrent: 8, // límite global del canal de concurrencia (valor predeterminado: 8)
        runTimeoutSeconds: 900, // tiempo de espera predeterminado para sessions_spawn (0 = sin tiempo de espera)
        announceTimeoutMs: 120000, // tiempo de espera del anuncio del gateway por llamada
      },
    },
  },
}
```

### Niveles de profundidad

| Profundidad | Formato de la clave de sesión                            | Rol                                          | ¿Puede iniciar?                   |
| ----- | -------------------------------------------- | --------------------------------------------- | ---------------------------- |
| 0     | `agent:<id>:main`                            | Agente principal                                    | Siempre                       |
| 1     | `agent:<id>:subagent:<uuid>`                 | Subagente (orquestador cuando se permite la profundidad 2) | Solo si `maxSpawnDepth >= 2` |
| 2     | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | Subsubagente (trabajador hoja)                   | Nunca                        |

### Cadena de anuncios

Los resultados ascienden por la cadena:

1. El trabajador de profundidad 2 termina → anuncia el resultado a su padre (orquestador de profundidad 1).
2. El orquestador de profundidad 1 recibe el anuncio, sintetiza los resultados y termina → anuncia el resultado al agente principal.
3. El agente principal recibe el anuncio y lo entrega al usuario.

Cada nivel solo ve los anuncios de sus hijos directos.

<Note>
**Orientación operativa:** inicia el trabajo secundario una sola vez y espera los eventos
de finalización, en lugar de crear bucles de sondeo en torno a `sessions_list`,
`sessions_history`, `/subagents list` o los comandos de espera `exec`.
`sessions_list` y `/subagents list` mantienen las relaciones entre sesiones secundarias
centradas en el trabajo activo: los hijos activos permanecen asociados, los hijos finalizados
siguen visibles durante un breve período reciente y los enlaces obsoletos a hijos que solo existen
en el almacén se ignoran después de su período de vigencia. Esto evita que los metadatos antiguos
de `spawnedBy` / `parentSessionKey` resuciten hijos fantasma después
de un reinicio. Si llega un evento de finalización de un hijo después de haber enviado
la respuesta final, el seguimiento correcto es el token silencioso exacto
`NO_REPLY` / `no_reply`.
</Note>

### Política de herramientas por profundidad

- Un hijo captura la política efectiva de remitente del solicitante cuando se inicia. Las ejecuciones secundarias sin remitente y las reanudaciones de operadores autenticados conservan esa instantánea aunque `toolsBySender` cambie posteriormente; siguen aplicándose las restricciones globales, de agente, proveedor, entorno aislado y subagente actuales. En cambio, un nuevo turno de un canal externo dirigido al hijo vuelve a resolver la política de remitente actual.
- El rol y el alcance de control se escriben en los metadatos de la sesión en el momento del inicio. Esto evita que las claves de sesión planas o restauradas recuperen accidentalmente privilegios de orquestador.
- **Profundidad 1 (orquestador, cuando `maxSpawnDepth >= 2`):** obtiene `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history` para poder iniciar hijos e inspeccionar su estado. Las demás herramientas de sesión o del sistema permanecen denegadas.
- **Profundidad 1 (hoja, cuando `maxSpawnDepth == 1`):** sin herramientas de sesión (comportamiento predeterminado actual).
- **Profundidad 2 (trabajador hoja):** sin herramientas de sesión; `sessions_spawn` siempre se deniega en la profundidad 2. No puede iniciar más hijos.

### Límite de inicio por agente

Cada sesión de agente (en cualquier profundidad) puede tener como máximo `maxChildrenPerAgent`
(valor predeterminado: `5`) hijos activos al mismo tiempo. Esto evita una expansión descontrolada
desde un único orquestador.

### Detención en cascada

Detener un orquestador de profundidad 1 detiene automáticamente todos sus hijos
de profundidad 2:

- `/stop` en el chat principal detiene todos los agentes de profundidad 1 y propaga la detención a sus hijos de profundidad 2.

## Autenticación

La autenticación de los subagentes se resuelve por **id de agente**, no por tipo de sesión:

- La clave de sesión del subagente es `agent:<agentId>:subagent:<uuid>`.
- El almacén de autenticación se carga desde el `agentDir` de ese agente.
- Los perfiles de autenticación del agente principal se combinan como **respaldo**; los perfiles del agente prevalecen sobre los principales cuando hay conflictos.

La combinación es aditiva, por lo que los perfiles principales siempre están disponibles como
alternativas. Todavía no se admite una autenticación completamente aislada por agente.

## Anuncio

Los subagentes informan mediante un paso de anuncio:

- El paso de anuncio se ejecuta dentro de la sesión del subagente (no en la sesión del solicitante).
- Si el subagente responde exactamente `ANNOUNCE_SKIP`, no se publica nada.
- Si el texto más reciente del asistente es el token silencioso exacto `NO_REPLY` / `no_reply`, se suprime la salida del anuncio aunque haya habido progreso visible anteriormente.

La entrega depende de la profundidad del solicitante:

- Las sesiones de solicitante de nivel superior usan una llamada de seguimiento `agent` con entrega externa (`deliver=true`).
- Las sesiones anidadas del subagente solicitante reciben una inyección interna de seguimiento (`deliver=false`) para que el orquestador pueda sintetizar los resultados secundarios dentro de la sesión.
- Si una sesión anidada del subagente solicitante ya no existe, OpenClaw recurre al solicitante de esa sesión cuando está disponible.

Para las sesiones de solicitante de nivel superior, la entrega directa en modo de finalización primero
resuelve cualquier ruta de conversación o hilo vinculada y cualquier sustitución del hook, y después completa
los campos de canal y destino que falten con la ruta almacenada de la sesión del solicitante.
Esto mantiene las finalizaciones en el chat o tema correcto aunque el origen de la finalización
solo identifique el canal.

La agregación de finalizaciones secundarias se limita a la ejecución actual del solicitante al
crear resultados de finalización anidados, lo que evita que las salidas secundarias obsoletas de
ejecuciones anteriores se filtren en el anuncio actual. Las respuestas de anuncio conservan
el enrutamiento de hilo o tema cuando está disponible en los adaptadores de canal.

### Contexto del anuncio

El contexto del anuncio se normaliza como un bloque de eventos interno estable:

| Campo          | Origen                                                                                                   |
| -------------- | -------------------------------------------------------------------------------------------------------- |
| Origen         | `subagent` o `cron`                                                                                     |
| Ids de sesión    | Clave/id de la sesión secundaria                                                                                     |
| Tipo           | Tipo de anuncio + etiqueta de tarea                                                                               |
| Estado         | Derivado del resultado del entorno de ejecución (`ok`, `error`, `timeout` o `unknown`); **no** se infiere del texto del modelo |
| Contenido del resultado | Texto visible más reciente del asistente del hijo                                                             |
| Seguimiento      | Instrucción que describe cuándo responder y cuándo permanecer en silencio                                                      |

Las ejecuciones fallidas terminales informan del estado de error sin reproducir el texto
de respuesta capturado. La salida de tool/toolResult no se incorpora al texto del resultado secundario.

### Línea de estadísticas

Las cargas útiles de anuncio incluyen una línea de estadísticas al final (incluso cuando están encapsuladas):

- Tiempo de ejecución (por ejemplo, `runtime 5m12s`).
- Uso de tokens (entrada/salida/total).
- Coste estimado cuando están configurados los precios del modelo (`models.providers.*.models[].cost`).
- `sessionKey`, `sessionId` y la ruta de la transcripción para que el agente principal pueda recuperar el historial mediante `sessions_history` o inspeccionar el archivo en disco.

Los metadatos internos están destinados únicamente a la orquestación; las respuestas dirigidas al usuario
deben reformularse con la voz normal del asistente.

### Por qué se prefiere `sessions_history`

`sessions_history` es la vía de orquestación más segura para leer la transcripción de un hijo
desde un turno del agente:

- Oculta texto similar a credenciales o tokens incluso cuando la ocultación general de registros está deshabilitada.
- Trunca los bloques de texto largos (4000 caracteres por bloque) y descarta firmas de pensamiento, cargas útiles de reproducción del razonamiento y datos de imágenes en línea.
- Aplica un límite de respuesta de 80 KB; las filas demasiado grandes se sustituyen por `[sessions_history omitted: message too large]`.
- Usa `nextOffset` cuando esté presente para retroceder por ventanas más antiguas de la transcripción.
- `sessions_history` **no** elimina las etiquetas de razonamiento, la estructura de `<relevant-memories>` ni el XML de llamadas a herramientas del texto de los mensajes: devuelve bloques de contenido estructurados cercanos al formato original de la transcripción, únicamente ocultados y con tamaño limitado. `/subagents log` aplica un saneamiento de prosa más exhaustivo (elimina etiquetas de razonamiento, estructuras de memoria y XML de llamadas a herramientas) porque representa líneas de chat simples en lugar de bloques estructurados.
- La inspección de la transcripción original en disco es la alternativa cuando se necesita la transcripción completa byte por byte.

## Política de herramientas

Los subagentes usan primero el mismo perfil y la misma cadena de políticas de herramientas que el agente
principal o de destino. Después, OpenClaw aplica la capa de restricciones
para subagentes.

Los subagentes siempre pierden `gateway`, `agents_list`, `session_status` y
`cron`, independientemente de la profundidad o el rol (herramientas interactivas o del sistema,
o herramientas que debe coordinar el agente principal). Los subagentes hoja (comportamiento
predeterminado de profundidad 1 y siempre en la profundidad 2) pierden además `subagents`,
`sessions_list`, `sessions_history` y `sessions_spawn`. Los subagentes nunca
obtienen la herramienta `message`: se deshabilita en el momento del inicio, no se filtra mediante
esta lista de denegación; además, `sessions_send` permanece denegado para que los subagentes
se comuniquen únicamente mediante la cadena de anuncios.

`sessions_history` también sigue siendo aquí una vista de recuperación limitada y saneada;
no es un volcado de la transcripción original.

Cuando `maxSpawnDepth >= 2`, los subagentes orquestadores de profundidad 1 reciben además
`sessions_spawn`, `subagents`, `sessions_list` y
`sessions_history` para poder gestionar a sus hijos.

### Sustitución mediante la configuración

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
        // si se establece allow, pasa a permitir solo esos elementos (deny sigue prevaleciendo)
        // allow: ["read", "exec", "process"]
      },
    },
  },
}
```

`tools.subagents.tools.allow` es un filtro final que permite únicamente lo especificado. Puede restringir
el conjunto de herramientas ya resuelto, pero no puede **volver a añadir** una herramienta eliminada
por `tools.profile`. Por ejemplo, `tools.profile: "coding"` incluye
`web_search`/`web_fetch`, pero no la herramienta `browser`. Para permitir que
los subagentes con perfil de programación utilicen la automatización del navegador, añada browser en la
etapa del perfil:

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

Utilice `agents.entries.*.tools.alsoAllow: ["browser"]` por agente cuando solo un
agente deba disponer de automatización del navegador.

## Concurrencia

Los subagentes utilizan un carril de cola dedicado dentro del proceso:

- **Nombre del carril:** `subagent`
- **Concurrencia:** `agents.defaults.subagents.maxConcurrent` (valor predeterminado: `8`)

## Actividad y recuperación

OpenClaw no considera la ausencia de `endedAt` como prueba permanente de que un
subagente sigue activo. Las ejecuciones sin finalizar cuya antigüedad supere la ventana de ejecuciones obsoletas
(2 horas, o el tiempo de espera de ejecución configurado más un breve período de gracia,
lo que sea mayor) dejan de contar como activas o pendientes en `/subagents list`,
los resúmenes de estado, el bloqueo de finalización de descendientes y las comprobaciones de
concurrencia por sesión.

Después de reiniciar el Gateway, las ejecuciones restauradas, obsoletas y sin finalizar se eliminan, salvo que
su sesión secundaria esté marcada como `abortedLastRun: true`. Las ejecuciones
interrumpidas por el reinicio permanecen registradas para el flujo de recuperación de subagentes huérfanos: las ejecuciones
obsoletas se finalizan sin reanudarse, mientras que las sesiones secundarias recientes reciben
un mensaje de reanudación sintético antes de que se borre el marcador de interrupción.

La recuperación automática tras un reinicio está limitada por sesión secundaria. Si el mismo
subagente secundario se acepta repetidamente para la recuperación de huérfanos dentro de la
ventana de bloqueo rápido reiterado, OpenClaw conserva una marca de recuperación permanente en esa
sesión y deja de reanudarla automáticamente en reinicios posteriores. Ejecute
`openclaw tasks maintenance --apply` para conciliar el registro de la tarea, o
`openclaw doctor --fix` para borrar las marcas obsoletas de recuperación interrumpida de
las sesiones con marca permanente.

<Note>
Si la creación de un subagente falla con `PAIRING_REQUIRED` /
`scope-upgrade` del Gateway, compruebe el invocador RPC antes de editar el estado de emparejamiento.
Las coordinaciones internas de `sessions_spawn` se envían dentro del proceso cuando el
invocador ya se ejecuta en el contexto de solicitud del Gateway, por lo que no
abren un WebSocket de bucle invertido ni dependen del conjunto de ámbitos de referencia
del dispositivo emparejado de la CLI. Los invocadores externos al proceso del Gateway siguen utilizando la
alternativa de WebSocket como `client.id: "gateway-client"` con `client.mode: "backend"`
mediante autenticación directa de bucle invertido con token compartido o contraseña. Los invocadores remotos, las rutas explícitas de
`deviceIdentity` y de token de dispositivo, así como los clientes de navegador o Node,
siguen necesitando la aprobación normal del dispositivo para ampliar los ámbitos.
</Note>

## Detención

- Enviar `/stop` en el chat solicitante interrumpe la sesión solicitante y detiene todas las ejecuciones activas de subagentes iniciadas desde ella, propagándose a los descendientes anidados.

## Limitaciones

- El anuncio de los subagentes se realiza con **el máximo esfuerzo**. Si el Gateway se reinicia, se pierde el trabajo pendiente de «anunciar de vuelta».
- Los subagentes siguen compartiendo los mismos recursos del proceso del Gateway; considere `maxConcurrent` una válvula de seguridad.
- `sessions_spawn` nunca bloquea: devuelve `{ status: "accepted", runId, childSessionKey }` de inmediato.
- El contexto del subagente solo inyecta `AGENTS.md` y `TOOLS.md` (no `SOUL.md`, `IDENTITY.md`, `USER.md`, `MEMORY.md`, `HEARTBEAT.md` ni `BOOTSTRAP.md`). Los subagentes nativos de Codex siguen el mismo límite: `TOOLS.md` permanece en las instrucciones heredadas del hilo de Codex, mientras que los archivos de perfil, identidad y usuario exclusivos del agente principal se inyectan como instrucciones de colaboración limitadas al turno para que los agentes secundarios no los clonen.
- La profundidad máxima de anidamiento es 5 (intervalo de `maxSpawnDepth`: 1-5). Se recomienda una profundidad de 2 para la mayoría de los casos de uso.
- `maxChildrenPerAgent` limita el número de agentes secundarios activos por sesión (valor predeterminado: `5`; intervalo: `1-20`).

## Contenido relacionado

- [Herramientas de sesión y cambios de estado](/es/concepts/session-tool)
- [Agentes ACP](/es/tools/acp-agents)
- [Envío de agentes](/es/tools/agent-send)
- [Tareas en segundo plano](/es/automation/tasks)
- [Herramientas de entorno aislado multiagente](/es/tools/multi-agent-sandbox-tools)

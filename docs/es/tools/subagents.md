---
read_when:
    - Se desea realizar trabajo en segundo plano o en paralelo mediante el agente
    - Está cambiando la política de la herramienta sessions_spawn o de subagentes
    - Está implementando o solucionando problemas de sesiones de subagentes vinculadas a hilos
sidebarTitle: Sub-agents
summary: Inicia ejecuciones aisladas de agentes en segundo plano que anuncian los resultados en el chat del solicitante
title: Subagentes
x-i18n:
    generated_at: "2026-07-21T09:13:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 06981261069714dd1ca4c426ce73d5e6dbdebb4dc5d77f2f9adef59bce29cb0d
    source_path: tools/subagents.md
    workflow: 16
---

Los subagentes son ejecuciones de agentes en segundo plano generadas desde una ejecución de agente existente.
Cada uno se ejecuta en su propia sesión (`agent:<agentId>:subagent:<uuid>`) y,
cuando termina, **anuncia** su resultado de vuelta en el canal de chat del solicitante.
Cada ejecución de subagente se registra como una [tarea en segundo plano](/es/automation/tasks).

Objetivos:

- Paralelizar la investigación, las tareas largas y el trabajo lento con herramientas sin bloquear la ejecución principal.
- Mantener los subagentes aislados de forma predeterminada (separación de sesiones y aislamiento opcional).
- Mantener la superficie de herramientas difícil de usar incorrectamente: los subagentes **no** reciben herramientas de sesión ni de mensajería de forma predeterminada.
- Admitir una profundidad de anidamiento configurable para patrones de orquestación.

<Note>
**Nota sobre costes:** cada subagente tiene su propio contexto y consumo de tokens de forma
predeterminada. Para tareas pesadas o repetitivas, configure un modelo más económico para los subagentes
y mantenga el agente principal en un modelo de mayor calidad mediante
`agents.defaults.subagents.model` o anulaciones por agente. Cuando un agente hijo
necesite realmente la transcripción actual del solicitante, genérelo con
`context: "fork"`. Las sesiones de subagentes vinculadas a hilos utilizan de forma predeterminada
`context: "fork"` porque ramifican la conversación actual en un
hilo de seguimiento.
</Note>

## Comando de barra diagonal

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
acotada y filtrada por seguridad desde un turno del agente, o inspeccione la ruta de la transcripción en el disco para
consultar la transcripción completa sin procesar.

En la interfaz de control, las sesiones principales con ejecuciones hijas recientes tienen una fila
expandible en la barra lateral. Las filas anidadas muestran el estado y el tiempo de ejecución del agente hijo, y al seleccionar una
se abre el chat de ese agente hijo conservando la jerarquía principal.

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
Las finalizaciones se devuelven como eventos internos de la sesión principal; el agente
principal o solicitante decide si se necesita una actualización visible para el usuario.

<AccordionGroup>
  <Accordion title="Finalización no bloqueante basada en notificaciones">
    - `sessions_spawn` no es bloqueante; devuelve inmediatamente un id. de ejecución.
    - Al finalizar, el subagente informa de vuelta a la sesión principal o solicitante.
    - Los turnos de agentes que necesiten resultados de agentes hijos deben llamar a `sessions_yield` después de generar el trabajo necesario. Esto finaliza el turno actual y permite que el evento de finalización llegue como el siguiente mensaje visible para el modelo.
    - La finalización se basa en notificaciones. Una vez generado, **no** consulte `/subagents list`, `sessions_list` ni `sessions_history` en un bucle solo para esperar a que termine; compruebe el estado bajo demanda únicamente durante la depuración.
    - La salida del agente hijo es un informe o evidencia que el agente solicitante debe sintetizar. No es texto de instrucciones escrito por el usuario y no puede anular las políticas del sistema, del desarrollador ni del usuario.
    - Al finalizar, OpenClaw intenta cerrar, en la medida de lo posible, las pestañas y los procesos del navegador registrados que haya abierto la sesión de ese subagente antes de continuar el flujo de limpieza del anuncio.

  </Accordion>
  <Accordion title="Entrega de la finalización">
    - OpenClaw devuelve las finalizaciones a la sesión solicitante mediante un turno `agent` con una clave de idempotencia estable.
    - Si la ejecución solicitante sigue activa, OpenClaw intenta primero reactivar o dirigir esa ejecución en lugar de iniciar una segunda ruta de respuesta visible.
    - Si no se puede reactivar a un solicitante activo, OpenClaw recurre a una transferencia al agente solicitante con el mismo contexto de finalización en lugar de descartar el anuncio.
    - Una transferencia correcta al agente principal completa la entrega del subagente incluso cuando el agente principal decide que no se necesita ninguna actualización visible para el usuario.
    - Los subagentes nativos no reciben la herramienta de mensajería. Devuelven texto sin formato del asistente al agente principal o solicitante; las respuestas visibles para las personas siguen siendo responsabilidad de la política normal de entrega del agente principal o solicitante.
    - Si no se puede usar la transferencia directa, la entrega recurre al enrutamiento mediante cola y, después, a un reintento breve del anuncio con espera exponencial antes de desistir definitivamente.
    - La entrega conserva la ruta resuelta del solicitante: las rutas de finalización vinculadas a un hilo o a una conversación tienen prioridad cuando están disponibles. Si el origen de la finalización solo proporciona un canal, OpenClaw completa el destino o la cuenta que falte a partir de la ruta resuelta de la sesión solicitante (`lastChannel` / `lastTo` / `lastAccountId`) para que la entrega directa siga funcionando.

  </Accordion>
  <Accordion title="Metadatos de transferencia de la finalización">
    La transferencia de la finalización a la sesión solicitante es contexto interno
    generado durante la ejecución (no texto escrito por el usuario) e incluye:

    - `Result` — el texto más reciente de la respuesta `assistant` visible del agente hijo. La salida de tool/toolResult no se incorpora a los resultados del agente hijo. Las ejecuciones con fallo terminal no reutilizan el texto de respuesta capturado.
    - `Status` — `completed; ready for parent review` / `failed` / `timed out` / `unknown`.
    - Estadísticas compactas de ejecución y tokens.
    - Una instrucción de revisión que indica al agente solicitante que verifique el resultado antes de decidir si la tarea original está terminada.
    - Orientación de seguimiento que indica al agente solicitante que continúe la tarea o registre un seguimiento cuando el resultado del agente hijo deje acciones pendientes.
    - Una instrucción de actualización final para la ruta sin más acciones, escrita con la voz normal del asistente sin reenviar metadatos internos sin procesar.

  </Accordion>
  <Accordion title="Modos y entorno de ejecución ACP">
    - `--model` y `--thinking` anulan los valores predeterminados para esa ejecución específica.
    - Use `info`/`log` para inspeccionar los detalles y la salida después de la finalización.
    - Para sesiones persistentes vinculadas a hilos, use `sessions_spawn` con `thread: true` y `mode: "session"`.
    - Si el canal solicitante no admite vinculaciones a hilos, use `mode: "run"` en lugar de reintentar una combinación vinculada a hilos que no puede funcionar.
    - Para sesiones del entorno ACP (Claude Code, Gemini CLI, OpenCode o Codex ACP/acpx explícito), use `sessions_spawn` con `runtime: "acp"` cuando la herramienta anuncie ese entorno de ejecución. Consulte [Modelo de entrega de ACP](/es/tools/acp-agents#delivery-model) al depurar finalizaciones o bucles entre agentes. Cuando el Plugin `codex` esté habilitado, el control de chats e hilos de Codex debe preferir `/codex ...` en lugar de ACP, salvo que el usuario solicite explícitamente ACP/acpx.
    - OpenClaw oculta `runtime: "acp"` hasta que ACP esté habilitado, el solicitante no esté aislado y se haya cargado un Plugin de backend como `acpx`. `runtime: "acp"` espera un id. de entorno ACP externo o una entrada `agents.list[]` con `runtime.type="acp"`; use el entorno de ejecución predeterminado de subagentes para los agentes normales de configuración de OpenClaw procedentes de `agents_list`.

  </Accordion>
</AccordionGroup>

## Modos de contexto

Los subagentes nativos comienzan aislados, salvo que el invocador solicite explícitamente bifurcar
la transcripción actual.

| Modo       | Cuándo usarlo                                                                                                                         | Comportamiento                                                                          |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `isolated` | Investigación nueva, implementación independiente, trabajo lento con herramientas o cualquier tarea que pueda describirse en el texto de la tarea                           | Crea una transcripción limpia para el agente hijo. Es el valor predeterminado y reduce el consumo de tokens.  |
| `fork`     | Trabajo que depende de la conversación actual, de resultados previos de herramientas o de instrucciones matizadas ya presentes en la transcripción del solicitante | Bifurca la transcripción del solicitante en la sesión del agente hijo antes de que este se inicie. |

Use `fork` con moderación. Está pensado para la delegación sensible al contexto, no como
sustituto de redactar una instrucción de tarea clara.

## Herramienta: `sessions_spawn`

Inicia una ejecución de subagente con `deliver: false` en el carril global `subagent`,
después ejecuta un paso de anuncio y publica la respuesta del anuncio en el canal de
chat del solicitante.

La disponibilidad depende de la política de herramientas efectiva del invocador. Los perfiles integrados
`coding` y `messaging` incluyen `sessions_spawn`,
`sessions_yield` y `subagents`; `minimal` no los incluye. `full` permite todas las
herramientas. Añada esas herramientas con `tools.alsoAllow` o use uno de los perfiles
anteriores para un agente con un perfil personalizado más restringido que aun así deba
delegar trabajo.
Las políticas de canal o grupo, proveedor, aislamiento y permisos o denegaciones por agente aún pueden
eliminar la herramienta después de la etapa del perfil. Use `/tools` desde la misma
sesión para confirmar la lista efectiva de herramientas.

**Valores predeterminados:**

- **Modelo:** los subagentes nativos heredan el modelo del invocador, salvo que se establezca `agents.defaults.subagents.model` (o `agents.list[].subagents.model` por agente). Las generaciones del entorno ACP usan el mismo modelo de subagente configurado cuando existe; de lo contrario, el entorno ACP conserva su propio valor predeterminado. Un valor `sessions_spawn.model` explícito sigue teniendo prioridad.
- **Razonamiento:** los subagentes nativos heredan el razonamiento del invocador, salvo que se establezca `agents.defaults.subagents.thinking` (o `agents.list[].subagents.thinking` por agente). Las generaciones del entorno ACP también aplican `agents.defaults.models["provider/model"].params.thinking` al modelo seleccionado. Un valor `sessions_spawn.thinking` explícito sigue teniendo prioridad.
- **Tiempo límite de ejecución:** OpenClaw usa `agents.defaults.subagents.runTimeoutSeconds` cuando está configurado; de lo contrario, recurre a `0` (sin tiempo límite). `sessions_spawn` no acepta anulaciones del tiempo límite por llamada.
- **Duración del proceso:** un subagente desacoplado de OpenClaw tiene su propio ciclo de vida de ejecución. Una tarea en segundo plano creada dentro de un backend de CLI externo es diferente: comparte el subproceso de la CLI principal y se detiene si ese proceso principal alcanza `agents.defaults.timeoutSeconds`.
- **Entrega de tareas:** los subagentes nativos reciben la tarea delegada en su primer mensaje `[Subagent Task]` visible. La instrucción del sistema del subagente contiene las reglas de ejecución y el contexto de enrutamiento, no un duplicado oculto de la tarea.

Las generaciones aceptadas de subagentes nativos incluyen los metadatos resueltos del modelo
del agente hijo en el resultado de la herramienta: `resolvedModel` contiene la referencia del modelo aplicada y
`resolvedProvider` contiene el prefijo del proveedor cuando la referencia tiene uno.

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
  Identificador estable opcional para identificar un proceso hijo específico en resultados de estado posteriores. Debe coincidir con `[a-z][a-z0-9_-]{0,63}` y no puede ser un destino reservado como `last` o `all`.
</ParamField>
<ParamField path="label" type="string">
  Etiqueta opcional legible para las personas.
</ParamField>
<ParamField path="agentId" type="string">
  Inicia el proceso bajo otro id. de agente configurado cuando lo permita `subagents.allowAgents`.
</ParamField>
<ParamField path="cwd" type="string">
  Directorio de trabajo opcional de la tarea para la ejecución hija. Los subagentes nativos siguen cargando los archivos de arranque desde el espacio de trabajo del agente de destino; `cwd` solo cambia dónde realizan el trabajo delegado las herramientas de tiempo de ejecución y los entornos de la CLI.
</ParamField>
<ParamField path="runtime" type='"subagent" | "acp"' default="subagent">
  `acp` se usa únicamente para entornos ACP externos (`claude`, `droid`, `gemini`, `opencode` o Codex ACP/acpx solicitado explícitamente) y para entradas `agents.list[]` cuyo `runtime.type` sea `acp`.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  Solo ACP. Reanuda una sesión existente del entorno ACP cuando `runtime: "acp"`; se ignora para los inicios de subagentes nativos.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  Solo ACP. Transmite la salida de la ejecución ACP a la sesión principal cuando `runtime: "acp"`; se omite para los inicios de subagentes nativos.
</ParamField>
<ParamField path="model" type="string">
  Sustituye el modelo del subagente. Los valores no válidos se omiten y el subagente se ejecuta con el modelo predeterminado y una advertencia en el resultado de la herramienta.
</ParamField>
<ParamField path="thinking" type="string">
  Sustituye el nivel de razonamiento para la ejecución del subagente. No está disponible con `visible: true`.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Cuando `true`, solicita la vinculación a un hilo del canal para esta sesión de subagente.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  Si `thread: true` y se omite `mode`, el valor predeterminado pasa a ser `session`. `mode: "session"` requiere `thread: true`.
  Si la vinculación a hilos no está disponible para el canal solicitante, usa `mode: "run"` en su lugar.
  Con `visible: true`, omite `mode`; las sesiones visibles son persistentes y no admiten `mode: "run"`.
</ParamField>
<ParamField path="cleanup" type='"delete" | "keep"' default="keep">
  `"delete"` archiva la sesión inmediatamente después del anuncio (aun así conserva la transcripción mediante un cambio de nombre).
</ParamField>
<ParamField path="sandbox" type='"inherit" | "require"' default="inherit">
  `require` rechaza el inicio a menos que el tiempo de ejecución hijo de destino esté aislado.
</ParamField>
<ParamField path="context" type='"isolated" | "fork"' default="isolated">
  `fork` bifurca la transcripción actual del solicitante en la sesión hija. Solo para subagentes nativos. Los inicios vinculados a hilos usan `fork` de forma predeterminada; los inicios no vinculados a hilos usan `isolated`. Una bifurcación visible debe dirigirse al mismo agente que el solicitante.
</ParamField>
<ParamField path="visible" type="boolean" default="false">
  Crea una sesión persistente del panel de control que el usuario puede abrir en la interfaz de control. Los inicios visibles solo admiten `runtime: "subagent"` y siempre conservan la sesión creada.
</ParamField>
<ParamField path="worktree" type="boolean" default="false">
  Aprovisiona un árbol de trabajo de Git administrado para la nueva sesión del panel de control. Requiere `visible: true`.
</ParamField>
<ParamField path="worktreeName" type="string">
  Nombre opcional del árbol de trabajo administrado. Requiere `visible: true` y `worktree: true`.
</ParamField>
<ParamField path="worktreeBaseRef" type="string">
  Referencia base opcional de Git para el árbol de trabajo administrado. Requiere `visible: true` y `worktree: true`.
</ParamField>

<Warning>
`sessions_spawn` **no** acepta parámetros de entrega del canal (`target`,
`channel`, `to`, `threadId`, `replyTo`, `transport`). Los subagentes nativos comunican
su último turno del asistente al solicitante; la entrega externa sigue correspondiendo
al agente principal/solicitante.
</Warning>

Con `visible: true`, se admiten `model`, `cwd` y un `context: "fork"` del mismo agente. Un destino aislado restringe `cwd` al espacio de trabajo de ese agente. La vinculación a hilos, `mode`, las sustituciones del razonamiento, `lightContext`, `attachments` y `attachAs` no están disponibles en esta ruta porque las sesiones visibles son sesiones persistentes del panel de control creadas mediante `sessions.create`. El inicio visible se rechaza cuando el propio solicitante se inició con una lista heredada de herramientas permitidas o denegadas; esa restricción se fija en el momento del inicio y no tiene ninguna sustitución de configuración. La enumeración y el direccionamiento de sesiones respetan `tools.sessions.visibility`; el ámbito `tree` predeterminado abarca la sesión actual y su propio subárbol de inicios. Consulta [Árboles de trabajo administrados](/es/concepts/managed-worktrees) para conocer el comportamiento de nomenclatura, configuración, limpieza y restauración de las copias de trabajo.

### Nombres de tareas y selección de destinos

`taskName` es un identificador de orquestación orientado al modelo, no una clave de sesión.
Úsalo para nombres estables de procesos hijos como `review_subagents`,
`linux_validation` o `docs_update` cuando un coordinador pueda necesitar inspeccionar
ese proceso hijo más adelante.

La resolución de destinos acepta coincidencias exactas de `taskName` y
prefijos inequívocos. La coincidencia se limita a la misma ventana de destinos
activos/recientes que utilizan los destinos numerados `/subagents`, por lo que
un proceso hijo obsoleto ya finalizado no hace ambiguo un identificador reutilizado.
Si dos procesos hijos activos o recientes comparten el mismo
`taskName`, el destino es ambiguo; usa en su lugar el índice de la lista, la clave de sesión o
el id. de ejecución.

Los destinos reservados `last` y `all` no son valores válidos de `taskName`
porque ya tienen significados de control.

## Herramienta: `sessions_yield`

Finaliza el turno actual del modelo y espera a que los eventos del tiempo de ejecución,
principalmente los eventos de finalización de subagentes, lleguen como el siguiente mensaje.
Úsala después de iniciar el trabajo hijo necesario cuando el solicitante no pueda producir
una respuesta final hasta que lleguen esas finalizaciones.

`sessions_yield` es la primitiva de espera. No la sustituyas por bucles de sondeo
sobre `subagents`, `sessions_list`, `sessions_history`, el sondeo del shell
`sleep` o el sondeo de procesos solo para detectar la finalización de un proceso hijo.

Usa `sessions_yield` únicamente cuando la lista efectiva de herramientas de la sesión la incluya.
Algunos perfiles de herramientas mínimos o personalizados pueden exponer `sessions_spawn` y
`subagents` sin exponer `sessions_yield`; en ese caso, no inventes
un bucle de sondeo solo para esperar la finalización.

Cuando existen procesos hijos activos, OpenClaw inyecta un bloque compacto de indicaciones
`Active Subagents` generado por el tiempo de ejecución en los turnos normales para que el solicitante pueda ver
las sesiones hijas actuales, los id. de ejecución, los estados, las etiquetas, las tareas y los
alias `taskName` sin sondeo. Los campos de tarea y etiqueta de ese
bloque se entrecomillan como datos, no como instrucciones, porque pueden proceder
de argumentos de inicio proporcionados por el usuario/modelo.

## Herramienta: `subagents`

Enumera las ejecuciones de subagentes iniciadas y los registros de tareas en segundo plano propiedad del
árbol de sesiones del solicitante. Las filas de tareas abarcan subagentes nativos, ejecuciones ACP,
trabajo multimedia/de la CLI del Gateway y ejecuciones de Cron. Se limita al solicitante
actual; un proceso hijo solo puede ver sus propios procesos hijos controlados.

Usa `subagents` para consultar el estado y depurar a petición. Usa `sessions_yield` para
esperar eventos de finalización.

Usa `action: "cancel"` con un `taskId` devuelto por `action: "list"` para detener
una tarea. La cancelación se limita al árbol de sesiones controlado; un subagente
hoja no puede cancelar trabajo propiedad de otra sesión.

## Sesiones vinculadas a hilos

Cuando las vinculaciones a hilos están habilitadas para un canal, un subagente puede permanecer vinculado
a un hilo para que los mensajes posteriores del usuario en ese hilo sigan dirigiéndose a la
misma sesión de subagente.

### Canales compatibles con hilos

Un canal admite sesiones persistentes de subagentes vinculadas a hilos
(`sessions_spawn` con `thread: true`) cuando registra un adaptador de
vinculación de conversaciones. Canales incluidos con esa compatibilidad: **Discord**,
**iMessage**, **Matrix** y **Telegram**. Discord y Matrix crean de forma predeterminada
un hilo hijo; Telegram e iMessage vinculan de forma predeterminada la
conversación actual. Usa las claves de configuración `threadBindings` específicas de cada canal para
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
    Usa `/session idle` para inspeccionar/actualizar la pérdida automática de foco por inactividad y
    `/session max-age` para controlar el límite máximo.
  </Step>
  <Step title="Desvincular">
    Usa `/unfocus` para desvincular manualmente.
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
- **Las claves de sustitución del canal y de vinculación automática al iniciar** son específicas del adaptador. Consulta [Canales compatibles con hilos](#thread-supporting-channels) más arriba.

Consulta la [Referencia de configuración](/es/gateway/configuration-reference) y
los [Comandos con barra](/es/tools/slash-commands) para obtener los detalles actuales de los adaptadores.

### Lista de permitidos

<ParamField path="agents.list[].subagents.allowAgents" type="string[]">
  Lista de id. de agentes configurados que pueden seleccionarse mediante un `agentId` explícito (`["*"]` permite cualquier destino configurado). Valor predeterminado: solo el agente solicitante. Si se establece una lista y se desea que el solicitante pueda iniciarse a sí mismo con `agentId`, incluye el id. del solicitante en la lista.
</ParamField>
<ParamField path="agents.defaults.subagents.allowAgents" type="string[]">
  Lista predeterminada de agentes de destino configurados permitidos que se utiliza cuando el agente solicitante no establece su propio `subagents.allowAgents`.
</ParamField>
<ParamField path="agents.defaults.subagents.requireAgentId" type="boolean" default="false">
  Bloquea las llamadas a `sessions_spawn` que omitan `agentId` (fuerza la selección explícita del perfil). Sustitución por agente: `agents.list[].subagents.requireAgentId`.
</ParamField>
<ParamField path="agents.defaults.subagents.announceTimeoutMs" type="number" default="120000">
  Tiempo de espera por llamada para los intentos de entrega de anuncios `agent` del Gateway. Los valores son milisegundos enteros positivos y se limitan al máximo seguro del temporizador de la plataforma. Los reintentos transitorios pueden hacer que la espera total del anuncio supere un tiempo de espera configurado.
</ParamField>

Si la sesión solicitante está aislada, `sessions_spawn` rechaza los destinos
que se ejecutarían sin aislamiento.

### Descubrimiento

Usa `agents_list` para ver qué ids de agente están permitidos actualmente para
`sessions_spawn`. La respuesta incluye el modelo efectivo de cada agente enumerado
y los metadatos del entorno de ejecución integrado para que los invocadores puedan distinguir OpenClaw, el servidor de aplicaciones
de Codex y otros entornos de ejecución nativos configurados.

Las entradas de `allowAgents` deben apuntar a ids de agente configurados en `agents.list[]`.
`["*"]` significa cualquier agente de destino configurado más el solicitante. Si se elimina la configuración
de un agente, pero su id permanece en `allowAgents`, `sessions_spawn` rechaza ese id
y `agents_list` lo omite. Ejecuta `openclaw doctor --fix` para limpiar las entradas obsoletas
de la lista de permitidos, o añade una entrada mínima de `agents.list[]` cuando el destino deba
seguir pudiendo iniciarse y heredar los valores predeterminados.

### Archivado automático

- Las sesiones de subagentes se archivan automáticamente después de `agents.defaults.subagents.archiveAfterMinutes` (valor predeterminado: `60`).
- El archivado usa `sessions.delete` y cambia el nombre de la transcripción a `*.deleted.<timestamp>` (en la misma carpeta).
- `cleanup: "delete"` archiva inmediatamente después del anuncio (la transcripción se conserva mediante el cambio de nombre).
- El archivado automático se realiza en la medida de lo posible; los temporizadores pendientes se pierden si se reinicia el Gateway.
- Los tiempos de espera de ejecución configurados **no** archivan automáticamente; solo detienen la ejecución. La sesión permanece hasta el archivado automático.
- El archivado automático se aplica por igual a las sesiones de profundidad 1 y 2.
- La limpieza del navegador es independiente de la limpieza del archivo: se intenta cerrar las pestañas y los procesos del navegador registrados cuando finaliza la ejecución, aunque se conserve la transcripción o el registro de la sesión.

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
        maxConcurrent: 8, // límite global de simultaneidad del canal (valor predeterminado: 8)
        runTimeoutSeconds: 900, // tiempo de espera predeterminado para sessions_spawn (0 = sin tiempo de espera)
        announceTimeoutMs: 120000, // tiempo de espera de anuncio del Gateway por llamada
      },
    },
  },
}
```

### Niveles de profundidad

| Profundidad | Forma de la clave de sesión                   | Rol                                           | ¿Puede iniciar otros?          |
| ----------- | -------------------------------------------- | --------------------------------------------- | ------------------------------ |
| 0           | `agent:<id>:main`                            | Agente principal                              | Siempre                        |
| 1           | `agent:<id>:subagent:<uuid>`                 | Subagente (orquestador si se permite profundidad 2) | Solo si `maxSpawnDepth >= 2` |
| 2           | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | Subsubagente (trabajador hoja)                | Nunca                          |

### Cadena de anuncios

Los resultados ascienden por la cadena:

1. El trabajador de profundidad 2 finaliza → anuncia el resultado a su padre (orquestador de profundidad 1).
2. El orquestador de profundidad 1 recibe el anuncio, sintetiza los resultados y finaliza → anuncia el resultado al principal.
3. El agente principal recibe el anuncio y lo entrega al usuario.

Cada nivel solo ve los anuncios de sus hijos directos.

<Note>
**Directrices operativas:** inicia el trabajo hijo una sola vez y espera los eventos
de finalización en lugar de crear bucles de consulta alrededor de `sessions_list`,
`sessions_history`, `/subagents list` o comandos de suspensión de `exec`.
`sessions_list` y `/subagents list` mantienen las relaciones entre sesiones hijas
centradas en el trabajo activo: los hijos activos permanecen vinculados, los hijos finalizados siguen
visibles durante un breve intervalo reciente y los vínculos de hijos obsoletos que solo existen en el almacén
se ignoran una vez transcurrido su período de vigencia. Esto evita que metadatos antiguos de `spawnedBy` /
`parentSessionKey` resuciten hijos fantasma después de un
reinicio. Si llega un evento de finalización de un hijo después de haber enviado
la respuesta final, la respuesta de seguimiento correcta es el token silencioso exacto
`NO_REPLY` / `no_reply`.
</Note>

### Política de herramientas según la profundidad

- Un hijo captura la política de remitente efectiva del solicitante cuando se inicia. Las ejecuciones hijas sin remitente y las reanudaciones autenticadas del operador conservan esa instantánea aunque `toolsBySender` cambie posteriormente; se siguen aplicando las restricciones globales, de agente, proveedor, entorno aislado y subagente actuales. En cambio, un nuevo turno de un canal externo dirigido al hijo vuelve a resolver la política de remitente actual.
- El rol y el ámbito de control se escriben en los metadatos de la sesión en el momento del inicio. Esto evita que las claves de sesión planas o restauradas recuperen accidentalmente privilegios de orquestador.
- **Profundidad 1 (orquestador, cuando `maxSpawnDepth >= 2`):** obtiene `sessions_spawn`, `subagents`, `sessions_list` y `sessions_history` para poder iniciar hijos e inspeccionar su estado. Las demás herramientas de sesión o del sistema siguen denegadas.
- **Profundidad 1 (hoja, cuando `maxSpawnDepth == 1`):** sin herramientas de sesión (comportamiento predeterminado actual).
- **Profundidad 2 (trabajador hoja):** sin herramientas de sesión; `sessions_spawn` siempre se deniega en la profundidad 2. No puede iniciar más hijos.

### Límite de inicio por agente

Cada sesión de agente (a cualquier profundidad) puede tener como máximo `maxChildrenPerAgent`
(valor predeterminado: `5`) hijos activos al mismo tiempo. Esto evita una expansión
descontrolada desde un único orquestador.

### Detención en cascada

Detener un orquestador de profundidad 1 detiene automáticamente a todos sus
hijos de profundidad 2:

- `/stop` en el chat principal detiene a todos los agentes de profundidad 1 y aplica la detención en cascada a sus hijos de profundidad 2.

## Autenticación

La autenticación de los subagentes se resuelve por **id de agente**, no por tipo de sesión:

- La clave de sesión del subagente es `agent:<agentId>:subagent:<uuid>`.
- El almacén de autenticación se carga desde el `agentDir` de ese agente.
- Los perfiles de autenticación del agente principal se combinan como **alternativa**; los perfiles del agente prevalecen sobre los del principal en caso de conflicto.

La combinación es aditiva, por lo que los perfiles principales siempre están disponibles como
alternativas. Todavía no se admite una autenticación totalmente aislada por agente.

## Anuncio

Los subagentes informan mediante un paso de anuncio:

- El paso de anuncio se ejecuta dentro de la sesión del subagente (no en la sesión del solicitante).
- Si el subagente responde exactamente `ANNOUNCE_SKIP`, no se publica nada.
- Si el texto más reciente del asistente es el token silencioso exacto `NO_REPLY` / `no_reply`, se suprime la salida del anuncio aunque anteriormente hubiera progreso visible.

La entrega depende de la profundidad del solicitante:

- Las sesiones de solicitante de nivel superior usan una llamada de seguimiento a `agent` con entrega externa (`deliver=true`).
- Las sesiones de subagente solicitante anidadas reciben una inyección interna de seguimiento (`deliver=false`) para que el orquestador pueda sintetizar los resultados de los hijos dentro de la sesión.
- Si una sesión de subagente solicitante anidada ya no existe, OpenClaw recurre al solicitante de esa sesión cuando está disponible.

Para las sesiones de solicitante de nivel superior, la entrega directa en modo de finalización
resuelve primero cualquier ruta de conversación o hilo vinculada y cualquier sustitución del hook; después, completa
los campos de canal y destino que falten a partir de la ruta almacenada en la sesión del solicitante.
Esto mantiene las finalizaciones en el chat o tema correcto incluso cuando el origen de la finalización
solo identifica el canal.

La agregación de finalizaciones de hijos se limita a la ejecución actual del solicitante al
crear los hallazgos de finalización anidados, lo que evita que las salidas de hijos de ejecuciones
anteriores obsoletas se filtren al anuncio actual. Las respuestas de anuncio conservan
el enrutamiento de hilo o tema cuando está disponible en los adaptadores de canal.

### Contexto del anuncio

El contexto del anuncio se normaliza en un bloque de eventos interno estable:

| Campo                | Origen                                                                                                   |
| -------------------- | -------------------------------------------------------------------------------------------------------- |
| Origen               | `subagent` o `cron`                                                                                     |
| Ids de sesión        | Clave/id de sesión del hijo                                                                              |
| Tipo                 | Tipo de anuncio + etiqueta de tarea                                                                      |
| Estado               | Derivado del resultado del entorno de ejecución (`ok`, `error`, `timeout` o `unknown`); **no** se deduce del texto del modelo |
| Contenido del resultado | Texto visible más reciente del asistente del hijo                                                     |
| Seguimiento          | Instrucción que describe cuándo responder y cuándo guardar silencio                                      |

Las ejecuciones fallidas terminales informan del estado de error sin reproducir el texto
de respuesta capturado. La salida de herramientas o toolResult no se convierte en texto de resultado del hijo.

### Línea de estadísticas

Las cargas útiles de anuncio incluyen una línea de estadísticas al final (incluso cuando están envueltas):

- Tiempo de ejecución (por ejemplo, `runtime 5m12s`).
- Uso de tokens (entrada/salida/total).
- Coste estimado cuando se configuran los precios del modelo (`models.providers.*.models[].cost`).
- `sessionKey`, `sessionId` y la ruta de la transcripción para que el agente principal pueda recuperar el historial mediante `sessions_history` o inspeccionar el archivo en el disco.

Los metadatos internos están destinados exclusivamente a la orquestación; las respuestas
dirigidas al usuario deben reescribirse con la voz normal del asistente.

### Por qué se prefiere `sessions_history`

`sessions_history` es la ruta de orquestación más segura para leer la transcripción de un hijo
desde el turno de un agente:

- Censura texto similar a credenciales o tokens incluso cuando la censura general de registros está deshabilitada.
- Trunca los bloques de texto largos (4000 caracteres por bloque) y descarta las firmas de pensamiento, las cargas útiles de reproducción del razonamiento y los datos de imágenes insertados.
- Impone un límite de respuesta de 80 KB; las filas que exceden el tamaño se sustituyen por `[sessions_history omitted: message too large]`.
- Usa `nextOffset` cuando esté presente para retroceder por ventanas de transcripción más antiguas.
- `sessions_history` **no** elimina las etiquetas de razonamiento, la estructura de `<relevant-memories>` ni el XML de llamadas a herramientas del texto de los mensajes: devuelve bloques de contenido estructurados cercanos a la forma original de la transcripción, solo censurados y limitados por tamaño. `/subagents log` aplica un saneamiento de prosa más exhaustivo (elimina las etiquetas de razonamiento, la estructura de memoria y el XML de llamadas a herramientas) porque representa líneas de chat en texto sin formato en lugar de bloques estructurados.
- La inspección de la transcripción original en el disco es la alternativa cuando se necesita la transcripción completa byte por byte.

## Política de herramientas

Los subagentes usan primero el mismo perfil y el mismo pipeline de políticas de herramientas que el agente
principal o de destino. Después, OpenClaw aplica la capa de restricciones
de subagentes.

Los subagentes siempre pierden `gateway`, `agents_list`, `session_status` y
`cron`, independientemente de la profundidad o el rol (herramientas interactivas o de nivel del sistema, o
herramientas que debe coordinar el agente principal). Los subagentes hoja (comportamiento predeterminado
de profundidad 1, y siempre en profundidad 2) pierden además `subagents`,
`sessions_list`, `sessions_history` y `sessions_spawn`. Los subagentes nunca
obtienen la herramienta `message`; se deshabilita en el momento del inicio, no se filtra mediante
esta lista de denegación; y `sessions_send` permanece denegada para que los subagentes
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
        // denegar tiene prioridad
        deny: ["gateway", "cron"],
        // si se establece allow, pasa a permitir solo esos elementos (denegar sigue teniendo prioridad)
        // allow: ["read", "exec", "process"]
      },
    },
  },
}
```

`tools.subagents.tools.allow` es un filtro final que permite solo los elementos indicados. Puede restringir
el conjunto de herramientas ya resuelto, pero no puede **volver a añadir** una herramienta eliminada
por `tools.profile`. Por ejemplo, `tools.profile: "coding"` incluye
`web_search`/`web_fetch`, pero no la herramienta `browser`. Para que
los subagentes con perfil de programación puedan usar la automatización del navegador, añada browser en la
etapa del perfil:

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

Use `agents.list[].tools.alsoAllow: ["browser"]` por agente cuando solo un
agente deba disponer de automatización del navegador.

## Concurrencia

Los subagentes usan un carril de cola dedicado dentro del proceso:

- **Nombre del carril:** `subagent`
- **Concurrencia:** `agents.defaults.subagents.maxConcurrent` (valor predeterminado: `8`)

## Actividad y recuperación

OpenClaw no considera que la ausencia de `endedAt` sea una prueba permanente de que un
subagente sigue activo. Las ejecuciones sin finalizar que superan la ventana de obsolescencia
(2 horas, o el tiempo de espera de ejecución configurado más un breve período de gracia,
lo que sea mayor) dejan de contabilizarse como activas o pendientes en `/subagents list`,
los resúmenes de estado, el bloqueo hasta que finalicen los descendientes y las comprobaciones de
concurrencia por sesión.

Después de reiniciar el Gateway, se eliminan las ejecuciones restauradas, obsoletas y sin finalizar, salvo que
su sesión secundaria esté marcada como `abortedLastRun: true`. Las ejecuciones
interrumpidas por el reinicio permanecen registradas para el flujo de recuperación de subagentes huérfanos: las ejecuciones
obsoletas se finalizan sin reanudarse, mientras que las sesiones secundarias recientes reciben
un mensaje sintético de reanudación antes de que se borre el marcador de interrupción.

La recuperación automática tras un reinicio está limitada por sesión secundaria. Si el mismo
subagente secundario se acepta repetidamente para la recuperación de huérfanos dentro de la
ventana de bloqueo rápido recurrente, OpenClaw conserva una marca de exclusión de recuperación en esa
sesión y deja de reanudarla automáticamente en reinicios posteriores. Ejecute
`openclaw tasks maintenance --apply` para reconciliar el registro de la tarea, o
`openclaw doctor --fix` para borrar las marcas obsoletas de recuperación interrumpida de
las sesiones con marca de exclusión.

<Note>
Si la creación de un subagente falla con `PAIRING_REQUIRED` /
`scope-upgrade` del Gateway, compruebe el invocador de RPC antes de editar el estado de emparejamiento.
Las operaciones internas de coordinación de `sessions_spawn` se envían dentro del proceso cuando el
invocador ya se ejecuta en el contexto de la solicitud del Gateway, por lo que no
abren un WebSocket de bucle invertido ni dependen del conjunto base de ámbitos del dispositivo emparejado
de la CLI. Los invocadores externos al proceso del Gateway siguen usando la alternativa
de WebSocket como `client.id: "gateway-client"` con `client.mode: "backend"`
mediante autenticación directa en el bucle invertido con token compartido o contraseña. Los invocadores remotos, las rutas
`deviceIdentity` explícitas, las rutas explícitas con token de dispositivo y los clientes de navegador/Node
siguen necesitando la aprobación normal del dispositivo para ampliar los ámbitos.
</Note>

## Detención

- Enviar `/stop` en el chat del solicitante interrumpe la sesión del solicitante y detiene todas las ejecuciones activas de subagentes creadas desde ella, propagándose a los descendientes anidados.

## Limitaciones

- El anuncio de los subagentes es de **mejor esfuerzo**. Si el Gateway se reinicia, se pierde el trabajo pendiente de «anunciar de vuelta».
- Los subagentes siguen compartiendo los mismos recursos del proceso del Gateway; considere `maxConcurrent` una válvula de seguridad.
- `sessions_spawn` siempre es no bloqueante: devuelve `{ status: "accepted", runId, childSessionKey }` inmediatamente.
- El contexto del subagente solo inyecta `AGENTS.md` y `TOOLS.md` (no `SOUL.md`, `IDENTITY.md`, `USER.md`, `MEMORY.md`, `HEARTBEAT.md` ni `BOOTSTRAP.md`). Los subagentes nativos de Codex siguen el mismo límite: `TOOLS.md` permanece en las instrucciones heredadas del hilo de Codex, mientras que los archivos de personalidad, identidad y usuario exclusivos del agente principal se inyectan como instrucciones de colaboración limitadas al turno para que los agentes secundarios no los clonen.
- La profundidad máxima de anidamiento es 5 (intervalo de `maxSpawnDepth`: 1-5). Se recomienda una profundidad de 2 para la mayoría de los casos de uso.
- `maxChildrenPerAgent` limita el número de agentes secundarios activos por sesión (valor predeterminado: `5`; intervalo: `1-20`).

## Contenido relacionado

- [Herramientas de sesión y cambios de estado](/es/concepts/session-tool)
- [Agentes ACP](/es/tools/acp-agents)
- [Envío a agentes](/es/tools/agent-send)
- [Tareas en segundo plano](/es/automation/tasks)
- [Herramientas de entorno aislado multiagente](/es/tools/multi-agent-sandbox-tools)

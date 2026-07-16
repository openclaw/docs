---
read_when:
    - Quieres realizar trabajo en segundo plano o en paralelo mediante el agente
    - Está cambiando la política de la herramienta sessions_spawn o de los subagentes
    - Está implementando o solucionando problemas de sesiones de subagentes vinculadas a hilos
sidebarTitle: Sub-agents
summary: Inicia ejecuciones aisladas de agentes en segundo plano que anuncien los resultados en el chat del solicitante.
title: Subagentes
x-i18n:
    generated_at: "2026-07-16T12:13:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8c670d5c7f92d5be8ebce7b1140d9bfd7956b10f38144d275ec84c6af98ae04b
    source_path: tools/subagents.md
    workflow: 16
---

Los subagentes son ejecuciones de agentes en segundo plano iniciadas desde una ejecución de agente existente.
Cada uno se ejecuta en su propia sesión (`agent:<agentId>:subagent:<uuid>`) y,
al finalizar, **anuncia** su resultado en el canal de chat del solicitante.
Cada ejecución de subagente se registra como una [tarea en segundo plano](/es/automation/tasks).

Objetivos:

- Paralelizar la investigación, las tareas largas y el trabajo lento con herramientas sin bloquear la ejecución principal.
- Mantener los subagentes aislados de forma predeterminada (separación de sesiones y aislamiento opcional).
- Evitar que la superficie de herramientas sea fácil de usar incorrectamente: los subagentes **no** reciben herramientas de sesión ni de mensajería de forma predeterminada.
- Permitir una profundidad de anidamiento configurable para patrones de orquestación.

<Note>
**Nota sobre costes:** cada subagente tiene su propio contexto y consumo de tokens de
forma predeterminada. Para tareas pesadas o repetitivas, configure un modelo más económico para los subagentes
y mantenga el agente principal en un modelo de mayor calidad mediante
`agents.defaults.subagents.model` o anulaciones por agente. Cuando un agente secundario
necesite realmente la transcripción actual del solicitante, inícielo con
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

`/subagents info` muestra los metadatos de la ejecución (estado, marcas de tiempo, id. de sesión,
ruta de la transcripción y limpieza). `/subagents log` muestra los turnos recientes del chat de una
ejecución; añada el token `tools` para incluir mensajes de llamadas a herramientas y sus resultados (omitidos
de forma predeterminada). Use `sessions_history` para obtener una vista de recuperación
acotada y filtrada por seguridad desde un turno del agente, o inspeccione la ruta de la transcripción en el disco para
consultar la transcripción completa sin procesar.

En la interfaz de control, las sesiones principales con ejecuciones secundarias recientes tienen una fila
ampliable en la barra lateral. Las filas anidadas muestran el estado y el tiempo de ejecución del agente secundario, y al seleccionar una
se abre su chat conservando la jerarquía principal.

### Controles de vinculación de hilos

Estos comandos funcionan en canales con vinculaciones de hilos persistentes. Consulte
[Canales compatibles con hilos](#thread-supporting-channels) a continuación.

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
principal o solicitante decide si se necesita una actualización visible para el usuario.

<AccordionGroup>
  <Accordion title="Finalización no bloqueante basada en inserción">
    - `sessions_spawn` no bloquea; devuelve inmediatamente un id. de ejecución.
    - Al finalizar, el subagente informa a la sesión principal o solicitante.
    - Los turnos del agente que necesiten resultados de agentes secundarios deben llamar a `sessions_yield` después de iniciar el trabajo necesario. Esto finaliza el turno actual y permite que el evento de finalización llegue como el siguiente mensaje visible para el modelo.
    - La finalización se basa en inserción. Una vez iniciado, **no** consulte `/subagents list`, `sessions_list` ni `sessions_history` repetidamente en un bucle solo para esperar a que termine; compruebe el estado bajo demanda únicamente durante la depuración.
    - La salida del agente secundario es un informe o evidencia que el agente solicitante debe sintetizar. No es texto de instrucciones creado por el usuario y no puede anular las políticas del sistema, del desarrollador ni del usuario.
    - Al finalizar, OpenClaw intenta cerrar las pestañas y los procesos del navegador registrados que haya abierto esa sesión de subagente antes de que continúe el flujo de limpieza del anuncio.

  </Accordion>
  <Accordion title="Entrega de la finalización">
    - OpenClaw devuelve las finalizaciones a la sesión solicitante mediante un turno `agent` con una clave de idempotencia estable.
    - Si la ejecución solicitante sigue activa, OpenClaw intenta primero reactivarla o dirigirla en lugar de iniciar una segunda ruta de respuesta visible.
    - Si no se puede reactivar a un solicitante activo, OpenClaw recurre a una transferencia al agente solicitante con el mismo contexto de finalización, en lugar de descartar el anuncio.
    - Una transferencia correcta al agente principal completa la entrega del subagente incluso cuando el agente principal decide que no se necesita ninguna actualización visible para el usuario.
    - Los subagentes nativos no reciben la herramienta de mensajería. Devuelven texto sin formato del asistente al agente principal o solicitante; las respuestas visibles para las personas siguen sujetas a la política de entrega normal del agente principal o solicitante.
    - Si no se puede usar la transferencia directa, la entrega recurre al enrutamiento mediante cola y, después, a un reintento breve del anuncio con espera exponencial antes del abandono definitivo.
    - La entrega conserva la ruta resuelta del solicitante: las rutas de finalización vinculadas al hilo o a la conversación tienen prioridad cuando están disponibles. Si el origen de la finalización solo proporciona un canal, OpenClaw completa el destino o la cuenta que falten a partir de la ruta resuelta de la sesión solicitante (`lastChannel` / `lastTo` / `lastAccountId`) para que la entrega directa siga funcionando.

  </Accordion>
  <Accordion title="Metadatos de transferencia de la finalización">
    La transferencia de la finalización a la sesión solicitante es contexto interno generado
    durante la ejecución (no texto creado por el usuario) e incluye:

    - `Result` — el texto más reciente de la respuesta `assistant` visible del agente secundario. La salida de tool/toolResult no se incorpora a los resultados del agente secundario. Las ejecuciones con fallo terminal no reutilizan el texto de respuesta capturado.
    - `Status` — `completed; ready for parent review` / `failed` / `timed out` / `unknown`.
    - Estadísticas compactas de ejecución y tokens.
    - Una instrucción de revisión que indica al agente solicitante que verifique el resultado antes de decidir si la tarea original está terminada.
    - Indicaciones de seguimiento que indican al agente solicitante que continúe la tarea o registre un seguimiento cuando el resultado del agente secundario requiera más acciones.
    - Una instrucción de actualización final para cuando no queden más acciones, redactada con la voz normal del asistente y sin reenviar metadatos internos sin procesar.

  </Accordion>
  <Accordion title="Modos y entorno de ejecución ACP">
    - `--model` y `--thinking` anulan los valores predeterminados para esa ejecución concreta.
    - Use `info`/`log` para inspeccionar los detalles y la salida después de la finalización.
    - Para sesiones persistentes vinculadas a hilos, use `sessions_spawn` con `thread: true` y `mode: "session"`.
    - Si el canal solicitante no admite vinculaciones de hilos, use `mode: "run"` en lugar de volver a intentar una combinación vinculada a hilos imposible.
    - Para sesiones de entorno ACP (Claude Code, Gemini CLI, OpenCode o Codex ACP/acpx explícito), use `sessions_spawn` con `runtime: "acp"` cuando la herramienta anuncie ese entorno de ejecución. Consulte [Modelo de entrega de ACP](/es/tools/acp-agents#delivery-model) al depurar finalizaciones o bucles entre agentes. Cuando esté habilitado el plugin `codex`, el control de chats e hilos de Codex debe preferir `/codex ...` frente a ACP, salvo que el usuario solicite explícitamente ACP/acpx.
    - OpenClaw oculta `runtime: "acp"` hasta que ACP esté habilitado, el solicitante no esté aislado y se haya cargado un plugin de backend como `acpx`. `runtime: "acp"` espera un id. de entorno ACP externo o una entrada `agents.list[]` con `runtime.type="acp"`; use el entorno de ejecución predeterminado de subagentes para los agentes normales de configuración de OpenClaw procedentes de `agents_list`.

  </Accordion>
</AccordionGroup>

## Modos de contexto

Los subagentes nativos se inician aislados, salvo que el invocador solicite explícitamente bifurcar
la transcripción actual.

| Modo       | Cuándo usarlo                                                                                                                         | Comportamiento                                                                          |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `isolated` | Investigación nueva, implementación independiente, trabajo lento con herramientas o cualquier tarea que pueda explicarse en el texto de la tarea                           | Crea una transcripción limpia para el agente secundario. Es el valor predeterminado y reduce el uso de tokens.  |
| `fork`     | Trabajo que depende de la conversación actual, resultados previos de herramientas o instrucciones matizadas ya presentes en la transcripción del solicitante | Bifurca la transcripción del solicitante en la sesión del agente secundario antes de que este se inicie. |

Use `fork` con moderación. Está destinado a la delegación sensible al contexto, no a
sustituir la redacción de una instrucción de tarea clara.

## Herramienta: `sessions_spawn`

Inicia una ejecución de subagente con `deliver: false` en el carril global `subagent`,
luego ejecuta un paso de anuncio y publica la respuesta del anuncio en el
canal de chat del solicitante.

La disponibilidad depende de la política de herramientas efectiva del invocador. El perfil integrado
`coding` incluye `sessions_spawn`; `messaging` y `minimal` no
lo incluyen. `full` permite todas las herramientas. Añada `tools.alsoAllow: ["sessions_spawn",
"sessions_yield", "subagents"]`, o use `tools.profile: "coding"`, para
los agentes con un perfil más restrictivo que aun así deban delegar trabajo.
Las políticas de permisos y denegaciones por canal o grupo, proveedor, aislamiento y agente
aún pueden retirar la herramienta después de la etapa del perfil. Use `/tools` desde la misma
sesión para confirmar la lista de herramientas efectiva.

**Valores predeterminados:**

- **Modelo:** los subagentes nativos heredan el del invocador, salvo que se establezca `agents.defaults.subagents.model` (o `agents.list[].subagents.model` por agente). Los inicios del entorno ACP usan el mismo modelo de subagente configurado cuando está disponible; en caso contrario, el entorno ACP conserva su propio valor predeterminado. Un valor `sessions_spawn.model` explícito sigue teniendo prioridad.
- **Razonamiento:** los subagentes nativos heredan el del invocador, salvo que se establezca `agents.defaults.subagents.thinking` (o `agents.list[].subagents.thinking` por agente). Los inicios del entorno ACP también aplican `agents.defaults.models["provider/model"].params.thinking` al modelo seleccionado. Un valor `sessions_spawn.thinking` explícito sigue teniendo prioridad.
- **Tiempo de espera de la ejecución:** OpenClaw usa `agents.defaults.subagents.runTimeoutSeconds` cuando está establecido; en caso contrario, recurre a `0` (sin tiempo de espera). `sessions_spawn` no acepta anulaciones del tiempo de espera por llamada.
- **Entrega de tareas:** los subagentes nativos reciben la tarea delegada en su primer mensaje `[Subagent Task]` visible. El mensaje del sistema del subagente contiene reglas de ejecución y contexto de enrutamiento, no un duplicado oculto de la tarea.

Los inicios de subagentes nativos aceptados incluyen los metadatos resueltos del modelo secundario
en el resultado de la herramienta: `resolvedModel` contiene la referencia del modelo aplicado y
`resolvedProvider` contiene el prefijo del proveedor cuando la referencia incluye uno.

### Modo de instrucciones de delegación

`agents.defaults.subagents.delegationMode` solo controla las indicaciones de las instrucciones; no cambia la política de herramientas ni impone la delegación.

- `suggest` (predeterminado): conserva la indicación estándar de usar subagentes para trabajos más grandes o lentos.
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
  Genera el subagente bajo otro identificador de agente configurado cuando `subagents.allowAgents` lo permita.
</ParamField>
<ParamField path="cwd" type="string">
  Directorio de trabajo opcional de la tarea para la ejecución del subagente. Los subagentes nativos siguen cargando los archivos de arranque desde el espacio de trabajo del agente de destino; `cwd` solo cambia dónde realizan el trabajo delegado las herramientas de ejecución y los entornos de CLI.
</ParamField>
<ParamField path="runtime" type='"subagent" | "acp"' default="subagent">
  `acp` se utiliza únicamente para entornos ACP externos (`claude`, `droid`, `gemini`, `opencode` o Codex ACP/acpx solicitado explícitamente) y para entradas `agents.list[]` cuyo `runtime.type` sea `acp`.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  Solo ACP. Reanuda una sesión existente del entorno ACP cuando `runtime: "acp"`; se ignora al generar subagentes nativos.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  Solo ACP. Transmite la salida de ejecución de ACP a la sesión principal cuando `runtime: "acp"`; omítalo al generar subagentes nativos.
</ParamField>
<ParamField path="model" type="string">
  Sustituye el modelo del subagente. Los valores no válidos se omiten y el subagente se ejecuta con el modelo predeterminado, con una advertencia en el resultado de la herramienta.
</ParamField>
<ParamField path="thinking" type="string">
  Sustituye el nivel de razonamiento para la ejecución del subagente.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Cuando `true`, solicita la vinculación a un hilo del canal para esta sesión de subagente.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  Si `thread: true` y se omite `mode`, el valor predeterminado pasa a ser `session`. `mode: "session"` requiere `thread: true`.
  Si la vinculación a hilos no está disponible para el canal solicitante, utilice `mode: "run"` en su lugar.
</ParamField>
<ParamField path="cleanup" type='"delete" | "keep"' default="keep">
  `"delete"` archiva la sesión inmediatamente después del anuncio (el registro de la conversación se conserva mediante el cambio de nombre).
</ParamField>
<ParamField path="sandbox" type='"inherit" | "require"' default="inherit">
  `require` rechaza la generación a menos que la ejecución del subagente de destino esté aislada.
</ParamField>
<ParamField path="context" type='"isolated" | "fork"' default="isolated">
  `fork` bifurca el registro de conversación actual del solicitante en la sesión del subagente. Solo para subagentes nativos. Las generaciones vinculadas a hilos usan `fork` de forma predeterminada; las generaciones no vinculadas a hilos usan `isolated`.
</ParamField>

<Warning>
`sessions_spawn` **no** acepta parámetros de entrega al canal (`target`,
`channel`, `to`, `threadId`, `replyTo`, `transport`). Los subagentes nativos devuelven
su último turno del asistente al solicitante; la entrega externa sigue correspondiendo
al agente principal/solicitante.
</Warning>

### Nombres de tareas y selección de destinos

`taskName` es un identificador de orquestación orientado al modelo, no una clave de sesión.
Utilícelo para nombres estables de subagentes, como `review_subagents`,
`linux_validation` o `docs_update`, cuando un coordinador pueda necesitar inspeccionar
ese subagente posteriormente.

La resolución de destinos acepta coincidencias exactas de `taskName` y prefijos
inequívocos. La coincidencia se limita a la misma ventana de destinos activos/recientes
que utilizan los destinos numerados `/subagents`, por lo que un subagente completado
y obsoleto no hace ambiguo un identificador reutilizado. Si dos subagentes activos o recientes
comparten el mismo `taskName`, el destino es ambiguo; utilice en su lugar el índice
de la lista, la clave de sesión o el identificador de ejecución.

Los destinos reservados `last` y `all` no son valores válidos de `taskName`
porque ya tienen significados de control.

## Herramienta: `sessions_yield`

Finaliza el turno actual del modelo y espera a que lleguen eventos de ejecución, principalmente
eventos de finalización de subagentes, como el siguiente mensaje. Utilícela después de
generar el trabajo necesario de los subagentes cuando el solicitante no pueda producir una
respuesta final hasta que lleguen esas finalizaciones.

`sessions_yield` es la primitiva de espera. No la sustituya por bucles de sondeo
sobre `subagents`, `sessions_list`, `sessions_history`, el shell
`sleep` o el sondeo de procesos solo para detectar la finalización de un subagente.

Utilice `sessions_yield` únicamente cuando la lista efectiva de herramientas de la sesión
la incluya. Es posible que algunos perfiles de herramientas mínimos o personalizados expongan
`sessions_spawn` y `subagents` sin exponer `sessions_yield`; en ese caso, no invente
un bucle de sondeo solo para esperar la finalización.

Cuando existen subagentes activos, OpenClaw inyecta un bloque de indicaciones compacto generado
durante la ejecución, `Active Subagents`, en los turnos normales para que el solicitante pueda ver
las sesiones actuales de los subagentes, los identificadores de ejecución, los estados, las etiquetas,
las tareas y los alias `taskName` sin sondeos. Los campos de tarea y etiqueta de ese bloque
se entrecomillan como datos, no como instrucciones, porque pueden proceder de argumentos de generación
proporcionados por el usuario o el modelo.

## Herramienta: `subagents`

Enumera las ejecuciones de subagentes generadas que pertenecen a la sesión solicitante. Su ámbito
se limita al solicitante actual; un subagente solo puede ver los subagentes que controla.

Utilice `subagents` para consultar el estado y depurar bajo demanda. Utilice `sessions_yield`
para esperar eventos de finalización.

## Sesiones vinculadas a hilos

Cuando las vinculaciones a hilos están habilitadas para un canal, un subagente puede permanecer
vinculado a un hilo para que los mensajes posteriores del usuario en ese hilo sigan dirigiéndose
a la misma sesión del subagente.

### Canales compatibles con hilos

Un canal admite sesiones persistentes de subagentes vinculadas a hilos
(`sessions_spawn` con `thread: true`) cuando registra un adaptador de vinculación
de conversaciones. Canales incluidos que ofrecen esta compatibilidad: **Discord**,
**iMessage**, **Matrix** y **Telegram**. Discord y Matrix crean un hilo secundario
de forma predeterminada; Telegram e iMessage vinculan la conversación actual de forma
predeterminada. Utilice las claves de configuración `threadBindings` de cada canal para
la habilitación, los tiempos de espera y `spawnSessions`.

### Flujo rápido

<Steps>
  <Step title="Generar">
    `sessions_spawn` con `thread: true` (y, opcionalmente, `mode: "session"`).
  </Step>
  <Step title="Vincular">
    OpenClaw crea o vincula un hilo con ese destino de sesión en el canal activo.
  </Step>
  <Step title="Dirigir mensajes posteriores">
    Las respuestas y los mensajes posteriores de ese hilo se dirigen a la sesión vinculada.
  </Step>
  <Step title="Inspeccionar tiempos de espera">
    Utilice `/session idle` para inspeccionar o actualizar la pérdida automática de foco por inactividad y
    `/session max-age` para controlar el límite máximo.
  </Step>
  <Step title="Desvincular">
    Utilice `/unfocus` para desvincular manualmente.
  </Step>
</Steps>

### Controles manuales

| Comando            | Efecto                                                                                    |
| ------------------ | ----------------------------------------------------------------------------------------- |
| `/focus <target>`  | Vincula el hilo actual (o crea uno) con un destino de subagente/sesión                     |
| `/unfocus`         | Elimina la vinculación del hilo vinculado actual                                           |
| `/agents`          | Enumera las ejecuciones activas y el estado de vinculación (`binding:<id>`, `unbound` o `bindings unavailable`) |
| `/session idle`    | Inspecciona o actualiza la pérdida automática de foco por inactividad (solo hilos vinculados con foco) |
| `/session max-age` | Inspecciona o actualiza el límite máximo (solo hilos vinculados con foco)                   |

### Opciones de configuración

- **Valor predeterminado global:** `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
- **Las claves de sustitución por canal y de vinculación automática al generar** son específicas del adaptador. Consulte [Canales compatibles con hilos](#thread-supporting-channels) más arriba.

Consulte la [Referencia de configuración](/es/gateway/configuration-reference) y
los [Comandos de barra](/es/tools/slash-commands) para conocer los detalles actuales de los adaptadores.

### Lista de permitidos

<ParamField path="agents.list[].subagents.allowAgents" type="string[]">
  Lista de identificadores de agentes configurados que pueden seleccionarse mediante `agentId` explícito (`["*"]` permite cualquier destino configurado). Valor predeterminado: solo el agente solicitante. Si establece una lista y también desea que el solicitante pueda generarse a sí mismo con `agentId`, incluya el identificador del solicitante en la lista.
</ParamField>
<ParamField path="agents.defaults.subagents.allowAgents" type="string[]">
  Lista predeterminada de agentes de destino configurados permitidos que se utiliza cuando el agente solicitante no establece su propio `subagents.allowAgents`.
</ParamField>
<ParamField path="agents.defaults.subagents.requireAgentId" type="boolean" default="false">
  Bloquea las llamadas `sessions_spawn` que omiten `agentId` (obliga a seleccionar explícitamente un perfil). Sustitución por agente: `agents.list[].subagents.requireAgentId`.
</ParamField>
<ParamField path="agents.defaults.subagents.announceTimeoutMs" type="number" default="120000">
  Tiempo de espera por llamada para los intentos de entrega de anuncios `agent` del Gateway. Los valores son milisegundos enteros positivos y se limitan al máximo seguro del temporizador de la plataforma. Los reintentos transitorios pueden hacer que la espera total del anuncio supere un tiempo de espera configurado.
</ParamField>

Si la sesión solicitante está aislada, `sessions_spawn` rechaza los destinos
que se ejecutarían sin aislamiento.

### Descubrimiento

Utilice `agents_list` para ver qué identificadores de agentes están permitidos actualmente para
`sessions_spawn`. La respuesta incluye el modelo efectivo de cada agente enumerado
y los metadatos de ejecución integrados para que los llamadores puedan distinguir entre OpenClaw, el servidor
de aplicaciones de Codex y otras ejecuciones nativas configuradas.

Las entradas `allowAgents` deben apuntar a identificadores de agentes configurados en `agents.list[]`.
`["*"]` significa cualquier agente de destino configurado, además del solicitante. Si se elimina
la configuración de un agente, pero su identificador permanece en `allowAgents`, `sessions_spawn` rechaza
ese identificador y `agents_list` lo omite. Ejecute `openclaw doctor --fix` para limpiar las entradas obsoletas
de la lista de permitidos, o añada una entrada mínima `agents.list[]` cuando el destino deba
seguir pudiendo generarse mientras hereda los valores predeterminados.

### Archivado automático

- Las sesiones de subagentes se archivan automáticamente después de `agents.defaults.subagents.archiveAfterMinutes` (valor predeterminado: `60`).
- El archivado utiliza `sessions.delete` y cambia el nombre del registro de conversación a `*.deleted.<timestamp>` (en la misma carpeta).
- `cleanup: "delete"` archiva inmediatamente después del anuncio (el registro de conversación se conserva mediante el cambio de nombre).
- El archivado automático se realiza con el máximo esfuerzo; los temporizadores pendientes se pierden si se reinicia el Gateway.
- Los tiempos de espera de ejecución configurados **no** archivan automáticamente; solo detienen la ejecución. La sesión permanece hasta el archivado automático.
- El archivado automático se aplica por igual a las sesiones de profundidad 1 y 2.
- La limpieza del navegador es independiente de la limpieza del archivado: se intenta cerrar las pestañas y los procesos del navegador registrados cuando finaliza la ejecución, incluso si se conserva el registro de la conversación o de la sesión.

## Subagentes anidados

De forma predeterminada, los subagentes no pueden generar sus propios subagentes
(`maxSpawnDepth: 1`). Establezca `maxSpawnDepth: 2` para habilitar un nivel de
anidamiento: el **patrón de orquestador**: principal → subagente orquestador →
subsubagentes trabajadores.

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxSpawnDepth: 2, // permitir que los subagentes generen subagentes secundarios (valor predeterminado: 1, intervalo 1-5)
        maxChildrenPerAgent: 5, // máximo de subagentes secundarios activos por sesión de agente (valor predeterminado: 5, intervalo 1-20)
        maxConcurrent: 8, // límite global de concurrencia (valor predeterminado: 8)
        runTimeoutSeconds: 900, // tiempo de espera predeterminado para sessions_spawn (0 = sin tiempo de espera)
        announceTimeoutMs: 120000, // tiempo de espera por llamada para anuncios del Gateway
      },
    },
  },
}
```

### Niveles de profundidad

| Profundidad | Forma de la clave de sesión                  | Rol                                           | ¿Puede crear agentes?                 |
| ----------- | -------------------------------------------- | --------------------------------------------- | ------------------------------------- |
| 0           | `agent:<id>:main`                            | Agente principal                              | Siempre                               |
| 1           | `agent:<id>:subagent:<uuid>`                 | Subagente (orquestador cuando se permite la profundidad 2) | Solo si `maxSpawnDepth >= 2` |
| 2           | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | Subsubagente (trabajador hoja)                | Nunca                                 |

### Cadena de anuncios

Los resultados ascienden por la cadena:

1. El trabajador de profundidad 2 termina → lo anuncia a su padre (orquestador de profundidad 1).
2. El orquestador de profundidad 1 recibe el anuncio, sintetiza los resultados y termina → lo anuncia al agente principal.
3. El agente principal recibe el anuncio y entrega el resultado al usuario.

Cada nivel solo ve los anuncios de sus hijos directos.

<Note>
**Orientación operativa:** inicie el trabajo hijo una sola vez y espere los eventos de finalización
en lugar de crear bucles de sondeo en torno a `sessions_list`,
`sessions_history`, `/subagents list` o los comandos de espera `exec`.
`sessions_list` y `/subagents list` mantienen las relaciones entre sesiones
hijas centradas en el trabajo activo: los hijos activos permanecen vinculados, los hijos finalizados siguen
visibles durante un breve periodo reciente y los enlaces obsoletos a hijos que solo existen en el almacén se
ignoran una vez transcurrido su periodo de vigencia. Esto evita que los metadatos antiguos de `spawnedBy` /
`parentSessionKey` resuciten hijos fantasma después de
un reinicio. Si llega un evento de finalización de un hijo después de haber enviado
la respuesta final, el seguimiento correcto es el token silencioso exacto
`NO_REPLY` / `no_reply`.
</Note>

### Política de herramientas según la profundidad

- El rol y el ámbito de control se escriben en los metadatos de la sesión al crearla. Esto evita que las claves de sesión planas o restauradas recuperen accidentalmente privilegios de orquestador.
- **Profundidad 1 (orquestador, cuando `maxSpawnDepth >= 2`):** obtiene `sessions_spawn`, `subagents`, `sessions_list` y `sessions_history` para poder crear hijos e inspeccionar su estado. Las demás herramientas de sesión/sistema permanecen denegadas.
- **Profundidad 1 (hoja, cuando `maxSpawnDepth == 1`):** sin herramientas de sesión (comportamiento predeterminado actual).
- **Profundidad 2 (trabajador hoja):** sin herramientas de sesión; `sessions_spawn` siempre está denegada en la profundidad 2. No puede crear más hijos.

### Límite de creación por agente

Cada sesión de agente (en cualquier profundidad) puede tener como máximo `maxChildrenPerAgent`
(habitualmente `5`) hijos activos a la vez. Esto evita una expansión descontrolada
desde un único orquestador.

### Detención en cascada

Al detener un orquestador de profundidad 1, se detienen automáticamente todos sus hijos de profundidad 2:

- `/stop` en el chat principal detiene todos los agentes de profundidad 1 y propaga la detención a sus hijos de profundidad 2.

## Autenticación

La autenticación del subagente se resuelve por **id. de agente**, no por tipo de sesión:

- La clave de sesión del subagente es `agent:<agentId>:subagent:<uuid>`.
- El almacén de autenticación se carga desde el `agentDir` de ese agente.
- Los perfiles de autenticación del agente principal se combinan como **respaldo**; los perfiles del agente prevalecen sobre los principales en caso de conflicto.

La combinación es aditiva, por lo que los perfiles principales siempre están disponibles como
alternativas de respaldo. Todavía no se admite una autenticación completamente aislada por agente.

## Anuncio

Los subagentes informan mediante un paso de anuncio:

- El paso de anuncio se ejecuta dentro de la sesión del subagente (no en la sesión solicitante).
- Si el subagente responde exactamente `ANNOUNCE_SKIP`, no se publica nada.
- Si el texto más reciente del asistente es el token silencioso exacto `NO_REPLY` / `no_reply`, se suprime la salida del anuncio aunque haya habido antes progreso visible.

La entrega depende de la profundidad del solicitante:

- Las sesiones solicitantes de nivel superior utilizan una llamada posterior a `agent` con entrega externa (`deliver=true`).
- Las sesiones solicitantes de subagentes anidados reciben una inserción interna posterior (`deliver=false`) para que el orquestador pueda sintetizar los resultados de los hijos dentro de la sesión.
- Si una sesión solicitante de subagente anidado ya no existe, OpenClaw recurre al solicitante de esa sesión cuando está disponible.

Para las sesiones solicitantes de nivel superior, la entrega directa en modo de finalización primero
resuelve cualquier ruta de conversación/hilo vinculada y cualquier anulación del enlace, y después rellena
los campos de canal y destino que falten a partir de la ruta almacenada de la sesión solicitante.
Esto mantiene las finalizaciones en el chat/tema correcto incluso cuando el origen de la finalización
solo identifica el canal.

Al crear los resultados de finalización anidados, la agregación de finalizaciones de hijos se limita a la ejecución actual del solicitante, lo que impide que las salidas de hijos de ejecuciones anteriores y obsoletas se filtren al anuncio actual. Las respuestas de anuncio conservan el enrutamiento de hilo/tema cuando está disponible en los adaptadores de canal.

### Contexto del anuncio

El contexto del anuncio se normaliza como un bloque de eventos interno estable:

| Campo          | Origen                                                                                                   |
| -------------- | -------------------------------------------------------------------------------------------------------- |
| Origen         | `subagent` o `cron`                                                                                     |
| Id. de sesión  | Clave/id. de sesión del hijo                                                                             |
| Tipo           | Tipo de anuncio + etiqueta de tarea                                                                      |
| Estado         | Derivado del resultado de ejecución (`ok`, `error`, `timeout` o `unknown`); **no** se infiere del texto del modelo |
| Contenido del resultado | Texto visible más reciente del asistente hijo                                                   |
| Seguimiento    | Instrucción que describe cuándo responder o permanecer en silencio                                       |

Las ejecuciones finalizadas con error informan del estado de fallo sin reproducir el
texto de respuesta capturado. La salida de herramientas/resultados de herramientas no se convierte en texto del resultado del hijo.

### Línea de estadísticas

Las cargas útiles de los anuncios incluyen una línea de estadísticas al final (incluso cuando están encapsuladas):

- Tiempo de ejecución (p. ej., `runtime 5m12s`).
- Uso de tokens (entrada/salida/total).
- Coste estimado cuando se han configurado los precios del modelo (`models.providers.*.models[].cost`).
- `sessionKey`, `sessionId` y la ruta de la transcripción para que el agente principal pueda obtener el historial mediante `sessions_history` o inspeccionar el archivo en el disco.

Los metadatos internos están destinados únicamente a la orquestación; las respuestas dirigidas al usuario
deben reescribirse con la voz normal del asistente.

### Por qué se prefiere `sessions_history`

`sessions_history` es la vía de orquestación más segura para leer la
transcripción de un hijo desde un turno del agente:

- Censura texto similar a credenciales o tokens incluso cuando la censura de registros de propósito general está desactivada.
- Trunca los bloques de texto largos (4000 caracteres por bloque) y descarta las firmas de pensamiento, las cargas útiles de reproducción del razonamiento y los datos de imágenes insertados.
- Impone un límite de respuesta de 80 KB; las filas demasiado grandes se sustituyen por `[sessions_history omitted: message too large]`.
- Utilice `nextOffset` cuando esté presente para retroceder por ventanas más antiguas de la transcripción.
- `sessions_history` **no** elimina las etiquetas de razonamiento, la estructura auxiliar de `<relevant-memories>` ni el XML de llamadas a herramientas del texto de los mensajes; devuelve bloques de contenido estructurado próximos a la forma de la transcripción sin procesar, únicamente censurados y limitados en tamaño. `/subagents log` aplica un saneamiento más intenso del texto (elimina etiquetas de razonamiento, estructuras auxiliares de memoria y XML de llamadas a herramientas) porque representa líneas de chat simples en lugar de bloques estructurados.
- La inspección de la transcripción sin procesar en el disco es la alternativa cuando se necesita la transcripción completa byte por byte.

## Política de herramientas

Los subagentes utilizan primero el mismo perfil y la misma canalización de políticas de herramientas que el agente padre o
de destino. Después, OpenClaw aplica la capa de restricciones de subagentes.

Los subagentes siempre pierden `gateway`, `agents_list`, `session_status` y
`cron`, independientemente de su profundidad o rol (herramientas interactivas o a nivel de sistema, o
herramientas que debe coordinar el agente principal). Los subagentes hoja (comportamiento predeterminado de profundidad 1
y siempre en la profundidad 2) pierden además `subagents`,
`sessions_list`, `sessions_history` y `sessions_spawn`. Los subagentes nunca
obtienen la herramienta `message`; se desactiva al crearlos, no se filtra mediante
esta lista de denegación; y `sessions_send` permanece denegada para que los subagentes
solo se comuniquen a través de la cadena de anuncios.

`sessions_history` también sigue siendo aquí una vista de recuperación limitada y saneada;
no es un volcado de la transcripción sin procesar.

Cuando `maxSpawnDepth >= 2`, los subagentes orquestadores de profundidad 1 reciben además
`sessions_spawn`, `subagents`, `sessions_list` y
`sessions_history` para poder administrar sus hijos.

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
        // la denegación prevalece
        deny: ["gateway", "cron"],
        // si se define allow, pasa a permitir únicamente esos valores (la denegación sigue prevaleciendo)
        // allow: ["read", "exec", "process"]
      },
    },
  },
}
```

`tools.subagents.tools.allow` es un filtro final que solo permite valores.
Puede restringir el conjunto de herramientas ya resuelto, pero no puede **volver a añadir** una herramienta eliminada
por `tools.profile`. Por ejemplo, `tools.profile: "coding"` incluye
`web_search`/`web_fetch`, pero no la herramienta `browser`. Para permitir que
los subagentes con perfil de programación utilicen automatización del navegador, añada el navegador en la
fase del perfil:

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

Utilice `agents.list[].tools.alsoAllow: ["browser"]` por agente cuando solo uno
deba disponer de automatización del navegador.

## Concurrencia

Los subagentes utilizan un carril de cola dedicado dentro del proceso:

- **Nombre del carril:** `subagent`
- **Concurrencia:** `agents.defaults.subagents.maxConcurrent` (valor predeterminado: `8`)

## Actividad y recuperación

OpenClaw no considera que la ausencia de `endedAt` sea una prueba permanente de que un
subagente sigue activo. Las ejecuciones sin finalizar cuya antigüedad supere el periodo de obsolescencia
(2 horas o el tiempo de espera de ejecución configurado más un breve periodo de gracia,
lo que sea mayor) dejan de contar como activas/pendientes en `/subagents list`,
los resúmenes de estado, el control de finalización de descendientes y las comprobaciones de
concurrencia por sesión.

Después de reiniciar el Gateway, se eliminan las ejecuciones restauradas, obsoletas y sin finalizar, salvo que
su sesión hija esté marcada como `abortedLastRun: true`. Las ejecuciones
interrumpidas por el reinicio permanecen registradas para el flujo de recuperación de subagentes huérfanos: las ejecuciones
obsoletas se finalizan sin reanudarlas, mientras que las sesiones hijas recientes reciben
un mensaje de reanudación sintético antes de borrar el marcador de interrupción.

La recuperación automática tras un reinicio está limitada por sesión hija. Si el mismo
subagente hijo se acepta repetidamente para la recuperación de huérfanos dentro del
periodo de recaída rápida, OpenClaw conserva una marca de recuperación en esa
sesión y deja de reanudarla automáticamente en reinicios posteriores. Ejecute
`openclaw tasks maintenance --apply` para reconciliar el registro de la tarea, o
`openclaw doctor --fix` para borrar los indicadores obsoletos de recuperación interrumpida en
las sesiones marcadas.

<Note>
Si la creación de un subagente falla con Gateway `PAIRING_REQUIRED` /
`scope-upgrade`, compruebe el invocador RPC antes de editar el estado de emparejamiento.
La coordinación interna de `sessions_spawn` se despacha dentro del proceso cuando el
invocador ya se está ejecutando en el contexto de la solicitud del gateway, por lo que
no abre un WebSocket de bucle invertido ni depende de la referencia de ámbito de dispositivo
emparejado de la CLI. Los invocadores fuera del proceso del gateway siguen usando la alternativa
de WebSocket como `client.id: "gateway-client"` con `client.mode: "backend"`
mediante autenticación directa de bucle invertido con token compartido/contraseña. Los invocadores remotos, las rutas
explícitas de `deviceIdentity`, las rutas explícitas de token de dispositivo y los clientes de navegador/node
siguen necesitando la aprobación normal del dispositivo para ampliar los ámbitos.
</Note>

## Detención

- Enviar `/stop` en el chat del solicitante cancela la sesión del solicitante y detiene todas las ejecuciones activas de subagentes creadas desde ella, propagándose a los elementos secundarios anidados.

## Limitaciones

- El anuncio del subagente es de **mejor esfuerzo**. Si el gateway se reinicia, se pierde el trabajo pendiente de «anunciar de vuelta».
- Los subagentes siguen compartiendo los mismos recursos del proceso del gateway; trate `maxConcurrent` como una válvula de seguridad.
- `sessions_spawn` siempre es no bloqueante: devuelve `{ status: "accepted", runId, childSessionKey }` inmediatamente.
- El contexto del subagente solo inyecta `AGENTS.md` y `TOOLS.md` (sin `SOUL.md`, `IDENTITY.md`, `USER.md`, `MEMORY.md`, `HEARTBEAT.md` ni `BOOTSTRAP.md`). Los subagentes nativos de Codex siguen el mismo límite: `TOOLS.md` permanece en las instrucciones heredadas del hilo de Codex, mientras que los archivos de personalidad, identidad y usuario exclusivos del agente principal se inyectan como instrucciones de colaboración con ámbito de turno para que los agentes secundarios no los clonen.
- La profundidad máxima de anidamiento es 5 (intervalo de `maxSpawnDepth`: 1-5). Se recomienda la profundidad 2 para la mayoría de los casos de uso.
- `maxChildrenPerAgent` limita los agentes secundarios activos por sesión (valor predeterminado: `5`; intervalo: `1-20`).

## Relacionado

- [Herramientas de sesión y cambios de estado](/es/concepts/session-tool)
- [Agentes ACP](/es/tools/acp-agents)
- [Envío de agente](/es/tools/agent-send)
- [Tareas en segundo plano](/es/automation/tasks)
- [Herramientas de entorno aislado multiagente](/es/tools/multi-agent-sandbox-tools)

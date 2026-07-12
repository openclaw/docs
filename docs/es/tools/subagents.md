---
read_when:
    - Quieres trabajo en segundo plano o en paralelo mediante el agente
    - Está cambiando la política de la herramienta sessions_spawn o de subagentes
    - Está implementando o solucionando problemas de sesiones de subagentes vinculadas a hilos.
sidebarTitle: Sub-agents
summary: Inicia ejecuciones aisladas de agentes en segundo plano que anuncian los resultados en el chat del solicitante
title: Subagentes
x-i18n:
    generated_at: "2026-07-12T14:54:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: d2293993ad99e2797f5cfbe13e964487f3bd0fa0a3114e78d25ce5862768b9ca
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
- Evitar que la superficie de herramientas pueda utilizarse incorrectamente con facilidad: los subagentes **no** reciben de forma predeterminada herramientas de sesión ni de mensajería.
- Permitir configurar la profundidad de anidamiento para patrones de orquestación.

<Note>
**Nota sobre costes:** cada subagente tiene su propio contexto y consumo de tokens de forma
predeterminada. Para tareas pesadas o repetitivas, configure un modelo más económico para los subagentes
y mantenga el agente principal en un modelo de mayor calidad mediante
`agents.defaults.subagents.model` o anulaciones por agente. Cuando un agente secundario
necesite realmente la transcripción actual del solicitante, inícielo con
`context: "fork"`. Las sesiones de subagentes vinculadas a hilos usan de forma predeterminada
`context: "fork"` porque ramifican la conversación actual en un
hilo de seguimiento.
</Note>

## Comando con barra

`/subagents` inspecciona las ejecuciones de subagentes de la **sesión actual**:

```text
/subagents list
/subagents log <id|#> [limit] [tools]
/subagents info <id|#>
```

`/subagents info` muestra los metadatos de la ejecución (estado, marcas de tiempo, id. de sesión,
ruta de la transcripción y limpieza). `/subagents log` muestra los turnos de chat recientes de una
ejecución; añada el token `tools` para incluir los mensajes de llamadas y resultados de herramientas (omitidos
de forma predeterminada). Use `sessions_history` para obtener una vista de consulta limitada y filtrada por seguridad
desde un turno del agente, o inspeccione la ruta de la transcripción en el disco para consultar
la transcripción completa sin procesar.

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

### Comportamiento de inicio

Los agentes inician subagentes en segundo plano con la herramienta `sessions_spawn`.
Las finalizaciones se devuelven como eventos internos de la sesión principal; el agente
principal o solicitante decide si es necesaria una actualización visible para el usuario.

<AccordionGroup>
  <Accordion title="Finalización no bloqueante basada en envío">
    - `sessions_spawn` no es bloqueante; devuelve inmediatamente un id. de ejecución.
    - Al finalizar, el subagente informa a la sesión principal o solicitante.
    - Los turnos del agente que necesiten resultados de agentes secundarios deben llamar a `sessions_yield` después de iniciar el trabajo requerido. Esto finaliza el turno actual y permite que el evento de finalización llegue como el siguiente mensaje visible para el modelo.
    - La finalización se basa en envío. Una vez iniciado, **no** consulte `/subagents list`, `sessions_list` ni `sessions_history` en un bucle solo para esperar a que termine; compruebe el estado bajo demanda únicamente durante la depuración.
    - La salida del agente secundario es un informe o evidencia que el agente solicitante debe sintetizar. No es texto de instrucciones escrito por el usuario y no puede anular las políticas del sistema, del desarrollador ni del usuario.
    - Al finalizar, OpenClaw intenta cerrar las pestañas o procesos del navegador abiertos por esa sesión de subagente antes de que continúe el flujo de limpieza del anuncio.

  </Accordion>
  <Accordion title="Entrega de la finalización">
    - OpenClaw devuelve las finalizaciones a la sesión solicitante mediante un turno `agent` con una clave de idempotencia estable.
    - Si la ejecución solicitante sigue activa, OpenClaw primero intenta reactivarla o redirigirla en lugar de iniciar una segunda ruta de respuesta visible.
    - Si no se puede reactivar un solicitante activo, OpenClaw recurre a una transferencia al agente solicitante con el mismo contexto de finalización, en lugar de descartar el anuncio.
    - Una transferencia correcta al agente principal completa la entrega del subagente incluso cuando el agente principal decide que no es necesaria ninguna actualización visible para el usuario.
    - Los subagentes nativos no reciben la herramienta de mensajería. Devuelven texto sin formato del asistente al agente principal o solicitante; las respuestas visibles para las personas siguen bajo la política de entrega normal del agente principal o solicitante.
    - Si no se puede usar la transferencia directa, la entrega recurre al enrutamiento mediante cola y después a un breve reintento del anuncio con espera exponencial antes del abandono definitivo.
    - La entrega conserva la ruta resuelta del solicitante: las rutas de finalización vinculadas a un hilo o una conversación tienen prioridad cuando están disponibles. Si el origen de la finalización solo proporciona un canal, OpenClaw completa el destino o la cuenta que falten a partir de la ruta resuelta de la sesión solicitante (`lastChannel` / `lastTo` / `lastAccountId`) para que la entrega directa siga funcionando.

  </Accordion>
  <Accordion title="Metadatos de transferencia de la finalización">
    La transferencia de la finalización a la sesión solicitante es contexto interno generado
    por el entorno de ejecución (no texto escrito por el usuario) e incluye:

    - `Result` — el texto de la respuesta `assistant` visible más reciente del agente secundario. La salida tool/toolResult no se incorpora a los resultados del agente secundario. Las ejecuciones con fallo terminal no reutilizan el texto de respuesta capturado.
    - `Status` — `completed; ready for parent review` / `failed` / `timed out` / `unknown`.
    - Estadísticas compactas del entorno de ejecución y de tokens.
    - Una instrucción de revisión que indica al agente solicitante que verifique el resultado antes de decidir si la tarea original está terminada.
    - Indicaciones de seguimiento que indican al agente solicitante que continúe la tarea o registre un seguimiento cuando el resultado del agente secundario requiera más acciones.
    - Una instrucción de actualización final para cuando no se necesiten más acciones, redactada con la voz normal del asistente sin reenviar metadatos internos sin procesar.

  </Accordion>
  <Accordion title="Modos y entorno de ejecución ACP">
    - `--model` y `--thinking` anulan los valores predeterminados para esa ejecución específica.
    - Use `info`/`log` para inspeccionar los detalles y la salida tras la finalización.
    - Para sesiones persistentes vinculadas a hilos, use `sessions_spawn` con `thread: true` y `mode: "session"`.
    - Si el canal solicitante no admite vinculaciones a hilos, use `mode: "run"` en lugar de volver a intentar una combinación imposible vinculada a un hilo.
    - Para sesiones del arnés ACP (Claude Code, Gemini CLI, OpenCode o Codex ACP/acpx explícito), use `sessions_spawn` con `runtime: "acp"` cuando la herramienta anuncie ese entorno de ejecución. Consulte el [modelo de entrega de ACP](/es/tools/acp-agents#delivery-model) al depurar finalizaciones o bucles entre agentes. Cuando el Plugin `codex` esté habilitado, el control de chat o hilos de Codex debe preferir `/codex ...` frente a ACP, salvo que el usuario solicite explícitamente ACP/acpx.
    - OpenClaw oculta `runtime: "acp"` hasta que ACP está habilitado, el solicitante no está aislado y se ha cargado un Plugin de backend como `acpx`. `runtime: "acp"` espera un id. de arnés ACP externo o una entrada `agents.list[]` con `runtime.type="acp"`; use el entorno de ejecución predeterminado de subagentes para los agentes normales de configuración de OpenClaw procedentes de `agents_list`.

  </Accordion>
</AccordionGroup>

## Modos de contexto

Los subagentes nativos se inician aislados, salvo que el invocador solicite explícitamente bifurcar
la transcripción actual.

| Modo       | Cuándo usarlo                                                                                                                           | Comportamiento                                                                    |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `isolated` | Investigación nueva, implementación independiente, trabajo lento con herramientas o cualquier tarea que pueda describirse en el texto de la tarea | Crea una transcripción limpia para el agente secundario. Es el valor predeterminado y reduce el consumo de tokens. |
| `fork`     | Trabajo que depende de la conversación actual, resultados previos de herramientas o instrucciones matizadas ya presentes en la transcripción del solicitante | Ramifica la transcripción del solicitante en la sesión del agente secundario antes de que este se inicie. |

Use `fork` con moderación. Está destinado a la delegación sensible al contexto, no a
sustituir la redacción de una instrucción de tarea clara.

## Herramienta: `sessions_spawn`

Inicia una ejecución de subagente con `deliver: false` en el carril global `subagent`,
después ejecuta un paso de anuncio y publica la respuesta del anuncio en el
canal de chat del solicitante.

La disponibilidad depende de la política de herramientas efectiva del invocador. El perfil integrado
`coding` incluye `sessions_spawn`; `messaging` y `minimal` no lo
incluyen. `full` permite todas las herramientas. Añada `tools.alsoAllow: ["sessions_spawn",
"sessions_yield", "subagents"]` o use `tools.profile: "coding"` para
los agentes con un perfil más restringido que aun así deban delegar trabajo.
Las políticas de permiso o denegación por canal o grupo, proveedor, aislamiento y agente
aún pueden eliminar la herramienta después de la etapa del perfil. Use `/tools` desde la misma
sesión para confirmar la lista de herramientas efectiva.

**Valores predeterminados:**

- **Modelo:** los subagentes nativos heredan el modelo del invocador, salvo que configure `agents.defaults.subagents.model` (o `agents.list[].subagents.model` por agente). Las ejecuciones del entorno ACP usan el mismo modelo de subagente configurado cuando existe; de lo contrario, el arnés ACP conserva su propio valor predeterminado. Un valor explícito de `sessions_spawn.model` sigue teniendo prioridad.
- **Razonamiento:** los subagentes nativos heredan el razonamiento del invocador, salvo que configure `agents.defaults.subagents.thinking` (o `agents.list[].subagents.thinking` por agente). Las ejecuciones del entorno ACP también aplican `agents.defaults.models["provider/model"].params.thinking` al modelo seleccionado. Un valor explícito de `sessions_spawn.thinking` sigue teniendo prioridad.
- **Tiempo de espera de ejecución:** OpenClaw usa `agents.defaults.subagents.runTimeoutSeconds` cuando está configurado; de lo contrario, recurre a `0` (sin tiempo de espera). `sessions_spawn` no acepta anulaciones del tiempo de espera por llamada.
- **Entrega de tareas:** los subagentes nativos reciben la tarea delegada en su primer mensaje visible `[Subagent Task]`. El mensaje del sistema del subagente contiene las reglas del entorno de ejecución y el contexto de enrutamiento, no un duplicado oculto de la tarea.

Los inicios aceptados de subagentes nativos incluyen los metadatos resueltos del modelo secundario
en el resultado de la herramienta: `resolvedModel` contiene la referencia de modelo aplicada y
`resolvedProvider` contiene el prefijo del proveedor cuando la referencia incluye uno.

### Modo de instrucciones de delegación

`agents.defaults.subagents.delegationMode` controla únicamente las indicaciones de las instrucciones; no cambia la política de herramientas ni impone la delegación.

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
  Identificador estable opcional para identificar a un hijo específico en resultados de estado posteriores. Debe coincidir con `[a-z][a-z0-9_-]{0,63}` y no puede ser un destino reservado como `last` o `all`.
</ParamField>
<ParamField path="label" type="string">
  Etiqueta opcional legible para humanos.
</ParamField>
<ParamField path="agentId" type="string">
  Inicia bajo otro id. de agente configurado cuando lo permita `subagents.allowAgents`.
</ParamField>
<ParamField path="cwd" type="string">
  Directorio de trabajo opcional de la tarea para la ejecución hija. Los subagentes nativos siguen cargando los archivos de arranque desde el espacio de trabajo del agente de destino; `cwd` solo cambia dónde las herramientas de tiempo de ejecución y los entornos de ejecución de la CLI realizan el trabajo delegado.
</ParamField>
<ParamField path="runtime" type='"subagent" | "acp"' default="subagent">
  `acp` se utiliza únicamente para entornos de ejecución ACP externos (`claude`, `droid`, `gemini`, `opencode` o Codex ACP/acpx solicitado explícitamente) y para entradas de `agents.list[]` cuyo `runtime.type` sea `acp`.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  Solo para ACP. Reanuda una sesión existente del entorno de ejecución ACP cuando `runtime: "acp"`; se ignora en los inicios de subagentes nativos.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  Solo para ACP. Transmite la salida de la ejecución ACP a la sesión principal cuando `runtime: "acp"`; debe omitirse en los inicios de subagentes nativos.
</ParamField>
<ParamField path="model" type="string">
  Sustituye el modelo del subagente. Los valores no válidos se omiten y el subagente se ejecuta con el modelo predeterminado, con una advertencia en el resultado de la herramienta.
</ParamField>
<ParamField path="thinking" type="string">
  Sustituye el nivel de razonamiento para la ejecución del subagente.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Cuando es `true`, solicita la vinculación a un hilo del canal para esta sesión de subagente.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  Si `thread: true` y se omite `mode`, el valor predeterminado pasa a ser `session`. `mode: "session"` requiere `thread: true`.
  Si la vinculación a hilos no está disponible para el canal solicitante, usa `mode: "run"` en su lugar.
</ParamField>
<ParamField path="cleanup" type='"delete" | "keep"' default="keep">
  `"delete"` archiva la sesión inmediatamente después del anuncio (pero conserva la transcripción mediante un cambio de nombre).
</ParamField>
<ParamField path="sandbox" type='"inherit" | "require"' default="inherit">
  `require` rechaza el inicio a menos que el tiempo de ejecución hijo de destino esté aislado.
</ParamField>
<ParamField path="context" type='"isolated" | "fork"' default="isolated">
  `fork` bifurca la transcripción actual del solicitante en la sesión hija. Solo para subagentes nativos. Los inicios vinculados a hilos usan `fork` de forma predeterminada; los inicios no vinculados a hilos usan `isolated`.
</ParamField>

<Warning>
`sessions_spawn` **no** acepta parámetros de entrega por canal (`target`,
`channel`, `to`, `threadId`, `replyTo`, `transport`). Los subagentes nativos comunican
su último turno de asistente al solicitante; la entrega externa sigue a cargo del
agente principal/solicitante.
</Warning>

### Nombres y destinos de tareas

`taskName` es un identificador orientado al modelo para la orquestación, no una clave de sesión.
Úsalo para nombres estables de hijos como `review_subagents`,
`linux_validation` o `docs_update` cuando un coordinador pueda necesitar inspeccionar
ese hijo más adelante.

La resolución de destinos acepta coincidencias exactas de `taskName` y
prefijos inequívocos. La coincidencia se limita a la misma ventana de destinos activos/recientes
que usan los destinos numerados de `/subagents`, por lo que un hijo completado obsoleto no vuelve
ambiguo un identificador reutilizado. Si dos hijos activos o recientes comparten el mismo
`taskName`, el destino es ambiguo; usa en su lugar el índice de la lista, la clave de sesión o
el id. de ejecución.

Los destinos reservados `last` y `all` no son valores válidos de `taskName`
porque ya tienen significados de control.

## Herramienta: `sessions_yield`

Finaliza el turno actual del modelo y espera a que lleguen eventos del tiempo de ejecución,
principalmente eventos de finalización de subagentes, como el siguiente mensaje. Úsala después
de iniciar el trabajo hijo requerido cuando el solicitante no pueda producir una respuesta
final hasta que lleguen esas finalizaciones.

`sessions_yield` es la primitiva de espera. No la sustituyas por bucles de sondeo
sobre `subagents`, `sessions_list`, `sessions_history`, el comando de shell
`sleep` o el sondeo de procesos solo para detectar la finalización de un hijo.

Usa `sessions_yield` únicamente cuando la lista efectiva de herramientas de la sesión la incluya.
Algunos perfiles de herramientas mínimos o personalizados pueden exponer `sessions_spawn` y
`subagents` sin exponer `sessions_yield`; en ese caso, no inventes
un bucle de sondeo solo para esperar la finalización.

Cuando existen hijos activos, OpenClaw inyecta en los turnos normales un bloque de indicaciones
compacto generado por el tiempo de ejecución, `Active Subagents`, para que el solicitante pueda ver
las sesiones hijas actuales, los ids. de ejecución, los estados, las etiquetas, las tareas y los
alias `taskName` sin realizar sondeos. Los campos de tarea y etiqueta de ese
bloque aparecen entre comillas como datos, no como instrucciones, porque pueden proceder
de argumentos de inicio proporcionados por el usuario o el modelo.

## Herramienta: `subagents`

Enumera las ejecuciones de subagentes iniciadas que pertenecen a la sesión solicitante. Su ámbito
se limita al solicitante actual; un hijo solo puede ver sus propios hijos controlados.

Usa `subagents` para consultar el estado y depurar cuando sea necesario. Usa `sessions_yield` para
esperar eventos de finalización.

## Sesiones vinculadas a hilos

Cuando las vinculaciones a hilos están habilitadas para un canal, un subagente puede permanecer vinculado
a un hilo para que los mensajes posteriores del usuario en ese hilo sigan dirigiéndose a la
misma sesión del subagente.

### Canales compatibles con hilos

Un canal admite sesiones persistentes de subagentes vinculadas a hilos
(`sessions_spawn` con `thread: true`) cuando registra un adaptador de
vinculación de conversaciones. Canales incluidos con esa compatibilidad: **Discord**,
**iMessage**, **Matrix** y **Telegram**. Discord y Matrix crean de forma predeterminada
un hilo hijo; Telegram e iMessage se vinculan de forma predeterminada a la
conversación actual. Usa las claves de configuración `threadBindings` de cada canal para
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
    Usa `/session idle` para inspeccionar o actualizar la pérdida automática del foco por inactividad y
    `/session max-age` para controlar el límite máximo absoluto.
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
| `/session idle`    | Inspecciona o actualiza la pérdida automática del foco por inactividad (solo hilos vinculados con foco)                             |
| `/session max-age` | Inspecciona o actualiza el límite máximo absoluto (solo hilos vinculados con foco)                                      |

### Interruptores de configuración

- **Valor predeterminado global:** `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
- **Las claves de sustitución por canal y vinculación automática al iniciar** son específicas de cada adaptador. Consulta [Canales compatibles con hilos](#thread-supporting-channels) más arriba.

Consulta [Referencia de configuración](/es/gateway/configuration-reference) y
[Comandos con barra](/es/tools/slash-commands) para obtener los detalles actuales de los adaptadores.

### Lista de permitidos

<ParamField path="agents.list[].subagents.allowAgents" type="string[]">
  Lista de ids. de agentes configurados que pueden seleccionarse mediante un `agentId` explícito (`["*"]` permite cualquier destino configurado). Valor predeterminado: solo el agente solicitante. Si defines una lista y aún quieres que el solicitante se inicie a sí mismo con `agentId`, incluye el id. del solicitante en la lista.
</ParamField>
<ParamField path="agents.defaults.subagents.allowAgents" type="string[]">
  Lista predeterminada de agentes de destino configurados permitidos que se usa cuando el agente solicitante no define su propio `subagents.allowAgents`.
</ParamField>
<ParamField path="agents.defaults.subagents.requireAgentId" type="boolean" default="false">
  Bloquea las llamadas a `sessions_spawn` que omitan `agentId` (obliga a seleccionar el perfil explícitamente). Sustitución por agente: `agents.list[].subagents.requireAgentId`.
</ParamField>
<ParamField path="agents.defaults.subagents.announceTimeoutMs" type="number" default="120000">
  Tiempo de espera por llamada para los intentos de entrega de anuncios `agent` del gateway. Los valores son milisegundos enteros positivos y se limitan al máximo seguro del temporizador de la plataforma. Los reintentos transitorios pueden hacer que la espera total del anuncio supere un único tiempo de espera configurado.
</ParamField>

Si la sesión solicitante está aislada, `sessions_spawn` rechaza los destinos
que se ejecutarían sin aislamiento.

### Detección

Usa `agents_list` para ver qué ids. de agentes están permitidos actualmente para
`sessions_spawn`. La respuesta incluye el modelo efectivo de cada agente enumerado
y los metadatos integrados del tiempo de ejecución para que los autores de llamadas puedan distinguir OpenClaw, el
servidor de aplicaciones de Codex y otros tiempos de ejecución nativos configurados.

Las entradas de `allowAgents` deben apuntar a ids. de agentes configurados en `agents.list[]`.
`["*"]` significa cualquier agente de destino configurado, además del solicitante. Si se elimina
la configuración de un agente pero su id. permanece en `allowAgents`, `sessions_spawn` rechaza ese id.
y `agents_list` lo omite. Ejecuta `openclaw doctor --fix` para limpiar las entradas
obsoletas de la lista de permitidos, o añade una entrada mínima en `agents.list[]` cuando el destino deba
seguir pudiendo iniciarse mientras hereda los valores predeterminados.

### Archivado automático

- Las sesiones de subagentes se archivan automáticamente después de `agents.defaults.subagents.archiveAfterMinutes` (valor predeterminado: `60`).
- El archivado usa `sessions.delete` y cambia el nombre de la transcripción a `*.deleted.<timestamp>` (en la misma carpeta).
- `cleanup: "delete"` archiva inmediatamente después del anuncio (pero conserva la transcripción mediante un cambio de nombre).
- El archivado automático se realiza con el mejor esfuerzo; los temporizadores pendientes se pierden si el gateway se reinicia.
- Los tiempos de espera de ejecución configurados **no** archivan automáticamente; solo detienen la ejecución. La sesión permanece hasta el archivado automático.
- El archivado automático se aplica por igual a las sesiones de profundidad 1 y profundidad 2.
- La limpieza del navegador es independiente de la limpieza del archivo: se intenta cerrar las pestañas y los procesos del navegador supervisados cuando finaliza la ejecución, incluso si se conserva el registro de la transcripción/sesión.

## Subagentes anidados

De forma predeterminada, los subagentes no pueden iniciar sus propios subagentes
(`maxSpawnDepth: 1`). Define `maxSpawnDepth: 2` para habilitar un nivel de
anidamiento: el **patrón de orquestador**: principal → subagente orquestador →
subsubagentes trabajadores.

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxSpawnDepth: 2, // permitir que los subagentes inicien hijos (valor predeterminado: 1, intervalo 1-5)
        maxChildrenPerAgent: 5, // máximo de hijos activos por sesión de agente (valor predeterminado: 5, intervalo 1-20)
        maxConcurrent: 8, // límite global de concurrencia (valor predeterminado: 8)
        runTimeoutSeconds: 900, // tiempo de espera predeterminado para sessions_spawn (0 = sin tiempo de espera)
        announceTimeoutMs: 120000, // tiempo de espera por llamada para el anuncio del gateway
      },
    },
  },
}
```

### Niveles de profundidad

| Profundidad | Formato de la clave de sesión                | Rol                                                | ¿Puede generar?                |
| ----------- | ------------------------------------------ | -------------------------------------------------- | ------------------------------ |
| 0           | `agent:<id>:main`                          | Agente principal                                   | Siempre                        |
| 1           | `agent:<id>:subagent:<uuid>`               | Subagente (orquestador si se permite profundidad 2) | Solo si `maxSpawnDepth >= 2`   |
| 2           | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | Subsubagente (trabajador terminal)                  | Nunca                          |

### Cadena de anuncios

Los resultados regresan ascendiendo por la cadena:

1. El trabajador de profundidad 2 finaliza → lo anuncia a su padre (orquestador de profundidad 1).
2. El orquestador de profundidad 1 recibe el anuncio, sintetiza los resultados y finaliza → lo anuncia al agente principal.
3. El agente principal recibe el anuncio y se lo entrega al usuario.

Cada nivel solo ve los anuncios de sus hijos directos.

<Note>
**Orientación operativa:** inicie el trabajo secundario una sola vez y espere los eventos de finalización en lugar de crear bucles de sondeo en torno a `sessions_list`, `sessions_history`, `/subagents list` o comandos de espera de `exec`.
`sessions_list` y `/subagents list` mantienen las relaciones entre sesiones secundarias centradas en el trabajo activo: los hijos activos permanecen vinculados, los hijos finalizados siguen visibles durante un breve periodo reciente y los vínculos obsoletos con hijos que solo existen en el almacén se ignoran una vez transcurrido su periodo de vigencia. Esto evita que los metadatos antiguos de `spawnedBy` / `parentSessionKey` vuelvan a activar hijos fantasma después de un reinicio. Si llega un evento de finalización de un hijo después de haber enviado la respuesta final, el seguimiento correcto es el token silencioso exacto `NO_REPLY` / `no_reply`.
</Note>

### Política de herramientas por profundidad

- El rol y el ámbito de control se escriben en los metadatos de la sesión en el momento de la generación. Esto evita que las claves de sesión planas o restauradas recuperen accidentalmente privilegios de orquestador.
- **Profundidad 1 (orquestador, cuando `maxSpawnDepth >= 2`):** obtiene `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history` para poder generar hijos e inspeccionar su estado. Las demás herramientas de sesión/sistema permanecen denegadas.
- **Profundidad 1 (terminal, cuando `maxSpawnDepth == 1`):** sin herramientas de sesión (comportamiento predeterminado actual).
- **Profundidad 2 (trabajador terminal):** sin herramientas de sesión; `sessions_spawn` siempre se deniega en la profundidad 2. No puede generar más hijos.

### Límite de generación por agente

Cada sesión de agente (en cualquier profundidad) puede tener como máximo `maxChildrenPerAgent` (valor predeterminado `5`) hijos activos a la vez. Esto evita una expansión descontrolada desde un único orquestador.

### Detención en cascada

Detener un orquestador de profundidad 1 detiene automáticamente a todos sus hijos de profundidad 2:

- `/stop` en el chat principal detiene todos los agentes de profundidad 1 y propaga la detención a sus hijos de profundidad 2.

## Autenticación

La autenticación del subagente se resuelve por **id del agente**, no por tipo de sesión:

- La clave de sesión del subagente es `agent:<agentId>:subagent:<uuid>`.
- El almacén de autenticación se carga desde el `agentDir` de ese agente.
- Los perfiles de autenticación del agente principal se combinan como **alternativa**; los perfiles del agente prevalecen sobre los perfiles principales en caso de conflicto.

La combinación es aditiva, por lo que los perfiles principales siempre están disponibles como
alternativas. Aún no se admite la autenticación completamente aislada por agente.

## Anuncio

Los subagentes informan mediante un paso de anuncio:

- El paso de anuncio se ejecuta dentro de la sesión del subagente (no en la sesión solicitante).
- Si el subagente responde exactamente `ANNOUNCE_SKIP`, no se publica nada.
- Si el texto más reciente del asistente es el token silencioso exacto `NO_REPLY` / `no_reply`, se suprime la salida del anuncio incluso si antes hubo progreso visible.

La entrega depende de la profundidad del solicitante:

- Las sesiones solicitantes de nivel superior usan una llamada de seguimiento a `agent` con entrega externa (`deliver=true`).
- Las sesiones de subagente solicitantes anidadas reciben una inyección interna de seguimiento (`deliver=false`) para que el orquestador pueda sintetizar los resultados secundarios dentro de la sesión.
- Si una sesión de subagente solicitante anidada ya no existe, OpenClaw recurre al solicitante de esa sesión cuando está disponible.

Para las sesiones solicitantes de nivel superior, la entrega directa en modo de finalización primero
resuelve cualquier ruta de conversación/hilo vinculada y cualquier sobrescritura del enlace y, después, completa
los campos de canal y destino que falten a partir de la ruta almacenada de la sesión solicitante.
Esto mantiene las finalizaciones en el chat/tema correcto incluso cuando el origen de la finalización
solo identifica el canal.

La agregación de finalizaciones secundarias se limita a la ejecución actual del solicitante al
crear los resultados de finalización anidados, lo que evita que las salidas secundarias obsoletas de
ejecuciones anteriores se filtren al anuncio actual. Las respuestas de anuncio conservan
el enrutamiento de hilo/tema cuando está disponible en los adaptadores de canal.

### Contexto del anuncio

El contexto del anuncio se normaliza en un bloque de eventos interno estable:

| Campo                  | Origen                                                                                                        |
| ---------------------- | ------------------------------------------------------------------------------------------------------------- |
| Origen                 | `subagent` o `cron`                                                                                           |
| Ids de sesión          | Clave/id de la sesión secundaria                                                                              |
| Tipo                   | Tipo de anuncio + etiqueta de la tarea                                                                        |
| Estado                 | Derivado del resultado de ejecución (`ok`, `error`, `timeout` o `unknown`), **no** inferido del texto del modelo |
| Contenido del resultado | Texto visible más reciente del asistente secundario                                                           |
| Seguimiento            | Instrucción que describe cuándo responder y cuándo permanecer en silencio                                     |

Las ejecuciones con fallo terminal informan del estado de fallo sin reproducir el
texto de respuesta capturado. La salida de tool/toolResult no se convierte en texto del resultado secundario.

### Línea de estadísticas

Las cargas útiles de anuncio incluyen una línea de estadísticas al final (incluso cuando se ajustan):

- Tiempo de ejecución (p. ej., `runtime 5m12s`).
- Uso de tokens (entrada/salida/total).
- Coste estimado cuando se configuran los precios de los modelos (`models.providers.*.models[].cost`).
- `sessionKey`, `sessionId` y la ruta de la transcripción para que el agente principal pueda obtener el historial mediante `sessions_history` o inspeccionar el archivo en el disco.

Los metadatos internos están destinados únicamente a la coordinación; las respuestas dirigidas al usuario
deben reformularse con la voz normal del asistente.

### Por qué se prefiere `sessions_history`

`sessions_history` es la vía de coordinación más segura para leer la
transcripción de un agente hijo desde el turno de un agente:

- Censura el texto similar a credenciales o tokens incluso cuando la censura general de registros está desactivada.
- Trunca los bloques de texto largos (4000 caracteres por bloque) y descarta las firmas de pensamiento, las cargas útiles de reproducción del razonamiento y los datos de imágenes insertados.
- Impone un límite de respuesta de 80 KB; las filas que lo superan se sustituyen por `[sessions_history omitted: message too large]`.
- Cuando esté presente, use `nextOffset` para retroceder por ventanas de transcripción más antiguas.
- `sessions_history` **no** elimina las etiquetas de razonamiento, la estructura auxiliar `<relevant-memories>` ni el XML de llamadas a herramientas del texto de los mensajes: devuelve bloques de contenido estructurados cercanos a la forma de la transcripción sin procesar, pero censurados y con límites de tamaño. `/subagents log` aplica un saneador de prosa más exhaustivo (elimina las etiquetas de razonamiento, la estructura auxiliar de memoria y el XML de llamadas a herramientas) porque representa líneas de chat de texto sin formato en lugar de bloques estructurados.
- La inspección de la transcripción sin procesar en el disco es la alternativa cuando se necesita la transcripción completa byte por byte.

## Política de herramientas

Los subagentes usan primero el mismo perfil y la misma canalización de políticas de herramientas que el agente principal o
de destino. Después, OpenClaw aplica la capa de restricciones
para subagentes.

Los subagentes siempre pierden `gateway`, `agents_list`, `session_status` y
`cron`, independientemente de su profundidad o función (herramientas de nivel de sistema/interactivas, o
herramientas que debe coordinar el agente principal). Los subagentes hoja (comportamiento
predeterminado de profundidad 1, y siempre en la profundidad 2) pierden además `subagents`,
`sessions_list`, `sessions_history` y `sessions_spawn`. Los subagentes nunca
reciben la herramienta `message`: se desactiva al crearlos, no se filtra mediante
esta lista de denegación; además, `sessions_send` permanece denegada para que los subagentes
se comuniquen únicamente mediante la cadena de anuncios.

`sessions_history` también sigue siendo aquí una vista de recuperación saneada y limitada; no
es un volcado de la transcripción sin procesar.

Cuando `maxSpawnDepth >= 2`, los subagentes coordinadores de profundidad 1 reciben además
`sessions_spawn`, `subagents`, `sessions_list` y
`sessions_history` para poder gestionar a sus agentes hijos.

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
        // si se establece allow, pasa a permitir únicamente esos valores (deny sigue prevaleciendo)
        // allow: ["read", "exec", "process"]
      },
    },
  },
}
```

`tools.subagents.tools.allow` es un filtro final que permite únicamente los valores especificados. Puede restringir
el conjunto de herramientas ya resuelto, pero no puede **volver a añadir** una herramienta eliminada
por `tools.profile`. Por ejemplo, `tools.profile: "coding"` incluye
`web_search`/`web_fetch`, pero no la herramienta `browser`. Para permitir que
los subagentes con el perfil de programación usen la automatización del navegador, añada el navegador en la
etapa del perfil:

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

Use `agents.list[].tools.alsoAllow: ["browser"]` por agente cuando solo uno
deba recibir automatización del navegador.

## Simultaneidad

Los subagentes usan un canal de cola dedicado dentro del proceso:

- **Nombre del canal:** `subagent`
- **Simultaneidad:** `agents.defaults.subagents.maxConcurrent` (valor predeterminado: `8`)

## Disponibilidad y recuperación

OpenClaw no considera la ausencia de `endedAt` como prueba permanente de que un
subagente sigue activo. Las ejecuciones sin finalizar anteriores a la ventana de obsolescencia
(2 horas o el tiempo de espera configurado para la ejecución más un breve periodo de gracia,
lo que sea mayor) dejan de contar como activas o pendientes en `/subagents list`,
los resúmenes de estado, el bloqueo de finalización de descendientes y las comprobaciones de
simultaneidad por sesión.

Después de reiniciar el Gateway, las ejecuciones restauradas obsoletas y sin finalizar se eliminan, salvo que
su sesión hija esté marcada con `abortedLastRun: true`. Las ejecuciones interrumpidas
por el reinicio permanecen registradas para el flujo de recuperación de subagentes huérfanos: las ejecuciones
obsoletas se finalizan sin reanudarse, mientras que las sesiones hijas recientes reciben
un mensaje sintético de reanudación antes de que se borre el marcador de interrupción.

La recuperación automática tras reinicios está limitada por sesión hija. Si el mismo
subagente hijo se acepta repetidamente para la recuperación de huérfanos dentro de la
ventana de bloqueo rápido reiterado, OpenClaw conserva una marca de recuperación en esa
sesión y deja de reanudarla automáticamente en reinicios posteriores. Ejecute
`openclaw tasks maintenance --apply` para conciliar el registro de la tarea, o
`openclaw doctor --fix` para borrar los indicadores obsoletos de recuperación interrumpida en
las sesiones marcadas.

<Note>
Si la creación de un subagente falla con `PAIRING_REQUIRED` /
`scope-upgrade` del Gateway, compruebe el invocador RPC antes de modificar el estado de emparejamiento.
La coordinación interna de `sessions_spawn` se despacha dentro del proceso cuando el
invocador ya se está ejecutando en el contexto de la solicitud del Gateway, por lo que no
abre un WebSocket de bucle invertido ni depende del ámbito de referencia del dispositivo emparejado de la CLI.
Los invocadores externos al proceso del Gateway siguen usando la alternativa de WebSocket
como `client.id: "gateway-client"` con `client.mode: "backend"`
mediante autenticación directa de bucle invertido con token compartido o contraseña. Los invocadores remotos, los valores
explícitos de `deviceIdentity`, las rutas explícitas de tokens de dispositivo y los clientes de navegador/Node
siguen necesitando la aprobación normal del dispositivo para las ampliaciones de ámbito.
</Note>

## Detención

- Enviar `/stop` en el chat del solicitante interrumpe la sesión del solicitante y detiene todas las ejecuciones activas de subagentes iniciadas desde ella, propagándose a los agentes hijos anidados.

## Limitaciones

- El anuncio de los subagentes es **de mejor esfuerzo**. Si el Gateway se reinicia, se pierde el trabajo pendiente de «anunciar de vuelta».
- Los subagentes siguen compartiendo los recursos del mismo proceso del Gateway; trate `maxConcurrent` como una válvula de seguridad.
- `sessions_spawn` siempre es no bloqueante: devuelve `{ status: "accepted", runId, childSessionKey }` inmediatamente.
- El contexto de los subagentes solo inyecta `AGENTS.md` y `TOOLS.md` (no `SOUL.md`, `IDENTITY.md`, `USER.md`, `MEMORY.md`, `HEARTBEAT.md` ni `BOOTSTRAP.md`). Los subagentes nativos de Codex siguen el mismo límite: `TOOLS.md` permanece en las instrucciones heredadas del hilo de Codex, mientras que los archivos de personalidad, identidad y usuario exclusivos del agente principal se inyectan como instrucciones de colaboración con alcance limitado al turno para que los agentes secundarios no los clonen.
- La profundidad máxima de anidamiento es 5 (intervalo de `maxSpawnDepth`: 1-5). Se recomienda una profundidad de 2 para la mayoría de los casos de uso.
- `maxChildrenPerAgent` limita los agentes secundarios activos por sesión (valor predeterminado: `5`; intervalo: `1-20`).

## Relacionado

- [Herramientas de sesión y cambios de estado](/es/concepts/session-tool)
- [Agentes ACP](/es/tools/acp-agents)
- [Envío de agentes](/es/tools/agent-send)
- [Tareas en segundo plano](/es/automation/tasks)
- [Herramientas de entorno aislado multiagente](/es/tools/multi-agent-sandbox-tools)

---
read_when:
    - Quieres trabajo en segundo plano o en paralelo mediante el agente
    - Estás cambiando la política de la herramienta sessions_spawn o de subagentes
    - Estás implementando o solucionando problemas de sesiones de subagentes vinculadas a hilos
sidebarTitle: Sub-agents
summary: Inicia ejecuciones aisladas de agentes en segundo plano que comunican los resultados al chat del solicitante
title: Subagentes
x-i18n:
    generated_at: "2026-07-11T23:36:29Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d2293993ad99e2797f5cfbe13e964487f3bd0fa0a3114e78d25ce5862768b9ca
    source_path: tools/subagents.md
    workflow: 16
---

Los subagentes son ejecuciones de agentes en segundo plano generadas desde una ejecución de agente existente.
Cada uno se ejecuta en su propia sesión (`agent:<agentId>:subagent:<uuid>`) y,
al finalizar, **anuncia** su resultado en el canal de chat del solicitante.
Cada ejecución de subagente se registra como una [tarea en segundo plano](/es/automation/tasks).

Objetivos:

- Paralelizar la investigación, las tareas largas y el trabajo lento con herramientas sin bloquear la ejecución principal.
- Mantener los subagentes aislados de forma predeterminada (separación de sesiones y aislamiento opcional).
- Evitar que la superficie de herramientas sea fácil de usar incorrectamente: los subagentes **no** reciben herramientas de sesión ni de mensajería de forma predeterminada.
- Admitir una profundidad de anidamiento configurable para patrones de orquestación.

<Note>
**Nota sobre costes:** cada subagente tiene su propio contexto y consumo de tokens de
forma predeterminada. Para tareas pesadas o repetitivas, configura un modelo más económico para los subagentes
y mantén el agente principal en un modelo de mayor calidad mediante
`agents.defaults.subagents.model` o anulaciones por agente. Cuando un agente secundario
necesite realmente la transcripción actual del solicitante, créalo con
`context: "fork"`. Las sesiones de subagentes vinculadas a hilos usan de forma predeterminada
`context: "fork"` porque bifurcan la conversación actual en un
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
ruta de la transcripción y limpieza). `/subagents log` imprime los turnos recientes del chat de una
ejecución; añade el token `tools` para incluir los mensajes de llamadas y resultados de herramientas (omitidos
de forma predeterminada). Usa `sessions_history` para obtener, desde un turno del agente, una vista
acotada y filtrada por seguridad de la información recordada, o inspecciona la ruta de la transcripción en el disco para
consultar la transcripción completa sin procesar.

### Controles de vinculación a hilos

Estos comandos funcionan en canales con vinculaciones persistentes a hilos. Consulta
[Canales compatibles con hilos](#thread-supporting-channels) a continuación.

```text
/focus <subagent-label|session-key|session-id|session-label>
/unfocus
/agents
/session idle <duration|off>
/session max-age <duration|off>
```

### Comportamiento de creación

Los agentes inician subagentes en segundo plano con la herramienta `sessions_spawn`.
Las finalizaciones se devuelven como eventos internos de la sesión principal; el agente
principal o solicitante decide si es necesaria una actualización visible para el usuario.

<AccordionGroup>
  <Accordion title="Finalización no bloqueante basada en envío">
    - `sessions_spawn` no es bloqueante; devuelve inmediatamente un id. de ejecución.
    - Al finalizar, el subagente informa a la sesión principal o solicitante.
    - Los turnos del agente que necesiten resultados de agentes secundarios deben llamar a `sessions_yield` después de generar el trabajo necesario. Esto finaliza el turno actual y permite que el evento de finalización llegue como el siguiente mensaje visible para el modelo.
    - La finalización se basa en envío. Una vez creado, **no** consultes `/subagents list`, `sessions_list` ni `sessions_history` en un bucle únicamente para esperar a que termine; comprueba el estado bajo demanda solo durante la depuración.
    - La salida del agente secundario es un informe o evidencia que debe sintetizar el agente solicitante. No es texto de instrucciones escrito por el usuario y no puede anular las políticas del sistema, del desarrollador ni del usuario.
    - Al finalizar, OpenClaw intenta cerrar las pestañas y los procesos del navegador registrados que haya abierto esa sesión de subagente antes de continuar con el flujo de limpieza del anuncio.

  </Accordion>
  <Accordion title="Entrega de la finalización">
    - OpenClaw devuelve las finalizaciones a la sesión solicitante mediante un turno `agent` con una clave de idempotencia estable.
    - Si la ejecución solicitante sigue activa, OpenClaw primero intenta reactivarla o redirigirla en lugar de iniciar una segunda ruta de respuesta visible.
    - Si no se puede reactivar un solicitante activo, OpenClaw recurre a una transferencia al agente solicitante con el mismo contexto de finalización, en lugar de descartar el anuncio.
    - Una transferencia correcta al agente principal completa la entrega del subagente incluso cuando el agente principal decide que no se necesita ninguna actualización visible para el usuario.
    - Los subagentes nativos no reciben la herramienta de mensajería. Devuelven texto sin formato del asistente al agente principal o solicitante; las respuestas visibles para las personas siguen siendo responsabilidad de la política normal de entrega del agente principal o solicitante.
    - Si no se puede usar la transferencia directa, la entrega recurre al enrutamiento mediante cola y, después, a un breve reintento del anuncio con espera exponencial antes de desistir definitivamente.
    - La entrega conserva la ruta resuelta del solicitante: las rutas de finalización vinculadas a hilos o conversaciones tienen prioridad cuando están disponibles. Si el origen de la finalización solo proporciona un canal, OpenClaw completa el destino o la cuenta que falte a partir de la ruta resuelta de la sesión solicitante (`lastChannel` / `lastTo` / `lastAccountId`) para que la entrega directa siga funcionando.

  </Accordion>
  <Accordion title="Metadatos de transferencia de la finalización">
    La transferencia de la finalización a la sesión solicitante es contexto interno generado
    en tiempo de ejecución (no texto escrito por el usuario) e incluye:

    - `Result`: el texto de la respuesta visible más reciente del `assistant` del agente secundario. La salida de tool/toolResult no se incorpora a los resultados del agente secundario. Las ejecuciones con fallo terminal no reutilizan el texto de respuesta capturado.
    - `Status`: `completed; ready for parent review` / `failed` / `timed out` / `unknown`.
    - Estadísticas compactas de tiempo de ejecución y tokens.
    - Una instrucción de revisión que indica al agente solicitante que verifique el resultado antes de decidir si la tarea original está terminada.
    - Indicaciones de seguimiento que indican al agente solicitante que continúe la tarea o registre un seguimiento cuando el resultado del agente secundario deje acciones pendientes.
    - Una instrucción de actualización final para cuando no queden más acciones, escrita con la voz normal del asistente sin reenviar metadatos internos sin procesar.

  </Accordion>
  <Accordion title="Modos y entorno de ejecución ACP">
    - `--model` y `--thinking` anulan los valores predeterminados para esa ejecución específica.
    - Usa `info`/`log` para inspeccionar los detalles y la salida después de la finalización.
    - Para sesiones persistentes vinculadas a hilos, usa `sessions_spawn` con `thread: true` y `mode: "session"`.
    - Si el canal solicitante no admite vinculaciones a hilos, usa `mode: "run"` en lugar de reintentar una combinación imposible vinculada a hilos.
    - Para sesiones del entorno ACP (Claude Code, Gemini CLI, OpenCode o Codex ACP/acpx explícito), usa `sessions_spawn` con `runtime: "acp"` cuando la herramienta anuncie ese entorno de ejecución. Consulta el [modelo de entrega de ACP](/es/tools/acp-agents#delivery-model) al depurar finalizaciones o bucles entre agentes. Cuando el Plugin `codex` esté habilitado, el control de chat o hilos de Codex debe preferir `/codex ...` frente a ACP, salvo que el usuario solicite explícitamente ACP/acpx.
    - OpenClaw oculta `runtime: "acp"` hasta que ACP está habilitado, el solicitante no está aislado y se ha cargado un Plugin de entorno como `acpx`. `runtime: "acp"` espera un id. de entorno ACP externo o una entrada `agents.list[]` con `runtime.type="acp"`; usa el entorno predeterminado de subagentes para los agentes normales de configuración de OpenClaw procedentes de `agents_list`.

  </Accordion>
</AccordionGroup>

## Modos de contexto

Los subagentes nativos comienzan aislados, salvo que el llamador solicite explícitamente bifurcar
la transcripción actual.

| Modo       | Cuándo usarlo                                                                                                                           | Comportamiento                                                                                     |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `isolated` | Investigación nueva, implementación independiente, trabajo lento con herramientas o cualquier tarea que pueda explicarse en su texto    | Crea una transcripción limpia para el agente secundario. Es el valor predeterminado y reduce el consumo de tokens. |
| `fork`     | Trabajo que depende de la conversación actual, resultados anteriores de herramientas o instrucciones matizadas ya presentes en la transcripción del solicitante | Bifurca la transcripción del solicitante en la sesión del agente secundario antes de que este comience. |

Usa `fork` con moderación. Sirve para delegaciones sensibles al contexto, no como
sustituto de redactar instrucciones claras para la tarea.

## Herramienta: `sessions_spawn`

Inicia una ejecución de subagente con `deliver: false` en la vía global `subagent`,
después ejecuta un paso de anuncio y publica la respuesta del anuncio en el
canal de chat del solicitante.

La disponibilidad depende de la política de herramientas efectiva del llamador. El perfil integrado
`coding` incluye `sessions_spawn`; `messaging` y `minimal` no.
`full` permite todas las herramientas. Añade `tools.alsoAllow: ["sessions_spawn",
"sessions_yield", "subagents"]`, o usa `tools.profile: "coding"`, para
agentes con un perfil más restringido que aun así deban poder delegar trabajo.
Las políticas de permisos y denegaciones del canal o grupo, proveedor, aislamiento y agente
todavía pueden retirar la herramienta después de la etapa del perfil. Usa `/tools` desde la misma
sesión para confirmar la lista efectiva de herramientas.

**Valores predeterminados:**

- **Modelo:** los subagentes nativos heredan el modelo del llamador, salvo que configures `agents.defaults.subagents.model` (o `agents.list[].subagents.model` por agente). Las creaciones del entorno ACP usan el mismo modelo de subagente configurado cuando está disponible; de lo contrario, el entorno ACP conserva su propio valor predeterminado. Un valor explícito de `sessions_spawn.model` siempre tiene prioridad.
- **Razonamiento:** los subagentes nativos heredan el razonamiento del llamador, salvo que configures `agents.defaults.subagents.thinking` (o `agents.list[].subagents.thinking` por agente). Las creaciones del entorno ACP también aplican `agents.defaults.models["provider/model"].params.thinking` al modelo seleccionado. Un valor explícito de `sessions_spawn.thinking` siempre tiene prioridad.
- **Tiempo de espera de la ejecución:** OpenClaw usa `agents.defaults.subagents.runTimeoutSeconds` cuando está configurado; de lo contrario, recurre a `0` (sin tiempo de espera). `sessions_spawn` no acepta anulaciones del tiempo de espera por llamada.
- **Entrega de la tarea:** los subagentes nativos reciben la tarea delegada en su primer mensaje visible `[Subagent Task]`. El mensaje del sistema del subagente contiene las reglas del entorno de ejecución y el contexto de enrutamiento, no un duplicado oculto de la tarea.

Las creaciones de subagentes nativos aceptadas incluyen los metadatos resueltos del modelo secundario
en el resultado de la herramienta: `resolvedModel` contiene la referencia del modelo aplicado y
`resolvedProvider` contiene el prefijo del proveedor cuando la referencia tiene uno.

### Modo de instrucciones de delegación

`agents.defaults.subagents.delegationMode` controla únicamente las indicaciones de las instrucciones; no cambia la política de herramientas ni obliga a delegar.

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
  Identificador estable opcional para identificar a un hijo específico en salidas de estado posteriores. Debe coincidir con `[a-z][a-z0-9_-]{0,63}` y no puede ser un destino reservado como `last` o `all`.
</ParamField>
<ParamField path="label" type="string">
  Etiqueta opcional legible para humanos.
</ParamField>
<ParamField path="agentId" type="string">
  Inicia la ejecución bajo otro id. de agente configurado cuando lo permita `subagents.allowAgents`.
</ParamField>
<ParamField path="cwd" type="string">
  Directorio de trabajo opcional de la tarea para la ejecución hija. Los subagentes nativos siguen cargando los archivos de arranque desde el espacio de trabajo del agente de destino; `cwd` solo cambia dónde las herramientas de ejecución y los entornos de CLI realizan el trabajo delegado.
</ParamField>
<ParamField path="runtime" type='"subagent" | "acp"' default="subagent">
  `acp` se usa únicamente con entornos ACP externos (`claude`, `droid`, `gemini`, `opencode` o Codex ACP/acpx solicitado explícitamente) y con entradas de `agents.list[]` cuyo `runtime.type` sea `acp`.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  Solo para ACP. Reanuda una sesión existente del entorno ACP cuando `runtime: "acp"`; se ignora al iniciar subagentes nativos.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  Solo para ACP. Transmite la salida de la ejecución ACP a la sesión principal cuando `runtime: "acp"`; se omite al iniciar subagentes nativos.
</ParamField>
<ParamField path="model" type="string">
  Sobrescribe el modelo del subagente. Los valores no válidos se omiten y el subagente se ejecuta con el modelo predeterminado, con una advertencia en el resultado de la herramienta.
</ParamField>
<ParamField path="thinking" type="string">
  Sobrescribe el nivel de razonamiento para la ejecución del subagente.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Cuando es `true`, solicita la vinculación a un hilo del canal para esta sesión del subagente.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  Si `thread: true` y se omite `mode`, el valor predeterminado pasa a ser `session`. `mode: "session"` requiere `thread: true`.
  Si la vinculación a hilos no está disponible para el canal solicitante, usa `mode: "run"` en su lugar.
</ParamField>
<ParamField path="cleanup" type='"delete" | "keep"' default="keep">
  `"delete"` archiva la sesión inmediatamente después del anuncio (aun así conserva la transcripción mediante un cambio de nombre).
</ParamField>
<ParamField path="sandbox" type='"inherit" | "require"' default="inherit">
  `require` rechaza el inicio, salvo que el entorno de ejecución hijo de destino esté aislado.
</ParamField>
<ParamField path="context" type='"isolated" | "fork"' default="isolated">
  `fork` bifurca la transcripción actual del solicitante en la sesión hija. Solo para subagentes nativos. Los inicios vinculados a hilos usan `fork` de forma predeterminada; los inicios no vinculados a hilos usan `isolated`.
</ParamField>

<Warning>
`sessions_spawn` **no** acepta parámetros de entrega a canales (`target`,
`channel`, `to`, `threadId`, `replyTo`, `transport`). Los subagentes nativos comunican
su último turno del asistente al solicitante; la entrega externa queda a cargo
del agente principal/solicitante.
</Warning>

### Nombres de tareas y selección de destinos

`taskName` es un identificador orientado al modelo para la orquestación, no una clave de sesión.
Úsalo para nombres estables de hijos como `review_subagents`,
`linux_validation` o `docs_update` cuando un coordinador pueda necesitar inspeccionar
ese hijo más adelante.

La resolución de destinos acepta coincidencias exactas de `taskName` y
prefijos inequívocos. La coincidencia se limita a la misma ventana de destinos
activos/recientes que usan los destinos numerados de `/subagents`, por lo que un hijo
completado obsoleto no hace ambiguo un identificador reutilizado. Si dos hijos activos
o recientes comparten el mismo `taskName`, el destino es ambiguo; usa en su lugar
el índice de la lista, la clave de sesión o el id. de ejecución.

Los destinos reservados `last` y `all` no son valores válidos para `taskName`
porque ya tienen significados de control.

## Herramienta: `sessions_yield`

Finaliza el turno actual del modelo y espera a que lleguen eventos del entorno de ejecución,
principalmente eventos de finalización de subagentes, como el siguiente mensaje. Úsala después
de iniciar el trabajo hijo necesario cuando el solicitante no pueda producir una respuesta
final hasta que lleguen esas finalizaciones.

`sessions_yield` es la primitiva de espera. No la sustituyas por bucles de sondeo
sobre `subagents`, `sessions_list`, `sessions_history`, `sleep` del intérprete
de comandos ni sondeo de procesos solo para detectar la finalización de un hijo.

Usa `sessions_yield` únicamente cuando la lista efectiva de herramientas de la sesión
la incluya. Algunos perfiles de herramientas mínimos o personalizados pueden exponer
`sessions_spawn` y `subagents` sin exponer `sessions_yield`; en ese caso, no inventes
un bucle de sondeo solo para esperar a que finalice.

Cuando hay hijos activos, OpenClaw inyecta un bloque de solicitud compacto generado
por el entorno de ejecución, `Active Subagents`, en los turnos normales para que el solicitante
pueda ver las sesiones hijas actuales, los ids. de ejecución, estados, etiquetas, tareas y
alias `taskName` sin realizar sondeos. Los campos de tarea y etiqueta de ese bloque
se citan como datos, no como instrucciones, porque pueden proceder
de argumentos de inicio proporcionados por el usuario o el modelo.

## Herramienta: `subagents`

Enumera las ejecuciones de subagentes iniciadas que pertenecen a la sesión solicitante. Su ámbito
se limita al solicitante actual; un hijo solo puede ver a sus propios hijos controlados.

Usa `subagents` para consultar el estado y depurar bajo demanda. Usa `sessions_yield` para
esperar eventos de finalización.

## Sesiones vinculadas a hilos

Cuando las vinculaciones a hilos están habilitadas para un canal, un subagente puede permanecer vinculado
a un hilo para que los mensajes posteriores del usuario en ese hilo sigan dirigiéndose
a la misma sesión del subagente.

### Canales compatibles con hilos

Un canal admite sesiones persistentes de subagentes vinculadas a hilos
(`sessions_spawn` con `thread: true`) cuando registra un adaptador de
vinculación de conversaciones. Canales incluidos con esa compatibilidad: **Discord**,
**iMessage**, **Matrix** y **Telegram**. Discord y Matrix crean un hilo hijo de
forma predeterminada; Telegram e iMessage vinculan la conversación actual de forma
predeterminada. Usa las claves de configuración `threadBindings` de cada canal para
la activación, los tiempos de espera y `spawnSessions`.

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
    `/session max-age` para controlar el límite estricto.
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
| `/session max-age` | Inspecciona/actualiza el límite estricto (solo hilos vinculados con foco)                                      |

### Opciones de configuración

- **Valor predeterminado global:** `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
- **Las claves de anulación por canal y de vinculación automática al iniciar** dependen del adaptador. Consulta [Canales compatibles con hilos](#thread-supporting-channels) más arriba.

Consulta la [Referencia de configuración](/es/gateway/configuration-reference) y
los [Comandos con barra](/es/tools/slash-commands) para conocer los detalles actuales de los adaptadores.

### Lista de permitidos

<ParamField path="agents.list[].subagents.allowAgents" type="string[]">
  Lista de ids. de agentes configurados que pueden seleccionarse mediante un `agentId` explícito (`["*"]` permite cualquier destino configurado). Valor predeterminado: solo el agente solicitante. Si estableces una lista y aun quieres que el solicitante se inicie a sí mismo con `agentId`, incluye el id. del solicitante en la lista.
</ParamField>
<ParamField path="agents.defaults.subagents.allowAgents" type="string[]">
  Lista de permitidos predeterminada de agentes de destino configurados que se usa cuando el agente solicitante no establece su propio `subagents.allowAgents`.
</ParamField>
<ParamField path="agents.defaults.subagents.requireAgentId" type="boolean" default="false">
  Bloquea las llamadas a `sessions_spawn` que omitan `agentId` (obliga a seleccionar explícitamente el perfil). Anulación por agente: `agents.list[].subagents.requireAgentId`.
</ParamField>
<ParamField path="agents.defaults.subagents.announceTimeoutMs" type="number" default="120000">
  Tiempo de espera por llamada para los intentos de entrega del anuncio `agent` del Gateway. Los valores son milisegundos enteros positivos y se limitan al máximo seguro del temporizador de la plataforma. Los reintentos transitorios pueden hacer que la espera total del anuncio supere un tiempo de espera configurado.
</ParamField>

Si la sesión solicitante está aislada, `sessions_spawn` rechaza los destinos
que se ejecutarían sin aislamiento.

### Descubrimiento

Usa `agents_list` para ver qué ids. de agente se permiten actualmente para
`sessions_spawn`. La respuesta incluye el modelo efectivo y los metadatos
integrados del entorno de ejecución de cada agente enumerado, para que los invocadores puedan distinguir entre OpenClaw, el
servidor de aplicaciones de Codex y otros entornos nativos configurados.

Las entradas de `allowAgents` deben apuntar a ids. de agentes configurados en `agents.list[]`.
`["*"]` significa cualquier agente de destino configurado, además del solicitante. Si se elimina
la configuración de un agente, pero su id. permanece en `allowAgents`, `sessions_spawn` rechaza ese id.
y `agents_list` lo omite. Ejecuta `openclaw doctor --fix` para limpiar las entradas
obsoletas de la lista de permitidos, o añade una entrada mínima en `agents.list[]` cuando el destino deba
seguir pudiendo iniciarse mientras hereda los valores predeterminados.

### Archivado automático

- Las sesiones de subagentes se archivan automáticamente después de `agents.defaults.subagents.archiveAfterMinutes` (valor predeterminado: `60`).
- El archivado usa `sessions.delete` y cambia el nombre de la transcripción a `*.deleted.<timestamp>` (en la misma carpeta).
- `cleanup: "delete"` archiva inmediatamente después del anuncio (aun así conserva la transcripción mediante un cambio de nombre).
- El archivado automático se realiza según el mejor esfuerzo; los temporizadores pendientes se pierden si el Gateway se reinicia.
- Los tiempos de espera configurados de las ejecuciones **no** archivan automáticamente; solo detienen la ejecución. La sesión permanece hasta el archivado automático.
- El archivado automático se aplica por igual a las sesiones de profundidad 1 y 2.
- La limpieza del navegador es independiente de la limpieza de archivos: se intenta cerrar las pestañas y los procesos del navegador rastreados cuando finaliza la ejecución, incluso si se conserva el registro de la transcripción/sesión.

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
        maxConcurrent: 8, // límite global del carril de concurrencia (valor predeterminado: 8)
        runTimeoutSeconds: 900, // tiempo de espera predeterminado para sessions_spawn (0 = sin tiempo de espera)
        announceTimeoutMs: 120000, // tiempo de espera por llamada para el anuncio del Gateway
      },
    },
  },
}
```

### Niveles de profundidad

| Profundidad | Formato de la clave de sesión               | Rol                                               | ¿Puede crear agentes?               |
| ----------- | -------------------------------------------- | ------------------------------------------------- | ----------------------------------- |
| 0           | `agent:<id>:main`                            | Agente principal                                  | Siempre                             |
| 1           | `agent:<id>:subagent:<uuid>`                 | Subagente (orquestador si se permite profundidad 2) | Solo si `maxSpawnDepth >= 2`        |
| 2           | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | Subsubagente (trabajador hoja)                     | Nunca                               |

### Cadena de anuncios

Los resultados ascienden por la cadena:

1. El trabajador de profundidad 2 finaliza → anuncia el resultado a su superior (orquestador de profundidad 1).
2. El orquestador de profundidad 1 recibe el anuncio, sintetiza los resultados y finaliza → anuncia el resultado al agente principal.
3. El agente principal recibe el anuncio y entrega el resultado al usuario.

Cada nivel solo ve los anuncios de sus hijos directos.

<Note>
**Orientación operativa:** inicie el trabajo secundario una sola vez y espere los eventos de finalización, en lugar de crear bucles de sondeo alrededor de `sessions_list`, `sessions_history`, `/subagents list` o comandos de suspensión de `exec`.
`sessions_list` y `/subagents list` mantienen las relaciones entre sesiones secundarias centradas en el trabajo activo: los hijos activos permanecen vinculados, los hijos finalizados siguen visibles durante un breve periodo reciente y los vínculos obsoletos con hijos que solo existen en el almacén se ignoran cuando vence su periodo de vigencia. Esto evita que los metadatos antiguos `spawnedBy` /
`parentSessionKey` resuciten hijos fantasma después de un reinicio. Si llega un evento de finalización de un hijo después de haber enviado la respuesta final, el seguimiento correcto es el token silencioso exacto
`NO_REPLY` / `no_reply`.
</Note>

### Política de herramientas según la profundidad

- El rol y el ámbito de control se escriben en los metadatos de la sesión al crearla. Esto evita que las claves de sesión planas o restauradas recuperen accidentalmente privilegios de orquestador.
- **Profundidad 1 (orquestador, cuando `maxSpawnDepth >= 2`):** obtiene `sessions_spawn`, `subagents`, `sessions_list` y `sessions_history` para poder crear hijos e inspeccionar su estado. Las demás herramientas de sesión o del sistema permanecen denegadas.
- **Profundidad 1 (hoja, cuando `maxSpawnDepth == 1`):** sin herramientas de sesión (comportamiento predeterminado actual).
- **Profundidad 2 (trabajador hoja):** sin herramientas de sesión; `sessions_spawn` siempre está denegada en la profundidad 2. No puede crear más hijos.

### Límite de creación por agente

Cada sesión de agente (en cualquier profundidad) puede tener como máximo `maxChildrenPerAgent`
(valor predeterminado: `5`) hijos activos a la vez. Esto evita una expansión descontrolada desde un único orquestador.

### Detención en cascada

Al detener un orquestador de profundidad 1, se detienen automáticamente todos sus hijos de profundidad 2:

- `/stop` en el chat principal detiene todos los agentes de profundidad 1 y propaga la detención a sus hijos de profundidad 2.

## Autenticación

La autenticación de los subagentes se resuelve mediante el **identificador del agente**, no mediante el tipo de sesión:

- La clave de sesión del subagente es `agent:<agentId>:subagent:<uuid>`.
- El almacén de autenticación se carga desde el `agentDir` de ese agente.
- Los perfiles de autenticación del agente principal se incorporan como **respaldo**; los perfiles del agente prevalecen sobre los perfiles principales cuando existen conflictos.

La combinación es acumulativa, por lo que los perfiles principales siempre están disponibles como alternativas de respaldo. Todavía no se admite una autenticación completamente aislada para cada agente.

## Anuncio

Los subagentes informan de los resultados mediante un paso de anuncio:

- El paso de anuncio se ejecuta dentro de la sesión del subagente (no en la sesión del solicitante).
- Si el subagente responde exactamente `ANNOUNCE_SKIP`, no se publica nada.
- Si el texto más reciente del asistente es el token silencioso exacto `NO_REPLY` / `no_reply`, se suprime la salida del anuncio aunque haya habido progreso visible anteriormente.

La entrega depende de la profundidad del solicitante:

- Las sesiones solicitantes de nivel superior usan una llamada de seguimiento a `agent` con entrega externa (`deliver=true`).
- Las sesiones anidadas de subagentes solicitantes reciben una inserción interna de seguimiento (`deliver=false`) para que el orquestador pueda sintetizar los resultados de los hijos dentro de la sesión.
- Si una sesión anidada de subagente solicitante ya no existe, OpenClaw recurre al solicitante de esa sesión cuando está disponible.

En las sesiones solicitantes de nivel superior, la entrega directa en modo de finalización resuelve primero cualquier ruta vinculada de conversación/hilo y cualquier anulación del enlace; después completa los campos ausentes de canal y destino con la ruta almacenada de la sesión solicitante. Así, las finalizaciones permanecen en el chat o tema correcto incluso cuando el origen de la finalización solo identifica el canal.

Al crear resultados de finalización anidados, la agregación de finalizaciones secundarias se limita a la ejecución actual del solicitante, lo que evita que las salidas obsoletas de hijos de ejecuciones anteriores se filtren en el anuncio actual. Las respuestas de anuncio conservan el enrutamiento de hilo o tema cuando está disponible en los adaptadores de canal.

### Contexto del anuncio

El contexto del anuncio se normaliza en un bloque de evento interno estable:

| Campo               | Origen                                                                                                      |
| ------------------- | ----------------------------------------------------------------------------------------------------------- |
| Origen              | `subagent` o `cron`                                                                                         |
| Identificadores de sesión | Clave/identificador de sesión del hijo                                                                  |
| Tipo                | Tipo de anuncio + etiqueta de la tarea                                                                      |
| Estado              | Derivado del resultado de ejecución (`ok`, `error`, `timeout` o `unknown`), **no** inferido del texto del modelo |
| Contenido del resultado | Texto visible más reciente del asistente secundario                                                     |
| Seguimiento         | Instrucción que describe cuándo responder y cuándo guardar silencio                                         |

Las ejecuciones fallidas y finalizadas informan del estado de error sin reproducir el texto de respuesta capturado. La salida de herramienta o `toolResult` no se promueve a texto del resultado secundario.

### Línea de estadísticas

Las cargas de anuncio incluyen al final una línea de estadísticas (incluso cuando están encapsuladas):

- Tiempo de ejecución (p. ej., `runtime 5m12s`).
- Uso de tokens (entrada/salida/total).
- Coste estimado cuando se han configurado los precios del modelo (`models.providers.*.models[].cost`).
- `sessionKey`, `sessionId` y la ruta de la transcripción para que el agente principal pueda obtener el historial mediante `sessions_history` o inspeccionar el archivo en el disco.

Los metadatos internos están destinados únicamente a la orquestación; las respuestas dirigidas al usuario deben reformularse con la voz habitual del asistente.

### Por qué conviene usar `sessions_history`

`sessions_history` es la vía de orquestación más segura para leer la transcripción de un hijo desde un turno del agente:

- Oculta texto similar a credenciales o tokens incluso cuando la ocultación general de registros está desactivada.
- Trunca los bloques de texto largos (4000 caracteres por bloque) y descarta las firmas de pensamiento, las cargas de reproducción del razonamiento y los datos de imágenes en línea.
- Aplica un límite de respuesta de 80 KB; las filas demasiado grandes se sustituyen por `[sessions_history omitted: message too large]`.
- Use `nextOffset` cuando esté presente para retroceder página por página por ventanas anteriores de la transcripción.
- `sessions_history` **no** elimina las etiquetas de razonamiento, la estructura auxiliar `<relevant-memories>` ni el XML de llamadas a herramientas del texto del mensaje: devuelve bloques de contenido estructurados cercanos al formato original de la transcripción, pero ocultados y limitados por tamaño. `/subagents log` aplica un saneamiento más intenso del texto (elimina etiquetas de razonamiento, estructuras auxiliares de memoria y XML de llamadas a herramientas) porque representa líneas de chat sin formato en lugar de bloques estructurados.
- La inspección de la transcripción original en el disco es la alternativa cuando necesita la transcripción completa byte por byte.

## Política de herramientas

Los subagentes utilizan primero el mismo perfil y la misma canalización de políticas de herramientas que el agente principal o de destino. Después, OpenClaw aplica la capa de restricciones de los subagentes.

Los subagentes siempre pierden `gateway`, `agents_list`, `session_status` y
`cron`, independientemente de su profundidad o rol (son herramientas interactivas o de nivel del sistema, o herramientas que debe coordinar el agente principal). Los subagentes hoja (comportamiento predeterminado de profundidad 1 y siempre en profundidad 2) pierden además `subagents`,
`sessions_list`, `sessions_history` y `sessions_spawn`. Los subagentes nunca reciben la herramienta `message`: se desactiva en el momento de la creación, no se filtra mediante esta lista de denegación; `sessions_send` también permanece denegada para que los subagentes solo se comuniquen mediante la cadena de anuncios.

Aquí, `sessions_history` también sigue siendo una vista de recuperación limitada y saneada; no es un volcado de la transcripción original.

Cuando `maxSpawnDepth >= 2`, los subagentes orquestadores de profundidad 1 reciben además `sessions_spawn`, `subagents`, `sessions_list` y
`sessions_history` para poder administrar a sus hijos.

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
        // si se configura la lista de permitidos, pasa a admitir únicamente
        // esos elementos (la denegación sigue prevaleciendo)
        // allow: ["read", "exec", "process"]
      },
    },
  },
}
```

`tools.subagents.tools.allow` es un filtro final que solo permite los elementos indicados. Puede restringir el conjunto de herramientas ya resuelto, pero no puede **volver a añadir** una herramienta eliminada por `tools.profile`. Por ejemplo, `tools.profile: "coding"` incluye
`web_search`/`web_fetch`, pero no la herramienta `browser`. Para permitir que los subagentes con perfil de programación usen automatización del navegador, añada el navegador en la fase del perfil:

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

Use `agents.list[].tools.alsoAllow: ["browser"]` por agente cuando solo un agente deba recibir automatización del navegador.

## Concurrencia

Los subagentes utilizan un carril de cola dedicado dentro del proceso:

- **Nombre del carril:** `subagent`
- **Concurrencia:** `agents.defaults.subagents.maxConcurrent` (valor predeterminado: `8`)

## Disponibilidad y recuperación

OpenClaw no considera la ausencia de `endedAt` una prueba permanente de que un subagente siga activo. Las ejecuciones sin finalizar que superan el periodo de obsolescencia (2 horas, o el tiempo de espera configurado para la ejecución más un breve periodo de gracia, lo que sea mayor) dejan de contabilizarse como activas o pendientes en `/subagents list`, en los resúmenes de estado, en el bloqueo de finalización de descendientes y en las comprobaciones de concurrencia por sesión.

Después de reiniciar el Gateway, se eliminan las ejecuciones restauradas obsoletas sin finalizar, salvo que su sesión secundaria esté marcada con `abortedLastRun: true`. Las ejecuciones interrumpidas por el reinicio permanecen registradas para el flujo de recuperación de subagentes huérfanos: las ejecuciones obsoletas finalizan sin reanudarse, mientras que las sesiones secundarias recientes reciben un mensaje de reanudación sintético antes de que se elimine el marcador de interrupción.

La recuperación automática tras un reinicio está limitada por sesión secundaria. Si el mismo subagente secundario se acepta repetidamente para la recuperación de huérfanos dentro del periodo de recaída rápida, OpenClaw guarda una marca de exclusión de recuperación en esa sesión y deja de reanudarla automáticamente en reinicios posteriores. Ejecute
`openclaw tasks maintenance --apply` para reconciliar el registro de la tarea, o
`openclaw doctor --fix` para borrar los indicadores obsoletos de recuperación interrumpida en las sesiones con marca de exclusión.

<Note>
Si la creación de un subagente falla con `PAIRING_REQUIRED` /
`scope-upgrade` del Gateway, compruebe el invocador RPC antes de modificar el estado de emparejamiento.
La coordinación interna de `sessions_spawn` se despacha dentro del proceso cuando el invocador ya se está ejecutando en el contexto de una solicitud del Gateway, por lo que no abre un WebSocket de local loopback ni depende de la base de ámbitos de dispositivos emparejados de la CLI. Los invocadores externos al proceso del Gateway siguen usando la alternativa WebSocket como `client.id: "gateway-client"` con `client.mode: "backend"`
mediante autenticación directa de local loopback con token compartido o contraseña. Los invocadores remotos, las rutas con `deviceIdentity` explícita, las rutas con token de dispositivo explícito y los clientes de navegador o Node siguen necesitando la aprobación normal del dispositivo para las ampliaciones de ámbito.
</Note>

## Detención

- Enviar `/stop` en el chat del solicitante interrumpe la sesión solicitante y detiene cualquier ejecución activa de subagentes creada desde ella, con propagación a los hijos anidados.

## Limitaciones

- El anuncio de subagente es de **mejor esfuerzo**. Si el Gateway se reinicia, se pierde el trabajo pendiente de «anunciar de vuelta».
- Los subagentes siguen compartiendo los recursos del mismo proceso del Gateway; considera `maxConcurrent` una válvula de seguridad.
- `sessions_spawn` siempre es no bloqueante: devuelve `{ status: "accepted", runId, childSessionKey }` inmediatamente.
- El contexto del subagente solo inyecta `AGENTS.md` y `TOOLS.md` (no `SOUL.md`, `IDENTITY.md`, `USER.md`, `MEMORY.md`, `HEARTBEAT.md` ni `BOOTSTRAP.md`). Los subagentes nativos de Codex siguen el mismo límite: `TOOLS.md` permanece en las instrucciones heredadas del hilo de Codex, mientras que los archivos de personalidad, identidad y usuario exclusivos del padre se inyectan como instrucciones de colaboración limitadas al turno para que los hijos no los clonen.
- La profundidad máxima de anidamiento es 5 (intervalo de `maxSpawnDepth`: 1-5). Se recomienda una profundidad de 2 para la mayoría de los casos de uso.
- `maxChildrenPerAgent` limita el número de hijos activos por sesión (valor predeterminado: `5`; intervalo: `1-20`).

## Contenido relacionado

- [Herramientas de sesión y cambios de estado](/es/concepts/session-tool)
- [Agentes ACP](/es/tools/acp-agents)
- [Envío de agentes](/es/tools/agent-send)
- [Tareas en segundo plano](/es/automation/tasks)
- [Herramientas de entorno aislado multiagente](/es/tools/multi-agent-sandbox-tools)

---
read_when:
    - Quieres trabajo en segundo plano o en paralelo a través del agente
    - Estás cambiando sessions_spawn o la política de herramientas de subagentes
    - Estás implementando o solucionando problemas de sesiones de subagentes vinculadas a hilos
sidebarTitle: Sub-agents
summary: Genera ejecuciones aisladas de agentes en segundo plano que anuncian los resultados de vuelta al chat solicitante
title: Subagentes
x-i18n:
    generated_at: "2026-06-28T00:13:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 144af6e020c86d171fe6c5734efaad229adaea35f8d1c1b07e37c549805c88ff
    source_path: tools/subagents.md
    workflow: 16
---

Los subagentes son ejecuciones de agente en segundo plano generadas desde una ejecución de agente existente.
Se ejecutan en su propia sesión (`agent:<agentId>:subagent:<uuid>`) y,
al finalizar, **anuncian** su resultado de vuelta al canal de chat
solicitante. Cada ejecución de subagente se registra como una
[tarea en segundo plano](/es/automation/tasks).

Objetivos principales:

- Paralelizar trabajo de "investigación / tarea larga / herramienta lenta" sin bloquear la ejecución principal.
- Mantener los subagentes aislados de forma predeterminada (separación de sesión + sandboxing opcional).
- Mantener la superficie de herramientas difícil de usar mal: los subagentes **no** reciben herramientas de sesión de forma predeterminada.
- Admitir profundidad de anidamiento configurable para patrones de orquestador.

<Note>
**Nota de costo:** cada subagente tiene su propio contexto y uso de tokens de
forma predeterminada. Para tareas pesadas o repetitivas, configura un modelo más económico para subagentes
y mantén tu agente principal en un modelo de mayor calidad. Configura mediante
`agents.defaults.subagents.model` o sobrescrituras por agente. Cuando un hijo
    realmente necesita la transcripción actual del solicitante, el agente puede solicitar
    `context: "fork"` en esa generación concreta. Las sesiones de subagente vinculadas a un hilo usan de forma predeterminada
    `context: "fork"` porque ramifican la conversación actual en un
    hilo de seguimiento.
</Note>

## Comando slash

Usa `/subagents` para inspeccionar ejecuciones de subagente para la **sesión actual**:

```text
/subagents list
/subagents log <id|#> [limit] [tools]
/subagents info <id|#>
```

`/subagents info` muestra metadatos de ejecución (estado, marcas de tiempo, id de sesión,
ruta de transcripción, limpieza). Usa `sessions_history` para una vista de recuerdo acotada
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

Los agentes inician subagentes en segundo plano con `sessions_spawn`. Las finalizaciones de subagente
vuelven como eventos internos de la sesión principal; el agente principal/solicitante decide
si se necesita una actualización visible para el usuario.

<AccordionGroup>
  <Accordion title="Non-blocking, push-based completion">
    - `sessions_spawn` no bloquea; devuelve un id de ejecución inmediatamente.
    - Al finalizar, el subagente informa de vuelta a la sesión principal/solicitante.
    - Los turnos de agente que necesitan resultados hijos deben llamar a `sessions_yield` después de generar el trabajo requerido. Eso termina el turno actual y permite que los eventos de finalización lleguen como el siguiente mensaje visible para el modelo.
    - La finalización se basa en push. Una vez generado, **no** sondees `/subagents list`, `sessions_list` ni `sessions_history` en un bucle solo para esperar a que termine; inspecciona el estado solo bajo demanda para visibilidad de depuración.
    - La salida del hijo es un informe/evidencia para que el agente solicitante lo sintetice. No es texto de instrucción escrito por el usuario y no puede sobrescribir políticas de sistema, desarrollador o usuario.
    - Al finalizar, OpenClaw intenta cerrar, en la medida de lo posible, las pestañas/procesos del navegador rastreados que haya abierto esa sesión de subagente antes de que continúe el flujo de limpieza del anuncio.

  </Accordion>
  <Accordion title="Completion delivery">
    - OpenClaw devuelve las finalizaciones a la sesión solicitante mediante un turno `agent` con una clave de idempotencia estable.
    - Si la ejecución solicitante sigue activa, OpenClaw primero intenta despertar/dirigir esa ejecución en lugar de iniciar una segunda ruta de respuesta visible.
    - Si no se puede despertar a un solicitante activo, OpenClaw recurre a una transferencia al agente solicitante con el mismo contexto de finalización en lugar de descartar el anuncio.
    - Una transferencia principal correcta completa la entrega del subagente incluso cuando el principal decide que no se necesita una actualización visible para el usuario.
    - Los subagentes nativos no reciben la herramienta de mensajes. Devuelven texto de asistente sin formato al agente principal/solicitante; las respuestas visibles para humanos pertenecen a la política normal de entrega del agente principal/solicitante.
    - Si no se puede usar la transferencia directa, se recurre al enrutamiento por cola.
    - Si el enrutamiento por cola sigue sin estar disponible, el anuncio se reintenta con un breve retroceso exponencial antes del abandono final.
    - La entrega de finalización conserva la ruta solicitante resuelta: las rutas de finalización vinculadas a hilo o vinculadas a conversación prevalecen cuando están disponibles; si el origen de finalización solo proporciona un canal, OpenClaw rellena el objetivo/cuenta faltante desde la ruta resuelta de la sesión solicitante (`lastChannel` / `lastTo` / `lastAccountId`) para que la entrega directa siga funcionando.

  </Accordion>
  <Accordion title="Completion handoff metadata">
    La transferencia de finalización a la sesión solicitante es contexto interno generado por el runtime
    (no texto escrito por el usuario) e incluye:

    - `Result` — el texto de respuesta `assistant` visible más reciente del hijo. La salida de Tool/toolResult no se promociona a resultados hijos. Las ejecuciones terminales fallidas no reutilizan texto de respuesta capturado.
    - `Status` — `completed; ready for parent review` / `failed` / `timed out` / `unknown`.
    - Estadísticas compactas de runtime/tokens.
    - Una instrucción de revisión que indica al agente solicitante que verifique el resultado antes de decidir si la tarea original está terminada.
    - Guía de seguimiento que indica al agente solicitante que continúe la tarea o registre un seguimiento cuando el resultado hijo deja más acciones pendientes.
    - Una instrucción de actualización final para la ruta sin más acciones, escrita con voz normal de asistente sin reenviar metadatos internos sin procesar.

  </Accordion>
  <Accordion title="Modes and ACP runtime">
    - `--model` y `--thinking` sobrescriben los valores predeterminados para esa ejecución específica.
    - Usa `info`/`log` para inspeccionar detalles y salida después de la finalización.
    - Para sesiones persistentes vinculadas a hilo, usa `sessions_spawn` con `thread: true` y `mode: "session"`.
    - Si el canal solicitante no admite vinculaciones de hilos, usa `mode: "run"` en lugar de reintentar combinaciones vinculadas a hilo imposibles.
    - Para sesiones de arnés ACP (Claude Code, Gemini CLI, OpenCode, o Codex ACP/acpx explícito), usa `sessions_spawn` con `runtime: "acp"` cuando la herramienta anuncie ese runtime. Consulta [Modelo de entrega ACP](/es/tools/acp-agents#delivery-model) al depurar finalizaciones o bucles de agente a agente. Cuando el plugin `codex` está habilitado, el control de chat/hilo de Codex debe preferir `/codex ...` sobre ACP, salvo que el usuario pida explícitamente ACP/acpx.
    - OpenClaw oculta `runtime: "acp"` hasta que ACP esté habilitado, el solicitante no esté en sandboxing y se cargue un plugin de backend como `acpx`. `runtime: "acp"` espera un id de arnés ACP externo, o una entrada `agents.list[]` con `runtime.type="acp"`; usa el runtime de subagente predeterminado para agentes de configuración normales de OpenClaw desde `agents_list`.

  </Accordion>
</AccordionGroup>

## Modos de contexto

Los subagentes nativos comienzan aislados salvo que el llamador pida explícitamente bifurcar
la transcripción actual.

| Modo       | Cuándo usarlo                                                                                                                         | Comportamiento                                                                          |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `isolated` | Investigación nueva, implementación independiente, trabajo con herramientas lentas o cualquier cosa que pueda describirse en el texto de la tarea | Crea una transcripción hija limpia. Este es el valor predeterminado y mantiene menor el uso de tokens. |
| `fork`     | Trabajo que depende de la conversación actual, resultados previos de herramientas o instrucciones matizadas ya presentes en la transcripción solicitante | Ramifica la transcripción solicitante en la sesión hija antes de que el hijo comience. |

Usa `fork` con moderación. Es para delegación sensible al contexto, no un
reemplazo de escribir un prompt de tarea claro.

## Herramienta: `sessions_spawn`

Inicia una ejecución de subagente con `deliver: false` en el carril global `subagent`,
luego ejecuta un paso de anuncio y publica la respuesta de anuncio en el canal de chat
solicitante.

La disponibilidad depende de la política de herramientas efectiva del llamador. Los perfiles `coding` y
`full` exponen `sessions_spawn` de forma predeterminada. El perfil `messaging`
no; agrega `tools.alsoAllow: ["sessions_spawn", "sessions_yield",
"subagents"]` o usa `tools.profile: "coding"` para agentes que deban delegar
trabajo. Las políticas de canal/grupo, proveedor, sandbox y allow/deny por agente aún pueden
quitar la herramienta después de la etapa de perfil. Usa `/tools` desde la misma
sesión para confirmar la lista efectiva de herramientas.

**Valores predeterminados:**

- **Modelo:** los subagentes nativos heredan el llamador salvo que configures `agents.defaults.subagents.model` (o `agents.list[].subagents.model` por agente). Las generaciones con runtime ACP usan el mismo modelo de subagente configurado cuando está presente; de lo contrario, el arnés ACP mantiene su propio valor predeterminado. Un `sessions_spawn.model` explícito sigue teniendo prioridad.
- **Thinking:** los subagentes nativos heredan el llamador salvo que configures `agents.defaults.subagents.thinking` (o `agents.list[].subagents.thinking` por agente). Las generaciones con runtime ACP también aplican `agents.defaults.models["provider/model"].params.thinking` para el modelo seleccionado. Un `sessions_spawn.thinking` explícito sigue teniendo prioridad.
- **Tiempo de espera de ejecución:** OpenClaw usa `agents.defaults.subagents.runTimeoutSeconds` cuando está configurado; de lo contrario, recurre a `0` (sin tiempo de espera). `sessions_spawn` no acepta sobrescrituras de tiempo de espera por llamada.
- **Entrega de tarea:** los subagentes nativos reciben la tarea delegada en su primer mensaje visible `[Subagent Task]`. El prompt de sistema del subagente lleva reglas de runtime y contexto de enrutamiento, no un duplicado oculto de la tarea.

Las generaciones de subagente nativas aceptadas incluyen los metadatos resueltos del modelo hijo en
el resultado de la herramienta: `resolvedModel` contiene la referencia de modelo aplicada y
`resolvedProvider` contiene el prefijo del proveedor cuando la referencia tiene uno.

### Modo de prompt de delegación

`agents.defaults.subagents.delegationMode` controla solo la guía del prompt; no cambia la política de herramientas ni impone delegación.

- `suggest` (valor predeterminado): mantiene el recordatorio estándar del prompt para usar subagentes en trabajos más grandes o lentos.
- `prefer`: indica al agente principal que se mantenga receptivo y delegue mediante `sessions_spawn` cualquier cosa más compleja que una respuesta directa.

Las sobrescrituras por agente usan `agents.list[].subagents.delegationMode`.

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

### Parámetros de herramienta

<ParamField path="task" type="string" required>
  La descripción de la tarea para el subagente.
</ParamField>
<ParamField path="taskName" type="string">
  Identificador estable opcional para identificar un hijo específico en salidas de estado posteriores. Debe coincidir con `[a-z][a-z0-9_-]{0,63}` y no puede ser un destino reservado como `last` o `all`.
</ParamField>
<ParamField path="label" type="string">
  Etiqueta opcional legible por humanos.
</ParamField>
<ParamField path="agentId" type="string">
  Genera bajo otro id de agente configurado cuando `subagents.allowAgents` lo permita.
</ParamField>
<ParamField path="cwd" type="string">
  Directorio de trabajo opcional de la tarea para la ejecución hija. Los subagentes nativos siguen cargando los archivos de arranque desde el espacio de trabajo del agente de destino; `cwd` solo cambia dónde las herramientas de runtime y los arneses de CLI hacen el trabajo delegado.
</ParamField>
<ParamField path="runtime" type='"subagent" | "acp"' default="subagent">
  `acp` es solo para arneses ACP externos (`claude`, `droid`, `gemini`, `opencode` o Codex ACP/acpx solicitado explícitamente) y para entradas `agents.list[]` cuyo `runtime.type` es `acp`.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  Solo ACP. Reanuda una sesión existente de arnés ACP cuando `runtime: "acp"`; se ignora para generaciones de subagentes nativos.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  Solo ACP. Transmite la salida de ejecución de ACP a la sesión padre cuando `runtime: "acp"`; omítelo para generaciones de subagentes nativos.
</ParamField>
<ParamField path="model" type="string">
  Sobrescribe el modelo del subagente. Los valores no válidos se omiten y el subagente se ejecuta con el modelo predeterminado, con una advertencia en el resultado de la herramienta.
</ParamField>
<ParamField path="thinking" type="string">
  Sobrescribe el nivel de razonamiento para la ejecución del subagente.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Cuando es `true`, solicita vinculación de hilo de canal para esta sesión de subagente.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  Si se omite `thread: true` y `mode`, el valor predeterminado pasa a ser `session`. `mode: "session"` requiere `thread: true`.
  Si la vinculación de hilo no está disponible para el canal solicitante, usa `mode: "run"` en su lugar.
</ParamField>
<ParamField path="cleanup" type='"delete" | "keep"' default="keep">
  `"delete"` archiva inmediatamente después del anuncio (aun así conserva la transcripción mediante cambio de nombre).
</ParamField>
<ParamField path="sandbox" type='"inherit" | "require"' default="inherit">
  `require` rechaza la generación a menos que el runtime hijo de destino esté en sandbox.
</ParamField>
<ParamField path="context" type='"isolated" | "fork"' default="isolated">
  `fork` ramifica la transcripción actual del solicitante en la sesión hija. Solo subagentes nativos. Las generaciones vinculadas a hilo usan `fork` de forma predeterminada; las generaciones sin hilo usan `isolated` de forma predeterminada.
</ParamField>

<Warning>
`sessions_spawn` **no** acepta parámetros de entrega por canal (`target`,
`channel`, `to`, `threadId`, `replyTo`, `transport`). Los subagentes nativos informan
su último turno de asistente de vuelta al solicitante; la entrega externa permanece con
el agente padre/solicitante.
</Warning>

### Nombres de tareas y destinos

`taskName` es un identificador orientado al modelo para orquestación, no una clave de sesión.
Úsalo para nombres estables de hijos como `review_subagents`,
`linux_validation` o `docs_update` cuando un coordinador pueda necesitar inspeccionar
ese hijo más tarde.

La resolución de destinos acepta coincidencias exactas de `taskName` y prefijos
no ambiguos. La coincidencia se limita a la misma ventana de destinos activos/recientes
que usan los destinos numerados de `/subagents`, por lo que un hijo completado obsoleto no vuelve
ambiguo un identificador reutilizado. Si dos hijos activos o recientes comparten el mismo
`taskName`, el destino es ambiguo; usa el índice de lista, la clave de sesión o
el id de ejecución en su lugar.

Los destinos reservados `last` y `all` no son valores válidos de `taskName`
porque ya tienen significados de control.

## Herramienta: `sessions_yield`

Finaliza el turno actual del modelo y espera a que eventos del runtime, principalmente
eventos de finalización de subagentes, lleguen como el siguiente mensaje. Úsalo después de
generar trabajo hijo requerido cuando el solicitante no pueda producir una respuesta
final hasta que lleguen esas finalizaciones.

`sessions_yield` es la primitiva de espera. No la sustituyas por bucles de sondeo
sobre `subagents`, `sessions_list`, `sessions_history`, `sleep` de shell
o sondeo de procesos solo para detectar la finalización de hijos.

Usa `sessions_yield` solo cuando la lista efectiva de herramientas de la sesión lo incluya.
Algunos perfiles de herramientas mínimos o personalizados pueden exponer `sessions_spawn` y
`subagents` sin exponer `sessions_yield`; en ese caso, no inventes
un bucle de sondeo solo para esperar la finalización.

Cuando existen hijos activos, OpenClaw inyecta un bloque compacto de prompt generado por el runtime
`Active Subagents` en los turnos normales para que el solicitante pueda ver
las sesiones hijas actuales, ids de ejecución, estados, etiquetas, tareas y
alias de `taskName` sin sondeo. Los campos de tarea y etiqueta de ese
bloque se citan como datos, no como instrucciones, porque pueden originarse
en argumentos de generación proporcionados por el usuario/modelo.

## Herramienta: `subagents`

Lista ejecuciones de subagentes generadas propiedad de la sesión solicitante. Está limitada
al solicitante actual; un hijo solo puede ver sus propios hijos controlados.

Usa `subagents` para estado bajo demanda y depuración. Usa `sessions_yield` para
esperar eventos de finalización.

## Sesiones vinculadas a hilo

Cuando las vinculaciones de hilo están habilitadas para un canal, un subagente puede permanecer vinculado
a un hilo para que los mensajes de usuario de seguimiento en ese hilo sigan enrutándose a la
misma sesión de subagente.

### Canales que admiten hilos

Cualquier canal con un adaptador de vinculación de sesión puede admitir sesiones persistentes
de subagentes vinculadas a hilo (`sessions_spawn` con `thread: true`).
Los adaptadores incluidos actualmente incluyen hilos de Discord, hilos de Matrix,
temas de foro de Telegram y vinculaciones de conversación actual para Feishu.
Usa las claves de configuración `threadBindings` por canal para la habilitación,
los tiempos de espera y `spawnSessions`.

### Flujo rápido

<Steps>
  <Step title="Generar">
    `sessions_spawn` con `thread: true` (y opcionalmente `mode: "session"`).
  </Step>
  <Step title="Vincular">
    OpenClaw crea o vincula un hilo a ese destino de sesión en el canal activo.
  </Step>
  <Step title="Enrutar seguimientos">
    Las respuestas y los mensajes de seguimiento en ese hilo se enrutan a la sesión vinculada.
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

| Comando            | Efecto                                                                |
| ------------------ | --------------------------------------------------------------------- |
| `/focus <target>`  | Vincula el hilo actual (o crea uno) a un destino de subagente/sesión |
| `/unfocus`         | Elimina la vinculación del hilo vinculado actual                       |
| `/agents`          | Lista ejecuciones activas y estado de vinculación (`thread:<id>` o `unbound`)       |
| `/session idle`    | Inspecciona/actualiza el desenfoque automático por inactividad (solo hilos vinculados enfocados)         |
| `/session max-age` | Inspecciona/actualiza el límite estricto (solo hilos vinculados enfocados)                  |

### Interruptores de configuración

- **Valor predeterminado global:** `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
- **Claves de sobrescritura de canal y autovinculación de generación** son específicas del adaptador. Consulta [Canales que admiten hilos](#thread-supporting-channels) arriba.

Consulta [Referencia de configuración](/es/gateway/configuration-reference) y
[Comandos de barra](/es/tools/slash-commands) para los detalles actuales de adaptadores.

### Lista de permitidos

<ParamField path="agents.list[].subagents.allowAgents" type="string[]">
  Lista de ids de agentes configurados que pueden ser destino mediante `agentId` explícito (`["*"]` permite cualquier destino configurado). Predeterminado: solo el agente solicitante. Si estableces una lista y aun así quieres que el solicitante se genere a sí mismo con `agentId`, incluye el id del solicitante en la lista.
</ParamField>
<ParamField path="agents.defaults.subagents.allowAgents" type="string[]">
  Lista de permitidos predeterminada de agentes de destino configurados que se usa cuando el agente solicitante no establece su propio `subagents.allowAgents`.
</ParamField>
<ParamField path="agents.defaults.subagents.requireAgentId" type="boolean" default="false">
  Bloquea llamadas `sessions_spawn` que omiten `agentId` (fuerza selección explícita de perfil). Sobrescritura por agente: `agents.list[].subagents.requireAgentId`.
</ParamField>
<ParamField path="agents.defaults.subagents.announceTimeoutMs" type="number" default="120000">
  Tiempo de espera por llamada para intentos de entrega de anuncio `agent` del Gateway. Los valores son milisegundos enteros positivos y se limitan al máximo de temporizador seguro de la plataforma. Los reintentos transitorios pueden hacer que la espera total del anuncio sea más larga que un tiempo de espera configurado.
</ParamField>

Si la sesión solicitante está en sandbox, `sessions_spawn` rechaza destinos
que se ejecutarían sin sandbox.

### Detección

Usa `agents_list` para ver qué ids de agente están permitidos actualmente para
`sessions_spawn`. La respuesta incluye el modelo efectivo de cada agente listado
y metadatos de runtime incrustados para que los llamadores puedan distinguir OpenClaw, el
servidor de aplicación Codex y otros runtimes nativos configurados.

Las entradas `allowAgents` deben apuntar a ids de agente configurados en `agents.list[]`.
`["*"]` significa cualquier agente de destino configurado más el solicitante. Si se elimina una configuración de agente
pero su id permanece en `allowAgents`, `sessions_spawn` rechaza ese id
y `agents_list` lo omite. Ejecuta `openclaw doctor --fix` para limpiar entradas obsoletas
de la lista de permitidos, o agrega una entrada mínima `agents.list[]` cuando el destino deba
seguir pudiendo generarse mientras hereda valores predeterminados.

### Archivado automático

- Las sesiones de subagentes se archivan automáticamente después de `agents.defaults.subagents.archiveAfterMinutes` (predeterminado `60`).
- El archivado usa `sessions.delete` y cambia el nombre de la transcripción a `*.deleted.<timestamp>` (misma carpeta).
- `cleanup: "delete"` archiva inmediatamente después del anuncio (aun así conserva la transcripción mediante cambio de nombre).
- El archivado automático es de mejor esfuerzo; los temporizadores pendientes se pierden si el gateway se reinicia.
- Los tiempos de espera de ejecución configurados **no** archivan automáticamente; solo detienen la ejecución. La sesión permanece hasta el archivado automático.
- El archivado automático se aplica por igual a sesiones de profundidad 1 y profundidad 2.
- La limpieza del navegador es independiente de la limpieza de archivado: las pestañas/procesos de navegador rastreados se cierran con mejor esfuerzo cuando termina la ejecución, incluso si se conserva el registro de transcripción/sesión.

## Subagentes anidados

De forma predeterminada, los subagentes no pueden generar sus propios subagentes
(`maxSpawnDepth: 1`). Establece `maxSpawnDepth: 2` para habilitar un nivel de
anidamiento: el **patrón orquestador**: principal → subagente orquestador →
subsubagentes trabajadores.

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxSpawnDepth: 2, // allow sub-agents to spawn children (default: 1)
        maxChildrenPerAgent: 5, // max active children per agent session (default: 5)
        maxConcurrent: 8, // global concurrency lane cap (default: 8)
        runTimeoutSeconds: 900, // default timeout for sessions_spawn (0 = no timeout)
        announceTimeoutMs: 120000, // per-call gateway announce timeout
      },
    },
  },
}
```

### Niveles de profundidad

| Profundidad | Forma de clave de sesión                     | Rol                                          | ¿Puede generar?              |
| ----- | -------------------------------------------- | --------------------------------------------- | ---------------------------- |
| 0     | `agent:<id>:main`                            | Agente principal                                    | Siempre                       |
| 1     | `agent:<id>:subagent:<uuid>`                 | Subagente (orquestador cuando se permite profundidad 2) | Solo si `maxSpawnDepth >= 2` |
| 2     | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | Subsubagente (trabajador hoja)                   | Nunca                        |

### Cadena de anuncio

Los resultados fluyen de vuelta hacia arriba por la cadena:

1. El trabajador de profundidad 2 termina → lo anuncia a su padre (orquestador de profundidad 1).
2. El orquestador de profundidad 1 recibe el anuncio, sintetiza los resultados, termina → lo anuncia al principal.
3. El agente principal recibe el anuncio y lo entrega al usuario.

Cada nivel solo ve anuncios de sus hijos directos.

<Note>
**Guía operativa:** inicia el trabajo hijo una vez y espera los eventos
de finalización en lugar de crear bucles de sondeo alrededor de `sessions_list`,
`sessions_history`, `/subagents list` o comandos de suspensión `exec`.
`sessions_list` y `/subagents list` mantienen las relaciones de sesiones hijas
centradas en el trabajo activo: los hijos activos permanecen adjuntos, los hijos finalizados siguen
visibles durante una breve ventana reciente, y los enlaces de hijos obsoletos que solo están en el almacén se
ignoran después de su ventana de vigencia. Esto evita que metadatos antiguos de `spawnedBy` /
`parentSessionKey` resuciten hijos fantasma después de un
reinicio. Si llega un evento de finalización de un hijo después de que ya enviaste la
respuesta final, el seguimiento correcto es el token silencioso exacto
`NO_REPLY` / `no_reply`.
</Note>

### Política de herramientas por profundidad

- El rol y el ámbito de control se escriben en los metadatos de sesión en el momento de la generación. Eso evita que claves de sesión planas o restauradas recuperen accidentalmente privilegios de orquestador.
- **Profundidad 1 (orquestador, cuando `maxSpawnDepth >= 2`):** obtiene `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history` para que pueda generar hijos e inspeccionar su estado. Otras herramientas de sesión/sistema siguen denegadas.
- **Profundidad 1 (hoja, cuando `maxSpawnDepth == 1`):** sin herramientas de sesión (comportamiento predeterminado actual).
- **Profundidad 2 (trabajador hoja):** sin herramientas de sesión: `sessions_spawn` siempre se deniega en profundidad 2. No puede generar más hijos.

### Límite de generación por agente

Cada sesión de agente (a cualquier profundidad) puede tener como máximo `maxChildrenPerAgent`
(predeterminado `5`) hijos activos a la vez. Esto evita una expansión descontrolada
desde un único orquestador.

### Detención en cascada

Detener un orquestador de profundidad 1 detiene automáticamente todos sus hijos de profundidad 2:

- `/stop` en el chat principal detiene todos los agentes de profundidad 1 y se propaga a sus hijos de profundidad 2.

## Autenticación

La autenticación de subagentes se resuelve por **id de agente**, no por tipo de sesión:

- La clave de sesión del subagente es `agent:<agentId>:subagent:<uuid>`.
- El almacén de autenticación se carga desde el `agentDir` de ese agente.
- Los perfiles de autenticación del agente principal se fusionan como **respaldo**; los perfiles de agente reemplazan a los perfiles principales en caso de conflicto.

La fusión es aditiva, por lo que los perfiles principales siempre están disponibles como
respaldos. La autenticación totalmente aislada por agente aún no está admitida.

## Anuncio

Los subagentes informan mediante un paso de anuncio:

- El paso de anuncio se ejecuta dentro de la sesión del subagente (no en la sesión solicitante).
- Si el subagente responde exactamente `ANNOUNCE_SKIP`, no se publica nada.
- Si el último texto del asistente es el token silencioso exacto `NO_REPLY` / `no_reply`, la salida del anuncio se suprime incluso si antes hubo progreso visible.

La entrega depende de la profundidad del solicitante:

- Las sesiones solicitantes de nivel superior usan una llamada de seguimiento `agent` con entrega externa (`deliver=true`).
- Las sesiones de subagente solicitante anidadas reciben una inyección interna de seguimiento (`deliver=false`) para que el orquestador pueda sintetizar los resultados de los hijos dentro de la sesión.
- Si una sesión de subagente solicitante anidada ya no existe, OpenClaw recurre al solicitante de esa sesión cuando está disponible.

Para las sesiones solicitantes de nivel superior, la entrega directa en modo de finalización primero
resuelve cualquier ruta de conversación/hilo vinculada y anulación de enlace, y luego rellena
los campos de destino de canal faltantes desde la ruta almacenada de la sesión solicitante.
Eso mantiene las finalizaciones en el chat/tema correcto incluso cuando el origen de la finalización
solo identifica el canal.

La agregación de finalizaciones de hijos se limita a la ejecución actual del solicitante al
crear hallazgos de finalización anidados, lo que impide que salidas de hijos obsoletas de ejecuciones
anteriores se filtren en el anuncio actual. Las respuestas de anuncio conservan
el enrutamiento de hilo/tema cuando está disponible en los adaptadores de canal.

### Contexto del anuncio

El contexto del anuncio se normaliza a un bloque de evento interno estable:

| Campo          | Origen                                                                                                        |
| -------------- | ------------------------------------------------------------------------------------------------------------- |
| Origen         | `subagent` o `cron`                                                                                          |
| Ids de sesión  | Clave/id de sesión hija                                                                                       |
| Tipo           | Tipo de anuncio + etiqueta de tarea                                                                           |
| Estado         | Derivado del resultado de ejecución (`success`, `error`, `timeout` o `unknown`): **no** inferido del texto del modelo |
| Contenido del resultado | Último texto visible del asistente del hijo                                                           |
| Seguimiento    | Instrucción que describe cuándo responder frente a permanecer en silencio                                      |

Las ejecuciones terminales fallidas informan el estado de fallo sin reproducir el
texto de respuesta capturado. La salida tool/toolResult no se promociona a texto de resultado del hijo.

### Línea de estadísticas

Las cargas útiles de anuncio incluyen una línea de estadísticas al final (incluso cuando están envueltas):

- Tiempo de ejecución (por ejemplo, `runtime 5m12s`).
- Uso de tokens (entrada/salida/total).
- Costo estimado cuando el precio del modelo está configurado (`models.providers.*.models[].cost`).
- `sessionKey`, `sessionId` y ruta de transcripción para que el agente principal pueda obtener el historial mediante `sessions_history` o inspeccionar el archivo en disco.

Los metadatos internos son solo para orquestación; las respuestas orientadas al usuario
deben reescribirse con una voz normal de asistente.

### Por qué preferir `sessions_history`

`sessions_history` es la ruta de orquestación más segura:

- El recuerdo del asistente se normaliza primero: se eliminan las etiquetas de pensamiento; se elimina el andamiaje `<relevant-memories>` / `<relevant_memories>`; se eliminan los bloques de carga XML en texto sin formato de llamadas a herramientas (`<tool_call>`, `<function_call>`, `<tool_calls>`, `<function_calls>`), incluidas las cargas truncadas que nunca cierran limpiamente; se eliminan el andamiaje degradado de llamadas/resultados de herramientas y los marcadores de contexto histórico; se eliminan los tokens de control de modelo filtrados (`<|assistant|>`, otros ASCII `<|...|>`, de ancho completo `<｜...｜>`); se elimina el XML malformado de llamadas a herramientas de MiniMax.
- El texto similar a credenciales/tokens se redacta.
- Los bloques largos pueden truncarse.
- Los historiales muy grandes pueden descartar filas antiguas o reemplazar una fila demasiado grande por `[sessions_history omitted: message too large]`.
- Usa `nextOffset` cuando esté presente para retroceder por páginas a través de ventanas de transcripción más antiguas.
- La inspección sin procesar de la transcripción en disco es la alternativa cuando necesitas la transcripción completa byte por byte.

## Política de herramientas

Los subagentes usan primero el mismo perfil y canalización de políticas de herramientas que el agente padre o
de destino. Después de eso, OpenClaw aplica la capa de restricción de subagentes.

Sin un `tools.profile` restrictivo, los subagentes obtienen **todas las herramientas excepto la
herramienta de mensajes, las herramientas de sesión y las herramientas del sistema**:

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`
- `message`

`sessions_history` sigue siendo también aquí una vista de recuerdo acotada y saneada; no
es un volcado de transcripción sin procesar.

Cuando `maxSpawnDepth >= 2`, los subagentes orquestadores de profundidad 1 además
reciben `sessions_spawn`, `subagents`, `sessions_list` y
`sessions_history` para que puedan gestionar sus hijos.

### Sobrescribir mediante configuración

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
        // deny gana
        deny: ["gateway", "cron"],
        // si allow está definido, se convierte en solo permitidos (deny sigue ganando)
        // allow: ["read", "exec", "process"]
      },
    },
  },
}
```

`tools.subagents.tools.allow` es un filtro final de solo permitidos. Puede restringir
el conjunto de herramientas ya resuelto, pero no puede **volver a añadir** una herramienta eliminada
por `tools.profile`. Por ejemplo, `tools.profile: "coding"` incluye
`web_search`/`web_fetch`, pero no la herramienta `browser`. Para permitir que
los subagentes con perfil de coding usen automatización del navegador, añade browser en la
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

Los subagentes usan un carril de cola en proceso dedicado:

- **Nombre del carril:** `subagent`
- **Concurrencia:** `agents.defaults.subagents.maxConcurrent` (predeterminado `8`)

## Vivacidad y recuperación

OpenClaw no trata la ausencia de `endedAt` como prueba permanente de que un
subagente sigue vivo. Las ejecuciones sin finalizar más antiguas que la ventana de ejecuciones obsoletas
dejan de contar como activas/pendientes en `/subagents list`, resúmenes de estado,
bloqueo de finalización de descendientes y comprobaciones de concurrencia por sesión.

Después de reiniciar el gateway, las ejecuciones restauradas obsoletas y sin finalizar se podan, a menos que
su sesión hija esté marcada como `abortedLastRun: true`. Esas
sesiones hijas abortadas por reinicio siguen siendo recuperables mediante el flujo de recuperación de huérfanos
de subagentes, que envía un mensaje sintético de reanudación antes de
limpiar el marcador de abortado.

La recuperación automática tras reinicio está acotada por sesión hija. Si el mismo
subagente hijo se acepta para recuperación de huérfanos repetidamente dentro de la
ventana rápida de reencallamiento, OpenClaw persiste una lápida de recuperación en esa
sesión y deja de reanudarlo automáticamente en reinicios posteriores. Ejecuta
`openclaw tasks maintenance --apply` para conciliar el registro de tareas, o
`openclaw doctor --fix` para limpiar indicadores obsoletos de recuperación abortada en
sesiones con lápida.

<Note>
Si la creación de un subagente falla con Gateway `PAIRING_REQUIRED` /
`scope-upgrade`, revisa el llamador RPC antes de editar el estado de emparejamiento.
La coordinación interna de `sessions_spawn` se despacha en proceso cuando el
llamador ya se está ejecutando dentro del contexto de solicitud del gateway, por lo que
no abre un WebSocket de loopback ni depende de la línea base de alcance de dispositivo emparejado de la CLI.
Los llamadores fuera del proceso del gateway siguen usando la alternativa WebSocket
como `client.id: "gateway-client"` con `client.mode: "backend"`
sobre autenticación directa de loopback con token/contraseña compartidos. Los llamadores remotos, `deviceIdentity`
explícito, rutas explícitas de token de dispositivo y clientes browser/node
siguen necesitando aprobación normal del dispositivo para las actualizaciones de alcance.
</Note>

## Detención

- Enviar `/stop` en el chat del solicitante aborta la sesión del solicitante y detiene cualquier ejecución activa de subagentes creada desde ella, con cascada hacia hijos anidados.

## Limitaciones

- El anuncio de subagente es **de mejor esfuerzo**. Si el gateway se reinicia, se pierde el trabajo pendiente de "anunciar de vuelta".
- Los subagentes siguen compartiendo los mismos recursos del proceso del gateway; trata `maxConcurrent` como una válvula de seguridad.
- `sessions_spawn` siempre es no bloqueante: devuelve `{ status: "accepted", runId, childSessionKey }` de inmediato.
- El contexto de subagente solo inyecta `AGENTS.md` y `TOOLS.md` (no `SOUL.md`, `IDENTITY.md`, `USER.md`, `MEMORY.md`, `HEARTBEAT.md` ni `BOOTSTRAP.md`). Los subagentes nativos de Codex siguen el mismo límite: `TOOLS.md` permanece en las instrucciones heredadas del hilo de Codex, mientras que los archivos de persona, identidad y usuario solo del padre se inyectan como instrucciones de colaboración con alcance de turno para que los hijos no los clonen.
- La profundidad máxima de anidamiento es 5 (rango de `maxSpawnDepth`: 1-5). Se recomienda profundidad 2 para la mayoría de los casos de uso.
- `maxChildrenPerAgent` limita los hijos activos por sesión (predeterminado `5`, rango `1-20`).

## Relacionado

- [Agentes ACP](/es/tools/acp-agents)
- [Enviar al agente](/es/tools/agent-send)
- [Tareas en segundo plano](/es/automation/tasks)
- [Herramientas de sandbox multiagente](/es/tools/multi-agent-sandbox-tools)

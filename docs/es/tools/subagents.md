---
read_when:
    - Quieres trabajo en segundo plano o en paralelo mediante el agente
    - Estás cambiando la política de la herramienta sessions_spawn o de subagente
    - Estás implementando o solucionando problemas de sesiones de subagentes vinculadas a hilos
sidebarTitle: Sub-agents
summary: Genera ejecuciones de agentes en segundo plano aisladas que anuncian los resultados de vuelta al chat del solicitante
title: Subagentes
x-i18n:
    generated_at: "2026-07-05T11:49:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 937ff806dc0dc5f5de5e80b03835131d66c37762cd2be215b17d622720183379
    source_path: tools/subagents.md
    workflow: 16
---

Los subagentes son ejecuciones de agentes en segundo plano generadas desde una ejecución de agente existente.
Cada uno se ejecuta en su propia sesión (`agent:<agentId>:subagent:<uuid>`) y,
cuando termina, **anuncia** su resultado de vuelta al canal de chat solicitante.
Cada ejecución de subagente se registra como una [tarea en segundo plano](/es/automation/tasks).

Objetivos:

- Paralelizar investigación, tareas largas y trabajo lento con herramientas sin bloquear la ejecución principal.
- Mantener los subagentes aislados de forma predeterminada (separación de sesiones, aislamiento opcional).
- Mantener la superficie de herramientas difícil de usar incorrectamente: los subagentes **no** reciben herramientas de sesión ni de mensajes de forma predeterminada.
- Admitir profundidad de anidamiento configurable para patrones de orquestador.

<Note>
**Nota de coste:** cada subagente tiene su propio contexto y uso de tokens de
forma predeterminada. Para tareas pesadas o repetitivas, configura un modelo más barato para los subagentes
y mantén tu agente principal en un modelo de mayor calidad mediante
`agents.defaults.subagents.model` o anulaciones por agente. Cuando un hijo
realmente necesita la transcripción actual del solicitante, genéralo con
`context: "fork"`. Las sesiones de subagente vinculadas a hilos usan de forma predeterminada
`context: "fork"` porque ramifican la conversación actual en un
hilo de seguimiento.
</Note>

## Comando de barra

`/subagents` inspecciona ejecuciones de subagentes para la **sesión actual**:

```text
/subagents list
/subagents log <id|#> [limit] [tools]
/subagents info <id|#>
```

`/subagents info` muestra metadatos de ejecución (estado, marcas de tiempo, id de sesión,
ruta de transcripción, limpieza). `/subagents log` imprime turnos de chat recientes para una
ejecución; añade el token `tools` para incluir mensajes de llamadas/resultados de herramientas (omitidos
de forma predeterminada). Usa `sessions_history` para una vista de recuerdo acotada y filtrada por seguridad
desde dentro de un turno de agente, o inspecciona la ruta de transcripción en disco para
la transcripción completa sin procesar.

### Controles de vinculación de hilos

Estos comandos funcionan en canales con vinculaciones de hilo persistentes. Consulta
[Canales compatibles con hilos](#thread-supporting-channels) abajo.

```text
/focus <subagent-label|session-key|session-id|session-label>
/unfocus
/agents
/session idle <duration|off>
/session max-age <duration|off>
```

### Comportamiento de generación

Los agentes inician subagentes en segundo plano con la herramienta `sessions_spawn`.
Las finalizaciones vuelven como eventos internos de la sesión principal; el agente principal/solicitante
decide si hace falta una actualización visible para el usuario.

<AccordionGroup>
  <Accordion title="Finalización no bloqueante basada en inserción">
    - `sessions_spawn` no bloquea; devuelve un id de ejecución inmediatamente.
    - Al completarse, el subagente informa de vuelta a la sesión principal/solicitante.
    - Los turnos de agente que necesitan resultados de hijos deben llamar a `sessions_yield` después de generar el trabajo necesario. Eso termina el turno actual y permite que el evento de finalización llegue como el siguiente mensaje visible para el modelo.
    - La finalización se basa en inserción. Una vez generado, **no** sondees `/subagents list`, `sessions_list` ni `sessions_history` en un bucle solo para esperar a que termine; comprueba el estado bajo demanda solo al depurar.
    - La salida del hijo es un informe/evidencia para que el agente solicitante sintetice. No es texto de instrucción escrito por el usuario y no puede anular políticas del sistema, de desarrollador ni del usuario.
    - Al completarse, OpenClaw cierra con el mejor esfuerzo las pestañas/procesos del navegador registrados abiertos por esa sesión de subagente antes de que continúe el flujo de limpieza del anuncio.

  </Accordion>
  <Accordion title="Entrega de finalización">
    - OpenClaw devuelve las finalizaciones a la sesión solicitante mediante un turno `agent` con una clave de idempotencia estable.
    - Si la ejecución solicitante sigue activa, OpenClaw primero intenta despertar/dirigir esa ejecución en lugar de iniciar una segunda ruta de respuesta visible.
    - Si no se puede despertar a un solicitante activo, OpenClaw recurre a una transferencia al agente solicitante con el mismo contexto de finalización en lugar de descartar el anuncio.
    - Una transferencia principal correcta completa la entrega del subagente incluso cuando el principal decide que no hace falta una actualización visible para el usuario.
    - Los subagentes nativos no reciben la herramienta de mensajes. Devuelven texto simple de asistente al agente principal/solicitante; las respuestas visibles para humanos siguen siendo propiedad de la política normal de entrega del agente principal/solicitante.
    - Si no se puede usar la transferencia directa, la entrega recurre al enrutamiento de cola y luego a un breve reintento del anuncio con retroceso exponencial antes del abandono final.
    - La entrega conserva la ruta solicitante resuelta: las rutas de finalización vinculadas a hilos o conversaciones tienen prioridad cuando están disponibles. Si el origen de la finalización solo proporciona un canal, OpenClaw completa el destino/cuenta faltante desde la ruta resuelta de la sesión solicitante (`lastChannel` / `lastTo` / `lastAccountId`) para que la entrega directa siga funcionando.

  </Accordion>
  <Accordion title="Metadatos de transferencia de finalización">
    La transferencia de finalización a la sesión solicitante es contexto interno
    generado por el runtime (no texto escrito por el usuario) e incluye:

    - `Result` — el texto de la última respuesta visible de `assistant` del hijo. La salida de herramienta/toolResult no se promociona a resultados del hijo. Las ejecuciones terminales fallidas no reutilizan texto de respuesta capturado.
    - `Status` — `completed; ready for parent review` / `failed` / `timed out` / `unknown`.
    - Estadísticas compactas de runtime/tokens.
    - Una instrucción de revisión que indica al agente solicitante que verifique el resultado antes de decidir si la tarea original está terminada.
    - Guía de seguimiento que indica al agente solicitante que continúe la tarea o registre un seguimiento cuando el resultado del hijo deje más acciones.
    - Una instrucción de actualización final para la ruta sin más acciones, escrita con voz normal de asistente sin reenviar metadatos internos sin procesar.

  </Accordion>
  <Accordion title="Modos y runtime ACP">
    - `--model` y `--thinking` anulan los valores predeterminados para esa ejecución específica.
    - Usa `info`/`log` para inspeccionar detalles y salida después de la finalización.
    - Para sesiones persistentes vinculadas a hilos, usa `sessions_spawn` con `thread: true` y `mode: "session"`.
    - Si el canal solicitante no admite vinculaciones de hilo, usa `mode: "run"` en lugar de reintentar una combinación vinculada a hilos imposible.
    - Para sesiones de arnés ACP (Claude Code, Gemini CLI, OpenCode o Codex ACP/acpx explícito), usa `sessions_spawn` con `runtime: "acp"` cuando la herramienta anuncie ese runtime. Consulta el [modelo de entrega ACP](/es/tools/acp-agents#delivery-model) al depurar finalizaciones o bucles de agente a agente. Cuando el Plugin `codex` está habilitado, el control de chat/hilo de Codex debe preferir `/codex ...` sobre ACP salvo que el usuario pida explícitamente ACP/acpx.
    - OpenClaw oculta `runtime: "acp"` hasta que ACP esté habilitado, el solicitante no esté en aislamiento y se cargue un Plugin de backend como `acpx`. `runtime: "acp"` espera un id de arnés ACP externo, o una entrada `agents.list[]` con `runtime.type="acp"`; usa el runtime de subagente predeterminado para agentes de configuración normales de OpenClaw desde `agents_list`.

  </Accordion>
</AccordionGroup>

## Modos de contexto

Los subagentes nativos comienzan aislados salvo que el llamador pida explícitamente bifurcar
la transcripción actual.

| Modo       | Cuándo usarlo                                                                                                                         | Comportamiento                                                                          |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `isolated` | Investigación nueva, implementación independiente, trabajo lento con herramientas o cualquier cosa que pueda resumirse en el texto de la tarea                           | Crea una transcripción hija limpia. Este es el valor predeterminado y mantiene menor el uso de tokens.  |
| `fork`     | Trabajo que depende de la conversación actual, resultados previos de herramientas o instrucciones matizadas ya presentes en la transcripción solicitante | Ramifica la transcripción solicitante en la sesión hija antes de que el hijo comience. |

Usa `fork` con moderación. Es para delegación sensible al contexto, no un
sustituto de escribir una instrucción de tarea clara.

## Herramienta: `sessions_spawn`

Inicia una ejecución de subagente con `deliver: false` en el carril global `subagent`,
luego ejecuta un paso de anuncio y publica la respuesta de anuncio en el canal
de chat solicitante.

La disponibilidad depende de la política efectiva de herramientas del llamador. El perfil incorporado
`coding` incluye `sessions_spawn`; `messaging` y `minimal` no.
`full` permite todas las herramientas. Añade `tools.alsoAllow: ["sessions_spawn",
"sessions_yield", "subagents"]`, o usa `tools.profile: "coding"`, para
agentes en un perfil más restringido que aun así deban delegar trabajo.
Las políticas de canal/grupo, proveedor, aislamiento y permitir/denegar por agente
todavía pueden quitar la herramienta después de la fase de perfil. Usa `/tools` desde la misma
sesión para confirmar la lista efectiva de herramientas.

**Valores predeterminados:**

- **Modelo:** los subagentes nativos heredan el llamador salvo que configures `agents.defaults.subagents.model` (o `agents.list[].subagents.model` por agente). Las generaciones con runtime ACP usan el mismo modelo de subagente configurado cuando está presente; de lo contrario, el arnés ACP conserva su propio valor predeterminado. Un `sessions_spawn.model` explícito sigue teniendo prioridad.
- **Thinking:** los subagentes nativos heredan el llamador salvo que configures `agents.defaults.subagents.thinking` (o `agents.list[].subagents.thinking` por agente). Las generaciones con runtime ACP también aplican `agents.defaults.models["provider/model"].params.thinking` para el modelo seleccionado. Un `sessions_spawn.thinking` explícito sigue teniendo prioridad.
- **Tiempo de espera de ejecución:** OpenClaw usa `agents.defaults.subagents.runTimeoutSeconds` cuando está configurado; de lo contrario, recurre a `0` (sin tiempo de espera). `sessions_spawn` no acepta anulaciones de tiempo de espera por llamada.
- **Entrega de tareas:** los subagentes nativos reciben la tarea delegada en su primer mensaje visible `[Subagent Task]`. El prompt de sistema del subagente contiene reglas de runtime y contexto de enrutamiento, no un duplicado oculto de la tarea.

Las generaciones de subagente nativas aceptadas incluyen los metadatos del modelo hijo resuelto
en el resultado de la herramienta: `resolvedModel` contiene la referencia de modelo aplicada y
`resolvedProvider` contiene el prefijo del proveedor cuando la referencia tiene uno.

### Modo de prompt de delegación

`agents.defaults.subagents.delegationMode` controla solo la guía del prompt; no cambia la política de herramientas ni fuerza la delegación.

- `suggest` (predeterminado): mantiene el empujón estándar del prompt para usar subagentes en trabajos más grandes o lentos.
- `prefer`: indica al agente principal que se mantenga receptivo y delegue cualquier cosa más compleja que una respuesta directa mediante `sessions_spawn`.

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

### Parámetros de herramienta

<ParamField path="task" type="string" required>
  La descripción de la tarea para el subagente.
</ParamField>
<ParamField path="taskName" type="string">
  Identificador estable opcional para identificar un hijo específico en la salida de estado posterior. Debe coincidir con `[a-z][a-z0-9_-]{0,63}` y no puede ser un destino reservado como `last` o `all`.
</ParamField>
<ParamField path="label" type="string">
  Etiqueta opcional legible para humanos.
</ParamField>
<ParamField path="agentId" type="string">
  Genera bajo otro id de agente configurado cuando `subagents.allowAgents` lo permita.
</ParamField>
<ParamField path="cwd" type="string">
  Directorio de trabajo opcional de la tarea para la ejecución hija. Los subagentes nativos siguen cargando los archivos de arranque desde el espacio de trabajo del agente de destino; `cwd` solo cambia dónde las herramientas de runtime y los arneses de CLI realizan el trabajo delegado.
</ParamField>
<ParamField path="runtime" type='"subagent" | "acp"' default="subagent">
  `acp` es solo para arneses ACP externos (`claude`, `droid`, `gemini`, `opencode` o Codex ACP/acpx solicitado explícitamente) y para entradas `agents.list[]` cuyo `runtime.type` sea `acp`.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  Solo ACP. Reanuda una sesión existente del arnés ACP cuando `runtime: "acp"`; se ignora para generaciones de subagentes nativos.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  Solo ACP. Transmite la salida de la ejecución ACP a la sesión principal cuando `runtime: "acp"`; omítelo para generaciones de subagentes nativos.
</ParamField>
<ParamField path="model" type="string">
  Sobrescribe el modelo del subagente. Los valores no válidos se omiten y el subagente se ejecuta con el modelo predeterminado con una advertencia en el resultado de la herramienta.
</ParamField>
<ParamField path="thinking" type="string">
  Sobrescribe el nivel de razonamiento para la ejecución del subagente.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Cuando es `true`, solicita la vinculación a un hilo de canal para esta sesión de subagente.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  Si `thread: true` y se omite `mode`, el valor predeterminado pasa a ser `session`. `mode: "session"` requiere `thread: true`.
  Si la vinculación a hilos no está disponible para el canal solicitante, usa `mode: "run"` en su lugar.
</ParamField>
<ParamField path="cleanup" type='"delete" | "keep"' default="keep">
  `"delete"` archiva la sesión inmediatamente después del anuncio (sigue conservando la transcripción mediante cambio de nombre).
</ParamField>
<ParamField path="sandbox" type='"inherit" | "require"' default="inherit">
  `require` rechaza la generación a menos que el runtime hijo de destino esté aislado.
</ParamField>
<ParamField path="context" type='"isolated" | "fork"' default="isolated">
  `fork` ramifica la transcripción actual del solicitante en la sesión hija. Solo subagentes nativos. Las generaciones vinculadas a hilos usan `fork` de forma predeterminada; las generaciones sin hilo usan `isolated` de forma predeterminada.
</ParamField>

<Warning>
`sessions_spawn` **no** acepta parámetros de entrega por canal (`target`,
`channel`, `to`, `threadId`, `replyTo`, `transport`). Los subagentes nativos informan
su turno de asistente más reciente al solicitante; la entrega externa permanece con
el agente principal/solicitante.
</Warning>

### Nombres de tareas y direccionamiento

`taskName` es un identificador orientado al modelo para orquestación, no una clave de sesión.
Úsalo para nombres de hijos estables como `review_subagents`,
`linux_validation` o `docs_update` cuando un coordinador pueda necesitar inspeccionar
ese hijo más adelante.

La resolución de destinos acepta coincidencias exactas de `taskName` y
prefijos inequívocos. La coincidencia está limitada a la misma ventana de destinos
activos/recientes que usan los destinos numerados de `/subagents`, por lo que un hijo
completado obsoleto no hace ambiguo un identificador reutilizado. Si dos hijos activos
o recientes comparten el mismo `taskName`, el destino es ambiguo; usa en su lugar
el índice de la lista, la clave de sesión o el id de ejecución.

Los destinos reservados `last` y `all` no son valores válidos de `taskName`
porque ya tienen significados de control.

## Herramienta: `sessions_yield`

Finaliza el turno actual del modelo y espera a que los eventos de runtime,
principalmente eventos de finalización de subagentes, lleguen como el siguiente mensaje. Úsalo después
de generar trabajo hijo requerido cuando el solicitante no pueda producir una respuesta
final hasta que lleguen esas finalizaciones.

`sessions_yield` es la primitiva de espera. No la sustituyas por bucles de sondeo
sobre `subagents`, `sessions_list`, `sessions_history`, `sleep` de shell
o sondeo de procesos solo para detectar la finalización de un hijo.

Usa `sessions_yield` solo cuando la lista efectiva de herramientas de la sesión la incluya.
Algunos perfiles de herramientas mínimos o personalizados pueden exponer `sessions_spawn` y
`subagents` sin exponer `sessions_yield`; en ese caso, no inventes
un bucle de sondeo solo para esperar la finalización.

Cuando existen hijos activos, OpenClaw inyecta un bloque de prompt compacto generado por el runtime
`Active Subagents` en los turnos normales para que el solicitante pueda ver
las sesiones hijas actuales, ids de ejecución, estados, etiquetas, tareas y
alias `taskName` sin sondear. Los campos de tarea y etiqueta de ese
bloque se entrecomillan como datos, no como instrucciones, porque pueden originarse
en argumentos de generación proporcionados por el usuario/modelo.

## Herramienta: `subagents`

Lista ejecuciones de subagentes generadas que pertenecen a la sesión solicitante. Está limitada
al solicitante actual; un hijo solo puede ver sus propios hijos controlados.

Usa `subagents` para estado bajo demanda y depuración. Usa `sessions_yield` para
esperar eventos de finalización.

## Sesiones vinculadas a hilos

Cuando las vinculaciones a hilos están habilitadas para un canal, un subagente puede permanecer vinculado
a un hilo para que los mensajes de seguimiento del usuario en ese hilo sigan enrutándose a la
misma sesión de subagente.

### Canales compatibles con hilos

Un canal admite sesiones persistentes de subagente vinculadas a hilos
(`sessions_spawn` con `thread: true`) cuando registra un adaptador de vinculación
de conversación. Canales incluidos con ese soporte: **Discord**,
**iMessage**, **Matrix** y **Telegram**. Discord y Matrix usan de forma predeterminada
la creación de un hilo hijo; Telegram e iMessage usan de forma predeterminada la vinculación de la
conversación actual. Usa las claves de configuración `threadBindings` por canal para
habilitación, tiempos de espera y `spawnSessions`.

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

| Comando            | Efecto                                                                                    |
| ------------------ | ----------------------------------------------------------------------------------------- |
| `/focus <target>`  | Vincula el hilo actual (o crea uno) a un destino de subagente/sesión                     |
| `/unfocus`         | Elimina la vinculación del hilo vinculado actual                                           |
| `/agents`          | Lista ejecuciones activas y el estado de vinculación (`binding:<id>`, `unbound` o `bindings unavailable`) |
| `/session idle`    | Inspecciona/actualiza el desenfoque automático por inactividad (solo hilos vinculados enfocados) |
| `/session max-age` | Inspecciona/actualiza el límite estricto (solo hilos vinculados enfocados)                                      |

### Interruptores de configuración

- **Valor predeterminado global:** `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
- Las **claves de sobrescritura de canal y vinculación automática al generar** son específicas del adaptador. Consulta [Canales compatibles con hilos](#thread-supporting-channels) arriba.

Consulta la [referencia de configuración](/es/gateway/configuration-reference) y
[comandos de barra](/es/tools/slash-commands) para conocer los detalles actuales del adaptador.

### Lista de permitidos

<ParamField path="agents.list[].subagents.allowAgents" type="string[]">
  Lista de ids de agentes configurados que pueden ser destino mediante `agentId` explícito (`["*"]` permite cualquier destino configurado). Valor predeterminado: solo el agente solicitante. Si configuras una lista y aun así quieres que el solicitante se genere a sí mismo con `agentId`, incluye el id del solicitante en la lista.
</ParamField>
<ParamField path="agents.defaults.subagents.allowAgents" type="string[]">
  Lista de permitidos predeterminada de agentes de destino configurados que se usa cuando el agente solicitante no define su propio `subagents.allowAgents`.
</ParamField>
<ParamField path="agents.defaults.subagents.requireAgentId" type="boolean" default="false">
  Bloquea las llamadas a `sessions_spawn` que omiten `agentId` (fuerza la selección explícita de perfil). Sobrescritura por agente: `agents.list[].subagents.requireAgentId`.
</ParamField>
<ParamField path="agents.defaults.subagents.announceTimeoutMs" type="number" default="120000">
  Tiempo de espera por llamada para intentos de entrega de anuncios `agent` del gateway. Los valores son milisegundos enteros positivos y se limitan al máximo de temporizador seguro para la plataforma. Los reintentos transitorios pueden hacer que la espera total del anuncio sea más larga que un tiempo de espera configurado.
</ParamField>

Si la sesión solicitante está aislada, `sessions_spawn` rechaza destinos
que se ejecutarían sin aislamiento.

### Descubrimiento

Usa `agents_list` para ver qué ids de agente están permitidos actualmente para
`sessions_spawn`. La respuesta incluye el modelo efectivo de cada agente listado
y metadatos de runtime incrustados para que los llamadores puedan distinguir OpenClaw, servidor de aplicación Codex
y otros runtimes nativos configurados.

Las entradas `allowAgents` deben apuntar a ids de agentes configurados en `agents.list[]`.
`["*"]` significa cualquier agente de destino configurado más el solicitante. Si se elimina una configuración de agente
pero su id permanece en `allowAgents`, `sessions_spawn` rechaza ese id
y `agents_list` lo omite. Ejecuta `openclaw doctor --fix` para limpiar entradas obsoletas
de la lista de permitidos, o agrega una entrada mínima `agents.list[]` cuando el destino deba
seguir siendo generable mientras hereda los valores predeterminados.

### Archivado automático

- Las sesiones de subagente se archivan automáticamente después de `agents.defaults.subagents.archiveAfterMinutes` (valor predeterminado `60`).
- El archivado usa `sessions.delete` y cambia el nombre de la transcripción a `*.deleted.<timestamp>` (misma carpeta).
- `cleanup: "delete"` archiva inmediatamente después del anuncio (sigue conservando la transcripción mediante cambio de nombre).
- El archivado automático es de mejor esfuerzo; los temporizadores pendientes se pierden si el gateway se reinicia.
- Los tiempos de espera de ejecución configurados **no** archivan automáticamente; solo detienen la ejecución. La sesión permanece hasta el archivado automático.
- El archivado automático se aplica por igual a sesiones de profundidad 1 y profundidad 2.
- La limpieza del navegador es independiente de la limpieza de archivo: las pestañas/procesos del navegador rastreados se cierran en modo de mejor esfuerzo cuando termina la ejecución, incluso si se conserva la transcripción/registro de sesión.

## Subagentes anidados

De forma predeterminada, los subagentes no pueden generar sus propios subagentes
(`maxSpawnDepth: 1`). Define `maxSpawnDepth: 2` para habilitar un nivel de
anidamiento: el **patrón de orquestador**: principal → subagente orquestador →
sub-subagentes trabajadores.

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxSpawnDepth: 2, // permitir que los subagentes generen hijos (valor predeterminado: 1, rango 1-5)
        maxChildrenPerAgent: 5, // máximo de hijos activos por sesión de agente (valor predeterminado: 5, rango 1-20)
        maxConcurrent: 8, // límite global de carriles de concurrencia (valor predeterminado: 8)
        runTimeoutSeconds: 900, // tiempo de espera predeterminado para sessions_spawn (0 = sin tiempo de espera)
        announceTimeoutMs: 120000, // tiempo de espera por llamada para anuncios del gateway
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
| 2           | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | Subsubagente (trabajador hoja)                | Nunca                        |

### Cadena de anuncios

Los resultados fluyen de vuelta hacia arriba por la cadena:

1. El trabajador de profundidad 2 termina → anuncia a su padre (orquestador de profundidad 1).
2. El orquestador de profundidad 1 recibe el anuncio, sintetiza los resultados, termina → anuncia al principal.
3. El agente principal recibe el anuncio y lo entrega al usuario.

Cada nivel solo ve anuncios de sus hijos directos.

<Note>
**Guía operativa:** inicia el trabajo hijo una vez y espera los eventos de finalización
en lugar de construir bucles de sondeo alrededor de `sessions_list`,
`sessions_history`, `/subagents list` o comandos de suspensión con `exec`.
`sessions_list` y `/subagents list` mantienen las relaciones de sesiones hijas
centradas en el trabajo activo: los hijos activos permanecen adjuntos, los hijos terminados siguen
visibles durante una breve ventana reciente, y los enlaces de hijos obsoletos solo en el almacén se
ignoran después de su ventana de frescura. Esto evita que los metadatos antiguos `spawnedBy` /
`parentSessionKey` resuciten hijos fantasma después de
reiniciar. Si un evento de finalización de hijo llega después de que ya enviaste la
respuesta final, el seguimiento correcto es el token silencioso exacto
`NO_REPLY` / `no_reply`.
</Note>

### Política de herramientas por profundidad

- El rol y el alcance de control se escriben en los metadatos de sesión en el momento de la generación. Eso evita que claves de sesión planas o restauradas recuperen accidentalmente privilegios de orquestador.
- **Profundidad 1 (orquestador, cuando `maxSpawnDepth >= 2`):** obtiene `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history` para poder generar hijos e inspeccionar su estado. Otras herramientas de sesión/sistema permanecen denegadas.
- **Profundidad 1 (hoja, cuando `maxSpawnDepth == 1`):** sin herramientas de sesión (comportamiento predeterminado actual).
- **Profundidad 2 (trabajador hoja):** sin herramientas de sesión; `sessions_spawn` siempre se deniega en profundidad 2. No puede generar más hijos.

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
- Los perfiles de autenticación del agente principal se fusionan como **respaldo**; los perfiles de agente anulan los perfiles principales en conflictos.

La fusión es aditiva, por lo que los perfiles principales siempre están disponibles como
respaldos. La autenticación totalmente aislada por agente aún no es compatible.

## Anuncio

Los subagentes informan mediante un paso de anuncio:

- El paso de anuncio se ejecuta dentro de la sesión del subagente (no en la sesión solicitante).
- Si el subagente responde exactamente `ANNOUNCE_SKIP`, no se publica nada.
- Si el texto más reciente del asistente es el token silencioso exacto `NO_REPLY` / `no_reply`, la salida del anuncio se suprime aunque haya existido progreso visible anterior.

La entrega depende de la profundidad del solicitante:

- Las sesiones solicitantes de nivel superior usan una llamada de seguimiento `agent` con entrega externa (`deliver=true`).
- Las sesiones de subagente solicitante anidadas reciben una inyección interna de seguimiento (`deliver=false`) para que el orquestador pueda sintetizar los resultados de los hijos dentro de la sesión.
- Si una sesión de subagente solicitante anidada ya no existe, OpenClaw recurre al solicitante de esa sesión cuando está disponible.

Para las sesiones solicitantes de nivel superior, la entrega directa en modo de finalización primero
resuelve cualquier ruta de conversación/hilo vinculada y sobrescritura de hook, luego rellena
los campos faltantes de canal-destino desde la ruta almacenada de la sesión solicitante.
Eso mantiene las finalizaciones en el chat/tema correcto incluso cuando el origen de la finalización
solo identifica el canal.

La agregación de finalizaciones de hijos se limita a la ejecución solicitante actual al
crear hallazgos de finalización anidados, lo que evita que salidas de hijos de ejecuciones anteriores obsoletas
se filtren en el anuncio actual. Las respuestas de anuncio conservan
el enrutamiento de hilo/tema cuando está disponible en los adaptadores de canal.

### Contexto de anuncio

El contexto de anuncio se normaliza a un bloque de evento interno estable:

| Campo              | Fuente                                                                                                   |
| ------------------ | -------------------------------------------------------------------------------------------------------- |
| Origen             | `subagent` o `cron`                                                                                     |
| Ids de sesión      | Clave/id de sesión hija                                                                                  |
| Tipo               | Tipo de anuncio + etiqueta de tarea                                                                      |
| Estado             | Derivado del resultado de runtime (`ok`, `error`, `timeout` o `unknown`), **no** inferido del texto del modelo |
| Contenido de resultado | Texto visible más reciente del asistente desde el hijo                                                 |
| Seguimiento        | Instrucción que describe cuándo responder frente a permanecer en silencio                                |

Las ejecuciones terminales fallidas informan estado de fallo sin reproducir el
texto de respuesta capturado. La salida de herramienta/toolResult no se promueve al texto de resultado del hijo.

### Línea de estadísticas

Las cargas de anuncio incluyen una línea de estadísticas al final (incluso cuando están envueltas):

- Runtime (p. ej., `runtime 5m12s`).
- Uso de tokens (entrada/salida/total).
- Coste estimado cuando los precios del modelo están configurados (`models.providers.*.models[].cost`).
- `sessionKey`, `sessionId` y ruta de transcripción para que el agente principal pueda obtener historial mediante `sessions_history` o inspeccionar el archivo en disco.

Los metadatos internos están pensados solo para orquestación; las respuestas orientadas al usuario
deben reescribirse con una voz normal de asistente.

### Por qué preferir `sessions_history`

`sessions_history` es la ruta de orquestación más segura para leer la
transcripción de un hijo desde dentro de un turno de agente:

- Redacta texto parecido a credenciales/tokens incluso cuando la redacción de registros de propósito general está deshabilitada.
- Trunca bloques de texto largos (4000 caracteres por bloque) y descarta firmas de pensamiento, cargas de reproducción de razonamiento y datos de imagen en línea.
- Aplica un límite de respuesta de 80 KB; las filas demasiado grandes se reemplazan por `[sessions_history omitted: message too large]`.
- Usa `nextOffset` cuando esté presente para paginar hacia atrás por ventanas de transcripción más antiguas.
- `sessions_history` **no** elimina etiquetas de razonamiento, andamiaje `<relevant-memories>` ni XML de llamadas a herramientas del texto del mensaje; devuelve bloques de contenido estructurados cercanos a la forma de transcripción sin procesar, solo redactados y limitados en tamaño. `/subagents log` aplica el saneador de prosa más pesado (elimina etiquetas de razonamiento, andamiaje de memoria y XML de llamadas a herramientas) porque renderiza líneas de chat simples en lugar de bloques estructurados.
- La inspección de la transcripción sin procesar en disco es el respaldo cuando necesitas la transcripción completa byte por byte.

## Política de herramientas

Los subagentes usan primero el mismo perfil y la misma canalización de política de herramientas que el agente padre o
destino. Después, OpenClaw aplica la capa de restricciones de subagente.

Los subagentes siempre pierden `gateway`, `agents_list`, `session_status` y
`cron` independientemente de la profundidad o el rol (herramientas de nivel de sistema/interactivas, o
herramientas que el agente principal debe coordinar). Los subagentes hoja (comportamiento predeterminado
de profundidad 1, y siempre en profundidad 2) además pierden `subagents`,
`sessions_list`, `sessions_history` y `sessions_spawn`. Los subagentes nunca
obtienen la herramienta `message`: se deshabilita en el momento de generación, no se filtra por
esta lista de denegación, y `sessions_send` permanece denegada para que los subagentes
se comuniquen solo mediante la cadena de anuncios.

`sessions_history` también sigue siendo aquí una vista de recuperación acotada y saneada; no
es un volcado de transcripción sin procesar.

Cuando `maxSpawnDepth >= 2`, los subagentes orquestadores de profundidad 1 además
reciben `sessions_spawn`, `subagents`, `sessions_list` y
`sessions_history` para poder gestionar sus hijos.

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
        // deny wins
        deny: ["gateway", "cron"],
        // if allow is set, it becomes allow-only (deny still wins)
        // allow: ["read", "exec", "process"]
      },
    },
  },
}
```

`tools.subagents.tools.allow` es un filtro final de solo permitidos. Puede estrechar
el conjunto de herramientas ya resuelto, pero no puede **volver a añadir** una herramienta eliminada
por `tools.profile`. Por ejemplo, `tools.profile: "coding"` incluye
`web_search`/`web_fetch` pero no la herramienta `browser`. Para permitir que
los subagentes con perfil de codificación usen automatización de navegador, añade browser en la
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

Los subagentes usan un carril de cola dedicado dentro del proceso:

- **Nombre del carril:** `subagent`
- **Concurrencia:** `agents.defaults.subagents.maxConcurrent` (predeterminado `8`)

## Vivacidad y recuperación

OpenClaw no trata la ausencia de `endedAt` como prueba permanente de que un
subagente sigue activo. Las ejecuciones no finalizadas más antiguas que la ventana de ejecución obsoleta
(2 horas, o el tiempo de espera de ejecución configurado más un breve periodo de gracia,
lo que sea mayor) dejan de contar como activas/pendientes en `/subagents list`,
resúmenes de estado, bloqueo de finalización de descendientes y comprobaciones de
concurrencia por sesión.

Después de reiniciar un gateway, las ejecuciones restauradas no finalizadas obsoletas se podan a menos que
su sesión hija esté marcada como `abortedLastRun: true`. Esas
sesiones hijas abortadas por reinicio siguen siendo recuperables mediante el flujo de recuperación de
subagentes huérfanos, que envía un mensaje sintético de reanudación antes de
borrar el marcador de abortado.

La recuperación automática tras reinicio está acotada por sesión hija. Si el mismo
hijo subagente se acepta para recuperación de huérfano repetidamente dentro de la
ventana rápida de reacuñamiento, OpenClaw persiste una lápida de recuperación en esa
sesión y deja de reanudarla automáticamente en reinicios posteriores. Ejecuta
`openclaw tasks maintenance --apply` para reconciliar el registro de tarea, o
`openclaw doctor --fix` para borrar indicadores obsoletos de recuperación abortada en
sesiones con lápida.

<Note>
Si la generación de un subagente falla con Gateway `PAIRING_REQUIRED` /
`scope-upgrade`, revisa el llamador RPC antes de editar el estado de emparejamiento.
La coordinación interna `sessions_spawn` se despacha en proceso cuando el
llamador ya se está ejecutando dentro del contexto de solicitud del gateway, por lo que
no abre un WebSocket de loopback ni depende de la línea base de alcance de dispositivo emparejado de la CLI.
Los llamadores fuera del proceso de gateway aún usan el respaldo WebSocket
como `client.id: "gateway-client"` con `client.mode: "backend"`
sobre autenticación directa de token compartido/contraseña por loopback. Los llamadores remotos,
`deviceIdentity` explícito, rutas explícitas de token de dispositivo y clientes de navegador/node
aún necesitan aprobación normal del dispositivo para actualizaciones de alcance.
</Note>

## Detención

- Enviar `/stop` en el chat solicitante aborta la sesión solicitante y detiene cualquier ejecución de subagente activa generada desde ella, propagándose a los hijos anidados.

## Limitaciones

- El anuncio de subagente es de **mejor esfuerzo**. Si el gateway se reinicia, se pierde el trabajo pendiente de "anunciar de vuelta".
- Los subagentes siguen compartiendo los mismos recursos del proceso de gateway; trata `maxConcurrent` como una válvula de seguridad.
- `sessions_spawn` siempre es no bloqueante: devuelve `{ status: "accepted", runId, childSessionKey }` de inmediato.
- El contexto de subagente solo inyecta `AGENTS.md` y `TOOLS.md` (no `SOUL.md`, `IDENTITY.md`, `USER.md`, `MEMORY.md`, `HEARTBEAT.md` ni `BOOTSTRAP.md`). Los subagentes nativos de Codex siguen el mismo límite: `TOOLS.md` permanece en las instrucciones heredadas del hilo de Codex, mientras que los archivos de personalidad, identidad y usuario solo del padre se inyectan como instrucciones de colaboración con alcance de turno para que los hijos no los clonen.
- La profundidad máxima de anidamiento es 5 (rango de `maxSpawnDepth`: 1-5). Se recomienda la profundidad 2 para la mayoría de los casos de uso.
- `maxChildrenPerAgent` limita los hijos activos por sesión (valor predeterminado `5`, rango `1-20`).

## Relacionado

- [Agentes ACP](/es/tools/acp-agents)
- [Envío de agente](/es/tools/agent-send)
- [Tareas en segundo plano](/es/automation/tasks)
- [Herramientas de sandbox multiagente](/es/tools/multi-agent-sandbox-tools)

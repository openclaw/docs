---
read_when:
    - Quieres trabajo en segundo plano o en paralelo mediante el agente
    - Estás cambiando la política de la herramienta sessions_spawn o de subagentes
    - Está implementando o solucionando problemas de sesiones de subagente vinculadas a hilos
sidebarTitle: Sub-agents
summary: Inicia ejecuciones de agente en segundo plano aisladas que anuncian los resultados de vuelta al chat del solicitante
title: Subagentes
x-i18n:
    generated_at: "2026-06-27T13:10:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bf8b819b1bb478c5161a7493f6a806aefb8df252e6c3d9faeee94a66689a5f5f
    source_path: tools/subagents.md
    workflow: 16
---

Los subagentes son ejecuciones de agentes en segundo plano generadas desde una ejecución de agente existente.
Se ejecutan en su propia sesión (`agent:<agentId>:subagent:<uuid>`) y,
cuando terminan, **anuncian** su resultado de vuelta al canal de chat
solicitante. Cada ejecución de subagente se rastrea como una
[tarea en segundo plano](/es/automation/tasks).

Objetivos principales:

- Paralelizar trabajo de "investigación / tarea larga / herramienta lenta" sin bloquear la ejecución principal.
- Mantener los subagentes aislados de forma predeterminada (separación de sesión + sandboxing opcional).
- Mantener la superficie de herramientas difícil de usar incorrectamente: los subagentes **no** reciben herramientas de sesión de forma predeterminada.
- Admitir profundidad de anidamiento configurable para patrones de orquestador.

<Note>
**Nota de costo:** cada subagente tiene su propio contexto y uso de tokens de
forma predeterminada. Para tareas pesadas o repetitivas, configure un modelo más económico para los subagentes
y mantenga su agente principal en un modelo de mayor calidad. Configure mediante
`agents.defaults.subagents.model` o anulaciones por agente. Cuando un hijo
    necesita genuinamente la transcripción actual del solicitante, el agente puede solicitar
    `context: "fork"` en esa generación concreta. Las sesiones de subagente vinculadas a hilos usan de forma predeterminada
    `context: "fork"` porque ramifican la conversación actual en un
    hilo de seguimiento.
</Note>

## Comando de barra

Use `/subagents` para inspeccionar ejecuciones de subagentes de la **sesión actual**:

```text
/subagents list
/subagents log <id|#> [limit] [tools]
/subagents info <id|#>
```

`/subagents info` muestra metadatos de ejecución (estado, marcas de tiempo, id de sesión,
ruta de transcripción, limpieza). Use `sessions_history` para una vista de recuperación acotada
y filtrada por seguridad; inspeccione la ruta de transcripción en disco cuando
necesite la transcripción completa sin procesar.

### Controles de vinculación de hilos

Estos comandos funcionan en canales que admiten vinculaciones persistentes de hilos.
Consulte [Canales compatibles con hilos](#thread-supporting-channels) a continuación.

```text
/focus <subagent-label|session-key|session-id|session-label>
/unfocus
/agents
/session idle <duration|off>
/session max-age <duration|off>
```

### Comportamiento de generación

Los agentes inician subagentes en segundo plano con `sessions_spawn`. Las finalizaciones de subagentes
vuelven como eventos internos de sesión principal; el agente padre/solicitante decide
si se necesita una actualización visible para el usuario.

<AccordionGroup>
  <Accordion title="Finalización no bloqueante basada en envío">
    - `sessions_spawn` es no bloqueante; devuelve un id de ejecución de inmediato.
    - Al finalizar, el subagente informa de vuelta a la sesión padre/solicitante.
    - Los turnos de agente que necesitan resultados de hijos deben llamar a `sessions_yield` después de generar el trabajo requerido. Eso termina el turno actual y permite que los eventos de finalización lleguen como el siguiente mensaje visible para el modelo.
    - La finalización se basa en envío. Una vez generado, **no** sondee `/subagents list`, `sessions_list` ni `sessions_history` en bucle solo para esperar a que termine; inspeccione el estado solo bajo demanda para visibilidad de depuración.
    - La salida del hijo es un informe/evidencia para que el agente solicitante lo sintetice. No es texto de instrucciones escrito por el usuario y no puede anular políticas de sistema, desarrollador o usuario.
    - Al finalizar, OpenClaw hace el mejor esfuerzo por cerrar las pestañas/procesos del navegador rastreados abiertos por esa sesión de subagente antes de que continúe el flujo de limpieza del anuncio.

  </Accordion>
  <Accordion title="Entrega de finalización">
    - OpenClaw devuelve las finalizaciones a la sesión solicitante mediante un turno de `agent` con una clave de idempotencia estable.
    - Si la ejecución solicitante sigue activa, OpenClaw primero intenta despertar/dirigir esa ejecución en lugar de iniciar una segunda ruta de respuesta visible.
    - Si no se puede despertar a un solicitante activo, OpenClaw recurre a una transferencia al agente solicitante con el mismo contexto de finalización en lugar de descartar el anuncio.
    - Una transferencia padre correcta completa la entrega del subagente incluso cuando el padre decide que no se necesita una actualización visible para el usuario.
    - Los subagentes nativos no reciben la herramienta de mensajes. Devuelven texto de asistente sin formato al agente padre/solicitante; las respuestas visibles para humanos pertenecen a la política normal de entrega del agente padre/solicitante.
    - Si no se puede usar la transferencia directa, se recurre al enrutamiento por cola.
    - Si el enrutamiento por cola sigue sin estar disponible, el anuncio se reintenta con un breve retroceso exponencial antes del abandono final.
    - La entrega de finalización mantiene la ruta solicitante resuelta: las rutas de finalización vinculadas a hilos o vinculadas a conversaciones prevalecen cuando están disponibles; si el origen de la finalización solo proporciona un canal, OpenClaw completa el destino/cuenta faltante desde la ruta resuelta de la sesión solicitante (`lastChannel` / `lastTo` / `lastAccountId`) para que la entrega directa siga funcionando.

  </Accordion>
  <Accordion title="Metadatos de transferencia de finalización">
    La transferencia de finalización a la sesión solicitante es contexto interno
    generado por el runtime (no texto escrito por el usuario) e incluye:

    - `Result` — el texto de la respuesta visible `assistant` más reciente del hijo. La salida tool/toolResult no se promociona a resultados del hijo. Las ejecuciones fallidas terminales no reutilizan texto de respuesta capturado.
    - `Status` — `completed; ready for parent review` / `failed` / `timed out` / `unknown`.
    - Estadísticas compactas de runtime/tokens.
    - Una instrucción de revisión que indica al agente solicitante que verifique el resultado antes de decidir si la tarea original está terminada.
    - Orientación de seguimiento que indica al agente solicitante que continúe la tarea o registre un seguimiento cuando el resultado del hijo deje más acciones pendientes.
    - Una instrucción de actualización final para la ruta sin más acciones, escrita con voz normal de asistente sin reenviar metadatos internos sin procesar.

  </Accordion>
  <Accordion title="Modos y runtime ACP">
    - `--model` y `--thinking` anulan los valores predeterminados para esa ejecución específica.
    - Use `info`/`log` para inspeccionar detalles y salida después de la finalización.
    - Para sesiones persistentes vinculadas a hilos, use `sessions_spawn` con `thread: true` y `mode: "session"`.
    - Si el canal solicitante no admite vinculaciones de hilos, use `mode: "run"` en lugar de reintentar combinaciones vinculadas a hilos imposibles.
    - Para sesiones de harness ACP (Claude Code, Gemini CLI, OpenCode, o Codex ACP/acpx explícito), use `sessions_spawn` con `runtime: "acp"` cuando la herramienta anuncie ese runtime. Consulte [Modelo de entrega ACP](/es/tools/acp-agents#delivery-model) al depurar finalizaciones o bucles de agente a agente. Cuando el plugin `codex` está habilitado, el control de chat/hilo de Codex debe preferir `/codex ...` sobre ACP salvo que el usuario solicite explícitamente ACP/acpx.
    - OpenClaw oculta `runtime: "acp"` hasta que ACP está habilitado, el solicitante no está en sandbox, y se carga un plugin backend como `acpx`. `runtime: "acp"` espera un id de harness ACP externo, o una entrada `agents.list[]` con `runtime.type="acp"`; use el runtime de subagente predeterminado para agentes normales de configuración de OpenClaw desde `agents_list`.

  </Accordion>
</AccordionGroup>

## Modos de contexto

Los subagentes nativos comienzan aislados salvo que el llamador solicite explícitamente bifurcar
la transcripción actual.

| Modo       | Cuándo usarlo                                                                                                                         | Comportamiento                                                                          |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `isolated` | Investigación nueva, implementación independiente, trabajo con herramientas lentas, o cualquier cosa que pueda explicarse en el texto de la tarea                           | Crea una transcripción de hijo limpia. Este es el valor predeterminado y mantiene más bajo el uso de tokens.  |
| `fork`     | Trabajo que depende de la conversación actual, resultados previos de herramientas o instrucciones matizadas ya presentes en la transcripción solicitante | Ramifica la transcripción solicitante en la sesión hija antes de que el hijo empiece. |

Use `fork` con moderación. Es para delegación sensible al contexto, no un
sustituto de escribir una instrucción de tarea clara.

## Herramienta: `sessions_spawn`

Inicia una ejecución de subagente con `deliver: false` en el carril global `subagent`,
luego ejecuta un paso de anuncio y publica la respuesta del anuncio en el canal de chat
solicitante.

La disponibilidad depende de la política efectiva de herramientas del llamador. Los perfiles `coding` y
`full` exponen `sessions_spawn` de forma predeterminada. El perfil `messaging`
no lo hace; añada `tools.alsoAllow: ["sessions_spawn", "sessions_yield",
"subagents"]` o use `tools.profile: "coding"` para agentes que deban delegar
trabajo. Las políticas de canal/grupo, proveedor, sandbox y permitir/denegar por agente
todavía pueden quitar la herramienta después de la etapa de perfil. Use `/tools` desde la misma
sesión para confirmar la lista efectiva de herramientas.

**Valores predeterminados:**

- **Modelo:** los subagentes nativos heredan del llamador salvo que configure `agents.defaults.subagents.model` (o `agents.list[].subagents.model` por agente). Las generaciones del runtime ACP usan el mismo modelo de subagente configurado cuando está presente; de lo contrario, el harness ACP conserva su propio valor predeterminado. Un `sessions_spawn.model` explícito sigue prevaleciendo.
- **Thinking:** los subagentes nativos heredan del llamador salvo que configure `agents.defaults.subagents.thinking` (o `agents.list[].subagents.thinking` por agente). Las generaciones del runtime ACP también aplican `agents.defaults.models["provider/model"].params.thinking` para el modelo seleccionado. Un `sessions_spawn.thinking` explícito sigue prevaleciendo.
- **Tiempo de espera de ejecución:** OpenClaw usa `agents.defaults.subagents.runTimeoutSeconds` cuando está configurado; de lo contrario, recurre a `0` (sin tiempo de espera). `sessions_spawn` no acepta anulaciones de tiempo de espera por llamada.
- **Entrega de tarea:** los subagentes nativos reciben la tarea delegada en su primer mensaje visible `[Subagent Task]`. El prompt de sistema del subagente contiene reglas de runtime y contexto de enrutamiento, no un duplicado oculto de la tarea.

Las generaciones de subagentes nativos aceptadas incluyen los metadatos del modelo hijo resuelto en
el resultado de la herramienta: `resolvedModel` contiene la referencia de modelo aplicada y
`resolvedProvider` contiene el prefijo del proveedor cuando la referencia tiene uno.

### Modo de prompt de delegación

`agents.defaults.subagents.delegationMode` controla solo la orientación del prompt; no cambia la política de herramientas ni impone la delegación.

- `suggest` (predeterminado): mantenga el impulso estándar del prompt para usar subagentes en trabajos más grandes o más lentos.
- `prefer`: indique al agente principal que se mantenga receptivo y delegue cualquier cosa más compleja que una respuesta directa mediante `sessions_spawn`.

Las anulaciones por agente usan `agents.list[].subagents.delegationMode`.

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
  Generar bajo otro id de agente configurado cuando `subagents.allowAgents` lo permita.
</ParamField>
<ParamField path="cwd" type="string">
  Directorio de trabajo opcional para la ejecución hija. Los subagentes nativos siguen cargando archivos de arranque desde el área de trabajo del agente de destino; `cwd` solo cambia dónde las herramientas de runtime y los arneses de CLI realizan el trabajo delegado.
</ParamField>
<ParamField path="runtime" type='"subagent" | "acp"' default="subagent">
  `acp` es solo para arneses ACP externos (`claude`, `droid`, `gemini`, `opencode` o Codex ACP/acpx solicitado explícitamente) y para entradas `agents.list[]` cuyo `runtime.type` es `acp`.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  Solo ACP. Reanuda una sesión existente del arnés ACP cuando `runtime: "acp"`; se ignora para generaciones de subagentes nativos.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  Solo ACP. Transmite la salida de ejecución ACP a la sesión principal cuando `runtime: "acp"`; omítalo para generaciones de subagentes nativos.
</ParamField>
<ParamField path="model" type="string">
  Sobrescribe el modelo del subagente. Los valores no válidos se omiten y el subagente se ejecuta en el modelo predeterminado con una advertencia en el resultado de la herramienta.
</ParamField>
<ParamField path="thinking" type="string">
  Sobrescribe el nivel de razonamiento para la ejecución del subagente.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Cuando es `true`, solicita vinculación de hilo de canal para esta sesión de subagente.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  Si `thread: true` y se omite `mode`, el valor predeterminado pasa a ser `session`. `mode: "session"` requiere `thread: true`.
  Si la vinculación de hilo no está disponible para el canal solicitante, use `mode: "run"` en su lugar.
</ParamField>
<ParamField path="cleanup" type='"delete" | "keep"' default="keep">
  `"delete"` archiva inmediatamente después del anuncio (sigue conservando la transcripción mediante cambio de nombre).
</ParamField>
<ParamField path="sandbox" type='"inherit" | "require"' default="inherit">
  `require` rechaza la generación salvo que el runtime hijo de destino esté en sandbox.
</ParamField>
<ParamField path="context" type='"isolated" | "fork"' default="isolated">
  `fork` ramifica la transcripción actual del solicitante en la sesión hija. Solo subagentes nativos. Las generaciones vinculadas a hilos usan `fork` de forma predeterminada; las generaciones sin hilo usan `isolated` de forma predeterminada.
</ParamField>

<Warning>
`sessions_spawn` **no** acepta parámetros de entrega por canal (`target`,
`channel`, `to`, `threadId`, `replyTo`, `transport`). Los subagentes nativos informan
su último turno de assistant al solicitante; la entrega externa permanece en
el agente principal/solicitante.
</Warning>

### Nombres de tareas y selección de destino

`taskName` es un identificador orientado al modelo para orquestación, no una clave de sesión.
Úselo para nombres de hijos estables como `review_subagents`,
`linux_validation` o `docs_update` cuando un coordinador pueda necesitar inspeccionar
ese hijo más tarde.

La resolución de destino acepta coincidencias exactas de `taskName` y prefijos
sin ambigüedad. La coincidencia se limita a la misma ventana de destinos activos/recientes usada
por los destinos numerados de `/subagents`, de modo que un hijo completado obsoleto no vuelve
ambiguo un identificador reutilizado. Si dos hijos activos o recientes comparten el mismo
`taskName`, el destino es ambiguo; use el índice de la lista, la clave de sesión o
el id de ejecución en su lugar.

Los destinos reservados `last` y `all` no son valores válidos de `taskName`
porque ya tienen significados de control.

## Herramienta: `sessions_yield`

Termina el turno actual del modelo y espera a que eventos de runtime, principalmente
eventos de finalización de subagentes, lleguen como el siguiente mensaje. Úselo después
de generar trabajo hijo requerido cuando el solicitante no pueda producir una respuesta
final hasta que lleguen esas finalizaciones.

`sessions_yield` es la primitiva de espera. No la reemplace con bucles de sondeo
sobre `subagents`, `sessions_list`, `sessions_history`, `sleep` de shell
o sondeo de procesos solo para detectar la finalización de hijos.

Use `sessions_yield` solo cuando la lista efectiva de herramientas de la sesión lo incluya.
Algunos perfiles de herramientas mínimos o personalizados pueden exponer `sessions_spawn` y
`subagents` sin exponer `sessions_yield`; en ese caso, no invente
un bucle de sondeo solo para esperar la finalización.

Cuando existen hijos activos, OpenClaw inyecta un bloque de prompt compacto generado por runtime
`Active Subagents` en turnos normales para que el solicitante pueda ver
las sesiones hijas actuales, ids de ejecución, estados, etiquetas, tareas y
alias `taskName` sin sondeo. Los campos de tarea y etiqueta de ese
bloque se citan como datos, no como instrucciones, porque pueden originarse
en argumentos de generación proporcionados por el usuario/modelo.

## Herramienta: `subagents`

Enumera ejecuciones de subagentes generadas que pertenecen a la sesión solicitante. Está limitado
al solicitante actual; un hijo solo puede ver sus propios hijos controlados.

Use `subagents` para estado bajo demanda y depuración. Use `sessions_yield` para
esperar eventos de finalización.

## Sesiones vinculadas a hilo

Cuando las vinculaciones de hilo están habilitadas para un canal, un subagente puede permanecer vinculado
a un hilo para que los mensajes de seguimiento del usuario en ese hilo sigan enrutándose a la
misma sesión de subagente.

### Canales compatibles con hilos

Cualquier canal con un adaptador de vinculación de sesión puede admitir sesiones persistentes
de subagente vinculadas a hilo (`sessions_spawn` con `thread: true`).
Los adaptadores incluidos actualmente incluyen hilos de Discord, hilos de Matrix,
temas de foro de Telegram y vinculaciones de conversación actual para Feishu.
Use las claves de configuración `threadBindings` por canal para habilitación,
tiempos de espera y `spawnSessions`.

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
    Use `/session idle` para inspeccionar/actualizar el desenfoque automático por inactividad y
    `/session max-age` para controlar el límite estricto.
  </Step>
  <Step title="Desvincular">
    Use `/unfocus` para desvincular manualmente.
  </Step>
</Steps>

### Controles manuales

| Comando            | Efecto                                                                |
| ------------------ | --------------------------------------------------------------------- |
| `/focus <target>`  | Vincular el hilo actual (o crear uno) a un destino de subagente/sesión |
| `/unfocus`         | Eliminar la vinculación del hilo vinculado actual                      |
| `/agents`          | Enumerar ejecuciones activas y estado de vinculación (`thread:<id>` o `unbound`) |
| `/session idle`    | Inspeccionar/actualizar desenfoque automático por inactividad (solo hilos vinculados enfocados) |
| `/session max-age` | Inspeccionar/actualizar límite estricto (solo hilos vinculados enfocados) |

### Interruptores de configuración

- **Valor predeterminado global:** `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
- **Las claves de sobrescritura por canal y vinculación automática al generar** son específicas del adaptador. Consulte [Canales compatibles con hilos](#thread-supporting-channels) arriba.

Consulte la [Referencia de configuración](/es/gateway/configuration-reference) y
[Comandos de barra](/es/tools/slash-commands) para ver los detalles actuales del adaptador.

### Lista de permitidos

<ParamField path="agents.list[].subagents.allowAgents" type="string[]">
  Lista de ids de agente configurados que pueden seleccionarse mediante `agentId` explícito (`["*"]` permite cualquier destino configurado). Predeterminado: solo el agente solicitante. Si define una lista y aun así quiere que el solicitante se genere a sí mismo con `agentId`, incluya el id del solicitante en la lista.
</ParamField>
<ParamField path="agents.defaults.subagents.allowAgents" type="string[]">
  Lista de permitidos predeterminada de agentes de destino configurados que se usa cuando el agente solicitante no define su propio `subagents.allowAgents`.
</ParamField>
<ParamField path="agents.defaults.subagents.requireAgentId" type="boolean" default="false">
  Bloquear llamadas a `sessions_spawn` que omiten `agentId` (fuerza la selección explícita de perfil). Sobrescritura por agente: `agents.list[].subagents.requireAgentId`.
</ParamField>
<ParamField path="agents.defaults.subagents.announceTimeoutMs" type="number" default="120000">
  Tiempo de espera por llamada para intentos de entrega de anuncio `agent` del Gateway. Los valores son milisegundos enteros positivos y se limitan al máximo de temporizador seguro de la plataforma. Los reintentos transitorios pueden hacer que la espera total del anuncio sea más larga que un tiempo de espera configurado.
</ParamField>

Si la sesión solicitante está en sandbox, `sessions_spawn` rechaza destinos
que se ejecutarían sin sandbox.

### Descubrimiento

Use `agents_list` para ver qué ids de agente están permitidos actualmente para
`sessions_spawn`. La respuesta incluye el modelo efectivo de cada agente listado
y metadatos de runtime incrustados para que los llamadores puedan distinguir OpenClaw, el servidor de aplicación
Codex y otros runtimes nativos configurados.

Las entradas `allowAgents` deben apuntar a ids de agente configurados en `agents.list[]`.
`["*"]` significa cualquier agente de destino configurado más el solicitante. Si se elimina una configuración de agente
pero su id permanece en `allowAgents`, `sessions_spawn` rechaza ese id
y `agents_list` lo omite. Ejecute `openclaw doctor --fix` para limpiar entradas obsoletas
de la lista de permitidos, o agregue una entrada mínima `agents.list[]` cuando el destino deba
seguir siendo generable mientras hereda los valores predeterminados.

### Archivado automático

- Las sesiones de subagente se archivan automáticamente después de `agents.defaults.subagents.archiveAfterMinutes` (predeterminado `60`).
- El archivado usa `sessions.delete` y renombra la transcripción a `*.deleted.<timestamp>` (misma carpeta).
- `cleanup: "delete"` archiva inmediatamente después del anuncio (sigue conservando la transcripción mediante cambio de nombre).
- El archivado automático es de mejor esfuerzo; los temporizadores pendientes se pierden si el Gateway se reinicia.
- Los tiempos de espera de ejecución configurados **no** archivan automáticamente; solo detienen la ejecución. La sesión permanece hasta el archivado automático.
- El archivado automático se aplica por igual a sesiones de profundidad 1 y profundidad 2.
- La limpieza del navegador es independiente de la limpieza de archivado: las pestañas/procesos de navegador rastreados se cierran con mejor esfuerzo cuando finaliza la ejecución, incluso si se conserva el registro de transcripción/sesión.

## Subagentes anidados

De forma predeterminada, los subagentes no pueden generar sus propios subagentes
(`maxSpawnDepth: 1`). Defina `maxSpawnDepth: 2` para habilitar un nivel de
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
        runTimeoutSeconds: 900, // default timeout for sessions_spawn (0 = no timeout)
        announceTimeoutMs: 120000, // per-call gateway announce timeout
      },
    },
  },
}
```

### Niveles de profundidad

| Profundidad | Forma de la clave de sesión                  | Rol                                           | ¿Puede generar?              |
| ----------- | -------------------------------------------- | --------------------------------------------- | ---------------------------- |
| 0           | `agent:<id>:main`                            | Agente principal                              | Siempre                      |
| 1           | `agent:<id>:subagent:<uuid>`                 | Subagente (orquestador cuando se permite profundidad 2) | Solo si `maxSpawnDepth >= 2` |
| 2           | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | Sub-subagente (trabajador hoja)               | Nunca                        |

### Cadena de anuncio

Los resultados fluyen hacia arriba por la cadena:

1. El worker de profundidad 2 termina → anuncia a su padre (orquestador de profundidad 1).
2. El orquestador de profundidad 1 recibe el anuncio, sintetiza los resultados, termina → anuncia al principal.
3. El agente principal recibe el anuncio y lo entrega al usuario.

Cada nivel solo ve anuncios de sus hijos directos.

<Note>
**Guía operativa:** inicia el trabajo hijo una vez y espera los eventos de
finalización en lugar de construir bucles de sondeo alrededor de `sessions_list`,
`sessions_history`, `/subagents list` o comandos `exec` con espera.
`sessions_list` y `/subagents list` mantienen las relaciones de sesiones hijas
enfocadas en el trabajo activo: los hijos activos permanecen adjuntos, los hijos finalizados
siguen visibles durante una breve ventana reciente, y los enlaces de hijos obsoletos
solo presentes en el almacén se ignoran después de su ventana de frescura. Esto evita
que los metadatos antiguos `spawnedBy` /
`parentSessionKey` resuciten hijos fantasma después de
reiniciar. Si un evento de finalización de hijo llega después de que ya enviaste la
respuesta final, el seguimiento correcto es el token silencioso exacto
`NO_REPLY` / `no_reply`.
</Note>

### Política de herramientas por profundidad

- El rol y el alcance de control se escriben en los metadatos de sesión en el momento de creación. Eso evita que claves de sesión planas o restauradas recuperen accidentalmente privilegios de orquestador.
- **Profundidad 1 (orquestador, cuando `maxSpawnDepth >= 2`):** recibe `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history` para poder crear hijos e inspeccionar su estado. Otras herramientas de sesión/sistema permanecen denegadas.
- **Profundidad 1 (hoja, cuando `maxSpawnDepth == 1`):** sin herramientas de sesión (comportamiento predeterminado actual).
- **Profundidad 2 (worker hoja):** sin herramientas de sesión — `sessions_spawn` siempre está denegado en profundidad 2. No puede crear más hijos.

### Límite de creación por agente

Cada sesión de agente (a cualquier profundidad) puede tener como máximo `maxChildrenPerAgent`
(predeterminado `5`) hijos activos a la vez. Esto evita una expansión descontrolada
desde un único orquestador.

### Detención en cascada

Detener un orquestador de profundidad 1 detiene automáticamente todos sus hijos de profundidad 2:

- `/stop` en el chat principal detiene todos los agentes de profundidad 1 y se propaga a sus hijos de profundidad 2.

## Autenticación

La autenticación de subagente se resuelve por **id de agente**, no por tipo de sesión:

- La clave de sesión del subagente es `agent:<agentId>:subagent:<uuid>`.
- El almacén de autenticación se carga desde el `agentDir` de ese agente.
- Los perfiles de autenticación del agente principal se fusionan como **respaldo**; los perfiles del agente anulan los perfiles principales en caso de conflicto.

La fusión es aditiva, por lo que los perfiles principales siempre están disponibles como
respaldos. La autenticación completamente aislada por agente aún no es compatible.

## Anuncio

Los subagentes informan de vuelta mediante un paso de anuncio:

- El paso de anuncio se ejecuta dentro de la sesión del subagente (no en la sesión solicitante).
- Si el subagente responde exactamente `ANNOUNCE_SKIP`, no se publica nada.
- Si el texto más reciente del asistente es el token silencioso exacto `NO_REPLY` / `no_reply`, la salida del anuncio se suprime incluso si existió progreso visible anterior.

La entrega depende de la profundidad del solicitante:

- Las sesiones solicitantes de nivel superior usan una llamada de seguimiento `agent` con entrega externa (`deliver=true`).
- Las sesiones de subagente solicitante anidadas reciben una inyección interna de seguimiento (`deliver=false`) para que el orquestador pueda sintetizar los resultados de los hijos dentro de la sesión.
- Si una sesión de subagente solicitante anidada ya no existe, OpenClaw recurre al solicitante de esa sesión cuando está disponible.

Para las sesiones solicitantes de nivel superior, la entrega directa en modo de finalización primero
resuelve cualquier ruta vinculada de conversación/hilo y anulación de hook, luego completa
los campos faltantes de destino de canal desde la ruta almacenada de la sesión solicitante.
Eso mantiene las finalizaciones en el chat/tema correcto incluso cuando el origen de la finalización
solo identifica el canal.

La agregación de finalizaciones de hijos se limita a la ejecución solicitante actual al
construir hallazgos de finalización anidados, lo que evita que salidas de hijos de ejecuciones
anteriores obsoletas se filtren al anuncio actual. Las respuestas de anuncio preservan
el enrutamiento de hilo/tema cuando está disponible en los adaptadores de canal.

### Contexto de anuncio

El contexto de anuncio se normaliza en un bloque de evento interno estable:

| Campo          | Origen                                                                                                        |
| -------------- | ------------------------------------------------------------------------------------------------------------- |
| Origen         | `subagent` o `cron`                                                                                           |
| Ids de sesión  | Clave/id de sesión hija                                                                                       |
| Tipo           | Tipo de anuncio + etiqueta de tarea                                                                           |
| Estado         | Derivado del resultado de runtime (`success`, `error`, `timeout` o `unknown`) — **no** inferido del texto del modelo |
| Contenido del resultado | Texto visible más reciente del asistente del hijo                                                      |
| Seguimiento    | Instrucción que describe cuándo responder frente a permanecer en silencio                                      |

Las ejecuciones fallidas terminales informan estado de fallo sin reproducir el
texto de respuesta capturado. La salida de herramienta/toolResult no se promociona a texto de resultado hijo.

### Línea de estadísticas

Las cargas útiles de anuncio incluyen una línea de estadísticas al final (incluso cuando están envueltas):

- Runtime (por ejemplo, `runtime 5m12s`).
- Uso de tokens (entrada/salida/total).
- Costo estimado cuando los precios del modelo están configurados (`models.providers.*.models[].cost`).
- `sessionKey`, `sessionId` y ruta de transcripción para que el agente principal pueda recuperar el historial mediante `sessions_history` o inspeccionar el archivo en disco.

Los metadatos internos están destinados solo a la orquestación; las respuestas orientadas al usuario
deben reescribirse con una voz normal de asistente.

### Por qué preferir `sessions_history`

`sessions_history` es la ruta de orquestación más segura:

- El recuerdo del asistente se normaliza primero: se eliminan las etiquetas de pensamiento; se elimina el andamiaje `<relevant-memories>` / `<relevant_memories>`; se eliminan los bloques de carga útil XML de llamadas a herramientas en texto plano (`<tool_call>`, `<function_call>`, `<tool_calls>`, `<function_calls>`), incluidas cargas truncadas que nunca cierran limpiamente; se eliminan el andamiaje degradado de llamada/resultado de herramienta y los marcadores de contexto histórico; se eliminan los tokens de control del modelo filtrados (`<|assistant|>`, otros ASCII `<|...|>`, ancho completo `<｜...｜>`); se elimina XML de llamada a herramienta MiniMax malformado.
- El texto que parece credencial/token se redacta.
- Los bloques largos pueden truncarse.
- Los historiales muy grandes pueden descartar filas anteriores o reemplazar una fila sobredimensionada con `[sessions_history omitted: message too large]`.
- La inspección de la transcripción sin procesar en disco es el respaldo cuando necesitas la transcripción completa byte por byte.

## Política de herramientas

Los subagentes usan primero el mismo perfil y pipeline de política de herramientas que el padre o
agente objetivo. Después de eso, OpenClaw aplica la capa de restricción
de subagente.

Sin un `tools.profile` restrictivo, los subagentes reciben **todas las herramientas excepto la
herramienta de mensajes, las herramientas de sesión y las herramientas de sistema**:

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`
- `message`

`sessions_history` sigue siendo aquí también una vista de recuerdo acotada y saneada: no
es un volcado de transcripción sin procesar.

Cuando `maxSpawnDepth >= 2`, los subagentes orquestadores de profundidad 1 reciben además
`sessions_spawn`, `subagents`, `sessions_list` y
`sessions_history` para poder gestionar sus hijos.

### Anular mediante configuración

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
el conjunto de herramientas ya resuelto, pero no puede **volver a agregar** una herramienta eliminada
por `tools.profile`. Por ejemplo, `tools.profile: "coding"` incluye
`web_search`/`web_fetch` pero no la herramienta `browser`. Para permitir que
subagentes con perfil coding usen automatización de navegador, agrega browser en la
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
agente deba recibir automatización de navegador.

## Concurrencia

Los subagentes usan una línea de cola dedicada dentro del proceso:

- **Nombre de línea:** `subagent`
- **Concurrencia:** `agents.defaults.subagents.maxConcurrent` (predeterminado `8`)

## Vitalidad y recuperación

OpenClaw no trata la ausencia de `endedAt` como prueba permanente de que un
subagente sigue vivo. Las ejecuciones no finalizadas más antiguas que la ventana de ejecución obsoleta
dejan de contar como activas/pendientes en `/subagents list`, resúmenes de estado,
bloqueo de finalización de descendientes y comprobaciones de concurrencia por sesión.

Después de reiniciar el Gateway, las ejecuciones restauradas obsoletas no finalizadas se podan a menos que
su sesión hija esté marcada como `abortedLastRun: true`. Esas
sesiones hijas abortadas por reinicio siguen siendo recuperables mediante el flujo de recuperación de huérfanos
de subagente, que envía un mensaje sintético de reanudación antes de
limpiar el marcador abortado.

La recuperación automática tras reinicio está acotada por sesión hija. Si el mismo
hijo subagente se acepta para recuperación de huérfanos repetidamente dentro de la
ventana rápida de reencallamiento, OpenClaw persiste una lápida de recuperación en esa
sesión y deja de reanudarlo automáticamente en reinicios posteriores. Ejecuta
`openclaw tasks maintenance --apply` para reconciliar el registro de tarea, o
`openclaw doctor --fix` para limpiar flags de recuperación abortada obsoletos en
sesiones con lápida.

<Note>
Si la creación de un subagente falla con Gateway `PAIRING_REQUIRED` /
`scope-upgrade`, revisa el llamador RPC antes de editar el estado de emparejamiento.
La coordinación interna de `sessions_spawn` despacha dentro del proceso cuando el
llamador ya se está ejecutando dentro del contexto de solicitud del gateway, por lo que
no abre un WebSocket de loopback ni depende de la línea base de alcance de dispositivo emparejado
de la CLI. Los llamadores fuera del proceso del gateway siguen usando el respaldo
WebSocket como `client.id: "gateway-client"` con `client.mode: "backend"`
sobre autenticación directa de loopback con token compartido/contraseña. Los llamadores remotos, `deviceIdentity`
explícito, las rutas explícitas de token de dispositivo y los clientes browser/node
siguen necesitando aprobación normal de dispositivo para actualizaciones de alcance.
</Note>

## Detención

- Enviar `/stop` en el chat solicitante aborta la sesión solicitante y detiene cualquier ejecución activa de subagente creada desde ella, propagándose a hijos anidados.

## Limitaciones

- El anuncio de subagente es de **mejor esfuerzo**. Si el gateway se reinicia, el trabajo pendiente de "anunciar de vuelta" se pierde.
- Los subagentes siguen compartiendo los mismos recursos del proceso gateway; trata `maxConcurrent` como una válvula de seguridad.
- `sessions_spawn` siempre es no bloqueante: devuelve `{ status: "accepted", runId, childSessionKey }` inmediatamente.
- El contexto de subagente solo inyecta `AGENTS.md` y `TOOLS.md` (sin `SOUL.md`, `IDENTITY.md`, `USER.md`, `MEMORY.md`, `HEARTBEAT.md` ni `BOOTSTRAP.md`). Los subagentes nativos de Codex siguen el mismo límite: `TOOLS.md` permanece en las instrucciones heredadas del hilo Codex, mientras que los archivos de persona, identidad y usuario exclusivos del padre se inyectan como instrucciones de colaboración limitadas al turno para que los hijos no los clonen.
- La profundidad máxima de anidamiento es 5 (rango de `maxSpawnDepth`: 1–5). Se recomienda la profundidad 2 para la mayoría de los casos de uso.
- `maxChildrenPerAgent` limita los hijos activos por sesión (predeterminado `5`, rango `1–20`).

## Relacionado

- [Agentes ACP](/es/tools/acp-agents)
- [Envío de agente](/es/tools/agent-send)
- [Tareas en segundo plano](/es/automation/tasks)
- [Herramientas de sandbox multiagente](/es/tools/multi-agent-sandbox-tools)

---
read_when:
    - Desea realizar trabajo en segundo plano o en paralelo mediante el agente
    - Está cambiando la política de sessions_spawn o de la herramienta de subagentes
    - Está implementando o solucionando problemas de sesiones de subagentes vinculadas a hilos
sidebarTitle: Sub-agents
summary: Inicia ejecuciones aisladas de agentes en segundo plano que comunican los resultados al chat del solicitante
title: Subagentes
x-i18n:
    generated_at: "2026-05-11T20:58:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 02b03bdfd5cddf5618fddf0804f017400c36751095166dac18fa35fa3bfd4c6e
    source_path: tools/subagents.md
    workflow: 16
---

Los subagentes son ejecuciones de agentes en segundo plano generadas desde una ejecución de agente existente.
Se ejecutan en su propia sesión (`agent:<agentId>:subagent:<uuid>`) y,
al finalizar, **anuncian** su resultado de vuelta al canal de chat
solicitante. Cada ejecución de subagente se registra como una
[tarea en segundo plano](/es/automation/tasks).

Objetivos principales:

- Paralelizar el trabajo de "investigación / tarea larga / herramienta lenta" sin bloquear la ejecución principal.
- Mantener los subagentes aislados de forma predeterminada (separación de sesiones + sandboxing opcional).
- Mantener la superficie de herramientas difícil de usar incorrectamente: los subagentes **no** reciben herramientas de sesión de forma predeterminada.
- Admitir una profundidad de anidamiento configurable para patrones de orquestador.

<Note>
**Nota de coste:** cada subagente tiene su propio contexto y uso de tokens de
forma predeterminada. Para tareas pesadas o repetitivas, configura un modelo más barato para los subagentes
y mantén tu agente principal en un modelo de mayor calidad. Configura mediante
`agents.defaults.subagents.model` o anulaciones por agente. Cuando un hijo
    necesita realmente la transcripción actual del solicitante, el agente puede solicitar
    `context: "fork"` en esa generación concreta. Las sesiones de subagente vinculadas a hilos usan de forma predeterminada
    `context: "fork"` porque ramifican la conversación actual en un
    hilo de seguimiento.
</Note>

## Comando de barra diagonal

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

Usa [`/steer <message>`](/es/tools/steer) de nivel superior para dirigir la ejecución activa de la sesión solicitante actual. Usa `/subagents steer <id|#> <message>` cuando el destino sea una ejecución hija.

`/subagents info` muestra metadatos de la ejecución (estado, marcas de tiempo, id de sesión,
ruta de transcripción, limpieza). Usa `sessions_history` para una vista de recuerdo acotada y
filtrada por seguridad; inspecciona la ruta de la transcripción en el disco cuando
necesites la transcripción completa sin procesar.

### Controles de vinculación de hilos

Estos comandos funcionan en canales que admiten vinculaciones de hilos persistentes.
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
retransmisión interna) y envía una actualización final de finalización de vuelta al
chat solicitante cuando la ejecución termina.

<AccordionGroup>
  <Accordion title="Finalización no bloqueante y basada en push">
    - El comando de generación no bloquea; devuelve un id de ejecución inmediatamente.
    - Al finalizar, el subagente anuncia un mensaje de resumen/resultado de vuelta al canal de chat solicitante.
    - Los turnos de agente que necesiten resultados de hijos deben llamar a `sessions_yield` después de generar el trabajo requerido. Eso finaliza el turno actual y permite que los eventos de finalización lleguen como el siguiente mensaje visible para el modelo.
    - La finalización se basa en push. Una vez generado, **no** consultes `/subagents list`, `sessions_list` ni `sessions_history` en un bucle solo para esperar a que termine; inspecciona el estado solo bajo demanda para depuración o intervención.
    - La salida del hijo es un informe/evidencia para que el agente solicitante la sintetice. No es texto de instrucciones escrito por el usuario y no puede anular la política de sistema, desarrollador o usuario.
    - Al finalizar, OpenClaw cierra con el mejor esfuerzo las pestañas/procesos del navegador registrados abiertos por esa sesión de subagente antes de que continúe el flujo de limpieza del anuncio.

  </Accordion>
  <Accordion title="Resiliencia de entrega de generación manual">
    - OpenClaw devuelve las finalizaciones a la sesión solicitante mediante un turno `agent` con una clave de idempotencia estable.
    - Si la ejecución solicitante sigue activa, OpenClaw primero intenta despertar/dirigir esa ejecución en lugar de iniciar una segunda ruta de respuesta visible.
    - Si la entrega de finalización al agente solicitante falla o no produce salida visible, OpenClaw trata la entrega como fallida y recurre al enrutamiento/reintento por cola. No envía sin procesar el resultado del hijo directamente al chat externo.
    - Si no se puede usar la entrega directa, recurre al enrutamiento por cola.
    - Si el enrutamiento por cola sigue sin estar disponible, el anuncio se reintenta con un retroceso exponencial corto antes del abandono final.
    - La entrega de finalización conserva la ruta solicitante resuelta: las rutas de finalización vinculadas a hilo o a conversación prevalecen cuando están disponibles; si el origen de finalización solo proporciona un canal, OpenClaw completa el destino/cuenta faltante desde la ruta resuelta de la sesión solicitante (`lastChannel` / `lastTo` / `lastAccountId`) para que la entrega directa siga funcionando.

  </Accordion>
  <Accordion title="Metadatos de entrega de finalización">
    La entrega de finalización a la sesión solicitante es contexto interno generado en tiempo de ejecución
    (no texto escrito por el usuario) e incluye:

    - `Result` — texto de la respuesta `assistant` visible más reciente; de lo contrario, texto saneado de la herramienta/toolResult más reciente. Las ejecuciones terminales fallidas no reutilizan el texto de respuesta capturado.
    - `Status` — `completed successfully` / `failed` / `timed out` / `unknown`.
    - Estadísticas compactas de tiempo de ejecución/tokens.
    - Una instrucción de entrega que indica al agente solicitante que reescriba con la voz normal del asistente (no que reenvíe metadatos internos sin procesar).

  </Accordion>
  <Accordion title="Modos y runtime ACP">
    - `--model` y `--thinking` anulan los valores predeterminados para esa ejecución específica.
    - Usa `info`/`log` para inspeccionar detalles y salida después de la finalización.
    - `/subagents spawn` es modo de una sola ejecución (`mode: "run"`). Para sesiones persistentes vinculadas a hilos, usa `sessions_spawn` con `thread: true` y `mode: "session"`.
    - Para sesiones de arnés ACP (Claude Code, Gemini CLI, OpenCode o Codex ACP/acpx explícito), usa `sessions_spawn` con `runtime: "acp"` cuando la herramienta anuncie ese runtime. Consulta [Modelo de entrega ACP](/es/tools/acp-agents#delivery-model) al depurar finalizaciones o bucles de agente a agente. Cuando el plugin `codex` está habilitado, el control de chat/hilo de Codex debe preferir `/codex ...` sobre ACP salvo que el usuario pida explícitamente ACP/acpx.
    - OpenClaw oculta `runtime: "acp"` hasta que ACP esté habilitado, el solicitante no esté en sandbox y se cargue un plugin de backend como `acpx`. `runtime: "acp"` espera un id de arnés ACP externo, o una entrada `agents.list[]` con `runtime.type="acp"`; usa el runtime de subagente predeterminado para agentes de configuración normales de OpenClaw desde `agents_list`.

  </Accordion>
</AccordionGroup>

## Modos de contexto

Los subagentes nativos empiezan aislados salvo que el llamador solicite explícitamente ramificar
la transcripción actual.

| Modo       | Cuándo usarlo                                                                                                                         | Comportamiento                                                                          |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `isolated` | Investigación nueva, implementación independiente, trabajo con herramientas lentas o cualquier cosa que pueda explicarse en el texto de la tarea                           | Crea una transcripción hija limpia. Este es el valor predeterminado y mantiene más bajo el uso de tokens.  |
| `fork`     | Trabajo que depende de la conversación actual, resultados previos de herramientas o instrucciones matizadas ya presentes en la transcripción solicitante | Ramifica la transcripción solicitante en la sesión hija antes de que el hijo empiece. |

Usa `fork` con moderación. Es para delegación sensible al contexto, no un
reemplazo para escribir un prompt de tarea claro.

## Herramienta: `sessions_spawn`

Inicia una ejecución de subagente con `deliver: false` en la vía global `subagent`,
luego ejecuta un paso de anuncio y publica la respuesta del anuncio en el canal de chat
solicitante.

La disponibilidad depende de la política de herramientas efectiva del llamador. Los perfiles `coding` y
`full` exponen `sessions_spawn` de forma predeterminada. El perfil `messaging`
no lo hace; añade `tools.alsoAllow: ["sessions_spawn", "sessions_yield",
"subagents"]` o usa `tools.profile: "coding"` para agentes que deban delegar
trabajo. Las políticas de canal/grupo, proveedor, sandbox y permitir/denegar por agente
aún pueden eliminar la herramienta después de la etapa de perfil. Usa `/tools` desde la misma
sesión para confirmar la lista efectiva de herramientas.

**Valores predeterminados:**

- **Modelo:** hereda el llamador salvo que configures `agents.defaults.subagents.model` (o `agents.list[].subagents.model` por agente); un `sessions_spawn.model` explícito sigue prevaleciendo.
- **Thinking:** hereda el llamador salvo que configures `agents.defaults.subagents.thinking` (o `agents.list[].subagents.thinking` por agente); un `sessions_spawn.thinking` explícito sigue prevaleciendo.
- **Tiempo de espera de ejecución:** si se omite `sessions_spawn.runTimeoutSeconds`, OpenClaw usa `agents.defaults.subagents.runTimeoutSeconds` cuando está configurado; de lo contrario, recurre a `0` (sin tiempo de espera).

### Modo de prompt de delegación

`agents.defaults.subagents.delegationMode` controla solo la guía del prompt; no cambia la política de herramientas ni aplica la delegación.

- `suggest` (predeterminado): mantiene el aviso de prompt estándar para usar subagentes en trabajos más grandes o lentos.
- `prefer`: indica al agente principal que se mantenga receptivo y delegue mediante `sessions_spawn` cualquier cosa más compleja que una respuesta directa.

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

### Parámetros de la herramienta

<ParamField path="task" type="string" required>
  La descripción de la tarea para el subagente.
</ParamField>
<ParamField path="taskName" type="string">
  Identificador estable opcional para dirigirse después con `subagents`. Debe coincidir con `[a-z][a-z0-9_]{0,63}` y no puede ser un destino reservado como `last` o `all`. Prefiéralo cuando el coordinador pueda necesitar dirigir, detener o identificar un hijo específico después de generar varios hijos.
</ParamField>
<ParamField path="label" type="string">
  Etiqueta opcional legible para humanos.
</ParamField>
<ParamField path="agentId" type="string">
  Generar bajo otro id de agente cuando `subagents.allowAgents` lo permita.
</ParamField>
<ParamField path="runtime" type='"subagent" | "acp"' default="subagent">
  `acp` es solo para arneses ACP externos (`claude`, `droid`, `gemini`, `opencode` o Codex ACP/acpx solicitado explícitamente) y para entradas `agents.list[]` cuyo `runtime.type` sea `acp`.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  Solo ACP. Reanuda una sesión existente del arnés ACP cuando `runtime: "acp"`; se ignora para generaciones de subagentes nativos.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  Solo ACP. Transmite la salida de la ejecución ACP a la sesión principal cuando `runtime: "acp"`; omítalo para generaciones de subagentes nativos.
</ParamField>
<ParamField path="model" type="string">
  Anula el modelo del subagente. Los valores no válidos se omiten y el subagente se ejecuta en el modelo predeterminado con una advertencia en el resultado de la herramienta.
</ParamField>
<ParamField path="thinking" type="string">
  Anula el nivel de razonamiento para la ejecución del subagente.
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  De forma predeterminada usa `agents.defaults.subagents.runTimeoutSeconds` cuando está definido; de lo contrario, `0`. Cuando está definido, la ejecución del subagente se aborta después de N segundos.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Cuando es `true`, solicita vinculación de hilo de canal para esta sesión de subagente.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  Si `thread: true` y se omite `mode`, el valor predeterminado pasa a ser `session`. `mode: "session"` requiere `thread: true`.
</ParamField>
<ParamField path="cleanup" type='"delete" | "keep"' default="keep">
  `"delete"` archiva inmediatamente después del anuncio (aun así conserva la transcripción mediante cambio de nombre).
</ParamField>
<ParamField path="sandbox" type='"inherit" | "require"' default="inherit">
  `require` rechaza la generación a menos que el runtime del hijo de destino esté en sandbox.
</ParamField>
<ParamField path="context" type='"isolated" | "fork"' default="isolated">
  `fork` ramifica la transcripción actual del solicitante hacia la sesión hija. Solo subagentes nativos. Las generaciones vinculadas a hilos usan `fork` de forma predeterminada; las generaciones sin hilo usan `isolated` de forma predeterminada.
</ParamField>

<Warning>
`sessions_spawn` **no** acepta parámetros de entrega de canal (`target`,
`channel`, `to`, `threadId`, `replyTo`, `transport`). Para la entrega, use
`message`/`sessions_send` desde la ejecución generada.
</Warning>

### Nombres de tarea y direccionamiento

`taskName` es un identificador orientado al modelo para la orquestación, no una clave de sesión.
Úselo para nombres de hijos estables como `review_subagents`,
`linux_validation` o `docs_update` cuando un coordinador pueda necesitar dirigir
o detener ese hijo más adelante.

La resolución de destino acepta coincidencias exactas de `taskName` y
prefijos no ambiguos. La coincidencia se limita a la misma ventana de destinos
activos/recientes que usan los destinos numerados de `/subagents`, por lo que
un hijo completado obsoleto no hace ambiguo un identificador reutilizado. Si dos
hijos activos o recientes comparten el mismo `taskName`, el destino es ambiguo;
use en su lugar el índice de la lista, la clave de sesión o el id de ejecución.

Los destinos reservados `last` y `all` no son valores válidos de `taskName`
porque ya tienen significados de control.

## Herramienta: `sessions_yield`

Finaliza el turno actual del modelo y espera a que eventos del runtime,
principalmente eventos de finalización de subagentes, lleguen como el siguiente
mensaje. Úselo después de generar trabajo hijo necesario cuando el solicitante
no pueda producir una respuesta final hasta que lleguen esas finalizaciones.

`sessions_yield` es la primitiva de espera. No la sustituya por bucles de sondeo
sobre `subagents`, `sessions_list`, `sessions_history`, `sleep` de shell
o sondeo de procesos solo para detectar la finalización de un hijo.

Use `sessions_yield` solo cuando la lista efectiva de herramientas de la sesión
lo incluya. Algunos perfiles de herramientas mínimos o personalizados pueden
exponer `sessions_spawn` y `subagents` sin exponer `sessions_yield`; en ese caso,
no invente un bucle de sondeo solo para esperar la finalización.

Cuando existen hijos activos, OpenClaw inyecta un bloque de prompt compacto
generado por el runtime, `Active Subagents`, en los turnos normales para que el
solicitante pueda ver las sesiones hijas actuales, ids de ejecución, estados,
etiquetas, tareas y alias de `taskName` sin sondear. Los campos de tarea y
etiqueta de ese bloque se citan como datos, no como instrucciones, porque
pueden originarse en argumentos de generación proporcionados por el usuario/modelo.

## Herramienta: `subagents`

Lista, dirige o detiene ejecuciones de subagentes generadas que pertenecen a la
sesión solicitante. Su alcance se limita al solicitante actual; un hijo solo
puede ver/controlar sus propios hijos controlados.

Use `subagents` para estado bajo demanda, depuración, dirección o detención.
Use `sessions_yield` para esperar eventos de finalización.

## Sesiones vinculadas a hilos

Cuando las vinculaciones de hilos están habilitadas para un canal, un subagente
puede permanecer vinculado a un hilo para que los mensajes de seguimiento del
usuario en ese hilo sigan enrutándose a la misma sesión de subagente.

### Canales compatibles con hilos

**Discord** es actualmente el único canal compatible. Admite sesiones de
subagente persistentes vinculadas a hilos (`sessions_spawn` con
`thread: true`), controles manuales de hilos (`/focus`, `/unfocus`, `/agents`,
`/session idle`, `/session max-age`) y claves de adaptador
`channels.discord.threadBindings.enabled`,
`channels.discord.threadBindings.idleHours`,
`channels.discord.threadBindings.maxAgeHours` y
`channels.discord.threadBindings.spawnSessions`.

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
| `/focus <target>`  | Vincula el hilo actual (o crea uno) a un destino de subagente/sesión |
| `/unfocus`         | Elimina la vinculación del hilo vinculado actual                       |
| `/agents`          | Lista ejecuciones activas y estado de vinculación (`thread:<id>` o `unbound`)       |
| `/session idle`    | Inspecciona/actualiza el desenfoque automático por inactividad (solo hilos vinculados enfocados)         |
| `/session max-age` | Inspecciona/actualiza el límite estricto (solo hilos vinculados enfocados)                  |

### Interruptores de configuración

- **Valor predeterminado global:** `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
- Las **claves de anulación de canal y vinculación automática al generar** son específicas del adaptador. Consulte [Canales compatibles con hilos](#thread-supporting-channels) arriba.

Consulte [Referencia de configuración](/es/gateway/configuration-reference) y
[Comandos Slash](/es/tools/slash-commands) para obtener los detalles actuales del adaptador.

### Lista de permitidos

<ParamField path="agents.list[].subagents.allowAgents" type="string[]">
  Lista de ids de agente que pueden dirigirse mediante `agentId` explícito (`["*"]` permite cualquiera). Valor predeterminado: solo el agente solicitante. Si define una lista y aun así quiere que el solicitante se genere a sí mismo con `agentId`, incluya el id del solicitante en la lista.
</ParamField>
<ParamField path="agents.defaults.subagents.allowAgents" type="string[]">
  Lista de permitidos de agentes de destino predeterminada que se usa cuando el agente solicitante no define su propio `subagents.allowAgents`.
</ParamField>
<ParamField path="agents.defaults.subagents.requireAgentId" type="boolean" default="false">
  Bloquea llamadas a `sessions_spawn` que omiten `agentId` (fuerza la selección explícita de perfil). Anulación por agente: `agents.list[].subagents.requireAgentId`.
</ParamField>
<ParamField path="agents.defaults.subagents.announceTimeoutMs" type="number" default="120000">
  Tiempo de espera por llamada para intentos de entrega de anuncio `agent` del gateway. Los valores son milisegundos enteros positivos y se limitan al máximo de temporizador seguro para la plataforma. Los reintentos transitorios pueden hacer que la espera total de anuncio sea más larga que un tiempo de espera configurado.
</ParamField>

Si la sesión solicitante está en sandbox, `sessions_spawn` rechaza destinos
que se ejecutarían sin sandbox.

### Descubrimiento

Use `agents_list` para ver qué ids de agente están permitidos actualmente para
`sessions_spawn`. La respuesta incluye el modelo efectivo de cada agente listado
y metadatos de runtime incrustados para que los llamadores puedan distinguir PI, el
servidor de aplicaciones Codex y otros runtimes nativos configurados.

### Autoarchivado

- Las sesiones de subagente se archivan automáticamente después de `agents.defaults.subagents.archiveAfterMinutes` (predeterminado `60`).
- El archivado usa `sessions.delete` y cambia el nombre de la transcripción a `*.deleted.<timestamp>` (misma carpeta).
- `cleanup: "delete"` archiva inmediatamente después del anuncio (aun así conserva la transcripción mediante cambio de nombre).
- El autoarchivado es de mejor esfuerzo; los temporizadores pendientes se pierden si se reinicia el gateway.
- `runTimeoutSeconds` **no** autoarchiva; solo detiene la ejecución. La sesión permanece hasta el autoarchivado.
- El autoarchivado se aplica por igual a sesiones de profundidad 1 y profundidad 2.
- La limpieza del navegador es independiente de la limpieza de archivado: las pestañas/procesos de navegador rastreados se cierran con mejor esfuerzo cuando finaliza la ejecución, incluso si se conserva el registro de transcripción/sesión.

## Subagentes anidados

De forma predeterminada, los subagentes no pueden generar sus propios subagentes
(`maxSpawnDepth: 1`). Defina `maxSpawnDepth: 2` para habilitar un nivel de
anidamiento: el **patrón de orquestador**: principal → subagente orquestador →
subsubagentes trabajadores.

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxSpawnDepth: 2, // allow sub-agents to spawn children (default: 1)
        maxChildrenPerAgent: 5, // max active children per agent session (default: 5)
        maxConcurrent: 8, // global concurrency lane cap (default: 8)
        runTimeoutSeconds: 900, // default timeout for sessions_spawn when omitted (0 = no timeout)
        announceTimeoutMs: 120000, // per-call gateway announce timeout
      },
    },
  },
}
```

### Niveles de profundidad

| Profundidad | Forma de clave de sesión                            | Rol                                          | ¿Puede generar?                   |
| ----- | -------------------------------------------- | --------------------------------------------- | ---------------------------- |
| 0     | `agent:<id>:main`                            | Agente principal                                    | Siempre                       |
| 1     | `agent:<id>:subagent:<uuid>`                 | Subagente (orquestador cuando se permite profundidad 2) | Solo si `maxSpawnDepth >= 2` |
| 2     | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | Subsubagente (trabajador hoja)                   | Nunca                        |

### Cadena de anuncios

Los resultados fluyen hacia arriba por la cadena:

1. El trabajador de profundidad 2 finaliza → anuncia a su padre (orquestador de profundidad 1).
2. El orquestador de profundidad 1 recibe el anuncio, sintetiza resultados, finaliza → anuncia al principal.
3. El agente principal recibe el anuncio y lo entrega al usuario.

Cada nivel solo ve anuncios de sus hijos directos.

<Note>
**Guía operativa:** inicia el trabajo hijo una vez y espera los eventos de finalización en lugar de crear bucles de sondeo alrededor de `sessions_list`, `sessions_history`, `/subagents list` o comandos de suspensión de `exec`. `sessions_list` y `/subagents list` mantienen las relaciones de sesiones hijas centradas en el trabajo activo: los hijos activos permanecen adjuntos, los hijos finalizados siguen visibles durante una ventana reciente breve, y los enlaces de hijos obsoletos que solo están en el almacén se ignoran después de su ventana de vigencia. Esto evita que metadatos antiguos de `spawnedBy` / `parentSessionKey` resuciten hijos fantasma después de reiniciar. Si llega un evento de finalización de un hijo después de que ya enviaste la respuesta final, el seguimiento correcto es el token silencioso exacto `NO_REPLY` / `no_reply`.
</Note>

### Política de herramientas por profundidad

- El rol y el alcance de control se escriben en los metadatos de la sesión al momento de generar la sesión. Eso evita que claves de sesión planas o restauradas recuperen accidentalmente privilegios de orquestador.
- **Profundidad 1 (orquestador, cuando `maxSpawnDepth >= 2`):** recibe `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history` para poder gestionar sus hijos. Las demás herramientas de sesión/sistema permanecen denegadas.
- **Profundidad 1 (hoja, cuando `maxSpawnDepth == 1`):** sin herramientas de sesión (comportamiento predeterminado actual).
- **Profundidad 2 (trabajador hoja):** sin herramientas de sesión: `sessions_spawn` siempre se deniega en profundidad 2. No puede generar más hijos.

### Límite de generación por agente

Cada sesión de agente (en cualquier profundidad) puede tener como máximo `maxChildrenPerAgent` (valor predeterminado `5`) hijos activos a la vez. Esto evita una expansión descontrolada desde un solo orquestador.

### Detención en cascada

Detener un orquestador de profundidad 1 detiene automáticamente todos sus hijos de profundidad 2:

- `/stop` en el chat principal detiene todos los agentes de profundidad 1 y se propaga a sus hijos de profundidad 2.
- `/subagents kill <id>` detiene un subagente específico y se propaga a sus hijos.
- `/subagents kill all` detiene todos los subagentes del solicitante y se propaga en cascada.

## Autenticación

La autenticación de subagentes se resuelve por **id de agente**, no por tipo de sesión:

- La clave de sesión del subagente es `agent:<agentId>:subagent:<uuid>`.
- El almacén de autenticación se carga desde el `agentDir` de ese agente.
- Los perfiles de autenticación del agente principal se combinan como **respaldo**; los perfiles del agente tienen prioridad sobre los perfiles principales en caso de conflicto.

La combinación es aditiva, por lo que los perfiles principales siempre están disponibles como respaldos. La autenticación completamente aislada por agente aún no es compatible.

## Anuncio

Los subagentes informan mediante un paso de anuncio:

- El paso de anuncio se ejecuta dentro de la sesión del subagente (no en la sesión del solicitante).
- Si el subagente responde exactamente `ANNOUNCE_SKIP`, no se publica nada.
- Si el texto más reciente del asistente es el token silencioso exacto `NO_REPLY` / `no_reply`, la salida del anuncio se suprime aunque haya existido progreso visible anterior.

La entrega depende de la profundidad del solicitante:

- Las sesiones solicitantes de nivel superior usan una llamada de seguimiento `agent` con entrega externa (`deliver=true`).
- Las sesiones de subagente solicitante anidadas reciben una inyección de seguimiento interna (`deliver=false`) para que el orquestador pueda sintetizar los resultados de los hijos dentro de la sesión.
- Si una sesión de subagente solicitante anidada ya no existe, OpenClaw recurre al solicitante de esa sesión cuando está disponible.

Para sesiones solicitantes de nivel superior, la entrega directa en modo de finalización primero resuelve cualquier ruta de conversación/hilo vinculada y anulación de hook, luego rellena los campos faltantes de canal-destino desde la ruta almacenada de la sesión solicitante. Eso mantiene las finalizaciones en el chat/tema correcto incluso cuando el origen de la finalización solo identifica el canal.

La agregación de finalización de hijos se limita a la ejecución actual del solicitante al construir hallazgos de finalización anidados, lo que evita que salidas de hijos obsoletas de ejecuciones anteriores se filtren en el anuncio actual. Las respuestas de anuncio conservan el enrutamiento de hilo/tema cuando está disponible en los adaptadores de canal.

### Contexto de anuncio

El contexto de anuncio se normaliza en un bloque de evento interno estable:

| Campo              | Origen                                                                                                                  |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| Origen             | `subagent` o `cron`                                                                                                     |
| Ids de sesión      | Clave/id de sesión hija                                                                                                 |
| Tipo               | Tipo de anuncio + etiqueta de tarea                                                                                     |
| Estado             | Derivado del resultado en tiempo de ejecución (`success`, `error`, `timeout` o `unknown`), **no** inferido del texto del modelo |
| Contenido resultado | Último texto visible del asistente; de lo contrario, el último texto saneado de herramienta/toolResult                  |
| Seguimiento        | Instrucción que describe cuándo responder o permanecer en silencio                                                       |

Las ejecuciones terminales fallidas informan estado de fallo sin reproducir el texto de respuesta capturado. En caso de tiempo de espera, si el hijo solo llegó a ejecutar llamadas de herramientas, el anuncio puede condensar ese historial en un breve resumen de progreso parcial en lugar de reproducir la salida sin procesar de la herramienta.

### Línea de estadísticas

Las cargas de anuncio incluyen una línea de estadísticas al final (incluso cuando están envueltas):

- Tiempo de ejecución (p. ej. `runtime 5m12s`).
- Uso de tokens (entrada/salida/total).
- Costo estimado cuando los precios de modelos están configurados (`models.providers.*.models[].cost`).
- `sessionKey`, `sessionId` y ruta de transcripción para que el agente principal pueda obtener el historial mediante `sessions_history` o inspeccionar el archivo en disco.

Los metadatos internos están pensados solo para la orquestación; las respuestas orientadas al usuario deben reescribirse con voz normal de asistente.

### Por qué preferir `sessions_history`

`sessions_history` es la ruta de orquestación más segura:

- Primero se normaliza el recuerdo del asistente: se eliminan etiquetas de razonamiento; se elimina el andamiaje de `<relevant-memories>` / `<relevant_memories>`; se eliminan bloques de carga XML de llamadas de herramienta en texto plano (`<tool_call>`, `<function_call>`, `<tool_calls>`, `<function_calls>`), incluidas cargas truncadas que nunca cierran limpiamente; se elimina el andamiaje degradado de llamadas/resultados de herramientas y marcadores de contexto histórico; se eliminan tokens filtrados de control del modelo (`<|assistant|>`, otros ASCII `<|...|>`, ancho completo `<｜...｜>`); se elimina XML malformado de llamadas de herramienta MiniMax.
- El texto similar a credenciales/tokens se redacta.
- Los bloques largos pueden truncarse.
- Los historiales muy grandes pueden eliminar filas antiguas o sustituir una fila demasiado grande por `[sessions_history omitted: message too large]`.
- La inspección de la transcripción sin procesar en disco es la alternativa cuando necesitas la transcripción completa byte por byte.

## Política de herramientas

Los subagentes usan primero el mismo perfil y la misma canalización de política de herramientas que el agente padre u objetivo. Después de eso, OpenClaw aplica la capa de restricciones de subagente.

Sin un `tools.profile` restrictivo, los subagentes reciben **todas las herramientas excepto las herramientas de sesión** y las herramientas de sistema:

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

`sessions_history` también sigue siendo aquí una vista de recuerdo acotada y saneada; no es un volcado de transcripción sin procesar.

Cuando `maxSpawnDepth >= 2`, los subagentes orquestadores de profundidad 1 reciben además `sessions_spawn`, `subagents`, `sessions_list` y `sessions_history` para que puedan gestionar sus hijos.

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

`tools.subagents.tools.allow` es un filtro final de solo permitir. Puede restringir el conjunto de herramientas ya resuelto, pero no puede **volver a agregar** una herramienta eliminada por `tools.profile`. Por ejemplo, `tools.profile: "coding"` incluye `web_search`/`web_fetch`, pero no la herramienta `browser`. Para permitir que los subagentes con perfil de codificación usen automatización de navegador, agrega browser en la etapa de perfil:

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

Usa `agents.list[].tools.alsoAllow: ["browser"]` por agente cuando solo un agente deba obtener automatización de navegador.

## Concurrencia

Los subagentes usan un carril de cola dedicado dentro del proceso:

- **Nombre del carril:** `subagent`
- **Concurrencia:** `agents.defaults.subagents.maxConcurrent` (valor predeterminado `8`)

## Vitalidad y recuperación

OpenClaw no trata la ausencia de `endedAt` como prueba permanente de que un subagente sigue vivo. Las ejecuciones sin finalizar que superan la ventana de ejecución obsoleta dejan de contar como activas/pendientes en `/subagents list`, resúmenes de estado, compuertas de finalización de descendientes y comprobaciones de concurrencia por sesión.

Después de un reinicio del Gateway, las ejecuciones restauradas obsoletas sin finalizar se depuran salvo que su sesión hija esté marcada como `abortedLastRun: true`. Esas sesiones hijas abortadas por reinicio permanecen recuperables mediante el flujo de recuperación de subagentes huérfanos, que envía un mensaje sintético de reanudación antes de limpiar el marcador de abortado.

La recuperación automática tras reinicio está acotada por sesión hija. Si el mismo hijo subagente se acepta para recuperación de huérfanos repetidamente dentro de la ventana de reatasco rápido, OpenClaw persiste una lápida de recuperación en esa sesión y deja de reanudarla automáticamente en reinicios posteriores. Ejecuta `openclaw tasks maintenance --apply` para conciliar el registro de tarea, u `openclaw doctor --fix` para limpiar banderas de recuperación abortada obsoletas en sesiones con lápida.

<Note>
Si la generación de un subagente falla con Gateway `PAIRING_REQUIRED` / `scope-upgrade`, revisa el llamador RPC antes de editar el estado de emparejamiento. La coordinación interna de `sessions_spawn` debe conectarse como `client.id: "gateway-client"` con `client.mode: "backend"` mediante autenticación directa de loopback con token/contraseña compartidos; esa ruta no depende de la línea base de alcance de dispositivo emparejado de la CLI. Los llamadores remotos, `deviceIdentity` explícito, rutas explícitas de token de dispositivo y clientes de navegador/Node siguen necesitando la aprobación normal del dispositivo para ampliaciones de alcance.
</Note>

## Detención

- Enviar `/stop` en el chat solicitante aborta la sesión solicitante y detiene cualquier ejecución activa de subagente generada desde ella, propagándose a los hijos anidados.
- `/subagents kill <id>` detiene un subagente específico y se propaga a sus hijos.

## Limitaciones

- El anuncio de subagente es de **mejor esfuerzo**. Si el gateway se reinicia, se pierde el trabajo pendiente de "anunciar de vuelta".
- Los subagentes siguen compartiendo los mismos recursos del proceso gateway; trata `maxConcurrent` como una válvula de seguridad.
- `sessions_spawn` siempre es no bloqueante: devuelve `{ status: "accepted", runId, childSessionKey }` inmediatamente.
- El contexto de subagente solo inyecta `AGENTS.md`, `TOOLS.md`, `SOUL.md`, `IDENTITY.md` y `USER.md` (sin `MEMORY.md`, `HEARTBEAT.md` ni `BOOTSTRAP.md`).
- La profundidad máxima de anidamiento es 5 (rango de `maxSpawnDepth`: 1–5). Se recomienda la profundidad 2 para la mayoría de los casos de uso.
- `maxChildrenPerAgent` limita los hijos activos por sesión (valor predeterminado `5`, rango `1–20`).

## Relacionado

- [Agentes ACP](/es/tools/acp-agents)
- [Envío de agente](/es/tools/agent-send)
- [Tareas en segundo plano](/es/automation/tasks)
- [Herramientas de sandbox multiagente](/es/tools/multi-agent-sandbox-tools)

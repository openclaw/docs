---
read_when:
    - Quieres trabajo en segundo plano/paralelo mediante el agente
    - Estás cambiando `sessions_spawn` o la política de herramientas de subagentes
    - Estás implementando o solucionando problemas de sesiones de subagentes vinculadas a hilos
summary: 'Subagentes: generar ejecuciones aisladas de agente que anuncian los resultados de vuelta al chat solicitante'
title: Subagentes
x-i18n:
    generated_at: "2026-04-24T05:56:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 23202b1761e372e547b02183cb68056043aed04b5620db8b222cbfc7e6cd97ab
    source_path: tools/subagents.md
    workflow: 15
---

Los subagentes son ejecuciones en segundo plano de agentes generadas desde una ejecución existente de un agente. Se ejecutan en su propia sesión (`agent:<agentId>:subagent:<uuid>`) y, al terminar, **anuncian** su resultado de vuelta al canal de chat solicitante. Cada ejecución de subagente se rastrea como una [tarea en segundo plano](/es/automation/tasks).

## Comando slash

Usa `/subagents` para inspeccionar o controlar ejecuciones de subagentes de la **sesión actual**:

- `/subagents list`
- `/subagents kill <id|#|all>`
- `/subagents log <id|#> [limit] [tools]`
- `/subagents info <id|#>`
- `/subagents send <id|#> <message>`
- `/subagents steer <id|#> <message>`
- `/subagents spawn <agentId> <task> [--model <model>] [--thinking <level>]`

Controles de binding de hilo:

Estos comandos funcionan en canales que admiten bindings persistentes de hilos. Consulta **Canales compatibles con hilos** más abajo.

- `/focus <subagent-label|session-key|session-id|session-label>`
- `/unfocus`
- `/agents`
- `/session idle <duration|off>`
- `/session max-age <duration|off>`

`/subagents info` muestra metadatos de ejecución (estado, marcas de tiempo, id de sesión, ruta de transcripción, limpieza).
Usa `sessions_history` para una vista de recuperación acotada y filtrada por seguridad; inspecciona la
ruta de transcripción en disco cuando necesites la transcripción completa sin procesar.

### Comportamiento de generación

`/subagents spawn` inicia un subagente en segundo plano como comando de usuario, no como relevo interno, y envía una actualización final de finalización de vuelta al chat solicitante cuando la ejecución termina.

- El comando de generación no bloquea; devuelve inmediatamente un id de ejecución.
- Al completarse, el subagente anuncia un mensaje de resumen/resultado de vuelta al canal de chat solicitante.
- La entrega de finalización está basada en push. Una vez generado, no sondees `/subagents list`,
  `sessions_list` o `sessions_history` en un bucle solo para esperar a que
  termine; inspecciona el estado solo bajo demanda para depuración o intervención.
- Al completarse, OpenClaw cierra por mejor esfuerzo las pestañas/procesos de navegador rastreados abiertos por esa sesión de subagente antes de que continúe el flujo de limpieza del anuncio.
- Para generaciones manuales, la entrega es resiliente:
  - OpenClaw prueba primero la entrega directa `agent` con una clave de idempotencia estable.
  - Si la entrega directa falla, recurre al enrutamiento por cola.
  - Si el enrutamiento por cola aún no está disponible, se reintenta el anuncio con un retroceso exponencial corto antes de desistir definitivamente.
- La entrega de finalización conserva la ruta resuelta del solicitante:
  - las rutas de finalización vinculadas a hilo o conversación tienen prioridad cuando están disponibles
  - si el origen de la finalización solo proporciona un canal, OpenClaw rellena el destino/cuenta que faltan a partir de la ruta resuelta de la sesión solicitante (`lastChannel` / `lastTo` / `lastAccountId`) para que la entrega directa siga funcionando
- La transferencia de finalización a la sesión solicitante es un contexto interno generado en tiempo de ejecución (no texto creado por el usuario) e incluye:
  - `Result` (último texto visible de respuesta `assistant`, o en su defecto texto saneado más reciente de `tool`/`toolResult`; las ejecuciones fallidas terminales no reutilizan texto de respuesta capturado)
  - `Status` (`completed successfully` / `failed` / `timed out` / `unknown`)
  - estadísticas compactas de tiempo de ejecución/tokens
  - una instrucción de entrega que indica al agente solicitante que reescriba en voz normal de asistente (no reenvíe metadatos internos sin procesar)
- `--model` y `--thinking` sobrescriben los valores predeterminados para esa ejecución concreta.
- Usa `info`/`log` para inspeccionar detalles y salida después de la finalización.
- `/subagents spawn` es modo de un solo uso (`mode: "run"`). Para sesiones persistentes vinculadas a hilos, usa `sessions_spawn` con `thread: true` y `mode: "session"`.
- Para sesiones de harness ACP (Codex, Claude Code, Gemini CLI), usa `sessions_spawn` con `runtime: "acp"` y consulta [Agentes ACP](/es/tools/acp-agents), especialmente el [modelo de entrega ACP](/es/tools/acp-agents#delivery-model) al depurar finalizaciones o bucles agente a agente.

Objetivos principales:

- Paralelizar trabajo de “investigación / tarea larga / herramienta lenta” sin bloquear la ejecución principal.
- Mantener los subagentes aislados por defecto (separación de sesión + sandboxing opcional).
- Mantener la superficie de herramientas difícil de usar mal: los subagentes **no** reciben herramientas de sesión por defecto.
- Admitir profundidad configurable de anidamiento para patrones de orquestador.

Nota de coste: cada subagente tiene por defecto su **propio** contexto y uso de tokens. Para tareas pesadas o
repetitivas, establece un modelo más barato para los subagentes y mantén tu agente principal en un
modelo de mayor calidad. Puedes configurarlo mediante `agents.defaults.subagents.model` o sobrescrituras
por agente. Cuando un hijo realmente necesite la transcripción actual del solicitante, el agente puede solicitar
`context: "fork"` en esa generación concreta.

## Herramienta

Usa `sessions_spawn`:

- Inicia una ejecución de subagente (`deliver: false`, vía global: `subagent`)
- Luego ejecuta un paso de anuncio y publica la respuesta del anuncio en el canal de chat solicitante
- Modelo predeterminado: hereda del llamador salvo que establezcas `agents.defaults.subagents.model` (o por agente `agents.list[].subagents.model`); un `sessions_spawn.model` explícito sigue teniendo prioridad.
- Thinking predeterminado: hereda del llamador salvo que establezcas `agents.defaults.subagents.thinking` (o por agente `agents.list[].subagents.thinking`); un `sessions_spawn.thinking` explícito sigue teniendo prioridad.
- Tiempo de espera predeterminado de ejecución: si se omite `sessions_spawn.runTimeoutSeconds`, OpenClaw usa `agents.defaults.subagents.runTimeoutSeconds` cuando está establecido; en caso contrario recurre a `0` (sin tiempo de espera).

Parámetros de la herramienta:

- `task` (obligatorio)
- `label?` (opcional)
- `agentId?` (opcional; generar bajo otro id de agente si está permitido)
- `model?` (opcional; sobrescribe el modelo del subagente; los valores no válidos se omiten y el subagente se ejecuta con el modelo predeterminado con una advertencia en el resultado de la herramienta)
- `thinking?` (opcional; sobrescribe el nivel de thinking para la ejecución del subagente)
- `runTimeoutSeconds?` (usa por defecto `agents.defaults.subagents.runTimeoutSeconds` cuando está establecido, en caso contrario `0`; cuando se establece, la ejecución del subagente se interrumpe tras N segundos)
- `thread?` (predeterminado `false`; cuando es `true`, solicita binding de hilo del canal para esta sesión de subagente)
- `mode?` (`run|session`)
  - el valor predeterminado es `run`
  - si `thread: true` y se omite `mode`, el valor predeterminado pasa a ser `session`
  - `mode: "session"` requiere `thread: true`
- `cleanup?` (`delete|keep`, predeterminado `keep`)
- `sandbox?` (`inherit|require`, predeterminado `inherit`; `require` rechaza la generación salvo que el tiempo de ejecución hijo objetivo esté en sandbox)
- `context?` (`isolated|fork`, predeterminado `isolated`; solo subagentes nativos)
  - `isolated` crea una transcripción hija limpia y es el valor predeterminado.
  - `fork` bifurca la transcripción actual del solicitante en la sesión hija para que el hijo comience con el mismo contexto de conversación.
  - Usa `fork` solo cuando el hijo necesite la transcripción actual. Para trabajo acotado, omite `context`.
- `sessions_spawn` **no** acepta parámetros de entrega de canal (`target`, `channel`, `to`, `threadId`, `replyTo`, `transport`). Para la entrega, usa `message`/`sessions_send` desde la ejecución generada.

## Sesiones vinculadas a hilos

Cuando los bindings de hilo están habilitados para un canal, un subagente puede permanecer vinculado a un hilo para que los mensajes posteriores del usuario en ese hilo sigan enrutándose a la misma sesión de subagente.

### Canales compatibles con hilos

- Discord (actualmente el único canal compatible): admite sesiones persistentes de subagente vinculadas a hilos (`sessions_spawn` con `thread: true`), controles manuales de hilo (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`) y claves del adaptador `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours` y `channels.discord.threadBindings.spawnSubagentSessions`.

Flujo rápido:

1. Genera con `sessions_spawn` usando `thread: true` (y opcionalmente `mode: "session"`).
2. OpenClaw crea o vincula un hilo a ese destino de sesión en el canal activo.
3. Las respuestas y mensajes posteriores en ese hilo se enrutan a la sesión vinculada.
4. Usa `/session idle` para inspeccionar/actualizar el desenfoque automático por inactividad y `/session max-age` para controlar el límite rígido.
5. Usa `/unfocus` para desvincular manualmente.

Controles manuales:

- `/focus <target>` vincula el hilo actual (o crea uno) a un destino de subagente/sesión.
- `/unfocus` elimina el binding del hilo actualmente vinculado.
- `/agents` lista ejecuciones activas y estado de binding (`thread:<id>` o `unbound`).
- `/session idle` y `/session max-age` solo funcionan para hilos vinculados enfocados.

Interruptores de configuración:

- Valor global predeterminado: `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`
- La sobrescritura por canal y las claves de auto-binding de generación son específicas del adaptador. Consulta **Canales compatibles con hilos** más arriba.

Consulta [Referencia de configuración](/es/gateway/configuration-reference) y [Comandos slash](/es/tools/slash-commands) para ver los detalles actuales del adaptador.

Lista de permitidos:

- `agents.list[].subagents.allowAgents`: lista de id de agentes que pueden seleccionarse mediante `agentId` (`["*"]` para permitir cualquiera). Predeterminado: solo el agente solicitante.
- `agents.defaults.subagents.allowAgents`: lista de permitidos predeterminada de agentes objetivo usada cuando el agente solicitante no establece su propio `subagents.allowAgents`.
- Protección de herencia de sandbox: si la sesión solicitante está en sandbox, `sessions_spawn` rechaza destinos que se ejecutarían sin sandbox.
- `agents.defaults.subagents.requireAgentId` / `agents.list[].subagents.requireAgentId`: cuando es true, bloquea llamadas `sessions_spawn` que omiten `agentId` (fuerza selección explícita de perfil). Predeterminado: false.

Descubrimiento:

- Usa `agents_list` para ver qué id de agentes están actualmente permitidos para `sessions_spawn`.

Archivado automático:

- Las sesiones de subagente se archivan automáticamente después de `agents.defaults.subagents.archiveAfterMinutes` (predeterminado: 60).
- El archivado usa `sessions.delete` y renombra la transcripción a `*.deleted.<timestamp>` (misma carpeta).
- `cleanup: "delete"` archiva inmediatamente después del anuncio (aun así conserva la transcripción mediante cambio de nombre).
- El archivado automático es por mejor esfuerzo; los temporizadores pendientes se pierden si el gateway se reinicia.
- `runTimeoutSeconds` **no** archiva automáticamente; solo detiene la ejecución. La sesión permanece hasta el archivado automático.
- El archivado automático se aplica por igual a sesiones de profundidad 1 y profundidad 2.
- La limpieza del navegador es independiente de la limpieza de archivado: las pestañas/procesos del navegador rastreados se cierran por mejor esfuerzo cuando termina la ejecución, incluso si se conserva el registro de la transcripción/sesión.

## Subagentes anidados

Por defecto, los subagentes no pueden generar sus propios subagentes (`maxSpawnDepth: 1`). Puedes habilitar un nivel de anidamiento estableciendo `maxSpawnDepth: 2`, lo que permite el **patrón orquestador**: principal → subagente orquestador → sub-subagentes trabajadores.

### Cómo habilitarlo

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxSpawnDepth: 2, // permitir que los subagentes generen hijos (predeterminado: 1)
        maxChildrenPerAgent: 5, // máximo de hijos activos por sesión de agente (predeterminado: 5)
        maxConcurrent: 8, // límite global de concurrencia de la vía (predeterminado: 8)
        runTimeoutSeconds: 900, // tiempo de espera predeterminado para sessions_spawn cuando se omite (0 = sin tiempo de espera)
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

### Cadena de anuncios

Los resultados fluyen de vuelta hacia arriba en la cadena:

1. El trabajador de profundidad 2 termina → anuncia a su padre (orquestador de profundidad 1)
2. El orquestador de profundidad 1 recibe el anuncio, sintetiza resultados, termina → anuncia al principal
3. El agente principal recibe el anuncio y lo entrega al usuario

Cada nivel solo ve anuncios de sus hijos directos.

Guía operativa:

- Inicia el trabajo del hijo una sola vez y espera eventos de finalización en lugar de construir bucles de sondeo alrededor de `sessions_list`, `sessions_history`, `/subagents list` o comandos `exec` con `sleep`.
- Si llega un evento de finalización de un hijo después de que ya enviaste la respuesta final, el seguimiento correcto es el token silencioso exacto `NO_REPLY` / `no_reply`.

### Política de herramientas por profundidad

- El rol y el alcance de control se escriben en los metadatos de la sesión en el momento de la generación. Eso evita que claves de sesión planas o restauradas recuperen accidentalmente privilegios de orquestador.
- **Profundidad 1 (orquestador, cuando `maxSpawnDepth >= 2`)**: obtiene `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history` para poder gestionar sus hijos. Otras herramientas de sesión/sistema siguen denegadas.
- **Profundidad 1 (hoja, cuando `maxSpawnDepth == 1`)**: sin herramientas de sesión (comportamiento predeterminado actual).
- **Profundidad 2 (trabajador hoja)**: sin herramientas de sesión — `sessions_spawn` siempre se deniega en profundidad 2. No puede generar más hijos.

### Límite de generación por agente

Cada sesión de agente (a cualquier profundidad) puede tener como máximo `maxChildrenPerAgent` (predeterminado: 5) hijos activos al mismo tiempo. Esto evita una expansión descontrolada desde un único orquestador.

### Detención en cascada

Detener un orquestador de profundidad 1 detiene automáticamente todos sus hijos de profundidad 2:

- `/stop` en el chat principal detiene todos los agentes de profundidad 1 y se propaga a sus hijos de profundidad 2.
- `/subagents kill <id>` detiene un subagente específico y se propaga a sus hijos.
- `/subagents kill all` detiene todos los subagentes del solicitante y se propaga.

## Autenticación

La autenticación del subagente se resuelve por **id de agente**, no por tipo de sesión:

- La clave de sesión del subagente es `agent:<agentId>:subagent:<uuid>`.
- El almacén de autenticación se carga desde el `agentDir` de ese agente.
- Los perfiles de autenticación del agente principal se fusionan como **respaldo**; los perfiles del agente sobrescriben los perfiles principales en caso de conflicto.

Nota: la fusión es aditiva, así que los perfiles principales siempre están disponibles como respaldo. La autenticación totalmente aislada por agente aún no es compatible.

## Anuncio

Los subagentes informan de vuelta mediante un paso de anuncio:

- El paso de anuncio se ejecuta dentro de la sesión del subagente (no en la sesión del solicitante).
- Si el subagente responde exactamente `ANNOUNCE_SKIP`, no se publica nada.
- Si el texto más reciente del asistente es el token silencioso exacto `NO_REPLY` / `no_reply`,
  la salida del anuncio se suprime aunque antes hubiera habido progreso visible.
- En caso contrario, la entrega depende de la profundidad del solicitante:
  - las sesiones solicitantes de nivel superior usan una llamada de seguimiento `agent` con entrega externa (`deliver=true`)
  - las sesiones solicitantes de subagente anidadas reciben una inyección interna de seguimiento (`deliver=false`) para que el orquestador pueda sintetizar resultados de hijos dentro de la sesión
  - si una sesión solicitante de subagente anidada ya no existe, OpenClaw recurre al solicitante de esa sesión cuando está disponible
- Para las sesiones solicitantes de nivel superior, la entrega directa en modo de finalización primero resuelve cualquier ruta vinculada de conversación/hilo y sobrescritura de hook, luego rellena los campos faltantes de objetivo de canal a partir de la ruta almacenada de la sesión solicitante. Esto mantiene las finalizaciones en el chat/tema correctos incluso cuando el origen de la finalización solo identifica el canal.
- La agregación de finalización de hijos se limita a la ejecución solicitante actual al construir hallazgos de finalización anidados, evitando que salidas antiguas de hijos de ejecuciones previas se filtren al anuncio actual.
- Las respuestas de anuncio conservan el enrutamiento de hilo/tema cuando está disponible en los adaptadores de canal.
- El contexto de anuncio se normaliza a un bloque estable de evento interno:
  - origen (`subagent` o `cron`)
  - clave/id de la sesión hija
  - tipo de anuncio + etiqueta de tarea
  - línea de estado derivada del resultado en tiempo de ejecución (`success`, `error`, `timeout` o `unknown`)
  - contenido del resultado seleccionado a partir del último texto visible del asistente o, en su defecto, del texto saneado más reciente de `tool`/`toolResult`; las ejecuciones fallidas terminales informan del estado de fallo sin reproducir el texto de respuesta capturado
  - una instrucción de seguimiento que describe cuándo responder frente a cuándo permanecer en silencio
- `Status` no se infiere a partir de la salida del modelo; proviene de señales del resultado de ejecución.
- En caso de tiempo de espera, si el hijo solo llegó a realizar llamadas de herramientas, el anuncio puede contraer ese historial en un breve resumen de progreso parcial en lugar de reproducir salida sin procesar de herramientas.

Las cargas de anuncio incluyen una línea de estadísticas al final (incluso cuando están envueltas):

- Tiempo de ejecución (por ejemplo, `runtime 5m12s`)
- Uso de tokens (entrada/salida/total)
- Coste estimado cuando el precio del modelo está configurado (`models.providers.*.models[].cost`)
- `sessionKey`, `sessionId` y ruta de transcripción (para que el agente principal pueda obtener el historial mediante `sessions_history` o inspeccionar el archivo en disco)
- Los metadatos internos están pensados solo para orquestación; las respuestas orientadas al usuario deben reescribirse con voz normal de asistente.

`sessions_history` es la ruta de orquestación más segura:

- la recuperación del asistente se normaliza primero:
  - se eliminan las etiquetas de thinking
  - se eliminan los bloques de scaffolding `<relevant-memories>` / `<relevant_memories>`
  - se eliminan bloques de carga XML de llamada a herramientas en texto plano como `<tool_call>...</tool_call>`,
    `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>` y
    `<function_calls>...</function_calls>`, incluidas las cargas
    truncadas que nunca se cierran limpiamente
  - se elimina el scaffolding degradado de llamadas/resultados de herramientas y los marcadores de contexto histórico
  - se eliminan tokens de control del modelo filtrados como `<|assistant|>`, otros tokens ASCII
    `<|...|>` y variantes de ancho completo `<｜...｜>`
  - se elimina XML malformado de llamadas a herramientas de MiniMax
- se redacta texto similar a credenciales/tokens
- los bloques largos pueden truncarse
- historiales muy grandes pueden eliminar filas antiguas o reemplazar una fila sobredimensionada por
  `[sessions_history omitted: message too large]`
- la inspección de la transcripción sin procesar en disco es la alternativa cuando necesitas la transcripción completa byte por byte

## Política de herramientas (herramientas de subagente)

Por defecto, los subagentes obtienen **todas las herramientas excepto herramientas de sesión** y herramientas del sistema:

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

`sessions_history` sigue siendo aquí también una vista de recuperación acotada y saneada; no es
un volcado sin procesar de la transcripción.

Cuando `maxSpawnDepth >= 2`, los subagentes orquestadores de profundidad 1 reciben además `sessions_spawn`, `subagents`, `sessions_list` y `sessions_history` para poder gestionar a sus hijos.

Sobrescríbelo mediante configuración:

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
        // si se establece allow, pasa a ser solo permitido (deny sigue ganando)
        // allow: ["read", "exec", "process"]
      },
    },
  },
}
```

## Concurrencia

Los subagentes usan una vía de cola dedicada dentro del proceso:

- Nombre de la vía: `subagent`
- Concurrencia: `agents.defaults.subagents.maxConcurrent` (predeterminado `8`)

## Detención

- Enviar `/stop` en el chat solicitante aborta la sesión solicitante y detiene cualquier ejecución activa de subagente generada desde ella, propagándose a hijos anidados.
- `/subagents kill <id>` detiene un subagente específico y se propaga a sus hijos.

## Limitaciones

- El anuncio del subagente es **por mejor esfuerzo**. Si el gateway se reinicia, se pierde el trabajo pendiente de “anunciar de vuelta”.
- Los subagentes siguen compartiendo los mismos recursos del proceso del gateway; trata `maxConcurrent` como una válvula de seguridad.
- `sessions_spawn` siempre es no bloqueante: devuelve `{ status: "accepted", runId, childSessionKey }` inmediatamente.
- El contexto del subagente solo inyecta `AGENTS.md` + `TOOLS.md` (no `SOUL.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` ni `BOOTSTRAP.md`).
- La profundidad máxima de anidamiento es 5 (rango de `maxSpawnDepth`: 1–5). La profundidad 2 se recomienda para la mayoría de los casos de uso.
- `maxChildrenPerAgent` limita los hijos activos por sesión (predeterminado: 5, rango: 1–20).

## Relacionado

- [Agentes ACP](/es/tools/acp-agents)
- [Herramientas de sandbox multiagente](/es/tools/multi-agent-sandbox-tools)
- [Agent send](/es/tools/agent-send)

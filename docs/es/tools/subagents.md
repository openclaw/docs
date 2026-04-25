---
read_when:
    - Quieres trabajo en segundo plano/en paralelo mediante el agente
    - Estás cambiando la política de la herramienta `sessions_spawn` o de subagentes
    - Estás implementando o solucionando problemas de sesiones de subagentes vinculadas a hilos
summary: 'Subagentes: crear ejecuciones aisladas de agentes que anuncian los resultados de vuelta en el chat solicitante'
title: Subagentes
x-i18n:
    generated_at: "2026-04-25T18:22:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: 70195000c4326baba38a9a096dc8d6db178f754f345ad05d122902ee1216ab1c
    source_path: tools/subagents.md
    workflow: 15
---

Los subagentes son ejecuciones de agentes en segundo plano creadas desde una ejecución existente de un agente. Se ejecutan en su propia sesión (`agent:<agentId>:subagent:<uuid>`) y, cuando terminan, **anuncian** su resultado de vuelta en el canal de chat del solicitante. Cada ejecución de subagente se registra como una [tarea en segundo plano](/es/automation/tasks).

## Comando slash

Usa `/subagents` para inspeccionar o controlar ejecuciones de subagentes de la **sesión actual**:

- `/subagents list`
- `/subagents kill <id|#|all>`
- `/subagents log <id|#> [limit] [tools]`
- `/subagents info <id|#>`
- `/subagents send <id|#> <message>`
- `/subagents steer <id|#> <message>`
- `/subagents spawn <agentId> <task> [--model <model>] [--thinking <level>]`

Controles de vinculación a hilos:

Estos comandos funcionan en canales que admiten vinculaciones persistentes a hilos. Consulta **Canales compatibles con hilos** más abajo.

- `/focus <subagent-label|session-key|session-id|session-label>`
- `/unfocus`
- `/agents`
- `/session idle <duration|off>`
- `/session max-age <duration|off>`

`/subagents info` muestra metadatos de la ejecución (estado, marcas de tiempo, id de sesión, ruta de la transcripción, limpieza).
Usa `sessions_history` para una vista acotada y filtrada por seguridad; inspecciona la
ruta de la transcripción en disco cuando necesites la transcripción completa sin procesar.

### Comportamiento de creación

`/subagents spawn` inicia un subagente en segundo plano como un comando de usuario, no como un relay interno, y envía una actualización final de finalización de vuelta al chat del solicitante cuando termina la ejecución.

- El comando de creación no bloquea; devuelve inmediatamente un id de ejecución.
- Al completarse, el subagente anuncia un mensaje de resumen/resultado de vuelta al canal de chat del solicitante.
- La entrega de finalización se basa en push. Una vez creado, no consultes `/subagents list`,
  `sessions_list` ni `sessions_history` en bucle solo para esperar a que termine;
  inspecciona el estado solo bajo demanda para depuración o intervención.
- Al completarse, OpenClaw intenta cerrar, en la medida de lo posible, las pestañas/procesos de navegador rastreados abiertos por esa sesión de subagente antes de que continúe el flujo de limpieza del anuncio.
- Para creaciones manuales, la entrega es resistente:
  - OpenClaw intenta primero la entrega directa al `agent` con una clave de idempotencia estable.
  - Si la entrega directa falla, usa como respaldo el enrutamiento por cola.
  - Si el enrutamiento por cola sigue sin estar disponible, el anuncio se reintenta con un corto retroceso exponencial antes del abandono final.
- La entrega de finalización conserva la ruta resuelta del solicitante:
  - las rutas de finalización vinculadas a hilos o a conversaciones tienen prioridad cuando están disponibles
  - si el origen de la finalización solo proporciona un canal, OpenClaw completa el destino/cuenta que faltan a partir de la ruta resuelta de la sesión solicitante (`lastChannel` / `lastTo` / `lastAccountId`) para que la entrega directa siga funcionando
- La transferencia de finalización a la sesión solicitante es contexto interno generado en ejecución (no texto escrito por el usuario) e incluye:
  - `Result` (último texto visible de respuesta del `assistant`, o en su defecto el último texto saneado de `tool/toolResult`; las ejecuciones fallidas terminales no reutilizan el texto de respuesta capturado)
  - `Status` (`completed successfully` / `failed` / `timed out` / `unknown`)
  - estadísticas compactas de ejecución/tokens
  - una instrucción de entrega que indica al agente solicitante que reescriba en voz normal de asistente (no reenviar metadatos internos sin procesar)
- `--model` y `--thinking` sobrescriben los valores predeterminados para esa ejecución concreta.
- Usa `info`/`log` para inspeccionar detalles y salida después de completarse.
- `/subagents spawn` es modo de una sola ejecución (`mode: "run"`). Para sesiones persistentes vinculadas a hilos, usa `sessions_spawn` con `thread: true` y `mode: "session"`.
- Para sesiones de harness ACP (Codex, Claude Code, Gemini CLI), usa `sessions_spawn` con `runtime: "acp"` y consulta [Agentes ACP](/es/tools/acp-agents), especialmente el [modelo de entrega ACP](/es/tools/acp-agents#delivery-model) al depurar finalizaciones o bucles agente a agente.

Objetivos principales:

- Paralelizar trabajo de “investigación / tarea larga / herramienta lenta” sin bloquear la ejecución principal.
- Mantener los subagentes aislados de forma predeterminada (separación de sesiones + sandboxing opcional).
- Mantener la superficie de herramientas difícil de usar incorrectamente: los subagentes **no** reciben herramientas de sesión por defecto.
- Admitir profundidad de anidamiento configurable para patrones de orquestación.

Nota de costo: cada subagente tiene su **propio** contexto y uso de tokens por defecto. Para tareas pesadas o
repetitivas, define un modelo más barato para los subagentes y mantén tu agente principal en un
modelo de mayor calidad. Puedes configurarlo con `agents.defaults.subagents.model` o con
anulaciones por agente. Cuando un hijo realmente necesita la transcripción actual del solicitante, el agente puede pedir
`context: "fork"` en esa creación concreta.

## Modos de contexto

Los subagentes nativos comienzan aislados a menos que el llamador solicite explícitamente bifurcar la
transcripción actual.

| Modo       | Cuándo usarlo                                                                                                                          | Comportamiento                                                                     |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `isolated` | Investigación nueva, implementación independiente, trabajo con herramientas lentas o cualquier cosa que pueda explicarse brevemente en el texto de la tarea | Crea una transcripción hija limpia. Este es el valor predeterminado y mantiene menor el uso de tokens. |
| `fork`     | Trabajo que depende de la conversación actual, resultados previos de herramientas o instrucciones matizadas ya presentes en la transcripción del solicitante | Ramifica la transcripción del solicitante en la sesión hija antes de que empiece el hijo. |

Usa `fork` con moderación. Es para delegación sensible al contexto, no un sustituto
de redactar un prompt de tarea claro.

## Herramienta

Usa `sessions_spawn`:

- Inicia una ejecución de subagente (`deliver: false`, carril global: `subagent`)
- Luego ejecuta un paso de anuncio y publica la respuesta de anuncio en el canal de chat del solicitante
- Modelo predeterminado: hereda del llamador a menos que definas `agents.defaults.subagents.model` (o `agents.list[].subagents.model` por agente); un `sessions_spawn.model` explícito sigue teniendo prioridad.
- Razonamiento predeterminado: hereda del llamador a menos que definas `agents.defaults.subagents.thinking` (o `agents.list[].subagents.thinking` por agente); un `sessions_spawn.thinking` explícito sigue teniendo prioridad.
- Tiempo de espera de ejecución predeterminado: si se omite `sessions_spawn.runTimeoutSeconds`, OpenClaw usa `agents.defaults.subagents.runTimeoutSeconds` cuando está definido; en caso contrario usa como respaldo `0` (sin tiempo de espera).

Parámetros de la herramienta:

- `task` (obligatorio)
- `label?` (opcional)
- `agentId?` (opcional; crear bajo otro id de agente si está permitido)
- `model?` (opcional; sobrescribe el modelo del subagente; los valores no válidos se omiten y el subagente se ejecuta con el modelo predeterminado con una advertencia en el resultado de la herramienta)
- `thinking?` (opcional; sobrescribe el nivel de razonamiento para la ejecución del subagente)
- `runTimeoutSeconds?` (predeterminado a `agents.defaults.subagents.runTimeoutSeconds` cuando está definido; en caso contrario `0`; cuando se define, la ejecución del subagente se aborta después de N segundos)
- `thread?` (predeterminado `false`; cuando es `true`, solicita vinculación del hilo del canal para esta sesión de subagente)
- `mode?` (`run|session`)
  - el valor predeterminado es `run`
  - si `thread: true` y se omite `mode`, el valor predeterminado pasa a ser `session`
  - `mode: "session"` requiere `thread: true`
- `cleanup?` (`delete|keep`, predeterminado `keep`)
- `sandbox?` (`inherit|require`, predeterminado `inherit`; `require` rechaza la creación salvo que el runtime hijo de destino esté en sandbox)
- `context?` (`isolated|fork`, predeterminado `isolated`; solo subagentes nativos)
  - `isolated` crea una transcripción hija limpia y es el valor predeterminado.
  - `fork` ramifica la transcripción actual del solicitante en la sesión hija para que el hijo empiece con el mismo contexto de conversación.
  - Usa `fork` solo cuando el hijo necesite la transcripción actual. Para trabajo acotado, omite `context`.
- `sessions_spawn` **no** acepta parámetros de entrega de canal (`target`, `channel`, `to`, `threadId`, `replyTo`, `transport`). Para la entrega, usa `message`/`sessions_send` desde la ejecución creada.

## Sesiones vinculadas a hilos

Cuando las vinculaciones a hilos están habilitadas para un canal, un subagente puede permanecer vinculado a un hilo para que los mensajes posteriores del usuario en ese hilo sigan enrutándose a la misma sesión de subagente.

### Canales compatibles con hilos

- Discord (actualmente el único canal compatible): admite sesiones persistentes de subagentes vinculadas a hilos (`sessions_spawn` con `thread: true`), controles manuales de hilo (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`) y claves de adaptador `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours` y `channels.discord.threadBindings.spawnSubagentSessions`.

Flujo rápido:

1. Crea con `sessions_spawn` usando `thread: true` (y opcionalmente `mode: "session"`).
2. OpenClaw crea o vincula un hilo a ese destino de sesión en el canal activo.
3. Las respuestas y los mensajes de seguimiento en ese hilo se enrutan a la sesión vinculada.
4. Usa `/session idle` para inspeccionar/actualizar la pérdida automática de foco por inactividad y `/session max-age` para controlar el límite duro.
5. Usa `/unfocus` para desvincular manualmente.

Controles manuales:

- `/focus <target>` vincula el hilo actual (o crea uno) a un destino de subagente/sesión.
- `/unfocus` elimina la vinculación del hilo actualmente vinculado.
- `/agents` enumera las ejecuciones activas y el estado de vinculación (`thread:<id>` o `unbound`).
- `/session idle` y `/session max-age` solo funcionan para hilos vinculados con foco.

Interruptores de configuración:

- Valor global predeterminado: `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`
- Las claves de anulación por canal y de vinculación automática al crear son específicas de cada adaptador. Consulta **Canales compatibles con hilos** arriba.

Consulta [Referencia de configuración](/es/gateway/configuration-reference) y [Comandos slash](/es/tools/slash-commands) para los detalles actuales de cada adaptador.

Allowlist:

- `agents.list[].subagents.allowAgents`: lista de ids de agente que pueden seleccionarse mediante `agentId` (`["*"]` para permitir cualquiera). Predeterminado: solo el agente solicitante.
- `agents.defaults.subagents.allowAgents`: allowlist predeterminada de agentes de destino usada cuando el agente solicitante no define su propio `subagents.allowAgents`.
- Protección por herencia de sandbox: si la sesión solicitante está en sandbox, `sessions_spawn` rechaza destinos que se ejecutarían sin sandbox.
- `agents.defaults.subagents.requireAgentId` / `agents.list[].subagents.requireAgentId`: cuando es `true`, bloquea llamadas a `sessions_spawn` que omiten `agentId` (fuerza la selección explícita de perfil). Predeterminado: false.

Descubrimiento:

- Usa `agents_list` para ver qué ids de agente están permitidos actualmente para `sessions_spawn`.

Archivado automático:

- Las sesiones de subagentes se archivan automáticamente después de `agents.defaults.subagents.archiveAfterMinutes` (predeterminado: 60).
- El archivado usa `sessions.delete` y cambia el nombre de la transcripción a `*.deleted.<timestamp>` (misma carpeta).
- `cleanup: "delete"` archiva inmediatamente después del anuncio (aun así conserva la transcripción mediante cambio de nombre).
- El archivado automático es de mejor esfuerzo; los temporizadores pendientes se pierden si Gateway se reinicia.
- `runTimeoutSeconds` **no** archiva automáticamente; solo detiene la ejecución. La sesión permanece hasta el archivado automático.
- El archivado automático se aplica por igual a sesiones de profundidad 1 y profundidad 2.
- La limpieza del navegador es independiente de la limpieza de archivado: las pestañas/procesos de navegador rastreados se cierran en la medida de lo posible cuando termina la ejecución, incluso si se conserva la transcripción/el registro de la sesión.

## Subagentes anidados

De forma predeterminada, los subagentes no pueden crear sus propios subagentes (`maxSpawnDepth: 1`). Puedes habilitar un nivel de anidamiento definiendo `maxSpawnDepth: 2`, lo que permite el **patrón de orquestador**: principal → subagente orquestador → sub-subagentes trabajadores.

### Cómo habilitarlo

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxSpawnDepth: 2, // permitir que los subagentes creen hijos (predeterminado: 1)
        maxChildrenPerAgent: 5, // máximo de hijos activos por sesión de agente (predeterminado: 5)
        maxConcurrent: 8, // límite global de concurrencia del carril (predeterminado: 8)
        runTimeoutSeconds: 900, // tiempo de espera predeterminado para sessions_spawn cuando se omite (0 = sin tiempo de espera)
      },
    },
  },
}
```

### Niveles de profundidad

| Profundidad | Forma de la clave de sesión                 | Rol                                           | ¿Puede crear?                |
| ----------- | ------------------------------------------- | --------------------------------------------- | ---------------------------- |
| 0           | `agent:<id>:main`                           | Agente principal                              | Siempre                      |
| 1           | `agent:<id>:subagent:<uuid>`                | Subagente (orquestador cuando se permite profundidad 2) | Solo si `maxSpawnDepth >= 2` |
| 2           | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | Sub-subagente (trabajador hoja)              | Nunca                        |

### Cadena de anuncios

Los resultados fluyen de vuelta por la cadena:

1. El trabajador de profundidad 2 termina → anuncia a su padre (orquestador de profundidad 1)
2. El orquestador de profundidad 1 recibe el anuncio, sintetiza resultados, termina → anuncia al principal
3. El agente principal recibe el anuncio y lo entrega al usuario

Cada nivel solo ve anuncios de sus hijos directos.

Guía operativa:

- Inicia el trabajo hijo una sola vez y espera los eventos de finalización en lugar de construir bucles de sondeo
  alrededor de `sessions_list`, `sessions_history`, `/subagents list` o
  comandos `exec` con espera.
- `sessions_list` y `/subagents list` mantienen las relaciones de sesiones hijas centradas
  en trabajo en vivo: los hijos activos permanecen adjuntos, los hijos finalizados siguen visibles durante una
  breve ventana reciente y los enlaces de hijos obsoletos solo en almacén se ignoran después de su
  ventana de frescura. Esto evita que metadatos antiguos `spawnedBy` / `parentSessionKey`
  resuciten hijos fantasma después de un reinicio.
- Si un evento de finalización de un hijo llega después de que ya enviaste la respuesta final,
  el seguimiento correcto es el token silencioso exacto `NO_REPLY` / `no_reply`.

### Política de herramientas por profundidad

- El rol y el alcance de control se escriben en los metadatos de la sesión en el momento de la creación. Eso evita que claves de sesión planas o restauradas recuperen accidentalmente privilegios de orquestador.
- **Profundidad 1 (orquestador, cuando `maxSpawnDepth >= 2`)**: recibe `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history` para poder gestionar sus hijos. Otras herramientas de sesión/sistema siguen denegadas.
- **Profundidad 1 (hoja, cuando `maxSpawnDepth == 1`)**: sin herramientas de sesión (comportamiento predeterminado actual).
- **Profundidad 2 (trabajador hoja)**: sin herramientas de sesión; `sessions_spawn` siempre se deniega en profundidad 2. No puede crear más hijos.

### Límite de creación por agente

Cada sesión de agente (a cualquier profundidad) puede tener como máximo `maxChildrenPerAgent` (predeterminado: 5) hijos activos al mismo tiempo. Esto evita una expansión descontrolada desde un solo orquestador.

### Detención en cascada

Detener un orquestador de profundidad 1 detiene automáticamente todos sus hijos de profundidad 2:

- `/stop` en el chat principal detiene todos los agentes de profundidad 1 y se propaga a sus hijos de profundidad 2.
- `/subagents kill <id>` detiene un subagente específico y se propaga a sus hijos.
- `/subagents kill all` detiene todos los subagentes del solicitante y se propaga.

## Autenticación

La autenticación de subagentes se resuelve por **id de agente**, no por tipo de sesión:

- La clave de sesión del subagente es `agent:<agentId>:subagent:<uuid>`.
- El almacén de autenticación se carga desde el `agentDir` de ese agente.
- Los perfiles de autenticación del agente principal se fusionan como **respaldo**; los perfiles del agente sobrescriben los perfiles principales en caso de conflicto.

Nota: la fusión es aditiva, por lo que los perfiles principales siempre están disponibles como respaldo. La autenticación completamente aislada por agente todavía no está admitida.

## Anuncio

Los subagentes informan de vuelta mediante un paso de anuncio:

- El paso de anuncio se ejecuta dentro de la sesión del subagente (no en la sesión del solicitante).
- Si el subagente responde exactamente `ANNOUNCE_SKIP`, no se publica nada.
- Si el texto más reciente del asistente es el token silencioso exacto `NO_REPLY` / `no_reply`,
  la salida del anuncio se suprime aunque antes hubiera progreso visible.
- En caso contrario, la entrega depende de la profundidad del solicitante:
  - las sesiones solicitantes de nivel superior usan una llamada `agent` de seguimiento con entrega externa (`deliver=true`)
  - las sesiones solicitantes de subagentes anidados reciben una inyección interna de seguimiento (`deliver=false`) para que el orquestador pueda sintetizar resultados hijos dentro de la sesión
  - si una sesión solicitante de subagente anidado ya no existe, OpenClaw usa como respaldo el solicitante de esa sesión cuando está disponible
- Para sesiones solicitantes de nivel superior, la entrega directa en modo de finalización primero resuelve cualquier ruta de conversación/hilo vinculada y la anulación de hooks, y luego completa los campos faltantes de destino de canal a partir de la ruta almacenada de la sesión solicitante. Eso mantiene las finalizaciones en el chat/tema correcto incluso cuando el origen de la finalización solo identifica el canal.
- La agregación de finalizaciones hijas se limita a la ejecución solicitante actual al construir hallazgos de finalización anidada, lo que evita que salidas antiguas de hijos de ejecuciones anteriores se filtren al anuncio actual.
- Las respuestas de anuncio conservan el enrutamiento de hilo/tema cuando está disponible en los adaptadores de canal.
- El contexto del anuncio se normaliza a un bloque de evento interno estable:
  - origen (`subagent` o `cron`)
  - clave/id de la sesión hija
  - tipo de anuncio + etiqueta de tarea
  - línea de estado derivada del resultado de ejecución (`success`, `error`, `timeout` o `unknown`)
  - contenido del resultado seleccionado a partir del texto visible más reciente del asistente o, en su defecto, del texto saneado más reciente de `tool/toolResult`; las ejecuciones terminales fallidas informan el estado de fallo sin reproducir el texto de respuesta capturado
  - una instrucción de seguimiento que describe cuándo responder frente a cuándo permanecer en silencio
- `Status` no se infiere a partir de la salida del modelo; proviene de señales del resultado de ejecución.
- En caso de tiempo de espera, si el hijo solo llegó a llamadas de herramientas, el anuncio puede reducir ese historial a un breve resumen de progreso parcial en lugar de reproducir la salida sin procesar de las herramientas.

Las cargas útiles de anuncio incluyen una línea de estadísticas al final (incluso cuando están envueltas):

- Ejecución (por ejemplo, `runtime 5m12s`)
- Uso de tokens (entrada/salida/total)
- Costo estimado cuando el precio del modelo está configurado (`models.providers.*.models[].cost`)
- `sessionKey`, `sessionId` y ruta de la transcripción (para que el agente principal pueda obtener el historial mediante `sessions_history` o inspeccionar el archivo en disco)
- Los metadatos internos están pensados solo para orquestación; las respuestas orientadas al usuario deben reescribirse con una voz normal de asistente.

`sessions_history` es la ruta de orquestación más segura:

- primero se normaliza el historial del asistente:
  - se eliminan las etiquetas de razonamiento
  - se eliminan los bloques de andamiaje `<relevant-memories>` / `<relevant_memories>`
  - se eliminan los bloques XML de llamadas de herramientas en texto plano como `<tool_call>...</tool_call>`,
    `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>` y
    `<function_calls>...</function_calls>`, incluidos los payloads truncados
    que nunca se cierran limpiamente
  - se eliminan el andamiaje degradado de llamadas/resultados de herramientas y los marcadores de contexto histórico
  - se eliminan los tokens de control del modelo filtrados como `<|assistant|>`, otros tokens ASCII
    `<|...|>` y variantes de ancho completo `<｜...｜>`
  - se elimina XML malformado de llamadas de herramientas de MiniMax
- el texto tipo credencial/token se redacta
- los bloques largos pueden truncarse
- los historiales muy grandes pueden eliminar filas antiguas o reemplazar una fila sobredimensionada por
  `[sessions_history omitted: message too large]`
- la inspección de la transcripción sin procesar en disco es el respaldo cuando necesitas la transcripción completa byte a byte

## Política de herramientas (herramientas de subagentes)

Los subagentes usan primero el mismo perfil y flujo de política de herramientas que el agente
padre o agente de destino. Después de eso, OpenClaw aplica la capa de restricción de subagentes.

Sin un `tools.profile` restrictivo, los subagentes obtienen **todas las herramientas excepto las
herramientas de sesión** y las herramientas de sistema:

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

`sessions_history` sigue siendo también aquí una vista de recuperación acotada y saneada; no es
un volcado de transcripción sin procesar.

Cuando `maxSpawnDepth >= 2`, los subagentes orquestadores de profundidad 1 reciben adicionalmente `sessions_spawn`, `subagents`, `sessions_list` y `sessions_history` para que puedan gestionar a sus hijos.

Sobrescribe mediante configuración:

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
        // si se define allow, pasa a ser permitir solo estos (deny sigue ganando)
        // allow: ["read", "exec", "process"]
      },
    },
  },
}
```

`tools.subagents.tools.allow` es un filtro final de solo permitidos. Puede reducir el
conjunto de herramientas ya resuelto, pero no puede volver a añadir una herramienta eliminada por
`tools.profile`. Por ejemplo, `tools.profile: "coding"` incluye
`web_search`/`web_fetch`, pero no la herramienta `browser`. Para permitir que subagentes con perfil
coding usen automatización de navegador, añade `browser` en la etapa del perfil:

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

Usa `agents.list[].tools.alsoAllow: ["browser"]` por agente cuando solo un agente
deba obtener automatización de navegador.

## Concurrencia

Los subagentes usan un carril de cola dedicado dentro del proceso:

- Nombre del carril: `subagent`
- Concurrencia: `agents.defaults.subagents.maxConcurrent` (predeterminado `8`)

## Vitalidad y recuperación

OpenClaw no trata la ausencia de `endedAt` como prueba permanente de que un subagente
siga vivo. Las ejecuciones no finalizadas más antiguas que la ventana de ejecuciones obsoletas dejan de contarse como
activas/pendientes en `/subagents list`, resúmenes de estado, restricción de finalización de descendientes
y comprobaciones de concurrencia por sesión.

Después de un reinicio de Gateway, las ejecuciones restauradas obsoletas no finalizadas se purgan salvo que su
sesión hija esté marcada con `abortedLastRun: true`. Esas sesiones hijas abortadas en reinicio
siguen siendo recuperables mediante el flujo de recuperación de huérfanos de subagentes, que
envía un mensaje sintético de reanudación antes de borrar el marcador de aborto.

## Detención

- Enviar `/stop` en el chat del solicitante aborta la sesión solicitante y detiene cualquier ejecución activa de subagente creada desde ella, propagándose a hijos anidados.
- `/subagents kill <id>` detiene un subagente específico y se propaga a sus hijos.

## Limitaciones

- El anuncio del subagente es **de mejor esfuerzo**. Si Gateway se reinicia, se pierde el trabajo pendiente de “anunciar de vuelta”.
- Los subagentes siguen compartiendo los mismos recursos del proceso de Gateway; trata `maxConcurrent` como una válvula de seguridad.
- `sessions_spawn` siempre es no bloqueante: devuelve `{ status: "accepted", runId, childSessionKey }` inmediatamente.
- El contexto del subagente solo inyecta `AGENTS.md` + `TOOLS.md` (no `SOUL.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` ni `BOOTSTRAP.md`).
- La profundidad máxima de anidamiento es 5 (rango de `maxSpawnDepth`: 1–5). Se recomienda profundidad 2 para la mayoría de los casos de uso.
- `maxChildrenPerAgent` limita los hijos activos por sesión (predeterminado: 5, rango: 1–20).

## Relacionado

- [Agentes ACP](/es/tools/acp-agents)
- [Herramientas sandbox para múltiples agentes](/es/tools/multi-agent-sandbox-tools)
- [Envío a agente](/es/tools/agent-send)

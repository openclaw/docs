---
read_when:
    - Quieres trabajo en segundo plano o en paralelo mediante el agente
    - Estás cambiando la política de herramientas de sessions_spawn o de subagentes
    - Estás implementando o solucionando problemas de sesiones de subagentes vinculadas a hilos
sidebarTitle: Sub-agents
summary: Genera ejecuciones aisladas de agentes en segundo plano que anuncian los resultados de vuelta al chat solicitante
title: Subagentes
x-i18n:
    generated_at: "2026-04-26T11:40:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: e7f2f1b8ae08026dd0f8c1b466bb7a8b044ae1d12c2ae61735dcf9f380179986
    source_path: tools/subagents.md
    workflow: 15
---

Los subagentes son ejecuciones de agentes en segundo plano generadas desde una ejecución de agente existente.
Se ejecutan en su propia sesión (`agent:<agentId>:subagent:<uuid>`) y,
cuando terminan, **anuncian** su resultado de vuelta al canal de chat
solicitante. Cada ejecución de subagente se rastrea como una
[tarea en segundo plano](/es/automation/tasks).

Objetivos principales:

- Paralelizar trabajo de "investigación / tarea larga / herramienta lenta" sin bloquear la ejecución principal.
- Mantener los subagentes aislados de forma predeterminada (separación de sesión + sandboxing opcional).
- Mantener la superficie de herramientas difícil de usar incorrectamente: los subagentes **no** obtienen herramientas de sesión de forma predeterminada.
- Admitir profundidad de anidamiento configurable para patrones de orquestador.

<Note>
**Nota de costo:** cada subagente tiene su propio contexto y uso de tokens de
forma predeterminada. Para tareas pesadas o repetitivas, configura un modelo más económico para los subagentes
y mantén tu agente principal en un modelo de mayor calidad. Configura esto mediante
`agents.defaults.subagents.model` o anulaciones por agente. Cuando un hijo
realmente necesita la transcripción actual del solicitante, el agente puede solicitar
`context: "fork"` en esa generación concreta.
</Note>

## Comando de barra

Usa `/subagents` para inspeccionar o controlar las ejecuciones de subagentes de la **sesión
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

`/subagents info` muestra metadatos de la ejecución (estado, marcas de tiempo, id de sesión,
ruta de la transcripción, limpieza). Usa `sessions_history` para una vista de recuperación
limitada y filtrada por seguridad; inspecciona la ruta de la transcripción en disco cuando
necesites la transcripción completa sin procesar.

### Controles de vinculación a hilo

Estos comandos funcionan en canales que admiten vinculaciones persistentes a hilos.
Consulta [Canales compatibles con hilos](#thread-supporting-channels) a continuación.

```text
/focus <subagent-label|session-key|session-id|session-label>
/unfocus
/agents
/session idle <duration|off>
/session max-age <duration|off>
```

### Comportamiento de generación

`/subagents spawn` inicia un subagente en segundo plano como comando de usuario (no como un
reenvío interno) y envía una actualización final de finalización de vuelta al
chat solicitante cuando la ejecución termina.

<AccordionGroup>
  <Accordion title="Finalización no bloqueante y basada en envío">
    - El comando de generación no es bloqueante; devuelve un id de ejecución inmediatamente.
    - Al finalizar, el subagente anuncia un mensaje de resumen/resultado de vuelta al canal de chat solicitante.
    - La finalización se basa en envío. Una vez generado, **no** consultes `/subagents list`, `sessions_list` o `sessions_history` en bucle solo para esperar a que termine; inspecciona el estado solo bajo demanda para depuración o intervención.
    - Al finalizar, OpenClaw intenta cerrar de la mejor manera posible las pestañas/procesos de navegador rastreados abiertos por esa sesión de subagente antes de que continúe el flujo de limpieza del anuncio.
  </Accordion>
  <Accordion title="Resiliencia de entrega de generación manual">
    - OpenClaw intenta primero la entrega directa de `agent` con una clave de idempotencia estable.
    - Si la entrega directa falla, recurre al enrutamiento en cola.
    - Si el enrutamiento en cola sigue sin estar disponible, se reintenta el anuncio con un breve retroceso exponencial antes del abandono final.
    - La entrega de finalización conserva la ruta resuelta del solicitante: las rutas de finalización vinculadas a hilo o a conversación prevalecen cuando están disponibles; si el origen de finalización solo proporciona un canal, OpenClaw completa el destino/cuenta faltante a partir de la ruta resuelta de la sesión solicitante (`lastChannel` / `lastTo` / `lastAccountId`) para que la entrega directa siga funcionando.
  </Accordion>
  <Accordion title="Metadatos de transferencia de finalización">
    La transferencia de finalización a la sesión solicitante es contexto interno
    generado en tiempo de ejecución (no texto redactado por el usuario) e incluye:

    - `Result`: el texto más reciente visible de la respuesta `assistant`; en caso contrario, el texto más reciente sanitizado de tool/toolResult. Las ejecuciones fallidas terminales no reutilizan texto de respuesta capturado.
    - `Status`: `completed successfully` / `failed` / `timed out` / `unknown`.
    - Estadísticas compactas de ejecución/tokens.
    - Una instrucción de entrega que indica al agente solicitante que reescriba en voz normal de asistente (sin reenviar metadatos internos sin procesar).

  </Accordion>
  <Accordion title="Modos y runtime ACP">
    - `--model` y `--thinking` anulan los valores predeterminados para esa ejecución concreta.
    - Usa `info`/`log` para inspeccionar detalles y salida después de la finalización.
    - `/subagents spawn` es modo de una sola ejecución (`mode: "run"`). Para sesiones persistentes vinculadas a hilos, usa `sessions_spawn` con `thread: true` y `mode: "session"`.
    - Para sesiones de arnés ACP (Claude Code, Gemini CLI, OpenCode o Codex ACP/acpx explícito), usa `sessions_spawn` con `runtime: "acp"` cuando la herramienta anuncie ese runtime. Consulta [Modelo de entrega ACP](/es/tools/acp-agents#delivery-model) al depurar finalizaciones o bucles de agente a agente. Cuando el Plugin `codex` está habilitado, el control de chat/hilo de Codex debe preferir `/codex ...` sobre ACP a menos que el usuario solicite explícitamente ACP/acpx.
    - OpenClaw oculta `runtime: "acp"` hasta que ACP está habilitado, el solicitante no está en sandbox y hay cargado un Plugin backend como `acpx`. `runtime: "acp"` espera un id de arnés ACP externo, o una entrada `agents.list[]` con `runtime.type="acp"`; usa el runtime predeterminado de subagente para agentes normales de configuración de OpenClaw desde `agents_list`.
  </Accordion>
</AccordionGroup>

## Modos de contexto

Los subagentes nativos empiezan aislados a menos que la persona que llama solicite explícitamente bifurcar
la transcripción actual.

| Modo       | Cuándo usarlo                                                                                                                           | Comportamiento                                                                     |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `isolated` | Investigación nueva, implementación independiente, trabajo con herramientas lentas o cualquier cosa que pueda resumirse en el texto de la tarea | Crea una transcripción hija limpia. Este es el valor predeterminado y mantiene menor el uso de tokens. |
| `fork`     | Trabajo que depende de la conversación actual, resultados previos de herramientas o instrucciones matizadas ya presentes en la transcripción del solicitante | Ramifica la transcripción del solicitante en la sesión hija antes de que comience la sesión hija. |

Usa `fork` con moderación. Es para delegación sensible al contexto, no un
reemplazo de redactar un prompt de tarea claro.

## Herramienta: `sessions_spawn`

Inicia una ejecución de subagente con `deliver: false` en el carril global `subagent`,
luego ejecuta un paso de anuncio y publica la respuesta de anuncio en el canal
de chat solicitante.

**Valores predeterminados:**

- **Modelo:** hereda el de quien llama a menos que establezcas `agents.defaults.subagents.model` (o `agents.list[].subagents.model` por agente); un `sessions_spawn.model` explícito sigue prevaleciendo.
- **Thinking:** hereda el de quien llama a menos que establezcas `agents.defaults.subagents.thinking` (o `agents.list[].subagents.thinking` por agente); un `sessions_spawn.thinking` explícito sigue prevaleciendo.
- **Tiempo de espera de ejecución:** si se omite `sessions_spawn.runTimeoutSeconds`, OpenClaw usa `agents.defaults.subagents.runTimeoutSeconds` cuando está establecido; en caso contrario recurre a `0` (sin tiempo de espera).

### Parámetros de la herramienta

<ParamField path="task" type="string" required>
  La descripción de la tarea para el subagente.
</ParamField>
<ParamField path="label" type="string">
  Etiqueta legible opcional.
</ParamField>
<ParamField path="agentId" type="string">
  Genera bajo otro id de agente cuando lo permite `subagents.allowAgents`.
</ParamField>
<ParamField path="runtime" type='"subagent" | "acp"' default="subagent">
  `acp` es solo para arneses ACP externos (`claude`, `droid`, `gemini`, `opencode` o Codex ACP/acpx solicitado explícitamente) y para entradas `agents.list[]` cuyo `runtime.type` sea `acp`.
</ParamField>
<ParamField path="model" type="string">
  Anula el modelo del subagente. Los valores no válidos se omiten y el subagente se ejecuta con el modelo predeterminado con una advertencia en el resultado de la herramienta.
</ParamField>
<ParamField path="thinking" type="string">
  Anula el nivel de thinking para la ejecución del subagente.
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  El valor predeterminado es `agents.defaults.subagents.runTimeoutSeconds` cuando está establecido; en caso contrario `0`. Cuando se establece, la ejecución del subagente se aborta después de N segundos.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Cuando es `true`, solicita vinculación de hilo del canal para esta sesión de subagente.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  Si `thread: true` y se omite `mode`, el valor predeterminado pasa a ser `session`. `mode: "session"` requiere `thread: true`.
</ParamField>
<ParamField path="cleanup" type='"delete" | "keep"' default="keep">
  `"delete"` archiva inmediatamente después del anuncio (aun así conserva la transcripción mediante cambio de nombre).
</ParamField>
<ParamField path="sandbox" type='"inherit" | "require"' default="inherit">
  `require` rechaza la generación a menos que el runtime hijo de destino esté en sandbox.
</ParamField>
<ParamField path="context" type='"isolated" | "fork"' default="isolated">
  `fork` ramifica la transcripción actual del solicitante en la sesión hija. Solo subagentes nativos. Usa `fork` solo cuando el hijo necesite la transcripción actual.
</ParamField>

<Warning>
`sessions_spawn` **no** acepta parámetros de entrega de canal (`target`,
`channel`, `to`, `threadId`, `replyTo`, `transport`). Para la entrega, usa
`message`/`sessions_send` desde la ejecución generada.
</Warning>

## Sesiones vinculadas a hilos

Cuando las vinculaciones a hilos están habilitadas para un canal, un subagente puede permanecer vinculado
a un hilo para que los mensajes posteriores del usuario en ese hilo sigan enrutándose a la
misma sesión de subagente.

### Canales compatibles con hilos

**Discord** es actualmente el único canal compatible. Admite
sesiones persistentes de subagentes vinculadas a hilos (`sessions_spawn` con
`thread: true`), controles manuales de hilos (`/focus`, `/unfocus`, `/agents`,
`/session idle`, `/session max-age`) y claves de adaptador
`channels.discord.threadBindings.enabled`,
`channels.discord.threadBindings.idleHours`,
`channels.discord.threadBindings.maxAgeHours` y
`channels.discord.threadBindings.spawnSubagentSessions`.

### Flujo rápido

<Steps>
  <Step title="Generar">
    `sessions_spawn` con `thread: true` (y opcionalmente `mode: "session"`).
  </Step>
  <Step title="Vincular">
    OpenClaw crea o vincula un hilo a ese destino de sesión en el canal activo.
  </Step>
  <Step title="Enrutar seguimientos">
    Las respuestas y mensajes de seguimiento en ese hilo se enrutan a la sesión vinculada.
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
| `/unfocus`         | Elimina la vinculación del hilo actualmente vinculado                 |
| `/agents`          | Enumera ejecuciones activas y estado de vinculación (`thread:<id>` o `unbound`) |
| `/session idle`    | Inspecciona/actualiza el desenfoque automático por inactividad (solo hilos vinculados con foco) |
| `/session max-age` | Inspecciona/actualiza el límite estricto (solo hilos vinculados con foco) |

### Interruptores de configuración

- **Valor predeterminado global:** `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
- **La anulación por canal y las claves de vinculación automática al generar** son específicas del adaptador. Consulta [Canales compatibles con hilos](#thread-supporting-channels) arriba.

Consulta [Referencia de configuración](/es/gateway/configuration-reference) y
[Comandos de barra](/es/tools/slash-commands) para ver los detalles actuales del adaptador.

### Lista de permitidos

<ParamField path="agents.list[].subagents.allowAgents" type="string[]">
  Lista de ids de agentes a los que se puede apuntar mediante `agentId` (`["*"]` permite cualquiera). Predeterminado: solo el agente solicitante.
</ParamField>
<ParamField path="agents.defaults.subagents.allowAgents" type="string[]">
  Lista de permitidos predeterminada de agentes de destino usada cuando el agente solicitante no establece su propia `subagents.allowAgents`.
</ParamField>
<ParamField path="agents.defaults.subagents.requireAgentId" type="boolean" default="false">
  Bloquea llamadas a `sessions_spawn` que omitan `agentId` (fuerza la selección explícita de perfil). Anulación por agente: `agents.list[].subagents.requireAgentId`.
</ParamField>

Si la sesión solicitante está en sandbox, `sessions_spawn` rechaza destinos
que se ejecutarían sin sandbox.

### Descubrimiento

Usa `agents_list` para ver qué ids de agentes están permitidos actualmente para
`sessions_spawn`. La respuesta incluye el modelo efectivo de cada agente listado
y metadatos de runtime incrustado para que quienes llaman puedan distinguir entre PI, servidor de aplicaciones Codex
y otros runtimes nativos configurados.

### Archivado automático

- Las sesiones de subagentes se archivan automáticamente después de `agents.defaults.subagents.archiveAfterMinutes` (valor predeterminado `60`).
- El archivado usa `sessions.delete` y cambia el nombre de la transcripción a `*.deleted.<timestamp>` (misma carpeta).
- `cleanup: "delete"` archiva inmediatamente después del anuncio (aun así conserva la transcripción mediante cambio de nombre).
- El archivado automático se hace con el mejor esfuerzo; los temporizadores pendientes se pierden si el gateway se reinicia.
- `runTimeoutSeconds` **no** archiva automáticamente; solo detiene la ejecución. La sesión permanece hasta el archivado automático.
- El archivado automático se aplica por igual a sesiones de profundidad 1 y profundidad 2.
- La limpieza del navegador es independiente de la limpieza de archivado: las pestañas/procesos del navegador rastreados se cierran con el mejor esfuerzo cuando la ejecución termina, aunque se conserve el registro de transcripción/sesión.

## Subagentes anidados

De forma predeterminada, los subagentes no pueden generar sus propios subagentes
(`maxSpawnDepth: 1`). Establece `maxSpawnDepth: 2` para habilitar un nivel de
anidamiento: el **patrón de orquestador**: principal → subagente orquestador →
sub-subagentes de trabajo.

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxSpawnDepth: 2, // permitir que los subagentes generen hijos (predeterminado: 1)
        maxChildrenPerAgent: 5, // máximo de hijos activos por sesión de agente (predeterminado: 5)
        maxConcurrent: 8, // límite global de concurrencia del carril (predeterminado: 8)
        runTimeoutSeconds: 900, // tiempo de espera predeterminado para sessions_spawn cuando se omite (0 = sin tiempo de espera)
      },
    },
  },
}
```

### Niveles de profundidad

| Profundidad | Forma de la clave de sesión                  | Rol                                           | ¿Puede generar?               |
| ----------- | -------------------------------------------- | --------------------------------------------- | ----------------------------- |
| 0           | `agent:<id>:main`                            | Agente principal                              | Siempre                       |
| 1           | `agent:<id>:subagent:<uuid>`                 | Subagente (orquestador cuando se permite profundidad 2) | Solo si `maxSpawnDepth >= 2` |
| 2           | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | Sub-subagente (trabajador hoja)               | Nunca                         |

### Cadena de anuncios

Los resultados fluyen de vuelta por la cadena:

1. El trabajador de profundidad 2 termina → anuncia a su padre (orquestador de profundidad 1).
2. El orquestador de profundidad 1 recibe el anuncio, sintetiza resultados, termina → anuncia al principal.
3. El agente principal recibe el anuncio y lo entrega al usuario.

Cada nivel solo ve anuncios de sus hijos directos.

<Note>
**Guía operativa:** inicia el trabajo hijo una sola vez y espera los eventos de finalización
en lugar de construir bucles de consulta alrededor de `sessions_list`,
`sessions_history`, `/subagents list` o comandos `exec` con espera.
`sessions_list` y `/subagents list` mantienen las relaciones de sesiones hijas
centradas en trabajo activo: los hijos activos siguen adjuntos, los hijos terminados siguen
visibles durante una breve ventana reciente y los vínculos de hijos obsoletos solo en almacenamiento
se ignoran después de su ventana de frescura. Esto evita que metadatos antiguos de `spawnedBy` /
`parentSessionKey` resuciten hijos fantasma tras un
reinicio. Si un evento de finalización de hijo llega después de que ya enviaste la
respuesta final, el seguimiento correcto es el token silencioso exacto
`NO_REPLY` / `no_reply`.
</Note>

### Política de herramientas por profundidad

- El rol y el alcance de control se escriben en los metadatos de la sesión en el momento de generar. Eso evita que claves de sesión planas o restauradas recuperen accidentalmente privilegios de orquestador.
- **Profundidad 1 (orquestador, cuando `maxSpawnDepth >= 2`):** obtiene `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history` para que pueda gestionar a sus hijos. Otras herramientas de sesión/sistema siguen denegadas.
- **Profundidad 1 (hoja, cuando `maxSpawnDepth == 1`):** sin herramientas de sesión (comportamiento predeterminado actual).
- **Profundidad 2 (trabajador hoja):** sin herramientas de sesión; `sessions_spawn` siempre se deniega en profundidad 2. No puede generar más hijos.

### Límite de generación por agente

Cada sesión de agente (a cualquier profundidad) puede tener como máximo `maxChildrenPerAgent`
(predeterminado `5`) hijos activos a la vez. Esto evita una expansión descontrolada
desde un solo orquestador.

### Detención en cascada

Detener un orquestador de profundidad 1 detiene automáticamente a todos sus hijos
de profundidad 2:

- `/stop` en el chat principal detiene todos los agentes de profundidad 1 y se propaga a sus hijos de profundidad 2.
- `/subagents kill <id>` detiene un subagente específico y se propaga a sus hijos.
- `/subagents kill all` detiene todos los subagentes del solicitante y se propaga.

## Autenticación

La autenticación del subagente se resuelve por **id de agente**, no por tipo de sesión:

- La clave de sesión del subagente es `agent:<agentId>:subagent:<uuid>`.
- El almacén de autenticación se carga desde el `agentDir` de ese agente.
- Los perfiles de autenticación del agente principal se fusionan como **alternativa**; los perfiles del agente anulan a los del principal en caso de conflicto.

La fusión es aditiva, por lo que los perfiles del principal siempre están disponibles como
alternativas. La autenticación completamente aislada por agente todavía no es compatible.

## Anuncio

Los subagentes informan de vuelta mediante un paso de anuncio:

- El paso de anuncio se ejecuta dentro de la sesión del subagente (no en la sesión solicitante).
- Si el subagente responde exactamente `ANNOUNCE_SKIP`, no se publica nada.
- Si el texto más reciente del asistente es el token silencioso exacto `NO_REPLY` / `no_reply`, la salida del anuncio se suprime aunque haya habido progreso visible anterior.

La entrega depende de la profundidad del solicitante:

- Las sesiones solicitantes de nivel superior usan una llamada de seguimiento a `agent` con entrega externa (`deliver=true`).
- Las sesiones solicitantes de subagentes anidados reciben una inyección interna de seguimiento (`deliver=false`) para que el orquestador pueda sintetizar resultados hijos dentro de la sesión.
- Si una sesión solicitante de subagente anidado ya no existe, OpenClaw recurre al solicitante de esa sesión cuando está disponible.

Para sesiones solicitantes de nivel superior, la entrega directa en modo de finalización primero
resuelve cualquier ruta de conversación/hilo vinculada y anulación de hook, luego completa
los campos faltantes de destino de canal a partir de la ruta almacenada de la sesión solicitante.
Eso mantiene las finalizaciones en el chat/tema correcto incluso cuando el origen de la finalización
solo identifica el canal.

La agregación de finalización de hijos se limita a la ejecución solicitante actual al
construir hallazgos de finalización anidados, evitando que salidas hijas obsoletas de ejecuciones anteriores
se filtren al anuncio actual. Las respuestas de anuncio conservan el
enrutamiento de hilo/tema cuando está disponible en los adaptadores de canal.

### Contexto del anuncio

El contexto del anuncio se normaliza a un bloque de evento interno estable:

| Campo             | Origen                                                                                                           |
| ----------------- | ---------------------------------------------------------------------------------------------------------------- |
| Fuente            | `subagent` o `cron`                                                                                              |
| Ids de sesión     | Clave/id de sesión hija                                                                                          |
| Tipo              | Tipo de anuncio + etiqueta de tarea                                                                              |
| Estado            | Derivado del resultado de runtime (`success`, `error`, `timeout` o `unknown`) — **no** inferido a partir del texto del modelo |
| Contenido del resultado | Texto visible más reciente del asistente; en caso contrario, texto más reciente sanitizado de tool/toolResult |
| Seguimiento       | Instrucción que describe cuándo responder frente a cuándo permanecer en silencio                                  |

Las ejecuciones fallidas terminales informan estado de fallo sin reproducir
texto de respuesta capturado. En caso de tiempo de espera, si el hijo solo alcanzó llamadas a herramientas, el anuncio
puede condensar ese historial en un breve resumen de progreso parcial en
lugar de reproducir la salida sin procesar de la herramienta.

### Línea de estadísticas

Las cargas útiles de anuncio incluyen una línea de estadísticas al final (incluso cuando van envueltas):

- Runtime (por ejemplo `runtime 5m12s`).
- Uso de tokens (entrada/salida/total).
- Costo estimado cuando el precio del modelo está configurado (`models.providers.*.models[].cost`).
- `sessionKey`, `sessionId` y ruta de la transcripción para que el agente principal pueda obtener el historial mediante `sessions_history` o inspeccionar el archivo en disco.

Los metadatos internos están pensados solo para la orquestación; las respuestas dirigidas al usuario
deben reescribirse con una voz normal de asistente.

### Por qué preferir `sessions_history`

`sessions_history` es la ruta de orquestación más segura:

- La recuperación del asistente se normaliza primero: se eliminan etiquetas de thinking; se elimina el andamiaje `<relevant-memories>` / `<relevant_memories>`; se eliminan bloques XML de carga útil de llamada de herramienta en texto sin formato (`<tool_call>`, `<function_call>`, `<tool_calls>`, `<function_calls>`), incluidas las cargas truncadas que nunca cierran limpiamente; se elimina el andamiaje degradado de llamada/resultado de herramienta y los marcadores de contexto histórico; se eliminan tokens de control del modelo filtrados (`<|assistant|>`, otros ASCII `<|...|>`, y de ancho completo `<｜...｜>`); se elimina XML malformado de llamadas de herramienta de MiniMax.
- El texto similar a credenciales/tokens se redacta.
- Los bloques largos pueden truncarse.
- Los historiales muy grandes pueden descartar filas antiguas o sustituir una fila sobredimensionada por `[sessions_history omitted: message too large]`.
- La inspección de la transcripción sin procesar en disco es la alternativa cuando necesitas la transcripción completa byte por byte.

## Política de herramientas

Los subagentes usan primero el mismo perfil y flujo de política de herramientas que el agente padre o
agente objetivo. Después, OpenClaw aplica la capa de restricción de subagentes.

Sin `tools.profile` restrictivo, los subagentes obtienen **todas las herramientas excepto
herramientas de sesión** y herramientas del sistema:

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

`sessions_history` sigue siendo aquí también una vista de recuperación limitada y sanitizada;
no es un volcado sin procesar de la transcripción.

Cuando `maxSpawnDepth >= 2`, los subagentes orquestadores de profundidad 1 además
reciben `sessions_spawn`, `subagents`, `sessions_list` y
`sessions_history` para que puedan gestionar a sus hijos.

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
        // deny prevalece
        deny: ["gateway", "cron"],
        // si se establece allow, pasa a ser solo-permitidos (deny sigue prevaleciendo)
        // allow: ["read", "exec", "process"]
      },
    },
  },
}
```

`tools.subagents.tools.allow` es un filtro final de solo permitidos. Puede restringir
el conjunto de herramientas ya resuelto, pero no puede **volver a añadir**
una herramienta eliminada por `tools.profile`. Por ejemplo, `tools.profile: "coding"` incluye
`web_search`/`web_fetch` pero no la herramienta `browser`. Para permitir que los
subagentes con perfil coding usen automatización de navegador, añade browser en la
etapa del perfil:

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

Los subagentes usan un carril de cola dedicado en proceso:

- **Nombre del carril:** `subagent`
- **Concurrencia:** `agents.defaults.subagents.maxConcurrent` (predeterminado `8`)

## Actividad y recuperación

OpenClaw no trata la ausencia de `endedAt` como prueba permanente de que un
subagente sigue vivo. Las ejecuciones no finalizadas más antiguas que la ventana de ejecución obsoleta
dejan de contar como activas/pendientes en `/subagents list`, resúmenes de estado,
bloqueo de finalización de descendientes y comprobaciones de concurrencia por sesión.

Después de un reinicio del gateway, las ejecuciones restauradas obsoletas no finalizadas se depuran a menos
que su sesión hija esté marcada como `abortedLastRun: true`. Esas
sesiones hijas abortadas por reinicio siguen siendo recuperables mediante el flujo de recuperación
de huérfanos de subagentes, que envía un mensaje de reanudación sintético antes de
borrar el marcador de abortado.

<Note>
Si la generación de un subagente falla con Gateway `PAIRING_REQUIRED` /
`scope-upgrade`, comprueba el llamador RPC antes de editar el estado de emparejamiento.
La coordinación interna de `sessions_spawn` debe conectarse como
`client.id: "gateway-client"` con `client.mode: "backend"` mediante autenticación directa de
token compartido/contraseña por loopback; esa ruta no depende de la línea base de alcance de dispositivo emparejado de la CLI. Los llamadores remotos, `deviceIdentity`
explícito, rutas explícitas de token de dispositivo y clientes de navegador/node
siguen necesitando aprobación normal del dispositivo para ampliaciones de alcance.
</Note>

## Detención

- Enviar `/stop` en el chat solicitante aborta la sesión solicitante y detiene cualquier ejecución de subagente activa generada desde ella, propagándose a hijos anidados.
- `/subagents kill <id>` detiene un subagente específico y se propaga a sus hijos.

## Limitaciones

- El anuncio del subagente se hace con el **mejor esfuerzo**. Si el gateway se reinicia, se pierde el trabajo pendiente de "anunciar de vuelta".
- Los subagentes siguen compartiendo los mismos recursos del proceso del gateway; trata `maxConcurrent` como una válvula de seguridad.
- `sessions_spawn` siempre es no bloqueante: devuelve `{ status: "accepted", runId, childSessionKey }` inmediatamente.
- El contexto del subagente solo inyecta `AGENTS.md` + `TOOLS.md` (no `SOUL.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` ni `BOOTSTRAP.md`).
- La profundidad máxima de anidamiento es 5 (rango de `maxSpawnDepth`: 1–5). Se recomienda profundidad 2 para la mayoría de los casos de uso.
- `maxChildrenPerAgent` limita los hijos activos por sesión (predeterminado `5`, rango `1–20`).

## Relacionado

- [Agentes ACP](/es/tools/acp-agents)
- [Envío a agente](/es/tools/agent-send)
- [Tareas en segundo plano](/es/automation/tasks)
- [Herramientas de sandbox multiagente](/es/tools/multi-agent-sandbox-tools)

---
read_when:
    - Quieres entender qué herramientas de sesión tiene el agente
    - Quiere configurar el acceso entre sesiones o la creación de subagentes
    - Quiere inspeccionar el estado de los subagentes iniciados
summary: Herramientas de agente para estado entre sesiones, recuperación, mensajería y orquestación de subagentes
title: Herramientas de sesión
x-i18n:
    generated_at: "2026-07-12T14:30:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 6b584912c012b632d001e7f77dc704b8b11ab2e897ed62238675026078039819
    source_path: concepts/session-tool.md
    workflow: 16
---

OpenClaw proporciona a los agentes herramientas para trabajar entre sesiones, inspeccionar el estado y orquestar subagentes.

## Herramientas disponibles

| Herramienta        | Qué hace                                                                                      |
| ------------------ | --------------------------------------------------------------------------------------------- |
| `sessions_list`    | Enumera sesiones con filtros opcionales (tipo, etiqueta, agente, archivo, vista previa)        |
| `sessions_history` | Lee la transcripción de una sesión específica                                                 |
| `sessions_send`    | Envía un mensaje a otra sesión y, opcionalmente, espera                                       |
| `sessions_spawn`   | Crea una sesión aislada de subagente para trabajo en segundo plano                            |
| `sessions_yield`   | Finaliza el turno actual y espera resultados posteriores de subagentes                        |
| `subagents`        | Enumera el estado de los subagentes creados para esta sesión                                  |
| `session_status`   | Muestra una tarjeta similar a `/status` y, opcionalmente, establece un modelo por sesión      |

Estas herramientas siguen estando sujetas al perfil de herramientas activo y a la política de permisos y denegaciones. `tools.profile: "coding"` incluye el conjunto completo de orquestación de sesiones, incluidos `sessions_spawn`, `sessions_yield` y `subagents`. `tools.profile: "messaging"` incluye herramientas de mensajería entre sesiones (`sessions_list`, `sessions_history`, `sessions_send`, `session_status`), pero no incluye la creación de subagentes. Para conservar un perfil de mensajería y aun así permitir la delegación nativa, añada:

```json5
{
  tools: {
    profile: "messaging",
    alsoAllow: ["sessions_spawn", "sessions_yield", "subagents"],
  },
}
```

Las políticas de grupo, proveedor, entorno aislado y por agente pueden seguir eliminando esas herramientas después de la etapa del perfil. Use `/tools` desde la sesión afectada para inspeccionar la lista efectiva de herramientas.

## Enumeración y lectura de sesiones

`sessions_list` devuelve sesiones con su clave, agentId, tipo, canal, modelo, recuentos de tokens y marcas de tiempo. Filtre por `kinds` (matriz; valores aceptados: `main`, `group`, `cron`, `hook`, `node`, `other`), `label` exacto, `agentId` exacto, texto de `search` o actividad reciente (`activeMinutes`). De forma predeterminada, se devuelven las sesiones activas; pase `archived: true` para inspeccionar en su lugar las sesiones archivadas. Las filas incluyen los estados `pinned` y `archived`. Establezca `includeDerivedTitles`, `includeLastMessage` o `messageLimit` (con un máximo de 20) cuando necesite una clasificación similar a la de un buzón: un título derivado limitado por la visibilidad, un fragmento de vista previa del último mensaje o mensajes recientes acotados en cada fila. Los títulos derivados y las vistas previas solo se generan para las sesiones que el llamador ya puede ver según la política de visibilidad configurada para las herramientas de sesión, por lo que las sesiones no relacionadas permanecen ocultas. Cuando la visibilidad está restringida, `sessions_list` devuelve metadatos `visibility` opcionales que muestran el modo efectivo y una advertencia de que los resultados pueden estar limitados por el ámbito.

`sessions_history` obtiene la transcripción de la conversación de una sesión específica. De forma predeterminada, se excluyen los resultados de herramientas; pase `includeTools: true` para verlos. Use `limit` para obtener la parte final acotada más reciente. Pase `offset: 0` cuando necesite metadatos de paginación y, después, pase los valores `nextOffset` devueltos para retroceder por ventanas anteriores de transcripciones de OpenClaw sin leer los archivos de transcripción sin procesar. Las páginas con desplazamiento explícito no combinan las importaciones externas de respaldo de la CLI; use la vista predeterminada de la parte final más reciente (sin `offset`) cuando necesite ese historial de visualización combinado.

La vista devuelta está acotada y filtrada por seguridad de forma intencionada:

- el texto del asistente se normaliza antes de recuperarlo:
  - se eliminan las etiquetas de razonamiento
  - se eliminan los bloques de estructura `<relevant-memories>` / `<relevant_memories>`
  - se eliminan los bloques de carga útil XML de llamadas a herramientas en texto sin formato, como `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>` y `<function_calls>...</function_calls>`, incluidas las cargas útiles truncadas que nunca se cierran correctamente
  - se eliminan las estructuras degradadas de llamadas a herramientas y resultados, como `[Tool Call: ...]`, `[Tool Result ...]` y `[Historical context ...]`
  - se eliminan los tokens de control del modelo filtrados, como `<|assistant|>`, otros tokens ASCII `<|...|>` y las variantes de ancho completo `<｜...｜>`
  - se elimina el XML malformado de llamadas a herramientas de MiniMax, como `<invoke ...>` / `</minimax:tool_call>`
- el texto similar a credenciales o tokens se oculta antes de devolverlo
- los bloques de texto largos se truncan
- los historiales muy grandes pueden omitir filas anteriores o sustituir una fila demasiado grande por `[sessions_history omitted: message too large]`
- la herramienta informa indicadores de resumen como `truncated`, `droppedMessages`, `contentTruncated`, `contentRedacted`, `bytes` y metadatos de paginación

Ambas herramientas aceptan una **clave de sesión** (como `"main"`) o un **ID de sesión** de una llamada de enumeración anterior.

Si necesita la transcripción sin procesar exacta, inspeccione las filas de transcripción de SQLite dentro del ámbito correspondiente en lugar de tratar `sessions_history` como un volcado sin filtrar.

## Envío de mensajes entre sesiones

`sessions_send` entrega un mensaje a otra sesión y, opcionalmente, espera la respuesta:

- **Enviar sin esperar:** establezca `timeoutSeconds: 0` para ponerlo en cola y devolver el resultado inmediatamente.
- **Esperar respuesta:** establezca un tiempo de espera y obtenga la respuesta en línea.

Las sesiones de chat limitadas a un hilo, como las claves que terminan en `:thread:<id>`, no son destinos válidos de `sessions_send`. Use la clave de sesión del canal principal para la coordinación entre agentes, de modo que los mensajes dirigidos mediante herramientas no aparezcan dentro de un hilo activo orientado a usuarios.

Los mensajes y las respuestas posteriores A2A se marcan como datos entre sesiones en el prompt receptor (`[Inter-session message ... isUser=false]`) y en la procedencia de la transcripción. El agente receptor debe tratarlos como datos dirigidos mediante herramientas, no como una instrucción escrita directamente por un usuario final.

Después de que el destino responda, OpenClaw puede ejecutar un **bucle de respuestas** en el que los agentes alternan mensajes (hasta `session.agentToAgent.maxPingPongTurns`, intervalo de 0-20, valor predeterminado 5). El agente de destino puede responder `REPLY_SKIP` para detenerlo antes.

## Ayudantes de estado y orquestación

`session_status` es la herramienta ligera equivalente a `/status` para la sesión actual u otra sesión visible. Informa del uso, la hora, el estado del modelo y del entorno de ejecución, y el contexto vinculado de tareas en segundo plano cuando existe. Al igual que `/status`, puede completar contadores incompletos de tokens y caché a partir de la entrada de uso más reciente de la transcripción, y `model=default` elimina una sustitución por sesión. Use `sessionKey="current"` para la sesión actual del llamador; las etiquetas visibles del cliente, como `openclaw-tui`, no son claves de sesión.

Cuando hay metadatos de ruta disponibles, `session_status` también incluye un bloque JSON visible `Route context` y campos `details` estructurados correspondientes. Estos campos distinguen la clave de sesión de la ruta que gestiona actualmente la ejecución activa:

- `origin` indica dónde se creó la sesión, o el proveedor inferido a partir del prefijo de una clave de sesión apta para entrega cuando el estado anterior carece de metadatos de origen almacenados.
- `active` es la ruta de la ejecución activa actual. Solo se informa para la sesión activa o actual que se está gestionando en ese momento.
- `deliveryContext` es la ruta de entrega persistente almacenada en la sesión, que OpenClaw puede reutilizar para entregas posteriores incluso cuando la superficie activa es diferente.

## Cambios de estado de sesión

OpenClaw mantiene un registro de señales sujeto al mejor esfuerzo para determinados cambios de estado de sesión: mensajes humanos directos a sesiones secundarias, finalización o fallo de ejecuciones secundarias, creación de sesiones secundarias, cambios de objetivo y Compaction. Las ejecuciones secundarias canceladas y agotadas por tiempo de espera se registran como fallos, y el resultado específico (`cancelled`, `timeout` o `error`) se conserva en la carga útil del evento. El registro contiene metadatos y resúmenes de una línea, nunca el contenido de los mensajes. Su `stateVersion` es la cabecera del registro de señales de la sesión, no una versión transaccional de captura de cambios de datos; la mutación del almacén de sesiones y la incorporación de la señal usan almacenamientos separados, por lo que una incorporación fallida se registra sin provocar el fallo del turno de origen.

`sessions_list` incluye `stateVersion` en las filas con cambios registrados. `session_status` siempre devuelve `stateVersion` en los detalles estructurados. Pase `changesSince: <previousStateVersion>` para recuperar hasta 200 eventos conservados posteriores a esa versión; esta lectura no confirma ni avanza los cursores de notificaciones principales. Un resultado `historyGap: true` significa que la versión solicitada es anterior al historial conservado, por lo que debe actualizar todo el estado de la sesión en lugar de tratar la respuesta como un delta exacto.

Cuando otro actor envía un turno humano directo a una sesión secundaria observada o cambia su objetivo, la sesión principal recibe un aviso del sistema que le indica que llame a `session_status` con la última versión vista. Las sesiones principales se reactivan de forma proactiva. Las sesiones principales de subagentes anidados reciben el aviso en su turno siguiente porque el enrutamiento de Heartbeat no puede dirigirse directamente a su cola. Los anuncios de finalización siguen siendo responsables de la entrega ordinaria de la finalización de ejecuciones secundarias.

El historial está limitado a 30 días y 50,000 filas, mientras que las cabeceras por sesión permanecen monotónicas después de la depuración. La entrega de avisos usa la cola de eventos del sistema en memoria del Gateway y presupone que un único proceso de Gateway controla la entrega para la base de datos de estado compartida. Varios Gateway siguen compartiendo el registro duradero y la superficie de conciliación `changesSince`, pero v1 no envía avisos entre procesos. Los avisos principales requieren una clave de sesión principal calificada por agente; con `session.scope="global"`, la clave compartida `global` es ambigua entre agentes, por lo que esas sesiones principales obtienen el registro duradero y `changesSince`, pero no avisos proactivos en v1.

`sessions_yield` finaliza intencionadamente el turno actual para que el siguiente mensaje pueda ser el evento posterior que está esperando. Úselo después de crear subagentes cuando quiera que los resultados de finalización lleguen como el siguiente mensaje en lugar de crear bucles de consulta.

`subagents` es el ayudante de visibilidad para los subagentes de OpenClaw ya creados. Admite `action: "list"` para inspeccionar ejecuciones activas o recientes.

## Creación de subagentes

`sessions_spawn` crea de forma predeterminada una sesión aislada para una tarea en segundo plano. Siempre es no bloqueante; devuelve inmediatamente un `runId` y un `childSessionKey`. Las ejecuciones nativas de subagentes reciben la tarea delegada en el primer mensaje visible `[Subagent Task]` de la sesión secundaria, mientras que el prompt del sistema solo contiene reglas del entorno de ejecución de subagentes y contexto de enrutamiento.

Opciones principales:

- `runtime: "subagent"` (predeterminado) o `"acp"` para agentes de entornos externos.
- Sustituciones `model` y `thinking` para la sesión secundaria.
- `thread: true` para vincular la creación a un hilo de chat (Discord, Slack, etc.).
- `sandbox: "require"` para exigir el aislamiento de la sesión secundaria.
- `context: "fork"` para subagentes nativos cuando la sesión secundaria necesita la transcripción actual del solicitante; omítalo o use `context: "isolated"` para una sesión secundaria limpia. `context: "fork"` solo es válido con `runtime: "subagent"`. Los subagentes nativos vinculados a hilos usan `context: "fork"` de forma predeterminada, salvo que `threadBindings.defaultSpawnContext` indique lo contrario.

Los subagentes hoja predeterminados no reciben herramientas de sesión. Cuando `maxSpawnDepth >= 2`, los subagentes orquestadores de profundidad 1 reciben además `sessions_spawn`, `subagents`, `sessions_list` y `sessions_history` para poder gestionar sus propias sesiones secundarias. Las ejecuciones hoja siguen sin recibir herramientas de orquestación recursiva.

Tras la finalización, un paso de anuncio publica el resultado en el canal del solicitante. La entrega de finalización conserva el enrutamiento vinculado de hilo o tema cuando está disponible y, si el origen de la finalización solo identifica un canal, OpenClaw aún puede reutilizar la ruta almacenada de la sesión del solicitante (`lastChannel` / `lastTo`) para la entrega directa.

Para conocer el comportamiento específico de ACP, consulte [Agentes ACP](/es/tools/acp-agents).

## Visibilidad

Las herramientas de sesión tienen un ámbito limitado para restringir lo que el agente puede ver:

| Nivel   | Ámbito                                           |
| ------- | ------------------------------------------------ |
| `self`  | Solo la sesión actual                            |
| `tree`  | Sesión actual + subagentes creados               |
| `agent` | Todas las sesiones de este agente                |
| `all`   | Todas las sesiones (entre agentes si se configura) |

El valor predeterminado es `tree`. Las sesiones aisladas se limitan a `tree` independientemente de la configuración.

## Lecturas adicionales

- [Gestión de sesiones](/es/concepts/session): enrutamiento, ciclo de vida y mantenimiento
- [Subagentes](/es/tools/subagents): ciclo de vida y entrega de sesiones secundarias
- [Agentes ACP](/es/tools/acp-agents): inicio de agentes mediante un entorno externo
- [Multiagente](/es/concepts/multi-agent): arquitectura multiagente
- [Configuración del Gateway](/es/gateway/configuration): opciones de configuración de la herramienta de sesiones

## Contenido relacionado

- [Gestión de sesiones](/es/concepts/session)
- [Depuración de sesiones](/es/concepts/session-pruning)

---
read_when:
    - Quieres entender qué herramientas de sesión tiene el agente
    - Desea configurar el acceso entre sesiones o la creación de subagentes
    - Quieres consultar el estado de los subagentes iniciados
summary: Herramientas del agente para consultar el estado entre sesiones, recuperar información, enviar mensajes y orquestar subagentes
title: Herramientas de sesión
x-i18n:
    generated_at: "2026-07-12T21:23:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: fb0827e2eff6e53d3e7ef6f7d7f0497d8b431fcb23cb4b54c5851229086423cc
    source_path: concepts/session-tool.md
    workflow: 16
---

OpenClaw proporciona a los agentes herramientas para trabajar entre sesiones, inspeccionar el estado y orquestar subagentes.

## Herramientas disponibles

| Herramienta        | Función                                                                      |
| ------------------ | ---------------------------------------------------------------------------- |
| `sessions_list`    | Enumera sesiones con filtros opcionales (tipo, etiqueta, agente, archivo, vista previa) |
| `sessions_history` | Lee la transcripción de una sesión específica                                |
| `sessions_send`    | Envía un mensaje a otra sesión y, opcionalmente, espera                       |
| `sessions_spawn`   | Inicia una sesión aislada de subagente para trabajar en segundo plano         |
| `sessions_yield`   | Finaliza el turno actual y espera resultados posteriores de los subagentes    |
| `subagents`        | Enumera el estado de los subagentes iniciados para esta sesión                |
| `session_status`   | Muestra una tarjeta con el formato de `/status` y, opcionalmente, establece una sustitución de modelo por sesión |

Estas herramientas siguen sujetas al perfil de herramientas activo y a la política de permisos y denegaciones. `tools.profile: "coding"` incluye el conjunto completo de orquestación de sesiones, incluidos `sessions_spawn`, `sessions_yield` y `subagents`. `tools.profile: "messaging"` incluye herramientas de mensajería entre sesiones (`sessions_list`, `sessions_history`, `sessions_send`, `session_status`), pero no permite iniciar subagentes. Para conservar un perfil de mensajería y permitir también la delegación nativa, añada:

```json5
{
  tools: {
    profile: "messaging",
    alsoAllow: ["sessions_spawn", "sessions_yield", "subagents"],
  },
}
```

Las políticas de grupo, proveedor, entorno aislado y agente pueden seguir eliminando esas herramientas después de la etapa del perfil. Use `/tools` desde la sesión afectada para inspeccionar la lista efectiva de herramientas.

## Enumeración y lectura de sesiones

`sessions_list` devuelve sesiones con su clave, agentId, tipo, canal, modelo, recuentos de tokens y marcas de tiempo. Filtre por `kinds` (matriz; valores aceptados: `main`, `group`, `cron`, `hook`, `node`, `other`), `label` exacta, `agentId` exacto, texto de `search` o actividad reciente (`activeMinutes`). De forma predeterminada, se devuelven las sesiones activas; pase `archived: true` para inspeccionar las sesiones archivadas. Las filas incluyen los estados `pinned` y `archived`. Establezca `includeDerivedTitles`, `includeLastMessage` o `messageLimit` (con un máximo de 20) cuando necesite una clasificación similar a la de un buzón: un título derivado limitado por la visibilidad, un fragmento de vista previa del último mensaje o mensajes recientes acotados en cada fila. Los títulos derivados y las vistas previas solo se generan para las sesiones que el llamador ya puede ver según la política configurada de visibilidad de las herramientas de sesión, por lo que las sesiones no relacionadas permanecen ocultas. Cuando la visibilidad está restringida, `sessions_list` devuelve metadatos opcionales de `visibility` que muestran el modo efectivo y una advertencia de que los resultados pueden estar limitados por el ámbito.

`sessions_history` obtiene la transcripción de la conversación de una sesión específica. De forma predeterminada, se excluyen los resultados de las herramientas; pase `includeTools: true` para verlos. Use `limit` para obtener la parte final más reciente con un límite. Pase `offset: 0` cuando necesite metadatos de paginación y, después, pase los valores `nextOffset` devueltos para retroceder por ventanas más antiguas de la transcripción de OpenClaw sin leer archivos de transcripción sin procesar. Las páginas con desplazamiento explícito no combinan importaciones externas de respaldo de la CLI; use la vista predeterminada del tramo final más reciente (sin `offset`) cuando necesite ese historial de visualización combinado.

La vista devuelta está intencionadamente acotada y filtrada por seguridad:

- el texto del asistente se normaliza antes de recuperarlo:
  - se eliminan las etiquetas de razonamiento
  - se eliminan los bloques estructurales `<relevant-memories>` / `<relevant_memories>`
  - se eliminan los bloques de carga XML de llamadas a herramientas en texto sin formato, como `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>` y `<function_calls>...</function_calls>`, incluidas las cargas truncadas que nunca se cierran correctamente
  - se eliminan las estructuras degradadas de llamadas y resultados de herramientas, como `[Tool Call: ...]`, `[Tool Result ...]` y `[Historical context ...]`
  - se eliminan los tokens de control del modelo filtrados, como `<|assistant|>`, otros tokens ASCII `<|...|>` y las variantes de ancho completo `<｜...｜>`
  - se elimina el XML mal formado de llamadas a herramientas de MiniMax, como `<invoke ...>` / `</minimax:tool_call>`
- el texto similar a credenciales o tokens se oculta antes de devolverlo
- los bloques de texto largos se truncan
- los historiales muy grandes pueden omitir filas antiguas o sustituir una fila demasiado grande por `[sessions_history omitted: message too large]`
- la herramienta informa indicadores de resumen como `truncated`, `droppedMessages`, `contentTruncated`, `contentRedacted`, `bytes` y metadatos de paginación

Ambas herramientas aceptan una **clave de sesión** (como `"main"`) o un **ID de sesión** de una llamada de enumeración anterior.

Si necesita la transcripción exacta sin procesar, inspeccione las filas de transcripción de SQLite dentro del ámbito correspondiente en lugar de tratar `sessions_history` como un volcado sin filtrar.

## Envío de mensajes entre sesiones

`sessions_send` entrega un mensaje a otra sesión y, opcionalmente, espera la respuesta:

- **Enviar sin esperar:** establezca `timeoutSeconds: 0` para ponerlo en cola y devolver el resultado inmediatamente.
- **Esperar respuesta:** establezca un tiempo de espera y obtenga la respuesta en línea.

Las sesiones de chat limitadas a un hilo, como las claves que terminan en `:thread:<id>`, no son destinos válidos de `sessions_send`. Use la clave de sesión del canal principal para la coordinación entre agentes, de modo que los mensajes enviados mediante herramientas no aparezcan dentro de un hilo activo visible para usuarios humanos.

Los mensajes y las respuestas de seguimiento A2A se marcan como datos entre sesiones en el prompt receptor (`[Inter-session message ... isUser=false]`) y en la procedencia de la transcripción. El agente receptor debe tratarlos como datos enviados mediante herramientas, no como instrucciones escritas directamente por el usuario final.

Después de que el destino responda, OpenClaw puede ejecutar un **bucle de respuestas** en el que los agentes alternan mensajes (hasta `session.agentToAgent.maxPingPongTurns`, intervalo de 0-20, valor predeterminado 5). El agente de destino puede responder `REPLY_SKIP` para detenerlo antes.

Pase `watch: true` para registrar también al remitente como observador de cambios de estado del destino: cuando otro actor envíe posteriormente al destino un mensaje humano directo o cambie su objetivo, el remitente recibirá un aviso del sistema que señala `changesSince` de `session_status`. El registro se realiza después de un envío correcto, se aplica a la sesión que realmente recibió el mensaje y comienza en su versión de estado actual, por lo que solo los cambios posteriores generan avisos. El resultado indica `watched: true` cuando el registro se realiza correctamente. Consulte [Conocimiento del estado de la sesión](/concepts/session-state).

## Ayudantes de estado y orquestación

`session_status` es la herramienta ligera equivalente a `/status` para la sesión actual u otra sesión visible. Informa del uso, la hora, el estado del modelo y del entorno de ejecución, y el contexto de las tareas en segundo plano vinculadas cuando está disponible. Al igual que `/status`, puede completar los contadores incompletos de tokens y caché a partir de la entrada de uso más reciente de la transcripción, y `model=default` elimina una sustitución por sesión. Use `sessionKey="current"` para la sesión actual del llamador; las etiquetas visibles del cliente, como `openclaw-tui`, no son claves de sesión.

Cuando los metadatos de ruta están disponibles, `session_status` también incluye un bloque JSON visible `Route context` y campos estructurados correspondientes en `details`. Estos campos distinguen la clave de sesión de la ruta que está gestionando la ejecución activa:

- `origin` indica dónde se creó la sesión, o el proveedor inferido a partir del prefijo de una clave de sesión apta para entrega cuando el estado antiguo carece de metadatos de origen almacenados.
- `active` es la ruta actual de la ejecución activa. Solo se informa para la sesión activa o actual que se está gestionando en ese momento.
- `deliveryContext` es la ruta de entrega persistente almacenada en la sesión, que OpenClaw puede reutilizar para entregas posteriores aunque la superficie activa sea distinta.

## Cambios de estado de la sesión

OpenClaw mantiene un registro persistente de señales de cambios importantes en el estado de la sesión (mensajes humanos directos a sesiones observadas, resultados de ejecuciones secundarias, cambios de objetivo y Compaction). Las filas de `sessions_list` y `session_status` exponen el `stateVersion` de la sesión, y `session_status` acepta `changesSince: <version>` para devolver los eventos tipados posteriores a esa versión, con una indicación precisa de `historyGap` cuando la versión solicitada es anterior al historial conservado. Los observadores —los padres que inician subagentes de forma automática y `sessions_send watch: true` de forma explícita— reciben un único aviso consolidado de estado obsoleto cuando otro actor cambia una sesión observada.

Consulte [Conocimiento del estado de la sesión](/concepts/session-state) para conocer el modelo completo: tipos de eventos, registro de observadores, protocolo de avisos contra mensajes repetitivos, flujo de reconciliación y límites actuales.

`sessions_yield` finaliza intencionadamente el turno actual para que el siguiente mensaje pueda ser el evento de seguimiento que se está esperando. Úselo después de iniciar subagentes cuando quiera que los resultados de finalización lleguen como el siguiente mensaje, en lugar de crear bucles de sondeo.

`subagents` es el ayudante de visibilidad para los subagentes de OpenClaw ya iniciados. Admite `action: "list"` para inspeccionar ejecuciones activas o recientes.

## Inicio de subagentes

`sessions_spawn` crea de forma predeterminada una sesión aislada para una tarea en segundo plano. Siempre es no bloqueante; devuelve inmediatamente un `runId` y un `childSessionKey`. Las ejecuciones de subagentes nativos reciben la tarea delegada en el primer mensaje visible `[Subagent Task]` de la sesión secundaria, mientras que el prompt del sistema solo contiene las reglas del entorno de ejecución del subagente y el contexto de enrutamiento.

Opciones principales:

- `runtime: "subagent"` (predeterminado) o `"acp"` para agentes de entornos externos.
- Sustituciones de `model` y `thinking` para la sesión secundaria.
- `thread: true` para vincular el inicio a un hilo de chat (Discord, Slack, etc.).
- `sandbox: "require"` para exigir el aislamiento de la sesión secundaria.
- `context: "fork"` para subagentes nativos cuando la sesión secundaria necesita la transcripción del solicitante actual; omítalo o use `context: "isolated"` para una sesión secundaria limpia. `context: "fork"` solo es válido con `runtime: "subagent"`. Los subagentes nativos vinculados a hilos usan de forma predeterminada `context: "fork"`, salvo que `threadBindings.defaultSpawnContext` indique lo contrario.

Los subagentes hoja predeterminados no reciben herramientas de sesión. Cuando `maxSpawnDepth >= 2`, los subagentes orquestadores de profundidad 1 reciben además `sessions_spawn`, `subagents`, `sessions_list` y `sessions_history` para poder gestionar sus propias sesiones secundarias. Las ejecuciones hoja siguen sin recibir herramientas de orquestación recursiva.

Después de la finalización, un paso de anuncio publica el resultado en el canal del solicitante. La entrega de finalización conserva el enrutamiento vinculado del hilo o tema cuando está disponible y, si el origen de la finalización solo identifica un canal, OpenClaw puede seguir reutilizando la ruta almacenada de la sesión del solicitante (`lastChannel` / `lastTo`) para la entrega directa.

Para conocer el comportamiento específico de ACP, consulte [Agentes ACP](/es/tools/acp-agents).

## Visibilidad

Las herramientas de sesión se limitan por ámbito para controlar lo que el agente puede ver:

| Nivel   | Ámbito                                         |
| ------- | ---------------------------------------------- |
| `self`  | Solo la sesión actual                          |
| `tree`  | Sesión actual + subagentes iniciados           |
| `agent` | Todas las sesiones de este agente              |
| `all`   | Todas las sesiones (entre agentes si se configura) |

El valor predeterminado es `tree`. Las sesiones aisladas se limitan a `tree` independientemente de la configuración.

## Lecturas adicionales

- [Gestión de sesiones](/es/concepts/session): enrutamiento, ciclo de vida y mantenimiento
- [Subagentes](/es/tools/subagents): ciclo de vida y entrega de las sesiones secundarias
- [Agentes ACP](/es/tools/acp-agents): inicio de entornos externos
- [Multiagente](/es/concepts/multi-agent): arquitectura multiagente
- [Configuración del Gateway](/es/gateway/configuration): opciones de configuración de las herramientas de sesión

## Relacionado

- [Gestión de sesiones](/es/concepts/session)
- [Depuración de sesiones](/es/concepts/session-pruning)

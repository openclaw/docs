---
read_when:
    - Quiere comprender de qué herramientas de sesión dispone el agente
    - Desea configurar el acceso entre sesiones o la creación de subagentes
    - Se desea inspeccionar el estado de los subagentes iniciados
summary: Herramientas de agente para consultar el estado y recuperar información entre sesiones, enviar mensajes y orquestar subagentes
title: Herramientas de sesión
x-i18n:
    generated_at: "2026-07-20T00:48:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: ceaf48addc9fc57afe2f6428cda03ed8b19f4efce93b13b58b7ef493a41c62fe
    source_path: concepts/session-tool.md
    workflow: 16
---

OpenClaw proporciona a los agentes herramientas para trabajar entre sesiones, inspeccionar el estado y orquestar subagentes.

## Herramientas disponibles

| Herramienta                 | Qué hace                                                                |
| -------------------- | --------------------------------------------------------------------------- |
| `sessions`           | Modifica la configuración visible de las sesiones y gestiona el catálogo global de grupos de sesiones  |
| `sessions_list`      | Enumera sesiones con filtros opcionales (tipo, etiqueta, agente, archivo, vista previa)  |
| `sessions_search`    | Busca en las transcripciones de las sesiones visibles y devuelve los fragmentos coincidentes             |
| `sessions_history`   | Lee la transcripción de una sesión específica                                   |
| `sessions_send`      | Ejecuta otra sesión en el mismo Gateway y, opcionalmente, espera                 |
| `conversations_list` | Enumera direcciones estables de conversaciones externas                                 |
| `conversations_send` | Envía a una conversación externa exacta sin ejecutar una sesión local     |
| `conversations_turn` | Envía a una conversación externa exacta y espera su respuesta correlacionada   |
| `sessions_spawn`     | Inicia una sesión aislada de subagente para trabajar en segundo plano                     |
| `sessions_yield`     | Finaliza el turno actual y espera los resultados posteriores de los subagentes               |
| `subagents`          | Enumera o cancela el trabajo en segundo plano de este árbol de sesiones                         |
| `session_status`     | Muestra una tarjeta de estilo `/status` y, opcionalmente, establece una sustitución del modelo por sesión |

Estas herramientas siguen sujetas al perfil de herramientas activo y a la política de permisos y denegaciones. `tools.profile: "coding"` incluye el conjunto completo de orquestación de sesiones. `tools.profile: "messaging"` incluye el autoservicio, el descubrimiento y la recuperación de sesiones, la mensajería entre sesiones, las herramientas para conversaciones externas y el ciclo de vida completo de creación (`sessions_spawn`, `sessions_yield` y `subagents`). Las herramientas de sugerencia de tareas exclusivas de la interfaz de usuario `spawn_task` y `dismiss_task` siguen siendo herramientas del perfil de programación.

Las políticas de grupo, proveedor, entorno aislado y agente pueden seguir eliminando esas herramientas después de la etapa de perfil. Use `/tools` desde la sesión afectada para inspeccionar la lista efectiva de herramientas.

## Enumeración y lectura de sesiones

`sessions_list` devuelve filas específicas de descubrimiento: clave de sesión, agente, tipo, canal, campos de etiqueta/título/vista previa, relaciones principales y secundarias, última actualización, estado de archivo/fijación, versión del estado, modelo, recuentos de tokens de contexto/totales, estado de ejecución y si la última ejecución se interrumpió. Filtre por `kinds` (matriz; valores aceptados: `main`, `group`, `cron`, `hook`, `node`, `other`), `label` exacto, `agentId` exacto, texto `search` o actualidad (`activeMinutes`). Las sesiones activas se devuelven de forma predeterminada; pase `archived: true` para inspeccionar en su lugar las sesiones archivadas. Establezca `includeDerivedTitles`, `includeLastMessage` o `messageLimit` (con un límite máximo de 20) cuando necesite una clasificación al estilo de un buzón: un título derivado limitado por la visibilidad, un fragmento de vista previa del último mensaje o mensajes recientes acotados en cada fila. Se omiten intencionalmente el enrutamiento de entrega, los identificadores internos de sesión, los tiempos y la configuración por ejecución, las estimaciones de costes y las rutas de las transcripciones; use `session_status`, las herramientas de conversación y `sessions_history` para esos detalles específicos del propietario. Los títulos y las vistas previas derivados solo se generan para las sesiones que el autor de la llamada ya puede ver según la política configurada de visibilidad de las herramientas de sesión, por lo que las sesiones no relacionadas permanecen ocultas. Cuando la visibilidad está restringida, `sessions_list` devuelve metadatos opcionales `visibility` que muestran el modo efectivo y una advertencia de que los resultados pueden estar limitados por el ámbito.

`sessions_history` recupera la transcripción de la conversación de una sesión específica. De forma predeterminada, se excluyen los resultados de las herramientas; pase `includeTools: true` para verlos. Use `limit` para obtener la cola acotada más reciente. Pase `offset: 0` cuando necesite metadatos de paginación y, después, pase los valores `nextOffset` devueltos para retroceder por ventanas anteriores de transcripciones de OpenClaw sin leer los archivos de transcripción sin procesar. Las páginas con desplazamiento explícito no combinan las importaciones externas alternativas de la CLI; use la vista predeterminada de la cola más reciente (sin `offset`) cuando necesite ese historial de visualización combinado.

La vista devuelta está intencionalmente acotada y filtrada por seguridad:

- el texto del asistente se normaliza antes de recuperarlo:
  - se eliminan las etiquetas de razonamiento
  - se eliminan los bloques estructurales `<relevant-memories>` / `<relevant_memories>`
  - se eliminan los bloques de carga XML de llamadas a herramientas en texto sin formato, como `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>` y `<function_calls>...</function_calls>`, incluidas las cargas truncadas que nunca se cierran correctamente
  - se eliminan las estructuras degradadas de llamadas/resultados de herramientas, como `[Tool Call: ...]`, `[Tool Result ...]` y `[Historical context ...]`
  - se eliminan los tokens de control del modelo filtrados, como `<|assistant|>`, otros tokens ASCII `<|...|>` y las variantes de ancho completo `<｜...｜>`
  - se elimina el XML de llamadas a herramientas de MiniMax con formato incorrecto, como `<invoke ...>` / `</minimax:tool_call>`
- el texto similar a credenciales o tokens se censura antes de devolverlo
- los bloques de texto largos se truncan
- los historiales muy grandes pueden descartar filas anteriores o sustituir una fila de tamaño excesivo por `[sessions_history omitted: message too large]`
- la herramienta informa de indicadores de resumen, como `truncated`, `droppedMessages`, `contentTruncated`, `contentRedacted`, `bytes` y metadatos de paginación

Use la **clave de sesión** devuelta (como `"main"`) con `sessions_history`, `sessions_send` y `session_status`. Esas herramientas de destino también pueden resolver un identificador de sesión conocido, pero `sessions_list` no expone los identificadores internos.

Si necesita la transcripción sin procesar exacta, inspeccione las filas de transcripción de SQLite dentro del ámbito en lugar de tratar `sessions_history` como un volcado sin filtrar.

Use [`sessions_search`](/es/concepts/session-search) para realizar una recuperación exacta de texto completo en el texto visible de las transcripciones del usuario y el asistente. Sus resultados incluyen un `sessionKey` para una llamada posterior a `sessions_history`; el filtrado de visibilidad, la censura de fragmentos y los límites de salida coinciden con los del historial.

## Gestión de la configuración y los grupos de sesiones

La herramienta `sessions`, restringida al propietario, expone dos superficies de autoservicio acotadas:

- `action: "patch"` modifica la sesión actual de forma predeterminada u otra sesión visible seleccionada mediante `sessionKey`. Puede establecer la etiqueta, el icono de la barra lateral, el estado de fijación/archivo, el modelo y el nivel de razonamiento. No expone acciones de restablecimiento, eliminación ni compactación.
- `group_list`, `group_set`, `group_rename` y `group_delete` gestionan el catálogo global ordenado de grupos de sesiones. `group_set` sustituye la lista ordenada de nombres en lugar de modificar una sola entrada.

Una modificación del modelo seleccionada por un agente permanece reversible hasta que dicha selección completa una ejecución correctamente. Si el modelo seleccionado es definitivamente inutilizable debido a un fallo de autenticación, facturación o modelo no encontrado, OpenClaw restaura el modelo anterior y escribe una nota visible del sistema. Los fallos transitorios por límite de frecuencia, sobrecarga, tiempo de espera, red y servidor no revierten la selección.

## Sesiones frente a conversaciones

Una **sesión** es el contexto local del modelo. Una **conversación** es una dirección externa exacta, como un interlocutor, canal o hilo. Ambas están vinculadas, pero no son intercambiables: los mensajes directos pueden compartir una sesión `main` y conservar direcciones de conversación independientes.

`conversations_list` devuelve valores `conversationRef` opacos para el agente activo. Con un `channel` explícito, el Gateway también actualiza las direcciones desde el directorio local de ese canal, como los interlocutores aprobados de Reef; use `query` para encontrar un interlocutor específico más allá de la página actual de resultados. El descubrimiento cataloga la dirección sin crear una sesión de contexto del modelo; la sesión subyacente solo se crea cuando la entrega o el contexto entrante la necesitan. El descubrimiento y la entrega de conversaciones están reservados al propietario porque utilizan las credenciales de canal del Gateway. Use `conversations_send` para una entrega sin espera de respuesta. Use `conversations_turn` cuando la respuesta remota pertenezca al turno actual del modelo: el Gateway reserva un identificador de mensaje de transporte, conserva una operación de entrega y la intención de la cola antes de la E/S de transporte, y devuelve la respuesta correlacionada desde la herramienta en lugar de iniciar un segundo turno del agente local. Las operaciones de entrega se almacenan fuera de las transcripciones del modelo; una respuesta capturada solo se conserva como artefacto secundario, mientras que el resultado de la herramienta contiene el contexto del modelo. Si el Gateway se reinicia después de poner el mensaje en cola, la entrega puede recuperarse, pero una respuesta posterior sigue el despacho entrante normal porque el proceso local que esperaba la respuesta ya no existe. Los mensajes entrantes no solicitados siempre continúan a través de la ruta normal de despacho del canal.

Use la herramienta compartida `message` cuando ya tenga un destino de canal explícito sin procesar o necesite una acción específica del canal. Las referencias de conversación están limitadas al agente activo y deben obtenerse mediante `conversations_list`, no construirse a partir de claves de sesión.

En el modo de código, las herramientas de conversación reutilizan sus contratos de salida exactos del Gateway. Una sola celda `exec` puede enumerar direcciones, seleccionar un `conversationRef` devuelto y llamar a `conversations_send` o `conversations_turn`; la política normal de herramientas y las aprobaciones siguen aplicándose a las llamadas anidadas.

## Envío de mensajes entre sesiones

`sessions_send` ejecuta otra sesión en el mismo Gateway y, opcionalmente, espera la respuesta. Su `sessionKey`, `label` o `agentId` selecciona el contexto local del modelo, no un destino externo. La respuesta resultante puede seguir anunciándose mediante el contexto de entrega establecido del solicitante o el destino; ese comportamiento existente no cambia. Para una entrega externa exacta, use una herramienta de conversación o `message` con un canal y un destino explícitos.

- **Sin esperar respuesta:** establezca `timeoutSeconds: 0` para poner la solicitud en cola y devolver el resultado inmediatamente.
- **Esperar respuesta:** establezca un tiempo de espera y obtenga la respuesta en línea.

Las sesiones de chat limitadas a un hilo, como las claves que terminan en `:thread:<id>`, no son destinos `sessions_send` válidos. Use la clave de sesión del canal principal para la coordinación entre agentes, de modo que los mensajes enrutados mediante herramientas no aparezcan dentro de un hilo activo orientado a usuarios humanos.

Los mensajes y las respuestas posteriores A2A se marcan como datos entre sesiones en la instrucción recibida (`[Inter-session message ... isUser=false]`) y en la procedencia de la transcripción. El agente receptor debe tratarlos como datos enrutados mediante herramientas, no como una instrucción escrita directamente por el usuario final.

Después de que responda el destino, OpenClaw puede ejecutar un **bucle de respuesta** en el que los agentes alternan mensajes hasta alcanzar el límite integrado. El agente de destino puede responder `REPLY_SKIP` para finalizar antes.

Pase `watch: true` para registrar también al remitente como observador de cambios de estado del destino: cuando posteriormente otro actor envíe al destino un mensaje humano directo o cambie su objetivo, el remitente recibirá un aviso del sistema que señala a `session_status` `changesSince`. El registro se produce después de un despacho correcto, se dirige a la sesión que recibió realmente el mensaje y comienza en su versión actual del estado, por lo que solo los cambios posteriores generan avisos. El resultado informa de `watched: true` cuando el registro se realiza correctamente. Consulte [Conocimiento del estado de la sesión](/es/concepts/session-state).

## Ayudantes de estado y orquestación

`session_status` es la herramienta ligera equivalente a `/status` para la sesión actual u otra sesión visible. Informa del uso, el tiempo, el estado del modelo y del entorno de ejecución, y el contexto de tareas en segundo plano vinculado cuando existe. Al igual que `/status`, puede completar contadores dispersos de tokens/caché a partir de la entrada de uso más reciente de la transcripción, y `model=default` elimina una sustitución específica de la sesión. Use `sessionKey="current"` para la sesión actual del autor de la llamada; las etiquetas visibles del cliente, como `openclaw-tui`, no son claves de sesión.

Cuando los metadatos de ruta están disponibles, `session_status` también incluye un bloque JSON visible de `Route context` y los campos estructurados correspondientes de `details`. Estos campos distinguen la clave de sesión de la ruta que gestiona actualmente la ejecución en vivo:

- `origin` indica dónde se creó la sesión, o el proveedor inferido a partir del prefijo de una clave de sesión apta para entrega cuando el estado anterior carece de metadatos de origen almacenados.
- `active` es la ruta actual de la ejecución en vivo. Solo se informa para la sesión en vivo o actual que se está gestionando en este momento.
- `deliveryContext` es la ruta de entrega persistente almacenada en la sesión, que OpenClaw puede reutilizar para entregas posteriores incluso cuando la superficie activa sea distinta.

## Cambios en el estado de la sesión

OpenClaw mantiene un registro duradero de señales sobre cambios relevantes en el estado de las sesiones (mensajes humanos directos a sesiones supervisadas, resultados de ejecuciones secundarias, cambios de objetivos y Compaction). Las filas de `sessions_list` y `session_status` exponen el `stateVersion` de la sesión, y `session_status` acepta `changesSince: <version>` para devolver los eventos tipados posteriores a esa versión, con una señalización exacta de `historyGap` cuando la versión solicitada es anterior al historial conservado. Los observadores —los padres que crean procesos automáticamente y los registrados explícitamente mediante `sessions_send watch: true`— reciben una única notificación consolidada de estado obsoleto cuando otro actor modifica una sesión supervisada.

Los eventos de cambio de estado omiten los identificadores repetidos de sesión y agente, y solo exponen campos de carga útiles para el modelo (`outcome`, `channel` o `turns`). El resumen del evento y los identificadores del actor y de la ejecución siguen disponibles para la conciliación.

Consulte [Conocimiento del estado de la sesión](/es/concepts/session-state) para conocer el modelo completo: tipos de eventos, registro de observadores, protocolo de notificación contra el spam, flujo de conciliación y límites actuales.

`sessions_yield` finaliza intencionadamente el turno actual para que el siguiente mensaje pueda ser el evento de seguimiento que se está esperando. Úselo después de crear subagentes cuando se desee que los resultados de finalización lleguen como el siguiente mensaje, en lugar de crear bucles de sondeo.

`subagents` es la vista del árbol de sesiones sobre las ejecuciones nativas de subagentes y el registro compartido de tareas en segundo plano. `action: "list"` informa sobre los subagentes activos o recientes, además de las tareas con ámbito de ACP, CLI/medios y Cron. `action: "cancel"` acepta un `taskId` devuelto y solo puede detener trabajo dentro del árbol de sesiones controlado por quien realiza la llamada; los subagentes hoja no pueden cancelar tareas de otra sesión.

## Creación de subagentes

`sessions_spawn` crea de forma predeterminada una sesión aislada para una tarea en segundo plano. Siempre es no bloqueante; devuelve inmediatamente un `runId` y un `childSessionKey`. Las ejecuciones nativas de subagentes reciben la tarea delegada en el primer mensaje visible `[Subagent Task]` de la sesión secundaria, mientras que el mensaje del sistema solo contiene las reglas de ejecución del subagente y el contexto de enrutamiento.

Opciones principales:

- `runtime: "subagent"` (predeterminado) o `"acp"` para agentes de sistemas externos.
- Sustituciones de `model` y `thinking` para la sesión secundaria.
- `thread: true` para vincular la creación a un hilo de chat (Discord, Slack, etc.).
- `sandbox: "require"` para imponer el aislamiento al proceso secundario.
- `context: "fork"` para subagentes nativos cuando el proceso secundario necesita la transcripción del solicitante actual; omítalo o use `context: "isolated"` para crear un proceso secundario limpio. `context: "fork"` solo es válido con `runtime: "subagent"`. Los subagentes nativos vinculados a hilos usan de forma predeterminada `context: "fork"`, salvo que `threadBindings.defaultSpawnContext` indique lo contrario.
- `visible: true` para crear una sesión persistente del panel en lugar de una sesión oculta de subagente. Las creaciones visibles admiten un modelo explícito, un directorio de trabajo, una bifurcación de la transcripción del mismo agente y un [árbol de trabajo administrado](/es/concepts/managed-worktrees) opcional; consulte [Subagentes](/es/tools/subagents#tool-parameters) para conocer los límites exactos de compatibilidad.

Los subagentes hoja predeterminados no reciben herramientas de sesión. Cuando `maxSpawnDepth >= 2`, los subagentes orquestadores de profundidad 1 reciben además `sessions_spawn`, `subagents`, `sessions_list` y `sessions_history` para poder gestionar sus propios procesos secundarios. Las ejecuciones hoja siguen sin recibir herramientas de orquestación recursiva.

Tras la finalización, un paso de anuncio publica el resultado en el canal del solicitante. La entrega de la finalización conserva el enrutamiento del hilo o tema vinculado cuando está disponible y, si el origen de la finalización solo identifica un canal, OpenClaw aún puede reutilizar la ruta almacenada de la sesión del solicitante (`lastChannel` / `lastTo`) para la entrega directa.

Para conocer el comportamiento específico de ACP, consulte [Agentes ACP](/es/tools/acp-agents).

## Visibilidad

El ámbito de las herramientas de sesión limita lo que puede ver el agente:

| Nivel   | Ámbito                                                      |
| ------- | ---------------------------------------------------------- |
| `self`  | Solo la sesión actual                                   |
| `tree`  | Actual + creadas; las lecturas incluyen grupos supervisados del mismo agente |
| `agent` | Todas las sesiones de este agente                                |
| `all`   | Todas las sesiones (entre agentes, si está configurado)                   |

El valor predeterminado es `tree`. Las sesiones aisladas se limitan a `tree` independientemente de la configuración.
Con el valor predeterminado `session.dmScope: "main"`, la actividad del grupo permite leer
desde la sesión principal las sesiones de grupo supervisadas del mismo agente.

## Lecturas adicionales

- [Gestión de sesiones](/es/concepts/session): enrutamiento, ciclo de vida y mantenimiento
- [Subagentes](/es/tools/subagents): ciclo de vida y entrega de las sesiones secundarias
- [Agentes ACP](/es/tools/acp-agents): creación mediante sistemas externos
- [Multiagente](/es/concepts/multi-agent): arquitectura multiagente
- [Configuración del Gateway](/es/gateway/configuration): opciones de configuración de las herramientas de sesión

## Contenido relacionado

- [Gestión de sesiones](/es/concepts/session)
- [Depuración de sesiones](/es/concepts/session-pruning)

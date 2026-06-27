---
read_when:
    - Quieres entender qué herramientas de sesión tiene el agente
    - Quieres configurar el acceso entre sesiones o la generación de subagentes
    - Quieres inspeccionar el estado de los subagentes iniciados
summary: Herramientas de agente para estado entre sesiones, recuperación, mensajería y orquestación de subagentes
title: Herramientas de sesión
x-i18n:
    generated_at: "2026-06-27T11:19:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 382f5d63062a03c410e3f7cc88281a35bf428ff74a58144543e49b3cd4eb5c8b
    source_path: concepts/session-tool.md
    workflow: 16
---

OpenClaw ofrece a los agentes herramientas para trabajar entre sesiones, inspeccionar el estado y
orquestar subagentes.

## Herramientas disponibles

| Herramienta        | Qué hace                                                                    |
| ------------------ | --------------------------------------------------------------------------- |
| `sessions_list`    | Lista sesiones con filtros opcionales (tipo, etiqueta, agente, antigüedad, vista previa) |
| `sessions_history` | Lee la transcripción de una sesión específica                               |
| `sessions_send`    | Envía un mensaje a otra sesión y, opcionalmente, espera                     |
| `sessions_spawn`   | Genera una sesión aislada de subagente para trabajo en segundo plano        |
| `sessions_yield`   | Finaliza el turno actual y espera resultados de seguimiento de subagentes   |
| `subagents`        | Lista el estado de los subagentes generados para esta sesión                |
| `session_status`   | Muestra una tarjeta estilo `/status` y, opcionalmente, establece una anulación de modelo por sesión |

Estas herramientas siguen estando sujetas al perfil de herramientas activo y a la
política de permitir/denegar. `tools.profile: "coding"` incluye el conjunto completo
de orquestación de sesiones, incluidos `sessions_spawn`, `sessions_yield` y `subagents`.
`tools.profile: "messaging"` incluye herramientas de mensajería entre sesiones
(`sessions_list`, `sessions_history`, `sessions_send`, `session_status`), pero
no incluye la generación de subagentes. Para conservar un perfil de mensajería y aun así
permitir delegación nativa, añade:

```json5
{
  tools: {
    profile: "messaging",
    alsoAllow: ["sessions_spawn", "sessions_yield", "subagents"],
  },
}
```

Las políticas de grupo, proveedor, sandbox y por agente aún pueden eliminar esas herramientas
después de la etapa de perfil. Usa `/tools` desde la sesión afectada para inspeccionar la
lista efectiva de herramientas.

## Listar y leer sesiones

`sessions_list` devuelve sesiones con su clave, agentId, tipo, canal, modelo,
recuentos de tokens y marcas de tiempo. Filtra por tipo (`main`, `group`, `cron`, `hook`,
`node`), `label` exacta, `agentId` exacto, texto de búsqueda o antigüedad
(`activeMinutes`). Cuando necesitas una clasificación tipo buzón, también puede solicitar un
título derivado limitado por visibilidad, un fragmento de vista previa del último mensaje o mensajes
recientes acotados en cada fila. Los títulos derivados y las vistas previas se producen solo para sesiones
que el llamador ya puede ver según la política configurada de visibilidad de herramientas de sesión, por lo que
las sesiones no relacionadas permanecen ocultas. Cuando la visibilidad está restringida, `sessions_list`
devuelve metadatos opcionales de `visibility` que muestran el modo efectivo y una advertencia de que
los resultados pueden estar limitados por alcance.

`sessions_history` obtiene la transcripción de conversación de una sesión específica.
De forma predeterminada, los resultados de herramientas se excluyen -- pasa `includeTools: true` para verlos.
La vista devuelta está intencionalmente acotada y filtrada por seguridad:

- el texto del asistente se normaliza antes de recuperarlo:
  - se eliminan las etiquetas de pensamiento
  - se eliminan los bloques de andamiaje `<relevant-memories>` / `<relevant_memories>`
  - se eliminan los bloques de carga útil XML de llamadas de herramientas en texto plano, como `<tool_call>...</tool_call>`,
    `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>` y
    `<function_calls>...</function_calls>`, incluidas las cargas útiles truncadas
    que nunca cierran correctamente
  - se elimina el andamiaje degradado de llamada/resultado de herramienta, como `[Tool Call: ...]`,
    `[Tool Result ...]` y `[Historical context ...]`
  - se eliminan los tokens filtrados de control del modelo, como `<|assistant|>`, otros tokens ASCII
    `<|...|>` y variantes de ancho completo `<｜...｜>`
  - se elimina XML de llamadas de herramienta MiniMax mal formado, como `<invoke ...>` /
    `</minimax:tool_call>`
- el texto similar a credenciales/tokens se redacta antes de devolverse
- los bloques de texto largos se truncan
- los historiales muy grandes pueden descartar filas antiguas o reemplazar una fila demasiado grande por
  `[sessions_history omitted: message too large]`
- la herramienta informa indicadores de resumen como `truncated`, `droppedMessages`,
  `contentTruncated`, `contentRedacted` y `bytes`

Ambas herramientas aceptan una **clave de sesión** (como `"main"`) o un **ID de sesión**
de una llamada de lista anterior.

Si necesitas la transcripción exacta byte por byte, inspecciona el archivo de transcripción en
disco en lugar de tratar `sessions_history` como un volcado sin procesar.

## Enviar mensajes entre sesiones

`sessions_send` entrega un mensaje a otra sesión y, opcionalmente, espera la
respuesta:

- **Enviar y olvidar:** establece `timeoutSeconds: 0` para poner en cola y devolver
  inmediatamente.
- **Esperar respuesta:** establece un tiempo de espera y recibe la respuesta en línea.

Las sesiones de chat con alcance de hilo, como claves de Slack o Discord que terminan en
`:thread:<id>`, no son destinos válidos de `sessions_send`. Usa la clave de sesión del canal padre
para la coordinación entre agentes, de modo que los mensajes enrutados por herramientas no aparezcan
dentro de un hilo activo visible para humanos.

Los mensajes y las respuestas de seguimiento A2A se marcan como datos entre sesiones en el
prompt receptor (`[Inter-session message ... isUser=false]`) y en la procedencia de la transcripción.
El agente receptor debe tratarlos como datos enrutados por herramientas, no como una
instrucción escrita directamente por el usuario final.

Después de que el destino responda, OpenClaw puede ejecutar un **bucle de respuesta de vuelta** en el que los
agentes alternan mensajes (hasta `session.agentToAgent.maxPingPongTurns`, rango
0-20, predeterminado 5). El agente destino puede responder
`REPLY_SKIP` para detenerse antes.

## Ayudantes de estado y orquestación

`session_status` es la herramienta ligera equivalente a `/status` para la sesión actual
u otra sesión visible. Informa uso, tiempo, estado de modelo/runtime y
contexto de tarea en segundo plano vinculada cuando existe. Igual que `/status`, puede rellenar
contadores dispersos de tokens/caché desde la entrada de uso de transcripción más reciente, y
`model=default` borra una anulación por sesión. Usa `sessionKey="current"` para
la sesión actual del llamador; las etiquetas visibles de cliente como `openclaw-tui` no son
claves de sesión.

Cuando hay metadatos de ruta disponibles, `session_status` también incluye un bloque JSON visible
`Route context` y campos estructurados `details` coincidentes. Estos
campos desambiguan la clave de sesión de la ruta que está manejando actualmente
la ejecución en vivo:

- `origin` es donde se creó la sesión, o el proveedor inferido a partir de un
  prefijo de clave de sesión entregable cuando el estado antiguo carece de metadatos de origen almacenados.
- `active` es la ruta actual de ejecución en vivo. Solo se informa para la sesión en vivo o
  actual que se está manejando ahora.
- `deliveryContext` es la ruta de entrega persistida almacenada en la sesión,
  que OpenClaw puede reutilizar para entregas posteriores incluso cuando la superficie activa
  difiere.

`sessions_yield` finaliza intencionalmente el turno actual para que el siguiente mensaje pueda ser
el evento de seguimiento que estás esperando. Úsalo después de generar subagentes cuando
quieras que los resultados de finalización lleguen como el siguiente mensaje en lugar de crear
bucles de sondeo.

`subagents` es el ayudante de visibilidad para subagentes de OpenClaw ya generados.
Admite `action: "list"` para inspeccionar ejecuciones activas/recientes.

## Generar subagentes

`sessions_spawn` crea una sesión aislada para una tarea en segundo plano de forma predeterminada.
Siempre es no bloqueante -- devuelve inmediatamente un `runId` y
`childSessionKey`. Las ejecuciones nativas de subagentes reciben la tarea delegada en el
primer mensaje visible `[Subagent Task]` de la sesión hija, mientras que el prompt del sistema
solo contiene reglas de runtime de subagente y contexto de enrutamiento.

Opciones clave:

- `runtime: "subagent"` (predeterminado) o `"acp"` para agentes de arnés externo.
- Anulaciones de `model` y `thinking` para la sesión hija.
- `thread: true` para vincular la generación a un hilo de chat (Discord, Slack, etc.).
- `sandbox: "require"` para imponer sandboxing en el hijo.
- `context: "fork"` para subagentes nativos cuando el hijo necesita la transcripción actual
  del solicitante; omítelo o usa `context: "isolated"` para un hijo limpio.
  Los subagentes nativos vinculados a hilos usan `context: "fork"` de forma predeterminada salvo que
  `threadBindings.defaultSpawnContext` indique lo contrario.

Los subagentes hoja predeterminados no reciben herramientas de sesión. Cuando
`maxSpawnDepth >= 2`, los subagentes orquestadores de profundidad 1 reciben además
`sessions_spawn`, `subagents`, `sessions_list` y `sessions_history` para que
puedan gestionar sus propios hijos. Las ejecuciones hoja siguen sin recibir herramientas de
orquestación recursiva.

Tras la finalización, un paso de anuncio publica el resultado en el canal del solicitante.
La entrega de finalización conserva el enrutamiento de hilo/tema vinculado cuando está disponible, y si
el origen de finalización solo identifica un canal, OpenClaw aún puede reutilizar la
ruta almacenada de la sesión solicitante (`lastChannel` / `lastTo`) para entrega
directa.

Para comportamiento específico de ACP, consulta [Agentes ACP](/es/tools/acp-agents).

## Visibilidad

Las herramientas de sesión están acotadas para limitar lo que el agente puede ver:

| Nivel   | Alcance                                  |
| ------- | ---------------------------------------- |
| `self`  | Solo la sesión actual                    |
| `tree`  | Sesión actual + subagentes generados     |
| `agent` | Todas las sesiones de este agente        |
| `all`   | Todas las sesiones (entre agentes si está configurado) |

El valor predeterminado es `tree`. Las sesiones con sandbox se limitan a `tree` independientemente de la
configuración.

## Lecturas adicionales

- [Gestión de sesiones](/es/concepts/session) -- enrutamiento, ciclo de vida, mantenimiento
- [Agentes ACP](/es/tools/acp-agents) -- generación de arneses externos
- [Multiagente](/es/concepts/multi-agent) -- arquitectura multiagente
- [Configuración de Gateway](/es/gateway/configuration) -- controles de configuración de herramientas de sesión

## Relacionado

- [Gestión de sesiones](/es/concepts/session)
- [Poda de sesiones](/es/concepts/session-pruning)

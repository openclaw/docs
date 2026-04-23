---
read_when:
    - Quieres entender qué herramientas de sesión tiene el agente
    - Quieres configurar el acceso entre sesiones o el inicio de subagentes
    - Quieres inspeccionar el estado o controlar subagentes iniciados
summary: Herramientas del agente para estado entre sesiones, recuperación de contexto, mensajería y orquestación de subagentes
title: Herramientas de sesión
x-i18n:
    generated_at: "2026-04-23T14:02:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: cd8b545429726d0880e6086ba7190497861bf3f3e1e88d53cb38ef9e5e4468c6
    source_path: concepts/session-tool.md
    workflow: 15
---

# Herramientas de sesión

OpenClaw ofrece a los agentes herramientas para trabajar entre sesiones, inspeccionar el estado y
orquestar subagentes.

## Herramientas disponibles

| Herramienta      | Qué hace                                                                  |
| ---------------- | ------------------------------------------------------------------------- |
| `sessions_list`    | Enumera sesiones con filtros opcionales (tipo, etiqueta, agente, antigüedad, vista previa)  |
| `sessions_history` | Lee la transcripción de una sesión específica                                   |
| `sessions_send`    | Envía un mensaje a otra sesión y, opcionalmente, espera                       |
| `sessions_spawn`   | Inicia una sesión aislada de subagente para trabajo en segundo plano                     |
| `sessions_yield`   | Finaliza el turno actual y espera resultados de seguimiento de subagentes               |
| `subagents`        | Enumera, dirige o mata subagentes iniciados para esta sesión                    |
| `session_status`   | Muestra una tarjeta de estilo `/status` y, opcionalmente, establece una anulación de modelo por sesión |

## Enumerar y leer sesiones

`sessions_list` devuelve sesiones con su clave, agentId, tipo, canal, modelo,
recuentos de tokens y marcas de tiempo. Filtra por tipo (`main`, `group`, `cron`, `hook`,
`node`), `label` exacta, `agentId` exacto, texto de búsqueda o antigüedad
(`activeMinutes`). Cuando necesitas triaje de estilo buzón, también puede solicitar un
título derivado con ámbito de visibilidad, un fragmento de vista previa del último mensaje o
mensajes recientes limitados en cada fila. Los títulos derivados y las vistas previas se generan solo para
sesiones que la persona que llama ya puede ver según la política de visibilidad de herramientas de sesión
configurada, por lo que las sesiones no relacionadas permanecen ocultas.

`sessions_history` recupera la transcripción de la conversación de una sesión específica.
De forma predeterminada, los resultados de herramientas se excluyen; pasa `includeTools: true` para verlos.
La vista devuelta está intencionadamente limitada y filtrada por seguridad:

- el texto del asistente se normaliza antes de recuperarse:
  - se eliminan las etiquetas de razonamiento
  - se eliminan los bloques de andamiaje `<relevant-memories>` / `<relevant_memories>`
  - se eliminan bloques de carga útil XML de llamada de herramienta en texto sin formato como `<tool_call>...</tool_call>`,
    `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>` y
    `<function_calls>...</function_calls>`, incluidos los payloads truncados
    que nunca se cierran correctamente
  - se elimina el andamiaje degradado de llamada/resultado de herramienta como `[Tool Call: ...]`,
    `[Tool Result ...]` y `[Historical context ...]`
  - se eliminan tokens filtrados de control del modelo como `<|assistant|>`, otros tokens ASCII
    `<|...|>` y variantes de ancho completo `<｜...｜>`
  - se elimina XML malformado de llamada de herramienta de MiniMax como `<invoke ...>` /
    `</minimax:tool_call>`
- el texto similar a credenciales/tokens se redacta antes de devolverse
- los bloques de texto largos se truncan
- los historiales muy grandes pueden descartar filas antiguas o reemplazar una fila sobredimensionada por
  `[sessions_history omitted: message too large]`
- la herramienta informa indicadores de resumen como `truncated`, `droppedMessages`,
  `contentTruncated`, `contentRedacted` y `bytes`

Ambas herramientas aceptan una **clave de sesión** (como `"main"`) o un **ID de sesión**
de una llamada anterior a la lista.

Si necesitas la transcripción exacta byte por byte, inspecciona el archivo de transcripción en
disco en lugar de tratar `sessions_history` como un volcado sin procesar.

## Enviar mensajes entre sesiones

`sessions_send` entrega un mensaje a otra sesión y, opcionalmente, espera
la respuesta:

- **Enviar y continuar:** establece `timeoutSeconds: 0` para ponerlo en cola y devolver
  inmediatamente.
- **Esperar respuesta:** establece un tiempo de espera y obtén la respuesta en línea.

Después de que el destino responda, OpenClaw puede ejecutar un **bucle de respuesta**
en el que los agentes alternan mensajes (hasta 5 turnos). El agente de destino puede responder
`REPLY_SKIP` para detenerse antes.

## Ayudantes de estado y orquestación

`session_status` es la herramienta ligera equivalente a `/status` para la sesión actual
u otra sesión visible. Informa uso, tiempo, estado de modelo/entorno de ejecución y
contexto vinculado de tareas en segundo plano cuando está presente. Al igual que `/status`, puede completar
contadores escasos de tokens/caché a partir de la última entrada de uso de la transcripción, y
`model=default` borra una anulación por sesión.

`sessions_yield` finaliza intencionadamente el turno actual para que el siguiente mensaje pueda ser
el evento de seguimiento que estás esperando. Úsalo después de iniciar subagentes cuando
quieras que los resultados de finalización lleguen como el siguiente mensaje en lugar de crear
bucles de sondeo.

`subagents` es el ayudante de plano de control para subagentes de OpenClaw ya
iniciados. Admite:

- `action: "list"` para inspeccionar ejecuciones activas/recientes
- `action: "steer"` para enviar orientación de seguimiento a un hijo en ejecución
- `action: "kill"` para detener un hijo o `all`

## Iniciar subagentes

`sessions_spawn` crea una sesión aislada para una tarea en segundo plano. Siempre es
no bloqueante: devuelve inmediatamente con un `runId` y `childSessionKey`.

Opciones principales:

- `runtime: "subagent"` (predeterminado) o `"acp"` para agentes de arnés externos.
- anulaciones `model` y `thinking` para la sesión hija.
- `thread: true` para vincular la ejecución a un hilo de chat (Discord, Slack, etc.).
- `sandbox: "require"` para forzar el sandboxing en el hijo.

Los subagentes hoja predeterminados no obtienen herramientas de sesión. Cuando
`maxSpawnDepth >= 2`, los subagentes orquestadores de profundidad 1 reciben además
`sessions_spawn`, `subagents`, `sessions_list` y `sessions_history` para que
puedan gestionar a sus propios hijos. Las ejecuciones hoja siguen sin obtener herramientas
de orquestación recursiva.

Tras la finalización, un paso de anuncio publica el resultado en el canal del solicitante.
La entrega de finalización conserva el enrutamiento vinculado de hilo/tema cuando está disponible, y si
el origen de la finalización solo identifica un canal, OpenClaw aún puede reutilizar la ruta almacenada
de la sesión del solicitante (`lastChannel` / `lastTo`) para entrega directa.

Para el comportamiento específico de ACP, consulta [ACP Agents](/es/tools/acp-agents).

## Visibilidad

Las herramientas de sesión tienen alcance limitado para restringir lo que el agente puede ver:

| Nivel   | Alcance                                    |
| ------- | ---------------------------------------- |
| `self`  | Solo la sesión actual                 |
| `tree`  | Sesión actual + subagentes iniciados     |
| `agent` | Todas las sesiones de este agente              |
| `all`   | Todas las sesiones (entre agentes si está configurado) |

El valor predeterminado es `tree`. Las sesiones en sandbox se limitan a `tree` independientemente de la
configuración.

## Lectura adicional

- [Gestión de sesiones](/es/concepts/session) -- enrutamiento, ciclo de vida, mantenimiento
- [ACP Agents](/es/tools/acp-agents) -- inicio de arneses externos
- [Multi-agent](/es/concepts/multi-agent) -- arquitectura multiagente
- [Gateway Configuration](/es/gateway/configuration) -- controles de configuración de herramientas de sesión

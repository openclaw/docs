---
read_when:
    - Quieres entender qué herramientas de sesión tiene el agente
    - Quieres configurar acceso entre sesiones o creación de subagentes
    - Quieres inspeccionar el estado o controlar subagentes generados
summary: Herramientas del agente para estado entre sesiones, recuperación, mensajería y orquestación de subagentes
title: Herramientas de sesión
x-i18n:
    generated_at: "2026-04-24T05:26:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: e3032178a83e662009c3ea463f02cb20d604069d1634d5c24a9f86988e676b2e
    source_path: concepts/session-tool.md
    workflow: 15
---

OpenClaw ofrece a los agentes herramientas para trabajar entre sesiones, inspeccionar el estado y
orquestar subagentes.

## Herramientas disponibles

| Herramienta        | Qué hace                                                                  |
| ------------------ | ------------------------------------------------------------------------- |
| `sessions_list`    | Lista sesiones con filtros opcionales (tipo, etiqueta, agente, antigüedad, vista previa) |
| `sessions_history` | Lee la transcripción de una sesión específica                             |
| `sessions_send`    | Envía un mensaje a otra sesión y opcionalmente espera                     |
| `sessions_spawn`   | Genera una sesión aislada de subagente para trabajo en segundo plano      |
| `sessions_yield`   | Finaliza el turno actual y espera resultados de seguimiento de subagentes |
| `subagents`        | Lista, dirige o mata subagentes generados para esta sesión                |
| `session_status`   | Muestra una tarjeta estilo `/status` y opcionalmente establece una sobrescritura de modelo por sesión |

## Listar y leer sesiones

`sessions_list` devuelve sesiones con su clave, agentId, tipo, canal, modelo,
recuentos de tokens y marcas de tiempo. Filtra por tipo (`main`, `group`, `cron`, `hook`,
`node`), `label` exacta, `agentId` exacto, texto de búsqueda o antigüedad
(`activeMinutes`). Cuando necesitas un triaje estilo buzón, también puede solicitar un
título derivado con alcance de visibilidad, un snippet de vista previa del último mensaje o
mensajes recientes limitados en cada fila. Los títulos derivados y las vistas previas solo se producen para
sesiones que la persona que llama ya puede ver según la política configurada de
visibilidad de herramientas de sesión, de modo que las sesiones no relacionadas permanezcan ocultas.

`sessions_history` obtiene la transcripción de conversación de una sesión específica.
De forma predeterminada, los resultados de herramientas se excluyen; pasa `includeTools: true` para verlos.
La vista devuelta está intencionadamente limitada y filtrada por seguridad:

- el texto del asistente se normaliza antes de recuperarse:
  - se eliminan las etiquetas de pensamiento
  - se eliminan los bloques de scaffolding `<relevant-memories>` / `<relevant_memories>`
  - se eliminan los bloques de carga XML de llamada a herramienta en texto plano como `<tool_call>...</tool_call>`,
    `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>` y
    `<function_calls>...</function_calls>`, incluidas las cargas truncadas
    que nunca se cierran limpiamente
  - se elimina el scaffolding degradado de llamada/resultado de herramienta como `[Tool Call: ...]`,
    `[Tool Result ...]` y `[Historical context ...]`
  - se eliminan los tokens de control del modelo filtrados como `<|assistant|>`, otros tokens ASCII
    `<|...|>` y variantes de ancho completo `<｜...｜>`
  - se elimina XML malformado de llamada a herramienta de MiniMax como `<invoke ...>` /
    `</minimax:tool_call>`
- el texto similar a credenciales/tokens se redacciona antes de devolverse
- los bloques de texto largos se truncan
- los historiales muy grandes pueden descartar filas antiguas o reemplazar una fila sobredimensionada con
  `[sessions_history omitted: message too large]`
- la herramienta informa indicadores de resumen como `truncated`, `droppedMessages`,
  `contentTruncated`, `contentRedacted` y `bytes`

Ambas herramientas aceptan una **clave de sesión** (como `"main"`) o un **ID de sesión**
de una llamada anterior a list.

Si necesitas la transcripción exacta byte por byte, inspecciona el archivo de transcripción en
disco en lugar de tratar `sessions_history` como un volcado sin procesar.

## Enviar mensajes entre sesiones

`sessions_send` entrega un mensaje a otra sesión y opcionalmente espera
la respuesta:

- **Enviar y seguir:** establece `timeoutSeconds: 0` para ponerlo en cola y devolver
  inmediatamente.
- **Esperar respuesta:** establece un tiempo de espera y obtén la respuesta en línea.

Después de que el destino responda, OpenClaw puede ejecutar un **bucle de respuesta**
donde los agentes alternan mensajes (hasta 5 turnos). El agente de destino puede responder
`REPLY_SKIP` para detenerse antes.

## Ayudantes de estado y orquestación

`session_status` es la herramienta ligera equivalente a `/status` para la sesión actual
u otra sesión visible. Informa uso, tiempo, estado de modelo/tiempo de ejecución y
contexto enlazado de tareas en segundo plano cuando está presente. Igual que `/status`, puede rellenar
contadores dispersos de tokens/caché a partir de la última entrada de uso de la transcripción, y
`model=default` borra una sobrescritura por sesión.

`sessions_yield` finaliza intencionadamente el turno actual para que el siguiente mensaje pueda ser
el evento de seguimiento que estás esperando. Úsalo después de generar subagentes cuando
quieras que los resultados de finalización lleguen como siguiente mensaje en lugar de construir
bucles de sondeo.

`subagents` es el ayudante del plano de control para subagentes de OpenClaw ya
generados. Admite:

- `action: "list"` para inspeccionar ejecuciones activas/recientes
- `action: "steer"` para enviar guía de seguimiento a un hijo en ejecución
- `action: "kill"` para detener un hijo o `all`

## Generar subagentes

`sessions_spawn` crea una sesión aislada para una tarea en segundo plano de forma predeterminada.
Siempre es no bloqueante: devuelve inmediatamente un `runId` y
`childSessionKey`.

Opciones clave:

- `runtime: "subagent"` (predeterminado) o `"acp"` para agentes de harness externos.
- Sobrescrituras de `model` y `thinking` para la sesión hija.
- `thread: true` para vincular la generación a un hilo de chat (Discord, Slack, etc.).
- `sandbox: "require"` para forzar sandbox en el hijo.
- `context: "fork"` para subagentes nativos cuando el hijo necesita la transcripción actual
  del solicitante; omítelo o usa `context: "isolated"` para un hijo limpio.

Los subagentes hoja predeterminados no reciben herramientas de sesión. Cuando
`maxSpawnDepth >= 2`, los subagentes orquestadores de profundidad 1 reciben además
`sessions_spawn`, `subagents`, `sessions_list` y `sessions_history` para que
puedan gestionar a sus propios hijos. Las ejecuciones hoja siguen sin obtener herramientas
de orquestación recursiva.

Después de completarse, un paso de anuncio publica el resultado en el canal del solicitante.
La entrega de finalización conserva el enrutamiento vinculado de hilo/tema cuando está disponible, y si
el origen de la finalización solo identifica un canal, OpenClaw aún puede reutilizar la ruta
almacenada de la sesión del solicitante (`lastChannel` / `lastTo`) para una entrega
directa.

Para el comportamiento específico de ACP, consulta [Agentes ACP](/es/tools/acp-agents).

## Visibilidad

Las herramientas de sesión están limitadas para restringir lo que el agente puede ver:

| Nivel   | Alcance                                  |
| ------- | ---------------------------------------- |
| `self`  | Solo la sesión actual                    |
| `tree`  | Sesión actual + subagentes generados     |
| `agent` | Todas las sesiones de este agente        |
| `all`   | Todas las sesiones (entre agentes si está configurado) |

El valor predeterminado es `tree`. Las sesiones con sandbox se limitan a `tree` independientemente de la
configuración.

## Lectura adicional

- [Gestión de sesiones](/es/concepts/session) -- enrutamiento, ciclo de vida, mantenimiento
- [Agentes ACP](/es/tools/acp-agents) -- generación de harness externo
- [Multi-agent](/es/concepts/multi-agent) -- arquitectura multiagente
- [Configuración de Gateway](/es/gateway/configuration) -- ajustes de configuración de herramientas de sesión

## Relacionado

- [Gestión de sesiones](/es/concepts/session)
- [Poda de sesiones](/es/concepts/session-pruning)

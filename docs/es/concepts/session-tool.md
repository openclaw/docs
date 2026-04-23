---
read_when:
    - Quieres entender qué herramientas de sesión tiene el agente
    - Quieres configurar el acceso entre sesiones o la generación de subagentes
    - Quieres inspeccionar el estado o controlar los subagentes generados
summary: Herramientas del agente para estado entre sesiones, recuperación, mensajería y orquestación de subagentes
title: Herramientas de sesión
x-i18n:
    generated_at: "2026-04-23T05:14:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: d99408f3052f4fa461bc26bf79456e7f852069ec101b9d593442cef6dd20a3ac
    source_path: concepts/session-tool.md
    workflow: 15
---

# Herramientas de sesión

OpenClaw ofrece a los agentes herramientas para trabajar entre sesiones, inspeccionar el estado y
orquestar subagentes.

## Herramientas disponibles

| Herramienta        | Qué hace                                                                    |
| ------------------ | --------------------------------------------------------------------------- |
| `sessions_list`    | Enumera sesiones con filtros opcionales (tipo, etiqueta, agente, actividad reciente, vista previa) |
| `sessions_history` | Lee la transcripción de una sesión específica                               |
| `sessions_send`    | Envía un mensaje a otra sesión y opcionalmente espera                       |
| `sessions_spawn`   | Genera una sesión aislada de subagente para trabajo en segundo plano        |
| `sessions_yield`   | Finaliza el turno actual y espera resultados de seguimiento de subagentes   |
| `subagents`        | Enumera, dirige o finaliza subagentes generados para esta sesión            |
| `session_status`   | Muestra una tarjeta estilo `/status` y opcionalmente establece una invalidación de modelo por sesión |

## Enumeración y lectura de sesiones

`sessions_list` devuelve sesiones con su clave, agentId, tipo, canal, modelo,
recuentos de tokens y marcas de tiempo. Filtra por tipo (`main`, `group`, `cron`, `hook`,
`node`), `label` exacta, `agentId` exacto, texto de búsqueda o actividad reciente
(`activeMinutes`). Cuando necesitas un triaje estilo buzón, también puede solicitar
títulos derivados, vistas previas del último mensaje o mensajes recientes acotados. Las lecturas de
vista previa de la transcripción se limitan a las sesiones visibles según la política de visibilidad
configurada para las herramientas de sesión.

`sessions_history` recupera la transcripción de la conversación de una sesión específica.
De forma predeterminada, los resultados de herramientas se excluyen; usa `includeTools: true` para verlos.
La vista devuelta está intencionalmente acotada y filtrada por seguridad:

- el texto del asistente se normaliza antes de recuperarse:
  - se eliminan las etiquetas de thinking
  - se eliminan los bloques de andamiaje `<relevant-memories>` / `<relevant_memories>`
  - se eliminan bloques XML de carga útil de llamada de herramienta en texto plano como `<tool_call>...</tool_call>`,
    `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>` y
    `<function_calls>...</function_calls>`, incluidas las cargas útiles
    truncadas que nunca se cierran correctamente
  - se elimina el andamiaje degradado de llamada/resultado de herramienta como `[Tool Call: ...]`,
    `[Tool Result ...]` y `[Historical context ...]`
  - se eliminan tokens de control del modelo filtrados como `<|assistant|>`, otros tokens ASCII
    `<|...|>` y variantes de ancho completo `<｜...｜>`
  - se elimina XML de llamada de herramienta MiniMax malformado como `<invoke ...>` /
    `</minimax:tool_call>`
- el texto similar a credenciales/tokens se redacta antes de devolverse
- los bloques de texto largos se truncan
- los historiales muy grandes pueden omitir filas más antiguas o reemplazar una fila sobredimensionada por
  `[sessions_history omitted: message too large]`
- la herramienta informa indicadores de resumen como `truncated`, `droppedMessages`,
  `contentTruncated`, `contentRedacted` y `bytes`

Ambas herramientas aceptan una **clave de sesión** (como `"main"`) o un **ID de sesión**
de una llamada anterior de enumeración.

Si necesitas la transcripción exacta byte por byte, inspecciona el archivo de transcripción en
disco en lugar de tratar `sessions_history` como un volcado bruto.

## Envío de mensajes entre sesiones

`sessions_send` entrega un mensaje a otra sesión y opcionalmente espera
la respuesta:

- **Enviar y olvidar:** establece `timeoutSeconds: 0` para ponerlo en cola y devolver
  inmediatamente.
- **Esperar respuesta:** establece un tiempo de espera y obtén la respuesta en línea.

Después de que el destino responda, OpenClaw puede ejecutar un **bucle de respuesta de vuelta** en el que los
agentes alternan mensajes (hasta 5 turnos). El agente de destino puede responder
`REPLY_SKIP` para detenerse antes.

## Ayudantes de estado y orquestación

`session_status` es la herramienta ligera equivalente a `/status` para la sesión actual
u otra sesión visible. Informa uso, tiempo, estado del modelo/runtime y contexto enlazado de tareas en segundo plano cuando existe. Al igual que `/status`, puede completar
contadores dispersos de tokens/caché a partir de la entrada de uso más reciente de la transcripción, y
`model=default` borra una invalidación por sesión.

`sessions_yield` finaliza intencionalmente el turno actual para que el siguiente mensaje pueda ser
el evento de seguimiento que estás esperando. Úsala después de generar subagentes cuando
quieras que los resultados de finalización lleguen como el siguiente mensaje en lugar de construir
bucles de sondeo.

`subagents` es el ayudante de plano de control para los subagentes de OpenClaw ya
generados. Admite:

- `action: "list"` para inspeccionar ejecuciones activas/recientes
- `action: "steer"` para enviar orientación de seguimiento a un hijo en ejecución
- `action: "kill"` para detener un hijo o `all`

## Generación de subagentes

`sessions_spawn` crea una sesión aislada para una tarea en segundo plano. Siempre es
no bloqueante: devuelve inmediatamente un `runId` y una `childSessionKey`.

Opciones clave:

- `runtime: "subagent"` (predeterminado) o `"acp"` para agentes de arnés externos.
- Invalidaciones de `model` y `thinking` para la sesión hija.
- `thread: true` para vincular la generación a un hilo de chat (Discord, Slack, etc.).
- `sandbox: "require"` para exigir sandboxing en el hijo.

Los subagentes hoja predeterminados no reciben herramientas de sesión. Cuando
`maxSpawnDepth >= 2`, los subagentes orquestadores de profundidad 1 reciben adicionalmente
`sessions_spawn`, `subagents`, `sessions_list` y `sessions_history` para que
puedan gestionar sus propios hijos. Las ejecuciones hoja siguen sin recibir herramientas de
orquestación recursiva.

Después de completarse, un paso de anuncio publica el resultado en el canal del solicitante.
La entrega de finalización conserva el enrutamiento vinculado de hilo/tema cuando está disponible, y si
el origen de finalización solo identifica un canal, OpenClaw aún puede reutilizar la ruta almacenada
de la sesión del solicitante (`lastChannel` / `lastTo`) para entrega
directa.

Para el comportamiento específico de ACP, consulta [Agentes ACP](/es/tools/acp-agents).

## Visibilidad

Las herramientas de sesión tienen alcance limitado para restringir lo que el agente puede ver:

| Nivel   | Alcance                                  |
| ------- | ---------------------------------------- |
| `self`  | Solo la sesión actual                    |
| `tree`  | Sesión actual + subagentes generados     |
| `agent` | Todas las sesiones de este agente        |
| `all`   | Todas las sesiones (entre agentes si está configurado) |

El valor predeterminado es `tree`. Las sesiones en sandbox se limitan a `tree` independientemente de la
configuración.

## Más información

- [Gestión de sesiones](/es/concepts/session) -- enrutamiento, ciclo de vida, mantenimiento
- [Agentes ACP](/es/tools/acp-agents) -- generación de arnés externo
- [Multi-agent](/es/concepts/multi-agent) -- arquitectura multiagente
- [Configuración del Gateway](/es/gateway/configuration) -- controles de configuración de herramientas de sesión

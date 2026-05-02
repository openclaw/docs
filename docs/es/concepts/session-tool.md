---
read_when:
    - Quieres entender qué herramientas de sesión tiene el agente
    - Quieres configurar el acceso entre sesiones o la generación de subagentes
    - Desea inspeccionar el estado o controlar subagentes creados
summary: Herramientas de agente para estado entre sesiones, recuperación, mensajería y orquestación de subagentes
title: Herramientas de sesión
x-i18n:
    generated_at: "2026-05-02T05:25:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: e9343d42319492ac4531edd6e6c217eae13e9c5f7b8a3fc25a345395d9f57246
    source_path: concepts/session-tool.md
    workflow: 16
---

OpenClaw proporciona a los agentes herramientas para trabajar entre sesiones, inspeccionar el estado y
orquestar subagentes.

## Herramientas disponibles

| Herramienta         | Qué hace                                                                                  |
| ------------------- | ----------------------------------------------------------------------------------------- |
| `sessions_list`     | Lista sesiones con filtros opcionales (tipo, etiqueta, agente, antigüedad, vista previa) |
| `sessions_history`  | Lee la transcripción de una sesión específica                                             |
| `sessions_send`     | Envía un mensaje a otra sesión y, opcionalmente, espera                                  |
| `sessions_spawn`    | Genera una sesión de subagente aislada para trabajo en segundo plano                     |
| `sessions_yield`    | Finaliza el turno actual y espera resultados de seguimiento de subagentes                |
| `subagents`         | Lista, dirige o termina subagentes generados para esta sesión                            |
| `session_status`    | Muestra una tarjeta de estilo `/status` y, opcionalmente, define una anulación de modelo por sesión |

Estas herramientas siguen sujetas al perfil de herramientas activo y a la
política de permitir/denegar. `tools.profile: "coding"` incluye el conjunto
completo de orquestación de sesiones, incluidos `sessions_spawn`,
`sessions_yield` y `subagents`. `tools.profile: "messaging"` incluye las
herramientas de mensajería entre sesiones (`sessions_list`, `sessions_history`,
`sessions_send`, `session_status`), pero no incluye la generación de
subagentes. Para mantener un perfil de mensajería y aun así permitir delegación
nativa, añade:

```json5
{
  tools: {
    profile: "messaging",
    alsoAllow: ["sessions_spawn", "sessions_yield", "subagents"],
  },
}
```

Las políticas de grupo, proveedor, sandbox y por agente aún pueden eliminar
esas herramientas después de la etapa de perfil. Usa `/tools` desde la sesión
afectada para inspeccionar la lista de herramientas efectiva.

## Listar y leer sesiones

`sessions_list` devuelve sesiones con su clave, agentId, tipo, canal, modelo,
conteos de tokens y marcas de tiempo. Filtra por tipo (`main`, `group`, `cron`,
`hook`, `node`), `label` exacta, `agentId` exacto, texto de búsqueda o
antigüedad (`activeMinutes`). Cuando necesites una triaje de estilo buzón,
también puede solicitar un título derivado limitado por visibilidad, un
fragmento de vista previa del último mensaje o mensajes recientes acotados en
cada fila. Los títulos derivados y las vistas previas se producen solo para
sesiones que el llamador ya puede ver según la política de visibilidad de
herramientas de sesión configurada, por lo que las sesiones no relacionadas
permanecen ocultas.

`sessions_history` obtiene la transcripción de conversación de una sesión
específica. De forma predeterminada, se excluyen los resultados de herramientas:
pasa `includeTools: true` para verlos. La vista devuelta está intencionalmente
acotada y filtrada por seguridad:

- el texto del asistente se normaliza antes de la recuperación:
  - se eliminan las etiquetas de razonamiento
  - se eliminan los bloques de andamiaje `<relevant-memories>` / `<relevant_memories>`
  - se eliminan los bloques de carga XML de llamadas a herramientas en texto plano, como `<tool_call>...</tool_call>`,
    `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>` y
    `<function_calls>...</function_calls>`, incluidos los contenidos truncados
    que nunca se cierran limpiamente
  - se elimina el andamiaje degradado de llamadas/resultados de herramientas, como `[Tool Call: ...]`,
    `[Tool Result ...]` y `[Historical context ...]`
  - se eliminan los tokens de control del modelo filtrados, como `<|assistant|>`, otros tokens ASCII
    `<|...|>` y variantes de ancho completo `<｜...｜>`
  - se elimina XML de llamada a herramienta MiniMax mal formado, como `<invoke ...>` /
    `</minimax:tool_call>`
- el texto similar a credenciales o tokens se redacta antes de devolverse
- los bloques de texto largos se truncan
- los historiales muy grandes pueden omitir filas antiguas o reemplazar una fila demasiado grande con
  `[sessions_history omitted: message too large]`
- la herramienta informa indicadores de resumen como `truncated`, `droppedMessages`,
  `contentTruncated`, `contentRedacted` y `bytes`

Ambas herramientas aceptan una **clave de sesión** (como `"main"`) o un **ID de sesión**
de una llamada de listado anterior.

Si necesitas la transcripción exacta byte por byte, inspecciona el archivo de
transcripción en disco en lugar de tratar `sessions_history` como un volcado sin procesar.

## Enviar mensajes entre sesiones

`sessions_send` entrega un mensaje a otra sesión y, opcionalmente, espera la
respuesta:

- **Enviar y olvidar:** define `timeoutSeconds: 0` para encolar y devolver
  inmediatamente.
- **Esperar respuesta:** define un tiempo de espera y recibe la respuesta en línea.

Las sesiones de chat con ámbito de hilo, como claves de Slack o Discord que terminan en
`:thread:<id>`, no son destinos válidos de `sessions_send`. Usa la clave de sesión
del canal padre para la coordinación entre agentes, de modo que los mensajes enrutados
por herramientas no aparezcan dentro de un hilo activo orientado a humanos.

Los mensajes y las respuestas de seguimiento A2A se marcan como datos entre sesiones en el
prompt receptor (`[Inter-session message ... isUser=false]`) y en la procedencia de la
transcripción. El agente receptor debe tratarlos como datos enrutados por herramientas, no
como una instrucción escrita directamente por el usuario final.

Después de que el destino responda, OpenClaw puede ejecutar un **bucle de respuesta**
en el que los agentes alternan mensajes (hasta 5 turnos). El agente de destino puede
responder `REPLY_SKIP` para detenerse antes.

## Ayudantes de estado y orquestación

`session_status` es la herramienta ligera equivalente a `/status` para la sesión actual
u otra sesión visible. Informa uso, hora, estado de modelo/runtime y contexto de tareas
en segundo plano vinculadas cuando está presente. Al igual que `/status`, puede completar
contadores dispersos de tokens/caché desde la entrada de uso de transcripción más reciente, y
`model=default` borra una anulación por sesión. Usa `sessionKey="current"` para
la sesión actual del llamador; las etiquetas de cliente visibles como `openclaw-tui` no son
claves de sesión.

`sessions_yield` finaliza intencionalmente el turno actual para que el siguiente mensaje pueda ser
el evento de seguimiento que estás esperando. Úsalo después de generar subagentes cuando
quieras que los resultados de finalización lleguen como el siguiente mensaje en lugar de construir
bucles de sondeo.

`subagents` es el ayudante del plano de control para subagentes de OpenClaw ya generados.
Admite:

- `action: "list"` para inspeccionar ejecuciones activas/recientes
- `action: "steer"` para enviar orientación de seguimiento a un hijo en ejecución
- `action: "kill"` para detener un hijo o `all`

## Generar subagentes

`sessions_spawn` crea de forma predeterminada una sesión aislada para una tarea en segundo plano.
Siempre es no bloqueante: devuelve inmediatamente un `runId` y
`childSessionKey`.

Opciones clave:

- `runtime: "subagent"` (predeterminado) o `"acp"` para agentes de arnés externos.
- Anulaciones de `model` y `thinking` para la sesión hija.
- `thread: true` para vincular la generación a un hilo de chat (Discord, Slack, etc.).
- `sandbox: "require"` para aplicar sandboxing en el hijo.
- `context: "fork"` para subagentes nativos cuando el hijo necesita la transcripción
  actual del solicitante; omítelo o usa `context: "isolated"` para un hijo limpio.

Los subagentes hoja predeterminados no reciben herramientas de sesión. Cuando
`maxSpawnDepth >= 2`, los subagentes orquestadores de profundidad 1 reciben además
`sessions_spawn`, `subagents`, `sessions_list` y `sessions_history` para que puedan
gestionar sus propios hijos. Las ejecuciones hoja aún no reciben herramientas de
orquestación recursiva.

Tras la finalización, un paso de anuncio publica el resultado en el canal del solicitante.
La entrega de finalización conserva el enrutamiento de hilo/tema vinculado cuando está disponible, y si
el origen de la finalización solo identifica un canal, OpenClaw aún puede reutilizar la
ruta almacenada de la sesión del solicitante (`lastChannel` / `lastTo`) para la entrega
directa.

Para comportamiento específico de ACP, consulta [Agentes ACP](/es/tools/acp-agents).

## Visibilidad

Las herramientas de sesión tienen un ámbito para limitar lo que el agente puede ver:

| Nivel   | Ámbito                                      |
| ------- | ------------------------------------------- |
| `self`  | Solo la sesión actual                       |
| `tree`  | Sesión actual + subagentes generados        |
| `agent` | Todas las sesiones de este agente           |
| `all`   | Todas las sesiones (entre agentes si se configura) |

El valor predeterminado es `tree`. Las sesiones con sandbox se limitan a `tree`
independientemente de la configuración.

## Lecturas adicionales

- [Gestión de sesiones](/es/concepts/session) -- enrutamiento, ciclo de vida, mantenimiento
- [Agentes ACP](/es/tools/acp-agents) -- generación de arnés externo
- [Multiagente](/es/concepts/multi-agent) -- arquitectura multiagente
- [Configuración de Gateway](/es/gateway/configuration) -- opciones de configuración de herramientas de sesión

## Relacionado

- [Gestión de sesiones](/es/concepts/session)
- [Poda de sesiones](/es/concepts/session-pruning)

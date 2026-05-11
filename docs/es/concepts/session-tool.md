---
read_when:
    - Quieres entender qué herramientas de sesión tiene el agente
    - Desea configurar el acceso entre sesiones o la creación de subagentes
    - Desea inspeccionar el estado o controlar subagentes creados
summary: Herramientas de agente entre sesiones para estado, recuperación, mensajería y orquestación de subagentes
title: Herramientas de sesión
x-i18n:
    generated_at: "2026-05-11T20:32:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: e91f1f956ff882cabf7df51bd8c08836398decfb185c56c42db4052f24b3f716
    source_path: concepts/session-tool.md
    workflow: 16
---

OpenClaw proporciona a los agentes herramientas para trabajar entre sesiones, inspeccionar el estado y
orquestar subagentes.

## Herramientas disponibles

| Herramienta        | Qué hace                                                                    |
| ------------------ | --------------------------------------------------------------------------- |
| `sessions_list`    | Lista sesiones con filtros opcionales (tipo, etiqueta, agente, antigüedad, vista previa) |
| `sessions_history` | Lee la transcripción de una sesión específica                               |
| `sessions_send`    | Envía un mensaje a otra sesión y, opcionalmente, espera                     |
| `sessions_spawn`   | Genera una sesión de subagente aislada para trabajo en segundo plano        |
| `sessions_yield`   | Termina el turno actual y espera resultados posteriores de subagentes       |
| `subagents`        | Lista, dirige o termina subagentes generados para esta sesión               |
| `session_status`   | Muestra una tarjeta de estilo `/status` y, opcionalmente, define una anulación de modelo por sesión |

Estas herramientas siguen sujetas al perfil de herramientas activo y a la
política de permitir/denegar. `tools.profile: "coding"` incluye el conjunto
completo de orquestación de sesiones, incluidos `sessions_spawn`,
`sessions_yield` y `subagents`. `tools.profile: "messaging"` incluye
herramientas de mensajería entre sesiones (`sessions_list`, `sessions_history`,
`sessions_send`, `session_status`), pero no incluye la generación de
subagentes. Para conservar un perfil de mensajería y aun así permitir la
delegación nativa, añade:

```json5
{
  tools: {
    profile: "messaging",
    alsoAllow: ["sessions_spawn", "sessions_yield", "subagents"],
  },
}
```

Las políticas de grupo, proveedor, sandbox y por agente aún pueden quitar esas
herramientas después de la etapa de perfil. Usa `/tools` desde la sesión
afectada para inspeccionar la lista efectiva de herramientas.

## Listar y leer sesiones

`sessions_list` devuelve sesiones con su clave, agentId, tipo, canal, modelo,
recuentos de tokens y marcas de tiempo. Filtra por tipo (`main`, `group`,
`cron`, `hook`, `node`), `label` exacta, `agentId` exacto, texto de búsqueda o
antigüedad (`activeMinutes`). Cuando necesites una clasificación de estilo
buzón, también puede pedir un título derivado con alcance de visibilidad, un
fragmento de vista previa del último mensaje o mensajes recientes acotados en
cada fila. Los títulos derivados y las vistas previas se producen solo para las
sesiones que el llamador ya puede ver bajo la política de visibilidad de
herramientas de sesión configurada, por lo que las sesiones no relacionadas
permanecen ocultas.

`sessions_history` obtiene la transcripción de conversación de una sesión
específica. De forma predeterminada, los resultados de herramientas se excluyen:
pasa `includeTools: true` para verlos. La vista devuelta está acotada y filtrada
por seguridad de forma intencional:

- el texto del asistente se normaliza antes de la recuperación:
  - se eliminan las etiquetas de pensamiento
  - se eliminan los bloques de andamiaje `<relevant-memories>` / `<relevant_memories>`
  - se eliminan los bloques de payload XML de llamadas a herramientas en texto
    plano, como `<tool_call>...</tool_call>`,
    `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>` y
    `<function_calls>...</function_calls>`, incluidos payloads truncados que
    nunca cierran correctamente
  - se elimina el andamiaje degradado de llamadas/resultados de herramientas,
    como `[Tool Call: ...]`, `[Tool Result ...]` y
    `[Historical context ...]`
  - se eliminan tokens de control del modelo filtrados, como `<|assistant|>`,
    otros tokens ASCII `<|...|>` y variantes de ancho completo `<｜...｜>`
  - se elimina XML malformado de llamadas a herramientas de MiniMax, como
    `<invoke ...>` / `</minimax:tool_call>`
- el texto similar a credenciales/tokens se redacta antes de devolverse
- los bloques de texto largos se truncan
- los historiales muy grandes pueden descartar filas antiguas o reemplazar una
  fila sobredimensionada por `[sessions_history omitted: message too large]`
- la herramienta informa indicadores de resumen como `truncated`,
  `droppedMessages`, `contentTruncated`, `contentRedacted` y `bytes`

Ambas herramientas aceptan una **clave de sesión** (como `"main"`) o un **ID de
sesión** de una llamada de lista anterior.

Si necesitas la transcripción exacta byte por byte, inspecciona el archivo de
transcripción en disco en lugar de tratar `sessions_history` como un volcado
sin procesar.

## Enviar mensajes entre sesiones

`sessions_send` entrega un mensaje a otra sesión y, opcionalmente, espera la
respuesta:

- **Enviar y olvidar:** define `timeoutSeconds: 0` para encolar y devolver
  inmediatamente.
- **Esperar respuesta:** define un tiempo de espera y obtén la respuesta en
  línea.

Las sesiones de chat con alcance de hilo, como claves de Slack o Discord que
terminan en `:thread:<id>`, no son destinos válidos de `sessions_send`. Usa la
clave de sesión del canal principal para la coordinación entre agentes, de modo
que los mensajes enrutados por herramientas no aparezcan dentro de un hilo
activo orientado a humanos.

Los mensajes y las respuestas posteriores A2A se marcan como datos entre
sesiones en el prompt receptor (`[Inter-session message ... isUser=false]`) y
en la procedencia de la transcripción. El agente receptor debe tratarlos como
datos enrutados por herramientas, no como una instrucción directa redactada por
el usuario final.

Después de que el destino responda, OpenClaw puede ejecutar un **bucle de
respuesta de vuelta** donde los agentes alternan mensajes (hasta
`session.agentToAgent.maxPingPongTurns`, rango 0-20, predeterminado 5). El
agente destino puede responder `REPLY_SKIP` para detenerse antes.

## Ayudantes de estado y orquestación

`session_status` es la herramienta ligera equivalente a `/status` para la
sesión actual u otra sesión visible. Informa uso, hora, estado de
modelo/runtime y contexto de tareas en segundo plano vinculadas cuando está
presente. Igual que `/status`, puede rellenar contadores escasos de
tokens/caché a partir de la entrada de uso más reciente de la transcripción, y
`model=default` borra una anulación por sesión. Usa `sessionKey="current"` para
la sesión actual del llamador; las etiquetas visibles de cliente como
`openclaw-tui` no son claves de sesión.

`sessions_yield` termina intencionalmente el turno actual para que el siguiente
mensaje pueda ser el evento posterior que estás esperando. Úsalo después de
generar subagentes cuando quieras que los resultados de finalización lleguen
como el siguiente mensaje en lugar de crear bucles de sondeo.

`subagents` es el ayudante del plano de control para subagentes de OpenClaw ya
generados. Admite:

- `action: "list"` para inspeccionar ejecuciones activas/recientes
- `action: "steer"` para enviar orientación posterior a un hijo en ejecución
- `action: "kill"` para detener un hijo o `all`

## Generar subagentes

`sessions_spawn` crea una sesión aislada para una tarea en segundo plano de
forma predeterminada. Siempre es no bloqueante: devuelve inmediatamente un
`runId` y `childSessionKey`.

Opciones clave:

- `runtime: "subagent"` (predeterminado) o `"acp"` para agentes de arnés externos.
- Anulaciones de `model` y `thinking` para la sesión hija.
- `thread: true` para vincular la generación a un hilo de chat (Discord, Slack, etc.).
- `sandbox: "require"` para imponer el sandboxing en el hijo.
- `context: "fork"` para subagentes nativos cuando el hijo necesita la
  transcripción actual del solicitante; omítelo o usa `context: "isolated"`
  para un hijo limpio. Los subagentes nativos vinculados a hilo usan
  `context: "fork"` de forma predeterminada, salvo que
  `threadBindings.defaultSpawnContext` indique lo contrario.

Los subagentes hoja predeterminados no reciben herramientas de sesión. Cuando
`maxSpawnDepth >= 2`, los subagentes orquestadores de profundidad 1 reciben
además `sessions_spawn`, `subagents`, `sessions_list` y `sessions_history` para
que puedan gestionar sus propios hijos. Las ejecuciones hoja siguen sin recibir
herramientas de orquestación recursiva.

Tras la finalización, un paso de anuncio publica el resultado en el canal del
solicitante. La entrega de finalización conserva el enrutamiento de hilo/tema
vinculado cuando está disponible, y si el origen de finalización solo identifica
un canal, OpenClaw aún puede reutilizar la ruta almacenada de la sesión del
solicitante (`lastChannel` / `lastTo`) para entrega directa.

Para comportamiento específico de ACP, consulta [Agentes ACP](/es/tools/acp-agents).

## Visibilidad

Las herramientas de sesión tienen alcance para limitar lo que el agente puede ver:

| Nivel   | Alcance                                  |
| ------- | ---------------------------------------- |
| `self`  | Solo la sesión actual                    |
| `tree`  | Sesión actual + subagentes generados     |
| `agent` | Todas las sesiones de este agente        |
| `all`   | Todas las sesiones (entre agentes si está configurado) |

El valor predeterminado es `tree`. Las sesiones con sandbox se limitan a `tree`
independientemente de la configuración.

## Lecturas adicionales

- [Gestión de sesiones](/es/concepts/session) -- enrutamiento, ciclo de vida, mantenimiento
- [Agentes ACP](/es/tools/acp-agents) -- generación de arneses externos
- [Multiagente](/es/concepts/multi-agent) -- arquitectura multiagente
- [Configuración de Gateway](/es/gateway/configuration) -- controles de configuración de herramientas de sesión

## Relacionado

- [Gestión de sesiones](/es/concepts/session)
- [Poda de sesiones](/es/concepts/session-pruning)

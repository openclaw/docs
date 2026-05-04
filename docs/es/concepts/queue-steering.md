---
read_when:
    - Explicación de cómo se comporta la dirección mientras un agente usa herramientas
    - Cambiar el comportamiento de la cola de ejecuciones activas o la integración de control en tiempo de ejecución
    - Comparación de los modos de dirección, cola, recopilación y seguimiento
summary: Cómo el direccionamiento de ejecuciones activas pone mensajes en cola en los límites de tiempo de ejecución
title: Cola de orientación
x-i18n:
    generated_at: "2026-05-04T02:23:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: c8df35b127ae0c1e1b3b684a1f63ce33874eb3d0b7bf9d0df7cb9dfce093090a
    source_path: concepts/queue-steering.md
    workflow: 16
---

Cuando llega un mensaje mientras la ejecución de una sesión ya está transmitiendo, OpenClaw puede
enviar ese mensaje al entorno de ejecución activo en lugar de iniciar otra ejecución para
la misma sesión. Los modos públicos son neutrales respecto al entorno de ejecución; Pi y el arnés
app-server nativo de Codex implementan los detalles de entrega de forma diferente.

## Límite del entorno de ejecución

La dirección no interrumpe una llamada de herramienta que ya se está ejecutando. Pi comprueba si hay
mensajes de dirección en cola en los límites del modelo:

1. El asistente solicita llamadas de herramienta.
2. Pi ejecuta el lote de llamadas de herramienta del mensaje actual del asistente.
3. Pi emite el evento de fin de turno.
4. Pi vacía los mensajes de dirección en cola.
5. Pi añade esos mensajes como mensajes de usuario antes de la siguiente llamada al LLM.

Esto mantiene los resultados de herramientas emparejados con el mensaje del asistente que los solicitó,
y luego permite que la siguiente llamada al modelo vea la entrada más reciente del usuario.

El arnés app-server nativo de Codex expone `turn/steer` en lugar de la cola de dirección
interna de Pi. OpenClaw adapta allí los mismos modos:

- `steer` agrupa los mensajes en cola durante la ventana de silencio configurada y luego envía una
  única solicitud `turn/steer` con toda la entrada de usuario recopilada en orden de llegada.
- `queue` conserva la forma serializada heredada enviando solicitudes `turn/steer`
  separadas.
- `followup`, `collect`, `steer-backlog` e `interrupt` siguen siendo comportamiento de cola
  propiedad de OpenClaw alrededor del turno activo de Codex.

Los turnos de revisión de Codex y de compaction manual rechazan la dirección en el mismo turno. Cuando un
entorno de ejecución no puede aceptar dirección, OpenClaw recurre a la cola de seguimiento donde
ese modo lo permite.

Esta página explica la dirección en modo de cola para mensajes entrantes normales. Para el
comando explícito `/steer <message>`, consulta [Dirigir](/es/tools/steer).

## Modos

| Modo            | Comportamiento con ejecución activa                                                                                          | Comportamiento de seguimiento posterior                                             |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `steer`         | Inyecta todos los mensajes de dirección en cola juntos en el siguiente límite del entorno de ejecución. Este es el valor predeterminado. | Recurre al seguimiento solo cuando la dirección no está disponible.                  |
| `queue`         | Dirección heredada de uno en uno. Pi inyecta un mensaje en cola por límite de modelo; Codex envía solicitudes `turn/steer` separadas. | Recurre al seguimiento solo cuando la dirección no está disponible.                  |
| `steer-backlog` | El mismo comportamiento de dirección con ejecución activa que `steer`.                                                        | También conserva el mismo mensaje para un turno de seguimiento posterior.            |
| `followup`      | No dirige la ejecución actual.                                                                                               | Ejecuta los mensajes en cola más tarde.                                             |
| `collect`       | No dirige la ejecución actual.                                                                                               | Combina mensajes en cola compatibles en un turno posterior después de la ventana de debounce. |
| `interrupt`     | Anula la ejecución activa y luego inicia el mensaje más reciente.                                                             | Ninguno.                                                                            |

## Ejemplo de ráfaga

Si cuatro usuarios envían mensajes mientras el agente está ejecutando una llamada de herramienta:

- `steer`: el entorno de ejecución activo recibe los cuatro mensajes en orden de llegada antes de
  su siguiente decisión de modelo. Pi los vacía en el siguiente límite de modelo; Codex
  los recibe como un único `turn/steer` agrupado.
- `queue`: dirección serializada heredada. Pi inyecta un mensaje en cola a la vez;
  Codex recibe solicitudes `turn/steer` separadas.
- `collect`: OpenClaw espera hasta que termine la ejecución activa y luego crea un turno de seguimiento
  con mensajes en cola compatibles después de la ventana de debounce.

## Alcance

La dirección siempre apunta a la ejecución de sesión activa actual. No crea una nueva
sesión, no cambia la política de herramientas de la ejecución activa ni divide mensajes por remitente. En
canales multiusuario, los prompts entrantes ya incluyen el remitente y el contexto de ruta, por lo que
la siguiente llamada al modelo puede ver quién envió cada mensaje.

Usa `collect` cuando quieras que OpenClaw construya un turno de seguimiento posterior que pueda
combinar mensajes compatibles y preservar la política de descarte de la cola de seguimiento. Usa
`queue` solo cuando necesites el comportamiento de dirección anterior de uno en uno.

## Debounce

`messages.queue.debounceMs` se aplica a la entrega de seguimiento, incluidos `collect`,
`followup`, `steer-backlog` y el fallback de `steer` cuando la dirección con ejecución activa no está
disponible. Para Pi, `steer` activo en sí no usa el temporizador de debounce porque
Pi agrupa naturalmente los mensajes hasta el siguiente límite del modelo. Para el arnés
nativo de Codex, OpenClaw usa el mismo valor de debounce que la ventana de silencio antes de
enviar el `turn/steer` agrupado.

## Relacionado

- [Cola de comandos](/es/concepts/queue)
- [Dirigir](/es/tools/steer)
- [Mensajes](/es/concepts/messages)
- [Bucle del agente](/es/concepts/agent-loop)

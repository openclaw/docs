---
read_when:
    - Explicación de cómo se comporta steer mientras un agente usa herramientas
    - Cambiar el comportamiento de la cola de ejecución activa o la integración de direccionamiento en tiempo de ejecución
    - Comparación de los modos steer, queue, collect y followup
summary: Cómo el direccionamiento de ejecuciones activas pone en cola mensajes en los límites de tiempo de ejecución
title: Cola de control
x-i18n:
    generated_at: "2026-04-30T05:39:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 560390c8c26bcce95e0137f4336ad6e62bc3e2344cb15fd12ca3cfe4a85a8acc
    source_path: concepts/queue-steering.md
    workflow: 16
---

Cuando llega un mensaje mientras una ejecución de sesión ya está transmitiendo, OpenClaw puede
enviar ese mensaje al entorno de ejecución activo en lugar de iniciar otra ejecución para
la misma sesión. Los modos públicos son neutrales respecto al entorno de ejecución; Pi y el arnés
app-server nativo de Codex implementan los detalles de entrega de forma diferente.

## Límite del entorno de ejecución

El direccionamiento no interrumpe una llamada a herramienta que ya está en ejecución. Pi comprueba si hay
mensajes de direccionamiento en cola en los límites del modelo:

1. El asistente solicita llamadas a herramientas.
2. Pi ejecuta el lote de llamadas a herramientas del mensaje actual del asistente.
3. Pi emite el evento de fin de turno.
4. Pi vacía los mensajes de direccionamiento en cola.
5. Pi agrega esos mensajes como mensajes de usuario antes de la siguiente llamada al LLM.

Esto mantiene los resultados de herramientas emparejados con el mensaje del asistente que los solicitó,
y luego permite que la siguiente llamada al modelo vea la entrada de usuario más reciente.

El arnés app-server nativo de Codex expone `turn/steer` en lugar de la
cola interna de direccionamiento de Pi. OpenClaw adapta los mismos modos allí:

- `steer` agrupa los mensajes en cola durante la ventana de silencio configurada y luego envía una
  única solicitud `turn/steer` con toda la entrada de usuario recopilada en orden de llegada.
- `queue` mantiene la forma serializada heredada enviando solicitudes `turn/steer`
  separadas.
- `followup`, `collect`, `steer-backlog` e `interrupt` siguen siendo
  comportamientos de cola propiedad de OpenClaw alrededor del turno activo de Codex.

Los turnos de revisión de Codex y de Compaction manual rechazan el direccionamiento en el mismo turno. Cuando un
entorno de ejecución no puede aceptar direccionamiento, OpenClaw recurre a la cola de seguimiento cuando
ese modo lo permite.

## Modos

| Modo            | Comportamiento con ejecución activa                                                                                          | Comportamiento de seguimiento posterior                                              |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `steer`         | Inyecta todos los mensajes de direccionamiento en cola juntos en el siguiente límite del entorno de ejecución. Es el valor predeterminado. | Recurre a seguimiento solo cuando el direccionamiento no está disponible.            |
| `queue`         | Direccionamiento heredado de uno en uno. Pi inyecta un mensaje en cola por límite del modelo; Codex envía solicitudes `turn/steer` separadas. | Recurre a seguimiento solo cuando el direccionamiento no está disponible.            |
| `steer-backlog` | El mismo comportamiento de direccionamiento con ejecución activa que `steer`.                                                | También conserva el mismo mensaje para un turno de seguimiento posterior.            |
| `followup`      | No direcciona la ejecución actual.                                                                                            | Ejecuta los mensajes en cola más tarde.                                              |
| `collect`       | No direcciona la ejecución actual.                                                                                            | Fusiona los mensajes en cola compatibles en un turno posterior después de la ventana de rebote. |
| `interrupt`     | Aborta la ejecución activa y luego inicia el mensaje más reciente.                                                            | Ninguno.                                                                            |

## Ejemplo de ráfaga

Si cuatro usuarios envían mensajes mientras el agente está ejecutando una llamada a herramienta:

- `steer`: el entorno de ejecución activo recibe los cuatro mensajes en orden de llegada antes de
  su siguiente decisión del modelo. Pi los vacía en el siguiente límite del modelo; Codex
  los recibe como un único `turn/steer` agrupado.
- `queue`: direccionamiento serializado heredado. Pi inyecta un mensaje en cola a la vez;
  Codex recibe solicitudes `turn/steer` separadas.
- `collect`: OpenClaw espera hasta que finalice la ejecución activa y luego crea un turno de seguimiento
  con mensajes en cola compatibles después de la ventana de rebote.

## Alcance

El direccionamiento siempre apunta a la ejecución de sesión activa actual. No crea una sesión nueva,
no cambia la política de herramientas de la ejecución activa ni divide los mensajes por remitente. En
canales multiusuario, las indicaciones entrantes ya incluyen el contexto de remitente y ruta, por lo que
la siguiente llamada al modelo puede ver quién envió cada mensaje.

Usa `collect` cuando quieras que OpenClaw cree un turno de seguimiento posterior que pueda
fusionar mensajes compatibles y preservar la política de descarte de la cola de seguimiento. Usa
`queue` solo cuando necesites el comportamiento de direccionamiento anterior de uno en uno.

## Rebote

`messages.queue.debounceMs` se aplica a la entrega de seguimiento, incluidos `collect`,
`followup`, `steer-backlog` y la alternativa de `steer` cuando el direccionamiento con ejecución activa no está
disponible. Para Pi, `steer` activo en sí no usa el temporizador de rebote porque
Pi agrupa mensajes de forma natural hasta el siguiente límite del modelo. Para el arnés
nativo de Codex, OpenClaw usa el mismo valor de rebote que la ventana de silencio antes de
enviar el `turn/steer` agrupado.

## Relacionado

- [Cola de comandos](/es/concepts/queue)
- [Mensajes](/es/concepts/messages)
- [Bucle del agente](/es/concepts/agent-loop)

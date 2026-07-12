---
read_when:
    - Explicación del comportamiento de steer mientras un agente usa herramientas
    - Cambio del comportamiento de la cola de ejecuciones activas o de la integración de la dirección en tiempo de ejecución
    - Comparación del direccionamiento con los modos de cola followup, collect e interrupt
summary: Cómo las colas de direccionamiento de ejecuciones activas ponen en cola los mensajes en los límites del entorno de ejecución
title: Cola de dirección
x-i18n:
    generated_at: "2026-07-11T23:04:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a73311661b40d65d254b3e6af0406965fcde9eb76d2628c1958920453aad1cbc
    source_path: concepts/queue-steering.md
    workflow: 16
---

Cuando llega una solicitud normal mientras la ejecución de una sesión ya está transmitiendo y el modo de cola es `steer` (el predeterminado, no requiere configuración), OpenClaw intenta enviar esa solicitud al entorno de ejecución activo. OpenClaw y el entorno nativo del servidor de aplicaciones de Codex implementan los detalles de entrega de forma diferente.

Esta página trata sobre la redirección mediante el modo de cola para los mensajes entrantes normales en el modo `steer`. En el modo `followup` o `collect`, los mensajes normales omiten esta ruta y esperan hasta que finaliza la ejecución activa. Para el comando explícito `/steer <message>`, consulta [Redirigir](/es/tools/steer).

## Límite del entorno de ejecución

La redirección no interrumpe una llamada a una herramienta que ya está en curso. OpenClaw comprueba si hay mensajes de redirección en cola en los límites del modelo:

1. El asistente solicita llamadas a herramientas.
2. OpenClaw ejecuta el lote de llamadas a herramientas del mensaje actual del asistente.
3. OpenClaw emite el evento de fin de turno.
4. OpenClaw extrae de la cola los mensajes de redirección pendientes.
5. OpenClaw añade esos mensajes como mensajes del usuario antes de la siguiente llamada al LLM.

Esto mantiene los resultados de las herramientas asociados al mensaje del asistente que los solicitó y permite que la siguiente llamada al modelo vea la entrada más reciente del usuario.

El entorno nativo del servidor de aplicaciones de Codex expone `turn/steer` en lugar de la cola interna de redirección del entorno de ejecución de OpenClaw. OpenClaw agrupa las solicitudes en cola durante el intervalo de inactividad configurado y, a continuación, envía una única solicitud `turn/steer` con todas las entradas del usuario recopiladas en orden de llegada.

Los turnos de revisión y Compaction de Codex rechazan la redirección en el mismo turno. Cuando un entorno de ejecución no puede aceptar la redirección en el modo `steer`, OpenClaw espera a que finalice la ejecución activa antes de iniciar la solicitud.

## Modos

| Modo        | Comportamiento durante la ejecución activa                        | Comportamiento posterior                                                                         |
| ----------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `steer`     | Redirige la solicitud al entorno de ejecución activo cuando puede. | Espera a que finalice la ejecución activa si la redirección no está disponible.                   |
| `followup`  | No redirige.                                                       | Ejecuta posteriormente los mensajes en cola una vez finalizada la ejecución activa.               |
| `collect`   | No redirige.                                                       | Combina los mensajes compatibles en cola en un único turno posterior tras el intervalo antirrebote. |
| `interrupt` | Cancela la ejecución activa en lugar de redirigirla.               | Inicia el mensaje más reciente después de la cancelación.                                         |

## Ejemplo de ráfaga

Si cuatro usuarios envían mensajes mientras el agente ejecuta una llamada a una herramienta:

- Con el comportamiento predeterminado, el entorno de ejecución activo recibe los cuatro mensajes en orden de llegada antes de su siguiente decisión del modelo. OpenClaw los extrae de la cola en el siguiente límite del modelo; Codex los recibe como un único `turn/steer` agrupado.
- Con `/queue collect`, OpenClaw no redirige. Espera hasta que finaliza la ejecución activa y, a continuación, crea un turno de seguimiento con los mensajes compatibles en cola tras el intervalo antirrebote.
- Con `/queue interrupt`, OpenClaw cancela la ejecución activa e inicia el mensaje más reciente en lugar de redirigirlo.

## Alcance

La redirección siempre apunta a la ejecución activa de la sesión actual. No crea una sesión nueva, no cambia la política de herramientas de la ejecución activa ni separa los mensajes por remitente. En los canales multiusuario, las solicitudes entrantes ya incluyen el contexto del remitente y de la ruta, por lo que la siguiente llamada al modelo puede ver quién envió cada mensaje.

Usa `followup` o `collect` cuando quieras que, de forma predeterminada, los mensajes se pongan en cola en lugar de redirigirse a la ejecución activa. Usa `interrupt` cuando la solicitud más reciente deba sustituir la ejecución activa.

## Antirrebote

`messages.queue.debounceMs` se aplica a la entrega en cola de `followup` y `collect`. En el modo `steer` con el entorno nativo de Codex, también establece el intervalo de inactividad antes de enviar el `turn/steer` agrupado. En OpenClaw, la redirección activa en sí no utiliza el temporizador antirrebote porque OpenClaw agrupa los mensajes de forma natural hasta el siguiente límite del modelo.

## Contenido relacionado

- [Cola de comandos](/es/concepts/queue)
- [Redirigir](/es/tools/steer)
- [Mensajes](/es/concepts/messages)
- [Bucle del agente](/es/concepts/agent-loop)

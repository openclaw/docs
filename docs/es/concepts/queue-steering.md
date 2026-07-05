---
read_when:
    - Explicación de cómo se comporta steer mientras un agente usa herramientas
    - Cambiar el comportamiento de la cola de ejecuciones activas o la integración de direccionamiento en tiempo de ejecución
    - Comparación de la dirección con los modos de cola de seguimiento, recopilación e interrupción
summary: Cómo el direccionamiento de ejecuciones activas pone en cola los mensajes en los límites del entorno de ejecución
title: Cola de dirección
x-i18n:
    generated_at: "2026-07-05T11:15:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a73311661b40d65d254b3e6af0406965fcde9eb76d2628c1958920453aad1cbc
    source_path: concepts/queue-steering.md
    workflow: 16
---

Cuando llega una solicitud normal mientras una ejecución de sesión ya está transmitiendo y el modo de cola es `steer` (el predeterminado, sin configuración necesaria), OpenClaw intenta enviar esa solicitud al runtime activo. OpenClaw y el arnés app-server nativo de Codex implementan los detalles de entrega de forma diferente.

Esta página cubre el direccionamiento del modo de cola para mensajes entrantes normales en modo `steer`. En modo `followup` o `collect`, los mensajes normales omiten esta ruta y esperan hasta que termine la ejecución activa. Para el comando explícito `/steer <message>`, consulta [Dirigir](/es/tools/steer).

## Límite del runtime

El direccionamiento no interrumpe una llamada de herramienta que ya se está ejecutando. OpenClaw comprueba si hay mensajes de direccionamiento en cola en los límites del modelo:

1. El asistente solicita llamadas de herramientas.
2. OpenClaw ejecuta el lote de llamadas de herramientas del mensaje actual del asistente.
3. OpenClaw emite el evento de fin de turno.
4. OpenClaw vacía los mensajes de direccionamiento en cola.
5. OpenClaw agrega esos mensajes como mensajes de usuario antes de la siguiente llamada al LLM.

Esto mantiene los resultados de herramientas emparejados con el mensaje del asistente que los solicitó y luego permite que la siguiente llamada al modelo vea la entrada más reciente del usuario.

El arnés app-server nativo de Codex expone `turn/steer` en lugar de la cola de direccionamiento interna del runtime de OpenClaw. OpenClaw agrupa las solicitudes en cola durante la ventana de silencio configurada y luego envía una única solicitud `turn/steer` con toda la entrada de usuario recopilada en orden de llegada.

Los turnos de revisión de Codex y de compactación manual rechazan el direccionamiento en el mismo turno. Cuando un runtime no puede aceptar direccionamiento en modo `steer`, OpenClaw espera a que termine la ejecución activa antes de iniciar la solicitud.

## Modos

| Modo        | Comportamiento con ejecución activa                    | Comportamiento posterior                                                          |
| ----------- | ------------------------------------------------------ | --------------------------------------------------------------------------------- |
| `steer`     | Dirige la solicitud al runtime activo cuando puede.    | Espera a que termine la ejecución activa si el direccionamiento no está disponible. |
| `followup`  | No dirige.                                             | Ejecuta los mensajes en cola más tarde, después de que termine la ejecución activa. |
| `collect`   | No dirige.                                             | Fusiona mensajes en cola compatibles en un turno posterior tras la ventana de debounce. |
| `interrupt` | Cancela la ejecución activa en lugar de dirigirla.     | Inicia el mensaje más reciente después de cancelar.                               |

## Ejemplo de ráfaga

Si cuatro usuarios envían mensajes mientras el agente está ejecutando una llamada de herramienta:

- Con el comportamiento predeterminado, el runtime activo recibe los cuatro mensajes en orden de llegada antes de su siguiente decisión de modelo. OpenClaw los vacía en el siguiente límite del modelo; Codex los recibe como un único `turn/steer` agrupado.
- Con `/queue collect`, OpenClaw no dirige. Espera hasta que termine la ejecución activa y luego crea un turno de seguimiento con los mensajes en cola compatibles tras la ventana de debounce.
- Con `/queue interrupt`, OpenClaw cancela la ejecución activa e inicia el mensaje más reciente en lugar de dirigir.

## Alcance

El direccionamiento siempre apunta a la ejecución de sesión activa actual. No crea una sesión nueva, no cambia la política de herramientas de la ejecución activa ni divide mensajes por remitente. En canales multiusuario, las solicitudes entrantes ya incluyen el contexto de remitente y ruta, por lo que la siguiente llamada al modelo puede ver quién envió cada mensaje.

Usa `followup` o `collect` cuando quieras que los mensajes se pongan en cola de forma predeterminada en lugar de dirigir la ejecución activa. Usa `interrupt` cuando la solicitud más reciente deba reemplazar la ejecución activa.

## Debounce

`messages.queue.debounceMs` se aplica a la entrega en cola de `followup` y `collect`. En modo `steer` con el arnés nativo de Codex, también establece la ventana de silencio antes de enviar `turn/steer` agrupado. Para OpenClaw, el direccionamiento activo en sí no usa el temporizador de debounce porque OpenClaw agrupa los mensajes de forma natural hasta el siguiente límite del modelo.

## Relacionado

- [Cola de comandos](/es/concepts/queue)
- [Dirigir](/es/tools/steer)
- [Mensajes](/es/concepts/messages)
- [Bucle del agente](/es/concepts/agent-loop)

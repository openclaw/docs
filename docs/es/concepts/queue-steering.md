---
read_when:
    - Explicación de cómo se comporta la dirección mientras un agente usa herramientas
    - Cambiar el comportamiento de la cola de ejecuciones activas o la integración de direccionamiento en tiempo de ejecución
    - Comparación de steering con los modos de cola followup, collect e interrupt
summary: Cómo el enrutamiento de ejecuciones activas pone mensajes en cola en los límites del runtime
title: Cola de direccionamiento
x-i18n:
    generated_at: "2026-06-27T11:19:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b38d036d2a44af431653746e2d5918af0a8af471450f440479cf0a1acc86c9cd
    source_path: concepts/queue-steering.md
    workflow: 16
---

Cuando llega un prompt normal mientras una ejecución de sesión ya se está transmitiendo, OpenClaw
intenta enviar ese prompt al runtime activo de forma predeterminada cuando el modo de cola
es `steer`. No se requiere ninguna entrada de configuración ni directiva de cola para ese
comportamiento predeterminado. OpenClaw y el arnés nativo de app-server de Codex implementan los
detalles de entrega de forma diferente.

## Límite del runtime

La redirección no interrumpe una llamada a herramienta que ya se está ejecutando. OpenClaw comprueba
los mensajes de redirección en cola en los límites del modelo:

1. El asistente solicita llamadas a herramientas.
2. OpenClaw ejecuta el lote de llamadas a herramientas del mensaje actual del asistente.
3. OpenClaw emite el evento de fin de turno.
4. OpenClaw vacía los mensajes de redirección en cola.
5. OpenClaw añade esos mensajes como mensajes de usuario antes de la siguiente llamada al LLM.

Esto mantiene los resultados de herramientas emparejados con el mensaje del asistente que los solicitó,
y luego permite que la siguiente llamada al modelo vea la entrada más reciente del usuario.

El arnés nativo de app-server de Codex expone `turn/steer` en lugar de la cola de redirección
interna del runtime de OpenClaw. OpenClaw agrupa los prompts en cola durante la ventana de silencio
configurada y luego envía una única solicitud `turn/steer` con toda la entrada de usuario recopilada
en orden de llegada.

Los turnos de revisión de Codex y de Compaction manual rechazan la redirección en el mismo turno. Cuando un
runtime no puede aceptar redirección en modo `steer`, OpenClaw espera a que la ejecución activa
termine antes de iniciar el prompt.

Esta página explica la redirección del modo de cola para mensajes entrantes normales cuando el modo
es `steer`. Si el modo es `followup` o `collect`, los mensajes normales no entran
en esta ruta de redirección; esperan hasta que termine la ejecución activa. Para el comando explícito
`/steer <message>`, consulta [Redirección](/es/tools/steer).

## Modos

| Modo        | Comportamiento de ejecución activa                      | Comportamiento posterior                                                            |
| ----------- | ------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `steer`     | Redirige el prompt al runtime activo cuando puede.      | Espera a que la ejecución activa termine si la redirección no está disponible.       |
| `followup`  | No redirige.                                           | Ejecuta los mensajes en cola más tarde, después de que termine la ejecución activa.  |
| `collect`   | No redirige.                                           | Combina mensajes compatibles en cola en un turno posterior tras la ventana debounce. |
| `interrupt` | Aborta la ejecución activa en lugar de redirigirla.     | Inicia el mensaje más reciente después de abortar.                                   |

## Ejemplo de ráfaga

Si cuatro usuarios envían mensajes mientras el agente está ejecutando una llamada a herramienta:

- Con el comportamiento predeterminado, el runtime activo recibe los cuatro mensajes en
  orden de llegada antes de su siguiente decisión de modelo. OpenClaw los vacía en el siguiente límite de modelo;
  Codex los recibe como un único `turn/steer` agrupado.
- Con `/queue collect`, OpenClaw no redirige. Espera hasta que termine la ejecución activa
  y luego crea un turno de seguimiento con los mensajes compatibles en cola después de la
  ventana debounce.
- Con `/queue interrupt`, OpenClaw aborta la ejecución activa e inicia el mensaje más reciente
  en lugar de redirigir.

## Alcance

La redirección siempre apunta a la ejecución de sesión activa actual. No crea una nueva
sesión, no cambia la política de herramientas de la ejecución activa ni divide los mensajes por remitente. En
canales multiusuario, los prompts entrantes ya incluyen contexto de remitente y ruta, por lo que
la siguiente llamada al modelo puede ver quién envió cada mensaje.

Usa `followup` o `collect` cuando quieras que los mensajes se pongan en cola de forma predeterminada en lugar
de redirigir la ejecución activa. Usa `interrupt` cuando el prompt más reciente deba
reemplazar la ejecución activa.

## Debounce

`messages.queue.debounceMs` se aplica a la entrega en cola de `followup` y `collect`.
En modo `steer` con el arnés nativo de Codex, también establece la ventana de silencio
antes de enviar `turn/steer` agrupado. Para OpenClaw, la redirección activa en sí no usa
el temporizador debounce porque OpenClaw agrupa los mensajes de forma natural hasta el siguiente límite de modelo.

## Relacionado

- [Cola de comandos](/es/concepts/queue)
- [Redirección](/es/tools/steer)
- [Mensajes](/es/concepts/messages)
- [Bucle de agente](/es/concepts/agent-loop)

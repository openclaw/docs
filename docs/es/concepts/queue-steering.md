---
read_when:
    - Explicación de cómo se comporta la orientación mientras un agente utiliza herramientas
    - Cambio del comportamiento de la cola de ejecuciones activas o de la integración de la dirección en tiempo de ejecución
    - Comparación del modo de dirección con los modos de cola de seguimiento, recopilación e interrupción
summary: Cómo la dirección de ejecuciones activas pone mensajes en cola en los límites del entorno de ejecución
title: Cola de direccionamiento
x-i18n:
    generated_at: "2026-07-20T00:50:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 131f04f19934b9b1f6dd8ffb2cf2428950c319483abdc2ccdecec741809cda2a
    source_path: concepts/queue-steering.md
    workflow: 16
---

Cuando llega un prompt normal mientras ya se está transmitiendo una ejecución de sesión y el modo de cola es `steer` (el predeterminado, no requiere configuración), OpenClaw intenta enviar ese prompt al runtime activo. OpenClaw y el arnés nativo del servidor de aplicaciones de Codex implementan los detalles de entrega de forma diferente.

Esta página abarca el direccionamiento mediante el modo de cola para mensajes entrantes normales en el modo `steer`. En el modo `followup` o `collect`, los mensajes normales omiten esta ruta y esperan hasta que finaliza la ejecución activa. Para el comando explícito `/steer <message>`, consulte [Direccionar](/es/tools/steer).

## Límite del runtime

El direccionamiento no interrumpe una llamada a herramienta que ya está en ejecución. OpenClaw comprueba si hay mensajes de direccionamiento en cola en los límites del modelo:

1. El asistente solicita llamadas a herramientas.
2. OpenClaw ejecuta el lote de llamadas a herramientas del mensaje actual del asistente.
3. OpenClaw emite el evento de fin de turno.
4. OpenClaw vacía los mensajes de direccionamiento en cola.
5. OpenClaw añade esos mensajes como mensajes de usuario antes de la siguiente llamada al LLM.

Esto mantiene los resultados de las herramientas asociados al mensaje del asistente que los solicitó y permite que la siguiente llamada al modelo vea la entrada más reciente del usuario.

El arnés nativo del servidor de aplicaciones de Codex expone `turn/steer` en lugar de la cola de direccionamiento interna del runtime de OpenClaw. OpenClaw agrupa los prompts en cola durante el intervalo de inactividad configurado y, a continuación, envía una única solicitud `turn/steer` con todas las entradas de usuario recopiladas en orden de llegada.

Los turnos de revisión y Compaction de Codex rechazan el direccionamiento en el mismo turno. Cuando un runtime no puede aceptar el direccionamiento en el modo `steer`, OpenClaw espera a que finalice la ejecución activa antes de iniciar el prompt.

## Modos

| Modo        | Comportamiento durante la ejecución activa                         | Comportamiento posterior                                                                    |
| ----------- | ------------------------------------------------------------------ | -------------------------------------------------------------------------------------------- |
| `steer`     | Dirige el prompt al runtime activo cuando es posible.              | Espera a que finalice la ejecución activa si el direccionamiento no está disponible.         |
| `followup`  | No realiza el direccionamiento.                                    | Ejecuta los mensajes en cola más tarde, cuando finaliza la ejecución activa.                 |
| `collect`   | No realiza el direccionamiento.                                    | Combina los mensajes compatibles en cola en un turno posterior tras el intervalo de rebote.  |
| `interrupt` | Cancela la ejecución activa en lugar de dirigir el prompt a ella.  | Inicia el mensaje más reciente después de la cancelación.                                    |

## Ejemplo de ráfaga

Si cuatro usuarios envían mensajes mientras el agente ejecuta una llamada a herramienta:

- Con el comportamiento predeterminado, el runtime activo recibe los cuatro mensajes en orden de llegada antes de su siguiente decisión del modelo. OpenClaw los vacía en el siguiente límite del modelo; Codex los recibe como un único `turn/steer` agrupado.
- Con `/queue collect`, OpenClaw no realiza el direccionamiento. Espera hasta que finaliza la ejecución activa y, a continuación, crea un turno de seguimiento con los mensajes compatibles en cola tras el intervalo de rebote.
- Con `/queue interrupt`, OpenClaw cancela la ejecución activa e inicia el mensaje más reciente en lugar de realizar el direccionamiento.

## Alcance

El direccionamiento siempre apunta a la ejecución activa actual de la sesión. No crea una sesión nueva, no cambia la política de herramientas de la ejecución activa ni divide los mensajes por remitente. En los canales multiusuario, los prompts entrantes ya incluyen el contexto del remitente y de la ruta, por lo que la siguiente llamada al modelo puede ver quién envió cada mensaje.

Use `followup` o `collect` cuando se desee que los mensajes se pongan en cola de forma predeterminada en lugar de dirigirse a la ejecución activa. Use `interrupt` cuando el prompt más reciente deba sustituir la ejecución activa.

## Rebote

El rebote integrado de la cola se aplica a la entrega en cola de `followup` y `collect`. En el modo `steer` con el arnés nativo de Codex, también establece el intervalo de inactividad antes de enviar `turn/steer` agrupados. En OpenClaw, el propio direccionamiento activo no utiliza el temporizador de rebote porque OpenClaw agrupa de forma natural los mensajes hasta el siguiente límite del modelo.

## Contenido relacionado

- [Cola de comandos](/es/concepts/queue)
- [Direccionar](/es/tools/steer)
- [Mensajes](/es/concepts/messages)
- [Bucle del agente](/es/concepts/agent-loop)

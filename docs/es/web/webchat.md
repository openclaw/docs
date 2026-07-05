---
read_when:
    - Depurar o configurar el acceso a WebChat
summary: Host estático de Loopback WebChat y uso de WS del Gateway para la interfaz de chat
title: WebChat
x-i18n:
    generated_at: "2026-07-05T11:51:00Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5d01c8e4f6962a836e9c7337bcb9ce03b90cace69e079a2c84c38108afe7c017
    source_path: web/webchat.md
    workflow: 16
---

Estado: la interfaz de chat SwiftUI de macOS/iOS se comunica directamente con el WebSocket del Gateway. Sin navegador integrado, sin servidor estático local.

## Qué es

- Una interfaz de chat nativa para el Gateway.
- Usa las mismas sesiones y reglas de enrutamiento que otros canales.
- Enrutamiento determinista: las respuestas siempre vuelven a WebChat.
- El historial siempre se obtiene del Gateway (sin observación de archivos locales). Si el Gateway no está disponible, WebChat es de solo lectura.

## Inicio rápido

1. Inicia el Gateway.
2. Abre la interfaz de WebChat (app de macOS/iOS) o la pestaña de chat de Control UI.
3. Asegúrate de que haya una ruta válida de autenticación del Gateway configurada (secreto compartido de forma predeterminada, incluso en loopback).

## Cómo funciona

- La interfaz se conecta al WebSocket del Gateway y usa los métodos RPC `chat.history`, `chat.send`, `chat.inject` y `chat.message.get`.
- `chat.history` está acotado por estabilidad: Gateway puede truncar campos de texto largos, omitir metadatos pesados y reemplazar entradas demasiado grandes por `[chat.history omitted: message too large]`. Los clientes de API pueden enviar un `maxChars` por solicitud para anular el límite predeterminado en una llamada.
- Cuando un mensaje visible del asistente se truncó en `chat.history`, Control UI puede abrir un lector lateral y obtener bajo demanda la entrada completa normalizada para visualización mediante `chat.message.get`, sin aumentar la carga útil predeterminada del historial. `chat.message.get` usa la misma rama de transcripción y las mismas reglas de visualización que `chat.history`, pero apunta a una entrada por `messageId` y devuelve una razón honesta de no disponibilidad cuando ya no se puede devolver el contenido completo.
- `chat.history` sigue la rama de transcripción activa para los archivos de sesión de solo anexado, por lo que las ramas de reescritura abandonadas y las copias de prompts reemplazadas no se representan en WebChat.
- Las entradas de Compaction se muestran como un divisor de "Historial compactado" que explica que la transcripción compactada se conserva como punto de control, con una acción para abrir puntos de control de sesión (ramificar o restaurar, cuando los permisos lo permitan).
- Control UI recuerda el `sessionId` del Gateway subyacente devuelto por `chat.history` y lo incluye en las llamadas posteriores a `chat.send`, por lo que las reconexiones y actualizaciones de página continúan la misma conversación almacenada salvo que el usuario inicie o restablezca una sesión.
- `chat.send` toma una clave de idempotencia (Control UI usa el id de ejecución); el Gateway deduplica solicitudes repetidas que reutilizan la misma clave, por lo que los reintentos o envíos duplicados en curso para la misma sesión/mensaje/adjuntos no crean una segunda ejecución.
- Los archivos de inicio del espacio de trabajo y las instrucciones pendientes de `BOOTSTRAP.md` se suministran mediante la sección `# Project Context` del prompt del sistema del agente, no se copian en el mensaje de usuario de WebChat. Si el contenido de arranque se trunca, el prompt del sistema recibe en su lugar un breve "Aviso de contexto de arranque"; los recuentos detallados y los controles de configuración permanecen en las superficies de diagnóstico.
- La normalización de visualización en `chat.history` elimina: contexto de OpenClaw solo de runtime, envoltorios de entrada, etiquetas de directiva de entrega en línea como `[[reply_to_current]]`, `[[reply_to:<id>]]` y `[[audio_as_voice]]`, cargas XML de llamadas a herramientas en texto plano (`<tool_call>`, `<function_call>`, `<tool_calls>`, `<function_calls>`, incluidos bloques truncados), y tokens de control de modelo ASCII/ancho completo filtrados. Se omiten las entradas del asistente cuyo texto visible completo sea solo el token silencioso `NO_REPLY` (sin distinguir mayúsculas y minúsculas).
- Las cargas de respuesta marcadas como razonamiento (`isReasoning: true`) se excluyen del contenido de asistente de WebChat, del texto de reproducción de la transcripción y de los bloques de contenido de audio, por lo que las cargas solo de pensamiento no aparecen como mensajes visibles del asistente ni como audio reproducible.
- `chat.inject` anexa una nota del asistente directamente a la transcripción y la transmite a la interfaz (sin ejecución de agente).
- Las ejecuciones abortadas pueden mantener salida parcial del asistente visible en la interfaz. Gateway persiste ese texto parcial en el historial de transcripción cuando existe salida en búfer, y marca la entrada con metadatos de aborto.

### Modelo de transcripción y entrega

WebChat tiene dos rutas de datos separadas:

- El archivo JSONL de sesión es la transcripción duradera del modelo/runtime. Para las ejecuciones normales de agente, el runtime integrado de OpenClaw persiste mensajes visibles para el modelo `user`, `assistant` y `toolResult` mediante su gestor de sesiones. WebChat no escribe texto arbitrario de entrega, estado o ayuda en esa transcripción.
- Los eventos `ReplyPayload` del Gateway son la proyección de entrega en vivo: normalizada para la visualización de WebChat/canal, streaming de bloques, etiquetas de directiva, incrustación de medios, marcas TTS/audio y comportamiento de reserva de la interfaz. No son por sí mismos el registro canónico de sesión.
- Los arneses que requieren respuestas visibles mediante `tools.message` siguen usando WebChat como receptor interno de respuestas de la ejecución actual. Un `message.send` sin destino desde esa ejecución activa de WebChat se proyecta en el mismo chat y se refleja en la transcripción de sesión; WebChat no se convierte en un canal de salida reutilizable y nunca hereda `lastChannel`.
- WebChat inyecta entradas de transcripción del asistente solo cuando el Gateway posee un mensaje mostrado fuera de un turno normal de agente integrado: `chat.inject`, respuestas a comandos sin agente, salida parcial abortada y suplementos de transcripción de medios gestionados por WebChat.
- Si aparece texto del asistente en vivo durante una ejecución pero desaparece tras recargar el historial, comprueba en orden: si el JSONL sin procesar contiene el texto del asistente, si la proyección de visualización de `chat.history` lo eliminó, y luego si la fusión de cola optimista de Control UI reemplazó el estado de entrega local con la instantánea persistida.

Las respuestas finales de ejecuciones normales de agente deberían ser duraderas porque el runtime integrado escribe el `message_end` del asistente. Cualquier alternativa que refleje una carga final entregada en la transcripción debe evitar primero duplicar un turno de asistente que el runtime integrado ya escribió.

## Panel de herramientas de agentes de Control UI

- El panel de herramientas `/agents` de Control UI tiene una vista "Disponible ahora" respaldada por `tools.effective(sessionKey=...)`: una proyección derivada del servidor y de solo lectura del inventario de herramientas de la sesión actual, incluidos herramientas del núcleo, Plugin, propiedad de canales y de servidores MCP ya descubiertos.
- Una vista separada de edición de configuración (respaldada por `tools.catalog`) cubre perfiles, anulaciones por agente y semántica de catálogo.
- La disponibilidad en runtime tiene alcance de sesión. Cambiar de sesión en el mismo agente puede cambiar la lista "Disponible ahora". Si los servidores MCP configurados no se han conectado o no han cambiado desde el último descubrimiento, el panel muestra un aviso en lugar de iniciar silenciosamente transportes MCP desde la ruta de lectura.
- El editor de configuración no implica disponibilidad en runtime; el acceso efectivo sigue respetando la precedencia de políticas (`allow`/`deny`, anulaciones por agente y por proveedor/canal).

## Uso remoto

- El modo remoto tuneliza el WebSocket del Gateway sobre SSH/Tailscale.
- No necesitas ejecutar un servidor WebChat separado.

## Referencia de configuración (WebChat)

Configuración completa: [Configuración](/es/gateway/configuration)

WebChat no tiene una sección de configuración persistida. Gateway usa el límite de visualización integrado de `chat.history`; los clientes de API pueden enviar `maxChars` por solicitud para anularlo en una sola llamada. La configuración heredada `channels.webchat` y `gateway.webchat` está retirada; ejecuta `openclaw doctor --fix` para eliminarla.

Opciones globales relacionadas:

- `gateway.port`, `gateway.bind`: host/puerto de WebSocket.
- `gateway.auth.mode`, `gateway.auth.token`, `gateway.auth.password`:
  autenticación WebSocket con secreto compartido.
- `gateway.auth.allowTailscale`: la pestaña de chat de Control UI en navegador puede usar encabezados de identidad de Tailscale
  Serve cuando está habilitada.
- `gateway.auth.mode: "trusted-proxy"`: autenticación de proxy inverso para clientes de navegador detrás de una fuente de proxy **no loopback** consciente de identidad (consulta [Autenticación de proxy de confianza](/es/gateway/trusted-proxy-auth)).
- `gateway.remote.url`, `gateway.remote.token`, `gateway.remote.password`: destino de Gateway remoto.
- `session.*`: almacenamiento de sesión y valores predeterminados de clave principal.

## Relacionado

- [Control UI](/es/web/control-ui)
- [Panel](/es/web/dashboard)

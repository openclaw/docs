---
read_when:
    - Depuración o configuración del acceso a WebChat
summary: Host estático de WebChat en loopback y uso de WebSocket del Gateway para la interfaz de chat
title: Chat web
x-i18n:
    generated_at: "2026-07-12T14:56:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: e31558b3f82fc75b660455ad7835e0b43ea07de28fbbc98d4efd82f5d30425fc
    source_path: web/webchat.md
    workflow: 16
---

Estado: la interfaz de chat SwiftUI de macOS/iOS se comunica directamente con el WebSocket del Gateway. No hay ningún navegador integrado ni servidor estático local.

## Qué es

- Una interfaz de chat nativa para el Gateway.
- Utiliza las mismas sesiones y reglas de enrutamiento que otros canales.
- Enrutamiento determinista: las respuestas siempre vuelven a WebChat.
- El historial siempre se obtiene del Gateway (sin supervisión de archivos locales). Si no se puede acceder al Gateway, WebChat es de solo lectura.

## Inicio rápido

1. Inicie el Gateway.
2. Abra la interfaz de WebChat (aplicación para macOS/iOS) o la pestaña de chat de la interfaz de control.
3. Asegúrese de que haya configurada una ruta de autenticación válida para el Gateway (secreto compartido de forma predeterminada, incluso en loopback).

## Cómo funciona

- La interfaz se conecta al WebSocket del Gateway y utiliza los métodos RPC `chat.history`, `chat.send`, `chat.inject` y `chat.message.get`.
- `chat.history` está limitado para garantizar la estabilidad: el Gateway puede truncar campos de texto largos, omitir metadatos pesados y sustituir las entradas sobredimensionadas por `[chat.history omitted: message too large]`. Los clientes de la API pueden enviar un valor `maxChars` por solicitud para sustituir el límite predeterminado en una llamada.
- Cuando se ha truncado un mensaje visible del asistente en `chat.history`, la interfaz de control puede abrir un lector lateral y obtener bajo demanda la entrada completa normalizada para su visualización mediante `chat.message.get`, sin aumentar la carga útil predeterminada del historial. `chat.message.get` utiliza la misma rama de transcripción y las mismas reglas de visualización que `chat.history`, pero selecciona una entrada mediante `messageId` y devuelve un motivo de indisponibilidad veraz cuando ya no es posible devolver el contenido completo.
- `chat.history` sigue la rama activa de la transcripción para los archivos de sesión de solo anexado, por lo que las ramas de reescritura abandonadas y las copias de prompts reemplazadas no se muestran en WebChat.
- Las entradas de Compaction se muestran como un separador «Historial compactado» que explica que la transcripción compactada se conserva como punto de control, con una acción para abrir los puntos de control de la sesión (crear una rama o restaurar, cuando los permisos lo permitan).
- La interfaz de control recuerda el `sessionId` del Gateway devuelto por `chat.history` y lo incluye en las llamadas posteriores a `chat.send`, de modo que las reconexiones y las actualizaciones de página continúan la misma conversación almacenada, salvo que el usuario inicie o restablezca una sesión.
- `chat.send` recibe una clave de idempotencia (la interfaz de control utiliza el identificador de ejecución); el Gateway deduplica las solicitudes repetidas que reutilizan la misma clave, por lo que los reintentos o envíos duplicados en curso para la misma sesión, mensaje y archivos adjuntos no crean una segunda ejecución.
- Los archivos de inicio del espacio de trabajo y las instrucciones pendientes de `BOOTSTRAP.md` se proporcionan mediante la sección `# Project Context` del prompt del sistema del agente, en lugar de copiarse en el mensaje del usuario de WebChat. Si se trunca el contenido de arranque, el prompt del sistema recibe en su lugar un breve «Aviso de contexto de arranque»; los recuentos detallados y las opciones de configuración permanecen en las superficies de diagnóstico.
- La normalización de visualización de `chat.history` elimina: el contexto de OpenClaw exclusivo del entorno de ejecución, los envoltorios de sobres entrantes, las etiquetas de directivas de entrega insertadas como `[[reply_to_current]]`, `[[reply_to:<id>]]` y `[[audio_as_voice]]`, las cargas útiles XML de llamadas a herramientas en texto sin formato (`<tool_call>`, `<function_call>`, `<tool_calls>`, `<function_calls>`, incluidos los bloques truncados) y los tokens de control del modelo ASCII o de ancho completo filtrados. Se omiten las entradas del asistente cuyo texto visible completo sea únicamente el token silencioso `NO_REPLY` (sin distinguir entre mayúsculas y minúsculas).
- Las cargas útiles de respuesta marcadas como razonamiento (`isReasoning: true`) se excluyen del contenido del asistente de WebChat, del texto de reproducción de la transcripción y de los bloques de contenido de audio, para que las cargas útiles que solo contienen el razonamiento no aparezcan como mensajes visibles del asistente ni como audio reproducible.
- `chat.inject` anexa una nota del asistente directamente a la transcripción y la difunde a la interfaz (sin ejecutar el agente).
- Las ejecuciones anuladas pueden mantener visible en la interfaz la salida parcial del asistente. El Gateway conserva ese texto parcial en el historial de la transcripción cuando existe una salida almacenada en búfer y marca la entrada con metadatos de anulación.

### Modelo de transcripción y entrega

WebChat tiene dos rutas de datos independientes:

- Las filas de transcripción de SQLite constituyen la transcripción duradera del modelo y del entorno de ejecución. En las ejecuciones normales del agente, el entorno de ejecución integrado de OpenClaw conserva los mensajes visibles para el modelo `user`, `assistant` y `toolResult` mediante el descriptor de acceso de la sesión. WebChat no escribe texto arbitrario de entrega, estado o ayuda en esa transcripción.
- Los eventos `ReplyPayload` del Gateway son la proyección de entrega en tiempo real: se normalizan para su visualización en WebChat o en el canal, la transmisión por bloques, las etiquetas de directivas, la inserción de contenido multimedia, las marcas de TTS/audio y el comportamiento alternativo de la interfaz. No constituyen por sí mismos el registro canónico de la sesión.
- Los arneses que requieren respuestas visibles mediante `tools.message` siguen utilizando WebChat como destino interno de las respuestas de origen de la ejecución actual. Un `message.send` sin destino procedente de esa ejecución activa de WebChat se proyecta en el mismo chat y se replica en la transcripción de la sesión; WebChat no se convierte en un canal saliente reutilizable y nunca hereda `lastChannel`.
- WebChat inserta entradas del asistente en la transcripción únicamente cuando el Gateway es responsable de un mensaje mostrado fuera de un turno normal del agente integrado: `chat.inject`, respuestas a comandos que no son del agente, salida parcial anulada y complementos de transcripción multimedia administrados por WebChat.
- Si el texto del asistente aparece en tiempo real durante una ejecución, pero desaparece tras volver a cargar el historial, compruebe en este orden: si la transcripción de SQLite contiene el texto del asistente, si la proyección de visualización de `chat.history` lo eliminó y, después, si la combinación de la cola optimista de la interfaz de control sustituyó el estado de entrega local por la instantánea conservada.

Las respuestas finales de las ejecuciones normales del agente deberían ser duraderas porque el entorno de ejecución integrado escribe el `message_end` del asistente. Cualquier mecanismo alternativo que replique una carga útil final entregada en la transcripción debe evitar primero duplicar un turno del asistente que el entorno de ejecución integrado ya haya escrito.

## Panel de herramientas de agentes de la interfaz de control

- El panel Herramientas de `/agents` de la interfaz de control tiene una vista «Disponible ahora» respaldada por `tools.effective(sessionKey=...)`: una proyección de solo lectura, derivada del servidor, del inventario de herramientas de la sesión actual, incluidas las herramientas principales, de plugins, propiedad del canal y de servidores MCP ya descubiertas.
- Una vista independiente de edición de la configuración (respaldada por `tools.catalog`) abarca los perfiles, las sustituciones por agente y la semántica del catálogo.
- La disponibilidad del entorno de ejecución está limitada a la sesión. Cambiar de sesión en el mismo agente puede modificar la lista «Disponible ahora». Si los servidores MCP configurados no se han conectado o han cambiado desde el último descubrimiento, el panel muestra un aviso en lugar de iniciar silenciosamente los transportes MCP desde la ruta de lectura.
- El editor de configuración no implica disponibilidad en el entorno de ejecución; el acceso efectivo sigue la precedencia de las políticas (`allow`/`deny` y sustituciones por agente y proveedor/canal).

## Uso remoto

- El modo remoto canaliza el WebSocket del Gateway mediante SSH/Tailscale.
- No es necesario ejecutar un servidor de WebChat independiente.

## Referencia de configuración (WebChat)

Configuración completa: [Configuración](/es/gateway/configuration)

WebChat no tiene ninguna sección de configuración persistente. El Gateway utiliza el límite de visualización integrado de `chat.history`; los clientes de la API pueden enviar un valor `maxChars` por solicitud para sustituirlo en una sola llamada. La configuración heredada `channels.webchat` y `gateway.webchat` se ha retirado; ejecute `openclaw doctor --fix` para eliminarla.

Opciones globales relacionadas:

- `gateway.port`, `gateway.bind`: host/puerto del WebSocket.
- `gateway.auth.mode`, `gateway.auth.token`, `gateway.auth.password`:
  autenticación del WebSocket mediante secreto compartido.
- `gateway.auth.allowTailscale`: la pestaña de chat de la interfaz de control del navegador puede utilizar los encabezados de identidad de Tailscale
  Serve cuando está habilitado.
- `gateway.auth.mode: "trusted-proxy"`: autenticación mediante proxy inverso para clientes de navegador detrás de un origen de proxy **sin loopback** que reconoce la identidad (consulte [Autenticación mediante proxy de confianza](/es/gateway/trusted-proxy-auth)).
- `gateway.remote.url`, `gateway.remote.token`, `gateway.remote.password`: destino remoto del Gateway.
- `session.*`: almacenamiento de sesiones y valores predeterminados de la clave principal.

## Relacionado

- [Interfaz de control](/es/web/control-ui)
- [Panel de control](/es/web/dashboard)

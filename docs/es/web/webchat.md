---
read_when:
    - Depuración o configuración del acceso a WebChat
summary: Host estático de WebChat en loopback y uso de WS del Gateway para la interfaz de chat
title: Chat web
x-i18n:
    generated_at: "2026-07-19T02:18:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 05309caff8e3fe5d14627ea9bc50667c5154a2f493ef4fd1e813d9d9bf82fbc4
    source_path: web/webchat.md
    workflow: 16
---

Estado: la interfaz de chat SwiftUI de macOS/iOS se comunica directamente con el WebSocket del Gateway. No hay navegador integrado ni servidor estático local.

## Qué es

- Una interfaz de chat nativa para el Gateway.
- Utiliza las mismas sesiones y reglas de enrutamiento que otros canales.
- Enrutamiento determinista: las respuestas siempre regresan a WebChat.
- El historial siempre se obtiene del Gateway (sin supervisión de archivos locales). Si no se puede acceder al Gateway, WebChat es de solo lectura.

## Inicio rápido

1. Inicie el Gateway.
2. Abra la interfaz de WebChat (aplicación para macOS/iOS) o la pestaña de chat de la interfaz de control.
3. Asegúrese de que haya configurada una ruta de autenticación válida para el Gateway (secreto compartido de forma predeterminada, incluso en la interfaz de bucle invertido).

## Cómo funciona

- La interfaz se conecta al WebSocket del Gateway y utiliza los métodos RPC `chat.history`, `chat.send`, `chat.inject` y `chat.message.get`.
- `chat.history` está limitado para garantizar la estabilidad: el Gateway puede truncar campos de texto largos, omitir metadatos pesados y sustituir las entradas demasiado grandes por `[chat.history omitted: message too large]`. Los clientes de la API pueden enviar un `maxChars` por solicitud para sustituir el límite predeterminado en una llamada.
- Cuando un mensaje visible del asistente se ha truncado en `chat.history`, la interfaz de control puede abrir un lector lateral y obtener bajo demanda la entrada completa normalizada para su visualización mediante `chat.message.get`, sin aumentar la carga útil predeterminada del historial. `chat.message.get` utiliza la misma rama de transcripción y las mismas reglas de visualización que `chat.history`, pero selecciona una entrada mediante `messageId` y devuelve un motivo veraz de indisponibilidad cuando ya no puede devolver el contenido completo.
- `chat.history` sigue la rama activa de la transcripción en los archivos de sesión de solo anexado, por lo que las ramas de reescritura abandonadas y las copias de prompts reemplazadas no se muestran en WebChat.
- Las entradas de Compaction se muestran como un separador «Historial compactado» que explica que la transcripción compactada se conserva como punto de control, con una acción para abrir los puntos de control de la sesión (bifurcar o restaurar, cuando los permisos lo permitan).
- La interfaz de control recuerda el `sessionId` subyacente del Gateway devuelto por `chat.history` y lo incluye en las llamadas posteriores a `chat.send`, de modo que las reconexiones y las actualizaciones de página continúan la misma conversación almacenada, salvo que se inicie o restablezca una sesión.
- `chat.send` recibe una clave de idempotencia (la interfaz de control utiliza el identificador de ejecución); el Gateway deduplica las solicitudes repetidas que reutilizan la misma clave, por lo que los reintentos o envíos duplicados en curso para la misma sesión, mensaje y archivos adjuntos no crean una segunda ejecución.
- Al responder a un mensaje específico (clic derecho → Reply), se envía el identificador de transcripción del destino como `replyToId` en `chat.send`. El Gateway resuelve ese mensaje a partir del historial de la sesión y completa los mismos metadatos de contexto de respuesta independientes del canal que utilizan las respuestas de Discord: los agentes ven `has_reply_context`, además del bloque no confiable «Destino de respuesta del mensaje actual del usuario» con la etiqueta y el cuerpo del remitente. (Los prompts de WebChat siguen omitiendo identificadores volátiles de conversación como `reply_to_id`, conforme a la política vigente de prompts estables a nivel de bytes para las sesiones directas de WebChat). Los destinos de respuesta sin un identificador de transcripción persistente (por ejemplo, los envíos pendientes) recurren a una cita insertada en el cuerpo del mensaje.
- Los archivos de inicio del espacio de trabajo y las instrucciones `BOOTSTRAP.md` pendientes se proporcionan mediante la sección `# Project Context` del prompt del sistema del agente, y no se copian en el mensaje de usuario de WebChat. Si se trunca el contenido de arranque, el prompt del sistema recibe en su lugar un breve «Aviso de contexto de arranque»; los recuentos detallados y las opciones de configuración permanecen en las superficies de diagnóstico.
- La normalización para visualización de `chat.history` elimina: el contexto de OpenClaw exclusivo del entorno de ejecución, los envoltorios de sobres entrantes, las etiquetas insertadas de directivas de entrega como `[[reply_to_current]]`, `[[reply_to:<id>]]` y `[[audio_as_voice]]`, las cargas útiles XML de llamadas a herramientas en texto sin formato (`<tool_call>`, `<function_call>`, `<tool_calls>`, `<function_calls>`, incluidos los bloques truncados) y los tokens de control del modelo filtrados en formato ASCII o de ancho completo. Se omiten las entradas del asistente cuyo texto visible completo consiste únicamente en el token silencioso `NO_REPLY` (sin distinguir mayúsculas y minúsculas).
- Las cargas útiles de respuesta marcadas como razonamiento (`isReasoning: true`) se excluyen del contenido del asistente de WebChat, del texto de reproducción de la transcripción y de los bloques de contenido de audio, para que las cargas útiles que solo contienen razonamiento no aparezcan como mensajes visibles del asistente ni como audio reproducible.
- `chat.inject` añade una nota del asistente directamente a la transcripción y la transmite a la interfaz (sin ejecución del agente).
- Las ejecuciones canceladas pueden mantener visible en la interfaz la salida parcial del asistente. El Gateway conserva ese texto parcial en el historial de la transcripción cuando existe una salida almacenada en el búfer y marca la entrada con metadatos de cancelación.

### Modelo de transcripción y entrega

WebChat tiene dos rutas de datos independientes:

- Las filas de transcripción de SQLite constituyen la transcripción persistente del modelo y del entorno de ejecución. En las ejecuciones normales del agente, el entorno de ejecución integrado de OpenClaw conserva los mensajes `user`, `assistant` y `toolResult` visibles para el modelo mediante el descriptor de acceso a la sesión. WebChat no escribe texto arbitrario de entrega, estado o ayuda en esa transcripción.
- Los eventos `ReplyPayload` del Gateway constituyen la proyección de entrega en directo: normalizada para la visualización en WebChat y los canales, la transmisión por bloques, las etiquetas de directivas, la inserción de contenido multimedia, las marcas de TTS/audio y el comportamiento alternativo de la interfaz. Estos eventos no constituyen por sí mismos el registro canónico de la sesión.
- Los entornos de prueba que requieren respuestas visibles mediante `tools.message` siguen utilizando WebChat como receptor interno de respuestas de origen de la ejecución actual. Un `message.send` sin destino procedente de esa ejecución activa de WebChat se proyecta en el mismo chat y se refleja en la transcripción de la sesión; WebChat no se convierte en un canal de salida reutilizable ni hereda nunca `lastChannel`.
- WebChat inserta entradas del asistente en la transcripción únicamente cuando el Gateway controla un mensaje mostrado fuera de un turno normal del agente integrado: `chat.inject`, respuestas a comandos sin agente, salida parcial cancelada y complementos de transcripción multimedia administrados por WebChat.
- Si aparece texto del asistente en directo durante una ejecución, pero desaparece después de volver a cargar el historial, compruebe en este orden: si la transcripción de SQLite contiene el texto del asistente, si la proyección de visualización `chat.history` lo eliminó y, por último, si la combinación de la cola optimista de la interfaz de control sustituyó el estado de entrega local por la instantánea persistente.

Las respuestas finales de las ejecuciones normales del agente deben ser persistentes porque el entorno de ejecución integrado escribe el `message_end` del asistente. Cualquier mecanismo alternativo que refleje una carga útil final entregada en la transcripción debe evitar primero duplicar un turno del asistente que ya haya escrito el entorno de ejecución integrado.

## Panel de herramientas de agentes de la interfaz de control

- El panel Tools de `/agents` de la interfaz de control tiene una vista "Available Right Now" respaldada por `tools.effective(sessionKey=...)`: una proyección de solo lectura derivada del servidor del inventario de herramientas de la sesión actual, que incluye herramientas principales, de plugins, propiedad de canales y de servidores MCP ya detectados.
- Una vista independiente para editar la configuración (respaldada por `tools.catalog`) abarca los perfiles, las sustituciones por agente y la semántica del catálogo.
- La disponibilidad en tiempo de ejecución se limita a la sesión. Cambiar de sesión en el mismo agente puede modificar la lista "Available Right Now". Si los servidores MCP configurados no se han conectado o han cambiado desde la última detección, el panel muestra un aviso en lugar de iniciar silenciosamente los transportes MCP desde la ruta de lectura.
- El editor de configuración no implica disponibilidad en tiempo de ejecución; el acceso efectivo sigue la precedencia de las políticas (`allow`/`deny`, con sustituciones por agente, proveedor y canal).

## Uso remoto

- El modo remoto crea un túnel para el WebSocket del Gateway mediante SSH/Tailscale.
- No es necesario ejecutar un servidor WebChat independiente.

## Referencia de configuración (WebChat)

Configuración completa: [Configuración](/es/gateway/configuration)

WebChat no tiene una sección de configuración persistente. El Gateway utiliza el límite de visualización integrado `chat.history`; los clientes de la API pueden enviar un `maxChars` por solicitud para sustituirlo en una sola llamada. La configuración antigua `channels.webchat` y `gateway.webchat` está retirada; ejecute `openclaw doctor --fix` para eliminarla.

Opciones globales relacionadas:

- `gateway.port`, `gateway.bind`: host/puerto del WebSocket.
- `gateway.auth.mode`, `gateway.auth.token`, `gateway.auth.password`:
  autenticación del WebSocket mediante secreto compartido.
- `gateway.auth.allowTailscale`: la pestaña de chat de la interfaz de control del navegador puede utilizar los encabezados de identidad de Tailscale
  Serve cuando están habilitados.
- `gateway.auth.mode: "trusted-proxy"`: autenticación de proxy inverso para clientes de navegador situados detrás de un origen de proxy **que no sea de bucle invertido** y reconozca identidades (consulte [Autenticación de proxy de confianza](/es/gateway/trusted-proxy-auth)).
- `gateway.remote.url`, `gateway.remote.token`, `gateway.remote.password`: destino remoto del Gateway.
- `session.*`: almacenamiento de sesiones y valores predeterminados de la clave principal.

## Contenido relacionado

- [Interfaz de control](/es/web/control-ui)
- [Panel de control](/es/web/dashboard)

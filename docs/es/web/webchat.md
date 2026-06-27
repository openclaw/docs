---
read_when:
    - Depurar o configurar el acceso a WebChat
summary: Host estático de WebChat con loopback y uso de WS del Gateway para la UI de chat
title: Chat web
x-i18n:
    generated_at: "2026-06-27T13:16:47Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 108dd98f975a2d2e980921bd0f486c3683c18ba6eb37111163af87929a9d7973
    source_path: web/webchat.md
    workflow: 16
---

Estado: la interfaz de chat SwiftUI de macOS/iOS habla directamente con el WebSocket del Gateway.

## Qué es

- Una interfaz de chat nativa para el Gateway (sin navegador incrustado y sin servidor estático local).
- Usa las mismas sesiones y reglas de enrutamiento que otros canales.
- Enrutamiento determinista: las respuestas siempre vuelven a WebChat.

## Inicio rápido

1. Inicia el Gateway.
2. Abre la interfaz WebChat (app de macOS/iOS) o la pestaña de chat de Control UI.
3. Asegúrate de que haya configurada una ruta de autenticación válida del Gateway (secreto compartido de forma predeterminada,
   incluso en loopback).

## Cómo funciona (comportamiento)

- La interfaz se conecta al WebSocket del Gateway y usa `chat.history`, `chat.send` y `chat.inject`.
- `chat.history` está acotado para mantener la estabilidad: Gateway puede truncar campos de texto largos, omitir metadatos pesados y sustituir entradas sobredimensionadas por `[chat.history omitted: message too large]`.
- Cuando un mensaje visible del asistente se truncó en `chat.history`, Control UI puede abrir un lector lateral y obtener bajo demanda la entrada completa normalizada para visualización mediante `chat.message.get`, sin aumentar la carga útil predeterminada del historial.
- `chat.history` sigue la rama activa de la transcripción para los archivos de sesión modernos de solo anexado, de modo que las ramas de reescritura abandonadas y las copias de prompts reemplazadas no se muestran en WebChat.
- Las entradas de Compaction se muestran como un divisor explícito de historial compactado. El divisor explica que la transcripción compactada se conserva como punto de control y enlaza a los controles de punto de control de Sesiones, donde los operadores pueden crear ramas o restaurar desde esa vista compactada cuando sus permisos lo permitan.
- Control UI recuerda el `sessionId` de respaldo devuelto por `chat.history` y lo incluye en las llamadas posteriores a `chat.send`, de modo que las reconexiones y recargas de página continúan la misma conversación almacenada salvo que el usuario inicie o restablezca una sesión.
- Control UI fusiona envíos duplicados en curso para la misma sesión, mensaje y adjuntos antes de generar un nuevo id de ejecución de `chat.send`; Gateway aún desduplica las solicitudes repetidas que reutilizan la misma clave de idempotencia.
- Los archivos de arranque del espacio de trabajo y las instrucciones pendientes de `BOOTSTRAP.md` se suministran mediante el Project Context del prompt de sistema del agente, no se copian en el mensaje de usuario de WebChat. La truncación del arranque solo añade un aviso conciso de recuperación en el prompt de sistema; los recuentos detallados y los controles de configuración permanecen en superficies de diagnóstico.
- `chat.history` también está normalizado para visualización: el contexto de OpenClaw solo de runtime,
  los envoltorios de sobres entrantes, las etiquetas de directivas de entrega en línea
  como `[[reply_to_*]]` y `[[audio_as_voice]]`, las cargas XML de llamadas a herramientas en texto plano
  (incluidos `<tool_call>...</tool_call>`,
  `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
  `<function_calls>...</function_calls>` y bloques de llamadas a herramientas truncados), y
  los tokens de control de modelo ASCII/ancho completo filtrados se eliminan del texto visible,
  y se omiten las entradas del asistente cuyo texto visible completo sea únicamente el token silencioso exacto
  `NO_REPLY` / `no_reply`.
- Las cargas de respuesta marcadas como razonamiento (`isReasoning: true`) se excluyen del contenido del asistente de WebChat, del texto de repetición de la transcripción y de los bloques de contenido de audio, por lo que las cargas solo de pensamiento no aparecen como mensajes visibles del asistente ni como audio reproducible.
- `chat.inject` anexa una nota del asistente directamente a la transcripción y la transmite a la interfaz (sin ejecución de agente).
- Las ejecuciones abortadas pueden mantener visible en la interfaz la salida parcial del asistente.
- Gateway persiste el texto parcial abortado del asistente en el historial de transcripción cuando existe salida en búfer, y marca esas entradas con metadatos de aborto.
- El historial siempre se obtiene desde el Gateway (sin vigilancia de archivos locales).
- Si no se puede acceder al Gateway, WebChat queda en modo solo lectura.

### Modelo de transcripción y entrega

WebChat tiene dos rutas de datos separadas:

- El archivo JSONL de sesión es la transcripción duradera del modelo/runtime. Para ejecuciones normales de agente, el runtime incrustado de OpenClaw persiste mensajes visibles para el modelo `user`, `assistant` y `toolResult` mediante su gestor de sesiones. WebChat no escribe texto arbitrario de entrega, estado o ayuda en esa transcripción.
- Los eventos `ReplyPayload` de Gateway son la proyección de entrega en vivo. Pueden normalizarse para la visualización en WebChat/canales, streaming por bloques, etiquetas de directivas, incrustación de medios, indicadores TTS/audio y comportamiento alternativo de la interfaz. No son en sí mismos el registro canónico de la sesión.
- Los arneses que requieren respuestas visibles mediante `tools.message` siguen usando WebChat como sumidero interno de respuesta de origen para la ejecución actual. Un `message.send` sin destino desde esa ejecución activa de WebChat se proyecta en el mismo chat y se refleja en la transcripción de sesión; WebChat no se convierte en un canal saliente reutilizable y nunca hereda `lastChannel`.
- WebChat inyecta entradas de transcripción del asistente solo cuando Gateway posee un mensaje mostrado fuera de un turno normal de agente incrustado: `chat.inject`, respuestas de comandos que no son de agente, salida parcial abortada y suplementos de transcripción de medios gestionados por WebChat.
- `chat.history` lee la transcripción de sesión almacenada y aplica la proyección de visualización de WebChat. Si aparece texto del asistente en vivo durante una ejecución pero desaparece tras recargar el historial, comprueba primero si el JSONL sin procesar contiene el texto del asistente, luego si la proyección de `chat.history` lo eliminó, y después si la fusión optimista de cola de Control UI reemplazó el estado de entrega local con la instantánea persistida.
- `chat.message.get` usa la misma rama de transcripción y las mismas reglas de proyección de visualización que `chat.history`, incluido el ámbito de agente activo, pero apunta a una entrada de transcripción por `messageId` y devuelve una razón honesta de no disponibilidad cuando el contenido completo ya no puede devolverse.

Las respuestas finales de ejecuciones normales de agente deberían ser duraderas porque el runtime incrustado escribe el `message_end` del asistente. Cualquier alternativa que refleje una carga final entregada en la transcripción debe evitar primero duplicar un turno del asistente que el runtime incrustado ya escribió.

## Panel de herramientas de agentes de Control UI

- El panel Tools de `/agents` en Control UI tiene dos vistas separadas:
  - **Disponible ahora mismo** usa `tools.effective(sessionKey=...)` y muestra una proyección de solo lectura derivada del servidor
    del inventario de la sesión actual, incluidas herramientas del núcleo, de plugins, propiedad del canal
    y de servidores MCP ya descubiertos.
  - **Configuración de herramientas** usa `tools.catalog` y se mantiene centrada en perfiles, sobrescrituras y
    semántica del catálogo.
- La disponibilidad en runtime tiene ámbito de sesión. Cambiar de sesión en el mismo agente puede cambiar la lista
  **Disponible ahora mismo**. Si los servidores MCP configurados no se han conectado o cambiaron
  desde el último descubrimiento, el panel muestra un aviso en lugar de iniciar silenciosamente transportes MCP
  desde la ruta de lectura.
- El editor de configuración no implica disponibilidad en runtime; el acceso efectivo sigue respetando la precedencia de políticas
  (`allow`/`deny`, sobrescrituras por agente y por proveedor/canal).

## Uso remoto

- El modo remoto tuneliza el WebSocket del Gateway mediante SSH/Tailscale.
- No necesitas ejecutar un servidor WebChat separado.

## Referencia de configuración (WebChat)

Configuración completa: [Configuración](/es/gateway/configuration)

WebChat no tiene una sección de configuración persistida. Gateway usa el límite de visualización integrado de `chat.history`; los clientes de API pueden enviar `maxChars` por solicitud para sobrescribirlo en una única llamada a `chat.history`. La configuración heredada `channels.webchat` y `gateway.webchat` está retirada; ejecuta `openclaw doctor --fix` para eliminarla.

Opciones globales relacionadas:

- `gateway.port`, `gateway.bind`: host/puerto de WebSocket.
- `gateway.auth.mode`, `gateway.auth.token`, `gateway.auth.password`:
  autenticación WebSocket con secreto compartido.
- `gateway.auth.allowTailscale`: la pestaña de chat de Control UI en navegador puede usar encabezados de identidad de Tailscale
  Serve cuando está habilitado.
- `gateway.auth.mode: "trusted-proxy"`: autenticación de proxy inverso para clientes de navegador detrás de una fuente de proxy **no loopback** consciente de identidad (consulta [Autenticación de proxy de confianza](/es/gateway/trusted-proxy-auth)).
- `gateway.remote.url`, `gateway.remote.token`, `gateway.remote.password`: destino del Gateway remoto.
- `session.*`: almacenamiento de sesiones y valores predeterminados de clave principal.

## Relacionado

- [Control UI](/es/web/control-ui)
- [Panel](/es/web/dashboard)

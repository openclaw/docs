---
read_when:
    - Depuración o configuración del acceso a WebChat
summary: Uso del host estático de WebChat de loopback y de WS del Gateway para la IU de chat
title: Chat web
x-i18n:
    generated_at: "2026-05-04T02:26:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: bf435585a13a1cde5885714837017109eeeb61ffa5e33a400017706f676f57ea
    source_path: web/webchat.md
    workflow: 16
---

Estado: la interfaz de chat SwiftUI de macOS/iOS se comunica directamente con el WebSocket del Gateway.

## Qué es

- Una interfaz de chat nativa para el Gateway (sin navegador integrado ni servidor estático local).
- Usa las mismas sesiones y reglas de enrutamiento que otros canales.
- Enrutamiento determinista: las respuestas siempre vuelven a WebChat.

## Inicio rápido

1. Inicia el Gateway.
2. Abre la interfaz de WebChat (app de macOS/iOS) o la pestaña de chat de Control UI.
3. Asegúrate de que haya una ruta de autenticación válida del Gateway configurada (secreto compartido de forma predeterminada,
   incluso en loopback).

## Cómo funciona (comportamiento)

- La interfaz se conecta al WebSocket del Gateway y usa `chat.history`, `chat.send` y `chat.inject`.
- `chat.history` está acotado para mantener la estabilidad: el Gateway puede truncar campos de texto largos, omitir metadatos pesados y reemplazar entradas sobredimensionadas con `[chat.history omitted: message too large]`.
- `chat.history` sigue la rama de transcripción activa para los archivos de sesión modernos de solo anexado, por lo que las ramas de reescritura abandonadas y las copias de prompts reemplazadas no se muestran en WebChat.
- Las entradas de Compaction se muestran como un divisor explícito de historial compactado. El divisor explica que los turnos anteriores se conservan en un punto de control y enlaza a los controles de punto de control de Sesiones, donde los operadores pueden bifurcar o restaurar la vista previa a la Compaction cuando sus permisos lo permiten.
- Control UI recuerda el `sessionId` del Gateway subyacente devuelto por `chat.history` y lo incluye en las llamadas posteriores a `chat.send`, de modo que las reconexiones y las actualizaciones de página continúan la misma conversación almacenada a menos que el usuario inicie o restablezca una sesión.
- Control UI combina los envíos duplicados en curso para la misma sesión, mensaje y adjuntos antes de generar un nuevo id de ejecución de `chat.send`; el Gateway aún deduplica las solicitudes repetidas que reutilizan la misma clave de idempotencia.
- Los archivos de inicio del espacio de trabajo y las instrucciones pendientes de `BOOTSTRAP.md` se proporcionan mediante el Contexto del proyecto del prompt del sistema del agente, no se copian en el mensaje de usuario de WebChat. El truncamiento de bootstrap solo agrega un aviso conciso de recuperación al prompt del sistema; los conteos detallados y los ajustes de configuración permanecen en las superficies de diagnóstico.
- `chat.history` también se normaliza para visualización: el contexto de OpenClaw solo de tiempo de ejecución,
  los envoltorios de sobre entrante, las etiquetas de directivas de entrega en línea
  como `[[reply_to_*]]` y `[[audio_as_voice]]`, las cargas XML de llamadas a herramientas en texto plano
  (incluidos `<tool_call>...</tool_call>`,
  `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
  `<function_calls>...</function_calls>` y bloques truncados de llamadas a herramientas), y
  los tokens de control del modelo ASCII/ancho completo filtrados se eliminan del texto visible,
  y las entradas del asistente cuyo texto visible completo sea solo el token silencioso exacto
  `NO_REPLY` / `no_reply` se omiten.
- Las cargas de respuesta marcadas como razonamiento (`isReasoning: true`) se excluyen del contenido del asistente de WebChat, del texto de reproducción de la transcripción y de los bloques de contenido de audio, por lo que las cargas solo de pensamiento no aparecen como mensajes visibles del asistente ni como audio reproducible.
- `chat.inject` anexa una nota del asistente directamente a la transcripción y la transmite a la interfaz (sin ejecución del agente).
- Las ejecuciones canceladas pueden mantener visible la salida parcial del asistente en la interfaz.
- El Gateway conserva el texto parcial cancelado del asistente en el historial de transcripción cuando existe salida en búfer, y marca esas entradas con metadatos de cancelación.
- El historial siempre se obtiene desde el Gateway (sin observación de archivos locales).
- Si el Gateway no está disponible, WebChat queda en modo de solo lectura.

### Modelo de transcripción y entrega

WebChat tiene dos rutas de datos separadas:

- El archivo JSONL de sesión es la transcripción duradera del modelo/tiempo de ejecución. Para ejecuciones normales de agentes, Pi conserva los mensajes `user`, `assistant` y `toolResult` visibles para el modelo mediante su gestor de sesiones. WebChat no escribe texto arbitrario de entrega, estado o ayuda en esa transcripción.
- Los eventos `ReplyPayload` del Gateway son la proyección de entrega en vivo. Pueden normalizarse para la visualización en WebChat/canales, streaming por bloques, etiquetas de directivas, incrustación de medios, indicadores de TTS/audio y comportamiento de respaldo de la interfaz. No son por sí mismos el registro canónico de la sesión.
- WebChat inyecta entradas de transcripción del asistente solo cuando el Gateway es propietario de un mensaje mostrado fuera de un turno normal del asistente de Pi: `chat.inject`, respuestas de comandos sin agente, salida parcial cancelada y suplementos de transcripción de medios gestionados por WebChat.
- `chat.history` lee la transcripción de sesión almacenada y aplica la proyección de visualización de WebChat. Si aparece texto del asistente en vivo durante una ejecución pero desaparece después de recargar el historial, comprueba primero si el JSONL sin procesar contiene el texto del asistente, luego si la proyección de `chat.history` lo eliminó, y después si la fusión optimista de cola de Control UI reemplazó el estado de entrega local con la instantánea persistida.

Las respuestas finales de ejecuciones normales de agentes deberían ser duraderas porque Pi escribe el `message_end` del asistente. Cualquier respaldo que refleje una carga final entregada en la transcripción debe evitar primero duplicar un turno del asistente que Pi ya escribió.

## Panel de herramientas de agentes de Control UI

- El panel de Herramientas `/agents` de Control UI tiene dos vistas separadas:
  - **Disponible ahora mismo** usa `tools.effective(sessionKey=...)` y muestra lo que la sesión actual
    realmente puede usar en tiempo de ejecución, incluidas herramientas principales, de plugins y propiedad de canales.
  - **Configuración de herramientas** usa `tools.catalog` y se mantiene enfocado en perfiles, anulaciones y
    semántica del catálogo.
- La disponibilidad en tiempo de ejecución está limitada a la sesión. Cambiar de sesión en el mismo agente puede cambiar la
  lista **Disponible ahora mismo**.
- El editor de configuración no implica disponibilidad en tiempo de ejecución; el acceso efectivo sigue respetando la precedencia de políticas
  (`allow`/`deny`, anulaciones por agente y proveedor/canal).

## Uso remoto

- El modo remoto tuneliza el WebSocket del Gateway mediante SSH/Tailscale.
- No necesitas ejecutar un servidor de WebChat separado.

## Referencia de configuración (WebChat)

Configuración completa: [Configuración](/es/gateway/configuration)

Opciones de WebChat:

- `gateway.webchat.chatHistoryMaxChars`: conteo máximo de caracteres para campos de texto en respuestas de `chat.history`. Cuando una entrada de transcripción supera este límite, el Gateway trunca los campos de texto largos y puede reemplazar mensajes sobredimensionados con un marcador de posición. El cliente también puede enviar `maxChars` por solicitud para anular este valor predeterminado en una sola llamada a `chat.history`.

Opciones globales relacionadas:

- `gateway.port`, `gateway.bind`: host/puerto de WebSocket.
- `gateway.auth.mode`, `gateway.auth.token`, `gateway.auth.password`:
  autenticación WebSocket con secreto compartido.
- `gateway.auth.allowTailscale`: la pestaña de chat de Control UI en el navegador puede usar encabezados de identidad de Tailscale
  Serve cuando está habilitado.
- `gateway.auth.mode: "trusted-proxy"`: autenticación de proxy inverso para clientes de navegador detrás de una fuente de proxy **no loopback** con reconocimiento de identidad (consulta [Autenticación de proxy de confianza](/es/gateway/trusted-proxy-auth)).
- `gateway.remote.url`, `gateway.remote.token`, `gateway.remote.password`: destino del Gateway remoto.
- `session.*`: almacenamiento de sesiones y valores predeterminados de clave principal.

## Relacionado

- [Control UI](/es/web/control-ui)
- [Panel](/es/web/dashboard)

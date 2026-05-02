---
read_when:
    - Depuración o configuración del acceso a WebChat
summary: Alojamiento estático de WebChat en loopback y uso de WS del Gateway para la interfaz de chat
title: Chat web
x-i18n:
    generated_at: "2026-05-02T23:39:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: ad3a09c8962e3a6dda83716d319df7ba27e18105cee50721278b5cba0a85c52f
    source_path: web/webchat.md
    workflow: 16
---

Estado: la interfaz de chat SwiftUI de macOS/iOS se comunica directamente con el WebSocket del Gateway.

## Qué es

- Una interfaz de chat nativa para el gateway (sin navegador integrado ni servidor estático local).
- Usa las mismas sesiones y reglas de enrutamiento que otros canales.
- Enrutamiento determinista: las respuestas siempre vuelven a WebChat.

## Inicio rápido

1. Inicia el gateway.
2. Abre la interfaz de WebChat (app de macOS/iOS) o la pestaña de chat de la interfaz de Control.
3. Asegúrate de que haya configurada una ruta de autenticación válida para el gateway (secreto compartido de forma predeterminada,
   incluso en loopback).

## Cómo funciona (comportamiento)

- La interfaz se conecta al WebSocket del Gateway y usa `chat.history`, `chat.send`, `chat.inject` y `chat.transcribeAudio`.
- `chat.history` está acotado para mayor estabilidad: el Gateway puede truncar campos de texto largos, omitir metadatos pesados y reemplazar entradas demasiado grandes con `[chat.history omitted: message too large]`.
- `chat.history` sigue la rama activa de la transcripción para los archivos de sesión modernos de solo adición, de modo que las ramas de reescritura abandonadas y las copias de prompts reemplazadas no se muestran en WebChat.
- La interfaz de Control recuerda el `sessionId` del Gateway subyacente devuelto por `chat.history` y lo incluye en las llamadas posteriores a `chat.send`, por lo que las reconexiones y las recargas de página continúan la misma conversación almacenada a menos que el usuario inicie o restablezca una sesión.
- La interfaz de Control agrupa los envíos duplicados en curso para la misma sesión, mensaje y adjuntos antes de generar un nuevo id de ejecución de `chat.send`; el Gateway aún desduplica las solicitudes repetidas que reutilizan la misma clave de idempotencia.
- `chat.history` también se normaliza para visualización: el contexto de OpenClaw solo de runtime,
  los envoltorios de sobres entrantes, las etiquetas de directivas de entrega en línea
  como `[[reply_to_*]]` y `[[audio_as_voice]]`, las cargas XML de llamadas a herramientas en texto plano
  (incluidos `<tool_call>...</tool_call>`,
  `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
  `<function_calls>...</function_calls>` y bloques truncados de llamadas a herramientas), y
  los tokens de control del modelo ASCII/de ancho completo filtrados se eliminan del texto visible,
  y se omiten las entradas del asistente cuyo texto visible completo sea solo el token silencioso exacto
  `NO_REPLY` / `no_reply`.
- Las cargas de respuesta marcadas como razonamiento (`isReasoning: true`) se excluyen del contenido del asistente de WebChat, del texto de reproducción de la transcripción y de los bloques de contenido de audio, por lo que las cargas solo de pensamiento no aparecen como mensajes visibles del asistente ni como audio reproducible.
- `chat.transcribeAudio` impulsa el dictado del lado del servidor en el compositor de chat de la interfaz de Control. El navegador graba audio del micrófono, lo envía como base64 al Gateway y el Gateway ejecuta la canalización `tools.media.audio` configurada. La transcripción devuelta se inserta en el borrador; no se inicia ninguna ejecución de agente hasta que el usuario la envía.
- `chat.inject` agrega una nota del asistente directamente a la transcripción y la difunde a la interfaz (sin ejecución de agente).
- Las ejecuciones canceladas pueden mantener visible en la interfaz la salida parcial del asistente.
- El Gateway conserva el texto parcial cancelado del asistente en el historial de transcripción cuando existe salida almacenada en búfer y marca esas entradas con metadatos de cancelación.
- El historial siempre se obtiene desde el gateway (sin vigilancia de archivos locales).
- Si el gateway no está disponible, WebChat es de solo lectura.

## Panel de herramientas de agentes de la interfaz de Control

- El panel Herramientas de `/agents` de la interfaz de Control tiene dos vistas separadas:
  - **Disponible ahora mismo** usa `tools.effective(sessionKey=...)` y muestra lo que la sesión actual
    realmente puede usar en runtime, incluidas herramientas principales, de plugins y propiedad del canal.
  - **Configuración de herramientas** usa `tools.catalog` y se mantiene centrada en perfiles, sobrescrituras y
    semántica del catálogo.
- La disponibilidad en runtime está limitada al alcance de la sesión. Cambiar de sesión en el mismo agente puede cambiar la
  lista **Disponible ahora mismo**.
- El editor de configuración no implica disponibilidad en runtime; el acceso efectivo sigue respetando la precedencia de políticas
  (`allow`/`deny`, sobrescrituras por agente y por proveedor/canal).

## Uso remoto

- El modo remoto tuneliza el WebSocket del gateway mediante SSH/Tailscale.
- No necesitas ejecutar un servidor WebChat separado.

## Referencia de configuración (WebChat)

Configuración completa: [Configuración](/es/gateway/configuration)

Opciones de WebChat:

- `gateway.webchat.chatHistoryMaxChars`: recuento máximo de caracteres para campos de texto en respuestas de `chat.history`. Cuando una entrada de transcripción supera este límite, el Gateway trunca los campos de texto largos y puede reemplazar mensajes demasiado grandes con un marcador de posición. El cliente también puede enviar `maxChars` por solicitud para sobrescribir este valor predeterminado en una sola llamada a `chat.history`.

Opciones globales relacionadas:

- `gateway.port`, `gateway.bind`: host/puerto de WebSocket.
- `gateway.auth.mode`, `gateway.auth.token`, `gateway.auth.password`:
  autenticación de WebSocket con secreto compartido.
- `gateway.auth.allowTailscale`: la pestaña de chat de la interfaz de Control del navegador puede usar encabezados de identidad de Tailscale
  Serve cuando está habilitado.
- `gateway.auth.mode: "trusted-proxy"`: autenticación de proxy inverso para clientes de navegador detrás de una fuente de proxy **no loopback** con reconocimiento de identidad (consulta [Autenticación con proxy de confianza](/es/gateway/trusted-proxy-auth)).
- `gateway.remote.url`, `gateway.remote.token`, `gateway.remote.password`: destino del gateway remoto.
- `session.*`: almacenamiento de sesiones y valores predeterminados de clave principal.

## Relacionado

- [Interfaz de Control](/es/web/control-ui)
- [Panel](/es/web/dashboard)

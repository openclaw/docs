---
read_when:
    - Depuración o configuración del acceso a WebChat
summary: Host estático de WebChat de local loopback y uso de WS del Gateway para la interfaz de chat
title: Chat web
x-i18n:
    generated_at: "2026-04-30T06:07:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: d8a4fef0aab37ca82bff249c6b31eb65475f12c16dfb9b86ddd62c1a938a34f3
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
3. Asegúrate de que haya configurada una ruta de autenticación válida del Gateway (secreto compartido de forma predeterminada,
   incluso en loopback).

## Cómo funciona (comportamiento)

- La interfaz se conecta al WebSocket del Gateway y usa `chat.history`, `chat.send` y `chat.inject`.
- `chat.history` está limitado para mayor estabilidad: el Gateway puede truncar campos de texto largos, omitir metadatos pesados y reemplazar entradas demasiado grandes por `[chat.history omitted: message too large]`.
- `chat.history` sigue la rama activa de la transcripción para archivos de sesión modernos de solo adición, por lo que las ramas de reescritura abandonadas y las copias de prompts reemplazadas no se muestran en WebChat.
- Control UI fusiona los envíos duplicados en curso para la misma sesión, mensaje y archivos adjuntos antes de generar un nuevo id de ejecución de `chat.send`; el Gateway sigue desduplicando las solicitudes repetidas que reutilizan la misma clave de idempotencia.
- `chat.history` también se normaliza para visualización: el contexto de OpenClaw solo de runtime,
  los envoltorios de sobres entrantes, las etiquetas inline de directivas de entrega
  como `[[reply_to_*]]` y `[[audio_as_voice]]`, las cargas XML de llamadas a herramientas en texto sin formato
  (incluidos `<tool_call>...</tool_call>`,
  `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
  `<function_calls>...</function_calls>` y bloques truncados de llamadas a herramientas), y
  los tokens de control del modelo filtrados en ASCII/ancho completo se eliminan del texto visible,
  y se omiten las entradas del asistente cuyo texto visible completo es solo el token silencioso exacto
  `NO_REPLY` / `no_reply`.
- Las cargas de respuesta marcadas como razonamiento (`isReasoning: true`) se excluyen del contenido del asistente en WebChat, del texto de reproducción de transcripciones y de los bloques de contenido de audio, por lo que las cargas solo de pensamiento no aparecen como mensajes visibles del asistente ni como audio reproducible.
- `chat.inject` añade una nota del asistente directamente a la transcripción y la difunde a la interfaz (sin ejecución de agente).
- Las ejecuciones abortadas pueden mantener visible en la interfaz la salida parcial del asistente.
- El Gateway conserva el texto parcial abortado del asistente en el historial de transcripción cuando existe salida almacenada en búfer y marca esas entradas con metadatos de aborto.
- El historial siempre se obtiene del Gateway (sin observación de archivos locales).
- Si el Gateway no está disponible, WebChat es de solo lectura.

## Panel de herramientas de agentes de Control UI

- El panel Tools de `/agents` en Control UI tiene dos vistas separadas:
  - **Disponible ahora mismo** usa `tools.effective(sessionKey=...)` y muestra lo que la sesión actual
    realmente puede usar en runtime, incluidas herramientas del núcleo, de plugins y propiedad del canal.
  - **Configuración de herramientas** usa `tools.catalog` y se mantiene centrado en perfiles, sobrescrituras y
    semántica del catálogo.
- La disponibilidad en runtime está limitada al ámbito de la sesión. Cambiar de sesión en el mismo agente puede cambiar la lista
  **Disponible ahora mismo**.
- El editor de configuración no implica disponibilidad en runtime; el acceso efectivo sigue respetando la precedencia de políticas
  (`allow`/`deny`, sobrescrituras por agente y por proveedor/canal).

## Uso remoto

- El modo remoto tuneliza el WebSocket del Gateway mediante SSH/Tailscale.
- No necesitas ejecutar un servidor WebChat separado.

## Referencia de configuración (WebChat)

Configuración completa: [Configuración](/es/gateway/configuration)

Opciones de WebChat:

- `gateway.webchat.chatHistoryMaxChars`: recuento máximo de caracteres para campos de texto en respuestas de `chat.history`. Cuando una entrada de transcripción supera este límite, el Gateway trunca campos de texto largos y puede reemplazar mensajes demasiado grandes por un marcador de posición. El cliente también puede enviar `maxChars` por solicitud para sobrescribir este valor predeterminado en una sola llamada a `chat.history`.

Opciones globales relacionadas:

- `gateway.port`, `gateway.bind`: host/puerto de WebSocket.
- `gateway.auth.mode`, `gateway.auth.token`, `gateway.auth.password`:
  autenticación WebSocket con secreto compartido.
- `gateway.auth.allowTailscale`: la pestaña de chat de Control UI del navegador puede usar encabezados de identidad de Tailscale
  Serve cuando está habilitado.
- `gateway.auth.mode: "trusted-proxy"`: autenticación de proxy inverso para clientes de navegador detrás de una fuente de proxy **no loopback** con identidad (consulta [Autenticación de proxy de confianza](/es/gateway/trusted-proxy-auth)).
- `gateway.remote.url`, `gateway.remote.token`, `gateway.remote.password`: destino remoto del Gateway.
- `session.*`: almacenamiento de sesiones y valores predeterminados de la clave principal.

## Relacionado

- [Control UI](/es/web/control-ui)
- [Panel](/es/web/dashboard)

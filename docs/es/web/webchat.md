---
read_when:
    - Depuración o configuración del acceso a WebChat
summary: Uso del host estático de WebChat en loopback y de Gateway WS para la interfaz de chat
title: WebChat
x-i18n:
    generated_at: "2026-04-26T11:40:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: eb64bf7771f833a6d97c1b0ad773e763422af25e85a3084519e05aa8d3d0ab69
    source_path: web/webchat.md
    workflow: 15
---

Estado: la interfaz de chat SwiftUI de macOS/iOS se comunica directamente con el Gateway WebSocket.

## Qué es

- Una interfaz de chat nativa para el gateway (sin navegador integrado ni servidor estático local).
- Usa las mismas sesiones y reglas de enrutamiento que otros canales.
- Enrutamiento determinista: las respuestas siempre vuelven a WebChat.

## Inicio rápido

1. Inicia el gateway.
2. Abre la interfaz de WebChat (app de macOS/iOS) o la pestaña de chat de la Control UI.
3. Asegúrate de que haya una ruta de autenticación válida del gateway configurada (por defecto `shared-secret`,
   incluso en loopback).

## Cómo funciona (comportamiento)

- La interfaz se conecta al Gateway WebSocket y usa `chat.history`, `chat.send` y `chat.inject`.
- `chat.history` está acotado para ofrecer estabilidad: Gateway puede truncar campos de texto largos, omitir metadatos pesados y reemplazar entradas sobredimensionadas con `[chat.history omitted: message too large]`.
- `chat.history` también está normalizado para visualización: el contexto exclusivo de runtime de OpenClaw,
  los contenedores de sobre entrantes, las etiquetas de directiva de entrega en línea
  como `[[reply_to_*]]` y `[[audio_as_voice]]`, las cargas útiles XML de llamada a herramientas en texto plano
  (incluyendo `<tool_call>...</tool_call>`,
  `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
  `<function_calls>...</function_calls>` y bloques truncados de llamada a herramientas), y
  los tokens filtrados de control de modelo ASCII/de ancho completo se eliminan del texto visible,
  y se omiten las entradas del asistente cuyo texto visible completo sea solo el token
  silencioso exacto `NO_REPLY` / `no_reply`.
- Las cargas útiles de respuesta marcadas como razonamiento (`isReasoning: true`) se excluyen del contenido del asistente en WebChat, del texto de reproducción de la transcripción y de los bloques de contenido de audio, para que las cargas útiles solo de pensamiento no aparezcan como mensajes visibles del asistente ni como audio reproducible.
- `chat.inject` agrega una nota del asistente directamente a la transcripción y la difunde a la interfaz (sin ejecución del agente).
- Las ejecuciones abortadas pueden mantener visible en la interfaz una salida parcial del asistente.
- Gateway conserva en el historial de la transcripción el texto parcial del asistente de ejecuciones abortadas cuando existe salida en búfer, y marca esas entradas con metadatos de aborto.
- El historial siempre se obtiene del gateway (sin supervisión de archivos local).
- Si no se puede acceder al gateway, WebChat es de solo lectura.

## Panel de herramientas de agentes de la Control UI

- El panel Tools de `/agents` en la Control UI tiene dos vistas independientes:
  - **Disponibles ahora mismo** usa `tools.effective(sessionKey=...)` y muestra lo que la
    sesión actual realmente puede usar en runtime, incluidas herramientas del núcleo, del Plugin y propias del canal.
  - **Configuración de herramientas** usa `tools.catalog` y sigue centrado en perfiles, anulaciones y
    semántica del catálogo.
- La disponibilidad en runtime tiene alcance de sesión. Cambiar de sesión en el mismo agente puede cambiar la lista de
  **Disponibles ahora mismo**.
- El editor de configuración no implica disponibilidad en runtime; el acceso efectivo sigue la precedencia de políticas
  (`allow`/`deny`, anulaciones por agente y por proveedor/canal).

## Uso remoto

- El modo remoto tuneliza el Gateway WebSocket mediante SSH/Tailscale.
- No necesitas ejecutar un servidor WebChat independiente.

## Referencia de configuración (WebChat)

Configuración completa: [Configuración](/es/gateway/configuration)

Opciones de WebChat:

- `gateway.webchat.chatHistoryMaxChars`: número máximo de caracteres para campos de texto en las respuestas de `chat.history`. Cuando una entrada de la transcripción supera este límite, Gateway trunca los campos de texto largos y puede reemplazar los mensajes sobredimensionados con un marcador. El cliente también puede enviar `maxChars` por solicitud para anular este valor predeterminado en una sola llamada a `chat.history`.

Opciones globales relacionadas:

- `gateway.port`, `gateway.bind`: host/puerto de WebSocket.
- `gateway.auth.mode`, `gateway.auth.token`, `gateway.auth.password`:
  autenticación WebSocket de `shared-secret`.
- `gateway.auth.allowTailscale`: la pestaña de chat de la Control UI en navegador puede usar encabezados de identidad de Tailscale
  Serve cuando está habilitado.
- `gateway.auth.mode: "trusted-proxy"`: autenticación de proxy inverso para clientes de navegador detrás de un origen de proxy **no loopback** con reconocimiento de identidad (consulta [Autenticación de Trusted Proxy](/es/gateway/trusted-proxy-auth)).
- `gateway.remote.url`, `gateway.remote.token`, `gateway.remote.password`: destino del gateway remoto.
- `session.*`: almacenamiento de sesiones y valores predeterminados de clave principal.

## Relacionado

- [Control UI](/es/web/control-ui)
- [Dashboard](/es/web/dashboard)

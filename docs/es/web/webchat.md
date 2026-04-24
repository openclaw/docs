---
read_when:
    - Depurar o configurar el acceso a WebChat
summary: Host estático de WebChat en loopback y uso de WS de Gateway para la UI de chat
title: WebChat
x-i18n:
    generated_at: "2026-04-24T05:57:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 466e1e92ea5b8bb979a34985b9cd9618c94a0a4a424444024edda26c46540f1e
    source_path: web/webchat.md
    workflow: 15
---

Estado: la UI de chat SwiftUI de macOS/iOS se comunica directamente con el WebSocket de Gateway.

## Qué es

- Una UI de chat nativa para el gateway (sin navegador embebido ni servidor estático local).
- Usa las mismas sesiones y reglas de enrutamiento que otros canales.
- Enrutamiento determinista: las respuestas siempre vuelven a WebChat.

## Inicio rápido

1. Inicia el gateway.
2. Abre la UI de WebChat (app de macOS/iOS) o la pestaña de chat de la UI de Control.
3. Asegúrate de que haya una ruta válida de autenticación de gateway configurada (secreto compartido por defecto,
   incluso en loopback).

## Cómo funciona (comportamiento)

- La UI se conecta al WebSocket de Gateway y usa `chat.history`, `chat.send` y `chat.inject`.
- `chat.history` está acotado para mantener la estabilidad: Gateway puede truncar campos de texto largos, omitir metadatos pesados y reemplazar entradas sobredimensionadas con `[chat.history omitted: message too large]`.
- `chat.history` también se normaliza para visualización: se eliminan del texto visible las etiquetas en línea de directivas de entrega
  como `[[reply_to_*]]` y `[[audio_as_voice]]`, las cargas útiles XML
  de llamadas a herramientas en texto plano (incluyendo `<tool_call>...</tool_call>`,
  `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
  `<function_calls>...</function_calls>` y bloques truncados de llamadas a herramientas), y
  los tokens filtrados de control del modelo en ASCII/ancho completo; además, se omiten las entradas del asistente cuyo texto visible completo sea solo el token
  silencioso exacto `NO_REPLY` / `no_reply`.
- `chat.inject` agrega una nota del asistente directamente a la transcripción y la difunde a la UI (sin ejecución del agente).
- Las ejecuciones abortadas pueden mantener visible en la UI una salida parcial del asistente.
- Gateway conserva en el historial de la transcripción el texto parcial abortado del asistente cuando existe salida en búfer, y marca esas entradas con metadatos de aborto.
- El historial siempre se obtiene desde el gateway (sin observación de archivos local).
- Si no se puede acceder al gateway, WebChat es de solo lectura.

## Panel de herramientas de agentes en la UI de Control

- El panel Tools de `/agents` en la UI de Control tiene dos vistas separadas:
  - **Disponible ahora mismo** usa `tools.effective(sessionKey=...)` y muestra lo que la sesión actual
    puede usar realmente en tiempo de ejecución, incluidas herramientas principales, de Plugin y propias del canal.
  - **Configuración de herramientas** usa `tools.catalog` y se mantiene centrado en perfiles, anulaciones y
    la semántica del catálogo.
- La disponibilidad en tiempo de ejecución está delimitada por sesión. Cambiar de sesión en el mismo agente puede cambiar la lista de
  **Disponible ahora mismo**.
- El editor de configuración no implica disponibilidad en tiempo de ejecución; el acceso efectivo sigue la precedencia de políticas
  (`allow`/`deny`, anulaciones por agente y por proveedor/canal).

## Uso remoto

- El modo remoto tuneliza el WebSocket de Gateway mediante SSH/Tailscale.
- No necesitas ejecutar un servidor WebChat separado.

## Referencia de configuración (WebChat)

Configuración completa: [Configuración](/es/gateway/configuration)

Opciones de WebChat:

- `gateway.webchat.chatHistoryMaxChars`: número máximo de caracteres para campos de texto en respuestas de `chat.history`. Cuando una entrada de la transcripción supera este límite, Gateway trunca los campos de texto largos y puede reemplazar mensajes sobredimensionados por un marcador. El cliente también puede enviar `maxChars` por solicitud para anular este valor predeterminado en una sola llamada a `chat.history`.

Opciones globales relacionadas:

- `gateway.port`, `gateway.bind`: host/puerto de WebSocket.
- `gateway.auth.mode`, `gateway.auth.token`, `gateway.auth.password`:
  autenticación de WebSocket con secreto compartido.
- `gateway.auth.allowTailscale`: la pestaña de chat de la UI de Control del navegador puede usar
  cabeceras de identidad de Tailscale Serve cuando está habilitado.
- `gateway.auth.mode: "trusted-proxy"`: autenticación por proxy inverso para clientes de navegador detrás de una fuente de proxy **sin loopback** con reconocimiento de identidad (consulta [Autenticación de trusted proxy](/es/gateway/trusted-proxy-auth)).
- `gateway.remote.url`, `gateway.remote.token`, `gateway.remote.password`: destino del gateway remoto.
- `session.*`: almacenamiento de sesiones y valores predeterminados de clave principal.

## Relacionado

- [UI de Control](/es/web/control-ui)
- [Panel](/es/web/dashboard)

---
read_when:
    - Depurar la vista WebChat de mac o el puerto local loopback
summary: Cómo la app de Mac integra el WebChat del Gateway y cómo depurarlo
title: WebChat (macOS)
x-i18n:
    generated_at: "2026-07-06T10:50:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 925751d15450c816fc81b59ac89a190d88ab8b77629b635913e0862ba94af1c0
    source_path: platforms/mac/webchat.md
    workflow: 16
---

La app de la barra de menús de macOS incrusta la interfaz de usuario de WebChat como una vista nativa de SwiftUI. Se conecta al Gateway y usa de forma predeterminada la sesión principal del agente seleccionado (`main`, o `global` cuando `session.scope` es `global`), con un selector de sesiones para otras sesiones.

- **Modo local**: se conecta directamente al WebSocket del Gateway local.
- **Modo remoto**: reenvía el puerto de control del Gateway por SSH y usa ese túnel como plano de datos.

## Inicio y depuración

- Manual: menú Lobster -> "Abrir chat".
- Apertura automática para pruebas:

  ```bash
  dist/OpenClaw.app/Contents/MacOS/OpenClaw --chat
  ```

  (`--webchat` se acepta como alias heredado.)

- Registros: `./scripts/clawlog.sh` (subsistema `ai.openclaw`, categoría `WebChatSwiftUI`).

## Cómo está conectado

- Plano de datos: métodos WS del Gateway `chat.history`, `chat.send`, `chat.abort`, `chat.inject`, y eventos `chat`, `agent`, `presence`, `tick`, `health`.
- `chat.history` devuelve una transcripción normalizada para visualización: las etiquetas de directivas en línea se eliminan del texto visible, las cargas XML de llamadas a herramientas en texto plano (`<tool_call>`, `<function_call>`, `<tool_calls>`, `<function_calls>`, incluidos bloques truncados) y los tokens de control de modelo filtrados se eliminan, las filas de asistente compuestas solo por tokens silenciosos, como `NO_REPLY`/`no_reply` exactos, se omiten, y las filas demasiado grandes pueden reemplazarse por un marcador de posición truncado.
- Sesión: usa de forma predeterminada la sesión principal como se indicó antes; la interfaz de usuario puede alternar entre sesiones.
- La incorporación usa una sesión dedicada para mantener separada la configuración del primer inicio.
- Caché sin conexión: la app mantiene una pequeña caché de solo lectura de sesiones de chat recientes y transcripciones por Gateway (`~/Library/Application Support/OpenClaw/chat-cache.sqlite`): las aperturas en frío muestran de inmediato la última transcripción conocida y se actualizan cuando el Gateway responde, y los chats recientes siguen estando disponibles para navegar mientras no hay conexión (el envío permanece deshabilitado hasta que se restablece la conexión).

## Superficie de seguridad

- El modo remoto reenvía solo el puerto de control WebSocket del Gateway por SSH.

## Limitaciones conocidas

- La interfaz de usuario está optimizada para sesiones de chat, no para un entorno aislado completo de navegador.

## Relacionado

- [WebChat](/es/web/webchat)
- [app de macOS](/es/platforms/macos)

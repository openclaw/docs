---
read_when:
    - Depuración de la vista WebChat en Mac o del puerto local loopback
summary: Cómo la app de Mac integra el WebChat del Gateway y cómo depurarlo
title: WebChat (macOS)
x-i18n:
    generated_at: "2026-07-05T11:27:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 24fe8b868fa2a7e2205bd13d32332bae903d3050073ea93f798649ccbaa478f9
    source_path: platforms/mac/webchat.md
    workflow: 16
---

La app de la barra de menús de macOS integra la UI de WebChat como una vista nativa de SwiftUI. Se conecta al Gateway y usa de forma predeterminada la sesión principal del agente seleccionado (`main`, o `global` cuando `session.scope` es `global`), con un selector de sesiones para otras sesiones.

- **Modo local**: se conecta directamente al WebSocket del Gateway local.
- **Modo remoto**: reenvía el puerto de control del Gateway por SSH y usa ese túnel como plano de datos.

## Inicio y depuración

- Manual: menú de Lobster -> "Abrir chat".
- Apertura automática para pruebas:

  ```bash
  dist/OpenClaw.app/Contents/MacOS/OpenClaw --chat
  ```

  (`--webchat` se acepta como alias heredado.)

- Registros: `./scripts/clawlog.sh` (subsistema `ai.openclaw`, categoría `WebChatSwiftUI`).

## Cómo está conectado

- Plano de datos: métodos WS del Gateway `chat.history`, `chat.send`, `chat.abort`, `chat.inject` y eventos `chat`, `agent`, `presence`, `tick`, `health`.
- `chat.history` devuelve una transcripción normalizada para visualización: las etiquetas de directivas en línea se eliminan del texto visible, las cargas XML de llamadas a herramientas en texto plano (`<tool_call>`, `<function_call>`, `<tool_calls>`, `<function_calls>`, incluidos bloques truncados) y los tokens de control del modelo filtrados se eliminan, las filas del asistente con tokens silenciosos puros, como `NO_REPLY`/`no_reply` exactos, se omiten, y las filas demasiado grandes pueden reemplazarse por un marcador de posición truncado.
- Sesión: usa de forma predeterminada la sesión principal como se indicó arriba; la UI puede cambiar entre sesiones.
- La incorporación usa una sesión dedicada para mantener separada la configuración inicial.

## Superficie de seguridad

- El modo remoto reenvía solo el puerto de control WebSocket del Gateway por SSH.

## Limitaciones conocidas

- La UI está optimizada para sesiones de chat, no para un entorno aislado de navegador completo.

## Relacionado

- [WebChat](/es/web/webchat)
- [app para macOS](/es/platforms/macos)

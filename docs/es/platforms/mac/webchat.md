---
read_when:
    - Depurando la vista de WebChat de mac o el puerto de loopback
summary: Cómo la app de mac integra el WebChat del gateway y cómo depurarlo
title: WebChat (macOS)
x-i18n:
    generated_at: "2026-04-24T05:39:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: c3e291a4b2a28e1016a9187f952b18ca4ea70660aa081564eeb27637cd8e8ae2
    source_path: platforms/mac/webchat.md
    workflow: 15
---

La app de barra de menús de macOS integra la UI de WebChat como una vista nativa de SwiftUI. Se
conecta al Gateway y usa por defecto la **sesión principal** del agente seleccionado
(con un selector de sesiones para otras sesiones).

- **Modo local**: se conecta directamente al WebSocket local del Gateway.
- **Modo remoto**: reenvía el puerto de control del Gateway por SSH y usa ese
  túnel como plano de datos.

## Inicio y depuración

- Manual: menú de Lobster → “Open Chat”.
- Apertura automática para pruebas:

  ```bash
  dist/OpenClaw.app/Contents/MacOS/OpenClaw --webchat
  ```

- Registros: `./scripts/clawlog.sh` (subsystem `ai.openclaw`, category `WebChatSwiftUI`).

## Cómo está conectado

- Plano de datos: métodos WS de Gateway `chat.history`, `chat.send`, `chat.abort`,
  `chat.inject` y eventos `chat`, `agent`, `presence`, `tick`, `health`.
- `chat.history` devuelve filas de transcripción normalizadas para visualización: las etiquetas de directivas en línea se eliminan del texto visible, las cargas XML de llamadas a herramientas en texto plano
  (incluidos `<tool_call>...</tool_call>`,
  `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
  `<function_calls>...</function_calls>` y bloques truncados de llamadas a herramientas) y
  los tokens de control de modelo filtrados ASCII/de ancho completo se eliminan, las filas puras del asistente con token silencioso como `NO_REPLY` / `no_reply`
  exactos se omiten y las filas sobredimensionadas pueden sustituirse por marcadores de posición.
- Sesión: por defecto usa la sesión principal (`main`, o `global` cuando el alcance es
  global). La UI puede cambiar entre sesiones.
- La incorporación usa una sesión dedicada para mantener separada la configuración de primera ejecución.

## Superficie de seguridad

- El modo remoto reenvía solo el puerto de control WebSocket del Gateway por SSH.

## Limitaciones conocidas

- La UI está optimizada para sesiones de chat (no es un sandbox de navegador completo).

## Relacionado

- [WebChat](/es/web/webchat)
- [App de macOS](/es/platforms/macos)

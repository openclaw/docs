---
read_when:
    - Depuración de la vista WebChat de mac o del puerto de loopback
summary: Cómo la app de Mac integra el WebChat del Gateway y cómo depurarlo
title: WebChat (macOS)
x-i18n:
    generated_at: "2026-05-06T05:42:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: b53eda688ff8786da4a4a615927a640090a1ecc71af8c08469c3a3c98a32af41
    source_path: platforms/mac/webchat.md
    workflow: 16
---

La app de la barra de menús de macOS incrusta la IU de WebChat como una vista nativa de SwiftUI. Se
conecta al Gateway y usa de forma predeterminada la **sesión principal** del agente
seleccionado (con un selector de sesiones para otras sesiones).

- **Modo local**: se conecta directamente al WebSocket del Gateway local.
- **Modo remoto**: reenvía el puerto de control del Gateway mediante SSH y usa ese
  túnel como plano de datos.

## Inicio y depuración

- Manual: menú de Lobster → “Abrir chat”.
- Apertura automática para pruebas:

  ```bash
  dist/OpenClaw.app/Contents/MacOS/OpenClaw --webchat
  ```

- Registros: `./scripts/clawlog.sh` (subsistema `ai.openclaw`, categoría `WebChatSwiftUI`).

## Cómo está conectado

- Plano de datos: métodos WS del Gateway `chat.history`, `chat.send`, `chat.abort`,
  `chat.inject` y eventos `chat`, `agent`, `presence`, `tick`, `health`.
- `chat.history` devuelve filas de transcripción normalizadas para visualización: las etiquetas
  de directivas en línea se eliminan del texto visible, las cargas XML de llamadas a herramientas
  en texto sin formato (incluidos `<tool_call>...</tool_call>`,
  `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
  `<function_calls>...</function_calls>` y bloques truncados de llamadas a herramientas) y
  los tokens de control del modelo ASCII/de ancho completo filtrados se eliminan, las filas de
  asistente compuestas solo por tokens silenciosos, como `NO_REPLY` / `no_reply` exactos, se
  omiten, y las filas sobredimensionadas pueden reemplazarse por marcadores de posición.
- Sesión: usa de forma predeterminada la sesión primaria (`main`, o `global` cuando el alcance es
  global). La IU puede cambiar entre sesiones.
- La incorporación usa una sesión dedicada para mantener la configuración de primer inicio separada.

## Superficie de seguridad

- El modo remoto reenvía únicamente el puerto de control WebSocket del Gateway mediante SSH.

## Limitaciones conocidas

- La IU está optimizada para sesiones de chat (no es un sandbox de navegador completo).

## Relacionado

- [WebChat](/es/web/webchat)
- [app de macOS](/es/platforms/macos)

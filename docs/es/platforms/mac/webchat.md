---
read_when:
    - Depuración de la vista WebChat de mac o del puerto de loopback
summary: Cómo la aplicación para Mac incrusta el WebChat de Gateway y cómo depurarlo
title: Chat web (macOS)
x-i18n:
    generated_at: "2026-05-06T09:05:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 50680e099181421505e25cecab2ba331fdaf9839d07fef482ff04976b0fc583e
    source_path: platforms/mac/webchat.md
    workflow: 16
    postprocess_version: locale-links-v1
---

El app de la barra de menú de macOS integra la UI WebChat como una vista nativa de SwiftUI. Se
conecta al Gateway y usa de forma predeterminada la **sesión principal** del
agente seleccionado (con un selector de sesiones para otras sesiones).

- **Modo local**: se conecta directamente al WebSocket del Gateway local.
- **Modo remoto**: reenvía el puerto de control del Gateway por SSH y usa ese
  túnel como plano de datos.

## Inicio y depuración

- Manual: menú Lobster → "Abrir chat".
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
  los tokens de control de modelo filtrados en ASCII/ancho completo se eliminan, las filas de
  asistente con solo tokens silenciosos, como los `NO_REPLY` / `no_reply` exactos, se
  omiten, y las filas sobredimensionadas pueden reemplazarse por marcadores de posición.
- Sesión: usa de forma predeterminada la sesión primaria (`main`, o `global` cuando el alcance es
  global). La UI puede cambiar entre sesiones.
- La incorporación usa una sesión dedicada para mantener separada la configuración inicial.

## Superficie de seguridad

- El modo remoto reenvía solo el puerto de control WebSocket del Gateway por SSH.

## Limitaciones conocidas

- La UI está optimizada para sesiones de chat (no es un entorno aislado completo de navegador).

## Relacionado

- [WebChat](/es/web/webchat)
- [app de macOS](/es/platforms/macos)

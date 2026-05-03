---
read_when:
    - Depurar o configurar el acceso a WebChat
summary: Host estático de WebChat en bucle local y uso de WS del Gateway para la interfaz de chat
title: Chat web
x-i18n:
    generated_at: "2026-05-03T05:32:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 48024e58259901c6feb67168c5c1ce32f46b8ad9b6f4511e56d2000478a3ed60
    source_path: web/webchat.md
    workflow: 16
---

Estado: la UI de chat SwiftUI de macOS/iOS se comunica directamente con el WebSocket del Gateway.

## Qué es

- Una UI de chat nativa para el Gateway (sin navegador incrustado y sin servidor estático local).
- Usa las mismas sesiones y reglas de enrutamiento que otros canales.
- Enrutamiento determinista: las respuestas siempre vuelven a WebChat.

## Inicio rápido

1. Inicia el Gateway.
2. Abre la UI de WebChat (app de macOS/iOS) o la pestaña de chat de la UI de Control.
3. Asegúrate de que haya configurada una ruta de autenticación válida del Gateway (secreto compartido de forma predeterminada,
   incluso en loopback).

## Cómo funciona (comportamiento)

- La UI se conecta al WebSocket del Gateway y usa `chat.history`, `chat.send` y `chat.inject`.
- `chat.history` está acotado para mayor estabilidad: el Gateway puede truncar campos de texto largos, omitir metadatos pesados y reemplazar entradas demasiado grandes por `[chat.history omitted: message too large]`.
- `chat.history` sigue la rama activa de la transcripción para los archivos de sesión modernos de solo anexado, por lo que las ramas de reescritura abandonadas y las copias de prompts reemplazadas no se renderizan en WebChat.
- Las entradas de Compaction se renderizan como un divisor explícito de historial compactado. El divisor explica que los turnos anteriores se conservan en un punto de control y enlaza a los controles de puntos de control de Sesiones, donde los operadores pueden crear ramas o restaurar la vista anterior a la Compaction cuando sus permisos lo permiten.
- La UI de Control recuerda el `sessionId` del Gateway subyacente devuelto por `chat.history` y lo incluye en las llamadas de seguimiento a `chat.send`, por lo que las reconexiones y las actualizaciones de página continúan la misma conversación almacenada salvo que el usuario inicie o restablezca una sesión.
- La UI de Control fusiona envíos duplicados en curso para la misma sesión, mensaje y adjuntos antes de generar un nuevo id de ejecución de `chat.send`; el Gateway sigue deduplicando las solicitudes repetidas que reutilizan la misma clave de idempotencia.
- `chat.history` también se normaliza para visualización: el contexto de OpenClaw solo de tiempo de ejecución,
  los envoltorios de sobre entrante, las etiquetas de directivas de entrega en línea
  como `[[reply_to_*]]` y `[[audio_as_voice]]`, las cargas XML de llamadas a herramientas en texto plano
  (incluidos `<tool_call>...</tool_call>`,
  `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
  `<function_calls>...</function_calls>` y bloques de llamadas a herramientas truncados), y
  los tokens de control de modelo ASCII/ancho completo filtrados se eliminan del texto visible,
  y se omiten las entradas del asistente cuyo texto visible completo es solo el token silencioso exacto
  `NO_REPLY` / `no_reply`.
- Las cargas de respuesta marcadas como razonamiento (`isReasoning: true`) se excluyen del contenido del asistente de WebChat, del texto de reproducción de la transcripción y de los bloques de contenido de audio, por lo que las cargas solo de pensamiento no aparecen como mensajes visibles del asistente ni como audio reproducible.
- `chat.inject` anexa una nota del asistente directamente a la transcripción y la transmite a la UI (sin ejecución de agente).
- Las ejecuciones abortadas pueden mantener visible la salida parcial del asistente en la UI.
- El Gateway conserva el texto parcial abortado del asistente en el historial de transcripción cuando existe salida almacenada en búfer, y marca esas entradas con metadatos de aborto.
- El historial siempre se obtiene desde el Gateway (sin observación de archivos locales).
- Si no se puede acceder al Gateway, WebChat es de solo lectura.

## Panel de herramientas de agentes de la UI de Control

- El panel Herramientas de `/agents` de la UI de Control tiene dos vistas separadas:
  - **Disponible ahora mismo** usa `tools.effective(sessionKey=...)` y muestra lo que la sesión actual
    realmente puede usar en tiempo de ejecución, incluidas herramientas del núcleo, de Plugin y propiedad del canal.
  - **Configuración de herramientas** usa `tools.catalog` y se mantiene centrada en perfiles, anulaciones y
    semántica del catálogo.
- La disponibilidad en tiempo de ejecución tiene alcance de sesión. Cambiar de sesión en el mismo agente puede cambiar la lista
  **Disponible ahora mismo**.
- El editor de configuración no implica disponibilidad en tiempo de ejecución; el acceso efectivo sigue respetando la precedencia de políticas
  (`allow`/`deny`, anulaciones por agente y por proveedor/canal).

## Uso remoto

- El modo remoto tuneliza el WebSocket del Gateway por SSH/Tailscale.
- No necesitas ejecutar un servidor WebChat independiente.

## Referencia de configuración (WebChat)

Configuración completa: [Configuración](/es/gateway/configuration)

Opciones de WebChat:

- `gateway.webchat.chatHistoryMaxChars`: recuento máximo de caracteres para campos de texto en respuestas de `chat.history`. Cuando una entrada de transcripción supera este límite, el Gateway trunca los campos de texto largos y puede reemplazar los mensajes demasiado grandes por un marcador de posición. El cliente también puede enviar `maxChars` por solicitud para anular este valor predeterminado en una sola llamada a `chat.history`.

Opciones globales relacionadas:

- `gateway.port`, `gateway.bind`: host/puerto de WebSocket.
- `gateway.auth.mode`, `gateway.auth.token`, `gateway.auth.password`:
  autenticación WebSocket con secreto compartido.
- `gateway.auth.allowTailscale`: la pestaña de chat de la UI de Control en el navegador puede usar encabezados de identidad de Tailscale
  Serve cuando está habilitado.
- `gateway.auth.mode: "trusted-proxy"`: autenticación de proxy inverso para clientes de navegador detrás de una fuente de proxy **no-loopback** consciente de identidad (consulta [Autenticación de proxy de confianza](/es/gateway/trusted-proxy-auth)).
- `gateway.remote.url`, `gateway.remote.token`, `gateway.remote.password`: destino del Gateway remoto.
- `session.*`: almacenamiento de sesión y valores predeterminados de la clave principal.

## Relacionado

- [UI de Control](/es/web/control-ui)
- [Panel](/es/web/dashboard)

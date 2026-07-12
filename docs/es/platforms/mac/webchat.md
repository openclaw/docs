---
read_when:
    - Depuración de la vista de WebChat en Mac o del puerto de bucle invertido
summary: Cómo la app para Mac integra el WebChat del Gateway y cómo depurarlo
title: WebChat (macOS)
x-i18n:
    generated_at: "2026-07-12T14:36:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 7139ada530e4d5c3833500c36364d742dff301608a8a1a7902003b5f5384512c
    source_path: platforms/mac/webchat.md
    workflow: 16
---

La aplicación de la barra de menús de macOS integra la interfaz de WebChat como una vista nativa de SwiftUI. Se conecta al Gateway y utiliza de forma predeterminada la sesión principal del agente seleccionado (`main`, o `global` cuando `session.scope` es `global`).

La ventana de chat completa es una vista dividida nativa:

- **Barra lateral de sesiones**: lista de sesiones con búsqueda, secciones de sesiones fijadas y recientes, indicadores de mensajes no leídos y menús contextuales para fijar o desfijar, copiar la clave de sesión y eliminar. Un botón de la barra de herramientas (o Cmd-N) crea una sesión nueva real mediante `sessions.create`.
- **Barra de herramientas de la ventana**: indicador circular de uso del contexto (tokens y coste de la sesión, con una acción compacta), selector del nivel de razonamiento, selector de modelo y menú de acciones de la sesión (nueva sesión, actualizar, copiar la clave de sesión, exportar la transcripción, compactar y borrar el historial).
- **Transcripción y editor de mensajes**: los mensajes del asistente se muestran como texto sin formato con un avatar y los mensajes del usuario como burbujas con el color de énfasis. Al escribir `/`, se abre el autocompletado de comandos con barra diagonal proporcionado por `commands.list`, con navegación mediante las teclas de flecha, Tab, Return y Escape. Haga clic con el botón derecho en un mensaje para copiarlo.

El panel de chat rápido anclado a la barra de menús mantiene el diseño compacto de una sola columna con selectores integrados.

- **Modo local**: se conecta directamente al WebSocket del Gateway local.
- **Modo remoto**: reenvía el puerto de control del Gateway a través de SSH y utiliza ese túnel como plano de datos.

## Inicio y depuración

- Manual: menú Lobster -> "Open Chat".
- Apertura automática para pruebas:

  ```bash
  dist/OpenClaw.app/Contents/MacOS/OpenClaw --chat
  ```

  (`--webchat` se acepta como alias heredado).

- Registros: `./scripts/clawlog.sh` (subsistema `ai.openclaw`, categoría `WebChatSwiftUI`).

## Cómo está conectado

- Plano de datos: métodos WS del Gateway `chat.history`, `chat.send`, `chat.abort`, `chat.inject` y eventos `chat`, `agent`, `presence`, `tick`, `health`.
- `chat.history` devuelve una transcripción normalizada para su visualización: las etiquetas de directivas integradas se eliminan del texto visible; se eliminan las cargas XML de llamadas a herramientas en texto sin formato (`<tool_call>`, `<function_call>`, `<tool_calls>`, `<function_calls>`, incluidos los bloques truncados) y los tokens de control del modelo filtrados; se omiten las filas del asistente que solo contienen tokens silenciosos, como los valores exactos `NO_REPLY`/`no_reply`; y las filas demasiado grandes pueden sustituirse por un marcador de posición truncado.
- Sesión: utiliza de forma predeterminada la sesión principal indicada anteriormente; la interfaz puede cambiar entre sesiones.
- La incorporación utiliza una sesión específica para mantener separada la configuración de la primera ejecución.
- Caché sin conexión: la aplicación mantiene una pequeña caché de solo lectura de las sesiones de chat y transcripciones recientes de cada Gateway (`~/Library/Application Support/OpenClaw/chat-cache.sqlite`): al abrirse en frío, muestra inmediatamente la última transcripción conocida y se actualiza cuando responde el Gateway; además, los chats recientes siguen disponibles para consulta mientras no hay conexión (el envío permanece deshabilitado hasta que se restablece la conexión).

## Superficie de seguridad

- El modo remoto reenvía únicamente el puerto de control WebSocket del Gateway a través de SSH.

## Limitaciones conocidas

- La interfaz está optimizada para sesiones de chat, no como entorno aislado completo de navegador.

## Contenido relacionado

- [WebChat](/es/web/webchat)
- [Aplicación para macOS](/es/platforms/macos)

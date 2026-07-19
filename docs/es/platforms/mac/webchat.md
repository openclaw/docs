---
read_when:
    - Depuración de la vista de WebChat para Mac o del puerto de bucle invertido
summary: Cómo la aplicación para Mac integra el WebChat del Gateway y cómo depurarlo
title: WebChat (macOS)
x-i18n:
    generated_at: "2026-07-19T01:59:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8a403f5083ccac3d810dc6e103183a6ab73de3fab20abe74a2f7d7e94aed2c25
    source_path: platforms/mac/webchat.md
    workflow: 16
---

La aplicación de la barra de menús de macOS integra la interfaz de WebChat como una vista nativa de SwiftUI. Se conecta al Gateway y usa de forma predeterminada la sesión principal del agente seleccionado (`main`, o `global` cuando `session.scope` es `global`).

La ventana de chat completa es una vista dividida nativa:

- **Barra lateral de sesiones**: lista de sesiones con búsqueda y secciones de sesiones fijadas, grupos respaldados por el Gateway y sesiones recientes. Las sesiones secundarias generadas se anidan bajo su sesión principal dentro de cada sección; las sesiones principales contraídas resumen los descendientes en ejecución, con errores y no leídos. Los menús contextuales permiten consultar la información de la sesión, cambiarle el nombre, fijarla, bifurcarla, marcarla como leída o no leída, archivarla o restaurarla, copiar la clave de sesión y eliminarla. La acción principal de nueva sesión (o Cmd-N) la crea inmediatamente mediante `sessions.create`; su menú emergente de opciones adyacente permite seleccionar un agente y solicitar un árbol de trabajo administrado con una referencia base opcional.
- **Barra de herramientas de la ventana**: anillo de uso del contexto (tokens y coste de la sesión, con una acción compacta), controles del modelo y un menú de acciones de la sesión. Los modelos se agrupan por proveedor, con el proveedor predeterminado en primer lugar, mientras que los modelos fijados y recientes permanecen en la parte superior. Los controles pueden heredar o sustituir el nivel de razonamiento del modelo, elegir el nivel de detalle de las llamadas a herramientas y activar o desactivar las respuestas rápidas. El menú permite cambiar el nombre de la sesión actual o bifurcarla, así como actualizar su estado de fijación, lectura o archivo. **Sesiones…** (Shift-Cmd-S) abre el administrador de sesiones activas y archivadas para buscar en el Gateway, gestionar grupos, inspeccionar sesiones, cambiarles el nombre, fijarlas, archivarlas y restaurarlas. El modo de selección permite fijar, dejar de fijar, archivar o eliminar varias sesiones activas, manteniendo visibles los errores individuales. Marcas de verificación independientes en el menú muestran u ocultan el razonamiento del asistente y la actividad de las herramientas; ambos se muestran de forma predeterminada y la configuración se conserva entre ejecuciones.
- **Transcripción y cuadro de redacción**: los mensajes del asistente se muestran como texto sin formato con un avatar, y los mensajes del usuario como burbujas con el color de énfasis. Las preguntas pendientes del agente se muestran como tarjetas nativas con opciones de selección única o múltiple, respuestas de texto libre **Otro**, cuentas atrás de caducidad y un estado terminal compartido. Los chats vacíos ofrecen indicaciones iniciales para el escritorio. Al escribir `/`, se abre el autocompletado de comandos con barra diagonal respaldado por `commands.list`, con navegación mediante las teclas de flecha, Tab, Return y Escape. Haga clic con el botón derecho en un mensaje para copiar su Markdown visible sin el razonamiento oculto. Los mensajes truncados del asistente también ofrecen **Abrir mensaje completo**, que carga un lector de Markdown con texto seleccionable. Use **Escuchar** para la TTS del Gateway, con síntesis de voz local como alternativa.
- **Controles de voz**: el cuadro de redacción permite iniciar o detener el modo de conversación existente de macOS sin sustituir su superposición de la barra de menús. Mientras el modo de conversación está activo, el cuadro de redacción muestra su estado de escucha, razonamiento o habla, la actividad de audio en directo y una transcripción continua ampliable. Haga clic con el botón derecho en el botón de conversación para elegir **System Default** o un micrófono conectado; es la misma selección de micrófono que usan la activación por voz y la función pulsar para hablar. Si se desconecta un micrófono seleccionado, la sesión de conversación activa recurre al valor predeterminado del sistema e intenta usar de nuevo la selección la próxima vez que se inicia el modo de conversación. Una acción de micrófono independiente graba una nota de voz cuando el modo de conversación no controla la captura de audio.

El panel de chat compacto anclado a la barra de menús conserva el diseño compacto de una sola columna, con los mismos controles de modelo, razonamiento, nivel de detalle y rapidez integrados, además de indicaciones iniciales, modo de conversación, notas de voz y la opción Escuchar. El razonamiento del asistente y la actividad de las herramientas permanecen ocultos en esta superficie compacta.

## Barra de chat rápido

Pulse Option-Space (⌥Space) o seleccione **Chat rápido** en el menú de la barra de menús para abrir un cuadro de redacción flotante para la sesión principal. Cambie el atajo global con el grabador de **Configuración → General → Atajo de Chat rápido**.

Chat rápido muestra el agente de destino (su avatar o emoji, con el nombre del agente como marcador de posición) y envía los mensajes a la sesión principal de ese agente. Después de que Return acepte un envío, la barra permanece abierta y se expande hacia abajo con la respuesta de Markdown transmitida y la transcripción reciente. El campo de entrada de la barra sigue siendo el cuadro de redacción. Pulse Command-Return para enviar y abrir el mismo destino en la ventana de chat completa, Shift-Return para insertar una nueva línea o Escape para cerrar toda la barra y el área de respuesta. Hacer clic fuera también la cierra. Cuando faltan permisos pertinentes de macOS, una franja adjunta ofrece las acciones **Conceder** y **Ahora no**.

Use el botón del micrófono para dictar en el cuadro de redacción. Los resultados parciales de voz sustituyen en directo el fragmento dictado y conservan el texto que ya estaba en el cuadro de redacción. Pulse de nuevo el botón, Return o Escape para detener el dictado; enviar, ocultar o quitar el foco de Chat rápido también libera el micrófono. La primera vez que se usa, solicita acceso al micrófono y al reconocimiento de voz de macOS.

El control compacto del modelo muestra el modelo y el nivel de razonamiento actuales de la sesión de destino. La elección de un modelo actualiza esa sesión y, por tanto, persiste en ella, mientras que la elección del razonamiento se aplica únicamente a cada mensaje enviado desde la presentación actual de Chat rápido. Las elecciones locales se restablecen cuando se oculta la barra. Al cambiar de agente o elegir una sesión reciente, se conservan las elecciones explícitas, pero se vuelve a cargar el estado subyacente del modelo de la nueva sesión de destino.

Haga clic en el botón del historial para elegir entre las cinco sesiones actualizadas más recientemente o volver a **Nuevo mensaje para &lt;agent&gt;**. Al seleccionar una sesión reciente, los mensajes se envían a esa sesión exacta y el marcador de posición cambia a **Responder en &lt;session&gt;**. Al ocultar Chat rápido, este destino temporal se restablece a la sesión principal del agente seleccionado; cambiar de agente desde el menú del avatar también lo borra.

Command-Return abre la conversación del agente que recibió el envío, incluso cuando el ámbito de la sesión es global.

El botón de la cámara abre un menú con **Capturar ventana…** o **Capturar área…**. La captura de ventana etiqueta todas las ventanas visibles; la captura de área oscurece cada pantalla mientras se arrastra una región y muestra su tamaño en directo. La captura de pantalla seleccionada se envía al agente elegido, con cualquier texto escrito como pie. La primera vez que se usa, solicita acceso a la grabación de pantalla de macOS. Escape, hacer clic en un espacio vacío o hacer clic sin arrastrar un área significativa cancela la operación.

Use el botón de texto del documento para adjuntar texto desde la ventana enfocada de la aplicación enfocada. Chat rápido muestra el resultado como una ficha de contexto que se puede quitar, en lugar de colocar el texto capturado en el cuadro de redacción; al enviar, se añade el texto de la ficha al mensaje saliente y después se borra. Esto requiere el permiso de accesibilidad de macOS. El texto adjunto también se borra cuando se cierra Chat rápido, por lo que el contexto de una presentación no puede filtrarse a un envío posterior.

Cuando finalice una respuesta, seleccione **Pegar en &lt;app&gt;** para copiar el texto visible del asistente, sin incluir el razonamiento oculto, al portapapeles general y pegarlo en la aplicación que estaba en primer plano. Esto requiere el permiso de accesibilidad de macOS. La acción sustituye el contenido actual del portapapeles y después oculta Chat rápido.

Desactive por completo la función en **Configuración → General → Chat rápido**; la misma sección contiene el grabador de atajos.

- **Modo local**: se conecta directamente al WebSocket del Gateway local.
- **Modo remoto**: reenvía el puerto de control del Gateway mediante SSH y usa ese túnel como plano de datos.

## Inicio y depuración

- Manual: menú de Lobster -> "Abrir chat".
- Apertura automática para pruebas:

  ```bash
  dist/OpenClaw.app/Contents/MacOS/OpenClaw --chat
  ```

  (`--webchat` se acepta como alias heredado).

- Registros: `./scripts/clawlog.sh` (subsistema `ai.openclaw`, categoría `WebChatSwiftUI`).

## Cómo está conectado

- Plano de datos: métodos WS del Gateway `chat.history`, `chat.message.get`, `chat.send`, `chat.abort`, `chat.inject`, además de `question.list` y `question.resolve`, y eventos `chat`, `agent`, `presence`, `tick`, `health`; las tarjetas de preguntas siguen los eventos `question.requested` y `question.resolved`, y se actualizan desde `question.list` después de las reconexiones.
- `chat.history` devuelve una transcripción normalizada para su visualización: se eliminan las etiquetas de directivas integradas del texto visible, se eliminan las cargas útiles XML de llamadas a herramientas en texto sin formato (`<tool_call>`, `<function_call>`, `<tool_calls>`, `<function_calls>`, incluidos los bloques truncados) y los tokens de control del modelo filtrados, se omiten las filas del asistente que contienen únicamente tokens silenciosos, como `NO_REPLY`/`no_reply` exactos, y las filas demasiado grandes pueden sustituirse por un marcador de posición truncado.
- Sesión: usa de forma predeterminada la sesión principal indicada anteriormente; la interfaz de usuario puede cambiar entre sesiones.
- Grupos de sesiones: `sessions.groups.list`, `sessions.groups.put`, `sessions.groups.rename` y `sessions.groups.delete` son responsables del catálogo de grupos. La pertenencia corresponde al `category` de la sesión, actualizado mediante `sessions.patch`.
- Estado no leído: después de que se activa una sesión y su historial en directo se carga correctamente, la aplicación borra el marcador de no leído de esa sesión. Las cargas fallidas del historial no lo borran; si falla temporalmente la aplicación del parche, se vuelve a intentar en la siguiente activación.
- La incorporación usa una sesión dedicada para mantener separada la configuración de la primera ejecución.
- Caché sin conexión: la aplicación conserva una pequeña caché de solo lectura de las sesiones de chat y transcripciones recientes por Gateway (`~/Library/Application Support/OpenClaw/chat-cache.sqlite`): al abrirse en frío, muestra inmediatamente la última transcripción conocida y la actualiza cuando responde el Gateway; además, los chats recientes permanecen disponibles para consulta mientras no haya conexión (el envío permanece desactivado hasta que se restablezca la conexión).

## Superficie de seguridad

- El modo remoto reenvía únicamente el puerto de control WebSocket del Gateway mediante SSH.

## Limitaciones conocidas

- La interfaz de usuario está optimizada para sesiones de chat, no para un entorno aislado completo de navegador.

## Relacionado

- [WebChat](/es/web/webchat)
- [Aplicación para macOS](/es/platforms/macos)

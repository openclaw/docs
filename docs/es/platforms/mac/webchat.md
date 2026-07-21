---
read_when:
    - Depuración de la vista de WebChat en Mac o del puerto de bucle invertido
summary: Cómo la aplicación para Mac integra el WebChat del Gateway y cómo depurarlo
title: WebChat (macOS)
x-i18n:
    generated_at: "2026-07-21T09:02:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 222b2ffe3951a499b3d20e2219ac5bf6ec7b3ea894d64d251cbffd909a25f387
    source_path: platforms/mac/webchat.md
    workflow: 16
---

La aplicación de la barra de menús de macOS integra la interfaz de WebChat como una vista nativa de SwiftUI. Se conecta al Gateway y usa de forma predeterminada la sesión principal del agente seleccionado (`main`, o `global` cuando `session.scope` es `global`).

La ventana de chat completa es una vista dividida nativa:

- **Barra lateral de sesiones**: lista de sesiones con búsqueda y secciones de sesiones fijadas, agrupadas mediante el Gateway y recientes. Las sesiones secundarias generadas se anidan bajo su sesión principal dentro de cada sección; las sesiones principales contraídas resumen los descendientes en ejecución, con errores y no leídos. Los menús contextuales permiten consultar información de la sesión, cambiarle el nombre, fijarla, bifurcarla, marcarla como leída o no leída, archivarla o restaurarla, copiar la clave de sesión y eliminarla. La acción principal de nueva sesión (o Mayús-Cmd-N) la crea inmediatamente mediante `sessions.create`; su ventana emergente de opciones adyacente permite seleccionar un agente y solicitar un árbol de trabajo administrado con una referencia base opcional.
- **Barra de herramientas de la ventana**: anillo de uso del contexto (tokens y coste de la sesión, con una acción compacta), controles del modelo y un menú de acciones de la sesión. Los modelos se agrupan por proveedor, con el proveedor predeterminado en primer lugar, mientras que los modelos fijados y recientes permanecen en la parte superior. Los controles pueden heredar o sustituir el nivel de razonamiento del modelo, elegir el nivel de detalle de las llamadas a herramientas y activar o desactivar las respuestas rápidas. El menú permite cambiar el nombre de la sesión actual o bifurcarla, así como actualizar su estado de fijación, lectura o archivo. **Sessions…** (Mayús-Cmd-S) abre el administrador de sesiones activas y archivadas para buscar en el Gateway, administrar grupos, inspeccionar sesiones, cambiarles el nombre, fijarlas, archivarlas y restaurarlas. El modo de selección permite fijar, desfijar, archivar o eliminar varias sesiones activas, manteniendo visibles los errores individuales. Las marcas de verificación independientes del menú muestran u ocultan el razonamiento del asistente y la actividad de las herramientas; ambos están activados de forma predeterminada y su estado se conserva entre ejecuciones.
- **Transcripción y redactor**: los mensajes del asistente se muestran como texto sin formato con un avatar, y los mensajes del usuario como burbujas con color de énfasis. Las preguntas pendientes del agente se muestran como tarjetas nativas con opciones de selección única o múltiple, respuestas de texto libre **Other**, cuentas regresivas de caducidad y estado terminal compartido. Los chats vacíos ofrecen indicaciones iniciales del escritorio. Al escribir `/`, se abre el autocompletado de comandos con barra diagonal proporcionado por `commands.list`, con navegación mediante las teclas de flecha, Tab, Retorno y Escape. Haga clic con el botón derecho en un mensaje para copiar su Markdown visible sin el razonamiento oculto. Los mensajes truncados del asistente también ofrecen **Open Full Message**, que carga un lector de Markdown con texto seleccionable. Use **Listen** para la conversión de texto a voz mediante el Gateway, con síntesis de voz local como alternativa.
- **Controles de voz**: el redactor puede iniciar o detener el modo de conversación existente de macOS sin sustituir su superposición de la barra de menús. Mientras el modo de conversación está activo, el redactor muestra su estado de escucha, razonamiento o habla, la actividad de audio en directo y una transcripción continua ampliable. Haga clic con el botón derecho en el botón Talk para elegir **System Default** o un micrófono conectado; esta es la misma selección de micrófono que utilizan la activación por voz y la función pulsar para hablar. Si se desconecta un micrófono seleccionado, la sesión de conversación activa recurre al micrófono predeterminado del sistema y vuelve a intentar usar la selección la próxima vez que se inicia el modo de conversación. Una acción de micrófono independiente graba una nota de voz cuando el modo de conversación no controla la captura de audio.

El panel de chat compacto anclado a la barra de menús conserva el diseño compacto de una sola columna, con los mismos controles integrados de modelo, razonamiento, nivel de detalle y respuestas rápidas, además de indicaciones iniciales, modo de conversación, notas de voz y Listen. El razonamiento del asistente y la actividad de las herramientas permanecen ocultos en esta superficie compacta.

## Varias ventanas del Gateway

Abra **Settings → Gateways** para añadir o eliminar perfiles reutilizables del Gateway. Cada
perfil contiene un punto de conexión `ws://` o `wss://` y su token o
contraseña opcionales; las credenciales se almacenan en el llavero de macOS. Al eliminar un perfil,
también se cierran sus ventanas abiertas y se termina su conexión secundaria.

Elija **File → New Gateway Window…** o pulse Cmd-N y, a continuación, seleccione uno de esos
perfiles guardados. El selector recuerda el perfil utilizado más recientemente. Cada
selección crea una nueva ventana independiente, por lo que el mismo Gateway puede aparecer en
varias ventanas con diferentes sesiones activas y estados de navegación.

Cada perfil guardado posee una conexión compartida al Gateway, un ámbito de autenticación del dispositivo,
una caché de transcripciones, una bandeja de salida sin conexión y concesiones de rutas. Las ventanas de ese perfil
reutilizan esos recursos, aunque permiten navegar por ellas de forma independiente. Las ventanas de
perfiles diferentes permanecen conectadas y ejecutan chats simultáneamente.

El Gateway configurado en la aplicación de la barra de menús sigue siendo el propietario de las
capacidades del Node de Mac y del modo de conversación. Las ventanas adicionales del Gateway son solo para operadores, por lo que un
segundo Gateway no puede redirigir silenciosamente el micrófono global ni los controles del dispositivo.
Listen/TTS y las acciones normales de chat utilizan la conexión al Gateway de la propia ventana.

## Barra de chat rápido

Pulse Opción-Espacio (⌥Espacio) o elija **Quick Chat** en el menú de la barra de menús para abrir un redactor flotante para la sesión principal. Cambie el atajo global con el grabador de **Settings → General → Quick Chat shortcut**.

El chat rápido muestra el agente de destino (avatar o emoji, con el nombre del agente como texto de marcador de posición) y envía el mensaje a la sesión principal de ese agente. Después de que Retorno confirme un envío, la barra permanece abierta y se expande hacia abajo con la respuesta de Markdown transmitida y la transcripción reciente. La entrada de la barra sigue siendo el redactor. Pulse Comando-Retorno para enviar y abrir el mismo destino en la ventana de chat completa, Mayús-Retorno para insertar una nueva línea o Escape para cerrar toda la barra y el área de respuesta. Al hacer clic fuera también se cierra. Cuando faltan permisos pertinentes de macOS, una franja adjunta ofrece las acciones **Grant** y **Not now**.

Use el botón del micrófono para dictar en el redactor. Los resultados parciales del habla sustituyen en directo el fragmento dictado, conservando el texto que ya estaba en el redactor. Pulse de nuevo el botón, Retorno o Escape para detenerlo; enviar, ocultar o quitar el foco del chat rápido también libera el micrófono. La primera vez se solicita acceso al micrófono y al reconocimiento de voz de macOS.

El control compacto del modelo muestra el modelo actual y el nivel de razonamiento de la sesión de destino. La elección de un modelo actualiza esa sesión y, por tanto, persiste en ella, mientras que la elección del razonamiento se aplica únicamente a cada mensaje enviado desde la presentación actual del chat rápido. Las opciones locales se restablecen cuando se oculta la barra. Al cambiar de agente o elegir una sesión reciente, se conservan las opciones explícitas, pero se vuelve a cargar el estado subyacente del modelo de la nueva sesión de destino.

Haga clic en el botón del historial para elegir entre las cinco sesiones actualizadas más recientemente o volver a **New message to &lt;agent&gt;**. Una selección reciente envía el mensaje a esa sesión exacta y cambia el marcador de posición a **Reply in &lt;session&gt;**. Al ocultar el chat rápido, este destino temporal se restablece a la sesión principal del agente seleccionado; al cambiar de agente desde el menú del avatar también se borra.

Comando-Retorno abre la conversación del agente que recibió el envío, incluso cuando el ámbito de la sesión es global.

El botón de la cámara abre un menú con **Capture Window…** o **Capture Area…**. La captura de ventanas etiqueta todas las ventanas visibles; la captura de áreas atenúa cada pantalla mientras se arrastra una región y muestra su tamaño en directo. La captura de pantalla seleccionada se envía al agente elegido, con cualquier texto escrito como pie. La primera vez se solicita acceso a la grabación de pantalla de macOS. Escape, hacer clic en un espacio vacío o hacer clic sin arrastrar un área significativa cancela la operación.

Use el botón de texto del documento para adjuntar texto de la ventana enfocada de la aplicación activa. El chat rápido muestra el resultado como una ficha de contexto que se puede eliminar, en lugar de colocar el texto capturado en el redactor; al enviar, se añade el texto de la ficha al mensaje saliente y, a continuación, se borra. Esto requiere el permiso de accesibilidad de macOS. El texto adjunto también se borra cada vez que se cierra el chat rápido, por lo que el contexto de una presentación no puede filtrarse a un envío posterior.

Después de que finalice una respuesta, elija **Paste to &lt;app&gt;** para copiar el texto visible del asistente, sin incluir el razonamiento oculto, al portapapeles general y pegarlo en la aplicación que estaba en primer plano. Esto requiere el permiso de accesibilidad de macOS. La acción sustituye el contenido actual del portapapeles y, a continuación, oculta el chat rápido.

Desactive por completo la función mediante **Settings → General → Quick Chat**; la misma sección contiene el grabador del atajo.

- **Modo local**: se conecta directamente al WebSocket del Gateway local.
- **Modo remoto**: reenvía el puerto de control del Gateway mediante SSH y utiliza ese túnel como plano de datos.

## Inicio y depuración

- Manual: menú de Lobster -> "Open Chat".
- Apertura automática para pruebas:

  ```bash
  dist/OpenClaw.app/Contents/MacOS/OpenClaw --chat
  ```

  (Se acepta `--webchat` como alias heredado.)

- Registros: `./scripts/clawlog.sh` (subsistema `ai.openclaw`, categoría `WebChatSwiftUI`).

## Cómo está conectado

- Plano de datos: métodos WS del Gateway `chat.history`, `chat.message.get`, `chat.send`, `chat.abort`, `chat.inject`, además de `question.list` y `question.resolve`, y los eventos `chat`, `agent`, `presence`, `tick`, `health`; las tarjetas de preguntas siguen los eventos `question.requested` y `question.resolved`, y se actualizan desde `question.list` después de las reconexiones.
- `chat.history` devuelve una transcripción normalizada para su visualización: las etiquetas de directivas integradas se eliminan del texto visible; se eliminan las cargas XML de llamadas a herramientas en texto sin formato (`<tool_call>`, `<function_call>`, `<tool_calls>`, `<function_calls>`, incluidos los bloques truncados) y los tokens de control del modelo filtrados; se omiten las filas del asistente formadas únicamente por tokens silenciosos, como los valores exactos `NO_REPLY`/`no_reply`; y las filas demasiado grandes pueden sustituirse por un marcador de posición truncado.
- Sesión: usa de forma predeterminada la sesión principal indicada anteriormente; la interfaz puede cambiar de una sesión a otra.
- Grupos de sesiones: `sessions.groups.list`, `sessions.groups.put`, `sessions.groups.rename` y `sessions.groups.delete` controlan el catálogo de grupos. La pertenencia corresponde al valor `category` de la sesión, actualizado mediante `sessions.patch`.
- Estado no leído: después de activar una sesión y cargar correctamente su historial en directo, la aplicación borra el marcador de no leído de esa sesión. Las cargas de historial fallidas no lo borran; un fallo transitorio al aplicar el parche vuelve a intentarse en la siguiente activación.
- La incorporación utiliza una sesión específica para mantener separada la configuración inicial.
- Caché sin conexión: la aplicación mantiene una pequeña caché de solo lectura de las sesiones y transcripciones de chat recientes por Gateway (`~/Library/Application Support/OpenClaw/chat-cache.sqlite`): al iniciarse desde cero, muestra inmediatamente la última transcripción conocida y la actualiza cuando responde el Gateway; además, los chats recientes pueden seguir consultándose sin conexión (el envío permanece desactivado hasta que se restablece la conexión).

## Superficie de seguridad

- El modo remoto reenvía únicamente el puerto de control WebSocket del Gateway mediante SSH.

## Limitaciones conocidas

- La interfaz está optimizada para sesiones de chat, no como un entorno aislado completo de navegador.

## Contenido relacionado

- [WebChat](/es/web/webchat)
- [Aplicación para macOS](/es/platforms/macos)

---
read_when:
    - Depuración de la vista de WebChat en Mac o del puerto de bucle invertido
summary: Cómo la aplicación para Mac integra el WebChat del Gateway y cómo depurarlo
title: WebChat (macOS)
x-i18n:
    generated_at: "2026-07-21T22:40:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 5a8c0c609ba681758841d3604dd61756ddf28cbd236d43410a36cf6a9ce48a42
    source_path: platforms/mac/webchat.md
    workflow: 16
---

La aplicación de la barra de menús de macOS integra la interfaz de WebChat como una vista nativa de SwiftUI. Se conecta al Gateway y usa de forma predeterminada la sesión principal del agente seleccionado (`main`, o `global` cuando `session.scope` es `global`).

La ventana de chat completa es una vista dividida nativa:

- **Barra lateral de sesiones**: lista de sesiones con búsqueda y secciones de sesiones fijadas, agrupadas y respaldadas por el Gateway, y recientes. Las sesiones secundarias generadas aparecen anidadas bajo su sesión principal dentro de cada sección; las sesiones principales contraídas resumen sus descendientes en ejecución, con errores y no leídos. Los menús contextuales permiten consultar información de la sesión, cambiarle el nombre, fijarla, bifurcarla, marcarla como leída o no leída, archivarla o restaurarla, copiar la clave de sesión y eliminarla. La acción principal de nueva sesión (o Mayús-Cmd-N) la crea inmediatamente mediante `sessions.create`; el menú emergente de opciones adyacente permite seleccionar un agente y solicitar un árbol de trabajo administrado con una referencia base opcional.
- **Barra de herramientas de la ventana**: anillo de uso del contexto (tokens y coste de la sesión, con una acción compacta), controles del modelo y un menú de acciones de sesión. Los modelos se agrupan por proveedor, con el proveedor predeterminado primero, mientras que los modelos fijados y recientes permanecen en la parte superior. Los controles permiten heredar o sustituir el nivel de razonamiento del modelo, elegir el nivel de detalle de las llamadas a herramientas y activar o desactivar las respuestas rápidas. El menú permite cambiar el nombre de la sesión actual o bifurcarla, así como actualizar su estado de fijación, lectura o archivo. **Sesiones…** (Mayús-Cmd-S) abre el administrador de sesiones activas y archivadas para buscar en el Gateway, administrar grupos, inspeccionar sesiones, cambiarles el nombre, fijarlas, archivarlas y restaurarlas. El modo de selección permite fijar, desfijar, archivar o eliminar varias sesiones activas, manteniendo visibles los errores individuales. Marcas de verificación independientes del menú muestran u ocultan el razonamiento del asistente y la actividad de las herramientas; ambas opciones están activadas de forma predeterminada y se recuerdan entre ejecuciones.
- **Transcripción y editor**: los mensajes del asistente se muestran como texto sin formato con un avatar, y los mensajes del usuario como burbujas con el color de énfasis. Las preguntas pendientes del agente se muestran como tarjetas nativas con opciones de selección única o múltiple, respuestas de texto libre **Otra**, cuentas atrás de caducidad y estado terminal compartido. Los chats vacíos ofrecen sugerencias iniciales de escritorio. Al escribir `/`, se abre el autocompletado de comandos con barra diagonal respaldado por `commands.list`, con navegación mediante las teclas de flecha, Tab, Retorno y Escape. Haga clic con el botón derecho en un mensaje para copiar su Markdown visible sin el razonamiento oculto. Los mensajes truncados del asistente también ofrecen **Abrir mensaje completo**, que carga un lector de Markdown con texto seleccionable. Use **Escuchar** para la conversión de texto a voz del Gateway con una alternativa de voz local.
- **Controles de voz**: el editor puede iniciar o detener el modo de conversación existente de macOS sin sustituir su superposición de la barra de menús. Mientras el modo de conversación está activo, el editor muestra su estado de escucha, razonamiento o habla, la actividad de audio en directo y una transcripción continua ampliable. Haga clic con el botón derecho en el botón de conversación para elegir **Valor predeterminado del sistema** o un micrófono conectado; se trata de la misma selección de micrófono que usan la activación por voz y la función pulsar para hablar. Si se desconecta un micrófono seleccionado, la sesión de conversación activa vuelve al valor predeterminado del sistema e intenta usar de nuevo la selección la próxima vez que se inicia el modo de conversación. Una acción de micrófono independiente graba una nota de voz cuando el modo de conversación no controla la captura de audio.

El panel de chat compacto anclado a la barra de menús conserva el diseño compacto de una sola columna, con los mismos controles integrados de modelo, razonamiento, nivel de detalle y respuestas rápidas, además de sugerencias iniciales, modo de conversación, notas de voz y Escuchar. El razonamiento del asistente y la actividad de las herramientas permanecen ocultos en esta superficie compacta.

## Varias ventanas del Gateway

Abra **Settings → Gateways** para añadir o eliminar perfiles reutilizables del Gateway. Cada
perfil contiene un punto de conexión `ws://` o `wss://` y su token o
contraseña opcionales; las credenciales se almacenan en el llavero de macOS. Al eliminar un perfil,
también se cierran sus ventanas abiertas y se apaga su conexión secundaria.

Elija **File → New Gateway Window…** o pulse Cmd-N y, a continuación, seleccione uno de esos
perfiles guardados. El selector recuerda el perfil usado más recientemente. Cada
selección crea una nueva ventana independiente, por lo que el mismo Gateway puede aparecer en
varias ventanas con diferentes sesiones activas y estados de navegación.

Cada perfil guardado posee una conexión compartida al Gateway, un ámbito de autenticación del dispositivo,
una caché de transcripciones, una bandeja de salida sin conexión y concesiones de rutas. Las ventanas de ese perfil
reutilizan esos recursos, pero permiten navegar de forma independiente. Las ventanas de
perfiles diferentes permanecen conectadas y ejecutan chats simultáneamente.

El Gateway configurado en la aplicación de la barra de menús sigue siendo el propietario de las
capacidades del Node de Mac y del modo de conversación. Las ventanas adicionales del Gateway son solo para operadores, por lo que un
segundo Gateway no puede redirigir silenciosamente los controles globales del micrófono o del dispositivo.
Escuchar/TTS y las acciones normales del chat usan la conexión al Gateway propia de la ventana.

## Barra de Chat rápido

Pulse Opción-Espacio (⌥Espacio) o elija **Chat rápido** en el menú de la barra de menús para abrir un editor flotante para la sesión principal. Cambie el atajo global con el grabador en **Settings → General → Quick Chat shortcut**.

Chat rápido muestra el agente de destino (avatar o emoji, con el nombre del agente como texto de marcador de posición) y envía a la sesión principal de ese agente. Después de que Retorno acepte un envío, la barra permanece abierta y se expande hacia abajo con la respuesta de Markdown transmitida y la transcripción reciente. El campo de entrada de la barra sigue siendo el editor. Pulse Comando-Retorno para enviar y abrir el mismo destino en la ventana de chat completa, Mayús-Retorno para insertar una nueva línea o Escape para cerrar toda la barra y el área de respuesta. Al hacer clic fuera también se cierra. Cuando faltan permisos pertinentes de macOS, una franja adjunta ofrece las acciones **Conceder** y **Ahora no**.

Use el botón del micrófono para dictar en el editor. Los resultados parciales de voz sustituyen en directo el fragmento dictado, conservando el texto que ya estaba en el editor. Pulse de nuevo el botón, Retorno o Escape para detenerlo; enviar, ocultar o quitar el foco de Chat rápido también libera el micrófono. La primera vez se solicita acceso al micrófono y al reconocimiento de voz de macOS. Chat rápido usa Apple Speech y puede utilizar sus servicios de red; solo la activación por voz pasiva requiere reconocimiento en el dispositivo.

El control compacto del modelo muestra el modelo y el nivel de razonamiento actuales de la sesión de destino. La elección de un modelo actualiza esa sesión y, por tanto, se conserva en ella, mientras que la elección del razonamiento solo se aplica a cada mensaje enviado desde la presentación actual de Chat rápido. Las elecciones locales se restablecen cuando se oculta la barra. Al cambiar de agente o elegir una sesión reciente, se conservan las elecciones explícitas, pero se vuelve a cargar el estado subyacente del modelo de la nueva sesión de destino.

Haga clic en el botón del historial para elegir entre las cinco sesiones actualizadas más recientemente o volver a **Nuevo mensaje para &lt;agent&gt;**. Una selección reciente envía a esa sesión exacta y cambia el texto de marcador de posición a **Responder en &lt;session&gt;**. Al ocultar Chat rápido, este destino temporal se restablece a la sesión principal del agente seleccionado; al cambiar de agente desde el menú del avatar también se borra.

Comando-Retorno abre la conversación del agente que recibió el envío, incluso cuando el ámbito de la sesión es global.

El botón de la cámara abre un menú con **Capturar ventana…** o **Capturar área…**. La captura de ventana etiqueta todas las ventanas visibles; la captura de área atenúa cada pantalla mientras se arrastra una región y muestra su tamaño en directo. La captura de pantalla seleccionada se envía al agente elegido con cualquier texto escrito como pie. La primera vez se solicita acceso a la grabación de pantalla de macOS. Escape, hacer clic en un espacio vacío o hacer clic sin arrastrar un área significativa cancela la operación.

Use el botón de texto de documento para adjuntar texto desde la ventana enfocada de la aplicación que tiene el foco. Chat rápido muestra el resultado como una etiqueta de contexto extraíble en lugar de colocar el texto capturado en el editor; al enviar, se añade el texto de la etiqueta al mensaje saliente y después se borra. Esto requiere el permiso de accesibilidad de macOS. El texto adjunto también se borra cada vez que se cierra Chat rápido, para que el contexto de una presentación no pueda filtrarse a un envío posterior.

Cuando termina una respuesta, elija **Pegar en &lt;app&gt;** para copiar el texto visible del asistente, sin incluir el razonamiento oculto, al portapapeles general y pegarlo en la aplicación que estaba en primer plano. Esto requiere el permiso de accesibilidad de macOS. La acción sustituye el contenido actual del portapapeles y después oculta Chat rápido.

Desactive la función por completo con **Settings → General → Quick Chat**; la misma sección contiene el grabador de atajos.

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

- Plano de datos: métodos WS del Gateway `chat.history`, `chat.message.get`, `chat.send`, `chat.abort`, `chat.inject`, además de `question.list` y `question.resolve`, y eventos `chat`, `agent`, `presence`, `tick`, `health`; las tarjetas de preguntas siguen los eventos `question.requested` y `question.resolved` y se actualizan desde `question.list` después de las reconexiones.
- `chat.history` devuelve una transcripción normalizada para su visualización: las etiquetas de directivas integradas se eliminan del texto visible, se eliminan las cargas útiles XML de llamadas a herramientas en texto sin formato (`<tool_call>`, `<function_call>`, `<tool_calls>`, `<function_calls>`, incluidos los bloques truncados) y los tokens de control del modelo filtrados, se omiten las filas del asistente que contienen únicamente tokens silenciosos, como los valores exactos `NO_REPLY`/`no_reply`, y las filas demasiado grandes se pueden sustituir por un marcador de posición truncado.
- Sesión: de forma predeterminada, usa la sesión principal indicada anteriormente; la interfaz puede cambiar entre sesiones.
- Grupos de sesiones: `sessions.groups.list`, `sessions.groups.put`, `sessions.groups.rename` y `sessions.groups.delete` controlan el catálogo de grupos. La pertenencia corresponde al valor `category` de la sesión, actualizado mediante `sessions.patch`.
- Estado no leído: después de que se activa una sesión y su historial en directo se carga correctamente, la aplicación borra el marcador de no leído de esa sesión. Si la carga del historial falla, no se borra; un fallo transitorio al aplicar el parche se reintenta en la siguiente activación.
- La incorporación usa una sesión dedicada para mantener separada la configuración de la primera ejecución.
- Caché sin conexión: la aplicación mantiene una pequeña caché de solo lectura de las sesiones de chat y transcripciones recientes por Gateway (`~/Library/Application Support/OpenClaw/chat-cache.sqlite`): al abrir en frío, se muestra inmediatamente la última transcripción conocida y se actualiza cuando responde el Gateway; además, se puede seguir navegando por los chats recientes sin conexión (el envío permanece desactivado hasta que se restablece la conexión).

## Superficie de seguridad

- El modo remoto reenvía únicamente el puerto de control WebSocket del Gateway mediante SSH.

## Limitaciones conocidas

- La interfaz está optimizada para sesiones de chat, no para un entorno aislado completo de navegador.

## Temas relacionados

- [WebChat](/es/web/webchat)
- [Aplicación para macOS](/es/platforms/macos)

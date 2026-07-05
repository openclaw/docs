---
read_when:
    - Quieres operar el Gateway desde un navegador
    - Quieres acceso a Tailnet sin túneles SSH
sidebarTitle: Control UI
summary: Interfaz de control basada en navegador para el Gateway (chat, actividad, nodos, configuración)
title: Interfaz de usuario de control
x-i18n:
    generated_at: "2026-07-05T11:53:15Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5ae0d8bd066edaab2d58f7eec53ee125a792577fb8a3f2af1d7b5e8c75480657
    source_path: web/control-ui.md
    workflow: 16
---

La Control UI es una pequeña aplicación de una sola página **Vite + Lit** servida por el Gateway:

- predeterminado: `http://<host>:18789/`
- prefijo opcional: configura `gateway.controlUi.basePath` (por ejemplo, `/openclaw`)

Se comunica **directamente con el WebSocket del Gateway** en el mismo puerto.

## Apertura rápida (local)

Si el Gateway se está ejecutando en el mismo equipo, abre [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (o [http://localhost:18789/](http://localhost:18789/)).

Si la página no carga, inicia primero el Gateway: `openclaw gateway`.

<Note>
En enlaces LAN nativos de Windows, Windows Firewall o una directiva de grupo administrada por la organización aún pueden bloquear la URL LAN anunciada aunque `127.0.0.1` funcione en el host del Gateway. Ejecuta `openclaw gateway status --deep` en el host Windows; informa puertos probablemente bloqueados, incompatibilidades de perfil y reglas de firewall locales que la directiva puede ignorar.
</Note>

La autenticación se proporciona durante el handshake del WebSocket mediante:

- `connect.params.auth.token`
- `connect.params.auth.password`
- encabezados de identidad de Tailscale Serve cuando `gateway.auth.allowTailscale: true`
- encabezados de identidad de proxy de confianza cuando `gateway.auth.mode: "trusted-proxy"`

El panel de configuración del dashboard conserva un token para la sesión actual de la pestaña del navegador y la URL de Gateway seleccionada; las contraseñas no se persisten. El onboarding normalmente genera un token de Gateway para autenticación con secreto compartido en la primera conexión, pero la autenticación por contraseña también funciona cuando `gateway.auth.mode` es `"password"`.

## Emparejamiento de dispositivos (primera conexión)

Conectarse desde un navegador o dispositivo nuevo normalmente requiere una **aprobación de emparejamiento de un solo uso**, mostrada como `disconnected (1008): pairing required`.

<Steps>
  <Step title="Lista las solicitudes pendientes">
    ```bash
    openclaw devices list
    ```
  </Step>
  <Step title="Aprueba por ID de solicitud">
    ```bash
    openclaw devices approve <requestId>
    ```
  </Step>
</Steps>

Si el navegador reintenta el emparejamiento con detalles de autenticación cambiados (rol/ámbitos/clave pública), la solicitud pendiente anterior se reemplaza y se crea un nuevo `requestId`; vuelve a ejecutar `openclaw devices list` antes de aprobar.

Cambiar un navegador ya emparejado de acceso de lectura a acceso de escritura/admin se trata como una actualización de aprobación, no como una reconexión silenciosa: OpenClaw mantiene activa la aprobación anterior, bloquea la reconexión con más permisos y te pide que apruebes explícitamente el nuevo conjunto de ámbitos.

Una vez aprobado, el dispositivo se recuerda y no requerirá una nueva aprobación a menos que lo revoques con `openclaw devices revoke --device <id> --role <role>`. Consulta [CLI de dispositivos](/es/cli/devices) para rotación de tokens, revocación y el flujo de aprobación inicial de Paperclip / `openclaw_gateway`.

<Note>
- Las conexiones directas de navegador mediante local loopback (`127.0.0.1` / `localhost`) se aprueban automáticamente.
- Tailscale Serve puede omitir la ida y vuelta de emparejamiento para sesiones de operador de Control UI cuando `gateway.auth.allowTailscale: true`, la identidad de Tailscale se verifica y el navegador presenta su identidad de dispositivo. Los navegadores sin dispositivo y las conexiones con rol de nodo siguen pasando por las comprobaciones normales de dispositivo.
- Los enlaces directos de Tailnet, las conexiones de navegador por LAN y los perfiles de navegador sin identidad de dispositivo aún requieren aprobación explícita.
- Cada perfil de navegador genera un ID de dispositivo único, por lo que cambiar de navegador o borrar los datos del navegador requiere volver a emparejar.

</Note>

## Emparejar un dispositivo móvil

Un administrador ya emparejado puede crear el QR de conexión de iOS/Android sin abrir una terminal:

<Steps>
  <Step title="Abre el emparejamiento móvil">
    Selecciona **Nodos** y luego haz clic en **Emparejar dispositivo móvil** en la tarjeta **Dispositivos**.
  </Step>
  <Step title="Conecta el teléfono">
    En la app móvil de OpenClaw, abre **Configuración** → **Gateway** y escanea el código QR. También puedes copiar y pegar el código de configuración.
  </Step>
  <Step title="Confirma la conexión">
    La app oficial de iOS/Android se conecta automáticamente. Si **Dispositivos** muestra una solicitud pendiente, revisa su rol y sus ámbitos antes de aprobarla.
  </Step>
</Steps>

Crear un código de configuración requiere `operator.admin`; el botón se desactiva para las sesiones que no lo tienen. Un código de configuración contiene una credencial bootstrap de corta duración, así que trata el QR y el código copiado como una contraseña mientras sean válidos. Para el emparejamiento remoto, el Gateway debe resolverse como `wss://` (por ejemplo, mediante Tailscale Serve/Funnel); `ws://` sin cifrar se limita a loopback y direcciones LAN privadas. Consulta [Emparejamiento](/es/channels/pairing#pair-from-the-control-ui-recommended) para ver todos los detalles de seguridad y fallback.

## Identidad personal (local del navegador)

La Control UI admite una identidad personal por navegador (nombre visible y avatar) adjunta a los mensajes salientes, para atribución en sesiones compartidas. Vive en el almacenamiento del navegador, limitada al perfil de navegador actual, y no se sincroniza con otros dispositivos ni se persiste del lado del servidor más allá de los metadatos normales de autoría de transcripción en los mensajes que envías. Borrar los datos del sitio o cambiar de navegador la restablece a vacío.

La sustitución del avatar del asistente sigue el mismo patrón local del navegador: las sustituciones cargadas superponen localmente la identidad resuelta por el Gateway y nunca hacen un viaje de ida y vuelta por `config.patch`. El campo de configuración compartido `ui.assistant.avatar` sigue disponible para clientes que no sean de UI y escriban el campo directamente.

## Endpoint de configuración en tiempo de ejecución

La Control UI obtiene su configuración en tiempo de ejecución de `/control-ui-config.json`, resuelto en relación con la ruta base de Control UI del Gateway (por ejemplo, `/__openclaw__/control-ui-config.json` bajo la ruta base `/__openclaw__/`). Ese endpoint está protegido por la misma autenticación del Gateway que el resto de la superficie HTTP: los navegadores no autenticados no pueden obtenerlo, y una obtención correcta requiere un token/contraseña de Gateway válido, identidad de Tailscale Serve o una identidad de proxy de confianza.

## Compatibilidad de idiomas

La Control UI se localiza en la primera carga según la configuración regional de tu navegador. Para cambiarla más adelante, abre **Resumen -> Acceso al Gateway -> Idioma** (el selector está en la tarjeta Acceso al Gateway, no en Apariencia).

- Configuraciones regionales compatibles: `en`, `ar`, `de`, `es`, `fa`, `fr`, `hi`, `id`, `it`, `ja-JP`, `ko`, `nl`, `pl`, `pt-BR`, `ru`, `th`, `tr`, `uk`, `vi`, `zh-CN`, `zh-TW`
- Las traducciones no inglesas se cargan de forma diferida en el navegador.
- La configuración regional seleccionada se guarda en el almacenamiento del navegador y se reutiliza en visitas futuras.
- Las claves de traducción faltantes recurren al inglés.

Las traducciones de la documentación se generan para el mismo conjunto de configuraciones regionales no inglesas, pero el selector de idioma integrado del sitio de documentación de Mintlify solo enumera los códigos de configuración regional que Mintlify acepta. La documentación en tailandés (`th`) y persa (`fa`) aún se genera en el repositorio de publicación; puede que no aparezca en ese selector hasta que Mintlify admita esos códigos.

## Temas de apariencia

El panel Apariencia tiene los temas integrados Claw, Knot y Dash (Claw es el predeterminado), además de una ranura de importación tweakcn local del navegador. Para importar un tema, abre el [editor de tweakcn](https://tweakcn.com/editor/theme), elige o crea un tema, haz clic en **Compartir** y pega el enlace copiado en Apariencia. El importador también acepta URL de registro `https://tweakcn.com/r/themes/<id>`, URL del editor como `https://tweakcn.com/editor/theme?theme=amethyst-haze`, rutas relativas `/themes/<id>`, ID de tema sin formato y nombres de tema predeterminados como `amethyst-haze`.

Los temas importados se almacenan solo en el perfil de navegador actual; no se escriben en la configuración del Gateway y no se sincronizan entre dispositivos. Reemplazar el tema importado actualiza la única ranura local; borrarlo vuelve a Claw si el tema importado estaba activo.

Apariencia también tiene una configuración Tamaño de texto local del navegador, almacenada con el resto de preferencias de Control UI. Se aplica al texto del chat, al texto del compositor, a las tarjetas de herramientas y a las barras laterales del chat, y mantiene las entradas de texto en al menos 16px para que Safari móvil no haga zoom automático al enfocar.

## Qué puede hacer (hoy)

<AccordionGroup>
  <Accordion title="Chat y conversación por voz">
    - Chatear con el modelo mediante Gateway WS (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`).
    - Las actualizaciones del historial de chat solicitan una ventana reciente acotada con límites de texto por mensaje, de modo que las sesiones grandes no obliguen al navegador a renderizar una carga de transcripción completa antes de que el chat sea usable.
    - Hablar mediante sesiones en tiempo real del navegador. OpenAI usa WebRTC directo, Google Live usa un token de navegador restringido de un solo uso por WebSocket, y los plugins de voz en tiempo real solo de backend usan el transporte de retransmisión del Gateway. Las sesiones de proveedor propiedad del cliente empiezan con `talk.client.create`; las sesiones de retransmisión del Gateway empiezan con `talk.session.create`. La retransmisión mantiene las credenciales del proveedor en el Gateway mientras el navegador transmite PCM del micrófono mediante `talk.session.appendAudio`, reenvía llamadas a herramientas del proveedor `openclaw_agent_consult` mediante `talk.client.toolCall` para la política del Gateway y el modelo de OpenClaw configurado más grande, y enruta la dirección por voz de la ejecución activa mediante `talk.client.steer` o `talk.session.steer`.
    - Transmitir llamadas a herramientas y tarjetas de salida de herramientas en vivo en Chat (eventos de agente).
    - Pestaña Actividad con resúmenes locales del navegador y orientados primero a la redacción de la actividad de herramientas en vivo desde la entrega existente de eventos `session.tool` / tool.

  </Accordion>
  <Accordion title="Canales, instancias, sesiones, sueños">
    - Canales: estado de canales integrados y de plugins agrupados/externos, inicio de sesión con QR y configuración por canal (`channels.status`, `web.login.*`, `config.patch`).
    - Las actualizaciones de sondeo de canal mantienen visible la instantánea anterior mientras terminan las comprobaciones lentas del proveedor, y etiquetan instantáneas parciales cuando un sondeo o una auditoría supera su presupuesto de UI.
    - Instancias: lista de presencia y actualización (`system-presence`).
    - Sesiones: listar de forma predeterminada sesiones de agentes configurados, fijar sesiones frecuentes, renombrarlas, archivar o restaurar sesiones inactivas, volver desde claves de sesión obsoletas de agentes no configurados y aplicar anulaciones por sesión de modelo/thinking/fast/verbose/trace/reasoning (`sessions.list`, `sessions.patch`). Las sesiones fijadas se ordenan por encima de las sesiones recientes no fijadas; las sesiones archivadas viven en la vista archivada de la página Sesiones y conservan sus transcripciones.
    - Sueños: estado de Dreaming, conmutador de habilitar/deshabilitar y lector de Diario de sueños (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`).

  </Accordion>
  <Accordion title="Cron, Skills, nodos, aprobaciones de exec">
    - Trabajos Cron: listar/agregar/editar/ejecutar/habilitar/deshabilitar más historial de ejecuciones (`cron.*`).
    - Skills: estado, habilitar/deshabilitar, instalar, actualizaciones de claves API (`skills.*`).
    - Nodos: lista más capacidades (`node.list`), crear códigos de configuración móvil y aprobar emparejamiento de dispositivos (`device.pair.*`).
    - Aprobaciones de exec: editar allowlists de Gateway o nodo y política de solicitud para `exec host=gateway/node` (`exec.approvals.*`).

  </Accordion>
  <Accordion title="Configuración">
    - Ver/editar `~/.openclaw/openclaw.json` (`config.get`, `config.set`).
    - MCP tiene una página de configuración dedicada para servidores configurados, habilitación, resúmenes de OAuth/filtros/paralelismo, comandos comunes de operador y el editor de configuración `mcp` con ámbito.
    - Aplicar y reiniciar con validación (`config.apply`), luego despertar la última sesión activa.
    - Las escrituras incluyen una protección de hash base para evitar sobrescribir ediciones concurrentes.
    - Las escrituras (`config.set`/`config.apply`/`config.patch`) hacen una comprobación previa de la resolución de SecretRef activos para referencias en la carga de configuración enviada; las referencias enviadas activas no resueltas se rechazan antes de escribir.
    - Los guardados de formularios descartan placeholders redactados obsoletos que no pueden restaurarse desde la configuración guardada, a la vez que conservan valores redactados que aún se asignan a secretos guardados.
    - El esquema y el renderizado de formularios provienen de `config.schema` / `config.schema.lookup`, incluidos `title`/`description` de campos, pistas de UI coincidentes, resúmenes de hijos inmediatos, metadatos de documentación en nodos anidados de objeto/comodín/array/composición, además de esquemas de plugins y canales cuando están disponibles. El editor JSON sin procesar solo está disponible cuando la instantánea tiene un viaje de ida y vuelta sin procesar seguro; de lo contrario, Control UI fuerza el modo Formulario.
    - "Restablecer a guardado" del editor JSON sin procesar conserva la forma escrita sin procesar (formato, comentarios, disposición de `$include`) en lugar de volver a renderizar una instantánea aplanada, por lo que las ediciones externas sobreviven a un restablecimiento cuando la instantánea puede hacer un viaje de ida y vuelta de forma segura.
    - Los valores de objeto SecretRef estructurados se renderizan como de solo lectura en entradas de texto del formulario, para evitar una corrupción accidental de objeto a cadena.

  </Accordion>
  <Accordion title="Depuración, registros, actualización">
    - Depuración: instantáneas de estado/salud/modelos, registro de eventos y llamadas RPC manuales (`status`, `health`, `models.list`).
    - El registro de eventos incluye tiempos de actualización/RPC de Control UI, tiempos de renderizado lento de chat/configuración y entradas de capacidad de respuesta del navegador para fotogramas de animación largos o tareas largas cuando el navegador expone esos tipos de entrada de PerformanceObserver.
    - Registros: seguimiento en vivo de los registros de archivo del Gateway con filtro/exportación (`logs.tail`).
    - Actualización: ejecuta una actualización de paquete/git más reinicio (`update.run`) con un informe de reinicio y luego sondea `update.status` después de reconectar para verificar la versión del Gateway en ejecución.

  </Accordion>
  <Accordion title="Notas del panel de trabajos Cron">
    - Para trabajos aislados, la entrega usa de forma predeterminada anunciar resumen; cambia a ninguno para ejecuciones solo internas.
    - Los campos de canal/destino aparecen cuando anunciar está seleccionado.
    - El modo Webhook usa `delivery.mode = "webhook"` con `delivery.to` establecido en una URL de webhook HTTP(S) válida.
    - Para trabajos de sesión principal, los modos de entrega webhook y ninguno están disponibles.
    - Los controles de edición avanzada incluyen eliminar después de ejecutar, borrar anulación de agente, opciones cron exactas/escalonadas, anulaciones de modelo/razonamiento del agente y conmutadores de entrega de mejor esfuerzo.
    - La validación del formulario es en línea con errores a nivel de campo; los valores no válidos deshabilitan el botón de guardar hasta que se corrijan.
    - Define `cron.webhookToken` para enviar un token bearer dedicado; si se omite, el webhook se envía sin encabezado de autenticación.
    - `cron.webhook` es una alternativa heredada obsoleta: ejecuta `openclaw doctor --fix` para migrar los trabajos almacenados que aún usan `notify: true` a webhook por trabajo explícito o entrega de finalización.

  </Accordion>
</AccordionGroup>

## Página MCP

La página MCP dedicada es una vista de operador para servidores MCP administrados por OpenClaw bajo `mcp.servers`. No inicia transportes MCP por sí sola; úsala para inspeccionar y editar la configuración guardada y luego usa `openclaw mcp doctor --probe` cuando necesites prueba en vivo del servidor.

Flujo de trabajo típico:

1. Abre **MCP** desde la barra lateral.
2. Revisa las tarjetas de resumen para los recuentos de servidores totales, habilitados, OAuth y filtrados.
3. Revisa cada fila de servidor para transporte, habilitación, autenticación, filtros, tiempos de espera y sugerencias de comandos.
4. Activa o desactiva la habilitación cuando un servidor deba permanecer configurado pero quedar fuera del descubrimiento en tiempo de ejecución.
5. Edita la sección de configuración `mcp` con ámbito para definiciones de servidor, encabezados, rutas TLS/mTLS, metadatos OAuth, filtros de herramientas y metadatos de proyección de Codex.
6. Usa **Guardar** para escribir configuración, o **Guardar y publicar** cuando el Gateway en ejecución deba aplicar la configuración modificada.
7. Ejecuta `openclaw mcp status --verbose`, `openclaw mcp doctor --probe` o `openclaw mcp reload` desde una terminal para diagnósticos estáticos, prueba en vivo o descarte de runtime en caché.

La página redacta los valores similares a URL que contienen credenciales antes de renderizarlos y entrecomilla los nombres de servidor en los fragmentos de comandos para que los comandos copiados sigan funcionando con espacios o metacaracteres de shell. Referencia completa de CLI y configuración: [MCP](/es/cli/mcp).

## Pestaña Actividad

La pestaña Actividad es un observador efímero local del navegador para actividad de herramientas en vivo, derivado del mismo flujo de eventos `session.tool` / herramienta del Gateway que alimenta las tarjetas de herramientas de Chat. No agrega otra familia de eventos del Gateway, endpoint, almacén duradero de actividad, feed de métricas ni flujo de observador externo.

Las entradas de Actividad conservan solo resúmenes saneados y vistas previas de salida redactadas y truncadas. Los valores de argumentos de herramientas no se almacenan en el estado de Actividad; la UI muestra que los argumentos están ocultos y registra solo el recuento de campos de argumento. La lista en memoria sigue la pestaña actual del navegador, sobrevive a la navegación dentro de Control UI y se restablece al recargar la página, cambiar de sesión o usar **Borrar**.

## Terminal del operador

La terminal acoplable del operador está deshabilitada de forma predeterminada. Para habilitarla, establece `gateway.terminal.enabled: true` y reinicia el Gateway. La terminal requiere una conexión `operator.admin` y abre una PTY del host en el espacio de trabajo del agente activo. Las pestañas nuevas siguen al agente de chat seleccionado actualmente.

<Warning>
La terminal es un shell de host sin confinamiento y hereda el entorno del proceso del Gateway. Habilítala solo para despliegues de operadores de confianza. OpenClaw rechaza sesiones de terminal para agentes con `sandbox.mode: "all"`; cambiar un agente activo a ese modo cierra sus sesiones de terminal existentes y en curso.
</Warning>

Usa **Ctrl + acento grave** para alternar el panel. El diseño admite acoplamiento inferior y derecho, cambia de tamaño con el viewport del navegador y mantiene varias pestañas de shell. Consulta [configuración del Gateway](/es/gateway/configuration-reference#gateway) para `gateway.terminal.enabled` y la anulación opcional `gateway.terminal.shell`.

Las sesiones sobreviven a las desconexiones: una recarga de página, suspensión del portátil o interrupción de red separa la sesión en el Gateway en lugar de finalizarla, y la misma pestaña del navegador se vuelve a adjuntar al reconectar con la salida reciente reproducida. Las sesiones separadas se finalizan después de `gateway.terminal.detachedSessionTimeoutSeconds` (predeterminado 300 segundos; `0` restaura finalizar al desconectar). `terminal.list` muestra sesiones adjuntables, `terminal.attach` adopta una (toma de control estilo tmux) y `terminal.text` lee la salida reciente de una sesión como texto plano sin adjuntarse: una facilidad para agentes/herramientas.

La terminal también está disponible como documento de pantalla completa solo de terminal en `/?view=terminal`. Las aplicaciones de iOS y Android incrustan esta página en sus pantallas de Terminal, reutilizando las credenciales de gateway almacenadas; la disponibilidad sigue la misma compuerta `gateway.terminal.enabled` y `operator.admin`, y la página muestra un aviso cuando el Gateway conectado no ofrece la terminal.

## Comportamiento del chat

<AccordionGroup>
  <Accordion title="Semántica de envío e historial">
    - `chat.send` es **no bloqueante**: confirma inmediatamente con `{ runId, status: "started" }` y la respuesta se transmite mediante eventos `chat`. Los clientes de Control UI de confianza también pueden recibir metadatos opcionales de tiempos de ACK para diagnósticos locales.
    - Las cargas de chat aceptan imágenes además de archivos que no sean video. Las imágenes conservan la ruta de imagen nativa; otros archivos se almacenan como medios administrados y se muestran en el historial como enlaces de adjuntos.
    - Reenviar con la misma `idempotencyKey` devuelve `{ status: "in_flight" }` mientras se ejecuta y `{ status: "ok" }` después de completarse.
    - Las respuestas de `chat.history` tienen límite de tamaño para la seguridad de la UI. Cuando las entradas de transcripción son demasiado grandes, el Gateway puede truncar campos de texto largos, omitir bloques de metadatos pesados y reemplazar mensajes sobredimensionados con un marcador (`[chat.history omitted: message too large]`).
    - Cuando un mensaje visible del asistente se truncó en `chat.history`, el lector lateral puede recuperar bajo demanda la entrada completa de transcripción normalizada para visualización mediante `chat.message.get` por `sessionKey`, `agentId` activo cuando sea necesario y `messageId` de transcripción. Si el Gateway aún no puede devolver más, el lector muestra un estado explícito de no disponible en lugar de repetir silenciosamente la vista previa truncada.
    - Las imágenes generadas por el asistente se conservan como referencias de medios administrados y se devuelven mediante URL de medios autenticadas del Gateway, por lo que las recargas no dependen de que las cargas útiles de imagen base64 sin procesar permanezcan en la respuesta del historial de chat.
    - Al renderizar `chat.history`, Control UI elimina del texto visible del asistente las etiquetas de directivas en línea solo de visualización (por ejemplo `[[reply_to_*]]` y `[[audio_as_voice]]`), las cargas útiles XML de llamadas a herramientas en texto plano (incluidos `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` y bloques de llamadas a herramientas truncados) y tokens filtrados de control de modelo ASCII/de ancho completo. Omite las entradas del asistente cuyo texto visible completo sea solo el token silencioso exacto `NO_REPLY` / `no_reply` o el token de confirmación de Heartbeat `HEARTBEAT_OK`.
    - Durante un envío activo y la actualización final del historial, la vista de chat mantiene visibles los mensajes locales optimistas de usuario/asistente si `chat.history` devuelve brevemente una instantánea más antigua; la transcripción canónica reemplaza esos mensajes locales cuando el historial del Gateway se pone al día.
    - Los eventos `chat` en vivo son estado de entrega, mientras que `chat.history` se reconstruye desde la transcripción duradera de la sesión. Después de eventos finales de herramienta, Control UI recarga el historial y fusiona solo una pequeña cola optimista; el límite de la transcripción está documentado en [WebChat](/es/web/webchat).
    - `chat.inject` añade una nota del asistente a la transcripción de la sesión y difunde un evento `chat` para actualizaciones solo de UI (sin ejecución de agente, sin entrega de canal).
    - La barra lateral enumera sesiones recientes con una acción Nueva sesión, un enlace Todas las sesiones y un botón de búsqueda de sesión que abre el selector de sesiones completo (con ámbito del agente seleccionado, búsqueda y paginación). Una nueva sesión del panel obtiene de forma asíncrona un título generado conciso a partir de su primer mensaje que no sea comando; los nombres explícitos nunca se reemplazan. Establece `agents.defaults.utilityModel` (o `agents.list[].utilityModel`) para enrutar esta llamada de modelo separada a un modelo de menor costo. Cambiar de agente muestra solo las sesiones vinculadas a ese agente y recurre a la sesión principal de ese agente cuando aún no tiene sesiones de panel guardadas.
    - Cada fila del selector de sesiones puede renombrar, fijar o archivar la sesión. Una ejecución activa y la sesión principal de un agente no pueden archivarse. Archivar la sesión seleccionada actualmente cambia Chat de nuevo a la sesión principal de ese agente.
    - En anchos de escritorio, los controles de chat permanecen en una fila compacta y se contraen al desplazarse hacia abajo por la transcripción; desplazarse hacia arriba, volver al principio o llegar al final restaura los controles.
    - Los mensajes consecutivos duplicados de solo texto se renderizan como una burbuja con una insignia de recuento. Los mensajes que contienen imágenes, adjuntos, salida de herramientas o vistas previas de lienzo no se contraen.
    - Los selectores de modelo y razonamiento del encabezado de chat parchean inmediatamente la sesión activa mediante `sessions.patch`; son anulaciones persistentes de sesión, no opciones de envío solo para un turno.
    - Si envías un mensaje mientras un cambio del selector de modelo para la misma sesión aún se está guardando, el compositor espera a que se aplique ese parche de sesión antes de llamar a `chat.send` para que el envío use el modelo seleccionado.
    - Escribir `/new` crea y cambia a la misma sesión nueva del panel que Nuevo chat, excepto cuando `session.dmScope: "main"` está configurado y el padre actual es la sesión principal del agente; entonces restablece la sesión principal in situ. Escribir `/reset` mantiene el restablecimiento explícito in situ del Gateway para la sesión actual.
    - El selector de modelo de chat solicita la vista de modelo configurada del Gateway. Si `agents.defaults.models` está presente, esa lista de permitidos controla el selector, incluidas entradas `provider/*` que mantienen dinámicos los catálogos con ámbito de proveedor. De lo contrario, el selector muestra entradas explícitas `models.providers.*.models` además de proveedores con autenticación utilizable. El catálogo completo sigue disponible mediante el RPC de depuración `models.list` con `view: "all"`.
    - Cuando los informes recientes de uso de sesión del Gateway incluyen tokens de contexto actuales, la barra de herramientas del compositor de chat muestra un pequeño anillo de uso de contexto con el porcentaje usado; el detalle completo de tokens está en su tooltip. El anillo cambia a estilo de advertencia con alta presión de contexto y, en niveles recomendados de Compaction, muestra un botón compacto que ejecuta la ruta normal de Compaction de sesión. Las instantáneas de tokens obsoletas se ocultan hasta que el Gateway vuelve a informar uso reciente.

  </Accordion>
  <Accordion title="Modo Talk (tiempo real del navegador)">
    El modo Talk usa un proveedor de voz en tiempo real registrado. Configura OpenAI con `talk.realtime.provider: "openai"` más un perfil de autenticación con clave de API de `openai`, `talk.realtime.providers.openai.apiKey` u `OPENAI_API_KEY`; los perfiles OAuth de OpenAI no configuran la voz en tiempo real. Configura Google con `talk.realtime.provider: "google"` más `talk.realtime.providers.google.apiKey`. El navegador nunca recibe una clave de API de proveedor estándar: OpenAI recibe un secreto efímero de cliente Realtime para WebRTC, y Google Live recibe un token de autenticación de Live API restringido y de un solo uso para una sesión WebSocket del navegador, con las instrucciones y declaraciones de herramientas bloqueadas en el token por el Gateway. Los proveedores que solo exponen un puente de tiempo real de backend se ejecutan mediante el transporte de retransmisión del Gateway, por lo que las credenciales y los sockets del proveedor permanecen del lado del servidor mientras el audio del navegador se mueve mediante RPC autenticadas del Gateway. El prompt de la sesión Realtime lo ensambla el Gateway; `talk.client.create` no acepta anulaciones de instrucciones proporcionadas por el llamador.

    El compositor de Chat incluye un botón de opciones de Talk junto al botón de iniciar/detener Talk. Las opciones se aplican a la siguiente sesión de Talk y pueden anular el proveedor, el transporte, el modelo, la voz, el esfuerzo de razonamiento, el umbral de VAD, la duración del silencio y el relleno de prefijo. Una opción en blanco recurre a los valores predeterminados configurados o al valor predeterminado del proveedor. Seleccionar la retransmisión del Gateway fuerza la ruta de retransmisión del backend; seleccionar WebRTC mantiene la sesión propiedad del cliente y falla en lugar de recurrir silenciosamente a la retransmisión si el proveedor no puede crear una sesión de navegador.

    El control de Talk en sí es el botón de ondas junto al botón de dictado por micrófono. Cuando Talk se inicia, la fila de estado del compositor muestra `Connecting Talk...`, luego `Talk live` mientras el audio está conectado, o `Asking OpenClaw...` mientras una llamada a herramienta en tiempo real consulta el modelo más grande configurado mediante `talk.client.toolCall`.

    Smoke en vivo de mantenedor: `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` verifica el puente WebSocket de backend de OpenAI, el intercambio SDP de WebRTC del navegador con OpenAI, la configuración WebSocket del navegador con token restringido de Google Live y el adaptador de navegador de retransmisión del Gateway con medios de micrófono falsos. El comando solo imprime el estado del proveedor y no registra secretos.

  </Accordion>
  <Accordion title="Detener y abortar">
    - Haz clic en **Detener** (llama a `chat.abort`).
    - Mientras una ejecución está activa, los seguimientos normales se ponen en cola. Haz clic en **Dirigir** en un mensaje en cola para inyectar ese seguimiento en el turno en ejecución.
    - Escribe `/stop` (o frases de aborto independientes como `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop`) para abortar fuera de banda.
    - `chat.abort` admite `{ sessionKey }` (sin `runId`) para abortar todas las ejecuciones activas de esa sesión.

  </Accordion>
  <Accordion title="Retención parcial al abortar">
    - Cuando se aborta una ejecución, el texto parcial del asistente aún puede mostrarse en la interfaz de usuario.
    - Gateway conserva el texto parcial abortado del asistente en el historial de la transcripción cuando existe salida en búfer.
    - Las entradas conservadas incluyen metadatos de aborto para que los consumidores de transcripciones puedan distinguir los parciales abortados de la salida de finalización normal.

  </Accordion>
</AccordionGroup>

## Instalación de PWA y Web Push

La interfaz de control incluye un `manifest.webmanifest` y un service worker, por lo que los navegadores modernos pueden instalarla como una PWA independiente. Web Push permite que el Gateway despierte la PWA instalada con notificaciones incluso cuando la pestaña o la ventana del navegador no están abiertas.

Si la página muestra **Incompatibilidad de protocolo** justo después de una actualización de OpenClaw, primero vuelve a abrir el panel con `openclaw dashboard` y haz una actualización forzada. Si sigue fallando, borra los datos del sitio para el origen del panel o prueba en una ventana privada del navegador; una pestaña antigua o la caché del service worker del navegador puede seguir ejecutando un paquete de interfaz de control anterior a la actualización contra el Gateway más reciente.

| Superficie                                             | Qué hace                                                           |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                      | Manifiesto de PWA. Los navegadores ofrecen "Instalar aplicación" cuando es accesible. |
| `ui/public/sw.js`                                     | Service worker que gestiona eventos `push` y clics en notificaciones. |
| `push/vapid-keys.json` (bajo el directorio de estado de OpenClaw) | Par de claves VAPID generado automáticamente usado para firmar cargas de Web Push. |
| `push/web-push-subscriptions.json`                    | Endpoints de suscripción del navegador persistidos.                |

Anula el par de claves VAPID mediante variables de entorno en el proceso del Gateway cuando quieras fijar claves (despliegues multi-host, rotación de secretos o pruebas):

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT` (por defecto `https://openclaw.ai`)

La interfaz de control usa estos métodos del Gateway restringidos por ámbito para registrar y probar suscripciones del navegador:

- `push.web.vapidPublicKey` obtiene la clave pública VAPID activa.
- `push.web.subscribe` registra un `endpoint` más `keys.p256dh`/`keys.auth`.
- `push.web.unsubscribe` elimina un endpoint registrado.
- `push.web.test` envía una notificación de prueba a la suscripción del llamador.

<Note>
Web Push es independiente de la ruta de retransmisión APNS de iOS (consulta [Configuración](/es/gateway/configuration) para push respaldado por retransmisión) y del método `push.test`, que apunta al emparejamiento móvil nativo.
</Note>

## Incrustaciones alojadas

Los mensajes del asistente pueden renderizar contenido web alojado en línea con el shortcode `[embed ...]`. La política de sandbox de iframe se controla mediante `gateway.controlUi.embedSandbox`:

<Tabs>
  <Tab title="strict">
    Desactiva la ejecución de scripts dentro de las incrustaciones alojadas.
  </Tab>
  <Tab title="scripts (default)">
    Permite incrustaciones interactivas mientras mantiene el aislamiento de origen; suele ser suficiente para juegos/widgets de navegador autónomos.
  </Tab>
  <Tab title="trusted">
    Añade `allow-same-origin` además de `allow-scripts` para documentos del mismo sitio que necesitan intencionalmente privilegios más fuertes.
  </Tab>
</Tabs>

```json5
{
  gateway: {
    controlUi: {
      embedSandbox: "scripts",
    },
  },
}
```

<Warning>
Usa `trusted` solo cuando el documento incrustado realmente necesita comportamiento de mismo origen. Para la mayoría de los juegos generados por agentes y lienzos interactivos, `scripts` es la opción más segura.
</Warning>

Las URL absolutas externas de incrustación `http(s)` permanecen bloqueadas por defecto. Para permitir que `[embed url="https://..."]` cargue páginas de terceros, establece `gateway.controlUi.allowExternalEmbedUrls: true`.

## Ancho de mensajes de chat

Los mensajes de chat agrupados usan un ancho máximo predeterminado legible. Los despliegues en monitores anchos pueden anularlo sin parchear el CSS incluido estableciendo `gateway.controlUi.chatMessageMaxWidth`:

```json5
{
  gateway: {
    controlUi: {
      chatMessageMaxWidth: "min(1280px, 82%)",
    },
  },
}
```

El valor se valida antes de llegar al navegador. Las formas admitidas incluyen longitudes simples y porcentajes como `960px` o `82%`, además de expresiones de ancho restringidas `min(...)`, `max(...)`, `clamp(...)`, `calc(...)` y `fit-content(...)`.

## Acceso tailnet (recomendado)

<Tabs>
  <Tab title="Tailscale Serve integrado (preferido)">
    Mantén el Gateway en loopback y deja que Tailscale Serve lo proxifique con HTTPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Abre `https://<magicdns>/` (o tu `gateway.controlUi.basePath` configurado).

    De forma predeterminada, las solicitudes de Serve de la interfaz de control/WebSocket pueden autenticarse mediante cabeceras de identidad de Tailscale (`tailscale-user-login`) cuando `gateway.auth.allowTailscale` es `true`. OpenClaw verifica la identidad resolviendo la dirección `x-forwarded-for` con `tailscale whois` y comparándola con la cabecera, y solo las acepta cuando la solicitud llega a loopback con las cabeceras `x-forwarded-*` de Tailscale. Para sesiones de operador de la interfaz de control con identidad de dispositivo del navegador, esta ruta de Serve verificada también omite la ida y vuelta del emparejamiento de dispositivo; los navegadores sin dispositivo y las conexiones con rol de nodo siguen las comprobaciones de dispositivo normales. Establece `gateway.auth.allowTailscale: false` si quieres exigir credenciales explícitas de secreto compartido incluso para el tráfico de Serve, y luego usa `gateway.auth.mode: "token"` o `"password"`.

    Para esa ruta asíncrona de identidad de Serve, los intentos de autenticación fallidos para la misma IP de cliente y el mismo ámbito de autenticación se serializan antes de las escrituras del límite de tasa. Por tanto, los reintentos incorrectos concurrentes desde el mismo navegador pueden mostrar `retry later` en la segunda solicitud en lugar de dos incompatibilidades simples compitiendo en paralelo.

    <Warning>
    La autenticación Serve sin token asume que el host del gateway es de confianza. Si puede ejecutarse código local no confiable en ese host, exige autenticación con token/contraseña.
    </Warning>

  </Tab>
  <Tab title="Vincular a tailnet + token">
    ```bash
    openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
    ```

    Abre `http://<tailscale-ip>:18789/` (o tu `gateway.controlUi.basePath` configurado).

    Pega el secreto compartido correspondiente en la configuración de la interfaz de usuario (enviado como `connect.params.auth.token` o `connect.params.auth.password`).

  </Tab>
</Tabs>

## HTTP inseguro

Si abres el panel mediante HTTP sin cifrar (`http://<lan-ip>` o `http://<tailscale-ip>`), el navegador se ejecuta en un **contexto no seguro** y bloquea WebCrypto. De forma predeterminada, OpenClaw **bloquea** las conexiones de la interfaz de control sin identidad de dispositivo.

Excepciones documentadas:

- compatibilidad HTTP insegura solo para localhost con `gateway.controlUi.allowInsecureAuth=true`
- autenticación correcta de operador de la interfaz de control mediante `gateway.auth.mode: "trusted-proxy"`
- emergencia `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**Corrección recomendada:** usa HTTPS (Tailscale Serve) o abre la interfaz de usuario localmente en `https://<magicdns>/` (Serve) o `http://127.0.0.1:18789/` (en el host del gateway).

<AccordionGroup>
  <Accordion title="Comportamiento del conmutador de autenticación insegura">
    ```json5
    {
      gateway: {
        controlUi: { allowInsecureAuth: true },
        bind: "tailnet",
        auth: { mode: "token", token: "replace-me" },
      },
    }
    ```

    `allowInsecureAuth` es solo un conmutador de compatibilidad local:

    - Permite que las sesiones de la interfaz de control de localhost continúen sin identidad de dispositivo en contextos HTTP no seguros.
    - No omite las comprobaciones de emparejamiento.
    - No relaja los requisitos de identidad de dispositivo remoto (no localhost).

  </Accordion>
  <Accordion title="Solo emergencia">
    ```json5
    {
      gateway: {
        controlUi: { dangerouslyDisableDeviceAuth: true },
        bind: "tailnet",
        auth: { mode: "token", token: "replace-me" },
      },
    }
    ```

    <Warning>
    `dangerouslyDisableDeviceAuth` desactiva las comprobaciones de identidad de dispositivo de la interfaz de control y es una degradación de seguridad grave. Revierte rápidamente después del uso de emergencia.
    </Warning>

  </Accordion>
  <Accordion title="Nota sobre proxy de confianza">
    - La autenticación correcta mediante proxy de confianza puede admitir sesiones de **operador** de la interfaz de control sin identidad de dispositivo.
    - Esto **no** se extiende a sesiones de la interfaz de control con rol de nodo.
    - Los proxies inversos de loopback en el mismo host siguen sin satisfacer la autenticación de proxy de confianza; consulta [Autenticación de proxy de confianza](/es/gateway/trusted-proxy-auth).

  </Accordion>
</AccordionGroup>

Consulta [Tailscale](/es/gateway/tailscale) para obtener orientación sobre la configuración de HTTPS.

## Política de seguridad de contenido

La interfaz de control incluye una política `img-src` estricta: solo se permiten recursos de **mismo origen**, URL `data:` y URL `blob:` generadas localmente. El navegador rechaza las URL de imágenes remotas `http(s)` y relativas al protocolo, y nunca emite solicitudes de red.

En la práctica:

- Los avatares y las imágenes servidos bajo rutas relativas (por ejemplo `/avatars/<id>`) siguen renderizándose, incluidas las rutas de avatares autenticadas que la interfaz de usuario obtiene y convierte en URL `blob:` locales.
- Las URL en línea `data:image/...` siguen renderizándose.
- Las URL `blob:` locales creadas por la interfaz de control siguen renderizándose.
- Las URL de avatares remotos emitidas por metadatos de canales se eliminan en los helpers de avatar de la interfaz de control y se reemplazan por el logotipo/insignia integrados, por lo que un canal comprometido o malicioso no puede forzar cargas arbitrarias de imágenes remotas desde el navegador de un operador.

Esto siempre está activado y no es configurable.

## Autenticación de la ruta de avatar

Cuando la autenticación del Gateway está configurada, el endpoint de avatar de Control UI requiere el mismo token del Gateway que el resto de la API:

- `GET /avatar/<agentId>` devuelve la imagen de avatar solo a llamadores autenticados. `GET /avatar/<agentId>?meta=1` devuelve los metadatos del avatar bajo la misma regla.
- Las solicitudes no autenticadas a cualquiera de las rutas se rechazan (igual que la ruta hermana assistant-media), por lo que la ruta de avatar no puede filtrar la identidad del agente en hosts que de otro modo están protegidos.
- Control UI reenvía el token del Gateway como encabezado bearer al obtener avatares, y usa URL de blob autenticadas para que la imagen siga renderizándose en los paneles.

Si desactivas la autenticación del Gateway (no recomendado en hosts compartidos), la ruta de avatar también queda sin autenticación, de acuerdo con el resto del Gateway.

## Autenticación de la ruta de medios del asistente

Cuando la autenticación del Gateway está configurada, las vistas previas de medios locales del asistente usan una ruta de dos pasos:

- `GET /__openclaw__/assistant-media?meta=1&source=<path>` requiere la autenticación normal del operador de Control UI; el navegador envía el token del Gateway como encabezado bearer al comprobar la disponibilidad.
- Las respuestas de metadatos correctas incluyen un `mediaTicket` de corta duración limitado a esa ruta de origen exacta.
- Las URL de imágenes, audio, video y documentos renderizadas por el navegador usan `mediaTicket=<ticket>` en lugar del token o la contraseña activos del Gateway. El ticket caduca rápidamente y no puede autorizar un origen diferente.

Esto mantiene la renderización de medios compatible con los elementos multimedia nativos del navegador sin poner credenciales reutilizables del Gateway en URL de medios visibles.

## Compilar la UI

El Gateway sirve archivos estáticos desde `dist/control-ui`:

```bash
pnpm ui:build
```

Base absoluta opcional (URL de recursos fijas):

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

Desarrollo local (servidor de desarrollo separado):

```bash
pnpm ui:dev
```

Luego apunta la UI a la URL WS de tu Gateway (por ejemplo, `ws://127.0.0.1:18789`).

## Página en blanco de Control UI

Si el navegador carga un panel en blanco y DevTools no muestra ningún error útil, una extensión o un script de contenido temprano puede haber impedido que la aplicación del módulo JavaScript se evaluara. La página estática incluye un panel de recuperación HTML simple que aparece cuando `<openclaw-app>` no está registrado después del arranque.

Usa la acción **Try again** del panel después de cambiar el entorno del navegador, o recarga manualmente después de estas comprobaciones:

- Desactiva las extensiones que se inyectan en todas las páginas, especialmente las extensiones con scripts de contenido `<all_urls>`.
- Prueba una ventana privada, un perfil de navegador limpio u otro navegador.
- Mantén el Gateway en ejecución y verifica la misma URL del panel después del cambio de navegador.

## Depuración/pruebas: servidor de desarrollo + Gateway remoto

Control UI son archivos estáticos; el destino WebSocket es configurable y puede diferir del origen HTTP. Esto resulta práctico cuando quieres usar el servidor de desarrollo de Vite localmente pero el Gateway se ejecuta en otro lugar.

<Steps>
  <Step title="Start the UI dev server">
    ```bash
    pnpm ui:dev
    ```
  </Step>
  <Step title="Open with gatewayUrl">
    ```text
    http://localhost:5173/?gatewayUrl=ws%3A%2F%2F<gateway-host>%3A18789
    ```

    Autenticación opcional de una sola vez (si es necesaria):

    ```text
    http://localhost:5173/?gatewayUrl=wss%3A%2F%2F<gateway-host>%3A18789#token=<gateway-token>
    ```

  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Notes">
    - `gatewayUrl` se almacena en localStorage después de la carga y se elimina de la URL.
    - Si pasas un endpoint `ws://` o `wss://` completo mediante `gatewayUrl`, codifica el valor como URL para que el navegador analice correctamente la cadena de consulta.
    - `token` debe pasarse mediante el fragmento de URL (`#token=...`) siempre que sea posible. Los fragmentos no se envían al servidor, lo que evita filtraciones en registros de solicitudes y Referer. Los parámetros de consulta heredados `?token=` todavía se importan una vez por compatibilidad, pero solo como alternativa, y se eliminan inmediatamente después del arranque.
    - `password` se mantiene solo en memoria.
    - Cuando `gatewayUrl` está definido, la UI no recurre a credenciales de configuración ni de entorno. Proporciona `token` (o `password`) explícitamente; la falta de credenciales explícitas es un error.
    - Usa `wss://` cuando el Gateway esté detrás de TLS (Tailscale Serve, proxy HTTPS, etc.).
    - `gatewayUrl` solo se acepta en una ventana de nivel superior (no incrustada), para evitar clickjacking.
    - Los despliegues públicos no loopback de Control UI deben definir `gateway.controlUi.allowedOrigins` explícitamente (orígenes completos). Las cargas privadas de LAN/Tailnet de mismo origen desde loopback, RFC1918/link-local, `.local`, `.ts.net` o hosts CGNAT de Tailscale se aceptan sin habilitar la alternativa de encabezado Host.
    - El arranque del Gateway puede sembrar orígenes locales como `http://localhost:<port>` y `http://127.0.0.1:<port>` desde el enlace y puerto efectivos del runtime, pero los orígenes de navegadores remotos aún necesitan entradas explícitas.
    - No uses `gateway.controlUi.allowedOrigins: ["*"]` salvo para pruebas locales estrictamente controladas; significa permitir cualquier origen de navegador, no "coincidir con cualquier host que esté usando".
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` habilita el modo alternativo de origen por encabezado Host, pero es un modo de seguridad peligroso.

  </Accordion>
</AccordionGroup>

```json5
{
  gateway: {
    controlUi: {
      allowedOrigins: ["http://localhost:5173"],
    },
  },
}
```

Detalles de configuración de acceso remoto: [Acceso remoto](/es/gateway/remote).

## Relacionado

- [Panel](/es/web/dashboard) — panel del Gateway
- [Comprobaciones de estado](/es/gateway/health) — monitoreo de estado del Gateway
- [TUI](/es/web/tui) — interfaz de usuario de terminal
- [WebChat](/es/web/webchat) — interfaz de chat basada en navegador

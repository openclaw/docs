---
read_when:
    - Necesitas el contrato de soporte en tiempo de ejecución del arnés de Codex
    - Estás depurando herramientas nativas de Codex, hooks, Compaction o la carga de comentarios.
    - Estás cambiando el comportamiento de Plugin en los turnos del arnés de OpenClaw y Codex
summary: Límites de runtime, hooks, herramientas, permisos y diagnósticos para el arnés de Codex
title: Entorno de ejecución del arnés de Codex
x-i18n:
    generated_at: "2026-07-04T20:24:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c681de59a53b85402e95b1d3f2aa853e78989185ad05cf1f0497814be5959232
    source_path: plugins/codex-harness-runtime.md
    workflow: 16
---

Esta página documenta el contrato de runtime para turnos del arnés Codex. Para la configuración y el enrutamiento, comienza con [Arnés Codex](/es/plugins/codex-harness). Para los campos de configuración, consulta [Referencia del arnés Codex](/es/plugins/codex-harness-reference).

## Descripción general

El modo Codex no es OpenClaw con una llamada a otro modelo por debajo. Codex posee una mayor parte del bucle nativo del modelo, y OpenClaw adapta sus superficies de plugin, herramientas, sesión y diagnóstico alrededor de ese límite.

OpenClaw sigue siendo responsable del enrutamiento de canales, los archivos de sesión, la entrega de mensajes visibles, las herramientas dinámicas de OpenClaw, las aprobaciones, la entrega de medios y un reflejo de la transcripción. Codex posee el hilo nativo canónico, el bucle nativo del modelo, la continuación nativa de herramientas y la Compaction nativa.

El enrutamiento de prompts sigue el runtime seleccionado, no solo la cadena del proveedor. Un turno nativo de Codex recibe instrucciones de desarrollador del servidor de aplicación de Codex, mientras que una ruta explícita de compatibilidad de OpenClaw mantiene el prompt de sistema normal de OpenClaw incluso cuando usa autenticación o transporte OpenAI con estilo Codex.

Codex nativo conserva las instrucciones base/modelo propiedad de Codex y el comportamiento de documentos de proyecto según la configuración activa del hilo de Codex. OpenClaw inicia y reanuda hilos nativos de Codex con la personalidad integrada de Codex deshabilitada para que los archivos de personalidad del espacio de trabajo y la identidad del agente de OpenClaw sigan siendo autoritativos. Las ejecuciones ligeras de OpenClaw siguen conservando su supresión existente de documentos de proyecto. Las instrucciones de desarrollador de OpenClaw cubren aspectos del runtime de OpenClaw como la entrega al canal de origen, las herramientas dinámicas de OpenClaw, la delegación ACP, el contexto del adaptador y los archivos de perfil del espacio de trabajo del agente activo. Los catálogos de Skills de OpenClaw y los punteros `MEMORY.md` enrutados por herramientas se proyectan como instrucciones de desarrollador de colaboración con alcance de turno para Codex nativo. El contenido activo de `BOOTSTRAP.md` y la inyección alternativa completa de `MEMORY.md` siguen usando contexto de referencia de entrada del turno.

## Enlaces de hilos y cambios de modelo

Cuando una sesión de OpenClaw se adjunta a un hilo existente de Codex, el siguiente turno vuelve a enviar al servidor de aplicación el modelo OpenAI, la política de aprobación, el sandbox y el nivel de servicio seleccionados actualmente. Cambiar de `openai/gpt-5.5` a `openai/gpt-5.2` conserva el enlace del hilo, pero pide a Codex que continúe con el modelo recién seleccionado.

## Respuestas visibles y Heartbeats

Cuando un turno de chat directo/de origen se ejecuta mediante el arnés Codex, las respuestas visibles usan de forma predeterminada la entrega automática del asistente final para las superficies internas de WebChat. Esto mantiene Codex alineado con el contrato de prompt del arnés Pi: los agentes responden normalmente, y OpenClaw publica el texto final en la conversación de origen. Establece `messages.visibleReplies: "message_tool"` cuando un chat directo/de origen deba mantener intencionalmente privado el texto final del asistente salvo que el agente llame a `message(action="send")`.

Los turnos de Heartbeat de Codex también reciben `heartbeat_respond` en el catálogo buscable de herramientas de OpenClaw de forma predeterminada, para que el agente pueda registrar si el despertar debe permanecer silencioso o notificar sin codificar ese flujo de control en el texto final.

La guía de iniciativa específica de Heartbeat se envía como una instrucción de desarrollador de modo de colaboración de Codex en el propio turno de Heartbeat. Los turnos de chat ordinarios restauran el modo Default de Codex en lugar de llevar la filosofía de Heartbeat en su prompt de runtime normal. Cuando existe un `HEARTBEAT.md` no vacío, las instrucciones de modo de colaboración de Heartbeat apuntan Codex al archivo en lugar de insertar su contenido en línea.

## Límites de hooks

El arnés Codex tiene tres capas de hooks:

| Capa                                  | Propietario               | Propósito                                                           |
| ------------------------------------- | ------------------------- | ------------------------------------------------------------------- |
| Hooks de plugins de OpenClaw          | OpenClaw                  | Compatibilidad de producto/plugin entre arneses OpenClaw y Codex.   |
| Middleware de extensión del servidor de aplicación de Codex | Plugins incluidos con OpenClaw | Comportamiento del adaptador por turno alrededor de herramientas dinámicas de OpenClaw. |
| Hooks nativos de Codex                | Codex                     | Ciclo de vida de bajo nivel de Codex y política de herramientas nativas desde la configuración de Codex. |

OpenClaw no usa archivos `hooks.json` de proyecto o globales de Codex para enrutar el comportamiento de plugins de OpenClaw. Para el puente admitido de herramientas nativas y permisos, OpenClaw inyecta configuración de Codex por hilo para `PreToolUse`, `PostToolUse`, `PermissionRequest` y `Stop`.

Cuando las aprobaciones del servidor de aplicación de Codex están habilitadas, es decir, cuando `approvalPolicy` no es `"never"`, la configuración predeterminada de hooks nativos inyectada omite `PermissionRequest` para que el revisor del servidor de aplicación de Codex y el puente de aprobaciones de OpenClaw gestionen las escaladas reales después de la revisión. Los operadores pueden agregar explícitamente `permission_request` a `nativeHookRelay.events` cuando necesiten el relé de compatibilidad.

Otros hooks de Codex, como `SessionStart` y `UserPromptSubmit`, siguen siendo controles de nivel Codex. No se exponen como hooks de plugins de OpenClaw en el contrato v1.

Para las herramientas dinámicas de OpenClaw, OpenClaw ejecuta la herramienta después de que Codex solicita la llamada, por lo que OpenClaw dispara el comportamiento de plugin y middleware que posee en el adaptador del arnés. Para las herramientas nativas de Codex, Codex posee el registro canónico de la herramienta. OpenClaw puede reflejar eventos seleccionados, pero no puede reescribir el hilo nativo de Codex salvo que Codex exponga esa operación mediante el servidor de aplicación o callbacks de hooks nativos.

Los eventos `PreToolUse` en modo de informe del servidor de aplicación de Codex delegan las solicitudes de aprobación de plugins a la aprobación correspondiente del servidor de aplicación. Si un hook `before_tool_call` de OpenClaw devuelve `requireApproval` mientras la carga nativa establece el modo de aprobación de informe (`openclaw_approval_mode` es `"report"`), el relé de hooks nativos registra el requisito de aprobación del plugin y no devuelve ninguna decisión nativa. Cuando Codex envía la solicitud de aprobación del servidor de aplicación para el mismo uso de herramienta, OpenClaw abre el prompt de aprobación del plugin y asigna la decisión de vuelta a Codex. Los eventos `PermissionRequest` de Codex son una ruta de aprobación independiente y aún pueden enrutarse mediante aprobaciones de OpenClaw cuando el runtime está configurado para ese puente.

Las notificaciones de elementos del servidor de aplicación de Codex también proporcionan observaciones asíncronas `after_tool_call` para finalizaciones de herramientas nativas que aún no están cubiertas por el relé nativo `PostToolUse`. Estas observaciones son solo para telemetría y compatibilidad de plugins; no pueden bloquear, retrasar ni mutar la llamada nativa de herramienta.

Las proyecciones de Compaction y del ciclo de vida del LLM provienen de notificaciones del servidor de aplicación de Codex y del estado del adaptador de OpenClaw, no de comandos de hooks nativos de Codex. Los eventos `before_compaction`, `after_compaction`, `llm_input` y `llm_output` de OpenClaw son observaciones de nivel adaptador, no capturas byte a byte de la solicitud interna o las cargas de Compaction de Codex.

Las notificaciones del servidor de aplicación `hook/started` y `hook/completed` nativas de Codex se proyectan como eventos de agente `codex_app_server.hook` para trayectoria y depuración. No invocan hooks de plugins de OpenClaw.

## Contrato de soporte v1

Compatible con el runtime Codex v1:

| Superficie                                    | Compatibilidad                                                                   | Motivo                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| --------------------------------------------- | -------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Bucle de modelo de OpenAI mediante Codex      | Compatible                                                                       | Codex app-server es propietario del turno de OpenAI, la reanudación nativa del hilo y la continuación nativa de herramientas.                                                                                                                                                                                                                                                                                                                                                         |
| Enrutamiento y entrega de canales de OpenClaw | Compatible                                                                       | Telegram, Discord, Slack, WhatsApp, iMessage y otros canales permanecen fuera del entorno de ejecución del modelo.                                                                                                                                                                                                                                                                                                                                                                     |
| Herramientas dinámicas de OpenClaw            | Compatible                                                                       | Codex pide a OpenClaw que ejecute estas herramientas, por lo que OpenClaw permanece en la ruta de ejecución.                                                                                                                                                                                                                                                                                                                                                                           |
| Plugins de prompt y contexto                  | Compatible                                                                       | OpenClaw proyecta el prompt/contexto específico de OpenClaw en el turno de Codex, mientras deja los prompts base, de modelo y de documentación de proyecto configurada, propiedad de Codex, en la ruta nativa de Codex. OpenClaw desactiva la personalidad integrada de Codex para hilos nativos, de modo que los archivos de personalidad del espacio de trabajo del agente sigan siendo autoritativos. Las instrucciones de desarrollador nativas de Codex aceptan solo orientación de comandos explícitamente acotada a `codex_app_server`; las sugerencias de comandos globales heredadas permanecen para superficies de prompt que no son de Codex. |
| Ciclo de vida del motor de contexto           | Compatible                                                                       | El ensamblaje, la ingesta y el mantenimiento posterior al turno se ejecutan alrededor de los turnos de Codex. Los motores de contexto no reemplazan la Compaction nativa de Codex.                                                                                                                                                                                                                                                                                                    |
| Enlaces de herramientas dinámicas             | Compatible                                                                       | `before_tool_call`, `after_tool_call` y el middleware de resultado de herramienta se ejecutan alrededor de las herramientas dinámicas propiedad de OpenClaw.                                                                                                                                                                                                                                                                                                                           |
| Enlaces de ciclo de vida                      | Compatible como observaciones del adaptador                                      | `llm_input`, `llm_output`, `agent_end`, `before_compaction` y `after_compaction` se disparan con cargas útiles honestas en modo Codex.                                                                                                                                                                                                                                                                                                                                                  |
| Puerta de revisión de respuesta final         | Compatible mediante retransmisión de enlace nativo                               | El `Stop` de Codex se retransmite a `before_agent_finalize`; `revise` pide a Codex una pasada más del modelo antes de la finalización.                                                                                                                                                                                                                                                                                                                                                 |
| Bloqueo u observación de shell, patch y MCP nativos | Compatible mediante retransmisión de enlace nativo                          | `PreToolUse` y `PostToolUse` de Codex se retransmiten para superficies de herramientas nativas confirmadas, incluidas las cargas útiles MCP en Codex app-server `0.125.0` o posterior. El bloqueo es compatible; la reescritura de argumentos no lo es.                                                                                                                                                                                                                              |
| Política de permisos nativa                   | Compatible mediante aprobaciones de Codex app-server y retransmisión compatible de enlace nativo | Las solicitudes de aprobación de Codex app-server se enrutan mediante OpenClaw después de la revisión de Codex. La retransmisión del enlace nativo `PermissionRequest` es opcional para los modos de aprobación nativos porque Codex la emite antes de la revisión del guardián.                                                                                                                                                                                                       |
| Captura de trayectoria de app-server          | Compatible                                                                       | OpenClaw registra la solicitud que envió a app-server y las notificaciones de app-server que recibe.                                                                                                                                                                                                                                                                                                                                                                                   |

No compatible en el entorno de ejecución Codex v1:

| Superficie                                           | Límite de V1                                                                                                                                      | Ruta futura                                                                               |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Mutación de argumentos de herramientas nativas       | Los enlaces nativos previos a herramienta de Codex pueden bloquear, pero OpenClaw no reescribe argumentos de herramientas nativas de Codex.       | Requiere compatibilidad de enlaces/esquema de Codex para entrada de herramienta de reemplazo. |
| Historial editable de transcripción nativa de Codex  | Codex es propietario del historial canónico de hilos nativos. OpenClaw es propietario de una réplica y puede proyectar contexto futuro, pero no debería mutar elementos internos no compatibles. | Agregar API explícitas de Codex app-server si se necesita cirugía de hilos nativos.       |
| `tool_result_persist` para registros de herramientas nativas de Codex | Ese enlace transforma escrituras de transcripción propiedad de OpenClaw, no registros de herramientas nativas de Codex.                          | Podría reflejar registros transformados, pero la reescritura canónica necesita compatibilidad de Codex. |
| Metadatos enriquecidos de Compaction nativa          | OpenClaw puede solicitar Compaction nativa, pero no recibe una lista estable de conservados/descartados, delta de tokens, resumen de finalización ni carga útil de resumen. | Necesita eventos de Compaction de Codex más enriquecidos.                                  |
| Intervención de Compaction                           | OpenClaw no permite que los plugins ni los motores de contexto veten, reescriban o reemplacen la Compaction nativa de Codex.                    | Agregar enlaces previos/posteriores de Compaction de Codex si los plugins necesitan vetar o reescribir la Compaction nativa. |
| Captura byte por byte de solicitud de API de modelo  | OpenClaw puede capturar solicitudes y notificaciones de app-server, pero el núcleo de Codex construye internamente la solicitud final a la API de OpenAI. | Necesita un evento de rastreo de solicitud de modelo de Codex o una API de depuración.    |

## Permisos nativos y elicitaciones MCP

Para `PermissionRequest`, OpenClaw solo devuelve decisiones explícitas de permitir o denegar
cuando la política decide. Un resultado sin decisión no es una autorización. Codex lo trata como
ausencia de decisión del enlace y continúa hacia su propio guardián o ruta de aprobación de usuario.

Los modos de aprobación de Codex app-server omiten este enlace nativo de forma predeterminada. Este comportamiento
se aplica cuando `permission_request` se incluye explícitamente en
`nativeHookRelay.events` o cuando un entorno de ejecución de compatibilidad lo instala.

Cuando un operador elige `allow-always` para una solicitud de permiso nativa de Codex,
OpenClaw recuerda esa huella exacta de proveedor/sesión/entrada de herramienta/cwd durante una
ventana de sesión acotada. La decisión recordada es intencionalmente solo de coincidencia exacta:
un comando, argumentos, carga útil de herramienta o cwd cambiados crean una aprobación nueva.

Las elicitaciones de aprobación de herramientas MCP de Codex se enrutan mediante el flujo de
aprobación de plugins de OpenClaw cuando Codex marca `_meta.codex_approval_kind` como
`"mcp_tool_call"`. Los prompts `request_user_input` de Codex se envían de vuelta al chat
de origen, y el siguiente mensaje de seguimiento en cola responde a esa solicitud del servidor
nativo en lugar de dirigirse como contexto adicional. Otras solicitudes de elicitación MCP
fallan en modo cerrado.

Para el flujo general de aprobación de plugins que transporta estos prompts, consulta
[Solicitudes de permisos de Plugin](/es/plugins/plugin-permission-requests).

## Dirección de cola

La dirección de cola de ejecuciones activas se asigna a `turn/steer` de Codex app-server. Con el
valor predeterminado `messages.queue.mode: "steer"`, OpenClaw agrupa los mensajes de chat en
modo steer durante la ventana de silencio configurada y los envía como una sola solicitud
`turn/steer` en orden de llegada.

La revisión de Codex y los turnos de Compaction manual pueden rechazar el direccionamiento en el mismo turno. En ese caso, OpenClaw espera a que la ejecución activa termine antes de iniciar el prompt. Usa `/queue followup` o `/queue collect` cuando los mensajes deban ponerse en cola de forma predeterminada en lugar de dirigir el turno. Consulta [Cola de direccionamiento](/es/concepts/queue-steering).

## Carga de comentarios de Codex

Cuando se aprueba `/diagnostics [note]` para una sesión que usa el arnés nativo de Codex, OpenClaw también llama a `feedback/upload` del servidor de aplicaciones de Codex para los hilos de Codex relevantes. La carga solicita al servidor de aplicaciones que incluya registros de cada hilo enumerado y de los subhilos de Codex generados cuando estén disponibles.

La carga pasa por la ruta normal de comentarios de Codex hacia los servidores de OpenAI. Si los comentarios de Codex están deshabilitados en ese servidor de aplicaciones, el comando devuelve el error del servidor de aplicaciones. La respuesta de diagnóstico completada enumera los canales, los ids de sesión de OpenClaw, los ids de hilo de Codex y los comandos locales `codex resume <thread-id>` para los hilos enviados.

Si rechazas o ignoras la aprobación, OpenClaw no imprime esos ids de Codex y no envía comentarios de Codex. La carga no reemplaza la exportación de diagnósticos local de Gateway. Consulta [Exportación de diagnósticos](/es/gateway/diagnostics) para conocer el comportamiento de aprobación, privacidad, paquete local y chat grupal.

Usa `/codex diagnostics [note]` solo cuando quieras específicamente la carga de comentarios de Codex para el hilo adjunto actualmente sin el paquete completo de diagnósticos de Gateway.

## Compaction y espejo de transcripción

Cuando el modelo seleccionado usa el arnés de Codex, la Compaction de hilo nativa pertenece al servidor de aplicaciones de Codex. OpenClaw no ejecuta Compaction previa para los turnos de Codex, no reemplaza la Compaction de Codex con la Compaction del motor de contexto y no recurre a OpenClaw ni a la resumición pública de OpenAI cuando no se puede iniciar la Compaction nativa de Codex. OpenClaw mantiene un espejo de transcripción para el historial de canales, la búsqueda, `/new`, `/reset` y futuros cambios de modelo o arnés.

Las solicitudes explícitas de Compaction, como `/compact` o una operación manual de compactación solicitada por un Plugin, inician la Compaction nativa de Codex con `thread/compact/start`. OpenClaw mantiene abiertas la solicitud y la concesión del cliente compartido hasta que Codex emite el elemento de finalización `contextCompaction` correspondiente y luego informa el turno de Compaction como completado. Si ese turno terminal supera el tiempo de espera de Compaction configurado, OpenClaw solicita una interrupción de turno nativa. La concesión y la barrera de Compaction por hilo permanecen retenidas hasta que Codex informa el estado terminal o confirma el RPC de interrupción. Si Codex no confirma dentro del periodo de gracia de interrupción, OpenClaw retira la conexión antes de liberar la barrera. Las conexiones remotas también desacoplan la vinculación del hilo correspondiente para que el trabajo posterior no pueda solaparse con un turno remoto no confirmado. Otros turnos en una conexión retirada fallan y pueden reintentarse en un cliente nuevo. El cierre del cliente, la cancelación de la solicitud o un turno de Compaction fallido devuelven una operación fallida.

Cuando un motor de contexto solicita la proyección de arranque de hilo de Codex, OpenClaw proyecta nombres e ids de llamadas a herramientas, formas de entrada y contenido redactado de resultados de herramientas en el hilo nuevo de Codex. No copia valores sin procesar de argumentos de llamadas a herramientas en esa proyección.

El espejo incluye el prompt del usuario, el texto final del asistente y registros ligeros de razonamiento o plan de Codex cuando el servidor de aplicaciones los emite. OpenClaw registra el inicio y el estado terminal de la Compaction nativa, pero no expone un resumen de Compaction legible por humanos ni una lista auditable de las entradas que Codex conservó después de la Compaction.

Como Codex posee el hilo nativo canónico, `tool_result_persist` actualmente no reescribe registros de resultados de herramientas nativos de Codex. Solo se aplica cuando OpenClaw escribe un resultado de herramienta en la transcripción de una sesión propiedad de OpenClaw.

## Medios y entrega

OpenClaw sigue siendo propietario de la entrega de medios y de la selección del proveedor de medios. La comprensión de imágenes, video, música, PDF, TTS y medios usa la configuración de proveedor/modelo correspondiente, como `agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel` y `messages.tts`.

El texto, las imágenes, el video, la música, TTS, las aprobaciones y la salida de herramientas de mensajería continúan por la ruta normal de entrega de OpenClaw. La generación de medios no requiere el entorno de ejecución heredado. Cuando Codex emite un elemento nativo de generación de imágenes con un `savedPath`, OpenClaw reenvía ese archivo exacto por la ruta normal de medios de respuesta aunque el turno de Codex no tenga texto del asistente.

## Relacionado

- [Arnés de Codex](/es/plugins/codex-harness)
- [Referencia del arnés de Codex](/es/plugins/codex-harness-reference)
- [Plugins nativos de Codex](/es/plugins/codex-native-plugins)
- [Ganchos de Plugin](/es/plugins/hooks)
- [Plugins de arnés de agente](/es/plugins/sdk-agent-harness)
- [Exportación de diagnósticos](/es/gateway/diagnostics)
- [Exportación de trayectoria](/es/tools/trajectory)

---
read_when:
    - Necesitas el contrato de soporte en tiempo de ejecución del arnés de Codex
    - Estás depurando herramientas nativas de Codex, hooks, Compaction o la carga de comentarios
    - Estás cambiando el comportamiento del plugin en turnos del arnés de OpenClaw y Codex
summary: Límites de ejecución, hooks, herramientas, permisos y diagnósticos para el arnés de Codex
title: Tiempo de ejecución del arnés de Codex
x-i18n:
    generated_at: "2026-06-27T12:09:32Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 84bca37f41003fd78a8e272cb8a54db05e780fab027af60d2ce058cc472ec001
    source_path: plugins/codex-harness-runtime.md
    workflow: 16
---

Esta página documenta el contrato de runtime para los turnos del arnés de Codex. Para la configuración y el enrutamiento,
empieza con [Arnés de Codex](/es/plugins/codex-harness). Para los campos de configuración,
consulta [Referencia del arnés de Codex](/es/plugins/codex-harness-reference).

## Descripción general

El modo Codex no es OpenClaw con una llamada a un modelo distinto por debajo. Codex posee una parte mayor del
bucle nativo del modelo, y OpenClaw adapta sus superficies de plugin, herramientas, sesión y
diagnóstico alrededor de ese límite.

OpenClaw sigue siendo propietario del enrutamiento de canales, los archivos de sesión, la entrega de mensajes visibles,
las herramientas dinámicas de OpenClaw, las aprobaciones, la entrega de medios y un espejo de transcripción.
Codex posee el hilo nativo canónico, el bucle nativo del modelo, la continuación de herramientas nativas
y la Compaction nativa.

El enrutamiento de prompts sigue el runtime seleccionado, no solo la cadena del proveedor. Un
turno nativo de Codex recibe instrucciones de desarrollador del servidor de apps de Codex, mientras que una
ruta explícita de compatibilidad con OpenClaw conserva el prompt de sistema normal de OpenClaw incluso
cuando usa autenticación o transporte de OpenAI con sabor Codex.

Codex nativo conserva las instrucciones base/de modelo y el comportamiento de documentación de proyecto propiedad de Codex
según la configuración activa del hilo de Codex. OpenClaw inicia y reanuda hilos nativos de
Codex con la personalidad integrada de Codex deshabilitada para que los archivos de personalidad del espacio de trabajo
y la identidad del agente de OpenClaw sigan siendo autoritativos. Las ejecuciones ligeras de
OpenClaw siguen preservando su supresión existente de documentación de proyecto. Las instrucciones de desarrollador de OpenClaw
cubren preocupaciones del runtime de OpenClaw como la entrega del canal de origen,
las herramientas dinámicas de OpenClaw, la delegación ACP, el contexto del adaptador y los
archivos de perfil del espacio de trabajo del agente activo. Los catálogos de Skills de OpenClaw y los punteros
`MEMORY.md` enrutados por herramientas se proyectan como instrucciones de desarrollador de colaboración con alcance de turno
para Codex nativo. El contenido activo de `BOOTSTRAP.md` y la inyección de reserva completa de
`MEMORY.md` siguen usando el contexto de referencia de la entrada del turno.

## Enlaces de hilo y cambios de modelo

Cuando una sesión de OpenClaw se adjunta a un hilo existente de Codex, el siguiente turno
envía de nuevo al servidor de apps el modelo de OpenAI, la política de aprobación, el sandbox y el nivel de servicio
seleccionados actualmente. Cambiar de `openai/gpt-5.5` a
`openai/gpt-5.2` mantiene el enlace del hilo, pero pide a Codex que continúe con el
modelo recién seleccionado.

## Respuestas visibles y Heartbeats

Cuando un turno de chat directo/de origen se ejecuta mediante el arnés de Codex, las respuestas visibles
usan de forma predeterminada la entrega automática del asistente final para superficies internas de WebChat.
Esto mantiene a Codex alineado con el contrato de prompt del arnés de Pi: los agentes responden
normalmente, y OpenClaw publica el texto final en la conversación de origen. Establece
`messages.visibleReplies: "message_tool"` cuando un chat directo/de origen deba
mantener intencionalmente privado el texto final del asistente salvo que el agente llame a
`message(action="send")`.

Los turnos de Heartbeat de Codex también obtienen `heartbeat_respond` en el catálogo de herramientas buscable de OpenClaw
de forma predeterminada, para que el agente pueda registrar si el despertar debe permanecer
silencioso o notificar sin codificar ese flujo de control en el texto final.

La guía de iniciativa específica de Heartbeat se envía como una instrucción de desarrollador en modo de colaboración de Codex
en el propio turno de Heartbeat. Los turnos de chat ordinarios restauran
el modo predeterminado de Codex en lugar de llevar la filosofía de Heartbeat en su
prompt de runtime normal. Cuando existe un `HEARTBEAT.md` no vacío, las instrucciones
de modo de colaboración de Heartbeat apuntan a Codex al archivo en lugar de insertar su
contenido en línea.

## Límites de hooks

El arnés de Codex tiene tres capas de hooks:

| Capa                                  | Propietario              | Propósito                                                           |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| Hooks de plugin de OpenClaw           | OpenClaw                 | Compatibilidad de producto/plugin entre los arneses de OpenClaw y Codex. |
| Middleware de extensión del servidor de apps de Codex | Plugins incluidos con OpenClaw | Comportamiento del adaptador por turno alrededor de las herramientas dinámicas de OpenClaw. |
| Hooks nativos de Codex                | Codex                    | Ciclo de vida de bajo nivel de Codex y política de herramientas nativas desde la configuración de Codex. |

OpenClaw no usa archivos `hooks.json` de proyecto o globales de Codex para enrutar
el comportamiento de plugins de OpenClaw. Para el puente admitido de herramientas nativas y permisos,
OpenClaw inyecta configuración de Codex por hilo para `PreToolUse`, `PostToolUse`,
`PermissionRequest` y `Stop`.

Cuando las aprobaciones del servidor de apps de Codex están habilitadas, es decir, `approvalPolicy` no es
`"never"`, la configuración de hook nativo inyectada predeterminada omite `PermissionRequest` para que
el revisor del servidor de apps de Codex y el puente de aprobación de OpenClaw gestionen las escalaciones
reales después de la revisión. Los operadores pueden añadir explícitamente `permission_request` a
`nativeHookRelay.events` cuando necesiten el relé de compatibilidad.

Otros hooks de Codex, como `SessionStart` y `UserPromptSubmit`, siguen siendo
controles de nivel Codex. No se exponen como hooks de plugin de OpenClaw en el contrato v1.

Para las herramientas dinámicas de OpenClaw, OpenClaw ejecuta la herramienta después de que Codex solicite la
llamada, por lo que OpenClaw dispara el comportamiento de plugin y middleware que posee en el
adaptador del arnés. Para las herramientas nativas de Codex, Codex posee el registro canónico de la herramienta.
OpenClaw puede reflejar eventos seleccionados, pero no puede reescribir el hilo nativo de Codex
salvo que Codex exponga esa operación mediante el servidor de apps o callbacks de hooks nativos.

Los eventos `PreToolUse` en modo de informe del servidor de apps de Codex aplazan las solicitudes de aprobación de plugin
a la aprobación correspondiente del servidor de apps. Si un hook `before_tool_call` de OpenClaw
devuelve `requireApproval` mientras la carga nativa establece el modo de aprobación de informe
(`openclaw_approval_mode` es `"report"`), el relé de hook nativo registra el
requisito de aprobación del plugin y no devuelve ninguna decisión nativa. Cuando Codex envía la
solicitud de aprobación del servidor de apps para el mismo uso de herramienta, OpenClaw abre el prompt de aprobación
del plugin y asigna la decisión de vuelta a Codex. Los eventos `PermissionRequest` de Codex
son una ruta de aprobación separada y aún pueden enrutarse mediante aprobaciones de OpenClaw
cuando el runtime está configurado para ese puente.

Las notificaciones de elementos del servidor de apps de Codex también proporcionan observaciones asíncronas `after_tool_call`
para finalizaciones de herramientas nativas que no estén ya cubiertas por el
relé nativo `PostToolUse`. Estas observaciones son solo para telemetría y compatibilidad de plugins;
no pueden bloquear, retrasar ni mutar la llamada de herramienta nativa.

Las proyecciones de Compaction y del ciclo de vida del LLM provienen de las notificaciones del servidor de apps de Codex
y del estado del adaptador de OpenClaw, no de comandos de hooks nativos de Codex.
Los eventos `before_compaction`, `after_compaction`, `llm_input` y
`llm_output` de OpenClaw son observaciones de nivel adaptador, no capturas byte por byte
de la solicitud interna o las cargas de Compaction de Codex.

Las notificaciones `hook/started` y `hook/completed` nativas de Codex del servidor de apps
se proyectan como eventos de agente `codex_app_server.hook` para trayectoria y depuración.
No invocan hooks de plugin de OpenClaw.

## Contrato de soporte V1

Compatible en Codex runtime v1:

| Superficie                                    | Compatibilidad                                                                   | Motivo                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| --------------------------------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Bucle de modelo de OpenAI mediante Codex      | Compatible                                                                       | El servidor de aplicación de Codex es propietario del turno de OpenAI, la reanudación nativa de hilos y la continuación nativa de herramientas.                                                                                                                                                                                                                                                                                                                                      |
| Enrutamiento y entrega de canales de OpenClaw | Compatible                                                                       | Telegram, Discord, Slack, WhatsApp, iMessage y otros canales permanecen fuera del runtime del modelo.                                                                                                                                                                                                                                                                                                                                                                                |
| Herramientas dinámicas de OpenClaw            | Compatible                                                                       | Codex pide a OpenClaw que ejecute estas herramientas, por lo que OpenClaw permanece en la ruta de ejecución.                                                                                                                                                                                                                                                                                                                                                                         |
| Plugins de prompt y contexto                  | Compatible                                                                       | OpenClaw proyecta el prompt/contexto específico de OpenClaw en el turno de Codex, mientras deja los prompts base, de modelo y de documentación de proyecto configurados que son propiedad de Codex en el carril nativo de Codex. OpenClaw desactiva la personalidad integrada de Codex para hilos nativos, de modo que los archivos de personalidad del espacio de trabajo del agente sigan siendo autoritativos. Las instrucciones de desarrollador nativas de Codex aceptan únicamente guía de comandos explícitamente delimitada a `codex_app_server`; las sugerencias de comandos globales heredadas permanecen para superficies de prompt no Codex. |
| Ciclo de vida del motor de contexto           | Compatible                                                                       | El ensamblaje, la ingesta y el mantenimiento posterior al turno se ejecutan alrededor de los turnos de Codex. Los motores de contexto no sustituyen la compaction nativa de Codex.                                                                                                                                                                                                                                                                                                    |
| Hooks de herramientas dinámicas               | Compatible                                                                       | `before_tool_call`, `after_tool_call` y el middleware de resultados de herramientas se ejecutan alrededor de las herramientas dinámicas propiedad de OpenClaw.                                                                                                                                                                                                                                                                                                                        |
| Hooks de ciclo de vida                        | Compatibles como observaciones del adaptador                                     | `llm_input`, `llm_output`, `agent_end`, `before_compaction` y `after_compaction` se disparan con cargas útiles honestas del modo Codex.                                                                                                                                                                                                                                                                                                                                               |
| Puerta de revisión de respuesta final         | Compatible mediante retransmisión de hook nativo                                 | Codex `Stop` se retransmite a `before_agent_finalize`; `revise` pide a Codex una pasada más del modelo antes de la finalización.                                                                                                                                                                                                                                                                                                                                                     |
| Shell, patch y MCP nativos: bloqueo u observación | Compatible mediante retransmisión de hook nativo                             | Codex `PreToolUse` y `PostToolUse` se retransmiten para superficies de herramientas nativas confirmadas, incluidas cargas útiles MCP en el servidor de aplicación de Codex `0.125.0` o posterior. Se admite el bloqueo; no se admite la reescritura de argumentos.                                                                                                                                                                                                                   |
| Política de permisos nativa                   | Compatible mediante aprobaciones del servidor de aplicación de Codex y retransmisión compatible de hooks nativos | Las solicitudes de aprobación del servidor de aplicación de Codex se enrutan a través de OpenClaw después de la revisión de Codex. La retransmisión del hook nativo `PermissionRequest` es opt-in para los modos de aprobación nativos porque Codex lo emite antes de la revisión del guardián.                                                                                                                                                                                        |
| Captura de trayectoria del servidor de aplicación | Compatible                                                                    | OpenClaw registra la solicitud que envió al servidor de aplicación y las notificaciones del servidor de aplicación que recibe.                                                                                                                                                                                                                                                                                                                                                        |

No compatible con el runtime de Codex v1:

| Superficie                                          | Límite de V1                                                                                                                                     | Ruta futura                                                                               |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------- |
| Mutación de argumentos de herramientas nativas      | Los hooks nativos previos a herramientas de Codex pueden bloquear, pero OpenClaw no reescribe argumentos de herramientas nativas de Codex.        | Requiere compatibilidad de hooks/esquemas de Codex para reemplazar la entrada de herramienta. |
| Historial editable de transcripción nativa de Codex | Codex es propietario del historial canónico de hilos nativos. OpenClaw posee un espejo y puede proyectar contexto futuro, pero no debe mutar elementos internos no compatibles. | Agregar API explícitas del servidor de aplicación de Codex si se necesita cirugía de hilos nativos. |
| `tool_result_persist` para registros de herramientas nativas de Codex | Ese hook transforma escrituras de transcripción propiedad de OpenClaw, no registros de herramientas nativas de Codex.                            | Podría reflejar registros transformados, pero la reescritura canónica necesita compatibilidad de Codex. |
| Metadatos enriquecidos de compaction nativa         | OpenClaw puede solicitar compaction nativa, pero no recibe una lista estable de conservados/descartados, delta de tokens, resumen de finalización ni carga útil de resumen. | Necesita eventos de compaction de Codex más enriquecidos.                                  |
| Intervención de compaction                          | OpenClaw no permite que los plugins o motores de contexto veten, reescriban o reemplacen la compaction nativa de Codex.                          | Agregar hooks de compaction previos/posteriores de Codex si los plugins necesitan vetar o reescribir la compaction nativa. |
| Captura byte por byte de solicitudes de API de modelo | OpenClaw puede capturar solicitudes y notificaciones del servidor de aplicación, pero el núcleo de Codex construye internamente la solicitud final a la API de OpenAI. | Necesita un evento de trazado de solicitudes de modelo de Codex o una API de depuración.   |

## Permisos nativos y elicitaciones MCP

Para `PermissionRequest`, OpenClaw solo devuelve decisiones explícitas de permitir o denegar
cuando la política decide. Un resultado sin decisión no es una autorización. Codex lo trata como ausencia de
decisión de hook y pasa a su propio guardián o ruta de aprobación del usuario.

Los modos de aprobación del servidor de aplicación de Codex omiten este hook nativo de forma predeterminada. Este comportamiento
se aplica cuando `permission_request` se incluye explícitamente en
`nativeHookRelay.events` o cuando un runtime de compatibilidad lo instala.

Cuando un operador elige `allow-always` para una solicitud de permiso nativa de Codex,
OpenClaw recuerda esa huella exacta de proveedor/sesión/entrada de herramienta/cwd durante una
ventana de sesión acotada. La decisión recordada es intencionadamente solo de coincidencia exacta:
un comando, argumentos, carga útil de herramienta o cwd modificados crean una nueva
aprobación.

Las elicitaciones de aprobación de herramientas MCP de Codex se enrutan a través del flujo de
aprobación de plugins de OpenClaw cuando Codex marca `_meta.codex_approval_kind` como
`"mcp_tool_call"`. Los prompts `request_user_input` de Codex se envían de vuelta al
chat de origen, y el siguiente mensaje de seguimiento en cola responde a esa solicitud del servidor
nativo en lugar de dirigirse como contexto adicional. Otras solicitudes de elicitación MCP
fallan cerradas.

Para el flujo general de aprobación de plugins que transporta estos prompts, consulta
[Solicitudes de permiso de Plugin](/es/plugins/plugin-permission-requests).

## Dirección de cola

La dirección de cola de ejecución activa se asigna a `turn/steer` del servidor de aplicación de Codex. Con el
valor predeterminado `messages.queue.mode: "steer"`, OpenClaw agrupa mensajes de chat en modo steer
durante la ventana de silencio configurada y los envía como una sola solicitud `turn/steer`
en orden de llegada.

Las revisiones de Codex y los turnos de Compaction manual pueden rechazar el direccionamiento en el mismo turno. En ese
caso, OpenClaw espera a que finalice la ejecución activa antes de iniciar el prompt.
Usa `/queue followup` o `/queue collect` cuando los mensajes deban ponerse en cola de forma predeterminada
en lugar de direccionarse. Consulta [Cola de direccionamiento](/es/concepts/queue-steering).

## Carga de comentarios de Codex

Cuando se aprueba `/diagnostics [note]` para una sesión que usa el arnés nativo de Codex,
OpenClaw también llama a `feedback/upload` del servidor de aplicaciones de Codex para los hilos
relevantes de Codex. La carga solicita al servidor de aplicaciones que incluya registros para cada hilo
enumerado y los subhilos de Codex generados cuando estén disponibles.

La carga pasa por la ruta normal de comentarios de Codex hacia los servidores de OpenAI. Si los comentarios
de Codex están deshabilitados en ese servidor de aplicaciones, el comando devuelve el error del servidor de aplicaciones.
La respuesta de diagnóstico completada enumera los canales, los ids de sesión de OpenClaw,
los ids de hilo de Codex y los comandos locales `codex resume <thread-id>` para los hilos
que se enviaron.

Si rechazas o ignoras la aprobación, OpenClaw no imprime esos ids de Codex y
no envía comentarios de Codex. La carga no reemplaza la exportación local de diagnósticos del Gateway.
Consulta [Exportación de diagnósticos](/es/gateway/diagnostics) para conocer el comportamiento de
aprobación, privacidad, paquete local y chat grupal.

Usa `/codex diagnostics [note]` solo cuando quieras específicamente la carga de comentarios de Codex
para el hilo adjunto actualmente sin el paquete completo de diagnósticos del Gateway.

## Compaction y espejo de transcripción

Cuando el modelo seleccionado usa el arnés de Codex, la Compaction nativa de hilos pertenece
al servidor de aplicaciones de Codex. OpenClaw no ejecuta Compaction previa para turnos de Codex,
no reemplaza la Compaction de Codex por la Compaction del motor de contexto, y no
recurre a OpenClaw ni al resumen público de OpenAI cuando no se puede iniciar la
Compaction nativa de Codex. OpenClaw mantiene un espejo de transcripción para el historial
de canales, la búsqueda, `/new`, `/reset` y el cambio futuro de modelo o arnés.

Las solicitudes explícitas de Compaction, como `/compact` o una operación de compactación manual
solicitada por un plugin, inician la Compaction nativa de Codex con `thread/compact/start`.
OpenClaw devuelve el control después de iniciar esa operación nativa. No espera a que
termine, no impone un tiempo de espera separado de OpenClaw, no reinicia el servidor de aplicaciones
compartido de Codex ni registra la operación como una Compaction completada por OpenClaw.

Cuando un motor de contexto solicita la proyección de arranque de hilo de Codex, OpenClaw
proyecta nombres e ids de llamadas a herramientas, formas de entrada y contenido redactado de resultados
de herramientas en el hilo nuevo de Codex. No copia valores sin procesar de argumentos de llamadas a herramientas
en esa proyección.

El espejo incluye el prompt del usuario, el texto final del asistente y registros ligeros de razonamiento
o plan de Codex cuando el servidor de aplicaciones los emite. Actualmente, OpenClaw solo
registra señales explícitas de inicio de Compaction nativa cuando solicita Compaction. No
expone un resumen de Compaction legible por humanos ni una lista auditable de
qué entradas conservó Codex después de la Compaction.

Como Codex es propietario del hilo nativo canónico, `tool_result_persist` no
reescribe actualmente registros de resultados de herramientas nativos de Codex. Solo se aplica cuando
OpenClaw escribe un resultado de herramienta de transcripción de sesión propiedad de OpenClaw.

## Medios y entrega

OpenClaw sigue siendo propietario de la entrega de medios y la selección del proveedor de medios. La generación de imágenes,
video, música, PDF, TTS y comprensión de medios usan ajustes de proveedor/modelo
coincidentes, como `agents.defaults.imageGenerationModel`, `videoGenerationModel`,
`pdfModel` y `messages.tts`.

El texto, las imágenes, el video, la música, TTS, las aprobaciones y la salida de herramientas de mensajería continúan
por la ruta normal de entrega de OpenClaw. La generación de medios no requiere el runtime heredado.
Cuando Codex emite un elemento nativo de generación de imágenes con un `savedPath`, OpenClaw
reenvía ese archivo exacto mediante la ruta normal de medios de respuesta aunque el turno de Codex
no tenga texto de asistente.

## Relacionado

- [Arnés de Codex](/es/plugins/codex-harness)
- [Referencia del arnés de Codex](/es/plugins/codex-harness-reference)
- [Plugins nativos de Codex](/es/plugins/codex-native-plugins)
- [Hooks de Plugin](/es/plugins/hooks)
- [Plugins de arnés de agente](/es/plugins/sdk-agent-harness)
- [Exportación de diagnósticos](/es/gateway/diagnostics)
- [Exportación de trayectoria](/es/tools/trajectory)

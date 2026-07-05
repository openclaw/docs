---
read_when:
    - Necesitas el contrato de soporte en tiempo de ejecución del arnés de Codex
    - Estás depurando herramientas nativas de Codex, hooks, Compaction o la carga de comentarios
    - Estás cambiando el comportamiento del Plugin en los turnos del arnés de OpenClaw y Codex
summary: Límites de runtime, hooks, herramientas, permisos y diagnósticos para el arnés de Codex
title: Entorno de ejecución del arnés de Codex
x-i18n:
    generated_at: "2026-07-05T11:30:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bcf458cfae804655e4544682ff7c12643bccf298b868d918b7c115ae5d075eae
    source_path: plugins/codex-harness-runtime.md
    workflow: 16
---

Contrato de runtime para turnos del arnés de Codex. Para configuración y enrutamiento, consulta
[arnés de Codex](/es/plugins/codex-harness). Para campos de configuración, consulta
[referencia del arnés de Codex](/es/plugins/codex-harness-reference).

## Descripción general

Codex posee el bucle de modelo nativo, la reanudación de hilos nativa, la
continuación de herramientas nativa y la Compaction nativa. OpenClaw posee el
enrutamiento de canales, los archivos de sesión, la entrega de mensajes
visibles, las herramientas dinámicas de OpenClaw, las aprobaciones, la entrega
de medios y un espejo de transcripción alrededor de ese límite.

El enrutamiento de prompts sigue el runtime seleccionado, no solo la cadena del
proveedor. Un turno nativo de Codex recibe instrucciones de desarrollador del
servidor de aplicaciones de Codex; una ruta explícita de compatibilidad de
OpenClaw conserva el prompt de sistema normal de OpenClaw incluso cuando usa
autenticación o transporte de OpenAI con estilo Codex.

OpenClaw inicia y reanuda hilos nativos de Codex con la personalidad integrada
de Codex deshabilitada (`personality: "none"`) para que los archivos de
personalidad del workspace y la identidad del agente de OpenClaw sigan siendo
autoritativos. Por lo demás, Codex nativo conserva las instrucciones base/de
modelo propiedad de Codex y la carga de documentación del proyecto. Las
ejecuciones ligeras de OpenClaw (por ejemplo, cron) siguen suprimiendo la carga
de documentación del proyecto.

Las instrucciones de desarrollador de OpenClaw cubren aspectos del runtime de
OpenClaw: entrega del canal de origen, herramientas dinámicas de OpenClaw,
delegación ACP, contexto del adaptador y los archivos de perfil del workspace
del agente activo. Los catálogos de Skills y los punteros a `MEMORY.md`
enrutados por herramientas se proyectan como instrucciones de desarrollador de
colaboración con alcance de turno. Cuando las herramientas de memoria no están
disponibles, el contenido activo de `BOOTSTRAP.md` y el `MEMORY.md` completo
recaen en contexto de entrada de turno sin formato.

## Vinculaciones de hilos y cambios de modelo

Cuando una sesión de OpenClaw se adjunta a un hilo existente de Codex, el
siguiente turno reenvía al servidor de aplicaciones el modelo seleccionado
actualmente, la política de aprobación, el sandbox, el revisor de aprobaciones
y el nivel de servicio. Cambiar de `openai/gpt-5.5` a `openai/gpt-5.2`
mantiene la vinculación del hilo, pero pide a Codex que continúe con el modelo
recién seleccionado.

## Respuestas visibles y Heartbeats

Los turnos de chat directos/de origen a través del arnés de Codex tienen por
defecto la entrega automática final del asistente para superficies internas de
WebChat, coincidiendo con el contrato del arnés de Pi: el agente responde con
normalidad y OpenClaw publica el texto final en la conversación de origen.
Define `messages.visibleReplies: "message_tool"` para mantener privado el
texto final del asistente salvo que el agente llame a `message(action="send")`.

Los turnos Heartbeat de Codex reciben `heartbeat_respond` en el catálogo
buscable de herramientas de OpenClaw de forma predeterminada para que el agente
pueda registrar si el despertar debe permanecer silencioso o notificar. La guía
de iniciativa de Heartbeat se envía como una instrucción de desarrollador del
modo de colaboración de Codex con alcance al turno Heartbeat; los turnos de
chat ordinarios permanecen en modo Default de Codex. Cuando `HEARTBEAT.md` no
está vacío, las instrucciones de Heartbeat apuntan a Codex al archivo en lugar
de insertar su contenido en línea.

## Límites de hooks

| Capa                                  | Propietario              | Propósito                                                            |
| ------------------------------------- | ------------------------ | -------------------------------------------------------------------- |
| Hooks de Plugin de OpenClaw           | OpenClaw                 | Compatibilidad de producto/Plugin entre arneses de OpenClaw y Codex. |
| Middleware de extensión del servidor de aplicaciones de Codex | Plugins incluidos de OpenClaw | Comportamiento del adaptador por turno alrededor de herramientas dinámicas de OpenClaw. |
| Hooks nativos de Codex                | Codex                    | Ciclo de vida de bajo nivel de Codex y política de herramientas nativas desde la configuración de Codex. |

OpenClaw no usa archivos `hooks.json` de proyecto o globales de Codex para
enrutar comportamiento de Plugin. Para el puente de herramientas nativas y
permisos, OpenClaw inyecta configuración de Codex por hilo para `PreToolUse`,
`PostToolUse`, `PermissionRequest` y `Stop`.

Cuando las aprobaciones del servidor de aplicaciones de Codex están
habilitadas (`approvalPolicy` no es `"never"`), la configuración predeterminada
inyectada de hooks nativos omite `PermissionRequest` para que el revisor del
servidor de aplicaciones de Codex y el puente de aprobaciones de OpenClaw
gestionen escaladas reales después de la revisión. Agrega `permission_request`
a `nativeHookRelay.events` para forzar el relay de compatibilidad de todos
modos. Otros hooks de Codex como `SessionStart` y `UserPromptSubmit` siguen
siendo controles de nivel Codex; no se exponen como hooks de Plugin de
OpenClaw en el contrato v1.

Para las herramientas dinámicas de OpenClaw, OpenClaw ejecuta la herramienta
después de que Codex solicita la llamada, por lo que el comportamiento de
Plugin y middleware se ejecuta en el adaptador del arnés. Para las herramientas
nativas de Codex, Codex posee el registro canónico de la herramienta; OpenClaw
puede reflejar eventos seleccionados, pero no puede reescribir el hilo nativo a
menos que Codex lo exponga mediante el servidor de aplicaciones o callbacks de
hooks nativos.

Los eventos `PreToolUse` del modo de informe del servidor de aplicaciones de
Codex difieren la aprobación del Plugin a la aprobación correspondiente del
servidor de aplicaciones. Si un hook `before_tool_call` de OpenClaw devuelve
`requireApproval` mientras la carga nativa define `openclaw_approval_mode:
"report"`, el relay de hooks nativos registra el requisito de aprobación del
Plugin y no devuelve ninguna decisión nativa. Cuando Codex envía más tarde la
solicitud de aprobación del servidor de aplicaciones para el mismo uso de
herramienta, OpenClaw abre el prompt de aprobación del Plugin y asigna la
decisión de vuelta a Codex. Los eventos `PermissionRequest` de Codex son una
ruta de aprobación separada y aún pueden enrutarse mediante aprobaciones de
OpenClaw cuando están configurados para ese puente.

Las notificaciones de elementos del servidor de aplicaciones de Codex también
proporcionan observaciones asíncronas de `after_tool_call` para finalizaciones
de herramientas nativas que aún no estén cubiertas por el relay nativo
`PostToolUse`. Son solo telemetría/compatibilidad; no pueden bloquear,
demorar ni mutar la llamada de herramienta nativa.

Las proyecciones de Compaction y del ciclo de vida del LLM provienen de las
notificaciones del servidor de aplicaciones de Codex y del estado del adaptador
de OpenClaw, no de comandos de hooks nativos de Codex. `before_compaction`,
`after_compaction`, `llm_input` y `llm_output` son observaciones de nivel de
adaptador, no capturas byte a byte de la solicitud interna o las cargas de
Compaction de Codex.

Las notificaciones `hook/started` y `hook/completed` del servidor de
aplicaciones nativo de Codex se proyectan como eventos de agente
`codex_app_server.hook` para trayectoria y depuración. No invocan hooks de
Plugin de OpenClaw.

## Contrato de compatibilidad v1

Compatible con el runtime de Codex v1:

| Superficie                                   | Compatibilidad                                                                   | Por qué                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| --------------------------------------------- | -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Bucle del modelo OpenAI mediante Codex        | Compatible                                                                       | El app-server de Codex es propietario del turno de OpenAI, la reanudación nativa del hilo y la continuación nativa de herramientas.                                                                                                                                                                                                                                                                                                                                                  |
| Enrutamiento y entrega de canales de OpenClaw | Compatible                                                                       | Telegram, Discord, Slack, WhatsApp, iMessage y otros canales permanecen fuera del runtime del modelo.                                                                                                                                                                                                                                                                                                                                                                                  |
| Herramientas dinámicas de OpenClaw            | Compatible                                                                       | Codex pide a OpenClaw que ejecute estas herramientas, por lo que OpenClaw permanece en la ruta de ejecución.                                                                                                                                                                                                                                                                                                                                                                           |
| Plugins de prompt y contexto                  | Compatible                                                                       | OpenClaw proyecta el prompt/contexto específico de OpenClaw en el turno de Codex mientras deja los prompts base, de modelo y de documentación de proyecto configurados propiedad de Codex en la ruta nativa de Codex. OpenClaw desactiva la personalidad integrada de Codex para los hilos nativos, de modo que los archivos de personalidad del espacio de trabajo del agente sigan siendo autoritativos. Las instrucciones de desarrollador nativas de Codex aceptan solo guía de comandos delimitada explícitamente a `codex_app_server`; las sugerencias de comandos globales heredadas permanecen para superficies de prompt que no son de Codex. |
| Ciclo de vida del motor de contexto           | Compatible                                                                       | El ensamblaje, la ingesta y el mantenimiento posterior al turno se ejecutan alrededor de los turnos de Codex. Los motores de contexto no sustituyen la compaction nativa de Codex.                                                                                                                                                                                                                                                                                                     |
| Hooks de herramientas dinámicas               | Compatible                                                                       | `before_tool_call`, `after_tool_call` y el middleware de resultados de herramientas se ejecutan alrededor de las herramientas dinámicas propiedad de OpenClaw.                                                                                                                                                                                                                                                                                                                         |
| Hooks de ciclo de vida                        | Compatible como observaciones del adaptador                                      | `llm_input`, `llm_output`, `agent_end`, `before_compaction` y `after_compaction` se disparan con cargas útiles honestas en modo Codex.                                                                                                                                                                                                                                                                                                                                                |
| Puerta de revisión de respuesta final         | Compatible mediante retransmisión de hook nativo                                 | Codex `Stop` se retransmite a `before_agent_finalize`; `revise` pide a Codex una pasada más del modelo antes de la finalización.                                                                                                                                                                                                                                                                                                                                                     |
| Shell, patch y MCP nativos: bloquear u observar | Compatible mediante retransmisión de hook nativo                               | Codex `PreToolUse` y `PostToolUse` se retransmiten para superficies de herramientas nativas confirmadas, incluidas las cargas útiles de MCP en Codex app-server `0.125.0` o posterior. El bloqueo es compatible; la reescritura de argumentos no lo es.                                                                                                                                                                                                                              |
| Política de permisos nativa                   | Compatible mediante aprobaciones de Codex app-server y retransmisión compatible de hook nativo | Las solicitudes de aprobación de Codex app-server se enrutan por OpenClaw después de la revisión de Codex. La retransmisión del hook nativo `PermissionRequest` es opt-in para los modos de aprobación nativos porque Codex lo emite antes de la revisión del guardián.                                                                                                                                                                                                              |
| Captura de trayectoria del app-server         | Compatible                                                                       | OpenClaw registra la solicitud que envió al app-server y las notificaciones del app-server que recibe.                                                                                                                                                                                                                                                                                                                                                                                 |

No compatible en Codex runtime v1:

| Superficie                                           | Límite de V1                                                                                                                                     | Ruta futura                                                                               |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Mutación de argumentos de herramientas nativas       | Los hooks nativos previos a herramientas de Codex pueden bloquear, pero OpenClaw no reescribe argumentos de herramientas nativas de Codex.       | Requiere compatibilidad de hooks/esquemas de Codex para reemplazar la entrada de herramienta. |
| Historial editable de transcripción nativa de Codex  | Codex es propietario del historial canónico de hilos nativos. OpenClaw posee un espejo y puede proyectar contexto futuro, pero no debe mutar internos no compatibles. | Añadir APIs explícitas de Codex app-server si se necesita cirugía de hilos nativos.       |
| `tool_result_persist` para registros de herramientas nativas de Codex | Ese hook transforma escrituras de transcripción propiedad de OpenClaw, no registros de herramientas nativas de Codex.                         | Podría reflejar registros transformados, pero la reescritura canónica necesita compatibilidad de Codex. |
| Metadatos enriquecidos de compaction nativa          | OpenClaw puede solicitar compaction nativa, pero no recibe una lista estable de conservados/descartados, delta de tokens, resumen de finalización ni carga útil de resumen. | Necesita eventos de compaction de Codex más enriquecidos.                                 |
| Intervención de compaction                           | OpenClaw no permite que los plugins o motores de contexto veten, reescriban o reemplacen la compaction nativa de Codex.                         | Añadir hooks de Codex pre/post compaction si los plugins necesitan vetar o reescribir la compaction nativa. |
| Captura byte a byte de la solicitud de API del modelo | OpenClaw puede capturar solicitudes y notificaciones del app-server, pero el núcleo de Codex construye internamente la solicitud final de la API de OpenAI. | Necesita un evento de trazado de solicitud de modelo de Codex o una API de depuración.     |

## Permisos nativos y elicitaciones de MCP

Para `PermissionRequest`, OpenClaw solo devuelve decisiones explícitas de permitir o denegar
cuando la política decide. Un resultado sin decisión no es una autorización: Codex
lo trata como ausencia de decisión del hook y continúa a su propio guardián o ruta
de aprobación de usuario.

Los modos de aprobación de Codex app-server omiten este hook nativo de forma predeterminada. Esto
se aplica salvo que `permission_request` se incluya explícitamente en
`nativeHookRelay.events` o que un runtime de compatibilidad lo instale.

Cuando un operador elige `allow-always` para una solicitud de permiso nativa de Codex,
OpenClaw recuerda esa huella exacta de proveedor/sesión/entrada de herramienta/cwd
durante una ventana de sesión acotada. La decisión recordada es
intencionalmente solo de coincidencia exacta: un comando, argumentos, carga útil de herramienta o
cwd cambiado crea una nueva aprobación.

Las elicitaciones de aprobación de herramientas MCP de Codex se enrutan mediante el flujo de aprobación
de plugins de OpenClaw cuando Codex marca `_meta.codex_approval_kind` como `"mcp_tool_call"`. Los prompts
`request_user_input` de Codex se envían de vuelta al chat de origen, y el
siguiente mensaje de seguimiento en cola responde a esa solicitud del servidor nativo en lugar de
ser dirigido como contexto adicional. Otras solicitudes de elicitación de MCP fallan de forma cerrada.

Para el flujo general de aprobación de plugins que transporta estos prompts, consulta
[Solicitudes de permisos de plugins](/es/plugins/plugin-permission-requests).

## Dirección de la cola

La dirección de cola de ejecución activa se asigna a `turn/steer` de Codex app-server. Con el
valor predeterminado `messages.queue.mode: "steer"`, OpenClaw agrupa los mensajes de chat
en modo de dirección durante la ventana de silencio configurada y los envía como una única solicitud
`turn/steer` en orden de llegada.

Codex review y los turnos de Compaction manual pueden rechazar la dirección en el mismo turno. En
ese caso, OpenClaw espera a que termine la ejecución activa antes de iniciar el
prompt. Usa `/queue followup` o `/queue collect` cuando los mensajes deban ponerse en cola
de forma predeterminada en lugar de dirigir el turno. Consulta [Cola de dirección](/es/concepts/queue-steering).

## Carga de comentarios de Codex

Cuando se aprueba `/diagnostics [note]` para una sesión en el arnés nativo de Codex,
OpenClaw también llama a `feedback/upload` del app-server de Codex para los hilos de
Codex relevantes, incluidos los registros de cada hilo listado y los subhilos de Codex
generados cuando estén disponibles.

La carga pasa por la ruta normal de comentarios de Codex hacia los servidores de OpenAI. Si
los comentarios de Codex están deshabilitados en ese app-server, el comando devuelve el
error del app-server. La respuesta de diagnósticos completada lista los canales,
los identificadores de sesión de OpenClaw, los identificadores de hilo de Codex y los comandos locales
`codex resume <thread-id>` para los hilos que se enviaron.

Si rechazas o ignoras la aprobación, OpenClaw no imprime esos identificadores de Codex
y no envía comentarios de Codex. La carga no reemplaza la exportación local de diagnósticos del
Gateway. Consulta [Exportación de diagnósticos](/es/gateway/diagnostics) para
la aprobación, la privacidad, el paquete local y el comportamiento en chats grupales.

Usa `/codex diagnostics [note]` solo cuando quieras la carga de comentarios de Codex
para el hilo actualmente adjunto sin el paquete completo de diagnósticos del Gateway.

## Compaction y espejo de transcripción

Cuando el modelo seleccionado usa el arnés de Codex, la Compaction nativa del hilo
pertenece al app-server de Codex. OpenClaw no ejecuta Compaction previa para
turnos de Codex, no reemplaza la Compaction de Codex con Compaction del motor de contexto ni recurre
a OpenClaw o a la generación de resúmenes pública de OpenAI cuando la Compaction nativa no puede
iniciarse. OpenClaw mantiene un espejo de transcripción para el historial del canal, la búsqueda,
`/new`, `/reset` y futuros cambios de modelo o arnés.

Las solicitudes explícitas de Compaction, como `/compact` o una operación de compactación manual
solicitada por un plugin, inician la Compaction nativa de Codex con `thread/compact/start`.
OpenClaw mantiene abiertos la solicitud y el arrendamiento del cliente compartido hasta que Codex emite el
elemento de finalización `contextCompaction` correspondiente y luego informa el turno de Compaction
como completado. Si ese turno terminal supera el tiempo de espera de Compaction
configurado, OpenClaw solicita una interrupción de turno nativa. El arrendamiento y la barrera de
Compaction por hilo permanecen retenidos hasta que Codex informa el estado terminal o confirma
la RPC de interrupción. Si Codex no confirma dentro del período de gracia de interrupción,
OpenClaw retira la conexión antes de liberar la barrera. Las conexiones remotas
también separan la vinculación del hilo correspondiente para que el trabajo posterior no pueda
solaparse con un turno remoto no confirmado. Otros turnos en una conexión retirada fallan
y pueden reintentarse en un cliente nuevo. El cierre del cliente, la cancelación de la solicitud o un
turno de Compaction fallido devuelven una operación fallida. La Compaction automática por presión de contexto
es responsabilidad de Codex; OpenClaw solo inicia la Compaction nativa para activadores solicitados manualmente.

Cuando un motor de contexto solicita la proyección de arranque de hilo de Codex, OpenClaw
proyecta nombres e identificadores de llamadas a herramientas, formas de entrada y contenido redactado
de resultados de herramientas en el hilo nuevo de Codex. No copia valores sin procesar de argumentos
de llamadas a herramientas en esa proyección.

El espejo incluye el prompt del usuario, el texto final del asistente y registros ligeros de
razonamiento o plan de Codex cuando el app-server los emite. OpenClaw
registra el inicio y el estado terminal de la Compaction nativa, pero no
expone un resumen de Compaction legible por humanos ni una lista auditable de qué
entradas conservó Codex después de la Compaction.

Como Codex posee el hilo nativo canónico, `tool_result_persist` no
reescribe registros de resultados de herramientas nativos de Codex. Solo se aplica cuando OpenClaw
escribe un resultado de herramienta de transcripción de sesión propiedad de OpenClaw.

## Medios y entrega

OpenClaw sigue siendo responsable de la entrega de medios y de la selección del proveedor de medios. La generación de imágenes,
video, música, PDF, TTS y la comprensión de medios usan ajustes de proveedor/modelo
correspondientes, como `agents.defaults.imageGenerationModel`,
`videoGenerationModel`, `pdfModel` y `messages.tts`.

Texto, imágenes, video, música, TTS, aprobaciones y salida de herramientas de mensajería continúan
por la ruta normal de entrega de OpenClaw; la generación de medios no requiere
el runtime heredado. Cuando Codex emite un elemento nativo de generación de imágenes con un
`savedPath`, OpenClaw reenvía ese archivo exacto por la ruta normal de medios de respuesta,
incluso si el turno de Codex no tiene texto de asistente.

## Relacionado

- [Arnés de Codex](/es/plugins/codex-harness)
- [Referencia del arnés de Codex](/es/plugins/codex-harness-reference)
- [Plugins nativos de Codex](/es/plugins/codex-native-plugins)
- [Hooks de plugins](/es/plugins/hooks)
- [Plugins de arnés de agente](/es/plugins/sdk-agent-harness)
- [Exportación de diagnósticos](/es/gateway/diagnostics)
- [Exportación de trayectoria](/es/tools/trajectory)

---
read_when:
    - Necesitas el contrato de compatibilidad con el entorno de ejecución del arnés de Codex
    - Estás depurando herramientas nativas de Codex, hooks, Compaction o la carga de comentarios
    - Estás cambiando el comportamiento de los plugins en los turnos de los arneses de OpenClaw y Codex
summary: Límites de ejecución, hooks, herramientas, permisos y diagnósticos del arnés de Codex
title: Entorno de ejecución del arnés de Codex
x-i18n:
    generated_at: "2026-07-11T23:16:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: facd39e4fe86e43f5f08be49211cac6b27781f910f9a5d56ad4a687868259f13
    source_path: plugins/codex-harness-runtime.md
    workflow: 16
---

Contrato de tiempo de ejecución para los turnos del arnés de Codex. Para la configuración y el enrutamiento, consulte
[Arnég de Codex](/es/plugins/codex-harness). Para los campos de configuración, consulte
[Referencia del arnés de Codex](/es/plugins/codex-harness-reference).

## Descripción general

Codex controla el bucle nativo del modelo, la reanudación nativa de hilos, la continuación nativa de herramientas y la Compaction nativa. OpenClaw controla el enrutamiento de canales, los archivos de sesión, la entrega de mensajes visibles, las herramientas dinámicas de OpenClaw, las aprobaciones, la entrega de contenido multimedia y una réplica de la transcripción alrededor de ese límite.

El enrutamiento de indicaciones sigue el tiempo de ejecución seleccionado, no solo la cadena del proveedor. Un turno nativo de Codex recibe las instrucciones de desarrollador del servidor de aplicaciones de Codex; una ruta de compatibilidad explícita de OpenClaw conserva la indicación de sistema normal de OpenClaw, incluso cuando usa autenticación o transporte de OpenAI con características de Codex.

OpenClaw inicia y reanuda hilos nativos de Codex con la personalidad integrada de Codex desactivada (`personality: "none"`), de modo que los archivos de personalidad del espacio de trabajo y la identidad del agente de OpenClaw sigan siendo la autoridad. Por lo demás, Codex nativo conserva las instrucciones base y del modelo controladas por Codex, así como la carga de la documentación del proyecto. Las ejecuciones ligeras de OpenClaw (por ejemplo, Cron) siguen suprimiendo la carga de la documentación del proyecto.

Las instrucciones de desarrollador de OpenClaw abarcan aspectos del tiempo de ejecución de OpenClaw: entrega al canal de origen, herramientas dinámicas de OpenClaw, delegación mediante ACP, contexto del adaptador y archivos de perfil activos del espacio de trabajo del agente. Los catálogos de Skills y los punteros a `MEMORY.md` enrutados mediante herramientas se proyectan como instrucciones de desarrollador de colaboración con alcance limitado al turno. Cuando las herramientas de memoria no están disponibles, el contenido activo de `BOOTSTRAP.md` y el archivo `MEMORY.md` completo se incorporan en su lugar como contexto de entrada de texto sin formato para el turno.

La mayoría de las herramientas dinámicas de OpenClaw usan el espacio de nombres consultable `openclaw`. Las herramientas marcadas con `catalogMode: "direct-only"` usan `openclaw_direct`, que Codex mantiene visible directamente para el modelo como `DirectModelOnly`, en lugar de exponerlo a la ejecución anidada del modo de código.

## Vinculaciones de hilos y cambios de modelo

Cuando una sesión de OpenClaw está vinculada a un hilo existente de Codex, el siguiente turno vuelve a enviar al servidor de aplicaciones el modelo seleccionado actualmente, la política de aprobación, el entorno aislado, el revisor de aprobaciones y el nivel de servicio. Cambiar de `openai/gpt-5.5` a `openai/gpt-5.2` conserva la vinculación del hilo, pero solicita a Codex que continúe con el modelo recién seleccionado.

Las vinculaciones supervisadas son la excepción. El selector de modelos de OpenClaw permanece bloqueado y las reanudaciones omiten las sustituciones del modelo y el proveedor para que Codex restaure el modelo y el proveedor persistentes del hilo canónico. Un control nativo independiente de Codex puede cambiar ese par persistente, y la instantánea inicial puede generar la advertencia normal de Codex sobre diferencias de modelo; el modelo externo de OpenClaw y la cadena de alternativas nunca sustituyen a ninguno de los dos.

## Supervisión y continuación segura

La supervisión de Codex es una capacidad opcional del mismo Plugin `codex`. Detecta hilos nativos mediante una conexión independiente y proyecta únicamente las sesiones no archivadas en el catálogo del Gateway. Sin una configuración de conexión `appServer` explícita, esa conexión usa la entrada/salida estándar administrada del directorio personal del usuario, mientras que el arnés normal permanece limitado al agente. La enumeración y las lecturas de metadatos son pasivas: no reanudan un hilo, no suscriben OpenClaw a sus eventos en directo ni responden a sus aprobaciones.

Para una sesión almacenada o inactiva en el equipo del Gateway, **Continuar como rama** crea un Chat normal con el modelo bloqueado y replica un historial acotado del usuario y del asistente hasta el último turno terminal persistente del origen. El primer turno normal del Chat instala los controladores de aprobación reales y usa una bifurcación nativa temporal para fijar la instantánea sin sustituir el modelo ni el proveedor. El servidor de aplicaciones de Codex usa su configuración nativa actual y devuelve el par seleccionado; emite su advertencia normal si ese modelo difiere del último modelo registrado en el origen. En la misma conexión de supervisión, OpenClaw inicia el hilo canónico del arnés de Codex cuyo origen es `appServer`, con su directorio de trabajo y su política de tiempo de ejecución, usando exactamente el modelo y el proveedor devueltos para ese inicio inicial, inyecta el historial visible acotado y archiva la bifurcación temporal. El origen nunca se reanuda. El hilo canónico dispone de toda la superficie de herramientas del arnés de OpenClaw; el razonamiento, las llamadas a herramientas y los resultados de herramientas del origen no se clonan en él. El ámbito privado de la conexión se conserva durante los estados de vinculación pendiente y confirmada, por lo que cada turno posterior permanece en esa conexión con la autenticación nativa y la configuración del proveedor. Una supervisión desactivada o una divergencia de la vinculación o la conexión provoca un cierre seguro, en lugar de cambiar al arnés normal del directorio personal del agente.

El origen original de la CLI o VS Code sigue siendo apto para ambos catálogos. La rama canónica es un hilo nativo de Codex, pero su tipo de origen es `appServer`; los clientes nativos pueden filtrar ese tipo de origen, por lo que no se garantiza que aparezca en Codex Desktop.

Los orígenes activos no pueden iniciar una rama nueva ni archivarse; aun así, se puede abrir un Chat supervisado existente. `notLoaded` significa que se desconoce la actividad, no que esté inactivo; OpenClaw solo permite archivar una fila local `idle` o `notLoaded` después de una confirmación explícita de que no hay otro ejecutor y una lectura reciente del estado local del proceso. Codex serializa las mutaciones de hilos dentro de un único proceso del servidor de aplicaciones, pero no proporciona un ejecutor exclusivo entre procesos ni un arrendamiento del propietario de las aprobaciones, por lo que esa lectura no puede demostrar que otro proceso no esté usando el hilo. OpenClaw bloquea a un propietario conocido de una vinculación activa para el destino exacto o para cualquier descendiente generado y no archivado que devuelva la consulta paginada de descendientes de Codex. Los errores de enumeración, los ciclos y el agotamiento del límite de seguridad provocan un cierre seguro. El archivado nativo aún puede entrar en condición de carrera con un turno nuevo de otro proceso, por lo que la confirmación cubre los clientes desconocidos y el intervalo entre la lectura del estado y el archivado. Un Chat supervisado con el modelo bloqueado no puede eliminarse mientras proteja la vinculación nativa.

Los catálogos de nodos emparejados se limitan a metadatos en la versión inicial. El límite actual de invocación del Node es de solicitud/respuesta y no puede transportar los eventos de turno de larga duración, las solicitudes de aprobación ni la salida en flujo continuo que requiere una vinculación real del arnés de Codex. Por tanto, las opciones remotas **Continuar** y **Archivar** siguen sin estar disponibles incluso cuando la fila está inactiva.

Consulte [Supervisión de Codex](/es/plugins/codex-supervision) para conocer la configuración del operador y el comportamiento visible de la interfaz de control.

## Respuestas visibles y Heartbeat

Los turnos de chat directos o de origen mediante el arnés de Codex usan de manera predeterminada la entrega automática de la respuesta final del asistente en las superficies internas de WebChat, de acuerdo con el contrato del arnés de Pi: el agente responde normalmente y OpenClaw publica el texto final en la conversación de origen. Configure `messages.visibleReplies: "message_tool"` para mantener privado el texto final del asistente, salvo que el agente llame a `message(action="send")`.

Los turnos de Heartbeat de Codex incluyen de manera predeterminada `heartbeat_respond` en el catálogo consultable de herramientas de OpenClaw, para que el agente pueda registrar si la activación debe permanecer silenciosa o enviar una notificación. Las directrices de iniciativa de Heartbeat se envían como una instrucción de desarrollador del modo de colaboración de Codex limitada al turno de Heartbeat; los turnos de chat normales permanecen en el modo predeterminado de Codex. Cuando `HEARTBEAT.md` no está vacío, las instrucciones de Heartbeat dirigen a Codex al archivo en lugar de insertar su contenido.

## Límites de los hooks

| Capa                                  | Propietario              | Finalidad                                                            |
| ------------------------------------- | ------------------------ | -------------------------------------------------------------------- |
| Hooks de plugins de OpenClaw          | OpenClaw                 | Compatibilidad de productos/plugins entre los arneses de OpenClaw y Codex. |
| Middleware de extensión del servidor de aplicaciones de Codex | Plugins incluidos de OpenClaw | Comportamiento del adaptador por turno en torno a las herramientas dinámicas de OpenClaw. |
| Hooks nativos de Codex                | Codex                    | Ciclo de vida de bajo nivel de Codex y política de herramientas nativas de la configuración de Codex. |

OpenClaw no usa archivos `hooks.json` de proyecto ni globales de Codex para enrutar el comportamiento de los plugins. Para el puente de herramientas nativas y permisos, OpenClaw inyecta una configuración de Codex por hilo para `PreToolUse`, `PostToolUse`, `PermissionRequest` y `Stop`.

Cuando las aprobaciones del servidor de aplicaciones de Codex están habilitadas (`approvalPolicy` no es `"never"`), la configuración predeterminada inyectada de hooks nativos omite `PermissionRequest`, de modo que el revisor del servidor de aplicaciones de Codex y el puente de aprobaciones de OpenClaw gestionen las escalaciones reales después de la revisión. Añada `permission_request` a `nativeHookRelay.events` para forzar de todos modos el relé de compatibilidad. Otros hooks de Codex, como `SessionStart` y `UserPromptSubmit`, siguen siendo controles propios de Codex; no se exponen como hooks de plugins de OpenClaw en el contrato de la v1.

Para las herramientas dinámicas de OpenClaw, OpenClaw ejecuta la herramienta después de que Codex solicite la llamada, por lo que el comportamiento de los plugins y el middleware se ejecuta en el adaptador del arnés. Para las herramientas nativas de Codex, Codex controla el registro canónico de la herramienta; OpenClaw puede replicar eventos seleccionados, pero no puede reescribir el hilo nativo, salvo que Codex lo exponga mediante el servidor de aplicaciones o mediante devoluciones de llamada de hooks nativos.

Los eventos `PreToolUse` del modo de informe del servidor de aplicaciones de Codex aplazan la aprobación del plugin hasta la aprobación correspondiente del servidor de aplicaciones. Si un hook `before_tool_call` de OpenClaw devuelve `requireApproval` mientras la carga útil nativa establece `openclaw_approval_mode: "report"`, el relé de hooks nativos registra el requisito de aprobación del plugin y no devuelve ninguna decisión nativa. Cuando Codex envía posteriormente la solicitud de aprobación del servidor de aplicaciones para el mismo uso de la herramienta, OpenClaw abre la solicitud de aprobación del plugin y asigna la decisión de vuelta a Codex. Los eventos `PermissionRequest` de Codex constituyen una vía de aprobación independiente y aún pueden enrutarse mediante las aprobaciones de OpenClaw cuando se configuran para ese puente.

Las notificaciones de elementos del servidor de aplicaciones de Codex también proporcionan observaciones asíncronas de `after_tool_call` para las finalizaciones de herramientas nativas que el relé nativo `PostToolUse` aún no haya cubierto. Estas sirven únicamente para telemetría y compatibilidad; no pueden bloquear, retrasar ni modificar la llamada a la herramienta nativa.

Las proyecciones de Compaction y del ciclo de vida del LLM proceden de las notificaciones del servidor de aplicaciones de Codex y del estado del adaptador de OpenClaw, no de comandos de hooks nativos de Codex. `before_compaction`, `after_compaction`, `llm_input` y `llm_output` son observaciones del adaptador, no capturas byte por byte de las cargas útiles internas de solicitud o Compaction de Codex.

Las notificaciones nativas `hook/started` y `hook/completed` del servidor de aplicaciones de Codex se proyectan como eventos de agente `codex_app_server.hook` para el seguimiento de la trayectoria y la depuración. No invocan hooks de plugins de OpenClaw.

## Contrato de compatibilidad de la V1

Compatible con la versión 1 del tiempo de ejecución de Codex:

| Superficie                                       | Compatibilidad                                                                          | Motivo                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| --------------------------------------------- | -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Bucle del modelo OpenAI mediante Codex               | Compatible                                                                        | El servidor de aplicaciones de Codex controla el turno de OpenAI, la reanudación nativa del hilo y la continuación nativa de herramientas.                                                                                                                                                                                                                                                                                                                                                                                          |
| Enrutamiento y entrega de canales de OpenClaw         | Compatible                                                                        | Telegram, Discord, Slack, WhatsApp, iMessage y otros canales permanecen fuera del entorno de ejecución del modelo.                                                                                                                                                                                                                                                                                                                                                                                    |
| Herramientas dinámicas de OpenClaw                        | Compatible                                                                        | Codex solicita a OpenClaw que ejecute estas herramientas, por lo que OpenClaw permanece en la ruta de ejecución.                                                                                                                                                                                                                                                                                                                                                                                                |
| Plugins de indicaciones y contexto                    | Compatible                                                                        | OpenClaw proyecta las indicaciones y el contexto específicos de OpenClaw en el turno de Codex, mientras mantiene las indicaciones base, del modelo y de la documentación configurada del proyecto que pertenecen a Codex en la ruta nativa de Codex. OpenClaw desactiva la personalidad integrada de Codex para los hilos nativos, de modo que los archivos de personalidad del espacio de trabajo del agente sigan siendo la fuente autoritativa. Las instrucciones nativas para desarrolladores de Codex solo aceptan orientación sobre comandos cuyo ámbito se haya definido explícitamente como `codex_app_server`; las sugerencias globales heredadas sobre comandos se mantienen para las superficies de indicaciones ajenas a Codex. |
| Ciclo de vida del motor de contexto                      | Compatible                                                                        | El ensamblaje, la ingesta y el mantenimiento posterior al turno se ejecutan alrededor de los turnos de Codex. Los motores de contexto no sustituyen la Compaction nativa de Codex.                                                                                                                                                                                                                                                                                                                                                        |
| Hooks de herramientas dinámicas                            | Compatible                                                                        | El middleware `before_tool_call`, `after_tool_call` y de resultados de herramientas se ejecuta alrededor de las herramientas dinámicas controladas por OpenClaw.                                                                                                                                                                                                                                                                                                                                                                          |
| Hooks del ciclo de vida                               | Compatible como observaciones del adaptador                                                | `llm_input`, `llm_output`, `agent_end`, `before_compaction` y `after_compaction` se activan con cargas útiles veraces del modo Codex.                                                                                                                                                                                                                                                                                                                                                           |
| Puerta de revisión de la respuesta final                    | Compatible mediante la retransmisión de hooks nativos                                              | El evento `Stop` de Codex se retransmite a `before_agent_finalize`; `revise` solicita a Codex una pasada adicional del modelo antes de la finalización.                                                                                                                                                                                                                                                                                                                                                                |
| Bloqueo u observación nativos de shell, parches y MCP | Compatible mediante la retransmisión de hooks nativos                                              | Los eventos `PreToolUse` y `PostToolUse` de Codex se retransmiten para las superficies de herramientas nativas confirmadas, incluidas las cargas útiles de MCP en el servidor de aplicaciones de Codex `0.142.0` o posterior. Se admite el bloqueo, pero no la reescritura de argumentos.                                                                                                                                                                                                                                                                               |
| Política de permisos nativos                      | Compatible mediante las aprobaciones del servidor de aplicaciones de Codex y la retransmisión compatible de hooks nativos | Las solicitudes de aprobación del servidor de aplicaciones de Codex se enrutan mediante OpenClaw después de la revisión de Codex. La retransmisión del hook nativo `PermissionRequest` es opcional para los modos de aprobación nativos porque Codex lo emite antes de la revisión del guardián.                                                                                                                                                                                                                                                                          |
| Captura de la trayectoria del servidor de aplicaciones                 | Compatible                                                                        | OpenClaw registra la solicitud que envía al servidor de aplicaciones y las notificaciones que recibe de este.                                                                                                                                                                                                                                                                                                                                                                                    |

No compatible con la versión 1 del entorno de ejecución de Codex:

| Superficie                                             | Límite de la versión 1                                                                                                                                     | Ruta futura                                                                               |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Modificación de argumentos de herramientas nativas                       | Los hooks nativos previos a las herramientas de Codex pueden bloquear, pero OpenClaw no reescribe los argumentos de las herramientas nativas de Codex.                                               | Requiere compatibilidad de hooks o esquemas de Codex para sustituir la entrada de herramientas.                            |
| Historial editable de transcripciones nativas de Codex            | Codex controla el historial canónico del hilo nativo. OpenClaw controla una réplica y puede proyectar contexto futuro, pero no debe modificar elementos internos no compatibles. | Añadir API explícitas del servidor de aplicaciones de Codex si es necesario intervenir en el hilo nativo.                    |
| `tool_result_persist` para registros de herramientas nativas de Codex | Ese hook transforma las escrituras de transcripciones controladas por OpenClaw, no los registros de herramientas nativas de Codex.                                                           | Podrían replicarse los registros transformados, pero la reescritura canónica requiere compatibilidad de Codex.              |
| Metadatos enriquecidos de Compaction nativa                     | OpenClaw puede solicitar la Compaction nativa, pero no recibe una lista estable de elementos conservados o descartados, la diferencia de tokens, un resumen de finalización ni una carga útil de resumen.   | Se necesitan eventos de Compaction de Codex más completos.                                                     |
| Intervención en la Compaction                             | OpenClaw no permite que los plugins ni los motores de contexto veten, reescriban o sustituyan la Compaction nativa de Codex.                                             | Añadir hooks de Codex anteriores y posteriores a la Compaction si los plugins necesitan vetar o reescribir la Compaction nativa. |
| Captura byte por byte de solicitudes de la API del modelo             | OpenClaw puede capturar solicitudes y notificaciones del servidor de aplicaciones, pero el núcleo de Codex construye internamente la solicitud final de la API de OpenAI.                      | Se necesita un evento de seguimiento de solicitudes del modelo o una API de depuración de Codex.                                   |

## Permisos nativos y solicitudes de información de MCP

Para `PermissionRequest`, OpenClaw solo devuelve decisiones explícitas de permiso o denegación
cuando la política toma una decisión. Un resultado sin decisión no equivale a un permiso: Codex
lo trata como la ausencia de una decisión del hook y continúa con su propio guardián o con la ruta
de aprobación del usuario.

Los modos de aprobación del servidor de aplicaciones de Codex omiten este hook nativo de forma predeterminada. Esto
se aplica salvo que `permission_request` se incluya explícitamente en
`nativeHookRelay.events` o que un entorno de ejecución de compatibilidad lo instale.

Cuando un operador elige `allow-always` para una solicitud de permiso nativa de Codex,
OpenClaw recuerda la huella digital exacta de proveedor, sesión, entrada de herramienta y cwd
durante un intervalo limitado de la sesión. La decisión recordada solo se aplica
intencionadamente a coincidencias exactas: cualquier cambio en el comando, los argumentos, la carga útil de la herramienta o
el cwd genera una nueva aprobación.

Las solicitudes de aprobación de herramientas MCP de Codex se enrutan mediante el flujo de aprobación
de plugins de OpenClaw cuando Codex marca `_meta.codex_approval_kind` como `"mcp_tool_call"`. Las
indicaciones de `request_user_input` de Codex se envían de vuelta al chat de origen, y el
siguiente mensaje de seguimiento en cola responde a esa solicitud del servidor nativo en lugar de
redirigirse como contexto adicional. Otras solicitudes de información de MCP se rechazan de forma predeterminada.

Para obtener información sobre el flujo general de aprobación de plugins que transporta estas indicaciones, consulta
[Solicitudes de permisos de plugins](/es/plugins/plugin-permission-requests).

## Redirección de la cola

La redirección de la cola de una ejecución activa se asigna a `turn/steer` del servidor de aplicaciones de Codex. Con el
valor predeterminado `messages.queue.mode: "steer"`, OpenClaw agrupa los mensajes de chat
del modo de redirección durante el intervalo de inactividad configurado y los envía como una única solicitud
`turn/steer` en el orden de llegada.

Los turnos de revisión de Codex y de Compaction manual pueden rechazar el redireccionamiento durante el mismo turno. En
ese caso, OpenClaw espera a que finalice la ejecución activa antes de iniciar el
prompt. Use `/queue followup` o `/queue collect` cuando los mensajes deban ponerse en cola
de forma predeterminada en lugar de redirigir. Consulte [Cola de redireccionamiento](/es/concepts/queue-steering).

## Carga de comentarios de Codex

Cuando se aprueba `/diagnostics [note]` para una sesión en el entorno nativo de
Codex, OpenClaw también llama a `feedback/upload` del servidor de aplicaciones de Codex para los
hilos de Codex pertinentes, incluidos los registros de cada hilo indicado y los
subhilos de Codex generados, cuando estén disponibles.

La carga se realiza mediante la ruta normal de comentarios de Codex hacia los servidores de OpenAI. Si
los comentarios de Codex están deshabilitados en ese servidor de aplicaciones, el comando devuelve el
error del servidor de aplicaciones. La respuesta de diagnóstico completada enumera los canales,
los identificadores de sesión de OpenClaw, los identificadores de hilo de Codex y los comandos locales
`codex resume <thread-id>` de los hilos enviados.

Si rechaza o ignora la aprobación, OpenClaw no muestra esos identificadores de Codex
ni envía comentarios de Codex. La carga no sustituye la exportación local de
diagnósticos del Gateway. Consulte [Exportación de diagnósticos](/es/gateway/diagnostics) para obtener información sobre
la aprobación, la privacidad, el paquete local y el comportamiento en chats grupales.

Use `/codex diagnostics [note]` solo cuando quiera cargar los comentarios de Codex
del hilo adjunto actualmente sin el paquete completo de diagnósticos del
Gateway.

## Compaction y réplica de la transcripción

Cuando el modelo seleccionado utiliza el entorno de Codex, la Compaction nativa del hilo
corresponde al servidor de aplicaciones de Codex. OpenClaw no ejecuta una Compaction preliminar para
los turnos de Codex, no sustituye la Compaction de Codex por la Compaction del motor de contexto ni
recurre a la sumarización de OpenClaw o de la API pública de OpenAI cuando no se puede
iniciar la Compaction nativa. OpenClaw conserva una réplica de la transcripción para el historial
del canal, la búsqueda, `/new`, `/reset` y futuros cambios de modelo o entorno.

Las solicitudes explícitas de Compaction, como `/compact` o una operación manual de
Compaction solicitada por un Plugin, inician la Compaction nativa de Codex con `thread/compact/start`.
OpenClaw mantiene abiertos la solicitud y el arrendamiento del cliente compartido hasta que Codex emite el
elemento de finalización `contextCompaction` correspondiente y, a continuación, informa que el turno de
Compaction ha finalizado. Si ese turno terminal supera el tiempo de espera configurado para la Compaction,
OpenClaw solicita una interrupción nativa del turno. El arrendamiento y el bloqueo de
Compaction por hilo permanecen retenidos hasta que Codex informa del estado terminal o confirma
la RPC de interrupción. Si Codex no confirma dentro del período de gracia de la
interrupción, OpenClaw retira la conexión antes de liberar el bloqueo. Las conexiones
remotas también desvinculan el hilo correspondiente para que el trabajo posterior no pueda
solaparse con un turno remoto sin confirmar. Los demás turnos de una conexión retirada fallan
y pueden volver a intentarse con un cliente nuevo. El cierre del cliente, la cancelación de la solicitud o un
turno de Compaction fallido devuelven una operación fallida. La Compaction automática por presión
de contexto es responsabilidad de Codex; OpenClaw solo inicia la Compaction nativa para los activadores
solicitados manualmente.

Cuando un motor de contexto solicita la proyección de arranque de un hilo de Codex, OpenClaw
proyecta los nombres e identificadores de las llamadas a herramientas, las estructuras de entrada y el contenido
censurado de los resultados de herramientas en el nuevo hilo de Codex. No copia los valores sin procesar
de los argumentos de llamadas a herramientas en esa proyección.

La réplica incluye el prompt del usuario, el texto final del asistente y registros ligeros
de razonamiento o planificación de Codex cuando el servidor de aplicaciones los emite. OpenClaw
registra el inicio y el estado terminal de la Compaction nativa, pero no
expone un resumen legible de la Compaction ni una lista auditable de las
entradas que Codex conservó después de la Compaction.

Como Codex es propietario del hilo nativo canónico, `tool_result_persist` no
reescribe los registros de resultados de herramientas nativos de Codex. Solo se aplica cuando OpenClaw
escribe el resultado de una herramienta en la transcripción de una sesión propiedad de OpenClaw.

## Contenido multimedia y entrega

OpenClaw sigue controlando la entrega de contenido multimedia y la selección del proveedor multimedia. La generación de
imágenes, video, música, PDF y TTS, así como la comprensión de contenido multimedia, utilizan las configuraciones
de proveedor y modelo correspondientes, como `agents.defaults.imageGenerationModel`,
`videoGenerationModel`, `pdfModel` y `messages.tts`.

El texto, las imágenes, el video, la música, el TTS, las aprobaciones y la salida de herramientas de mensajería siguen
pasando por la ruta normal de entrega de OpenClaw; la generación de contenido multimedia no requiere
el entorno heredado. Cuando Codex emite un elemento nativo de generación de imágenes con un
`savedPath`, OpenClaw reenvía ese archivo exacto mediante la ruta normal de contenido multimedia
de respuesta, incluso si el turno de Codex no contiene texto del asistente.

## Contenido relacionado

- [Entorno de Codex](/es/plugins/codex-harness)
- [Referencia del entorno de Codex](/es/plugins/codex-harness-reference)
- [Supervisión de Codex](/es/plugins/codex-supervision)
- [Plugins nativos de Codex](/es/plugins/codex-native-plugins)
- [Hooks de Plugins](/es/plugins/hooks)
- [Plugins de entorno del agente](/es/plugins/sdk-agent-harness)
- [Exportación de diagnósticos](/es/gateway/diagnostics)
- [Exportación de trayectorias](/es/tools/trajectory)

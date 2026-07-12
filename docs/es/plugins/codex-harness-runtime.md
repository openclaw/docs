---
read_when:
    - Necesitas el contrato de compatibilidad con el entorno de ejecución del arnés de Codex
    - Está depurando herramientas nativas de Codex, hooks, compaction o la carga de comentarios
    - Está cambiando el comportamiento del plugin en los turnos de los arneses de OpenClaw y Codex
summary: Límites del entorno de ejecución, hooks, herramientas, permisos y diagnósticos para el arnés de Codex
title: Entorno de ejecución del arnés de Codex
x-i18n:
    generated_at: "2026-07-12T14:42:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: facd39e4fe86e43f5f08be49211cac6b27781f910f9a5d56ad4a687868259f13
    source_path: plugins/codex-harness-runtime.md
    workflow: 16
---

Contrato de ejecución para los turnos del arnés de Codex. Para la configuración y el enrutamiento, consulte
[Arnés de Codex](/es/plugins/codex-harness). Para conocer los campos de configuración, consulte
[Referencia del arnés de Codex](/es/plugins/codex-harness-reference).

## Descripción general

Codex controla el bucle nativo del modelo, la reanudación nativa de hilos, la
continuación nativa de herramientas y la Compaction nativa. OpenClaw controla el
enrutamiento de canales, los archivos de sesión, la entrega de mensajes visibles,
las herramientas dinámicas de OpenClaw, las aprobaciones, la entrega de contenido
multimedia y una copia de la transcripción en torno a ese límite.

El enrutamiento de solicitudes sigue el entorno de ejecución seleccionado, no
solo la cadena del proveedor. Un turno nativo de Codex recibe las instrucciones
para desarrolladores del servidor de aplicaciones de Codex; una ruta explícita
de compatibilidad con OpenClaw conserva el mensaje de sistema habitual de
OpenClaw incluso cuando utiliza autenticación o transporte de OpenAI con formato
de Codex.

OpenClaw inicia y reanuda hilos nativos de Codex con la personalidad integrada
de Codex desactivada (`personality: "none"`) para que los archivos de personalidad
del espacio de trabajo y la identidad del agente de OpenClaw sigan siendo la
fuente autoritativa. Por lo demás, Codex nativo conserva las instrucciones base
y del modelo controladas por Codex, así como la carga de la documentación del
proyecto. Las ejecuciones ligeras de OpenClaw (por ejemplo, Cron) siguen
suprimiendo la carga de la documentación del proyecto.

Las instrucciones para desarrolladores de OpenClaw abarcan aspectos del entorno
de ejecución de OpenClaw: la entrega al canal de origen, las herramientas
dinámicas de OpenClaw, la delegación de ACP, el contexto del adaptador y los
archivos de perfil activos del espacio de trabajo del agente. Los catálogos de
Skills y los punteros de `MEMORY.md` enrutados mediante herramientas se proyectan
como instrucciones de colaboración para desarrolladores limitadas al turno.
Cuando las herramientas de memoria no están disponibles, el contenido activo de
`BOOTSTRAP.md` y el archivo `MEMORY.md` completo se incorporan en su lugar como
contexto de entrada de texto sin formato para el turno.

La mayoría de las herramientas dinámicas de OpenClaw utilizan el espacio de
nombres consultable `openclaw`. Las herramientas marcadas con
`catalogMode: "direct-only"` utilizan `openclaw_direct`, que Codex mantiene
directamente visible para el modelo como `DirectModelOnly`, en lugar de
exponerlo a la ejecución anidada del modo de código.

## Vinculaciones de hilos y cambios de modelo

Cuando una sesión de OpenClaw está vinculada a un hilo existente de Codex, el
siguiente turno vuelve a enviar al servidor de aplicaciones el modelo
seleccionado actualmente, la política de aprobación, el entorno aislado, el
revisor de aprobaciones y el nivel de servicio. Cambiar de
`openai/gpt-5.5` a `openai/gpt-5.2` conserva la vinculación del hilo, pero
solicita a Codex que continúe con el modelo recién seleccionado.

Las vinculaciones supervisadas son la excepción. El selector de modelos de
OpenClaw permanece bloqueado y las reanudaciones omiten las sustituciones del
modelo y del proveedor para que Codex restaure el modelo y el proveedor
persistentes del hilo canónico. Un control nativo independiente de Codex puede
cambiar ese par persistente, y la instantánea inicial puede producir la
advertencia habitual de Codex sobre diferencias de modelo; el modelo externo
de OpenClaw y la cadena de alternativas nunca sustituyen a ninguno de los dos.

## Supervisión y continuación segura

La supervisión de Codex es una capacidad opcional del mismo Plugin `codex`.
Detecta hilos nativos mediante una conexión independiente y proyecta únicamente
las sesiones no archivadas en el catálogo del Gateway. Sin una configuración
explícita de conexión de `appServer`, esa conexión utiliza la entrada/salida
estándar administrada del directorio principal del usuario, mientras que el
arnés habitual permanece limitado al agente. Las consultas de listas y las
lecturas de metadatos son pasivas: no reanudan ningún hilo, no suscriben a
OpenClaw a sus eventos en directo ni responden a sus aprobaciones.

Para una sesión almacenada o inactiva en el equipo del Gateway, **Continuar como rama**
crea un Chat normal con el modelo bloqueado y replica un historial acotado del
usuario y del asistente hasta el último turno terminal persistido del origen. El
primer turno normal de Chat instala los controladores de aprobación reales y
utiliza una bifurcación nativa temporal para fijar la instantánea sin sustituir
el modelo ni el proveedor. El servidor de aplicaciones de Codex utiliza su
configuración nativa actual y devuelve el par seleccionado; emite su advertencia
habitual si ese modelo difiere del último modelo registrado en el origen. En la
misma conexión de supervisión, OpenClaw inicia el hilo canónico del arnés de
Codex cuyo origen es `appServer`, con su directorio de trabajo y su política de
ejecución, utilizando exactamente el modelo y el proveedor devueltos para ese
inicio inicial, inyecta el historial visible acotado y archiva la bifurcación
temporal. El origen nunca se reanuda. El hilo canónico dispone de toda la
superficie de herramientas del arnés de OpenClaw; el razonamiento, las llamadas
a herramientas y los resultados de herramientas del origen no se clonan en él.
El ámbito privado de la conexión se conserva durante los estados de vinculación
pendientes y confirmados, por lo que todos los turnos posteriores permanecen en
esa conexión con la autenticación y la configuración del proveedor nativas. Si
la supervisión está desactivada o la vinculación y la conexión dejan de
coincidir, el proceso falla de forma cerrada en lugar de cambiar al arnés
habitual del directorio principal del agente.

El origen original de la CLI o de VS Code sigue siendo apto para ambos
catálogos. La rama canónica es un hilo nativo de Codex, pero su tipo de origen es
`appServer`; los clientes nativos pueden filtrar ese tipo de origen, por lo que
no se garantiza que aparezca en Codex Desktop.

Los orígenes activos no pueden iniciar una rama nueva ni archivarse; aun así, se
puede abrir un Chat supervisado existente. `notLoaded` significa que se desconoce
la actividad, no que esté inactivo; OpenClaw solo permite archivar una fila local
`idle` o `notLoaded` tras una confirmación explícita de que no hay otro ejecutor
y una lectura reciente del estado local del proceso. Codex serializa las
mutaciones de hilos dentro de un único proceso del servidor de aplicaciones,
pero no proporciona un arrendamiento exclusivo entre procesos para el ejecutor
o el propietario de las aprobaciones, por lo que esa lectura no puede demostrar
que otro proceso no esté utilizando el hilo. OpenClaw bloquea a un propietario
de vinculación activo conocido para el destino exacto o para cualquier
descendiente generado y no archivado que devuelva la consulta paginada de
descendientes de Codex. Los errores de enumeración, los ciclos y el agotamiento
del límite de seguridad provocan un fallo cerrado. El archivado nativo todavía
puede coincidir en una condición de carrera con un turno nuevo de otro proceso,
por lo que la confirmación abarca los clientes desconocidos y el intervalo entre
la lectura del estado y el archivado. Un Chat supervisado con el modelo bloqueado
no se puede eliminar mientras proteja la vinculación nativa.

Los catálogos de nodos emparejados se limitan a metadatos en la versión inicial. El límite actual de invocación de nodos es de solicitud/respuesta y no puede transportar los eventos de turno de larga duración, las solicitudes de aprobación ni la salida en streaming que requiere una integración real con el arnés de Codex. Por lo tanto, **Continuar** y **Archivar** de forma remota siguen sin estar disponibles incluso cuando la fila está inactiva.

Consulte [Supervisión de Codex](/es/plugins/codex-supervision) para conocer la configuración del operador y el comportamiento visible de la interfaz de control.

## Respuestas visibles y heartbeats

Los turnos de chat directos o de origen mediante el arnés de Codex utilizan de forma predeterminada la entrega automática de la respuesta final del asistente en las superficies internas de WebChat, de acuerdo con el contrato del arnés de Pi: el agente responde normalmente y OpenClaw publica el texto final en la conversación de origen. Establezca `messages.visibleReplies: "message_tool"` para mantener privado el texto final del asistente, salvo que el agente llame a `message(action="send")`.

Los turnos de heartbeat de Codex incluyen `heartbeat_respond` de forma predeterminada en el catálogo de herramientas consultable de OpenClaw, para que el agente pueda registrar si la activación debe permanecer silenciosa o enviar una notificación. Las directrices de iniciativa del heartbeat se envían como una instrucción de desarrollador del modo de colaboración de Codex limitada al turno de heartbeat; los turnos de chat normales permanecen en el modo Default de Codex. Cuando `HEARTBEAT.md` no está vacío, las instrucciones del heartbeat remiten a Codex al archivo en lugar de insertar su contenido.

## Límites de los hooks

| Capa                                  | Propietario                        | Finalidad                                                                       |
| ------------------------------------- | ---------------------------------- | ------------------------------------------------------------------------------- |
| Hooks de plugins de OpenClaw          | OpenClaw                           | Compatibilidad del producto y los plugins entre OpenClaw y los arneses de Codex. |
| Middleware de extensión de app-server de Codex | Plugins incluidos con OpenClaw | Comportamiento del adaptador por turno en torno a las herramientas dinámicas de OpenClaw. |
| Hooks nativos de Codex                | Codex                              | Ciclo de vida de bajo nivel de Codex y política de herramientas nativas definida en la configuración de Codex. |

OpenClaw no utiliza archivos `hooks.json` de proyecto ni globales de Codex para enrutar el comportamiento de los plugins. Para el puente de herramientas nativas y permisos, OpenClaw inyecta una configuración de Codex por hilo para `PreToolUse`, `PostToolUse`, `PermissionRequest` y `Stop`.

Cuando las aprobaciones de app-server de Codex están habilitadas (`approvalPolicy` no es `"never"`), la configuración predeterminada de hooks nativos inyectada omite `PermissionRequest`, de modo que el revisor de app-server de Codex y el puente de aprobación de OpenClaw gestionen las escalaciones reales después de la revisión. Añada `permission_request` a `nativeHookRelay.events` para forzar de todos modos el relé de compatibilidad. Otros hooks de Codex, como `SessionStart` y `UserPromptSubmit`, siguen siendo controles del nivel de Codex; no se exponen como hooks de plugins de OpenClaw en el contrato v1.

Para las herramientas dinámicas de OpenClaw, OpenClaw ejecuta la herramienta después de que Codex solicita la llamada, por lo que el comportamiento de los plugins y del middleware se ejecuta en el adaptador del arnés. Para las herramientas nativas de Codex, Codex es el propietario del registro canónico de la herramienta; OpenClaw puede reflejar eventos seleccionados, pero no puede reescribir el hilo nativo a menos que Codex lo exponga mediante app-server o callbacks de hooks nativos.

Los eventos `PreToolUse` en modo de informe de app-server de Codex aplazan la aprobación del plugin hasta la aprobación correspondiente de app-server. Si un hook `before_tool_call` de OpenClaw devuelve `requireApproval` mientras la carga útil nativa establece `openclaw_approval_mode:
"report"`, el relé de hooks nativos registra el requisito de aprobación del plugin y no devuelve ninguna decisión nativa. Cuando Codex envía posteriormente la solicitud de aprobación de app-server para el mismo uso de herramienta, OpenClaw abre la solicitud de aprobación del plugin y asigna la decisión de vuelta a Codex. Los eventos `PermissionRequest` de Codex constituyen una ruta de aprobación independiente y aún pueden enrutarse mediante las aprobaciones de OpenClaw cuando se configuran para ese puente.

Las notificaciones de elementos de app-server de Codex también proporcionan observaciones asíncronas de `after_tool_call` para las finalizaciones de herramientas nativas que el relé nativo de `PostToolUse` aún no cubre. Estas sirven únicamente para telemetría y compatibilidad; no pueden bloquear, retrasar ni modificar la llamada a la herramienta nativa.

Las proyecciones de Compaction y del ciclo de vida del LLM proceden de las notificaciones de app-server de Codex y del estado del adaptador de OpenClaw, no de comandos de hooks nativos de Codex. `before_compaction`, `after_compaction`, `llm_input` y `llm_output` son observaciones del nivel del adaptador, no capturas byte por byte de las solicitudes internas ni de las cargas útiles de Compaction de Codex.

Las notificaciones nativas `hook/started` y `hook/completed` de app-server de Codex se proyectan como eventos de agente `codex_app_server.hook` para la trayectoria y la depuración. No invocan hooks de plugins de OpenClaw.

## Contrato de compatibilidad de V1

Compatible con el entorno de ejecución v1 de Codex:

| Superficie                                    | Compatibilidad                                                                   | Motivo                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| --------------------------------------------- | -------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Bucle de modelos de OpenAI mediante Codex     | Compatible                                                                       | Codex app-server controla el turno de OpenAI, la reanudación nativa de hilos y la continuación nativa de herramientas.                                                                                                                                                                                                                                                                                                                                                                  |
| Enrutamiento y entrega de canales de OpenClaw | Compatible                                                                       | Telegram, Discord, Slack, WhatsApp, iMessage y otros canales permanecen fuera del entorno de ejecución del modelo.                                                                                                                                                                                                                                                                                                                                                                      |
| Herramientas dinámicas de OpenClaw            | Compatible                                                                       | Codex solicita a OpenClaw que ejecute estas herramientas, por lo que OpenClaw permanece en la ruta de ejecución.                                                                                                                                                                                                                                                                                                                                                                        |
| Plugins de instrucciones y contexto           | Compatible                                                                       | OpenClaw proyecta las instrucciones y el contexto específicos de OpenClaw en el turno de Codex, mientras mantiene las instrucciones base, del modelo y de los documentos de proyecto configurados que controla Codex en la ruta nativa de Codex. OpenClaw desactiva la personalidad integrada de Codex para los hilos nativos, de modo que los archivos de personalidad del espacio de trabajo del agente sigan siendo la fuente autoritativa. Las instrucciones nativas para desarrolladores de Codex solo aceptan indicaciones de comandos cuyo ámbito se haya definido explícitamente como `codex_app_server`; las indicaciones globales de comandos heredadas se mantienen para las superficies de instrucciones ajenas a Codex. |
| Ciclo de vida del motor de contexto            | Compatible                                                                       | El ensamblaje, la ingesta y el mantenimiento posterior al turno se ejecutan en torno a los turnos de Codex. Los motores de contexto no sustituyen la Compaction nativa de Codex.                                                                                                                                                                                                                                                                                                         |
| Hooks de herramientas dinámicas               | Compatible                                                                       | `before_tool_call`, `after_tool_call` y el middleware de resultados de herramientas se ejecutan en torno a las herramientas dinámicas controladas por OpenClaw.                                                                                                                                                                                                                                                                                                                         |
| Hooks del ciclo de vida                       | Compatible como observaciones del adaptador                                      | `llm_input`, `llm_output`, `agent_end`, `before_compaction` y `after_compaction` se activan con cargas útiles fieles al modo Codex.                                                                                                                                                                                                                                                                                                                                                      |
| Puerta de revisión de la respuesta final      | Compatible mediante la retransmisión de hooks nativos                            | El evento `Stop` de Codex se retransmite a `before_agent_finalize`; `revise` solicita a Codex una pasada más del modelo antes de la finalización.                                                                                                                                                                                                                                                                                                                                       |
| Bloqueo u observación nativos de shell, parches y MCP | Compatible mediante la retransmisión de hooks nativos                     | Los eventos `PreToolUse` y `PostToolUse` de Codex se retransmiten para las superficies de herramientas nativas confirmadas, incluidas las cargas útiles de MCP en Codex app-server `0.142.0` o posterior. Se admite el bloqueo, pero no la reescritura de argumentos.                                                                                                                                                                                                                     |
| Política de permisos nativos                  | Compatible mediante las aprobaciones de Codex app-server y la retransmisión compatible de hooks nativos | Las solicitudes de aprobación de Codex app-server se encaminan mediante OpenClaw después de la revisión de Codex. La retransmisión del hook nativo `PermissionRequest` es opcional para los modos de aprobación nativos porque Codex lo emite antes de la revisión del guardián.                                                                                                                                                                                                         |
| Captura de la trayectoria de app-server       | Compatible                                                                       | OpenClaw registra la solicitud que envió a app-server y las notificaciones que recibe de este.                                                                                                                                                                                                                                                                                                                                                                                          |

No compatible con el entorno de ejecución Codex v1:

| Superficie                                          | Límite de V1                                                                                                                                         | Ruta futura                                                                                         |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Mutación de argumentos de herramientas nativas      | Los hooks nativos previos a las herramientas de Codex pueden bloquear, pero OpenClaw no reescribe los argumentos de las herramientas nativas de Codex. | Requiere compatibilidad de hooks/esquemas de Codex para sustituir la entrada de la herramienta.     |
| Historial editable de transcripciones nativas de Codex | Codex controla el historial canónico de hilos nativos. OpenClaw controla un reflejo y puede proyectar contexto futuro, pero no debe modificar componentes internos no compatibles. | Añadir API explícitas de Codex app-server si se necesita intervenir en los hilos nativos.           |
| `tool_result_persist` para registros de herramientas nativas de Codex | Ese hook transforma las escrituras de transcripciones controladas por OpenClaw, no los registros de herramientas nativas de Codex.              | Se podrían reflejar los registros transformados, pero la reescritura canónica requiere compatibilidad de Codex. |
| Metadatos enriquecidos de Compaction nativa         | OpenClaw puede solicitar la Compaction nativa, pero no recibe una lista estable de elementos conservados/descartados, la diferencia de tokens, un resumen de finalización ni una carga útil de resumen. | Requiere eventos de Compaction de Codex más completos.                                              |
| Intervención en la Compaction                       | OpenClaw no permite que los plugins ni los motores de contexto veten, reescriban o sustituyan la Compaction nativa de Codex.                         | Añadir hooks de Codex anteriores y posteriores a la Compaction si los plugins necesitan vetarla o reescribirla. |
| Captura byte por byte de solicitudes de la API del modelo | OpenClaw puede capturar solicitudes y notificaciones de app-server, pero el núcleo de Codex crea internamente la solicitud final de la API de OpenAI. | Requiere un evento de seguimiento de solicitudes del modelo o una API de depuración de Codex.       |

## Permisos nativos y solicitudes de información de MCP

Para `PermissionRequest`, OpenClaw solo devuelve decisiones explícitas de
permitir o denegar cuando la política toma una decisión. Un resultado sin
decisión no equivale a permitir: Codex lo trata como si el hook no hubiera
tomado ninguna decisión y recurre a su propio guardián o a la ruta de
aprobación del usuario.

Los modos de aprobación de Codex app-server omiten este hook nativo de forma
predeterminada. Esto se aplica salvo que `permission_request` se incluya
explícitamente en `nativeHookRelay.events` o que un entorno de ejecución de
compatibilidad lo instale.

Cuando un operador elige `allow-always` para una solicitud de permiso nativo
de Codex, OpenClaw recuerda esa huella digital exacta de
proveedor/sesión/entrada de herramienta/cwd durante un periodo limitado de la
sesión. La decisión recordada solo se aplica intencionadamente a coincidencias
exactas: cualquier cambio en el comando, los argumentos, la carga útil de la
herramienta o el cwd genera una nueva aprobación.

Las solicitudes de aprobación de herramientas MCP de Codex se encaminan
mediante el flujo de aprobación de plugins de OpenClaw cuando Codex marca
`_meta.codex_approval_kind` como `"mcp_tool_call"`. Las solicitudes
`request_user_input` de Codex se envían de vuelta al chat de origen, y el
siguiente mensaje de seguimiento en cola responde a esa solicitud del
servidor nativo en lugar de dirigirse como contexto adicional. Las demás
solicitudes de información de MCP fallan de forma segura.

Para consultar el flujo general de aprobación de plugins que transporta estas
solicitudes, véase [Solicitudes de permisos de plugins](/es/plugins/plugin-permission-requests).

## Direccionamiento de la cola

El direccionamiento de la cola de una ejecución activa se asigna a
`turn/steer` de Codex app-server. Con el valor predeterminado
`messages.queue.mode: "steer"`, OpenClaw agrupa los mensajes de chat en modo de
direccionamiento durante el intervalo de inactividad configurado y los envía
como una única solicitud `turn/steer` en orden de llegada.

Las revisiones de Codex y los turnos de Compaction manual pueden rechazar el direccionamiento en el mismo turno. En
ese caso, OpenClaw espera a que finalice la ejecución activa antes de iniciar el
prompt. Use `/queue followup` o `/queue collect` cuando los mensajes deban ponerse en cola
de forma predeterminada en lugar de direccionarse. Consulte [Cola de direccionamiento](/es/concepts/queue-steering).

## Carga de comentarios de Codex

Cuando se aprueba `/diagnostics [note]` para una sesión en el entorno nativo de
Codex, OpenClaw también llama a `feedback/upload` del servidor de aplicaciones de Codex para los
hilos de Codex pertinentes, incluidos los registros de cada hilo enumerado y de los
subhilos de Codex generados, cuando estén disponibles.

La carga se realiza mediante la ruta normal de comentarios de Codex hacia los servidores de OpenAI. Si
los comentarios de Codex están deshabilitados en ese servidor de aplicaciones, el comando devuelve el
error del servidor de aplicaciones. La respuesta de diagnóstico completado enumera los canales,
los identificadores de sesión de OpenClaw, los identificadores de hilo de Codex y los comandos locales
`codex resume <thread-id>` de los hilos enviados.

Si se deniega o ignora la aprobación, OpenClaw no muestra esos identificadores de Codex
ni envía comentarios de Codex. La carga no sustituye la exportación local de
diagnósticos del Gateway. Consulte [Exportación de diagnósticos](/es/gateway/diagnostics) para conocer
el comportamiento relativo a la aprobación, la privacidad, el paquete local y los chats grupales.

Use `/codex diagnostics [note]` solo cuando desee cargar los comentarios de Codex
para el hilo adjunto actualmente sin el paquete completo de diagnósticos del
Gateway.

## Compaction y réplica de la transcripción

Cuando el modelo seleccionado utiliza el entorno de Codex, la compactación nativa del hilo
pertenece al servidor de aplicaciones de Codex. OpenClaw no ejecuta una compactación previa para
los turnos de Codex, no sustituye la compactación de Codex por la compactación del motor de contexto ni
recurre como alternativa a la generación de resúmenes de OpenClaw o de la API pública de OpenAI cuando no se puede
iniciar la compactación nativa. OpenClaw mantiene una réplica de la transcripción para el historial del canal, la búsqueda,
`/new`, `/reset` y futuros cambios de modelo o entorno.

Las solicitudes explícitas de compactación, como `/compact` o una operación manual de
compactación solicitada por un plugin, inician la compactación nativa de Codex mediante `thread/compact/start`.
OpenClaw mantiene abiertos la solicitud y el arrendamiento del cliente compartido hasta que Codex emite el
elemento de finalización `contextCompaction` correspondiente y, a continuación, informa que el turno de compactación
ha finalizado. Si ese turno terminal supera el tiempo de espera de compactación configurado,
OpenClaw solicita una interrupción nativa del turno. El arrendamiento y el bloqueo de compactación
por hilo permanecen retenidos hasta que Codex informa del estado terminal o confirma
la RPC de interrupción. Si Codex no la confirma dentro del período de gracia de la
interrupción, OpenClaw retira la conexión antes de liberar el bloqueo. Las conexiones
remotas también desvinculan el hilo correspondiente para impedir que trabajos posteriores
se solapen con un turno remoto no confirmado. Los demás turnos de una conexión retirada fallan
y pueden volver a intentarse con un cliente nuevo. El cierre del cliente, la cancelación de la solicitud o un
turno de compactación fallido devuelven una operación fallida. La compactación automática por presión
de contexto es responsabilidad de Codex; OpenClaw solo inicia la compactación nativa para activadores
solicitados manualmente.

Cuando un motor de contexto solicita la proyección de inicialización de un hilo de Codex, OpenClaw
proyecta los nombres e identificadores de las llamadas a herramientas, las formas de entrada y el contenido
censurado de los resultados de herramientas en el hilo nuevo de Codex. No copia los valores sin procesar
de los argumentos de las llamadas a herramientas en esa proyección.

La réplica incluye el prompt del usuario, el texto final del asistente y registros ligeros
del razonamiento o el plan de Codex cuando el servidor de aplicaciones los emite. OpenClaw
registra el inicio y el estado terminal de la compactación nativa, pero no
expone un resumen legible de la compactación ni una lista auditable de las
entradas que Codex conservó después de la compactación.

Como Codex posee el hilo nativo canónico, `tool_result_persist` no
reescribe los registros de resultados de herramientas nativos de Codex. Solo se aplica cuando OpenClaw
escribe un resultado de herramienta en la transcripción de una sesión propiedad de OpenClaw.

## Contenido multimedia y entrega

OpenClaw continúa controlando la entrega de contenido multimedia y la selección del proveedor de contenido multimedia. La comprensión
de imágenes, vídeo, música, PDF, TTS y contenido multimedia utiliza la configuración correspondiente
del proveedor o modelo, como `agents.defaults.imageGenerationModel`,
`videoGenerationModel`, `pdfModel` y `messages.tts`.

El texto, las imágenes, el vídeo, la música, TTS, las aprobaciones y la salida de las herramientas de mensajería continúan
por la ruta normal de entrega de OpenClaw; la generación de contenido multimedia no requiere
el entorno heredado. Cuando Codex emite un elemento nativo de generación de imágenes con un
`savedPath`, OpenClaw reenvía ese archivo exacto mediante la ruta normal de contenido multimedia
de respuesta, incluso si el turno de Codex no contiene texto del asistente.

## Contenido relacionado

- [Entorno de Codex](/es/plugins/codex-harness)
- [Referencia del entorno de Codex](/es/plugins/codex-harness-reference)
- [Supervisión de Codex](/es/plugins/codex-supervision)
- [Plugins nativos de Codex](/es/plugins/codex-native-plugins)
- [Hooks de Plugin](/es/plugins/hooks)
- [Plugins de entorno de agente](/es/plugins/sdk-agent-harness)
- [Exportación de diagnósticos](/es/gateway/diagnostics)
- [Exportación de trayectorias](/es/tools/trajectory)

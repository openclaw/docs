---
read_when:
    - Necesitas el contrato de compatibilidad del entorno de ejecución del harness de Codex
    - Está depurando herramientas nativas de Codex, hooks, Compaction o la carga de comentarios
    - Está cambiando el comportamiento del plugin en los turnos de los arneses de OpenClaw y Codex
summary: Límites del entorno de ejecución, hooks, herramientas, permisos y diagnósticos del arnés de Codex
title: Entorno de ejecución del arnés de Codex
x-i18n:
    generated_at: "2026-07-19T02:10:29Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 516d70dee056657a06206c7ca4215f3776ccd2b027a136b5cc8fea3b11c1cd0b
    source_path: plugins/codex-harness-runtime.md
    workflow: 16
---

Contrato de ejecución para los turnos del arnés de Codex. Para la configuración y el enrutamiento, consulte
[Arnés de Codex](/es/plugins/codex-harness). Para los campos de configuración, consulte
[Referencia del arnés de Codex](/es/plugins/codex-harness-reference).

## Descripción general

Codex controla el bucle nativo del modelo, la reanudación nativa de hilos, la
continuación nativa de herramientas y la Compaction nativa. OpenClaw controla el
enrutamiento de canales, los archivos de sesión, la entrega de mensajes visibles,
las herramientas dinámicas de OpenClaw, las aprobaciones, la entrega de contenido
multimedia y una copia del registro de la conversación alrededor de ese límite.

El enrutamiento de instrucciones sigue el entorno de ejecución seleccionado, no
solo la cadena del proveedor. Un turno nativo de Codex recibe las instrucciones
para desarrolladores del servidor de aplicaciones de Codex; una ruta explícita
de compatibilidad con OpenClaw conserva las instrucciones normales del sistema
de OpenClaw incluso cuando utiliza autenticación o transporte de OpenAI propios
de Codex.

OpenClaw inicia y reanuda hilos nativos de Codex con la personalidad integrada
de Codex deshabilitada (`personality: "none"`) para que los archivos de personalidad
del espacio de trabajo y la identidad del agente de OpenClaw sigan siendo la
fuente autoritativa. Por lo demás, Codex nativo conserva las instrucciones base
y del modelo controladas por Codex, así como la carga de documentación del
proyecto. Las ejecuciones ligeras de OpenClaw (por ejemplo, cron) siguen
suprimiendo la carga de documentación del proyecto.

Las instrucciones para desarrolladores de OpenClaw abarcan aspectos del entorno
de ejecución de OpenClaw: entrega al canal de origen, herramientas dinámicas de
OpenClaw, delegación de ACP, contexto del adaptador y archivos de perfil activos
del espacio de trabajo del agente. Los catálogos de Skills y los punteros
`MEMORY.md` enrutados mediante herramientas se proyectan como instrucciones
de colaboración para desarrolladores limitadas al turno. Cuando las herramientas
de memoria no están disponibles, el contenido activo de `BOOTSTRAP.md` y el
`MEMORY.md` completo se incorporan en su lugar al contexto de entrada de
texto sin formato del turno.

La mayoría de las herramientas dinámicas de OpenClaw utilizan el espacio de
nombres consultable `openclaw`. Las herramientas marcadas como
`catalogMode: "direct-only"` utilizan `openclaw_direct`, que Codex mantiene visible
directamente para el modelo como `DirectModelOnly`, en lugar de exponerlo a una
ejecución anidada del modo de código.

## Enlaces de hilos y cambios de modelo

Cuando una sesión de OpenClaw se adjunta a un hilo de Codex existente, el
siguiente turno vuelve a enviar al servidor de aplicaciones el modelo
seleccionado actualmente, la política de aprobación, el entorno aislado, el
revisor de aprobaciones y el nivel de servicio. Cambiar de
`openai/gpt-5.5` a `openai/gpt-5.2` conserva el enlace del hilo, pero solicita
a Codex que continúe con el modelo recién seleccionado.

Los enlaces supervisados son la excepción. El selector de modelos de OpenClaw
permanece bloqueado y las reanudaciones omiten las sustituciones del modelo y
del proveedor para que Codex restaure el modelo y el proveedor persistentes del
hilo canónico. Un control nativo independiente de Codex puede cambiar ese par
persistente, y la instantánea inicial puede generar la advertencia normal de
Codex sobre diferencias de modelo; el modelo externo de OpenClaw y la cadena de
reserva nunca sustituyen a ninguno de los dos.

## Supervisión y continuación segura

La supervisión de Codex es una capacidad opcional del mismo Plugin
`codex`. Detecta hilos nativos mediante una conexión independiente y
proyecta en el catálogo del Gateway únicamente las sesiones no archivadas. Sin
una configuración de conexión `appServer` explícita, esa conexión utiliza
la entrada/salida estándar administrada del directorio personal del usuario,
mientras que el arnés normal permanece limitado al agente. La enumeración y las
lecturas de metadatos son pasivas: no reanudan un hilo, no suscriben a OpenClaw a
sus eventos en directo ni responden a sus aprobaciones.

Para una sesión almacenada o inactiva en el equipo del Gateway, **Continuar como
rama** crea un chat normal con el modelo bloqueado y refleja un historial
acotado del usuario y del asistente hasta el último turno terminal persistente
del origen. El primer turno del chat normal instala los controladores de
aprobación reales y utiliza una bifurcación nativa temporal para fijar la
instantánea sin sustituir el modelo ni el proveedor. El servidor de aplicaciones
de Codex utiliza su configuración nativa actual y devuelve el par seleccionado;
emite su advertencia normal si ese modelo difiere del último modelo registrado
en el origen. En la misma conexión de supervisión, OpenClaw inicia el hilo
canónico del arnés de Codex cuyo origen es `appServer` conforme a su
directorio de trabajo y su política de ejecución, usando exactamente el modelo
y el proveedor devueltos para ese inicio, inserta el historial visible acotado y
archiva la bifurcación temporal. El origen nunca se reanuda. El hilo canónico
dispone de toda la superficie de herramientas del arnés de OpenClaw; el
razonamiento, las llamadas a herramientas y los resultados de herramientas del
origen no se clonan en él. El ámbito de conexión privado persiste durante los
estados de enlace pendiente y confirmado, por lo que cada turno posterior
permanece en esa conexión con la autenticación y la configuración nativas del
proveedor. Una supervisión deshabilitada o una divergencia del enlace o de la
conexión producen un cierre seguro en lugar de cambiar al arnés normal del
directorio personal del agente.

El origen original de CLI, VS Code, Atlas o ChatGPT sigue pudiendo aparecer en
ambos catálogos. La rama canónica es un hilo nativo de Codex, pero su tipo de
origen es `appServer`; los clientes nativos pueden filtrar ese tipo de
origen, por lo que no se garantiza su aparición en Codex Desktop.

Los orígenes activos no pueden iniciar una rama nueva ni archivarse; aun así, se
puede abrir un chat supervisado existente. `notLoaded` significa que la
actividad es desconocida, no que esté inactiva; OpenClaw solo permite archivar
una fila local `idle` o `notLoaded` tras una confirmación
explícita de que no hay otro ejecutor y una lectura reciente del estado local
del proceso. Codex serializa las mutaciones de hilos dentro de un proceso del
servidor de aplicaciones, pero no proporciona un arrendamiento exclusivo entre
procesos para el ejecutor o el responsable de aprobaciones, por lo que esa
lectura no puede demostrar que otro proceso no esté utilizando el hilo.
OpenClaw bloquea un propietario de enlace activo conocido para el destino exacto
o para cualquier descendiente generado no archivado que devuelva la consulta
paginada de descendientes de Codex. Los errores de enumeración, los ciclos y el
agotamiento del límite de seguridad producen un cierre seguro. El archivado
nativo aún puede entrar en una condición de carrera con un turno nuevo de otro
proceso, por lo que la confirmación cubre los clientes desconocidos y el
intervalo entre la lectura del estado y el archivado. No se puede eliminar un
chat supervisado con el modelo bloqueado mientras proteja el enlace nativo.

Los catálogos de nodos emparejados se limitan a metadatos en la versión inicial.
El límite actual de invocación del Node es de solicitud/respuesta y no puede
transportar los eventos de turno de larga duración, las solicitudes de
aprobación ni la salida en transmisión necesarias para un enlace real del arnés
de Codex. Por tanto, las opciones remotas **Continuar** y **Archivar** siguen sin
estar disponibles incluso cuando la fila está inactiva.

Consulte [Supervisión de Codex](/es/plugins/codex-supervision) para conocer la
configuración del operador y el comportamiento visible de la interfaz de control.

## Respuestas visibles y Heartbeats

Los turnos de chat directos o del origen mediante el arnés de Codex utilizan de
forma predeterminada la entrega final automática del asistente en las
superficies internas de WebChat, de acuerdo con el contrato del arnés de Pi: el
agente responde normalmente y OpenClaw publica el texto final en la conversación
de origen. Establezca `messages.visibleReplies: "message_tool"` para mantener privado el texto final del
asistente, salvo que el agente llame a `message(action="send")`.

Los turnos de Heartbeat de Codex reciben `heartbeat_respond` en el catálogo
consultable de herramientas de OpenClaw de forma predeterminada, para que el
agente pueda registrar si la activación debe permanecer silenciosa o enviar una
notificación. Las directrices de iniciativa de Heartbeat se envían como una
instrucción para desarrolladores del modo de colaboración de Codex limitada al
turno de Heartbeat; los turnos de chat normales permanecen en el modo
predeterminado de Codex. Cuando `HEARTBEAT.md` no está vacío, las
instrucciones de Heartbeat remiten a Codex al archivo en lugar de incorporar su
contenido directamente.

## Límites de los hooks

| Capa                                  | Propietario              | Finalidad                                                                    |
| ------------------------------------- | ------------------------ | --------------------------------------------------------------------------- |
| Hooks de Plugin de OpenClaw           | OpenClaw                 | Compatibilidad de productos y Plugins entre OpenClaw y los arneses de Codex. |
| Middleware de extensión del servidor de aplicaciones de Codex | Plugins incluidos con OpenClaw | Comportamiento del adaptador en cada turno alrededor de las herramientas dinámicas de OpenClaw. |
| Hooks nativos de Codex                | Codex                    | Ciclo de vida de bajo nivel de Codex y política de herramientas nativas procedente de la configuración de Codex. |

OpenClaw no utiliza los archivos `hooks.json` de Codex del proyecto o
globales para enrutar el comportamiento de los Plugins. Para el puente de
herramientas y permisos nativos, OpenClaw inyecta la configuración de Codex por
hilo para `PreToolUse`, `PostToolUse`, `PermissionRequest` y
`Stop`.

Cuando las aprobaciones del servidor de aplicaciones de Codex están habilitadas
(`approvalPolicy` no es `"never"`), la configuración predeterminada
inyectada de hooks nativos omite `PermissionRequest` para que el revisor del
servidor de aplicaciones de Codex y el puente de aprobaciones de OpenClaw
gestionen las escaladas reales después de la revisión. Añada
`permission_request` a `nativeHookRelay.events` para forzar de todos modos el relé de
compatibilidad. Otros hooks de Codex, como `SessionStart` y
`UserPromptSubmit`, siguen siendo controles del nivel de Codex; no se exponen
como hooks de Plugin de OpenClaw en el contrato v1.

Para las herramientas dinámicas de OpenClaw, OpenClaw ejecuta la herramienta
después de que Codex solicite la llamada, por lo que el comportamiento del
Plugin y del middleware se ejecuta en el adaptador del arnés. En el caso de las
herramientas nativas de Codex, Codex controla el registro canónico de la
herramienta; OpenClaw puede reflejar determinados eventos, pero no puede
reescribir el hilo nativo a menos que Codex lo exponga mediante el servidor de
aplicaciones o las devoluciones de llamada de hooks nativos.

Los eventos `PreToolUse` del modo de informe del servidor de aplicaciones
de Codex aplazan la aprobación del Plugin hasta la aprobación correspondiente
del servidor de aplicaciones. Si un hook `before_tool_call` de OpenClaw devuelve
`requireApproval` mientras la carga útil nativa establece
`openclaw_approval_mode:
"report"`, el relé del hook nativo registra el requisito de aprobación
del Plugin y no devuelve ninguna decisión nativa. Cuando Codex envía más tarde
la solicitud de aprobación del servidor de aplicaciones para el mismo uso de
la herramienta, OpenClaw abre el mensaje de aprobación del Plugin y asigna la
decisión de vuelta a Codex. Los eventos `PermissionRequest` de Codex constituyen
una ruta de aprobación independiente y aún pueden enrutarse mediante las
aprobaciones de OpenClaw cuando se configuran para ese puente.

Las notificaciones de elementos del servidor de aplicaciones de Codex también
proporcionan observaciones asíncronas `after_tool_call` de las finalizaciones de
herramientas nativas que aún no cubre el relé nativo
`PostToolUse`. Estas solo sirven para telemetría y compatibilidad; no pueden
bloquear, retrasar ni modificar la llamada de la herramienta nativa.

Las proyecciones de Compaction y del ciclo de vida del LLM proceden de las
notificaciones del servidor de aplicaciones de Codex y del estado del adaptador
de OpenClaw, no de los comandos de hooks nativos de Codex.
`before_compaction`, `after_compaction`, `llm_input` y
`llm_output` son observaciones del nivel del adaptador, no capturas byte
por byte de las cargas útiles internas de solicitud o Compaction de Codex.

Las notificaciones nativas `hook/started` y `hook/completed` del servidor
de aplicaciones de Codex se proyectan como eventos del agente
`codex_app_server.hook` para el seguimiento de trayectorias y la depuración. No
invocan hooks de Plugins de OpenClaw.

## Contrato de compatibilidad de V1

Compatible con el entorno de ejecución de Codex v1:

| Superficie                                    | Compatibilidad                                                                    | Motivo                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| --------------------------------------------- | -------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Bucle del modelo OpenAI mediante Codex        | Compatible                                                                        | El servidor de aplicaciones de Codex controla el turno de OpenAI, la reanudación nativa de hilos y la continuación nativa de herramientas.                                                                                                                                                                                                                                                                                                                                                           |
| Enrutamiento y entrega de canales de OpenClaw | Compatible                                                                        | Telegram, Discord, Slack, WhatsApp, iMessage y otros canales permanecen fuera del entorno de ejecución del modelo.                                                                                                                                                                                                                                                                                                                                                                                    |
| Herramientas dinámicas de OpenClaw            | Compatible                                                                        | Codex solicita a OpenClaw que ejecute estas herramientas, por lo que OpenClaw permanece en la ruta de ejecución.                                                                                                                                                                                                                                                                                                                                                                                      |
| Plugins de prompt y contexto                  | Compatible                                                                        | OpenClaw proyecta el prompt y el contexto específicos de OpenClaw en el turno de Codex, mientras mantiene los prompts base, de modelo y de documentación del proyecto configurados que pertenecen a Codex en la vía nativa de Codex. OpenClaw desactiva la personalidad integrada de Codex para los hilos nativos, de modo que los archivos de personalidad del espacio de trabajo del agente sigan siendo la referencia autoritativa. Las instrucciones de desarrollador nativas de Codex solo aceptan orientación sobre comandos cuyo ámbito se limita explícitamente a `codex_app_server`; las indicaciones globales de comandos heredadas se mantienen para superficies de prompt que no sean de Codex. |
| Ciclo de vida del motor de contexto           | Compatible                                                                        | El ensamblaje, la ingesta y el mantenimiento posterior al turno se ejecutan alrededor de los turnos de Codex. Los motores de contexto no sustituyen la Compaction nativa de Codex.                                                                                                                                                                                                                                                                                                                     |
| Hooks de herramientas dinámicas               | Compatible                                                                        | `before_tool_call`, `after_tool_call` y el middleware de resultados de herramientas se ejecutan alrededor de las herramientas dinámicas propiedad de OpenClaw.                                                                                                                                                                                                                                                                                                                                        |
| Hooks del ciclo de vida                       | Compatible como observaciones del adaptador                                      | `llm_input`, `llm_output`, `agent_end`, `before_compaction` y `after_compaction` se activan con cargas útiles fieles al modo Codex.                                                                                                                                                                                                                                                                                                                                                  |
| Puerta de revisión de la respuesta final      | Compatible mediante retransmisión de hooks nativos                               | El `Stop` de Codex se retransmite a `before_agent_finalize`; `revise` solicita a Codex una pasada adicional del modelo antes de finalizar.                                                                                                                                                                                                                                                                                                                                             |
| Bloqueo u observación nativos de shell, parches y MCP | Compatible mediante retransmisión de hooks nativos                        | Los `PreToolUse` y `PostToolUse` de Codex se retransmiten para las superficies confirmadas de herramientas nativas, incluidas las cargas útiles de MCP en `0.142.0` o una versión posterior del servidor de aplicaciones de Codex. Se admite el bloqueo, pero no la reescritura de argumentos.                                                                                                                                                                                           |
| Política de permisos nativa                   | Compatible mediante las aprobaciones del servidor de aplicaciones de Codex y la retransmisión de compatibilidad de hooks nativos | Las solicitudes de aprobación del servidor de aplicaciones de Codex se encaminan a través de OpenClaw después de la revisión de Codex. La retransmisión del hook nativo `PermissionRequest` es opcional para los modos de aprobación nativos porque Codex lo emite antes de la revisión del guardián.                                                                                                                                                                                                       |
| Captura de la trayectoria del servidor de aplicaciones | Compatible                                                                | OpenClaw registra la solicitud que envió al servidor de aplicaciones y las notificaciones que recibe de este.                                                                                                                                                                                                                                                                                                                                                                                         |

No compatible con el entorno de ejecución Codex v1:

| Superficie                                          | Límite de V1                                                                                                                                    | Vía futura                                                                                                          |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Mutación de argumentos de herramientas nativas      | Los hooks nativos previos a herramientas de Codex pueden bloquear, pero OpenClaw no reescribe los argumentos de herramientas nativas de Codex.  | Requiere compatibilidad de hooks/esquemas de Codex para sustituir la entrada de la herramienta.                     |
| Historial editable de transcripciones nativas de Codex | Codex controla el historial canónico de hilos nativos. OpenClaw controla una réplica y puede proyectar contexto futuro, pero no debe mutar componentes internos no compatibles. | Añadir API explícitas del servidor de aplicaciones de Codex si se necesita modificar el hilo nativo.               |
| `tool_result_persist` para registros de herramientas nativas de Codex | Ese hook transforma las escrituras de transcripciones propiedad de OpenClaw, no los registros de herramientas nativas de Codex.       | Se podrían replicar los registros transformados, pero la reescritura canónica requiere compatibilidad de Codex.    |
| Metadatos enriquecidos de Compaction nativa         | OpenClaw puede solicitar la Compaction nativa, pero no recibe una lista estable de elementos conservados/descartados, la variación de tokens, un resumen de finalización ni la carga útil del resumen. | Requiere eventos de Compaction de Codex más completos.                                                |
| Intervención en la Compaction                       | OpenClaw no permite que los plugins ni los motores de contexto veten, reescriban o sustituyan la Compaction nativa de Codex.                    | Añadir hooks de Codex previos y posteriores a la Compaction si los plugins necesitan vetarla o reescribirla.       |
| Captura byte por byte de solicitudes de la API del modelo | OpenClaw puede capturar las solicitudes y notificaciones del servidor de aplicaciones, pero el núcleo de Codex crea internamente la solicitud final de la API de OpenAI. | Requiere un evento de seguimiento de solicitudes del modelo de Codex o una API de depuración.                      |

## Permisos nativos y solicitudes de información de MCP

Para `PermissionRequest`, OpenClaw solo devuelve decisiones explícitas de permitir o denegar
cuando la política toma una decisión. Un resultado sin decisión no equivale a permitir: Codex
lo trata como la ausencia de una decisión del hook y recurre a su propio guardián o a la ruta
de aprobación del usuario.

Los modos de aprobación del servidor de aplicaciones de Codex omiten este hook nativo de forma predeterminada. Esto
se aplica salvo que `permission_request` se incluya explícitamente en
`nativeHookRelay.events` o que un entorno de ejecución de compatibilidad lo instale.

Cuando un operador elige `allow-always` para una solicitud de permiso
nativa de Codex, OpenClaw recuerda esa huella digital exacta de proveedor/sesión/entrada de herramienta/cwd
durante un intervalo de sesión limitado. La decisión recordada
solo se aplica intencionadamente a coincidencias exactas: un cambio en el comando, los argumentos, la carga útil de la herramienta o
el cwd genera una nueva aprobación.

Las solicitudes de aprobación de herramientas MCP de Codex se encaminan a través del flujo de aprobación de
plugins de OpenClaw cuando Codex marca `_meta.codex_approval_kind` como `"mcp_tool_call"`. El
`request_user_input` de Codex registra una pregunta del Gateway independiente del proveedor para la
sesión de origen. La interfaz de control muestra la tarjeta de pregunta del Gateway, y una
única opción no secreta utiliza botones de canal tipados cuando el canal los admite.
Las pulsaciones de botones, las respuestas de la interfaz de control y la siguiente respuesta de texto sin formato en cola
resuelven el mismo registro del Gateway antes de que OpenClaw devuelva la respuesta al servidor de aplicaciones.
La resolución automática de Codex y las cancelaciones de intentos limitan la espera y cancelan el registro.
Las preguntas secretas permanecen por completo en la ruta advertida de respuesta por texto. Las demás solicitudes
de información de MCP se cierran de forma segura ante errores.

Para consultar el flujo general de aprobación de plugins que transporta estas solicitudes, véase
[Solicitudes de permisos de plugins](/es/plugins/plugin-permission-requests).

## Dirección de la cola

La gestión de la cola de ejecuciones activas se asigna a `turn/steer` del app-server de Codex. Con el valor predeterminado `messages.queue.mode: "steer"`, OpenClaw agrupa los mensajes de chat del modo de redirección durante el intervalo de inactividad configurado y los envía como una sola solicitud `turn/steer`, en orden de llegada.

Las revisiones de Codex y los turnos de Compaction manual pueden rechazar la redirección en el mismo turno. En ese caso, OpenClaw espera a que finalice la ejecución activa antes de iniciar el prompt. Use `/queue followup` o `/queue collect` cuando los mensajes deban ponerse en cola de forma predeterminada en lugar de redirigirse. Consulte [Cola de redirección](/es/concepts/queue-steering).

## Carga de comentarios de Codex

Cuando se aprueba `/diagnostics [note]` para una sesión en el entorno nativo de Codex, OpenClaw también llama a `feedback/upload` del app-server de Codex para los hilos de Codex pertinentes, incluidos los registros de cada hilo enumerado y los subhilos de Codex generados, cuando estén disponibles.

La carga se realiza mediante la ruta habitual de comentarios de Codex hacia los servidores de OpenAI. Si los comentarios de Codex están deshabilitados en ese app-server, el comando devuelve el error del app-server. La respuesta de diagnóstico completada enumera los canales, los identificadores de sesión de OpenClaw, los identificadores de hilo de Codex y los comandos locales `codex resume <thread-id>` correspondientes a los hilos enviados.

Si se rechaza o ignora la aprobación, OpenClaw no muestra esos identificadores de Codex ni envía comentarios de Codex. La carga no sustituye la exportación local de diagnósticos del Gateway. Consulte [Exportación de diagnósticos](/es/gateway/diagnostics) para obtener información sobre la aprobación, la privacidad, el paquete local y el comportamiento en chats grupales.

Use `/codex diagnostics [note]` solo cuando desee cargar los comentarios de Codex correspondientes al hilo adjunto actualmente sin el paquete completo de diagnósticos del Gateway.

## Compaction y réplica de la transcripción

Cuando el modelo seleccionado utiliza el entorno de Codex, la Compaction nativa de hilos pertenece al app-server de Codex. OpenClaw no ejecuta una Compaction preliminar para los turnos de Codex, no sustituye la Compaction de Codex por la del motor de contexto ni recurre a la creación de resúmenes de OpenClaw o de la API pública de OpenAI cuando no se puede iniciar la Compaction nativa. OpenClaw mantiene una réplica de la transcripción para el historial del canal, las búsquedas, `/new`, `/reset` y futuros cambios de modelo o entorno.

Las solicitudes explícitas de Compaction, como `/compact` o una operación manual de Compaction solicitada por un Plugin, inician la Compaction nativa de Codex mediante `thread/compact/start`. OpenClaw mantiene abiertos la solicitud y el arrendamiento del cliente compartido hasta que Codex emite el elemento de finalización `contextCompaction` correspondiente y, a continuación, informa que el turno de Compaction ha finalizado. Si ese turno terminal supera el tiempo de espera de Compaction configurado, OpenClaw solicita una interrupción nativa del turno. El arrendamiento y el bloqueo de Compaction por hilo permanecen retenidos hasta que Codex informa del estado terminal o confirma la RPC de interrupción. Si Codex no confirma durante el período de gracia de la interrupción, OpenClaw retira la conexión antes de liberar el bloqueo. Las conexiones remotas también desvinculan el hilo correspondiente para que el trabajo posterior no pueda solaparse con un turno remoto sin confirmar. Los demás turnos de una conexión retirada fallan y pueden volver a intentarse con un cliente nuevo. El cierre del cliente, la cancelación de la solicitud o un turno de Compaction fallido devuelven una operación fallida. La Compaction automática debida a la presión del contexto es responsabilidad de Codex; OpenClaw solo inicia la Compaction nativa para activadores solicitados manualmente.

Cuando un motor de contexto solicita la proyección de inicialización de un hilo de Codex, OpenClaw proyecta en el nuevo hilo de Codex los nombres e identificadores de las llamadas a herramientas, las formas de entrada y el contenido censurado de los resultados de las herramientas. No copia en esa proyección los valores sin procesar de los argumentos de las llamadas a herramientas.

La réplica incluye el prompt del usuario, el texto final del asistente y registros ligeros del razonamiento o del plan de Codex cuando el app-server los emite. OpenClaw registra el inicio y el estado terminal de la Compaction nativa, pero no expone un resumen de la Compaction legible para humanos ni una lista auditable de las entradas que Codex conservó después de la Compaction.

Dado que Codex posee el hilo nativo canónico, `tool_result_persist` no reescribe los registros de resultados de herramientas nativos de Codex. Solo se aplica cuando OpenClaw escribe el resultado de una herramienta en una transcripción de sesión propiedad de OpenClaw.

## Contenido multimedia y entrega

OpenClaw sigue siendo responsable de la entrega de contenido multimedia y de la selección del proveedor de contenido multimedia. Las imágenes, los vídeos, la música, los PDF, la TTS y la comprensión de contenido multimedia utilizan la configuración correspondiente del proveedor o modelo, como `agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel` y `messages.tts`.

El texto, las imágenes, los vídeos, la música, la TTS, las aprobaciones y la salida de las herramientas de mensajería continúan por la ruta de entrega habitual de OpenClaw; la generación de contenido multimedia no requiere el entorno heredado. Cuando Codex emite un elemento nativo de generación de imágenes con un `savedPath`, OpenClaw reenvía ese archivo exacto mediante la ruta habitual de contenido multimedia de respuesta, aunque el turno de Codex no contenga texto del asistente.

## Contenido relacionado

- [Entorno de Codex](/es/plugins/codex-harness)
- [Referencia del entorno de Codex](/es/plugins/codex-harness-reference)
- [Supervisión de Codex](/es/plugins/codex-supervision)
- [Plugins nativos de Codex](/es/plugins/codex-native-plugins)
- [Hooks de Plugins](/es/plugins/hooks)
- [Plugins de entorno de agentes](/es/plugins/sdk-agent-harness)
- [Exportación de diagnósticos](/es/gateway/diagnostics)
- [Exportación de trayectorias](/es/tools/trajectory)

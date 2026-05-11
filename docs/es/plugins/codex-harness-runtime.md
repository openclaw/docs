---
read_when:
    - Necesitas el contrato de soporte en tiempo de ejecución del arnés de Codex
    - Estás depurando herramientas nativas de Codex, enlaces, compaction o carga de comentarios
    - Estás cambiando el comportamiento del plugin en turnos del harness PI y Codex
summary: Límites de tiempo de ejecución, puntos de enganche, herramientas, permisos y diagnósticos para el arnés de Codex
title: Tiempo de ejecución del arnés de Codex
x-i18n:
    generated_at: "2026-05-11T20:42:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8373441e725360527f89f66883f2bd1a164de558e82d1dee05c29af6756db25e
    source_path: plugins/codex-harness-runtime.md
    workflow: 16
---

Esta página documenta el contrato de tiempo de ejecución para los turnos del harness de Codex. Para la configuración y el
enrutamiento, empieza con [harness de Codex](/es/plugins/codex-harness). Para los campos de configuración,
consulta [referencia del harness de Codex](/es/plugins/codex-harness-reference).

## Resumen

El modo Codex no es PI con una llamada a un modelo diferente por debajo. Codex posee una mayor parte del
bucle nativo del modelo, y OpenClaw adapta sus superficies de plugin, herramientas, sesión y
diagnóstico alrededor de ese límite.

OpenClaw sigue poseyendo el enrutamiento de canales, los archivos de sesión, la entrega de mensajes visibles,
las herramientas dinámicas de OpenClaw, las aprobaciones, la entrega de medios y un espejo de transcripción.
Codex posee el hilo nativo canónico, el bucle nativo del modelo, la continuación nativa de herramientas
y la Compaction nativa.

## Enlaces de hilos y cambios de modelo

Cuando una sesión de OpenClaw se adjunta a un hilo existente de Codex, el siguiente turno
vuelve a enviar al app-server el modelo de OpenAI seleccionado actualmente, la política de aprobación, el sandbox y el nivel de servicio.
Cambiar de `openai/gpt-5.5` a
`openai/gpt-5.2` mantiene el enlace del hilo, pero pide a Codex que continúe con el
modelo recién seleccionado.

## Respuestas visibles y heartbeats

Cuando un turno de chat de origen se ejecuta a través del harness de Codex, las respuestas visibles usan de forma predeterminada
la herramienta `message` de OpenClaw si el despliegue no ha configurado explícitamente
`messages.visibleReplies`. El agente aún puede terminar su turno de Codex de forma privada;
solo publica en el canal cuando llama a `message(action="send")`. Configura
`messages.visibleReplies: "automatic"` para mantener las respuestas finales de chat directo en la
ruta heredada de entrega automática.

Los turnos de Heartbeat de Codex también reciben `heartbeat_respond` en el catálogo de herramientas buscable de OpenClaw
de forma predeterminada, para que el agente pueda registrar si la activación debe permanecer
silenciosa o notificar sin codificar ese flujo de control en el texto final.

La guía de iniciativa específica de Heartbeat se envía como una instrucción de desarrollador
de modo de colaboración de Codex en el propio turno de Heartbeat. Los turnos de chat ordinarios restauran
el modo predeterminado de Codex en lugar de llevar la filosofía de Heartbeat en su prompt
normal de tiempo de ejecución.

## Límites de hooks

El harness de Codex tiene tres capas de hooks:

| Capa                                  | Propietario              | Propósito                                                           |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| Hooks de plugins de OpenClaw          | OpenClaw                 | Compatibilidad de producto/plugin entre los harnesses de PI y Codex. |
| Middleware de extensiones del app-server de Codex | Plugins incluidos de OpenClaw | Comportamiento del adaptador por turno alrededor de las herramientas dinámicas de OpenClaw. |
| Hooks nativos de Codex                | Codex                    | Ciclo de vida de bajo nivel de Codex y política de herramientas nativas desde la configuración de Codex. |

OpenClaw no usa archivos `hooks.json` de proyecto ni globales de Codex para enrutar
el comportamiento de plugins de OpenClaw. Para el puente compatible de herramientas nativas y permisos,
OpenClaw inyecta configuración de Codex por hilo para `PreToolUse`, `PostToolUse`,
`PermissionRequest` y `Stop`.

Cuando las aprobaciones del app-server de Codex están habilitadas, es decir, cuando `approvalPolicy` no es
`"never"`, la configuración predeterminada inyectada de hooks nativos omite `PermissionRequest` para que
el revisor del app-server de Codex y el puente de aprobación de OpenClaw gestionen las
escaladas reales después de la revisión. Los operadores pueden añadir explícitamente `permission_request` a
`nativeHookRelay.events` cuando necesiten el relay de compatibilidad.

Otros hooks de Codex, como `SessionStart` y `UserPromptSubmit`, siguen siendo
controles de nivel Codex. No se exponen como hooks de plugins de OpenClaw en el contrato v1.

Para las herramientas dinámicas de OpenClaw, OpenClaw ejecuta la herramienta después de que Codex solicite la
llamada, por lo que OpenClaw dispara el comportamiento de plugin y middleware que posee en el
adaptador del harness. Para las herramientas nativas de Codex, Codex posee el registro canónico de la herramienta.
OpenClaw puede reflejar eventos seleccionados, pero no puede reescribir el hilo nativo de Codex
a menos que Codex exponga esa operación mediante el app-server o callbacks de hooks nativos.

Las notificaciones de ítems del app-server de Codex también proporcionan observaciones asíncronas `after_tool_call`
para finalizaciones de herramientas nativas que no están ya cubiertas por el relay nativo
`PostToolUse`. Estas observaciones son solo para telemetría y compatibilidad de plugins;
no pueden bloquear, retrasar ni mutar la llamada nativa de herramienta.

Las proyecciones de Compaction y del ciclo de vida del LLM provienen de las notificaciones del app-server de Codex
y del estado del adaptador de OpenClaw, no de comandos de hooks nativos de Codex.
Los eventos `before_compaction`, `after_compaction`, `llm_input` y
`llm_output` de OpenClaw son observaciones de nivel adaptador, no capturas byte por byte
de la solicitud interna de Codex ni de las cargas de Compaction.

Las notificaciones `hook/started` y `hook/completed` nativas de Codex del app-server se
proyectan como eventos de agente `codex_app_server.hook` para trayectoria y depuración.
No invocan hooks de plugins de OpenClaw.

## Contrato de soporte v1

Compatible en el tiempo de ejecución v1 de Codex:

| Superficie                                     | Soporte                                                                          | Por qué                                                                                                                                                                                                    |
| --------------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Bucle de modelo de OpenAI a través de Codex    | Compatible                                                                       | El app-server de Codex posee el turno de OpenAI, la reanudación del hilo nativo y la continuación nativa de herramientas.                                                                                  |
| Enrutamiento y entrega de canales de OpenClaw  | Compatible                                                                       | Telegram, Discord, Slack, WhatsApp, iMessage y otros canales permanecen fuera del tiempo de ejecución del modelo.                                                                                         |
| Herramientas dinámicas de OpenClaw             | Compatible                                                                       | Codex pide a OpenClaw que ejecute estas herramientas, por lo que OpenClaw permanece en la ruta de ejecución.                                                                                               |
| Plugins de prompt y contexto                   | Compatible                                                                       | OpenClaw crea superposiciones de prompt y proyecta contexto en el turno de Codex antes de iniciar o reanudar el hilo.                                                                                     |
| Ciclo de vida del motor de contexto            | Compatible                                                                       | El ensamblado, la ingesta, el mantenimiento posterior al turno y la coordinación de Compaction del motor de contexto se ejecutan para turnos de Codex.                                                      |
| Hooks de herramientas dinámicas                | Compatible                                                                       | `before_tool_call`, `after_tool_call` y el middleware de resultados de herramientas se ejecutan alrededor de herramientas dinámicas propiedad de OpenClaw.                                                  |
| Hooks de ciclo de vida                         | Compatibles como observaciones del adaptador                                     | `llm_input`, `llm_output`, `agent_end`, `before_compaction` y `after_compaction` se disparan con cargas honestas de modo Codex.                                                                            |
| Puerta de revisión de respuesta final          | Compatible mediante relay de hooks nativos                                       | Codex `Stop` se retransmite a `before_agent_finalize`; `revise` pide a Codex una pasada más del modelo antes de la finalización.                                                                           |
| Bloqueo u observación de shell, patch y MCP nativos | Compatible mediante relay de hooks nativos                                  | Codex `PreToolUse` y `PostToolUse` se retransmiten para superficies de herramientas nativas confirmadas, incluidas cargas de MCP en el app-server de Codex `0.125.0` o posterior. Se admite el bloqueo; no se admite la reescritura de argumentos. |
| Política de permisos nativos                   | Compatible mediante aprobaciones del app-server de Codex y relay de hooks nativos de compatibilidad | Las solicitudes de aprobación del app-server de Codex se enrutan a través de OpenClaw después de la revisión de Codex. El relay de hooks nativos `PermissionRequest` es opcional para modos de aprobación nativos porque Codex lo emite antes de la revisión del guardián. |
| Captura de trayectoria del app-server          | Compatible                                                                       | OpenClaw registra la solicitud que envió al app-server y las notificaciones del app-server que recibe.                                                                                                     |

No compatible en el tiempo de ejecución v1 de Codex:

| Superficie                                           | Límite v1                                                                                                                                       | Ruta futura                                                                               |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Mutación de argumentos de herramientas nativas       | Los hooks nativos previos a herramienta de Codex pueden bloquear, pero OpenClaw no reescribe argumentos de herramientas nativas de Codex.       | Requiere soporte de hooks/esquema de Codex para entrada de herramienta de reemplazo.       |
| Historial editable de transcripción nativa de Codex  | Codex posee el historial canónico del hilo nativo. OpenClaw posee un espejo y puede proyectar contexto futuro, pero no debería mutar componentes internos no compatibles. | Añadir API explícitas del app-server de Codex si se necesita cirugía del hilo nativo.      |
| `tool_result_persist` para registros de herramientas nativas de Codex | Ese hook transforma escrituras de transcripción propiedad de OpenClaw, no registros de herramientas nativas de Codex.                         | Podría reflejar registros transformados, pero la reescritura canónica necesita soporte de Codex. |
| Metadatos enriquecidos de Compaction nativa          | OpenClaw observa el inicio y la finalización de Compaction, pero no recibe una lista estable de conservados/descartados, delta de tokens ni carga de resumen. | Necesita eventos de Compaction de Codex más enriquecidos.                                  |
| Intervención de Compaction                          | Los hooks actuales de Compaction de OpenClaw son de nivel de notificación en modo Codex.                                                        | Añadir hooks pre/post Compaction de Codex si los plugins necesitan vetar o reescribir la Compaction nativa. |
| Captura byte por byte de solicitudes de API de modelo | OpenClaw puede capturar solicitudes y notificaciones del app-server, pero el núcleo de Codex crea internamente la solicitud final a la API de OpenAI. | Necesita un evento de trazado de solicitudes de modelo de Codex o una API de depuración.   |

## Permisos nativos y elicitaciones de MCP

Para `PermissionRequest`, OpenClaw solo devuelve decisiones explícitas de permitir o denegar
cuando la política decide. Un resultado sin decisión no es una autorización. Codex lo trata como si no hubiera
decisión de hook y continúa hacia su propio guardián o ruta de aprobación de usuario.

Los modos de aprobación de app-server de Codex omiten este hook nativo de forma predeterminada. Este comportamiento
se aplica cuando `permission_request` se incluye explícitamente en
`nativeHookRelay.events` o cuando un runtime de compatibilidad lo instala.

Cuando un operador elige `allow-always` para una solicitud de permiso nativa de Codex,
OpenClaw recuerda esa huella exacta de proveedor/sesión/entrada de herramienta/cwd durante una
ventana de sesión acotada. La decisión recordada es intencionalmente solo de
coincidencia exacta: un cambio en el comando, los argumentos, la carga útil de la herramienta o el cwd crea una
aprobación nueva.

Las elicitaciones de aprobación de herramientas MCP de Codex se enrutan a través del flujo de
aprobación de Plugin de OpenClaw cuando Codex marca `_meta.codex_approval_kind` como
`"mcp_tool_call"`. Los prompts `request_user_input` de Codex se envían de vuelta al
chat de origen, y el siguiente mensaje de seguimiento en cola responde a esa solicitud nativa
del servidor en lugar de dirigirse como contexto adicional. Otras solicitudes de elicitación MCP
fallan de forma cerrada.

## Dirección de la cola

La dirección de cola de ejecución activa se asigna a `turn/steer` de app-server de Codex. Con el
valor predeterminado `messages.queue.mode: "steer"`, OpenClaw agrupa los mensajes de chat en cola
durante la ventana de silencio configurada y los envía como una solicitud `turn/steer` única en
orden de llegada. El modo heredado `queue` envía solicitudes `turn/steer` separadas.

Los turnos de revisión y compaction manual de Codex pueden rechazar la dirección en el mismo turno. En ese
caso, OpenClaw usa la cola de seguimiento cuando el modo seleccionado permite reserva.
Consulta [Cola de dirección](/es/concepts/queue-steering).

## Carga de comentarios de Codex

Cuando se aprueba `/diagnostics [note]` para una sesión que usa el harness nativo de Codex,
OpenClaw también llama a `feedback/upload` de app-server de Codex para los hilos relevantes
de Codex. La carga solicita a app-server que incluya registros para cada hilo listado
y subhilos de Codex generados cuando estén disponibles.

La carga pasa por la ruta normal de comentarios de Codex hacia los servidores de OpenAI. Si los comentarios de Codex
están deshabilitados en ese app-server, el comando devuelve el error de app-server.
La respuesta de diagnóstico completada enumera los canales, los ids de sesión de OpenClaw,
los ids de hilo de Codex y los comandos locales `codex resume <thread-id>` para los hilos
que se enviaron.

Si deniegas o ignoras la aprobación, OpenClaw no imprime esos ids de Codex y
no envía comentarios de Codex. La carga no reemplaza la exportación local de diagnósticos del Gateway.
Consulta [Exportación de diagnósticos](/es/gateway/diagnostics) para conocer el comportamiento de
aprobación, privacidad, paquete local y chat grupal.

Usa `/codex diagnostics [note]` solo cuando quieras específicamente la carga de comentarios de Codex
para el hilo adjunto actualmente sin el paquete completo de diagnósticos del Gateway.

## Compaction y espejo de transcripción

Cuando el modelo seleccionado usa el harness de Codex, la compaction nativa del hilo se
delega a app-server de Codex. OpenClaw mantiene un espejo de transcripción para el historial
del canal, la búsqueda, `/new`, `/reset` y futuros cambios de modelo o harness.

El espejo incluye el prompt del usuario, el texto final del asistente y registros ligeros de
razonamiento o plan de Codex cuando app-server los emite. Actualmente, OpenClaw solo
registra señales de inicio y finalización de compaction nativa. Todavía no expone un
resumen de compaction legible por humanos ni una lista auditable de qué entradas conservó Codex
después de la compaction.

Como Codex posee el hilo nativo canónico, `tool_result_persist` no
reescribe actualmente los registros de resultados de herramientas nativos de Codex. Solo se aplica cuando
OpenClaw está escribiendo un resultado de herramienta en la transcripción de una sesión propiedad de OpenClaw.

## Medios y entrega

OpenClaw sigue siendo propietario de la entrega de medios y la selección de proveedores de medios. La comprensión de imágenes,
video, música, PDF, TTS y medios usa configuraciones de proveedor/modelo coincidentes,
como `agents.defaults.imageGenerationModel`, `videoGenerationModel`,
`pdfModel` y `messages.tts`.

Texto, imágenes, video, música, TTS, aprobaciones y salida de herramientas de mensajería continúan
por la ruta normal de entrega de OpenClaw. La generación de medios no requiere PI.
Cuando Codex emite un elemento nativo de generación de imágenes con un `savedPath`, OpenClaw
reenvía ese archivo exacto por la ruta normal de respuesta con medios, incluso si el turno de Codex
no tiene texto de asistente.

## Relacionado

- [Harness de Codex](/es/plugins/codex-harness)
- [Referencia del harness de Codex](/es/plugins/codex-harness-reference)
- [Plugins nativos de Codex](/es/plugins/codex-native-plugins)
- [Hooks de Plugin](/es/plugins/hooks)
- [Plugins de harness de agente](/es/plugins/sdk-agent-harness)
- [Exportación de diagnósticos](/es/gateway/diagnostics)
- [Exportación de trayectoria](/es/tools/trajectory)

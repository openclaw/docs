---
read_when:
    - Está creando un nuevo plugin de canal de mensajería
    - Quieres conectar OpenClaw a una plataforma de mensajería
    - Necesita comprender la superficie del adaptador ChannelPlugin
sidebarTitle: Channel Plugins
summary: Guía paso a paso para crear un plugin de canal de mensajería para OpenClaw
title: Creación de plugins de canal
x-i18n:
    generated_at: "2026-07-20T00:53:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f287892d3354362d1770e0a70f79f61b812ee6ad213ca5d82f9764e441eff130
    source_path: plugins/sdk-channel-plugins.md
    workflow: 16
---

Esta guía crea un plugin de canal que conecta OpenClaw con una plataforma de
mensajería: seguridad de mensajes directos, emparejamiento, respuestas en hilos y mensajería saliente.

<Info>
  ¿Es la primera vez que usa plugins de OpenClaw? Lea primero [Primeros pasos](/es/plugins/building-plugins)
  para conocer la estructura del paquete y la configuración del manifiesto.
</Info>

## Qué controla el plugin

Los plugins de canal no implementan herramientas para enviar, editar o reaccionar; el núcleo proporciona una
herramienta `message` compartida. El plugin controla:

- **Configuración** - resolución de cuentas y asistente de configuración
- **Seguridad** - política de mensajes directos y listas de permitidos
- **Emparejamiento** - flujo de aprobación de mensajes directos
- **Gramática de sesiones** - cómo se asignan los identificadores de conversación específicos del proveedor a chats
  base, identificadores de hilo y alternativas principales
- **Salida** - envío de texto, contenido multimedia y encuestas a la plataforma
- **Hilos** - cómo se organizan las respuestas en hilos
- **Indicador de escritura de Heartbeat** - señales opcionales de escritura/ocupado para los destinos de entrega de Heartbeat

El núcleo controla la herramienta de mensajes compartida, la conexión con el prompt, la estructura externa de la clave de sesión,
el mantenimiento genérico de `:thread:` y el envío.

## Adaptador de mensajes

Exponga un adaptador `message` con `defineChannelMessageAdapter` desde
`openclaw/plugin-sdk/channel-outbound`. Declare únicamente las capacidades duraderas de envío final
que admita realmente el transporte nativo, respaldadas por una prueba de contrato
que demuestre el efecto secundario nativo y el recibo devuelto. Dirija los envíos de texto y contenido multimedia
a las mismas funciones de transporte que usa el adaptador `outbound` heredado. Para consultar
el contrato completo de la API, la matriz de capacidades, las reglas de recibos, la finalización
de la vista previa en tiempo real, la política de confirmación de recepción, las pruebas y la tabla de migración, consulte
[API de salida de canales](/es/plugins/sdk-channel-outbound).

Si el adaptador `outbound` existente ya tiene los métodos de envío y
los metadatos de capacidades adecuados, derive el adaptador `message` con
`createChannelMessageAdapterFromOutbound(...)` en lugar de escribir manualmente otro
puente. Los envíos del adaptador devuelven valores `MessageReceipt`. Para los identificadores heredados, derívelos
con `listMessageReceiptPlatformIds(...)` o
`resolveMessageReceiptPrimaryId(...)` en lugar de mantener campos `messageIds`
paralelos.

Declare con precisión las capacidades en tiempo real y de finalización: el núcleo las utiliza para decidir
qué puede hacer un canal, y cualquier divergencia entre el comportamiento declarado y el real constituye un
error de prueba de contrato:

| Superficie                            | Valores                                                                                          |
| ------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `message.live.capabilities`           | `draftPreview`, `previewFinalization`, `progressUpdates`, `nativeStreaming`, `quietFinalization` |
| `message.live.finalizer.capabilities` | `finalEdit`, `normalFallback`, `discardPending`, `previewReceipt`, `retainOnAmbiguousFailure`    |

Los canales que finalicen una vista previa de borrador en el mismo lugar deben dirigir la lógica de ejecución
a través de `defineFinalizableLivePreviewAdapter(...)` junto con
`deliverWithFinalizableLivePreviewAdapter(...)`, y mantener las capacidades
declaradas respaldadas por pruebas de `verifyChannelMessageLiveCapabilityAdapterProofs(...)`
y `verifyChannelMessageLiveFinalizerProofs(...)` para impedir divergencias silenciosas
en el comportamiento nativo de vista previa, progreso, edición, alternativa/retención, limpieza y recibos.

Los receptores entrantes que pospongan las confirmaciones de la plataforma deben declarar
`message.receive.defaultAckPolicy` y `supportedAckPolicies` en lugar de ocultar
los tiempos de confirmación en el estado local del monitor. Cubra cada política declarada con
`verifyChannelMessageReceiveAckPolicyAdapterProofs(...)`.

Los auxiliares de respuesta heredados, como `dispatchInboundReplyWithBase` y
`recordInboundSessionAndDispatchReply`, siguen disponibles para los distribuidores
de compatibilidad. No los use en código de canal nuevo; comience por el adaptador `message`,
los recibos y los auxiliares del ciclo de vida de recepción y envío de
`openclaw/plugin-sdk/channel-outbound`.

### Entrada de mensajes entrantes (experimental)

Los canales que migren la autorización de entrada pueden usar la subruta experimental
`openclaw/plugin-sdk/channel-ingress-runtime` desde las rutas de recepción
en tiempo de ejecución. Acepta datos de la plataforma, listas de permitidos sin procesar, descriptores de rutas, datos
de comandos y configuración de grupos de acceso; después devuelve proyecciones del remitente, la ruta, el comando y la activación
junto con el grafo de entrada ordenado, mientras que la búsqueda en la plataforma y los efectos
secundarios permanecen en el plugin. Mantenga la normalización de identidades del plugin en el
descriptor que pase al resolutor; no serialice los valores de coincidencia sin procesar del
estado o la decisión resueltos. Consulte
[API de entrada de canales](/es/plugins/sdk-channel-ingress) para conocer el diseño de la API,
los límites de responsabilidad y las expectativas de las pruebas.

### Entrada duradera y deduplicación de repeticiones

Los canales que adopten la entrada duradera deben usar `createChannelIngressMonitor`
desde `openclaw/plugin-sdk/channel-outbound`, salvo que necesiten un contrato de admisión
o procesamiento sustancialmente distinto. Ponga en cola el sobre de transporte sin procesar en un
único punto de recepción (sin normalización durante la recepción), condicione la
confirmación del transporte a la incorporación duradera en los transportes Webhook, derive un
carril serializado por conversación y marque el evento como completado al adoptarlo
para su envío. La clave principal de la cola es `(queue_name, event_id)` y la finalización
convierte la fila en una lápida en lugar de eliminarla, por lo que una repetición tardía de la plataforma
con el mismo `event_id` se rechaza de forma duradera durante el período de retención de la lápida.
Consulte [API de salida de canales](/es/plugins/sdk-channel-outbound#durable-ingress-monitors)
para conocer la API del monitor y el contrato de apagado.

Esa lápida constituye la regla de capas para las protecciones contra repeticiones
(`openclaw/plugin-sdk/persistent-dedupe`): un canal procesado solo conserva una
protección independiente contra repeticiones cuando la identidad o la retención de esta supera la de la cola:
una clave lógica de mensaje que difiere del identificador de entrega del transporte (Telegram
deduplica `chat_id:message_id` porque las combinaciones de antirrebote pueden volver a mostrar un mensaje
con un `update_id` nuevo), o un período superior al de retención de lápidas
del canal. Si la clave de protección fuera igual al `event_id` del procesamiento, elimine la
protección al adoptar el procesamiento y dimensione `completedTtlMs`/`completedMaxEntries`
para que cubran en su lugar el período de la protección anterior. Las protecciones ajenas a la deduplicación, como los límites
de antigüedad, no están relacionadas con esta regla. Los identificadores estables de mensajes salientes usan el registro compartido
de ecos salientes de `openclaw/plugin-sdk/channel-outbound` en lugar de una caché TTL
local del canal.

#### Clases de transporte y retención

Clasifique un transporte según la garantía de recuperación en su límite de recepción:

- **Entrega de eventos o Webhook condicionada a confirmación:** confirme o devuelva un resultado correcto únicamente
  después de la incorporación duradera. Un error de incorporación debe mantener la entrega disponible
  para reintentar o provocar un error en el límite de recepción. Esta clase incluye Slack, SMS, Zalo,
  Microsoft Teams, Google Chat, LINE y Synology Chat.
- **Entrega por sondeo o transmisión en espera:** avance el cursor remoto o envíe la
  confirmación del transporte únicamente después de la incorporación. Cuando no exista un cursor explícito, mantenga la
  devolución de llamada de recepción serializada y en espera para que un error de incorporación no permita que el
  bucle de recepción se adelante. El sondeo de Telegram, Signal y Tlon usan esta clase;
  la entrega por Webhook de Telegram sigue la regla condicionada a confirmación anterior.
- **Sockets sin repetición:** IRC, Mattermost, Twitch y Zalo Personal no pueden solicitar
  que la plataforma vuelva a entregar un evento aceptado. Su cola duradera protege el
  período de riesgo de fallo del proceso y permite la recuperación tras un reinicio local; las lápidas
  de finalización son prácticamente inertes frente a las repeticiones de la plataforma.

Use 30 días como convención de TTL de las lápidas de la flota, no como valor predeterminado del SDK. Un
período de repetición de gran volumen normalmente usa un límite de 20,000 entradas completadas;
los transportes en espera y sin repetición de menor volumen normalmente usan 1,000-2,000.
Las excepciones actuales incluyen los límites de 4,096 entradas de LINE, el TTL de 24 horas de entradas completadas
de SMS y la retención de entradas completadas basada únicamente en el límite de Tlon. Los límites de filas con errores también pueden ser inferiores
a los límites de filas completadas. Tanto el TTL como el límite depuran filas, por lo que la retención efectiva termina
cuando se alcanza el primer límite. Desvíese de estos valores únicamente debido a un horizonte documentado de reintentos
de la plataforma, un período conservado y publicado de protección contra repeticiones, el volumen o presupuesto de disco esperado,
o un transporte sin repetición, y cubra el contrato de retención con pruebas.

#### Efectos secundarios al menos una vez

El envío del procesamiento ejecuta los efectos secundarios de los comandos antes de que la fila de entrada llegue a su
lápida de finalización. Un fallo del proceso entre estos pasos repite la fila y
puede volver a ejecutar el efecto secundario. Este período de riesgo de fallo con ejecución al menos una vez es el
contrato predeterminado. Para trabajos no idempotentes, como escrituras de configuración, vaciados
de almacenamiento o confirmaciones visibles fuera del carril de respuestas, use
`createIngressEffectOnce(...)` desde
`openclaw/plugin-sdk/ingress-effect-once`. Proporcione a cada llamada el `eventId`
estable de la entrada junto con el nombre de un efecto. Cree un auxiliar por cada cola o cuenta de entrada y
use un `namespacePrefix` estable y único para ese ámbito, ya que los identificadores de eventos
del transporte pueden ser locales de la cola. El auxiliar confirma su reserva duradera únicamente después de que
el efecto se complete correctamente; un efecto que lance una excepción libera la reserva para que un reintento de procesamiento pueda
ejecutarlo de nuevo, mientras que las llamadas simultáneas esperan a la reserva activa. Los
errores del estado duradero llaman a `onDiskError` cuando se proporciona y se rechazan en lugar de recurrir
a la memoria del proceso.

Establezca el `ttlMs` del auxiliar como mínimo en la retención de lápidas de entrada del canal
más el retraso máximo entre la confirmación del efecto y la finalización de la fila, incluidos
el tiempo de inactividad acotado y los reintentos de procesamiento. El TTL del registro del efecto comienza al confirmarse,
mientras que la retención de la lápida comienza más tarde, al finalizar; si la vida útil de una fila pendiente
no está acotada, ningún TTL finito cubre un tiempo de inactividad arbitrario. Una vez que la lápida ya no pueda
repetir la fila, los registros de efectos anteriores son innecesarios. Dimensione
`stateMaxEntries` para cada clave distinta de evento y efecto que pueda existir durante ese
período de retención, teniendo en cuenta el límite de entradas completadas de la cola y la
cantidad máxima de efectos por evento. Un límite inferior expulsa el registro más antiguo antes de que venza su TTL
y permite que ese efecto vuelva a ejecutarse. Persisten períodos residuales de ejecución al menos una vez
si el proceso termina o la persistencia falla después de que el efecto se complete correctamente, pero antes de que
se confirme la reserva, o si el registro vence mientras su fila de entrada sigue
pendiente.

#### Contrato de reinicio por cuenta

Los cambios en la configuración del canal reinician todo el canal de forma predeterminada. Un canal con varias cuentas
puede establecer `reload.accountScopedRestart: true` únicamente cuando la resolución
de la configuración lea los campos compartidos de todo el canal junto con la cuenta seleccionada, nunca una
cuenta paralela, y el Gateway pueda detener e iniciar un entorno de ejecución `(channel, accountId)`
sin sustituir los entornos de ejecución paralelos.

La ruta con ámbito limitado se aplica únicamente a los cambios en
`channels.<channel>.accounts.<non-default-id>.*`. Los cambios en campos compartidos del canal,
`accounts.default`, cuentas eliminadas o que no puedan resolverse y cambios combinados
que puedan afectar a la herencia se promueven a un reinicio de todo el canal. Los plugins
que no habiliten esta opción siempre usan la ruta de todo el canal.

En los canales que usan el procesamiento de entrada duradera, la ruta de detención del monitor de la cuenta
debe primero resolver todas las admisiones de transporte aceptadas y, después, desechar y esperar su
procesamiento. Al iniciar la cuenta, se abre la misma cola asociada a la cuenta, cuyo procesamiento
inicial recupera las filas duraderas que no se hayan enviado. No añada una segunda pasada de repetición específica
para la recarga; la recuperación de la cola es la ruta canónica de reinicio.

Trate esta marca como una declaración de capacidad, no como una preferencia de rendimiento. Las pruebas de
contrato deben demostrar que añadir y editar una cuenta con nombre no modifica la configuración
resuelta de una cuenta paralela, que detener una cuenta solo resuelve el monitor y el
procesamiento de esa cuenta, y que un monitor nuevo recupera las filas de esa cuenta exactamente
una vez. Si no puede demostrarse alguna garantía, omita la marca.

### Indicadores de escritura

Si el canal admite indicadores de escritura fuera de las respuestas entrantes, exponga
`heartbeat.sendTyping(...)` en el plugin del canal. El núcleo lo llama con el
destino de entrega de Heartbeat resuelto antes de que comience la ejecución del modelo de Heartbeat y
utiliza el ciclo de vida compartido para mantener activo y limpiar el indicador de escritura. Añada
`heartbeat.clearTyping(...)` cuando la plataforma necesite una señal explícita de detención.

### Parámetros de fuentes multimedia

Si el canal añade parámetros de la herramienta de mensajes que contengan fuentes multimedia, exponga
los nombres de esos parámetros mediante `plugin.actions.describeMessageTool(...).mediaSourceParams`.
El núcleo utiliza esa lista explícita para la normalización de rutas del entorno aislado y la política de acceso
a contenido multimedia saliente, por lo que los plugins no necesitan casos especiales en el núcleo compartido para
parámetros específicos del proveedor relacionados con avatares, archivos adjuntos o imágenes de portada.

Prefiera un mapa basado en acciones, como `{ "set-profile": ["avatarUrl", "avatarPath"] }`,
para que las acciones no relacionadas no hereden los argumentos multimedia de otra acción. Una matriz plana
sigue funcionando para los parámetros compartidos intencionadamente entre todas las acciones expuestas.

Los canales que deban exponer una URL pública temporal para que una plataforma
obtenga contenido multimedia pueden usar `createHostedOutboundMediaStore(...)` de
`openclaw/plugin-sdk/outbound-media` con almacenes de estado del plugin. Mantenga el análisis
de rutas de la plataforma y la aplicación de tokens en el plugin del canal; el asistente compartido
solo se ocupa de cargar contenido multimedia, los metadatos de caducidad, las filas de fragmentos y la limpieza.

### Conformación de cargas útiles nativas

Si el canal necesita una conformación específica del proveedor para `message(action="send")`,
prefiera `actions.prepareSendPayload(...)`. Coloque las tarjetas, los bloques, el contenido incorporado u
otros datos persistentes nativos en `payload.channelData.<channel>` y permita que el núcleo los envíe
mediante el adaptador de salida/mensajes. Use `actions.handleAction(...)` para el envío
solo como alternativa de compatibilidad para cargas útiles que no puedan serializarse ni
reintentarse.

### Gramática de conversaciones de sesión

Si la plataforma almacena un ámbito adicional dentro de los identificadores de conversación, mantenga ese análisis
en el plugin con `messaging.resolveSessionConversation(...)`. Ese es el
enlace canónico para asignar `rawId` al identificador de conversación base, un
identificador de hilo opcional, un `baseConversationId` explícito y cualquier
`parentConversationCandidates`. Cuando devuelva `parentConversationCandidates`,
ordénelos desde el elemento principal más específico hasta la conversación más amplia/base.

`messaging.resolveParentConversationCandidates(...)` es una alternativa de compatibilidad
obsoleta para los plugins que solo necesitan alternativas principales además del
identificador genérico/sin procesar. Si existen ambos enlaces, el núcleo usa
primero `resolveSessionConversation(...).parentConversationCandidates` y solo
recurre a `resolveParentConversationCandidates(...)` cuando el enlace
canónico los omite.

Los plugins incluidos que necesiten el mismo análisis antes de que se inicie el registro de canales
pueden exponer un archivo `session-key-api.ts` de nivel superior con una exportación
`resolveSessionConversation(...)` correspondiente (consulte los plugins de Feishu y Telegram).
El núcleo usa esa superficie segura para el arranque solo cuando el registro de plugins
en tiempo de ejecución aún no está disponible.

Use `openclaw/plugin-sdk/channel-route` cuando el código del plugin necesite normalizar
campos similares a rutas, comparar un hilo secundario con su ruta principal o crear una
clave de deduplicación estable a partir de `{ channel, to, accountId, threadId }`. El asistente
normaliza los identificadores numéricos de hilo de la misma forma que el núcleo, por lo que debe preferirse frente a comparaciones
`String(threadId)` ad hoc. Los plugins con una gramática de destinos específica del proveedor
deben exponer `messaging.resolveOutboundSessionRoute(...)` para que el núcleo obtenga
la identidad de sesión e hilo nativa del proveedor sin adaptadores de análisis.

### Compatibilidad con vinculaciones de conversación por cuenta

Establezca `conversationBindings.supportsCurrentConversationBinding` cuando el canal
admita vinculaciones genéricas de la conversación actual. `createChatChannelPlugin(...)`
establece esta capacidad estática en `true` de forma predeterminada.

Si la compatibilidad difiere según la cuenta configurada, implemente también
`conversationBindings.isCurrentConversationBindingSupported({ accountId })`.
El núcleo evalúa este enlace síncrono solo después de habilitar la capacidad estática.
Devolver `false` hace que las operaciones genéricas de capacidad, vinculación,
consulta, listado, actualización y desvinculación de la conversación actual no estén disponibles para esa cuenta.
Si se omite el enlace, la capacidad estática se aplica a todas las cuentas.

Resuelva la respuesta a partir de la configuración de cuenta o el estado de ejecución ya cargados. Este
enlace controla únicamente las vinculaciones genéricas de la conversación actual; no sustituye
las reglas de vinculación configuradas ni el enrutamiento de sesiones propiedad del plugin. Las pruebas de contrato
deben cubrir al menos una cuenta compatible y una no compatible mediante el
contrato `ChannelPlugin["conversationBindings"]` exportado por
`openclaw/plugin-sdk/channel-core`.

## Aprobaciones y capacidades de los canales

La mayoría de los plugins de canal no necesitan código específico para aprobaciones. El núcleo controla
`/approve` en el mismo chat, las cargas útiles compartidas de los botones de aprobación y la entrega
alternativa genérica. `ChannelPlugin.approvals` se eliminó; coloque en su lugar los datos de
entrega, implementación nativa, representación y autenticación de aprobaciones en un único objeto `approvalCapability`.
`plugin.auth` solo sirve para iniciar y cerrar sesión: el núcleo ya no lee enlaces de
autenticación de aprobaciones desde ese objeto.

Use `approvalCapability.delivery` únicamente para el enrutamiento nativo de aprobaciones o la supresión
de alternativas, y `approvalCapability.render` únicamente cuando un canal necesite realmente
cargas útiles de aprobación personalizadas en lugar del representador compartido.

### Autenticación de aprobaciones

- `approvalCapability.authorizeActorAction` y
  `approvalCapability.getActionAvailabilityState` son la superficie canónica
  de autenticación de aprobaciones.
- Use `getActionAvailabilityState` para conocer la disponibilidad de la autenticación de aprobaciones en el mismo chat.
  Mantenga los aprobadores configurados disponibles para `/approve` incluso cuando la entrega nativa
  esté deshabilitada; use en su lugar el estado nativo de la superficie iniciadora para orientar sobre la entrega/configuración.
- Si el canal expone aprobaciones de ejecución nativas, use
  `approvalCapability.getExecInitiatingSurfaceState` para el
  estado de la superficie iniciadora/cliente nativo cuando difiera de la autenticación de aprobaciones
  en el mismo chat. El núcleo usa ese enlace específico de ejecución para distinguir `enabled` de
  `disabled`, decidir si el canal iniciador admite aprobaciones de ejecución
  nativas e incluir el canal en las indicaciones sobre alternativas de clientes nativos.
  `createApproverRestrictedNativeApprovalCapability(...)` completa este dato para
  el caso habitual.
- Si un canal puede inferir identidades de mensajes directos estables, similares a propietarios, a partir de la configuración existente,
  use `createResolvedApproverActionAuthAdapter` de
  `openclaw/plugin-sdk/approval-runtime` para restringir `/approve` en el mismo chat
  sin añadir lógica específica de aprobación al núcleo.
- Si la autenticación de aprobación personalizada permite intencionadamente solo la alternativa en el mismo chat, devuelva
  `markImplicitSameChatApprovalAuthorization({ authorized: true })` desde
  `openclaw/plugin-sdk/approval-auth-runtime`; de lo contrario, el núcleo trata el
  resultado como una autorización explícita del aprobador.
- Si una devolución de llamada nativa propiedad del canal resuelve las aprobaciones directamente, use
  `isImplicitSameChatApprovalAuthorization(...)` antes de resolverlas para que la
  alternativa implícita siga pasando por la autorización normal de actores del canal.

### Ciclo de vida de la carga útil e indicaciones de configuración

- Use `outbound.shouldSuppressLocalPayloadPrompt` o
  `outbound.beforeDeliverPayload` para comportamientos del ciclo de vida de la carga útil
  específicos del canal, como ocultar solicitudes locales de aprobación duplicadas o enviar indicadores
  de escritura antes de la entrega.
- Use `approvalCapability.describeExecApprovalSetup` cuando el canal quiera
  que la respuesta de la ruta deshabilitada explique los parámetros de configuración exactos necesarios para habilitar
  las aprobaciones de ejecución nativas. El enlace recibe `{ channel, channelLabel, accountId }`;
  los canales con cuentas con nombre deben representar rutas específicas de la cuenta, como
  `channels.<channel>.accounts.<id>.execApprovals.*`, en lugar de los valores predeterminados
  de nivel superior.
- Use `approvalCapability.describePluginApprovalSetup` cuando sea seguro mostrar
  las indicaciones sobre fallos de aprobación del plugin para los fallos de aprobaciones del plugin sin ruta o por
  tiempo de espera. `createApproverRestrictedNativeApprovalCapability(...)` no
  lo deduce de `describeExecApprovalSetup`; pase explícitamente el mismo asistente
  solo cuando las aprobaciones del plugin y de ejecución usen realmente la misma configuración nativa.

### Entrega nativa de aprobaciones

Si un canal necesita entrega nativa de aprobaciones, mantenga el código del canal centrado en
la normalización de destinos y los datos de transporte/presentación. Use
`createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`,
`createChannelApproverDmTargetResolver` y
`createApproverRestrictedNativeApprovalCapability` de
`openclaw/plugin-sdk/approval-runtime`. Coloque los datos específicos del canal detrás de
`approvalCapability.nativeRuntime`, preferiblemente mediante
`createChannelApprovalNativeRuntimeAdapter(...)` o
`createLazyChannelApprovalNativeRuntimeAdapter(...)`, para que el núcleo pueda montar el
controlador y gestionar el filtrado de solicitudes, el enrutamiento, la deduplicación, la caducidad, la suscripción
al Gateway y los avisos de enrutamiento a otro lugar.

`nativeRuntime` se divide en varias superficies más pequeñas:

- `availability`: si la cuenta está configurada y si debe gestionarse una solicitud
- `presentation`: asignar el modelo de vista de aprobación compartido a
  cargas útiles nativas pendientes/resueltas/caducadas o acciones finales
- `transport`: preparar destinos y enviar/actualizar/eliminar mensajes de aprobación
  nativos
- `interactions`: enlaces opcionales de vinculación/desvinculación/eliminación de acciones para botones
  o reacciones nativos, además de un enlace `cancelDelivered` opcional. Implemente
  `cancelDelivered` cuando `deliverPending` registre un estado en proceso o persistente
  (como un almacén de destinos de reacciones) para que ese estado pueda liberarse si la
  detención de un controlador cancela la entrega antes de que se ejecute `bindPending`, o cuando
  `bindPending` no devuelva ningún identificador
- `observe`: enlaces opcionales de diagnóstico de entrega

Otros asistentes de aprobación:

- Use `createNativeApprovalChannelRouteGates` de
  `openclaw/plugin-sdk/approval-native-runtime` cuando un canal admita tanto
  la entrega nativa originada en la sesión como destinos explícitos de reenvío de aprobaciones. El
  asistente centraliza la selección de la configuración de aprobaciones, la gestión de `mode`, los filtros
  de agentes/sesiones, la vinculación de cuentas, la coincidencia de destinos de sesión y la coincidencia de listas
  de destinos, mientras que los invocadores siguen controlando el identificador del canal, el modo de reenvío
  predeterminado, la consulta de cuentas, la comprobación de transporte habilitado, la normalización de destinos y la resolución
  del destino de origen del turno. No lo use para crear valores predeterminados de políticas de canal
  propiedad del núcleo; pase explícitamente el modo predeterminado documentado del canal.
- `createChannelNativeOriginTargetResolver` usa de forma predeterminada el comparador compartido de rutas
  de canal para los destinos `{ to, accountId, threadId }`. Pase
  `targetsMatch` únicamente cuando un canal tenga reglas de equivalencia específicas del proveedor,
  como la coincidencia de prefijos de marcas de tiempo de Slack. Pase `normalizeTargetForMatch` cuando
  el canal necesite canonizar los identificadores del proveedor antes de que se ejecute el comparador de rutas
  predeterminado o una devolución de llamada `targetsMatch` personalizada, conservando a la vez el
  destino original para la entrega. Use `normalizeTarget` únicamente cuando deba canonizarse el propio
  destino de entrega resuelto.
- Si el canal necesita objetos propiedad del entorno de ejecución, como un cliente, un token, una aplicación
  Bolt o un receptor de Webhook, regístrelos mediante
  `openclaw/plugin-sdk/channel-runtime-context`. El registro genérico de contexto
  de ejecución permite que el núcleo inicie controladores basados en capacidades a partir del estado de
  inicio del canal sin añadir código adaptador específico para aprobaciones.
- Recurra a `createChannelApprovalHandler` o
  `createChannelNativeApprovalRuntime` de nivel inferior únicamente cuando la superficie basada en capacidades
  aún no sea suficientemente expresiva.
- Los canales de aprobación nativos deben enrutar tanto `accountId` como `approvalKind`
  mediante esos asistentes. `accountId` mantiene la política de aprobación multicuenta
  limitada a la cuenta de bot correcta, y `approvalKind` mantiene disponible para el canal
  el comportamiento de las aprobaciones de ejecución frente a las del plugin sin bifurcaciones codificadas
  en el núcleo.
- El núcleo también controla los avisos de redireccionamiento de aprobaciones. Los plugins de canal no deben enviar
  sus propios mensajes de seguimiento del tipo «la aprobación se envió a mensajes directos/otro canal» desde
  `createChannelNativeApprovalRuntime`; en su lugar, exponga un enrutamiento preciso del origen y
  de los mensajes directos del aprobador mediante los asistentes compartidos de capacidades de aprobación y permita que
  el núcleo agregue las entregas reales antes de publicar cualquier aviso en el
  chat iniciador.
- Conserve el tipo del identificador de aprobación entregado de extremo a extremo. Los clientes nativos no deben
  adivinar ni reescribir el enrutamiento de las aprobaciones de ejecución frente a las del plugin a partir del estado
  local del canal.
- Pase ese `approvalKind` explícito a `resolveApprovalOverGateway`. Esto usa
  el servicio canónico `approval.resolve` y devuelve el ganador registrado cuando
  otra superficie responde primero. La entrada explícita anterior `resolveMethod`
  permanece para controles respaldados por comandos; las nuevas acciones nativas no deben usarla ni
  inferir el tipo a partir de un identificador.
- Los distintos tipos de aprobación pueden exponer intencionadamente superficies nativas
  diferentes. Ejemplos incluidos actuales: Matrix mantiene el mismo enrutamiento nativo de mensajes directos/canales
  y la misma experiencia de usuario de reacciones para las aprobaciones de ejecución y del plugin, a la vez que permite
  que la autenticación difiera según el tipo de aprobación; Slack mantiene disponible el enrutamiento nativo de aprobaciones
  tanto para los identificadores de ejecución como para los del plugin.
- `createApproverRestrictedNativeApprovalAdapter` sigue existiendo como
  adaptador de compatibilidad, pero el código nuevo debe preferir el generador de capacidades
  y exponer `approvalCapability` en el plugin.

### Subrutas más específicas del entorno de ejecución de aprobaciones

Para puntos de entrada de canal de alta frecuencia, prefiera estas subrutas más específicas frente al
módulo de exportación `approval-runtime` más amplio cuando solo necesite una parte de esa familia:

- `openclaw/plugin-sdk/approval-auth-runtime`
- `openclaw/plugin-sdk/approval-client-runtime`
- `openclaw/plugin-sdk/approval-delivery-runtime`
- `openclaw/plugin-sdk/approval-gateway-runtime`
- `openclaw/plugin-sdk/approval-reference-runtime`
- `openclaw/plugin-sdk/approval-handler-adapter-runtime`
- `openclaw/plugin-sdk/approval-handler-runtime`
- `openclaw/plugin-sdk/approval-native-runtime`
- `openclaw/plugin-sdk/approval-reply-runtime`
- `openclaw/plugin-sdk/channel-runtime-context`

Del mismo modo, prefiera `openclaw/plugin-sdk/reply-runtime`,
`openclaw/plugin-sdk/reply-dispatch-runtime`,
`openclaw/plugin-sdk/reply-reference` y
`openclaw/plugin-sdk/reply-chunking` frente a superficies generales más amplias cuando
no las necesite todas.

### Subrutas de configuración

- `openclaw/plugin-sdk/setup-runtime` abarca los ayudantes de configuración seguros para el entorno de ejecución:
  `createSetupTranslator`, adaptadores de parches de configuración seguros para la importación
  (`createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), salida de notas de búsqueda,
  `promptResolvedAllowFrom`, `splitSetupEntries` y los constructores delegados
  de proxies de configuración.
- `openclaw/plugin-sdk/channel-setup` abarca los constructores de configuración
  de instalación opcional, además de algunas primitivas seguras para la configuración: `createOptionalChannelSetupSurface`,
  `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`,
  `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`,
  `setSetupChannelEnabled` y `splitSetupEntries`.
- Utilice la interfaz más amplia `openclaw/plugin-sdk/setup` solo cuando también necesite
  los ayudantes compartidos más pesados de configuración, como
  `moveSingleAccountChannelSectionToDefaultAccount(...)`.

Si el canal solo quiere anunciar «instale primero este plugin» en las
superficies de configuración, prefiera `createOptionalChannelSetupSurface(...)`. El
adaptador/asistente generado rechaza de forma segura las escrituras de configuración y la finalización, y reutiliza
el mismo mensaje de instalación requerida durante la validación, la finalización y el texto
del enlace a la documentación.

Si el canal admite configuración o autenticación mediante variables de entorno, expóngala a través del
esquema de configuración del canal y los descriptores de configuración. Mantenga `envVars` del entorno de ejecución del canal o
las constantes locales solo para el texto dirigido a operadores.

Si el canal puede aparecer en `status`, `channels list`, `channels status` o
los análisis de SecretRef antes de que se inicie el entorno de ejecución del plugin, añada `openclaw.setupEntry` en
`package.json`. Ese punto de entrada debe poder importarse de forma segura en rutas de comandos
de solo lectura y debe devolver los metadatos del canal, el adaptador de configuración
seguro para la configuración, el adaptador de estado y los metadatos de destino de secretos del canal necesarios para esos
resúmenes. No inicie clientes, escuchadores ni entornos de ejecución de transporte desde la
entrada de configuración.

Mantenga también limitada la ruta de importación de la entrada principal del canal. El descubrimiento puede evaluar
la entrada y el módulo del plugin del canal para registrar capacidades sin
activar el canal. Los archivos como `channel-plugin-api.ts` deben exportar
el objeto del plugin del canal sin importar asistentes de configuración, clientes
de transporte, escuchadores de sockets, iniciadores de subprocesos ni módulos de inicio de servicios.
Coloque esas piezas del entorno de ejecución en módulos cargados desde `registerFull(...)`, definidores
del entorno de ejecución o adaptadores de capacidades diferidos.

### Otras subrutas específicas del canal

Para otras rutas activas del canal, prefiera los ayudantes específicos frente a las superficies
heredadas más amplias:

- `openclaw/plugin-sdk/account-core`, `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution` y
  `openclaw/plugin-sdk/account-helpers` para la configuración de varias cuentas y
  la reserva de la cuenta predeterminada
- `openclaw/plugin-sdk/inbound-envelope` y
  `openclaw/plugin-sdk/channel-inbound` para el cableado de rutas/sobres entrantes y
  de registro y despacho
- `openclaw/plugin-sdk/channel-targets` para los ayudantes de análisis de destinos
- `openclaw/plugin-sdk/channel-outbound` para los delegados de identidad/envío saliente
  y la planificación tipada de cargas útiles
- `buildThreadAwareOutboundSessionRoute(...)` de
  `openclaw/plugin-sdk/channel-core` cuando una ruta saliente deba conservar
  un `replyToId`/`threadId` explícito o recuperar la sesión `:thread:`
  actual después de que la clave de sesión base siga coincidiendo. Los plugins de proveedores pueden
  reemplazar la precedencia, el comportamiento de los sufijos y la normalización del id. del hilo cuando
  su plataforma tenga semántica nativa de entrega en hilos.
- `openclaw/plugin-sdk/thread-bindings-runtime` para el ciclo de vida de la vinculación de hilos
  y el registro de adaptadores

Los canales exclusivos de autenticación normalmente pueden limitarse a la ruta predeterminada: el núcleo gestiona
las aprobaciones y el plugin solo expone capacidades de salida/autenticación. Los canales
de aprobación nativa, como Matrix, Slack, Telegram y los transportes de chat personalizados,
deben utilizar los ayudantes nativos compartidos en lugar de implementar su propio ciclo de vida
de aprobación.

## Política de menciones entrantes

Mantenga el tratamiento de menciones entrantes dividido en dos capas:

- recopilación de pruebas propiedad del plugin
- evaluación de políticas compartida

Utilice `openclaw/plugin-sdk/channel-mention-gating` para las decisiones de la política de menciones.
Utilice `openclaw/plugin-sdk/channel-inbound` solo cuando necesite el módulo de exportación más amplio
de ayudantes de entrada.

Casos apropiados para la lógica local del plugin:

- detección de respuestas al bot
- detección del bot citado
- comprobaciones de participación en el hilo
- exclusiones de mensajes de servicio/sistema
- cachés nativas de la plataforma necesarias para demostrar la participación del bot

Casos apropiados para el ayudante compartido:

- `requireMention`
- resultado de mención explícita
- lista de permitidos para menciones implícitas
- omisión para comandos
- decisión final de omisión

Flujo recomendado:

1. Calcule los datos locales de las menciones.
2. Pase esos datos a `resolveInboundMentionDecision({ facts, policy })`.
3. Utilice `decision.effectiveWasMentioned`, `decision.shouldBypassMention` y
   `decision.shouldSkip` en la puerta de entrada.

```typescript
import {
  implicitMentionKindWhen,
  matchesMentionWithExplicit,
  resolveInboundMentionDecision,
} from "openclaw/plugin-sdk/channel-inbound";
import { resolveChannelImplicitMentions } from "openclaw/plugin-sdk/channel-ingress-runtime";

const wasMentioned = matchesMentionWithExplicit({
  text,
  mentionRegexes,
  explicit: {
    hasAnyMention,
    isExplicitlyMentioned,
    canResolveExplicit,
  },
});

const facts = {
  canDetectMention: true,
  wasMentioned,
  hasAnyMention,
  implicitMentionKinds: [
    ...implicitMentionKindWhen("reply_to_bot", isReplyToBot),
    ...implicitMentionKindWhen("quoted_bot", isQuoteOfBot),
  ],
};

const implicitMentions = resolveChannelImplicitMentions({
  cfg,
  channel: channelId,
  accountId,
});

const decision = resolveInboundMentionDecision({
  facts,
  policy: {
    isGroup,
    requireMention,
    implicitMentions,
    allowTextCommands,
    hasControlCommand,
    commandAuthorized,
  },
});

if (decision.shouldSkip) return;
```

`matchesMentionWithExplicit(...)` devuelve un booleano. `hasAnyMention`,
`isExplicitlyMentioned` y `canResolveExplicit` proceden de los metadatos nativos
de menciones del propio canal (entidades del mensaje, indicadores de respuesta al bot y similares);
proporcione valores `false`/`undefined` cuando la plataforma no pueda detectarlos.

`api.runtime.channel.mentions` expone los mismos ayudantes compartidos de menciones para
los plugins de canales incluidos que ya dependen de la inyección del entorno de ejecución:
`buildMentionRegexes`, `matchesMentionPatterns`, `matchesMentionWithExplicit`,
`implicitMentionKindWhen`, `resolveInboundMentionDecision`.

Si solo necesita `implicitMentionKindWhen` y `resolveInboundMentionDecision`,
importe desde `openclaw/plugin-sdk/channel-mention-gating` para evitar cargar
ayudantes no relacionados del entorno de ejecución de entrada.

## Guía paso a paso

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Paquete y manifiesto">
    Cree los archivos estándar del plugin. El campo `channels` de
    `openclaw.plugin.json` (no un campo `kind`) es lo que marca un manifiesto como
    propietario de un canal. Para consultar toda la superficie de metadatos del paquete, consulte
    [Configuración del plugin](/es/plugins/sdk-setup#openclaw-channel):

    <CodeGroup>
    ```json package.json
    {
      "name": "@myorg/openclaw-acme-chat",
      "version": "1.0.0",
      "type": "module",
      "openclaw": {
        "extensions": ["./index.ts"],
        "setupEntry": "./setup-entry.ts",
        "channel": {
          "id": "acme-chat",
          "label": "Chat de Acme",
          "blurb": "Conecte OpenClaw con el chat de Acme."
        }
      }
    }
    ```

    ```json openclaw.plugin.json
    {
      "id": "acme-chat",
      "channels": ["acme-chat"],
      "name": "Chat de Acme",
      "description": "Plugin del canal de chat de Acme",
      "configSchema": {
        "type": "object",
        "additionalProperties": false,
        "properties": {}
      },
      "channelConfigs": {
        "acme-chat": {
          "schema": {
            "type": "object",
            "additionalProperties": false,
            "properties": {
              "token": { "type": "string" },
              "allowFrom": {
                "type": "array",
                "items": { "type": "string" }
              }
            }
          },
          "uiHints": {
            "token": {
              "label": "Token del bot",
              "sensitive": true
            }
          }
        }
      }
    }
    ```
    </CodeGroup>

    `configSchema` valida `plugins.entries.acme-chat.config`. Utilícelo para
    opciones propiedad del plugin que no formen parte de la configuración de la cuenta del canal.
    `channelConfigs.acme-chat.schema` valida `channels.acme-chat` y es la
    fuente de ruta inactiva utilizada por el esquema de configuración, la configuración y las superficies de la interfaz de usuario antes de que
    se cargue el entorno de ejecución del plugin. Consulte [Manifiesto del plugin](/es/plugins/manifest) para ver la referencia completa
    de los campos de nivel superior.

  </Step>

  <Step title="Crear el objeto del plugin del canal">
    La interfaz `ChannelPlugin` tiene muchas superficies de adaptadores opcionales. Comience con
    el mínimo —`id`, `config` y `setup`— y añada adaptadores a medida que
    los necesite.

    Cree `src/channel.ts`:

    ```typescript src/channel.ts
    import {
      createChatChannelPlugin,
      createChannelPluginBase,
    } from "openclaw/plugin-sdk/channel-core";
    import type { OpenClawConfig } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatApi } from "./client.js"; // cliente de la API de su plataforma

    type ResolvedAccount = {
      accountId: string | null;
      token: string;
      allowFrom: string[];
      dmPolicy: string | undefined;
    };

    function resolveAccount(
      cfg: OpenClawConfig,
      accountId?: string | null,
    ): ResolvedAccount {
      const section = (cfg.channels as Record<string, any>)?.["acme-chat"];
      const token = section?.token;
      if (!token) throw new Error("acme-chat: se requiere el token");
      return {
        accountId: accountId ?? null,
        token,
        allowFrom: section?.allowFrom ?? [],
        dmPolicy: section?.dmSecurity,
      };
    }

    export const acmeChatPlugin = createChatChannelPlugin<ResolvedAccount>({
      base: createChannelPluginBase({
        id: "acme-chat",
        // La resolución/inspección de cuentas corresponde a `config`, no a `setup`.
        // `setup` abarca las escrituras de incorporación (applyAccountConfig, validateInput).
        config: {
          listAccountIds: () => ["default"],
          resolveAccount,
          inspectAccount(cfg, accountId) {
            const section =
              (cfg.channels as Record<string, any>)?.["acme-chat"];
            return {
              enabled: Boolean(section?.token),
              configured: Boolean(section?.token),
              tokenStatus: section?.token ? "available" : "missing",
            };
          },
        },
        setup: {
          applyAccountConfig: ({ cfg, input }) => ({
            ...cfg,
            channels: {
              ...cfg.channels,
              "acme-chat": { ...(cfg.channels as any)?.["acme-chat"], ...input },
            },
          }),
        },
      }),

      // Seguridad de mensajes directos: quién puede enviar mensajes al bot
      security: {
        dm: {
          channelKey: "acme-chat",
          resolvePolicy: (account) => account.dmPolicy,
          resolveAllowFrom: (account) => account.allowFrom,
          defaultPolicy: "allowlist",
        },
      },

      // Vinculación: flujo de aprobación para nuevos contactos por mensaje directo
      pairing: {
        text: {
          idLabel: "Nombre de usuario del chat de Acme",
          message: "Envíe este código para verificar su identidad:",
          notify: async ({ target, code }) => {
            await acmeChatApi.sendDm(target, `Código de vinculación: ${code}`);
          },
        },
      },

      // Hilos: cómo se entregan las respuestas
      threading: { topLevelReplyToMode: "reply" },

      // Salida: enviar mensajes a la plataforma
      outbound: {
        attachedResults: {
          channel: "acme-chat",
          sendText: async (params) => {
            const result = await acmeChatApi.sendMessage(
              params.to,
              params.text,
            );
            return { messageId: result.id };
          },
        },
        base: {
          sendMedia: async (params) => {
            await acmeChatApi.sendFile(params.to, params.filePath);
          },
        },
      },
    });
    ```

    Para los canales que aceptan tanto claves de MD canónicas de nivel superior como claves anidadas heredadas, usa los auxiliares de `plugin-sdk/channel-config-helpers`: `resolveChannelDmAccess`, `resolveChannelDmPolicy`, `resolveChannelDmAllowFrom` y `normalizeChannelDmPolicy` mantienen los valores locales de la cuenta por delante de los valores raíz heredados. Empareja el mismo resolutor con la reparación de doctor mediante `normalizeLegacyDmAliases` para que el entorno de ejecución y la migración lean el mismo contrato.

    <Accordion title="Qué hace createChatChannelPlugin por ti">
      En lugar de implementar manualmente interfaces de adaptador de bajo nivel, se proporcionan
      opciones declarativas y el generador las combina:

      | Opción | Qué conecta |
      | --- | --- |
      | `security.dm` | Resolutor de seguridad de MD con ámbito a partir de campos de configuración |
      | `pairing.text` | Flujo de vinculación de MD basado en texto con intercambio de códigos |
      | `threading` | Resolutor del modo de respuesta (fijo, con ámbito de cuenta o personalizado) |
      | `outbound.attachedResults` | Funciones de envío que devuelven metadatos del resultado (ID de mensajes); requiere un id `channel` hermano para que el núcleo pueda marcar el resultado de entrega devuelto |

      También se pueden proporcionar objetos de adaptador sin procesar en lugar de las opciones declarativas
      si se necesita un control total.

      Los adaptadores de salida sin procesar pueden definir una función `chunker(text, limit, ctx)`.
      El valor opcional `ctx.formatting` contiene decisiones de formato en el momento de la entrega,
      como `maxLinesPerMessage`; aplícalo antes del envío para que los hilos de respuesta
      y los límites de fragmentos se resuelvan una sola vez mediante la entrega de salida compartida.
      Los contextos de envío también incluyen `replyToIdSource` (`implicit` o `explicit`)
      cuando se ha resuelto un destino de respuesta nativo, para que los auxiliares de carga útil puedan conservar
      etiquetas de respuesta explícitas sin consumir una ranura de respuesta implícita de un solo uso.
    </Accordion>

  </Step>

  <Step title="Conectar el punto de entrada">
    Crea `index.ts`:

    ```typescript index.ts
    import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineChannelPluginEntry({
      id: "acme-chat",
      name: "Acme Chat",
      description: "Plugin de canal Acme Chat",
      plugin: acmeChatPlugin,
      registerCliMetadata(api) {
        api.registerCli(
          ({ program }) => {
            program
              .command("acme-chat")
              .description("Administración de Acme Chat");
          },
          {
            descriptors: [
              {
                name: "acme-chat",
                description: "Administración de Acme Chat",
                hasSubcommands: false,
              },
            ],
          },
        );
      },
      registerFull(api) {
        api.registerGatewayMethod(/* ... */);
      },
    });
    ```

    Coloca los descriptores de CLI propiedad del canal en `registerCliMetadata(...)` para que OpenClaw
    pueda mostrarlos en la ayuda raíz sin activar el entorno de ejecución completo del canal,
    mientras que las cargas completas normales siguen recogiendo los mismos descriptores para el registro
    real de comandos. Reserva `registerFull(...)` para tareas exclusivas del entorno de ejecución.
    `defineChannelPluginEntry` gestiona automáticamente la división del modo de registro.
    Si `registerFull(...)` registra métodos RPC del Gateway, usa un
    prefijo específico del plugin. Los espacios de nombres administrativos del núcleo (`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`) permanecen reservados y siempre
    se resuelven como `operator.admin`. Consulta
    [Puntos de entrada](/es/plugins/sdk-entrypoints#definechannelpluginentry) para conocer todas las
    opciones.

  </Step>

  <Step title="Añadir una entrada de configuración">
    Crea `setup-entry.ts` para una carga ligera durante la incorporación:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    OpenClaw carga esta entrada en lugar de la entrada completa cuando el canal está deshabilitado
    o sin configurar. Evita cargar código pesado del entorno de ejecución durante los flujos de configuración.
    Consulta [Configuración](/es/plugins/sdk-setup#setup-entry) para obtener más detalles.

    Los canales incluidos en el espacio de trabajo que separan las exportaciones seguras para la configuración en módulos
    auxiliares pueden usar `defineBundledChannelSetupEntry(...)` de
    `openclaw/plugin-sdk/channel-entry-contract` cuando también necesiten un
    definidor explícito del entorno de ejecución durante la configuración.

  </Step>

  <Step title="Gestionar mensajes entrantes">
    El plugin debe recibir mensajes de la plataforma y reenviarlos a
    OpenClaw. El patrón habitual es un Webhook que verifica la solicitud y
    la envía mediante el controlador de entrada del canal:

    ```typescript
    registerFull(api) {
      api.registerHttpRoute({
        path: "/acme-chat/webhook",
        auth: "plugin", // autenticación gestionada por el plugin (verifica las firmas por tu cuenta)
        handler: async (req, res) => {
          const event = parseWebhookPayload(req);

          // El controlador de entrada envía el mensaje a OpenClaw.
          // La conexión exacta depende del SDK de la plataforma:
          // consulta un ejemplo real en el paquete del plugin incluido de Microsoft Teams o Google Chat.
          await handleAcmeChatInbound(api, event);

          res.statusCode = 200;
          res.end("ok");
          return true;
        },
      });
    }
    ```

    <Note>
      La gestión de mensajes entrantes es específica de cada canal. Cada plugin de canal posee
      su propio Pipeline de entrada. Consulta los plugins de canal incluidos
      (por ejemplo, el paquete del plugin de Microsoft Teams o Google Chat) para ver patrones reales.
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="Probar">
Escribe pruebas ubicadas junto al código en `src/channel.test.ts`:

    ```typescript src/channel.test.ts
    import { describe, it, expect } from "vitest";
    import { acmeChatPlugin } from "./channel.js";

    describe("plugin acme-chat", () => {
      it("resuelve la cuenta desde la configuración", () => {
        const cfg = {
          channels: {
            "acme-chat": { token: "test-token", allowFrom: ["user1"] },
          },
        } as any;
        const account = acmeChatPlugin.config.resolveAccount(cfg, undefined);
        expect(account.token).toBe("test-token");
      });

      it("inspecciona la cuenta sin materializar secretos", () => {
        const cfg = {
          channels: { "acme-chat": { token: "test-token" } },
        } as any;
        const result = acmeChatPlugin.config.inspectAccount!(cfg, undefined);
        expect(result.configured).toBe(true);
        expect(result.tokenStatus).toBe("available");
      });

      it("informa de que falta la configuración", () => {
        const cfg = { channels: {} } as any;
        const result = acmeChatPlugin.config.inspectAccount!(cfg, undefined);
        expect(result.configured).toBe(false);
      });
    });
    ```

    ```bash
    pnpm test <bundled-plugin-root>/acme-chat/
    ```

    Para conocer los auxiliares de prueba compartidos, consulta [Pruebas](/es/plugins/sdk-testing).

</Step>
</Steps>

## Estructura de archivos

```text
<bundled-plugin-root>/acme-chat/
├── package.json              # metadatos de openclaw.channel
├── openclaw.plugin.json      # Manifiesto con el esquema de configuración
├── index.ts                  # defineChannelPluginEntry
├── setup-entry.ts            # defineSetupPluginEntry
├── api.ts                    # Exportaciones públicas (opcional)
├── runtime-api.ts            # Exportaciones internas del entorno de ejecución (opcional)
└── src/
    ├── channel.ts            # ChannelPlugin mediante createChatChannelPlugin
    ├── channel.test.ts       # Pruebas
    ├── client.ts             # Cliente de la API de la plataforma
    └── runtime.ts            # Almacén del entorno de ejecución (si es necesario)
```

## Temas avanzados

<CardGroup cols={2}>
  <Card title="Opciones de hilos" icon="git-branch" href="/es/plugins/sdk-entrypoints#registration-mode">
    Modos de respuesta fijos, con ámbito de cuenta o personalizados
  </Card>
  <Card title="Integración de la herramienta de mensajes" icon="puzzle" href="/es/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool y detección de acciones
  </Card>
  <Card title="Resolución de destinos" icon="crosshair" href="/es/plugins/architecture-internals#channel-target-resolution">
    inferTargetChatType, looksLikeId, reservedLiterals, resolveTarget
  </Card>
  <Card title="Auxiliares del entorno de ejecución" icon="settings" href="/es/plugins/sdk-runtime">
    TTS, STT, contenido multimedia y subagente mediante api.runtime
  </Card>
  <Card title="API de entrada del canal" icon="bolt" href="/es/plugins/sdk-channel-inbound">
    Ciclo de vida compartido de eventos entrantes: ingesta, resolución, registro, envío y finalización
  </Card>
</CardGroup>

<Note>
Todavía existen algunas interfaces auxiliares incluidas para el mantenimiento y la
compatibilidad de los plugins incluidos. No son el patrón recomendado para nuevos plugins de canal;
se prefieren las subrutas genéricas de canal, configuración, respuesta y entorno de ejecución de la superficie común
del SDK, salvo que se mantenga directamente esa familia de plugins incluidos.
</Note>

## Siguientes pasos

- [Plugins de proveedores](/es/plugins/sdk-provider-plugins) - si el plugin también proporciona modelos
- [Descripción general del SDK](/es/plugins/sdk-overview) - referencia completa de importaciones de subrutas
- [Pruebas del SDK](/es/plugins/sdk-testing) - utilidades de prueba y pruebas de contratos
- [Manifiesto del plugin](/es/plugins/manifest) - esquema completo del manifiesto

## Contenido relacionado

- [Configuración del SDK de plugins](/es/plugins/sdk-setup)
- [Creación de plugins](/es/plugins/building-plugins)
- [Plugins del arnés de agentes](/es/plugins/sdk-agent-harness)

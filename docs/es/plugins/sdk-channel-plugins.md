---
read_when:
    - Está creando un nuevo plugin de canal de mensajería
    - Quieres conectar OpenClaw a una plataforma de mensajería
    - Necesita comprender la interfaz del adaptador ChannelPlugin
sidebarTitle: Channel Plugins
summary: Guía paso a paso para crear un plugin de canal de mensajería para OpenClaw
title: Creación de plugins de canal
x-i18n:
    generated_at: "2026-07-16T11:51:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 2c6398dd0b4789b9f4aaf7ad2d1786a7e6388cb8fbb74e8ecaecae7ac0a5eb90
    source_path: plugins/sdk-channel-plugins.md
    workflow: 16
---

Esta guía crea un plugin de canal que conecta OpenClaw con una plataforma de
mensajería: seguridad de mensajes directos, emparejamiento, respuestas en hilos y mensajería saliente.

<Info>
  ¿Es la primera vez que trabaja con plugins de OpenClaw? Lea primero [Primeros pasos](/es/plugins/building-plugins)
  para conocer la estructura del paquete y la configuración del manifiesto.
</Info>

## Responsabilidades de su plugin

Los plugins de canal no implementan herramientas para enviar, editar o reaccionar; el núcleo proporciona una
herramienta `message` compartida. Su plugin se encarga de:

- **Configuración** - resolución de cuentas y asistente de configuración
- **Seguridad** - política de mensajes directos y listas de permitidos
- **Emparejamiento** - flujo de aprobación de mensajes directos
- **Gramática de sesiones** - cómo se asignan los identificadores de conversación específicos del proveedor a chats
  base, identificadores de hilo y alternativas superiores
- **Salida** - envío de texto, contenido multimedia y encuestas a la plataforma
- **Hilos** - cómo se organizan las respuestas en hilos
- **Indicador de escritura de Heartbeat** - señales opcionales de escritura/ocupado para los destinos de entrega de Heartbeat

El núcleo se encarga de la herramienta de mensajes compartida, la conexión con el prompt, la forma externa de la clave de sesión,
el registro genérico de `:thread:` y el despacho.

## Adaptador de mensajes

Exponga un adaptador `message` con `defineChannelMessageAdapter` de
`openclaw/plugin-sdk/channel-outbound`. Declare únicamente las capacidades duraderas de envío final
que realmente admita su transporte nativo, respaldadas por una prueba de contrato
que demuestre el efecto secundario nativo y el comprobante devuelto. Dirija los envíos de texto y contenido multimedia
a las mismas funciones de transporte que utiliza el adaptador `outbound` heredado. Para consultar
el contrato completo de la API, la matriz de capacidades, las reglas de comprobantes, la finalización
de vistas previas en vivo, la política de confirmación de recepción, las pruebas y la tabla de migración, consulte
[API de salida de canales](/es/plugins/sdk-channel-outbound).

Si su adaptador `outbound` existente ya tiene los métodos de envío y
metadatos de capacidades correctos, derive el adaptador `message` con
`createChannelMessageAdapterFromOutbound(...)` en lugar de escribir manualmente otro
puente. Los envíos del adaptador devuelven valores `MessageReceipt`. Para los identificadores heredados, derívelos
con `listMessageReceiptPlatformIds(...)` o
`resolveMessageReceiptPrimaryId(...)` en lugar de mantener campos `messageIds`
paralelos.

Declare con precisión las capacidades en vivo y de finalización: el núcleo las utiliza para decidir
qué puede hacer un canal, y cualquier divergencia entre el comportamiento declarado y el real provoca un
fallo en la prueba de contrato:

| Superficie                            | Valores                                                                                          |
| ------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `message.live.capabilities`           | `draftPreview`, `previewFinalization`, `progressUpdates`, `nativeStreaming`, `quietFinalization` |
| `message.live.finalizer.capabilities` | `finalEdit`, `normalFallback`, `discardPending`, `previewReceipt`, `retainOnAmbiguousFailure`    |

Los canales que finalizan una vista previa de borrador en el mismo lugar deben dirigir la lógica de ejecución
a través de `defineFinalizableLivePreviewAdapter(...)` junto con
`deliverWithFinalizableLivePreviewAdapter(...)`, y mantener las capacidades declaradas
respaldadas por pruebas `verifyChannelMessageLiveCapabilityAdapterProofs(...)`
y `verifyChannelMessageLiveFinalizerProofs(...)` para que el comportamiento nativo de vista previa,
progreso, edición, alternativa/retención, limpieza y comprobantes no pueda divergir
silenciosamente.

Los receptores de entrada que posponen las confirmaciones de la plataforma deben declarar
`message.receive.defaultAckPolicy` y `supportedAckPolicies` en lugar de ocultar
el momento de la confirmación en el estado local del monitor. Cubra cada política declarada con
`verifyChannelMessageReceiveAckPolicyAdapterProofs(...)`.

Los asistentes de respuesta heredados, como `dispatchInboundReplyWithBase` y
`recordInboundSessionAndDispatchReply`, siguen disponibles para los despachadores
de compatibilidad. No los utilice en código de canal nuevo; comience con el adaptador `message`,
los comprobantes y los asistentes del ciclo de vida de recepción y envío de
`openclaw/plugin-sdk/channel-outbound`.

### Entrada de mensajes (experimental)

Los canales que migren la autorización de entrada pueden utilizar la subruta experimental
`openclaw/plugin-sdk/channel-ingress-runtime` desde las rutas de recepción
en tiempo de ejecución. Acepta datos de la plataforma, listas de permitidos sin procesar, descriptores de rutas, datos de
comandos y configuración de grupos de acceso; después devuelve proyecciones de remitente, ruta, comando y activación,
además del grafo de entrada ordenado, mientras que las consultas de la plataforma y los
efectos secundarios permanecen en el plugin. Mantenga la normalización de identidades del plugin en el
descriptor que pasa al solucionador; no serialice valores de coincidencia sin procesar del
estado o la decisión resueltos. Consulte
[API de entrada de canales](/es/plugins/sdk-channel-ingress) para conocer el diseño de la API,
el límite de responsabilidades y las expectativas de las pruebas.

### Indicadores de escritura

Si su canal admite indicadores de escritura fuera de las respuestas entrantes, exponga
`heartbeat.sendTyping(...)` en el plugin de canal. El núcleo lo llama con el
destino de entrega de Heartbeat resuelto antes de que comience la ejecución del modelo de Heartbeat y
utiliza el ciclo de vida compartido para mantener activo y limpiar el indicador de escritura. Añada
`heartbeat.clearTyping(...)` cuando la plataforma necesite una señal explícita para detenerlo.

### Parámetros de origen multimedia

Si su canal añade parámetros de la herramienta de mensajes que contienen orígenes multimedia, exponga
los nombres de esos parámetros mediante `plugin.actions.describeMessageTool(...).mediaSourceParams`.
El núcleo utiliza esa lista explícita para normalizar rutas del entorno aislado y aplicar la
política de acceso a contenido multimedia saliente, por lo que los plugins no necesitan casos especiales en el núcleo compartido para
parámetros específicos del proveedor de avatares, archivos adjuntos o imágenes de portada.

Se recomienda un mapa indexado por acción, como `{ "set-profile": ["avatarUrl", "avatarPath"] }`,
para que las acciones no relacionadas no hereden los argumentos multimedia de otra acción. Un arreglo plano
también funciona para parámetros compartidos intencionadamente entre todas las acciones expuestas.

Los canales que deban exponer una URL pública temporal para que la plataforma
obtenga contenido multimedia pueden utilizar `createHostedOutboundMediaStore(...)` de
`openclaw/plugin-sdk/outbound-media` con los almacenes de estado del plugin. Mantenga el
análisis de rutas de la plataforma y la aplicación de tokens en el plugin de canal; el asistente compartido
solo se encarga de cargar contenido multimedia, los metadatos de caducidad, las filas de fragmentos y la limpieza.

### Conformación de cargas útiles nativas

Si su canal necesita conformación específica del proveedor para `message(action="send")`,
se recomienda `actions.prepareSendPayload(...)`. Coloque tarjetas, bloques, incrustaciones u
otros datos nativos duraderos bajo `payload.channelData.<channel>` y deje que el núcleo los envíe
mediante el adaptador de salida/mensajes. Utilice `actions.handleAction(...)` para el envío
solo como alternativa de compatibilidad para cargas útiles que no puedan serializarse y
reintentarse.

### Gramática de conversaciones de sesión

Si su plataforma almacena un ámbito adicional dentro de los identificadores de conversación, mantenga ese análisis
en el plugin con `messaging.resolveSessionConversation(...)`. Ese es el
enlace canónico para asignar `rawId` al identificador de conversación base, al identificador
de hilo opcional, al `baseConversationId` explícito y a cualquier
`parentConversationCandidates`. Cuando devuelva `parentConversationCandidates`,
ordénelos desde el elemento superior más específico hasta la conversación más general o base.

`messaging.resolveParentConversationCandidates(...)` es una alternativa de compatibilidad
obsoleta para plugins que solo necesitan alternativas superiores sobre el
identificador genérico o sin procesar. Si existen ambos enlaces, el núcleo utiliza
`resolveSessionConversation(...).parentConversationCandidates` primero y solo
recurre a `resolveParentConversationCandidates(...)` cuando el enlace
canónico los omite.

Los plugins incluidos que necesiten el mismo análisis antes de que se inicie el registro de canales
pueden exponer un archivo `session-key-api.ts` de nivel superior con una exportación
`resolveSessionConversation(...)` coincidente (consulte los plugins de Feishu y Telegram).
El núcleo utiliza esa superficie segura para el arranque solo cuando el registro de plugins
en tiempo de ejecución aún no está disponible.

Utilice `openclaw/plugin-sdk/channel-route` cuando el código del plugin necesite normalizar
campos similares a rutas, comparar un hilo secundario con su ruta superior o crear una
clave estable de eliminación de duplicados a partir de `{ channel, to, accountId, threadId }`. El asistente
normaliza los identificadores numéricos de hilos del mismo modo que el núcleo, por lo que se recomienda en lugar de comparaciones
`String(threadId)` ad hoc. Los plugins con gramática de destinos específica del proveedor
deben exponer `messaging.resolveOutboundSessionRoute(...)` para que el núcleo obtenga
la identidad de sesión e hilo nativa del proveedor sin adaptadores de análisis.

### Compatibilidad con vinculaciones de conversaciones por cuenta

Establezca `conversationBindings.supportsCurrentConversationBinding` cuando el canal
admita vinculaciones genéricas de la conversación actual. `createChatChannelPlugin(...)`
establece esta capacidad estática en `true` de forma predeterminada.

Si la compatibilidad difiere según la cuenta configurada, implemente también
`conversationBindings.isCurrentConversationBindingSupported({ accountId })`.
El núcleo evalúa este enlace síncrono únicamente después de habilitar la capacidad estática.
Devolver `false` hace que las operaciones genéricas de capacidad de conversación actual,
vinculación, consulta, enumeración, actualización y desvinculación no estén disponibles para esa cuenta.
Si se omite el enlace, la capacidad estática se aplica a todas las cuentas.

Obtenga la respuesta de la configuración de cuenta o del estado de ejecución ya cargados. Este
enlace controla únicamente las vinculaciones genéricas de la conversación actual; no sustituye
las reglas de vinculación configuradas ni el enrutamiento de sesiones propiedad del plugin. Las pruebas de contrato
deben cubrir al menos una cuenta compatible y otra incompatible mediante el
contrato `ChannelPlugin["conversationBindings"]` exportado por
`openclaw/plugin-sdk/channel-core`.

## Aprobaciones y capacidades del canal

La mayoría de los plugins de canal no necesitan código específico para aprobaciones. El núcleo se encarga de
`/approve` en el mismo chat, las cargas útiles compartidas de los botones de aprobación y la entrega alternativa genérica.
`ChannelPlugin.approvals` se eliminó; coloque los datos de entrega, interfaz nativa, representación y autorización
de las aprobaciones en un único objeto `approvalCapability`. `plugin.auth` es solo para iniciar y cerrar sesión:
el núcleo ya no lee enlaces de autorización de aprobaciones desde ese objeto.

Utilice `approvalCapability.delivery` únicamente para el enrutamiento nativo de aprobaciones o la supresión de
alternativas, y `approvalCapability.render` únicamente cuando un canal necesite realmente
cargas útiles de aprobación personalizadas en lugar del representador compartido.

### Autorización de aprobaciones

- `approvalCapability.authorizeActorAction` y
  `approvalCapability.getActionAvailabilityState` son la interfaz canónica
  de autorización de aprobaciones.
- Utilice `getActionAvailabilityState` para determinar la disponibilidad de la autorización de aprobaciones en el mismo chat.
  Mantenga los aprobadores configurados disponibles para `/approve` incluso cuando la entrega nativa
  esté deshabilitada; utilice el estado nativo de la superficie de inicio para obtener orientación sobre la entrega y configuración
  en su lugar.
- Si su canal expone aprobaciones nativas de ejecución, utilice
  `approvalCapability.getExecInitiatingSurfaceState` para el
  estado de la superficie de inicio o del cliente nativo cuando difiera de la autorización de
  aprobaciones en el mismo chat. El núcleo utiliza ese enlace específico de ejecución para distinguir `enabled` de
  `disabled`, decidir si el canal iniciador admite aprobaciones nativas de ejecución
  e incluir el canal en la orientación sobre alternativas de clientes nativos.
  `createApproverRestrictedNativeApprovalCapability(...)` completa este valor para
  el caso común.
- Si un canal puede inferir identidades estables de mensajes directos similares a las del propietario a partir de la configuración existente,
  utilice `createResolvedApproverActionAuthAdapter` de
  `openclaw/plugin-sdk/approval-runtime` para restringir `/approve` en el mismo chat
  sin añadir lógica específica de aprobación al núcleo.
- Si la autorización personalizada de aprobaciones permite intencionadamente solo la alternativa en el mismo chat, devuelva
  `markImplicitSameChatApprovalAuthorization({ authorized: true })` desde
  `openclaw/plugin-sdk/approval-auth-runtime`; de lo contrario, el núcleo trata el
  resultado como una autorización explícita del aprobador.
- Si una devolución de llamada nativa propiedad del canal resuelve las aprobaciones directamente, utilice
  `isImplicitSameChatApprovalAuthorization(...)` antes de resolverlas para que la
  alternativa implícita siga pasando por la autorización normal de actores del canal.

### Ciclo de vida de las cargas útiles y orientación de configuración

- Utilice `outbound.shouldSuppressLocalPayloadPrompt` o
  `outbound.beforeDeliverPayload` para comportamientos del ciclo de vida de las cargas útiles específicos del canal,
  como ocultar solicitudes locales de aprobación duplicadas o enviar indicadores de escritura
  antes de la entrega.
- Utilice `approvalCapability.describeExecApprovalSetup` cuando el canal quiera
  que la respuesta de la ruta deshabilitada explique los parámetros de configuración exactos necesarios para habilitar
  las aprobaciones nativas de ejecución. El enlace recibe `{ channel, channelLabel, accountId }`;
  los canales con cuentas con nombre deben representar rutas específicas de la cuenta, como
  `channels.<channel>.accounts.<id>.execApprovals.*`, en lugar de valores predeterminados
  de nivel superior.
- Utilice `approvalCapability.describePluginApprovalSetup` cuando la orientación sobre
  fallos de aprobación del plugin sea segura para mostrarla en fallos de aprobaciones del plugin sin ruta y por tiempo de espera.
  `createApproverRestrictedNativeApprovalCapability(...)` no
  lo deduce de `describeExecApprovalSetup`; pase explícitamente el mismo asistente
  solo cuando las aprobaciones del plugin y de ejecución utilicen realmente la misma configuración nativa.

### Entrega nativa de aprobaciones

Si un canal necesita entrega nativa de aprobaciones, mantenga el código del canal centrado en
la normalización de destinos y los datos de transporte y presentación. Utilice
`createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`,
`createChannelApproverDmTargetResolver` y
`createApproverRestrictedNativeApprovalCapability` de
`openclaw/plugin-sdk/approval-runtime`. Coloque los datos específicos del canal detrás de
`approvalCapability.nativeRuntime`, preferiblemente mediante
`createChannelApprovalNativeRuntimeAdapter(...)` o
`createLazyChannelApprovalNativeRuntimeAdapter(...)`, para que el núcleo pueda ensamblar el
controlador y encargarse del filtrado de solicitudes, el enrutamiento, la eliminación de duplicados, la caducidad, la suscripción al Gateway
y los avisos de enrutamiento a otro lugar.

`nativeRuntime` se divide en varias interfaces más pequeñas:

- `availability` - si la cuenta está configurada y si una solicitud
  debe gestionarse
- `presentation` - asignar el modelo de vista de aprobación compartido a
  cargas útiles nativas pendientes/resueltas/caducadas o acciones finales
- `transport` - preparar destinos y enviar/actualizar/eliminar mensajes
  de aprobación nativos
- `interactions` - hooks opcionales para vincular/desvincular/borrar acciones de botones
  o reacciones nativos, además de un hook `cancelDelivered` opcional. Implemente
  `cancelDelivered` cuando `deliverPending` registre estado en proceso o persistente
  (como un almacén de destinos de reacción), de modo que dicho estado pueda liberarse si la
  detención de un controlador cancela la entrega antes de que se ejecute `bindPending`, o cuando
  `bindPending` no devuelva ningún identificador
- `observe` - hooks opcionales de diagnóstico de entrega

Otros auxiliares de aprobación:

- Use `createNativeApprovalChannelRouteGates` desde
  `openclaw/plugin-sdk/approval-native-runtime` cuando un canal admita tanto la entrega nativa
  originada en la sesión como destinos explícitos de reenvío de aprobaciones. El
  auxiliar centraliza la selección de la configuración de aprobación, la gestión de `mode`, los filtros
  de agente/sesión, la vinculación de cuentas, la coincidencia de destinos de sesión y la coincidencia
  de listas de destinos, mientras que los llamadores siguen siendo responsables del id del canal, el modo
  de reenvío predeterminado, la búsqueda de cuentas, la comprobación de que el transporte está habilitado,
  la normalización de destinos y la resolución del destino de origen
  del turno. No lo use para crear valores predeterminados de política de canal propiedad
  del núcleo; pase explícitamente el modo predeterminado documentado del canal.
- `createChannelNativeOriginTargetResolver` usa de forma predeterminada el comparador compartido de rutas
  de canal para los destinos `{ to, accountId, threadId }`. Pase
  `targetsMatch` solo cuando un canal tenga reglas de equivalencia específicas del proveedor,
  como la coincidencia de prefijos de marcas de tiempo de Slack. Pase `normalizeTargetForMatch` cuando
  el canal necesite canonizar los ids del proveedor antes de que se ejecute el comparador de rutas
  predeterminado o un callback `targetsMatch` personalizado, conservando a la vez el
  destino original para la entrega. Use `normalizeTarget` solo cuando deba canonizarse
  el propio destino de entrega resuelto.
- Si el canal necesita objetos propiedad del entorno de ejecución, como un cliente, token, aplicación
  Bolt o receptor de webhook, regístrelos mediante
  `openclaw/plugin-sdk/channel-runtime-context`. El registro genérico de contexto del entorno
  de ejecución permite al núcleo inicializar controladores basados en capacidades desde el estado
  de inicio del canal sin añadir código de enlace envolvente específico para aprobaciones.
- Recurra a `createChannelApprovalHandler` o
  `createChannelNativeApprovalRuntime` de nivel inferior solo cuando el punto de integración basado
  en capacidades aún no sea lo bastante expresivo.
- Los canales de aprobación nativos deben enrutar tanto `accountId` como `approvalKind`
  mediante esos auxiliares. `accountId` mantiene la política de aprobación multicuenta
  limitada a la cuenta de bot correcta, y `approvalKind` mantiene disponible para el canal
  el comportamiento de aprobación de ejecución frente al de Plugin sin ramas codificadas
  de forma rígida en el núcleo.
- El núcleo también es responsable de los avisos de redireccionamiento de aprobaciones. Los plugins de canal no deben enviar
  sus propios mensajes de seguimiento «la aprobación se envió a mensajes directos / otro canal» desde
  `createChannelNativeApprovalRuntime`; en su lugar, deben exponer un enrutamiento preciso del origen y
  de los mensajes directos del aprobador mediante los auxiliares compartidos de capacidades de aprobación y permitir que
  el núcleo agregue las entregas reales antes de publicar cualquier aviso en el
  chat iniciador.
- Conserve de extremo a extremo el tipo del id de aprobación entregado. Los clientes nativos no deben
  deducir ni reescribir el enrutamiento de aprobaciones de ejecución frente al de Plugin a partir del estado
  local del canal.
- Pase ese `approvalKind` explícito a `resolveApprovalOverGateway`. Esto usa
  el servicio canónico `approval.resolve` y devuelve el ganador registrado cuando
  otra superficie responde primero. La entrada explícita `resolveMethod` anterior
  se conserva para controles basados en comandos; las nuevas acciones nativas no deben usarla ni
  inferir el tipo a partir de un ID.
- Los distintos tipos de aprobación pueden exponer intencionadamente distintas
  superficies nativas. Ejemplos incluidos actualmente: Matrix mantiene el mismo enrutamiento nativo
  de mensajes directos/canales y la experiencia de usuario de reacciones para aprobaciones de ejecución y de Plugin,
  a la vez que permite que la autenticación difiera según el tipo de aprobación; Slack mantiene disponible
  el enrutamiento nativo de aprobaciones tanto para ids de ejecución como de Plugin.
- `createApproverRestrictedNativeApprovalAdapter` aún existe como
  envoltorio de compatibilidad, pero el código nuevo debe preferir el constructor de capacidades
  y exponer `approvalCapability` en el Plugin.

### Subrutas más específicas del entorno de ejecución de aprobaciones

Para puntos de entrada de canal críticos, prefiera estas subrutas más específicas en lugar del barrel más amplio
`approval-runtime` cuando solo necesite una parte de esa familia:

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

Asimismo, prefiera `openclaw/plugin-sdk/reply-runtime`,
`openclaw/plugin-sdk/reply-dispatch-runtime`,
`openclaw/plugin-sdk/reply-reference` y
`openclaw/plugin-sdk/reply-chunking` en lugar de superficies generales más amplias cuando
no las necesite todas.

### Subrutas de configuración

- `openclaw/plugin-sdk/setup-runtime` abarca los auxiliares de configuración seguros para el entorno de ejecución:
  `createSetupTranslator`, adaptadores de parches de configuración seguros para importación
  (`createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), salida de notas de búsqueda,
  `promptResolvedAllowFrom`, `splitSetupEntries` y los constructores
  delegados de proxy de configuración.
- `openclaw/plugin-sdk/channel-setup` abarca los constructores de configuración
  de instalación opcional y algunas primitivas seguras para la configuración: `createOptionalChannelSetupSurface`,
  `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`,
  `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`,
  `setSetupChannelEnabled` y `splitSetupEntries`.
- Use el punto de integración más amplio `openclaw/plugin-sdk/setup` solo cuando también necesite
  los auxiliares compartidos de configuración más pesados, como
  `moveSingleAccountChannelSectionToDefaultAccount(...)`.

Si el canal solo quiere anunciar «instale primero este Plugin» en las superficies
de configuración, prefiera `createOptionalChannelSetupSurface(...)`. El
adaptador/asistente generado adopta una postura cerrada ante fallos en las escrituras de configuración y la finalización, y reutiliza
el mismo mensaje de instalación obligatoria en la validación, la finalización y el texto
del enlace a la documentación.

Si el canal admite configuración o autenticación mediante variables de entorno y los flujos genéricos
de inicio/configuración deben conocer esos nombres de variables antes de que se cargue el entorno de ejecución, declárelos en el
manifiesto del Plugin con `channelEnvVars`. Mantenga `envVars` del entorno de ejecución del canal o las constantes
locales solo para el texto dirigido a operadores.

Si el canal puede aparecer en `status`, `channels list`, `channels status` o
análisis de SecretRef antes de que se inicie el entorno de ejecución del Plugin, añada `openclaw.setupEntry` en
`package.json`. Ese punto de entrada debe poder importarse de forma segura en rutas de comandos
de solo lectura y debe devolver los metadatos del canal, el adaptador de configuración seguro
para la configuración, el adaptador de estado y los metadatos de destinos secretos del canal necesarios para esos
resúmenes. No inicie clientes, escuchas ni entornos de ejecución de transporte desde la
entrada de configuración.

Mantenga también restringida la ruta de importación de la entrada principal del canal. El descubrimiento puede evaluar
la entrada y el módulo del Plugin del canal para registrar capacidades sin
activar el canal. Los archivos como `channel-plugin-api.ts` deben exportar
el objeto del Plugin del canal sin importar asistentes de configuración, clientes
de transporte, escuchas de sockets, iniciadores de subprocesos ni módulos de inicio de servicios.
Coloque esas piezas del entorno de ejecución en módulos cargados desde `registerFull(...)`, definidores
del entorno de ejecución o adaptadores de capacidades con carga diferida.

### Otras subrutas específicas de canal

Para otras rutas críticas de canal, prefiera los auxiliares específicos en lugar de superficies
heredadas más amplias:

- `openclaw/plugin-sdk/account-core`, `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution` y
  `openclaw/plugin-sdk/account-helpers` para la configuración multicuenta y
  la reserva de la cuenta predeterminada
- `openclaw/plugin-sdk/inbound-envelope` y
  `openclaw/plugin-sdk/channel-inbound` para el cableado de rutas/sobres entrantes y
  de registro y despacho
- `openclaw/plugin-sdk/channel-targets` para auxiliares de análisis de destinos
- `openclaw/plugin-sdk/outbound-media` para la carga de medios y
  `openclaw/plugin-sdk/channel-outbound` para delegados de identidad/envío saliente
  y planificación de cargas útiles
- `buildThreadAwareOutboundSessionRoute(...)` desde
  `openclaw/plugin-sdk/channel-core` cuando una ruta saliente deba conservar
  un `replyToId`/`threadId` explícito o recuperar la sesión `:thread:`
  actual después de que la clave de sesión base siga coincidiendo. Los plugins de proveedor pueden
  sobrescribir la precedencia, el comportamiento de sufijos y la normalización del id del hilo cuando
  su plataforma tenga semántica nativa de entrega en hilos.
- `openclaw/plugin-sdk/thread-bindings-runtime` para el ciclo de vida de vinculación
  de hilos y el registro de adaptadores
- `openclaw/plugin-sdk/agent-media-payload` solo cuando aún se requiera una disposición
  heredada de campos de carga útil de agente/medios
- `openclaw/plugin-sdk/telegram-command-config` (obsoleto: ningún Plugin incluido
  lo usa en producción) para la normalización de comandos personalizados de Telegram,
  la validación de duplicados/conflictos y un contrato de configuración de comandos
  estable ante reservas; para el código de plugins nuevos, prefiera gestionar la configuración de comandos localmente en el Plugin

Los canales que solo requieren autenticación normalmente pueden limitarse a la ruta predeterminada: el núcleo gestiona
las aprobaciones y el Plugin simplemente expone capacidades salientes/de autenticación. Los canales
de aprobación nativos como Matrix, Slack, Telegram y los transportes de chat personalizados
deben usar los auxiliares nativos compartidos en lugar de implementar su propio ciclo de vida
de aprobaciones.

## Política de menciones entrantes

Mantenga la gestión de menciones entrantes dividida en dos capas:

- recopilación de evidencias propiedad del Plugin
- evaluación de políticas compartida

Use `openclaw/plugin-sdk/channel-mention-gating` para las decisiones de política de menciones.
Use `openclaw/plugin-sdk/channel-inbound` solo cuando necesite el barrel más amplio
de auxiliares de entrada.

Adecuado para la lógica local del Plugin:

- detección de respuesta al bot
- detección de bot citado
- comprobaciones de participación en el hilo
- exclusiones de mensajes de servicio/sistema
- cachés nativas de la plataforma necesarias para demostrar la participación del bot

Adecuado para el auxiliar compartido:

- `requireMention`
- resultado de mención explícita
- lista de permitidos de menciones implícitas
- omisión mediante comandos
- decisión final de omisión

Flujo recomendado:

1. Calcule los datos locales de las menciones.
2. Pase esos datos a `resolveInboundMentionDecision({ facts, policy })`.
3. Use `decision.effectiveWasMentioned`, `decision.shouldBypassMention` y
   `decision.shouldSkip` en la barrera de entrada.

```typescript
import {
  implicitMentionKindWhen,
  matchesMentionWithExplicit,
  resolveInboundMentionDecision,
} from "openclaw/plugin-sdk/channel-inbound";

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

const decision = resolveInboundMentionDecision({
  facts,
  policy: {
    isGroup,
    requireMention,
    allowedImplicitMentionKinds: requireExplicitMention ? [] : ["reply_to_bot", "quoted_bot"],
    allowTextCommands,
    hasControlCommand,
    commandAuthorized,
  },
});

if (decision.shouldSkip) return;
```

`matchesMentionWithExplicit(...)` devuelve un booleano. `hasAnyMention`,
`isExplicitlyMentioned` y `canResolveExplicit` proceden de los metadatos nativos
de menciones del propio canal (entidades de mensajes, indicadores de respuesta al bot y similares);
proporcione valores `false`/`undefined` cuando la plataforma no pueda detectarlos.

`api.runtime.channel.mentions` expone los mismos auxiliares compartidos de menciones para
los plugins de canal incluidos que ya dependen de la inyección del entorno de ejecución:
`buildMentionRegexes`, `matchesMentionPatterns`, `matchesMentionWithExplicit`,
`implicitMentionKindWhen`, `resolveInboundMentionDecision`.

Si solo necesita `implicitMentionKindWhen` y `resolveInboundMentionDecision`,
importe desde `openclaw/plugin-sdk/channel-mention-gating` para evitar cargar
auxiliares no relacionados del entorno de ejecución de entrada.

## Guía paso a paso

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Paquete y manifiesto">
    Cree los archivos estándar del plugin. El campo `channels` de
    `openclaw.plugin.json` (no un campo `kind`) es lo que indica que un manifiesto
    es propietario de un canal. Para consultar toda la superficie de metadatos del paquete, véase
    [Configuración del Plugin](/es/plugins/sdk-setup#openclaw-channel):

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
          "label": "Acme Chat",
          "blurb": "Conecta OpenClaw con Acme Chat."
        }
      }
    }
    ```

    ```json openclaw.plugin.json
    {
      "id": "acme-chat",
      "channels": ["acme-chat"],
      "name": "Acme Chat",
      "description": "Plugin de canal de Acme Chat",
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

    `configSchema` valida `plugins.entries.acme-chat.config`. Úselo para
    los ajustes propiedad del plugin que no forman parte de la configuración de la cuenta del canal.
    `channelConfigs.acme-chat.schema` valida `channels.acme-chat` y es la
    fuente de la ruta inactiva que utilizan el esquema de configuración, la configuración inicial y las superficies de la interfaz de usuario antes de que
    se cargue el entorno de ejecución del plugin. Véase [Manifiesto del plugin](/es/plugins/manifest) para consultar la referencia completa
    de los campos de nivel superior.

  </Step>

  <Step title="Crear el objeto del plugin de canal">
    La interfaz `ChannelPlugin` tiene muchas superficies de adaptador opcionales. Comience con
    lo mínimo —`id`, `config` y `setup`— y añada adaptadores según los
    necesite.

    Cree `src/channel.ts`:

    ```typescript src/channel.ts
    import {
      createChatChannelPlugin,
      createChannelPluginBase,
    } from "openclaw/plugin-sdk/channel-core";
    import type { OpenClawConfig } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatApi } from "./client.js"; // su cliente de API de la plataforma

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
        // La resolución e inspección de cuentas corresponde a `config`, no a `setup`.
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

      // Seguridad de MD: quién puede enviar mensajes al bot
      security: {
        dm: {
          channelKey: "acme-chat",
          resolvePolicy: (account) => account.dmPolicy,
          resolveAllowFrom: (account) => account.allowFrom,
          defaultPolicy: "allowlist",
        },
      },

      // Emparejamiento: flujo de aprobación para nuevos contactos de MD
      pairing: {
        text: {
          idLabel: "Nombre de usuario de Acme Chat",
          message: "Envíe este código para verificar su identidad:",
          notify: async ({ target, code }) => {
            await acmeChatApi.sendDm(target, `Código de emparejamiento: ${code}`);
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

    Para los canales que aceptan tanto claves canónicas de MD de nivel superior como claves anidadas heredadas, use las funciones auxiliares de `plugin-sdk/channel-config-helpers`: `resolveChannelDmAccess`, `resolveChannelDmPolicy`, `resolveChannelDmAllowFrom` y `normalizeChannelDmPolicy` mantienen los valores locales de la cuenta por delante de los valores raíz heredados. Combine el mismo resolutor con la reparación de doctor mediante `normalizeLegacyDmAliases` para que el entorno de ejecución y la migración lean el mismo contrato.

    <Accordion title="Qué hace createChatChannelPlugin por usted">
      En lugar de implementar manualmente interfaces de adaptador de bajo nivel, se proporcionan
      opciones declarativas y el constructor las compone:

      | Opción | Qué conecta |
      | --- | --- |
      | `security.dm` | Resolutor de seguridad de MD con ámbito a partir de campos de configuración |
      | `pairing.text` | Flujo de emparejamiento de MD basado en texto con intercambio de códigos |
      | `threading` | Resolutor del modo de respuesta (fijo, con ámbito de cuenta o personalizado) |
      | `outbound.attachedResults` | Funciones de envío que devuelven metadatos de resultados (identificadores de mensajes); requiere un identificador `channel` adyacente para que el núcleo pueda marcar el resultado de entrega devuelto |

      También puede proporcionar objetos de adaptador sin procesar en lugar de las opciones declarativas
      si necesita un control total.

      Los adaptadores de salida sin procesar pueden definir una función `chunker(text, limit, ctx)`.
      El elemento opcional `ctx.formatting` contiene decisiones de formato en el momento de la entrega,
      como `maxLinesPerMessage`; aplíquelo antes de enviar para que los hilos de respuesta
      y los límites de fragmentación se resuelvan una sola vez mediante la entrega de salida compartida.
      Los contextos de envío también incluyen `replyToIdSource` (`implicit` o `explicit`)
      cuando se ha resuelto un destino de respuesta nativo, para que las funciones auxiliares de carga útil puedan conservar
      las etiquetas de respuesta explícitas sin consumir un intervalo de respuesta implícito de un solo uso.
    </Accordion>

  </Step>

  <Step title="Conectar el punto de entrada">
    Cree `index.ts`:

    ```typescript index.ts
    import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineChannelPluginEntry({
      id: "acme-chat",
      name: "Acme Chat",
      description: "Plugin de canal de Acme Chat",
      plugin: acmeChatPlugin,
      registerCliMetadata(api) {
        api.registerCli(
          ({ program }) => {
            program
              .command("acme-chat")
              .description("Gestión de Acme Chat");
          },
          {
            descriptors: [
              {
                name: "acme-chat",
                description: "Gestión de Acme Chat",
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

    Coloque los descriptores de la CLI propiedad del canal en `registerCliMetadata(...)` para que OpenClaw
    pueda mostrarlos en la ayuda raíz sin activar el entorno de ejecución completo del canal,
    mientras que las cargas completas normales siguen obteniendo los mismos descriptores para el registro real de
    comandos. Reserve `registerFull(...)` para el trabajo exclusivo del entorno de ejecución.
    `defineChannelPluginEntry` gestiona automáticamente la división de modos de registro.
    Si `registerFull(...)` registra métodos RPC del Gateway, use un
    prefijo específico del plugin. Los espacios de nombres administrativos del núcleo (`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`) permanecen reservados y siempre
    se resuelven como `operator.admin`. Véase
    [Puntos de entrada](/es/plugins/sdk-entrypoints#definechannelpluginentry) para consultar todas las
    opciones.

  </Step>

  <Step title="Añadir una entrada de configuración">
    Cree `setup-entry.ts` para una carga ligera durante la incorporación:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    OpenClaw carga esta entrada en lugar de la completa cuando el canal está deshabilitado
    o sin configurar. Esto evita cargar código pesado del entorno de ejecución durante los flujos de configuración.
    Véase [Configuración inicial y configuración](/es/plugins/sdk-setup#setup-entry) para obtener más información.

    Los canales incluidos en el espacio de trabajo que separan las exportaciones seguras para la configuración en módulos
    auxiliares pueden usar `defineBundledChannelSetupEntry(...)` de
    `openclaw/plugin-sdk/channel-entry-contract` cuando también necesiten un
    definidor explícito del entorno de ejecución durante la configuración.

  </Step>

  <Step title="Gestionar los mensajes entrantes">
    El plugin necesita recibir mensajes de la plataforma y reenviarlos a
    OpenClaw. El patrón habitual es un Webhook que verifica la solicitud y
    la distribuye mediante el controlador de entrada del canal:

    ```typescript
    registerFull(api) {
      api.registerHttpRoute({
        path: "/acme-chat/webhook",
        auth: "plugin", // autenticación gestionada por el plugin (verifique las firmas usted mismo)
        handler: async (req, res) => {
          const event = parseWebhookPayload(req);

          // Su controlador de entrada distribuye el mensaje a OpenClaw.
          // La conexión exacta depende del SDK de su plataforma:
          // consulte un ejemplo real en el paquete del plugin incluido de Microsoft Teams o Google Chat.
          await handleAcmeChatInbound(api, event);

          res.statusCode = 200;
          res.end("ok");
          return true;
        },
      });
    }
    ```

    <Note>
      La gestión de mensajes entrantes es específica de cada canal. Cada plugin de canal es
      propietario de su propia canalización de entrada. Consulte los plugins de canal incluidos
      (por ejemplo, el paquete del plugin de Microsoft Teams o Google Chat) para ver patrones reales.
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="Probar">
Escriba pruebas ubicadas junto al código en `src/channel.test.ts`:

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

    Para consultar los auxiliares de prueba compartidos, véase [Pruebas](/es/plugins/sdk-testing).

</Step>
</Steps>

## Estructura de archivos

```text
<bundled-plugin-root>/acme-chat/
├── package.json              # metadatos de openclaw.channel
├── openclaw.plugin.json      # Manifiesto con esquema de configuración
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
    Ciclo de vida compartido de los eventos de entrada: ingesta, resolución, registro, envío y finalización
  </Card>
</CardGroup>

<Note>
Aún existen algunos puntos de integración auxiliares empaquetados para el mantenimiento y
la compatibilidad de los plugins incluidos. No son el patrón recomendado para los plugins
de canal nuevos; se deben preferir las subrutas genéricas de canal, configuración, respuesta
y entorno de ejecución de la superficie común del SDK, salvo que se mantenga directamente
esa familia de plugins incluidos.
</Note>

## Pasos siguientes

- [Plugins de proveedores](/es/plugins/sdk-provider-plugins) - si el plugin también proporciona modelos
- [Descripción general del SDK](/es/plugins/sdk-overview) - referencia completa de importaciones de subrutas
- [Pruebas del SDK](/es/plugins/sdk-testing) - utilidades de prueba y pruebas de contrato
- [Manifiesto del plugin](/es/plugins/manifest) - esquema completo del manifiesto

## Contenido relacionado

- [Configuración del SDK de plugins](/es/plugins/sdk-setup)
- [Creación de plugins](/es/plugins/building-plugins)
- [Plugins del arnés de agentes](/es/plugins/sdk-agent-harness)

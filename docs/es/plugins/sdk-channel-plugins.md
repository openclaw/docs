---
read_when:
    - Está creando un nuevo plugin de canal de mensajería
    - Quieres conectar OpenClaw a una plataforma de mensajería
    - Necesita comprender la interfaz del adaptador ChannelPlugin
sidebarTitle: Channel Plugins
summary: Guía paso a paso para crear un plugin de canal de mensajería para OpenClaw
title: Creación de plugins de canal
x-i18n:
    generated_at: "2026-07-12T14:44:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: fa573f956bc710b72433d3e19421ab4af4cab8fc854b93dec371e029ce268273
    source_path: plugins/sdk-channel-plugins.md
    workflow: 16
---

Esta guía crea un plugin de canal que conecta OpenClaw con una plataforma de
mensajería: seguridad de mensajes directos, emparejamiento, respuestas en hilos y mensajería saliente.

<Info>
  ¿Es la primera vez que trabaja con plugins de OpenClaw? Lea primero
  [Primeros pasos](/es/plugins/building-plugins) para conocer la estructura de
  paquetes y la configuración del manifiesto.
</Info>

## Responsabilidades del plugin

Los plugins de canal no implementan herramientas para enviar, editar o reaccionar;
el núcleo proporciona una herramienta `message` compartida. El plugin es responsable de:

- **Configuración** - resolución de cuentas y asistente de configuración
- **Seguridad** - política de mensajes directos y listas de permitidos
- **Emparejamiento** - flujo de aprobación de mensajes directos
- **Gramática de sesión** - cómo se asignan los identificadores de conversación
  específicos del proveedor a chats base, identificadores de hilo y alternativas
  de conversación principal
- **Salida** - envío de texto, contenido multimedia y encuestas a la plataforma
- **Hilos** - cómo se organizan las respuestas en hilos
- **Indicador de escritura de Heartbeat** - señales opcionales de escritura/ocupado
  para los destinos de entrega de Heartbeat

El núcleo gestiona la herramienta de mensajes compartida, la integración con el
prompt, la estructura externa de la clave de sesión, el registro genérico de
`:thread:` y el envío.

## Adaptador de mensajes

Exponga un adaptador `message` con `defineChannelMessageAdapter` desde
`openclaw/plugin-sdk/channel-outbound`. Declare únicamente las capacidades
duraderas de envío final que admita realmente el transporte nativo, respaldadas
por una prueba de contrato que demuestre el efecto secundario nativo y el acuse
devuelto. Dirija los envíos de texto y contenido multimedia a las mismas funciones
de transporte que utiliza el adaptador `outbound` heredado. Para consultar el
contrato completo de la API, la matriz de capacidades, las reglas de acuses, la
finalización de vistas previas en vivo, la política de confirmación de recepción,
las pruebas y la tabla de migración, consulte
[API de salida de canales](/es/plugins/sdk-channel-outbound).

Si el adaptador `outbound` existente ya tiene los métodos de envío y los metadatos
de capacidades adecuados, derive el adaptador `message` mediante
`createChannelMessageAdapterFromOutbound(...)` en lugar de escribir manualmente
otro puente. Los envíos del adaptador devuelven valores `MessageReceipt`. Para los
identificadores heredados, derívelos mediante `listMessageReceiptPlatformIds(...)`
o `resolveMessageReceiptPrimaryId(...)` en lugar de mantener campos `messageIds`
paralelos.

Declare con precisión las capacidades en vivo y del finalizador: el núcleo las
utiliza para decidir qué puede hacer un canal, y cualquier divergencia entre el
comportamiento declarado y el real provoca un error en las pruebas de contrato:

| Superficie                            | Valores                                                                                          |
| ------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `message.live.capabilities`           | `draftPreview`, `previewFinalization`, `progressUpdates`, `nativeStreaming`, `quietFinalization` |
| `message.live.finalizer.capabilities` | `finalEdit`, `normalFallback`, `discardPending`, `previewReceipt`, `retainOnAmbiguousFailure`    |

Los canales que finalizan una vista previa de borrador en el mismo lugar deben
encaminar la lógica de ejecución mediante
`defineFinalizableLivePreviewAdapter(...)` junto con
`deliverWithFinalizableLivePreviewAdapter(...)`, y mantener las capacidades
declaradas respaldadas por pruebas
`verifyChannelMessageLiveCapabilityAdapterProofs(...)` y
`verifyChannelMessageLiveFinalizerProofs(...)` para evitar divergencias
silenciosas en el comportamiento de la vista previa nativa, el progreso, la
edición, la alternativa o conservación, la limpieza y los acuses.

Los receptores entrantes que posponen las confirmaciones de la plataforma deben
declarar `message.receive.defaultAckPolicy` y `supportedAckPolicies` en lugar de
ocultar los tiempos de confirmación en un estado local del monitor. Cubra cada
política declarada con `verifyChannelMessageReceiveAckPolicyAdapterProofs(...)`.

Los auxiliares de respuesta heredados, como `createChannelTurnReplyPipeline`,
`dispatchInboundReplyWithBase` y `recordInboundSessionAndDispatchReply`, siguen
disponibles para los distribuidores compatibles. No los utilice en código nuevo
de canales; comience con el adaptador `message`, los acuses y los auxiliares del
ciclo de vida de recepción y envío de `openclaw/plugin-sdk/channel-outbound`.

### Entrada de mensajes entrantes (experimental)

Los canales que migren la autorización de entrada pueden utilizar la subruta
experimental `openclaw/plugin-sdk/channel-ingress-runtime` desde las rutas de
recepción en tiempo de ejecución. Acepta datos de la plataforma, listas de
permitidos sin procesar, descriptores de rutas, datos de comandos y configuración
de grupos de acceso; luego devuelve proyecciones de remitente, ruta, comando y
activación, además del grafo de entrada ordenado, mientras que la consulta de la
plataforma y los efectos secundarios permanecen en el plugin. Mantenga la
normalización de identidad del plugin en el descriptor que se pasa al resolutor;
no serialice los valores de coincidencia sin procesar del estado o la decisión
resueltos. Consulte [API de entrada de canales](/es/plugins/sdk-channel-ingress) para
conocer el diseño de la API, el límite de responsabilidades y las expectativas de
las pruebas. La subruta anterior `openclaw/plugin-sdk/channel-ingress` continúa
exportándose como fachada de compatibilidad obsoleta para plugins de terceros.

### Indicadores de escritura

Si el canal admite indicadores de escritura fuera de las respuestas entrantes,
exponga `heartbeat.sendTyping(...)` en el plugin de canal. El núcleo lo invoca con
el destino de entrega de Heartbeat resuelto antes de que comience la ejecución del
modelo de Heartbeat y utiliza el ciclo de vida compartido de mantenimiento y
limpieza del indicador de escritura. Añada `heartbeat.clearTyping(...)` cuando la
plataforma requiera una señal explícita de detención.

### Parámetros de origen multimedia

Si el canal añade parámetros de la herramienta de mensajes que contienen orígenes
multimedia, exponga los nombres de esos parámetros mediante
`plugin.actions.describeMessageTool(...).mediaSourceParams`. El núcleo utiliza esa
lista explícita para normalizar las rutas del entorno aislado y aplicar la política
de acceso a contenido multimedia saliente, de modo que los plugins no necesiten
casos especiales en el núcleo compartido para parámetros específicos del proveedor
relacionados con avatares, archivos adjuntos o imágenes de portada.

Es preferible utilizar un mapa indexado por acción, como
`{ "set-profile": ["avatarUrl", "avatarPath"] }`, para que las acciones no
relacionadas no hereden los argumentos multimedia de otra acción. También puede
utilizarse una matriz plana para parámetros que se compartan intencionadamente
entre todas las acciones expuestas.

Los canales que deban exponer una URL pública temporal para que la plataforma
obtenga contenido multimedia pueden utilizar `createHostedOutboundMediaStore(...)`
desde `openclaw/plugin-sdk/outbound-media` con almacenes de estado del plugin.
Mantenga el análisis de rutas de la plataforma y la aplicación de tokens en el
plugin de canal; el auxiliar compartido solo gestiona la carga de contenido
multimedia, los metadatos de caducidad, las filas de fragmentos y la limpieza.

### Adaptación de cargas útiles nativas

Si el canal necesita una adaptación específica del proveedor para
`message(action="send")`, utilice preferentemente `actions.prepareSendPayload(...)`.
Coloque las tarjetas, los bloques, las inserciones u otros datos duraderos nativos
en `payload.channelData.<channel>` y permita que el núcleo realice el envío mediante
el adaptador de salida o de mensajes. Utilice `actions.handleAction(...)` para el
envío únicamente como alternativa de compatibilidad para cargas útiles que no
puedan serializarse y reintentarse.

### Gramática de conversación de sesión

Si la plataforma almacena un ámbito adicional dentro de los identificadores de
conversación, mantenga ese análisis en el plugin mediante
`messaging.resolveSessionConversation(...)`. Este es el enlace canónico para
asignar `rawId` al identificador de conversación base, un identificador de hilo
opcional, un `baseConversationId` explícito y cualquier
`parentConversationCandidates`. Cuando devuelva `parentConversationCandidates`,
ordénelos desde la conversación principal más específica hasta la conversación
más general o base.

`messaging.resolveParentConversationCandidates(...)` es una alternativa de
compatibilidad obsoleta para plugins que solo necesitan conversaciones principales
alternativas además del identificador genérico o sin procesar. Si existen ambos
enlaces, el núcleo utiliza primero
`resolveSessionConversation(...).parentConversationCandidates` y solo recurre a
`resolveParentConversationCandidates(...)` cuando el enlace canónico los omite.

Los plugins incluidos que necesiten el mismo análisis antes de que se inicie el
registro de canales pueden exponer un archivo `session-key-api.ts` de nivel superior
con una exportación `resolveSessionConversation(...)` correspondiente (consulte los
plugins de Feishu y Telegram). El núcleo utiliza esa superficie segura para la
inicialización únicamente cuando el registro de plugins en tiempo de ejecución
todavía no está disponible.

Utilice `openclaw/plugin-sdk/channel-route` cuando el código del plugin necesite
normalizar campos similares a rutas, comparar un hilo secundario con su ruta
principal o crear una clave de desduplicación estable a partir de
`{ channel, to, accountId, threadId }`. El auxiliar normaliza los identificadores
numéricos de hilo del mismo modo que el núcleo, por lo que debe preferirse a
comparaciones improvisadas con `String(threadId)`. Los plugins con una gramática de
destinos específica del proveedor deben exponer
`messaging.resolveOutboundSessionRoute(...)` para que el núcleo obtenga la identidad
de sesión y de hilo nativa del proveedor sin adaptadores de análisis.

### Compatibilidad con la vinculación de conversaciones por cuenta

Establezca `conversationBindings.supportsCurrentConversationBinding` cuando el
canal admita vinculaciones genéricas con la conversación actual.
`createChatChannelPlugin(...)` establece esta capacidad estática en `true` de forma
predeterminada.

Si la compatibilidad varía según la cuenta configurada, implemente también
`conversationBindings.isCurrentConversationBindingSupported({ accountId })`. El
núcleo evalúa este enlace síncrono únicamente después de habilitar la capacidad
estática. Devolver `false` hace que las operaciones genéricas de capacidad,
vinculación, consulta, listado, actualización de uso y desvinculación de la
conversación actual no estén disponibles para esa cuenta. Si se omite el enlace,
la capacidad estática se aplica a todas las cuentas.

Determine la respuesta a partir de la configuración de cuenta o el estado de
ejecución ya cargados. Este enlace solo controla las vinculaciones genéricas con
la conversación actual; no sustituye las reglas de vinculación configuradas ni
el enrutamiento de sesiones gestionado por el plugin. Las pruebas de contrato deben
cubrir al menos una cuenta compatible y otra incompatible mediante el contrato
`ChannelPlugin["conversationBindings"]` exportado por
`openclaw/plugin-sdk/channel-core`.

## Aprobaciones y capacidades del canal

La mayoría de los plugins de canal no necesitan código específico para
aprobaciones. El núcleo gestiona `/approve` en el mismo chat, las cargas útiles
compartidas de los botones de aprobación y la entrega alternativa genérica.
`ChannelPlugin.approvals` se eliminó; coloque los datos de entrega, integración
nativa, renderizado y autorización de aprobaciones en un único objeto
`approvalCapability`. `plugin.auth` solo sirve para iniciar y cerrar sesión: el
núcleo ya no lee enlaces de autorización de aprobaciones desde ese objeto.

Utilice `approvalCapability.delivery` únicamente para el enrutamiento nativo de
aprobaciones o la supresión de alternativas, y `approvalCapability.render` solo
cuando un canal necesite realmente cargas útiles de aprobación personalizadas en
lugar del renderizador compartido.

### Autorización de aprobaciones

- `approvalCapability.authorizeActorAction` y
  `approvalCapability.getActionAvailabilityState` son la interfaz canónica para
  la autorización de aprobaciones.
- Utilice `getActionAvailabilityState` para determinar la disponibilidad de la
  autorización de aprobaciones en el mismo chat. Mantenga disponibles los
  aprobadores configurados para `/approve` incluso cuando la entrega nativa esté
  deshabilitada; utilice en su lugar el estado de la superficie nativa de inicio
  para proporcionar orientación sobre la entrega y la configuración.
- Si el canal expone aprobaciones nativas de ejecución, utilice
  `approvalCapability.getExecInitiatingSurfaceState` para el estado del cliente
  nativo o de la superficie de inicio cuando difiera de la autorización de
  aprobaciones en el mismo chat. El núcleo utiliza ese enlace específico de
  ejecución para distinguir entre `enabled` y `disabled`, decidir si el canal de
  inicio admite aprobaciones nativas de ejecución e incluir el canal en la
  orientación de alternativas para el cliente nativo.
  `createApproverRestrictedNativeApprovalCapability(...)` lo implementa para el
  caso habitual.
- Si un canal puede inferir identidades estables similares a las del propietario
  para mensajes directos a partir de la configuración existente, utilice
  `createResolvedApproverActionAuthAdapter` desde
  `openclaw/plugin-sdk/approval-runtime` para restringir `/approve` en el mismo
  chat sin añadir lógica específica de aprobaciones al núcleo.
- Si la autorización personalizada de aprobaciones permite intencionadamente solo
  la alternativa en el mismo chat, devuelva
  `markImplicitSameChatApprovalAuthorization({ authorized: true })` desde
  `openclaw/plugin-sdk/approval-auth-runtime`; de lo contrario, el núcleo trata el
  resultado como una autorización explícita del aprobador.
- Si una devolución de llamada nativa gestionada por el canal resuelve las
  aprobaciones directamente, utilice
  `isImplicitSameChatApprovalAuthorization(...)` antes de resolverlas para que la
  alternativa implícita siga pasando por la autorización normal de actores del
  canal.

### Ciclo de vida de la carga útil y orientación para la configuración

- Usa `outbound.shouldSuppressLocalPayloadPrompt` o
  `outbound.beforeDeliverPayload` para el comportamiento específico del canal
  durante el ciclo de vida de la carga útil, como ocultar solicitudes locales
  de aprobación duplicadas o enviar indicadores de escritura antes de la entrega.
- Usa `approvalCapability.describeExecApprovalSetup` cuando el canal quiera que
  la respuesta de la ruta deshabilitada explique los parámetros de configuración
  exactos necesarios para habilitar las aprobaciones de ejecución nativas. El
  hook recibe `{ channel, channelLabel, accountId }`; los canales con cuentas
  con nombre deben representar rutas con ámbito de cuenta, como
  `channels.<channel>.accounts.<id>.execApprovals.*`, en lugar de valores
  predeterminados de nivel superior.
- Usa `approvalCapability.describePluginApprovalSetup` cuando sea seguro mostrar
  orientación sobre fallos de aprobación de plugins en caso de ausencia de ruta
  o tiempo de espera agotado. `createApproverRestrictedNativeApprovalCapability(...)`
  no lo deduce de `describeExecApprovalSetup`; pasa explícitamente el mismo
  asistente solo cuando las aprobaciones de plugins y de ejecución utilicen
  realmente la misma configuración nativa.

### Entrega de aprobaciones nativas

Si un canal necesita entrega de aprobaciones nativas, mantén el código del canal
centrado en la normalización de destinos y en los datos de transporte/presentación.
Usa `createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`,
`createChannelApproverDmTargetResolver` y
`createApproverRestrictedNativeApprovalCapability` de
`openclaw/plugin-sdk/approval-runtime`. Coloca los datos específicos del canal
detrás de `approvalCapability.nativeRuntime`, idealmente mediante
`createChannelApprovalNativeRuntimeAdapter(...)` o
`createLazyChannelApprovalNativeRuntimeAdapter(...)`, para que el núcleo pueda
componer el controlador y hacerse cargo del filtrado de solicitudes, el
enrutamiento, la desduplicación, la caducidad, la suscripción al Gateway y los
avisos de enrutamiento a otro lugar.

`nativeRuntime` se divide en varias interfaces más pequeñas:

- `availability`: si la cuenta está configurada y si debe gestionarse una solicitud
- `presentation`: convierte el modelo de vista de aprobación compartido en
  cargas útiles nativas pendientes/resueltas/caducadas o acciones finales
- `transport`: prepara destinos y envía/actualiza/elimina mensajes de aprobación
  nativos
- `interactions`: hooks opcionales para vincular/desvincular/borrar acciones de
  botones o reacciones nativos, además de un hook opcional `cancelDelivered`.
  Implementa `cancelDelivered` cuando `deliverPending` registre estado en el
  proceso o persistente (como un almacén de destinos de reacciones), para que
  dicho estado pueda liberarse si la detención de un controlador cancela la
  entrega antes de que se ejecute `bindPending`, o cuando `bindPending` no
  devuelva ningún identificador
- `observe`: hooks opcionales de diagnóstico de entrega

Otros asistentes de aprobación:

- Usa `createNativeApprovalChannelRouteGates` de
  `openclaw/plugin-sdk/approval-native-runtime` cuando un canal admita tanto
  entrega nativa en el origen de la sesión como destinos explícitos de reenvío
  de aprobaciones. El asistente centraliza la selección de la configuración de
  aprobaciones, la gestión de `mode`, los filtros de agente/sesión, la vinculación
  de cuentas, la coincidencia de destinos de sesión y la coincidencia con listas
  de destinos, mientras que quienes lo invocan siguen siendo responsables del
  id del canal, el modo de reenvío predeterminado, la búsqueda de cuentas, la
  comprobación de que el transporte esté habilitado, la normalización de destinos
  y la resolución del destino de origen del turno. No lo uses para crear valores
  predeterminados de políticas de canal propiedad del núcleo; pasa explícitamente
  el modo predeterminado documentado del canal.
- `createChannelNativeOriginTargetResolver` usa de forma predeterminada el
  comparador compartido de rutas de canal para destinos
  `{ to, accountId, threadId }`. Pasa `targetsMatch` solo cuando un canal tenga
  reglas de equivalencia específicas del proveedor, como la coincidencia de
  prefijos de marcas de tiempo de Slack. Pasa `normalizeTargetForMatch` cuando
  el canal necesite canonizar los ids del proveedor antes de ejecutar el
  comparador de rutas predeterminado o un callback `targetsMatch` personalizado,
  conservando a la vez el destino original para la entrega. Usa `normalizeTarget`
  solo cuando deba canonizarse el propio destino de entrega resuelto.
- Si el canal necesita objetos propiedad del entorno de ejecución, como un
  cliente, token, aplicación Bolt o receptor de Webhooks, regístralos mediante
  `openclaw/plugin-sdk/channel-runtime-context`. El registro genérico de contexto
  de ejecución permite que el núcleo inicialice controladores basados en
  capacidades a partir del estado de inicio del canal sin añadir código de
  enlace específico de las aprobaciones.
- Recurre a los componentes de menor nivel `createChannelApprovalHandler` o
  `createChannelNativeApprovalRuntime` solo cuando la interfaz basada en
  capacidades aún no sea suficientemente expresiva.
- Los canales de aprobación nativa deben enrutar tanto `accountId` como
  `approvalKind` mediante esos asistentes. `accountId` mantiene la política de
  aprobación para varias cuentas dentro del ámbito de la cuenta de bot correcta,
  y `approvalKind` mantiene disponible para el canal el comportamiento de
  aprobación de ejecución frente al de plugins sin ramas codificadas de forma
  rígida en el núcleo.
- El núcleo también es responsable de los avisos de redireccionamiento de
  aprobaciones. Los plugins de canal no deben enviar sus propios mensajes de
  seguimiento del tipo «la aprobación se envió a los mensajes directos/a otro
  canal» desde `createChannelNativeApprovalRuntime`; en su lugar, deben exponer
  un enrutamiento preciso del origen y de los mensajes directos del aprobador
  mediante los asistentes compartidos de capacidades de aprobación y dejar que
  el núcleo agregue las entregas reales antes de publicar cualquier aviso en el
  chat que inició la solicitud.
- Conserva de extremo a extremo el tipo del id de aprobación entregado. Los
  clientes nativos no deben suponer ni reescribir el enrutamiento de aprobaciones
  de ejecución frente a las de plugins a partir del estado local del canal.
- Pasa ese `approvalKind` explícito a `resolveApprovalOverGateway`. Esto utiliza
  el servicio canónico `approval.resolve` y devuelve el ganador registrado
  cuando otra superficie responde primero. La entrada explícita anterior
  `resolveMethod` se conserva para controles basados en comandos; las nuevas
  acciones nativas no deben usarla ni deducir el tipo a partir de un id.
- Los distintos tipos de aprobación pueden exponer intencionadamente superficies
  nativas diferentes. Ejemplos incluidos actualmente: Matrix conserva el mismo
  enrutamiento nativo por mensajes directos/canales y la misma experiencia de
  usuario con reacciones para las aprobaciones de ejecución y de plugins, aunque
  permite que la autenticación varíe según el tipo de aprobación; Slack mantiene
  disponible el enrutamiento nativo de aprobaciones tanto para ids de ejecución
  como de plugins.
- `createApproverRestrictedNativeApprovalAdapter` sigue existiendo como contenedor
  de compatibilidad, pero el código nuevo debe preferir el constructor de
  capacidades y exponer `approvalCapability` en el plugin.

### Subrutas más específicas del entorno de ejecución de aprobaciones

Para los puntos de entrada de canal críticos, prefiere estas subrutas más
específicas al módulo de barril más amplio `approval-runtime` cuando solo
necesites una parte de esa familia:

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

Del mismo modo, prefiere `openclaw/plugin-sdk/reply-runtime`,
`openclaw/plugin-sdk/reply-dispatch-runtime`,
`openclaw/plugin-sdk/reply-reference` y
`openclaw/plugin-sdk/reply-chunking` a superficies generales más amplias cuando
no las necesites todas.

### Subrutas de configuración

- `openclaw/plugin-sdk/setup-runtime` abarca los asistentes de configuración
  seguros para el entorno de ejecución: `createSetupTranslator`, adaptadores de
  parches de configuración seguros para la importación
  (`createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), salida de notas de búsqueda,
  `promptResolvedAllowFrom`, `splitSetupEntries` y los constructores delegados
  de proxies de configuración.
- `openclaw/plugin-sdk/channel-setup` abarca los constructores de configuración
  para instalaciones opcionales, además de algunas primitivas seguras para la
  configuración: `createOptionalChannelSetupSurface`,
  `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`,
  `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`,
  `setSetupChannelEnabled` y `splitSetupEntries`.
- Usa la interfaz más amplia `openclaw/plugin-sdk/setup` solo cuando también
  necesites los asistentes compartidos más pesados de configuración, como
  `moveSingleAccountChannelSectionToDefaultAccount(...)`.

Si el canal solo quiere anunciar «instala primero este plugin» en las superficies
de configuración, prefiere `createOptionalChannelSetupSurface(...)`. El
adaptador/asistente generado impide de forma segura las escrituras de
configuración y la finalización, y reutiliza el mismo mensaje de instalación
obligatoria en la validación, la finalización y el texto del enlace a la
documentación.

Si el canal admite configuración o autenticación mediante variables de entorno
y los flujos genéricos de inicio/configuración deben conocer los nombres de esas
variables antes de cargar el entorno de ejecución, decláralos en el manifiesto
del plugin mediante `channelEnvVars`. Conserva `envVars` del entorno de ejecución
del canal o las constantes locales solo para el texto dirigido a operadores.

Si el canal puede aparecer en `status`, `channels list`, `channels status` o en
análisis de SecretRef antes de que se inicie el entorno de ejecución del plugin,
añade `openclaw.setupEntry` a `package.json`. Ese punto de entrada debe poder
importarse de forma segura en rutas de comandos de solo lectura y debe devolver
los metadatos del canal, el adaptador de configuración seguro para la
configuración, el adaptador de estado y los metadatos de destinos de secretos
del canal necesarios para esos resúmenes. No inicies clientes, escuchas ni
entornos de ejecución de transporte desde la entrada de configuración.

Mantén también restringida la ruta de importación de la entrada principal del
canal. El descubrimiento puede evaluar la entrada y el módulo del plugin de canal
para registrar capacidades sin activar el canal. Los archivos como
`channel-plugin-api.ts` deben exportar el objeto del plugin de canal sin importar
asistentes de configuración, clientes de transporte, escuchas de sockets,
lanzadores de subprocesos ni módulos de inicio de servicios. Coloca esos
componentes de ejecución en módulos cargados desde `registerFull(...)`,
configuradores del entorno de ejecución o adaptadores de capacidades con carga
diferida.

### Otras subrutas específicas de canales

Para otras rutas críticas de canales, prefiere los asistentes específicos a las
superficies heredadas más amplias:

- `openclaw/plugin-sdk/account-core`, `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution` y
  `openclaw/plugin-sdk/account-helpers` para la configuración de varias cuentas
  y la alternativa de cuenta predeterminada
- `openclaw/plugin-sdk/inbound-envelope` y
  `openclaw/plugin-sdk/channel-inbound` para el enrutamiento/sobre entrante y
  la conexión de registro y despacho
- `openclaw/plugin-sdk/channel-targets` para asistentes de análisis de destinos
- `openclaw/plugin-sdk/outbound-media` para la carga de contenido multimedia y
  `openclaw/plugin-sdk/channel-outbound` para delegados de identidad/envío
  salientes y planificación de cargas útiles
- `buildThreadAwareOutboundSessionRoute(...)` de
  `openclaw/plugin-sdk/channel-core` cuando una ruta saliente deba conservar un
  `replyToId`/`threadId` explícito o recuperar la sesión `:thread:` actual después
  de que la clave de sesión base siga coincidiendo. Los plugins de proveedor
  pueden sustituir la precedencia, el comportamiento de sufijos y la
  normalización del id del hilo cuando su plataforma tenga semántica nativa de
  entrega en hilos.
- `openclaw/plugin-sdk/thread-bindings-runtime` para el ciclo de vida de las
  vinculaciones de hilos y el registro de adaptadores
- `openclaw/plugin-sdk/agent-media-payload` solo cuando siga siendo necesaria una
  disposición heredada de campos de cargas útiles de agente/contenido multimedia
- `openclaw/plugin-sdk/telegram-command-config` (obsoleto: ningún plugin incluido
  lo usa en producción) para la normalización de comandos personalizados de
  Telegram, la validación de duplicados/conflictos y un contrato de configuración
  de comandos estable frente a alternativas; prefiere la gestión de configuración
  de comandos local del plugin para el código de plugins nuevo

Por lo general, los canales que solo requieren autenticación pueden limitarse a
la ruta predeterminada: el núcleo gestiona las aprobaciones y el plugin solo
expone capacidades salientes/de autenticación. Los canales de aprobación nativa,
como Matrix, Slack, Telegram y los transportes de chat personalizados, deben usar
los asistentes nativos compartidos en lugar de implementar su propio ciclo de
vida de aprobaciones.

## Política de menciones entrantes

Mantén la gestión de menciones entrantes dividida en dos capas:

- recopilación de pruebas propiedad del plugin
- evaluación compartida de políticas

Usa `openclaw/plugin-sdk/channel-mention-gating` para las decisiones de políticas
de menciones. Usa `openclaw/plugin-sdk/channel-inbound` solo cuando necesites el
módulo de barril más amplio de asistentes de entrada.

Casos adecuados para lógica local del plugin:

- detección de respuestas al bot
- detección de citas del bot
- comprobaciones de participación en hilos
- exclusiones de mensajes de servicio/sistema
- cachés nativas de la plataforma necesarias para demostrar la participación
  del bot

Casos adecuados para el asistente compartido:

- `requireMention`
- resultado de mención explícita
- lista de permitidos de menciones implícitas
- omisión para comandos
- decisión final de omisión

Flujo preferido:

1. Calcula los datos locales de mención.
2. Pasa esos datos a `resolveInboundMentionDecision({ facts, policy })`.
3. Usa `decision.effectiveWasMentioned`, `decision.shouldBypassMention` y
   `decision.shouldSkip` en la compuerta de entrada.

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
`isExplicitlyMentioned` y `canResolveExplicit` proceden de los metadatos de
mención nativos del propio canal (entidades del mensaje, indicadores de respuesta
al bot y similares); proporciona valores `false`/`undefined` cuando la plataforma
no pueda detectarlos.

`api.runtime.channel.mentions` expone los mismos asistentes compartidos de
menciones para los plugins de canal incluidos que ya dependen de la inyección
en tiempo de ejecución: `buildMentionRegexes`, `matchesMentionPatterns`,
`matchesMentionWithExplicit`, `implicitMentionKindWhen`,
`resolveInboundMentionDecision`.

Si solo necesitas `implicitMentionKindWhen` y `resolveInboundMentionDecision`,
importa desde `openclaw/plugin-sdk/channel-mention-gating` para evitar cargar
asistentes de entrada no relacionados.

## Tutorial paso a paso

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Paquete y manifiesto">
    Crea los archivos estándar del plugin. El campo `channels` de
    `openclaw.plugin.json` (no un campo `kind`) es lo que indica que un
    manifiesto es propietario de un canal. Para consultar toda la superficie
    de metadatos del paquete, consulta
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

    `configSchema` valida `plugins.entries.acme-chat.config`. Úsalo para la
    configuración propia del plugin que no forme parte de la configuración de
    la cuenta del canal. `channelConfigs.acme-chat.schema` valida
    `channels.acme-chat` y es la fuente de la ruta de inicialización que usan
    el esquema de configuración, la configuración inicial y las superficies
    de la interfaz antes de que se cargue el entorno de ejecución del plugin.
    Consulta [Manifiesto del plugin](/es/plugins/manifest) para obtener la
    referencia completa de los campos de nivel superior.

  </Step>

  <Step title="Crea el objeto del plugin de canal">
    La interfaz `ChannelPlugin` tiene muchas superficies de adaptador
    opcionales. Empieza con lo mínimo —`id`, `config` y `setup`— y añade
    adaptadores según los necesites.

    Crea `src/channel.ts`:

    ```typescript src/channel.ts
    import {
      createChatChannelPlugin,
      createChannelPluginBase,
    } from "openclaw/plugin-sdk/channel-core";
    import type { OpenClawConfig } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatApi } from "./client.js"; // cliente de la API de tu plataforma

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
      if (!token) throw new Error("acme-chat: el token es obligatorio");
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
        // La resolución e inspección de cuentas pertenece a `config`, no a `setup`.
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

      // Vinculación: flujo de aprobación para nuevos contactos por MD
      pairing: {
        text: {
          idLabel: "Nombre de usuario de Acme Chat",
          message: "Envía este código para verificar tu identidad:",
          notify: async ({ target, code }) => {
            await acmeChatApi.sendDm(target, `Código de vinculación: ${code}`);
          },
        },
      },

      // Hilos: cómo se entregan las respuestas
      threading: { topLevelReplyToMode: "reply" },

      // Salida: envía mensajes a la plataforma
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

    Para los canales que aceptan tanto claves canónicas de MD de nivel superior
    como claves anidadas heredadas, usa los asistentes de
    `plugin-sdk/channel-config-helpers`: `resolveChannelDmAccess`,
    `resolveChannelDmPolicy`, `resolveChannelDmAllowFrom` y
    `normalizeChannelDmPolicy` mantienen los valores locales de la cuenta por
    delante de los valores heredados de la raíz. Combina el mismo solucionador
    con la reparación de doctor mediante `normalizeLegacyDmAliases` para que el
    entorno de ejecución y la migración lean el mismo contrato.

    <Accordion title="Qué hace createChatChannelPlugin por ti">
      En lugar de implementar manualmente interfaces de adaptador de bajo nivel,
      proporcionas opciones declarativas y el constructor las combina:

      | Opción | Qué conecta |
      | --- | --- |
      | `security.dm` | Solucionador de seguridad de MD con ámbito a partir de campos de configuración |
      | `pairing.text` | Flujo de vinculación por MD basado en texto con intercambio de códigos |
      | `threading` | Solucionador del modo de respuesta (fijo, con ámbito de cuenta o personalizado) |
      | `outbound.attachedResults` | Funciones de envío que devuelven metadatos del resultado (identificadores de mensajes); requiere un identificador `channel` hermano para que el núcleo pueda marcar el resultado de entrega devuelto |

      También puedes proporcionar objetos de adaptador sin procesar en lugar de
      las opciones declarativas si necesitas un control total.

      Los adaptadores de salida sin procesar pueden definir una función
      `chunker(text, limit, ctx)`. El valor opcional `ctx.formatting` contiene
      decisiones de formato tomadas en el momento de la entrega, como
      `maxLinesPerMessage`; aplícalas antes del envío para que los hilos de
      respuesta y los límites de los fragmentos se resuelvan una sola vez
      mediante la entrega de salida compartida. Los contextos de envío también
      incluyen `replyToIdSource` (`implicit` o `explicit`) cuando se ha resuelto
      un destino de respuesta nativo, de modo que los asistentes de carga útil
      puedan conservar las etiquetas de respuesta explícitas sin consumir un
      espacio de respuesta implícito de un solo uso.
    </Accordion>

  </Step>

  <Step title="Conecta el punto de entrada">
    Crea `index.ts`:

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

    Coloca los descriptores de la CLI propios del canal en
    `registerCliMetadata(...)` para que OpenClaw pueda mostrarlos en la ayuda
    raíz sin activar todo el entorno de ejecución del canal, mientras que las
    cargas completas normales siguen recogiendo los mismos descriptores para
    registrar los comandos reales. Reserva `registerFull(...)` para el trabajo
    exclusivo del entorno de ejecución. `defineChannelPluginEntry` gestiona
    automáticamente la separación entre modos de registro. Si
    `registerFull(...)` registra métodos RPC del Gateway, usa un prefijo
    específico del plugin. Los espacios de nombres administrativos del núcleo
    (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) permanecen
    reservados y siempre se resuelven como `operator.admin`. Consulta
    [Puntos de entrada](/es/plugins/sdk-entrypoints#definechannelpluginentry) para
    conocer todas las opciones.

  </Step>

  <Step title="Añade una entrada de configuración inicial">
    Crea `setup-entry.ts` para realizar una carga ligera durante la
    incorporación:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    OpenClaw carga esta entrada en lugar de la entrada completa cuando el canal
    está deshabilitado o sin configurar. Esto evita cargar código pesado del
    entorno de ejecución durante los flujos de configuración inicial. Consulta
    [Configuración inicial y configuración](/es/plugins/sdk-setup#setup-entry)
    para obtener más información.

    Los canales incluidos en el espacio de trabajo que separan las
    exportaciones seguras para la configuración inicial en módulos auxiliares
    pueden usar `defineBundledChannelSetupEntry(...)` desde
    `openclaw/plugin-sdk/channel-entry-contract` cuando también necesiten un
    definidor explícito del entorno de ejecución durante la configuración
    inicial.

  </Step>

  <Step title="Gestiona los mensajes entrantes">
    El plugin debe recibir mensajes de la plataforma y reenviarlos a OpenClaw.
    El patrón habitual consiste en un Webhook que verifica la solicitud y la
    despacha mediante el controlador de entrada del canal:

    ```typescript
    registerFull(api) {
      api.registerHttpRoute({
        path: "/acme-chat/webhook",
        auth: "plugin", // autenticación gestionada por el plugin (verifique las firmas)
        handler: async (req, res) => {
          const event = parseWebhookPayload(req);

          // El controlador de entrada envía el mensaje a OpenClaw.
          // La conexión exacta depende del SDK de la plataforma;
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
      La gestión de mensajes entrantes es específica de cada canal. Cada plugin de canal posee
      su propia canalización de entrada. Consulte los plugins de canal incluidos
      (por ejemplo, el paquete del plugin de Microsoft Teams o Google Chat) para ver patrones reales.
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="Prueba">
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

      it("informa de la falta de configuración", () => {
        const cfg = { channels: {} } as any;
        const result = acmeChatPlugin.config.inspectAccount!(cfg, undefined);
        expect(result.configured).toBe(false);
      });
    });
    ```

    ```bash
    pnpm test <bundled-plugin-root>/acme-chat/
    ```

    Para conocer los auxiliares de prueba compartidos, consulte [Pruebas](/es/plugins/sdk-testing).

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
    Ciclo de vida compartido de eventos entrantes: ingesta, resolución, registro, envío y finalización
  </Card>
</CardGroup>

<Note>
Todavía existen algunos puntos de integración auxiliares incluidos para el mantenimiento y la
compatibilidad de los plugins incluidos. No son el patrón recomendado para los nuevos plugins de canal;
se deben preferir las subrutas genéricas de canal, configuración, respuesta y entorno de ejecución de la
superficie común del SDK, salvo que se mantenga directamente esa familia de plugins incluidos.
</Note>

## Siguientes pasos

- [Plugins de proveedor](/es/plugins/sdk-provider-plugins) - si el plugin también proporciona modelos
- [Descripción general del SDK](/es/plugins/sdk-overview) - referencia completa de importación de subrutas
- [Pruebas del SDK](/es/plugins/sdk-testing) - utilidades de prueba y pruebas de contrato
- [Manifiesto del plugin](/es/plugins/manifest) - esquema completo del manifiesto

## Contenido relacionado

- [Configuración del SDK de plugins](/es/plugins/sdk-setup)
- [Creación de plugins](/es/plugins/building-plugins)
- [Plugins del entorno del agente](/es/plugins/sdk-agent-harness)

---
read_when:
    - Está creando un nuevo Plugin de canal de mensajería
    - Quieres conectar OpenClaw a una plataforma de mensajería
    - Necesitas comprender la superficie del adaptador ChannelPlugin
sidebarTitle: Channel Plugins
summary: Guía paso a paso para crear un plugin de canal de mensajería para OpenClaw
title: Crear plugins de canal
x-i18n:
    generated_at: "2026-07-05T11:32:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8c0151fad0915cda90987aa2401d1d4a326f7922cf5d838171a4014a84ad713f
    source_path: plugins/sdk-channel-plugins.md
    workflow: 16
---

Esta guía crea un Plugin de canal que conecta OpenClaw con una plataforma de
mensajería: seguridad de DM, emparejamiento, hilos de respuesta y mensajería
saliente.

<Info>
  ¿Eres nuevo en los Plugins de OpenClaw? Lee primero [Primeros pasos](/es/plugins/building-plugins)
  para conocer la estructura del paquete y la configuración del manifiesto.
</Info>

## Qué pertenece a tu Plugin

Los Plugins de canal no implementan herramientas para enviar/editar/reaccionar; el núcleo proporciona una
herramienta `message` compartida. A tu Plugin le corresponde:

- **Configuración** - resolución de cuentas y asistente de configuración
- **Seguridad** - política de DM y listas de permitidos
- **Emparejamiento** - flujo de aprobación por DM
- **Gramática de sesión** - cómo los ids de conversación específicos del proveedor se asignan a chats
  base, ids de hilo y alternativas de padres
- **Saliente** - envío de texto, medios y encuestas a la plataforma
- **Hilos** - cómo se organizan las respuestas en hilos
- **Escritura de Heartbeat** - señales opcionales de escritura/ocupado para destinos de entrega de Heartbeat

El núcleo posee la herramienta de mensaje compartida, el cableado de prompts, la forma externa de la clave de sesión,
la contabilidad genérica `:thread:` y el despacho.

## Adaptador de mensajes

Expón un adaptador `message` con `defineChannelMessageAdapter` desde
`openclaw/plugin-sdk/channel-outbound`. Declara solo las capacidades duraderas de envío final
que tu transporte nativo admite realmente, respaldadas por una prueba de contrato
que demuestre el efecto secundario nativo y el recibo devuelto. Apunta los envíos de texto/medios
a las mismas funciones de transporte que usa el adaptador `outbound` heredado. Para
el contrato completo de la API, la matriz de capacidades, las reglas de recibos, la finalización
de vista previa en vivo, la política de acuse de recibo, las pruebas y la tabla de migración, consulta
[API saliente de canales](/es/plugins/sdk-channel-outbound).

Si tu adaptador `outbound` existente ya tiene los métodos de envío y los metadatos
de capacidades adecuados, deriva el adaptador `message` con
`createChannelMessageAdapterFromOutbound(...)` en lugar de escribir otro puente a mano.
Los envíos del adaptador devuelven valores `MessageReceipt`. Para ids heredados, derívalos
con `listMessageReceiptPlatformIds(...)` o
`resolveMessageReceiptPrimaryId(...)` en lugar de mantener campos `messageIds`
paralelos.

Declara con precisión las capacidades en vivo y de finalizador; el núcleo las usa para decidir
qué puede hacer un canal, y la divergencia entre el comportamiento declarado y el real es un
fallo de prueba de contrato:

| Superficie                            | Valores                                                                                          |
| ------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `message.live.capabilities`           | `draftPreview`, `previewFinalization`, `progressUpdates`, `nativeStreaming`, `quietFinalization` |
| `message.live.finalizer.capabilities` | `finalEdit`, `normalFallback`, `discardPending`, `previewReceipt`, `retainOnAmbiguousFailure`    |

Los canales que finalizan una vista previa de borrador en el mismo lugar deben enrutar la lógica de ejecución
mediante `defineFinalizableLivePreviewAdapter(...)` más
`deliverWithFinalizableLivePreviewAdapter(...)`, y mantener las capacidades declaradas
respaldadas por pruebas `verifyChannelMessageLiveCapabilityAdapterProofs(...)`
y `verifyChannelMessageLiveFinalizerProofs(...)` para que el comportamiento nativo de vista previa,
progreso, edición, alternativa/retención, limpieza y recibos no pueda desviarse
silenciosamente.

Los receptores entrantes que difieren los acuses de recibo de la plataforma deben declarar
`message.receive.defaultAckPolicy` y `supportedAckPolicies` en lugar de ocultar
el tiempo del acuse en estado local del monitor. Cubre cada política declarada con
`verifyChannelMessageReceiveAckPolicyAdapterProofs(...)`.

Los helpers de respuesta heredados como `createChannelTurnReplyPipeline`,
`dispatchInboundReplyWithBase` y `recordInboundSessionAndDispatchReply`
siguen disponibles para despachadores de compatibilidad. No los uses para código nuevo
de canales; empieza con el adaptador `message`, recibos y helpers del ciclo de vida
de recepción/envío en `openclaw/plugin-sdk/channel-outbound`.

### Ingreso entrante (experimental)

Los canales que migran la autorización entrante pueden usar el subpath experimental
`openclaw/plugin-sdk/channel-ingress-runtime` desde rutas de recepción en runtime.
Acepta datos de plataforma, listas de permitidos sin procesar, descriptores de ruta, datos de comandos
y configuración de grupos de acceso, y luego devuelve proyecciones de remitente/ruta/comando/activación
más el grafo de ingreso ordenado, mientras que la búsqueda en plataforma y los efectos secundarios
permanecen en el Plugin. Mantén la normalización de identidad del Plugin en el
descriptor que pasas al resolvedor; no serialices valores de coincidencia sin procesar desde
el estado o la decisión resueltos. Consulta
[API de ingreso de canales](/es/plugins/sdk-channel-ingress) para ver el diseño de la API,
el límite de propiedad y las expectativas de prueba. El subpath anterior
`openclaw/plugin-sdk/channel-ingress` sigue exportado como fachada de compatibilidad obsoleta
para Plugins de terceros.

### Indicadores de escritura

Si tu canal admite indicadores de escritura fuera de las respuestas entrantes, expón
`heartbeat.sendTyping(...)` en el Plugin de canal. El núcleo lo llama con el
destino de entrega de Heartbeat resuelto antes de que empiece la ejecución del modelo de Heartbeat y
usa el ciclo de vida compartido de mantenimiento/limpieza de escritura. Añade
`heartbeat.clearTyping(...)` cuando la plataforma necesite una señal explícita de parada.

### Parámetros de origen de medios

Si tu canal añade parámetros de herramienta de mensajes que llevan orígenes de medios, expón
esos nombres de parámetros mediante `plugin.actions.describeMessageTool(...).mediaSourceParams`.
El núcleo usa esa lista explícita para la normalización de rutas de sandbox y la política
de acceso a medios salientes, por lo que los Plugins no necesitan casos especiales de núcleo compartido para
parámetros específicos del proveedor de avatar, adjunto o imagen de portada.

Prefiere un mapa por clave de acción como `{ "set-profile": ["avatarUrl", "avatarPath"] }`
para que las acciones no relacionadas no hereden los argumentos de medios de otra acción. Un arreglo plano
sigue funcionando para parámetros compartidos intencionalmente por cada acción expuesta.

Los canales que deban exponer una URL pública temporal para una obtención de medios del lado de la plataforma
pueden usar `createHostedOutboundMediaStore(...)` desde
`openclaw/plugin-sdk/outbound-media` con almacenes de estado del Plugin. Mantén el análisis
de rutas de plataforma y la aplicación de tokens en el Plugin de canal; el helper compartido
solo posee la carga de medios, los metadatos de expiración, las filas de fragmentos y la limpieza.

### Modelado de payload nativo

Si tu canal necesita modelado específico del proveedor para `message(action="send")`,
prefiere `actions.prepareSendPayload(...)`. Coloca tarjetas nativas, bloques, embeds u
otros datos duraderos bajo `payload.channelData.<channel>` y deja que el núcleo envíe
mediante el adaptador saliente/de mensajes. Usa `actions.handleAction(...)` para enviar
solo como alternativa de compatibilidad para payloads que no pueden serializarse y
reintentarse.

### Gramática de conversación de sesión

Si tu plataforma almacena alcance adicional dentro de los ids de conversación, mantén ese análisis
en el Plugin con `messaging.resolveSessionConversation(...)`. Ese es el hook
canónico para asignar `rawId` al id de conversación base, id de hilo opcional,
`baseConversationId` explícito y cualquier
`parentConversationCandidates`. Cuando devuelvas `parentConversationCandidates`,
ordénalos desde el padre más estrecho hasta la conversación más amplia/base.

`messaging.resolveParentConversationCandidates(...)` es una alternativa de compatibilidad
obsoleta para Plugins que solo necesitan alternativas de padres encima del id genérico/sin procesar.
Si existen ambos hooks, el núcleo usa primero
`resolveSessionConversation(...).parentConversationCandidates` y solo recurre a
`resolveParentConversationCandidates(...)` cuando el hook canónico los omite.

Los Plugins incluidos que necesiten el mismo análisis antes de que arranque el registro de canales
pueden exponer un archivo de nivel superior `session-key-api.ts` con una exportación
`resolveSessionConversation(...)` coincidente (consulta los Plugins Feishu y Telegram).
El núcleo usa esa superficie segura para arranque solo cuando el registro de Plugins en runtime
todavía no está disponible.

Usa `openclaw/plugin-sdk/channel-route` cuando el código del Plugin necesite normalizar
campos similares a rutas, comparar un hilo hijo con su ruta padre o construir una
clave estable de deduplicación desde `{ channel, to, accountId, threadId }`. El helper
normaliza ids de hilo numéricos de la misma forma que el núcleo, así que prefiérelo frente a comparaciones
ad hoc de `String(threadId)`. Los Plugins con gramática de destino específica del proveedor
deben exponer `messaging.resolveOutboundSessionRoute(...)` para que el núcleo obtenga
identidad de sesión e hilo nativa del proveedor sin shims de parser.

## Aprobaciones y capacidades de canal

La mayoría de los Plugins de canal no necesitan código específico de aprobación. El núcleo posee
`/approve` en el mismo chat, los payloads compartidos de botones de aprobación y la entrega alternativa genérica.
`ChannelPlugin.approvals` se eliminó; coloca los datos de entrega/nativo/renderizado/autenticación
de aprobaciones en un único objeto `approvalCapability`. `plugin.auth` es solo inicio/cierre
de sesión; el núcleo ya no lee hooks de autenticación de aprobación desde ese objeto.

Usa `approvalCapability.delivery` solo para enrutamiento nativo de aprobaciones o supresión
de alternativas, y `approvalCapability.render` solo cuando un canal realmente necesita
payloads de aprobación personalizados en lugar del renderizador compartido.

### Autenticación de aprobación

- `approvalCapability.authorizeActorAction` y
  `approvalCapability.getActionAvailabilityState` son la vía canónica
  de autenticación de aprobación.
- Usa `getActionAvailabilityState` para la disponibilidad de autenticación de aprobación en el mismo chat.
  Mantén disponibles a los aprobadores configurados para `/approve` incluso cuando la entrega nativa
  esté deshabilitada; usa en cambio el estado de la superficie de inicio nativa para orientación de entrega/configuración.
- Si tu canal expone aprobaciones de exec nativas, usa
  `approvalCapability.getExecInitiatingSurfaceState` para el estado de
  superficie de inicio/cliente nativo cuando difiera de la autenticación de aprobación en el mismo chat.
  El núcleo usa ese hook específico de exec para distinguir `enabled` de
  `disabled`, decidir si el canal iniciador admite aprobaciones de exec nativas
  e incluir el canal en la orientación de alternativa del cliente nativo.
  `createApproverRestrictedNativeApprovalCapability(...)` completa esto para
  el caso común.
- Si un canal puede inferir identidades de DM estables similares a propietario a partir de la configuración existente,
  usa `createResolvedApproverActionAuthAdapter` desde
  `openclaw/plugin-sdk/approval-runtime` para restringir `/approve` en el mismo chat
  sin añadir lógica de núcleo específica de aprobación.
- Si la autenticación de aprobación personalizada permite intencionalmente solo la alternativa del mismo chat, devuelve
  `markImplicitSameChatApprovalAuthorization({ authorized: true })` desde
  `openclaw/plugin-sdk/approval-auth-runtime`; de lo contrario, el núcleo trata el
  resultado como autorización explícita de aprobador.
- Si una devolución de llamada nativa propiedad del canal resuelve aprobaciones directamente, usa
  `isImplicitSameChatApprovalAuthorization(...)` antes de resolver para que la alternativa implícita
  siga pasando por la autorización normal de actor del canal.

### Ciclo de vida del payload y orientación de configuración

- Usa `outbound.shouldSuppressLocalPayloadPrompt` o
  `outbound.beforeDeliverPayload` para comportamiento del ciclo de vida del payload específico del canal,
  como ocultar prompts locales de aprobación duplicados o enviar indicadores de escritura
  antes de la entrega.
- Usa `approvalCapability.describeExecApprovalSetup` cuando el canal quiera
  que la respuesta de ruta deshabilitada explique los controles exactos de configuración necesarios para habilitar
  aprobaciones de exec nativas. El hook recibe `{ channel, channelLabel, accountId }`;
  los canales con cuentas con nombre deben renderizar rutas con alcance de cuenta como
  `channels.<channel>.accounts.<id>.execApprovals.*` en lugar de valores predeterminados
  de nivel superior.
- Usa `approvalCapability.describePluginApprovalSetup` cuando sea seguro mostrar la orientación
  de fallos de aprobación de Plugin para fallos sin ruta y de tiempo de espera de aprobación de Plugin.
  `createApproverRestrictedNativeApprovalCapability(...)` no infiere esto desde
  `describeExecApprovalSetup`; pasa el mismo helper explícitamente solo cuando las aprobaciones
  de Plugin y exec usen realmente la misma configuración nativa.

### Entrega de aprobación nativa

Si un canal necesita entrega de aprobación nativa, mantén el código del canal enfocado en
la normalización del destino y en los datos de transporte/presentación. Usa
`createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`,
`createChannelApproverDmTargetResolver` y
`createApproverRestrictedNativeApprovalCapability` de
`openclaw/plugin-sdk/approval-runtime`. Coloca los datos específicos del canal detrás de
`approvalCapability.nativeRuntime`, idealmente mediante
`createChannelApprovalNativeRuntimeAdapter(...)` o
`createLazyChannelApprovalNativeRuntimeAdapter(...)`, para que core pueda ensamblar el
manejador y hacerse cargo del filtrado de solicitudes, el enrutamiento, la deduplicación, la caducidad, la suscripción al Gateway
y los avisos de enrutamiento a otro lugar.

`nativeRuntime` se divide en algunos puntos de integración más pequeños:

- `availability` - si la cuenta está configurada y si una solicitud
  debe manejarse
- `presentation` - asigna el modelo de vista de aprobación compartido a
  cargas nativas pendientes/resueltas/caducadas o acciones finales
- `transport` - prepara destinos y envía/actualiza/elimina mensajes de
  aprobación nativos
- `interactions` - hooks opcionales bind/unbind/clear-action para botones
  o reacciones nativos, además de un hook opcional `cancelDelivered`. Implementa
  `cancelDelivered` cuando `deliverPending` registra estado en proceso o persistente
  (como un almacén de destinos de reacción) para que ese estado pueda liberarse si una
  detención del manejador cancela la entrega antes de que se ejecute `bindPending`, o cuando
  `bindPending` no devuelve ningún handle
- `observe` - hooks opcionales de diagnóstico de entrega

Otros helpers de aprobación:

- Usa `createNativeApprovalChannelRouteGates` de
  `openclaw/plugin-sdk/approval-native-runtime` cuando un canal admite tanto
  entrega nativa con origen de sesión como destinos explícitos de reenvío de aprobación. El
  helper centraliza la selección de configuración de aprobación, el manejo de `mode`, los filtros de agente/sesión,
  la vinculación de cuentas, la coincidencia de destinos de sesión y la coincidencia de listas de destinos,
  mientras que los llamadores siguen siendo propietarios del id de canal, el modo predeterminado de reenvío, la búsqueda de cuenta,
  la comprobación de transporte habilitado, la normalización de destinos y la resolución de destinos
  de origen de turno. No lo uses para crear valores predeterminados de política de canal propiedad de core;
  pasa explícitamente el modo predeterminado documentado del canal.
- `createChannelNativeOriginTargetResolver` usa de forma predeterminada el matcher compartido de rutas de canal
  para destinos `{ to, accountId, threadId }`. Pasa
  `targetsMatch` solo cuando un canal tiene reglas de equivalencia específicas del proveedor,
  como la coincidencia de prefijo de timestamp de Slack. Pasa `normalizeTargetForMatch` cuando
  el canal necesite canonicalizar ids de proveedor antes de que se ejecute el matcher de ruta
  predeterminado o un callback personalizado `targetsMatch`, preservando al mismo tiempo el
  destino original para la entrega. Usa `normalizeTarget` solo cuando el propio destino
  de entrega resuelto deba canonicalizarse.
- Si el canal necesita objetos propiedad del runtime como un cliente, token, aplicación Bolt
  o receptor de webhook, regístralos mediante
  `openclaw/plugin-sdk/channel-runtime-context`. El registro genérico de contexto de runtime
  permite que core arranque manejadores impulsados por capacidades desde el estado de inicio
  del canal sin agregar pegamento de wrappers específico de aprobación.
- Recurre a `createChannelApprovalHandler` o
  `createChannelNativeApprovalRuntime` de nivel más bajo solo cuando el punto de integración impulsado por capacidades
  todavía no sea suficientemente expresivo.
- Los canales de aprobación nativa deben enrutar tanto `accountId` como `approvalKind`
  mediante esos helpers. `accountId` mantiene la política de aprobación multi-cuenta
  acotada a la cuenta de bot correcta, y `approvalKind` mantiene el comportamiento de aprobación exec vs plugin
  disponible para el canal sin ramas hardcodeadas en
  core.
- Core también es propietario de los avisos de redireccionamiento de aprobación. Los plugins de canal no deben enviar
  sus propios mensajes de seguimiento "la aprobación fue a DMs / otro canal" desde
  `createChannelNativeApprovalRuntime`; en su lugar, expón un enrutamiento preciso de origen +
  DM del aprobador mediante los helpers compartidos de capacidad de aprobación y deja que
  core agregue las entregas reales antes de publicar cualquier aviso de vuelta al
  chat iniciador.
- Preserva el tipo de id de aprobación entregado de extremo a extremo. Los clientes nativos no deben
  adivinar ni reescribir el enrutamiento de aprobación exec vs plugin desde estado local del canal.
- Distintos tipos de aprobación pueden exponer intencionalmente superficies nativas diferentes.
  Ejemplos empaquetados actuales: Matrix mantiene el mismo enrutamiento nativo de DM/canal
  y la UX de reacciones para aprobaciones exec y plugin, a la vez que permite que
  la autenticación difiera por tipo de aprobación; Slack mantiene el enrutamiento de aprobación nativa disponible
  tanto para ids exec como plugin.
- `createApproverRestrictedNativeApprovalAdapter` todavía existe como
  wrapper de compatibilidad, pero el código nuevo debe preferir el constructor de capacidades
  y exponer `approvalCapability` en el plugin.

### Subrutas más acotadas del runtime de aprobación

Para puntos de entrada críticos de canales, prefiere estas subrutas más acotadas sobre el barrel más amplio
`approval-runtime` cuando solo necesites una parte de esa familia:

- `openclaw/plugin-sdk/approval-auth-runtime`
- `openclaw/plugin-sdk/approval-client-runtime`
- `openclaw/plugin-sdk/approval-delivery-runtime`
- `openclaw/plugin-sdk/approval-gateway-runtime`
- `openclaw/plugin-sdk/approval-handler-adapter-runtime`
- `openclaw/plugin-sdk/approval-handler-runtime`
- `openclaw/plugin-sdk/approval-native-runtime`
- `openclaw/plugin-sdk/approval-reply-runtime`
- `openclaw/plugin-sdk/channel-runtime-context`

Del mismo modo, prefiere `openclaw/plugin-sdk/reply-runtime`,
`openclaw/plugin-sdk/reply-dispatch-runtime`,
`openclaw/plugin-sdk/reply-reference` y
`openclaw/plugin-sdk/reply-chunking` sobre superficies paraguas más amplias cuando
no las necesites todas.

### Subrutas de configuración

- `openclaw/plugin-sdk/setup-runtime` cubre los helpers de configuración seguros para runtime:
  `createSetupTranslator`, adaptadores de parches de configuración seguros para importación
  (`createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), salida de notas de búsqueda,
  `promptResolvedAllowFrom`, `splitSetupEntries` y los constructores delegados
  setup-proxy.
- `openclaw/plugin-sdk/channel-setup` cubre los constructores de configuración de instalación opcional
  además de algunas primitivas seguras para configuración: `createOptionalChannelSetupSurface`,
  `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`,
  `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`,
  `setSetupChannelEnabled` y `splitSetupEntries`.
- Usa el punto de integración más amplio `openclaw/plugin-sdk/setup` solo cuando también necesites
  los helpers compartidos más pesados de configuración/configuración, como
  `moveSingleAccountChannelSectionToDefaultAccount(...)`.

Si tu canal solo quiere anunciar "instala este plugin primero" en superficies de configuración,
prefiere `createOptionalChannelSetupSurface(...)`. El adaptador/asistente generado
falla de forma cerrada en escrituras de configuración y finalización, y reutiliza
el mismo mensaje de instalación requerida en validación, finalización y texto de enlace
a documentación.

Si tu canal admite configuración o autenticación impulsada por env y los flujos genéricos de inicio/configuración
deben conocer esos nombres de env antes de que se cargue el runtime, decláralos en el
manifiesto del plugin con `channelEnvVars`. Conserva `envVars` del runtime del canal o constantes locales
solo para texto orientado a operadores.

Si tu canal puede aparecer en `status`, `channels list`, `channels status` o
escaneos SecretRef antes de que arranque el runtime del plugin, agrega `openclaw.setupEntry` en
`package.json`. Ese punto de entrada debe ser seguro de importar en rutas de comandos
de solo lectura y debe devolver los metadatos del canal, el adaptador de configuración seguro para setup,
el adaptador de estado y los metadatos de destinos secretos del canal necesarios para esos
resúmenes. No inicies clientes, listeners ni runtimes de transporte desde la
entrada de configuración.

Mantén también acotada la ruta de importación de la entrada principal del canal. El descubrimiento puede evaluar
la entrada y el módulo del plugin de canal para registrar capacidades sin
activar el canal. Archivos como `channel-plugin-api.ts` deben exportar
el objeto del plugin de canal sin importar asistentes de configuración, clientes de transporte,
listeners de sockets, lanzadores de subprocesos ni módulos de inicio de servicios.
Coloca esas piezas de runtime en módulos cargados desde `registerFull(...)`, setters
de runtime o adaptadores de capacidad lazy.

### Otras subrutas acotadas de canal

Para otras rutas críticas de canal, prefiere los helpers acotados sobre superficies heredadas
más amplias:

- `openclaw/plugin-sdk/account-core`, `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution` y
  `openclaw/plugin-sdk/account-helpers` para configuración multi-cuenta y
  fallback de cuenta predeterminada
- `openclaw/plugin-sdk/inbound-envelope` y
  `openclaw/plugin-sdk/channel-inbound` para rutas/sobres entrantes y
  cableado de registro y despacho
- `openclaw/plugin-sdk/channel-targets` para helpers de análisis de destinos
- `openclaw/plugin-sdk/outbound-media` para carga de medios y
  `openclaw/plugin-sdk/channel-outbound` para delegados de identidad/envío salientes
  y planificación de payloads
- `buildThreadAwareOutboundSessionRoute(...)` de
  `openclaw/plugin-sdk/channel-core` cuando una ruta saliente debe preservar
  un `replyToId`/`threadId` explícito o recuperar la sesión `:thread:`
  actual después de que la clave de sesión base todavía coincida. Los plugins de proveedor pueden
  sobrescribir la precedencia, el comportamiento de sufijo y la normalización de id de hilo cuando
  su plataforma tenga semántica nativa de entrega en hilos.
- `openclaw/plugin-sdk/thread-bindings-runtime` para el ciclo de vida de vinculaciones de hilos
  y el registro de adaptadores
- `openclaw/plugin-sdk/agent-media-payload` solo cuando todavía se requiera
  un diseño heredado de campos de payload de agente/medio
- `openclaw/plugin-sdk/telegram-command-config` (obsoleto: ningún plugin empaquetado
  lo usa en producción) para la normalización de comandos personalizados de Telegram,
  validación de duplicados/conflictos y un contrato de configuración de comandos
  estable ante fallback; prefiere el manejo de configuración de comandos local al plugin para código de plugin nuevo

Los canales solo de autenticación normalmente pueden quedarse en la ruta predeterminada: core maneja
las aprobaciones y el plugin solo expone capacidades de salida/autenticación. Los canales
de aprobación nativa como Matrix, Slack, Telegram y transportes de chat personalizados
deben usar los helpers nativos compartidos en lugar de implementar su propio ciclo de vida
de aprobación.

## Política de menciones entrantes

Mantén el manejo de menciones entrantes dividido en dos capas:

- recopilación de evidencia propiedad del plugin
- evaluación de política compartida

Usa `openclaw/plugin-sdk/channel-mention-gating` para decisiones de política de menciones.
Usa `openclaw/plugin-sdk/channel-inbound` solo cuando necesites el barrel más amplio
de helpers entrantes.

Buen encaje para lógica local del plugin:

- detección de respuesta al bot
- detección de bot citado
- comprobaciones de participación en hilos
- exclusiones de mensajes de servicio/sistema
- cachés nativas de plataforma necesarias para demostrar participación del bot

Buen encaje para el helper compartido:

- `requireMention`
- resultado de mención explícita
- lista de permisos de mención implícita
- omisión por comando
- decisión final de omisión

Flujo preferido:

1. Calcula los datos locales de mención.
2. Pasa esos datos a `resolveInboundMentionDecision({ facts, policy })`.
3. Usa `decision.effectiveWasMentioned`, `decision.shouldBypassMention` y
   `decision.shouldSkip` en tu puerta de entrada.

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
`isExplicitlyMentioned` y `canResolveExplicit` provienen de los propios
metadatos nativos de mención del canal (entidades de mensaje, flags de respuesta al bot y similares);
proporciona valores `false`/`undefined` cuando tu plataforma no pueda detectarlos.

`api.runtime.channel.mentions` expone los mismos helpers de menciones compartidos para
plugins de canal incluidos que ya dependen de la inyección en runtime:
`buildMentionRegexes`, `matchesMentionPatterns`, `matchesMentionWithExplicit`,
`implicitMentionKindWhen`, `resolveInboundMentionDecision`.

Si solo necesitas `implicitMentionKindWhen` y `resolveInboundMentionDecision`,
importa desde `openclaw/plugin-sdk/channel-mention-gating` para evitar cargar
helpers de runtime entrante no relacionados.

## Tutorial

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Package and manifest">
    Crea los archivos estándar del Plugin. El campo `channels` en
    `openclaw.plugin.json` (no un campo `kind`) es lo que marca un manifiesto
    como propietario de un canal. Para ver toda la superficie de metadatos del paquete, consulta
    [Configuración y setup de Plugin](/es/plugins/sdk-setup#openclaw-channel):

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
          "blurb": "Connect OpenClaw to Acme Chat."
        }
      }
    }
    ```

    ```json openclaw.plugin.json
    {
      "id": "acme-chat",
      "channels": ["acme-chat"],
      "name": "Acme Chat",
      "description": "Acme Chat channel plugin",
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
              "label": "Bot token",
              "sensitive": true
            }
          }
        }
      }
    }
    ```
    </CodeGroup>

    `configSchema` valida `plugins.entries.acme-chat.config`. Úsalo para
    ajustes propiedad del Plugin que no sean la configuración de la cuenta del canal.
    `channelConfigs.acme-chat.schema` valida `channels.acme-chat` y es la
    fuente de ruta fría que usan el esquema de configuración, el setup y las superficies de UI antes de que
    se cargue el runtime del Plugin. Consulta [Manifiesto de Plugin](/es/plugins/manifest) para ver la referencia completa
    de campos de nivel superior.

  </Step>

  <Step title="Build the channel plugin object">
    La interfaz `ChannelPlugin` tiene muchas superficies opcionales de adaptador. Empieza con
    el mínimo: `id`, `config` y `setup`; y añade adaptadores a medida que los
    necesites.

    Crea `src/channel.ts`:

    ```typescript src/channel.ts
    import {
      createChatChannelPlugin,
      createChannelPluginBase,
    } from "openclaw/plugin-sdk/channel-core";
    import type { OpenClawConfig } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatApi } from "./client.js"; // your platform API client

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
      if (!token) throw new Error("acme-chat: token is required");
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
        // Account resolution/inspection belongs on `config`, not `setup`.
        // `setup` covers onboarding writes (applyAccountConfig, validateInput).
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

      // DM security: who can message the bot
      security: {
        dm: {
          channelKey: "acme-chat",
          resolvePolicy: (account) => account.dmPolicy,
          resolveAllowFrom: (account) => account.allowFrom,
          defaultPolicy: "allowlist",
        },
      },

      // Pairing: approval flow for new DM contacts
      pairing: {
        text: {
          idLabel: "Acme Chat username",
          message: "Send this code to verify your identity:",
          notify: async ({ target, code }) => {
            await acmeChatApi.sendDm(target, `Pairing code: ${code}`);
          },
        },
      },

      // Threading: how replies are delivered
      threading: { topLevelReplyToMode: "reply" },

      // Outbound: send messages to the platform
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

    Para canales que aceptan tanto claves DM canónicas de nivel superior como claves anidadas heredadas, usa los helpers de `plugin-sdk/channel-config-helpers`: `resolveChannelDmAccess`, `resolveChannelDmPolicy`, `resolveChannelDmAllowFrom` y `normalizeChannelDmPolicy` mantienen los valores locales de la cuenta por delante de los valores raíz heredados. Combina el mismo resolutor con la reparación de doctor mediante `normalizeLegacyDmAliases` para que el runtime y la migración lean el mismo contrato.

    <Accordion title="What createChatChannelPlugin does for you">
      En lugar de implementar manualmente interfaces de adaptador de bajo nivel, pasas
      opciones declarativas y el constructor las compone:

      | Opción | Qué conecta |
      | --- | --- |
      | `security.dm` | Resolutor de seguridad DM con alcance desde campos de configuración |
      | `pairing.text` | Flujo de emparejamiento DM basado en texto con intercambio de código |
      | `threading` | Resolutor de modo de respuesta (fijo, con alcance de cuenta o personalizado) |
      | `outbound.attachedResults` | Funciones de envío que devuelven metadatos de resultado (IDs de mensaje); requiere un id `channel` hermano para que core pueda sellar el resultado de entrega devuelto |

      También puedes pasar objetos de adaptador sin procesar en lugar de las opciones declarativas
      si necesitas control total.

      Los adaptadores de salida sin procesar pueden definir una función `chunker(text, limit, ctx)`.
      El `ctx.formatting` opcional lleva decisiones de formato en tiempo de entrega,
      como `maxLinesPerMessage`; aplícalo antes de enviar para que el threading de respuestas
      y los límites de fragmentos se resuelvan una sola vez mediante la entrega de salida compartida.
      Los contextos de envío también incluyen `replyToIdSource` (`implicit` o `explicit`)
      cuando se resolvió un destino de respuesta nativo, de modo que los helpers de payload puedan preservar
      etiquetas de respuesta explícitas sin consumir un espacio de respuesta implícita de un solo uso.
    </Accordion>

  </Step>

  <Step title="Wire the entry point">
    Crea `index.ts`:

    ```typescript index.ts
    import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineChannelPluginEntry({
      id: "acme-chat",
      name: "Acme Chat",
      description: "Acme Chat channel plugin",
      plugin: acmeChatPlugin,
      registerCliMetadata(api) {
        api.registerCli(
          ({ program }) => {
            program
              .command("acme-chat")
              .description("Acme Chat management");
          },
          {
            descriptors: [
              {
                name: "acme-chat",
                description: "Acme Chat management",
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
    pueda mostrarlos en la ayuda raíz sin activar todo el runtime del canal,
    mientras que las cargas completas normales siguen recogiendo los mismos descriptores para el registro real de comandos.
    Mantén `registerFull(...)` para trabajo exclusivo de runtime.
    `defineChannelPluginEntry` gestiona automáticamente la división del modo de registro.
    Si `registerFull(...)` registra métodos RPC de Gateway, usa un
    prefijo específico del Plugin. Los espacios de nombres administrativos de core (`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`) permanecen reservados y siempre
    se resuelven a `operator.admin`. Consulta
    [Puntos de entrada](/es/plugins/sdk-entrypoints#definechannelpluginentry) para ver todas las
    opciones.

  </Step>

  <Step title="Add a setup entry">
    Crea `setup-entry.ts` para una carga ligera durante el onboarding:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    OpenClaw carga esto en lugar de la entrada completa cuando el canal está deshabilitado
    o sin configurar. Evita traer código pesado de runtime durante los flujos de setup.
    Consulta [Setup y configuración](/es/plugins/sdk-setup#setup-entry) para más detalles.

    Los canales de workspace incluidos que separan exportaciones seguras para setup en módulos
    sidecar pueden usar `defineBundledChannelSetupEntry(...)` desde
    `openclaw/plugin-sdk/channel-entry-contract` cuando también necesitan un
    setter explícito de runtime en tiempo de setup.

  </Step>

  <Step title="Handle inbound messages">
    Tu Plugin necesita recibir mensajes de la plataforma y reenviarlos a
    OpenClaw. El patrón típico es un Webhook que verifica la solicitud y
    la despacha mediante el manejador entrante de tu canal:

    ```typescript
    registerFull(api) {
      api.registerHttpRoute({
        path: "/acme-chat/webhook",
        auth: "plugin", // plugin-managed auth (verify signatures yourself)
        handler: async (req, res) => {
          const event = parseWebhookPayload(req);

          // Your inbound handler dispatches the message to OpenClaw.
          // The exact wiring depends on your platform SDK -
          // see a real example in the bundled Microsoft Teams or Google Chat plugin package.
          await handleAcmeChatInbound(api, event);

          res.statusCode = 200;
          res.end("ok");
          return true;
        },
      });
    }
    ```

    <Note>
      El manejo de mensajes entrantes es específico de cada canal. Cada Plugin de canal posee
      su propia canalización entrante. Examina los plugins de canal incluidos
      (por ejemplo, el paquete de Plugin de Microsoft Teams o Google Chat) para ver patrones reales.
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="Test">
Escribe pruebas colocadas junto al código en `src/channel.test.ts`:

    ```typescript src/channel.test.ts
    import { describe, it, expect } from "vitest";
    import { acmeChatPlugin } from "./channel.js";

    describe("acme-chat plugin", () => {
      it("resolves account from config", () => {
        const cfg = {
          channels: {
            "acme-chat": { token: "test-token", allowFrom: ["user1"] },
          },
        } as any;
        const account = acmeChatPlugin.config.resolveAccount(cfg, undefined);
        expect(account.token).toBe("test-token");
      });

      it("inspects account without materializing secrets", () => {
        const cfg = {
          channels: { "acme-chat": { token: "test-token" } },
        } as any;
        const result = acmeChatPlugin.config.inspectAccount!(cfg, undefined);
        expect(result.configured).toBe(true);
        expect(result.tokenStatus).toBe("available");
      });

      it("reports missing config", () => {
        const cfg = { channels: {} } as any;
        const result = acmeChatPlugin.config.inspectAccount!(cfg, undefined);
        expect(result.configured).toBe(false);
      });
    });
    ```

    ```bash
    pnpm test <bundled-plugin-root>/acme-chat/
    ```

    Para helpers de prueba compartidos, consulta [Pruebas](/es/plugins/sdk-testing).

</Step>
</Steps>

## Estructura de archivos

```text
<bundled-plugin-root>/acme-chat/
├── package.json              # openclaw.channel metadata
├── openclaw.plugin.json      # Manifest with config schema
├── index.ts                  # defineChannelPluginEntry
├── setup-entry.ts            # defineSetupPluginEntry
├── api.ts                    # Public exports (optional)
├── runtime-api.ts            # Internal runtime exports (optional)
└── src/
    ├── channel.ts            # ChannelPlugin via createChatChannelPlugin
    ├── channel.test.ts       # Tests
    ├── client.ts             # Platform API client
    └── runtime.ts            # Runtime store (if needed)
```

## Temas avanzados

<CardGroup cols={2}>
  <Card title="Threading options" icon="git-branch" href="/es/plugins/sdk-entrypoints#registration-mode">
    Modos de respuesta fijos, con alcance de cuenta o personalizados
  </Card>
  <Card title="Message tool integration" icon="puzzle" href="/es/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool y descubrimiento de acciones
  </Card>
  <Card title="Target resolution" icon="crosshair" href="/es/plugins/architecture-internals#channel-target-resolution">
    inferTargetChatType, looksLikeId, reservedLiterals, resolveTarget
  </Card>
  <Card title="Runtime helpers" icon="settings" href="/es/plugins/sdk-runtime">
    TTS, STT, medios, subagente mediante api.runtime
  </Card>
  <Card title="Channel inbound API" icon="bolt" href="/es/plugins/sdk-channel-inbound">
    Ciclo de vida de eventos entrantes compartido: ingesta, resolución, registro, envío y finalización
  </Card>
</CardGroup>

<Note>
Todavía existen algunos puntos de integración de helpers incluidos para el mantenimiento de Plugins incluidos y
la compatibilidad. No son el patrón recomendado para nuevos Plugins de canal;
prefiere las subrutas genéricas de canal/configuración/respuesta/runtime de la superficie común del SDK,
a menos que mantengas directamente esa familia de Plugins incluidos.
</Note>

## Siguientes pasos

- [Plugins de proveedor](/es/plugins/sdk-provider-plugins) - si tu Plugin también proporciona modelos
- [Información general del SDK](/es/plugins/sdk-overview) - referencia completa de importación por subrutas
- [Pruebas del SDK](/es/plugins/sdk-testing) - utilidades de prueba y pruebas de contrato
- [Manifiesto de Plugin](/es/plugins/manifest) - esquema completo del manifiesto

## Relacionado

- [Configuración del SDK de Plugin](/es/plugins/sdk-setup)
- [Creación de Plugins](/es/plugins/building-plugins)
- [Plugins de arnés de agente](/es/plugins/sdk-agent-harness)

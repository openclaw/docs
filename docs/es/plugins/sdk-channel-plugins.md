---
read_when:
    - Estás creando un nuevo plugin de canal de mensajería
    - Quiere conectar OpenClaw a una plataforma de mensajería
    - Necesitas entender la superficie del adaptador ChannelPlugin
sidebarTitle: Channel Plugins
summary: Guía paso a paso para crear un Plugin de canal de mensajería para OpenClaw
title: Crear plugins de canal
x-i18n:
    generated_at: "2026-07-02T22:22:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 84490ebdd482d1f09827af38274d06beea6d7fd72071e66beb79fcc12c86656a
    source_path: plugins/sdk-channel-plugins.md
    workflow: 16
---

Esta guía recorre la creación de un plugin de canal que conecta OpenClaw con una
plataforma de mensajería. Al final tendrás un canal funcional con seguridad de DM,
emparejamiento, encadenamiento de respuestas y mensajería saliente.

<Info>
  Si aún no has creado ningún plugin de OpenClaw, lee primero
  [Primeros pasos](/es/plugins/building-plugins) para conocer la estructura básica
  del paquete y la configuración del manifiesto.
</Info>

## Cómo funcionan los plugins de canal

Los plugins de canal no necesitan sus propias herramientas de enviar/editar/reaccionar. OpenClaw mantiene una
herramienta `message` compartida en el núcleo. Tu plugin es responsable de:

- **Configuración** - resolución de cuentas y asistente de configuración
- **Seguridad** - política de DM y listas de permitidos
- **Emparejamiento** - flujo de aprobación por DM
- **Gramática de sesión** - cómo los ids de conversación específicos del proveedor se asignan a chats base, ids de hilo y alternativas de padre
- **Salida** - envío de texto, medios y encuestas a la plataforma
- **Encadenamiento** - cómo se encadenan las respuestas
- **Indicador de escritura de Heartbeat** - señales opcionales de escritura/ocupado para destinos de entrega de Heartbeat

El núcleo es responsable de la herramienta de mensajes compartida, el cableado del prompt, la forma externa de la clave de sesión,
la contabilidad genérica de `:thread:` y el despacho.

Los nuevos plugins de canal también deben exponer un adaptador `message` con
`defineChannelMessageAdapter` desde `openclaw/plugin-sdk/channel-outbound`. El
adaptador declara qué capacidades duraderas de envío final admite realmente el transporte nativo
y dirige los envíos de texto/medios a las mismas funciones de transporte que
el adaptador `outbound` heredado. Declara una capacidad solo cuando una prueba de contrato
demuestre el efecto secundario nativo y el recibo devuelto.
Para ver el contrato completo de la API, ejemplos, matriz de capacidades, reglas de recibos, finalización de vistas previas en vivo, política de confirmación de recepción, pruebas y tabla de migración, consulta
[API de salida de canal](/es/plugins/sdk-channel-outbound).
Si el adaptador `outbound` existente ya tiene los métodos de envío y
metadatos de capacidad correctos, usa `createChannelMessageAdapterFromOutbound(...)` para
derivar el adaptador `message` en lugar de escribir otro puente manualmente.
Los envíos del adaptador deben devolver valores `MessageReceipt`. Cuando el código de compatibilidad
todavía necesite ids heredados, derívalos con `listMessageReceiptPlatformIds(...)`
o `resolveMessageReceiptPrimaryId(...)` en lugar de mantener campos
`messageIds` paralelos en código de ciclo de vida nuevo.
Los canales con capacidad de vista previa también deben declarar `message.live.capabilities` con
el ciclo de vida en vivo exacto que poseen, como `draftPreview`,
`previewFinalization`, `progressUpdates`, `nativeStreaming` o
`quietFinalization`. Los canales que finalizan una vista previa de borrador en el mismo lugar también deben
declarar `message.live.finalizer.capabilities`, como `finalEdit`,
`normalFallback`, `discardPending`, `previewReceipt` y
`retainOnAmbiguousFailure`, y enrutar la lógica de ejecución a través de
`defineFinalizableLivePreviewAdapter(...)` más
`deliverWithFinalizableLivePreviewAdapter(...)`. Mantén esas capacidades respaldadas
por pruebas `verifyChannelMessageLiveCapabilityAdapterProofs(...)` y
`verifyChannelMessageLiveFinalizerProofs(...)` para que el comportamiento nativo de vista previa,
progreso, edición, alternativa/retención, limpieza y recibos no pueda desviarse
silenciosamente.
Los receptores de entrada que aplazan las confirmaciones de la plataforma deben declarar
`message.receive.defaultAckPolicy` y `supportedAckPolicies` en lugar de ocultar
el momento de confirmación en el estado local del monitor. Cubre cada política declarada con
`verifyChannelMessageReceiveAckPolicyAdapterProofs(...)`.

Los helpers de respuesta heredados como `createChannelTurnReplyPipeline`,
`dispatchInboundReplyWithBase` y `recordInboundSessionAndDispatchReply`
siguen disponibles para despachadores de compatibilidad. No uses esos nombres para código de canal nuevo; los plugins nuevos deben empezar con el adaptador `message`, recibos y
helpers de ciclo de vida de recepción/envío en `openclaw/plugin-sdk/channel-outbound`.

Los canales que migren autorización de entrada pueden usar la subruta experimental
`openclaw/plugin-sdk/channel-ingress-runtime` desde rutas de recepción en tiempo de ejecución.
La subruta mantiene la búsqueda de plataforma y los efectos secundarios en el plugin, mientras
comparte resolución de estado de listas de permitidos, decisiones de ruta/remitente/comando/evento/activación,
diagnósticos redactados y asignación de admisión de turnos. Mantén la
normalización de identidad del plugin en el descriptor que pasas al resolutor; no
serialices valores de coincidencia sin procesar del estado o decisión resueltos. Consulta
[API de entrada de canal](/es/plugins/sdk-channel-ingress) para conocer el diseño de la API,
el límite de propiedad y las expectativas de prueba.

Si tu canal admite indicadores de escritura fuera de las respuestas de entrada, expón
`heartbeat.sendTyping(...)` en el plugin de canal. El núcleo lo llama con el
destino de entrega de Heartbeat resuelto antes de que empiece la ejecución del modelo de Heartbeat y
usa el ciclo de vida compartido de mantenimiento/limpieza de escritura. Añade `heartbeat.clearTyping(...)`
cuando la plataforma necesite una señal explícita de detención.

Si tu canal añade parámetros de herramienta de mensajes que transportan fuentes de medios, expón esos
nombres de parámetros mediante `describeMessageTool(...).mediaSourceParams`. El núcleo usa
esa lista explícita para la normalización de rutas de sandbox y la política de acceso a medios salientes,
por lo que los plugins no necesitan casos especiales en el núcleo compartido para parámetros específicos del proveedor
de avatar, adjunto o imagen de portada.
Prefiere devolver un mapa con claves de acción como
`{ "set-profile": ["avatarUrl", "avatarPath"] }` para que las acciones no relacionadas no
hereden los argumentos de medios de otra acción. Un arreglo plano sigue funcionando para parámetros que
se comparten intencionalmente entre cada acción expuesta.
Los canales que deban exponer una URL pública temporal para una obtención de medios del lado de la plataforma
pueden usar `createHostedOutboundMediaStore(...)` desde
`openclaw/plugin-sdk/outbound-media` con almacenes de estado del plugin. Mantén el
análisis de rutas de plataforma y la aplicación de tokens en el plugin de canal; el helper compartido
solo es responsable de la carga de medios, metadatos de caducidad, filas de fragmentos y limpieza.

Si tu canal necesita conformación específica del proveedor para `message(action="send")`,
prefiere `actions.prepareSendPayload(...)`. Coloca tarjetas nativas, bloques, incrustaciones u
otros datos duraderos bajo `payload.channelData.<channel>` y deja que el núcleo realice
el envío real a través del adaptador outbound/message. Usa
`actions.handleAction(...)` para enviar solo como alternativa de compatibilidad para
cargas que no puedan serializarse y reintentarse.

Si tu plataforma almacena alcance adicional dentro de los ids de conversación, mantén ese análisis
en el plugin con `messaging.resolveSessionConversation(...)`. Ese es el
hook canónico para asignar `rawId` al id de conversación base, id de hilo opcional,
`baseConversationId` explícito y cualquier `parentConversationCandidates`.
Cuando devuelvas `parentConversationCandidates`, mantenlos ordenados desde el
padre más específico hasta la conversación más amplia/base.

Usa `openclaw/plugin-sdk/channel-route` cuando el código del plugin necesite normalizar
campos similares a rutas, comparar un hilo hijo con su ruta padre o construir una
clave de deduplicación estable a partir de `{ channel, to, accountId, threadId }`. El helper
normaliza los ids de hilo numéricos del mismo modo que lo hace el núcleo, por lo que los plugins deben preferirlo
frente a comparaciones ad hoc de `String(threadId)`.
Los plugins con gramática de destino específica del proveedor deben exponer
`messaging.resolveOutboundSessionRoute(...)` para que el núcleo obtenga identidad de sesión
e hilo nativa del proveedor sin usar shims de análisis.

Los plugins incluidos que necesiten el mismo análisis antes de que arranque el registro de canales
también pueden exponer un archivo de nivel superior `session-key-api.ts` con una exportación
`resolveSessionConversation(...)` coincidente. El núcleo usa esa superficie segura para arranque
solo cuando el registro de plugins en tiempo de ejecución aún no está disponible.

`messaging.resolveParentConversationCandidates(...)` sigue disponible como
alternativa de compatibilidad heredada cuando un plugin solo necesita alternativas de padre encima
del id genérico/sin procesar. Si existen ambos hooks, el núcleo usa primero
`resolveSessionConversation(...).parentConversationCandidates` y solo recurre a
`resolveParentConversationCandidates(...)` cuando el hook canónico
los omite.

## Aprobaciones y capacidades de canal

La mayoría de los plugins de canal no necesitan código específico de aprobación.

- El núcleo posee `/approve` en el mismo chat, las cargas útiles de botones de aprobación compartidas y la entrega de fallback genérica.
- Prefiere un único objeto `approvalCapability` en el plugin de canal cuando el canal necesita comportamiento específico de aprobación.
- `ChannelPlugin.approvals` se eliminó. Coloca los datos de entrega/nativos/renderización/autenticación de aprobaciones en `approvalCapability`.
- `plugin.auth` es solo inicio/cierre de sesión; el núcleo ya no lee hooks de autenticación de aprobaciones desde ese objeto.
- `approvalCapability.authorizeActorAction` y `approvalCapability.getActionAvailabilityState` son la seam canónica de autenticación de aprobaciones.
- Usa `approvalCapability.getActionAvailabilityState` para la disponibilidad de autenticación de aprobaciones en el mismo chat. Mantén disponibles los aprobadores configurados para `/approve` incluso cuando la entrega nativa esté deshabilitada; usa en su lugar el estado de la superficie iniciadora nativa para la guía de entrega/configuración.
- Si tu canal expone aprobaciones exec nativas, usa `approvalCapability.getExecInitiatingSurfaceState` para el estado de la superficie iniciadora/cliente nativo cuando difiera de la autenticación de aprobaciones en el mismo chat. El núcleo usa ese hook específico de exec para distinguir `enabled` de `disabled`, decidir si el canal iniciador admite aprobaciones exec nativas e incluir el canal en la guía de fallback del cliente nativo. `createApproverRestrictedNativeApprovalCapability(...)` completa esto para el caso común.
- Usa `outbound.shouldSuppressLocalPayloadPrompt` u `outbound.beforeDeliverPayload` para el comportamiento del ciclo de vida de cargas útiles específico del canal, como ocultar prompts de aprobación locales duplicados o enviar indicadores de escritura antes de la entrega.
- Usa `approvalCapability.delivery` solo para el enrutamiento de aprobaciones nativas o la supresión de fallback.
- Usa `approvalCapability.nativeRuntime` para los datos de aprobación nativa propiedad del canal. Mantenlo diferido en entrypoints de canal críticos con `createLazyChannelApprovalNativeRuntimeAdapter(...)`, que puede importar tu módulo de runtime bajo demanda y aun así permitir que el núcleo ensamble el ciclo de vida de aprobación.
- Usa `approvalCapability.render` solo cuando un canal realmente necesite cargas útiles de aprobación personalizadas en lugar del renderizador compartido.
- Usa `approvalCapability.describeExecApprovalSetup` cuando el canal quiera que la respuesta de la ruta deshabilitada explique los knobs de configuración exactos necesarios para habilitar aprobaciones exec nativas. El hook recibe `{ channel, channelLabel, accountId }`; los canales con cuentas con nombre deben renderizar rutas con alcance de cuenta como `channels.<channel>.accounts.<id>.execApprovals.*` en lugar de valores predeterminados de nivel superior.
- Usa `approvalCapability.describePluginApprovalSetup` cuando la guía de fallos de aprobación de plugin sea segura de mostrar para fallos de no-ruta y timeout de aprobación de plugin. `createApproverRestrictedNativeApprovalCapability(...)` no infiere esto desde `describeExecApprovalSetup`; pasa el mismo helper explícitamente solo cuando las aprobaciones de plugin y exec realmente usan la misma configuración nativa.
- Si un canal puede inferir identidades de DM estables similares a propietario desde la configuración existente, usa `createResolvedApproverActionAuthAdapter` de `openclaw/plugin-sdk/approval-runtime` para restringir `/approve` en el mismo chat sin agregar lógica del núcleo específica de aprobación.
- Si la autenticación de aprobación personalizada permite intencionalmente solo fallback en el mismo chat, devuelve `markImplicitSameChatApprovalAuthorization({ authorized: true })` desde `openclaw/plugin-sdk/approval-auth-runtime`; de lo contrario, el núcleo trata el resultado como autorización explícita de aprobador.
- Si una devolución de llamada nativa propiedad del canal resuelve aprobaciones directamente, usa `isImplicitSameChatApprovalAuthorization(...)` antes de resolver para que el fallback implícito siga pasando por la autorización de actor normal del canal.
- Si un canal necesita entrega de aprobación nativa, mantén el código del canal enfocado en la normalización de destino más los datos de transporte/presentación. Usa `createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`, `createChannelApproverDmTargetResolver` y `createApproverRestrictedNativeApprovalCapability` de `openclaw/plugin-sdk/approval-runtime`. Coloca los datos específicos del canal detrás de `approvalCapability.nativeRuntime`, idealmente mediante `createChannelApprovalNativeRuntimeAdapter(...)` o `createLazyChannelApprovalNativeRuntimeAdapter(...)`, para que el núcleo pueda ensamblar el handler y poseer el filtrado de solicitudes, enrutamiento, deduplicación, expiración, suscripción al Gateway y avisos de enrutado a otro lugar. `nativeRuntime` se divide en algunas seams más pequeñas:
- Usa `createNativeApprovalChannelRouteGates` de `openclaw/plugin-sdk/approval-native-runtime` cuando un canal admite tanto entrega nativa con origen de sesión como destinos explícitos de reenvío de aprobaciones. El helper centraliza la selección de configuración de aprobación, el manejo de `mode`, filtros de agente/sesión, vinculación de cuenta, coincidencia de destino de sesión y coincidencia de lista de destinos, mientras los llamadores siguen poseyendo el id de canal, el modo de reenvío predeterminado, la búsqueda de cuenta, la comprobación de transporte habilitado, la normalización de destino y la resolución del destino de origen del turno. No lo uses para crear valores predeterminados de política de canal propiedad del núcleo; pasa explícitamente el modo predeterminado documentado del canal.
- `createChannelNativeOriginTargetResolver` usa de forma predeterminada el comparador de rutas de canal compartido para destinos `{ to, accountId, threadId }`. Pasa `targetsMatch` solo cuando un canal tenga reglas de equivalencia específicas del proveedor, como coincidencia de prefijo de timestamp de Slack.
- Pasa `normalizeTargetForMatch` a `createChannelNativeOriginTargetResolver` cuando el canal necesite canonicalizar ids de proveedor antes de que se ejecute el comparador de rutas predeterminado o una devolución de llamada `targetsMatch` personalizada, conservando a la vez el destino original para la entrega. Usa `normalizeTarget` solo cuando el destino de entrega resuelto deba canonicalizarse.
- `availability` - si la cuenta está configurada y si una solicitud debe manejarse
- `presentation` - asigna el modelo de vista de aprobación compartido a cargas útiles nativas pendientes/resueltas/expiradas o acciones finales
- `transport` - prepara destinos y envía/actualiza/elimina mensajes de aprobación nativa
- `interactions` - hooks opcionales de enlazar/desenlazar/limpiar acción para botones o reacciones nativos, además de un hook `cancelDelivered` opcional. Implementa `cancelDelivered` cuando `deliverPending` registre estado en proceso o persistente (como un almacén de destinos de reacción) para que ese estado pueda liberarse si una detención del handler cancela la entrega antes de que se ejecute `bindPending` o cuando `bindPending` no devuelva ningún handle
- `observe` - hooks opcionales de diagnóstico de entrega
- Si el canal necesita objetos propiedad del runtime, como un cliente, token, app Bolt o receptor de webhook, regístralos mediante `openclaw/plugin-sdk/channel-runtime-context`. El registro genérico de contexto de runtime permite que el núcleo inicialice handlers impulsados por capacidades desde el estado de inicio del canal sin agregar glue de wrapper específico de aprobación.
- Recurre a los `createChannelApprovalHandler` o `createChannelNativeApprovalRuntime` de nivel inferior solo cuando la seam impulsada por capacidades aún no sea suficientemente expresiva.
- Los canales de aprobación nativa deben enrutar tanto `accountId` como `approvalKind` mediante esos helpers. `accountId` mantiene la política de aprobación de varias cuentas limitada a la cuenta de bot correcta, y `approvalKind` mantiene disponible para el canal el comportamiento de aprobaciones exec frente a plugin sin ramas hardcodeadas en el núcleo.
- El núcleo ahora también posee los avisos de redirección de aprobación. Los plugins de canal no deben enviar sus propios mensajes de seguimiento de "la aprobación fue a DMs / otro canal" desde `createChannelNativeApprovalRuntime`; en su lugar, expón un enrutamiento preciso de origen + DM de aprobador mediante los helpers compartidos de capacidad de aprobación y deja que el núcleo agregue las entregas reales antes de publicar cualquier aviso de vuelta al chat iniciador.
- Conserva de extremo a extremo el tipo de id de aprobación entregado. Los clientes nativos no deben
  adivinar ni reescribir el enrutamiento de aprobación exec frente a plugin desde el estado local del canal.
- Los distintos tipos de aprobación pueden exponer intencionalmente diferentes superficies nativas.
  Ejemplos empaquetados actuales:
  - Slack mantiene el enrutamiento de aprobación nativa disponible tanto para ids exec como plugin.
  - Matrix mantiene el mismo enrutamiento nativo de DM/canal y UX de reacción para aprobaciones exec
    y plugin, mientras aún permite que la autenticación difiera por tipo de aprobación.
- `createApproverRestrictedNativeApprovalAdapter` todavía existe como wrapper de compatibilidad, pero el código nuevo debe preferir el builder de capacidades y exponer `approvalCapability` en el plugin.

Para entrypoints de canal críticos, prefiere las subrutas de runtime más estrechas cuando solo
necesites una parte de esa familia:

- `openclaw/plugin-sdk/approval-auth-runtime`
- `openclaw/plugin-sdk/approval-client-runtime`
- `openclaw/plugin-sdk/approval-delivery-runtime`
- `openclaw/plugin-sdk/approval-gateway-runtime`
- `openclaw/plugin-sdk/approval-handler-adapter-runtime`
- `openclaw/plugin-sdk/approval-handler-runtime`
- `openclaw/plugin-sdk/approval-native-runtime`
- `openclaw/plugin-sdk/approval-reply-runtime`
- `openclaw/plugin-sdk/channel-runtime-context`

Del mismo modo, prefiere `openclaw/plugin-sdk/setup-runtime`,
`openclaw/plugin-sdk/setup-runtime`,
`openclaw/plugin-sdk/reply-runtime`,
`openclaw/plugin-sdk/reply-dispatch-runtime`,
`openclaw/plugin-sdk/reply-reference` y
`openclaw/plugin-sdk/reply-chunking` cuando no necesites la superficie paraguas
más amplia.

Para configuración específicamente:

- `openclaw/plugin-sdk/setup-runtime` cubre los helpers de configuración seguros para runtime:
  `createSetupTranslator`, adaptadores de parches de configuración seguros para importar (`createPatchedAccountSetupAdapter`,
  `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), salida de notas de búsqueda,
  `promptResolvedAllowFrom`, `splitSetupEntries` y los builders delegados de
  proxy de configuración
- `openclaw/plugin-sdk/setup-runtime` incluye la seam de adaptador consciente del entorno para
  `createEnvPatchedAccountSetupAdapter`
- `openclaw/plugin-sdk/channel-setup` cubre los builders de configuración de instalación opcional
  más algunas primitivas seguras para configuración:
  `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`,

Si tu canal admite configuración o autenticación impulsadas por entorno y los flujos genéricos de inicio/configuración
deben conocer esos nombres de entorno antes de que el runtime cargue, decláralos en el
manifiesto del plugin con `channelEnvVars`. Mantén `envVars` del runtime del canal o constantes
locales solo para texto orientado al operador.

Si tu canal puede aparecer en `status`, `channels list`, `channels status` o
escaneos de SecretRef antes de que inicie el runtime del plugin, agrega `openclaw.setupEntry` en
`package.json`. Ese entrypoint debe ser seguro de importar en rutas de comando de solo lectura
y debe devolver los metadatos del canal, el adaptador de configuración seguro para setup, el adaptador de estado
y los metadatos de destino de secretos de canal necesarios para esos resúmenes. No
inicies clientes, listeners ni runtimes de transporte desde la entrada de configuración.

Mantén también estrecha la ruta de importación principal del canal. Discovery puede evaluar la
entrada y el módulo del plugin de canal para registrar capacidades sin activar
el canal. Archivos como `channel-plugin-api.ts` deben exportar el objeto de plugin de canal
sin importar asistentes de configuración, clientes de transporte, listeners de socket,
lanzadores de subprocesos o módulos de inicio de servicio. Coloca esas piezas de runtime
en módulos cargados desde `registerFull(...)`, setters de runtime o adaptadores de capacidades
diferidos.

`createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
`createTopLevelChannelDmPolicy`, `setSetupChannelEnabled` y
`splitSetupEntries`

- usa la seam más amplia `openclaw/plugin-sdk/setup` solo cuando también necesites los
  helpers compartidos más pesados de configuración/config, como
  `moveSingleAccountChannelSectionToDefaultAccount(...)`

Si tu canal solo quiere anunciar "instala este plugin primero" en superficies de configuración,
prefiere `createOptionalChannelSetupSurface(...)`. El adaptador/asistente generado
falla cerrado en escrituras de configuración y finalización, y reutiliza
el mismo mensaje de instalación requerida en la validación, finalización y texto de enlaces
a documentación.

Para otras rutas de canal críticas, prefiere los helpers estrechos antes que superficies heredadas
más amplias:

- `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution` y
  `openclaw/plugin-sdk/account-helpers` para configuración de varias cuentas y
  alternativa de cuenta predeterminada
- `openclaw/plugin-sdk/inbound-envelope` y
  `openclaw/plugin-sdk/channel-inbound` para ruta/sobre entrante y
  cableado de registro y despacho
- `openclaw/plugin-sdk/channel-targets` para helpers de análisis de destinos
- `openclaw/plugin-sdk/outbound-media` para carga de medios y
  `openclaw/plugin-sdk/channel-outbound` para identidad saliente/delegados de envío
  y planificación de payloads
- `buildThreadAwareOutboundSessionRoute(...)` de
  `openclaw/plugin-sdk/channel-core` cuando una ruta saliente debe conservar un
  `replyToId`/`threadId` explícito o recuperar la sesión `:thread:` actual
  después de que la clave de sesión base todavía coincida. Los Plugins de proveedores pueden sobrescribir
  la precedencia, el comportamiento de sufijos y la normalización del id de hilo cuando su plataforma
  tiene semántica nativa de entrega en hilos.
- `openclaw/plugin-sdk/thread-bindings-runtime` para el ciclo de vida de vinculaciones de hilo
  y el registro de adaptadores
- `openclaw/plugin-sdk/agent-media-payload` solo cuando aún se requiere un diseño
  de campos de payload heredado de agente/medio
- `openclaw/plugin-sdk/telegram-command-config` para la normalización de comandos
  personalizados de Telegram, la validación de duplicados/conflictos y un contrato de configuración
  de comandos estable como alternativa

Los canales solo de autenticación normalmente pueden detenerse en la ruta predeterminada: core gestiona las aprobaciones y el Plugin solo expone capacidades salientes/de autenticación. Los canales de aprobación nativa, como Matrix, Slack, Telegram y transportes de chat personalizados, deben usar los helpers nativos compartidos en lugar de implementar su propio ciclo de vida de aprobación.

## Política de menciones entrantes

Mantén el manejo de menciones entrantes dividido en dos capas:

- recopilación de evidencia propiedad del Plugin
- evaluación de política compartida

Usa `openclaw/plugin-sdk/channel-mention-gating` para decisiones de política de menciones.
Usa `openclaw/plugin-sdk/channel-inbound` solo cuando necesites el barrel más amplio de helpers entrantes.

Buen encaje para lógica local del Plugin:

- detección de respuesta al bot
- detección de bot citado
- comprobaciones de participación en hilos
- exclusiones de mensajes de servicio/sistema
- cachés nativas de la plataforma necesarias para probar la participación del bot

Buen encaje para el helper compartido:

- `requireMention`
- resultado de mención explícita
- lista de permitidos de menciones implícitas
- omisión de comandos
- decisión final de omisión

Flujo recomendado:

1. Calcula los datos locales de mención.
2. Pasa esos datos a `resolveInboundMentionDecision({ facts, policy })`.
3. Usa `decision.effectiveWasMentioned`, `decision.shouldBypassMention` y `decision.shouldSkip` en tu compuerta entrante.

```typescript
import {
  implicitMentionKindWhen,
  matchesMentionWithExplicit,
  resolveInboundMentionDecision,
} from "openclaw/plugin-sdk/channel-inbound";

const mentionMatch = matchesMentionWithExplicit(text, {
  mentionRegexes,
  mentionPatterns,
});

const facts = {
  canDetectMention: true,
  wasMentioned: mentionMatch.matched,
  hasAnyMention: mentionMatch.hasExplicitMention,
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

`api.runtime.channel.mentions` expone los mismos helpers compartidos de menciones para
Plugins de canal integrados que ya dependen de inyección de runtime:

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

Si solo necesitas `implicitMentionKindWhen` y
`resolveInboundMentionDecision`, importa desde
`openclaw/plugin-sdk/channel-mention-gating` para evitar cargar helpers de runtime
entrante no relacionados.

Usa `resolveInboundMentionDecision({ facts, policy })` para la compuerta de menciones.

## Recorrido

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Package and manifest">
    Crea los archivos estándar del Plugin. El campo `channel` en `package.json` es
    lo que hace que esto sea un Plugin de canal. Para la superficie completa de metadatos del paquete,
    consulta [Configuración y ajustes de Plugin](/es/plugins/sdk-setup#openclaw-channel):

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
      "kind": "channel",
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
    ajustes propiedad del Plugin que no son la configuración de cuenta del canal. `channelConfigs`
    valida `channels.acme-chat` y es la fuente de ruta fría usada por el esquema de configuración,
    la configuración inicial y las superficies de UI antes de que se cargue el runtime del Plugin.

  </Step>

  <Step title="Build the channel plugin object">
    La interfaz `ChannelPlugin` tiene muchas superficies de adaptador opcionales. Empieza con
    lo mínimo: `id` y `setup`; y agrega adaptadores a medida que los necesites.

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
        setup: {
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

    Para canales que aceptan tanto claves de DM canónicas de nivel superior como claves anidadas heredadas, usa los helpers de `plugin-sdk/channel-config-helpers`: `resolveChannelDmAccess`, `resolveChannelDmPolicy`, `resolveChannelDmAllowFrom` y `normalizeChannelDmPolicy` mantienen los valores locales de la cuenta por delante de los valores raíz heredados. Empareja el mismo resolvedor con la reparación de doctor mediante `normalizeLegacyDmAliases` para que el runtime y la migración lean el mismo contrato.

    <Accordion title="What createChatChannelPlugin does for you">
      En lugar de implementar interfaces de adaptador de bajo nivel manualmente, pasas
      opciones declarativas y el constructor las compone:

      | Opción | Qué cablea |
      | --- | --- |
      | `security.dm` | Resolvedor de seguridad de DM con alcance desde campos de configuración |
      | `pairing.text` | Flujo de emparejamiento de DM basado en texto con intercambio de código |
      | `threading` | Resolvedor de modo de respuesta (fijo, con alcance de cuenta o personalizado) |
      | `outbound.attachedResults` | Funciones de envío que devuelven metadatos de resultado (IDs de mensaje) |

      También puedes pasar objetos de adaptador sin procesar en lugar de las opciones declarativas
      si necesitas control total.

      Los adaptadores salientes sin procesar pueden definir una función `chunker(text, limit, ctx)`.
      El `ctx.formatting` opcional transporta decisiones de formato en tiempo de entrega,
      como `maxLinesPerMessage`; aplícalo antes de enviar para que el enhebrado de respuestas
      y los límites de fragmentos se resuelvan una sola vez mediante la entrega saliente compartida.
      Los contextos de envío también incluyen `replyToIdSource` (`implicit` o `explicit`)
      cuando se resolvió un destino de respuesta nativo, para que los helpers de payload puedan conservar
      etiquetas de respuesta explícitas sin consumir un espacio de respuesta implícito de un solo uso.
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
    pueda mostrarlos en la ayuda raíz sin activar el runtime completo del canal,
    mientras que las cargas completas normales siguen recogiendo los mismos descriptores para el registro real
    de comandos. Mantén `registerFull(...)` para el trabajo exclusivo del runtime.
    Si `registerFull(...)` registra métodos RPC de gateway, usa un
    prefijo específico del plugin. Los espacios de nombres de administración del core (`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`) permanecen reservados y siempre
    se resuelven en `operator.admin`.
    `defineChannelPluginEntry` gestiona automáticamente la división del modo de registro. Consulta
    [Puntos de entrada](/es/plugins/sdk-entrypoints#definechannelpluginentry) para ver todas
    las opciones.

  </Step>

  <Step title="Add a setup entry">
    Crea `setup-entry.ts` para una carga ligera durante el onboarding:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    OpenClaw carga esto en lugar de la entrada completa cuando el canal está deshabilitado
    o no configurado. Evita cargar código de runtime pesado durante los flujos de configuración.
    Consulta [Configuración](/es/plugins/sdk-setup#setup-entry) para obtener detalles.

    Los canales de workspace incluidos que separan las exportaciones seguras para configuración en módulos
    complementarios pueden usar `defineBundledChannelSetupEntry(...)` desde
    `openclaw/plugin-sdk/channel-entry-contract` cuando también necesitan un
    setter de runtime explícito en tiempo de configuración.

  </Step>

  <Step title="Handle inbound messages">
    Tu plugin necesita recibir mensajes desde la plataforma y reenviarlos a
    OpenClaw. El patrón típico es un webhook que verifica la solicitud y
    la despacha a través del manejador de entrada de tu canal:

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
      La gestión de mensajes entrantes es específica del canal. Cada plugin de canal posee
      su propia canalización de entrada. Consulta los plugins de canal incluidos
      (por ejemplo, el paquete del plugin de Microsoft Teams o Google Chat) para ver patrones reales.
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
        const account = acmeChatPlugin.setup!.resolveAccount(cfg, undefined);
        expect(account.token).toBe("test-token");
      });

      it("inspects account without materializing secrets", () => {
        const cfg = {
          channels: { "acme-chat": { token: "test-token" } },
        } as any;
        const result = acmeChatPlugin.setup!.inspectAccount!(cfg, undefined);
        expect(result.configured).toBe(true);
        expect(result.tokenStatus).toBe("available");
      });

      it("reports missing config", () => {
        const cfg = { channels: {} } as any;
        const result = acmeChatPlugin.setup!.inspectAccount!(cfg, undefined);
        expect(result.configured).toBe(false);
      });
    });
    ```

    ```bash
    pnpm test -- <bundled-plugin-root>/acme-chat/
    ```

    Para helpers de prueba compartidos, consulta [Pruebas](/es/plugins/sdk-testing).

</Step>
</Steps>

## Estructura de archivos

```
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
    Ciclo de vida de eventos entrantes compartidos: ingerir, resolver, registrar, despachar, finalizar
  </Card>
</CardGroup>

<Note>
Algunos puntos de extensión auxiliares incluidos aún existen para el mantenimiento y
la compatibilidad de plugins incluidos. No son el patrón recomendado para nuevos plugins de canal;
prefiere las subrutas genéricas de canal/configuración/respuesta/runtime de la superficie común del SDK,
salvo que mantengas directamente esa familia de plugins incluidos.
</Note>

## Siguientes pasos

- [Plugins de proveedor](/es/plugins/sdk-provider-plugins) - si tu plugin también proporciona modelos
- [Resumen del SDK](/es/plugins/sdk-overview) - referencia completa de importaciones de subrutas
- [Pruebas del SDK](/es/plugins/sdk-testing) - utilidades de prueba y pruebas de contrato
- [Manifest del plugin](/es/plugins/manifest) - esquema completo del manifest

## Relacionado

- [Configuración del SDK de plugins](/es/plugins/sdk-setup)
- [Creación de plugins](/es/plugins/building-plugins)
- [Plugins de arnés de agente](/es/plugins/sdk-agent-harness)

---
read_when:
    - Estás creando un nuevo plugin de canal de mensajería
    - Quieres conectar OpenClaw a una plataforma de mensajería
    - Debe comprender la superficie del adaptador ChannelPlugin
sidebarTitle: Channel Plugins
summary: Guía paso a paso para crear un Plugin de canal de mensajería para OpenClaw
title: Crear plugins de canal
x-i18n:
    generated_at: "2026-06-27T12:26:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2148141910d4a275ee800d084d60d7174146140f57ecc5c57cc12824115238be
    source_path: plugins/sdk-channel-plugins.md
    workflow: 16
---

Esta guía explica cómo crear un plugin de canal que conecta OpenClaw con una
plataforma de mensajería. Al final tendrás un canal funcional con seguridad de
DM, emparejamiento, encadenamiento de respuestas y mensajería saliente.

<Info>
  Si aún no has creado ningún plugin de OpenClaw, lee primero
  [Primeros pasos](/es/plugins/building-plugins) para conocer la estructura básica
  del paquete y la configuración del manifiesto.
</Info>

## Cómo funcionan los plugins de canal

Los plugins de canal no necesitan sus propias herramientas para enviar, editar o reaccionar. OpenClaw mantiene una
herramienta `message` compartida en el núcleo. Tu plugin es responsable de:

- **Configuración** - resolución de cuentas y asistente de configuración
- **Seguridad** - política de DM y listas de permitidos
- **Emparejamiento** - flujo de aprobación por DM
- **Gramática de sesión** - cómo los identificadores de conversación específicos del proveedor se asignan a chats base, identificadores de hilo y alternativas de padre
- **Saliente** - envío de texto, medios y encuestas a la plataforma
- **Hilos** - cómo se encadenan las respuestas
- **Heartbeat de escritura** - señales opcionales de escritura/ocupado para destinos de entrega de Heartbeat

El núcleo se encarga de la herramienta de mensajes compartida, el cableado de prompts, la forma externa de la clave de sesión,
la contabilidad genérica de `:thread:` y el despacho.

Los nuevos plugins de canal también deberían exponer un adaptador `message` con
`defineChannelMessageAdapter` desde `openclaw/plugin-sdk/channel-outbound`. El
adaptador declara qué capacidades duraderas de envío final admite realmente el transporte nativo
y apunta los envíos de texto/medios a las mismas funciones de transporte que el
adaptador `outbound` heredado. Declara una capacidad solo cuando una prueba de contrato
demuestre el efecto secundario nativo y el recibo devuelto.
Para ver el contrato completo de la API, ejemplos, matriz de capacidades, reglas de recibos,
finalización de vistas previas en vivo, política de confirmación de recepción, pruebas y tabla de migración, consulta
[API saliente de canal](/es/plugins/sdk-channel-outbound).
Si el adaptador `outbound` existente ya tiene los métodos de envío y
metadatos de capacidad correctos, usa `createChannelMessageAdapterFromOutbound(...)` para
derivar el adaptador `message` en lugar de escribir otro puente manualmente.
Los envíos del adaptador deberían devolver valores `MessageReceipt`. Cuando el código de compatibilidad
todavía necesite identificadores heredados, derívalos con `listMessageReceiptPlatformIds(...)`
o `resolveMessageReceiptPrimaryId(...)` en lugar de mantener campos
`messageIds` paralelos en el nuevo código de ciclo de vida.
Los canales con capacidad de vista previa también deberían declarar `message.live.capabilities` con
el ciclo de vida en vivo exacto que poseen, como `draftPreview`,
`previewFinalization`, `progressUpdates`, `nativeStreaming` o
`quietFinalization`. Los canales que finalizan una vista previa de borrador en su lugar también deberían
declarar `message.live.finalizer.capabilities`, como `finalEdit`,
`normalFallback`, `discardPending`, `previewReceipt` y
`retainOnAmbiguousFailure`, y enrutar la lógica en tiempo de ejecución mediante
`defineFinalizableLivePreviewAdapter(...)` más
`deliverWithFinalizableLivePreviewAdapter(...)`. Mantén esas capacidades respaldadas
por pruebas `verifyChannelMessageLiveCapabilityAdapterProofs(...)` y
`verifyChannelMessageLiveFinalizerProofs(...)` para que el comportamiento nativo de vista previa,
progreso, edición, alternativa/retención, limpieza y recibos no derive
silenciosamente.
Los receptores entrantes que posponen las confirmaciones de la plataforma deberían declarar
`message.receive.defaultAckPolicy` y `supportedAckPolicies` en lugar de ocultar
la temporización de confirmación en estado local del monitor. Cubre cada política declarada con
`verifyChannelMessageReceiveAckPolicyAdapterProofs(...)`.

Los helpers de respuesta heredados, como `createChannelTurnReplyPipeline`,
`dispatchInboundReplyWithBase` y `recordInboundSessionAndDispatchReply`,
siguen disponibles para despachadores de compatibilidad. No uses esos nombres para nuevo
código de canal; los nuevos plugins deberían empezar con el adaptador `message`, recibos y
helpers de ciclo de vida de recepción/envío en `openclaw/plugin-sdk/channel-outbound`.

Los canales que migren autorización entrante pueden usar el subpath experimental
`openclaw/plugin-sdk/channel-ingress-runtime` desde rutas de recepción en tiempo de ejecución.
El subpath mantiene la búsqueda de plataforma y los efectos secundarios en el plugin, mientras
comparte la resolución de estado de listas de permitidos, decisiones de ruta/remitente/comando/evento/activación,
diagnósticos redactados y asignación de admisión de turnos. Mantén la
normalización de identidad del plugin en el descriptor que pasas al resolver; no
serialices valores de coincidencia sin procesar del estado o la decisión resueltos. Consulta
[API de entrada de canal](/es/plugins/sdk-channel-ingress) para el diseño de la API,
el límite de propiedad y las expectativas de pruebas.

Si tu canal admite indicadores de escritura fuera de respuestas entrantes, expón
`heartbeat.sendTyping(...)` en el plugin de canal. El núcleo lo llama con el
destino de entrega de Heartbeat resuelto antes de que comience la ejecución del modelo de Heartbeat y
usa el ciclo de vida compartido de keepalive/limpieza de escritura. Agrega `heartbeat.clearTyping(...)`
cuando la plataforma necesite una señal explícita de parada.

Si tu canal agrega parámetros de herramienta de mensajes que transportan fuentes de medios, expón esos
nombres de parámetros mediante `describeMessageTool(...).mediaSourceParams`. El núcleo usa
esa lista explícita para la normalización de rutas de sandbox y la política de acceso a medios salientes,
así que los plugins no necesitan casos especiales en el núcleo compartido para parámetros específicos del proveedor
de avatar, adjunto o imagen de portada.
Prefiere devolver un mapa indexado por acción, como
`{ "set-profile": ["avatarUrl", "avatarPath"] }`, para que las acciones no relacionadas no
hereden los argumentos de medios de otra acción. Un array plano sigue funcionando para parámetros que
se comparten intencionalmente entre todas las acciones expuestas.
Los canales que deben exponer una URL pública temporal para una obtención de medios del lado de la plataforma
pueden usar `createHostedOutboundMediaStore(...)` desde
`openclaw/plugin-sdk/outbound-media` con almacenes de estado de plugin. Mantén el análisis
de rutas de plataforma y la aplicación de tokens en el plugin de canal; el helper compartido
solo se encarga de la carga de medios, metadatos de expiración, filas de fragmentos y limpieza.

Si tu canal necesita modelado específico del proveedor para `message(action="send")`,
prefiere `actions.prepareSendPayload(...)`. Coloca tarjetas nativas, bloques, embeds u
otros datos duraderos bajo `payload.channelData.<channel>` y deja que el núcleo realice
el envío real mediante el adaptador outbound/message. Usa
`actions.handleAction(...)` para envío solo como alternativa de compatibilidad para
payloads que no se puedan serializar y reintentar.

Si tu plataforma almacena ámbito adicional dentro de identificadores de conversación, mantén ese análisis
en el plugin con `messaging.resolveSessionConversation(...)`. Ese es el
hook canónico para asignar `rawId` al identificador de conversación base, identificador de hilo
opcional, `baseConversationId` explícito y cualquier `parentConversationCandidates`.
Cuando devuelvas `parentConversationCandidates`, mantenlos ordenados desde el padre
más específico hasta la conversación más amplia/base.

Usa `openclaw/plugin-sdk/channel-route` cuando el código del plugin necesite normalizar
campos similares a rutas, comparar un hilo hijo con su ruta padre o construir una
clave de deduplicación estable a partir de `{ channel, to, accountId, threadId }`. El helper
normaliza identificadores numéricos de hilo de la misma forma que lo hace el núcleo, así que los plugins deberían preferirlo
frente a comparaciones ad hoc de `String(threadId)`.
Los plugins con gramática de destino específica del proveedor deberían exponer
`messaging.resolveOutboundSessionRoute(...)` para que el núcleo obtenga identidad de sesión
e hilo nativa del proveedor sin usar shims de parser.

Los plugins incluidos que necesitan el mismo análisis antes de que arranque el registro de canales
también pueden exponer un archivo de nivel superior `session-key-api.ts` con una exportación
`resolveSessionConversation(...)` coincidente. El núcleo usa esa superficie segura para bootstrap
solo cuando el registro de plugins en tiempo de ejecución aún no está disponible.

`messaging.resolveParentConversationCandidates(...)` sigue disponible como
alternativa de compatibilidad heredada cuando un plugin solo necesita alternativas de padre sobre
el identificador genérico/sin procesar. Si ambos hooks existen, el núcleo usa primero
`resolveSessionConversation(...).parentConversationCandidates` y solo
recurre a `resolveParentConversationCandidates(...)` cuando el hook canónico
los omite.

## Aprobaciones y capacidades del canal

La mayoría de los plugins de canal no necesitan código específico de aprobaciones.

- Core es propietario de `/approve` en el mismo chat, de las cargas útiles compartidas de botones de aprobación y de la entrega genérica de reserva.
- Prefiere un único objeto `approvalCapability` en el plugin de canal cuando el canal necesite comportamiento específico de aprobaciones.
- `ChannelPlugin.approvals` se elimina. Coloca los datos de entrega/nativo/renderizado/autenticación de aprobaciones en `approvalCapability`.
- `plugin.auth` es solo para iniciar/cerrar sesión; core ya no lee hooks de autenticación de aprobación desde ese objeto.
- `approvalCapability.authorizeActorAction` y `approvalCapability.getActionAvailabilityState` son el punto de integración canónico para autenticación de aprobaciones.
- Usa `approvalCapability.getActionAvailabilityState` para la disponibilidad de autenticación de aprobaciones en el mismo chat.
- Si tu canal expone aprobaciones exec nativas, usa `approvalCapability.getExecInitiatingSurfaceState` para el estado de la superficie iniciadora/cliente nativo cuando difiera de la autenticación de aprobación en el mismo chat. Core usa ese hook específico de exec para distinguir `enabled` frente a `disabled`, decidir si el canal iniciador admite aprobaciones exec nativas e incluir el canal en la guía de reserva de cliente nativo. `createApproverRestrictedNativeApprovalCapability(...)` completa esto para el caso común.
- Usa `outbound.shouldSuppressLocalPayloadPrompt` u `outbound.beforeDeliverPayload` para comportamiento del ciclo de vida de cargas útiles específico del canal, como ocultar prompts locales de aprobación duplicados o enviar indicadores de escritura antes de la entrega.
- Usa `approvalCapability.delivery` solo para enrutamiento de aprobaciones nativas o supresión de reserva.
- Usa `approvalCapability.nativeRuntime` para datos de aprobación nativa propiedad del canal. Mantenlo diferido en puntos de entrada de canal críticos con `createLazyChannelApprovalNativeRuntimeAdapter(...)`, que puede importar tu módulo runtime bajo demanda mientras permite que core ensamble el ciclo de vida de aprobación.
- Usa `approvalCapability.render` solo cuando un canal realmente necesite cargas útiles de aprobación personalizadas en lugar del renderizador compartido.
- Usa `approvalCapability.describeExecApprovalSetup` cuando el canal quiera que la respuesta de la ruta deshabilitada explique los controles de configuración exactos necesarios para habilitar aprobaciones exec nativas. El hook recibe `{ channel, channelLabel, accountId }`; los canales con cuentas con nombre deben renderizar rutas con alcance de cuenta, como `channels.<channel>.accounts.<id>.execApprovals.*`, en lugar de valores predeterminados de nivel superior.
- Si un canal puede inferir identidades estables de DM similares al propietario desde la configuración existente, usa `createResolvedApproverActionAuthAdapter` de `openclaw/plugin-sdk/approval-runtime` para restringir `/approve` en el mismo chat sin añadir lógica core específica de aprobaciones.
- Si la autenticación de aprobación personalizada permite intencionadamente solo la reserva en el mismo chat, devuelve `markImplicitSameChatApprovalAuthorization({ authorized: true })` desde `openclaw/plugin-sdk/approval-auth-runtime`; de lo contrario, core trata el resultado como autorización explícita del aprobador.
- Si un callback nativo propiedad del canal resuelve aprobaciones directamente, usa `isImplicitSameChatApprovalAuthorization(...)` antes de resolver para que la reserva implícita aún pase por la autorización normal de actor del canal.
- Si un canal necesita entrega de aprobación nativa, mantén el código del canal centrado en la normalización del destino y en los datos de transporte/presentación. Usa `createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`, `createChannelApproverDmTargetResolver` y `createApproverRestrictedNativeApprovalCapability` de `openclaw/plugin-sdk/approval-runtime`. Coloca los datos específicos del canal detrás de `approvalCapability.nativeRuntime`, idealmente mediante `createChannelApprovalNativeRuntimeAdapter(...)` o `createLazyChannelApprovalNativeRuntimeAdapter(...)`, para que core pueda ensamblar el manejador y poseer el filtrado de solicitudes, enrutamiento, deduplicación, expiración, suscripción al Gateway y avisos de enrutado a otro lugar. `nativeRuntime` se divide en algunos puntos de integración más pequeños:
- Usa `createNativeApprovalChannelRouteGates` de `openclaw/plugin-sdk/approval-native-runtime` cuando un canal admita tanto entrega nativa con origen en la sesión como destinos explícitos de reenvío de aprobaciones. El helper centraliza la selección de configuración de aprobaciones, el manejo de `mode`, los filtros de agente/sesión, la vinculación de cuentas, la coincidencia de destino de sesión y la coincidencia de listas de destinos, mientras los llamadores siguen siendo propietarios del id del canal, el modo predeterminado de reenvío, la búsqueda de cuenta, la comprobación de transporte habilitado, la normalización de destino y la resolución del destino de origen de turno. No lo uses para crear valores predeterminados de política de canal propiedad de core; pasa explícitamente el modo predeterminado documentado del canal.
- `createChannelNativeOriginTargetResolver` usa de forma predeterminada el comparador compartido de rutas de canal para destinos `{ to, accountId, threadId }`. Pasa `targetsMatch` solo cuando un canal tenga reglas de equivalencia específicas del proveedor, como coincidencia por prefijo de marca temporal en Slack.
- Pasa `normalizeTargetForMatch` a `createChannelNativeOriginTargetResolver` cuando el canal necesite canonicalizar ids de proveedor antes de que se ejecute el comparador de rutas predeterminado o un callback `targetsMatch` personalizado, conservando al mismo tiempo el destino original para la entrega. Usa `normalizeTarget` solo cuando el propio destino de entrega resuelto deba canonicalizarse.
- `availability`: si la cuenta está configurada y si una solicitud debe manejarse
- `presentation`: asignar el modelo de vista de aprobación compartido a cargas útiles nativas pendientes/resueltas/expiradas o acciones finales
- `transport`: preparar destinos y enviar/actualizar/eliminar mensajes de aprobación nativa
- `interactions`: hooks opcionales para vincular/desvincular/borrar acciones de botones o reacciones nativas, además de un hook opcional `cancelDelivered`. Implementa `cancelDelivered` cuando `deliverPending` registre estado en proceso o persistente (como un almacén de destinos de reacción) para que ese estado pueda liberarse si una detención del manejador cancela la entrega antes de que se ejecute `bindPending` o cuando `bindPending` no devuelva ningún handle
- `observe`: hooks opcionales de diagnóstico de entrega
- Si el canal necesita objetos propiedad del runtime, como un cliente, token, app Bolt o receptor de Webhook, regístralos mediante `openclaw/plugin-sdk/channel-runtime-context`. El registro genérico de contexto runtime permite que core arranque manejadores impulsados por capacidades desde el estado de arranque del canal sin añadir pegamento envoltorio específico de aprobaciones.
- Recurre a los `createChannelApprovalHandler` o `createChannelNativeApprovalRuntime` de nivel inferior solo cuando el punto de integración basado en capacidades todavía no sea suficientemente expresivo.
- Los canales de aprobación nativa deben enrutar tanto `accountId` como `approvalKind` mediante esos helpers. `accountId` mantiene la política de aprobación multicuenta acotada a la cuenta de bot correcta, y `approvalKind` mantiene el comportamiento de aprobaciones exec frente a aprobaciones de plugin disponible para el canal sin ramas hardcodeadas en core.
- Core ahora también es propietario de los avisos de redirección de aprobaciones. Los plugins de canal no deben enviar sus propios mensajes de seguimiento de "la aprobación fue a DMs / a otro canal" desde `createChannelNativeApprovalRuntime`; en su lugar, expón enrutamiento preciso de origen + DM de aprobador mediante los helpers compartidos de capacidad de aprobación y deja que core agregue las entregas reales antes de publicar cualquier aviso de vuelta al chat iniciador.
- Conserva de extremo a extremo el tipo de id de aprobación entregada. Los clientes nativos no deben
  adivinar ni reescribir el enrutamiento de aprobaciones exec frente a plugin desde el estado local del canal.
- Diferentes tipos de aprobación pueden exponer intencionadamente diferentes superficies nativas.
  Ejemplos empaquetados actuales:
  - Slack mantiene disponible el enrutamiento de aprobación nativa para ids tanto exec como de plugin.
  - Matrix mantiene el mismo enrutamiento nativo de DM/canal y la UX de reacciones para aprobaciones exec
    y de plugin, mientras aún permite que la autenticación difiera por tipo de aprobación.
- `createApproverRestrictedNativeApprovalAdapter` todavía existe como envoltorio de compatibilidad, pero el código nuevo debe preferir el constructor de capacidades y exponer `approvalCapability` en el plugin.

Para puntos de entrada de canal críticos, prefiere las subrutas runtime más estrechas cuando solo
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

Específicamente para configuración:

- `openclaw/plugin-sdk/setup-runtime` cubre los helpers de configuración seguros para runtime:
  `createSetupTranslator`, adaptadores de parches de configuración seguros de importar (`createPatchedAccountSetupAdapter`,
  `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), salida de notas de búsqueda,
  `promptResolvedAllowFrom`, `splitSetupEntries` y los constructores delegados
  de proxy de configuración
- `openclaw/plugin-sdk/setup-runtime` incluye el punto de integración de adaptador con reconocimiento de env para
  `createEnvPatchedAccountSetupAdapter`
- `openclaw/plugin-sdk/channel-setup` cubre los constructores de configuración de instalación opcional
  además de unas pocas primitivas seguras para configuración:
  `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`,

Si tu canal admite configuración o autenticación impulsada por env y los flujos genéricos de arranque/config
deben conocer esos nombres de env antes de que se cargue el runtime, decláralos en el
manifiesto del plugin con `channelEnvVars`. Mantén `envVars` del runtime del canal o constantes locales
solo para texto orientado a operadores.

Si tu canal puede aparecer en `status`, `channels list`, `channels status` o
escaneos de SecretRef antes de que arranque el runtime del plugin, añade `openclaw.setupEntry` en
`package.json`. Ese punto de entrada debe ser seguro de importar en rutas de comandos de solo lectura
y debe devolver los metadatos del canal, el adaptador de configuración seguro para setup, el adaptador de estado
y los metadatos de destino secreto del canal necesarios para esos resúmenes. No
inicies clientes, listeners ni runtimes de transporte desde la entrada de setup.

Mantén estrecha también la ruta principal de importación de la entrada del canal. El descubrimiento puede evaluar la
entrada y el módulo de plugin de canal para registrar capacidades sin activar
el canal. Archivos como `channel-plugin-api.ts` deben exportar el objeto de plugin de canal
sin importar asistentes de setup, clientes de transporte, listeners de socket,
lanzadores de subprocesos ni módulos de arranque de servicio. Coloca esas piezas runtime
en módulos cargados desde `registerFull(...)`, setters de runtime o adaptadores
de capacidad diferidos.

`createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
`createTopLevelChannelDmPolicy`, `setSetupChannelEnabled` y
`splitSetupEntries`

- usa el punto de integración más amplio `openclaw/plugin-sdk/setup` solo cuando también necesites los
  helpers compartidos de setup/config más pesados, como
  `moveSingleAccountChannelSectionToDefaultAccount(...)`

Si tu canal solo quiere anunciar "instala primero este plugin" en superficies de setup,
prefiere `createOptionalChannelSetupSurface(...)`. El adaptador/asistente generado
falla cerrado en escrituras de configuración y finalización, y reutiliza
el mismo mensaje de instalación requerida en la validación, finalización y texto de enlace
a docs.

Para otras rutas de canal críticas, prefiere los helpers estrechos sobre las superficies legacy
más amplias:

- `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution` y
  `openclaw/plugin-sdk/account-helpers` para configuración de varias cuentas y
  mecanismo alternativo de cuenta predeterminada
- `openclaw/plugin-sdk/inbound-envelope` y
  `openclaw/plugin-sdk/channel-inbound` para ruta/sobre entrante y
  cableado de registrar y despachar
- `openclaw/plugin-sdk/channel-targets` para ayudantes de análisis de destinos
- `openclaw/plugin-sdk/outbound-media` para carga de medios y
  `openclaw/plugin-sdk/channel-outbound` para identidad saliente/delegados de envío
  y planificación de cargas útiles
- `buildThreadAwareOutboundSessionRoute(...)` desde
  `openclaw/plugin-sdk/channel-core` cuando una ruta saliente debe conservar un
  `replyToId`/`threadId` explícito o recuperar la sesión `:thread:` actual
  después de que la clave de sesión base todavía coincida. Los Plugins de proveedor pueden invalidar
  la precedencia, el comportamiento de sufijos y la normalización de id de hilo cuando su plataforma
  tiene semántica nativa de entrega en hilos.
- `openclaw/plugin-sdk/thread-bindings-runtime` para el ciclo de vida de enlaces de hilos
  y el registro de adaptadores
- `openclaw/plugin-sdk/agent-media-payload` solo cuando aún se requiere una disposición
  heredada de campos de carga útil de agente/medios
- `openclaw/plugin-sdk/telegram-command-config` para la normalización de comandos
  personalizados de Telegram, la validación de duplicados/conflictos y un contrato de configuración
  de comandos estable con mecanismo alternativo

Los canales solo de autenticación normalmente pueden quedarse en la ruta predeterminada: core gestiona las aprobaciones y el Plugin solo expone capacidades salientes/de autenticación. Los canales de aprobación nativos como Matrix, Slack, Telegram y transportes de chat personalizados deben usar los ayudantes nativos compartidos en lugar de implementar su propio ciclo de vida de aprobaciones.

## Política de menciones entrantes

Mantén el manejo de menciones entrantes dividido en dos capas:

- recopilación de evidencia propiedad del Plugin
- evaluación de política compartida

Usa `openclaw/plugin-sdk/channel-mention-gating` para decisiones de política de menciones.
Usa `openclaw/plugin-sdk/channel-inbound` solo cuando necesites el barrel de ayudantes
entrantes más amplio.

Buen encaje para lógica local del Plugin:

- detección de respuesta al bot
- detección de cita al bot
- comprobaciones de participación en hilos
- exclusiones de mensajes de servicio/sistema
- cachés nativas de la plataforma necesarias para probar la participación del bot

Buen encaje para el ayudante compartido:

- `requireMention`
- resultado de mención explícita
- lista de permitidos de menciones implícitas
- omisión de comandos
- decisión final de omisión

Flujo preferido:

1. Calcula los datos locales de mención.
2. Pasa esos datos a `resolveInboundMentionDecision({ facts, policy })`.
3. Usa `decision.effectiveWasMentioned`, `decision.shouldBypassMention` y `decision.shouldSkip` en tu puerta de entrada.

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

`api.runtime.channel.mentions` expone los mismos ayudantes compartidos de mención para
Plugins de canal incluidos que ya dependen de la inyección de runtime:

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

Si solo necesitas `implicitMentionKindWhen` y
`resolveInboundMentionDecision`, importa desde
`openclaw/plugin-sdk/channel-mention-gating` para evitar cargar ayudantes de runtime
entrantes no relacionados.

Usa `resolveInboundMentionDecision({ facts, policy })` para la puerta de menciones.

## Recorrido

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Package and manifest">
    Crea los archivos estándar del Plugin. El campo `channel` en `package.json` es
    lo que convierte esto en un Plugin de canal. Para ver toda la superficie de metadatos del paquete,
    consulta [Configuración del Plugin](/es/plugins/sdk-setup#openclaw-channel):

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
    valida `channels.acme-chat` y es la fuente de ruta fría que usan el esquema de configuración,
    la configuración inicial y las superficies de UI antes de que cargue el runtime del Plugin.

  </Step>

  <Step title="Build the channel plugin object">
    La interfaz `ChannelPlugin` tiene muchas superficies de adaptador opcionales. Empieza con
    lo mínimo: `id` y `setup`, y agrega adaptadores a medida que los necesites.

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

    Para canales que aceptan tanto claves DM canónicas de nivel superior como claves anidadas heredadas, usa los ayudantes de `plugin-sdk/channel-config-helpers`: `resolveChannelDmAccess`, `resolveChannelDmPolicy`, `resolveChannelDmAllowFrom` y `normalizeChannelDmPolicy` mantienen los valores locales de la cuenta por delante de los valores raíz heredados. Empareja el mismo resolver con la reparación de doctor mediante `normalizeLegacyDmAliases` para que el runtime y la migración lean el mismo contrato.

    <Accordion title="What createChatChannelPlugin does for you">
      En lugar de implementar manualmente interfaces de adaptador de bajo nivel, pasas
      opciones declarativas y el constructor las compone:

      | Opción | Lo que conecta |
      | --- | --- |
      | `security.dm` | Resolver de seguridad DM con alcance desde campos de configuración |
      | `pairing.text` | Flujo de emparejamiento DM basado en texto con intercambio de código |
      | `threading` | Resolver de modo de respuesta (fijo, con alcance de cuenta o personalizado) |
      | `outbound.attachedResults` | Funciones de envío que devuelven metadatos de resultado (ids de mensaje) |

      También puedes pasar objetos de adaptador sin procesar en lugar de las opciones declarativas
      si necesitas control total.

      Los adaptadores salientes sin procesar pueden definir una función `chunker(text, limit, ctx)`.
      El `ctx.formatting` opcional lleva decisiones de formato en tiempo de entrega
      como `maxLinesPerMessage`; aplícalo antes de enviar para que el enhebrado de respuestas
      y los límites de fragmentos se resuelvan una sola vez mediante la entrega saliente compartida.
      Los contextos de envío también incluyen `replyToIdSource` (`implicit` o `explicit`)
      cuando se resolvió un destino de respuesta nativo, para que los ayudantes de carga útil puedan conservar
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
    pueda mostrarlos en la ayuda raíz sin activar el runtime completo del canal,
    mientras que las cargas completas normales siguen recogiendo los mismos descriptores para el registro real de comandos.
    Mantén `registerFull(...)` para el trabajo exclusivo del runtime.
    Si `registerFull(...)` registra métodos RPC de Gateway, usa un
    prefijo específico del plugin. Los espacios de nombres de administración del núcleo (`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`) permanecen reservados y siempre
    se resuelven como `operator.admin`.
    `defineChannelPluginEntry` gestiona automáticamente la división del modo de registro. Consulta
    [Puntos de entrada](/es/plugins/sdk-entrypoints#definechannelpluginentry) para ver todas
    las opciones.

  </Step>

  <Step title="Agregar una entrada de configuración">
    Crea `setup-entry.ts` para una carga ligera durante la incorporación:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    OpenClaw carga esto en lugar de la entrada completa cuando el canal está deshabilitado
    o no configurado. Evita cargar código de runtime pesado durante los flujos de configuración.
    Consulta [Configuración y config](/es/plugins/sdk-setup#setup-entry) para más detalles.

    Los canales de workspace incluidos que separan exportaciones seguras para configuración en módulos
    auxiliares pueden usar `defineBundledChannelSetupEntry(...)` desde
    `openclaw/plugin-sdk/channel-entry-contract` cuando también necesitan un
    setter explícito de runtime en tiempo de configuración.

  </Step>

  <Step title="Gestionar mensajes entrantes">
    Tu plugin necesita recibir mensajes de la plataforma y reenviarlos a
    OpenClaw. El patrón típico es un webhook que verifica la solicitud y
    la despacha a través del manejador entrante de tu canal:

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
      La gestión de mensajes entrantes es específica de cada canal. Cada plugin de canal posee
      su propia canalización entrante. Mira los plugins de canal incluidos
      (por ejemplo, el paquete de plugin de Microsoft Teams o Google Chat) para ver patrones reales.
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="Probar">
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

    Para auxiliares de prueba compartidos, consulta [Pruebas](/es/plugins/sdk-testing).

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
  <Card title="Opciones de hilos" icon="git-branch" href="/es/plugins/sdk-entrypoints#registration-mode">
    Modos de respuesta fijos, con ámbito de cuenta o personalizados
  </Card>
  <Card title="Integración de la herramienta de mensajes" icon="puzzle" href="/es/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool y descubrimiento de acciones
  </Card>
  <Card title="Resolución de destino" icon="crosshair" href="/es/plugins/architecture-internals#channel-target-resolution">
    inferTargetChatType, looksLikeId, reservedLiterals, resolveTarget
  </Card>
  <Card title="Auxiliares de runtime" icon="settings" href="/es/plugins/sdk-runtime">
    TTS, STT, medios, subagente mediante api.runtime
  </Card>
  <Card title="API entrante de canal" icon="bolt" href="/es/plugins/sdk-channel-inbound">
    Ciclo de vida compartido de eventos entrantes: ingerir, resolver, registrar, despachar, finalizar
  </Card>
</CardGroup>

<Note>
Algunos puntos auxiliares incluidos todavía existen para el mantenimiento y
la compatibilidad de plugins incluidos. No son el patrón recomendado para nuevos plugins de canal;
prefiere las subrutas genéricas de canal/configuración/respuesta/runtime de la superficie común del SDK
a menos que mantengas directamente esa familia de plugins incluidos.
</Note>

## Próximos pasos

- [Provider Plugins](/es/plugins/sdk-provider-plugins) - si tu plugin también proporciona modelos
- [Resumen del SDK](/es/plugins/sdk-overview) - referencia completa de importación de subrutas
- [Pruebas del SDK](/es/plugins/sdk-testing) - utilidades de prueba y pruebas de contrato
- [Manifiesto de Plugin](/es/plugins/manifest) - esquema completo del manifiesto

## Relacionado

- [Configuración del SDK de Plugin](/es/plugins/sdk-setup)
- [Crear plugins](/es/plugins/building-plugins)
- [Plugins de arnés de agente](/es/plugins/sdk-agent-harness)
